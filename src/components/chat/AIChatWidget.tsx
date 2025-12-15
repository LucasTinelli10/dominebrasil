import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BUSINESS_RULES } from '@/lib/businessRules';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const autoResponses: Record<string, string[]> = {
  'gratis|gratuito|gratuita|free': [
    'Sim! A plataforma é 100% GRATUITA para alunos. Você não paga nenhuma taxa - apenas o valor da aula diretamente ao instrutor. Sem mensalidades, sem taxas escondidas!'
  ],
  'preco|preço|quanto custa|valor': [
    `Ótima pergunta! Para Alunos: R$0 (totalmente grátis). Para Instrutores: R$${BUSINESS_RULES.SYSTEM_FEE_PER_HOUR}/hora de taxa do sistema + R$${BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR}/hora de aluguel de carro (opcional, se não tiver carro próprio). Valor mínimo por aula: R$${BUSINESS_RULES.MIN_LESSON_PRICE_PER_HOUR}. Para Investidores: divisão ${BUSINESS_RULES.INVESTOR_PROFIT_PERCENTAGE}% para você e ${BUSINESS_RULES.PLATFORM_PROFIT_PERCENTAGE}% para a Domine do lucro gerado pelo veículo.`
  ],
  'cadastro|cadastrar|criar conta|registro': [
    'Cadastrar-se é super simples! Clique em "Login" no topo, escolha seu perfil (Aluno, Instrutor ou Investidor) e siga o passo a passo. Para Alunos é instantâneo! Para Instrutores, há uma verificação de documentos (CNH e credencial DETRAN) que leva até 24h.'
  ],
  'instrutor|professor|aula pratica': [
    'Nossos instrutores são rigorosamente verificados com IA! Analisamos CNH, credencial do DETRAN e fazemos verificação de identidade. Você pode ver avaliações reais, taxa de aprovação, experiência e fotos do veículo de cada um antes de escolher. Só os melhores aparecem na plataforma!'
  ],
  'medo|insegurança|nao dirijo|ansiedade': [
    'Você não está sozinho! Milhares de pessoas têm CNH mas não dirigem por insegurança. Nossos instrutores são especializados e MUITO pacientes. Todos os carros têm duplo comando, então você está 100% seguro. Já ajudamos milhares a retomar a confiança!'
  ],
  'carro|veiculo|aluguel|frota': [
    `Para Instrutores: você pode usar seu próprio carro OU alugar da frota Domine por R$${BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR}/hora (valor fixo tabelado), apenas quando tiver aula. Sem compromisso fixo! Para Investidores: cadastre seu veículo regularizado com duplo comando e receba ${BUSINESS_RULES.INVESTOR_PROFIT_PERCENTAGE}% do lucro. Nós cuidamos de tudo!`
  ],
  'ganho|ganhar|lucro|salario|renda': [
    `Instrutores na Domine ganham MUITO mais que em autoescola! Exemplo: R$${BUSINESS_RULES.DEFAULT_LESSON_PRICE}/aula - R$${BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR} (carro) - R$${BUSINESS_RULES.SYSTEM_FEE_PER_HOUR} (taxa) = R$${BUSINESS_RULES.DEFAULT_LESSON_PRICE - BUSINESS_RULES.CAR_RENTAL_PRICE_PER_HOUR - BUSINESS_RULES.SYSTEM_FEE_PER_HOUR} líquido/hora. Com 4 aulas/dia, 22 dias/mês = mais de R$5.000! Se usar carro próprio, R$${BUSINESS_RULES.DEFAULT_LESSON_PRICE - BUSINESS_RULES.SYSTEM_FEE_PER_HOUR} líquido/hora. Compare com os R$1.800 CLT...`
  ],
  'pagamento|pagar|cartao|pix': [
    'Aceitamos Cartão de Crédito, Débito e PIX! Todas as transações são seguras e criptografadas. Instrutores recebem os pagamentos semanalmente direto na conta bancária. Tudo transparente e rastreável!'
  ],
  'cancelar|cancelamento|reembolso': [
    'Política clara: cancelamento com mais de 24h = 100% de reembolso. Entre 24h e 2h = 50% reembolso. Menos de 2h = sem reembolso. Acesse "Meus Agendamentos" no painel para cancelar. Simples assim!'
  ],
  'seguro|segurança|verificacao|verificado': [
    'Segurança é nossa prioridade #1! Todos os instrutores passam por verificação com IA: análise de CNH, credencial DETRAN, e reconhecimento facial. Carros têm duplo comando obrigatório. Só profissionais APROVADOS aparecem na plataforma.'
  ],
  'investidor|investir|frota|renda passiva': [
    `Para Investidores é ótimo! Você entra com o veículo (regularizado, com duplo comando) e nós cuidamos de TUDO: captação de clientes, gestão, suporte. Divisão justa: ${BUSINESS_RULES.INVESTOR_PROFIT_PERCENTAGE}% do lucro para você, ${BUSINESS_RULES.PLATFORM_PROFIT_PERCENTAGE}% para a Domine. Muito melhor que Uber/99!`
  ],
  'material|estudo|teorica|prova': [
    'Temos o Kit Aprovação Premium GRATUITO! PDFs exclusivos com dicas de estudo, macetes de memorização e conteúdo 100% alinhado com as exigências do DETRAN. Disponível após criar sua conta. Muitos alunos passam de primeira!'
  ],
  'contato|falar|humano|atendente': [
    'Precisa falar com nossa equipe? Email: suporte@dominebrasil.com ou acesse a Central de Ajuda no site. Respondemos em até 24h úteis! Também pode me perguntar sobre qualquer dúvida aqui no chat.'
  ],
  'cnh|habilitacao|primeira habilitacao': [
    'Quer tirar sua primeira CNH? A Domine te ajuda na etapa 5 (aulas práticas)! Temos um Guia Oficial completo com todas as etapas da habilitação. Clique em "Jornada CNH" no menu para ver o passo a passo completo.'
  ],
  'domine|plataforma|como funciona': [
    'A DomineBrasil conecta Alunos que querem aprender a dirigir com Instrutores credenciados independentes. Investidores disponibilizam carros para aluguel. É como um Uber/Airbnb para aulas de direção! Alunos escolhem o melhor instrutor, e todo mundo ganha.'
  ]
};

const getAutoResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [keywords, responses] of Object.entries(autoResponses)) {
    const keywordList = keywords.split('|');
    for (const keyword of keywordList) {
      if (lowerMessage.includes(keyword)) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  }
  
  return `Obrigado pela sua mensagem! 😊 

Posso te ajudar com informações sobre:
• Preços - custos para alunos, instrutores e investidores
• Cadastro - como criar sua conta
• Instrutores - como escolher e como funciona a verificação
• Carros - aluguel de veículos da frota
• Pagamentos - formas aceitas e prazos
• Material de Estudo - Kit Aprovação Premium
• CNH - etapas da habilitação

Digite uma dessas palavras ou faça sua pergunta! Se preferir falar com um humano: suporte@dominebrasil.com`;
};

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Olá! 👋 Sou a assistente virtual da Domine. Posso te ajudar a entender como funcionam nossos planos para Alunos, Instrutores ou Investidores. Como posso ajudar?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getAutoResponse(inputValue),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="w-16 h-16 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="w-7 h-7" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-120px)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Assistente Domine</h3>
                  <p className="text-xs opacity-80">Online agora</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${message.isBot ? '' : 'flex-row-reverse'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.isBot ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {message.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[75%] p-3 rounded-2xl ${
                      message.isBot 
                        ? 'bg-muted text-foreground rounded-tl-sm' 
                        : 'bg-primary text-primary-foreground rounded-tr-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.isBot ? 'text-muted-foreground' : 'opacity-70'}`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted p-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon" disabled={!inputValue.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
