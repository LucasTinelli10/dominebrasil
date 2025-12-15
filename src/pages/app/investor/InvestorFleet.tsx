import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Car, Plus, AlertTriangle, Edit, Calendar as CalendarIcon, X } from 'lucide-react';
import { fleetCars } from '@/data/mockData';
import { cn } from '@/lib/utils';
import AddCarWizard from '@/components/investor/AddCarWizard';

interface CarRental {
  date: string;
  timeSlot: string;
  instructorName: string;
}

// Mock rental data
const carRentals: Record<string, CarRental[]> = {
  '1': [
    { date: '2024-01-16', timeSlot: '09:00 - 10:00', instructorName: 'Roberto Silva' },
    { date: '2024-01-16', timeSlot: '14:00 - 15:00', instructorName: 'Ana Paula' },
    { date: '2024-01-17', timeSlot: '10:00 - 11:00', instructorName: 'Roberto Silva' },
  ],
  '2': [
    { date: '2024-01-16', timeSlot: '08:00 - 09:00', instructorName: 'Carlos Eduardo' },
  ],
};

export default function InvestorFleet() {
  const [addCarOpen, setAddCarOpen] = useState(false);
  const [editCarOpen, setEditCarOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<typeof fleetCars[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  const getStatusBadge = (status: string) => {
    const cfg = { 
      in_lesson: { l: 'Em Aula', c: 'bg-success' }, 
      idle: { l: 'Parado', c: 'bg-muted' }, 
      maintenance: { l: 'Manutenção', c: 'bg-warning' } 
    }[status] || { l: status, c: 'bg-muted' };
    return <Badge className={cfg.c}>{cfg.l}</Badge>;
  };

  const needsRevision = (current: number, next: number) => (next - current) < 2000;

  const handleEditCar = (car: typeof fleetCars[0]) => {
    setSelectedCar(car);
    setEditCarOpen(true);
  };

  const handleViewCalendar = (car: typeof fleetCars[0]) => {
    setSelectedCar(car);
    setCalendarOpen(true);
  };

  const getRentalsForDate = (carId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return carRentals[carId]?.filter(r => r.date === dateStr) || [];
  };

  const hasRentalsOnDate = (carId: string, date: Date) => {
    return getRentalsForDate(carId, date).length > 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Gestão de Frota</h1>
          <p className="text-muted-foreground">Gerencie seus veículos cadastrados</p>
        </div>
        <Button 
          className="bg-investor hover:bg-investor/90"
          onClick={() => setAddCarOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Veículo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Instrutor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Km Atual</TableHead>
                <TableHead>Receita/Mês</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleetCars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-investor" />
                      {car.model}
                    </div>
                  </TableCell>
                  <TableCell>{car.plate}</TableCell>
                  <TableCell>{car.currentInstructor || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{getStatusBadge(car.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {car.currentKm.toLocaleString()}
                      {needsRevision(car.currentKm, car.nextRevisionKm) && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-success">{formatCurrency(car.monthlyRevenue)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCalendar(car)}
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCar(car)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Car Wizard */}
      <AddCarWizard
        open={addCarOpen}
        onOpenChange={setAddCarOpen}
        onSuccess={() => {
          setAddCarOpen(false);
          // Refresh fleet data
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
                <Input type="number" defaultValue={selectedCar.pricePerHour} />
              </div>
              <div className="grid gap-2">
                <Label>Disponibilidade</Label>
                <Select defaultValue={selectedCar.status === 'maintenance' ? 'unavailable' : 'available'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível para aluguéis</SelectItem>
                    <SelectItem value="unavailable">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Foto do Veículo</Label>
                <Input type="file" accept="image/*" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCarOpen(false)}>Cancelar</Button>
            <Button className="bg-investor hover:bg-investor/90" onClick={() => setEditCarOpen(false)}>
              Salvar Alterações
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
                booked: (date) => selectedCar ? hasRentalsOnDate(selectedCar.id, date) : false,
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
                      {getRentalsForDate(selectedCar.id, selectedDate).map((rental, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-sm font-medium">{rental.timeSlot}</span>
                          <span className="text-sm text-muted-foreground">{rental.instructorName}</span>
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