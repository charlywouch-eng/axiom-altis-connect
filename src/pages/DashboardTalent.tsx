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
  {
    label: "Offre acceptée",
    icon: Briefcase,
    status: "done",
    date: "12 jan. 2026",
  },
  {
    label: "Visa en cours",
    icon: Globe,
    status: "done",
    date: "28 jan. 2026",
    badge: { label: "CERTIFIÉ MINEFOP", color: "gold" },
    tooltipText:
      "Diplôme CQP/DQP audité + Delta ROME comblé – Garantie opérationnel jour 1. Upsell Premium 30 € pour visibilité prioritaire",
    upsell: "Premium 30 € – Visibilité prioritaire recruteurs",
  },
  {
    label: "Billet réservé",
    icon: Plane,
    status: "done",
    date: "5 fév. 2026",
  },
  {
    label: "Logement trouvé",
    icon: Home,
    status: "done",
    date: "14 fév. 2026",
  },
  {
    label: "Formation démarrée",
    icon: GraduationCap,
    status: "active",
    tag: "Classes Miroirs – Module normes FR validé AXIOM",
    date: "En cours",
  },
  {
    label: "En poste",
    icon: Building2,
    status: "pending",
    date: "Estimé mars 2026",
  },
];

const MOCK_RECOMMENDED_OFFERS = [
  {
    id: "mock-r1",
    title: "Maçon / Maçonne",
    company: "BTP Services IDF",
    codeRome: "F1703",
    sector: "BTP",
    location: "Lyon, Auvergne-Rhône-Alpes",
    contract: "CDI",
    score: 92,
    salary: "26 000 – 32 000 €/an",
    skills: ["Maçonnerie", "Coffrage", "Sécurité chantier"],
    tension: "Très forte",
    url: null,
  },
  {
    id: "mock-r2",
    title: "Aide-soignant(e)",
    company: "Clinique du Parc",
    codeRome: "J1501",
    sector: "Santé",
    location: "Paris, Île-de-France",
    contract: "CDD",
    score: 85,
    salary: "28 000 – 32 000 €/an",
    skills: ["Soins", "Aide à la personne", "DEAS"],
    tension: "Forte",
    url: null,
  },
  {
    id: "mock-r3",
    title: "Serveur / Serveuse",
    company: "Hôtel Splendide",
    codeRome: "G1602",
    sector: "CHR",
    location: "Bordeaux, Nouvelle-Aquitaine",
    contract: "Saisonnier",
    score: 78,
    salary: "22 000 – 26 000 €/an",
    skills: ["Service en salle", "HACCP", "Anglais professionnel"],
    tension: "Modérée",
    url: null,
  },
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

  // Detect premium=true redirect from Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("premium") === "true") {
      toast({
        title: "🎉 Analyse Complète débloquée !",
        description: "Score détaillé, offres France Travail et parcours ALTIS maintenant accessibles.",
      });
      // Clean URL
      window.history.replaceState({}, "", "/dashboard-talent");
    }
  }, [location.search, toast]);

  // On mount: if a pending profile from signup step 2 exists, save it to talent_profiles
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: totalOpenOffers = 0 } = useQuery({
    queryKey: ["open_offers_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("job_offers")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
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
        const res = await fetch(fnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ romeCode, count: 5 }),
        });

        if (!res.ok) {
          await res.text(); // consume body
          return null; // fallback to mock
        }

        const json = await res.json();
        return (json.offers as Array<Record<string, unknown>>).map((o, i) => ({
          ...(o as object),
          score: Math.max(75, 95 - i * 5),
        })) as Array<Record<string, unknown> & { score: number }>;
      } catch {
        return null; // fallback to mock silently
      }
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
        const res = await fetch(fnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sectors: ["BTP", "Santé", "CHR"], count: 9 }),
        });

        if (!res.ok) {
          await res.text(); // consume body
          return null; // fallback to mock
        }

        const json = await res.json();
        return json.companies as LBBCompany[];
      } catch {
        return null; // fallback to mock silently
      }
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
      // Initialise l'avatar depuis le profil (sans écraser une prévisualisation locale)
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
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name || null,
          country: form.country || null,
          french_level: form.french_level || null,
          skills,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profil mis à jour" });
      setEditing(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const [profileRes, diplomasRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).single(),
        supabase
          .from("diplomas")
          .select("file_name, status, rome_label, created_at")
          .eq("user_id", user!.id),
      ]);
      const exportData = {
        export_date: new Date().toISOString(),
        rgpd_notice: "Export conforme RGPD Art. 20 – Portabilité des données",
        responsable: "AXIOM SAS – rgpd@axiom-talents.com",
        profile: profileRes.data,
        diplomas: diplomasRes.data || [],
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
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
    toast({
      title: "Demande envoyée",
      description: "Notre DPO traitera votre demande de suppression sous 30 jours.",
    });
  };

  // ── Avatar upload ─────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Immediate local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setAvatarUploading(true);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

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
    }
  };

  const displayName = profile?.full_name || MOCK_PROFILE_DATA.full_name;
  const displayCountry = profile?.country || MOCK_PROFILE_DATA.country;
  const displayFrench = profile?.french_level || MOCK_PROFILE_DATA.french_level;
  const displaySkills =
    profile?.skills && profile.skills.length > 0
      ? profile.skills
      : MOCK_PROFILE_DATA.skills;

  const offersToDisplay = ftOffers && ftOffers.length > 0 ? ftOffers : MOCK_RECOMMENDED_OFFERS;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <TooltipProvider>
      <DashboardLayout sidebarVariant="talent">
        <motion.div
          className="space-y-5 pb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── Premium CTA Bar ─────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div className="rounded-xl border border-accent/30 bg-gradient-to-r from-accent/10 to-primary/8 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-accent shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  <span className="font-bold text-accent">Certification Premium — 30 €</span> · Badge officiel MINEFOP/MINREX + visibilité prioritaire ×3 auprès des recruteurs partenaires
                </p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 border-accent/40 text-accent hover:bg-accent/10 text-xs font-semibold">
                Activer <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </motion.div>

          {/* ── Header principal ────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div
              className="relative overflow-hidden rounded-2xl text-white shadow-premium"
              style={{ background: "var(--gradient-hero)" }}
            >
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
              <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-primary/25 blur-2xl" />

              <div className="relative flex flex-col sm:flex-row gap-0">
                {/* Left: texte */}
                <div className="flex-1 p-6 sm:p-7">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-white/65 text-sm font-medium tracking-wide uppercase text-xs">Espace Candidat</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-1">
                    Bonjour, {displayName}
                  </h1>
                  <p className="text-white/60 text-sm mb-5">
                    {displayCountry} · Français {displayFrench} · Code ROME F1703 / F1603
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-tension/25 text-white border border-tension/50 gap-1.5 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
                      <Award className="h-3.5 w-3.5" />
                      CERTIFIÉ MINEFOP
                    </Badge>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-white/50 text-[10px] uppercase tracking-widest font-medium">Parcours ALTIS</p>
                        <p className="text-white font-extrabold text-xl leading-none">{PROGRESS_PERCENT}%</p>
                      </div>
                      <div className="w-20">
                        <Progress
                          value={PROGRESS_PERCENT}
                          className="h-2 bg-white/20 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-white [&>div]:rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: illustration brand */}
                <div className="hidden sm:flex items-end justify-center w-56 shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-primary/30" />
                  <img
                    src={dashboardHero}
                    alt="Plateforme RH Tech innovante France-Afrique — AXIOM"
                    className="w-full h-full object-cover object-center opacity-90 mix-blend-luminosity"
                    style={{ maxHeight: "180px" }}
                  />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-white/80 text-[9px] uppercase tracking-widest font-bold bg-black/30 rounded px-2 py-0.5 backdrop-blur-sm">
                      Plateforme RH Tech France-Afrique
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Navigation par rubriques ─────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex h-auto gap-1 bg-muted/60 p-1 rounded-xl mb-6">
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Accueil</span>
                </TabsTrigger>
                <TabsTrigger
                  value="parcours"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Plane className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mon Parcours</span>
                  <span className="sm:hidden">Parcours</span>
                </TabsTrigger>
                <TabsTrigger
                  value="opportunites"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Opportunités</span>
                  <span className="sm:hidden">Offres</span>
                </TabsTrigger>
                <TabsTrigger
                  value="profil"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mon Profil</span>
                  <span className="sm:hidden">Profil</span>
                </TabsTrigger>
              </TabsList>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TAB 1 — DASHBOARD                                         */}
              {/* ══════════════════════════════════════════════════════════ */}
              <TabsContent value="dashboard" className="space-y-5 mt-0">
          {/* ── KPIs ────────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PremiumStatCard
                icon={Briefcase}
                title="Offres disponibles"
                value={totalOpenOffers > 0 ? String(totalOpenOffers) : "3"}
                accent="blue"
                tensionLevel="low"
                subtitle="Postes actifs · Secteurs en forte tension"
              />
              <PremiumStatCard
                icon={Star}
                title="Score de compatibilité"
                value="78%"
                accent="green"
                tensionLevel="low"
                subtitle="BTP – Maçonnerie F1703 · Demande élevée"
              />
              <PremiumStatCard
                icon={TrendingUp}
                title="Progression ALTIS"
                value="60%"
                tensionLevel="low"
                tensionLabel="En cours"
                subtitle="4 étapes sur 6 · Formation en cours"
              />
            </div>
          </motion.div>

              </TabsContent>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TAB 2 — MON PARCOURS DE RELOCATION                        */}
              {/* ══════════════════════════════════════════════════════════ */}
              <TabsContent value="parcours" className="space-y-5 mt-0">

          {/* ── Mon Parcours Relocation (Timeline ALTIS) ────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-primary/20 shadow-sm">
              {/* Premium top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Plane className="h-4 w-4 text-primary" />
                      </div>
                      Mon Parcours de Relocation
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 font-semibold">
                        ALTIS Mobility
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1.5 ml-10">
                      4 étapes complétées sur 6 · Modèle intégré Visa · Transport · Logement · Intégration
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-bold text-primary leading-none">{PROGRESS_PERCENT}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Progression</p>
                  </div>
                </div>
                <Progress
                  value={PROGRESS_PERCENT}
                  className="h-2.5 mt-3 rounded-full bg-muted [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent [&>div]:rounded-full"
                />
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-0">
                  {MOCK_TIMELINE.map((step, i) => {
                    const isLast = i === MOCK_TIMELINE.length - 1;
                    const Icon = step.icon;
                    const isDone = step.status === "done";
                    const isActive = step.status === "active";
                    const isPending = step.status === "pending";

                    return (
                      <motion.div
                        key={step.label}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.08, duration: 0.35 }}
                        className="flex gap-4 group"
                      >
                        {/* Timeline dot + connector */}
                        <div className="flex flex-col items-center shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all cursor-default shadow-sm ${
                                  isDone
                                    ? "border-emerald-400 bg-emerald-500 text-white shadow-emerald-500/20"
                                    : isActive
                                    ? "border-primary bg-primary/10 text-primary shadow-primary/20 animate-pulse"
                                    : "border-border bg-muted text-muted-foreground"
                                }`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                                ) : isActive ? (
                                  <Clock className="h-4 w-4" />
                                ) : (
                                  <Icon className="h-4 w-4" />
                                )}
                                {isActive && (
                                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            {step.tooltipText && (
                              <TooltipContent side="right" className="max-w-72 text-xs leading-relaxed space-y-1.5 p-3">
                                <p className="font-bold text-sm">🏆 Certification AXIOM</p>
                                <p>{step.tooltipText}</p>
                                {step.upsell && (
                                  <div className="border-t border-border/50 pt-1.5 mt-1.5">
                                    <p className="text-primary font-semibold flex items-center gap-1">
                                      <Sparkles className="h-3 w-3" />
                                      {step.upsell}
                                    </p>
                                  </div>
                                )}
                              </TooltipContent>
                            )}
                          </Tooltip>
                          {!isLast && (
                            <div
                              className={`w-0.5 flex-1 min-h-[2rem] mt-1 rounded-full transition-all ${
                                isDone ? "bg-emerald-400/60" : isActive ? "bg-primary/30" : "bg-border/40"
                              }`}
                            />
                          )}
                        </div>

                        {/* Step content */}
                        <div className={`pb-5 pt-1.5 flex-1 min-w-0 ${isPending ? "opacity-50" : ""}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-semibold text-sm ${isPending ? "text-muted-foreground" : "text-foreground"}`}>
                              {step.label}
                            </p>

                            {/* Gold MINEFOP badge */}
                            {step.badge && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-400/50 hover:bg-amber-100 cursor-help text-[10px] px-2 py-0.5 font-bold">
                                    <Award className="h-3 w-3" />
                                    {step.badge.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-72 text-xs leading-relaxed space-y-1.5 p-3">
                                  <p className="font-bold text-sm">🏆 Certification AXIOM</p>
                                  <p>{step.tooltipText}</p>
                                  {step.upsell && (
                                    <div className="border-t border-border/50 pt-1.5 mt-1.5">
                                      <p className="text-primary font-semibold flex items-center gap-1">
                                        <Sparkles className="h-3 w-3" />
                                        {step.upsell}
                                      </p>
                                    </div>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {isActive && (
                              <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] px-2 py-0.5 font-semibold">
                                ● En cours
                              </Badge>
                            )}
                            {isDone && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-400/30 text-[10px] px-2 py-0.5">
                                ✓ Complété
                              </Badge>
                            )}
                          </div>

                          {step.date && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {step.date}
                            </p>
                          )}

                          {step.tag && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.5 }}
                              className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 mt-2 w-fit"
                            >
                              <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                              <p className="text-xs text-primary font-medium">{step.tag}</p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Teaser unlock */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-2 rounded-xl border border-dashed border-primary/30 bg-gradient-to-r from-primary/[0.04] to-accent/[0.04] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Accédez à votre analyse complète pour{" "}
                        <span className="text-primary">10 € — paiement unique</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Score approfondi · Matchs prioritaires · Parcours ALTIS complet · Sans abonnement
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                    onClick={() => toast({ title: "Offre 10 €", description: "Redirection vers le paiement…" })}
                  >
                    Débloquer
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Pack Zéro Stress ALTIS ──────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-primary/25 shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
              <div className="relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />

                <CardHeader className="pb-3 relative">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        Pack Zéro Stress · ALTIS Mobility
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 ml-10">
                        Accompagnement logistique intégral · Visa ANEF · Transport · Hébergement · Dispositif de formation
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-400/30 text-xs gap-1 font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Éligible · Score 82%
                      </Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1">
                        <Zap className="h-2.5 w-2.5" /> En cours
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 relative">
                  {/* Status grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Visa ANEF", status: "active", icon: Globe, sub: "En traitement", color: "primary" },
                      { label: "Billet d'avion", status: "next", icon: Plane, sub: "Prochaine étape", color: "accent" },
                      { label: "Logement", status: "done", icon: Home, sub: "Trouvé ✓", color: "success" },
                      { label: "Formation", status: "active-2", icon: GraduationCap, sub: "Classes Miroirs", color: "primary" },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = item.status === "active";
                      const isNext = item.status === "next";
                      const isDone = item.status === "done";
                      const isActive2 = item.status === "active-2";
                      return (
                        <div
                          key={item.label}
                          className={`rounded-xl border p-3.5 text-center transition-all hover:scale-[1.02] ${
                            isActive
                              ? "border-primary/40 bg-primary/8 shadow-sm"
                              : isNext
                              ? "border-accent/30 bg-accent/5"
                              : isDone
                              ? "border-emerald-400/30 bg-emerald-50/50 dark:bg-emerald-500/5"
                              : isActive2
                              ? "border-primary/30 bg-primary/5"
                              : "border-border/40 bg-muted/30"
                          }`}
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full mx-auto mb-2 ${
                            isActive || isActive2 ? "bg-primary/15" : isNext ? "bg-accent/15" : isDone ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-muted"
                          }`}>
                            <ItemIcon className={`h-4 w-4 ${
                              isActive || isActive2
                                ? "text-primary"
                                : isNext
                                ? "text-accent"
                                : isDone
                                ? "text-emerald-600"
                                : "text-muted-foreground"
                            }`} />
                          </div>
                          <p className={`text-xs font-semibold ${
                            isActive || isActive2
                              ? "text-primary"
                              : isNext
                              ? "text-accent"
                              : isDone
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}>
                            {item.label}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${
                            isActive ? "text-primary/70 animate-pulse" : "text-muted-foreground/70"
                          }`}>
                            {item.sub}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Status message */}
                  <div className="rounded-xl bg-gradient-to-r from-primary/8 to-accent/5 border border-primary/20 p-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-primary">
                        Procédure ANEF en cours de traitement
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Prochaine étape :{" "}
                        <span className="font-semibold text-foreground">réservation du billet d'avion</span>
                        {" "}·{" "}
                        Éligibilité Pack ALTIS conditionnée à un score &gt; 80 %{" "}
                        <span className="inline-flex items-center gap-1 text-success font-semibold ml-1">
                          <CheckCircle2 className="h-3 w-3" /> Éligible — 82 %
                        </span>
                      </p>
                    </div>
                    <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20 text-[10px]">
                      5 % success fee
                    </Badge>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>

              </TabsContent>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TAB 3 — OPPORTUNITÉS                                       */}
              {/* ══════════════════════════════════════════════════════════ */}
              <TabsContent value="opportunites" className="space-y-5 mt-0">

          {/* ── Offres recommandées ─────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-accent to-primary" />
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
               <CardTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Star className="h-4 w-4 text-primary" />
                    </div>
                    Opportunités sélectionnées pour votre profil
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-xs gap-1 font-medium">
                      <Zap className="h-3 w-3" /> France Travail · Partenaires AXIOM
                    </Badge>
                    {ftLoading && (
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Sélection basée sur vos compétences :{" "}
                  <span className="font-medium text-foreground">
                    {displaySkills.join(", ")}
                  </span>
                  {" "}· Secteurs à forte tension en France métropolitaine
                </p>
              </CardHeader>

              <CardContent className="space-y-3">
                {offersToDisplay.map((offer, idx) => {
                  const score = (offer as { score?: number }).score ?? 80;
                  const title = (offer as { title?: string }).title || "";
                  const location = (offer as { location?: string }).location || "";
                  const contract = (offer as { contract?: string }).contract || "CDI";
                  const codeRome = (offer as { codeRome?: string }).codeRome || "";
                  const salary = (offer as { salary?: string | null }).salary;
                  const skills = (offer as { skills?: string[] }).skills || [];
                  const offerId = (offer as { id: string }).id;
                  const offerUrl = (offer as { url?: string | null }).url;
                  const company = (offer as { company?: string }).company;
                  const tension = (offer as { tension?: string }).tension;

                  const scoreColor = score >= 90 ? "text-emerald-600 dark:text-emerald-400" : score >= 80 ? "text-primary" : "text-foreground";
                  const scoreBarClass = score >= 90 ? "[&>div]:bg-emerald-500" : score >= 80 ? "[&>div]:bg-primary" : "[&>div]:bg-foreground/60";

                  return (
                    <motion.div
                      key={offerId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="group rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md hover:bg-muted/10"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Score circle */}
                        <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 shrink-0">
                          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${
                            score >= 90 ? "border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-500/10" : score >= 80 ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
                          }`}>
                            <span className={`text-xl font-bold leading-none ${scoreColor}`}>
                              {score}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground text-center font-medium">% Match</p>
                          <Progress value={score} className={`h-1.5 w-14 ${scoreBarClass}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-foreground text-sm">{title}</p>
                            <Badge className={`text-[10px] border px-2 py-0.5 font-semibold ${CONTRACT_COLORS[contract] || "bg-muted text-muted-foreground border-border"}`}>
                              {contract}
                            </Badge>
                            {tension && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className={`text-[10px] border px-2 py-0.5 gap-1 cursor-help ${TENSION_COLORS[tension] || "bg-muted text-muted-foreground"}`}>
                                    <Flame className="h-2.5 w-2.5" />
                                    Tension {tension}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs">
                                  Grande demande en France · Priorité recrutement
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground font-mono">
                              {codeRome}
                            </Badge>
                          </div>

                          {company && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {company}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {location}
                            </span>
                            {salary && (
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <Banknote className="h-3 w-3 text-muted-foreground" />
                                {salary}
                              </span>
                            )}
                          </div>

                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {skills.map((sk) => (
                                <Badge key={sk} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                  {sk}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* CTA */}
                        <Button
                          size="sm"
                          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
                          onClick={() => {
                            if (offerUrl) {
                              window.open(offerUrl, "_blank", "noopener,noreferrer");
                            } else {
                              toast({
                                title: "Candidature transmise",
                                description: `Votre profil a été envoyé pour "${title}".`,
                              });
                            }
                          }}
                        >
                          Postuler
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}

                {/* CTA micro-paiement */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/[0.03] to-primary/5 p-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Sparkles className="h-4.5 w-4.5 h-[18px] w-[18px] text-primary" />
                      </div>
                       <div>
                        <p className="font-bold text-sm text-foreground">
                          Accédez à l'intégralité de vos opportunités pour{" "}
                          <span className="text-primary">10 € — paiement unique</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Score approfondi · Matchs personnalisés prioritaires · Parcours ALTIS complet · Sans abonnement
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground text-xs hover:text-foreground"
                        onClick={() =>
                          toast({ title: "Accès gratuit maintenu", description: "Vous conservez l'accès limité à 3 correspondances." })
                        }
                      >
                        Continuer gratuitement
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
                        onClick={handleUnlockPayment}
                        disabled={paymentLoading}
                      >
                        {paymentLoading ? "Redirection…" : "Débloquer l'accès complet"}
                        {!paymentLoading && <ArrowRight className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Premium upsell banner */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/85 p-4 text-primary-foreground shadow-md"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(217_91%_75%_/_0.15),_transparent_60%)]" />
                  <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 shrink-0 mt-0.5 text-primary-foreground/80" />
                      <div>
                        <p className="font-bold text-sm">
                          Obtenez votre Badge Certifié MINEFOP/MINREX — 30 €
                        </p>
                        <p className="text-xs text-primary-foreground/70 mt-0.5">
                          Visibilité prioritaire ×3 auprès des recruteurs partenaires · Garantie opérationnel dès le premier jour
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shrink-0 font-bold gap-1.5 shadow-sm"
                      onClick={() =>
                        toast({ title: "Certification Premium — 30 €", description: "Redirection vers l'espace de certification…" })
                      }
                    >
                      Activer la Certification
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── La Bonne Boite – Entreprises qui recrutent ─────────── */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    Entreprises partenaires à fort potentiel d'embauche
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-xs gap-1">
                      <Zap className="h-3 w-3" /> La Bonne Boite · France Travail
                    </Badge>
                    {lbbLoading && (
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-10">
                  Secteurs BTP · Santé · CHR — Potentiel d'embauche analysé par l'IA France Travail
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(lbbCompanies || MOCK_LBB_COMPANIES).map((company, idx) => {
                    const stars = Math.round(company.hiringPotential);
                    const badgeClass = SECTOR_BADGE_COLORS[company.sector] || SECTOR_BADGE_COLORS["Autre"];
                    return (
                      <motion.div
                        key={company.siret}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.06 }}
                        className="group rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-2.5 transition-all hover:border-primary/30 hover:shadow-md hover:bg-muted/10"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
                              {company.name}
                            </p>
                            {company.nafLabel && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                {company.nafLabel}
                              </p>
                            )}
                          </div>
                          <Badge className={`shrink-0 text-[10px] border px-2 py-0.5 ${badgeClass}`}>
                            {company.sector}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {company.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {company.city} {company.zipCode}
                            </span>
                          )}
                          {company.headcount && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {company.headcount} sal.
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0.5 text-muted-foreground">
                            {company.romeCode}
                          </Badge>
                          {company.romeLabel && (
                            <span className="text-[11px] text-muted-foreground truncate">
                              {company.romeLabel}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">Probabilité :</span>
                            <span className="text-xs font-bold text-amber-500 ml-1">
                              {"★".repeat(Math.max(0, stars))}
                              <span className="text-muted-foreground/30">{"★".repeat(Math.max(0, 5 - stars))}</span>
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {company.hiringPotential.toFixed(1)}/5
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-primary/30 text-primary hover:bg-primary/5 gap-1.5 text-xs group-hover:bg-primary/5 transition-colors"
                          onClick={() => {
                            if (company.url && company.url !== "#") {
                              window.open(company.url, "_blank", "noopener,noreferrer");
                            } else {
                              toast({
                                title: "Candidature spontanée",
                                description: `Envoi du profil à ${company.name}…`,
                              });
                            }
                          }}
                        >
                          Candidature spontanée
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>

                {!lbbCompanies && !lbbLoading && (
                  <p className="mt-3 text-center text-xs text-muted-foreground/60 italic">
                    Données illustratives — Activez l'API La Bonne Boite sur francetravail.io pour les résultats réels
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

              </TabsContent>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* TAB 4 — MON PROFIL                                         */}
              {/* ══════════════════════════════════════════════════════════ */}
              <TabsContent value="profil" className="space-y-5 mt-0">

          {/* ── Carte de visite premium ──────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 shadow-premium">
              {/* Gradient top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />
              {/* Background pattern */}
              <div
                className="absolute inset-0 opacity-[0.025]"
                style={{ backgroundImage: "radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)", backgroundSize: "24px 24px" }}
              />
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 sm:p-7">
                {/* Avatar uploadable */}
                <div className="relative shrink-0 group">
                  <label htmlFor="avatar-upload" className="cursor-pointer block">
                    <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md">
                      {/* Photo ou initiales */}
                      {(avatarPreview || profile?.avatar_url || user?.user_metadata?.picture) ? (
                        <img
                          src={avatarPreview || profile?.avatar_url || user?.user_metadata?.picture}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
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
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                  />
                  {/* Online dot */}
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background bg-success flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  </div>
                </div>

                {/* Infos */}
                <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <h2 className="text-xl font-extrabold text-foreground tracking-tight truncate">{displayName}</h2>
                    <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] px-2.5 py-0.5 font-bold self-center">
                      <Award className="h-3 w-3 mr-1" />
                      CERTIFIÉ MINEFOP
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground font-medium">
                    {displayCountry} · Français {displayFrench}
                  </p>

                  <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                    {MOCK_PROFILE_DATA.rome.map((r) => (
                      <Badge key={r.code} variant="outline" className="text-[11px] px-2.5 py-0.5 font-semibold border-primary/30 text-primary/80">
                        {r.code} · {r.label}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                    <span className="text-xs text-muted-foreground font-medium">Score compatibilité</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-primary to-accent" />
                      </div>
                      <span className="text-sm font-extrabold text-primary">78%</span>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/30 text-[10px] px-2 font-semibold">Excellent</Badge>
                  </div>
                </div>

                {/* CTA modifier */}
                <div className="shrink-0 flex flex-col gap-2 self-center">
                  <Button
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold shadow-sm"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Modifier mon profil
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={exportLoading}
                    className="gap-1.5 border-primary/20 text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {exportLoading ? "Export…" : "Exporter (RGPD)"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Mon Profil enrichi (3 fiches) ──────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-primary/40 to-accent/40" />
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    Mon Profil
                    <Badge variant="outline" className="text-[10px] px-2 text-muted-foreground font-medium">
                      3 fiches infos
                    </Badge>
                  </CardTitle>
                </div>
                {!editing ? (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="border-primary/30 text-primary hover:bg-primary/5 gap-1.5 font-medium"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      Mettre à jour mes 3 fiches
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      disabled={exportLoading}
                      className="gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {exportLoading ? "Export…" : "Exporter RGPD (JSON)"}
                    </Button>
                    <a href="mailto:rgpd@axiom-talents.com?subject=Demande%20DPO&body=Bonjour%2C%20">
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        Contacter DPO
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                      onClick={() => updateProfile.mutate()}
                      disabled={updateProfile.isPending}
                    >
                      <Save className="h-3.5 w-3.5" />
                      {updateProfile.isPending ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {editing ? (
                  <div className="space-y-6">
                    {/* Fiche 1 – Identité */}
                    <div className="rounded-xl border border-border/60 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                        <p className="text-sm font-bold text-foreground">Identité</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nom complet</Label>
                          <Input
                            id="full_name"
                            value={form.full_name}
                            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                            placeholder="Jean Dupont"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                          <Input value={profile?.email || ""} disabled className="bg-muted" />
                        </div>
                      </div>
                    </div>

                    {/* Fiche 2 – Métiers */}
                    <div className="rounded-xl border border-border/60 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                        <p className="text-sm font-bold text-foreground">Métiers & Compétences</p>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Compétences (séparées par des virgules)</Label>
                          <Input
                            value={form.skills}
                            onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
                            placeholder="Maçonnerie, Plomberie…"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fiche 3 – Mobilité */}
                    <div className="rounded-xl border border-border/60 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                        <p className="text-sm font-bold text-foreground">Mobilité</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pays d'origine</Label>
                          <Input
                            id="country"
                            value={form.country}
                            onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                            placeholder="Cameroun"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Niveau de français</Label>
                          <Select
                            value={form.french_level}
                            onValueChange={(v) => setForm((p) => ({ ...p, french_level: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              {FRENCH_LEVELS.map((l) => (
                                <SelectItem key={l} value={l}>{l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 3 fiches display */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      {/* Fiche 1 – Identité */}
                      <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-4 space-y-3 hover:border-primary/25 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                          <p className="text-xs font-bold text-foreground uppercase tracking-wide">Identité</p>
                        </div>
                        <div className="space-y-2">
                          <ProfileField label="Nom" value={displayName} />
                          <ProfileField label="Email" value={profile?.email} />
                          <ProfileField label="Pays" value={displayCountry} />
                        </div>
                      </div>

                      {/* Fiche 2 – Métiers */}
                      <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-4 space-y-3 hover:border-primary/25 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                          <p className="text-xs font-bold text-foreground uppercase tracking-wide">Métiers</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 font-semibold">Compétences</p>
                          <div className="flex flex-wrap gap-1">
                            {displaySkills.map((s) => (
                              <Badge key={s} variant="secondary" className="text-[10px] font-medium">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 font-semibold">Codes ROME</p>
                          <div className="space-y-1.5">
                            {MOCK_PROFILE_DATA.rome.map((r) => (
                              <div key={r.code} className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
                                <span className="text-[10px] font-mono font-bold text-primary">{r.code}</span>
                                <span className="text-[10px] text-muted-foreground">{r.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Fiche 3 – Mobilité */}
                      <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-4 space-y-3 hover:border-primary/25 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                          <p className="text-xs font-bold text-foreground uppercase tracking-wide">Mobilité</p>
                        </div>
                        <ProfileField label="Niveau français" value={displayFrench} />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 font-semibold">Statut visa</p>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1 font-semibold">
                            <Globe className="h-2.5 w-2.5" /> ANEF en cours
                          </Badge>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 font-semibold">Diplôme</p>
                          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-400/50 text-[10px] gap-1 font-semibold">
                            <Award className="h-2.5 w-2.5" /> CERTIFIÉ MINEFOP
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* RGPD actions */}
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Vos droits RGPD</p>
                          <p className="text-xs text-muted-foreground">Art. 17 & 20 RGPD · AXIOM SAS · rgpd@axiom-talents.com</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExport}
                          disabled={exportLoading}
                          className="gap-1.5 text-xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {exportLoading ? "Export…" : "Export données JSON"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer mon compte
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Diplômes & Certifications ──────────────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  Diplômes & Certifications
                  <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-400/40 text-[10px] px-2 gap-1 font-semibold">
                    <Award className="h-2.5 w-2.5" /> MINEFOP / MINREX
                  </Badge>
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

        </motion.div>

        {/* ── Delete dialog ──────────────────────────────────────── */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Toutes vos données personnelles seront supprimées conformément à l'article 17 du RGPD dans un délai de 30 jours.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteRequest}
              >
                Confirmer la suppression
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardLayout>
    </TooltipProvider>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 font-semibold">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}
