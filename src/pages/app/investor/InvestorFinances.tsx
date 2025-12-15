import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { financialTransactions } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function InvestorFinances() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(v));

  // Filter transactions based on period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return financialTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      if (period === 'daily') {
        return transactionDate.toDateString() === now.toDateString();
      } else if (period === 'weekly') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return transactionDate >= weekAgo;
      }
      return true; // monthly shows all
    });
  }, [period]);

  const totals = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((a, t) => a + Math.abs(t.amount), 0);
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
          {filteredTransactions.length === 0 ? (
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
                    <TableCell>{new Date(t.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{t.car}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className={cn('text-right font-semibold', t.type === 'income' ? 'text-success' : 'text-destructive')}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
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