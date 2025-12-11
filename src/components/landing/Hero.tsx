import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Clock, Star } from 'lucide-react';

interface HeroProps {
  onOpenAuth: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenAuth }) => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent via-background to-background" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-accent-foreground">
                +2.000 alunos confiaram em nós
              </span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Vença o medo de dirigir com{' '}
              <span className="text-gradient">instrutores especializados</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              Conectamos você a instrutores particulares preparados para ajudar quem tem amaxofobia. 
              Aulas personalizadas, no seu ritmo, com veículos adaptados.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="xl" 
                variant="hero"
                onClick={onOpenAuth}
                className="group"
              >
                Começar Agora
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                size="xl" 
                variant="outline"
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Saiba Mais
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark border-2 border-background"
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">4.9</strong> de 5 estrelas
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>Aulas flexíveis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-primary" />
                <span>Instrutores certificados</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="relative animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Main Card */}
              <div className="absolute inset-4 bg-card rounded-3xl shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <img 
                  src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=600&fit=crop"
                  alt="Instrutor de direção"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating Card - Rating */}
              <div className="absolute -left-4 top-1/4 bg-card rounded-2xl p-4 shadow-lg animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary fill-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">4.9/5</p>
                    <p className="text-xs text-muted-foreground">+500 avaliações</p>
                  </div>
                </div>
              </div>
              
              {/* Floating Card - Stats */}
              <div className="absolute -right-4 bottom-1/4 bg-card rounded-2xl p-4 shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">98%</p>
                  <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
