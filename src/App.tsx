import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OnboardingRole from "./pages/OnboardingRole";
import Dashboard from "./pages/Dashboard";
import DashboardEntreprise from "./pages/DashboardEntreprise";
import OfferDetail from "./pages/OfferDetail";
import DashboardTalent from "./pages/DashboardTalent";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOffres from "./pages/AdminOffres";
import AdminSubventions from "./pages/AdminSubventions";
import AdminImportTalents from "./pages/AdminImportTalents";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/onboarding-role"
              element={
                <ProtectedRoute requireRole={false}>
                  <OnboardingRole />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-entreprise"
              element={
                <ProtectedRoute>
                  <DashboardEntreprise />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-entreprise/offres/:id"
              element={
                <ProtectedRoute>
                  <OfferDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-entreprise/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-talent"
              element={
                <ProtectedRoute>
                  <DashboardTalent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/offres"
              element={
                <ProtectedRoute>
                  <AdminOffres />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subventions"
              element={
                <ProtectedRoute>
                  <AdminSubventions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/import-talents"
              element={
                <ProtectedRoute>
                  <AdminImportTalents />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
