import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const autoResponses: Record<string, string> = {
  'preco': 'Ótima pergunta! Para Alunos, a plataforma é 100% gratuita. Você paga apenas pela aula do instrutor. Instrutores pagam R$10/hora de taxa de sistema, e podem alugar carros por R$50/hora. Investidores recebem 75% do lucro líquido!',
  'preço': 'Ótima pergunta! Para Alunos, a plataforma é 100% gratuita. Você paga apenas pela aula do instrutor. Instrutores pagam R$10/hora de taxa de sistema, e podem alugar carros por R$50/hora. Investidores recebem 75% do lucro líquido!',
  'cadastro': 'Cadastrar-se é simples! Clique em "Login" no topo da página, selecione seu perfil (Aluno, Instrutor ou Investidor) e siga o passo a passo. Para Instrutores, há uma verificação de documentos que leva até 24h.',
  'material': 'Temos o Kit Aprovação Premium com PDFs exclusivos para a prova teórica! Inclui dicas de estudo, macetes de memorização e conteúdo alinhado com o DETRAN. Disponível gratuitamente após criar sua conta.',
  'estudo': 'Temos o Kit Aprovação Premium com PDFs exclusivos para a prova teórica! Inclui dicas de estudo, macetes de memorização e conteúdo alinhado com o DETRAN. Disponível gratuitamente após criar sua conta.',
  'aula': 'Para agendar uma aula, pesquise instrutores na sua cidade, veja avaliações e fotos do veículo, escolha um horário disponível e confirme! Você receberá confirmação por e-mail e WhatsApp.',
  'instrutor': 'Nossos instrutores são verificados pelo sistema! Analisamos CNH, credencial DETRAN e fazemos verificação de identidade. Você pode ver avaliações, experiência e taxa de aprovação de cada um.',
  'cancelar': 'Você pode cancelar aulas com antecedência: até 24h = reembolso total, entre 24h e 2h = 50% reembolso, menos de 2h = sem reembolso. Acesse "Meus Agendamentos" para cancelar.',
  'pagamento': 'Aceitamos Cartão de Crédito, Débito e Pix! Todas as transações são seguras e criptografadas. Instrutores recebem os pagamentos semanalmente.',
  'carro': 'Instrutores podem usar carro próprio ou alugar da frota Domine (R$50/hora). Todos os carros têm duplo comando e são regularizados. Investidores podem cadastrar seus veículos para aluguel!',
};

const getAutoResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  for (const [keyword, response] of Object.entries(autoResponses)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  
  return 'Obrigado pela sua mensagem! Para dúvidas mais específicas, visite nossa Central de Ajuda ou entre em contato pelo e-mail suporte@dominebrasil.com. Posso ajudar com informações sobre Preços, Cadastro, Material de Estudo, Aulas, Instrutores, Pagamentos ou Carros!';
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
