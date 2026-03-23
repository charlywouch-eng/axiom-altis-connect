import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  Phone, MapPin, Briefcase, GraduationCap,
  Award, Heart, ShieldCheck, Zap, Star, BadgeCheck
} from "lucide-react";

interface Experience {
  poste: string;
  entreprise: string;
  duree: string;
  missions: string;
}

interface Formation {
  diplome: string;
  etablissement: string;
  annee: string;
  minefop: boolean;
}

interface CandidatureData {
  id: string;
  full_name: string;
  phone?: string | null;
  city?: string | null;
  experiences: Experience[];
  formations: Formation[];
  competences: string[];
  certifications: string[];
  contract_type?: string | null;
  mobility?: string | null;
  desired_salary?: string | null;
  compliance_score: number;
  created_at: string;
}

interface Props {
  candidature: CandidatureData;
  onContact?: (id: string) => void;
  onActivateAltis?: (id: string) => void;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-accent";
  return "text-amber-500";
}

export default function CandidatureCvCard({ candidature, onContact, onActivateAltis }: Props) {
  const c = candidature;
  const initials = c.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const hasMinefop = c.formations?.some((f: any) => f.minefop);
  const hasVerifiedExperience = c.certifications?.some(
    (cert: string) => cert.toLowerCase().includes("minrex") || cert.toLowerCase().includes("axiom verified")
  );

  // Compute a mock score based on completeness
  const score = Math.min(100, 
    (c.full_name ? 10 : 0) +
    (c.experiences?.length ? Math.min(30, c.experiences.length * 15) : 0) +
    (c.formations?.length ? Math.min(20, c.formations.length * 10) : 0) +
    (c.competences?.length ? Math.min(25, c.competences.length * 5) : 0) +
    (hasMinefop ? 15 : 0)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-border/50 bg-card hover:shadow-lg transition-shadow">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />
        
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(222,47%,16%)] p-5 text-white">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/20 shrink-0">
                <AvatarFallback className="bg-accent text-accent-foreground text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold truncate">{c.full_name}</h3>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-white/60">
                  {c.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>}
                  {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {hasMinefop && (
                    <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[10px] gap-1">
                      <ShieldCheck className="h-2.5 w-2.5" /> MINEFOP
                    </Badge>
                  )}
                  {c.contract_type && (
                    <Badge variant="outline" className="border-white/20 text-white/70 text-[10px]">
                      {c.contract_type}
                    </Badge>
                  )}
                </div>
              </div>
              {/* Score */}
              <div className="text-center shrink-0">
                <div className={`text-3xl font-bold tabular-nums ${scoreColor(score)}`}>
                  {score}
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Score IA</div>
                <div className="mt-1 h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-accent" : "bg-amber-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Expériences */}
            {c.experiences?.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Briefcase className="h-3 w-3" /> Expérience
                </h4>
                <div className="space-y-2">
                  {(c.experiences as Experience[]).map((exp, i) => (
                    <div key={i} className="pl-3 border-l-2 border-accent/30">
                      <p className="text-sm font-medium text-foreground">{exp.poste}</p>
                      <p className="text-xs text-muted-foreground">
                        {[exp.entreprise, exp.duree].filter(Boolean).join(" · ")}
                      </p>
                      {exp.missions && (
                        <ul className="mt-1 space-y-0.5">
                          {exp.missions.split("\n").filter(Boolean).map((m, j) => (
                            <li key={j} className="text-xs text-foreground/70 flex items-start gap-1.5">
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-accent shrink-0" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Formations */}
            {c.formations?.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <GraduationCap className="h-3 w-3" /> Formation
                </h4>
                <div className="space-y-1.5">
                  {(c.formations as Formation[]).map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <p className="text-sm text-foreground">{f.diplome}</p>
                      {f.minefop && <Badge className="bg-amber-400/10 text-amber-600 border-amber-400/20 text-[9px]">MINEFOP</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {[f.etablissement, f.annee].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Compétences */}
            {c.competences?.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Award className="h-3 w-3" /> Compétences
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {c.competences.map(comp => (
                    <Badge key={comp} className="bg-accent/10 text-accent border-accent/20 text-[11px]">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {c.certifications?.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Star className="h-3 w-3" /> Certifications
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {c.certifications.map(cert => (
                    <Badge key={cert} variant="outline" className="text-[11px]">{cert}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Souhait */}
            {(c.contract_type || c.mobility || c.desired_salary) && (
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Heart className="h-3 w-3" /> Souhaits
                </h4>
                <div className="flex flex-wrap gap-3 text-xs text-foreground/70">
                  {c.contract_type && <span>📋 {c.contract_type}</span>}
                  {c.mobility && <span>📍 {c.mobility}</span>}
                  {c.desired_salary && <span>💰 {c.desired_salary}</span>}
                </div>
              </section>
            )}
          </div>

          {/* Actions */}
          <div className="border-t px-5 py-3 flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5"
              onClick={() => onContact?.(c.id)}
            >
              <Phone className="h-3.5 w-3.5" /> Contacter
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
              onClick={() => onActivateAltis?.(c.id)}
            >
              <Zap className="h-3.5 w-3.5" /> Activer ALTIS
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
