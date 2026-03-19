import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Briefcase,
  CalendarDays,
  MapPin,
  RefreshCw,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CandidatureStatus = "en_attente" | "entretien" | "offre_recue" | "recrute" | "refuse" | "autre";

const STATUS_CONFIG: Record<CandidatureStatus, { label: string; color: string; bgClass: string; borderClass: string; icon: typeof Clock }> = {
  en_attente: { label: "En attente", color: "text-muted-foreground", bgClass: "bg-muted/60", borderClass: "border-muted-foreground/20", icon: Clock },
  entretien: { label: "Entretien", color: "text-amber-600 dark:text-amber-400", bgClass: "bg-amber-50 dark:bg-amber-950/30", borderClass: "border-amber-300 dark:border-amber-700", icon: Users },
  offre_recue: { label: "Offre reçue", color: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-50 dark:bg-blue-950/30", borderClass: "border-blue-300 dark:border-blue-700", icon: Sparkles },
  recrute: { label: "Recruté", color: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-50 dark:bg-emerald-950/30", borderClass: "border-emerald-300 dark:border-emerald-700", icon: CheckCircle2 },
  refuse: { label: "Refusé", color: "text-destructive", bgClass: "bg-destructive/5", borderClass: "border-destructive/20", icon: XCircle },
  autre: { label: "Autre", color: "text-muted-foreground", bgClass: "bg-muted/40", borderClass: "border-border", icon: RefreshCw },
};

const STATUS_OPTIONS: { value: CandidatureStatus; label: string }[] = [
  { value: "en_attente", label: "En attente" },
  { value: "entretien", label: "Entretien obtenu" },
  { value: "offre_recue", label: "Offre reçue" },
  { value: "recrute", label: "Recruté" },
  { value: "refuse", label: "Refusé" },
  { value: "autre", label: "Autre" },
];

interface CandidatureHistorySectionProps {
  onPostuler: () => void;
}

export default function CandidatureHistorySection({ onPostuler }: CandidatureHistorySectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedCandidatureId, setSelectedCandidatureId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<CandidatureStatus>("en_attente");

  const { data: candidatures = [], isLoading } = useQuery({
    queryKey: ["candidatures", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidatures")
        .select("*")
        .eq("talent_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("candidatures")
        .update({ status })
        .eq("id", id)
        .eq("talent_user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidatures"] });
      toast({ title: "Statut mis à jour ✅" });
      setStatusDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  // Stats computation
  const stats = {
    total: candidatures.length,
    en_attente: candidatures.filter(c => c.status === "en_attente" || c.status === "submitted").length,
    entretien: candidatures.filter(c => c.status === "entretien").length,
    recrute: candidatures.filter(c => c.status === "recrute").length,
    refuse: candidatures.filter(c => c.status === "refuse").length,
  };

  const statCards = [
    { label: "CVs déposés", value: stats.total, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "En attente", value: stats.en_attente, icon: Clock, color: "text-muted-foreground", bg: "bg-muted/60" },
    { label: "Entretiens", value: stats.entretien, icon: Users, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Recruté", value: stats.recrute, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Refusé", value: stats.refuse, icon: XCircle, color: "text-destructive", bg: "bg-destructive/5" },
  ];

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as CandidatureStatus] ?? STATUS_CONFIG.en_attente;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  // Extract first experience for display
  const getMetier = (c: typeof candidatures[0]) => {
    try {
      const exp = c.experiences as Array<{ poste?: string; entreprise?: string }>;
      if (Array.isArray(exp) && exp.length > 0) return exp[0].poste || "Candidature";
    } catch { /* ignore */ }
    return "Candidature";
  };

  const getEntreprise = (c: typeof candidatures[0]) => {
    try {
      const exp = c.experiences as Array<{ entreprise?: string }>;
      if (Array.isArray(exp) && exp.length > 0) return exp[0].entreprise || "—";
    } catch { /* ignore */ }
    return "—";
  };

  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="space-y-5">
      {/* ── Compteur global ── */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-2 border-primary/30">
          <FileText className="h-3.5 w-3.5 text-primary" />
          CVs déposés : {stats.total}
        </Badge>
        <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold gap-2 border-muted-foreground/30">
          <Clock className="h-3.5 w-3.5" />
          En attente : {stats.en_attente}
        </Badge>
      </motion.div>

      {/* ── 5 Stats Cards ── */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <span className="text-2xl font-extrabold tracking-tight">{stat.value}</span>
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* ── Section Title ── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Mon Historique de Candidatures
        </h2>
        <Button onClick={onPostuler} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Postuler
        </Button>
      </motion.div>

      {/* ── Candidatures Grid ── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : candidatures.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-2 border-border/60">
            <CardContent className="p-8 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center">
                <FileText className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-foreground">Aucune candidature déposée</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Déposez votre premier CV structuré et commencez à recevoir des propositions de recruteurs partenaires.
              </p>
              <Button onClick={onPostuler} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 mt-2">
                <ClipboardList className="h-4 w-4" /> Créer ma candidature
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-2">
          {candidatures.map((c, i) => {
            const statusCfg = getStatusConfig(c.status);
            const StatusIcon = statusCfg.icon;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
              >
                <Card className={`border ${statusCfg.borderClass} hover:shadow-lg transition-all duration-300 group`}>
                  <CardContent className="p-4 space-y-3">
                    {/* Top row: métier + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground text-sm truncate flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                          {getMetier(c)}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {c.city || "Non précisé"} · {c.contract_type || "CDI"}
                        </p>
                      </div>
                      <Badge className={`${statusCfg.bgClass} ${statusCfg.color} border-0 text-[10px] px-2 py-0.5 font-bold gap-1 shrink-0`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </Badge>
                    </div>

                    {/* Entreprise + date */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {getEntreprise(c)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(c.created_at)}
                      </span>
                    </div>

                    {/* Compétences */}
                    {c.competences && c.competences.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.competences.slice(0, 4).map((comp: string) => (
                          <Badge key={comp} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                            {comp}
                          </Badge>
                        ))}
                        {c.competences.length > 4 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                            +{c.competences.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Score + Update button */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {c.compliance_score > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 font-semibold">
                            Score {c.compliance_score}%
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setSelectedCandidatureId(c.id);
                          setNewStatus((c.status as CandidatureStatus) || "en_attente");
                          setStatusDialogOpen(true);
                        }}
                      >
                        <RefreshCw className="h-3 w-3" />
                        Mettre à jour
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Status Update Dialog ── */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Mettre à jour mon statut
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as CandidatureStatus)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={updateStatusMutation.isPending}
              onClick={() => {
                if (selectedCandidatureId) {
                  updateStatusMutation.mutate({ id: selectedCandidatureId, status: newStatus });
                }
              }}
            >
              {updateStatusMutation.isPending ? "Mise à jour…" : "Confirmer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
