import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Car, Plus, DollarSign, TrendingUp, Shield, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AddCarWizard from '@/components/investor/AddCarWizard';

const InvestorDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState<any[]>([]);
  const [showAddCarWizard, setShowAddCarWizard] = useState(false);

  useEffect(() => {
    if (profile) fetchCars();
  }, [profile]);

  const fetchCars = async () => {
    const { data } = await supabase
      .from('cars')
      .select('*')
      .eq('owner_id', profile?.id);
    setCars(data || []);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'analyzing':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Analisando</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" />Reprovado</Badge>;
      default:
        return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const approvedCars = cars.filter(c => c.verification_status === 'approved');

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Olá, {profile?.full_name?.split(' ')[0] || 'Investidor'}!
            </h1>
            <p className="text-sm text-muted-foreground">Painel do Investidor</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Veículos na Frota</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{approvedCars.length}</span>
                {cars.length > approvedCars.length && (
                  <span className="text-sm text-muted-foreground">({cars.length - approvedCars.length} em análise)</span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-3xl font-bold">R$0</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Taxa de Ocupação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                <span className="text-3xl font-bold">0%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Meus Veículos</CardTitle>
            <Button onClick={() => setShowAddCarWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Carro
            </Button>
          </CardHeader>
          <CardContent>
            {cars.length === 0 ? (
              <div className="text-center py-12">
                <Car className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">Você ainda não tem veículos cadastrados</p>
                <Button variant="outline" onClick={() => setShowAddCarWizard(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Veículo
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {cars.map(car => (
                  <div key={car.id} className="flex gap-4 p-4 bg-accent rounded-lg">
                    <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                      {car.image_url ? (
                        <img src={car.image_url} alt={car.model} className="w-full h-full object-cover" />
                      ) : (
                        <Car className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{car.model}</p>
                          <p className="text-sm text-muted-foreground">{car.plate} • {car.transmission === 'auto' ? 'Automático' : 'Manual'}</p>
                          <p className="text-sm text-primary font-medium">R${car.price_per_hour}/hora</p>
                        </div>
                        {getStatusBadge(car.verification_status)}
                      </div>
                      {car.verification_status === 'rejected' && car.ai_analysis_report?.rejection_reason_pt && (
                        <p className="text-xs text-red-600 mt-2">{car.ai_analysis_report.rejection_reason_pt}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AddCarWizard
        open={showAddCarWizard}
        onOpenChange={setShowAddCarWizard}
        onSuccess={fetchCars}
      />
    </div>
  );
};

export default InvestorDashboard;
