import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car, Plus, AlertTriangle } from 'lucide-react';
import { fleetCars } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function InvestorFleet() {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const getStatusBadge = (status: string) => {
    const cfg = { in_lesson: { l: 'Em Aula', c: 'bg-success' }, idle: { l: 'Parado', c: 'bg-muted' }, maintenance: { l: 'Manutenção', c: 'bg-warning' } }[status] || { l: status, c: 'bg-muted' };
    return <Badge className={cfg.c}>{cfg.l}</Badge>;
  };
  const needsRevision = (current: number, next: number) => (next - current) < 2000;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-display font-bold">Gestão de Frota</h1><p className="text-muted-foreground">Gerencie seus veículos cadastrados</p></div>
        <Button className="bg-investor hover:bg-investor/90"><Plus className="h-4 w-4 mr-2" />Adicionar Veículo</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Veículo</TableHead><TableHead>Placa</TableHead><TableHead>Instrutor</TableHead><TableHead>Status</TableHead><TableHead>Km Atual</TableHead><TableHead>Receita/Mês</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {fleetCars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Car className="h-4 w-4 text-investor" />{car.model}</div></TableCell>
                  <TableCell>{car.plate}</TableCell>
                  <TableCell>{car.currentInstructor || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{getStatusBadge(car.status)}</TableCell>
                  <TableCell><div className="flex items-center gap-2">{car.currentKm.toLocaleString()}{needsRevision(car.currentKm, car.nextRevisionKm) && <AlertTriangle className="h-4 w-4 text-warning" />}</div></TableCell>
                  <TableCell className="font-semibold text-success">{formatCurrency(car.monthlyRevenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
