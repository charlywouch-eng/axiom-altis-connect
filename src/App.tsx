import { Suspense, lazy } from "react";
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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FullPageLoader } from "@/components/FullPageLoader";

// Eager: critical public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy: auth pages
const Signup = lazy(() => import("./pages/Signup"));
const SignupLight = lazy(() => import("./pages/SignupLight"));
const SignupTalent = lazy(() => import("./pages/SignupTalent"));
const OnboardingRole = lazy(() => import("./pages/OnboardingRole"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LienMagique = lazy(() => import("./pages/LienMagique"));

// Lazy: public pages
const MetiersEnTension = lazy(() => import("./pages/MetiersEnTension"));
const Pricing = lazy(() => import("./pages/Pricing"));
const APropos = lazy(() => import("./pages/APropos"));
const Pitch = lazy(() => import("./pages/Pitch"));
const DemandeDevis = lazy(() => import("./pages/DemandeDevis"));
const Rgpd = lazy(() => import("./pages/Rgpd"));
const RgpdLight = lazy(() => import("./pages/RgpdLight"));
const Leads = lazy(() => import("./pages/Leads"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PackAltisSuccess = lazy(() => import("./pages/PackAltisSuccess"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const MetierDetail = lazy(() => import("./pages/MetierDetail"));

// Lazy: fiches métiers
const FichesMetiersIndex = lazy(() => import("./pages/FichesMetiersIndex"));
const FicheMetierMacon = lazy(() => import("./pages/FicheMetierMacon"));
const FicheMetierInfirmier = lazy(() => import("./pages/FicheMetierInfirmier"));
const FicheMetierAideSoignant = lazy(() => import("./pages/FicheMetierAideSoignant"));
const FicheMetierPeintreBatiment = lazy(() => import("./pages/FicheMetierPeintreBatiment"));
const FicheMetierTechnicienMaintenance = lazy(() => import("./pages/FicheMetierTechnicienMaintenance"));
const FicheMetierAuxiliairePuericulture = lazy(() => import("./pages/FicheMetierAuxiliairePuericulture"));
const FicheMetierInfirmierBloc = lazy(() => import("./pages/FicheMetierInfirmierBloc"));
const FicheMetierCouvreur = lazy(() => import("./pages/FicheMetierCouvreur"));
const FicheMetierPlombier = lazy(() => import("./pages/FicheMetierPlombier"));
const FicheMetierCarreleur = lazy(() => import("./pages/FicheMetierCarreleur"));
const FicheMetierCuisinier = lazy(() => import("./pages/FicheMetierCuisinier"));
const FicheMetierServeur = lazy(() => import("./pages/FicheMetierServeur"));
const FicheMetierAgentRestauration = lazy(() => import("./pages/FicheMetierAgentRestauration"));
const FicheMetierChauffeurRoutier = lazy(() => import("./pages/FicheMetierChauffeurRoutier"));
const FicheMetierCariste = lazy(() => import("./pages/FicheMetierCariste"));
const FicheMetierOuvrierAgricole = lazy(() => import("./pages/FicheMetierOuvrierAgricole"));

// Lazy: dashboards (heavy — recharts, jspdf)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardEntreprise = lazy(() => import("./pages/DashboardEntreprise"));
const DashboardTalent = lazy(() => import("./pages/DashboardTalent"));
const DashboardRecruteur = lazy(() => import("./pages/DashboardRecruteur"));
const DashboardSociete = lazy(() => import("./pages/DashboardSociete"));
const EntrepriseProfile = lazy(() => import("./pages/EntrepriseProfile"));
const EntrepriseCandidats = lazy(() => import("./pages/EntrepriseCandidats"));
const OfferDetail = lazy(() => import("./pages/OfferDetail"));
const Billing = lazy(() => import("./pages/Billing"));

// Lazy: admin pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminOffres = lazy(() => import("./pages/AdminOffres"));
const AdminSubventions = lazy(() => import("./pages/AdminSubventions"));
const AdminImportTalents = lazy(() => import("./pages/AdminImportTalents"));
const AdminStatistics = lazy(() => import("./pages/AdminStatistics"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminQuotes = lazy(() => import("./pages/AdminQuotes"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const AdminCandidatures = lazy(() => import("./pages/AdminCandidatures"));
const AdminEmailLogs = lazy(() => import("./pages/AdminEmailLogs"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      throwOnError: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <ErrorBoundary>
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          
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
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/candidatures"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminCandidatures />
                </ProtectedRoute>
              }
            />
            <Route path="/metier/:code" element={<MetierDetail />} />
            <Route path="/fiches-metiers" element={<FichesMetiersIndex />} />
            <Route path="/fiches-metiers/f1703-macon" element={<FicheMetierMacon />} />
            <Route path="/fiches-metiers/m1805-infirmier" element={<FicheMetierInfirmier />} />
            <Route path="/fiches-metiers/j1501-aide-soignant" element={<FicheMetierAideSoignant />} />
            <Route path="/fiches-metiers/f1502-peintre-batiment" element={<FicheMetierPeintreBatiment />} />
            <Route path="/fiches-metiers/i1308-technicien-maintenance" element={<FicheMetierTechnicienMaintenance />} />
            <Route path="/fiches-metiers/j1403-auxiliaire-puericulture" element={<FicheMetierAuxiliairePuericulture />} />
            <Route path="/fiches-metiers/j1103-infirmier-bloc" element={<FicheMetierInfirmierBloc />} />
            <Route path="/fiches-metiers/f1702-couvreur" element={<FicheMetierCouvreur />} />
            <Route path="/fiches-metiers/f1605-plombier-chauffagiste" element={<FicheMetierPlombier />} />
            <Route path="/fiches-metiers/f1603-carreleur" element={<FicheMetierCarreleur />} />
            <Route path="/fiches-metiers/g1602-cuisinier" element={<FicheMetierCuisinier />} />
            <Route path="/fiches-metiers/g1603-serveur" element={<FicheMetierServeur />} />
            <Route path="/fiches-metiers/g1501-agent-polyvalent-restauration" element={<FicheMetierAgentRestauration />} />
            <Route path="/fiches-metiers/n4101-chauffeur-routier" element={<FicheMetierChauffeurRoutier />} />
            <Route path="/fiches-metiers/n1101-cariste" element={<FicheMetierCariste />} />
            <Route path="/fiches-metiers/a1101-ouvrier-agricole" element={<FicheMetierOuvrierAgricole />} />
            <Route
              path="/dashboard-recruteur"
              element={
                <ProtectedRoute allowedRoles={["recruteur", "admin"]}>
                  <DashboardRecruteur />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard-societe"
              element={
                <ProtectedRoute allowedRoles={["entreprise", "admin"]}>
                  <DashboardSociete />
                </ProtectedRoute>
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/rgpd" element={<Rgpd />} />
            <Route path="/rgpd-light" element={<RgpdLight />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/pack-altis-success" element={<PackAltisSuccess />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route
              path="/admin/leads"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLeads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/emails"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminEmailLogs />
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
  </ErrorBoundary>
);

export default App;
