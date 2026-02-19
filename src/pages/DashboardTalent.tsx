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
import {
  CheckCircle2,
  Circle,
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { PremiumStatCard } from "@/components/PremiumStatCard";
import DiplomaUpload from "@/components/dashboard/DiplomaUpload";

const FRENCH_LEVELS = ["Débutant (A1)", "Élémentaire (A2)", "Intermédiaire (B1)", "Avancé (B2)", "Courant (C1)", "Natif (C2)"];

interface TimelineStep {
  label: string;
  icon: typeof Briefcase;
  status: "done" | "active" | "pending";
}

const MOCK_TIMELINE: TimelineStep[] = [
  { label: "Offre acceptée", icon: Briefcase, status: "done" },
  { label: "Visa en cours", icon: Globe, status: "active" },
  { label: "Billet réservé", icon: Plane, status: "pending" },
  { label: "Logement trouvé", icon: Home, status: "pending" },
  { label: "Formation démarrée", icon: GraduationCap, status: "pending" },
  { label: "En poste", icon: Building2, status: "pending" },
];

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

  // Fetch matching offers for this talent's skills
  const { data: matchingOffers = [] } = useQuery({
    queryKey: ["talent_matching_offers", user?.id, profile?.skills],
    queryFn: async () => {
      const talentSkills = profile?.skills || [];
      if (talentSkills.length === 0) return [];

      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      // Compute compatibility score client-side
      return (data || [])
        .map((offer) => {
          const requiredSkills = offer.required_skills || [];
          if (requiredSkills.length === 0) return { ...offer, score: 30 };
          const matchCount = talentSkills.filter((s) =>
            requiredSkills.some((rs: string) => rs.toLowerCase() === s.toLowerCase())
          ).length;
          const score = Math.round((matchCount / requiredSkills.length) * 100);
          return { ...offer, score };
        })
        .filter((o) => o.score >= 30)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    },
    enabled: !!user && !!profile,
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
        full_name: profile.full_name || "",
        country: profile.country || "",
        french_level: profile.french_level || "",
        skills: profile.skills?.join(", ") || "",
      });
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
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

  const doneSteps = MOCK_TIMELINE.filter((s) => s.status === "done").length;
  const progressPercent = Math.round((doneSteps / MOCK_TIMELINE.length) * 100);

  // Export personal data as JSON
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const [profileRes, diplomasRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).single(),
        supabase.from("diplomas").select("file_name, status, rome_label, created_at").eq("user_id", user!.id),
      ]);
      const exportData = {
        export_date: new Date().toISOString(),
        rgpd_notice: "Export conforme RGPD Art. 20 – Portabilité des données",
        responsable: "AXIOM SAS – rgpd@axiom-talents.com",
        profile: profileRes.data,
        diplomas: diplomasRes.data || [],
      };
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

  // Request account deletion via email
  const handleDeleteRequest = () => {
    setDeleteDialogOpen(false);
    toast({
      title: "Demande envoyée",
      description: "Notre DPO traitera votre demande de suppression sous 30 jours. Un email de confirmation vous sera envoyé.",
    });
  };

  return (
    <DashboardLayout sidebarVariant="talent">
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Mon Espace Talent</h2>
          <p className="text-sm text-muted-foreground mt-1">Suivez votre parcours de mobilité</p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PremiumStatCard
            icon={Briefcase}
            title="Offres disponibles"
            value={String(totalOpenOffers)}
            accent="blue"
            tensionLevel={totalOpenOffers === 0 ? "critical" : totalOpenOffers < 5 ? "medium" : "low"}
            subtitle="Postes ouverts sur la plateforme"
          />
          <PremiumStatCard
            icon={Star}
            title="Offres compatibles"
            value={String(matchingOffers.length)}
            accent="green"
            tensionLevel={matchingOffers.length === 0 ? "high" : matchingOffers.length < 3 ? "medium" : "low"}
            subtitle="Matchées à vos compétences"
          />
          <PremiumStatCard
            icon={TrendingUp}
            title="Progression"
            value={`${progressPercent}%`}
            tensionLevel={progressPercent < 30 ? "medium" : progressPercent < 70 ? "low" : "low"}
            tensionLabel={progressPercent < 30 ? "À démarrer" : progressPercent < 70 ? "En cours" : "Avancé"}
            subtitle="Parcours de relocation"
          />
        </div>

        {/* Matching Offers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" /> Offres recommandées pour vous
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Basées sur vos compétences : {profile?.skills?.join(", ") || "Non renseignées"}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {matchingOffers.length > 0 ? (
              matchingOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center gap-4 rounded-xl border border-border/50 p-4 transition-all hover:bg-muted/30 hover:shadow-sm"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-xl font-bold ${
                      offer.score >= 80 ? "text-accent" : offer.score >= 50 ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {offer.score}%
                    </span>
                    <Progress value={offer.score} className="h-1.5 w-10" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{offer.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{offer.location}</span>
                      {offer.salary_range && (
                        <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{offer.salary_range} €</span>
                      )}
                    </div>
                    {offer.required_skills && offer.required_skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {offer.required_skills.map((sk: string) => {
                          const isMatch = profile?.skills?.some(
                            (s) => s.toLowerCase() === sk.toLowerCase()
                          );
                          return (
                            <Badge
                              key={sk}
                              variant={isMatch ? "default" : "outline"}
                              className={isMatch ? "bg-accent text-accent-foreground text-xs" : "text-xs"}
                            >
                              {sk}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Voir
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {profile?.skills && profile.skills.length > 0
                  ? "Aucune offre compatible pour le moment. De nouvelles offres arrivent régulièrement !"
                  : "Complétez votre profil avec vos compétences pour voir les offres compatibles."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Profile card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-accent" /> Mon profil
            </CardTitle>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Mettre à jour mon profil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
                <Button
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
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
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : editing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom complet</Label>
                  <Input id="full_name" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays d'origine</Label>
                  <Input id="country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} placeholder="Sénégal" />
                </div>
                <div className="space-y-2">
                  <Label>Niveau de français</Label>
                  <Select value={form.french_level} onValueChange={(v) => setForm((p) => ({ ...p, french_level: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {FRENCH_LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
                  <Input id="skills" value={form.skills} onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))} placeholder="React, Python, Gestion de projet…" />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField label="Nom" value={profile?.full_name} />
                <ProfileField label="Email" value={profile?.email} />
                <ProfileField label="Pays d'origine" value={profile?.country} />
                <ProfileField label="Niveau de français" value={profile?.french_level} />
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Compétences</p>
                  {profile?.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((s: string) => (
                        <Badge key={s} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Non renseigné</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diploma Upload */}
        <DiplomaUpload />

        {/* ── Mes droits RGPD ───────────────────────────────────── */}
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
            {/* Rights grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: Eye, label: "Droit d'accès", desc: "Consultez toutes vos données stockées." },
                { icon: RefreshCw, label: "Droit de rectification", desc: "Modifiez votre profil à tout moment." },
                { icon: Trash2, label: "Droit à l'effacement", desc: "Demandez la suppression de votre compte." },
                { icon: Ban, label: "Droit d'opposition", desc: "Opposez-vous au traitement de vos données." },
                { icon: Download, label: "Droit à la portabilité", desc: "Exportez vos données en format JSON." },
                { icon: Lock, label: "Droit à la limitation", desc: "Limitez le traitement en contactant le DPO." },
              ].map(({ icon: RIcon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-3">
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

            {/* Info block */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Responsable du traitement :</span> AXIOM SAS, Paris, France.{" "}
              <span className="font-medium text-foreground">Conservation :</span> 24 mois maximum.{" "}
              <span className="font-medium text-foreground">Transferts :</span> UE uniquement, via Clauses Contractuelles Types (CCT 2021).{" "}
              <Link to="/rgpd" className="text-primary hover:underline font-medium" target="_blank">
                Lire la politique complète →
              </Link>
            </div>

            {/* Action buttons */}
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
              <a href="mailto:rgpd@axiom-talents.com?subject=Demande%20de%20rectification%20-%20RGPD&body=Bonjour%2C%20je%20souhaite%20exercer%20mon%20droit%20de%20rectification." className="flex-1">
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
                  Un email de confirmation sera envoyé à votre adresse : <strong>{profile?.email}</strong>
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

        {/* Relocation timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Mon parcours relocation</CardTitle>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={progressPercent} className="h-2 flex-1" />
              <span className="text-sm font-medium text-muted-foreground">{progressPercent}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-0">
              {MOCK_TIMELINE.map((step, i) => {
                const isLast = i === MOCK_TIMELINE.length - 1;
                return (
                  <div key={step.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          step.status === "done"
                            ? "bg-accent text-accent-foreground"
                            : step.status === "active"
                            ? "border-2 border-accent bg-accent/10 text-accent"
                            : "border-2 border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {step.status === "done" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : step.status === "active" ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 min-h-[2rem] ${
                            step.status === "done" ? "bg-accent" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-6">
                      <p
                        className={`font-medium leading-9 ${
                          step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.status === "active" && (
                        <Badge variant="outline" className="mt-1 text-accent border-accent">
                          En cours
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value || <span className="italic text-muted-foreground">Non renseigné</span>}</p>
    </div>
  );
}
