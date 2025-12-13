import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Camera,
  Car,
  Upload,
  Star,
  Check,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const availableBadges = [
  'Paciente', 'Pontual', 'Didático', 'Experiente', 'Atencioso', 'Técnico', 'Calmo'
];

export default function InstructorProfile() {
  const { profile } = useAuth();
  const [bio, setBio] = useState(
    'Instrutor certificado há 8 anos com mais de 500 alunos formados. Especialista em alunos nervosos e primeira habilitação. Metodologia focada em confiança e segurança.'
  );
  const [pricePerHour, setPricePerHour] = useState('120');
  const [selectedBadges, setSelectedBadges] = useState(['Paciente', 'Pontual', 'Didático']);
  const [hasOwnCar, setHasOwnCar] = useState(true);

  const handleSave = () => {
    toast.success('Perfil atualizado com sucesso!');
  };

  const toggleBadge = (badge: string) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter(b => b !== badge));
    } else if (selectedBadges.length < 5) {
      setSelectedBadges([...selectedBadges, badge]);
    } else {
      toast.error('Máximo de 5 badges permitidos');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Perfil Profissional
          </h1>
          <p className="text-muted-foreground">
            Configure seu perfil público para atrair mais alunos
          </p>
        </div>
        <Button className="bg-instructor hover:bg-instructor/90" onClick={handleSave}>
          <Check className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photo and Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-instructor text-instructor-foreground text-3xl">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-instructor hover:bg-instructor/90"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Clique para alterar sua foto de perfil
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-bold text-foreground">4.9</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'h-5 w-5',
                        star <= 4 ? 'text-warning fill-warning' : 'text-warning/50'
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Baseado em 86 avaliações
              </p>
              <div className="mt-4 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-xs w-3">{rating}</span>
                    <Star className="h-3 w-3 text-warning fill-warning" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full"
                        style={{
                          width: rating === 5 ? '75%' : rating === 4 ? '20%' : '5%',
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">
                      {rating === 5 ? '75%' : rating === 4 ? '20%' : '5%'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Bio and Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Informações Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio">Sobre mim</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Descreva sua experiência e metodologia de ensino..."
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 caracteres
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Valor por hora (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(e.target.value)}
                    className="text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de câmbio</Label>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className="flex-1 justify-center py-2 cursor-pointer border-instructor text-instructor"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Automático
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex-1 justify-center py-2 cursor-pointer border-instructor text-instructor"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Manual
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Diferenciais (máximo 5)</Label>
                <div className="flex flex-wrap gap-2">
                  {availableBadges.map((badge) => (
                    <Badge
                      key={badge}
                      variant={selectedBadges.includes(badge) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all',
                        selectedBadges.includes(badge)
                          ? 'bg-instructor hover:bg-instructor/90'
                          : 'hover:border-instructor hover:text-instructor'
                      )}
                      onClick={() => toggleBadge(badge)}
                    >
                      {selectedBadges.includes(badge) ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Plus className="h-3 w-3 mr-1" />
                      )}
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Car className="h-5 w-5" />
                Meu Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Usar veículo próprio</p>
                  <p className="text-sm text-muted-foreground">
                    Marque se você possui carro para as aulas
                  </p>
                </div>
                <Switch checked={hasOwnCar} onCheckedChange={setHasOwnCar} />
              </div>

              {hasOwnCar && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carModel">Modelo do veículo</Label>
                    <Input id="carModel" placeholder="Ex: Toyota Corolla 2023" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carPlate">Placa</Label>
                    <Input id="carPlate" placeholder="ABC-1234" />
                  </div>
                </div>
              )}

              {hasOwnCar && (
                <div className="space-y-2">
                  <Label>Fotos do veículo</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {['Frente', 'Lateral', 'Interior'].map((label) => (
                      <div
                        key={label}
                        className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-instructor hover:bg-instructor/5 transition-all"
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!hasOwnCar && (
                <div className="p-4 rounded-lg bg-instructor/10 border border-instructor/20">
                  <p className="text-sm text-foreground">
                    Sem veículo próprio? Sem problemas! Você poderá alugar carros da nossa frota
                    de investidores por R$50/hora durante as aulas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
