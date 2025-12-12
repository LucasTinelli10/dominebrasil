import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Users, CreditCard, AlertTriangle, Scale, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const sections = [
  { id: 'aceitacao', title: 'Aceitação dos Termos', icon: FileText },
  { id: 'responsabilidades', title: 'Responsabilidades', icon: Users },
  { id: 'uso', title: 'Uso da Plataforma', icon: Scale },
  { id: 'pagamentos', title: 'Pagamentos', icon: CreditCard },
  { id: 'cancelamentos', title: 'Cancelamentos', icon: RefreshCw },
  { id: 'restricoes', title: 'Restrições', icon: AlertTriangle },
];

const TermsOfUse: React.FC = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

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
            <h1 className="text-xl font-bold text-foreground">Termos de Uso</h1>
            <p className="text-sm text-muted-foreground">Última atualização: Dezembro 2024</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-4">Navegação Rápida</h3>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      <section.icon className="w-4 h-4" />
                      {section.title}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-3xl">
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Termos de Uso</h2>
                    <p className="text-muted-foreground">DomineBrasil Plataforma</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Bem-vindo à DomineBrasil! Estes Termos de Uso regulam o acesso e uso de nossa 
                  plataforma. Ao utilizar nossos serviços, você concorda com estes termos.
                </p>
              </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-8">
              <section id="aceitacao">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Aceitação dos Termos
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        Ao acessar ou usar a plataforma DomineBrasil, você confirma que:
                      </p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Tem pelo menos 18 anos de idade</li>
                        <li>Possui capacidade legal para celebrar contratos</li>
                        <li>Leu, entendeu e concorda com estes Termos</li>
                        <li>Concorda com nossa Política de Privacidade</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="responsabilidades">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Responsabilidades do Usuário
                    </h3>
                    <div className="space-y-6 text-muted-foreground">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Para Alunos:</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Fornecer informações verdadeiras e atualizadas</li>
                          <li>Comparecer pontualmente às aulas agendadas</li>
                          <li>Respeitar as normas de trânsito durante as aulas</li>
                          <li>Tratar o instrutor e o veículo com respeito</li>
                          <li>Comunicar cancelamentos com antecedência mínima de 24h</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Para Instrutores:</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Manter credenciais válidas junto ao DETRAN</li>
                          <li>Oferecer aulas de qualidade e profissionalismo</li>
                          <li>Zelar pelo veículo (próprio ou alugado)</li>
                          <li>Cumprir horários acordados com os alunos</li>
                          <li>Reportar qualquer incidente ou irregularidade</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Para Investidores:</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Fornecer veículos em condições adequadas</li>
                          <li>Manter documentação do veículo regularizada</li>
                          <li>Garantir que o veículo possui duplo comando</li>
                          <li>Manter seguro do veículo em dia</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="uso">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-primary" />
                      Uso da Plataforma
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>A DomineBrasil é uma plataforma que conecta:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Alunos que buscam aulas práticas de direção</li>
                        <li>Instrutores credenciados pelo DETRAN</li>
                        <li>Investidores que disponibilizam veículos</li>
                      </ul>
                      <p className="mt-4">
                        A plataforma atua como intermediária, facilitando a conexão entre as partes. 
                        A relação de prestação de serviços é direta entre o aluno e o instrutor.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="pagamentos">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Pagamentos e Taxas
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Para Alunos:</h4>
                        <p>O uso da plataforma é gratuito. Você paga apenas pelo valor da aula ao instrutor.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Para Instrutores:</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Taxa de sistema: R$10 por hora/aula</li>
                          <li>Aluguel de veículo (se aplicável): R$50 por hora/aula</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Para Investidores:</h4>
                        <p>Divisão de lucros: 75% investidor / 25% administração Domine</p>
                      </div>
                      <p className="mt-4 text-sm">
                        Os pagamentos são processados de forma segura através de gateways certificados.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="cancelamentos">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-primary" />
                      Cancelamentos e Reembolsos
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Política de Cancelamento:</h4>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li><strong>Até 24h antes:</strong> Reembolso integral</li>
                          <li><strong>Entre 24h e 2h antes:</strong> Reembolso de 50%</li>
                          <li><strong>Menos de 2h:</strong> Sem reembolso</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Não comparecimento (No-show):</h4>
                        <p>
                          Se o aluno não comparecer sem aviso prévio, o instrutor receberá o valor 
                          integral da aula. Casos recorrentes podem resultar em suspensão da conta.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="restricoes">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                      Restrições e Proibições
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>É expressamente proibido:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Fornecer informações falsas ou fraudulentas</li>
                        <li>Usar a plataforma para fins ilegais</li>
                        <li>Assediar, ameaçar ou intimidar outros usuários</li>
                        <li>Tentar burlar os sistemas de pagamento</li>
                        <li>Compartilhar credenciais de acesso</li>
                        <li>Violar direitos de propriedade intelectual</li>
                      </ul>
                      <p className="mt-4 font-medium text-foreground">
                        Violações podem resultar em suspensão ou banimento permanente da plataforma.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            <Separator className="my-8" />

            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Dúvidas sobre nossos Termos de Uso?
                </p>
                <Link to="/ajuda">
                  <Button variant="outline">Fale Conosco</Button>
                </Link>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
