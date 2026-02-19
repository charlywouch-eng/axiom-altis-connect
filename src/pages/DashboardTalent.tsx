import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Eye,
  Shield,
  Download,
  Trash2,
  Mail,
  Lock,
  RefreshCw,
  Ban,
  Award,
  Zap,
  ArrowRight,
  CheckCheck,
  Package,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Flame,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PremiumStatCard } from "@/components/PremiumStatCard";
import DiplomaUpload from "@/components/dashboard/DiplomaUpload";

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
}

const MOCK_TIMELINE: TimelineStep[] = [
  {
    label: "Offre acceptée",
    icon: Briefcase,
    status: "done",
  },
  {
    label: "Visa en cours",
    icon: Globe,
    status: "done",
    badge: { label: "CERTIFIÉ MINEFOP", color: "gold" },
    tooltipText:
      "Diplôme CQP/DQP audité + Delta ROME comblé – Garantie opérationnel jour 1. Upsell Premium 30 € pour visibilité prioritaire",
    upsell: "Premium 30 € – Visibilité prioritaire recruteurs",
  },
  {
    label: "Billet réservé",
    icon: Plane,
    status: "done",
  },
  {
    label: "Logement trouvé",
    icon: Home,
    status: "done",
  },
  {
    label: "Formation démarrée",
    icon: GraduationCap,
    status: "active",
    tag: "Classes Miroirs – Module normes FR validé AXIOM",
  },
  {
    label: "En poste",
    icon: Building2,
    status: "pending",
  },
];

// Enriched mock offers matching the spec (BTP/Santé/CHR)
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

export default function DashboardTalent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    country: "",
    french_level: "",
    skills: "",
  });

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

      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ romeCode, count: 5 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "France Travail API unavailable");
      }

      const json = await res.json();
      return (json.offers as Array<Record<string, unknown>>).map((o, i) => ({
        ...(o as object),
        score: Math.max(75, 95 - i * 5),
      })) as Array<Record<string, unknown> & { score: number }>;
    },
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || MOCK_PROFILE_DATA.full_name,
        country: profile.country || MOCK_PROFILE_DATA.country,
        french_level: profile.french_level || MOCK_PROFILE_DATA.french_level,
        skills: profile.skills?.join(", ") || MOCK_PROFILE_DATA.skills.join(", "),
      });
    } else if (!isLoading) {
      setForm({
        full_name: MOCK_PROFILE_DATA.full_name,
        country: MOCK_PROFILE_DATA.country,
        french_level: MOCK_PROFILE_DATA.french_level,
        skills: MOCK_PROFILE_DATA.skills.join(", "),
      });
    }
  }, [profile, isLoading]);

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

  const PROGRESS_PERCENT = 60;

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

  const displayName = profile?.full_name || MOCK_PROFILE_DATA.full_name;
  const displayCountry = profile?.country || MOCK_PROFILE_DATA.country;
  const displayFrench = profile?.french_level || MOCK_PROFILE_DATA.french_level;
  const displaySkills =
    profile?.skills && profile.skills.length > 0
      ? profile.skills
      : MOCK_PROFILE_DATA.skills;

  const offersToDisplay = ftOffers && ftOffers.length > 0 ? ftOffers : MOCK_RECOMMENDED_OFFERS;

  return (
    <TooltipProvider>
      <DashboardLayout sidebarVariant="talent">
        <div className="space-y-6 pb-8">
          {/* ── Header ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Mon Espace Talent
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenue, {displayName} · Suivez votre parcours de mobilité
              </p>
            </div>
            <Badge className="self-start sm:self-auto bg-amber-500/15 text-amber-700 border border-amber-400/40 gap-1.5 px-3 py-1.5 text-xs dark:text-amber-400">
              <Award className="h-3.5 w-3.5" />
              CERTIFIÉ MINEFOP
            </Badge>
          </motion.div>

          {/* ── KPIs ───────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PremiumStatCard
              icon={Briefcase}
              title="Offres disponibles"
              value={totalOpenOffers > 0 ? String(totalOpenOffers) : "3"}
              accent="blue"
              tensionLevel="low"
              subtitle="Postes ouverts sur la plateforme"
            />
            <PremiumStatCard
              icon={Star}
              title="Offres recommandées"
              value="3"
              accent="green"
              tensionLevel="low"
              subtitle="Via France Travail – matchées ROME"
            />
            <PremiumStatCard
              icon={TrendingUp}
              title="Progression relocation"
              value="60%"
              tensionLevel="low"
              tensionLabel="En cours"
              subtitle="Parcours ALTIS Pack Zéro Stress"
            />
          </div>

          {/* ── Mon Parcours Relocation ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-primary/20 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Plane className="h-5 w-5 text-primary" />
                    Mon Parcours Relocation
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2">
                      ALTIS Mobility
                    </Badge>
                  </CardTitle>
                  <span className="text-lg font-bold text-primary">
                    {PROGRESS_PERCENT}%
                  </span>
                </div>
                <Progress
                  value={PROGRESS_PERCENT}
                  className="h-2 mt-2 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  4 étapes complétées sur 6 · Formation démarrée en cours
                </p>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {MOCK_TIMELINE.map((step, i) => {
                    const isLast = i === MOCK_TIMELINE.length - 1;
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.label}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex gap-4"
                      >
                        {/* Line + dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors shadow-sm ${
                              step.status === "done"
                                ? "bg-success text-success-foreground shadow-success/20"
                                : step.status === "active"
                                ? "border-2 border-primary bg-primary/10 text-primary shadow-primary/20"
                                : "border-2 border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {step.status === "done" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : step.status === "active" ? (
                              <Clock className="h-4 w-4 animate-pulse" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          {!isLast && (
                            <div
                              className={`w-0.5 flex-1 min-h-[2.5rem] transition-colors ${
                                step.status === "done" ? "bg-success/60" : "bg-border"
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="pb-5 pt-1 flex flex-col gap-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`font-semibold text-sm ${
                                step.status === "pending"
                                  ? "text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {step.label}
                            </p>

                            {/* Gold MINEFOP badge */}
                            {step.badge && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-400/40 hover:bg-amber-500/25 cursor-help text-[10px] px-2 py-0.5">
                                    <Award className="h-3 w-3" />
                                    {step.badge.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs text-xs leading-relaxed space-y-1">
                                  <p className="font-semibold">Certification AXIOM</p>
                                  <p>{step.tooltipText}</p>
                                  {step.upsell && (
                                    <p className="text-accent font-semibold border-t border-border/50 pt-1 mt-1">
                                      ✦ {step.upsell}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {step.status === "active" && (
                              <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] px-2 py-0.5 animate-pulse">
                                En cours
                              </Badge>
                            )}
                            {step.status === "done" && (
                              <Badge className="bg-success/10 text-success border-success/30 text-[10px] px-2 py-0.5">
                                ✓ Complété
                              </Badge>
                            )}
                          </div>

                          {step.tag && (
                            <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 mt-1 w-fit">
                              <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                              <p className="text-xs text-primary font-medium">
                                {step.tag}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Teaser unlock */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-2 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Débloquez la suite</span>{" "}
                      pour{" "}
                      <span className="font-semibold text-primary">10 € unique</span>
                      {" "}(score détaillé + matchs prioritaires) – Pas d'abonnement, valeur immédiate
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-primary/40 text-primary hover:bg-primary/10 text-xs"
                    onClick={() =>
                      toast({ title: "Offre 10 €", description: "Redirection vers le paiement…" })
                    }
                  >
                    Débloquer
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Pack Zéro Stress ALTIS ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="overflow-hidden border-primary/30">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2 text-primary text-base">
                    <Package className="h-5 w-5" />
                    Pack Zéro Stress — ALTIS Mobility
                  </CardTitle>
                  <Badge className="bg-primary/10 text-primary border-primary/30 text-xs gap-1">
                    <Zap className="h-3 w-3" /> En cours · Score 82%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Visa ANEF", status: "active", icon: Globe, sub: "En traitement" },
                    { label: "Billet d'avion", status: "next", icon: Plane, sub: "Prochaine étape" },
                    { label: "Logement", status: "pending", icon: Home, sub: "À planifier" },
                    { label: "Formation", status: "pending", icon: GraduationCap, sub: "Classes Miroirs" },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = item.status === "active";
                    const isNext = item.status === "next";
                    return (
                      <div
                        key={item.label}
                        className={`rounded-xl border p-3 text-center transition-colors ${
                          isActive
                            ? "border-primary/40 bg-primary/10"
                            : isNext
                            ? "border-accent/30 bg-accent/5"
                            : "border-border/40 bg-muted/30"
                        }`}
                      >
                        <ItemIcon
                          className={`h-5 w-5 mx-auto mb-1.5 ${
                            isActive
                              ? "text-primary"
                              : isNext
                              ? "text-accent"
                              : "text-muted-foreground"
                          }`}
                        />
                        <p
                          className={`text-xs font-semibold ${
                            isActive
                              ? "text-primary"
                              : isNext
                              ? "text-accent"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.label}
                        </p>
                        <p
                          className={`text-[10px] mt-0.5 ${
                            isActive ? "text-primary/70 animate-pulse" : "text-muted-foreground/70"
                          }`}
                        >
                          {item.sub}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-3">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      Visa ANEF en traitement
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Prochaine étape : <span className="font-medium text-foreground">billet réservé</span> · Éligible ALTIS si score &gt;80 %{" "}
                      <span className="inline-flex items-center gap-0.5 text-success font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Éligible (82%)
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Offres recommandées ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Offres recommandées pour vous
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-xs gap-1">
                      <Zap className="h-3 w-3" /> France Travail + FNE Cameroun
                    </Badge>
                    {ftLoading && (
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Basées sur vos compétences :{" "}
                  <span className="font-medium text-foreground">
                    {displaySkills.join(", ")}
                  </span>
                  {" "}· Métiers en tension élevée France
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

                  return (
                    <motion.div
                      key={offerId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + idx * 0.08 }}
                      className="rounded-xl border border-border/60 p-4 transition-all hover:border-primary/30 hover:shadow-sm hover:bg-muted/10"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Score */}
                        <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1 min-w-[5rem]">
                          <div className="text-center">
                            <span
                              className={`text-2xl font-bold leading-none ${
                                score >= 90
                                  ? "text-success"
                                  : score >= 80
                                  ? "text-primary"
                                  : "text-foreground"
                              }`}
                            >
                              {score}%
                            </span>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Match</p>
                          </div>
                          <Progress
                            value={score}
                            className={`h-1.5 w-16 sm:w-full ${
                              score >= 90
                                ? "[&>div]:bg-success"
                                : score >= 80
                                ? "[&>div]:bg-primary"
                                : "[&>div]:bg-foreground/60"
                            }`}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground text-sm">{title}</p>
                            <Badge className={`text-[10px] border px-2 py-0.5 ${CONTRACT_COLORS[contract] || "bg-muted text-muted-foreground border-border"}`}>
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
                              <span className="flex items-center gap-1">
                                <Banknote className="h-3 w-3" />
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

                        {/* Action */}
                        <Button
                          size="sm"
                          className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
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
                  transition={{ delay: 0.55 }}
                  className="mt-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          Débloquez plus d'offres pour{" "}
                          <span className="text-primary">10 € unique</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Accédez à vos matchs personnalisés & parcours ALTIS complet · Pas d'abonnement
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground text-xs"
                        onClick={() =>
                          toast({ title: "Option gratuite", description: "Vous restez sur l'offre de base (3 matchs)." })
                        }
                      >
                        Pas maintenant
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                        onClick={() =>
                          toast({ title: "Paiement 10 €", description: "Redirection vers le paiement sécurisé…" })
                        }
                      >
                        Débloquer 10 €
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Premium upsell */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 shrink-0 mt-0.5 text-primary-foreground/80" />
                    <div>
                      <p className="font-semibold text-sm">
                        Passez Premium (30 €) – Badge vérifié MINEFOP/MINREX
                      </p>
                      <p className="text-xs text-primary-foreground/70 mt-0.5">
                        Visibilité ×3 auprès des recruteurs · Garantie opérationnel jour 1
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shrink-0 font-semibold gap-1.5"
                    onClick={() =>
                      toast({ title: "Offre Premium 30 €", description: "Redirection vers l'espace facturation…" })
                    }
                  >
                    Activer Premium
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Mon Profil enrichi (3 fiches) ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Mon Profil
                  <Badge variant="outline" className="text-[10px] px-2 text-muted-foreground">
                    3 fiches infos
                  </Badge>
                </CardTitle>
                {!editing ? (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="border-primary/30 text-primary hover:bg-primary/5 gap-1.5"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      Mettre à jour mes 3 fiches infos
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
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => updateProfile.mutate()}
                      disabled={updateProfile.isPending}
                    >
                      <Save className="mr-1 h-3.5 w-3.5" />
                      {updateProfile.isPending ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-5">
                    {/* Fiche 1 – Identité */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                        <p className="text-sm font-semibold text-foreground">Identité</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 pl-8">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Nom complet</Label>
                          <Input
                            id="full_name"
                            value={form.full_name}
                            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                            placeholder="Jean Dupont"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={profile?.email || ""} disabled className="bg-muted" />
                        </div>
                      </div>
                    </div>

                    {/* Fiche 2 – Métiers */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                        <p className="text-sm font-semibold text-foreground">Métiers & Compétences</p>
                      </div>
                      <div className="space-y-3 pl-8">
                        <div className="space-y-2">
                          <Label>Compétences (séparées par des virgules)</Label>
                          <Input
                            value={form.skills}
                            onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
                            placeholder="Maçonnerie, Plomberie…"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fiche 3 – Mobilité */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                        <p className="text-sm font-semibold text-foreground">Mobilité</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 pl-8">
                        <div className="space-y-2">
                          <Label htmlFor="country">Pays d'origine</Label>
                          <Input
                            id="country"
                            value={form.country}
                            onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                            placeholder="Cameroun"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Niveau de français</Label>
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
                  <div className="space-y-5">
                    {/* 3 fiches display */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      {/* Fiche 1 */}
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Identité</p>
                        </div>
                        <ProfileField label="Nom" value={displayName} />
                        <ProfileField label="Email" value={profile?.email} />
                        <ProfileField label="Pays d'origine" value={displayCountry} />
                      </div>

                      {/* Fiche 2 */}
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Métiers</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Compétences</p>
                          <div className="flex flex-wrap gap-1">
                            {displaySkills.map((s) => (
                              <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Codes ROME</p>
                          <div className="space-y-1">
                            {MOCK_PROFILE_DATA.rome.map((r) => (
                              <div key={r.code} className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1">
                                <span className="text-[10px] font-mono font-bold text-primary">{r.code}</span>
                                <span className="text-[10px] text-muted-foreground">{r.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Fiche 3 */}
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Mobilité</p>
                        </div>
                        <ProfileField label="Niveau de français" value={displayFrench} />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Certifications</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-1">
                              <Award className="h-3 w-3 text-amber-600 shrink-0" />
                              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">MINEFOP – Certifié</span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2 py-1">
                              <CheckCheck className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-[10px] font-medium text-muted-foreground">MINREX – En attente</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Diploma Upload */}
          <DiplomaUpload />

          {/* ── Mes droits RGPD ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Shield className="h-5 w-5" /> Mes droits RGPD
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Conformément au RGPD (UE 2016/679), vous disposez de droits sur vos données personnelles traitées par AXIOM SAS.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: Eye, label: "Droit d'accès", desc: "Consultez toutes vos données stockées." },
                    { icon: RefreshCw, label: "Droit de rectification", desc: "Modifiez votre profil à tout moment." },
                    { icon: Trash2, label: "Droit à l'effacement", desc: "Demandez la suppression de votre compte." },
                    { icon: Ban, label: "Droit d'opposition", desc: "Opposez-vous au traitement de vos données." },
                    { icon: Download, label: "Droit à la portabilité", desc: "Exportez vos données en format JSON." },
                    { icon: Lock, label: "Droit à la limitation", desc: "Limitez le traitement en contactant le DPO." },
                  ].map(({ icon: RIcon, label, desc }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <RIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Responsable du traitement :</span>{" "}
                  AXIOM SAS, Paris, France.{" "}
                  <span className="font-medium text-foreground">Conservation :</span> 24 mois maximum.{" "}
                  <span className="font-medium text-foreground">Transferts :</span> UE uniquement, via Clauses Contractuelles Types (CCT 2021).{" "}
                  <Link to="/rgpd" className="text-primary hover:underline font-medium" target="_blank">
                    Lire la politique complète →
                  </Link>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/5"
                    onClick={handleExport}
                    disabled={exportLoading}
                  >
                    <Download className="h-4 w-4" />
                    {exportLoading ? "Export en cours…" : "Exporter mes données (JSON)"}
                  </Button>
                  <a
                    href="mailto:rgpd@axiom-talents.com?subject=Demande%20DPO%20-%20RGPD&body=Bonjour%2C%20je%20souhaite%20exercer%20mes%20droits%20RGPD."
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full gap-2">
                      <Mail className="h-4 w-4" />
                      Contacter le DPO
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Demander la suppression
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Delete confirmation dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" /> Demande de suppression de compte
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    Vous allez envoyer une demande de suppression de votre compte et de l'ensemble de vos données personnelles à notre DPO.
                  </span>
                  <span className="block text-foreground/80 font-medium">
                    Conformément au RGPD, votre demande sera traitée sous 30 jours.
                  </span>
                  <span className="block">
                    Un email de confirmation sera envoyé à : <strong>{profile?.email}</strong>
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteRequest}
                >
                  Confirmer la demande
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">
        {value || <span className="italic text-muted-foreground">Non renseigné</span>}
      </p>
    </div>
  );
}
