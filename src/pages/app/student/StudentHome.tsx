import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Search, Calendar, BookOpen, MessageSquare, Star, Clock, ArrowRight } from 'lucide-react';
import { studentProgress, studentLessons, availableInstructors } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function StudentHome() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-student/10 to-student/5 border-student/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Progresso Teórico</p>
              <BookOpen className="h-5 w-5 text-student" />
            </div>
            <Progress value={studentProgress.theoryProgress} className="h-2 mb-2" />
            <p className="text-2xl font-bold">{studentProgress.theoryProgress}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Aulas Práticas</p>
              <Calendar className="h-5 w-5 text-student" />
            </div>
            <Progress value={(studentProgress.completedLessons / studentProgress.totalLessons) * 100} className="h-2 mb-2" />
            <p className="text-2xl font-bold">{studentProgress.completedLessons}/{studentProgress.totalLessons}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximas Aulas</p>
                <p className="text-2xl font-bold mt-2">{studentProgress.upcomingLessons}</p>
              </div>
              <div className="p-3 rounded-xl bg-student/10"><Clock className="h-6 w-6 text-student" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/app/student/messages')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mensagens</p>
                <p className="text-2xl font-bold mt-2">2 novas</p>
              </div>
              <div className="p-3 rounded-xl bg-student/10"><MessageSquare className="h-6 w-6 text-student" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Lessons & Instructors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Minhas Aulas Agendadas</CardTitle>
            <Button variant="ghost" size="sm" className="text-student">Ver todas <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentLessons.map((lesson) => (
              <div key={lesson.id} className="p-4 rounded-lg bg-student-accent/30 border border-student/20">
                <div className="flex items-center gap-3">
                  <Avatar><AvatarImage src={lesson.instructorAvatar} /><AvatarFallback className="bg-student text-student-foreground">{lesson.instructorName.charAt(0)}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{lesson.instructorName}</p>
                    <p className="text-sm text-muted-foreground">{new Date(lesson.date).toLocaleDateString('pt-BR')} às {lesson.time}</p>
                  </div>
                  <Badge variant="outline" className="border-student text-student">{lesson.duration}min</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Instrutores Recomendados</CardTitle>
            <Button variant="ghost" size="sm" className="text-student" onClick={() => navigate('/app/student/search')}>Ver mais <ArrowRight className="ml-1 h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableInstructors.slice(0, 2).map((instructor) => (
              <div key={instructor.id} className="p-4 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12"><AvatarImage src={instructor.avatar} /><AvatarFallback className="bg-student text-student-foreground">{instructor.name.charAt(0)}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{instructor.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 text-warning fill-warning" />{instructor.rating} · {instructor.totalLessons} aulas
                    </div>
                  </div>
                  <p className="font-bold text-student">R${instructor.pricePerHour}/h</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
