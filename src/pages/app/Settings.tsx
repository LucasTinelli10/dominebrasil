import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  User, 
  Bell, 
  Shield, 
  Camera, 
  Save, 
  FileText,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUpload {
  cnh_front?: string;
  cnh_back?: string;
  credential?: string;
  selfie?: string;
  crlv?: string;
  vehicle_front?: string;
  vehicle_side?: string;
}

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [city, setCity] = useState(profile?.city || '');
  const [phone, setPhone] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentUpload>({});
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCity(profile.city || '');
    }
    if (user) {
      fetchPhone();
      if (profile?.role === 'instructor' || profile?.role === 'investor') {
        fetchDocuments();
      }
    }
  }, [profile, user]);

  const fetchPhone = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single();
    if (data) setPhone(data.phone || '');
  };

  const fetchDocuments = async () => {
    if (!user) return;
    
    if (profile?.role === 'instructor') {
      const { data } = await supabase
        .from('instructors_details')
        .select('documents_url')
        .eq('profile_id', user.id)
        .single();
      
      if (data?.documents_url && typeof data.documents_url === 'object') {
        setDocuments(data.documents_url as DocumentUpload);
      }
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          city: city,
          phone: phone,
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-docs')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-docs')
        .getPublicUrl(fileName);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      await refreshProfile();
      toast.success('Foto de perfil atualizada!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao atualizar foto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>, 
    docType: keyof DocumentUpload
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. O tamanho máximo é 10MB.');
      return;
    }

    setUploadingDoc(docType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${docType}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('verification-docs')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('verification-docs')
        .getPublicUrl(fileName);
      
      const newDocuments = { ...documents, [docType]: publicUrl };
      setDocuments(newDocuments);

      if (profile?.role === 'instructor') {
        const { error: updateError } = await supabase
          .from('instructors_details')
          .update({ documents_url: newDocuments })
          .eq('profile_id', user.id);
        
        if (updateError) throw updateError;
      }
      
      toast.success('Documento enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error);
      toast.error('Erro ao enviar documento. Tente novamente.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const submitForVerification = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'analyzing' })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      toast.success('Documentos enviados para análise! Você será notificado quando a verificação for concluída.');
    } catch (error) {
      console.error('Erro ao enviar para verificação:', error);
      toast.error('Erro ao enviar para verificação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusBadge = () => {
    switch (profile?.verification_status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verificado
          </Badge>
        );
      case 'analyzing':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Em Análise
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const isDocumentComplete = () => {
    if (profile?.role === 'instructor') {
      return documents.cnh_front && documents.cnh_back && documents.credential && documents.selfie;
    }
    if (profile?.role === 'investor') {
      return documents.crlv && documents.vehicle_front && documents.vehicle_side;
    }
    return false;
  };

  const DocumentUploadCard = ({ 
    docType, 
    label, 
    description 
  }: { 
    docType: keyof DocumentUpload; 
    label: string; 
    description: string;
  }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${documents[docType] ? 'bg-green-100' : 'bg-muted'}`}>
          {documents[docType] ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {documents[docType] && (
          <a 
            href={documents[docType]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Eye className="h-3 w-3" />
            Ver
          </a>
        )}
        <Label htmlFor={`upload-${docType}`} className="cursor-pointer">
          <div className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
            {uploadingDoc === docType ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{documents[docType] ? 'Atualizar' : 'Enviar'}</span>
          </div>
        </Label>
        <Input
          id={`upload-${docType}`}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => handleDocumentUpload(e, docType)}
          disabled={uploadingDoc !== null}
        />
      </div>
    </div>
  );

  const getRoleName = () => {
    switch (profile?.role) {
      case 'student': return 'Aluno';
      case 'instructor': return 'Instrutor';
      case 'investor': return 'Dono de Frota';
      case 'admin': return 'Administrador';
      default: return 'Usuário';
    }
  };

  const roleColor = profile?.role === 'student' ? 'student' : profile?.role === 'instructor' ? 'instructor' : 'investor';

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e informações pessoais</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Atualize seus dados de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className={cn(`bg-${roleColor}`, 'text-white text-2xl')}>
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="font-medium">{profile?.full_name || 'Usuário'}</p>
              <p className="text-sm text-muted-foreground">{getRoleName()}</p>
              {(profile?.role === 'instructor' || profile?.role === 'investor') && (
                <div className="mt-2">{getVerificationStatusBadge()}</div>
              )}
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Sua cidade"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={loading}
            className={cn(`bg-${roleColor}`, `hover:bg-${roleColor}/90`)}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* Documents Section - Only for instructors and investors */}
      {(profile?.role === 'instructor' || profile?.role === 'investor') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos para Verificação
            </CardTitle>
            <CardDescription>
              Envie os documentos necessários para validar seu perfil e liberar o acesso à plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.verification_status === 'rejected' && profile?.verification_reason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Motivo da rejeição:</p>
                <p className="text-sm text-red-700 mt-1">{profile.verification_reason}</p>
              </div>
            )}

            {profile?.role === 'instructor' && (
              <>
                <DocumentUploadCard
                  docType="cnh_front"
                  label="CNH - Frente"
                  description="Foto da frente da sua Carteira Nacional de Habilitação"
                />
                <DocumentUploadCard
                  docType="cnh_back"
                  label="CNH - Verso"
                  description="Foto do verso da sua Carteira Nacional de Habilitação"
                />
                <DocumentUploadCard
                  docType="credential"
                  label="Credencial de Instrutor"
                  description="Foto da sua credencial de instrutor do DETRAN"
                />
                <DocumentUploadCard
                  docType="selfie"
                  label="Foto do Rosto (Selfie)"
                  description="Tire uma selfie segurando seu documento de identificação"
                />
              </>
            )}

            {profile?.role === 'investor' && (
              <>
                <DocumentUploadCard
                  docType="crlv"
                  label="CRLV do Veículo"
                  description="Certificado de Registro e Licenciamento do Veículo"
                />
                <DocumentUploadCard
                  docType="vehicle_front"
                  label="Foto do Veículo - Frente"
                  description="Foto frontal do veículo mostrando a placa"
                />
                <DocumentUploadCard
                  docType="vehicle_side"
                  label="Foto do Veículo - Lateral"
                  description="Foto lateral do veículo"
                />
              </>
            )}

            <Separator className="my-4" />

            {profile?.verification_status === 'pending' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Pronto para enviar?</p>
                  <p className="text-sm text-muted-foreground">
                    {isDocumentComplete() 
                      ? 'Todos os documentos foram enviados. Clique para enviar para análise.'
                      : 'Complete o envio de todos os documentos acima para continuar.'}
                  </p>
                </div>
                <Button 
                  onClick={submitForVerification} 
                  disabled={!isDocumentComplete() || loading}
                  className={cn(`bg-${roleColor}`, `hover:bg-${roleColor}/90`)}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Enviar para Verificação
                </Button>
              </div>
            )}

            {profile?.verification_status === 'analyzing' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Clock className="h-5 w-5" />
                  <p className="font-medium">Documentos em análise</p>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Seus documentos estão sendo analisados pela nossa equipe. 
                  Você receberá uma notificação quando o processo for concluído.
                </p>
              </div>
            )}

            {profile?.verification_status === 'approved' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">Perfil verificado</p>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Seu perfil foi verificado com sucesso! Você tem acesso completo à plataforma.
                </p>
              </div>
            )}

            {profile?.verification_status === 'rejected' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">Documentos precisam ser reenviados</p>
                  <p className="text-sm text-red-700">
                    Corrija os problemas apontados acima e reenvie seus documentos.
                  </p>
                </div>
                <Button 
                  onClick={submitForVerification} 
                  disabled={!isDocumentComplete() || loading}
                  variant="destructive"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Reenviar Documentos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>Configure como deseja receber notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por E-mail</p>
              <p className="text-sm text-muted-foreground">Receba atualizações importantes por e-mail</p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações Push</p>
              <p className="text-sm text-muted-foreground">Receba alertas no navegador</p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por SMS</p>
              <p className="text-sm text-muted-foreground">Receba lembretes de aulas por SMS</p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>Gerencie a segurança da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full sm:w-auto justify-start">
            Alterar Senha
          </Button>
          <Separator />
          <div>
            <Button variant="destructive" className="w-full sm:w-auto">
              Excluir Conta
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
