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
  FileText,
  ChevronRight,
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
}

const MOCK_TIMELINE: TimelineStep[] = [
  { label: "Offre acceptée", icon: Briefcase, status: "done" },
  { label: "Visa en cours", icon: Globe, status: "done",
    badge: { label: "CERTIFIÉ MINEFOP", color: "gold" },
    tooltipText: "Diplôme CQP/DQP audité + Delta ROME comblé – Garantie opérationnel jour 1",
  },
  { label: "Billet réservé", icon: Plane, status: "done" },
  { label: "Logement trouvé", icon: Home, status: "done" },
  { label: "Formation démarrée", icon: GraduationCap, status: "active",
    tag: "Classes Miroirs – Module normes FR validé AXIOM",
  },
  { label: "En poste", icon: Building2, status: "pending" },
];

// Mock recommended offers (France Travail intégré)
const MOCK_RECOMMENDED_OFFERS = [
  {
    id: "mock-r1",
    title: "Aide-soignant(e)",
    secteur: "Santé",
    codeRome: "J1501",
    location: "Paris, Île-de-France",
    contract: "CDI",
    score: 92,
    salary: "28 000 – 32 000",
    skills: ["Soins", "Aide à la personne", "DEAS"],
  },
  {
    id: "mock-r2",
    title: "Maçon / Maçonne",
    secteur: "BTP",
    codeRome: "F1703",
    location: "Lyon, Auvergne-Rhône-Alpes",
    contract: "CDD",
    score: 85,
    salary: "26 000 – 32 000",
    skills: ["Maçonnerie", "Coffrage", "Sécurité chantier"],
  },
  {
    id: "mock-r3",
    title: "Cuisinier(ère)",
    secteur: "CHR",
    codeRome: "G1802",
    location: "Bordeaux, Nouvelle-Aquitaine",
    contract: "Saisonnier",
    score: 78,
    salary: "22 000 – 26 000",
    skills: ["Cuisine", "HACCP", "Pâtisserie"],
  },
];

const CONTRACT_COLORS: Record<string, string> = {
  CDI: "bg-success/10 text-success border-success/30",
  CDD: "bg-primary/10 text-primary border-primary/30",
  Saisonnier: "bg-accent/10 text-accent border-accent/30",
};

// Mock profile data
const MOCK_PROFILE_DATA = {
  full_name: "Test Cameroon",
  country: "Cameroun",
  french_level: "Avancé (B2)",
  skills: ["Maçonnerie", "Plomberie"],
  rome: [{ code: "F1703", label: "Maçon" }, { code: "F1603", label: "Plombier" }],
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

  // Count total open offers
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

  // Compute timeline progress at 60%
  const PROGRESS_PERCENT = 60;

  // Export personal data as JSON
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
      toast({
        title: "Export réussi",
        description: "Vos données personnelles ont été téléchargées.",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter vos données.",
        variant: "destructive",
      });
    }
    setExportLoading(false);
  };

  const handleDeleteRequest = () => {
    setDeleteDialogOpen(false);
    toast({
      title: "Demande envoyée",
      description:
        "Notre DPO traitera votre demande de suppression sous 30 jours. Un email de confirmation vous sera envoyé.",
    });
  };

  const displayName =
    profile?.full_name || MOCK_PROFILE_DATA.full_name;
  const displayCountry = profile?.country || MOCK_PROFILE_DATA.country;
  const displayFrench = profile?.french_level || MOCK_PROFILE_DATA.french_level;
  const displaySkills =
    profile?.skills && profile.skills.length > 0
      ? profile.skills
      : MOCK_PROFILE_DATA.skills;

  return (
    <TooltipProvider>
      <DashboardLayout sidebarVariant="talent">
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="font-display text-2xl font-bold text-foreground">
              Mon Espace Talent
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Bienvenue, {displayName} · Suivez votre parcours de mobilité
            </p>
          </motion.div>

          {/* KPIs */}
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
              subtitle="Parcours de mobilité"
            />
          </div>

          {/* ── Mon Parcours Relocation ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-primary/20 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Plane className="h-5 w-5 text-primary" />
                    Mon Parcours Relocation
                  </CardTitle>
                  <span className="text-sm font-semibold text-primary">
                    {PROGRESS_PERCENT}%
                  </span>
                </div>
                <Progress
                  value={PROGRESS_PERCENT}
                  className="h-2 mt-2 [&>div]:bg-primary"
                />
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {MOCK_TIMELINE.map((step, i) => {
                    const isLast = i === MOCK_TIMELINE.length - 1;
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                              step.status === "done"
                                ? "bg-success text-success-foreground"
                                : step.status === "active"
                                ? "border-2 border-primary bg-primary/10 text-primary"
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
                                step.status === "done"
                                  ? "bg-success"
                                  : "bg-border"
                              }`}
                            />
                          )}
                        </div>
                        <div className="pb-5 pt-1 flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`font-medium text-sm ${
                                step.status === "pending"
                                  ? "text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {step.label}
                            </p>
                            {/* Gold MINEFOP badge with tooltip */}
                            {step.badge && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="gap-1 bg-amber-500/15 text-amber-600 border border-amber-400/40 hover:bg-amber-500/25 cursor-help text-[10px] px-2 py-0.5">
                                    <Award className="h-3 w-3" />
                                    {step.badge.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="right"
                                  className="max-w-xs text-xs leading-relaxed"
                                >
                                  {step.tooltipText}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {step.status === "active" && (
                              <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] px-2 py-0.5">
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
                            <p className="text-xs text-primary/70 font-medium">
                              🎓 {step.tag}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Teaser ALTIS Pack Zéro Stress ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2 text-primary text-base">
                    <Package className="h-5 w-5" />
                    Pack Zéro Stress — ALTIS Mobility
                  </CardTitle>
                  <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                    En cours
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Visa ANEF", status: "active", icon: Globe },
                    { label: "Billet d'avion", status: "pending", icon: Plane },
                    { label: "Logement", status: "pending", icon: Home },
                    { label: "Formation", status: "pending", icon: GraduationCap },
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className={`rounded-xl border p-3 text-center transition-colors ${
                          item.status === "active"
                            ? "border-primary/30 bg-primary/10"
                            : "border-border/40 bg-muted/30"
                        }`}
                      >
                        <ItemIcon
                          className={`h-5 w-5 mx-auto mb-1.5 ${
                            item.status === "active"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <p
                          className={`text-xs font-medium ${
                            item.status === "active"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.label}
                        </p>
                        {item.status === "active" && (
                          <p className="text-[10px] text-primary/70 mt-0.5 animate-pulse">
                            En traitement
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-3">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80">
                    <span className="font-semibold text-primary">
                      Visa ANEF en traitement
                    </span>{" "}
                    · Prochaine étape :{" "}
                    <span className="font-medium">billet réservé</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Offres recommandées (France Travail) ──────────── */}
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
                  <Badge className="bg-primary/10 text-primary border-primary/30 text-xs gap-1">
                    <Zap className="h-3 w-3" /> Via France Travail
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Basées sur vos compétences :{" "}
                  <span className="font-medium text-foreground">
                    {displaySkills.join(", ")}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {MOCK_RECOMMENDED_OFFERS.map((offer, idx) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + idx * 0.07 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border/50 p-4 transition-all hover:bg-muted/20 hover:shadow-sm hover:border-primary/20"
                  >
                    {/* Score */}
                    <div className="flex sm:flex-col items-center gap-3 sm:gap-1 min-w-[4rem]">
                      <span
                        className={`text-2xl font-bold ${
                          offer.score >= 90
                            ? "text-success"
                            : offer.score >= 80
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {offer.score}%
                      </span>
                      <Progress
                        value={offer.score}
                        className={`h-1.5 w-16 sm:w-full [&>div]:${
                          offer.score >= 90
                            ? "bg-success"
                            : "bg-primary"
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {offer.title}
                        </p>
                        <Badge
                          className={`text-[10px] border px-2 py-0.5 ${CONTRACT_COLORS[offer.contract] || "bg-muted text-muted-foreground border-border"}`}
                        >
                          {offer.contract}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                          {offer.codeRome}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {offer.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Banknote className="h-3 w-3" />
                          {offer.salary} €/an
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {offer.skills.map((sk) => (
                          <Badge
                            key={sk}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0.5"
                          >
                            {sk}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action */}
                    <Button
                      size="sm"
                      className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                      onClick={() =>
                        toast({
                          title: "Candidature envoyée",
                          description: `Votre profil a été transmis pour "${offer.title}".`,
                        })
                      }
                    >
                      Postuler
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                ))}

                {/* CTA Premium */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 shrink-0 mt-0.5 text-primary-foreground/80" />
                    <div>
                      <p className="font-semibold text-sm">
                        Passez Premium (30 €) pour un badge vérifié MINEFOP/MINREX
                      </p>
                      <p className="text-xs text-primary-foreground/70 mt-0.5">
                        Visibilité x3 auprès des recruteurs · Garantie opérationnel jour 1
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shrink-0 font-semibold gap-1.5"
                    onClick={() =>
                      toast({
                        title: "Offre Premium",
                        description: "Redirection vers l'espace facturation…",
                      })
                    }
                  >
                    Activer Premium
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Mon Profil enrichi ─────────────────────────────── */}
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
                </CardTitle>
                {!editing ? (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="border-primary/30 text-primary hover:bg-primary/5"
                    >
                      Mettre à jour mon profil
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
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => updateProfile.mutate()}
                      disabled={updateProfile.isPending}
                    >
                      <Save className="mr-1 h-3.5 w-3.5" />
                      {updateProfile.isPending
                        ? "Enregistrement…"
                        : "Enregistrer"}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom complet</Label>
                      <Input
                        id="full_name"
                        value={form.full_name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, full_name: e.target.value }))
                        }
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={profile?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Pays d'origine</Label>
                      <Input
                        id="country"
                        value={form.country}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, country: e.target.value }))
                        }
                        placeholder="Cameroun"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Niveau de français</Label>
                      <Select
                        value={form.french_level}
                        onValueChange={(v) =>
                          setForm((p) => ({ ...p, french_level: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {FRENCH_LEVELS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="skills">
                        Compétences (séparées par des virgules)
                      </Label>
                      <Input
                        id="skills"
                        value={form.skills}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, skills: e.target.value }))
                        }
                        placeholder="Maçonnerie, Plomberie…"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ProfileField label="Nom" value={displayName} />
                      <ProfileField
                        label="Email"
                        value={profile?.email}
                      />
                      <ProfileField
                        label="Pays d'origine"
                        value={displayCountry}
                      />
                      <ProfileField
                        label="Niveau de français"
                        value={displayFrench}
                      />
                    </div>

                    {/* Skills */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Compétences
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {displaySkills.map((s) => (
                          <Badge key={s} variant="secondary">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* ROME codes */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Codes ROME associés
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {MOCK_PROFILE_DATA.rome.map((r) => (
                          <div
                            key={r.code}
                            className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5"
                          >
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-mono font-semibold text-primary">
                              {r.code}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {r.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Certification status */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5">
                        <Award className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                          MINEFOP – Certifié
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
                        <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          MINREX – En attente
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Diploma Upload */}
          <DiplomaUpload />

          {/* ── Mes droits RGPD ───────────────────────────────── */}
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
                  Conformément au RGPD (UE 2016/679), vous disposez de droits
                  sur vos données personnelles traitées par AXIOM SAS.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    {
                      icon: Eye,
                      label: "Droit d'accès",
                      desc: "Consultez toutes vos données stockées.",
                    },
                    {
                      icon: RefreshCw,
                      label: "Droit de rectification",
                      desc: "Modifiez votre profil à tout moment.",
                    },
                    {
                      icon: Trash2,
                      label: "Droit à l'effacement",
                      desc: "Demandez la suppression de votre compte.",
                    },
                    {
                      icon: Ban,
                      label: "Droit d'opposition",
                      desc: "Opposez-vous au traitement de vos données.",
                    },
                    {
                      icon: Download,
                      label: "Droit à la portabilité",
                      desc: "Exportez vos données en format JSON.",
                    },
                    {
                      icon: Lock,
                      label: "Droit à la limitation",
                      desc: "Limitez le traitement en contactant le DPO.",
                    },
                  ].map(({ icon: RIcon, label, desc }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <RIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">
                    Responsable du traitement :
                  </span>{" "}
                  AXIOM SAS, Paris, France.{" "}
                  <span className="font-medium text-foreground">
                    Conservation :
                  </span>{" "}
                  24 mois maximum.{" "}
                  <span className="font-medium text-foreground">
                    Transferts :
                  </span>{" "}
                  UE uniquement, via Clauses Contractuelles Types (CCT 2021).{" "}
                  <Link
                    to="/rgpd"
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                  >
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
                    href="mailto:rgpd@axiom-talents.com?subject=Demande%20de%20rectification%20-%20RGPD&body=Bonjour%2C%20je%20souhaite%20exercer%20mon%20droit%20de%20rectification."
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
                  <Trash2 className="h-5 w-5 text-destructive" /> Demande de
                  suppression de compte
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    Vous allez envoyer une demande de suppression de votre compte
                    et de l'ensemble de vos données personnelles à notre DPO.
                  </span>
                  <span className="block text-foreground/80 font-medium">
                    Conformément au RGPD, votre demande sera traitée sous 30
                    jours.
                  </span>
                  <span className="block">
                    Un email de confirmation sera envoyé à votre adresse :{" "}
                    <strong>{profile?.email}</strong>
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

function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">
        {value || (
          <span className="italic text-muted-foreground">Non renseigné</span>
        )}
      </p>
    </div>
  );
}
