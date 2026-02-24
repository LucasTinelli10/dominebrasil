import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { MapPin, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface VerificationCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'start' | 'finish';
  onSubmit: (code: string, lat: number | null, lng: number | null) => Promise<void>;
}

export default function VerificationCodeModal({ open, onOpenChange, type, onSubmit }: VerificationCodeModalProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);

  const handleSubmit = async () => {
    if (code.length !== 4) {
      toast.error('Digite o código de 4 dígitos');
      return;
    }

    setSubmitting(true);
    setGpsStatus('loading');

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        setGpsStatus('success');
      } catch {
        setGpsStatus('error');
        toast.warning('Localização não disponível.');
      }

      await onSubmit(code, lat, lng);
      onOpenChange(false);
      setCode('');
      setAttempts(0);
      setBlocked(false);
    } catch (error: any) {
      const msg = error.message || 'Erro na verificação';
      if (msg.includes('bloqueado') || msg.includes('Bloqueado')) {
        setBlocked(true);
      } else if (msg.includes('incorreto') || msg.includes('Incorreto')) {
        setAttempts(prev => prev + 1);
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setGpsStatus('idle');
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setCode('');
      setGpsStatus('idle');
      setAttempts(0);
      setBlocked(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-instructor" />
            {type === 'start' ? 'Verificação para Iniciar' : 'Verificação para Finalizar'}
          </DialogTitle>
          <DialogDescription>
            Peça o código de 4 dígitos ao aluno para {type === 'start' ? 'iniciar' : 'finalizar'} a aula.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex justify-center py-2">
            <InputOTP maxLength={4} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="p-3 rounded-lg bg-instructor/5 border border-instructor/20">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-instructor mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Sua localização será verificada para confirmar proximidade com o aluno (máx. 500m).
              </p>
            </div>
          </div>

          {attempts > 0 && !blocked && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning text-center font-medium">
                ⚠️ {attempts}/3 tentativas usadas. Após 3 erros o código será bloqueado.
              </p>
            </div>
          )}

          {blocked && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive text-center font-medium">
                🔒 Código bloqueado. Peça ao aluno para gerar um novo código.
              </p>
            </div>
          )}

          <Button
            className="w-full bg-instructor hover:bg-instructor/90"
            onClick={handleSubmit}
            disabled={submitting || code.length !== 4 || blocked}
          >
            {submitting ? (gpsStatus === 'loading' ? 'Obtendo localização...' : 'Verificando...') : 'Verificar e Continuar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
