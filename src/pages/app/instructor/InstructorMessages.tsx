import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Send, MessageSquare, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Conversation {
  participant_id: string;
  participant_name: string;
  participant_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export default function InstructorMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.participant_id);
      subscribeToMessages();
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      // Get archived conversation IDs
      const { data: archivedData } = await supabase
        .from('archived_conversations')
        .select('participant_id')
        .eq('user_id', user?.id);
      const archivedIds = new Set(archivedData?.map(a => a.participant_id) || []);

      // Get unique conversation partners
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

      const participantIds = new Set<string>();
      sentMessages?.forEach(m => participantIds.add(m.receiver_id));
      receivedMessages?.forEach(m => participantIds.add(m.sender_id));

      const convos: Conversation[] = [];
      for (const participantId of participantIds) {
        if (archivedIds.has(participantId)) continue;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', participantId)
          .single();

        if (profile) {
          const allMessages = [
            ...(sentMessages?.filter(m => m.receiver_id === participantId) || []),
            ...(receivedMessages?.filter(m => m.sender_id === participantId) || []),
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          const unread = receivedMessages?.filter(m => m.sender_id === participantId && !m.read).length || 0;

          convos.push({
            participant_id: profile.id,
            participant_name: profile.full_name || 'Usuário',
            participant_avatar: profile.avatar_url || '',
            last_message: allMessages[0]?.content || '',
            last_message_time: allMessages[0]?.created_at || '',
            unread_count: unread,
          });
        }
      }

      setConversations(convos.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      ));

      if (convos.length > 0 && !selectedConversation) {
        setSelectedConversation(convos[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (participantId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      // Mark as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', participantId)
        .eq('receiver_id', user?.id);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('instructor-messages')
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
            (newMsg.sender_id === user?.id && newMsg.receiver_id === selectedConversation?.participant_id) ||
            (newMsg.sender_id === selectedConversation?.participant_id && newMsg.receiver_id === user?.id)
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
        receiver_id: selectedConversation.participant_id,
        content: newMessage.trim(),
      });

    if (!error) {
      setNewMessage('');
      fetchConversations();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in">
        <Card className="w-80 animate-pulse"><CardContent className="p-4"><div className="h-96 bg-muted rounded" /></CardContent></Card>
        <Card className="flex-1 animate-pulse"><CardContent className="p-4"><div className="h-96 bg-muted rounded" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-display font-bold text-lg text-foreground mb-3">Mensagens</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversa..." className="pl-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Nenhuma conversa ainda</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.participant_id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                    selectedConversation?.participant_id === conv.participant_id
                      ? 'bg-instructor/10'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.participant_avatar} />
                      <AvatarFallback className="bg-instructor text-instructor-foreground">
                        {conv.participant_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground truncate">{conv.participant_name}</p>
                      <span className="text-xs text-muted-foreground">{formatTime(conv.last_message_time)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge className="bg-instructor h-5 w-5 p-0 flex items-center justify-center">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation.participant_avatar} />
                <AvatarFallback className="bg-instructor text-instructor-foreground">
                  {selectedConversation.participant_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{selectedConversation.participant_name}</p>
                <p className="text-xs text-muted-foreground">Aluno</p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma mensagem ainda
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2.5',
                        msg.sender_id === user?.id
                          ? 'bg-instructor text-instructor-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      )}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={cn(
                        'text-[10px] mt-1 text-right',
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
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button className="bg-instructor hover:bg-instructor/90" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
