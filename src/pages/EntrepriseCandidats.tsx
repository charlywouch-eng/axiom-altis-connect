import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Search,
  ShieldCheck,
  Star,
  Phone,
  Info,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  FileText,
  CheckCircle2,
  Clock,
  Globe,
  Briefcase,
  Languages,
  Award,
  Send,
  FolderOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MOCK_CANDIDATES } from "@/data/dashboardMockData";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type UnifiedCandidate = {
  id: string;
  name: string;
  country: string;
  codeRome: string;
  secteur: string;
  score: number;
  frenchLevel: string;
  experienceYears: number;
  certifiedMinefop: boolean;
  certifiedMinrex: boolean;
  available: boolean;
  source: "real" | "mock";
  skills?: string[];
  visaStatus?: string;
};

const FRENCH_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Natif"];
const SORT_OPTIONS = [
  { value: "score_desc", label: "Score ↓" },
  { value: "score_asc", label: "Score ↑" },
  { value: "experience_desc", label: "Expérience ↓" },
  { value: "name_asc", label: "Nom A→Z" },
];

// ── Score colors ──────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 85) return "text-emerald-600";
  if (s >= 70) return "text-accent";
  return "text-amber-600";
}
function scoreBarColor(s: number) {
  if (s >= 85) return "bg-emerald-500";
  if (s >= 70) return "bg-accent";
  return "bg-amber-500";
}

// ── Visa status label ────────────────────────────────────────────────────────
const VISA_LABELS: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "bg-amber-400/15 text-amber-700 border-amber-400/30" },
  apostille:  { label: "Apostille ✓", color: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  pret_j1:    { label: "Prêt J-1 ✓", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  en_cours:   { label: "En cours", color: "bg-secondary text-secondary-foreground border-border/40" },
};

// ── Dossier Modal ─────────────────────────────────────────────────────────────
function CandidatDossierModal({
  candidate,
  open,
  onOpenChange,
  onContact,
}: {
  candidate: UnifiedCandidate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onContact: (c: UnifiedCandidate) => void;
}) {
  const { data: diplomas = [], isLoading: diplomasLoading } = useQuery({
    queryKey: ["candidate-diplomas", candidate?.id],
    queryFn: async () => {
      if (!candidate || candidate.source !== "real") return [];
      const { data, error } = await supabase
        .from("diplomas")
        .select("id, file_name, status, minfop_verified, apostille_verified, rome_label, rome_match_percent, extracted_field")
        .eq("talent_id", candidate.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && !!candidate && candidate.source === "real",
  });

  if (!candidate) return null;

  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isAxiomReady = candidate.score >= 80;
  const visaInfo = VISA_LABELS[candidate.visaStatus ?? "en_attente"] ?? VISA_LABELS["en_attente"];

  const scoreLabel =
    candidate.score >= 85 ? "Excellent" :
    candidate.score >= 70 ? "Bon" :
    candidate.score >= 50 ? "Moyen" : "Faible";

  const scoreHue =
    candidate.score >= 85 ? "hsl(var(--success))" :
    candidate.score >= 70 ? "hsl(var(--accent))" : "hsl(var(--warning))";

  // Mock diplomas for demo candidates
  const mockDiplomas =
    candidate.source === "mock"
      ? [
          { id: "m1", file_name: "Scan diplôme MINEFOP.pdf", status: "verifie", minfop_verified: candidate.certifiedMinefop, apostille_verified: candidate.certifiedMinrex, rome_label: candidate.secteur, rome_match_percent: candidate.score, extracted_field: candidate.codeRome },
          { id: "m2", file_name: "Copie passeport.pdf", status: "verifie", minfop_verified: false, apostille_verified: false, rome_label: null, rome_match_percent: null, extracted_field: null },
        ]
      : diplomas;

  const displayDiplomas = candidate.source === "mock" ? mockDiplomas : diplomas;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-14 w-14 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isAxiomReady && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                  <Star className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <DialogTitle className="font-display text-xl leading-tight">{candidate.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-0.5 flex-wrap">
                {candidate.codeRome && (
                  <span className="font-mono text-accent text-xs">{candidate.codeRome}</span>
                )}
                <span>· {candidate.secteur}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Score global */}
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" /> Score de conformité
            </p>
            <span className="text-2xl font-display font-bold" style={{ color: scoreHue }}>
              {candidate.score}<span className="text-muted-foreground text-sm font-normal">/100</span>
            </span>
          </div>
          <Progress value={candidate.score} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{scoreLabel}</span>
            {isAxiomReady && (
              <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-[10px] gap-1">
                <Star className="h-2.5 w-2.5" /> AXIOM READY
              </Badge>
            )}
          </div>
        </div>

        {/* Infos clés */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted/50 p-3 flex items-start gap-2">
            <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Pays</p>
              <p className="text-sm font-semibold mt-0.5">{candidate.country}</p>
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 flex items-start gap-2">
            <Languages className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Français</p>
              <p className="text-sm font-semibold mt-0.5">{candidate.frenchLevel}</p>
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 flex items-start gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Expérience</p>
              <p className="text-sm font-semibold mt-0.5">{candidate.experienceYears} ans</p>
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 flex items-start gap-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Statut visa</p>
              <Badge className={cn("text-[10px] border mt-0.5", visaInfo.color)}>
                {visaInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Compétences */}
        {candidate.skills && candidate.skills.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" /> Compétences
              </p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Certifications */}
        {(candidate.certifiedMinefop || candidate.certifiedMinrex) && (
          <>
            <Separator />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Certifications légales
              </p>
              <div className="flex gap-2">
                {candidate.certifiedMinefop && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> MINEFOP vérifié
                  </div>
                )}
                {candidate.certifiedMinrex && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> MINREX vérifié
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Diplômes */}
        <Separator />
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Documents du dossier
          </p>
          {diplomasLoading ? (
            <p className="text-xs text-muted-foreground animate-pulse">Chargement des diplômes…</p>
          ) : displayDiplomas.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucun document transmis pour ce profil.</p>
          ) : (
            <div className="space-y-2">
              {displayDiplomas.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.file_name}</p>
                    {d.rome_label && (
                      <p className="text-[11px] text-muted-foreground">{d.rome_label} · {d.rome_match_percent ?? 0}% match ROME</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {d.minfop_verified && (
                      <Badge className="bg-amber-400/15 text-amber-700 border border-amber-400/30 text-[9px] gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" /> MINEFOP
                      </Badge>
                    )}
                    {d.apostille_verified && (
                      <Badge className="bg-blue-500/15 text-blue-700 border border-blue-500/30 text-[9px] gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Apostille
                      </Badge>
                    )}
                    {!d.minfop_verified && !d.apostille_verified && (
                      <Badge variant="secondary" className="text-[9px]">
                        {d.status === "verifie" ? "Vérifié" : "En attente"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* CTA */}
        <Button
          onClick={() => { onContact(candidate); onOpenChange(false); }}
          className="w-full gap-2 py-5 text-sm font-semibold rounded-xl"
        >
          <Send className="h-4 w-4" /> Envoyer une demande de contact
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ── Candidate Card ────────────────────────────────────────────────────────────
function CandidatCard({
  candidate,
  index,
  onContact,
  onViewDossier,
}: {
  candidate: UnifiedCandidate;
  index: number;
  onContact: (c: UnifiedCandidate) => void;
  onViewDossier: (c: UnifiedCandidate) => void;
}) {
  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isAxiomReady = candidate.score >= 80;
  const isCertified = candidate.certifiedMinefop || candidate.certifiedMinrex;

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.35, ease: "easeOut" }}
        whileHover={{ y: -3, transition: { duration: 0.18 } }}
      >
        <Card className="group relative overflow-hidden border-border/50 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full">
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-0.5",
              isAxiomReady ? "bg-emerald-500" : "bg-accent"
            )}
          />
          <CardContent className="p-5 flex flex-col h-full">
            {/* Top row */}
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <Avatar className="h-11 w-11 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {isAxiomReady && (
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                    <Star className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate leading-tight">
                      {candidate.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{candidate.secteur}</p>
                    <p className="text-xs text-muted-foreground">
                      {candidate.country} · {candidate.frenchLevel} · {candidate.experienceYears} ans
                    </p>
                  </div>
                  <div className={cn("text-xl font-bold tabular-nums shrink-0", scoreColor(candidate.score))}>
                    {candidate.score}%
                  </div>
                </div>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Conformité</span>
                <span className="font-medium">ROME · {candidate.codeRome || "—"}</span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn("absolute inset-y-0 left-0 rounded-full", scoreBarColor(candidate.score))}
                  initial={{ width: 0 }}
                  animate={{ width: `${candidate.score}%` }}
                  transition={{ delay: Math.min(index * 0.05, 0.4) + 0.25, duration: 0.7, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Badges */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {isAxiomReady && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-[10px] font-semibold gap-1 cursor-help">
                      <Star className="h-2.5 w-2.5" />
                      AXIOM READY
                      <Info className="h-2.5 w-2.5 opacity-60" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p className="font-semibold mb-1">Garantie conformité AXIOM</p>
                    <p>Conformité ROME + visa accéléré — Frais d'audit +15% success fee post-signature.</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isCertified && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="bg-amber-400/15 text-amber-700 border border-amber-400/30 text-[10px] font-semibold gap-1 cursor-help">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      {candidate.certifiedMinefop && candidate.certifiedMinrex
                        ? "MINEFOP · MINREX"
                        : candidate.certifiedMinefop
                        ? "MINEFOP"
                        : "MINREX"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    Diplôme vérifié par MINEFOP et/ou MINREX. Conformité légale garantie.
                  </TooltipContent>
                </Tooltip>
              )}
              {!candidate.available && (
                <Badge variant="secondary" className="text-[10px]">Non dispo.</Badge>
              )}
              {candidate.source === "real" && (
                <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                  Vérifié
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto pt-4 flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
                onClick={() => onContact(candidate)}
              >
                <Phone className="h-3.5 w-3.5" />
                Contacter
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-border/60"
                onClick={() => onViewDossier(candidate)}
              >
                <FolderOpen className="h-3.5 w-3.5 mr-1" />
                Dossier
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}

// ── Filter Chip ───────────────────────────────────────────────────────────────
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
          : "bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function EntrepriseCandidats() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterSecteur, setFilterSecteur] = useState<string | null>(null);
  const [filterFrench, setFilterFrench] = useState<string | null>(null);
  const [filterAvailable, setFilterAvailable] = useState<boolean | null>(null);
  const [filterCertified, setFilterCertified] = useState(false);
  const [sortBy, setSortBy] = useState("score_desc");
  const [dossierCandidate, setDossierCandidate] = useState<UnifiedCandidate | null>(null);

  // Real talent profiles from DB
  const { data: dbTalents = [] } = useQuery({
    queryKey: ["talent_profiles_candidats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("id, full_name, country, rome_code, rome_label, french_level, experience_years, available, compliance_score, visa_status, skills")
        .eq("available", true)
        .order("compliance_score", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Unify real + mock candidates
  const allCandidates: UnifiedCandidate[] = useMemo(() => {
    const real: UnifiedCandidate[] = dbTalents.map((t) => ({
      id: t.id,
      name: t.full_name ?? "Talent anonyme",
      country: t.country ?? "Cameroun",
      codeRome: t.rome_code ?? "",
      secteur: t.rome_label ?? "Non renseigné",
      score: t.compliance_score ?? 0,
      frenchLevel: t.french_level ?? "—",
      experienceYears: t.experience_years ?? 0,
      certifiedMinefop: false,
      certifiedMinrex: false,
      available: t.available ?? true,
      source: "real" as const,
      skills: t.skills ?? [],
      visaStatus: t.visa_status,
    }));

    const mock: UnifiedCandidate[] = MOCK_CANDIDATES.map((c) => ({
      id: c.id,
      name: c.name,
      country: c.country,
      codeRome: c.codeRome,
      secteur: c.secteur,
      score: c.score,
      frenchLevel: c.frenchLevel,
      experienceYears: c.experienceYears,
      certifiedMinefop: c.certifiedMinefop,
      certifiedMinrex: c.certifiedMinrex,
      available: c.available,
      source: "mock" as const,
    }));

    return [...real, ...mock];
  }, [dbTalents]);

  // Unique sectors from data
  const uniqueSecteurs = useMemo(() => {
    const set = new Set(allCandidates.map((c) => c.secteur).filter(Boolean));
    return Array.from(set).sort();
  }, [allCandidates]);

  // Filtered + sorted candidates
  const filtered = useMemo(() => {
    let list = allCandidates;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.secteur.toLowerCase().includes(q) ||
          c.codeRome.toLowerCase().includes(q)
      );
    }
    if (filterSecteur) {
      list = list.filter((c) => c.secteur === filterSecteur);
    }
    if (filterFrench) {
      list = list.filter((c) => c.frenchLevel === filterFrench);
    }
    if (filterAvailable !== null) {
      list = list.filter((c) => c.available === filterAvailable);
    }
    if (filterCertified) {
      list = list.filter((c) => c.certifiedMinefop || c.certifiedMinrex);
    }

    switch (sortBy) {
      case "score_asc":  list = [...list].sort((a, b) => a.score - b.score); break;
      case "score_desc": list = [...list].sort((a, b) => b.score - a.score); break;
      case "experience_desc": list = [...list].sort((a, b) => b.experienceYears - a.experienceYears); break;
      case "name_asc": list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
    }

    return list;
  }, [allCandidates, search, filterSecteur, filterFrench, filterAvailable, filterCertified, sortBy]);

  const activeFiltersCount = [filterSecteur, filterFrench, filterAvailable !== null ? "dispo" : null, filterCertified ? "cert" : null].filter(Boolean).length;

  const clearFilters = () => {
    setFilterSecteur(null);
    setFilterFrench(null);
    setFilterAvailable(null);
    setFilterCertified(false);
    setSearch("");
  };

  const handleContact = (c: UnifiedCandidate) => {
    toast({
      title: "📩 Demande envoyée",
      description: `Votre demande de contact pour ${c.name} a été transmise à l'équipe AXIOM.`,
    });
  };

  return (
    <DashboardLayout sidebarVariant="entreprise">
      <div className="space-y-6 pb-16">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Users className="h-7 w-7 text-primary" />
              Candidats disponibles
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} talent{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""} sur {allCandidates.length} · Cameroun → France
            </p>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* ── Search + quick filters ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="space-y-3"
        >
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom, secteur, code ROME…"
              className="pl-9 pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter panel */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Filtres</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{activeFiltersCount}</Badge>
              )}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Effacer tout
                </button>
              )}
            </div>

            {/* Secteur ROME */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">Secteur ROME</p>
              <div className="flex flex-wrap gap-1.5">
                {uniqueSecteurs.map((s) => (
                  <FilterChip
                    key={s}
                    label={s}
                    active={filterSecteur === s}
                    onClick={() => setFilterSecteur(filterSecteur === s ? null : s)}
                  />
                ))}
              </div>
            </div>

            {/* Niveau de français */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">Niveau de français</p>
              <div className="flex flex-wrap gap-1.5">
                {FRENCH_LEVELS.map((lvl) => (
                  <FilterChip
                    key={lvl}
                    label={lvl}
                    active={filterFrench === lvl}
                    onClick={() => setFilterFrench(filterFrench === lvl ? null : lvl)}
                  />
                ))}
              </div>
            </div>

            {/* Disponibilité + Certifié */}
            <div className="flex flex-wrap gap-1.5">
              <FilterChip
                label="✅ Disponibles"
                active={filterAvailable === true}
                onClick={() => setFilterAvailable(filterAvailable === true ? null : true)}
              />
              <FilterChip
                label="⏸ Non disponibles"
                active={filterAvailable === false}
                onClick={() => setFilterAvailable(filterAvailable === false ? null : false)}
              />
              <FilterChip
                label="🛡 Certifiés MINEFOP/MINREX"
                active={filterCertified}
                onClick={() => setFilterCertified(!filterCertified)}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Results grid ───────────────────────────────────── */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-foreground">Aucun talent trouvé</p>
            <p className="text-sm text-muted-foreground mt-1">Modifiez vos filtres pour élargir la recherche.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Effacer les filtres
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((c, i) => (
                <CandidatCard key={c.id} candidate={c} index={i} onContact={handleContact} onViewDossier={setDossierCandidate} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <CandidatDossierModal
        candidate={dossierCandidate}
        open={!!dossierCandidate}
        onOpenChange={(v) => { if (!v) setDossierCandidate(null); }}
        onContact={handleContact}
      />
    </DashboardLayout>
  );
}
