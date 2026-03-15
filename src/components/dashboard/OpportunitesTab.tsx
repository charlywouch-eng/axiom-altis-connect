import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  itemVariants: Record<string, unknown>;
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

// Visa-eligible statuses
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

  // Sort: AXIOM READY first, then ALTIS available, then rest
  const sortedOffers = [...offersToDisplay].sort((a, b) => {
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
    <div className="space-y-5">
      {/* Offres recommandées */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-primary/20 shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
              </div>
              Offres France Travail
              {ftLoading
                ? <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin ml-1" />
                : ftOffers && ftOffers.length > 0
                  ? <Badge className="text-[9px] px-2 py-0.5 bg-success/10 text-success border-success/30 ml-1">LIVE</Badge>
                  : <Badge className="text-[9px] px-2 py-0.5 bg-muted text-muted-foreground ml-1">DEMO</Badge>
              }
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              BTP · Santé · CHR — Secteurs en forte tension · Score de compatibilité IA
              {sortedOffers.some((o) => getAxiomReadyStatus((o.score as number) ?? 0, visaStatus) === "ready") && (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <Shield className="h-3 w-3" /> Offres AXIOM READY en priorité
                </span>
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
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
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`rounded-xl border bg-muted/20 hover:bg-muted/40 transition-all group ${
                    axiomStatus === "ready"
                      ? "border-emerald-400/50 hover:border-emerald-500/60 ring-1 ring-emerald-400/20"
                      : axiomStatus === "altis"
                        ? "border-cyan-400/40 hover:border-cyan-500/50"
                        : "border-border/50 hover:border-primary/20"
                  }`}
                >
                  <div className="flex gap-3 p-3.5">
                    {/* Score circle */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="relative h-12 w-12">
                        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border/40" />
                          <circle
                            cx="18" cy="18" r="15" fill="none" strokeWidth="2.5"
                            strokeDasharray={`${(score / 100) * 94.2} 94.2`}
                            strokeLinecap="round"
                            className={scoreColor}
                            style={{ stroke: "currentColor" }}
                          />
                        </svg>
                        <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${scoreColor}`}>{score}%</span>
                      </div>
                      <Badge className={`text-[8px] px-1 py-0 border ${sectorColor}`}>{sector}</Badge>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                            {/* AXIOM READY badges */}
                            {axiomStatus === "ready" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="text-[8px] px-1.5 py-0 bg-emerald-500/15 text-emerald-600 border-emerald-400/40 gap-0.5 shrink-0">
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
                                    <Badge className="text-[8px] px-1.5 py-0 bg-cyan-500/15 text-cyan-600 border-cyan-400/40 gap-0.5 shrink-0">
                                      <Package className="h-2.5 w-2.5" /> PACK ALTIS
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs text-xs">
                                    Pack ALTIS disponible : visa ANEF, billet, logement et accompagnement complet (2 450 €)
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{company}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">{offerLocation}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 shrink-0">
                          <Badge className={`text-[9px] px-1.5 py-0 border ${CONTRACT_COLORS[contract] ?? "bg-muted text-muted-foreground"}`}>{contract}</Badge>
                          <Badge className={`text-[9px] px-1.5 py-0 border ${TENSION_COLORS[tension] ?? "bg-muted text-muted-foreground"}`}>{tension}</Badge>
                        </div>
                      </div>

                      {salary && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Banknote className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{salary}</span>
                        </div>
                      )}

                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {skills.slice(0, 3).map((s) => (
                            <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">{s}</Badge>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {isPremium || axiomStatus === "ready" ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90"
                            onClick={() => handlePostulerAxiom(String(offer.id ?? ""), title)}
                          >
                            <Sparkles className="h-3 w-3" /> Postuler via AXIOM
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90"
                            onClick={() => handlePostulerAxiom(String(offer.id ?? ""), title)}
                          >
                            <ArrowRight className="h-3 w-3" /> Postuler via AXIOM
                          </Button>
                        )}
                        {axiomStatus === "altis" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 border-cyan-400/40 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/20"
                            onClick={handleActiverAltis}
                          >
                            <Package className="h-3 w-3" /> Activer ALTIS · 2 450 €
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Source badge */}
            <div className="flex items-center justify-center pt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                {ftOffers && ftOffers.length > 0
                  ? <><CheckCircle2 className="h-3 w-3 text-success" />Offres en direct · France Travail</>
                  : <><RefreshCw className="h-3 w-3" />Données simulées · Connectez France Travail</>
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* La Bonne Boîte */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-accent/20 shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-accent to-primary/40" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-accent" />
              </div>
              Entreprises qui recrutent
              {lbbLoading && <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin ml-1" />}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Entreprises à fort potentiel d'embauche dans vos secteurs</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(lbbCompanies ?? MOCK_LBB_COMPANIES).map((company) => {
                const sectorColor = SECTOR_BADGE_COLORS[company.sector] ?? SECTOR_BADGE_COLORS.Autre;
                return (
                  <motion.div key={company.siret} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-2 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-accent/30 transition-all group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{company.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{company.city} {company.zipCode && `(${company.zipCode.slice(0, 2)})`}{company.distance != null && ` · ${company.distance} km`}</p>
                      </div>
                      <Badge className={`text-[9px] px-1.5 py-0 border shrink-0 ${sectorColor}`}>{company.sector}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-semibold">{company.hiringPotential.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">potentiel</span>
                      </div>
                      {company.headcount && <span className="text-[10px] text-muted-foreground">{company.headcount} sal.</span>}
                    </div>
                    <Button size="sm" variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5 gap-1.5 text-xs group-hover:bg-primary/5 transition-colors" onClick={() => { if (company.url && company.url !== "#") window.open(company.url, "_blank"); }}>
                      <Mail className="h-3 w-3" /> Candidature spontanée
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
