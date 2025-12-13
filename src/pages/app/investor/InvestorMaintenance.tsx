import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wrench, AlertTriangle } from 'lucide-react';
import { maintenanceHistory, fleetCars } from '@/data/mockData';

export default function InvestorMaintenance() {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const carsNeedingRevision = fleetCars.filter(c => (c.nextRevisionKm - c.currentKm) < 2000);

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">Manutenção e Revisões</h1><p className="text-muted-foreground">Acompanhe o histórico de manutenção da frota</p></div>
      
      {carsNeedingRevision.length > 0 && (
        <Card className="bg-warning/10 border-warning/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <div>
                <p className="font-medium">{carsNeedingRevision.length} veículo(s) próximos da revisão</p>
                <p className="text-sm text-muted-foreground">{carsNeedingRevision.map(c => c.model).join(', ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Histórico de Manutenções</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Veículo</TableHead><TableHead>Tipo</TableHead><TableHead>Data</TableHead><TableHead>Km</TableHead><TableHead>Custo</TableHead><TableHead>Próxima</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {maintenanceHistory.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.carModel}</TableCell>
                  <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                  <TableCell>{new Date(m.date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{m.km.toLocaleString()} km</TableCell>
                  <TableCell className="text-destructive font-medium">{formatCurrency(m.cost)}</TableCell>
                  <TableCell>{m.nextKm.toLocaleString()} km</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
