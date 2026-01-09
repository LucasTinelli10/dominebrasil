import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DocumentExpiryStatus {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number | null;
  expiryDate: string | null;
  documentType: 'cnh' | 'credential';
}

interface ExpiryData {
  cnhExpiry: DocumentExpiryStatus | null;
  credentialExpiry: DocumentExpiryStatus | null;
  hasBlockingExpiry: boolean;
  hasWarningExpiry: boolean;
}

const DAYS_WARNING_THRESHOLD = 30; // Aviso 30 dias antes

export const useDocumentExpiry = () => {
  const { profile, user } = useAuth();
  const [expiryData, setExpiryData] = useState<ExpiryData>({
    cnhExpiry: null,
    credentialExpiry: null,
    hasBlockingExpiry: false,
    hasWarningExpiry: false,
  });
  const [loading, setLoading] = useState(true);

  const calculateExpiryStatus = (
    expiryDate: string | null,
    documentType: 'cnh' | 'credential'
  ): DocumentExpiryStatus | null => {
    if (!expiryDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isExpired: daysUntilExpiry < 0,
      isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= DAYS_WARNING_THRESHOLD,
      daysUntilExpiry,
      expiryDate,
      documentType,
    };
  };

  useEffect(() => {
    const checkDocumentExpiry = async () => {
      if (!user?.id || profile?.role !== 'instructor') {
        setLoading(false);
        return;
      }

      try {
        const { data: instructorData, error } = await supabase
          .from('instructors_details')
          .select('cnh_expiry_date, credential_expiry')
          .eq('profile_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao verificar vencimento:', error);
          setLoading(false);
          return;
        }

        if (instructorData) {
          const cnhStatus = calculateExpiryStatus(
            instructorData.cnh_expiry_date,
            'cnh'
          );
          const credentialStatus = calculateExpiryStatus(
            instructorData.credential_expiry,
            'credential'
          );

          const hasBlockingExpiry = 
            (cnhStatus?.isExpired ?? false) || 
            (credentialStatus?.isExpired ?? false);
          
          const hasWarningExpiry = 
            (cnhStatus?.isExpiringSoon ?? false) || 
            (credentialStatus?.isExpiringSoon ?? false);

          setExpiryData({
            cnhExpiry: cnhStatus,
            credentialExpiry: credentialStatus,
            hasBlockingExpiry,
            hasWarningExpiry,
          });

          // Mostrar avisos ao carregar
          if (hasBlockingExpiry) {
            toast({
              title: '⚠️ Documentos Vencidos',
              description: 'Um ou mais documentos estão vencidos. Atualize-os para continuar usando o aplicativo.',
              variant: 'destructive',
            });
          } else if (hasWarningExpiry) {
            const expiringDocs: string[] = [];
            if (cnhStatus?.isExpiringSoon) {
              expiringDocs.push(`CNH (${cnhStatus.daysUntilExpiry} dias)`);
            }
            if (credentialStatus?.isExpiringSoon) {
              expiringDocs.push(`Credencial (${credentialStatus.daysUntilExpiry} dias)`);
            }
            
            toast({
              title: '📅 Documentos Próximos do Vencimento',
              description: `Atenção: ${expiringDocs.join(', ')} estão próximos de vencer.`,
            });
          }
        }
      } catch (error) {
        console.error('Erro ao verificar documentos:', error);
      } finally {
        setLoading(false);
      }
    };

    checkDocumentExpiry();
  }, [user?.id, profile?.role]);

  return { ...expiryData, loading };
};

export const formatExpiryMessage = (status: DocumentExpiryStatus): string => {
  if (status.isExpired) {
    return `Vencido há ${Math.abs(status.daysUntilExpiry!)} dias`;
  }
  if (status.isExpiringSoon) {
    if (status.daysUntilExpiry === 0) {
      return 'Vence hoje!';
    }
    return `Vence em ${status.daysUntilExpiry} dias`;
  }
  return `Válido até ${new Date(status.expiryDate!).toLocaleDateString('pt-BR')}`;
};
