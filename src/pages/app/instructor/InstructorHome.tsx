import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  BookOpen,
  Star,
  Clock,
  MapPin,
  ArrowRight,
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
import {
  dailyEarnings,
  weeklyEarnings,
  monthlyEarnings,
  upcomingLessons,
} from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DocumentExpiryAlert from '@/components/DocumentExpiryAlert';

export default function InstructorHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Redirect to onboarding if not verified
  useEffect(() => {
    if (profile && profile.verification_status !== 'approved') {
      navigate('/onboarding');
    }
  }, [profile, navigate]);

  const chartData = chartPeriod === 'daily' ? dailyEarnings : chartPeriod === 'weekly' ? weeklyEarnings : monthlyEarnings;
  const xKey = chartPeriod === 'daily' ? 'hour' : chartPeriod === 'weekly' ? 'day' : 'week';

  // Synced metrics based on period
  const metrics = useMemo(() => {
    if (chartPeriod === 'daily') {
      return {
        grossRevenue: dailyEarnings.reduce((a, b) => a + b.amount, 0),
        netProfit: dailyEarnings.reduce((a, b) => a + b.amount, 0) * 0.7,
        lessonsCompleted: dailyEarnings.filter(d => d.amount > 0).length,
        averageRating: 4.9,
        period: 'Hoje',
      };
    } else if (chartPeriod === 'weekly') {
      return {
        grossRevenue: weeklyEarnings.reduce((a, b) => a + b.amount, 0),
        netProfit: weeklyEarnings.reduce((a, b) => a + b.amount, 0) * 0.7,
        lessonsCompleted: weeklyEarnings.reduce((a, b) => a + Math.floor(b.amount / 120), 0),
        averageRating: 4.9,
        period: 'Esta Semana',
      };
    } else {
      return {
        grossRevenue: monthlyEarnings.reduce((a, b) => a + b.amount, 0),
        netProfit: monthlyEarnings.reduce((a, b) => a + b.amount, 0) * 0.7,
        lessonsCompleted: monthlyEarnings.reduce((a, b) => a + Math.floor(b.amount / 120), 0),
        averageRating: 4.9,
        period: 'Este Mês',
      };
    }
  }, [chartPeriod]);

  const pendingRequests = 5;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Document Expiry Alert */}
      <DocumentExpiryAlert className="mb-4" />

      {/* Metrics Cards - Synced with period */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-instructor/10 to-instructor/5 border-instructor/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Bruto</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(metrics.grossRevenue)}
                </p>
                <p className="text-xs text-instructor mt-1">
                  {metrics.period}
                </p>
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
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(metrics.netProfit)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.period} (taxas descontadas)
                </p>
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
                <p className="text-2xl font-bold text-foreground mt-1">
                  {metrics.lessonsCompleted}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.period}
                </p>
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
                  {metrics.averageRating}
                  <Star className="h-5 w-5 text-warning fill-warning" />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Baseado em 86 avaliações
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
        {/* Earnings Chart */}
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey={xKey} 
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs text-muted-foreground"
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
                    activeDot={{ r: 6, fill: 'hsl(var(--instructor-primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Lessons */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-display">Próximas Aulas</CardTitle>
              <Button variant="ghost" size="sm" className="text-instructor">
                Ver todas <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingLessons.slice(0, 3).map((lesson) => (
              <div
                key={lesson.id}
                className={cn(
                  'p-3 rounded-lg border transition-all hover:shadow-sm',
                  lesson.status === 'confirmed' 
                    ? 'bg-instructor-accent/30 border-instructor/20' 
                    : 'bg-warning/10 border-warning/20'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={lesson.studentAvatar} />
                    <AvatarFallback className="bg-instructor text-instructor-foreground">
                      {lesson.studentName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {lesson.studentName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{lesson.time} ({lesson.duration}min)</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{lesson.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-medium',
                        lesson.status === 'confirmed'
                          ? 'border-instructor text-instructor'
                          : 'border-warning text-warning'
                      )}
                    >
                      {getTimeUntil(lesson.date, lesson.time)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests > 0 && (
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Você tem {pendingRequests} solicitações pendentes
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
