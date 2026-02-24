import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Star, Car, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import StudentRatingModal from '@/components/student/StudentRatingModal';

interface CompletedLesson {
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
  feedback?: {
    rating: number;
    feedback: string;
    strengths: string[];
    areas_to_improve: string[];
  };
}

export default function StudentHistory() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<CompletedLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState<{ open: boolean; bookingId: string; instructorName: string }>({
    open: false, bookingId: '', instructorName: '',
  });

  useEffect(() => {
    if (user?.id) fetchHistory();
  }, [user?.id]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, date, time_slot, total_price,
          instructor:profiles!bookings_instructor_id_fkey(id, full_name, avatar_url),
          car:cars!bookings_car_id_fkey(model, plate),
          lesson_feedback(rating, feedback, strengths, areas_to_improve)
        `)
        .eq('student_id', user?.id)
        .eq('status', 'completed')
        .order('date', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((d: any) => ({
        ...d,
        feedback: d.lesson_feedback?.[0] || null,
      }));
      setLessons(mapped);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-display font-bold">Histórico de Aulas</h1></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Histórico de Aulas</h1>
        <p className="text-muted-foreground">Todas as aulas concluídas e feedbacks recebidos</p>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma aula concluída</h3>
            <p className="text-muted-foreground">Suas aulas finalizadas aparecerão aqui com os feedbacks dos instrutores.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={lesson.instructor?.avatar_url || ''} />
                    <AvatarFallback className="bg-student text-student-foreground">
                      {lesson.instructor?.full_name?.charAt(0) || 'I'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{lesson.instructor?.full_name}</h3>
                        <Badge variant="outline" className="border-success text-success text-xs">Concluída</Badge>
                      </div>
                      <p className="font-bold text-student">R$ {lesson.total_price?.toFixed(2)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
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

                    {/* Feedback pedagógico do instrutor */}
                    {lesson.feedback && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
                        <span className="text-sm font-medium mb-2 block">Feedback do Instrutor:</span>

                        {lesson.feedback.feedback && (
                          <p className="text-sm text-muted-foreground mb-2">
                            "{lesson.feedback.feedback}"
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {lesson.feedback.strengths?.map((s, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-success text-success">
                              ✓ {s}
                            </Badge>
                          ))}
                          {lesson.feedback.areas_to_improve?.map((a, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-warning text-warning">
                              ⚡ {a}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Avaliação do aluno para o instrutor */}
                    {lesson.feedback?.rating ? (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm font-medium">Sua avaliação:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (lesson.feedback?.rating || 0)
                                  ? 'text-warning fill-warning'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : lesson.feedback ? (
                      <Button
                        size="sm"
                        className="mt-3 bg-student hover:bg-student/90"
                        onClick={() => setRatingModal({
                          open: true,
                          bookingId: lesson.id,
                          instructorName: lesson.instructor?.full_name || '',
                        })}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Avaliar Instrutor
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StudentRatingModal
        open={ratingModal.open}
        onOpenChange={(open) => setRatingModal(prev => ({ ...prev, open }))}
        bookingId={ratingModal.bookingId}
        instructorName={ratingModal.instructorName}
        onCompleted={fetchHistory}
      />
    </div>
  );
}
