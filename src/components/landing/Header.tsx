import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboard = () => {
    if (profile) {
      navigate(`/${profile.role}/dashboard`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-card/95 backdrop-blur-md shadow-md' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">D</span>
            </div>
            <span className="font-display font-bold text-xl text-white drop-shadow-md">
              Domine<span className="text-teal-300">Brasil</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('como-funciona')}
              className={`text-sm font-medium transition-colors ${
                isScrolled ? 'text-foreground hover:text-primary' : 'text-white/90 hover:text-white drop-shadow-sm'
              }`}
            >
              Como Funciona
            </button>
            <button 
              onClick={() => scrollToSection('jornada-cnh')}
              className={`text-sm font-medium transition-colors ${
                isScrolled ? 'text-foreground hover:text-primary' : 'text-white/90 hover:text-white drop-shadow-sm'
              }`}
            >
              Jornada CNH
            </button>
            <button 
              onClick={() => scrollToSection('depoimentos')}
              className={`text-sm font-medium transition-colors ${
                isScrolled ? 'text-foreground hover:text-primary' : 'text-white/90 hover:text-white drop-shadow-sm'
              }`}
            >
              Depoimentos
            </button>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" onClick={handleDashboard}>
                  Meu Painel
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sair
                </Button>
              </>
            ) : (
              <Button onClick={onOpenAuth} variant="default">
                Entrar / Cadastrar
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-card border-t border-border py-4 animate-fade-in">
            <nav className="flex flex-col gap-2">
              <button 
                onClick={() => scrollToSection('como-funciona')}
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg text-left"
              >
                Como Funciona
              </button>
              <button 
                onClick={() => scrollToSection('jornada-cnh')}
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg text-left"
              >
                Jornada CNH
              </button>
              <button 
                onClick={() => scrollToSection('depoimentos')}
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg text-left"
              >
                Depoimentos
              </button>
              <div className="px-4 pt-2 border-t border-border mt-2">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" onClick={handleDashboard} className="justify-start">
                      Meu Painel
                    </Button>
                    <Button variant="outline" onClick={handleSignOut} className="justify-start">
                      Sair
                    </Button>
                  </div>
                ) : (
                  <Button onClick={onOpenAuth} className="w-full">
                    Entrar / Cadastrar
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
