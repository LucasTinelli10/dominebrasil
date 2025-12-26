import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useEffect } from 'react';

export default function VerificationStatus() {
  const navigate = useNavigate();
  const { profile, signOut, refreshProfile } = useAuth();

  useEffect(() => {
    // If approved, redirect to dashboard
    if (profile?.verification_status === 'approved') {
      navigate(`/app/${profile.role}`);
    }
  }, [profile, navigate]);

  const handleRefresh = async () => {
    await refreshProfile();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusContent = () => {
    switch (profile?.verification_status) {
      case 'pending':
        return {
          icon: Clock,
          iconColor: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20 border-yellow-600/50',
          title: 'Cadastro Incompleto',
          description: 'Você precisa completar seu cadastro e enviar os documentos necessários para verificação.',
          showOnboardingButton: true,
        };
      case 'analyzing':
        return {
          icon: Clock,
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-900/20 border-blue-600/50',
          title: 'Documentos em Análise',
          description: 'Seus documentos foram enviados e estão sendo analisados pela nossa equipe. Este processo pode levar até 48 horas úteis. Você receberá uma notificação assim que a análise for concluída.',
          showOnboardingButton: false,
        };
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-900/20 border-red-600/50',
          title: 'Documentos Rejeitados',
          description: profile?.verification_reason || 'Houve um problema com seus documentos. Por favor, revise e envie novamente.',
          showOnboardingButton: true,
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-slate-400',
          bgColor: 'bg-slate-900/20 border-slate-600/50',
          title: 'Status Desconhecido',
          description: 'Não foi possível determinar o status da sua verificação.',
          showOnboardingButton: true,
        };
    }
  };

  const status = getStatusContent();
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <div className={`mx-auto w-20 h-20 rounded-full ${status.bgColor} border-2 flex items-center justify-center mb-4`}>
            <StatusIcon className={`h-10 w-10 ${status.iconColor}`} />
          </div>
          <CardTitle className="text-2xl text-white">{status.title}</CardTitle>
          <CardDescription className="text-slate-300 mt-2">
            {status.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.verification_status === 'analyzing' && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-slate-200 font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                O que acontece agora?
              </h4>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>• Nossa equipe está verificando seus documentos</li>
                <li>• Validamos a autenticidade da CNH e credenciais</li>
                <li>• Fazemos a verificação de antecedentes</li>
                <li>• Você será notificado por email quando concluído</li>
              </ul>
            </div>
          )}

          {profile?.verification_status === 'rejected' && profile?.verification_reason && (
            <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
              <h4 className="text-red-300 font-medium mb-2">Motivo da Rejeição:</h4>
              <p className="text-sm text-slate-300">{profile.verification_reason}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            {status.showOnboardingButton && (
              <Button
                onClick={() => navigate('/onboarding')}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {profile?.verification_status === 'rejected' ? 'Reenviar Documentos' : 'Completar Cadastro'}
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar Status
            </Button>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}