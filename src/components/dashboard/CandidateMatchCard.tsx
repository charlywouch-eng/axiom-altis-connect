import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, Star, Phone, Info } from "lucide-react";
import { type MockCandidate } from "@/data/dashboardMockData";
import { cn } from "@/lib/utils";

interface CandidateMatchCardProps {
  candidate: MockCandidate;
  index: number;
  onContact?: (id: string) => void;
}

function scoreColor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-accent";
  return "text-amber-600";
}

function scoreBarColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-accent";
  return "bg-amber-500";
}

export function CandidateMatchCard({ candidate, index, onContact }: CandidateMatchCardProps) {
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
        transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
      >
        <Card className="group relative overflow-hidden border-border/50 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
          {/* Accent bar top */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-0.5",
              isAxiomReady ? "bg-emerald-500" : "bg-accent"
            )}
          />

          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
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

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm text-foreground truncate">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground">{candidate.secteur}</p>
                    <p className="text-xs text-muted-foreground">{candidate.country} · {candidate.frenchLevel} · {candidate.experienceYears} ans exp.</p>
                  </div>
                  <div className={cn("text-2xl font-bold tabular-nums", scoreColor(candidate.score))}>
                    {candidate.score}%
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Score de conformité</span>
                    <span className="font-medium">ROME · {candidate.codeRome}</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={cn("absolute inset-y-0 left-0 rounded-full", scoreBarColor(candidate.score))}
                      initial={{ width: 0 }}
                      animate={{ width: `${candidate.score}%` }}
                      transition={{ delay: index * 0.08 + 0.3, duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                  {isAxiomReady && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-[10px] font-semibold gap-1 cursor-help hover:bg-emerald-500/20">
                          <Star className="h-2.5 w-2.5" />
                          AXIOM READY
                          <Info className="h-2.5 w-2.5 opacity-60" />
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        <p className="font-semibold mb-1">Garantie conformité AXIOM</p>
                        <p>Garantie conformité ROME + visa accéléré — Frais d'audit certifié +15% success fee (facturé post-signature contrat, réduction risque onboarding 80%)</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {isCertified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="bg-amber-400/15 text-amber-700 border border-amber-400/30 text-[10px] font-semibold gap-1 cursor-help hover:bg-amber-400/20">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          {candidate.certifiedMinefop && candidate.certifiedMinrex
                            ? "CERTIFIÉ MINEFOP · MINREX"
                            : candidate.certifiedMinefop
                            ? "CERTIFIÉ MINEFOP"
                            : "CERTIFIÉ MINREX"}
                          <Info className="h-2.5 w-2.5 opacity-60" />
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        <p className="font-semibold mb-1">Certification officielle</p>
                        <p>Diplôme vérifié par le Ministère camerounais de l'Emploi (MINEFOP) et/ou le Ministère des Relations Extérieures (MINREX). Conformité légale garantie pour la procédure de visa de travail.</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5"
                    onClick={() => onContact?.(candidate.id)}
                    aria-label={`Contacter ${candidate.name}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Contacter
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                  <p className="font-semibold mb-1">Pack ALTIS Zéro Stress — Optionnel</p>
                  <p>+5% fee — visa ANEF, billet d'avion, accueil aéroport, installation logement. Forfait facturé entreprise, zéro gestion RH mobilité.</p>
                </TooltipContent>
              </Tooltip>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-border/60"
                aria-label={`Voir le dossier de ${candidate.name}`}
              >
                Dossier
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
