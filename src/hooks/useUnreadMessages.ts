import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First tone
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 830;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.15);

    // Second tone (higher, slight delay)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 1100;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    osc2.start(audioContext.currentTime + 0.12);
    osc2.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Audio not supported or blocked by browser policy
  }
}

export function useUnreadMessages() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const prevCountRef = useRef(0);
  const initializedRef = useRef(false);

  const fetchCount = useCallback(async () => {
    if (!user?.id) return;

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
      
      // Play sound only when count increases (not on initial load)
      if (initializedRef.current && unread > prevCountRef.current) {
        playNotificationSound();
      }
      
      prevCountRef.current = unread;
      initializedRef.current = true;
      setCount(unread);
    }
  }, [user?.id]);

  useEffect(() => {
    initializedRef.current = false;
    fetchCount();

    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchCount();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchCount]);

  return count;
}
