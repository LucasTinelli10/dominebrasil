import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Shield, User, FileText, ScanFace, CheckCircle, AlertTriangle, Loader2, Upload, Camera } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

interface PersonalData {
  fullName: string;
  cpf: string;
  birthDate: string;
}

interface CredentialData {
  cnhNumber: string;
  cnhCategory: string;
  credentialNumber: string;
}

interface UploadedFiles {
  cnhFront: File | null;
  cnhBack: File | null;
  certificate: File | null;
  selfie: File | null;
}

type VerificationStatus = 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error';

export default function InstructorOnboarding() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const [personalData, setPersonalData] = useState<PersonalData>({
    fullName: profile?.full_name || '',
    cpf: '',
    birthDate: '',
  });

  const [credentialData, setCredentialData] = useState<CredentialData>({
    cnhNumber: '',
    cnhCategory: '',
    credentialNumber: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    cnhFront: null,
    cnhBack: null,
    certificate: null,
    selfie: null,
  });

  useEffect(() => {
    if (profile?.verification_status === 'approved') {
      navigate('/instructor/dashboard');
    }
  }, [profile, navigate]);

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const validateStep1 = (): boolean => {
    if (!personalData.fullName || !personalData.cpf || !personalData.birthDate) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return false;
    }
    if (calculateAge(personalData.birthDate) < 21) {
      toast({ title: "Erro", description: "Você deve ter pelo menos 21 anos.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!credentialData.cnhNumber || !credentialData.credentialNumber) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!uploadedFiles.cnhFront || !uploadedFiles.selfie) {
      toast({ title: "Erro", description: "Envie pelo menos a CNH (frente) e uma selfie.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleFileChange = (type: keyof UploadedFiles) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Erro", description: "Arquivo muito grande. Máximo 5MB.", variant: "destructive" });
        return;
      }
      setUploadedFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const uploadFileToStorage = async (file: File, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('verification-docs')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      // Get signed URL valid for 5 minutes
      const { data: signedData } = await supabase.storage
        .from('verification-docs')
        .createSignedUrl(data.path, 300);

      return signedData?.signedUrl || null;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleVerification = async () => {
    if (!profile?.id) return;

    setVerificationStatus('uploading');
    setIsLoading(true);

    try {
      // Upload files
      const timestamp = Date.now();
      const userId = profile.id;

      const cnhUrl = uploadedFiles.cnhFront 
        ? await uploadFileToStorage(uploadedFiles.cnhFront, `${userId}/cnh_front_${timestamp}.jpg`)
        : null;

      const certificateUrl = uploadedFiles.certificate
        ? await uploadFileToStorage(uploadedFiles.certificate, `${userId}/certificate_${timestamp}.jpg`)
        : null;

      const selfieUrl = uploadedFiles.selfie
        ? await uploadFileToStorage(uploadedFiles.selfie, `${userId}/selfie_${timestamp}.jpg`)
        : null;

      if (!cnhUrl) {
        throw new Error("Falha ao enviar CNH");
      }

      setVerificationStatus('analyzing');

      // Call verification edge function
      const { data, error } = await supabase.functions.invoke('verify-official-docs', {
        body: {
          userId: profile.id,
          cnhImageUrl: cnhUrl,
          credentialImageUrl: certificateUrl,
          selfieImageUrl: selfieUrl,
        }
      });

      if (error) throw error;

      setVerificationResult(data);
      setVerificationStatus('completed');

      // Refresh profile to get updated verification status
      await refreshProfile();

      if (data.verification_status === 'approved') {
        toast({ title: "Sucesso!", description: "Seus documentos foram aprovados!" });
        setTimeout(() => navigate('/instructor/dashboard'), 2000);
      } else if (data.verification_status === 'rejected') {
        toast({ 
          title: "Documentos Rejeitados", 
          description: data.verification_reason || "Houve um problema com seus documentos.",
          variant: "destructive"
        });
      } else {
        toast({ 
          title: "Em Análise", 
          description: "Seus documentos estão sendo analisados manualmente."
        });
      }

    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao verificar documentos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3) {
      if (!validateStep3()) return;
      await handleVerification();
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4) as Step);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleFinish = async () => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    try {
      // Update instructor details
      const { error } = await supabase
        .from('instructors_details')
        .update({
          cnh_number: credentialData.cnhNumber,
          cnh_category: credentialData.cnhCategory,
          credential_number: credentialData.credentialNumber,
        })
        .eq('profile_id', profile.id);

      if (error) throw error;

      // Update profile name
      await supabase
        .from('profiles')
        .update({ full_name: personalData.fullName })
        .eq('id', profile.id);

      await refreshProfile();
      toast({ title: "Cadastro Completo!", description: "Aguardando aprovação dos documentos." });
      navigate('/instructor/dashboard');
    } catch (error) {
      console.error('Finish error:', error);
      toast({ title: "Erro", description: "Erro ao finalizar cadastro.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Dados Pessoais', icon: User },
    { number: 2, title: 'Credenciais', icon: FileText },
    { number: 3, title: 'Validação IA', icon: ScanFace },
    { number: 4, title: 'Finalização', icon: CheckCircle },
  ];

  const progress = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-teal-400" />
            <h1 className="text-2xl font-bold text-white">Validação Governamental</h1>
          </div>
          <p className="text-slate-300">
            Complete seu cadastro para se tornar um instrutor verificado
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div 
                key={step.number}
                className={`flex flex-col items-center ${
                  step.number <= currentStep ? 'text-teal-400' : 'text-slate-500'
                }`}
              >
                <step.icon className="h-5 w-5 mb-1" />
                <span className="text-xs hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5 text-teal-400" })}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {currentStep === 1 && "Informe seus dados pessoais básicos"}
              {currentStep === 2 && "Informe os dados da sua CNH e credencial de instrutor"}
              {currentStep === 3 && "Envie fotos dos documentos para validação por IA"}
              {currentStep === 4 && "Revise e finalize seu cadastro"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Personal Data */}
            {currentStep === 1 && (
              <>
                <div>
                  <Label className="text-slate-200">Nome Completo</Label>
                  <Input
                    value={personalData.fullName}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">CPF</Label>
                  <Input
                    value={personalData.cpf}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={personalData.birthDate}
                    onChange={(e) => setPersonalData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">Você deve ter pelo menos 21 anos</p>
                </div>
              </>
            )}

            {/* Step 2: Credentials */}
            {currentStep === 2 && (
              <>
                <div>
                  <Label className="text-slate-200">Número da CNH</Label>
                  <Input
                    value={credentialData.cnhNumber}
                    onChange={(e) => setCredentialData(prev => ({ ...prev, cnhNumber: e.target.value }))}
                    placeholder="00000000000"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">Categoria da CNH</Label>
                  <Input
                    value={credentialData.cnhCategory}
                    onChange={(e) => setCredentialData(prev => ({ ...prev, cnhCategory: e.target.value }))}
                    placeholder="A, B, AB, C, D, E"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">Número da Credencial DETRAN</Label>
                  <Input
                    value={credentialData.credentialNumber}
                    onChange={(e) => setCredentialData(prev => ({ ...prev, credentialNumber: e.target.value }))}
                    placeholder="Número do crachá do DETRAN"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </>
            )}

            {/* Step 3: AI Validation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {verificationStatus === 'idle' && (
                  <>
                    <div className="bg-teal-900/30 border border-teal-600/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-teal-400 mt-0.5" />
                        <div>
                          <h4 className="text-teal-300 font-medium">Validação por IA</h4>
                          <p className="text-sm text-slate-300 mt-1">
                            Nossa IA analisará seus documentos para verificar autenticidade e fazer 
                            comparação biométrica. Se possível, envie uma foto onde o QR Code da CNH esteja visível.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* CNH Front */}
                      <div>
                        <Label className="text-slate-200 flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          CNH (Frente) *
                        </Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange('cnhFront')}
                            className="hidden"
                            id="cnh-front"
                          />
                          <label
                            htmlFor="cnh-front"
                            className={`flex items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                              ${uploadedFiles.cnhFront 
                                ? 'border-teal-500 bg-teal-900/20' 
                                : 'border-slate-600 hover:border-teal-500'}`}
                          >
                            {uploadedFiles.cnhFront ? (
                              <CheckCircle className="h-6 w-6 text-teal-400" />
                            ) : (
                              <Upload className="h-6 w-6 text-slate-400" />
                            )}
                          </label>
                          {uploadedFiles.cnhFront && (
                            <p className="text-xs text-teal-400 mt-1 truncate">{uploadedFiles.cnhFront.name}</p>
                          )}
                        </div>
                      </div>

                      {/* CNH Back */}
                      <div>
                        <Label className="text-slate-200 flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          CNH (Verso)
                        </Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange('cnhBack')}
                            className="hidden"
                            id="cnh-back"
                          />
                          <label
                            htmlFor="cnh-back"
                            className={`flex items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                              ${uploadedFiles.cnhBack 
                                ? 'border-teal-500 bg-teal-900/20' 
                                : 'border-slate-600 hover:border-teal-500'}`}
                          >
                            {uploadedFiles.cnhBack ? (
                              <CheckCircle className="h-6 w-6 text-teal-400" />
                            ) : (
                              <Upload className="h-6 w-6 text-slate-400" />
                            )}
                          </label>
                          {uploadedFiles.cnhBack && (
                            <p className="text-xs text-teal-400 mt-1 truncate">{uploadedFiles.cnhBack.name}</p>
                          )}
                        </div>
                      </div>

                      {/* Certificate */}
                      <div>
                        <Label className="text-slate-200 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Credencial/Certificado
                        </Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange('certificate')}
                            className="hidden"
                            id="certificate"
                          />
                          <label
                            htmlFor="certificate"
                            className={`flex items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                              ${uploadedFiles.certificate 
                                ? 'border-teal-500 bg-teal-900/20' 
                                : 'border-slate-600 hover:border-teal-500'}`}
                          >
                            {uploadedFiles.certificate ? (
                              <CheckCircle className="h-6 w-6 text-teal-400" />
                            ) : (
                              <Upload className="h-6 w-6 text-slate-400" />
                            )}
                          </label>
                          {uploadedFiles.certificate && (
                            <p className="text-xs text-teal-400 mt-1 truncate">{uploadedFiles.certificate.name}</p>
                          )}
                        </div>
                      </div>

                      {/* Selfie */}
                      <div>
                        <Label className="text-slate-200 flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Selfie *
                        </Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={handleFileChange('selfie')}
                            className="hidden"
                            id="selfie"
                          />
                          <label
                            htmlFor="selfie"
                            className={`flex items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                              ${uploadedFiles.selfie 
                                ? 'border-teal-500 bg-teal-900/20' 
                                : 'border-slate-600 hover:border-teal-500'}`}
                          >
                            {uploadedFiles.selfie ? (
                              <CheckCircle className="h-6 w-6 text-teal-400" />
                            ) : (
                              <Camera className="h-6 w-6 text-slate-400" />
                            )}
                          </label>
                          {uploadedFiles.selfie && (
                            <p className="text-xs text-teal-400 mt-1 truncate">{uploadedFiles.selfie.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {(verificationStatus === 'uploading' || verificationStatus === 'analyzing') && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-teal-500/30 rounded-full" />
                      <div className="absolute inset-0 w-20 h-20 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      <ScanFace className="absolute inset-0 m-auto h-8 w-8 text-teal-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-white">
                        {verificationStatus === 'uploading' ? 'Enviando documentos...' : 'Analisando com IA...'}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {verificationStatus === 'uploading' 
                          ? 'Fazendo upload dos seus documentos de forma segura'
                          : 'Conectando com sistema de validação governamental'}
                      </p>
                    </div>
                  </div>
                )}

                {verificationStatus === 'completed' && verificationResult && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg border ${
                      verificationResult.verification_status === 'approved' 
                        ? 'bg-green-900/20 border-green-600/50' 
                        : verificationResult.verification_status === 'rejected'
                        ? 'bg-red-900/20 border-red-600/50'
                        : 'bg-yellow-900/20 border-yellow-600/50'
                    }`}>
                      <div className="flex items-center gap-3">
                        {verificationResult.verification_status === 'approved' ? (
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        ) : verificationResult.verification_status === 'rejected' ? (
                          <AlertTriangle className="h-6 w-6 text-red-400" />
                        ) : (
                          <Loader2 className="h-6 w-6 text-yellow-400" />
                        )}
                        <div>
                          <h4 className={`font-medium ${
                            verificationResult.verification_status === 'approved' 
                              ? 'text-green-300' 
                              : verificationResult.verification_status === 'rejected'
                              ? 'text-red-300'
                              : 'text-yellow-300'
                          }`}>
                            {verificationResult.verification_status === 'approved' 
                              ? 'Documentos Aprovados!' 
                              : verificationResult.verification_status === 'rejected'
                              ? 'Documentos Rejeitados'
                              : 'Em Análise Manual'}
                          </h4>
                          <p className="text-sm text-slate-300 mt-1">
                            {verificationResult.verification_reason}
                          </p>
                        </div>
                      </div>
                    </div>

                    {verificationResult.extracted_data && (
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-200 mb-2">Dados Extraídos</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {verificationResult.extracted_data.nome && (
                            <div>
                              <span className="text-slate-400">Nome:</span>
                              <span className="text-white ml-2">{verificationResult.extracted_data.nome}</span>
                            </div>
                          )}
                          {verificationResult.extracted_data.cpf && (
                            <div>
                              <span className="text-slate-400">CPF:</span>
                              <span className="text-white ml-2">{verificationResult.extracted_data.cpf}</span>
                            </div>
                          )}
                          {verificationResult.extracted_data.categoria && (
                            <div>
                              <span className="text-slate-400">Categoria:</span>
                              <span className="text-white ml-2">{verificationResult.extracted_data.categoria}</span>
                            </div>
                          )}
                          {verificationResult.extracted_data.validade && (
                            <div>
                              <span className="text-slate-400">Validade:</span>
                              <span className="text-white ml-2">{verificationResult.extracted_data.validade}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
                      <span className="text-slate-300 text-sm">Score de Confiança:</span>
                      <span className={`font-medium ${
                        verificationResult.confidence_score >= 80 ? 'text-green-400' :
                        verificationResult.confidence_score >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {verificationResult.confidence_score || 0}%
                      </span>
                    </div>
                  </div>
                )}

                {verificationStatus === 'error' && (
                  <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                      <div>
                        <h4 className="text-red-300 font-medium">Erro na Verificação</h4>
                        <p className="text-sm text-slate-300 mt-1">
                          Ocorreu um erro ao verificar seus documentos. Por favor, tente novamente.
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="mt-4 w-full"
                      variant="outline"
                      onClick={() => setVerificationStatus('idle')}
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Finalization */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-slate-200 font-medium mb-3">Resumo do Cadastro</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nome:</span>
                      <span className="text-white">{personalData.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CPF:</span>
                      <span className="text-white">{personalData.cpf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CNH:</span>
                      <span className="text-white">{credentialData.cnhNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Credencial DETRAN:</span>
                      <span className="text-white">{credentialData.credentialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className={`${
                        profile?.verification_status === 'approved' ? 'text-green-400' :
                        profile?.verification_status === 'rejected' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {profile?.verification_status === 'approved' ? 'Aprovado' :
                         profile?.verification_status === 'rejected' ? 'Rejeitado' :
                         'Em Análise'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-900/20 border border-teal-600/50 rounded-lg p-4">
                  <p className="text-sm text-teal-300">
                    Ao finalizar, você concorda com os termos de uso da plataforma DomineBrasil
                    e autoriza o processamento dos seus dados para fins de verificação.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1 || isLoading}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Voltar
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={isLoading || (currentStep === 3 && verificationStatus !== 'idle' && verificationStatus !== 'completed' && verificationStatus !== 'error')}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : currentStep === 3 ? 'Iniciar Verificação' : 'Próximo'}
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={isLoading}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : 'Finalizar Cadastro'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}