import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Star, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface LessonFeedback {
  id: string;
  rating: number;
  feedback: string;
  strengths: string[];
  areas_to_improve: string[];
  created_at: string;
  booking: {
    date: string;
    instructor: {
      full_name: string;
      avatar_url: string;
    };
  };
}

export default function StudentProgress() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<LessonFeedback[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchProgress();
    }
  }, [user?.id]);

  const fetchProgress = async () => {
    try {
      // Get completed lessons count
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user?.id)
        .eq('status', 'completed');

      setTotalLessons(count || 0);

      // Get feedbacks with booking and instructor info
      const { data: feedbackData, error } = await supabase
        .from('lesson_feedback')
        .select(`
          id,
          rating,
          feedback,
          strengths,
          areas_to_improve,
          created_at,
          booking:bookings!lesson_feedback_booking_id_fkey(
            date,
            instructor:profiles!bookings_instructor_id_fkey(full_name, avatar_url)
          )
        `)
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });

      if (!error && feedbackData) {
        setFeedbacks(feedbackData as unknown as LessonFeedback[]);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = feedbacks.length > 0
    ? feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) / feedbacks.length
    : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-display font-bold">Meu Progresso</h1></div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Meu Progresso</h1>
        <p className="text-muted-foreground">Acompanhe sua evolução nas aulas práticas</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-student/10 to-student/5 border-student/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aulas Realizadas</p>
                <p className="text-3xl font-bold mt-1">{totalLessons}</p>
              </div>
              <div className="p-3 rounded-xl bg-student/10">
                <CheckCircle2 className="h-6 w-6 text-student" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avaliações Recebidas</p>
                <p className="text-3xl font-bold mt-1">{feedbacks.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média de Avaliação</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
                  <Star className="h-6 w-6 text-warning fill-warning" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-warning/10">
                <Star className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Feedbacks dos Instrutores</CardTitle>
        </CardHeader>
        <CardContent>
          {feedbacks.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Você ainda não tem feedbacks. Complete aulas para receber avaliações dos instrutores.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={feedback.booking?.instructor?.avatar_url || ''} />
                      <AvatarFallback className="bg-student text-student-foreground">
                        {feedback.booking?.instructor?.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{feedback.booking?.instructor?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Aula em {formatDate(feedback.booking?.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (feedback.rating || 0)
                                  ? 'text-warning fill-warning'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {feedback.feedback && (
                        <p className="text-sm text-muted-foreground mb-3">
                          "{feedback.feedback}"
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {feedback.strengths?.map((strength, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-success text-success">
                            ✓ {strength}
                          </Badge>
                        ))}
                        {feedback.areas_to_improve?.map((area, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-warning text-warning">
                            ⚡ {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}