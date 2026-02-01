import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Car, Building2, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'student' | 'instructor' | 'investor';
type AuthStep = 'select-role' | 'auth-form';
type AuthMode = 'login' | 'signup';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedRole?: UserRole;
  defaultMode?: AuthMode;
}

const roleOptions = [
  {
    role: 'student' as UserRole,
    title: 'Sou Aluno',
  },
  {
    role: 'instructor' as UserRole,
    title: 'Sou Instrutor',
  },
  {
    role: 'investor' as UserRole,
    title: 'Sou Investidor/Autoescola',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange, preselectedRole, defaultMode = 'login' }) => {
  const [step, setStep] = useState<AuthStep>(preselectedRole ? 'auth-form' : 'select-role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(preselectedRole || null);
  const [authMode, setAuthMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update when preselectedRole or defaultMode changes
  React.useEffect(() => {
    if (preselectedRole) {
      setSelectedRole(preselectedRole);
      setStep('auth-form');
    }
    setAuthMode(defaultMode);
  }, [preselectedRole, defaultMode]);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('auth-form');
  };

  const handleBack = () => {
    if (preselectedRole) {
      onOpenChange(false);
      return;
    }
    setStep('select-role');
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (authMode === 'signup') {
      if (!fullName) {
        toast.error('Preencha seu nome completo');
        return;
      }
      if (!phone) {
        toast.error('Preencha seu telefone');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }
      if (password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        const { error } = await signUp(email, password, selectedRole!, fullName, phone);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este email já está cadastrado. Tente fazer login.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Conta criada com sucesso!');
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Email ou senha incorretos');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Bem-vindo de volta!');
      }

      onOpenChange(false);
      
       // Redirect: aluno sempre cai em /app/student (Início). Para login, usamos /app/student
       // como destino padrão e o ProtectedRoute redireciona conforme o papel real do usuário.
      setTimeout(() => {
        if (selectedRole) {
          if (authMode === 'signup' && selectedRole === 'instructor') {
            navigate('/onboarding');
           } else if (authMode === 'login') {
             navigate('/app/student');
           } else if (selectedRole === 'student') {
             navigate('/app/student');
          } else {
            navigate(`/${selectedRole}/dashboard`);
          }
        }
      }, 100);
      
    } catch (error: any) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep(preselectedRole ? 'auth-form' : 'select-role');
    setSelectedRole(preselectedRole || null);
    setAuthMode(defaultMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetModal();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <div className="bg-gradient-hero p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">
              {step === 'select-role' 
                ? 'Bem-vindo ao DomineBrasil' 
                : authMode === 'login' 
                  ? 'Entrar na sua conta' 
                  : 'Criar sua conta'}
            </DialogTitle>
            <p className="text-primary-foreground/80 mt-1">
              {step === 'select-role'
                ? 'Selecione seu perfil para continuar'
                : `Como ${roleOptions.find(r => r.role === selectedRole)?.title.replace('Sou ', '')}`}
            </p>
          </DialogHeader>
        </div>

        <div className="p-6">
          {step === 'select-role' ? (
            <div className="space-y-3">
              {roleOptions.map((option) => (
                <Button
                  key={option.role}
                  variant="role-select"
                  className="w-full"
                  onClick={() => handleRoleSelect(option.role)}
                >
                  <span className="text-lg font-semibold">{option.title}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-2 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>

              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aguarde...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      {authMode === 'login' ? 'Entrar' : 'Criar conta'}
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  disabled={isLoading}
                >
                  {authMode === 'login' 
                    ? 'Não tem conta? Cadastre-se' 
                    : 'Já tem conta? Faça login'}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
