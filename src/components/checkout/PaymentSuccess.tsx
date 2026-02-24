import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentSuccessProps {
  type: 'lesson' | 'package';
}

export function PaymentSuccessInline({ type }: PaymentSuccessProps) {
  const navigate = useNavigate();

  return (
    <div className="text-center space-y-6 py-6 animate-fade-in">
      <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="h-12 w-12 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Pagamento Confirmado! 🎉
        </h2>
        <p className="text-muted-foreground">
          {type === 'lesson'
            ? 'Sua aula prática foi agendada com sucesso. O instrutor já foi notificado.'
            : 'Seu pacote foi adquirido com sucesso. O instrutor já foi notificado.'
          }
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left max-w-sm mx-auto">
        <h3 className="font-semibold text-sm">Próximos passos:</h3>
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Acesse <strong>Minhas Aulas</strong> para ver os detalhes
          </p>
        </div>
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Use o <strong>Chat</strong> para combinar com seu instrutor
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <Button
          onClick={() => navigate('/app/student/lessons')}
          className="w-full bg-student hover:bg-student/90"
          size="lg"
        >
          Ver Minhas Aulas
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/app/student')}
          className="w-full"
        >
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
}
