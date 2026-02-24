import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Star, Shield, ArrowLeft, CalendarDays, User, Package } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { BookingModal } from '@/components/booking/BookingModal';
import { InstructorProfileModal } from '@/components/instructor/InstructorProfileModal';
import { useAuth } from '@/contexts/AuthContext';

interface Instructor {
  id: string;
  full_name: string;
  city: string;
  avatar_url: string | null;
  price_per_hour: number;
  rating: number | null;
  bio: string | null;
  years_experience: number | null;
  badges: string[] | null;
}

const InstructorSearch = () => {
  const [city, setCity] = useState('');
  const [transmission, setTransmission] = useState<string>('');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isInsideApp = location.pathname.startsWith('/app/');

  const handleSearch = async () => {
    if (!city.trim()) return;
    
    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase.rpc('get_all_approved_instructors');
      
      if (error) throw error;
      
      const instructorProfiles = (data || [])
        .filter((instructor: any) => 
          instructor.city?.toLowerCase().includes(city.toLowerCase())
        )
        .map((instructor: any) => ({
          id: instructor.instructor_id,
          full_name: instructor.full_name,
          city: instructor.city,
          avatar_url: instructor.avatar_url,
          price_per_hour: instructor.price_per_hour || 120,
          rating: instructor.rating,
          bio: instructor.bio,
          years_experience: instructor.years_experience,
          badges: instructor.badges,
        })) as Instructor[];

      setInstructors(instructorProfiles);
    } catch (error) {
      console.error('Error searching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setIsProfileModalOpen(true);
  };

  const handleBookInstructor = (instructor: Instructor) => {
    if (!user) {
      setIsAuthModalOpen(true);
      setSelectedInstructor(instructor);
    } else {
      setSelectedInstructor(instructor);
      setIsProfileModalOpen(false);
      setIsBookingModalOpen(true);
    }
  };

  // After auth, open booking modal
  useEffect(() => {
    if (user && selectedInstructor && !isBookingModalOpen && !isAuthModalOpen && !isProfileModalOpen) {
      setIsBookingModalOpen(true);
    }
  }, [user, selectedInstructor]);

  return (
    <div className={isInsideApp ? "" : "min-h-screen bg-gradient-to-b from-slate-50 to-white"}>
      {/* Header - only on public route */}
      {!isInsideApp && (
        <header className="bg-slate-900 text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="text-white hover:text-teal-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-display font-bold">D</span>
              </div>
              <span className="font-display font-bold text-lg">
                Domine<span className="text-teal-400">Brasil</span>
              </span>
            </div>
          </div>
        </header>
      )}

      <div className="container mx-auto px-4 py-12">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Encontre seu <span className="text-teal-600">Instrutor</span>
            </h1>
            <p className="text-slate-600">
              Busque instrutores verificados na sua cidade
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                    Sua cidade
                  </Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="city"
                      placeholder="Ex: Campo Grande, MS"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Câmbio
                  </Label>
                  <Select value={transmission} onValueChange={setTransmission}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSearch}
                className="w-full mt-4 bg-teal-600 hover:bg-teal-700"
                disabled={loading || !city.trim()}
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Buscando...' : 'Buscar Instrutores'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {searched && (
          <div className="max-w-4xl mx-auto">
            {instructors.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Nenhum instrutor encontrado
                </h3>
                <p className="text-slate-600">
                  Não encontramos instrutores verificados em "{city}". Tente outra cidade.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-slate-900 mb-6">
                  {instructors.length} instrutor{instructors.length > 1 ? 'es' : ''} encontrado{instructors.length > 1 ? 's' : ''}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {instructors.map((instructor) => (
                    <Card key={instructor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <img
                            src={instructor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.full_name || 'I')}&background=0d9488&color=fff`}
                            alt={instructor.full_name || 'Instrutor'}
                            className="w-20 h-20 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-teal-500 transition-all"
                            onClick={() => handleViewProfile(instructor)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 
                                className="font-semibold text-slate-900 cursor-pointer hover:text-teal-600 transition-colors"
                                onClick={() => handleViewProfile(instructor)}
                              >
                                {instructor.full_name}
                              </h3>
                              <Shield className="w-4 h-4 text-teal-500" />
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                              <MapPin className="w-3 h-3" />
                              {instructor.city || 'Local não informado'}
                            </div>
                            {instructor.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="text-sm font-medium">
                                  {instructor.rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {instructor.bio && (
                          <p className="text-sm text-slate-600 mt-4 line-clamp-2">
                            {instructor.bio}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                          <div>
                            <span className="text-2xl font-bold text-teal-600">
                              R$ {instructor.price_per_hour}
                            </span>
                            <span className="text-sm text-slate-500">/hora</span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProfile(instructor)}
                            >
                              <User className="w-4 h-4 mr-1" />
                              Ver Perfil
                            </Button>
                            <Button 
                              onClick={() => handleBookInstructor(instructor)}
                              className="bg-teal-600 hover:bg-teal-700"
                              size="sm"
                            >
                              <CalendarDays className="w-4 h-4 mr-1" />
                              Agendar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Initial State */}
        {!searched && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Digite sua cidade para começar
            </h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Encontre instrutores verificados pelo Detran na sua região. 
              Todos passam por verificação rigorosa de documentos.
            </p>
          </div>
        )}
      </div>

      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
      <BookingModal 
        open={isBookingModalOpen} 
        onOpenChange={setIsBookingModalOpen}
        instructor={selectedInstructor}
      />
      <InstructorProfileModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        instructor={selectedInstructor}
        onBookNow={() => handleBookInstructor(selectedInstructor!)}
      />
    </div>
  );
};

export default InstructorSearch;
