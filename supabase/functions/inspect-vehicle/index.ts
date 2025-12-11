import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { carId, crlvPath, frontPath, interiorPath, sidePath } = await req.json();
    console.log("Starting vehicle inspection for car:", carId);

    // Update status to analyzing
    await supabase
      .from("cars")
      .update({ verification_status: "analyzing" })
      .eq("id", carId);

    // Generate signed URLs for the images (valid for 60 seconds)
    const getSignedUrl = async (path: string) => {
      const { data, error } = await supabase.storage
        .from("car-verification-docs")
        .createSignedUrl(path, 60);
      if (error) throw new Error(`Failed to get signed URL for ${path}: ${error.message}`);
      return data.signedUrl;
    };

    const [crlvUrl, frontUrl, interiorUrl, sideUrl] = await Promise.all([
      getSignedUrl(crlvPath),
      getSignedUrl(frontPath),
      getSignedUrl(interiorPath),
      getSignedUrl(sidePath),
    ]);

    console.log("Generated signed URLs, calling AI for analysis...");

    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 12;

    const systemPrompt = `You are a Vehicle Inspection Specialist for the DomineBrasil Platform.
Analyze these 4 images provided by a fleet owner.

**Image 1: Document (CRLV)** -> Task: Extract License Plate, Model, and Manufacturing Year (Ano Fabricação or Ano Modelo).
**Image 2: Car Front** -> Task: Read the License Plate. Does it match the CRLV?
**Image 3: Interior (Passenger)** -> Task: Look for 'Dual Command Pedals' (extra brake/clutch on the passenger side floor). This is MANDATORY for driving school vehicles.
**Image 4: Car Side** -> Task: Look for a text strip, sticker, or magnet saying 'AUTOESCOLA' or 'CENTRO DE FORMAÇÃO DE CONDUTORES' or 'CFC'.

**Validation Rules:**
1. Plate Match: The plate visible in Image 2 must match the plate shown in Image 1 (CRLV document).
2. Age Limit: Manufacturing Year must be >= ${minYear} (vehicle cannot be older than 12 years).
3. Safety: 'Dual Command' pedals MUST be detected in Image 3 - look for extra pedals on the passenger floor area.
4. Compliance: 'AUTOESCOLA' or similar driving school identification must be visible in Image 4.

**Return ONLY valid JSON (no markdown, no code blocks):**
{
  "approved": boolean,
  "detected_plate": "string or null",
  "detected_model": "string or null",
  "detected_year": number or null,
  "has_dual_command": boolean,
  "has_sticker": boolean,
  "plate_matches": boolean,
  "year_compliant": boolean,
  "confidence_score": number (0-100),
  "rejection_reason_pt": "string - If rejected, explain why politely in Portuguese. Ex: 'Não detectamos o duplo comando na foto interna' or 'A placa da foto não bate com o documento' or 'Veículo com mais de 12 anos'. If approved, use empty string."
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze these 4 vehicle verification images:" },
              { type: "text", text: "Image 1 - CRLV Document:" },
              { type: "image_url", image_url: { url: crlvUrl } },
              { type: "text", text: "Image 2 - Front of car with license plate:" },
              { type: "image_url", image_url: { url: frontUrl } },
              { type: "text", text: "Image 3 - Interior passenger side showing floor/pedals:" },
              { type: "image_url", image_url: { url: interiorUrl } },
              { type: "text", text: "Image 4 - Side of car showing AUTOESCOLA identification:" },
              { type: "image_url", image_url: { url: sideUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (response.status === 402) {
        throw new Error("AI service payment required.");
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    console.log("AI response:", content);

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from response
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis result");
    }

    // Determine final approval status
    const isApproved = analysisResult.approved === true;
    const finalStatus = isApproved ? "approved" : "rejected";

    // Update car record with results
    const { error: updateError } = await supabase
      .from("cars")
      .update({
        verification_status: finalStatus,
        ai_analysis_report: analysisResult,
      })
      .eq("id", carId);

    if (updateError) {
      console.error("Failed to update car:", updateError);
      throw new Error("Failed to save inspection result");
    }

    console.log("Vehicle inspection completed:", finalStatus);

    return new Response(
      JSON.stringify({
        success: true,
        status: finalStatus,
        analysis: analysisResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in inspect-vehicle:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
