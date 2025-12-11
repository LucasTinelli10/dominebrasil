import React from 'react';
import { motion, Variants, Easing } from 'framer-motion';
import { Heart, Users, Shield, Calendar, Star, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StudentSectionProps {
  onOpenAuth: () => void;
}

const features = [
  {
    icon: Users,
    title: 'Escolha seu Instrutor',
    description: 'Veja fotos, avaliações e escolha alguém calmo e paciente. Instrutores preparados para quem está inseguro.',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
  {
    icon: Shield,
    title: 'Carros 100% Seguros',
    description: 'Todos os veículos possuem duplo comando de freio e são inspecionados regularmente. Sua segurança em primeiro lugar.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Calendar,
    title: 'No seu Tempo',
    description: 'Agende pelo app, sem burocracia de balcão. Remarque ou cancele quando precisar, sem estresse.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
];

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'Aluna - São Paulo',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    text: 'Tirei minha CNH há 10 anos e nunca mais dirigi. Com o instrutor certo, voltei a ter confiança.',
    rating: 5,
  },
  {
    name: 'Carlos Santos',
    role: 'Aluno - Rio de Janeiro',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    text: 'As aulas particulares fizeram toda diferença. Ambiente calmo, sem pressão. Super recomendo!',
    rating: 5,
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

export const StudentSection: React.FC<StudentSectionProps> = ({ onOpenAuth }) => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-teal-100 rounded-full blur-[150px] opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium mb-4">
              Para Alunos
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Você não desaprendeu.{' '}
              <span className="text-teal-600">Você só precisa de prática.</span>
            </h2>
            <p className="text-lg text-slate-600">
              Sabemos como é difícil voltar a dirigir depois de anos parado. 
              Conectamos você a instrutores pacientes e preparados para te ajudar.
            </p>
          </motion.div>

          {/* Empathy Banner */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto mb-16">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">
                    Mais de 20 milhões de brasileiros têm CNH mas não dirigem
                  </h3>
                  <p className="text-teal-100 text-lg">
                    Você não está sozinho. Seja por medo, falta de prática ou insegurança no trânsito — 
                    com o instrutor certo, você vai reconquistar sua liberdade.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-7 h-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonials */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto mb-12">
            <h3 className="text-center text-2xl font-bold text-slate-900 mb-8">
              Histórias de Superação
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="bg-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-600 mb-4 italic">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{testimonial.name}</p>
                        <p className="text-sm text-slate-500">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="text-center">
            <Button 
              onClick={onOpenAuth}
              size="lg"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8"
            >
              Encontrar meu Instrutor
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-slate-500 text-sm mt-4">
              Primeira aula com 50% de desconto
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
