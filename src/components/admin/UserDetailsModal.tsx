import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CheckCircle, XCircle, User, Loader2, 
  Mail, Phone, FileText, Car, Building2,
  Calendar, MapPin, CreditCard, Shield,
  AlertTriangle, Image, ExternalLink
} from 'lucide-react';

interface UserData {
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
  // Instructor specific
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

interface UserDetailsModalProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (userId: string) => Promise<void>;
  onReject: (userId: string, reason: string) => Promise<void>;
  processingId: string | null;
}

export default function UserDetailsModal({
  user,
  open,
  onOpenChange,
  onApprove,
  onReject,
  processingId,
}: UserDetailsModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setShowRejectForm(false);
      setRejectReason('');
      loadDocumentUrls();
    }
  }, [open, user]);

  const loadDocumentUrls = async () => {
    if (!user?.id) return;
    
    setLoadingDocs(true);
    try {
      // Try to get documents from storage
      const { data: files, error } = await supabase.storage
        .from('verification-docs')
        .list(user.id, { limit: 20 });

      if (error) {
        console.error('Erro ao listar documentos:', error);
        return;
      }

      if (files && files.length > 0) {
        const urls: Record<string, string> = {};
        
        for (const file of files) {
          const { data: signedData } = await supabase.storage
            .from('verification-docs')
            .createSignedUrl(`${user.id}/${file.name}`, 3600); // 1 hour
          
          if (signedData?.signedUrl) {
            // Extract document type from filename
            const docType = file.name.split('_')[0] || file.name;
            urls[docType] = signedData.signedUrl;
          }
        }
        
        setDocumentUrls(urls);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoadingDocs(false);
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

  const getExpiryStatus = (date: string | null) => {
    if (!date) return null;
    
    const today = new Date();
    const expiry = new Date(date);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Vencido</Badge>;
    } else if (diffDays <= 30) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Vence em {diffDays} dias</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Válido</Badge>;
  };

  const handleReject = async () => {
    if (!user || !rejectReason.trim()) return;
    await onReject(user.id, rejectReason);
  };

  if (!user) return null;

  const allDocuments = {
    ...user.documents_url,
    ...documentUrls,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name || ''} className="w-full h-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div>
              <span className="block">{user.full_name || 'Nome não informado'}</span>
              <div className="flex items-center gap-2 mt-1">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.verification_status)}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Cadastro realizado em {new Date(user.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="dados" className="data-[state=active]:bg-teal-600">
              <User className="w-4 h-4 mr-2" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="documentos" className="data-[state=active]:bg-teal-600">
              <FileText className="w-4 h-4 mr-2" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="fotos" className="data-[state=active]:bg-teal-600">
              <Image className="w-4 h-4 mr-2" />
              Fotos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dados */}
          <TabsContent value="dados" className="max-h-[50vh] overflow-y-auto space-y-6 py-4">
            {/* Dados Pessoais */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-400" />
                Dados Pessoais
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 flex items-center gap-2 text-sm">
                    <Mail className="w-3 h-3" /> Email
                  </Label>
                  <p className="text-white">{user.email || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-slate-400 flex items-center gap-2 text-sm">
                    <Phone className="w-3 h-3" /> Telefone
                  </Label>
                  <p className="text-white">{user.phone || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-slate-400 flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3" /> Cidade
                  </Label>
                  <p className="text-white">{user.city || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-slate-400 flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3" /> Bairro
                  </Label>
                  <p className="text-white">{user.neighborhood || 'Não informado'}</p>
                </div>
              </div>
            </div>

            {/* Dados de Instrutor */}
            {user.role === 'instructor' && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  Dados do Instrutor
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-sm">Número CNH</Label>
                    <p className="text-white font-mono">{user.cnh_number || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Categoria CNH</Label>
                    <p className="text-white">{user.cnh_category || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 flex items-center gap-2 text-sm">
                      <Calendar className="w-3 h-3" /> Validade CNH
                    </Label>
                    <div className="flex items-center gap-2">
                      <p className="text-white">
                        {user.cnh_expiry_date 
                          ? new Date(user.cnh_expiry_date).toLocaleDateString('pt-BR')
                          : 'Não informado'}
                      </p>
                      {getExpiryStatus(user.cnh_expiry_date)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Nº Credencial DETRAN</Label>
                    <p className="text-white font-mono">{user.credential_number || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 flex items-center gap-2 text-sm">
                      <Calendar className="w-3 h-3" /> Validade Credencial
                    </Label>
                    <div className="flex items-center gap-2">
                      <p className="text-white">
                        {user.credential_expiry 
                          ? new Date(user.credential_expiry).toLocaleDateString('pt-BR')
                          : 'Não informado'}
                      </p>
                      {getExpiryStatus(user.credential_expiry)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Anos de Experiência</Label>
                    <p className="text-white">{user.years_experience ?? 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 flex items-center gap-2 text-sm">
                      <CreditCard className="w-3 h-3" /> Preço/Hora
                    </Label>
                    <p className="text-white">
                      {user.price_per_hour 
                        ? `R$ ${user.price_per_hour.toFixed(2)}`
                        : 'Não definido'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-400 flex items-center gap-2 text-sm">
                      <Shield className="w-3 h-3" /> Verificação de Antecedentes
                    </Label>
                    <p className="text-white capitalize">{user.background_check_status || 'Pendente'}</p>
                  </div>
                </div>
                {user.bio && (
                  <div className="mt-4">
                    <Label className="text-slate-400 text-sm">Biografia</Label>
                    <p className="text-white mt-1">{user.bio}</p>
                  </div>
                )}
              </div>
            )}

            {/* Análise de IA */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                Análise de Segurança (IA)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400 text-sm">Pontuação de Risco</Label>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${
                      (user.fraud_score ?? 0) <= 20 ? 'text-green-400' :
                      (user.fraud_score ?? 0) <= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {user.fraud_score ?? 0}%
                    </p>
                    {(user.fraud_score ?? 0) <= 20 ? (
                      <Badge className="bg-green-500/20 text-green-400">Baixo Risco</Badge>
                    ) : (user.fraud_score ?? 0) <= 50 ? (
                      <Badge className="bg-yellow-500/20 text-yellow-400">Risco Moderado</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400">Alto Risco</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400 text-sm">Status de Verificação</Label>
                  <p className="text-white capitalize">{user.verification_status}</p>
                </div>
              </div>
              {user.verification_reason && (
                <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                  <Label className="text-slate-400 text-sm">Observações da IA</Label>
                  <p className="text-slate-300 text-sm mt-1">{user.verification_reason}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Documentos (Dados Textuais) */}
          <TabsContent value="documentos" className="max-h-[50vh] overflow-y-auto py-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                Resumo dos Documentos
              </h4>
              
              {user.role === 'instructor' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <Label className="text-teal-400 text-sm">CNH (Carteira Nacional de Habilitação)</Label>
                      <p className="text-white font-mono mt-1">{user.cnh_number || 'Não informado'}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Categoria: {user.cnh_category || 'N/A'} | 
                        Validade: {user.cnh_expiry_date 
                          ? new Date(user.cnh_expiry_date).toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-800 rounded-lg">
                      <Label className="text-teal-400 text-sm">Credencial DETRAN</Label>
                      <p className="text-white font-mono mt-1">{user.credential_number || 'Não informado'}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Validade: {user.credential_expiry 
                          ? new Date(user.credential_expiry).toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <Label className="text-yellow-400 text-sm">Verificação Manual Recomendada</Label>
                    </div>
                    <ul className="text-slate-300 text-sm space-y-1">
                      <li>• Consulte a CNH no site do DETRAN do estado</li>
                      <li>• Verifique a autenticidade da credencial de instrutor</li>
                      <li>• Compare as fotos do documento com a selfie</li>
                      <li>• Verifique se não há pendências judiciais</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400">Nenhum documento específico para este tipo de usuário.</p>
              )}
            </div>
          </TabsContent>

          {/* Tab: Fotos */}
          <TabsContent value="fotos" className="max-h-[50vh] overflow-y-auto py-4">
            {loadingDocs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
                <span className="ml-2 text-slate-400">Carregando documentos...</span>
              </div>
            ) : Object.keys(allDocuments).length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(allDocuments).map(([key, url]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-slate-400 capitalize flex items-center gap-2">
                      <Image className="w-3 h-3" />
                      {key.replace(/_/g, ' ').replace('cnh', 'CNH')}
                    </Label>
                    <a 
                      href={url as string} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block relative group"
                    >
                      <img 
                        src={url as string} 
                        alt={key}
                        className="rounded-lg border border-slate-600 hover:border-teal-500 transition-colors max-h-64 object-cover w-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect fill="%231e293b" width="200" height="150"/><text fill="%2364748b" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12">Imagem indisponível</text></svg>';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma foto enviada ainda.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Reject Form */}
        {showRejectForm && (
          <div className="border-t border-slate-700 pt-4 mt-4">
            <Label className="text-slate-400 mb-2 block">Motivo da Rejeição *</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Descreva o motivo da rejeição. Ex: Foto da CNH ilegível, documento vencido, dados inconsistentes..."
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>
        )}

        <DialogFooter className="gap-2 mt-4">
          {!showRejectForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-slate-600 text-slate-300"
              >
                Fechar
              </Button>
              {(user.verification_status === 'pending' || user.verification_status === 'analyzing') && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectForm(true)}
                    disabled={processingId === user.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => onApprove(user.id)}
                    disabled={processingId === user.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprovar
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processingId === user.id || !rejectReason.trim()}
              >
                {processingId === user.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar Rejeição
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
