import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CardFormProps {
  amount: number;
  paymentMethod: 'credit' | 'debit';
  cpf: string;
  email: string;
  onTokenReady: (data: {
    token: string;
    paymentMethodId: string;
    installments: number;
    issuerId?: string;
  }) => void;
  processing: boolean;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function CardForm({ amount, paymentMethod, cpf, email, onTokenReady, processing }: CardFormProps) {
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [detectedPaymentMethodId, setDetectedPaymentMethodId] = useState('');
  const [issuerId, setIssuerId] = useState('');
  const [tokenizing, setTokenizing] = useState(false);
  const scriptLoadedRef = useRef(false);

  // Load MP SDK
  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const loadSdk = async () => {
      try {
        // Get public key
        const { data, error } = await supabase.functions.invoke('get-mp-public-key');
        if (error || !data?.public_key) {
          toast.error('Erro ao carregar SDK de pagamento');
          return;
        }

        // Load MercadoPago.js
        if (!(window as any).MercadoPago) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load MP SDK'));
            document.head.appendChild(script);
          });
        }

        const mp = new (window as any).MercadoPago(data.public_key);
        setMpInstance(mp);
      } catch (err) {
        console.error('Error loading MP SDK:', err);
        toast.error('Erro ao inicializar pagamento com cartão');
      } finally {
        setSdkLoading(false);
      }
    };

    loadSdk();
  }, []);

  // Detect card brand from BIN
  useEffect(() => {
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length >= 6 && mpInstance) {
      const bin = digits.substring(0, 6);
      mpInstance.getPaymentMethods({ bin }).then((result: any) => {
        if (result.results?.length > 0) {
          const method = result.results[0];
          setCardBrand(method.name || '');
          setDetectedPaymentMethodId(method.id || '');
          // Get issuer
          mpInstance.getIssuers({ paymentMethodId: method.id, bin }).then((issuers: any) => {
            if (issuers?.length > 0) {
              setIssuerId(issuers[0].id?.toString() || '');
            }
          }).catch(() => {});
        }
      }).catch(() => {});
    } else {
      setCardBrand('');
      setDetectedPaymentMethodId('');
    }
  }, [cardNumber, mpInstance]);

  const handleSubmit = async () => {
    if (!mpInstance) {
      toast.error('SDK de pagamento não carregado');
      return;
    }

    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 13) {
      toast.error('Número do cartão inválido');
      return;
    }
    if (!cardholderName.trim()) {
      toast.error('Informe o nome no cartão');
      return;
    }
    const [month, year] = expiry.split('/');
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
      toast.error('Data de validade inválida');
      return;
    }
    if (cvv.length < 3) {
      toast.error('CVV inválido');
      return;
    }

    setTokenizing(true);
    try {
      const cardTokenResult = await mpInstance.createCardToken({
        cardNumber: digits,
        cardholderName: cardholderName.toUpperCase(),
        cardExpirationMonth: month,
        cardExpirationYear: year.length === 2 ? `20${year}` : year,
        securityCode: cvv,
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, ''),
      });

      if (cardTokenResult.id) {
        onTokenReady({
          token: cardTokenResult.id,
          paymentMethodId: detectedPaymentMethodId,
          installments: 1,
          issuerId: issuerId || undefined,
        });
      } else {
        throw new Error('Token não gerado');
      }
    } catch (err: any) {
      console.error('Tokenization error:', err);
      const msg = err?.cause?.[0]?.description || err?.message || 'Erro ao processar cartão';
      toast.error(msg);
    } finally {
      setTokenizing(false);
    }
  };

  if (sdkLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando formulário seguro...</span>
      </div>
    );
  }

  const isValid = cardNumber.replace(/\s/g, '').length >= 13 &&
    cardholderName.trim().length > 2 &&
    expiry.length >= 4 &&
    cvv.length >= 3;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Dados do Cartão de {paymentMethod === 'credit' ? 'Crédito' : 'Débito'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cardNumber" className="text-xs">Número do cartão</Label>
          <div className="relative">
            <Input
              id="cardNumber"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
              inputMode="numeric"
            />
            {cardBrand && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                {cardBrand}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cardholderName" className="text-xs">Nome no cartão</Label>
          <Input
            id="cardholderName"
            placeholder="NOME COMO NO CARTÃO"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="expiry" className="text-xs">Validade</Label>
            <Input
              id="expiry"
              placeholder="MM/AA"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              maxLength={5}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cvv" className="text-xs">CVV</Label>
            <Input
              id="cvv"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
              type="password"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || tokenizing || processing}
          className="w-full h-12 bg-student hover:bg-student/90 text-base"
        >
          {tokenizing || processing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Pagar R$ {amount.toFixed(2).replace('.', ',')}
            </>
          )}
        </Button>

        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          Dados protegidos e processados pelo Mercado Pago
        </p>
      </CardContent>
    </Card>
  );
}
