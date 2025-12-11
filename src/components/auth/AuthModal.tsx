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
}

const roleOptions = [
  {
    role: 'student' as UserRole,
    title: 'Sou Aluno',
    description: 'Quero aprender a dirigir com confiança',
    icon: GraduationCap,
  },
  {
    role: 'instructor' as UserRole,
    title: 'Sou Instrutor',
    description: 'Quero oferecer aulas particulares',
    icon: Car,
  },
  {
    role: 'investor' as UserRole,
    title: 'Sou Investidor/Autoescola',
    description: 'Quero disponibilizar veículos',
    icon: Building2,
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange }) => {
  const [step, setStep] = useState<AuthStep>('select-role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('auth-form');
  };

  const handleBack = () => {
    setStep('select-role');
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (authMode === 'signup' && !fullName) {
      toast.error('Preencha seu nome completo');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        const { error } = await signUp(email, password, selectedRole!, fullName);
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
      
      // Redirect based on role
      setTimeout(() => {
        if (selectedRole) {
          navigate(`/${selectedRole}/dashboard`);
        }
      }, 100);
      
    } catch (error: any) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep('select-role');
    setSelectedRole(null);
    setAuthMode('login');
    setEmail('');
    setPassword('');
    setFullName('');
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
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <option.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-lg font-semibold">{option.title}</span>
                  <span className="text-sm text-muted-foreground">{option.description}</span>
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
