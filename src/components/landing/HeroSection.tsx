import React from 'react';
import { motion, Variants, Easing } from 'framer-motion';
import { User, ShieldCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HeroSectionProps {
  onOpenAuth: () => void;
  onOpenInstructorAuth: () => void;
  onOpenInvestorAuth: () => void;
}

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

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onOpenAuth, 
  onOpenInstructorAuth, 
  onOpenInvestorAuth 
}) => {
  const navigate = useNavigate();

  const handleStudentClick = () => {
    navigate('/buscar-instrutor');
  };

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
              100% Adequado à Nova Lei de Trânsito
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
          >
            Liberdade para quem dirige.{' '}
            <br className="hidden md:block" />
            <span className="text-teal-500">
              Independência
            </span>{' '}
            para quem ensina.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-12"
          >
            A plataforma oficial que une Alunos Habilitados, Instrutores Autônomos e Investidores de Frota.{' '}
            <span className="text-teal-400">Segurança e tecnologia para você dominar o trânsito.</span>
          </motion.p>

          {/* Choose Your Path Label */}
          <motion.p
            variants={itemVariants}
            className="text-sm uppercase tracking-widest text-slate-400 mb-6"
          >
            Escolha seu caminho
          </motion.p>

          {/* Persona Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto"
          >
            {/* Student Button - Primary */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={handleStudentClick}
                size="lg"
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-8 py-5 h-auto flex items-center gap-2 shadow-lg shadow-teal-500/25"
              >
                <User className="w-5 h-5" />
                <span className="font-semibold text-base">Sou Aluno</span>
              </Button>
            </motion.div>

            {/* Instructor Button - Outline */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={onOpenInstructorAuth}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/30 bg-white/5 hover:bg-white/10 text-white px-8 py-5 h-auto flex items-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="font-semibold text-base">Sou Instrutor</span>
              </Button>
            </motion.div>

            {/* Investor Button - Ghost */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={onOpenInvestorAuth}
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto text-slate-300 hover:text-white hover:bg-white/5 px-8 py-5 h-auto flex items-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold text-base">Tenho Frota</span>
              </Button>
            </motion.div>
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
