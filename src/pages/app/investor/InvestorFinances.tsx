import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BUSINESS_RULES } from '@/lib/businessRules';

interface FinancialTransaction {
  id: string;
  date: string;
  car: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
}

export default function InvestorFinances() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchTransactions();
  }, [user?.id]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data: cars } = await supabase
        .from('cars')
        .select('id, model, price_per_hour')
        .eq('owner_id', user?.id);

      const carIds = (cars || []).map((c) => c.id);
      const carMap = new Map((cars || []).map((c) => [c.id, c]));

      if (!carIds.length) {
        setTransactions([]);
        return;
      }

      const [{ data: rentals }, { data: maintenance }] = await Promise.all([
        supabase
          .from('car_rentals')
          .select('id, car_id, date, time_slot, status')
          .in('car_id', carIds)
          .eq('status', 'completed'),
        supabase
          .from('car_maintenance')
          .select('id, car_id, date, type, description, cost')
          .eq('owner_id', user?.id),
      ]);

      const incomes: FinancialTransaction[] = (rentals || []).map((r: any) => {
        const car = carMap.get(r.car_id);
        const gross = Number(car?.price_per_hour ?? BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR);
        return {
          id: `rent-${r.id}`,
          date: r.date,
          car: car?.model || 'Veículo',
          description: `Aluguel ${r.time_slot} (repasse 75%)`,
          type: 'income',
          amount: gross * 0.75,
        };
      });

      const expenses: FinancialTransaction[] = (maintenance || []).map((m: any) => ({
        id: `maint-${m.id}`,
        date: m.date,
        car: carMap.get(m.car_id)?.model || 'Veículo',
        description: m.description ? `${m.type} — ${m.description}` : m.type,
        type: 'expense',
        amount: Number(m.cost || 0),
      }));

      setTransactions(
        [...incomes, ...expenses].sort((a, b) => (a.date < b.date ? 1 : -1))
      );
    } catch (error) {
      console.error('Error fetching finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(v));

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const d = new Date(`${t.date}T00:00:00`);
      if (period === 'daily') return d.toDateString() === now.toDateString();
      if (period === 'weekly') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return d >= monthAgo;
    });
  }, [transactions, period]);

  const totals = useMemo(() => {
    const income = filteredTransactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((a, t) => a + Math.abs(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const periodLabel = period === 'daily' ? 'Hoje' : period === 'weekly' ? 'Esta Semana' : 'Este Mês';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Extrato Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe entradas e saídas detalhadas</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'daily' | 'weekly' | 'monthly')}>
          <TabsList>
            <TabsTrigger value="daily">Diário</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entradas ({periodLabel})</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totals.income)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saídas ({periodLabel})</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totals.expense)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-investor/10 border-investor/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-investor/20">
              <Wallet className="h-6 w-6 text-investor" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo ({periodLabel})</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.balance)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transações - {periodLabel}</CardTitle>
          <Badge variant="outline">{filteredTransactions.length} transações</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Nenhuma transação encontrada para o período selecionado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(`${t.date}T00:00:00`).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{t.car}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-semibold',
                        t.type === 'income' ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </TableCell>
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
