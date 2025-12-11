import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { InstructorSection } from '@/components/landing/InstructorSection';
import { InvestorSection } from '@/components/landing/InvestorSection';
import { StudentSection } from '@/components/landing/StudentSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { FooterNew } from '@/components/landing/FooterNew';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      const dashboardRoutes = {
        student: '/student/dashboard',
        instructor: '/instructor/dashboard',
        investor: '/investor/dashboard',
      };
      navigate(dashboardRoutes[profile.role] || '/');
    }
  }, [user, profile, loading, navigate]);

  const handleOpenAuth = () => setIsAuthModalOpen(true);

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenAuth={handleOpenAuth} />
      <main>
        <HeroSection onOpenAuth={handleOpenAuth} />
        <StudentSection onOpenAuth={handleOpenAuth} />
        <InstructorSection onOpenAuth={handleOpenAuth} />
        <InvestorSection onOpenAuth={handleOpenAuth} />
        <TrustSection />
      </main>
      <FooterNew />
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </div>
  );
};

export default Index;
