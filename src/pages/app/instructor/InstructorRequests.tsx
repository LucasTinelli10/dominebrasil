import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  X,
  MessageSquare,
  Calendar,
  Clock,
  Car,
  Send,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LessonRequest {
  id: string;
  studentName: string;
  studentId: string;
  studentAvatar: string;
  message: string;
  requestedDate: string;
  requestedTime: string;
  transmission: string;
  createdAt: string;
}

// Mock data for now
const initialRequests: LessonRequest[] = [
  {
    id: '1',
    studentName: 'Pedro Oliveira',
    studentId: 'student-1',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    message: 'Olá! Estou buscando um instrutor paciente para aulas de direção. Tenho CNH mas não dirijo há 5 anos.',
    requestedDate: '2024-01-17',
    requestedTime: '10:00',
    transmission: 'automatic',
    createdAt: '2024-01-14T10:30:00',
  },
  {
    id: '2',
    studentName: 'Carla Mendes',
    studentId: 'student-2',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    message: 'Preciso de aulas para tirar minha primeira habilitação. Disponível pela manhã.',
    requestedDate: '2024-01-18',
    requestedTime: '08:00',
    transmission: 'manual',
    createdAt: '2024-01-14T14:15:00',
  },
  {
    id: '3',
    studentName: 'Lucas Ferreira',
    studentId: 'student-3',
    studentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    message: 'Quero melhorar minhas habilidades em estacionamento e baliza.',
    requestedDate: '2024-01-19',
    requestedTime: '15:00',
    transmission: 'automatic',
    createdAt: '2024-01-14T16:45:00',
  },
];

export default function InstructorRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LessonRequest[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<LessonRequest | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const handleAccept = async (request: LessonRequest) => {
    // Send automatic acceptance message
    const acceptanceMessage = `Olá ${request.studentName.split(' ')[0]}! Sua solicitação de aula foi aceita. 🎉\n\nDetalhes:\n📅 Data: ${new Date(request.requestedDate + 'T00:00:00').toLocaleDateString('pt-BR')}\n⏰ Horário: ${request.requestedTime}\n\nNos vemos em breve!`;

    try {
      // In a real app, this would send to the actual student
      await supabase.from('messages').insert({
        sender_id: user?.id,
        receiver_id: request.studentId,
        content: acceptanceMessage,
      });
    } catch (error) {
      console.log('Message will be sent when student ID is valid');
    }

    // Remove from list
    setRequests(prev => prev.filter(r => r.id !== request.id));
    
    toast.success('Solicitação aceita!', {
      description: `Mensagem automática enviada para ${request.studentName}`,
    });
  };

  const handleReject = (request: LessonRequest) => {
    // Remove from list immediately
    setRequests(prev => prev.filter(r => r.id !== request.id));
    
    toast.info('Solicitação recusada', {
      description: 'O aluno poderá buscar outro instrutor.',
    });
  };

  const handleOpenChat = (request: LessonRequest) => {
    setSelectedRequest(request);
    setChatMessages([
      {
        id: '1',
        senderId: request.studentId,
        message: request.message,
        timestamp: request.createdAt,
      }
    ]);
    setChatOpen(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRequest) return;
    
    const newMessage = {
      id: String(chatMessages.length + 1),
      senderId: 'instructor',
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setMessage('');

    try {
      await supabase.from('messages').insert({
        sender_id: user?.id,
        receiver_id: selectedRequest.studentId,
        content: message.trim(),
      });
    } catch (error) {
      console.log('Message stored locally');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Agora mesmo';
    if (hours < 24) return `Há ${hours}h`;
    return `Há ${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Solicitações de Aulas
        </h1>
        <p className="text-muted-foreground">
          Gerencie as solicitações de novos alunos
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação pendente</h3>
            <p className="text-muted-foreground">
              Novas solicitações de alunos aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Student Info */}
                  <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-border">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={request.studentAvatar} />
                        <AvatarFallback className="bg-instructor text-instructor-foreground text-lg">
                          {request.studentName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground text-lg">
                            {request.studentName}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(request.createdAt)}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                          "{request.message}"
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(request.requestedDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{request.requestedTime}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            <Car className="h-3 w-3 mr-1" />
                            {request.transmission === 'automatic' ? 'Automático' : 'Manual'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col justify-center gap-2 p-4 bg-muted/30 min-w-[160px]">
                    <Button
                      className="flex-1 bg-instructor hover:bg-instructor/90"
                      onClick={() => handleAccept(request)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aceitar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleOpenChat(request)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(request)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Recusar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedRequest?.studentAvatar} />
                <AvatarFallback className="bg-instructor text-instructor-foreground">
                  {selectedRequest?.studentName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedRequest?.studentName}</p>
                <p className="text-xs text-muted-foreground font-normal">Online agora</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.senderId === 'instructor' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2',
                      msg.senderId === 'instructor'
                        ? 'bg-instructor text-instructor-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    )}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={cn(
                      'text-[10px] mt-1',
                      msg.senderId === 'instructor' 
                        ? 'text-instructor-foreground/70' 
                        : 'text-muted-foreground'
                    )}>
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button
                size="icon"
                className="bg-instructor hover:bg-instructor/90"
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}