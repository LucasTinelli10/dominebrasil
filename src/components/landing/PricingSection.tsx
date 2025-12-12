import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, TrendingUp, Check, Calculator, PieChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

type ProfileType = 'aluno' | 'instrutor' | 'investidor' | null;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ProfileCard: React.FC<{
  type: ProfileType;
  title: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ title, icon, isSelected, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5 shadow-lg' 
          : 'hover:shadow-md border-border/50'
      }`}
    >
      <CardContent className="p-6 text-center">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
      </CardContent>
    </Card>
  </motion.div>
);

const AlunoContent: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="mt-12"
  >
    <div className="text-center mb-8">
      <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
        Liberdade custa <span className="text-green-600">ZERO</span> reais.
      </h3>
    </div>

    <Card className="max-w-2xl mx-auto bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
      <CardContent className="p-8 text-center">
        <div className="mb-6">
          <span className="text-7xl md:text-8xl font-bold text-green-600">R$ 0</span>
          <span className="text-2xl text-green-600">,00</span>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Taxa de matrícula e uso da plataforma
        </p>
        
        <div className="space-y-4 text-left max-w-md mx-auto">
          {[
            'Sem mensalidades',
            'Sem taxas escondidas',
            'Sem burocracia',
            'Pague apenas pela aula do instrutor'
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-foreground">{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
          <p className="text-green-800 dark:text-green-200 font-medium">
            "Invista 100% do seu dinheiro no seu aprendizado, não em burocracia."
          </p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const InstrutorContent: React.FC = () => {
  const [horasSemanais, setHorasSemanais] = useState([20]);
  const valorAula = 120;
  const taxaSistema = 10;
  const aluguelCarro = 50;

  const horasMensais = horasSemanais[0] * 4;
  const receitaBruta = horasMensais * valorAula;
  const custoSistema = horasMensais * taxaSistema;
  const custoAluguel = horasMensais * aluguelCarro;
  const lucroLiquido = receitaBruta - custoSistema - custoAluguel;
  
  // Comparação com autoescola tradicional (CLT ~R$15/aula)
  const lucroAutoescola = horasMensais * 15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mt-12"
    >
      <div className="text-center mb-8">
        <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Seu trabalho, seu <span className="text-primary">lucro real</span>.
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Chega de receber uma pequena comissão por hora/aula. Aqui você aluga a ferramenta (o carro), 
          paga uma taxa justa pelo sistema e o resto do lucro é todo seu.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Calculadora */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-6 h-6 text-primary" />
              <h4 className="text-xl font-bold text-foreground">Calculadora de Ganhos</h4>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Horas de aula por semana: <span className="text-primary font-bold">{horasSemanais[0]}h</span>
              </label>
              <Slider
                value={horasSemanais}
                onValueChange={setHorasSemanais}
                min={5}
                max={40}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Receita Bruta ({horasMensais}h × R${valorAula})</span>
                <span className="font-bold text-green-600">R$ {receitaBruta.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Taxa do Sistema ({horasMensais}h × R${taxaSistema})</span>
                <span className="font-medium text-red-500">- R$ {custoSistema.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Aluguel do Carro ({horasMensais}h × R${aluguelCarro})</span>
                <span className="font-medium text-red-500">- R$ {custoAluguel.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between py-3 bg-green-100 dark:bg-green-900/30 rounded-lg px-3 mt-4">
                <span className="font-bold text-foreground">Seu Lucro Líquido Mensal</span>
                <span className="font-bold text-2xl text-green-600">R$ {lucroLiquido.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparativo */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <h4 className="text-xl font-bold text-foreground mb-6">Comparativo de Ganhos</h4>
            
            <div className="space-y-6">
              {/* Autoescola Tradicional */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Autoescola CLT</span>
                  <span className="font-medium">R$ {lucroAutoescola.toLocaleString('pt-BR')}/mês</span>
                </div>
                <div className="h-8 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-400 rounded-full transition-all duration-500"
                    style={{ width: `${(lucroAutoescola / lucroLiquido) * 100}%` }}
                  />
                </div>
              </div>

              {/* Modelo Domine */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-primary font-medium">Modelo Domine</span>
                  <span className="font-bold text-green-600">R$ {lucroLiquido.toLocaleString('pt-BR')}/mês</span>
                </div>
                <div className="h-8 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-500"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Diferença */}
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl text-center">
                <p className="text-sm text-muted-foreground mb-1">Você ganha</p>
                <p className="text-3xl font-bold text-green-600">
                  +{Math.round(((lucroLiquido - lucroAutoescola) / lucroAutoescola) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">a mais com a Domine</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-6 text-center italic">
              "Você é o dono do seu negócio."
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

const InvestidorContent: React.FC = () => {
  const investidorPercent = 75;
  const dominePercent = 25;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mt-12"
    >
      <div className="text-center mb-8">
        <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Renda Passiva <span className="text-indigo-600">Inteligente</span>.
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Nós cuidamos da gestão, manutenção e captação de alunos. 
          Você entra com o ativo (veículo) e recolhe a maior parte dos lucros.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Pie Chart Visual */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-6 h-6 text-indigo-600" />
              <h4 className="text-xl font-bold text-foreground">Divisão de Lucros</h4>
            </div>

            {/* Simple Pie Chart */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Investidor slice (75%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgb(79 70 229)"
                  strokeWidth="20"
                  strokeDasharray={`${investidorPercent * 2.51} ${100 * 2.51}`}
                  className="transition-all duration-1000"
                />
                {/* Domine slice (25%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgb(168 162 217)"
                  strokeWidth="20"
                  strokeDasharray={`${dominePercent * 2.51} ${100 * 2.51}`}
                  strokeDashoffset={`-${investidorPercent * 2.51}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl font-bold text-indigo-600">{investidorPercent}%</span>
                  <p className="text-xs text-muted-foreground">Seu lucro</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-indigo-600" />
                <span className="text-foreground font-medium">Investidor: {investidorPercent}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-indigo-300" />
                <span className="text-muted-foreground">Domine (Administração): {dominePercent}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <h4 className="text-xl font-bold text-foreground mb-6">O que você ganha</h4>
            
            <div className="space-y-4">
              {[
                { title: 'Gestão Completa', desc: 'Cuidamos de tudo: agendamentos, cobranças e suporte.' },
                { title: 'Captação de Instrutores', desc: 'Encontramos instrutores verificados para usar seu veículo.' },
                { title: 'Seguro e Manutenção', desc: 'Orientação sobre seguros e acompanhamento do veículo.' },
                { title: 'Dashboard de Ganhos', desc: 'Acompanhe seus rendimentos em tempo real.' },
                { title: 'Matemática Transparente', desc: 'Sem taxas escondidas. 75% do lucro líquido é seu.' }
              ].map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <p className="text-indigo-800 dark:text-indigo-200 font-medium text-center">
                "Matemática transparente e justa."
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export const PricingSection: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>(null);

  return (
    <section id="precos" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.span 
            variants={itemVariants}
            className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4"
          >
            Preços Transparentes
          </motion.span>
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Qual é o seu objetivo na <span className="text-primary">Domine</span>?
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Selecione seu perfil e descubra como a Domine pode te ajudar
          </motion.p>
        </motion.div>

        {/* Profile Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants}>
            <ProfileCard
              type="aluno"
              title="Sou Aluno"
              icon={<User className="w-8 h-8" />}
              isSelected={selectedProfile === 'aluno'}
              onClick={() => setSelectedProfile(selectedProfile === 'aluno' ? null : 'aluno')}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ProfileCard
              type="instrutor"
              title="Sou Instrutor"
              icon={<ShieldCheck className="w-8 h-8" />}
              isSelected={selectedProfile === 'instrutor'}
              onClick={() => setSelectedProfile(selectedProfile === 'instrutor' ? null : 'instrutor')}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ProfileCard
              type="investidor"
              title="Sou Investidor"
              icon={<TrendingUp className="w-8 h-8" />}
              isSelected={selectedProfile === 'investidor'}
              onClick={() => setSelectedProfile(selectedProfile === 'investidor' ? null : 'investidor')}
            />
          </motion.div>
        </motion.div>

        {/* Content Areas */}
        <AnimatePresence mode="wait">
          {selectedProfile === 'aluno' && <AlunoContent key="aluno" />}
          {selectedProfile === 'instrutor' && <InstrutorContent key="instrutor" />}
          {selectedProfile === 'investidor' && <InvestidorContent key="investidor" />}
        </AnimatePresence>
      </div>
    </section>
  );
};
