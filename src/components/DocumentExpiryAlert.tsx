import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, RefreshCw, XCircle } from 'lucide-react';
import { useDocumentExpiry, formatExpiryMessage } from '@/hooks/useDocumentExpiry';

interface DocumentExpiryAlertProps {
  className?: string;
}

export default function DocumentExpiryAlert({ className }: DocumentExpiryAlertProps) {
  const navigate = useNavigate();
  const { cnhExpiry, credentialExpiry, hasBlockingExpiry, hasWarningExpiry, loading } = useDocumentExpiry();

  if (loading) return null;

  // Se não há nenhum problema, não mostra nada
  if (!hasBlockingExpiry && !hasWarningExpiry) return null;

  const handleUpdateDocuments = () => {
    navigate('/onboarding');
  };

  // Documentos vencidos - BLOQUEIO
  if (hasBlockingExpiry) {
    return (
      <div className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 ${className}`}>
        <div className="bg-slate-800 border-2 border-red-500 rounded-2xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-900/50 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Documentos Vencidos
          </h2>
          
          <p className="text-slate-300 mb-6">
            Um ou mais documentos obrigatórios estão vencidos. Você precisa atualizá-los para continuar usando o aplicativo.
          </p>

          <div className="space-y-3 mb-6">
            {cnhExpiry?.isExpired && (
              <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-red-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">CNH</p>
                    <p className="text-red-300 text-sm">{formatExpiryMessage(cnhExpiry)}</p>
                  </div>
                </div>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            )}

            {credentialExpiry?.isExpired && (
              <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-red-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">Credencial DETRAN</p>
                    <p className="text-red-300 text-sm">{formatExpiryMessage(credentialExpiry)}</p>
                  </div>
                </div>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            )}
          </div>

          <Button
            onClick={handleUpdateDocuments}
            size="lg"
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Atualizar Documentos
          </Button>

          <p className="text-slate-400 text-sm mt-4">
            Após atualizar, seus documentos passarão por nova verificação.
          </p>
        </div>
      </div>
    );
  }

  // Documentos próximos do vencimento - AVISO
  return (
    <Alert className={`border-yellow-600/50 bg-yellow-900/20 ${className}`}>
      <AlertTriangle className="h-5 w-5 text-yellow-400" />
      <AlertTitle className="text-yellow-300 font-medium">
        Documentos Próximos do Vencimento
      </AlertTitle>
      <AlertDescription className="text-slate-300 mt-2">
        <div className="space-y-2 mb-4">
          {cnhExpiry?.isExpiringSoon && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-yellow-400" />
              <span>
                <strong>CNH:</strong> {formatExpiryMessage(cnhExpiry)}
              </span>
            </div>
          )}
          {credentialExpiry?.isExpiringSoon && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-yellow-400" />
              <span>
                <strong>Credencial:</strong> {formatExpiryMessage(credentialExpiry)}
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={handleUpdateDocuments}
          variant="outline"
          size="sm"
          className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/30"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar Documentos
        </Button>
      </AlertDescription>
    </Alert>
  );
}
