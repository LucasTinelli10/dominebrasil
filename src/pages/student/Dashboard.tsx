import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Search, Star, MapPin, Car, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Instructor {
  id: string;
  full_name: string;
  city: string;
  avatar_url: string;
  details: {
    bio: string;
    price_per_hour: number;
    years_experience: number;
    rating: number;
    badges: string[];
  };
}

const StudentDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [searchCity, setSearchCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      // First get instructor user IDs from user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'instructor');

      if (roleError) throw roleError;

      const instructorIds = (roleData || []).map(r => r.user_id);

      if (instructorIds.length === 0) {
        setInstructors([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`*, instructors_details(*)`)
        .in('id', instructorIds)
        .eq('verification_status', 'approved');

      if (error) throw error;

      const formattedInstructors = (data || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Instrutor',
        city: p.city || 'Cidade não informada',
        avatar_url: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
        details: p.instructors_details?.[0] || { bio: '', price_per_hour: 80, years_experience: 1, rating: 5, badges: [] }
      }));

      setInstructors(formattedInstructors);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const filteredInstructors = instructors.filter(i => 
    !searchCity || i.city.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Olá, {profile?.full_name?.split(' ')[0] || 'Aluno'}!
            </h1>
            <p className="text-sm text-muted-foreground">Encontre seu instrutor ideal</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cidade..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredInstructors.length === 0 ? (
          <div className="text-center py-16">
            <Car className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Nenhum instrutor encontrado</h3>
            <p className="text-muted-foreground">Tente buscar por outra cidade</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstructors.map(instructor => (
              <Card key={instructor.id} className="overflow-hidden hover:shadow-card-hover transition-all cursor-pointer group">
                <div className="h-32 bg-gradient-hero relative">
                  <img
                    src={instructor.avatar_url}
                    alt={instructor.full_name}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-20 h-20 rounded-full border-4 border-card object-cover"
                  />
                </div>
                <CardContent className="pt-12 pb-6 text-center">
                  <h3 className="font-display font-semibold text-lg text-foreground">{instructor.full_name}</h3>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="h-3 w-3" />
                    {instructor.city}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <span className="font-semibold">{instructor.details.rating}</span>
                    <span className="text-muted-foreground text-sm">• {instructor.details.years_experience} anos exp.</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">R${instructor.details.price_per_hour}<span className="text-sm font-normal text-muted-foreground">/hora</span></span>
                    <Button size="sm" onClick={() => toast.info('Em breve: agendamento de aulas!')}>Agendar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
