import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Calendar, BookOpen, MessageSquare, Star, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UpcomingLesson {
  id: string;
  date: string;
  time_slot: string;
  instructor: {
    full_name: string;
    avatar_url: string;
  };
}

interface RecommendedInstructor {
  instructor_id: string;
  full_name: string;
  avatar_url: string;
  rating: number;
  total_lessons: number;
  price_per_hour: number;
}

export default function StudentHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [instructors, setInstructors] = useState<RecommendedInstructor[]>([]);
  const [stats, setStats] = useState({ completedLessons: 0, upcomingCount: 0, unreadMessages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      // Fetch upcoming lessons
      const { data: lessons } = await supabase
        .from('bookings')
        .select(`
          id, date, time_slot,
          instructor:profiles!bookings_instructor_id_fkey(full_name, avatar_url)
        `)
        .eq('student_id', user?.id)
        .in('status', ['confirmed', 'pending'])
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(3);

      setUpcomingLessons(lessons as unknown as UpcomingLesson[] || []);

      // Fetch completed lessons count
      const { count: completedCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user?.id)
        .eq('status', 'completed');

      // Fetch unread messages count
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user?.id)
        .eq('read', false);

      setStats({
        completedLessons: completedCount || 0,
        upcomingCount: lessons?.length || 0,
        unreadMessages: unreadCount || 0,
      });

      // Fetch recommended instructors from database
      const { data: instructorData } = await supabase.rpc('get_all_approved_instructors');
      setInstructors((instructorData || []).slice(0, 2));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-student/10 to-student/5 border-student/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Aulas Práticas</p>
              <BookOpen className="h-5 w-5 text-student" />
            </div>
            <p className="text-2xl font-bold">{stats.completedLessons}</p>
            <p className="text-xs text-muted-foreground mt-1">Completadas</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/app/student/messages')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mensagens</p>
                <p className="text-2xl font-bold mt-2">
                  {stats.unreadMessages > 0 ? `${stats.unreadMessages} nova${stats.unreadMessages > 1 ? 's' : ''}` : 'Nenhuma'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-student/10"><MessageSquare className="h-6 w-6 text-student" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/app/student/search')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Buscar Instrutor</p>
                <p className="text-lg font-medium mt-2">Agendar Aula</p>
              </div>
              <div className="p-3 rounded-xl bg-student/10"><Search className="h-6 w-6 text-student" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Lessons & Instructors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Minhas Aulas Agendadas</CardTitle>
            <Button variant="ghost" size="sm" className="text-student" onClick={() => navigate('/app/student/lessons')}>
              Ver todas <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingLessons.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma aula agendada</p>
                <Button className="mt-4 bg-student hover:bg-student/90" onClick={() => navigate('/app/student/search')}>
                  Buscar Instrutor
                </Button>
              </div>
            ) : (
              upcomingLessons.map((lesson) => (
                <div key={lesson.id} className="p-4 rounded-lg bg-student-accent/30 border border-student/20">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={lesson.instructor?.avatar_url || ''} />
                      <AvatarFallback className="bg-student text-student-foreground">
                        {lesson.instructor?.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{lesson.instructor?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(lesson.date)} às {lesson.time_slot}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-student text-student">Confirmada</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Instrutores Disponíveis</CardTitle>
            <Button variant="ghost" size="sm" className="text-student" onClick={() => navigate('/app/student/search')}>
              Ver mais <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {instructors.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Nenhum instrutor disponível no momento</p>
              </div>
            ) : (
              instructors.map((instructor) => (
                <div 
                  key={instructor.instructor_id} 
                  className="p-4 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate('/app/student/search')}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={instructor.avatar_url || ''} />
                      <AvatarFallback className="bg-student text-student-foreground">
                        {instructor.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{instructor.full_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        {instructor.rating?.toFixed(1) || '5.0'} · {instructor.total_lessons || 0} aulas
                      </div>
                    </div>
                    <p className="font-bold text-student">R${instructor.price_per_hour || 90}/h</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
