import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Shield, FileCheck, Car, Users, Lock, Award } from 'lucide-react';

const trustItems = [
  {
    icon: Shield,
    label: 'Verificação Detran',
    description: 'Todos instrutores verificados',
  },
  {
    icon: FileCheck,
    label: 'Lei CONTRAN',
    description: 'Conforme Art. 128',
  },
  {
    icon: Car,
    label: 'Inspeção Veicular',
    description: 'Carros com duplo comando',
  },
  {
    icon: Users,
    label: '+500 Instrutores',
    description: 'Parceiros ativos',
  },
  {
    icon: Lock,
    label: 'Pagamento Seguro',
    description: 'Criptografia SSL',
  },
  {
    icon: Award,
    label: '98% Aprovação',
    description: 'Taxa de sucesso',
  },
];

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

export const TrustSection: React.FC = () => {
  return (
    <section className="py-16 bg-slate-100 border-y border-slate-200">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.p 
            variants={itemVariants}
            className="text-center text-sm font-medium text-slate-500 uppercase tracking-wider mb-8"
          >
            Segurança e Conformidade
          </motion.p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {trustItems.map((item) => (
              <motion.div
                key={item.label}
                variants={itemVariants}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3 group-hover:shadow-md group-hover:bg-teal-50 transition-all">
                  <item.icon className="w-6 h-6 text-teal-600" />
                </div>
                <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
