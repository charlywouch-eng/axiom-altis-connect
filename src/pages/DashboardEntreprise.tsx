import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
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
        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex items-center gap-4">
            {/* Company logo */}
            {companyProfile?.logo_url ? (
              <img
                src={companyProfile.logo_url}
                alt="Logo entreprise"
                className="h-12 w-12 rounded-xl object-cover border border-border shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-6 w-6 text-primary/50" />
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                {companyProfile?.company_name
                  ? companyProfile.company_name
                  : "Tableau de bord Recruteur"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                AXIOM TIaaS – Talent Intelligence as a Service · Matching prédictif Afrique ↔ France
              </p>
              <p className="mt-0.5 text-xs text-primary/60 flex items-center gap-1.5">
                <span>🔒</span> Traitement RGPD compliant – Données candidats protégées (CCT UE 2021)
              </p>
              {/* CTA profil incomplet */}
              {companyProfile !== undefined && (!companyProfile?.company_name || !companyProfile?.logo_url) && (
                <Link
                  to="/dashboard-entreprise/profil"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 rounded-full px-3 py-1 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Compléter votre profil entreprise →
                </Link>
              )}
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2"
            onClick={() => setCreateOpen(true)}
            aria-label="Publier une nouvelle offre"
          >
            <Plus className="h-4 w-4" />
            Publier une nouvelle offre
          </Button>
        </motion.div>

        {/* ── KPIs ───────────────────────────────────────────────── */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <PremiumStatCard
            icon={Briefcase}
            title="Offres actives"
            value={String(activeCount)}
            accent="blue"
            tensionLevel={activeCount === 0 ? "critical" : activeCount < 3 ? "high" : "low"}
            subtitle="Postes ouverts au recrutement"
          />
          <PremiumStatCard
            icon={Users}
            title="Talents disponibles"
            value={String(MOCK_CANDIDATES.length)}
            accent="green"
            tensionLevel="low"
            subtitle="Cameroun, profils vérifiés"
          />
          <PremiumStatCard
            icon={Award}
            title="Certifiés MINEFOP/MINREX"
            value={String(certifiedCount)}
            accent="blue"
            tensionLevel="medium"
            subtitle="Conformité légale garantie"
          />
          <PremiumStatCard
            icon={TrendingUp}
            title="Talents installés"
            value="0"
            tensionLevel="none"
            subtitle="Recrutés et en poste"
          />
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
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <RecruitmentPipeline />
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
