import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Users,
  Plus,
  TrendingUp,
  Eye,
  Trash2,
  Pencil,
  ShieldCheck,
  Zap,
  Award,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Globe,
  FileText,
  Handshake,
  Plane,
  DollarSign,
  Crown,
  Sparkles,
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { OfferFormDialog, type OfferFormData } from "@/components/OfferFormDialog";
import { PremiumStatCard } from "@/components/PremiumStatCard";
import { RecruitmentPipeline } from "@/components/RecruitmentPipeline";
import { motion } from "framer-motion";
import VerifiedTalentsTab from "@/components/dashboard/VerifiedTalentsTab";
import { CandidateMatchCard } from "@/components/dashboard/CandidateMatchCard";
import {
  MOCK_OFFERS,
  MOCK_CANDIDATES,
  computeComplianceScore,
  type MockOffer,
} from "@/data/dashboardMockData";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  open: { label: "Ouverte", variant: "default" },
  closed: { label: "Fermée", variant: "secondary" },
  filled: { label: "Pourvue", variant: "destructive" },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function DashboardEntreprise() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<{ id: string; data: OfferFormData } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Show toast on subscription success/cancel
  useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      toast({ title: "🎉 Abonnement Premium activé !", description: "Vous avez désormais accès à toutes les fonctionnalités Premium." });
    } else if (searchParams.get("subscription") === "canceled") {
      toast({ title: "Abonnement annulé", description: "Vous pouvez souscrire à tout moment.", variant: "destructive" });
    }
  }, [searchParams, toast]);

  // Check subscription status
  const { data: subscriptionData } = useQuery({
    queryKey: ["enterprise_subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      return data as { subscribed: boolean; product_id: string | null; subscription_end: string | null };
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  const isPremium = subscriptionData?.subscribed ?? false;

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-entreprise");
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Info", description: data.error });
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de démarrer le paiement.", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Company profile
  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_profiles")
        .select("company_name, logo_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Real offers from DB
  const { data: dbOffers = [], isLoading } = useQuery({
    queryKey: ["job_offers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .eq("company_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Merge real + mock offers for display
  const allOffers: MockOffer[] = useMemo(() => {
    const realMapped: MockOffer[] = dbOffers.map((o) => ({
      id: o.id,
      title: o.title,
      secteur: "",
      codeRome: "",
      location: o.location,
      salary: o.salary_range ?? "",
      description: o.description,
      skills: o.required_skills ?? [],
      status: (o.status as "open" | "closed" | "filled") ?? "open",
      applicantsCount: 0,
      createdAt: o.created_at,
    }));
    return [...realMapped, ...MOCK_OFFERS];
  }, [dbOffers]);

  // Matched candidates based on selected offer
  const matchedCandidates = useMemo(() => {
    const offer = allOffers.find((o) => o.id === selectedOfferId);
    return MOCK_CANDIDATES.map((c) => ({
      ...c,
      score: computeComplianceScore(c, offer?.codeRome),
    }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [selectedOfferId, allOffers]);

  // DB mutations
  const createMutation = useMutation({
    mutationFn: async (form: OfferFormData) => {
      const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const { error } = await supabase.from("job_offers").insert({
        title: form.title.trim(),
        description: form.description.trim(),
        salary_range: form.salary.trim() || null,
        location: form.location.trim(),
        required_skills: skills,
        company_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, form) => {
      queryClient.invalidateQueries({ queryKey: ["job_offers"] });
      toast({ title: "✅ Offre publiée", description: `"${form.title}" est maintenant en ligne.` });
      setCreateOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
    onSettled: () => setSubmitting(false),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: OfferFormData }) => {
      const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const { error } = await supabase
        .from("job_offers")
        .update({
          title: form.title.trim(),
          description: form.description.trim(),
          salary_range: form.salary.trim() || null,
          location: form.location.trim(),
          required_skills: skills,
        })
        .eq("id", id)
        .eq("company_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_offers"] });
      toast({ title: "Offre modifiée", description: "Les modifications ont été enregistrées." });
      setEditOffer(null);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
    onSettled: () => setSubmitting(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_offers").delete().eq("id", id).eq("company_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_offers"] });
      toast({ title: "Offre supprimée" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = (form: OfferFormData) => { setSubmitting(true); createMutation.mutate(form); };
  const handleEdit = (form: OfferFormData) => {
    if (!editOffer) return;
    setSubmitting(true);
    updateMutation.mutate({ id: editOffer.id, form });
  };

  const openEditDialog = (offer: (typeof dbOffers)[number]) => {
    setEditOffer({
      id: offer.id,
      data: {
        title: offer.title,
        description: offer.description,
        salary: offer.salary_range ?? "",
        location: offer.location,
        skills: (offer.required_skills ?? []).join(", "),
        secteur: "",
        codeRome: "",
      },
    });
  };

  const activeCount = allOffers.filter((o) => o.status === "open").length;
  const certifiedCount = MOCK_CANDIDATES.filter((c) => c.certifiedMinefop || c.certifiedMinrex).length;

  const handleContact = (candidateId: string) => {
    const c = MOCK_CANDIDATES.find((x) => x.id === candidateId);
    toast({
      title: "📩 Demande envoyée",
      description: `Votre demande de contact pour ${c?.name ?? "ce talent"} a été transmise à l'équipe AXIOM.`,
    });
  };

  return (
    <DashboardLayout sidebarVariant="entreprise">
      <div className="space-y-8 pb-16">
        {/* ── Hero B2B Banner ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative overflow-hidden rounded-2xl text-white shadow-premium" style={{ background: "linear-gradient(135deg, hsl(222 47% 8%) 0%, hsl(221 83% 25%) 55%, hsl(189 94% 28%) 100%)" }}>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
            <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-[hsl(189,94%,43%)]/15 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[hsl(221,83%,38%)]/25 blur-2xl" />
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {companyProfile?.logo_url ? (
                      <img src={companyProfile.logo_url} alt="Logo" className="h-10 w-10 rounded-xl object-cover border border-white/20" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-white/70" />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">AXIOM TIaaS · Espace Entreprise</span>
                      {companyProfile?.company_name && (
                        <p className="text-sm font-semibold text-white/90">{companyProfile.company_name}</p>
                      )}
                    </div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-2">
                    Recrutez des talents certifiés Cameroun —{" "}
                    <span className="text-gradient-accent">Opérationnels jour 1</span>
                  </h1>
                  <p className="text-sm text-white/60 max-w-lg">
                    Matching IA prédictif · Diplômes apostillés MINEFOP/MINREX · Visa + logement ALTIS inclus
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      className="bg-white text-[hsl(222,47%,11%)] hover:bg-white/90 font-bold gap-1.5 shadow-lg"
                      onClick={() => setCreateOpen(true)}
                    >
                      <Zap className="h-3.5 w-3.5" /> Tester 3 profils gratuits
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold gap-1.5" onClick={() => setCreateOpen(true)}>
                      <Plus className="h-3.5 w-3.5" /> Publier une offre
                    </Button>
                  </div>
                </div>
                {/* Right: quick stats */}
                <div className="flex flex-row sm:flex-col gap-3 sm:gap-2 shrink-0">
                  {[
                    { val: String(activeCount), lbl: "Offres actives", color: "text-[hsl(189,94%,43%)]" },
                    { val: String(MOCK_CANDIDATES.length), lbl: "Talents dispo", color: "text-white" },
                    { val: String(certifiedCount), lbl: "Certifiés", color: "text-[hsl(158,64%,42%)]" },
                  ].map(({ val, lbl, color }) => (
                    <div key={lbl} className="text-center sm:text-right px-3 py-2 rounded-xl bg-white/5 border border-white/8">
                      <p className={`text-xl font-extrabold ${color}`}>{val}</p>
                      <p className="text-[10px] text-white/45 font-medium">{lbl}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <Tabs defaultValue="offres" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap gap-1">
            <TabsTrigger value="offres" className="gap-2 data-[state=active]:bg-card text-sm">
              <Briefcase className="h-4 w-4" /> Mes offres
            </TabsTrigger>
            <TabsTrigger value="matching" className="gap-2 data-[state=active]:bg-card text-sm">
              <Zap className="h-4 w-4" /> Matching IA
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2 data-[state=active]:bg-card text-sm">
              <BarChart3 className="h-4 w-4" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2 data-[state=active]:bg-card text-sm">
              <DollarSign className="h-4 w-4" /> Tarification
            </TabsTrigger>
            <TabsTrigger value="talents" className="gap-2 data-[state=active]:bg-card text-sm">
              <ShieldCheck className="h-4 w-4" /> Talents vérifiés
            </TabsTrigger>
          </TabsList>

          {/* ──── Onglet Offres ──────────────────────────────────── */}
          <TabsContent value="offres" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="font-display text-lg">Offres actives</CardTitle>
                <Badge variant="secondary" className="font-semibold">
                  {allOffers.filter((o) => o.status === "open").length} ouvertes
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 text-sm text-muted-foreground">Chargement…</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-semibold">Poste</TableHead>
                          <TableHead className="font-semibold hidden sm:table-cell">Localisation</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">Salaire</TableHead>
                          <TableHead className="font-semibold hidden lg:table-cell">Date</TableHead>
                          <TableHead className="font-semibold">Statut</TableHead>
                          <TableHead className="font-semibold text-right hidden sm:table-cell">Candidats</TableHead>
                          <TableHead className="w-[100px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allOffers.map((offer, i) => {
                          const s = statusLabels[offer.status] ?? statusLabels.open;
                          const isSelected = selectedOfferId === offer.id;
                          return (
                            <TableRow
                              key={offer.id}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary/5 border-l-2 border-primary"
                                  : "hover:bg-muted/40"
                              }`}
                              onClick={() =>
                                setSelectedOfferId(isSelected ? null : offer.id)
                              }
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{offer.title}</p>
                                  {offer.codeRome && (
                                    <p className="text-xs text-muted-foreground">ROME {offer.codeRome}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                                {offer.location}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                                {offer.salary ? `${offer.salary} €/an` : "—"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                                {format(new Date(offer.createdAt), "dd MMM yyyy", { locale: fr })}
                              </TableCell>
                              <TableCell>
                                <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium hidden sm:table-cell">
                                {offer.applicantsCount}
                              </TableCell>
                              <TableCell>
                                <div
                                  className="flex gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label="Voir l'offre"
                                    onClick={() => navigate(`/dashboard-entreprise/offres/${offer.id}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {/* Edit/Delete only for real DB offers */}
                                  {dbOffers.find((o) => o.id === offer.id) && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        aria-label="Modifier l'offre"
                                        onClick={() => {
                                          const o = dbOffers.find((x) => x.id === offer.id)!;
                                          openEditDialog(o);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        aria-label="Supprimer l'offre"
                                        onClick={() => setDeleteId(offer.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedOfferId && (
              <motion.div
                key={selectedOfferId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold">Candidats matchés</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Scoring prédictif AXIOM · Score = ROME×skills (70%) + Origine Afrique (20%) + Certification (10%)
                    </p>
                  </div>
                  <Badge className="bg-accent/15 text-accent border border-accent/30 text-xs font-semibold">
                    {matchedCandidates.length} profils
                  </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {matchedCandidates.map((candidate, i) => (
                    <CandidateMatchCard
                      key={candidate.id}
                      candidate={candidate}
                      index={i}
                      onContact={handleContact}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* ──── Onglet Matching IA ─────────────────────────────── */}
          <TabsContent value="matching" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Matching IA – Tous les talents</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {MOCK_CANDIDATES.length} talents Cameroun disponibles, triés par score de conformité
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {MOCK_CANDIDATES.sort((a, b) => b.score - a.score).map((candidate, i) => (
                <CandidateMatchCard
                  key={candidate.id}
                  candidate={candidate}
                  index={i}
                  onContact={handleContact}
                />
              ))}
            </div>
          </TabsContent>

          {/* ──── Onglet Pipeline ────────────────────────────────── */}
          <TabsContent value="pipeline">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <RecruitmentPipeline />

              {/* Recruitment Timeline */}
              <Card className="mt-6 overflow-hidden border-primary/20">
                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, hsl(221 83% 38%), hsl(189 94% 43%))" }} />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Parcours recrutement AXIOM × ALTIS
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">4 étapes clés de la publication à l'intégration</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { step: 1, icon: FileText, label: "Poste & Offre", desc: "Publiez votre besoin avec code ROME et compétences requises", color: "text-primary", bg: "bg-primary/10 border-primary/25" },
                      { step: 2, icon: Zap, label: "Matching IA", desc: "Algorithme AXIOM identifie les talents Cameroun compatibles (score >70 %)", color: "text-accent", bg: "bg-accent/10 border-accent/25" },
                      { step: 3, icon: Handshake, label: "Signature", desc: "Promesse d'embauche + validation MINEFOP/MINREX", color: "text-success", bg: "bg-success/10 border-success/25" },
                      { step: 4, icon: Plane, label: "ALTIS Activation", desc: "Visa ANEF + billet + logement meublé — Talent opérationnel J+1", color: "text-[hsl(189,94%,43%)]", bg: "bg-accent/10 border-accent/25" },
                    ].map(({ step, icon: Icon, label, desc, color, bg }, i) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.4 }}
                        className={`relative rounded-xl border p-4 ${bg} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${bg}`}>
                            <Icon className={`h-3.5 w-3.5 ${color}`} />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground">ÉTAPE {step}</span>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1">{label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                        {i < 3 && <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 z-10" />}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ──── Onglet Tarification ─────────────────────────────── */}
          <TabsContent value="pricing">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="overflow-hidden border-primary/20">
                <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, hsl(221 83% 38%), hsl(189 94% 43%))" }} />
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Tarification transparente
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Choisissez la formule adaptée à vos besoins de recrutement</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-bold text-foreground">Formule</TableHead>
                          <TableHead className="font-bold text-foreground">Prix</TableHead>
                          <TableHead className="font-bold text-foreground hidden sm:table-cell">Profils inclus</TableHead>
                          <TableHead className="font-bold text-foreground hidden md:table-cell">Avantages</TableHead>
                          <TableHead className="font-bold text-foreground text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { name: "Découverte", price: "Gratuit", profiles: "3 profils", features: "Accès matching IA · Score compatibilité · Aperçu CV", cta: "Actif", highlight: false, badge: null },
                          { name: "Premium", price: "399 €/mois", profiles: "Illimité", features: "Matching avancé · Filtres ROME · Contacts directs · Support prioritaire", cta: "Souscrire", highlight: true, badge: "Recommandé" },
                          { name: "Success Fee", price: "25 % du brut annuel", profiles: "À la demande", features: "Paiement au résultat · Garantie remplacement 3 mois", cta: "Contacter", highlight: false, badge: null },
                          { name: "ALTIS Intégral", price: "1 200 €/talent", profiles: "Par talent", features: "Visa + billet + logement meublé 3 mois · Formation normes FR incluse", cta: "En savoir +", highlight: false, badge: "Pack complet" },
                        ].map(({ name, price, profiles, features, cta, highlight, badge }) => (
                          <TableRow key={name} className={highlight ? "bg-primary/5 border-l-2 border-primary" : ""}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">{name}</span>
                                {badge && <Badge className="text-[9px] px-1.5 py-0 bg-accent/10 text-accent border-accent/30 font-bold">{badge}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-foreground text-sm">{price}</TableCell>
                            <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{profiles}</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-xs">{features}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={highlight ? "default" : "outline"}
                                className={highlight ? "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20" : "text-xs font-semibold"}
                                onClick={() => {
                                  if (cta === "Actif") return;
                                  if (name === "Premium") {
                                    if (isPremium) {
                                      toast({ title: "✅ Déjà abonné", description: "Votre abonnement Premium est actif." });
                                    } else {
                                      handleCheckout();
                                    }
                                    return;
                                  }
                                  toast({ title: "📩 Demande envoyée", description: `Notre équipe commerciale vous contactera pour la formule ${name}.` });
                                }}
                                disabled={cta === "Actif" || (name === "Premium" && checkoutLoading)}
                              >
                                {name === "Premium" && isPremium ? (
                                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Actif</>
                                ) : name === "Premium" && checkoutLoading ? (
                                  "Redirection…"
                                ) : cta === "Actif" ? (
                                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Actif</>
                                ) : (
                                  cta
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-accent" /> Besoin d'un devis sur mesure ?
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Contactez notre équipe pour les recrutements en volume (&gt;10 talents)</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 font-semibold shrink-0">
                      Contacter <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ──── Onglet Talents vérifiés ────────────────────────── */}
          <TabsContent value="talents">
            <VerifiedTalentsTab />
          </TabsContent>
        </Tabs>

        {/* ── Footer dashboard ───────────────────────────────────── */}
        <motion.footer
          className="mt-8 border-t border-border/40 pt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">AXIOM</span> – Souveraineté des données & matching prédictif
            {" · "}
            <span className="font-semibold text-primary">ALTIS</span> – Excellence logistique hospitality
          </p>
        </motion.footer>
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────── */}
      <OfferFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        submitting={submitting}
      />
      <OfferFormDialog
        open={!!editOffer}
        onOpenChange={(v) => !v && setEditOffer(null)}
        onSubmit={handleEdit}
        submitting={submitting}
        initialData={editOffer?.data}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'offre sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteMutation.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
