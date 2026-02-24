import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LessonFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  studentName: string;
  verificationCode?: string;
  verificationLat?: number | null;
  verificationLng?: number | null;
  onCompleted: () => void;
}

const STRENGTHS = [
  'Atenção ao trânsito',
  'Controle do veículo',
  'Sinalização correta',
  'Estacionamento',
  'Direção defensiva',
  'Confiança ao volante',
];

const IMPROVEMENTS = [
  'Uso dos espelhos',
  'Troca de marchas',
  'Velocidade inadequada',
  'Falta de atenção',
  'Baliza',
  'Nervosismo',
];

export default function LessonFeedbackModal({
  open,
  onOpenChange,
  bookingId,
  studentName,
  verificationCode,
  verificationLat,
  verificationLng,
  onCompleted,
}: LessonFeedbackModalProps) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('complete_lesson', {
        p_booking_id: bookingId,
        p_rating: rating,
        p_feedback: feedback || null,
        p_strengths: strengths.length > 0 ? strengths : null,
        p_areas_to_improve: improvements.length > 0 ? improvements : null,
      });

      if (error) throw error;

      toast.success('Aula finalizada com sucesso! Saldo creditado.');
      onOpenChange(false);
      onCompleted();
    } catch (error: any) {
      console.error('Error completing lesson:', error);
      toast.error('Erro ao finalizar aula: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Finalizar Aula</DialogTitle>
          <DialogDescription>Avalie a aula de {studentName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Rating */}
          <div>
            <p className="text-sm font-medium mb-2">Avaliação Geral</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      star <= rating ? 'text-warning fill-warning' : 'text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <p className="text-sm font-medium mb-2">Pontos Fortes</p>
            <div className="flex flex-wrap gap-2">
              {STRENGTHS.map((s) => (
                <Badge
                  key={s}
                  variant={strengths.includes(s) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    strengths.includes(s) && 'bg-success hover:bg-success/90'
                  )}
                  onClick={() => toggleItem(s, strengths, setStrengths)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div>
            <p className="text-sm font-medium mb-2">Pontos a Melhorar</p>
            <div className="flex flex-wrap gap-2">
              {IMPROVEMENTS.map((item) => (
                <Badge
                  key={item}
                  variant={improvements.includes(item) ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    improvements.includes(item) && 'bg-warning hover:bg-warning/90 text-warning-foreground'
                  )}
                  onClick={() => toggleItem(item, improvements, setImprovements)}
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <p className="text-sm font-medium mb-2">Observações (opcional)</p>
            <Textarea
              placeholder="Comentários sobre o desempenho do aluno..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            className="w-full bg-instructor hover:bg-instructor/90"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Finalizando...' : 'Finalizar e Creditar Saldo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
