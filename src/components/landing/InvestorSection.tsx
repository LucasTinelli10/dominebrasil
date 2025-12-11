import React from 'react';
import { motion, Variants, Easing } from 'framer-motion';
import { Car, Shield, TrendingUp, Check, X, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InvestorSectionProps {
  onOpenAuth: () => void;
}

const comparisonData = [
  {
    metric: 'Km Rodados/Mês',
    uber: '5.000 km',
    domine: '1.500 km',
    insight: 'Preserva o ativo',
  },
  {
    metric: 'Quem dirige',
    uber: 'Motorista Amador',
    domine: 'Instrutor Credenciado',
    insight: 'Máxima segurança',
  },
  {
    metric: 'Risco de Inadimplência',
    uber: 'Alto',
    domine: 'Zero',
    insight: 'Pagamento antecipado',
  },
  {
    metric: 'Custo de Manutenção',
    uber: 'R$ 800/mês',
    domine: 'R$ 200/mês',
    insight: '4x menos gastos',
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

const tableRowVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
    },
  },
};

export const InvestorSection: React.FC<InvestorSectionProps> = ({ onOpenAuth }) => {
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxZTI5M2IiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTItNCAwLTQgMCAyIDQgMiA0czIgMiA0IDIgNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium mb-4">
              Para Investidores
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              O fim do pesadelo do{' '}
              <span className="text-amber-400">carro de aplicativo.</span>
            </h2>
            <p className="text-lg text-slate-300">
              Compare o modelo tradicional de aluguel para Uber com a nossa proposta.
            </p>
          </motion.div>

          {/* Comparison Table */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto mb-12">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="grid grid-cols-3 bg-slate-800/50 p-4 border-b border-white/10">
                  <div className="text-sm font-medium text-slate-400">Métrica</div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-sm font-bold text-red-400">Uber/99</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-teal-500 rounded-full" />
                      <span className="text-sm font-bold text-teal-400">Domine Fleet</span>
                    </div>
                  </div>
                </div>

                {/* Table Rows */}
                {comparisonData.map((row) => (
                  <motion.div
                    key={row.metric}
                    variants={tableRowVariants}
                    className="grid grid-cols-3 p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <span className="text-white font-medium">{row.metric}</span>
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center gap-2 text-red-400">
                        <X className="w-4 h-4" />
                        {row.uber}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center gap-2 text-teal-400 font-bold">
                          <Check className="w-4 h-4" />
                          {row.domine}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">{row.insight}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Summary Row */}
                <div className="grid grid-cols-3 p-6 bg-gradient-to-r from-slate-800/50 to-teal-900/30">
                  <div>
                    <span className="text-white font-bold text-lg">Retorno Mensal</span>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-slate-400">~R$ 2.000</span>
                    <p className="text-xs text-red-400 mt-1">Com alta manutenção</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-teal-400">~R$ 2.000</span>
                    <p className="text-xs text-teal-300 mt-1">Com 4x menos custos!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Cards */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
              <Car className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Carros até 12 anos</h3>
              <p className="text-slate-400 text-sm">
                Aceitos pela Lei 14.921/2024. Rentabilize seu veículo por mais tempo.
              </p>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
              <Shield className="w-10 h-10 text-teal-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Seguro Total</h3>
              <p className="text-slate-400 text-sm">
                Instrutores verificados e credenciados. Seu patrimônio em boas mãos.
              </p>
            </Card>
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6">
              <TrendingUp className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Zero Inadimplência</h3>
              <p className="text-slate-400 text-sm">
                Pagamento antecipado pelo aluno. Você recebe antes da aula acontecer.
              </p>
            </Card>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="text-center">
            <Button 
              onClick={onOpenAuth}
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8"
            >
              Cadastrar minha frota
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-slate-500 text-sm mt-4">
              Sem taxa de adesão. Comece a ganhar hoje.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
