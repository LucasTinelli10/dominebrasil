import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CreditCard, Smartphone, Banknote, Loader2, Shield, 
  Calendar, Clock, ArrowLeft, CheckCircle2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  BUSINESS_RULES, formatCurrency, calculateGatewayFee, 
  calculateTotalWithSurcharge, type PaymentMethod 
} from '@/lib/businessRules';

interface BookingDetails {
  id: string;
  date: string;
  time_slot: string;
  total_price: number;
  notes: string | null;
  instructor: { id: string; full_name: string; avatar_url: string | null };
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: typeof CreditCard; description: string; feeLabel: string }[] = [
  {
    id: 'pix',
    label: 'PIX',
    icon: Smartphone,
    description: 'Pagamento instantâneo, sem taxa adicional',
    feeLabel: 'Sem taxa',
  },
  {
    id: 'debit',
    label: 'Cartão de Débito',
    icon: Banknote,
    description: `Taxa de ${BUSINESS_RULES.GATEWAY_FEE.DEBIT}% do gateway`,
    feeLabel: `+${BUSINESS_RULES.GATEWAY_FEE.DEBIT}%`,
  },
  {
    id: 'credit',
    label: 'Cartão de Crédito',
    icon: CreditCard,
    description: `Taxa de ${BUSINESS_RULES.GATEWAY_FEE.CREDIT}% do gateway`,
    feeLabel: `+${BUSINESS_RULES.GATEWAY_FEE.CREDIT}%`,
  },
];

export default function Checkout() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');

  useEffect(() => {
    if (bookingId) fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, date, time_slot, total_price, notes,
          instructor:profiles!bookings_instructor_id_fkey(id, full_name, avatar_url)
        `)
        .eq('id', bookingId!)
        .single();

      if (error) throw error;
      setBooking({
        ...data,
        instructor: data.instructor as any,
      } as BookingDetails);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Agendamento não encontrado');
      navigate('/app/student/lessons');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-mp-checkout', {
        body: {
          bookingId: booking.id,
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

  if (!booking) return null;

  const subtotal = booking.total_price;
  const gatewayFee = calculateGatewayFee(subtotal, selectedMethod);
  const total = calculateTotalWithSurcharge(subtotal, selectedMethod);

  const formattedDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const lessonType = booking.notes?.includes('perder_medo') ? 'Perder o Medo' : '1ª CNH';

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/student/lessons')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="text-center">
        <h1 className="text-2xl font-display font-bold text-foreground">Pagamento</h1>
        <p className="text-muted-foreground">Escolha a forma de pagamento</p>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={booking.instructor.avatar_url || undefined} />
              <AvatarFallback className="bg-student text-student-foreground">
                {booking.instructor.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{booking.instructor.full_name}</p>
              <Badge variant="outline" className="text-xs">{lessonType}</Badge>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {booking.time_slot}
            </span>
          </div>
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
                      <Badge variant="secondary" className="text-[10px]">
                        Sem taxa
                      </Badge>
                    )}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="border-student/30">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal (Aula)</span>
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
        disabled={processing}
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
