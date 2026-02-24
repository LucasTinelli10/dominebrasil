import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle2, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PixQRCodeProps {
  qrCode: string;
  qrCodeBase64: string;
  paymentId: number;
  onPaymentApproved: () => void;
}

export function PixQRCode({ qrCode, qrCodeBase64, paymentId, onPaymentApproved }: PixQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min

  const checkStatus = useCallback(async () => {
    try {
      setChecking(true);
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId },
      });
      if (error) return;
      if (data?.status === 'approved') {
        onPaymentApproved();
      }
    } catch {
      // ignore polling errors
    } finally {
      setChecking(false);
    }
  }, [paymentId, onPaymentApproved]);

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar. Tente selecionar o código manualmente.');
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <QrCode className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Pague com PIX</h2>
        <p className="text-sm text-muted-foreground">
          Escaneie o QR Code ou copie o código abaixo
        </p>
      </div>

      {/* QR Code Image */}
      <Card className="border-primary/20">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          {qrCodeBase64 && (
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-56 h-56 rounded-lg"
            />
          )}

          {/* Timer */}
          <Badge variant="outline" className="text-xs">
            Expira em {minutes}:{seconds.toString().padStart(2, '0')}
          </Badge>
        </CardContent>
      </Card>

      {/* Copy & Paste */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">PIX Copia e Cola</p>
          <div className="bg-muted rounded-lg p-3 break-all text-xs font-mono max-h-24 overflow-y-auto">
            {qrCode}
          </div>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full"
            size="sm"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar código
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Status */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Aguardando pagamento{checking ? '...' : ''}</span>
      </div>
    </div>
  );
}
