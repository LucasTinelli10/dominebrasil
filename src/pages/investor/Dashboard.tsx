import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Car, Plus, DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const InvestorDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState<any[]>([]);

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
                <span className="text-3xl font-bold">{cars.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
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
                <TrendingUp className="h-5 w-5 text-warning" />
                <span className="text-3xl font-bold">0%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Meus Veículos</CardTitle>
            <Button onClick={() => toast.info('Em breve: adicionar veículo!')}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Carro
            </Button>
          </CardHeader>
          <CardContent>
            {cars.length === 0 ? (
              <div className="text-center py-12">
                <Car className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Você ainda não tem veículos cadastrados</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {cars.map(car => (
                  <div key={car.id} className="flex gap-4 p-4 bg-accent rounded-lg">
                    <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden">
                      {car.image_url && <img src={car.image_url} alt={car.model} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-semibold">{car.model}</p>
                      <p className="text-sm text-muted-foreground">{car.plate} • {car.transmission === 'auto' ? 'Automático' : 'Manual'}</p>
                      <p className="text-sm text-primary font-medium">R${car.price_per_hour}/hora</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InvestorDashboard;
