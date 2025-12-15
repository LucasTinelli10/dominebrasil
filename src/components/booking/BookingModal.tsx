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
import {
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  Shield,
  Star,
  Loader2,
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

export function BookingModal({ open, onOpenChange, instructor }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"date" | "time" | "confirm">("date");

  const today = startOfToday();
  const maxDate = addDays(today, 30);

  const lessonPrice = instructor?.price_per_hour || BUSINESS_RULES.DEFAULT_LESSON_PRICE;
  const totalPrice = lessonPrice * duration;

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setStep("time");
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("confirm");
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !instructor) return;

    setLoading(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      const { data, error } = await supabase.functions.invoke("create-lesson-checkout", {
        body: {
          instructorId: instructor.id,
          instructorName: instructor.full_name,
          lessonPrice: lessonPrice,
          lessonDate: formattedDate,
          lessonTime: selectedTime,
          duration: duration,
          bookingType: "lesson",
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecionando para pagamento...");
        onOpenChange(false);
        resetModal();
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Erro ao processar reserva. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setSelectedDate(undefined);
    setSelectedTime(null);
    setDuration(1);
    setStep("date");
  };

  const handleBack = () => {
    if (step === "time") {
      setStep("date");
      setSelectedTime(null);
    } else if (step === "confirm") {
      setStep("time");
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
          {/* Step 1: Date Selection */}
          {step === "date" && (
            <div className="space-y-4">
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

              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    className={cn(
                      "h-12",
                      selectedTime === time && "bg-student hover:bg-student/90"
                    )}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
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
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagar {formatCurrency(totalPrice)}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Pagamento seguro via Stripe. Você será redirecionado para concluir.
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
