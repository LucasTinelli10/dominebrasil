import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Wallet, ArrowUpRight, Landmark, Clock, CheckCircle, XCircle, Zap, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/businessRules";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

interface WalletData {
  balanceAvailable: number;
  balancePending: number;
  totalWithdrawn: number;
  pixKey: string | null;
}

export default function InstructorWallet() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<WalletData>({
    balanceAvailable: 0,
    balancePending: 0,
    totalWithdrawn: 0,
    pixKey: null,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPixKey, setWithdrawPixKey] = useState("");
  const [withdrawType, setWithdrawType] = useState<"standard" | "instant">("standard");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchTransactions();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("balance, balance_pending, total_withdrawn, pix_key")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      setWalletData({
        balanceAvailable: Number(profile.balance) || 0,
        balancePending: Number(profile.balance_pending) || 0,
        totalWithdrawn: Number(profile.total_withdrawn) || 0,
        pixKey: profile.pix_key,
      });
      setWithdrawPixKey(profile.pix_key || "");
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Erro ao carregar dados da carteira");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleWithdrawRequest = async () => {
    const amount = parseFloat(withdrawAmount);
    const fee = withdrawType === "instant" ? 3 : 0;
    const netAmount = amount - fee;

    if (!amount || amount <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    if (amount > walletData.balanceAvailable) {
      toast.error("Saldo insuficiente");
      return;
    }

    if (withdrawType === "instant" && amount <= fee) {
      toast.error("O valor deve ser maior que a taxa de R$ 3,00");
      return;
    }

    if (!withdrawPixKey.trim()) {
      toast.error("Digite sua chave PIX");
      return;
    }

    setIsProcessing(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("request-withdrawal", {
        body: {
          amount,
          pixKey: withdrawPixKey,
          type: withdrawType,
        },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao processar saque");
      }

      toast.success(
        withdrawType === "instant"
          ? "Saque instantâneo solicitado! Você receberá em instantes."
          : "Saque solicitado! Você receberá na próxima quarta-feira."
      );

      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      fetchWalletData();
      fetchTransactions();
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast.error(error.message || "Erro ao solicitar saque");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lesson_income: "Aula",
      platform_fee: "Taxa Plataforma",
      car_rental_fee: "Aluguel Veículo",
      withdrawal: "Saque",
      withdrawal_fee: "Taxa de Saque",
    };
    return labels[type] || type;
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Concluído</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Processando</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isIncomeType = (type: string) => type === "lesson_income";

  const withdrawalFee = withdrawType === "instant" ? 3 : 0;
  const withdrawalNetAmount = parseFloat(withdrawAmount || "0") - withdrawalFee;
  const canWithdraw = 
    parseFloat(withdrawAmount || "0") > 0 &&
    parseFloat(withdrawAmount || "0") <= walletData.balanceAvailable &&
    withdrawPixKey.trim() &&
    (withdrawType === "standard" || withdrawalNetAmount > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minha Carteira</h1>
          <p className="text-muted-foreground">Gerencie seus ganhos e solicite saques</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-green-600">
              <Wallet className="w-4 h-4" />
              Saldo Disponível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(walletData.balanceAvailable)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Disponível para saque</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-yellow-600">
              <Clock className="w-4 h-4" />
              A Receber
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {formatCurrency(walletData.balancePending)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Aguardando liberação</p>
          </CardContent>
        </Card>

        <Card className="border-muted bg-muted/30">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Total Sacado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">
              {formatCurrency(walletData.totalWithdrawn)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Histórico de saques</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Button */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="w-full md:w-auto gap-2" disabled={walletData.balanceAvailable <= 0}>
            <ArrowUpRight className="w-5 h-5" />
            Solicitar Saque
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
            <DialogDescription>
              Saldo disponível: {formatCurrency(walletData.balanceAvailable)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Step A: Value and PIX Key */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="amount">Valor do Saque</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0,00"
                    className="pl-10"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={walletData.balanceAvailable}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pixKey">Chave PIX</Label>
                <Input
                  id="pixKey"
                  placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                  className="mt-1"
                  value={withdrawPixKey}
                  onChange={(e) => setWithdrawPixKey(e.target.value)}
                />
              </div>
            </div>

            {/* Step B: Withdrawal Type */}
            <div className="space-y-3">
              <Label>Modalidade de Recebimento</Label>
              
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  withdrawType === "standard"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-muted hover:border-primary/50"
                }`}
                onClick={() => setWithdrawType("standard")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Recebimento Padrão</p>
                      <p className="text-sm text-muted-foreground">Receber na próxima Quarta-feira</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Grátis
                    </Badge>
                    <Badge variant="outline">Recomendado</Badge>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  withdrawType === "instant"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-muted hover:border-primary/50"
                }`}
                onClick={() => setWithdrawType("instant")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Saque Rápido</p>
                      <p className="text-sm text-muted-foreground">Receber Agora (PIX Imediato)</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
                    Taxa: R$ 3,00
                  </Badge>
                </div>
              </div>

              {/* Summary for instant withdrawal */}
              {withdrawType === "instant" && parseFloat(withdrawAmount || "0") > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Valor do Saque:</span>
                    <span>{formatCurrency(parseFloat(withdrawAmount))}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Taxa:</span>
                    <span>- {formatCurrency(3)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1 mt-1">
                    <span>Você recebe:</span>
                    <span className={withdrawalNetAmount > 0 ? "text-green-600" : "text-red-500"}>
                      {formatCurrency(Math.max(0, withdrawalNetAmount))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleWithdrawRequest} disabled={!canWithdraw || isProcessing}>
              {isProcessing ? "Processando..." : "Confirmar Saque"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>Suas últimas movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getTransactionTypeLabel(transaction.type)}</TableCell>
                    <TableCell>{getTransactionStatusBadge(transaction.status)}</TableCell>
                    <TableCell className={`text-right font-medium ${
                      isIncomeType(transaction.type) ? "text-green-600" : "text-red-500"
                    }`}>
                      {isIncomeType(transaction.type) ? "+" : "-"} {formatCurrency(Math.abs(transaction.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
