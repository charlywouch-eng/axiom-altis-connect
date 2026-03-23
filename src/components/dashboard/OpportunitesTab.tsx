import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Briefcase,
  Building2,
  MapPin,
  Banknote,
  Star,
  Mail,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Package,
  Shield,
  Sparkles,
  Rocket,
  TrendingUp,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ────────────────────────────────────────────────────
interface LBBCompany {
  siret: string;
  name: string;
  sector: string;
  romeCode: string;
  romeLabel: string;
  city: string;
  zipCode: string;
  hiringPotential: number;
  nafLabel: string;
  url: string;
  headcount: string | null;
  distance: number | null;
}

interface OpportunitesTabProps {
  offersToDisplay: Array<Record<string, unknown> & { score?: number }>;
  ftOffers: Array<Record<string, unknown> & { score: number }> | null | undefined;
  ftLoading: boolean;
  lbbCompanies: LBBCompany[] | null | undefined;
  lbbLoading: boolean;
  isPremium: boolean;
  visaStatus: string;
  itemVariants: import("framer-motion").Variants;
}

const SECTOR_BADGE_COLORS: Record<string, string> = {
  BTP: "bg-orange-500/10 text-orange-700 border-orange-300/40 dark:text-orange-400",
  Santé: "bg-emerald-500/10 text-emerald-700 border-emerald-300/40 dark:text-emerald-400",
  CHR: "bg-violet-500/10 text-violet-700 border-violet-300/40 dark:text-violet-400",
  Logistique: "bg-sky-500/10 text-sky-700 border-sky-300/40 dark:text-sky-400",
  Autre: "bg-muted text-muted-foreground border-border",
};

const CONTRACT_COLORS: Record<string, string> = {
  CDI: "bg-success/10 text-success border-success/30",
  CDD: "bg-primary/10 text-primary border-primary/30",
  Saisonnier: "bg-accent/10 text-accent border-accent/30",
  MIS: "bg-accent/10 text-accent border-accent/30",
  SAI: "bg-accent/10 text-accent border-accent/30",
};

const TENSION_COLORS: Record<string, string> = {
  "Très forte": "bg-red-500/10 text-red-600 border-red-300/40",
  Forte: "bg-orange-500/10 text-orange-600 border-orange-300/40",
  Modérée: "bg-amber-500/10 text-amber-600 border-amber-300/40",
};

const MOCK_LBB_COMPANIES: LBBCompany[] = [
  { siret: "mock-1", name: "BTP Services Rhône-Alpes", sector: "BTP", romeCode: "F1703", romeLabel: "Maçonnerie", city: "Lyon", zipCode: "69001", hiringPotential: 4.8, nafLabel: "Construction", url: "#", headcount: "50-99", distance: 5 },
  { siret: "mock-2", name: "Clinique Saint-Joseph", sector: "Santé", romeCode: "J1501", romeLabel: "Aide-soignant", city: "Paris", zipCode: "75015", hiringPotential: 4.5, nafLabel: "Activités hospitalières", url: "#", headcount: "100-199", distance: 8 },
  { siret: "mock-3", name: "Hôtel Le Grand Palais", sector: "CHR", romeCode: "G1602", romeLabel: "Service en salle", city: "Bordeaux", zipCode: "33000", hiringPotential: 4.2, nafLabel: "Hôtels et hébergement", url: "#", headcount: "20-49", distance: 12 },
  { siret: "mock-4", name: "Plomberie Dupont & Fils", sector: "BTP", romeCode: "F1603", romeLabel: "Plomberie", city: "Marseille", zipCode: "13001", hiringPotential: 4.0, nafLabel: "Construction", url: "#", headcount: "10-19", distance: 15 },
  { siret: "mock-5", name: "EHPAD Les Oliviers", sector: "Santé", romeCode: "J1501", romeLabel: "Aide-soignant", city: "Toulouse", zipCode: "31000", hiringPotential: 3.8, nafLabel: "Hébergement médicalisé", url: "#", headcount: "50-99", distance: 20 },
  { siret: "mock-6", name: "Brasserie de la République", sector: "CHR", romeCode: "G1603", romeLabel: "Restauration", city: "Nantes", zipCode: "44000", hiringPotential: 3.5, nafLabel: "Restauration traditionnelle", url: "#", headcount: "10-19", distance: 25 },
];

const VISA_ELIGIBLE_STATUSES = ["approuve", "en_cours", "obtenu", "valide"];

function isVisaEligible(visaStatus: string): boolean {
  return VISA_ELIGIBLE_STATUSES.includes(visaStatus) || visaStatus !== "en_attente";
}

function getAxiomReadyStatus(score: number, visaStatus: string): "ready" | "altis" | null {
  if (score >= 80 && isVisaEligible(visaStatus)) return "ready";
  if (score >= 60) return "altis";
  return null;
}

export default function OpportunitesTab({
  offersToDisplay,
  ftOffers,
  ftLoading,
  lbbCompanies,
  lbbLoading,
  isPremium,
  visaStatus,
  itemVariants,
}: OpportunitesTabProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [contractFilter, setContractFilter] = useState<string>("all");

  const SECTOR_OPTIONS = ["all", "BTP", "Santé", "CHR", "Logistique"];
  const CONTRACT_OPTIONS = ["all", "CDI", "CDD", "Saisonnier", "MIS"];

  const sortedOffers = [...offersToDisplay]
    .filter((o) => {
      const sector = String(o.sector ?? "BTP");
      const contract = String(o.contract ?? "CDI");
      if (sectorFilter !== "all" && sector !== sectorFilter) return false;
      if (contractFilter !== "all" && contract !== contractFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const scoreA = (a.score as number) ?? 0;
      const scoreB = (b.score as number) ?? 0;
      const statusA = getAxiomReadyStatus(scoreA, visaStatus);
      const statusB = getAxiomReadyStatus(scoreB, visaStatus);
      const priority = (s: string | null) => s === "ready" ? 2 : s === "altis" ? 1 : 0;
      const diff = priority(statusB) - priority(statusA);
      if (diff !== 0) return diff;
      return scoreB - scoreA;
    });

  const handlePostulerAxiom = (offerId: string, title: string) => {
    toast({
      title: "Candidature AXIOM envoyée ✓",
      description: `Votre candidature pour "${title}" est en cours de traitement par notre équipe.`,
    });
  };

  const handleActiverAltis = () => {
    toast({
      title: "Pack ALTIS",
      description: "Un conseiller AXIOM vous contactera sous 24h pour activer votre Pack ALTIS (2 450 €).",
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Hero Banner ─────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              {ftLoading
                ? <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
                : ftOffers && ftOffers.length > 0
                  ? <Badge className="text-[10px] px-2.5 py-0.5 bg-success/10 text-success border-success/30">LIVE</Badge>
                  : <Badge className="text-[10px] px-2.5 py-0.5 bg-muted text-muted-foreground">DEMO</Badge>
              }
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
            Vos Opportunités Réelles en France
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Des offres qui correspondent à votre profil et à votre score IA — Prêt à passer à l'action ?
          </p>
          <div className="rounded-xl bg-accent/5 border border-accent/20 p-4">
            <p className="text-sm text-foreground/80 leading-relaxed flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              Votre expérience et vos compétences ont de la valeur en France. Découvrez les offres qui vous correspondent vraiment et activez votre accompagnement ALTIS.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Filtres ────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-medium">Filtrer :</span>
        </div>

        {/* Sector filter */}
        <div className="flex flex-wrap gap-1.5">
          {SECTOR_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSectorFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                sectorFilter === s
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:border-border"
              }`}
            >
              {s === "all" ? "Tous secteurs" : s}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border/50 hidden sm:block" />

        {/* Contract filter */}
        <div className="flex flex-wrap gap-1.5">
          {CONTRACT_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setContractFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                contractFilter === c
                  ? "bg-accent text-accent-foreground border-accent shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:border-border"
              }`}
            >
              {c === "all" ? "Tous contrats" : c}
            </button>
          ))}
        </div>

        {(sectorFilter !== "all" || contractFilter !== "all") && (
          <button
            onClick={() => { setSectorFilter("all"); setContractFilter("all"); }}
            className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </motion.div>

      {/* ── Offres recommandées ──────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {sortedOffers.length} offre{sortedOffers.length > 1 ? "s" : ""} compatibles
            </span>
            {sortedOffers.some((o) => getAxiomReadyStatus((o.score as number) ?? 0, visaStatus) === "ready") && (
              <Badge className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-400/30 gap-1">
                <Shield className="h-2.5 w-2.5" /> AXIOM READY en priorité
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            {ftOffers && ftOffers.length > 0
              ? <><CheckCircle2 className="h-3 w-3 text-success" />Marché français</>
              : <><RefreshCw className="h-3 w-3" />Données simulées</>
            }
          </span>
        </div>

        <div className="space-y-4">
          {sortedOffers.map((offer, i) => {
            const score = (offer.score as number) ?? 80;
            const contract = String(offer.contract ?? "CDI");
            const tension = String(offer.tension ?? "Forte");
            const sector = String(offer.sector ?? "BTP");
            const title = String(offer.title ?? "Offre");
            const company = String(offer.company ?? "Entreprise non communiquée");
            const offerLocation = String(offer.location ?? "France");
            const salary = offer.salary ? String(offer.salary) : null;
            const skills = Array.isArray(offer.skills) ? (offer.skills as string[]) : [];
            const sectorColor = SECTOR_BADGE_COLORS[sector] ?? SECTOR_BADGE_COLORS.Autre;
            const scoreColor = score >= 90 ? "text-emerald-500" : score >= 80 ? "text-primary" : "text-amber-500";
            const axiomStatus = getAxiomReadyStatus(score, visaStatus);

            return (
              <motion.div
                key={String(offer.id ?? i)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Card className={`overflow-hidden transition-all hover:shadow-md group ${
                  axiomStatus === "ready"
                    ? "border-emerald-400/50 hover:border-emerald-500/60 ring-1 ring-emerald-400/15 bg-emerald-50/30 dark:bg-emerald-950/10"
                    : axiomStatus === "altis"
                      ? "border-cyan-400/40 hover:border-cyan-500/50 bg-cyan-50/20 dark:bg-cyan-950/10"
                      : "border-border/50 hover:border-primary/20"
                }`}>
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Score Panel */}
                      <div className={`flex flex-col items-center justify-center px-5 py-5 border-r shrink-0 ${
                        axiomStatus === "ready"
                          ? "bg-emerald-500/5 border-emerald-400/20"
                          : axiomStatus === "altis"
                            ? "bg-cyan-500/5 border-cyan-400/20"
                            : "bg-muted/30 border-border/30"
                      }`}>
                        <div className="relative h-16 w-16 mb-2">
                          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-border/30" />
                            <circle
                              cx="18" cy="18" r="15" fill="none" strokeWidth="2.5"
                              strokeDasharray={`${(score / 100) * 94.2} 94.2`}
                              strokeLinecap="round"
                              className={scoreColor}
                              style={{ stroke: "currentColor" }}
                            />
                          </svg>
                          <span className={`absolute inset-0 flex items-center justify-center text-base font-bold tabular-nums ${scoreColor}`}>
                            {score}%
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">Score IA</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 p-4">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="text-sm font-bold text-foreground truncate">{title}</h3>
                              {axiomStatus === "ready" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="text-[9px] px-2 py-0.5 bg-emerald-500/15 text-emerald-600 border-emerald-400/40 gap-1 shrink-0">
                                        <Shield className="h-2.5 w-2.5" /> AXIOM READY
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                      Score ≥ 80 % + profil éligible visa · Candidature prioritaire via AXIOM
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {axiomStatus === "altis" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="text-[9px] px-2 py-0.5 bg-cyan-500/15 text-cyan-600 border-cyan-400/40 gap-1 shrink-0">
                                        <Package className="h-2.5 w-2.5" /> PACK ALTIS
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                      Pack ALTIS disponible : formalités visa de travail (procédure ANEF) + accueil aéroport + logement meublé 1 mois + accompagnement administratif (2 450 €)
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{company}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />{offerLocation}
                              </span>
                              {salary && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Banknote className="h-3 w-3" />{salary}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 shrink-0">
                            <Badge className={`text-[9px] px-2 py-0.5 border ${sectorColor}`}>{sector}</Badge>
                            <Badge className={`text-[9px] px-2 py-0.5 border ${CONTRACT_COLORS[contract] ?? "bg-muted text-muted-foreground"}`}>{contract}</Badge>
                            <Badge className={`text-[9px] px-2 py-0.5 border ${TENSION_COLORS[tension] ?? "bg-muted text-muted-foreground"}`}>{tension}</Badge>
                          </div>
                        </div>

                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {skills.slice(0, 4).map((s) => (
                              <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">{s}</Badge>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 shadow-sm"
                            onClick={() => handlePostulerAxiom(String(offer.id ?? ""), title)}
                          >
                            {isPremium || axiomStatus === "ready"
                              ? <><Sparkles className="h-3 w-3" /> Postuler via AXIOM</>
                              : <><ArrowRight className="h-3 w-3" /> Postuler via AXIOM</>
                            }
                          </Button>
                          {(axiomStatus === "altis" || axiomStatus === "ready") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1.5 border-cyan-400/50 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 shadow-sm"
                              onClick={handleActiverAltis}
                            >
                              <Package className="h-3 w-3" /> Activer ALTIS · 2 450 €
                            </Button>
                          )}
                        </div>

                        {/* Motivational match line */}
                        <div className="mt-3 pt-3 border-t border-border/30">
                          <p className="text-[11px] text-accent flex items-center gap-1.5 font-medium">
                            <TrendingUp className="h-3 w-3 shrink-0" />
                            Votre profil correspond à {score} % à cette offre
                            {score >= 90 && " — Excellente compatibilité !"}
                            {score >= 80 && score < 90 && " — Très bonne compatibilité"}
                            {score >= 60 && score < 80 && " — Bonne compatibilité"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── La Bonne Boîte ───────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Entreprises qui recrutent</span>
          {lbbLoading && <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
        </div>
        <p className="text-xs text-muted-foreground mb-4">Entreprises à fort potentiel d'embauche dans vos secteurs</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(lbbCompanies ?? MOCK_LBB_COMPANIES).map((company) => {
            const sectorColor = SECTOR_BADGE_COLORS[company.sector] ?? SECTOR_BADGE_COLORS.Autre;
            return (
              <motion.div key={company.siret} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="hover:shadow-sm hover:border-accent/30 transition-all group">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{company.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />{company.city} {company.zipCode && `(${company.zipCode.slice(0, 2)})`}
                          {company.distance != null && ` · ${company.distance} km`}
                        </p>
                      </div>
                      <Badge className={`text-[9px] px-1.5 py-0 border shrink-0 ${sectorColor}`}>{company.sector}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-semibold tabular-nums">{company.hiringPotential.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">potentiel</span>
                      </div>
                      {company.headcount && <span className="text-[10px] text-muted-foreground">{company.headcount} sal.</span>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-primary/30 text-primary hover:bg-primary/5 gap-1.5 text-xs"
                      onClick={() => { if (company.url && company.url !== "#") window.open(company.url, "_blank"); }}
                    >
                      <Mail className="h-3 w-3" /> Candidature spontanée
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
