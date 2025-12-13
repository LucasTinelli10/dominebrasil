import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Car, Percent } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { investorMetrics, revenueDistribution, fleetCars } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function InvestorHome() {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusBadge = (status: string) => {
    const config = {
      in_lesson: { label: 'Em Aula', class: 'bg-success text-success-foreground' },
      idle: { label: 'Parado', class: 'bg-muted text-muted-foreground' },
      maintenance: { label: 'Manutenção', class: 'bg-warning text-warning-foreground' },
    }[status] || { label: status, class: 'bg-muted' };
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-investor/10 to-investor/5 border-investor/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Investido</p>
                <p className="text-2xl font-bold">{formatCurrency(investorMetrics.totalInvested)}</p>
              </div>
              <div className="p-3 rounded-xl bg-investor/10">
                <DollarSign className="h-6 w-6 text-investor" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receita da Frota</p>
              <p className="text-2xl font-bold">{formatCurrency(investorMetrics.fleetRevenue)}</p>
            </div>
            <div className="p-3 rounded-xl bg-success/10"><TrendingUp className="h-6 w-6 text-success" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lucro Líquido (75%)</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(investorMetrics.netProfit)}</p>
            </div>
            <div className="p-3 rounded-xl bg-investor/10"><DollarSign className="h-6 w-6 text-investor" /></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
              <p className="text-2xl font-bold">{investorMetrics.occupancyRate}%</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10"><Percent className="h-6 w-6 text-primary" /></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Chart and Fleet Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Divisão de Receita</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {revenueDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Resumo da Frota</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fleetCars.slice(0, 4).map((car) => (
                <div key={car.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-investor/10"><Car className="h-5 w-5 text-investor" /></div>
                    <div>
                      <p className="font-medium text-sm">{car.model}</p>
                      <p className="text-xs text-muted-foreground">{car.plate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(car.status)}
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(car.monthlyRevenue)}/mês</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
