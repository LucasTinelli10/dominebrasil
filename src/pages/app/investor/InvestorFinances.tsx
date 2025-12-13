import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { financialTransactions } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function InvestorFinances() {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(v));
  const totalIncome = financialTransactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = financialTransactions.filter(t => t.type === 'expense').reduce((a, t) => a + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold">Extrato Financeiro</h1><p className="text-muted-foreground">Acompanhe entradas e saídas detalhadas</p></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10"><TrendingUp className="h-6 w-6 text-success" /></div>
          <div><p className="text-sm text-muted-foreground">Entradas</p><p className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/10"><TrendingDown className="h-6 w-6 text-destructive" /></div>
          <div><p className="text-sm text-muted-foreground">Saídas</p><p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpense)}</p></div>
        </CardContent></Card>
        <Card className="bg-investor/10 border-investor/20"><CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-investor/20"><Wallet className="h-6 w-6 text-investor" /></div>
          <div><p className="text-sm text-muted-foreground">Saldo</p><p className="text-2xl font-bold">{formatCurrency(totalIncome - totalExpense)}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Transações Recentes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Veículo</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
            <TableBody>
              {financialTransactions.map((t) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
