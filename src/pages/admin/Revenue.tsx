import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RevenueStats {
  totalRevenue: number;
  platformCommission: number;
  totalBookings: number;
  completedBookings: number;
  monthlyRevenue: number;
  monthlyCommission: number;
}

export default function AdminRevenue() {
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    platformCommission: 0,
    totalBookings: 0,
    completedBookings: 0,
    monthlyRevenue: 0,
    monthlyCommission: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      // Fetch all completed bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'completed');

      const allBookings = bookings || [];
      const totalRevenue = allBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
      const platformCommission = totalRevenue * 0.15;

      // Monthly
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const monthBookings = allBookings.filter(b => {
        const d = new Date(b.date);
        return d >= monthStart && d <= monthEnd;
      });
      const monthlyRevenue = monthBookings.reduce((sum, b) => sum + Number(b.total_price), 0);

      // Total bookings count (all statuses)
      const { count: totalCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalRevenue,
        platformCommission,
        totalBookings: totalCount || 0,
        completedBookings: allBookings.length,
        monthlyRevenue,
        monthlyCommission: monthlyRevenue * 0.15,
      });

      // Recent transactions (lesson_income type to see platform activity)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setRecentTransactions(transactions || []);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Faturamento da Plataforma</h1>
        <p className="text-slate-400 text-sm">Visão geral de receitas e comissões</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Receita Total (Bruto)</p>
                <p className="text-2xl font-bold text-white">
                  R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Comissão da Plataforma (15%)</p>
                <p className="text-2xl font-bold text-white">
                  R$ {stats.platformCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Receita Este Mês</p>
                <p className="text-2xl font-bold text-white">
                  R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Aulas Concluídas / Total</p>
                <p className="text-2xl font-bold text-white">
                  {stats.completedBookings} / {stats.totalBookings}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comissão mensal */}
      <Card className="bg-slate-800/50 border-slate-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white text-lg">Comissão do Mês Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Faturamento Bruto</p>
              <p className="text-xl font-bold text-white">
                R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-2xl text-slate-500">→</div>
            <div className="flex-1 bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
              <p className="text-teal-400 text-sm">Sua Comissão (15%)</p>
              <p className="text-xl font-bold text-teal-300">
                R$ {stats.monthlyCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhuma transação encontrada</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">{tx.description || tx.type}</p>
                    <p className="text-slate-400 text-xs">
                      {format(new Date(tx.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'withdrawal' || tx.type === 'withdrawal_fee' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.type === 'withdrawal' || tx.type === 'withdrawal_fee' ? '-' : '+'}
                      R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-slate-500 text-xs">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
