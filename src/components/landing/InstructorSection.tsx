import React from 'react';
import { motion, Variants, Easing } from 'framer-motion';
import { X, Check, Clock, DollarSign, UserCheck, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InstructorSectionProps {
  onOpenAuth: () => void;
}

const easeOut: Easing = [0.4, 0, 0.2, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOut,
    },
  },
};

export const InstructorSection: React.FC<InstructorSectionProps> = ({ onOpenAuth }) => {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100 rounded-full blur-[120px] opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-4">
              Para Instrutores
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Pare de trabalhar para os outros.{' '}
              <span className="text-teal-600">Seja Dono da sua Agenda.</span>
            </h2>
            <p className="text-lg text-slate-600">
              Veja a diferença entre continuar na autoescola tradicional ou virar um Parceiro Domine.
            </p>
          </motion.div>

          {/* Comparison Cards */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {/* CLT Card - Bad */}
            <Card className="border-2 border-red-200 bg-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-slate-800">Autoescola CLT</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-600">Salário Fixo</span>
                  </div>
                  <span className="font-bold text-slate-800">R$ 1.800,00</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-600">Chefe e Horário Fixo</span>
                  </div>
                  <span className="font-bold text-red-600">Sim</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-600">Lucro por Aula</span>
                  </div>
                  <span className="font-bold text-slate-800">R$ 15,00</span>
                </div>
                <div className="pt-4 text-center">
                  <span className="inline-block px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold text-lg">
                    😔 Escravidão Financeira
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Domine Card - Good */}
            <Card className="border-2 border-teal-300 bg-gradient-to-br from-white to-teal-50 shadow-xl relative overflow-hidden transform md:scale-105">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-teal-400" />
              <div className="absolute -top-3 -right-3 bg-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full rotate-12 shadow-lg">
                RECOMENDADO
              </div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-slate-800">Parceiro Domine</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-teal-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-teal-100">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-teal-500" />
                    <span className="text-slate-600">Faturamento</span>
                  </div>
                  <span className="font-bold text-teal-600">Você define</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-teal-100">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-teal-500" />
                    <span className="text-slate-600">Horário</span>
                  </div>
                  <span className="font-bold text-teal-600">100% Flexível</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-teal-100">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-teal-500" />
                    <span className="text-slate-600">Lucro por Aula</span>
                  </div>
                  <span className="font-bold text-2xl text-teal-600">R$ 40 - R$ 60</span>
                </div>
                <div className="pt-4 text-center">
                  <span className="inline-block px-6 py-3 bg-teal-500 text-white rounded-xl font-bold text-lg shadow-lg">
                    🚀 Liberdade Financeira
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Banner */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
            <div className="bg-slate-900 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/20 flex items-center justify-center shrink-0">
                <Car className="w-8 h-8 text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Não tem carro? Sem problemas.</h3>
                <p className="text-slate-300">
                  Alugue nossa frota por hora e pague somente quando tiver aluno. 
                  Zero risco, máximo ganho.
                </p>
              </div>
              <Button 
                onClick={onOpenAuth}
                size="lg"
                className="bg-teal-500 hover:bg-teal-600 text-white shrink-0"
              >
                Quero ser Parceiro
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
