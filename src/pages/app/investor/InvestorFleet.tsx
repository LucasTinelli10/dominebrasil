import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Car, Plus, Edit, Calendar as CalendarIcon } from 'lucide-react';
import AddCarWizard from '@/components/investor/AddCarWizard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FleetCar {
  id: string;
  model: string;
  plate: string;
  price_per_hour: number | null;
  available: boolean | null;
  verification_status: string | null;
  transmission: string | null;
}

interface Rental {
  id: string;
  car_id: string;
  date: string;
  time_slot: string;
  status: string | null;
  instructor_name?: string;
}

export default function InvestorFleet() {
  const { user } = useAuth();
  const [cars, setCars] = useState<FleetCar[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCarOpen, setAddCarOpen] = useState(false);
  const [editCarOpen, setEditCarOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<FleetCar | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editPrice, setEditPrice] = useState('');
  const [editAvailable, setEditAvailable] = useState('available');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) fetchFleet();
  }, [user?.id]);

  const fetchFleet = async () => {
    setLoading(true);
    const { data: carsData } = await supabase
      .from('cars')
      .select('id, model, plate, price_per_hour, available, verification_status, transmission')
      .eq('owner_id', user?.id)
      .order('created_at', { ascending: false });

    setCars(carsData || []);

    const carIds = (carsData || []).map((c) => c.id);
    if (carIds.length) {
      const { data: rentalsData } = await supabase
        .from('car_rentals')
        .select('id, car_id, date, time_slot, status, instructor:profiles!car_rentals_instructor_id_fkey(full_name)')
        .in('car_id', carIds);

      setRentals(
        (rentalsData || []).map((r: any) => ({
          id: r.id,
          car_id: r.car_id,
          date: r.date,
          time_slot: r.time_slot,
          status: r.status,
          instructor_name: r.instructor?.full_name || 'Instrutor',
        }))
      );
    } else {
      setRentals([]);
    }
    setLoading(false);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const getStatusBadge = (car: FleetCar) => {
    if (car.verification_status !== 'approved') {
      const cfg =
        car.verification_status === 'rejected'
          ? { l: 'Reprovado', c: 'bg-destructive' }
          : car.verification_status === 'analyzing'
          ? { l: 'Em Análise', c: 'bg-warning' }
          : { l: 'Pendente', c: 'bg-muted' };
      return <Badge className={cfg.c}>{cfg.l}</Badge>;
    }
    return car.available ? (
      <Badge className="bg-success">Disponível</Badge>
    ) : (
      <Badge className="bg-muted">Indisponível</Badge>
    );
  };

  const handleEditCar = (car: FleetCar) => {
    setSelectedCar(car);
    setEditPrice(String(car.price_per_hour ?? ''));
    setEditAvailable(car.available ? 'available' : 'unavailable');
    setEditCarOpen(true);
  };

  const handleSaveCar = async () => {
    if (!selectedCar) return;
    setSaving(true);
    const { error } = await supabase
      .from('cars')
      .update({
        price_per_hour: editPrice ? Number(editPrice) : null,
        available: editAvailable === 'available',
      })
      .eq('id', selectedCar.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Veículo atualizado' });
    setEditCarOpen(false);
    fetchFleet();
  };

  const handleViewCalendar = (car: FleetCar) => {
    setSelectedCar(car);
    setCalendarOpen(true);
  };

  const toLocalISO = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const getRentalsForDate = (carId: string, date: Date) =>
    rentals.filter((r) => r.car_id === carId && r.date === toLocalISO(date) && r.status !== 'cancelled');

  const hasRentalsOnDate = (carId: string, date: Date) => getRentalsForDate(carId, date).length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Gestão de Frota</h1>
          <p className="text-muted-foreground">Gerencie seus veículos cadastrados</p>
        </div>
        <Button className="bg-investor hover:bg-investor/90" onClick={() => setAddCarOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Veículo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="py-12 text-center">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum veículo cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Cadastre seu primeiro veículo para começar a gerar receita.
              </p>
              <Button className="bg-investor hover:bg-investor/90" onClick={() => setAddCarOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Veículo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Câmbio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor/Hora</TableHead>
                  <TableHead>Aluguéis</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-investor" />
                        {car.model}
                      </div>
                    </TableCell>
                    <TableCell>{car.plate}</TableCell>
                    <TableCell>{car.transmission === 'auto' ? 'Automático' : 'Manual'}</TableCell>
                    <TableCell>{getStatusBadge(car)}</TableCell>
                    <TableCell className="font-semibold">
                      {car.price_per_hour ? formatCurrency(Number(car.price_per_hour)) : '—'}
                    </TableCell>
                    <TableCell>{rentals.filter((r) => r.car_id === car.id).length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewCalendar(car)}>
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditCar(car)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddCarWizard
        open={addCarOpen}
        onOpenChange={setAddCarOpen}
        onSuccess={() => {
          setAddCarOpen(false);
          fetchFleet();
        }}
      />

      {/* Edit Car Dialog */}
      <Dialog open={editCarOpen} onOpenChange={setEditCarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
          </DialogHeader>
          {selectedCar && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Modelo</Label>
                <Input value={selectedCar.model} disabled />
              </div>
              <div className="grid gap-2">
                <Label>Placa</Label>
                <Input value={selectedCar.plate} disabled />
              </div>
              <div className="grid gap-2">
                <Label>Valor por Hora (R$)</Label>
                <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Disponibilidade</Label>
                <Select value={editAvailable} onValueChange={setEditAvailable}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível para aluguéis</SelectItem>
                    <SelectItem value="unavailable">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCarOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-investor hover:bg-investor/90" onClick={handleSaveCar} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Dialog */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agenda do Veículo - {selectedCar?.model}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                booked: (date) => (selectedCar ? hasRentalsOnDate(selectedCar.id, date) : false),
              }}
              modifiersStyles={{
                booked: { backgroundColor: 'hsl(var(--investor))', color: 'white' },
              }}
            />

            {selectedDate && selectedCar && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Aluguéis em {selectedDate.toLocaleDateString('pt-BR')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getRentalsForDate(selectedCar.id, selectedDate).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum aluguel nesta data</p>
                  ) : (
                    <div className="space-y-2">
                      {getRentalsForDate(selectedCar.id, selectedDate).map((rental) => (
                        <div
                          key={rental.id}
                          className="flex items-center justify-between p-2 rounded bg-muted/50"
                        >
                          <span className="text-sm font-medium">{rental.time_slot}</span>
                          <span className="text-sm text-muted-foreground">{rental.instructor_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
