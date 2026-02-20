import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import dashboardHero from "@/assets/dashboard-hero.jpg";
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
  Clock,
  User,
  Globe,
  Briefcase,
  Plane,
  Home,
  GraduationCap,
  Building2,
  Save,
  MapPin,
  Banknote,
  Star,
  TrendingUp,
  Shield,
  Download,
  Trash2,
  Mail,
  RefreshCw,
  Award,
  Zap,
  ArrowRight,
  Package,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Flame,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PremiumStatCard } from "@/components/PremiumStatCard";
import DiplomaUpload from "@/components/dashboard/DiplomaUpload";
import AvatarCropModal from "@/components/dashboard/AvatarCropModal";

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

const SECTOR_BADGE_COLORS: Record<string, string> = {
  BTP: "bg-orange-500/10 text-orange-700 border-orange-300/40 dark:text-orange-400",
  Santé: "bg-emerald-500/10 text-emerald-700 border-emerald-300/40 dark:text-emerald-400",
  CHR: "bg-violet-500/10 text-violet-700 border-violet-300/40 dark:text-violet-400",
  Logistique: "bg-sky-500/10 text-sky-700 border-sky-300/40 dark:text-sky-400",
  Autre: "bg-muted text-muted-foreground border-border",
};

const MOCK_LBB_COMPANIES: LBBCompany[] = [
  { siret: "mock-1", name: "BTP Services Rhône-Alpes", sector: "BTP", romeCode: "F1703", romeLabel: "Maçonnerie", city: "Lyon", zipCode: "69001", hiringPotential: 4.8, nafLabel: "Construction", url: "#", headcount: "50-99", distance: 5 },
  { siret: "mock-2", name: "Clinique Saint-Joseph", sector: "Santé", romeCode: "J1501", romeLabel: "Aide-soignant", city: "Paris", zipCode: "75015", hiringPotential: 4.5, nafLabel: "Activités hospitalières", url: "#", headcount: "100-199", distance: 8 },
  { siret: "mock-3", name: "Hôtel Le Grand Palais", sector: "CHR", romeCode: "G1602", romeLabel: "Service en salle", city: "Bordeaux", zipCode: "33000", hiringPotential: 4.2, nafLabel: "Hôtels et hébergement", url: "#", headcount: "20-49", distance: 12 },
  { siret: "mock-4", name: "Plomberie Dupont & Fils", sector: "BTP", romeCode: "F1603", romeLabel: "Plomberie", city: "Marseille", zipCode: "13001", hiringPotential: 4.0, nafLabel: "Construction", url: "#", headcount: "10-19", distance: 15 },
  { siret: "mock-5", name: "EHPAD Les Oliviers", sector: "Santé", romeCode: "J1501", romeLabel: "Aide-soignant", city: "Toulouse", zipCode: "31000", hiringPotential: 3.8, nafLabel: "Hébergement médicalisé", url: "#", headcount: "50-99", distance: 20 },
  { siret: "mock-6", name: "Brasserie de la République", sector: "CHR", romeCode: "G1603", romeLabel: "Restauration", city: "Nantes", zipCode: "44000", hiringPotential: 3.5, nafLabel: "Restauration traditionnelle", url: "#", headcount: "10-19", distance: 25 },
];

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
  { label: "Visa en cours", icon: Globe, status: "done", date: "28 jan. 2026", badge: { label: "CERTIFIÉ MINEFOP", color: "gold" }, tooltipText: "Diplôme CQP/DQP audité + Delta ROME comblé – Garantie opérationnel jour 1.", upsell: "Premium 30 € – Visibilité prioritaire recruteurs" },
  { label: "Billet réservé", icon: Plane, status: "done", date: "5 fév. 2026" },
  { label: "Logement trouvé", icon: Home, status: "done", date: "14 fév. 2026" },
  { label: "Formation démarrée", icon: GraduationCap, status: "active", tag: "Classes Miroirs – Module normes FR validé AXIOM", date: "En cours" },
  { label: "En poste", icon: Building2, status: "pending", date: "Estimé mars 2026" },
];

const MOCK_RECOMMENDED_OFFERS = [
  { id: "mock-r1", title: "Maçon / Maçonne", company: "BTP Services IDF", codeRome: "F1703", sector: "BTP", location: "Lyon, Auvergne-Rhône-Alpes", contract: "CDI", score: 92, salary: "26 000 – 32 000 €/an", skills: ["Maçonnerie", "Coffrage", "Sécurité chantier"], tension: "Très forte", url: null },
  { id: "mock-r2", title: "Aide-soignant(e)", company: "Clinique du Parc", codeRome: "J1501", sector: "Santé", location: "Paris, Île-de-France", contract: "CDD", score: 85, salary: "28 000 – 32 000 €/an", skills: ["Soins", "Aide à la personne", "DEAS"], tension: "Forte", url: null },
  { id: "mock-r3", title: "Serveur / Serveuse", company: "Hôtel Splendide", codeRome: "G1602", sector: "CHR", location: "Bordeaux, Nouvelle-Aquitaine", contract: "Saisonnier", score: 78, salary: "22 000 – 26 000 €/an", skills: ["Service en salle", "HACCP", "Anglais professionnel"], tension: "Modérée", url: null },
];

const CONTRACT_COLORS: Record<string, string> = {
  CDI: "bg-success/10 text-success border-success/30",
  CDD: "bg-primary/10 text-primary border-primary/30",
  Saisonnier: "bg-accent/10 text-accent border-accent/30",
  MIS: "bg-accent/10 text-accent border-accent/30",
  SAI: "bg-accent/10 text-accent border-accent/30",
};

const TENSION_COLORS: Record<string, string> = {
  "Très forte": "bg-red-500/10 text-red-600 border-red-300/40",
  Forte: "bg-orange-500/10 text-orange-600 border-orange-300/40",
  Modérée: "bg-amber-500/10 text-amber-600 border-amber-300/40",
};

const MOCK_PROFILE_DATA = {
  full_name: "Test Cameroon",
  country: "Cameroun",
  french_level: "Avancé (B2)",
  skills: ["Maçonnerie", "Plomberie"],
  rome: [
    { code: "F1703", label: "Maçon" },
    { code: "F1603", label: "Plombier" },
  ],
};

const PROGRESS_PERCENT = 60;

export default function DashboardTalent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  const handleUnlockPayment = async () => {
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-talent");
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
  }, [location.search, toast]);

  useEffect(() => {
    const pending = localStorage.getItem("axiom_pending_profile");
    if (pending && user) {
      try {
        const data = JSON.parse(pending);
        supabase.from("talent_profiles").upsert({
          user_id: user.id,
          rome_label: data.rome_label,
          rome_code: data.rome_code,
          experience_years: data.experience_years,
          country: data.country ?? "Cameroun",
        }).then(({ error }) => {
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

  const { data: totalOpenOffers = 0 } = useQuery({
    queryKey: ["open_offers_count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("job_offers").select("*", { count: "exact", head: true }).eq("status", "open");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: ftOffers, isLoading: ftLoading } = useQuery({
    queryKey: ["france_travail_offers", profile?.skills],
    queryFn: async () => {
      const romeCode = "F1703";
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const fnUrl = `${supabaseUrl}/functions/v1/france-travail-offers`;
      try {
        const res = await fetch(fnUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ romeCode, count: 5 }) });
        if (!res.ok) { await res.text(); return null; }
        const json = await res.json();
        return (json.offers as Array<Record<string, unknown>>).map((o, i) => ({ ...(o as object), score: Math.max(75, 95 - i * 5) })) as Array<Record<string, unknown> & { score: number }>;
      } catch { return null; }
    },
    enabled: !!user,
    retry: false,
    throwOnError: false,
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

  const displayName = profile?.full_name || MOCK_PROFILE_DATA.full_name;
  const displayCountry = profile?.country || MOCK_PROFILE_DATA.country;
  const displayFrench = profile?.french_level || MOCK_PROFILE_DATA.french_level;
  const displaySkills = profile?.skills && profile.skills.length > 0 ? profile.skills : MOCK_PROFILE_DATA.skills;
  const offersToDisplay = ftOffers && ftOffers.length > 0 ? ftOffers : MOCK_RECOMMENDED_OFFERS;

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <TooltipProvider>
      <DashboardLayout sidebarVariant="talent">
        <motion.div className="space-y-5 pb-12" variants={containerVariants} initial="hidden" animate="visible">

          {/* ── Premium CTA Bar */}
          <motion.div variants={itemVariants}>
            <div className="rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 to-primary/8 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-accent shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  <span className="font-bold text-accent">Certification Premium — 30 €</span> · Badge officiel MINEFOP/MINREX + visibilité prioritaire ×3 auprès des recruteurs partenaires
                </p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 border-accent/40 text-accent hover:bg-accent/10 text-xs font-semibold" onClick={handleUnlockPayment} disabled={paymentLoading}>
                {paymentLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <>Activer <ChevronRight className="ml-1 h-3 w-3" /></>}
              </Button>
            </div>
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
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
                    Bonjour, {displayName.split(" ")[0]}
                  </h1>
                  <p className="text-sm text-white/70 mb-4">
                    {displayCountry} · {displayFrench} · Code ROME {MOCK_PROFILE_DATA.rome.map(r => `${r.code} / ${r.label}`).join(" / ")}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-accent/20 text-white border-accent/30 text-[10px] px-2.5 py-0.5 font-bold gap-1.5">
                      <Shield className="h-3 w-3" /> CERTIFIÉ MINEFOP
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/60">PARCOURS ALTIS</span>
                      <div className="flex items-center gap-1.5">
                        <Progress value={PROGRESS_PERCENT} className="h-1.5 w-20 bg-white/20" />
                        <span className="text-sm font-bold">{PROGRESS_PERCENT}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative w-full sm:w-56 h-32 sm:h-auto overflow-hidden">
                  <img src={dashboardHero} alt="Dashboard hero" className="h-full w-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-primary/80 sm:bg-gradient-to-r" />
                  <div className="absolute bottom-2 right-2 text-[8px] font-semibold text-white/50 uppercase tracking-widest">Plateforme RH Tech France-Afrique</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Navigation par rubriques */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="dashboard" className="w-full">
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
                <motion.div variants={itemVariants}>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <PremiumStatCard title="Offres disponibles" value={String(Math.max(totalOpenOffers, MOCK_RECOMMENDED_OFFERS.length))} subtitle="Postes actifs · Secteurs en forte tension" tensionLevel="low" tensionLabel="STABLE" icon={Briefcase} />
                    <PremiumStatCard title="Score de compatibilité" value="78%" subtitle="BTP – Maçonnerie F1703 · Demande élevée" tensionLevel="low" tensionLabel="STABLE" icon={Star} />
                    <PremiumStatCard title="Progression ALTIS" value={`${PROGRESS_PERCENT}%`} subtitle="4 étapes sur 6 · Formation en cours" tensionLevel="medium" tensionLabel="EN COURS" icon={TrendingUp} />
                  </div>
                </motion.div>
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
                    <CardContent className="space-y-3">
                      {MOCK_TIMELINE.map((step, i) => {
                        const Icon = step.icon;
                        return (
                          <motion.div key={step.label} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className={`relative flex gap-4 pb-4 ${i < MOCK_TIMELINE.length - 1 ? "border-b border-border/30" : ""}`}>
                            <div className="flex flex-col items-center">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${step.status === "done" ? "bg-success/10 border border-success/30" : step.status === "active" ? "bg-primary/10 border border-primary/30 shadow-sm" : "bg-muted border border-border/50"}`}>
                                {step.status === "done" ? <CheckCircle2 className="h-4 w-4 text-success" /> : step.status === "active" ? <Icon className="h-4 w-4 text-primary animate-pulse" /> : <Icon className="h-4 w-4 text-muted-foreground" />}
                              </div>
                              {i < MOCK_TIMELINE.length - 1 && <div className={`w-0.5 flex-1 mt-2 rounded-full ${step.status === "done" ? "bg-success/30" : "bg-border/30"}`} />}
                            </div>
                            <div className="flex-1 pt-1 space-y-1.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-semibold ${step.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>{step.label}</span>
                                  {step.badge && <Badge className="text-[9px] px-1.5 py-0 bg-accent/10 text-accent border-accent/30 font-bold">{step.badge.label}</Badge>}
                                </div>
                                <span className={`text-xs font-mono ${step.status === "done" ? "text-success" : step.status === "active" ? "text-primary" : "text-muted-foreground"}`}>{step.date}</span>
                              </div>
                              {step.tag && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 bg-primary/5 rounded-lg px-3 py-1.5 border border-primary/15">
                                  <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <p className="text-xs text-primary font-medium">{step.tag}</p>
                                </motion.div>
                              )}
                              {step.tooltipText && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-xs text-muted-foreground cursor-help underline decoration-dotted">Voir détails certification</p>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">{step.tooltipText}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-primary/5 p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Débloquer l'accès Premium</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Badge MINEFOP/MINREX + visibilité ×3 recruteurs</p>
                        </div>
                        <Button size="sm" className="shrink-0 gap-1.5 text-xs" onClick={handleUnlockPayment} disabled={paymentLoading}>
                          <Zap className="h-3 w-3" /> 30 € <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </motion.div>
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
                          { icon: Home, label: "Logement temporaire", desc: "Résidence partenaire J+1 · 3 mois inclus", status: "Actif" },
                          { icon: GraduationCap, label: "Classes Miroirs", desc: "Formation normes FR · 120h certifiées AXIOM", status: "En cours" },
                          { icon: Globe, label: "Visa & Légalisation", desc: "Apostille MINREX · Titre de séjour accompagné", status: "Terminé" },
                          { icon: Banknote, label: "Avance sur salaire", desc: "Jusqu'à 2 000 € · Sans intérêts 3 premiers mois", status: "Disponible" },
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
              </TabsContent>

              {/* TAB 3 — OPPORTUNITÉS */}
              <TabsContent value="opportunites" className="space-y-5 mt-0">
                {/* Offres recommandées */}
                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden border-primary/20 shadow-sm">
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Briefcase className="h-3.5 w-3.5 text-primary" />
                        </div>
                        Offres recommandées
                        {ftLoading && <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin ml-1" />}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Matchées sur votre profil ROME et secteurs en tension</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {offersToDisplay.map((offer: Record<string, unknown> & { score?: number }, i) => {
                        const score = offer.score ?? 80;
                        const contract = (offer.contract ?? offer.typeContrat ?? "CDI") as string;
                        const tension = (offer.tension ?? "Forte") as string;
                        return (
                          <motion.div key={String(offer.id ?? i)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors group">
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center">
                                <Briefcase className="h-4.5 w-4.5 text-primary" />
                              </div>
                              <span className="text-[10px] font-bold text-success">{score}%</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{String(offer.title ?? offer.intitule ?? "Offre")}</p>
                                  <p className="text-xs text-muted-foreground">{String((offer as any).company ?? (offer as any).entreprise?.nom ?? "Entreprise")} · {String((offer as any).location ?? (offer as any).lieuTravail?.libelle ?? "France")}</p>
                                </div>
                                <div className="flex flex-wrap gap-1 shrink-0">
                                  <Badge className={`text-[9px] px-1.5 py-0 border ${CONTRACT_COLORS[contract] ?? "bg-muted text-muted-foreground"}`}>{contract}</Badge>
                                  {tension && <Badge className={`text-[9px] px-1.5 py-0 border ${TENSION_COLORS[tension] ?? "bg-muted text-muted-foreground"}`}>{tension}</Badge>}
                                </div>
                              </div>
                              {(offer.salary || offer.salaire) && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Banknote className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{String(offer.salary ?? offer.salaire ?? "")}</span>
                                </div>
                              )}
                              {Array.isArray(offer.skills) && offer.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {(offer.skills as string[]).map(s => (
                                    <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">{s}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button size="sm" variant="ghost" className="shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" asChild={!!(offer.url && offer.url !== "#")}>
                              {offer.url && offer.url !== "#" ? <a href={String(offer.url)} target="_blank" rel="noopener noreferrer"><ArrowRight className="h-4 w-4" /></a> : <span><Lock className="h-3.5 w-3.5 text-muted-foreground" /></span>}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* La Bonne Boîte */}
                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden border-accent/20 shadow-sm">
                    <div className="h-1 w-full bg-gradient-to-r from-accent to-primary/40" />
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Building2 className="h-3.5 w-3.5 text-accent" />
                        </div>
                        Entreprises qui recrutent
                        {lbbLoading && <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin ml-1" />}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Entreprises à fort potentiel d'embauche dans vos secteurs</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {(lbbCompanies ?? MOCK_LBB_COMPANIES).map((company) => {
                          const sectorColor = SECTOR_BADGE_COLORS[company.sector] ?? SECTOR_BADGE_COLORS.Autre;
                          return (
                            <motion.div key={company.siret} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-2 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-accent/30 transition-all group">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-foreground line-clamp-1">{company.name}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{company.city} {company.zipCode && `(${company.zipCode.slice(0, 2)})`}{company.distance != null && ` · ${company.distance} km`}</p>
                                </div>
                                <Badge className={`text-[9px] px-1.5 py-0 border shrink-0 ${sectorColor}`}>{company.sector}</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                  <span className="text-xs font-semibold">{company.hiringPotential.toFixed(1)}</span>
                                  <span className="text-xs text-muted-foreground">potentiel</span>
                                </div>
                                {company.headcount && <span className="text-[10px] text-muted-foreground">{company.headcount} sal.</span>}
                              </div>
                              <Button size="sm" variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5 gap-1.5 text-xs group-hover:bg-primary/5 transition-colors" onClick={() => { if (company.url && company.url !== "#") window.open(company.url, "_blank"); }}>
                                <Mail className="h-3 w-3" /> Candidature spontanée
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
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
