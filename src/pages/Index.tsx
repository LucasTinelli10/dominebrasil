import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { InstructorSection } from '@/components/landing/InstructorSection';
import { InvestorSection } from '@/components/landing/InvestorSection';
import { StudentSection } from '@/components/landing/StudentSection';
import { JornadaCNHSection } from '@/components/landing/JornadaCNHSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { FooterNew } from '@/components/landing/FooterNew';
import { PricingSection } from '@/components/landing/PricingSection';
import { WhyChooseSection } from '@/components/landing/WhyChooseSection';
import { AuthModal } from '@/components/auth/AuthModal';
import { AIChatWidget } from '@/components/chat/AIChatWidget';
import { useAuth } from '@/contexts/AuthContext';

type PreselectedRole = 'student' | 'instructor' | 'investor' | undefined;

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [preselectedRole, setPreselectedRole] = useState<PreselectedRole>(undefined);
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

  const handleOpenAuth = () => {
    setPreselectedRole(undefined);
    setIsAuthModalOpen(true);
  };

  const handleOpenInstructorAuth = () => {
    setPreselectedRole('instructor');
    setIsAuthModalOpen(true);
  };

  const handleOpenInvestorAuth = () => {
    setPreselectedRole('investor');
    setIsAuthModalOpen(true);
  };

  const handleCloseAuth = (open: boolean) => {
    setIsAuthModalOpen(open);
    if (!open) {
      setPreselectedRole(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenAuth={handleOpenAuth} />
      <main>
        <HeroSection 
          onOpenAuth={handleOpenAuth} 
          onOpenInstructorAuth={handleOpenInstructorAuth}
          onOpenInvestorAuth={handleOpenInvestorAuth}
        />
        <StudentSection />
        <HowItWorksSection />
        <WhyChooseSection />
        <PricingSection />
        <JornadaCNHSection />
        <InstructorSection onOpenAuth={handleOpenInstructorAuth} />
        <InvestorSection onOpenAuth={handleOpenInvestorAuth} />
        <TrustSection />
      </main>
      <FooterNew />
      <AIChatWidget />
      <AuthModal 
        open={isAuthModalOpen} 
        onOpenChange={handleCloseAuth} 
        preselectedRole={preselectedRole}
      />
    </div>
  );
};

export default Index;
