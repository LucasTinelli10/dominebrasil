import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileText, Camera, Car, Shield, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface AddCarWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'info' | 'crlv' | 'front' | 'interior' | 'side' | 'analyzing' | 'result';

interface CarFormData {
  model: string;
  plate: string;
  transmission: 'manual' | 'auto';
  price_per_hour: number;
  location_hub: string;
}

const AddCarWizard: React.FC<AddCarWizardProps> = ({ open, onOpenChange, onSuccess }) => {
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>('info');
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const [formData, setFormData] = useState<CarFormData>({
    model: '',
    plate: '',
    transmission: 'auto',
    price_per_hour: 30,
    location_hub: '',
  });

  const [files, setFiles] = useState<{
    crlv: File | null;
    front: File | null;
    interior: File | null;
    side: File | null;
  }>({
    crlv: null,
    front: null,
    interior: null,
    side: null,
  });

  const steps: { key: Step; label: string; progress: number }[] = [
    { key: 'info', label: 'Dados do Veículo', progress: 16 },
    { key: 'crlv', label: 'Documento CRLV', progress: 32 },
    { key: 'front', label: 'Foto Frontal', progress: 48 },
    { key: 'interior', label: 'Interior', progress: 64 },
    { key: 'side', label: 'Identificação', progress: 80 },
    { key: 'analyzing', label: 'Analisando', progress: 90 },
    { key: 'result', label: 'Resultado', progress: 100 },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);
  const progress = steps[currentStepIndex]?.progress || 0;

  const handleFileChange = (key: keyof typeof files) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFiles(prev => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  const generateSecureFileName = (originalName: string): string => {
    const extension = originalName.split('.').pop() || 'jpg';
    const randomPart = crypto.randomUUID();
    const timestamp = Date.now();
    return `${timestamp}_${randomPart}.${extension}`;
  };

  const uploadFile = async (file: File, folder: string, docType: string): Promise<string> => {
    const secureName = generateSecureFileName(file.name);
    const path = `${folder}/${docType}_${secureName}`;
    
    const { error } = await supabase.storage
      .from('car-verification-docs')
      .upload(path, file, { upsert: true });
    
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return path;
  };

  const handleSubmit = async () => {
    if (!profile?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!files.crlv || !files.front || !files.interior || !files.side) {
      toast.error('Por favor, envie todas as fotos necessárias');
      return;
    }

    setStep('analyzing');
    setIsUploading(true);

    try {
      // Create car record first
      const { data: car, error: carError } = await supabase
        .from('cars')
        .insert({
          owner_id: profile.id,
          model: formData.model,
          plate: formData.plate.toUpperCase(),
          transmission: formData.transmission,
          price_per_hour: formData.price_per_hour,
          location_hub: formData.location_hub,
          verification_status: 'pending',
          available: false,
        })
        .select()
        .single();

      if (carError) throw carError;

      const carId = car.id;
      const basePath = `${profile.id}/${carId}`;

      // Upload all files with secure random filenames
      const [crlvPath, frontPath, interiorPath, sidePath] = await Promise.all([
        uploadFile(files.crlv, basePath, 'crlv'),
        uploadFile(files.front, basePath, 'front'),
        uploadFile(files.interior, basePath, 'interior'),
        uploadFile(files.side, basePath, 'side'),
      ]);

      // Update car with file paths
      await supabase
        .from('cars')
        .update({
          crlv_url: crlvPath,
          photo_exterior_front: frontPath,
          photo_interior_passenger: interiorPath,
          photo_exterior_side: sidePath,
        })
        .eq('id', carId);

      // Call AI inspection
      const { data: inspectionData, error: inspectionError } = await supabase.functions.invoke('inspect-vehicle', {
        body: {
          carId,
          crlvPath,
          frontPath,
          interiorPath,
          sidePath,
        },
      });

      if (inspectionError) throw inspectionError;

      setAnalysisResult(inspectionData);

      // If approved, mark car as available
      if (inspectionData.status === 'approved') {
        await supabase
          .from('cars')
          .update({ available: true })
          .eq('id', carId);
      }

      setStep('result');
    } catch (error) {
      console.error('Error adding car:', error);
      toast.error('Erro ao processar veículo. Tente novamente.');
      setStep('side');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (step === 'result' && analysisResult?.status === 'approved') {
      onSuccess();
    }
    // Reset state
    setStep('info');
    setFormData({
      model: '',
      plate: '',
      transmission: 'auto',
      price_per_hour: 30,
      location_hub: '',
    });
    setFiles({ crlv: null, front: null, interior: null, side: null });
    setAnalysisResult(null);
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (step) {
      case 'info':
        return formData.model && formData.plate && formData.location_hub;
      case 'crlv':
        return !!files.crlv;
      case 'front':
        return !!files.front;
      case 'interior':
        return !!files.interior;
      case 'side':
        return !!files.side;
      default:
        return true;
    }
  };

  const nextStep = () => {
    const stepOrder: Step[] = ['info', 'crlv', 'front', 'interior', 'side'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    } else if (step === 'side') {
      handleSubmit();
    }
  };

  const prevStep = () => {
    const stepOrder: Step[] = ['info', 'crlv', 'front', 'interior', 'side'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const renderFileUpload = (
    label: string,
    description: string,
    fileKey: keyof typeof files,
    icon: React.ReactNode
  ) => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </div>

      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange(fileKey)}
          className="hidden"
          id={`file-${fileKey}`}
        />
        <label htmlFor={`file-${fileKey}`} className="cursor-pointer">
          {files[fileKey] ? (
            <div className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle2 className="h-6 w-6" />
              <span className="font-medium">{files[fileKey]?.name}</span>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Clique para enviar ou arraste o arquivo</p>
            </>
          )}
        </label>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={step === 'analyzing' ? undefined : handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Adicionar Veículo
          </DialogTitle>
        </DialogHeader>

        <Progress value={progress} className="mb-6" />

        {step === 'info' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Dados do Veículo</h3>
              <p className="text-sm text-muted-foreground mt-2">Informe os dados básicos do seu carro</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="model">Modelo do Veículo</Label>
                <Input
                  id="model"
                  placeholder="Ex: Chevrolet Onix 2023"
                  value={formData.model}
                  onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="plate">Placa</Label>
                <Input
                  id="plate"
                  placeholder="ABC-1234"
                  value={formData.plate}
                  onChange={e => setFormData(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                  maxLength={8}
                />
              </div>

              <div>
                <Label htmlFor="transmission">Transmissão</Label>
                <Select
                  value={formData.transmission}
                  onValueChange={(v: 'manual' | 'auto') => setFormData(prev => ({ ...prev, transmission: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Valor por Hora (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  min={10}
                  value={formData.price_per_hour}
                  onChange={e => setFormData(prev => ({ ...prev, price_per_hour: Number(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="location">Localização/Hub</Label>
                <Input
                  id="location"
                  placeholder="Ex: Campo Grande - MS"
                  value={formData.location_hub}
                  onChange={e => setFormData(prev => ({ ...prev, location_hub: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {step === 'crlv' && renderFileUpload(
          'Documento CRLV',
          'Envie uma foto nítida ou PDF do documento do veículo (Licenciamento 2024/2025).',
          'crlv',
          <FileText className="h-8 w-8 text-primary" />
        )}

        {step === 'front' && renderFileUpload(
          'Foto Frontal com Placa',
          'Tire uma foto da frente do carro onde a PLACA esteja legível.',
          'front',
          <Camera className="h-8 w-8 text-primary" />
        )}

        {step === 'interior' && renderFileUpload(
          'Duplo Comando',
          'IMPORTANTE: Tire uma foto do chão do lado do carona mostrando os pedais de freio auxiliar (Duplo Comando).',
          'interior',
          <Shield className="h-8 w-8 text-primary" />
        )}

        {step === 'side' && renderFileUpload(
          'Identificação AUTOESCOLA',
          'Foto lateral mostrando a faixa ou ímã "AUTOESCOLA" ou "CFC".',
          'side',
          <Car className="h-8 w-8 text-primary" />
        )}

        {step === 'analyzing' && (
          <div className="py-12 text-center">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analisando Documentos...</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Nossa IA está verificando a conformidade do veículo com as normas do CONTRAN.
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Isso pode levar alguns segundos</span>
            </div>
          </div>
        )}

        {step === 'result' && analysisResult && (
          <div className="py-8 text-center">
            {analysisResult.status === 'approved' ? (
              <>
                <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">Veículo Aprovado!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Seu veículo foi verificado e está pronto para receber aluguéis.
                </p>
                {analysisResult.analysis && (
                  <div className="bg-accent rounded-lg p-4 text-left text-sm space-y-1">
                    <p><strong>Placa:</strong> {analysisResult.analysis.detected_plate || formData.plate}</p>
                    <p><strong>Modelo:</strong> {analysisResult.analysis.detected_model || formData.model}</p>
                    <p><strong>Ano:</strong> {analysisResult.analysis.detected_year || 'N/A'}</p>
                    <p><strong>Duplo Comando:</strong> {analysisResult.analysis.has_dual_command ? '✅' : '❌'}</p>
                    <p><strong>Identificação:</strong> {analysisResult.analysis.has_sticker ? '✅' : '❌'}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">Verificação Reprovada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {analysisResult.analysis?.rejection_reason_pt || 'O veículo não atende aos requisitos de segurança.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Você pode entrar em contato com o suporte ou tentar novamente com novas fotos.
                </p>
              </>
            )}
          </div>
        )}

        {step !== 'analyzing' && step !== 'result' && (
          <div className="flex gap-3 mt-6">
            {step !== 'info' && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                Voltar
              </Button>
            )}
            <Button
              onClick={nextStep}
              disabled={!canProceed() || isUploading}
              className="flex-1"
            >
              {step === 'side' ? (
                isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar para Análise'
                )
              ) : (
                'Continuar'
              )}
            </Button>
          </div>
        )}

        {step === 'result' && (
          <Button onClick={handleClose} className="w-full mt-4">
            {analysisResult?.status === 'approved' ? 'Concluir' : 'Fechar'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddCarWizard;
