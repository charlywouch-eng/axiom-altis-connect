import { useState, useMemo, useEffect } from "react";
import { trackGA4 } from "@/lib/ga4";
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
  Info,
  Filter,
  Building2,
  Mail,
  Hash,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import heroTechNetwork from "@/assets/hero-tech-network.jpg";
import heroTechNetworkWebp from "@/assets/hero-tech-network.jpg?format=webp";
import { OptimizedImage } from "@/components/OptimizedImage";
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

// 5 mock certified talents for matching display
const CERTIFIED_TALENTS = [
  { id: "ct1", name: "Jean-Pierre Mbarga", rome: "F1703", romeLabel: "Maçon", score: 92, salary: "28 000 €/an", country: "Cameroun", minefop: true, skills: ["Coffrage", "Béton armé", "Normes DTU"] },
  { id: "ct2", name: "Yvette Nkoulou", rome: "J1301", romeLabel: "Aide-soignante", score: 88, salary: "24 500 €/an", country: "Cameroun", minefop: true, skills: ["Soins", "Hygiène", "Accompagnement"] },
  { id: "ct3", name: "Paul Essomba", rome: "N1103", romeLabel: "Chauffeur PL", score: 85, salary: "26 000 €/an", country: "Cameroun", minefop: true, skills: ["Permis C", "FIMO", "ADR"] },
  { id: "ct4", name: "Marie-Claire Atangana", rome: "G1603", romeLabel: "Réceptionniste", score: 79, salary: "23 000 €/an", country: "Cameroun", minefop: true, skills: ["Accueil", "Anglais B2", "PMS Opera"] },
  { id: "ct5", name: "Samuel Fotso", rome: "I1304", romeLabel: "Technicien maintenance", score: 91, salary: "30 000 €/an", country: "Cameroun", minefop: true, skills: ["Électromécanique", "GMAO", "Habilitation BR"] },
];

const ROME_FILTER_OPTIONS = [
  { value: "all", label: "Tous les métiers" },
  { value: "F1703", label: "Maçon (F1703)" },
  { value: "J1301", label: "Aide-soignante (J1301)" },
  { value: "N1103", label: "Chauffeur PL (N1103)" },
  { value: "G1603", label: "Réceptionniste (G1603)" },
  { value: "I1304", label: "Tech. maintenance (I1304)" },
];

export default function DashboardEntreprise() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => { trackGA4("dashboard_entreprise_view"); }, []);
  const [editOffer, setEditOffer] = useState<{ id: string; data: OfferFormData } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [romeFilter, setRomeFilter] = useState("all");
  const [minScoreFilter, setMinScoreFilter] = useState(true);
  const [minefopFilter, setMinefopFilter] = useState(false);
  const [recruitFormOpen, setRecruitFormOpen] = useState(false);
  const [recruitForm, setRecruitForm] = useState({ company: "", email: "", sector: "", volume: "" });
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ company: "", sector: "", volume: "", message: "" });
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);

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

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Info", description: data.error });
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible d'ouvrir le portail.", variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleQuoteSubmit = async () => {
    if (!quoteForm.company || !quoteForm.sector) {
      toast({ title: "Champs requis", description: "Veuillez remplir le nom d'entreprise et le secteur.", variant: "destructive" });
      return;
    }
    setQuoteSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-quote-request", {
        body: quoteForm,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "✅ Demande envoyée", description: "Notre équipe commerciale vous contactera sous 24h avec un devis personnalisé." });
      setQuoteDialogOpen(false);
      setQuoteForm({ company: "", sector: "", volume: "", message: "" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible d'envoyer la demande.", variant: "destructive" });
    } finally {
      setQuoteSubmitting(false);
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
          <div className="relative overflow-hidden rounded-2xl text-white shadow-premium">
            {/* Tech network background */}
            <div className="absolute inset-0">
              <OptimizedImage webpSrc={heroTechNetworkWebp} fallbackSrc={heroTechNetwork} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-[hsl(222,47%,6%)]/80" />
            </div>
            <div className="absolute inset-0 opacity-[0.04] bg-hero-dots" />
            <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-accent/15 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/25 blur-2xl" />
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
                    Recrutez des talents d'Afrique certifiés –{" "}
                    <span className="text-gradient-accent">Opérationnels jour 1</span>
                  </h1>
                  <p className="text-sm text-white/60 max-w-lg">
                    Matching IA + conformité ROME + Pack ALTIS Zéro Stress (visa + billet + logement) · À partir de 499 €/mois
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      className="bg-white text-[hsl(222,47%,11%)] hover:bg-white/90 font-bold gap-1.5 shadow-lg"
                      onClick={() => setCreateOpen(true)}
                    >
                      <Zap className="h-3.5 w-3.5" /> Tester 3 profils gratuits
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold gap-1.5" onClick={() => setRecruitFormOpen(true)}>
                       <Sparkles className="h-3.5 w-3.5" /> Demander démo
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
        <Tabs value={searchParams.get("tab") || "offres"} onValueChange={(v) => navigate(`/dashboard-entreprise?tab=${v}`, { replace: true })} className="space-y-6">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Matching IA – Talents certifiés</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Filtrez par code ROME, score et certification MINEFOP
                </p>
              </div>
              <Badge className="bg-accent/15 text-accent border border-accent/30 text-xs font-semibold shrink-0">
                <Filter className="h-3 w-3 mr-1" /> {CERTIFIED_TALENTS.filter(t => {
                  if (romeFilter !== "all" && t.rome !== romeFilter) return false;
                  if (minScoreFilter && t.score < 70) return false;
                  if (minefopFilter && !t.minefop) return false;
                  return true;
                }).length} profils
              </Badge>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={romeFilter} onValueChange={setRomeFilter}>
                <SelectTrigger className="w-[200px] h-9 text-sm">
                  <SelectValue placeholder="Filtrer par ROME" />
                </SelectTrigger>
                <SelectContent>
                  {ROME_FILTER_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={minScoreFilter} onChange={e => setMinScoreFilter(e.target.checked)} className="rounded border-input" />
                Score &gt; 70 %
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={minefopFilter} onChange={e => setMinefopFilter(e.target.checked)} className="rounded border-input" />
                MINEFOP certifié
              </label>
            </div>

            {/* Certified talent cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {CERTIFIED_TALENTS
                .filter(t => {
                  if (romeFilter !== "all" && t.rome !== romeFilter) return false;
                  if (minScoreFilter && t.score < 70) return false;
                  if (minefopFilter && !t.minefop) return false;
                  return true;
                })
                .map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/60 group">
                    <div className="h-1 bg-gradient-cta" />
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {t.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{t.name}</p>
                            <p className="text-[10px] text-muted-foreground">{t.country}</p>
                          </div>
                        </div>
                        <Badge className="bg-success/15 text-success border-success/30 text-[9px] font-bold px-1.5">
                          <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> CERTIFIÉ
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{t.romeLabel}</p>
                          <p className="text-[10px] text-muted-foreground">ROME {t.rome}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black ${t.score >= 85 ? "text-success" : t.score >= 70 ? "text-accent" : "text-muted-foreground"}`}>{t.score}%</p>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${t.score >= 85 ? "bg-success" : "bg-accent"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${t.score}%` }}
                          transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{t.salary}</p>
                      <div className="flex flex-wrap gap-1">
                        {t.skills.map(s => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{s}</span>
                        ))}
                      </div>
                      <Button size="sm" className="w-full text-xs font-semibold" onClick={() => handleContact(t.id)}>
                        Contacter
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* ──── Onglet Pipeline ────────────────────────────────── */}
          <TabsContent value="pipeline">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <RecruitmentPipeline />

              {/* Recruitment Timeline */}
              <Card className="mt-6 overflow-hidden border-primary/20">
                <div className="h-1 w-full bg-gradient-cta" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Parcours recrutement AXIOM × ALTIS
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">6 étapes clés de la publication à l'intégration</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                    {[
                      { step: 1, icon: FileText, label: "Poste offre", desc: "Publiez votre besoin avec code ROME", color: "text-primary", bg: "bg-primary/10 border-primary/25" },
                      { step: 2, icon: Zap, label: "Matching IA", desc: "Algorithme AXIOM identifie les talents compatibles", color: "text-accent", bg: "bg-accent/10 border-accent/25" },
                      { step: 3, icon: Users, label: "Entretien", desc: "Shortlist de candidats · Entretiens vidéo", color: "text-[hsl(45,93%,47%)]", bg: "bg-[hsl(45,93%,47%)]/10 border-[hsl(45,93%,47%)]/25" },
                      { step: 4, icon: Handshake, label: "Signature", desc: "Promesse d'embauche + validation MINEFOP", color: "text-success", bg: "bg-success/10 border-success/25" },
                      { step: 5, icon: Plane, label: "ALTIS activation", desc: "Visa ANEF + billet + logement meublé", color: "text-[hsl(189,94%,43%)]", bg: "bg-accent/10 border-accent/25" },
                      { step: 6, icon: CheckCircle2, label: "Talent en poste", desc: "Opérationnel J+1 — suivi 3 mois", color: "text-primary", bg: "bg-primary/10 border-primary/25" },
                    ].map(({ step, icon: Icon, label, desc, color, bg }, i) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                        className={`relative rounded-xl border p-3 ${bg} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${bg}`}>
                            <Icon className={`h-3 w-3 ${color}`} />
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground">ÉTAPE {step}</span>
                        </div>
                        <p className="text-xs font-bold text-foreground mb-0.5">{label}</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
                        {i < 5 && <ArrowRight className="hidden xl:block absolute -right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 z-10" />}
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
                <div className="h-1 w-full bg-gradient-cta" />
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
                      <TooltipProvider>
                        <TableBody>
                          {[
                            { name: "Découverte", price: "Gratuit", profiles: "3 profils", features: "Accès limité 3 profils · Matching IA · Score compatibilité", cta: "Actif", highlight: false, badge: null, tooltip: "Idéal pour tester la plateforme sans engagement – accès limité à 3 profils" },
                            { name: "Abonnement SaaS Premium", price: "499 €/mois", profiles: "Illimité", features: "Accès illimité base talents vérifiés · Priorité matching · Dashboard complet · Support prioritaire", cta: "Souscrire", highlight: true, badge: "Recommandé", tooltip: "Accès illimité à des profils certifiés MINEFOP/MINREX – opérationnels jour 1" },
                            { name: "Success Fee", price: "25 % du brut annuel", profiles: "À la demande", features: "Paiement au résultat · Facturé à signature CDI · Garantie remplacement 3 mois", cta: "Contacter", highlight: false, badge: null, tooltip: "25 % du salaire brut annuel – facturé uniquement à la signature" },
                            { name: "Pack ALTIS", price: "2 450 €/talent", profiles: "Par talent", features: "Visa ANEF + billet A/R + accueil aéroport + logement meublé 1 mois + accompagnement administratif", cta: "En savoir +", highlight: false, badge: "Pack complet", tooltip: "2 450 €/talent – visa ANEF + billet A/R + accueil aéroport + logement meublé 1 mois + accompagnement administratif (réduction risque onboarding 80 %)" },
                          ].map(({ name, price, profiles, features, cta, highlight, badge, tooltip }) => (
                            <TableRow key={name} className={highlight ? "bg-primary/5 border-l-2 border-primary" : ""}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-foreground">{name}</span>
                                  {badge && <Badge className="text-[9px] px-1.5 py-0 bg-accent/10 text-accent border-accent/30 font-bold">{badge}</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-bold text-foreground text-sm cursor-help border-b border-dashed border-muted-foreground/30">{price}</span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[200px]">
                                    <p className="text-xs">{tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{profiles}</TableCell>
                              <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-xs">{features}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant={highlight ? "default" : "outline"}
                                  className={highlight ? "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20" : "text-xs font-semibold"}
                                  onClick={() => {
                                    if (cta === "Actif") return;
                                    if (name === "Abonnement SaaS Premium") {
                                      if (isPremium) {
                                        toast({ title: "✅ Déjà abonné", description: "Votre abonnement Premium est actif." });
                                      } else {
                                        handleCheckout();
                                      }
                                      return;
                                    }
                                    if (name === "Success Fee" || name === "Pack ALTIS") {
                                      setQuoteDialogOpen(true);
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
                      </TooltipProvider>
                    </Table>
                  </div>

                  <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-accent" /> Besoin d'un devis sur mesure ?
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Contactez notre équipe pour les recrutements en volume (&gt;10 talents)</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 font-semibold shrink-0" onClick={() => setQuoteDialogOpen(true)}>
                      Contacter <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>

                  {/* ── Gestion abonnement ── */}
                  {isPremium && (
                    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-primary" /> Abonnement Premium actif
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {subscriptionData?.subscription_end
                            ? `Renouvellement le ${format(new Date(subscriptionData.subscription_end), "dd MMM yyyy", { locale: fr })}`
                            : "Gérez votre abonnement, moyen de paiement ou annulation"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 text-primary hover:bg-primary/10 font-semibold shrink-0"
                        onClick={handlePortal}
                        disabled={portalLoading}
                      >
                        {portalLoading ? "Ouverture…" : "Gérer mon abonnement"} <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ──── Onglet Talents vérifiés ────────────────────────── */}
          <TabsContent value="talents">
            <VerifiedTalentsTab />
          </TabsContent>
        </Tabs>

        {/* ── CTA Commencer à recruter ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="h-1 bg-gradient-cta" />
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-foreground mb-1">Prêt à recruter vos premiers talents ?</h2>
                <p className="text-sm text-muted-foreground">Remplissez le formulaire et notre équipe vous contacte sous 24h avec des profils matchés.</p>
              </div>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 shrink-0 gap-2"
                onClick={() => setRecruitFormOpen(true)}
              >
                <Briefcase className="h-4 w-4" /> Commencer à recruter
              </Button>
            </CardContent>
          </Card>
        </motion.div>

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

      {/* ── Formulaire entreprise ── */}
      <Dialog open={recruitFormOpen} onOpenChange={setRecruitFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Commencer à recruter
            </DialogTitle>
            <DialogDescription>
              Décrivez votre besoin et recevez des profils matchés sous 24h.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast({ title: "✅ Demande envoyée", description: "Notre équipe vous contacte sous 24h avec des profils matchés." });
              setRecruitFormOpen(false);
              setRecruitForm({ company: "", email: "", sector: "", volume: "" });
            }}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nom de la société</label>
              <Input placeholder="Ex : BTP France SAS" value={recruitForm.company} onChange={e => setRecruitForm(f => ({ ...f, company: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email professionnel</label>
              <Input type="email" placeholder="rh@entreprise.fr" value={recruitForm.email} onChange={e => setRecruitForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Secteur d'activité</label>
              <Select value={recruitForm.sector} onValueChange={v => setRecruitForm(f => ({ ...f, sector: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un secteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="btp">BTP / Construction</SelectItem>
                  <SelectItem value="sante">Santé / Aide à la personne</SelectItem>
                  <SelectItem value="transport">Transport / Logistique</SelectItem>
                  <SelectItem value="hotellerie">Hôtellerie / Restauration</SelectItem>
                  <SelectItem value="industrie">Industrie / Maintenance</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Volume de talents recherchés</label>
              <Select value={recruitForm.volume} onValueChange={v => setRecruitForm(f => ({ ...f, volume: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Combien de talents ?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3">1 à 3 talents</SelectItem>
                  <SelectItem value="4-10">4 à 10 talents</SelectItem>
                  <SelectItem value="10+">Plus de 10 talents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full font-bold gap-2">
              <ArrowRight className="h-4 w-4" /> Envoyer ma demande
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Quote Request Dialog ── */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-accent" /> Demander un devis
            </DialogTitle>
            <DialogDescription>
              Recevez une proposition personnalisée sous 24h pour le recrutement de talents certifiés.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuoteSubmit();
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="quote-company">Entreprise *</Label>
              <Input
                id="quote-company"
                placeholder="Nom de votre entreprise"
                value={quoteForm.company}
                onChange={(e) => setQuoteForm((f) => ({ ...f, company: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-sector">Secteur d'activité *</Label>
              <Select value={quoteForm.sector} onValueChange={(v) => setQuoteForm((f) => ({ ...f, sector: v }))}>
                <SelectTrigger id="quote-sector">
                  <SelectValue placeholder="Choisir un secteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batiment">Bâtiment & Construction</SelectItem>
                  <SelectItem value="sante">Santé</SelectItem>
                  <SelectItem value="hotellerie">Hôtellerie & Restauration</SelectItem>
                  <SelectItem value="transport">Transport & Logistique</SelectItem>
                  <SelectItem value="maintenance">Maintenance Industrielle</SelectItem>
                  <SelectItem value="commerce">Commerce & Distribution</SelectItem>
                  <SelectItem value="agriculture">Agriculture & Agroalimentaire</SelectItem>
                  <SelectItem value="support">Support Entreprise</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-volume">Nombre de talents souhaités</Label>
              <Select value={quoteForm.volume} onValueChange={(v) => setQuoteForm((f) => ({ ...f, volume: v }))}>
                <SelectTrigger id="quote-volume">
                  <SelectValue placeholder="Combien de talents ?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3">1 à 3 talents</SelectItem>
                  <SelectItem value="4-10">4 à 10 talents</SelectItem>
                  <SelectItem value="10+">Plus de 10 talents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-message">Message (optionnel)</Label>
              <Textarea
                id="quote-message"
                placeholder="Décrivez vos besoins spécifiques…"
                value={quoteForm.message}
                onChange={(e) => setQuoteForm((f) => ({ ...f, message: e.target.value }))}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full font-bold gap-2" disabled={quoteSubmitting}>
              {quoteSubmitting ? "Envoi en cours…" : (
                <>
                  <Mail className="h-4 w-4" /> Envoyer ma demande de devis
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
