import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Clock, Zap, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Withdrawal {
  id: string;
  instructor_id: string;
  amount: number;
  fee: number | null;
  net_amount: number;
  pix_key: string;
  type: string | null;
  status: string | null;
  created_at: string | null;
  processed_at: string | null;
  instructor_name?: string;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch instructor names
      const instructorIds = [...new Set((data || []).map(w => w.instructor_id))];
      const names: Record<string, string> = {};

      for (const id of instructorIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', id)
          .single();
        if (profile) names[id] = profile.full_name || 'Sem nome';
      }

      setWithdrawals((data || []).map(w => ({
        ...w,
        instructor_name: names[w.instructor_id] || 'Desconhecido',
      })));
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'completed' | 'rejected') => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status: newStatus, 
          processed_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      // If rejected, refund balance
      if (newStatus === 'rejected') {
        const withdrawal = withdrawals.find(w => w.id === id);
        if (withdrawal) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', withdrawal.instructor_id)
            .single();

          if (profile) {
            await supabase
              .from('profiles')
              .update({ balance: Number(profile.balance) + withdrawal.amount })
              .eq('id', withdrawal.instructor_id);
          }
        }
      }

      toast({
        title: 'Sucesso',
        description: newStatus === 'completed'
          ? 'Saque marcado como pago!'
          : 'Saque rejeitado e saldo devolvido.',
      });
      fetchWithdrawals();
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast({ title: 'Erro', description: 'Erro ao atualizar saque.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Pago</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeitado</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Processando</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
    }
  };

  const pendingStandard = withdrawals.filter(w => (w.status === 'pending') && w.type === 'standard');
  const pendingInstant = withdrawals.filter(w => (w.status === 'pending' || w.status === 'processing') && w.type === 'instant');
  const history = withdrawals.filter(w => w.status === 'completed' || w.status === 'rejected');

  const WithdrawalCard = ({ w }: { w: Withdrawal }) => (
    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-medium">{w.instructor_name}</p>
          <p className="text-slate-400 text-xs">
            {w.created_at && format(new Date(w.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="text-right">
          {getStatusBadge(w.status)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
        <div>
          <p className="text-slate-400 text-xs">Valor Bruto</p>
          <p className="text-white font-medium">R$ {w.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Taxa</p>
          <p className="text-red-400 font-medium">R$ {(w.fee || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Valor Líquido</p>
          <p className="text-green-400 font-medium">R$ {w.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded p-2 mb-3">
        <p className="text-slate-400 text-xs">Chave PIX</p>
        <p className="text-white text-sm font-mono">{w.pix_key}</p>
      </div>

      {(w.status === 'pending' || w.status === 'processing') && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => handleUpdateStatus(w.id, 'completed')}
            disabled={processingId === w.id}
          >
            {processingId === w.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Marcar como Pago
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            onClick={() => handleUpdateStatus(w.id, 'rejected')}
            disabled={processingId === w.id}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rejeitar
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Solicitações de Saque</h1>
          <p className="text-slate-400 text-sm">Gerencie saques dos instrutores via PIX</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchWithdrawals}
          disabled={loading}
          className="border-slate-600 text-slate-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-slate-400 text-xs">Saques Semanais Pendentes</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingStandard.length}</p>
                <p className="text-slate-500 text-xs">
                  Total: R$ {pendingStandard.reduce((s, w) => s + w.net_amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-slate-400 text-xs">Saques Instantâneos Pendentes</p>
                <p className="text-2xl font-bold text-blue-400">{pendingInstant.length}</p>
                <p className="text-slate-500 text-xs">
                  Total: R$ {pendingInstant.reduce((s, w) => s + w.net_amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-slate-400 text-xs">Processados</p>
                <p className="text-2xl font-bold text-green-400">{history.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700 mb-4">
            <TabsTrigger value="standard" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Clock className="h-4 w-4 mr-2" />
              Semanal ({pendingStandard.length})
            </TabsTrigger>
            <TabsTrigger value="instant" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Zap className="h-4 w-4 mr-2" />
              Instantâneo ({pendingInstant.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-slate-500/20 data-[state=active]:text-slate-300">
              Histórico ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard">
            {pendingStandard.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center text-slate-400">
                  Nenhum saque semanal pendente
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingStandard.map(w => <WithdrawalCard key={w.id} w={w} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="instant">
            {pendingInstant.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center text-slate-400">
                  Nenhum saque instantâneo pendente
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingInstant.map(w => <WithdrawalCard key={w.id} w={w} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {history.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center text-slate-400">
                  Nenhum saque processado ainda
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {history.map(w => <WithdrawalCard key={w.id} w={w} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </AdminLayout>
  );
}
