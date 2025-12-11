import React from 'react';
import { motion, Variants, Easing } from 'framer-motion';
import { GraduationCap, Briefcase, Car, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface HeroSectionProps {
  onOpenAuth: () => void;
}

const personas = [
  {
    id: 'student',
    icon: GraduationCap,
    title: 'Sou Aluno',
    description: 'Quero aprender a dirigir com calma e paciência',
    color: 'from-teal-500 to-teal-600',
    hoverColor: 'hover:border-teal-500',
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-600',
  },
  {
    id: 'instructor',
    icon: Briefcase,
    title: 'Sou Instrutor',
    description: 'Quero trabalhar de forma independente e ganhar mais',
    color: 'from-slate-700 to-slate-800',
    hoverColor: 'hover:border-slate-600',
    iconBg: 'bg-slate-500/10',
    iconColor: 'text-slate-600',
  },
  {
    id: 'investor',
    icon: Car,
    title: 'Sou Investidor',
    description: 'Quero rentabilizar minha frota com segurança',
    color: 'from-amber-500 to-amber-600',
    hoverColor: 'hover:border-amber-500',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
  },
];

const easeOut: Easing = [0.4, 0, 0.2, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOut,
    },
  },
};

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAuth }) => {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI5M2EiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMCAyIDQgMiA0czIgMiA0IDIgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full mb-8">
            <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-teal-300">
              Conforme Lei CONTRAN 14.921/2024
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
          >
            Sua CNH na mão.{' '}
            <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
              Sua Renda no bolso.
            </span>{' '}
            <br className="hidden md:block" />
            Seu Investimento seguro.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-12"
          >
            A primeira plataforma que conecta alunos a instrutores independentes e frotas de investidores.{' '}
            <span className="text-teal-400">Tudo dentro da nova Lei do Contran.</span>
          </motion.p>

          {/* Persona Cards */}
          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {personas.map((persona) => (
              <motion.div
                key={persona.id}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={onOpenAuth}
                  className={`cursor-pointer bg-white/5 backdrop-blur-sm border-white/10 ${persona.hoverColor} transition-all duration-300 group overflow-hidden`}
                >
                  <CardContent className="p-6 text-left">
                    <div className={`w-14 h-14 rounded-2xl ${persona.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <persona.icon className={`w-7 h-7 ${persona.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{persona.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{persona.description}</p>
                    <div className="flex items-center text-teal-400 text-sm font-medium group-hover:text-teal-300">
                      Começar agora
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-wrap justify-center gap-8 text-slate-400 text-sm"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>+500 instrutores verificados</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Carros com duplo comando</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>98% de aprovação</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center pt-2"
        >
          <div className="w-1.5 h-3 bg-teal-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};
