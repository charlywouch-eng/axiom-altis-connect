import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Briefcase, Users, Plus, TrendingUp, Eye, Trash2, Pencil, ShieldCheck } from "lucide-react";
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

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  open: { label: "Ouverte", variant: "default" },
  closed: { label: "Fermée", variant: "secondary" },
  filled: { label: "Pourvue", variant: "destructive" },
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

  const { data: offers = [], isLoading } = useQuery({
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
      toast({ title: "Offre publiée", description: `"${form.title}" est maintenant en ligne.` });
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

  const handleCreate = (form: OfferFormData) => {
    setSubmitting(true);
    createMutation.mutate(form);
  };

  const handleEdit = (form: OfferFormData) => {
    if (!editOffer) return;
    setSubmitting(true);
    updateMutation.mutate({ id: editOffer.id, form });
  };

  const openEditDialog = (offer: typeof offers[number]) => {
    setEditOffer({
      id: offer.id,
      data: {
        title: offer.title,
        description: offer.description,
        salary: offer.salary_range ?? "",
        location: offer.location,
        skills: (offer.required_skills ?? []).join(", "),
      },
    });
  };

  const activeCount = offers.filter((o) => o.status === "open").length;

  return (
    <DashboardLayout sidebarVariant="entreprise">
      <div className="space-y-6">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h2 className="font-display text-2xl font-bold">Espace Entreprise</h2>
            <p className="text-sm text-muted-foreground mt-1">Gérez vos offres et suivez vos recrutements</p>
          </div>
          <Button className="bg-gradient-to-r from-gold to-ocre text-white hover:opacity-90 border-0 shadow-lg shadow-ocre/20" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Publier une offre
          </Button>
        </motion.div>

        <Tabs defaultValue="offres" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="offres" className="gap-2 data-[state=active]:bg-card">
              <Briefcase className="h-4 w-4" /> Mes offres
            </TabsTrigger>
            <TabsTrigger value="talents" className="gap-2 data-[state=active]:bg-card">
              <ShieldCheck className="h-4 w-4" /> Talents vérifiés
            </TabsTrigger>
          </TabsList>

          <TabsContent value="offres" className="space-y-6">
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.15 } },
              }}
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
                title="Talents en cours"
                value={String(Math.floor(activeCount * 2.3))}
                accent="green"
                tensionLevel={activeCount * 2.3 < 2 ? "medium" : "low"}
                subtitle="Candidats dans le pipeline"
              />
              <PremiumStatCard
                icon={TrendingUp}
                title="Installés"
                value="0"
                tensionLevel="none"
                subtitle="Talents recrutés et en poste"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Mes offres</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Chargement…</p>
                  ) : offers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune offre publiée. Cliquez sur "Publier une offre" pour commencer.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titre</TableHead>
                          <TableHead>Localisation</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Candidats</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offers.map((offer) => {
                          const s = statusLabels[offer.status] ?? statusLabels.open;
                          const fakeCandidates = Math.floor(Math.random() * 8);
                          return (
                            <TableRow
                              key={offer.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/dashboard-entreprise/offres/${offer.id}`)}
                            >
                              <TableCell className="font-medium">{offer.title}</TableCell>
                              <TableCell>{offer.location}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(offer.created_at), "dd MMM yyyy", { locale: fr })}
                              </TableCell>
                              <TableCell>
                                <Badge variant={s.variant}>{s.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right">{fakeCandidates}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); openEditDialog(offer); }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); setDeleteId(offer.id); }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <RecruitmentPipeline />
            </motion.div>
          </TabsContent>

          <TabsContent value="talents">
            <VerifiedTalentsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create dialog */}
      <OfferFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        submitting={submitting}
      />

      {/* Edit dialog */}
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
            <AlertDialogDescription>Cette action est irréversible. L'offre sera définitivement supprimée.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
