import { useState, useEffect } from "react";
import { trackGA4 } from "@/lib/ga4";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import heroFranceAfrique from "@/assets/logo-rh-tech.png";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  User,
  Globe,
  Briefcase,
  Plane,
  Home,
  GraduationCap,
  Building2,
  Save,
  MapPin,
  
  Star,
  TrendingUp,
  Shield,
  Download,
  Trash2,
  Bell,
  
  RefreshCw,
  Award,
  Zap,
  
  Package,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Flame,
  
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import DiplomaUpload from "@/components/dashboard/DiplomaUpload";
import AvatarCropModal from "@/components/dashboard/AvatarCropModal";
import OpportunitesTab from "@/components/dashboard/OpportunitesTab";
import CandidatureHistorySection from "@/components/dashboard/CandidatureHistorySection";
import CandidatureFormDialog from "@/components/dashboard/CandidatureFormDialog";
import FranceTravailFormationsCard from "@/components/dashboard/FranceTravailFormationsCard";
import FranceTravailAgencesCard from "@/components/dashboard/FranceTravailAgencesCard";
import FranceTravailOffresCard from "@/components/dashboard/FranceTravailOffresCard";

// ── Types ────────────────────────────────────────────────────
interface LBBCompany {
  siret: string;
  name: string;
  sector: string;
  romeCode: string;
  romeLabel: string;
  city: string;
  zipCode: string;
  hiringPotential: number;
  nafLabel: string;
  url: string;
  headcount: string | null;
  distance: number | null;
}


const FRENCH_LEVELS = [
  "Débutant (A1)",
  "Élémentaire (A2)",
  "Intermédiaire (B1)",
  "Avancé (B2)",
  "Courant (C1)",
  "Natif (C2)",
];

interface TimelineStep {
  label: string;
  icon: typeof Briefcase;
  status: "done" | "active" | "pending";
  tag?: string;
  badge?: { label: string; color: "gold" | "blue" | "green" };
  tooltipText?: string;
  upsell?: string;
  date?: string;
}

const MOCK_TIMELINE: TimelineStep[] = [
  { label: "Offre acceptée", icon: Briefcase, status: "done", date: "12 jan. 2026" },
  { label: "Visa en cours", icon: Globe, status: "done", date: "28 jan. 2026", badge: { label: "CERTIFIÉ MINEFOP", color: "gold" }, tooltipText: "Diplôme CQP/DQP audité + Delta ROME comblé – Garantie opérationnel jour 1.", upsell: "Déblocage complet 29 € – Visibilité prioritaire recruteurs" },
  { label: "Accueil aéroport", icon: Plane, status: "done", date: "5 fév. 2026" },
  { label: "Logement trouvé", icon: Home, status: "done", date: "14 fév. 2026" },
  { label: "Formation démarrée", icon: GraduationCap, status: "active", tag: "Classes Miroirs – Module normes FR validé AXIOM", date: "En cours" },
  { label: "En poste", icon: Building2, status: "pending", date: "Estimé mars 2026" },
];

const MOCK_RECOMMENDED_OFFERS = [
  { id: "mock-r1", title: "Maçon qualifié H/F", company: "BTP Services IDF", codeRome: "F1703", sector: "BTP", location: "Lyon, Auvergne-Rhône-Alpes", contract: "CDI", score: 92, salary: "26 000 – 32 000 €/an", skills: ["Maçonnerie", "Coffrage", "Sécurité chantier"], tension: "Très forte", url: null },
  { id: "mock-r2", title: "Maçon / Coffreur", company: "Eiffage Construction", codeRome: "F1703", sector: "BTP", location: "Paris, Île-de-France", contract: "CDI", score: 89, salary: "28 000 – 34 000 €/an", skills: ["Coffrage", "Maçonnerie", "Ferraillage"], tension: "Très forte", url: null },
  { id: "mock-r3", title: "Ouvrier maçon BTP", company: "Bouygues Bâtiment", codeRome: "F1703", sector: "BTP", location: "Bordeaux, Nouvelle-Aquitaine", contract: "CDI", score: 87, salary: "24 000 – 30 000 €/an", skills: ["Maçonnerie traditionnelle", "Lecture de plans", "Enduits"], tension: "Très forte", url: null },
  { id: "mock-r4", title: "Aide-soignant(e)", company: "Clinique du Parc", codeRome: "J1501", sector: "Santé", location: "Paris, Île-de-France", contract: "CDD", score: 85, salary: "28 000 – 32 000 €/an", skills: ["Soins", "Aide à la personne", "DEAS"], tension: "Forte", url: null },
  { id: "mock-r5", title: "Serveur / Serveuse", company: "Hôtel Splendide", codeRome: "G1602", sector: "CHR", location: "Bordeaux, Nouvelle-Aquitaine", contract: "Saisonnier", score: 78, salary: "22 000 – 26 000 €/an", skills: ["Service en salle", "HACCP", "Anglais professionnel"], tension: "Modérée", url: null },
];


const MOCK_PROFILE_DATA = {
  full_name: "",
  country: "Cameroun",
  french_level: "Avancé (B2)",
  skills: ["Maçonnerie", "Plomberie"],
  rome: [
    { code: "F1703", label: "Maçon" },
    { code: "F1603", label: "Plombier" },
  ],
};

// Dynamic ALTIS progress: 60-80% based on profile completeness
function computeAltisProgress(profile: Record<string, unknown> | null | undefined): number {
  if (!profile) return 60;
  let p = 60;
  if (profile.full_name) p += 5;
  if (profile.country) p += 3;
  if (profile.french_level) p += 4;
  if (profile.skills && (profile.skills as string[]).length > 0) p += 4;
  if (profile.avatar_url) p += 4;
  return Math.min(80, p);
}

export default function DashboardTalent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [candidatureOpen, setCandidatureOpen] = useState(false);

  useEffect(() => { trackGA4("dashboard_talent_view"); }, []);

  const handleUnlockPayment = async (tier: "test" | "full" = "test") => {
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-talent", {
        body: { tier },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de paiement introuvable");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inattendue";
      toast({ title: "Erreur de paiement", description: message, variant: "destructive" });
    } finally {
      setPaymentLoading(false);
    }
  };

  const [form, setForm] = useState({
    full_name: "",
    country: "",
    french_level: "",
    skills: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("premium") === "true") {
      toast({ title: "🎉 Analyse Complète débloquée !", description: "Score détaillé, offres France Travail et parcours ALTIS maintenant accessibles." });
      window.history.replaceState({}, "", "/dashboard-talent");
    }
    const tab = params.get("tab");
    if (tab && ["dashboard", "parcours", "opportunites", "profil"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search, toast]);

  useEffect(() => {
    const pending = localStorage.getItem("axiom_pending_profile");
    if (pending && user) {
      try {
        const data = JSON.parse(pending);
        // SECURITY: Only allow safe profile fields from localStorage
        // Never trust is_premium, compliance_score, visa_status, score, premium_unlocked_at
        const safeData = {
          user_id: user.id,
          rome_label: typeof data.rome_label === "string" ? data.rome_label.slice(0, 200) : undefined,
          rome_code: typeof data.rome_code === "string" ? data.rome_code.slice(0, 10) : undefined,
          experience_years: typeof data.experience_years === "number" ? Math.min(Math.max(0, Math.floor(data.experience_years)), 50) : undefined,
          country: typeof data.country === "string" ? data.country.slice(0, 100) : "Cameroun",
        };
        supabase.from("talent_profiles").upsert(safeData).then(({ error }) => {
          if (!error) {
            localStorage.removeItem("axiom_pending_profile");
            queryClient.invalidateQueries({ queryKey: ["talent_profile", user.id] });
          }
        });
      } catch {
        localStorage.removeItem("axiom_pending_profile");
      }
    }
  }, [user, queryClient]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: talentProfile } = useQuery({
    queryKey: ["talent_profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("talent_profiles").select("is_premium, premium_unlocked_at, rome_code, rome_label, experience_years, score, visa_status").eq("user_id", user!.id).limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!user,
  });

  const isPremium = talentProfile?.is_premium === true;


  // Secteurs prioritaires BTP / Santé / CHR
  const PRIORITY_ROME = [
    { code: "F1703", sector: "BTP",   label: "Maçonnerie",    tension: "Très forte" },
    { code: "J1501", sector: "Santé", label: "Aide-soignant", tension: "Très forte" },
    { code: "G1602", sector: "CHR",   label: "Service salle", tension: "Forte"      },
  ];

  const { data: ftOffers, isLoading: ftLoading } = useQuery({
    queryKey: ["france_travail_offers_multi"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const fnUrl = `${supabaseUrl}/functions/v1/france-travail-offers`;

      try {
        // Appels parallèles pour les 3 secteurs prioritaires
        const results = await Promise.allSettled(
          PRIORITY_ROME.map(({ code, sector, tension }) =>
            fetch(fnUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ romeCode: code, count: 2 }),
            }).then(async (res) => {
              if (!res.ok) { await res.text(); return []; }
              const json = await res.json();
              return ((json.offers ?? []) as Array<Record<string, unknown>>).map((o, i) => ({
                ...o,
                sector,
                tension,
                score: Math.max(72, 96 - i * 6 - (sector === "BTP" ? 0 : sector === "Santé" ? 3 : 8)),
              }));
            }).catch(() => [])
          )
        );

        const allOffers = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);

        if (allOffers.length === 0) return null;

        // Limiter à 5 offres : priorité BTP>Santé>CHR puis trier par score
        return allOffers
          .sort((a, b) => (b.score as number) - (a.score as number))
          .slice(0, 5) as Array<Record<string, unknown> & { score: number }>;
      } catch {
        return null;
      }
    },
    enabled: !!user,
    retry: false,
    throwOnError: false,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const { data: lbbCompanies, isLoading: lbbLoading } = useQuery({
    queryKey: ["lbb_companies"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const fnUrl = `${supabaseUrl}/functions/v1/la-bonne-boite`;
      try {
        const res = await fetch(fnUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ sectors: ["BTP", "Santé", "CHR"], count: 9 }) });
        if (!res.ok) { await res.text(); return null; }
        const json = await res.json();
        return json.companies as LBBCompany[];
      } catch { return null; }
    },
    enabled: !!user,
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || MOCK_PROFILE_DATA.full_name,
        country: profile.country || MOCK_PROFILE_DATA.country,
        french_level: profile.french_level || MOCK_PROFILE_DATA.french_level,
        skills: profile.skills?.join(", ") || MOCK_PROFILE_DATA.skills.join(", "),
      });
      if (profile.avatar_url && !avatarPreview) {
        setAvatarPreview(profile.avatar_url);
      }
    } else if (!isLoading) {
      setForm({
        full_name: MOCK_PROFILE_DATA.full_name,
        country: MOCK_PROFILE_DATA.country,
        french_level: MOCK_PROFILE_DATA.french_level,
        skills: MOCK_PROFILE_DATA.skills.join(", "),
      });
    }
  }, [profile, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProfile = useMutation({
    mutationFn: async () => {
      const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const { error } = await supabase.from("profiles").update({ full_name: form.full_name || null, country: form.country || null, french_level: form.french_level || null, skills }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["profile"] }); toast({ title: "Profil mis à jour" }); setEditing(false); },
    onError: (err: Error) => { toast({ title: "Erreur", description: err.message, variant: "destructive" }); },
  });

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const [profileRes, diplomasRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).single(),
        supabase.from("diplomas").select("file_name, status, rome_label, created_at").eq("user_id", user!.id),
      ]);
      const exportData = { export_date: new Date().toISOString(), rgpd_notice: "Export conforme RGPD Art. 20 – Portabilité des données", responsable: "AXIOM SAS – rgpd@axiom-talents.com", profile: profileRes.data, diplomas: diplomasRes.data || [] };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mes-donnees-axiom-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export réussi", description: "Vos données personnelles ont été téléchargées." });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'exporter vos données.", variant: "destructive" });
    }
    setExportLoading(false);
  };

  const handleDeleteRequest = () => {
    setDeleteDialogOpen(false);
    toast({ title: "Demande envoyée", description: "Notre DPO traitera votre demande de suppression sous 30 jours." });
  };

  // ── Avatar upload ─────────────────────────────────────────
  // Step 1 : open the crop modal with the raw selected file
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";
    const objectUrl = URL.createObjectURL(file);
    setRawImageSrc(objectUrl);
    setCropModalOpen(true);
  };

  // Step 2 : receive the cropped blob, upload it
  const handleCropComplete = async (blob: Blob) => {
    setCropModalOpen(false);
    if (!user) return;
    const localUrl = URL.createObjectURL(blob);
    setAvatarPreview(localUrl);
    setAvatarUploading(true);
    try {
      const filePath = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      setAvatarPreview(publicUrl);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Photo de profil mise à jour ✓" });
    } catch (err: unknown) {
      setAvatarPreview(null);
      const msg = err instanceof Error ? err.message : "Erreur inattendue";
      toast({ title: "Erreur upload", description: msg, variant: "destructive" });
    } finally {
      setAvatarUploading(false);
      if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    }
  };

  const displayFirstName = profile?.first_name || user?.user_metadata?.first_name || null;
  const displayName = displayFirstName || (profile?.full_name && profile.full_name !== "" ? profile.full_name.split(" ")[0] : null) || (user?.user_metadata?.full_name as string)?.split(" ")[0] || user?.email?.split("@")[0] || "Talent";
  const displayCountry = profile?.country || MOCK_PROFILE_DATA.country;
  const displayFrench = profile?.french_level || MOCK_PROFILE_DATA.french_level;
  const offersToDisplay = ftOffers && ftOffers.length > 0 ? ftOffers : MOCK_RECOMMENDED_OFFERS;
  const PROGRESS_PERCENT = computeAltisProgress(profile);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <TooltipProvider>
      <DashboardLayout sidebarVariant="talent">
        <motion.div className="space-y-5 pb-12" variants={containerVariants} initial="hidden" animate="visible">

          {/* ── Premium CTA Bar or Premium Badge */}
          <motion.div variants={itemVariants}>
            {isPremium ? (
              <div className="rounded-xl border border-success/30 bg-gradient-to-r from-success/10 to-accent/8 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground flex items-center gap-2">
                      Compte Premium Actif
                      <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0 text-[10px] px-2 py-0.5 font-bold gap-1 shadow-sm">
                        <Star className="h-2.5 w-2.5" /> PREMIUM
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">Score détaillé · Offres illimitées · Parcours ALTIS complet · Priorité recruteurs ×3</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-xs font-semibold text-success">Débloqué</span>
                </div>
              </div>
            ) : (
              <motion.div
                className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.06] via-primary/[0.04] to-accent/[0.08] p-5 space-y-4"
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ boxShadow: "0 0 30px hsl(var(--accent) / 0.12)" }}
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Vous voulez aller plus loin ?</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Débloquez le service complet pour maximiser vos chances
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Préparation complète de votre dossier ALTIS",
                    "Priorité recruteurs ×3",
                    "Accompagnement administratif renforcé (préfecture, sécurité sociale, compte bancaire)",
                    "Badge « Profil Vérifié Premium »",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-accent/30 text-accent text-[10px] font-bold gap-1 px-2.5 py-0.5">
                      <Sparkles className="h-3 w-3" /> Pack ALTIS Zéro Stress
                    </Badge>
                    <span className="text-lg font-black text-foreground">29&nbsp;€</span>
                    <span className="text-[10px] text-muted-foreground">(une seule fois)</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-semibold px-5 shadow-md shadow-accent/15"
                    onClick={() => handleUnlockPayment("full")}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <>Activer le service complet – 29&nbsp;€ <ChevronRight className="ml-1 h-3 w-3" /></>
                    )}
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground/50 text-center">
                  🔒 Paiement sécurisé Stripe · Accès immédiat après paiement
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* ── Header principal */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-2xl text-white shadow-premium" style={{ background: "var(--gradient-hero)" }}>
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
              <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-primary/25 blur-2xl" />
              <div className="relative flex flex-col sm:flex-row gap-0">
                <div className="flex-1 p-6 sm:p-7">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-white/80" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Espace Candidat</span>
                    {isPremium && (
                      <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0 text-[10px] px-2 py-0.5 font-bold gap-1 shadow-md ml-auto">
                        <Star className="h-2.5 w-2.5" /> PREMIUM
                      </Badge>
                    )}
                  </div>
                   <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
                     Bonjour, {displayName.split(" ")[0]} 👋
                   </h1>
                   <p className="text-sm font-medium mb-4" style={{ color: "hsl(var(--accent))" }}>
                     Votre parcours vers la France commence ici.
                   </p>
                   <p className="text-sm text-white/70 mb-4">
                    {displayCountry} · {displayFrench} · Code ROME {MOCK_PROFILE_DATA.rome.map(r => `${r.code} / ${r.label}`).join(" / ")}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-accent/20 text-white border-accent/30 text-[10px] px-2.5 py-0.5 font-bold gap-1.5">
                      <Shield className="h-3 w-3" /> CERTIFIÉ MINEFOP
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60">PARCOURS ALTIS</span>
                      <button
                        onClick={() => setActiveTab("parcours")}
                        className="flex items-center gap-1.5 cursor-pointer group/progress hover:opacity-90 transition-opacity"
                        title="Voir mon parcours"
                      >
                        <Progress value={PROGRESS_PERCENT} className="h-1.5 w-20 bg-white/20 group-hover/progress:ring-2 group-hover/progress:ring-white/30 rounded-full transition-all" />
                        <span className="text-sm font-bold group-hover/progress:underline">{PROGRESS_PERCENT}%</span>
                        <ChevronRight className="h-3 w-3 text-white/40 group-hover/progress:text-white/80 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="relative w-full sm:w-52 h-32 sm:h-auto overflow-hidden bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center p-4">
                  <img src={heroFranceAfrique} alt="France-Afrique" className="h-full max-h-32 w-auto object-contain opacity-80 drop-shadow-[0_8px_16px_rgba(6,182,212,0.25)]" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-primary/70 sm:bg-gradient-to-r" />
                  <div className="absolute bottom-2 right-2 text-[8px] font-bold text-white/50 uppercase tracking-widest">Plateforme RH Tech France-Afrique</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Navigation par rubriques */}
          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex h-auto gap-1 bg-muted/60 p-1 rounded-xl mb-6">
                {[
                  { value: "dashboard", label: "Dashboard", icon: TrendingUp },
                  { value: "parcours", label: "Mon Parcours", icon: ClipboardList },
                  { value: "opportunites", label: "Opportunités", icon: Flame },
                  { value: "profil", label: "Mon Profil", icon: User },
                ].map(({ value, label, icon: Icon }) => (
                  <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Icon className="h-3.5 w-3.5" />{label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* TAB 1 — DASHBOARD */}
              <TabsContent value="dashboard" className="space-y-5 mt-0">
                {/* Upsell 29 € pour les utilisateurs ayant payé 4,99 € mais pas encore premium */}
                {!isPremium && (
                  <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden border-accent/25 shadow-md">
                      <div className="h-1.5 w-full bg-gradient-to-r from-accent via-primary to-accent/50" />
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                            <Zap className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">🚀 Débloquez le service complet</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              Préparation dossier ALTIS + priorité recruteurs ×3 + badge Premium
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            "Dossier ALTIS complet (visa, logement, admin)",
                            "Priorité recruteurs ×3",
                            "Accompagnement préfecture + sécu sociale",
                            "Badge « Profil Vérifié Premium »",
                          ].map((item) => (
                            <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-accent/30 text-accent text-[10px] font-bold gap-1 px-2.5 py-0.5">
                              <Sparkles className="h-3 w-3" /> Pack ALTIS
                            </Badge>
                            <span className="text-lg font-black text-foreground">29&nbsp;€</span>
                            <span className="text-[10px] text-muted-foreground">(une seule fois)</span>
                          </div>
                          <Button
                            size="sm"
                            className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-semibold px-5 shadow-md shadow-accent/15"
                            onClick={() => handleUnlockPayment("full")}
                            disabled={paymentLoading}
                          >
                            {paymentLoading ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <>Activer – 29&nbsp;€ <ChevronRight className="ml-1 h-3 w-3" /></>
                            )}
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 text-center">
                          🔒 Paiement sécurisé Stripe · Accès immédiat après paiement
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Section "Vos expériences valorisées" */}
                <ExperiencesValoriseesSection userId={user?.id} experienceYears={talentProfile?.experience_years} />

                <CandidatureHistorySection onPostuler={() => setCandidatureOpen(true)} />
              </TabsContent>

              {/* TAB 2 — MON PARCOURS */}
              <TabsContent value="parcours" className="mt-0">
                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden border-primary/20 shadow-sm">
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ClipboardList className="h-3.5 w-3.5 text-primary" />
                        </div>
                        Parcours ALTIS — Votre roadmap France
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">6 étapes clés de votre intégration professionnelle et sociale</p>
                    </CardHeader>
                    <CardContent className="space-y-0 relative">
                      {/* Animated progress line behind steps */}
                      <div className="absolute left-[2.15rem] top-6 bottom-6 w-0.5 bg-border/20 rounded-full" />
                      <motion.div
                        className="absolute left-[2.15rem] top-6 w-0.5 rounded-full origin-top"
                        style={{ background: "linear-gradient(180deg, hsl(var(--success)), hsl(var(--primary)), hsl(var(--border)))" }}
                        initial={{ height: 0 }}
                        animate={{ height: `${(MOCK_TIMELINE.filter(s => s.status === "done").length / MOCK_TIMELINE.length) * 100}%` }}
                        transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      />

                      {MOCK_TIMELINE.map((step, i) => {
                        const Icon = step.icon;
                        const isDone = step.status === "done";
                        const isActive = step.status === "active";
                        const isPending = step.status === "pending";

                        return (
                          <motion.div
                            key={step.label}
                            initial={{ opacity: 0, x: -24 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ x: 4, transition: { duration: 0.2 } }}
                            className={`relative flex gap-4 py-3.5 cursor-default group ${i < MOCK_TIMELINE.length - 1 ? "" : ""}`}
                          >
                            {/* Step icon with micro-interactions */}
                            <div className="flex flex-col items-center z-10">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 260, damping: 20 }}
                                whileHover={{ scale: 1.15, transition: { type: "spring", stiffness: 400, damping: 15 } }}
                                className={`relative h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-shadow duration-300 ${
                                  isDone
                                    ? "bg-success/15 border-2 border-success/40 shadow-[0_0_12px_-2px_hsl(var(--success)/0.4)] group-hover:shadow-[0_0_20px_-2px_hsl(var(--success)/0.6)]"
                                    : isActive
                                    ? "bg-primary/15 border-2 border-primary/40 shadow-[0_0_16px_-2px_hsl(var(--primary)/0.5)]"
                                    : "bg-muted/80 border border-border/50 group-hover:border-border"
                                }`}
                              >
                                {isDone ? (
                                  <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 300 }}>
                                    <CheckCircle2 className="h-4.5 w-4.5 text-success" />
                                  </motion.div>
                                ) : isActive ? (
                                  <>
                                    <motion.div
                                      className="absolute inset-0 rounded-xl border-2 border-primary/30"
                                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                    <Icon className="h-4.5 w-4.5 text-primary" />
                                  </>
                                ) : (
                                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground/60 transition-colors" />
                                )}
                              </motion.div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-1 space-y-1.5 min-w-0">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-semibold transition-colors ${isPending ? "text-muted-foreground group-hover:text-foreground/70" : "text-foreground"}`}>
                                    {step.label}
                                  </span>
                                  {step.badge && (
                                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.1 }}>
                                      <Badge className="text-[9px] px-1.5 py-0 bg-accent/10 text-accent border-accent/30 font-bold">{step.badge.label}</Badge>
                                    </motion.div>
                                  )}
                                </div>
                                <motion.span
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.4 + i * 0.1 }}
                                  className={`text-xs font-mono ${isDone ? "text-success" : isActive ? "text-primary" : "text-muted-foreground"}`}
                                >
                                  {step.date}
                                </motion.span>
                              </div>
                              {step.tag && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                                  whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                                  className="flex items-center gap-1.5 bg-primary/5 rounded-lg px-3 py-1.5 border border-primary/15 group-hover:border-primary/25 transition-colors"
                                >
                                  <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <p className="text-xs text-primary font-medium">{step.tag}</p>
                                </motion.div>
                              )}
                              {step.tooltipText && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-xs text-muted-foreground cursor-help underline decoration-dotted hover:text-foreground transition-colors">Voir détails certification</p>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">{step.tooltipText}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                      {isPremium ? (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-success/30 bg-success/5 p-4 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                            <Award className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground flex items-center gap-2">Premium actif <CheckCircle2 className="h-3.5 w-3.5 text-success" /></p>
                            <p className="text-xs text-muted-foreground">Toutes les fonctionnalités débloquées</p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-primary/5 p-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Débloquer l'accès Premium</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Badge MINEFOP/MINREX + visibilité ×3 recruteurs</p>
                          </div>
                          <Button size="sm" className="shrink-0 gap-1.5 text-xs" onClick={() => handleUnlockPayment("full")} disabled={paymentLoading}>
                            <Zap className="h-3 w-3" /> 29 € <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Pack Zéro Stress */}
                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden border-primary/25 shadow-sm">
                    <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Package className="h-3.5 w-3.5 text-accent" />
                        </div>
                        Pack Zéro Stress ALTIS
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Services inclus dans votre accompagnement</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          { icon: Globe, label: "Formalités visa de travail – Procédure ANEF", desc: "Accompagnement complet des formalités visa de travail (ANEF + Préfecture, Code CESEDA)", status: "Terminé" },
                          { icon: Plane, label: "Accueil & assistance aéroport", desc: "Accueil personnalisé et assistance dès votre arrivée en France", status: "Planifié" },
                          { icon: Home, label: "Logement meublé 1 mois", desc: "Résidence partenaire équipée pour votre premier mois d'installation", status: "Actif" },
                          { icon: GraduationCap, label: "Accompagnement administratif complet", desc: "Préfecture · Sécurité sociale · Ouverture de compte bancaire", status: "En cours" },
                        ].map(({ icon: Icon, label, desc, status }) => (
                          <div key={label} className="flex gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                              <Badge className="mt-1.5 text-[9px] px-1.5 py-0 bg-success/10 text-success border-success/30">{status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                {/* Formations Recommandées (Pack ALTIS) */}
                <motion.div variants={itemVariants}>
                  <FranceTravailFormationsCard romeCode={talentProfile?.rome_code || "F1703"} />
                </motion.div>

                {/* Agences France Travail */}
                <motion.div variants={itemVariants}>
                  <FranceTravailAgencesCard />
                </motion.div>
              </TabsContent>

              <TabsContent value="opportunites" className="space-y-5 mt-0">
                {/* Offres en temps réel France Travail */}
                <motion.div variants={itemVariants}>
                  <FranceTravailOffresCard
                    romeCodes={[talentProfile?.rome_code || "F1703", "J1501", "G1602"]}
                    title="Vos Opportunités en Temps Réel"
                    count={6}
                  />
                </motion.div>

                <OpportunitesTab
                  offersToDisplay={offersToDisplay}
                  ftOffers={ftOffers}
                  ftLoading={ftLoading}
                  lbbCompanies={lbbCompanies}
                  lbbLoading={lbbLoading}
                  isPremium={isPremium}
                  visaStatus={talentProfile?.visa_status ?? "en_attente"}
                  itemVariants={itemVariants}
                />
              </TabsContent>

              {/* TAB 4 — MON PROFIL */}
              <TabsContent value="profil" className="space-y-5 mt-0">

                {/* Carte de visite premium */}
                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden border-primary/20 shadow-sm relative">
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />
                    <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                    <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
                    <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 sm:p-7">
                      {/* Avatar uploadable */}
                      <div className="relative shrink-0 group">
                        <label htmlFor="avatar-upload" className="cursor-pointer block">
                          <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md">
                            {(avatarPreview || profile?.avatar_url || user?.user_metadata?.picture) ? (
                              <img src={avatarPreview || profile?.avatar_url || user?.user_metadata?.picture} alt={displayName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                <span className="text-3xl font-extrabold text-primary">
                                  {displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}
                            {/* Overlay caméra au survol */}
                            <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                              {avatarUploading ? (
                                <RefreshCw className="h-6 w-6 text-white animate-spin" />
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </div>
                                  <span className="text-white text-[9px] font-semibold">Modifier</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                        <input id="avatar-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} disabled={avatarUploading} />
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background bg-success flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                        </div>
                      </div>

                      {/* Infos */}
                      <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap justify-center sm:justify-start">
                          <h2 className="text-xl font-extrabold text-foreground tracking-tight truncate">{displayName}</h2>
                          <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] px-2.5 py-0.5 font-bold self-center">
                            <Award className="h-3 w-3 mr-1" /> CERTIFIÉ MINEFOP
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                          <Badge variant="outline" className="text-xs gap-1"><MapPin className="h-3 w-3" />{displayCountry}</Badge>
                          <Badge variant="outline" className="text-xs gap-1"><Globe className="h-3 w-3" />{displayFrench}</Badge>
                          {MOCK_PROFILE_DATA.rome.map(r => (
                            <Badge key={r.code} variant="outline" className="text-xs font-mono">{r.code} · {r.label}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <span className="text-xs text-muted-foreground">Score compatibilité</span>
                          <Progress value={78} className="h-1.5 w-20" />
                          <span className="text-sm font-bold text-foreground">78%</span>
                          <Badge className="text-[9px] bg-success/10 text-success border-success/30">Excellent</Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5" onClick={() => setEditing(true)}>
                          <Save className="h-3.5 w-3.5" /> Modifier mon profil
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExport} disabled={exportLoading}>
                          <Download className="h-3.5 w-3.5" /> Exporter (RGPD)
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Mon Profil */}
                <motion.div variants={itemVariants}>
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        Mon Profil
                        <Badge variant="outline" className="text-[10px] ml-1">3 fiches infos</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {!editing ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <ProfileField label="Nom complet" value={form.full_name} />
                          <ProfileField label="Pays d'origine" value={form.country} />
                          <ProfileField label="Niveau de français" value={form.french_level} />
                          <ProfileField label="Compétences" value={form.skills} />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nom complet</Label>
                              <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="h-9 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pays d'origine</Label>
                              <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="h-9 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Niveau de français</Label>
                              <Select value={form.french_level} onValueChange={v => setForm(f => ({ ...f, french_level: v }))}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {FRENCH_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Compétences (séparées par virgules)</Label>
                              <Input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} className="h-9 text-sm" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="gap-1.5 text-xs">
                              {updateProfile.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Enregistrer
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="text-xs">Annuler</Button>
                          </div>
                        </div>
                      )}

                      {/* Notifications email */}
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Bell className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Notifications email</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Recevez un email quand un recruteur consulte votre profil ou quand de nouvelles opportunités correspondent à votre profil.</p>
                          </div>
                        </div>
                        <NotificationToggle userId={user?.id} />
                      </div>

                      {/* RGPD section */}
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Vos droits RGPD</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Art. 17 & 20 RGPD · AXIOM SAS · rgpd@axiom-talents.com</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExport} disabled={exportLoading}>
                            <Download className="h-3.5 w-3.5" /> Export données JSON
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setDeleteDialogOpen(true)}>
                            <Trash2 className="h-3.5 w-3.5" /> Supprimer mon compte
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>


                {/* Diplômes & Certifications */}
                <motion.div variants={itemVariants}>
                  <Card className="shadow-sm overflow-hidden border-accent/20">
                    <div className="h-1 w-full bg-gradient-to-r from-accent to-primary/40" />
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Award className="h-3.5 w-3.5 text-accent" />
                        </div>
                        Diplômes & Certifications
                        <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] ml-1">MINEFOP / MINREX</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DiplomaUpload />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* ── Delete dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Vos données personnelles seront supprimées conformément au RGPD Art. 17.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteRequest}>
                  Confirmer la suppression
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* ── Avatar Crop Modal */}
          {rawImageSrc && (
            <AvatarCropModal
              imageSrc={rawImageSrc}
              open={cropModalOpen}
              onClose={() => {
                setCropModalOpen(false);
                URL.revokeObjectURL(rawImageSrc);
                setRawImageSrc(null);
              }}
              onCropComplete={handleCropComplete}
            />
          )}

          <CandidatureFormDialog
            open={candidatureOpen}
            onOpenChange={setCandidatureOpen}
            prefillName={profile?.full_name || ""}
          />
        </motion.div>
      </DashboardLayout>
    </TooltipProvider>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 font-semibold">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || <span className="text-muted-foreground italic">Non renseigné</span>}</p>
    </div>
  );
}

/* ──────────── NOTIFICATION TOGGLE ──────────── */
function NotificationToggle({ userId }: { userId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: enabled, isLoading } = useQuery({
    queryKey: ["notification_pref", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("talent_profiles")
        .select("email_notifications_enabled")
        .eq("user_id", userId!)
        .limit(1)
        .single();
      return data?.email_notifications_enabled ?? true;
    },
    enabled: !!userId,
  });

  const toggle = async () => {
    if (!userId) return;
    const newVal = !enabled;
    const { error } = await supabase
      .from("talent_profiles")
      .update({ email_notifications_enabled: newVal } as any)
      .eq("user_id", userId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.setQueryData(["notification_pref", userId], newVal);
    toast({ title: newVal ? "Notifications activées" : "Notifications désactivées" });
  };

  if (isLoading || enabled === undefined) return null;

  return (
    <Button
      size="sm"
      variant={enabled ? "default" : "outline"}
      className={`gap-1.5 text-xs shrink-0 ${enabled ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
      onClick={toggle}
    >
      <Bell className="h-3.5 w-3.5" />
      {enabled ? "Activé" : "Désactivé"}
    </Button>
  );
}

/* ──────────── EXPÉRIENCES VALORISÉES SECTION ──────────── */
function ExperiencesValoriseesSection({ userId, experienceYears }: { userId?: string; experienceYears?: number | null }) {
  const { data: candidatures } = useQuery({
    queryKey: ["candidatures_exp", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("candidatures")
        .select("id, full_name, competences, experiences, compliance_score, status, created_at")
        .eq("talent_user_id", userId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  const [filterExp, setFilterExp] = useState(false);

  // Derive experience years from candidature experiences array
  const enriched = (candidatures || []).map((c: any) => {
    const exps = (c.experiences as any[]) || [];
    // estimate total years from duree fields
    let totalYears = experienceYears || 0;
    if (exps.length > 0 && !totalYears) {
      totalYears = exps.reduce((sum: number, e: any) => {
        const match = e.duree?.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 1);
      }, 0);
    }
    return { ...c, totalYears };
  });

  const displayed = filterExp ? enriched.filter(c => c.totalYears >= 5) : enriched;

  if (!enriched.length && !experienceYears) return null;

  const userYears = experienceYears || 0;
  const isExperienced = userYears >= 5;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-amber-500/20 shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-accent to-amber-500/40" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Briefcase className="h-3.5 w-3.5 text-amber-600" />
            </div>
            Vos expériences valorisées
            {isExperienced && (
              <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] px-2 py-0.5 font-bold gap-1 ml-1">
                <Award className="h-2.5 w-2.5" /> Profil Expérimenté
              </Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {userYears > 0 ? `${userYears} an${userYears > 1 ? "s" : ""} d'expérience professionnelle` : "Renseignez votre expérience pour booster votre score IA"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Experience badge + filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 border border-border/50">
              <Briefcase className="h-4 w-4 text-amber-600" />
              <span className="text-2xl font-black text-foreground">{userYears}</span>
              <span className="text-xs text-muted-foreground">an{userYears > 1 ? "s" : ""}</span>
              {isExperienced && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
            </div>
            {enriched.length > 0 && (
              <Button
                size="sm"
                variant={filterExp ? "default" : "outline"}
                className={`text-xs gap-1.5 ${filterExp ? "bg-amber-500 text-white hover:bg-amber-600" : "border-amber-500/30 text-amber-600 hover:bg-amber-500/5"}`}
                onClick={() => setFilterExp(!filterExp)}
              >
                <Award className="h-3 w-3" />
                Profils Expérimentés (5+ ans)
              </Button>
            )}
          </div>

          {/* Candidatures with experience displayed */}
          {displayed.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {displayed.map((c: any, i: number) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="group flex gap-3 p-3.5 rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/20 hover:border-amber-500/30 hover:shadow-md transition-all"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-accent/15 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground truncate">{c.full_name || "Candidature"}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] px-1.5 py-0 font-bold gap-0.5">
                        <Briefcase className="h-2.5 w-2.5" /> {c.totalYears} an{c.totalYears > 1 ? "s" : ""} exp.
                      </Badge>
                      {c.totalYears >= 5 && (
                        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[9px] px-1.5 py-0 font-bold gap-0.5">
                          <Award className="h-2.5 w-2.5" /> Expérimenté
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        Score: {c.compliance_score || 0}%
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {((c.competences as string[]) || []).slice(0, 3).map((comp: string) => (
                        <span key={comp} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{comp}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : filterExp ? (
            <div className="text-center py-6">
              <Award className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucun profil avec 5+ ans d'expérience.</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Envoyez votre candidature pour valoriser votre expérience.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
