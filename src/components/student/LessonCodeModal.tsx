import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Shield, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LessonCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  type: 'start' | 'finish';
}

export default function LessonCodeModal({ open, onOpenChange, bookingId, type }: LessonCodeModalProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    try {
      // Get GPS position
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
      } catch {
        toast.warning('Localização não disponível. O código será gerado sem GPS.');
      }

      const { data, error } = await supabase.rpc('generate_lesson_code', {
        p_booking_id: bookingId,
        p_type: type,
        p_lat: lat,
        p_lng: lng,
      });

      if (error) throw error;
      setCode(data as string);
    } catch (error: any) {
      toast.error('Erro ao gerar código: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setCode(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-student" />
            {type === 'start' ? 'Código para Iniciar Aula' : 'Código para Finalizar Aula'}
          </DialogTitle>
          <DialogDescription>
            Informe este código ao seu instrutor para {type === 'start' ? 'iniciar' : 'finalizar'} a aula.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!code ? (
            <>
              <div className="p-4 rounded-lg bg-student/5 border border-student/20">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-student mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Verificação de presença</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sua localização será usada para comprovar que você está no mesmo local que o instrutor.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                className="w-full bg-student hover:bg-student/90"
                onClick={generateCode}
                disabled={loading}
              >
                {loading ? 'Gerando...' : 'Gerar Código de Verificação'}
              </Button>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-2">Seu código de verificação:</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-mono font-bold tracking-[0.3em] text-student">
                    {code}
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Expira em 5 minutos</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs text-warning text-center">
                  Não compartilhe este código por mensagem. Informe verbalmente ao instrutor.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
