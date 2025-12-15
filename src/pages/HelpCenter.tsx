import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, HelpCircle, User, ShieldCheck, CreditCard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BUSINESS_RULES } from '@/lib/businessRules';

type Category = 'all' | 'alunos' | 'instrutores' | 'financeiro';

const faqData = {
  alunos: [
    {
      question: 'É verdade que a plataforma é GRATUITA para alunos?',
      answer: 'Sim, 100% verdade! Você não paga NADA para usar a Domine. Sem taxa de cadastro, sem mensalidade, sem taxas escondidas. Você paga apenas o valor da aula diretamente ao instrutor. Invista 100% do seu dinheiro no seu aprendizado, não em burocracia.'
    },
    {
      question: 'Tenho CNH mas não dirijo por medo. Vocês podem me ajudar?',
      answer: 'Com certeza! Esse é um dos nossos públicos principais. Nossos instrutores são especializados e PACIENTES. Carros com duplo comando garantem sua segurança total. Milhares de pessoas como você já retomaram a confiança conosco. Você não desaprendeu, só precisa de paciência!'
    },
    {
      question: 'Como escolho o instrutor certo para mim?',
      answer: 'Você tem o PODER DA ESCOLHA! Veja o perfil completo: taxa de aprovação real, anos de experiência, fotos do veículo, tipo de transmissão (manual ou automático), avaliações de outros alunos. Compare e escolha com confiança.'
    },
    {
      question: 'E se eu não gostar do instrutor?',
      answer: 'Sem problemas! Você escolhe outro instrutor sem qualquer penalidade. Cancelamentos com mais de 24h de antecedência têm reembolso integral. Você está sempre no controle.'
    },
    {
      question: 'Os instrutores são realmente verificados?',
      answer: 'Absolutamente! Usamos Inteligência Artificial para verificar CNH, credencial do DETRAN, e fazemos checagem de identidade com selfie. Só instrutores APROVADOS aparecem na plataforma. Sua segurança é prioridade máxima.'
    },
    {
      question: 'Vocês oferecem material de estudo para a prova teórica?',
      answer: 'Sim! O Kit Aprovação Premium é GRATUITO para alunos cadastrados. PDFs exclusivos com dicas, macetes de memorização e conteúdo 100% alinhado com exigências do DETRAN. Tudo para você passar de primeira!'
    }
  ],
  instrutores: [
    {
      question: 'Quanto posso ganhar como instrutor na Domine?',
      answer: `Muito mais do que em autoescola tradicional! Cobrando R$${BUSINESS_RULES.DEFAULT_LESSON_PRICE}/aula, descontando R$${BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR} do aluguel do carro e R$${BUSINESS_RULES.SYSTEM_FEE_PER_HOUR} de taxa do sistema, seu lucro líquido é R$${BUSINESS_RULES.DEFAULT_LESSON_PRICE - BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR - BUSINESS_RULES.SYSTEM_FEE_PER_HOUR}/hora. Com 4 aulas/dia, 22 dias/mês = mais de R$5.000 líquidos! Se usar carro próprio, ganha ainda mais.`
    },
    {
      question: 'Qual a diferença real entre CLT e ser parceiro Domine?',
      answer: `Na CLT você ganha ~R$1.800 fixo, sem autonomia, horários rígidos. Na Domine: você define seus horários, seus preços (mínimo R$${BUSINESS_RULES.MIN_LESSON_PRICE_PER_HOUR}/hora), atende quem quiser. Instrutores ativos ganham 3-4x mais com liberdade total. Seja DONO do seu negócio!`
    },
    {
      question: 'Não tenho carro. Posso trabalhar mesmo assim?',
      answer: `SIM! Esse é nosso diferencial. Alugue carros da frota por R$${BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR}/hora apenas quando tiver aula. Sem compromisso fixo, sem financiamento, sem dor de cabeça. Modelo Asset-Light: você trabalha, não se endivida.`
    },
    {
      question: 'Como funciona a verificação do instrutor?',
      answer: 'Processo 100% digital e rápido: envie CNH, credencial DETRAN e selfie. Nossa IA verifica autenticidade em até 24h. Após aprovação, seu perfil fica visível e você começa a receber alunos imediatamente!'
    },
    {
      question: 'Como e quando recebo meus pagamentos?',
      answer: 'Pagamentos semanais direto na sua conta! Acompanhe tudo em tempo real no painel financeiro. Transparência total: veja cada aula, cada desconto, seu saldo disponível. Dinheiro na mão toda semana.'
    }
  ],
  financeiro: [
    {
      question: 'Como funciona a divisão para investidores (75/25)?',
      answer: 'Simples e justo: você entra com o veículo regularizado, nós cuidamos de TUDO (captação, gestão, suporte). Do lucro líquido gerado pelo seu carro: 75% vai para você, 25% fica com a Domine. Renda passiva de verdade!'
    },
    {
      question: 'Por que investir na Domine é melhor que Uber/99?',
      answer: 'Compare: Uber = 5.000km/mês de desgaste, motoristas amadores, alto risco de inadimplência. Domine = máximo 1.500km/mês, instrutores CREDENCIADOS pelo DETRAN, zero inadimplência (retenção automática). Seu carro rende mais e dura mais!'
    },
    {
      question: 'Quais formas de pagamento são aceitas?',
      answer: 'Cartão de crédito, débito e PIX. Processamento seguro e criptografado. Alunos pagam online, instrutores recebem semanalmente. Tudo rastreável e transparente.'
    },
    {
      question: 'Existe alguma taxa escondida?',
      answer: `NENHUMA! Transparência é nosso valor. Alunos: R$0 (grátis). Instrutores: R$${BUSINESS_RULES.SYSTEM_FEE_PER_HOUR}/hora + R$${BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR} aluguel (opcional). Investidores: apenas a divisão ${BUSINESS_RULES.INVESTOR_PROFIT_PERCENTAGE}/${BUSINESS_RULES.PLATFORM_PROFIT_PERCENTAGE} do lucro. Tudo claro desde o primeiro dia.`
    },
    {
      question: 'Posso emitir nota fiscal dos meus serviços?',
      answer: 'Claro! Instrutores podem emitir NFS-e normalmente. Disponibilizamos relatórios detalhados mensais que facilitam sua contabilidade. Trabalhe legalizado e tranquilo.'
    }
  ]
};

const categories = [
  { id: 'all', label: 'Todas', icon: HelpCircle },
  { id: 'alunos', label: 'Para Alunos', icon: User },
  { id: 'instrutores', label: 'Para Instrutores', icon: ShieldCheck },
  { id: 'financeiro', label: 'Financeiro', icon: CreditCard },
];

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  const getFilteredFaqs = () => {
    let faqs: { question: string; answer: string; category: string }[] = [];
    
    if (selectedCategory === 'all') {
      faqs = [
        ...faqData.alunos.map(f => ({ ...f, category: 'alunos' })),
        ...faqData.instrutores.map(f => ({ ...f, category: 'instrutores' })),
        ...faqData.financeiro.map(f => ({ ...f, category: 'financeiro' })),
      ];
    } else {
      faqs = faqData[selectedCategory].map(f => ({ ...f, category: selectedCategory }));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      faqs = faqs.filter(
        f => f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query)
      );
    }

    return faqs;
  };

  const filteredFaqs = getFilteredFaqs();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Central de Ajuda</h1>
            <p className="text-sm text-muted-foreground">Encontre respostas para suas dúvidas</p>
          </div>
        </div>
      </header>

      {/* Hero Search */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Como podemos ajudar?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Pesquise sua dúvida ou navegue pelas categorias abaixo
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Digite sua pergunta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id as Category)}
              className="gap-2"
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </Button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          {filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Tente uma busca diferente ou entre em contato conosco
                </p>
                <Link to="/contato">
                  <Button>Fale Conosco</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card rounded-xl border border-border/50 px-6 data-[state=open]:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-left py-5 hover:no-underline">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        faq.category === 'alunos' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        faq.category === 'instrutores' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {faq.category === 'alunos' ? 'Alunos' : 
                         faq.category === 'instrutores' ? 'Instrutores' : 'Financeiro'}
                      </span>
                      <span className="font-medium text-foreground">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 pl-[72px]">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Contact CTA */}
        <Card className="max-w-3xl mx-auto mt-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Não encontrou o que procurava?
            </h3>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está pronta para ajudar você
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contato">
                <Button>Fale com o Suporte</Button>
              </Link>
              <a href="mailto:suporte@dominebrasil.com">
                <Button variant="outline">suporte@dominebrasil.com</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpCenter;
