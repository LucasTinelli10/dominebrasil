import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { lessonRequests, chatMessages } from '@/data/mockData';
import { toast } from 'sonner';

export default function InstructorRequests() {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [localMessages, setLocalMessages] = useState(chatMessages);

  const handleAccept = (id: string) => {
    toast.success('Solicitação aceita com sucesso!', {
      description: 'O aluno será notificado.',
    });
  };

  const handleReject = (id: string) => {
    toast.info('Solicitação recusada.', {
      description: 'O aluno poderá buscar outro instrutor.',
    });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: String(localMessages.length + 1),
      senderId: 'instructor-1',
      receiverId: 'student-1',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setLocalMessages([...localMessages, newMessage]);
    setMessage('');
    toast.success('Mensagem enviada!');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
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

      <div className="grid gap-4">
        {lessonRequests.map((request) => (
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
                    onClick={() => handleAccept(request.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aceitar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedRequest(request.id);
                      setChatOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleReject(request.id)}
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

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={lessonRequests[0]?.studentAvatar} />
                <AvatarFallback className="bg-instructor text-instructor-foreground">
                  P
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {lessonRequests.find(r => r.id === selectedRequest)?.studentName || 'Aluno'}
                </p>
                <p className="text-xs text-muted-foreground font-normal">Online agora</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {localMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.senderId === 'instructor-1' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2',
                      msg.senderId === 'instructor-1'
                        ? 'bg-instructor text-instructor-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    )}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={cn(
                      'text-[10px] mt-1',
                      msg.senderId === 'instructor-1' 
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
