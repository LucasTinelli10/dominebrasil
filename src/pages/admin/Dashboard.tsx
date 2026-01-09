import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  CheckCircle, User, Loader2, RefreshCw,
  Car, Building2
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import UserDetailsModal from '@/components/admin/UserDetailsModal';

interface PendingUser {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  verification_status: 'pending' | 'analyzing' | 'approved' | 'rejected';
  fraud_score: number | null;
  verification_reason: string | null;
  created_at: string;
  avatar_url: string | null;
  city: string | null;
  neighborhood: string | null;
  // Instructor fields
  cnh_number: string | null;
  cnh_category: string | null;
  cnh_expiry_date: string | null;
  credential_number: string | null;
  credential_expiry: string | null;
  background_check_status: string | null;
  documents_url: Record<string, string> | null;
  bio: string | null;
  price_per_hour: number | null;
  years_experience: number | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      toast({ 
        title: 'Acesso Negado', 
        description: 'Apenas administradores podem acessar esta página.', 
        variant: 'destructive' 
      });
      navigate('/');
      return;
    }
    if (profile?.role === 'admin') {
      fetchPendingUsers();
    }
  }, [profile, navigate]);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_pending_approvals');
      
      if (error) throw error;
      
      setPendingUsers((data || []) as PendingUser[]);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar usuários pendentes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      const { error } = await supabase.rpc('admin_approve_user', { 
        user_id: userId 
      });
      
      if (error) throw error;
      
      toast({ title: 'Sucesso', description: 'Usuário aprovado com sucesso!' });
      setModalOpen(false);
      setSelectedUser(null);
      fetchPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({ title: 'Erro', description: 'Erro ao aprovar usuário.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectReason.trim()) {
      toast({ title: 'Atenção', description: 'Informe o motivo da rejeição.', variant: 'destructive' });
      return;
    }
    
    setProcessingId(userId);
    try {
      const { error } = await supabase.rpc('admin_reject_user_with_reason', { 
        user_id: userId,
        reason: rejectReason
      });
      
      if (error) throw error;
      
      toast({ title: 'Sucesso', description: 'Usuário rejeitado.' });
      setModalOpen(false);
      setSelectedUser(null);
      setRejectReason('');
      setShowRejectForm(false);
      fetchPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({ title: 'Erro', description: 'Erro ao rejeitar usuário.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const openUserModal = (user: PendingUser) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleModalApprove = async (userId: string) => {
    await handleApprove(userId);
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleModalReject = async (userId: string, reason: string) => {
    setRejectReason(reason);
    setProcessingId(userId);
    try {
      const { error } = await supabase.rpc('admin_reject_user_with_reason', { 
        user_id: userId,
        reason: reason
      });
      
      if (error) throw error;
      
      toast({ title: 'Sucesso', description: 'Usuário rejeitado.' });
      setModalOpen(false);
      setSelectedUser(null);
      fetchPendingUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({ title: 'Erro', description: 'Erro ao rejeitar usuário.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'instructor':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Car className="w-3 h-3 mr-1" /> Instrutor</Badge>;
      case 'investor':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Building2 className="w-3 h-3 mr-1" /> Investidor</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeitado</Badge>;
      case 'analyzing':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Analisando</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Pendente</Badge>;
    }
  };

  return (
    <AdminLayout>
      {/* Header with refresh */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Aprovações Pendentes</h1>
          <p className="text-slate-400 text-sm">Instrutores e investidores aguardando verificação</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPendingUsers}
          disabled={loading}
          className="border-slate-600 text-slate-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Total Pendentes</span>
              <span className="text-2xl font-bold text-yellow-400">{pendingUsers.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Instrutores</span>
              <span className="text-2xl font-bold text-blue-400">
                {pendingUsers.filter(u => u.role === 'instructor').length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Investidores</span>
              <span className="text-2xl font-bold text-amber-400">
                {pendingUsers.filter(u => u.role === 'investor').length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Users Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Usuários Pendentes</CardTitle>
          <CardDescription className="text-slate-400">
            Clique no nome para ver detalhes e documentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-400" />
              <p>Nenhuma aprovação pendente!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-teal-500/50 transition-colors cursor-pointer"
                  onClick={() => openUserModal(user)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name || ''} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{user.full_name || 'Nome não informado'}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.verification_status)}
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onApprove={handleModalApprove}
        onReject={handleModalReject}
        processingId={processingId}
      />
    </AdminLayout>
  );
}
