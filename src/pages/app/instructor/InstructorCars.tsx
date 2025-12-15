import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Car, MapPin, Clock, DollarSign, Calendar as CalendarIcon, Check, X, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BUSINESS_RULES, formatCurrency } from '@/lib/businessRules';

interface AvailableCar {
  id: string;
  model: string;
  plate: string;
  price_per_hour: number;
  location_hub: string;
  transmission: 'manual' | 'auto';
  image_url: string;
  photo_exterior_front: string;
}

export default function InstructorCars() {
  const { user } = useAuth();
  const [cars, setCars] = useState<AvailableCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<AvailableCar | null>(null);
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [filterTransmission, setFilterTransmission] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState('');

  const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  useEffect(() => {
    fetchAvailableCars();
  }, []);

  const fetchAvailableCars = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_cars');
      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
      toast.error('Erro ao carregar veículos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleRentCar = async () => {
    if (!selectedCar || !selectedDate || !selectedTimeSlot) {
      toast.error('Selecione data e horário');
      return;
    }

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Check availability
      const { data: isAvailable } = await supabase.rpc('check_availability', {
        check_date: dateStr,
        check_time: selectedTimeSlot,
        instr_id: user?.id,
      });

      if (!isAvailable) {
        toast.error('Este horário não está disponível');
        return;
      }

      // Create rental
      const { error } = await supabase
        .from('car_rentals')
        .insert({
          car_id: selectedCar.id,
          instructor_id: user?.id,
          date: dateStr,
          time_slot: selectedTimeSlot,
          status: 'confirmed',
        });

      if (error) throw error;

      toast.success('Carro alugado com sucesso!', {
        description: `${selectedCar.model} reservado para ${dateStr} às ${selectedTimeSlot}`,
      });
      setRentalDialogOpen(false);
      setSelectedCar(null);
      setSelectedTimeSlot('');
    } catch (error) {
      console.error('Error renting car:', error);
      toast.error('Erro ao alugar carro');
    }
  };

  const filteredCars = cars.filter(car => {
    if (filterTransmission !== 'all' && car.transmission !== filterTransmission) return false;
    if (filterLocation && !car.location_hub?.toLowerCase().includes(filterLocation.toLowerCase())) return false;
    return true;
  });

  // Preço fixo de aluguel - valor tabelado da plataforma
  const rentalPrice = BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-display font-bold">Carros para Alugar</h1></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-muted" />
              <CardContent className="p-4"><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Carros para Alugar</h1>
        <p className="text-muted-foreground">Alugue um carro para dar suas aulas</p>
      </div>

      {/* Fixed Price Info */}
      <Card className="border-instructor/30 bg-instructor/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Info className="h-5 w-5 text-instructor" />
          <p className="text-sm">
            <strong>Preço único tabelado:</strong> Todos os carros da frota custam{' '}
            <span className="font-bold text-instructor">{formatCurrency(rentalPrice)}/hora</span> de aluguel.
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Filtrar por localização..."
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterTransmission} onValueChange={setFilterTransmission}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Transmissão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="auto">Automático</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cars Grid */}
      {filteredCars.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum carro disponível</h3>
            <p className="text-muted-foreground">Não há carros disponíveis com os filtros selecionados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCars.map((car) => (
            <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-muted relative">
                {car.photo_exterior_front || car.image_url ? (
                  <img
                    src={car.photo_exterior_front || car.image_url}
                    alt={car.model}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <Badge
                  className={cn(
                    "absolute top-2 right-2",
                    car.transmission === 'auto' ? 'bg-primary' : 'bg-secondary'
                  )}
                >
                  {car.transmission === 'auto' ? 'Automático' : 'Manual'}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{car.model}</h3>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{car.location_hub || 'Localização não informada'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold text-instructor">{formatCurrency(rentalPrice)}/hora</span>
                    <Badge variant="outline" className="text-xs">Preço fixo</Badge>
                  </div>
                </div>
                <Button
                  className="w-full bg-instructor hover:bg-instructor/90"
                  onClick={() => {
                    setSelectedCar(car);
                    setRentalDialogOpen(true);
                  }}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Alugar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rental Dialog */}
      <Dialog open={rentalDialogOpen} onOpenChange={setRentalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alugar {selectedCar?.model}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Selecione a data:</p>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Selecione o horário:</p>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTimeSlot === slot ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={cn(
                      selectedTimeSlot === slot && 'bg-instructor hover:bg-instructor/90'
                    )}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>

            {selectedCar && selectedDate && selectedTimeSlot && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Resumo do Aluguel:</p>
                  <div className="space-y-1 text-sm">
                    <p>Carro: {selectedCar.model}</p>
                    <p>Data: {selectedDate.toLocaleDateString('pt-BR')}</p>
                    <p>Horário: {selectedTimeSlot}</p>
                    <p className="font-semibold text-instructor">
                      Valor: {formatCurrency(rentalPrice)} (preço fixo)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRentalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-instructor hover:bg-instructor/90"
              onClick={handleRentCar}
              disabled={!selectedDate || !selectedTimeSlot}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar Aluguel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}