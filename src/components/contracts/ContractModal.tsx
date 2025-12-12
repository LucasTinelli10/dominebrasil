import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, Check, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'aluno' | 'instrutor';
  onAccept: () => void;
}

const alunoContract = {
  title: 'Contrato do Aluno',
  clauses: [
    {
      title: 'Uso Gratuito da Plataforma',
      content: 'O Aluno reconhece que a plataforma DomineBrasil é gratuita para seu uso, pagando apenas o valor da hora/aula diretamente ao instrutor contratado.',
      highlight: true
    },
    {
      title: 'Pontualidade',
      content: 'O Aluno compromete-se a comparecer pontualmente nos horários agendados. Atrasos superiores a 15 minutos podem resultar em cancelamento da aula sem reembolso.'
    },
    {
      title: 'Respeito às Normas de Trânsito',
      content: 'Durante as aulas práticas, o Aluno deve seguir todas as orientações do instrutor e respeitar as leis de trânsito vigentes.'
    },
    {
      title: 'Cancelamentos',
      content: 'Cancelamentos devem ser feitos com antecedência mínima de 24h para reembolso integral. Entre 24h e 2h, reembolso de 50%. Menos de 2h, sem reembolso.'
    },
    {
      title: 'Conduta',
      content: 'O Aluno deve tratar o instrutor e o veículo com respeito. Comportamento inadequado pode resultar em suspensão da conta.'
    }
  ]
};

const instrutorContract = {
  title: 'Contrato do Instrutor Parceiro',
  clauses: [
    {
      title: 'Taxa do Sistema',
      content: 'O Instrutor concorda com o pagamento da Taxa de Sistema de R$10,00 (dez reais) por hora de aula ministrada, retida automaticamente dos recebimentos.',
      highlight: true
    },
    {
      title: 'Aluguel de Veículo',
      content: 'Caso opte por utilizar veículos da frota Domine, o Instrutor concorda com o pagamento do valor fixo de R$50,00 (cinquenta reais) por hora de aluguel, retido automaticamente.',
      highlight: true
    },
    {
      title: 'Zelo com o Veículo',
      content: 'O Instrutor assume responsabilidade total pela manutenção básica e cuidado com o veículo alugado durante o período de uso, incluindo limpeza e verificações de segurança.'
    },
    {
      title: 'Credenciais Válidas',
      content: 'O Instrutor deve manter suas credenciais junto ao DETRAN sempre válidas e atualizadas. A expiração resultará na suspensão temporária do perfil.'
    },
    {
      title: 'Qualidade do Serviço',
      content: 'O Instrutor compromete-se a oferecer aulas de qualidade, com profissionalismo e paciência, respeitando o ritmo de aprendizado de cada aluno.'
    },
    {
      title: 'Exclusividade',
      content: 'Não há exigência de exclusividade. O Instrutor pode atuar em outras plataformas ou de forma independente.'
    }
  ]
};

export const ContractModal: React.FC<ContractModalProps> = ({
  open,
  onOpenChange,
  type,
  onAccept
}) => {
  const [hasRead, setHasRead] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  const contract = type === 'aluno' ? alunoContract : instrutorContract;

  const handleAccept = () => {
    if (hasRead && hasAccepted) {
      onAccept();
      onOpenChange(false);
      setHasRead(false);
      setHasAccepted(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{contract.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Leia atentamente antes de prosseguir
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 mt-4">
          <div className="space-y-6">
            {/* Official Header */}
            <div className="text-center border-b border-border pb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Documento Oficial</span>
              </div>
              <p className="text-xs text-muted-foreground">
                DomineBrasil Plataforma Digital LTDA • CNPJ: XX.XXX.XXX/0001-XX
              </p>
            </div>

            {/* Clauses */}
            <div className="space-y-4">
              {contract.clauses.map((clause, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    clause.highlight 
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' 
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {clause.highlight && (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        {index + 1}. {clause.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {clause.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Separator />

            {/* Acceptance */}
            <div className="space-y-4 pb-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="read"
                  checked={hasRead}
                  onCheckedChange={(checked) => setHasRead(checked as boolean)}
                />
                <label htmlFor="read" className="text-sm text-muted-foreground cursor-pointer">
                  Declaro que li integralmente este contrato e compreendi todas as cláusulas aqui descritas.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept"
                  checked={hasAccepted}
                  onCheckedChange={(checked) => setHasAccepted(checked as boolean)}
                  disabled={!hasRead}
                />
                <label 
                  htmlFor="accept" 
                  className={`text-sm cursor-pointer ${!hasRead ? 'text-muted-foreground/50' : 'text-foreground font-medium'}`}
                >
                  Li, compreendi e assumo as responsabilidades descritas acima.
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t border-border mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={!hasRead || !hasAccepted}
            onClick={handleAccept}
          >
            <Check className="w-4 h-4" />
            Assinar Digitalmente e Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
