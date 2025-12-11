import React from 'react';
import { GraduationCap, Car, Building2, Search, Calendar, Trophy } from 'lucide-react';

const studentSteps = [
  {
    icon: Search,
    title: 'Encontre seu instrutor',
    description: 'Busque instrutores na sua cidade com filtros por preço e tipo de câmbio.',
  },
  {
    icon: Calendar,
    title: 'Agende sua aula',
    description: 'Escolha data e horário que se encaixam na sua rotina.',
  },
  {
    icon: Trophy,
    title: 'Conquiste confiança',
    description: 'Aulas no seu ritmo até você dirigir com segurança.',
  },
];

const profiles = [
  {
    icon: GraduationCap,
    title: 'Para Alunos',
    description: 'Supere o medo de dirigir com instrutores especializados em amaxofobia.',
    color: 'bg-primary/10 text-primary',
    steps: studentSteps,
  },
  {
    icon: Car,
    title: 'Para Instrutores',
    description: 'Trabalhe de forma independente e aumente sua renda com nossa plataforma.',
    color: 'bg-success/10 text-success',
    features: ['Gerencie sua agenda', 'Receba via PIX', 'Use seu carro ou alugue'],
  },
  {
    icon: Building2,
    title: 'Para Investidores',
    description: 'Rentabilize sua frota disponibilizando veículos para instrutores.',
    color: 'bg-warning/10 text-warning',
    features: ['Renda passiva', 'Gestão simplificada', 'Proteção garantida'],
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="como-funciona" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Como funciona o DomineBrasil
          </h2>
          <p className="text-lg text-muted-foreground">
            Uma plataforma que conecta alunos, instrutores e investidores em um ecossistema único.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {profiles.map((profile, index) => (
            <div 
              key={profile.title}
              className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-2xl ${profile.color} flex items-center justify-center mb-6`}>
                <profile.icon className="h-7 w-7" />
              </div>
              
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {profile.title}
              </h3>
              
              <p className="text-muted-foreground mb-6">
                {profile.description}
              </p>

              {profile.steps ? (
                <div className="space-y-4">
                  {profile.steps.map((step, stepIndex) => (
                    <div key={step.title} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-sm font-semibold text-accent-foreground">
                          {stepIndex + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">
                          {step.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  {profile.features?.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
