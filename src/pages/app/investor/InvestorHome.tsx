import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Car, Percent, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BUSINESS_RULES } from '@/lib/businessRules';
import { cn } from '@/lib/utils';

interface FleetCar {
  id: string;
  model: string;
  plate: string;
  verification_status: string;
}

export default function InvestorHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cars, setCars] = useState<FleetCar[]>([]);
  const [stats, setStats] = useState({
    totalCars: 0,
    approvedCars: 0,
    totalRevenue: 0,
    netProfit: 0,
    occupancyRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      // Fetch investor's cars
      const { data: carsData } = await supabase
        .from('cars')
        .select('id, model, plate, verification_status')
        .eq('owner_id', user?.id);

      setCars(carsData || []);

      const totalCars = carsData?.length || 0;
      const approvedCars = carsData?.filter(c => c.verification_status === 'approved').length || 0;

      // Fetch car rentals for revenue calculation
      const { data: rentals } = await supabase
        .from('car_rentals')
        .select('car_id, status')
        .in('car_id', carsData?.map(c => c.id) || [])
        .eq('status', 'completed');

      const totalRentals = rentals?.length || 0;
      const revenuePerRental = BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR;
      const totalRevenue = totalRentals * revenuePerRental;
      const netProfit = totalRevenue * 0.75; // 75% to investor

      // Calculate occupancy rate (rentals / potential rentals)
      const potentialRentals = approvedCars * 22 * 8; // 22 working days * 8 hours
      const occupancyRate = potentialRentals > 0 ? Math.round((totalRentals / potentialRentals) * 100) : 0;

      setStats({
        totalCars,
        approvedCars,
        totalRevenue,
        netProfit,
        occupancyRate: Math.min(occupancyRate, 100),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusBadge = (status: string) => {
    const config = {
      approved: { label: 'Aprovado', class: 'bg-success text-success-foreground' },
      pending: { label: 'Pendente', class: 'bg-warning text-warning-foreground' },
      analyzing: { label: 'Em Análise', class: 'bg-primary text-primary-foreground' },
      rejected: { label: 'Rejeitado', class: 'bg-destructive text-destructive-foreground' },
    }[status] || { label: status, class: 'bg-muted' };
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  const revenueDistribution = [
    { name: 'Investidor (75%)', value: stats.netProfit, color: 'hsl(222, 47%, 35%)' },
    { name: 'Domine (25%)', value: stats.totalRevenue * 0.25, color: 'hsl(222, 47%, 60%)' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-investor/10 to-investor/5 border-investor/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Veículos na Frota</p>
                <p className="text-2xl font-bold">{stats.totalCars}</p>
                <p className="text-xs text-muted-foreground">{stats.approvedCars} aprovados</p>
              </div>
              <div className="p-3 rounded-xl bg-investor/10">
                <Car className="h-6 w-6 text-investor" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-xl bg-success/10"><TrendingUp className="h-6 w-6 text-success" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Líquido (75%)</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(stats.netProfit)}</p>
              </div>
              <div className="p-3 rounded-xl bg-investor/10"><DollarSign className="h-6 w-6 text-investor" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                <p className="text-2xl font-bold">{stats.occupancyRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10"><Percent className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Fleet Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Divisão de Receita</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {stats.totalRevenue > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={revenueDistribution} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={90} 
                      dataKey="value" 
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhuma receita registrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Meus Veículos</CardTitle>
            <Button variant="ghost" size="sm" className="text-investor" onClick={() => navigate('/app/investor/fleet')}>
              Ver todos <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {cars.length === 0 ? (
              <div className="py-8 text-center">
                <Car className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum veículo cadastrado</p>
                <Button className="mt-4 bg-investor hover:bg-investor/90" onClick={() => navigate('/app/investor/fleet')}>
                  Adicionar Veículo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cars.slice(0, 4).map((car) => (
                  <div key={car.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-investor/10"><Car className="h-5 w-5 text-investor" /></div>
                      <div>
                        <p className="font-medium text-sm">{car.model}</p>
                        <p className="text-xs text-muted-foreground">{car.plate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(car.verification_status || 'pending')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
