import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudentRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  instructorName: string;
  onCompleted: () => void;
}

export default function StudentRatingModal({
  open,
  onOpenChange,
  bookingId,
  instructorName,
  onCompleted,
}: StudentRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lesson_feedback')
        .update({ rating })
        .eq('booking_id', bookingId);

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso!');
      onOpenChange(false);
      onCompleted();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error('Erro ao enviar avaliação: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Avaliar Instrutor</DialogTitle>
          <DialogDescription>Como foi sua aula com {instructorName}?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-10 w-10 transition-colors',
                    star <= rating ? 'text-warning fill-warning' : 'text-muted-foreground'
                  )}
                />
              </button>
            ))}
          </div>

          <Button
            className="w-full bg-student hover:bg-student/90"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
