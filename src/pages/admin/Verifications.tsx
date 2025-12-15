import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Shield, CheckCircle, XCircle, Clock, ExternalLink, 
  User, FileText, AlertTriangle, Loader2, LogOut, RefreshCw 
} from 'lucide-react';

interface InstructorVerification {
  id: string;
  full_name: string;
  verification_status: 'pending' | 'analyzing' | 'approved' | 'rejected';
  fraud_score: number;
  verification_reason: string | null;
  created_at: string;
  instructor_details: {
    cnh_number: string | null;
    cnh_category: string | null;
    credential_number: string | null;
    background_check_status: string | null;
  } | null;
}

const DETRAN_LINKS: Record<string, string> = {
  'AC': 'https://www.detran.ac.gov.br/',
  'AL': 'https://www.detran.al.gov.br/',
  'AM': 'https://www.detran.am.gov.br/',
  'AP': 'https://www.detran.ap.gov.br/',
  'BA': 'https://www.detran.ba.gov.br/',
  'CE': 'https://www.detran.ce.gov.br/',
  'DF': 'https://www.detran.df.gov.br/',
  'ES': 'https://www.detran.es.gov.br/',
  'GO': 'https://www.detran.go.gov.br/',
  'MA': 'https://www.detran.ma.gov.br/',
  'MG': 'https://www.detran.mg.gov.br/',
  'MS': 'https://www.detran.ms.gov.br/',
  'MT': 'https://www.detran.mt.gov.br/',
  'PA': 'https://www.detran.pa.gov.br/',
  'PB': 'https://www.detran.pb.gov.br/',
  'PE': 'https://www.detran.pe.gov.br/',
  'PI': 'https://www.detran.pi.gov.br/',
  'PR': 'https://www.detran.pr.gov.br/',
  'RJ': 'https://www.detran.rj.gov.br/',
  'RN': 'https://www.detran.rn.gov.br/',
  'RO': 'https://www.detran.ro.gov.br/',
  'RR': 'https://www.detran.rr.gov.br/',
  'RS': 'https://www.detran.rs.gov.br/',
  'SC': 'https://www.detran.sc.gov.br/',
  'SE': 'https://www.detran.se.gov.br/',
  'SP': 'https://www.detran.sp.gov.br/',
  'TO': 'https://www.detran.to.gov.br/',
};

export default function AdminVerifications() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [instructors, setInstructors] = useState<InstructorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('SP');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    // Server-side admin check is enforced by RPC functions
    // This client-side check provides immediate UX feedback
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
      fetchInstructors();
    }
  }, [profile, navigate]);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      // Use secure admin RPC function to fetch instructor verifications
      const { data, error } = await supabase.rpc('admin_list_instructor_verifications');
      
      if (error) throw error;
      
      const combined = (data || []).map((item: any) => ({
        id: item.id,
        full_name: item.full_name,
        verification_status: item.verification_status,
        fraud_score: item.fraud_score,
        verification_reason: item.verification_reason,
        created_at: item.created_at,
        instructor_details: {
          cnh_number: item.cnh_number,
          cnh_category: item.cnh_category,
          credential_number: item.credential_number,
          background_check_status: item.background_check_status
        }
      }));
      
      setInstructors(combined);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar instrutores.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (instructorId: string) => {
    setProcessingId(instructorId);
    try {
      // Use secure admin RPC function for approving instructors
      const { error } = await supabase.rpc('admin_approve_instructor', { 
        instructor_id: instructorId 
      });
      
      if (error) throw error;
      
      toast({ title: 'Sucesso', description: 'Instrutor aprovado com sucesso!' });
      fetchInstructors();
    } catch (error) {
      console.error('Error approving instructor:', error);
      toast({ title: 'Erro', description: 'Erro ao aprovar instrutor.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (instructorId: string) => {
    setProcessingId(instructorId);
    try {
      // Use secure admin RPC function for rejecting instructors
      const { error } = await supabase.rpc('admin_reject_instructor', { 
        instructor_id: instructorId 
      });
      
      if (error) throw error;
      
      toast({ title: 'Sucesso', description: 'Instrutor rejeitado.' });
      fetchInstructors();
    } catch (error) {
      console.error('Error rejecting instructor:', error);
      toast({ title: 'Erro', description: 'Erro ao rejeitar instrutor.', variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  const getFraudScoreColor = (score: number) => {
    if (score <= 20) return 'text-green-400';
    if (score <= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-teal-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Painel de Verificações</h1>
              <p className="text-slate-400 text-sm">Gerencie as aprovações de instrutores</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInstructors}
              disabled={loading}
              className="border-slate-600 text-slate-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-slate-300 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* DETRAN Quick Links */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-teal-400" />
              Consulta DETRAN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2 text-sm"
              >
                {Object.keys(DETRAN_LINKS).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(DETRAN_LINKS[selectedState], '_blank')}
                className="border-teal-600 text-teal-400 hover:bg-teal-600/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir DETRAN-{selectedState}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total</span>
                <span className="text-2xl font-bold text-white">{instructors.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Pendentes</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {instructors.filter(i => i.verification_status === 'pending' || i.verification_status === 'analyzing').length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Aprovados</span>
                <span className="text-2xl font-bold text-green-400">
                  {instructors.filter(i => i.verification_status === 'approved').length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Rejeitados</span>
                <span className="text-2xl font-bold text-red-400">
                  {instructors.filter(i => i.verification_status === 'rejected').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructor List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Instrutores</CardTitle>
            <CardDescription className="text-slate-400">
              Lista de todos os instrutores cadastrados na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
              </div>
            ) : instructors.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum instrutor cadastrado ainda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {instructors.map((instructor) => (
                  <div
                    key={instructor.id}
                    className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center">
                          <User className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{instructor.full_name || 'Nome não informado'}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            {getStatusBadge(instructor.verification_status)}
                            <span className={`text-sm ${getFraudScoreColor(instructor.fraud_score || 0)}`}>
                              Risco: {instructor.fraud_score || 0}%
                            </span>
                          </div>
                          {instructor.instructor_details && (
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                              {instructor.instructor_details.cnh_number && (
                                <span>CNH: {instructor.instructor_details.cnh_number}</span>
                              )}
                              {instructor.instructor_details.cnh_category && (
                                <span>Cat: {instructor.instructor_details.cnh_category}</span>
                              )}
                              {instructor.instructor_details.credential_number && (
                                <span>Cred: {instructor.instructor_details.credential_number}</span>
                              )}
                            </div>
                          )}
                          {instructor.verification_reason && (
                            <p className="text-sm text-slate-400 mt-2">
                              {instructor.verification_reason}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {(instructor.verification_status === 'pending' || instructor.verification_status === 'analyzing') && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(instructor.id)}
                              disabled={processingId === instructor.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingId === instructor.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprovar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(instructor.id)}
                              disabled={processingId === instructor.id}
                            >
                              {processingId === instructor.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rejeitar
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        {instructor.verification_status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(instructor.id)}
                            disabled={processingId === instructor.id}
                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                          >
                            Revogar
                          </Button>
                        )}
                        {instructor.verification_status === 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(instructor.id)}
                            disabled={processingId === instructor.id}
                            className="border-green-600 text-green-400 hover:bg-green-600/20"
                          >
                            Reaprovar
                          </Button>
                        )}
                      </div>
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