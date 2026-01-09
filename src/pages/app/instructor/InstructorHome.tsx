import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  BookOpen,
  Star,
  Clock,
  MapPin,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DocumentExpiryAlert from '@/components/DocumentExpiryAlert';

interface UpcomingLesson {
  id: string;
  date: string;
  time_slot: string;
  student: {
    full_name: string;
    avatar_url: string;
  };
}

interface EarningsData {
  label: string;
  amount: number;
}

export default function InstructorHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [stats, setStats] = useState({
    grossRevenue: 0,
    netProfit: 0,
    lessonsCompleted: 0,
    averageRating: 5.0,
    pendingRequests: 0,
  });
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.verification_status !== 'approved') {
      navigate('/onboarding');
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id, chartPeriod]);

  const fetchDashboardData = async () => {
    try {
      // Fetch upcoming lessons
      const { data: lessons } = await supabase
        .from('bookings')
        .select(`
          id, date, time_slot,
          student:profiles!bookings_student_id_fkey(full_name, avatar_url)
        `)
        .eq('instructor_id', user?.id)
        .eq('status', 'confirmed')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(3);

      setUpcomingLessons(lessons as unknown as UpcomingLesson[] || []);

      // Fetch completed lessons and revenue
      const { data: completedBookings } = await supabase
        .from('bookings')
        .select('total_price, date')
        .eq('instructor_id', user?.id)
        .eq('status', 'completed');

      const grossRevenue = completedBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
      const netProfit = grossRevenue * 0.7; // After platform fees

      // Fetch pending requests count
      const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', user?.id)
        .eq('status', 'pending');

      // Fetch average rating
      const { data: ratings } = await supabase
        .from('lesson_feedback')
        .select('rating')
        .eq('instructor_id', user?.id);

      const avgRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length
        : 5.0;

      setStats({
        grossRevenue,
        netProfit,
        lessonsCompleted: completedBookings?.length || 0,
        averageRating: avgRating,
        pendingRequests: pendingCount || 0,
      });

      // Generate earnings chart data
      generateEarningsData(completedBookings || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEarningsData = (bookings: { total_price: number; date: string }[]) => {
    const now = new Date();
    let data: EarningsData[] = [];

    if (chartPeriod === 'daily') {
      // Last 7 hours
      for (let i = 6; i >= 0; i--) {
        const hour = now.getHours() - i;
        data.push({ label: `${hour}:00`, amount: 0 });
      }
    } else if (chartPeriod === 'weekly') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayBookings = bookings.filter(b => b.date === date.toISOString().split('T')[0]);
        const amount = dayBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        data.push({ label: days[date.getDay()], amount });
      }
    } else {
      // Monthly - last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekBookings = bookings.filter(b => {
          const bDate = new Date(b.date);
          return bDate >= weekStart && bDate <= weekEnd;
        });
        const amount = weekBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        data.push({ label: `Sem ${4 - i}`, amount });
      }
    }

    setEarningsData(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getTimeUntil = (date: string, time: string) => {
    const lessonDate = new Date(`${date}T${time}:00`);
    const now = new Date();
    const diff = lessonDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Agora';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}min`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
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
      <DocumentExpiryAlert className="mb-4" />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-instructor/10 to-instructor/5 border-instructor/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Bruto</p>
                <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(stats.grossRevenue)}</p>
              </div>
              <div className="p-3 rounded-xl bg-instructor/10">
                <DollarSign className="h-6 w-6 text-instructor" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(stats.netProfit)}</p>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aulas Realizadas</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.lessonsCompleted}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
                <p className="text-2xl font-bold text-foreground mt-1 flex items-center gap-1">
                  {stats.averageRating.toFixed(1)}
                  <Star className="h-5 w-5 text-warning fill-warning" />
                </p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10">
                <Star className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Upcoming Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-display">Evolução dos Ganhos</CardTitle>
            <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as 'daily' | 'weekly' | 'monthly')}>
              <TabsList className="h-8">
                <TabsTrigger value="daily" className="text-xs px-3">Diário</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-3">Semanal</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-3">Mensal</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {earningsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Ganhos']}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--instructor-primary))"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--instructor-primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display">Próximas Aulas</CardTitle>
              <Button variant="ghost" size="sm" className="text-instructor" onClick={() => navigate('/app/instructor/schedule')}>
                Ver todas <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingLessons.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma aula agendada</p>
              </div>
            ) : (
              upcomingLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-3 rounded-lg border bg-instructor-accent/30 border-instructor/20"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={lesson.student?.avatar_url || ''} />
                      <AvatarFallback className="bg-instructor text-instructor-foreground">
                        {lesson.student?.full_name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {lesson.student?.full_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{lesson.time_slot}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-medium border-instructor text-instructor">
                      {getTimeUntil(lesson.date, lesson.time_slot)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Alert */}
      {stats.pendingRequests > 0 && (
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Você tem {stats.pendingRequests} solicitação(ões) pendente(s)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Responda rapidamente para aumentar sua taxa de conversão
                  </p>
                </div>
              </div>
              <Button 
                className="bg-warning hover:bg-warning/90 text-warning-foreground"
                onClick={() => navigate('/app/instructor/requests')}
              >
                Ver Solicitações
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
