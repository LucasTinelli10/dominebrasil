import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    if (!user?.id) return;

    // Get archived participant IDs
    const { data: archivedData } = await supabase
      .from('archived_conversations')
      .select('participant_id')
      .eq('user_id', user.id);
    const archivedIds = new Set(archivedData?.map(a => a.participant_id) || []);

    const { data, error } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('receiver_id', user.id)
      .eq('read', false);

    if (!error && data) {
      const unread = data.filter(m => !archivedIds.has(m.sender_id)).length;
      setCount(unread);
    }
  };

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  return count;
}
