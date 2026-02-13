import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Clock, FileText, Plane, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS: { label: string; icon: typeof FileText; sub?: string }[] = [
  { label: "Profil validé", icon: FileText, sub: "AXIOM" },
  { label: "Promesse d'embauche", icon: Check },
  { label: "Procédure consulaire", icon: Plane, sub: "ALTIS" },
  { label: "Arrivée & Accueil", icon: MapPin, sub: "Paris" },
];

type StepStatus = "done" | "active" | "pending";

interface Candidate {
  id: string;
  name: string;
  role: string;
  country: string;
  currentStep: number; // 0-3
  eta?: string;
  urgency?: "normal" | "warning" | "critical";
}

const MOCK_CANDIDATES: Candidate[] = [
  { id: "1", name: "Amadou Diallo", role: "Développeur Full-Stack", country: "Sénégal", currentStep: 3, eta: "15 mars 2026" },
  { id: "2", name: "Fatou Ndiaye", role: "Infirmière spécialisée", country: "Côte d'Ivoire", currentStep: 2, eta: "22 avril 2026", urgency: "warning" },
  { id: "3", name: "Kofi Mensah", role: "Ingénieur BTP", country: "Ghana", currentStep: 1 },
  { id: "4", name: "Aïcha Ben Ali", role: "Data Analyst", country: "Tunisie", currentStep: 0, urgency: "normal" },
  { id: "5", name: "Jean-Pierre Habimana", role: "Technicien Électrique", country: "Rwanda", currentStep: 2, eta: "10 mai 2026", urgency: "critical" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  normal: { label: "En cours", className: "bg-accent/15 text-accent border-accent/30" },
  warning: { label: "Attention requise", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  critical: { label: "Urgent", className: "bg-destructive/15 text-destructive border-destructive/30" },
  completed: { label: "Finalisé", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
};

function StepIndicator({ status, icon: Icon }: { status: StepStatus; icon: typeof FileText }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all shrink-0",
        status === "done" && "border-accent bg-accent text-accent-foreground",
        status === "active" && "border-accent bg-accent/15 text-accent animate-pulse",
        status === "pending" && "border-border bg-muted text-muted-foreground"
      )}
    >
      {status === "done" ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
    </div>
  );
}

function CandidateRow({ candidate, index }: { candidate: Candidate; index: number }) {
  const initials = candidate.name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const urgency = candidate.currentStep === 3 ? "completed" : (candidate.urgency ?? "normal");
  const badge = statusConfig[urgency];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className="group rounded-lg border bg-card p-4 hover:shadow-md transition-all"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Candidate info */}
        <div className="flex items-center gap-3 lg:w-[220px] shrink-0">
          <Avatar className="h-10 w-10 border-2 border-accent/20">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-display font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-display font-semibold text-sm truncate">{candidate.name}</p>
            <p className="text-xs text-muted-foreground truncate">{candidate.role}</p>
            <p className="text-xs text-muted-foreground">{candidate.country}</p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex-1 flex items-center gap-1">
          {STEPS.map((step, i) => {
            const status: StepStatus = i < candidate.currentStep ? "done" : i === candidate.currentStep ? "active" : "pending";
            return (
              <div key={step.label} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <StepIndicator status={status} icon={step.icon} />
                  <span className={cn(
                    "text-[10px] leading-tight text-center font-medium hidden sm:block",
                    status === "done" && "text-accent",
                    status === "active" && "text-accent font-semibold",
                    status === "pending" && "text-muted-foreground"
                  )}>
                    {step.label}
                    {step.sub && <span className="block text-[9px] opacity-70">({step.sub})</span>}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 mx-1 rounded-full transition-all",
                    i < candidate.currentStep ? "bg-accent" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Badge + ETA */}
        <div className="flex items-center gap-2 lg:w-[180px] shrink-0 justify-end">
          {candidate.eta && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {candidate.eta}
            </span>
          )}
          <Badge className={cn("text-[10px] border", badge.className)}>
            {badge.label}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

export function RecruitmentPipeline() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display">Candidats en cours de recrutement</CardTitle>
        <Badge variant="secondary" className="font-display">
          {MOCK_CANDIDATES.length} candidats
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {MOCK_CANDIDATES.map((c, i) => (
          <CandidateRow key={c.id} candidate={c} index={i} />
        ))}
      </CardContent>
    </Card>
  );
}
