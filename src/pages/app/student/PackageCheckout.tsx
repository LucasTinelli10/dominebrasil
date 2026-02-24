import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CreditCard, Smartphone, Banknote, Loader2, Shield,
  Package, ArrowLeft, CheckCircle2, BookOpen, FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  BUSINESS_RULES, formatCurrency, calculateGatewayFee,
  calculateTotalWithSurcharge, type PaymentMethod
} from '@/lib/businessRules';
import { PixQRCode } from '@/components/checkout/PixQRCode';
import { CardForm } from '@/components/checkout/CardForm';
import { PaymentSuccessInline } from '@/components/checkout/PaymentSuccess';

interface PackageDetails {
  id: string;
  name: string;
  price: number;
  lesson_count: number;
  includes_exam: boolean;
  use_own_car: boolean;
  instructor_id: string;
  instructor: { full_name: string; avatar_url: string | null };
}

type CheckoutStep = 'select' | 'pix' | 'card' | 'success' | 'error';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: typeof CreditCard; description: string }[] = [
  { id: 'pix', label: 'PIX', icon: Smartphone, description: 'Pagamento instantâneo, sem taxa adicional' },
  { id: 'debit', label: 'Cartão de Débito', icon: Banknote, description: `Taxa de ${BUSINESS_RULES.GATEWAY_FEE.DEBIT}%` },
  { id: 'credit', label: 'Cartão de Crédito', icon: CreditCard, description: `Taxa de ${BUSINESS_RULES.GATEWAY_FEE.CREDIT}%` },
];

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function getStatusMessage(statusDetail: string): string {
  const messages: Record<string, string> = {
    cc_rejected_bad_filled_card_number: 'Número do cartão incorreto.',
    cc_rejected_bad_filled_date: 'Data de validade incorreta.',
    cc_rejected_bad_filled_other: 'Dados do cartão incorretos.',
    cc_rejected_bad_filled_security_code: 'Código de segurança incorreto.',
    cc_rejected_blacklist: 'Cartão não autorizado.',
    cc_rejected_call_for_authorize: 'Ligue para a operadora do cartão.',
    cc_rejected_card_disabled: 'Cartão desabilitado.',
    cc_rejected_duplicated_payment: 'Pagamento duplicado.',
    cc_rejected_high_risk: 'Recusado por segurança.',
    cc_rejected_insufficient_amount: 'Saldo insuficiente.',
    cc_rejected_max_attempts: 'Limite de tentativas atingido.',
    cc_rejected_other_reason: 'Cartão recusado.',
  };
  return messages[statusDetail] || 'Pagamento recusado. Tente outro método.';
}

export default function PackageCheckout() {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [cpf, setCpf] = useState('');
  const [cpfSaved, setCpfSaved] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [step, setStep] = useState<CheckoutStep>('select');
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; paymentId: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (packageId) fetchPackage();
  }, [packageId]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || '');
      const { data } = await supabase.from('profiles').select('cpf').eq('id', user.id).single();
      if (data?.cpf) { setCpf(formatCpf(data.cpf)); setCpfSaved(true); }
    };
    loadProfile();
  }, []);

  const fetchPackage = async () => {
    try {
      const { data, error } = await supabase
        .from('instructor_packages')
        .select('id, name, price, lesson_count, includes_exam, use_own_car, instructor_id')
        .eq('id', packageId!)
        .eq('active', true)
        .single();
      if (error) throw error;
      const { data: profile } = await supabase.rpc('get_public_instructor_profile', { instructor_id: data.instructor_id });
      const p = profile?.[0];
      setPkg({ ...data, instructor: { full_name: p?.full_name || 'Instrutor', avatar_url: p?.avatar_url || null } } as PackageDetails);
    } catch {
      toast.error('Pacote não encontrado');
      navigate('/app/student/search');
    } finally {
      setLoading(false);
    }
  };

  const saveCpfIfNeeded = async () => {
    if (cpfSaved) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ cpf: cpf.replace(/\D/g, '') } as any).eq('id', user.id);
      setCpfSaved(true);
    }
  };

  const handlePixPayment = async () => {
    if (!pkg) return;
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) { toast.error('Informe um CPF válido'); return; }
    setProcessing(true);
    try {
      await saveCpfIfNeeded();
      const { data, error } = await supabase.functions.invoke('create-package-checkout', {
        body: { packageId: pkg.id, paymentMethod: 'pix' },
      });
      if (error) throw error;
      if (data?.pix) {
        setPixData({ qrCode: data.pix.qr_code, qrCodeBase64: data.pix.qr_code_base64, paymentId: data.payment_id });
        setStep('pix');
      } else { throw new Error(data?.error || 'Erro ao gerar PIX'); }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao iniciar pagamento PIX');
    } finally {
      setProcessing(false);
    }
  };

  const handleCardToken = async (tokenData: { token: string; paymentMethodId: string; installments: number; issuerId?: string }) => {
    if (!pkg) return;
    setProcessing(true);
    try {
      await saveCpfIfNeeded();
      const { data, error } = await supabase.functions.invoke('create-package-checkout', {
        body: {
          packageId: pkg.id, paymentMethod: selectedMethod,
          cardToken: tokenData.token, paymentMethodId: tokenData.paymentMethodId,
          installments: tokenData.installments, issuerId: tokenData.issuerId,
        },
      });
      if (error) throw error;
      if (data?.status === 'approved') { setStep('success'); }
      else if (data?.status === 'rejected') { setErrorMessage(getStatusMessage(data.status_detail)); setStep('error'); }
      else if (data?.status === 'in_process') { toast.info('Pagamento em análise.'); setStep('success'); }
      else { throw new Error(data?.error || 'Pagamento não aprovado'); }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const handleProceed = () => {
    if (selectedMethod === 'pix') handlePixPayment();
    else setStep('card');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-student" /></div>;
  }
  if (!pkg) return null;

  const subtotal = pkg.price;
  const gatewayFee = calculateGatewayFee(subtotal, selectedMethod);
  const total = calculateTotalWithSurcharge(subtotal, selectedMethod);
  const cpfValid = cpf.replace(/\D/g, '').length === 11;

  if (step === 'success') return <div className="max-w-lg mx-auto"><PaymentSuccessInline type="package" /></div>;

  if (step === 'error') {
    return (
      <div className="max-w-lg mx-auto space-y-6 text-center py-10">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <CreditCard className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Pagamento Recusado</h2>
        <p className="text-muted-foreground">{errorMessage}</p>
        <Button onClick={() => { setStep('select'); setErrorMessage(''); }}>Tentar novamente</Button>
      </div>
    );
  }

  if (step === 'pix' && pixData) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setStep('select')}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={pkg.instructor.avatar_url || undefined} />
            <AvatarFallback className="bg-student text-student-foreground text-xs">{pkg.instructor.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium">{pkg.instructor.full_name}</p>
            <p className="text-xs text-muted-foreground">{pkg.name} · {pkg.lesson_count} aulas</p>
          </div>
          <Badge className="ml-auto bg-student/10 text-student border-0 text-sm font-bold">{formatCurrency(total)}</Badge>
        </div>
        <PixQRCode qrCode={pixData.qrCode} qrCodeBase64={pixData.qrCodeBase64} paymentId={pixData.paymentId} onPaymentApproved={() => setStep('success')} />
      </div>
    );
  }

  if (step === 'card') {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setStep('select')}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={pkg.instructor.avatar_url || undefined} />
            <AvatarFallback className="bg-student text-student-foreground text-xs">{pkg.instructor.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-medium">{pkg.instructor.full_name}</p>
            <p className="text-xs text-muted-foreground">{pkg.name} · {pkg.lesson_count} aulas</p>
          </div>
          <Badge className="ml-auto bg-student/10 text-student border-0 text-sm font-bold">{formatCurrency(total)}</Badge>
        </div>
        <CardForm amount={total} paymentMethod={selectedMethod as 'credit' | 'debit'} cpf={cpf} email={userEmail} onTokenReady={handleCardToken} processing={processing} />
      </div>
    );
  }

  // SELECT step
  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>

      <div className="text-center">
        <h1 className="text-2xl font-display font-bold text-foreground">Comprar Pacote</h1>
        <p className="text-muted-foreground">Escolha a forma de pagamento</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={pkg.instructor.avatar_url || undefined} />
              <AvatarFallback className="bg-student text-student-foreground">{pkg.instructor.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{pkg.instructor.full_name}</p>
              <Badge variant="outline" className="text-xs"><Package className="h-3 w-3 mr-1" />{pkg.name}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{pkg.lesson_count} aula(s)</span>
            {pkg.includes_exam && <span className="flex items-center gap-1"><FileCheck className="h-3.5 w-3.5" />Inclui Exame</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Label htmlFor="cpf" className="text-sm font-medium">CPF do pagador</Label>
          <Input id="cpf" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} className="mt-1.5" maxLength={14} disabled={cpfSaved} />
          {cpfSaved && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-student" /> CPF salvo</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Forma de Pagamento</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            const fee = calculateGatewayFee(subtotal, method.id);
            return (
              <button key={method.id} onClick={() => setSelectedMethod(method.id)} className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                isSelected ? 'border-student bg-student/5' : 'border-border hover:border-student/40'
              )}>
                <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', isSelected ? 'bg-student text-student-foreground' : 'bg-muted')}>
                  <method.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{method.label}</span>
                    {method.id === 'pix' && <Badge variant="secondary" className="text-[10px]">Sem taxa</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </div>
                <div className="text-right">
                  {fee > 0 ? <span className="text-xs text-muted-foreground">+{formatCurrency(fee)}</span> : <CheckCircle2 className="h-4 w-4 text-student" />}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-student/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal (Pacote)</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {gatewayFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa do {selectedMethod === 'debit' ? 'Débito' : 'Crédito'} ({selectedMethod === 'debit' ? BUSINESS_RULES.GATEWAY_FEE.DEBIT : BUSINESS_RULES.GATEWAY_FEE.CREDIT}%)</span>
              <span className="text-muted-foreground">+{formatCurrency(gatewayFee)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold text-student">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-12 bg-student hover:bg-student/90 text-lg" onClick={handleProceed} disabled={processing || !cpfValid}>
        {processing ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Processando...</> : <><Shield className="h-5 w-5 mr-2" />{selectedMethod === 'pix' ? 'Gerar PIX' : `Pagar ${formatCurrency(total)}`}</>}
      </Button>

      <p className="text-xs text-center text-muted-foreground">Pagamento seguro processado pelo Mercado Pago</p>
    </div>
  );
}
