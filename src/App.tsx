import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GA4RouteTracker } from "@/components/GA4RouteTracker";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { DemoBanner } from "@/components/DemoBanner";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SignupLight from "./pages/SignupLight";
import SignupTalent from "./pages/SignupTalent";
import OnboardingRole from "./pages/OnboardingRole";
import Dashboard from "./pages/Dashboard";
import DashboardEntreprise from "./pages/DashboardEntreprise";
import EntrepriseProfile from "./pages/EntrepriseProfile";
import EntrepriseCandidats from "./pages/EntrepriseCandidats";
import OfferDetail from "./pages/OfferDetail";
import DashboardTalent from "./pages/DashboardTalent";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOffres from "./pages/AdminOffres";
import AdminSubventions from "./pages/AdminSubventions";
import AdminImportTalents from "./pages/AdminImportTalents";
import AdminStatistics from "./pages/AdminStatistics";
import AdminLeads from "./pages/AdminLeads";
import AdminQuotes from "./pages/AdminQuotes";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import Billing from "./pages/Billing";
import MetierDetail from "./pages/MetierDetail";
import MetiersEnTension from "./pages/MetiersEnTension";
import DashboardRecruteur from "./pages/DashboardRecruteur";
import LienMagique from "./pages/LienMagique";
import FicheMetierMacon from "./pages/FicheMetierMacon";
import FicheMetierInfirmier from "./pages/FicheMetierInfirmier";
import FicheMetierAideSoignant from "./pages/FicheMetierAideSoignant";
import FicheMetierPeintreBatiment from "./pages/FicheMetierPeintreBatiment";
import FicheMetierTechnicienMaintenance from "./pages/FicheMetierTechnicienMaintenance";

import Rgpd from "./pages/Rgpd";
import RgpdLight from "./pages/RgpdLight";
import Leads from "./pages/Leads";
import PaymentSuccess from "./pages/PaymentSuccess";
import Pricing from "./pages/Pricing";
import APropos from "./pages/APropos";
import Pitch from "./pages/Pitch";
import ResetPassword from "./pages/ResetPassword";
import DemandeDevis from "./pages/DemandeDevis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoBanner />
          <GA4RouteTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/lien-magique" element={<LienMagique />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup-light" element={<SignupLight />} />
            <Route path="/signup-talent" element={<SignupTalent />} />
            <Route path="/metiers-en-tension" element={<MetiersEnTension />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/a-propos" element={<APropos />} />
            <Route path="/pitch" element={<Pitch />} />
            <Route path="/demande-devis" element={<DemandeDevis />} />
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
                <ProtectedRoute allowedRoles={["entreprise", "admin"]}>
                  <DashboardEntreprise />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-entreprise/offres/:id"
              element={
                <ProtectedRoute allowedRoles={["entreprise", "admin"]}>
                  <OfferDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-entreprise/profil"
              element={
                <ProtectedRoute allowedRoles={["entreprise", "admin"]}>
                  <EntrepriseProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-entreprise/candidats"
              element={
                <ProtectedRoute allowedRoles={["entreprise", "admin"]}>
                  <EntrepriseCandidats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-entreprise/billing"
              element={
                <ProtectedRoute allowedRoles={["entreprise", "admin"]}>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-talent"
              element={
                <ProtectedRoute allowedRoles={["talent", "admin"]}>
                  <DashboardTalent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/offres"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminOffres />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subventions"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminSubventions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/import-talents"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminImportTalents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/statistics"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminStatistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quotes"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminQuotes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route path="/metier/:code" element={<MetierDetail />} />
            <Route path="/fiches-metiers/f1703-macon" element={<FicheMetierMacon />} />
            <Route
              path="/dashboard-recruteur"
              element={
                <ProtectedRoute allowedRoles={["recruteur", "admin"]}>
                  <DashboardRecruteur />
                </ProtectedRoute>
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/rgpd" element={<Rgpd />} />
            <Route path="/rgpd-light" element={<RgpdLight />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route
              path="/admin/leads"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLeads />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsentBanner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
