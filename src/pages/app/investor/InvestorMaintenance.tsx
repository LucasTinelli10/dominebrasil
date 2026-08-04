import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MaintenanceRecord {
  id: string;
  car_id: string;
  type: string;
  description: string | null;
  date: string;
  cost: number;
  km: number | null;
  next_km: number | null;
  next_date: string | null;
}

interface FleetCar {
  id: string;
  model: string;
  plate: string;
}

const MAINTENANCE_TYPES = [
  'Troca de óleo',
  'Troca de pneus',
  'Revisão geral',
  'Freios',
  'Motor',
  'Alinhamento e balanceamento',
  'Bateria',
  'Funilaria e pintura',
  'Outro',
];

export default function InvestorMaintenance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [cars, setCars] = useState<FleetCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    car_id: '',
    type: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    km: '',
    next_km: '',
    next_date: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    const { data: carsData } = await supabase
      .from('cars')
      .select('id, model, plate')
      .eq('owner_id', user?.id);
    setCars(carsData || []);

    const { data: recordsData } = await supabase
      .from('car_maintenance')
      .select('*')
      .eq('owner_id', user?.id)
      .order('date', { ascending: false });
    setRecords((recordsData as MaintenanceRecord[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.car_id || !form.type) {
      toast({ title: 'Preencha o veículo e o tipo de manutenção', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('car_maintenance').insert({
      car_id: form.car_id,
      owner_id: user!.id,
      type: form.type,
      description: form.description || null,
      date: form.date,
      cost: form.cost ? Number(form.cost) : 0,
      km: form.km ? Number(form.km) : null,
      next_km: form.next_km ? Number(form.next_km) : null,
      next_date: form.next_date || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Manutenção registrada' });
    setForm(emptyForm);
    setOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('car_maintenance').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
      return;
    }
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const carLabel = (id: string) => {
    const car = cars.find((c) => c.id === id);
    return car ? `${car.model} • ${car.plate}` : 'Veículo';
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const today = new Date();
  const upcoming = records.filter(
    (r) => r.next_date && new Date(`${r.next_date}T00:00:00`) <= new Date(today.getTime() + 15 * 86400000)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Manutenção e Revisões</h1>
          <p className="text-muted-foreground">Registre e acompanhe a rotina de manutenção da frota</p>
        </div>
        <Button
          className="bg-investor hover:bg-investor/90"
          onClick={() => setOpen(true)}
          disabled={cars.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Manutenção
        </Button>
      </div>

      {upcoming.length > 0 && (
        <Card className="bg-warning/10 border-warning/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <div>
                <p className="font-medium">{upcoming.length} manutenção(ões) programada(s) em breve</p>
                <p className="text-sm text-muted-foreground">
                  {upcoming.map((r) => `${r.type} (${carLabel(r.car_id)})`).join(', ')}
                </p>
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
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum registro de manutenção</h3>
              <p className="text-muted-foreground mb-4">
                {cars.length === 0
                  ? 'Cadastre um veículo na Gestão de Frota para registrar manutenções.'
                  : 'Adicione trocas de óleo, pneus, revisões e outros serviços da sua frota.'}
              </p>
              {cars.length > 0 && (
                <Button className="bg-investor hover:bg-investor/90" onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Manutenção
                </Button>
              )}
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{carLabel(m.car_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.type}</Badge>
                      {m.description && (
                        <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                      )}
                    </TableCell>
                    <TableCell>{new Date(`${m.date}T00:00:00`).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{m.km ? `${m.km.toLocaleString('pt-BR')} km` : '—'}</TableCell>
                    <TableCell className="text-destructive font-medium">{formatCurrency(Number(m.cost))}</TableCell>
                    <TableCell>
                      {m.next_km ? `${m.next_km.toLocaleString('pt-BR')} km` : ''}
                      {m.next_km && m.next_date ? ' • ' : ''}
                      {m.next_date ? new Date(`${m.next_date}T00:00:00`).toLocaleDateString('pt-BR') : ''}
                      {!m.next_km && !m.next_date ? '—' : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Manutenção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Veículo</Label>
              <Select value={form.car_id} onValueChange={(v) => setForm({ ...form, car_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent>
                  {cars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.model} • {c.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tipo de serviço</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Ex: Troca de óleo" />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes do serviço, oficina, peças trocadas..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Custo (R$)</Label>
                <Input
                  type="number"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label>Km atual</Label>
                <Input
                  type="number"
                  value={form.km}
                  onChange={(e) => setForm({ ...form, km: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Próxima em (km)</Label>
                <Input
                  type="number"
                  value={form.next_km}
                  onChange={(e) => setForm({ ...form, next_km: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Próxima manutenção (data)</Label>
              <Input
                type="date"
                value={form.next_date}
                onChange={(e) => setForm({ ...form, next_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-investor hover:bg-investor/90" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
