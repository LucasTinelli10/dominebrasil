import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type UserRole = 'student' | 'instructor' | 'investor' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

// Roles that require verification before accessing the app
const ROLES_REQUIRING_VERIFICATION: UserRole[] = ['instructor', 'investor'];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location, openAuth: true }} replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Check if user role requires verification
  const requiresVerification = ROLES_REQUIRING_VERIFICATION.includes(profile.role);
  
  // Allow access to onboarding and verification-status pages without verification
  const isOnboardingPage = location.pathname === '/onboarding';
  const isVerificationStatusPage = location.pathname === '/verification-status';
  
  if (requiresVerification && !isOnboardingPage && !isVerificationStatusPage) {
    // If user hasn't completed verification, redirect appropriately
    if (profile.verification_status === 'pending') {
      // User needs to complete onboarding first
      return <Navigate to="/onboarding" replace />;
    }
    
    if (profile.verification_status === 'analyzing') {
      // User completed onboarding, waiting for admin approval
      return <Navigate to="/verification-status" replace />;
    }
    
    if (profile.verification_status === 'rejected') {
      // User was rejected, show status page with option to resubmit
      return <Navigate to="/verification-status" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect to the correct dashboard based on role
    const redirectPath = profile.role === 'admin' ? '/admin' : `/app/${profile.role}`;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};