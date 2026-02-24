import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook that listens to real-time booking status changes for the current student.
 * Shows toast notifications when an instructor starts or finishes a lesson.
 */
export function useBookingRealtime() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user?.id || profile?.role !== 'student') return;

    const channel = supabase
      .channel('student-booking-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;

          if (oldStatus === newStatus) return;

          if (newStatus === 'in_progress') {
            toast.info('🚗 Sua aula foi iniciada pelo instrutor!', {
              description: 'Boas práticas! Foque na aula.',
              duration: 8000,
            });
          } else if (newStatus === 'completed') {
            toast.success('✅ Sua aula foi finalizada!', {
              description: 'Avalie seu instrutor no Histórico de Aulas.',
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.role]);
}
