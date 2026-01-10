import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Clock, Lock, Unlock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ScheduledLesson {
  id: string;
  date: string;
  time_slot: string;
  status: string;
  student: {
    full_name: string;
    avatar_url: string;
  };
}

interface ScheduleBlock {
  id: string;
  date: string;
  time_slot: string;
  reason: string | null;
}

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function InstructorSchedule() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lessons, setLessons] = useState<ScheduledLesson[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ count: 0, hours: 0, revenue: 0 });
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchScheduleData();
    }
  }, [user?.id, currentDate]);

  const fetchScheduleData = async () => {
    try {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startDate = weekStart.toISOString().split('T')[0];
      const endDate = weekEnd.toISOString().split('T')[0];

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from('bookings')
        .select(`
          id, date, time_slot, status,
          student:profiles!bookings_student_id_fkey(full_name, avatar_url)
        `)
        .eq('instructor_id', user?.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['confirmed', 'pending']);

      setLessons(lessonsData as unknown as ScheduledLesson[] || []);

      // Fetch blocks
      const { data: blocksData } = await supabase
        .from('instructor_schedule_blocks')
        .select('*')
        .eq('instructor_id', user?.id)
        .gte('date', startDate)
        .lte('date', endDate);

      setBlocks(blocksData || []);

      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayLessons = (lessonsData || []).filter(l => l.date === today && l.status === 'confirmed');
      setTodayStats({
        count: todayLessons.length,
        hours: todayLessons.length,
        revenue: todayLessons.length * 90,
      });
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const weekDays = getWeekDays();

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getLessonForSlot = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return lessons.find(lesson => lesson.date === dateStr && lesson.time_slot === time);
  };

  const getBlockForSlot = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return blocks.find(block => block.date === dateStr && block.time_slot === time);
  };

  const formatMonth = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    
    if (start.getMonth() === end.getMonth()) {
      return start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    
    return `${start.toLocaleDateString('pt-BR', { month: 'short' })} - ${end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`;
  };

  const handleSlotClick = (date: Date, time: string) => {
    const lesson = getLessonForSlot(date, time);
    const block = getBlockForSlot(date, time);

    // Can't modify slots with lessons
    if (lesson) return;

    // If slot is blocked, remove the block
    if (block) {
      removeBlock(block.id);
      return;
    }

    // Otherwise, open dialog to create block
    setSelectedSlot({ date, time });
    setBlockReason('');
    setBlockDialogOpen(true);
  };

  const createBlock = async () => {
    if (!selectedSlot || !user?.id) return;

    try {
      const dateStr = selectedSlot.date.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('instructor_schedule_blocks')
        .insert({
          instructor_id: user.id,
          date: dateStr,
          time_slot: selectedSlot.time,
          reason: blockReason || null,
        });

      if (error) throw error;

      toast.success('Horário bloqueado com sucesso');
      setBlockDialogOpen(false);
      fetchScheduleData();
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Erro ao bloquear horário');
    }
  };

  const removeBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('instructor_schedule_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast.success('Horário desbloqueado');
      fetchScheduleData();
    } catch (error) {
      console.error('Error removing block:', error);
      toast.error('Erro ao desbloquear horário');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-display font-bold">Minha Agenda</h1></div>
        <Card className="animate-pulse">
          <CardContent className="p-6"><div className="h-96 bg-muted rounded" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Minha Agenda</h1>
          <p className="text-muted-foreground">Clique em um horário livre para bloquear</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="font-medium text-foreground capitalize">{formatMonth()}</span>
            </div>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-instructor" />
                <span className="text-muted-foreground">Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-warning" />
                <span className="text-muted-foreground">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-destructive/50" />
                <span className="text-muted-foreground">Bloqueado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted" />
                <span className="text-muted-foreground">Livre</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header - Days with dates */}
              <div className="grid grid-cols-8 gap-1 mb-3 sticky top-0 bg-background z-10 pb-2 border-b">
                <div className="p-3 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                {weekDays.map((date, i) => (
                  <div
                    key={i}
                    className={cn(
                      'text-center p-3 rounded-lg transition-colors',
                      isToday(date) && 'bg-instructor text-instructor-foreground'
                    )}
                  >
                    <div className="text-xs font-medium uppercase tracking-wide opacity-80">
                      {daysOfWeek[date.getDay()].slice(0, 3)}
                    </div>
                    <div className="text-2xl font-bold">{date.getDate()}</div>
                    <div className="text-[10px] opacity-60">
                      {date.toLocaleDateString('pt-BR', { month: 'short' })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-1">
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 gap-1 group">
                    {/* Time column - more prominent */}
                    <div className="p-3 flex items-center justify-end">
                      <div className="bg-muted/50 px-2 py-1 rounded text-sm font-mono font-medium text-foreground">
                        {time}
                      </div>
                    </div>
                    {/* Day cells */}
                    {weekDays.map((date, i) => {
                      const lesson = getLessonForSlot(date, time);
                      const block = getBlockForSlot(date, time);
                      const isPast = date < new Date() && !isToday(date);
                      
                      return (
                        <div
                          key={i}
                          onClick={() => !isPast && handleSlotClick(date, time)}
                          title={`${daysOfWeek[date.getDay()]}, ${date.getDate()} às ${time}`}
                          className={cn(
                            'min-h-[70px] rounded-lg border-2 transition-all relative',
                            !isPast && !lesson && 'cursor-pointer',
                            lesson
                              ? lesson.status === 'confirmed'
                                ? 'bg-instructor/10 border-instructor/40 shadow-sm'
                                : 'bg-warning/10 border-warning/40 shadow-sm'
                              : block
                                ? 'bg-destructive/10 border-destructive/40 hover:bg-destructive/20'
                                : isPast
                                  ? 'bg-muted/20 border-muted/30 opacity-40'
                                  : 'bg-muted/20 border-muted/40 hover:bg-primary/5 hover:border-primary/30'
                          )}
                        >
                          {/* Show time in each cell for clarity */}
                          <div className="absolute top-1 left-1.5 text-[9px] font-mono text-muted-foreground/60">
                            {time}
                          </div>
                          
                          {lesson && (
                            <div className="p-2 pt-4 h-full">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={lesson.student?.avatar_url || ''} />
                                  <AvatarFallback className="text-[9px] bg-instructor text-instructor-foreground">
                                    {lesson.student?.full_name?.charAt(0) || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium truncate">
                                  {lesson.student?.full_name?.split(' ')[0]}
                                </span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "mt-1.5 text-[9px] px-1 py-0",
                                  lesson.status === 'confirmed' 
                                    ? 'border-instructor/50 text-instructor' 
                                    : 'border-warning/50 text-warning'
                                )}
                              >
                                {lesson.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                              </Badge>
                            </div>
                          )}
                          {block && !lesson && (
                            <div className="p-2 pt-4 h-full flex flex-col items-center justify-center">
                              <Lock className="h-4 w-4 text-destructive" />
                              <span className="text-[10px] text-destructive mt-1 font-medium">Bloqueado</span>
                            </div>
                          )}
                          {!lesson && !block && !isPast && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Unlock className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Resumo de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-instructor/10 text-center">
              <p className="text-3xl font-bold text-instructor">{todayStats.count}</p>
              <p className="text-sm text-muted-foreground">Aulas Agendadas</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 text-center">
              <p className="text-3xl font-bold text-success">{todayStats.hours}h</p>
              <p className="text-sm text-muted-foreground">Tempo Trabalhado</p>
            </div>
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-3xl font-bold text-foreground">R$ {todayStats.revenue}</p>
              <p className="text-sm text-muted-foreground">Faturamento do Dia</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Horário</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  Bloquear {selectedSlot.time} em{' '}
                  {selectedSlot.date.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input
                id="reason"
                placeholder="Ex: Consulta médica"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createBlock} className="bg-instructor hover:bg-instructor/90">
              <Lock className="h-4 w-4 mr-2" />
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
