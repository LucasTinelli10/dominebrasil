import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Database, Lock, Eye, UserCheck, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const sections = [
  { id: 'coleta', title: 'Coleta de Dados', icon: Database },
  { id: 'uso', title: 'Uso das Informações', icon: Eye },
  { id: 'compartilhamento', title: 'Compartilhamento', icon: UserCheck },
  { id: 'seguranca', title: 'Segurança', icon: Lock },
  { id: 'direitos', title: 'Seus Direitos', icon: Shield },
  { id: 'cookies', title: 'Cookies', icon: Bell },
];

const PrivacyPolicy: React.FC = () => {
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
            <h1 className="text-xl font-bold text-foreground">Política de Privacidade</h1>
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
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">DomineBrasil</h2>
                    <p className="text-muted-foreground">Comprometidos com sua privacidade</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  A DomineBrasil está comprometida em proteger sua privacidade. Esta Política de Privacidade 
                  explica como coletamos, usamos, divulgamos e protegemos suas informações pessoais em 
                  conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                </p>
              </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-8">
              <section id="coleta">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      Coleta de Dados
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>Coletamos os seguintes tipos de informações:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Dados de Identificação:</strong> Nome, CPF, e-mail, telefone</li>
                        <li><strong>Dados de Habilitação:</strong> Número da CNH, categoria, validade</li>
                        <li><strong>Dados de Localização:</strong> Cidade, bairro (para encontrar instrutores)</li>
                        <li><strong>Dados de Pagamento:</strong> Processados por gateway seguro (não armazenamos cartões)</li>
                        <li><strong>Dados de Uso:</strong> Interações com a plataforma, preferências</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="uso">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary" />
                      Uso das Informações
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>Utilizamos suas informações para:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Fornecer e melhorar nossos serviços</li>
                        <li>Conectar alunos a instrutores verificados</li>
                        <li>Processar pagamentos e transações</li>
                        <li>Enviar notificações sobre aulas e atualizações</li>
                        <li>Garantir a segurança e prevenir fraudes</li>
                        <li>Cumprir obrigações legais e regulatórias</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="compartilhamento">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-primary" />
                      Compartilhamento de Dados
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>Podemos compartilhar seus dados com:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Instrutores:</strong> Para agendamento de aulas (apenas dados necessários)</li>
                        <li><strong>Processadores de Pagamento:</strong> Para processar transações</li>
                        <li><strong>Autoridades:</strong> Quando exigido por lei</li>
                      </ul>
                      <p className="mt-4 font-medium text-foreground">
                        Nunca vendemos seus dados pessoais a terceiros.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="seguranca">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary" />
                      Segurança dos Dados
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>Implementamos medidas de segurança rigorosas:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Criptografia de ponta a ponta (SSL/TLS)</li>
                        <li>Armazenamento seguro em servidores certificados</li>
                        <li>Verificação de identidade para instrutores</li>
                        <li>Monitoramento contínuo contra ameaças</li>
                        <li>Backups regulares e plano de recuperação</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="direitos">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Seus Direitos (LGPD)
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>Conforme a LGPD, você tem direito a:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Confirmação da existência de tratamento</li>
                        <li>Acesso aos seus dados</li>
                        <li>Correção de dados incompletos ou desatualizados</li>
                        <li>Anonimização ou eliminação de dados desnecessários</li>
                        <li>Portabilidade dos dados</li>
                        <li>Revogação do consentimento</li>
                      </ul>
                      <p className="mt-4">
                        Para exercer seus direitos, entre em contato: <strong>privacidade@dominebrasil.com</strong>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="cookies">
                <Card>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Cookies e Tecnologias Similares
                    </h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p>Utilizamos cookies para:</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Essenciais:</strong> Funcionamento básico da plataforma</li>
                        <li><strong>Análise:</strong> Entender como você usa nossos serviços</li>
                        <li><strong>Preferências:</strong> Lembrar suas escolhas</li>
                      </ul>
                      <p className="mt-4">
                        Você pode gerenciar cookies nas configurações do seu navegador.
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
                  Dúvidas sobre nossa Política de Privacidade?
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

export default PrivacyPolicy;
