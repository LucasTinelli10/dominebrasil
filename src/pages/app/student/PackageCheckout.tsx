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

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: typeof CreditCard; description: string }[] = [
  {
    id: 'pix',
    label: 'PIX',
    icon: Smartphone,
    description: 'Pagamento instantâneo, sem taxa adicional',
  },
  {
    id: 'debit',
    label: 'Cartão de Débito',
    icon: Banknote,
    description: `Taxa de ${BUSINESS_RULES.GATEWAY_FEE.DEBIT}% do gateway`,
  },
  {
    id: 'credit',
    label: 'Cartão de Crédito',
    icon: CreditCard,
    description: `Taxa de ${BUSINESS_RULES.GATEWAY_FEE.CREDIT}% do gateway`,
  },
];

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
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

  useEffect(() => {
    if (packageId) fetchPackage();
  }, [packageId]);

  useEffect(() => {
    const loadCpf = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('cpf').eq('id', user.id).single();
      if (data?.cpf) {
        setCpf(formatCpf(data.cpf));
        setCpfSaved(true);
      }
    };
    loadCpf();
  }, []);

  const fetchPackage = async () => {
    try {
      const { data, error } = await supabase
        .from('instructor_packages')
        .select(`
          id, name, price, lesson_count, includes_exam, use_own_car, instructor_id
        `)
        .eq('id', packageId!)
        .eq('active', true)
        .single();

      if (error) throw error;

      const { data: profile } = await supabase
        .rpc('get_public_instructor_profile', { instructor_id: data.instructor_id });

      const instructorProfile = profile?.[0];

      setPkg({
        ...data,
        instructor: {
          full_name: instructorProfile?.full_name || 'Instrutor',
          avatar_url: instructorProfile?.avatar_url || null,
        },
      } as PackageDetails);
    } catch (error) {
      console.error('Error fetching package:', error);
      toast.error('Pacote não encontrado');
      navigate('/app/student/search');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!pkg) return;

    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast.error('Informe um CPF válido com 11 dígitos');
      return;
    }

    setProcessing(true);

    try {
      if (!cpfSaved) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({ cpf: cpfDigits } as any).eq('id', user.id);
          setCpfSaved(true);
        }
      }

      const { data, error } = await supabase.functions.invoke('create-package-checkout', {
        body: {
          packageId: pkg.id,
          paymentMethod: selectedMethod,
        },
      });

      if (error) throw error;

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('URL de pagamento não gerada');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-student" />
      </div>
    );
  }

  if (!pkg) return null;

  const subtotal = pkg.price;
  const gatewayFee = calculateGatewayFee(subtotal, selectedMethod);
  const total = calculateTotalWithSurcharge(subtotal, selectedMethod);
  const cpfValid = cpf.replace(/\D/g, '').length === 11;

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="text-center">
        <h1 className="text-2xl font-display font-bold text-foreground">Comprar Pacote</h1>
        <p className="text-muted-foreground">Escolha a forma de pagamento</p>
      </div>

      {/* Package Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={pkg.instructor.avatar_url || undefined} />
              <AvatarFallback className="bg-student text-student-foreground">
                {pkg.instructor.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{pkg.instructor.full_name}</p>
              <Badge variant="outline" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                {pkg.name}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {pkg.lesson_count} aula(s)
            </span>
            {pkg.includes_exam && (
              <span className="flex items-center gap-1">
                <FileCheck className="h-3.5 w-3.5" />
                Inclui Exame
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CPF Field */}
      <Card>
        <CardContent className="p-4">
          <Label htmlFor="cpf" className="text-sm font-medium">CPF do pagador</Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            className="mt-1.5"
            maxLength={14}
            disabled={cpfSaved}
          />
          {cpfSaved && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-student" /> CPF salvo
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            const fee = calculateGatewayFee(subtotal, method.id);
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                  isSelected
                    ? 'border-student bg-student/5'
                    : 'border-border hover:border-student/40'
                )}
              >
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center',
                  isSelected ? 'bg-student text-student-foreground' : 'bg-muted'
                )}>
                  <method.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{method.label}</span>
                    {method.id === 'pix' && (
                      <Badge variant="secondary" className="text-[10px]">Sem taxa</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </div>
                <div className="text-right">
                  {fee > 0 ? (
                    <span className="text-xs text-muted-foreground">+{formatCurrency(fee)}</span>
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-student" />
                  )}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="border-student/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal (Pacote)</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {gatewayFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Taxa do {selectedMethod === 'debit' ? 'Débito' : 'Crédito'} ({
                  selectedMethod === 'debit'
                    ? BUSINESS_RULES.GATEWAY_FEE.DEBIT
                    : BUSINESS_RULES.GATEWAY_FEE.CREDIT
                }%)
              </span>
              <span className="text-muted-foreground">+{formatCurrency(gatewayFee)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold text-student">{formatCurrency(total)}</span>
          </div>
          {gatewayFee > 0 && (
            <p className="text-[11px] text-muted-foreground text-center">
              A taxa do cartão cobre os custos do gateway de pagamento. O instrutor e a plataforma recebem com base no subtotal.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pay Button */}
      <Button
        className="w-full h-12 bg-student hover:bg-student/90 text-lg"
        onClick={handlePayment}
        disabled={processing || !cpfValid}
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Shield className="h-5 w-5 mr-2" />
            Pagar {formatCurrency(total)}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Pagamento seguro processado pelo Mercado Pago
      </p>
    </div>
  );
}
