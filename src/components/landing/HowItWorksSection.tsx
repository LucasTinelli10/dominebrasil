import React from 'react';
import { motion, Variants, Easing } from 'framer-motion';
import { Search, UserCheck, Calendar, Car, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Busque na sua cidade',
    description: 'Digite sua cidade e encontre instrutores verificados disponíveis na sua região.',
  },
  {
    number: '02',
    icon: UserCheck,
    title: 'Escolha seu instrutor',
    description: 'Veja perfil, avaliações e especialidades. Escolha quem combina com você.',
  },
  {
    number: '03',
    icon: Calendar,
    title: 'Agende sua aula',
    description: 'Selecione dia e horário que funcionam para você. Tudo pelo app, sem burocracia.',
  },
  {
    number: '04',
    icon: Car,
    title: 'Faça sua aula',
    description: 'Carro com duplo comando, instrutor credenciado. Aprenda no seu ritmo.',
  },
  {
    number: '05',
    icon: CheckCircle,
    title: 'Avalie e evolua',
    description: 'Após a aula, avalie seu instrutor e acompanhe sua evolução no app.',
  },
];

const easeOut: Easing = [0.4, 0, 0.2, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOut,
    },
  },
};

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="como-funciona" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI5M2EiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMCAyIDQgMiA0czIgMiA0IDIgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm font-medium mb-4">
              Passo a Passo
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Como funciona o{' '}
              <span className="text-teal-400">DomineBrasil</span>
            </h2>
            <p className="text-lg text-slate-400">
              Em 5 passos simples você começa suas aulas práticas com instrutores verificados
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-teal-500/50 to-transparent hidden md:block" />
              
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 0;
                
                return (
                  <motion.div
                    key={step.number}
                    variants={itemVariants}
                    className={`relative flex items-center gap-6 mb-12 last:mb-0 ${
                      isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Content */}
                    <div className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                      <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 ${
                        isEven ? 'md:mr-8' : 'md:ml-8'
                      }`}>
                        <span className="text-teal-400 font-mono text-sm font-bold">
                          {step.number}
                        </span>
                        <h3 className="text-xl font-bold text-white mt-1 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-slate-400">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Spacer for alternating layout */}
                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
