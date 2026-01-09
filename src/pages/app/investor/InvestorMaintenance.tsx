import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wrench, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceRecord {
  id: string;
  car_id: string;
  car_model: string;
  car_plate: string;
  type: string;
  date: string;
  cost: number;
  km: number;
  next_km: number;
}

export default function InvestorMaintenance() {
  const { user } = useAuth();
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [carsNeedingRevision, setCarsNeedingRevision] = useState<{ model: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchMaintenanceData();
    }
  }, [user?.id]);

  const fetchMaintenanceData = async () => {
    try {
      // For now, we'll show a message that no maintenance records exist
      // In a real app, you'd have a maintenance_history table
      setMaintenanceRecords([]);
      setCarsNeedingRevision([]);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-display font-bold">Manutenção e Revisões</h1></div>
        <Card className="animate-pulse">
          <CardContent className="p-6"><div className="h-48 bg-muted rounded" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Manutenção e Revisões</h1>
        <p className="text-muted-foreground">Acompanhe o histórico de manutenção da frota</p>
      </div>
      
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Histórico de Manutenções
          </CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceRecords.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum registro de manutenção</h3>
              <p className="text-muted-foreground">
                Os registros de manutenção dos seus veículos aparecerão aqui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Próxima</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRecords.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.car_model}</TableCell>
                    <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                    <TableCell>{new Date(m.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{m.km.toLocaleString()} km</TableCell>
                    <TableCell className="text-destructive font-medium">{formatCurrency(m.cost)}</TableCell>
                    <TableCell>{m.next_km.toLocaleString()} km</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
