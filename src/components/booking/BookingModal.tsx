import { useState } from "react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  Shield,
  Star,
  Loader2,
  GraduationCap,
  Heart,
  Lock,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS_RULES, formatCurrency } from "@/lib/businessRules";

interface Instructor {
  id: string;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  price_per_hour: number;
  rating: number | null;
  bio: string | null;
}

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: Instructor | null;
}

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

type LessonType = "primeira_cnh" | "perder_medo";

export function BookingModal({ open, onOpenChange, instructor }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"type" | "datetime" | "confirm">("type");
  const [lessonType, setLessonType] = useState<LessonType>("primeira_cnh");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const today = startOfToday();
  const maxDate = addDays(today, 30);

  const lessonPrice = instructor?.price_per_hour || BUSINESS_RULES.DEFAULT_LESSON_PRICE;
  const totalPrice = lessonPrice * duration;

  const handleTypeSelect = () => {
    setStep("datetime");
  };

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (date && instructor) {
      setLoadingSlots(true);
      
      // Check availability for each time slot
      const dateStr = format(date, "yyyy-MM-dd");
      const available: string[] = [];
      
      for (const time of TIME_SLOTS) {
        const { data } = await supabase.rpc('check_availability', {
          check_date: dateStr,
          check_time: time,
          instr_id: instructor.id,
        });
        if (data === true) {
          available.push(time);
        }
      }
      
      setAvailableSlots(available);
      setLoadingSlots(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleContinueToConfirm = () => {
    if (selectedDate && selectedTime) {
      setStep("confirm");
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !instructor) return;

    setLoading(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado para solicitar uma aula");
        return;
      }

      // Get student name
      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const studentName = studentProfile?.full_name || "Aluno";

      // Create booking with status "pending" (request, not yet paid)
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          student_id: user.id,
          instructor_id: instructor.id,
          date: formattedDate,
          time_slot: selectedTime,
          total_price: lessonPrice * duration,
          status: "pending",
          notes: `Tipo: ${lessonType}. Duração: ${duration}h. Aguardando aprovação do instrutor.`,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Notify instructor via edge function
      await supabase.functions.invoke("notify-lesson-request", {
        body: {
          bookingId: booking.id,
          studentName: studentName,
          instructorId: instructor.id,
          lessonDate: formattedDate,
          lessonTime: selectedTime,
          lessonType: lessonType,
        },
      });

      toast.success("Solicitação enviada!", {
        description: `O instrutor ${instructor.full_name} receberá sua solicitação e entrará em contato.`,
      });
      
      onOpenChange(false);
      resetModal();
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setSelectedDate(undefined);
    setSelectedTime(null);
    setDuration(1);
    setStep("type");
    setLessonType("primeira_cnh");
    setAvailableSlots([]);
  };

  const handleBack = () => {
    if (step === "datetime") {
      setStep("type");
      setSelectedDate(undefined);
      setSelectedTime(null);
    } else if (step === "confirm") {
      setStep("datetime");
    }
  };

  if (!instructor) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetModal();
    }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={instructor.avatar_url || undefined} />
              <AvatarFallback className="bg-student text-student-foreground">
                {instructor.full_name?.charAt(0) || "I"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span>{instructor.full_name}</span>
                <Shield className="h-4 w-4 text-student" />
              </div>
              <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                {instructor.rating && (
                  <>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{instructor.rating.toFixed(1)}</span>
                  </>
                )}
                <span>•</span>
                <span>{formatCurrency(lessonPrice)}/hora</span>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Agende sua aula de direção
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {/* Step 0: Lesson Type Selection */}
          {step === "type" && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg mb-1">Qual é o seu objetivo?</h3>
                <p className="text-sm text-muted-foreground">
                  Escolha o tipo de aula que melhor atende suas necessidades
                </p>
              </div>

              <RadioGroup
                value={lessonType}
                onValueChange={(value) => setLessonType(value as LessonType)}
                className="space-y-3"
              >
                <div 
                  className={cn(
                    "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    lessonType === "primeira_cnh" 
                      ? "border-student bg-student/5" 
                      : "border-border hover:border-student/50"
                  )}
                  onClick={() => setLessonType("primeira_cnh")}
                >
                  <RadioGroupItem value="primeira_cnh" id="primeira_cnh" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="primeira_cnh" className="flex items-center gap-2 cursor-pointer font-medium">
                      <GraduationCap className="h-5 w-5 text-student" />
                      Primeira CNH
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Estou tirando minha primeira habilitação e preciso de aulas práticas para o exame
                    </p>
                  </div>
                </div>

                <div 
                  className={cn(
                    "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    lessonType === "perder_medo" 
                      ? "border-student bg-student/5" 
                      : "border-border hover:border-student/50"
                  )}
                  onClick={() => setLessonType("perder_medo")}
                >
                  <RadioGroupItem value="perder_medo" id="perder_medo" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="perder_medo" className="flex items-center gap-2 cursor-pointer font-medium">
                      <Heart className="h-5 w-5 text-rose-500" />
                      Perder o Medo de Dirigir
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Já tenho CNH mas não dirijo por insegurança ou falta de prática
                    </p>
                  </div>
                </div>
              </RadioGroup>

              <Button
                className="w-full bg-student hover:bg-student/90 mt-4"
                onClick={handleTypeSelect}
              >
                Continuar
              </Button>
            </div>
          )}

          {/* Step 1: Date Selection */}
          {step === "date" && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
                ← Voltar
              </Button>

              <div className="text-center mb-2">
                <Badge variant="outline" className="text-xs">
                  {lessonType === "primeira_cnh" ? "📚 1ª CNH" : "💪 Perder o Medo"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="h-4 w-4" />
                <span>Selecione a data</span>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => isBefore(date, today) || isBefore(maxDate, date)}
                locale={ptBR}
                className="rounded-md border mx-auto"
              />
            </div>
          )}

          {/* Step 2: Time Selection */}
          {step === "time" && selectedDate && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
                ← Voltar
              </Button>
              
              <div className="text-center mb-4">
                <Badge variant="secondary" className="text-sm">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                <span>Selecione o horário</span>
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-student" />
                  <span className="ml-2 text-muted-foreground">Verificando horários...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhum horário disponível nesta data</p>
                  <Button variant="outline" className="mt-4" onClick={handleBack}>
                    Escolher outra data
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((time) => {
                    const isAvailable = availableSlots.includes(time);
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className={cn(
                          "h-12",
                          selectedTime === time && "bg-student hover:bg-student/90",
                          !isAvailable && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => isAvailable && handleTimeSelect(time)}
                        disabled={!isAvailable}
                      >
                        {time}
                        {!isAvailable && <Lock className="h-3 w-3 ml-1" />}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === "confirm" && selectedDate && selectedTime && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
                ← Voltar
              </Button>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <h4 className="font-medium">Resumo da Reserva</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de Aula</span>
                    <Badge variant="outline" className="font-medium">
                      {lessonType === "primeira_cnh" ? "📚 1ª CNH" : "💪 Perder o Medo"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instrutor</span>
                    <span className="font-medium">{instructor.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">
                      {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    <span>Duração da aula</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2].map((hours) => (
                      <Button
                        key={hours}
                        variant={duration === hours ? "default" : "outline"}
                        className={cn(
                          "flex-1",
                          duration === hours && "bg-student hover:bg-student/90"
                        )}
                        onClick={() => setDuration(hours)}
                      >
                        {hours}h
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {formatCurrency(lessonPrice)} × {duration}h
                  </span>
                  <span className="text-2xl font-bold text-student">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-student hover:bg-student/90 h-12"
                onClick={handleConfirmBooking}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Solicitar Aula
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Após o instrutor aceitar, você receberá um link de pagamento por email.
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
