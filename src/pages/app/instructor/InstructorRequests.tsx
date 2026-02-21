import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  date: string;
  time_slot: string;
  notes: string;
  created_at: string;
  student_id: string | null;
  student: {
    id: string;
    full_name: string;
    avatar_url: string;
  } | null;
}

export default function InstructorRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LessonRequest | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user?.id]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, date, time_slot, notes, created_at, student_id,
          student:profiles!bookings_student_id_fkey(id, full_name, avatar_url)
        `)
        .eq('instructor_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as unknown as LessonRequest[] || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: LessonRequest) => {
    try {
      // Call edge function to send payment link to student
      const { error: fnError } = await supabase.functions.invoke("send-payment-link", {
        body: { bookingId: request.id },
      });

      if (fnError) {
        console.error("Error sending payment link:", fnError);
        toast.error("Erro ao enviar link de pagamento");
        return;
      }

      // Update booking notes to indicate instructor accepted
      await supabase
        .from('bookings')
        .update({ notes: `Aceito pelo instrutor. Aguardando pagamento do aluno.` })
        .eq('id', request.id);

      setRequests(prev => prev.filter(r => r.id !== request.id));
      
      toast.success('Solicitação aceita!', {
        description: `Um email com link de pagamento foi enviado para ${request.student?.full_name}. Após o pagamento, o chat será liberado.`,
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Erro ao aceitar solicitação');
    }
  };

  const handleReject = async (request: LessonRequest) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', request.id);

      if (error) throw error;

      setRequests(prev => prev.filter(r => r.id !== request.id));
      
      toast.info('Solicitação recusada', {
        description: 'O aluno poderá buscar outro instrutor.',
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Erro ao recusar solicitação');
    }
  };

  const handleOpenChat = async (request: LessonRequest) => {
    setSelectedRequest(request);
    
    // Fetch existing messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${request.student?.id}),and(sender_id.eq.${request.student?.id},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });

    setChatMessages(messages || []);
    setChatOpen(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRequest) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: selectedRequest.student?.id,
          content: message.trim(),
        })
        .select()
        .single();

      if (!error && data) {
        setChatMessages(prev => [...prev, data]);
        setMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-display font-bold">Solicitações de Aulas</h1></div>
        <div className="grid gap-4">
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
        <h1 className="text-2xl font-display font-bold text-foreground">Solicitações de Aulas</h1>
        <p className="text-muted-foreground">Gerencie as solicitações de novos alunos</p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação pendente</h3>
            <p className="text-muted-foreground">Novas solicitações de alunos aparecerão aqui.</p>
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
                        <AvatarImage src={request.student?.avatar_url || ''} />
                        <AvatarFallback className="bg-instructor text-instructor-foreground text-lg">
                          {request.student?.full_name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground text-lg">
                            {request.student?.full_name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(request.created_at)}
                          </span>
                        </div>
                        {request.notes && (
                          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                            "{request.notes}"
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(request.date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{request.time_slot}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col justify-center gap-2 p-4 bg-muted/30 min-w-[160px]">
                    <Button className="flex-1 bg-instructor hover:bg-instructor/90" onClick={() => handleAccept(request)}>
                      <Check className="h-4 w-4 mr-2" />
                      Aceitar
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => handleOpenChat(request)}>
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
                <AvatarImage src={selectedRequest?.student?.avatar_url || ''} />
                <AvatarFallback className="bg-instructor text-instructor-foreground">
                  {selectedRequest?.student?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedRequest?.student?.full_name}</p>
                <p className="text-xs text-muted-foreground font-normal">Aluno</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma mensagem ainda. Inicie a conversa!
                </div>
              )}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2',
                      msg.sender_id === user?.id
                        ? 'bg-instructor text-instructor-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={cn(
                      'text-[10px] mt-1',
                      msg.sender_id === user?.id 
                        ? 'text-instructor-foreground/70' 
                        : 'text-muted-foreground'
                    )}>
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
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
              <Button size="icon" className="bg-instructor hover:bg-instructor/90" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
