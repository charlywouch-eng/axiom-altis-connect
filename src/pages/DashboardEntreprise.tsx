import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Briefcase, Users, Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function DashboardEntreprise() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    salary: "",
    location: "",
    skills: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // MVP: just show toast, no persistence yet
    toast({ title: "Offre créée (MVP)", description: `"${form.title}" a été enregistrée.` });
    setForm({ title: "", description: "", salary: "", location: "", skills: "" });
    setOpen(false);
  };

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
          <StatCard icon={Briefcase} title="Offres actives" value="0" />
          <StatCard icon={Users} title="Talents en cours" value="0" />
          <StatCard icon={TrendingUp} title="Installés" value="0" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bienvenue dans votre espace entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Publiez vos offres et recrutez des talents internationaux. Nous nous occupons du visa, du billet, du logement et de la formation.
            </p>
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
              <Input id="title" name="title" value={form.title} onChange={handleChange} required placeholder="Ex: Développeur Full-Stack" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={form.description} onChange={handleChange} required placeholder="Missions, contexte…" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Salaire (€/an)</Label>
                <Input id="salary" name="salary" value={form.salary} onChange={handleChange} placeholder="45 000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="Paris" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Compétences clés</Label>
              <Input id="skills" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, SQL…" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Publier</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
