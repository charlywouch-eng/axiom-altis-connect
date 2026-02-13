import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Briefcase, Users, Plus, TrendingUp, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function StatCard({ icon: Icon, title, value }: { icon: any; title: string; value: string }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

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
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    salary: "",
    location: "",
    skills: "",
  });

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

  const createOffer = useMutation({
    mutationFn: async () => {
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const { error } = await supabase.from("job_offers").insert({
        title: form.title,
        description: form.description,
        salary_range: form.salary || null,
        location: form.location,
        required_skills: skills,
        company_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_offers"] });
      toast({ title: "Offre publiée", description: `"${form.title}" est maintenant en ligne.` });
      setForm({ title: "", description: "", salary: "", location: "", skills: "" });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
    onSettled: () => setSubmitting(false),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const title = form.title.trim();
    const description = form.description.trim();
    const location = form.location.trim();
    const salary = form.salary.trim();

    if (!title) errors.title = "Le titre est requis.";
    else if (title.length > 200) errors.title = "Le titre ne doit pas dépasser 200 caractères.";

    if (!description) errors.description = "La description est requise.";
    else if (description.length > 5000) errors.description = "La description ne doit pas dépasser 5000 caractères.";

    if (!location) errors.location = "La localisation est requise.";
    else if (location.length > 100) errors.location = "La localisation ne doit pas dépasser 100 caractères.";

    if (salary && salary.length > 50) errors.salary = "Le salaire ne doit pas dépasser 50 caractères.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    createOffer.mutate();
  };

  const activeCount = offers.filter((o) => o.status === "open").length;

  return (
    <DashboardLayout sidebarVariant="entreprise">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Espace Entreprise</h2>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Publier une offre
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={Briefcase} title="Offres actives" value={String(activeCount)} />
          <StatCard icon={Users} title="Talents en cours" value={String(Math.floor(activeCount * 2.3))} />
          <StatCard icon={TrendingUp} title="Installés" value="0" />
        </div>

        {/* Offers table */}
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
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal nouvelle offre */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Publier une nouvelle offre</DialogTitle>
            <DialogDescription>Décrivez le poste que vous souhaitez pourvoir.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du poste</Label>
              <Input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Ex: Développeur Full-Stack" maxLength={200} />
              {formErrors.title && <p className="text-sm text-destructive">{formErrors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Missions, contexte…" rows={3} maxLength={5000} />
              {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Salaire (€/an)</Label>
                <Input id="salary" name="salary" value={form.salary} onChange={handleChange} placeholder="45 000" maxLength={50} />
                {formErrors.salary && <p className="text-sm text-destructive">{formErrors.salary}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="Paris" maxLength={100} />
                {formErrors.location && <p className="text-sm text-destructive">{formErrors.location}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Compétences clés (séparées par des virgules)</Label>
              <Input id="skills" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, SQL…" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={submitting}>
                {submitting ? "Publication…" : "Publier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
