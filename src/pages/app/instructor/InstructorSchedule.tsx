import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { upcomingLessons } from '@/data/mockData';

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function InstructorSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());

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
    return upcomingLessons.find(
      lesson => lesson.date === dateStr && lesson.time === time
    );
  };

  const formatMonth = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    
    if (start.getMonth() === end.getMonth()) {
      return start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    
    return `${start.toLocaleDateString('pt-BR', { month: 'short' })} - ${end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Minha Agenda
          </h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seus horários
          </p>
        </div>
        <Button className="bg-instructor hover:bg-instructor/90">
          Bloquear Horário
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="font-medium text-foreground capitalize">
                {formatMonth()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-instructor" />
                <span className="text-muted-foreground">Confirmado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-warning" />
                <span className="text-muted-foreground">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted" />
                <span className="text-muted-foreground">Livre</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header - Days */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="p-2" /> {/* Empty corner */}
                {weekDays.map((date, i) => (
                  <div
                    key={i}
                    className={cn(
                      'text-center p-2 rounded-lg',
                      isToday(date) && 'bg-instructor text-instructor-foreground'
                    )}
                  >
                    <div className="text-xs font-medium">
                      {daysOfWeek[date.getDay()]}
                    </div>
                    <div className="text-lg font-bold">{date.getDate()}</div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              <div className="space-y-1">
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 gap-1">
                    <div className="p-2 text-sm text-muted-foreground text-right pr-4">
                      {time}
                    </div>
                    {weekDays.map((date, i) => {
                      const lesson = getLessonForSlot(date, time);
                      
                      return (
                        <div
                          key={i}
                          className={cn(
                            'min-h-[60px] rounded-lg border transition-all cursor-pointer',
                            lesson
                              ? lesson.status === 'confirmed'
                                ? 'bg-instructor/10 border-instructor/30 hover:bg-instructor/20'
                                : 'bg-warning/10 border-warning/30 hover:bg-warning/20'
                              : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                          )}
                        >
                          {lesson && (
                            <div className="p-2 h-full">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={lesson.studentAvatar} />
                                  <AvatarFallback className="text-[10px] bg-instructor text-instructor-foreground">
                                    {lesson.studentName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium truncate">
                                  {lesson.studentName.split(' ')[0]}
                                </span>
                              </div>
                              <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.duration}min
                              </div>
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
              <p className="text-3xl font-bold text-instructor">3</p>
              <p className="text-sm text-muted-foreground">Aulas Agendadas</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 text-center">
              <p className="text-3xl font-bold text-success">4h</p>
              <p className="text-sm text-muted-foreground">Tempo Trabalhado</p>
            </div>
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-3xl font-bold text-foreground">R$ 360</p>
              <p className="text-sm text-muted-foreground">Faturamento do Dia</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
