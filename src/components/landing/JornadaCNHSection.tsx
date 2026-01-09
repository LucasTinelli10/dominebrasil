import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Stethoscope, BookOpen, ClipboardCheck, Car, Trophy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    step: 1,
    icon: FileText,
    title: 'Cadastro no Gov.br',
    description: 'O primeiro passo é ter sua conta Prata ou Ouro no Governo Federal e iniciar o processo no Detran do seu estado. Com a CNH Digital, o processo ficou muito mais simples.',
    link: 'https://www.gov.br/pt-br/servicos/obter-a-carteira-nacional-de-habilitacao',
    linkText: 'Acessar Gov.br',
  },
  {
    step: 2,
    icon: Stethoscope,
    title: 'Aptidão Física e Mental',
    description: 'Agende seus exames médicos e psicotécnicos na clínica indicada pelo Detran. Os exames avaliam sua capacidade física e mental para conduzir veículos com segurança.',
    link: null,
    linkText: null,
  },
  {
    step: 3,
    icon: BookOpen,
    title: 'Aulas Teóricas',
    description: 'Estude a legislação de trânsito. Com a nova lei, você pode estudar por conta própria usando material oficial ou fazer curso em CFC (Centro de Formação de Condutores).',
    links: [
      { url: 'https://www.detran.df.gov.br/wp-content/uploads/2020/01/ATUALIZACAO-MANUAL-OBTENCAO-CNH-Maio-2021-Encarte.pdf', label: 'Manual CNH (DETRAN-DF)' },
      { url: 'https://www.detran.am.gov.br/wp-content/uploads/2015/04/ctb.pdf', label: 'Código de Trânsito Brasileiro' },
      { url: 'https://servonline.detran.ms.gov.br/cfc/download/Curso-Primeira-CNH.pdf', label: 'Apostila Primeira CNH (DETRAN-MS)' },
    ],
    linkText: 'Baixar Apostilas Oficiais',
    hasMultipleLinks: true,
  },
  {
    step: 4,
    icon: ClipboardCheck,
    title: 'Exame Escrito',
    description: 'Acerte pelo menos 70% das questões (21 de 30) no Detran. A prova é realizada em computador e o resultado sai na hora. Prepare-se bem!',
    link: null,
    linkText: null,
  },
  {
    step: 5,
    icon: Car,
    title: 'Aprendizagem Veicular',
    description: 'Com a LADV (Licença de Aprendizagem de Direção Veicular) em mãos, contrate um instrutor credenciado para suas aulas práticas. É aqui que o DomineBrasil te ajuda!',
    link: null,
    linkText: 'Encontrar Instrutor',
    isInternal: true,
  },
  {
    step: 6,
    icon: Trophy,
    title: 'Prova de Direção',
    description: 'O teste final de baliza e percurso para conquistar sua PPD (Permissão para Dirigir). Após 1 ano sem infrações graves, você recebe a CNH definitiva!',
    link: null,
    linkText: null,
  },
];

interface JornadaCNHSectionProps {
  onOpenAuth?: () => void;
}

export const JornadaCNHSection: React.FC<JornadaCNHSectionProps> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  return (
    <section id="jornada-cnh" className="py-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Guia Oficial
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Jornada da <span className="text-primary">Habilitação</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conheça todas as etapas para conquistar sua CNH. Seguimos a legislação brasileira e direcionamos você aos órgãos oficiais.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-12 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex gap-6"
              >
                {/* Icon Circle */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-card shadow-lg border-2 border-primary/20 flex items-center justify-center">
                    <step.icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                  </div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-card rounded-2xl p-6 shadow-md border border-border/50 hover:shadow-lg transition-shadow">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Etapa {step.step}
                  </span>
                  <h3 className="text-xl font-bold text-foreground mt-1 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {step.description}
                  </p>
                  
                  {step.linkText && (
                    step.isInternal ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/buscar-instrutor')}
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        {step.linkText}
                        <Car className="w-4 h-4 ml-2" />
                      </Button>
                    ) : step.hasMultipleLinks && step.links ? (
                      <div className="flex flex-wrap gap-2">
                        {step.links.map((link, linkIndex) => (
                          <Button
                            key={linkIndex}
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-primary/50 text-primary hover:bg-primary/10 text-xs"
                          >
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              {link.label}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <a href={step.link!} target="_blank" rel="noopener noreferrer">
                          {step.linkText}
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    )
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Está na etapa 5? O DomineBrasil conecta você aos melhores instrutores!
          </p>
          <Button size="lg" onClick={() => navigate('/buscar-instrutor')} className="shadow-lg">
            Encontrar Instrutor
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
