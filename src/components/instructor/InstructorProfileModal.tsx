import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Shield,
  MapPin,
  Clock,
  CalendarDays,
  Award,
  Car,
} from "lucide-react";
import { formatCurrency } from "@/lib/businessRules";

interface Instructor {
  id: string;
  full_name: string;
  city: string | null;
  avatar_url: string | null;
  price_per_hour: number;
  rating: number | null;
  bio: string | null;
  years_experience: number | null;
  badges: string[] | null;
}

interface InstructorProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: Instructor | null;
  onBookNow: () => void;
}

const BADGE_LABELS: Record<string, string> = {
  paciente: "Paciente",
  pontual: "Pontual",
  didatico: "Didático",
  experiente: "Experiente",
  calmo: "Calmo",
  atencioso: "Atencioso",
  profissional: "Profissional",
  amigavel: "Amigável",
};

export function InstructorProfileModal({
  open,
  onOpenChange,
  instructor,
  onBookNow,
}: InstructorProfileModalProps) {
  if (!instructor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil do Instrutor</DialogTitle>
        </DialogHeader>

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center pb-4">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={instructor.avatar_url || undefined} />
            <AvatarFallback className="bg-teal-600 text-white text-2xl">
              {instructor.full_name?.charAt(0) || "I"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold">{instructor.full_name}</h2>
            <Shield className="h-5 w-5 text-teal-500" />
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span>{instructor.city || "Localização não informada"}</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {instructor.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-medium">{instructor.rating.toFixed(1)}</span>
              </div>
            )}
            {instructor.years_experience && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{instructor.years_experience} anos de experiência</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Bio Section */}
        {instructor.bio && (
          <div className="py-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-teal-600" />
              Sobre o Instrutor
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {instructor.bio}
            </p>
          </div>
        )}

        {/* Badges/Qualities */}
        {instructor.badges && instructor.badges.length > 0 && (
          <div className="py-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-teal-600" />
              Qualidades
            </h3>
            <div className="flex flex-wrap gap-2">
              {instructor.badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-teal-50 text-teal-700 border-teal-200"
                >
                  {BADGE_LABELS[badge] || badge}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Pricing & CTA */}
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor da aula</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-teal-600">
                  {formatCurrency(instructor.price_per_hour)}
                </span>
                <span className="text-muted-foreground">/hora</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              <span>Veículo com duplo comando</span>
            </div>
          </div>

          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 h-12"
            onClick={onBookNow}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Agendar Aula
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Instrutor verificado pelo Detran • Veículo regularizado
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
