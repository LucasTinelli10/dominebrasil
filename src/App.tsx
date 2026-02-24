import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import InstructorSearch from "./pages/InstructorSearch";
import HelpCenter from "./pages/HelpCenter";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import NotFound from "./pages/NotFound";
import VerificationStatus from "./pages/VerificationStatus";

// App Layout
import { AppLayout } from "./components/layouts/AppLayout";

// Instructor App Pages
import InstructorHome from "./pages/app/instructor/InstructorHome";
import InstructorRequests from "./pages/app/instructor/InstructorRequests";
import InstructorSchedule from "./pages/app/instructor/InstructorSchedule";
import InstructorWallet from "./pages/app/instructor/InstructorWallet";
import InstructorMessages from "./pages/app/instructor/InstructorMessages";
import InstructorProfile from "./pages/app/instructor/InstructorProfile";
import InstructorCars from "./pages/app/instructor/InstructorCars";
import InstructorPackages from "./pages/app/instructor/InstructorPackages";

// Investor App Pages
import InvestorHome from "./pages/app/investor/InvestorHome";
import InvestorFleet from "./pages/app/investor/InvestorFleet";
import InvestorMaintenance from "./pages/app/investor/InvestorMaintenance";
import InvestorFinances from "./pages/app/investor/InvestorFinances";

// Student App Pages
import StudentHome from "./pages/app/student/StudentHome";
import StudentLessons from "./pages/app/student/StudentLessons";
import StudentProgress from "./pages/app/student/StudentProgress";
import StudentHistory from "./pages/app/student/StudentHistory";
import StudentMessages from "./pages/app/student/StudentMessages";
import PaymentSuccess from "./pages/app/student/PaymentSuccess";

// Settings
import Settings from "./pages/app/Settings";

// Legacy pages
import InstructorOnboarding from "./pages/instructor/Onboarding";
import AdminVerifications from "./pages/admin/Verifications";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminRevenue from "./pages/admin/Revenue";
import AdminWithdrawals from "./pages/admin/Withdrawals";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/buscar-instrutor" element={<InstructorSearch />} />
            <Route path="/ajuda" element={<HelpCenter />} />
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos" element={<TermsOfUse />} />

            {/* App Routes with Sidebar Layout */}
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* Student Routes */}
              <Route path="student" element={<ProtectedRoute allowedRoles={['student']}><StudentHome /></ProtectedRoute>} />
              <Route path="student/search" element={<ProtectedRoute allowedRoles={['student']}><InstructorSearch /></ProtectedRoute>} />
              <Route path="student/lessons" element={<ProtectedRoute allowedRoles={['student']}><StudentLessons /></ProtectedRoute>} />
              <Route path="student/progress" element={<ProtectedRoute allowedRoles={['student']}><StudentProgress /></ProtectedRoute>} />
              <Route path="student/history" element={<ProtectedRoute allowedRoles={['student']}><StudentHistory /></ProtectedRoute>} />
              <Route path="student/messages" element={<ProtectedRoute allowedRoles={['student']}><StudentMessages /></ProtectedRoute>} />
              <Route path="student/settings" element={<ProtectedRoute allowedRoles={['student']}><Settings /></ProtectedRoute>} />

              {/* Instructor Routes */}
              <Route path="instructor" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorHome /></ProtectedRoute>} />
              <Route path="instructor/requests" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorRequests /></ProtectedRoute>} />
              <Route path="instructor/schedule" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorSchedule /></ProtectedRoute>} />
              <Route path="instructor/wallet" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorWallet /></ProtectedRoute>} />
              <Route path="instructor/cars" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorCars /></ProtectedRoute>} />
              <Route path="instructor/messages" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorMessages /></ProtectedRoute>} />
              <Route path="instructor/profile" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorProfile /></ProtectedRoute>} />
              <Route path="instructor/packages" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorPackages /></ProtectedRoute>} />
              <Route path="instructor/settings" element={<ProtectedRoute allowedRoles={['instructor']}><Settings /></ProtectedRoute>} />

              {/* Investor Routes */}
              <Route path="investor" element={<ProtectedRoute allowedRoles={['investor']}><InvestorHome /></ProtectedRoute>} />
              <Route path="investor/fleet" element={<ProtectedRoute allowedRoles={['investor']}><InvestorFleet /></ProtectedRoute>} />
              <Route path="investor/maintenance" element={<ProtectedRoute allowedRoles={['investor']}><InvestorMaintenance /></ProtectedRoute>} />
              <Route path="investor/finances" element={<ProtectedRoute allowedRoles={['investor']}><InvestorFinances /></ProtectedRoute>} />
              <Route path="investor/settings" element={<ProtectedRoute allowedRoles={['investor']}><Settings /></ProtectedRoute>} />
            </Route>

            {/* Payment Success (outside AppLayout - redirected from Stripe) */}
            <Route path="/app/student/payment-success" element={<ProtectedRoute allowedRoles={['student']}><PaymentSuccess /></ProtectedRoute>} />

            {/* Legacy Routes (redirect support) */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Navigate to="/app/student" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <Navigate to="/app/instructor" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <Navigate to="/app/investor" replace />
                </ProtectedRoute>
              }
            />
            <Route path="/onboarding" element={<ProtectedRoute allowedRoles={['instructor', 'investor']}><InstructorOnboarding /></ProtectedRoute>} />
            <Route path="/verification-status" element={<ProtectedRoute allowedRoles={['instructor', 'investor']}><VerificationStatus /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminVerifications /></ProtectedRoute>} />
            <Route path="/admin/revenue" element={<ProtectedRoute allowedRoles={['admin']}><AdminRevenue /></ProtectedRoute>} />
            <Route path="/admin/withdrawals" element={<ProtectedRoute allowedRoles={['admin']}><AdminWithdrawals /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin" replace /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;