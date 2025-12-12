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

type Category = 'all' | 'alunos' | 'instrutores' | 'financeiro';

const faqData = {
  alunos: [
    {
      question: 'Como agendar uma aula prática?',
      answer: 'Para agendar, pesquise instrutores na sua cidade, escolha o que mais combina com você, selecione o horário disponível e confirme o agendamento. Você receberá uma confirmação por e-mail e WhatsApp.'
    },
    {
      question: 'Como baixar o PDF de estudo para a prova teórica?',
      answer: 'Após criar sua conta, acesse a seção "Material de Estudo" no seu painel. Lá você encontrará o Kit Aprovação Premium com todos os materiais em PDF para download.'
    },
    {
      question: 'Posso cancelar uma aula agendada?',
      answer: 'Sim! Cancelamentos com mais de 24h de antecedência têm reembolso integral. Entre 24h e 2h, reembolso de 50%. Com menos de 2h, não há reembolso.'
    },
    {
      question: 'Como escolho o melhor instrutor?',
      answer: 'Analise o perfil do instrutor: veja avaliações de outros alunos, taxa de aprovação, anos de experiência, fotos do veículo e a bio pessoal. Assim você toma uma decisão informada.'
    },
    {
      question: 'A plataforma é gratuita para alunos?',
      answer: 'Sim! O uso da plataforma é 100% gratuito para alunos. Você paga apenas o valor da aula diretamente ao instrutor. Sem taxas escondidas.'
    }
  ],
  instrutores: [
    {
      question: 'Como recebo meus pagamentos?',
      answer: 'Os pagamentos são processados semanalmente e depositados na conta bancária cadastrada. Você pode acompanhar todos os ganhos no painel "Financeiro" da sua dashboard.'
    },
    {
      question: 'Como funciona o aluguel do carro?',
      answer: 'Ao aceitar uma aula, você pode usar seu próprio veículo ou alugar da frota Domine. O valor do aluguel (R$50/hora) é descontado automaticamente dos seus ganhos.'
    },
    {
      question: 'Quanto custa usar a plataforma?',
      answer: 'A taxa do sistema é de R$10 por hora de aula. Se você alugar um carro da frota, há uma taxa adicional de R$50/hora. O restante do valor da aula é seu lucro.'
    },
    {
      question: 'Como funciona a verificação de instrutor?',
      answer: 'Enviamos seus documentos (CNH, credencial DETRAN, selfie) para verificação por IA. O processo leva até 24h. Após aprovação, seu perfil fica visível para alunos.'
    },
    {
      question: 'Posso definir meus próprios horários?',
      answer: 'Sim! Você tem total autonomia para definir sua agenda. Configure os dias e horários disponíveis no seu painel e aceite apenas as aulas que deseja.'
    }
  ],
  financeiro: [
    {
      question: 'Quais formas de pagamento são aceitas?',
      answer: 'Aceitamos cartão de crédito, débito e Pix. Todas as transações são processadas por gateways seguros e certificados.'
    },
    {
      question: 'Como funciona o reembolso?',
      answer: 'Reembolsos são processados em até 7 dias úteis. O valor retorna para a mesma forma de pagamento utilizada na compra.'
    },
    {
      question: 'Existe mensalidade ou taxa de cadastro?',
      answer: 'Não! A plataforma não cobra mensalidade nem taxa de cadastro. Alunos usam gratuitamente. Instrutores pagam apenas taxa por aula realizada.'
    },
    {
      question: 'Como funciona a divisão para investidores?',
      answer: 'Investidores recebem 75% do lucro líquido gerado pelo veículo. Os outros 25% ficam com a Domine para administração, suporte e captação de clientes.'
    },
    {
      question: 'Posso emitir nota fiscal?',
      answer: 'Sim! Instrutores podem emitir NFS-e pelos seus serviços. Disponibilizamos relatórios detalhados para facilitar sua contabilidade.'
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
