import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Calendar, Clock, Car, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConfirmedLesson {
  id: string;
  date: string;
  time_slot: string;
  total_price: number;
  instructor: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  car?: {
    model: string;
    plate: string;
  };
}

export default function StudentLessons() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lessons, setLessons] = useState<ConfirmedLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for payment success redirect
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Pagamento confirmado! Sua aula foi agendada com sucesso.', {
        icon: <CheckCircle2 className="h-5 w-5 text-success" />,
        duration: 5000,
      });
      // Clean up URL
      window.history.replaceState({}, '', '/app/student/lessons');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user?.id) {
      fetchConfirmedLessons();
    }
  }, [user?.id]);

  const fetchConfirmedLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          date,
          time_slot,
          total_price,
          instructor:profiles!bookings_instructor_id_fkey(id, full_name, avatar_url),
          car:cars!bookings_car_id_fkey(model, plate)
        `)
        .eq('student_id', user?.id)
        .eq('status', 'confirmed')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setLessons(data as unknown as ConfirmedLesson[] || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (instructorId: string) => {
    navigate(`/app/student/messages?instructor=${instructorId}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-display font-bold">Minhas Aulas</h1></div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Minhas Aulas</h1>
        <p className="text-muted-foreground">Aulas confirmadas e pagas</p>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma aula agendada</h3>
            <p className="text-muted-foreground mb-4">Você ainda não tem aulas confirmadas.</p>
            <Button onClick={() => navigate('/app/student/search')} className="bg-student hover:bg-student/90">
              Buscar Instrutor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={lesson.instructor?.avatar_url || ''} />
                    <AvatarFallback className="bg-student text-student-foreground text-lg">
                      {lesson.instructor?.full_name?.charAt(0) || 'I'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{lesson.instructor?.full_name}</h3>
                        <Badge variant="outline" className="border-student text-student mt-1">
                          Confirmada
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-student">
                        R$ {lesson.total_price?.toFixed(2)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(lesson.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{lesson.time_slot}</span>
                      </div>
                      {lesson.car && (
                        <div className="flex items-center gap-2 col-span-2">
                          <Car className="h-4 w-4" />
                          <span>{lesson.car.model} - {lesson.car.plate}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      className="mt-4 bg-student hover:bg-student/90"
                      onClick={() => handleOpenChat(lesson.instructor?.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat com Instrutor
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}