import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Calendar, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InstructorDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchBookings();
  }, [profile]);

  const fetchBookings = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles!bookings_student_id_fkey(full_name)')
      .eq('instructor_id', profile.id)
      .eq('status', 'pending');
    setPendingBookings(data || []);
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
              Olá, {profile?.full_name?.split(' ')[0] || 'Instrutor'}!
            </h1>
            <p className="text-sm text-muted-foreground">Painel do Instrutor</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {pendingBookings.length > 0 && (
          <Card className="mb-6 border-warning bg-warning/5">
            <CardContent className="py-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <span className="font-medium">Você tem {pendingBookings.length} solicitação(ões) pendente(s)</span>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Aulas Este Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">0</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Saldo a Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="text-3xl font-bold">R$0</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Saldo Disponível</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                <span className="text-3xl font-bold">R${profile?.balance || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitações Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma solicitação pendente</p>
            ) : (
              <div className="space-y-4">
                {pendingBookings.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div>
                      <p className="font-medium">{booking.profiles?.full_name || 'Aluno'}</p>
                      <p className="text-sm text-muted-foreground">{booking.date} às {booking.time_slot}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Recusar</Button>
                      <Button size="sm">Aceitar</Button>
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

export default InstructorDashboard;
