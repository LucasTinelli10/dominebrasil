import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Calendar, Clock, Car, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Conversation {
  instructor_id: string;
  instructor_name: string;
  instructor_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  booking?: {
    date: string;
    time_slot: string;
    car_model?: string;
  };
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export default function StudentMessages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
      const instructorId = searchParams.get('instructor');
      if (instructorId) {
        loadConversationByInstructor(instructorId);
      }
    }
  }, [user?.id, searchParams]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.instructor_id);
      subscribeToMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchConversations = async () => {
    try {
      // Get unique conversations with last message
      const { data: sentMessages } = await supabase
        .from('messages')
        .select('receiver_id, content, created_at')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false });

      const { data: receivedMessages } = await supabase
        .from('messages')
        .select('sender_id, content, created_at, read')
        .eq('receiver_id', user?.id)
        .order('created_at', { ascending: false });

      // Get unique instructor IDs
      const instructorIds = new Set<string>();
      sentMessages?.forEach(m => instructorIds.add(m.receiver_id));
      receivedMessages?.forEach(m => instructorIds.add(m.sender_id));

      // Fetch instructor details and build conversations
      const convos: Conversation[] = [];
      for (const instructorId of instructorIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', instructorId)
          .single();

        if (profile) {
          const allMessages = [
            ...(sentMessages?.filter(m => m.receiver_id === instructorId) || []),
            ...(receivedMessages?.filter(m => m.sender_id === instructorId) || []),
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          const unread = receivedMessages?.filter(m => m.sender_id === instructorId && !m.read).length || 0;

          // Get active booking with this instructor
          const { data: booking } = await supabase
            .from('bookings')
            .select('date, time_slot, car:cars(model)')
            .eq('student_id', user?.id)
            .eq('instructor_id', instructorId)
            .eq('status', 'confirmed')
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(1)
            .single();

          convos.push({
            instructor_id: profile.id,
            instructor_name: profile.full_name || 'Instrutor',
            instructor_avatar: profile.avatar_url || '',
            last_message: allMessages[0]?.content || '',
            last_message_time: allMessages[0]?.created_at || '',
            unread_count: unread,
            booking: booking ? {
              date: booking.date,
              time_slot: booking.time_slot,
              car_model: (booking.car as any)?.model,
            } : undefined,
          });
        }
      }

      setConversations(convos.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      ));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationByInstructor = async (instructorId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', instructorId)
      .single();

    if (profile) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('date, time_slot, car:cars(model)')
        .eq('student_id', user?.id)
        .eq('instructor_id', instructorId)
        .eq('status', 'confirmed')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(1)
        .single();

      setSelectedConversation({
        instructor_id: profile.id,
        instructor_name: profile.full_name || 'Instrutor',
        instructor_avatar: profile.avatar_url || '',
        last_message: '',
        last_message_time: '',
        unread_count: 0,
        booking: booking ? {
          date: booking.date,
          time_slot: booking.time_slot,
          car_model: (booking.car as any)?.model,
        } : undefined,
      });
    }
  };

  const fetchMessages = async (instructorId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${instructorId}),and(sender_id.eq.${instructorId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
      // Mark as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', instructorId)
        .eq('receiver_id', user?.id);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('student-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === user?.id && newMsg.receiver_id === selectedConversation?.instructor_id) ||
            (newMsg.sender_id === selectedConversation?.instructor_id && newMsg.receiver_id === user?.id)
          ) {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user?.id,
        receiver_id: selectedConversation.instructor_id,
        content: newMessage.trim(),
      });

    if (error) {
      toast.error('Erro ao enviar mensagem');
    } else {
      setNewMessage('');
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Conversations List */}
        <Card className={cn("md:col-span-1", selectedConversation && "hidden md:block")}>
          <CardHeader className="pb-3">
            <CardTitle>Conversas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-14rem)]">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>Nenhuma conversa ainda</p>
                </div>
              ) : (
                conversations.map((convo) => (
                  <div
                    key={convo.instructor_id}
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b",
                      selectedConversation?.instructor_id === convo.instructor_id && "bg-student/10"
                    )}
                    onClick={() => setSelectedConversation(convo)}
                  >
                    <Avatar>
                      <AvatarImage src={convo.instructor_avatar} />
                      <AvatarFallback className="bg-student text-student-foreground">
                        {convo.instructor_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{convo.instructor_name}</p>
                        {convo.unread_count > 0 && (
                          <Badge className="bg-student">{convo.unread_count}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{convo.last_message}</p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className={cn("md:col-span-2 flex flex-col", !selectedConversation && "hidden md:flex")}>
          {selectedConversation ? (
            <>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={selectedConversation.instructor_avatar} />
                    <AvatarFallback className="bg-student text-student-foreground">
                      {selectedConversation.instructor_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedConversation.instructor_name}</p>
                    <p className="text-xs text-muted-foreground">Instrutor</p>
                  </div>
                </div>

                {/* Lesson Info Card */}
                {selectedConversation.booking && (
                  <div className="mt-3 p-3 rounded-lg bg-student/10 border border-student/20">
                    <p className="text-xs font-medium text-student mb-2">Próxima Aula</p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(selectedConversation.booking.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {selectedConversation.booking.time_slot}
                      </div>
                      {selectedConversation.booking.car_model && (
                        <div className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {selectedConversation.booking.car_model}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_id === user?.id ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2",
                          msg.sender_id === user?.id
                            ? "bg-student text-student-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={cn(
                          "text-[10px] mt-1",
                          msg.sender_id === user?.id ? "text-student-foreground/70" : "text-muted-foreground"
                        )}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    className="bg-student hover:bg-student/90"
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Selecione uma conversa para começar</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}