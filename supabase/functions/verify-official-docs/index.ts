import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a Document Verification Specialist for the Brazilian Traffic Department (DETRAN).
Analyze the provided images of a CNH (Carteira Nacional de Habilitação) and an Instructor Credential.

Task A: Data Extraction
1. Extract 'Nome' (Full Name), 'CPF', 'Registro CNH' (License Number), 'Validade' (Expiry Date) from the CNH.
2. Extract 'Credential Number' (Número da Credencial) from the Instructor Card/Certificate if visible.
3. Extract 'Categoria' (Category) from the CNH (A, B, AB, C, D, E, etc.).

Task B: Security Validation
1. Check if 'Validade' (expiry) > Today's date (${new Date().toISOString().split('T')[0]}).
2. Check for visual signs of forgery:
   - Mismatched fonts or text alignment
   - Digital artifacts around numbers or photos
   - Inconsistent lighting or shadows
   - Blurry or pixelated areas that suggest manipulation
   - Unusual color patterns or gradients
3. If a QR Code is visible in the CNH, note its presence and apparent validity.

Task C: Consistency Check
1. Does the name on the Credential match the name on the CNH?
2. Are the photos consistent (same person)?
3. Do the document layouts match official Brazilian standards?

Task D: Biometric Analysis
1. Compare the selfie photo with the CNH photo - are they the same person?
2. Look for signs of photo manipulation or face swapping.

Return your analysis as a JSON object with this exact structure:
{
  "is_authentic_visual": boolean,
  "biometric_match": boolean,
  "extracted_data": {
    "nome": string or null,
    "cpf": string or null,
    "registro_cnh": string or null,
    "validade": string or null,
    "categoria": string or null,
    "credential_number": string or null
  },
  "risk_flags": [array of strings describing any concerns],
  "confidence_score": number between 0 and 100,
  "expiry_valid": boolean,
  "qr_code_present": boolean,
  "verification_notes": string
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, cnhImageUrl, credentialImageUrl, selfieImageUrl } = await req.json();
    
    console.log("Starting document verification for user:", userId);
    
    if (!userId || !cnhImageUrl) {
      throw new Error("Missing required parameters: userId and cnhImageUrl are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build message content with images
    const content: any[] = [
      { type: "text", text: "Please analyze these Brazilian documents for verification:" }
    ];

    // Add CNH image
    content.push({
      type: "image_url",
      image_url: { url: cnhImageUrl }
    });
    content.push({ type: "text", text: "Above: CNH (Driver's License)" });

    // Add credential image if provided
    if (credentialImageUrl) {
      content.push({
        type: "image_url",
        image_url: { url: credentialImageUrl }
      });
      content.push({ type: "text", text: "Above: Instructor Credential/Certificate" });
    }

    // Add selfie for biometric comparison if provided
    if (selfieImageUrl) {
      content.push({
        type: "image_url",
        image_url: { url: selfieImageUrl }
      });
      content.push({ type: "text", text: "Above: Selfie for biometric verification" });
    }

    console.log("Sending request to AI for document analysis...");

    // Call Lovable AI Gateway with Gemini Pro (best for vision + reasoning)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices?.[0]?.message?.content;
    
    console.log("AI Response received:", aiContent?.substring(0, 200));

    // Parse AI response - extract JSON from potential markdown code blocks
    let analysisResult;
    try {
      // Try to extract JSON from code blocks or parse directly
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                        aiContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      analysisResult = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      analysisResult = {
        is_authentic_visual: false,
        biometric_match: false,
        extracted_data: {},
        risk_flags: ["Failed to parse AI analysis"],
        confidence_score: 0,
        expiry_valid: false,
        qr_code_present: false,
        verification_notes: "Analysis failed - manual review required"
      };
    }

    // Calculate fraud score (0 = no risk, 100 = high risk)
    let fraudScore = 0;
    if (!analysisResult.is_authentic_visual) fraudScore += 40;
    if (!analysisResult.biometric_match) fraudScore += 30;
    if (!analysisResult.expiry_valid) fraudScore += 20;
    if (analysisResult.risk_flags?.length > 0) {
      fraudScore += Math.min(analysisResult.risk_flags.length * 10, 30);
    }
    fraudScore = Math.min(fraudScore, 100);

    // Determine verification status
    let verificationStatus: 'pending' | 'analyzing' | 'approved' | 'rejected' = 'analyzing';
    let backgroundCheckStatus: 'clear' | 'flagged' | 'pending' = 'pending';

    if (fraudScore <= 20 && analysisResult.is_authentic_visual && analysisResult.biometric_match) {
      verificationStatus = 'approved';
      backgroundCheckStatus = 'clear';
    } else if (fraudScore >= 60) {
      verificationStatus = 'rejected';
      backgroundCheckStatus = 'flagged';
    } else {
      verificationStatus = 'analyzing'; // Needs manual review
      backgroundCheckStatus = 'pending';
    }

    const verificationReason = analysisResult.verification_notes || 
      (verificationStatus === 'approved' ? 'Documentos validados com sucesso pela IA.' :
       verificationStatus === 'rejected' ? `Documentos rejeitados. Problemas: ${analysisResult.risk_flags?.join(', ')}` :
       'Documentos em análise manual.');

    // Update profile with verification results
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        verification_status: verificationStatus,
        fraud_score: fraudScore,
        verification_reason: verificationReason
      })
      .eq('id', userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Update instructor details with extracted data
    const instructorUpdate: any = {
      background_check_status: backgroundCheckStatus,
    };
    
    if (analysisResult.extracted_data) {
      if (analysisResult.extracted_data.credential_number) {
        instructorUpdate.credential_number = analysisResult.extracted_data.credential_number;
      }
      if (analysisResult.extracted_data.registro_cnh) {
        instructorUpdate.cnh_number = analysisResult.extracted_data.registro_cnh;
      }
      if (analysisResult.extracted_data.categoria) {
        instructorUpdate.cnh_category = analysisResult.extracted_data.categoria;
      }
      if (analysisResult.extracted_data.validade) {
        instructorUpdate.cnh_expiry_date = analysisResult.extracted_data.validade;
      }
    }

    const { error: instructorError } = await supabase
      .from('instructors_details')
      .update(instructorUpdate)
      .eq('profile_id', userId);

    if (instructorError) {
      console.error("Error updating instructor details:", instructorError);
    }

    console.log("Verification complete. Status:", verificationStatus, "Fraud Score:", fraudScore);

    return new Response(
      JSON.stringify({
        success: true,
        verification_status: verificationStatus,
        fraud_score: fraudScore,
        background_check_status: backgroundCheckStatus,
        extracted_data: analysisResult.extracted_data,
        risk_flags: analysisResult.risk_flags,
        confidence_score: analysisResult.confidence_score,
        verification_reason: verificationReason
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in verify-official-docs:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});