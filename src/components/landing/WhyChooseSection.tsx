import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, BookOpen, Smartphone, Star, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const features = [
  {
    icon: UserCheck,
    title: 'O Poder da Escolha',
    description: 'Chega de depender da sorte. Aqui você escolhe o melhor instrutor da sua cidade. Analise o perfil, veja a taxa de aprovação, fotos do veículo e avaliações reais antes de contratar.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: BookOpen,
    title: 'Kit Aprovação Premium',
    description: 'Não te deixamos na mão na teórica. Tenha acesso a um PDF exclusivo com Dicas de Estudo, macetes de memorização e material de apoio alinhado com as exigências oficiais do DETRAN.',
    color: 'from-primary to-teal-600'
  },
  {
    icon: Smartphone,
    title: 'Tecnologia a seu Favor',
    description: 'Passo a passo detalhado para realizar a prova sem nervosismo, agendamento online e suporte contínuo. Tudo na palma da sua mão.',
    color: 'from-indigo-500 to-purple-600'
  }
];

const additionalFeatures = [
  { icon: Star, text: 'Instrutores verificados e avaliados' },
  { icon: Shield, text: 'Plataforma 100% segura' },
  { icon: Clock, text: 'Flexibilidade total de horários' }
];

export const WhyChooseSection: React.FC = () => {
  return (
    <section id="por-que-domine" className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span 
            variants={itemVariants}
            className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4"
          >
            Diferenciais
          </motion.span>
          <motion.h2 
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Por Que Escolher a <span className="text-primary">Domine</span>?
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Transformamos a forma como você conquista sua habilitação
          </motion.p>
        </motion.div>

        {/* Main Features */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full bg-card hover:shadow-xl transition-all duration-300 border-border/50 group">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex items-center gap-2 px-6 py-3 bg-card rounded-full border border-border/50 shadow-sm"
            >
              <feature.icon className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
