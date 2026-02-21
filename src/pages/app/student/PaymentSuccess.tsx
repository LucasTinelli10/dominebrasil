import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 15 seconds
    const timer = setTimeout(() => {
      navigate('/app/student/lessons');
    }, 15000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full shadow-xl border-success/20">
        <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Pagamento Confirmado! 🎉
            </h1>
            <p className="text-muted-foreground">
              Sua aula prática foi agendada com sucesso. O instrutor já foi notificado.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left">
            <h3 className="font-semibold text-sm text-foreground">Próximos passos:</h3>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Acesse <strong>Minhas Aulas</strong> para ver os detalhes do agendamento
              </p>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Use o <strong>Chat</strong> para combinar os detalhes com seu instrutor
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/app/student/lessons')}
              className="w-full bg-success hover:bg-success/90 text-white"
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

          <p className="text-xs text-muted-foreground">
            Você será redirecionado automaticamente em alguns segundos...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
