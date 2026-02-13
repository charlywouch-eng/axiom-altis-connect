import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Stamp, CreditCard, PenLine, Send, ShieldCheck, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface TalentDossierModalProps {
  talent: {
    id: string;
    full_name: string | null;
    rome_code: string | null;
    rome_label: string | null;
    visa_status: string;
    apostille_date: string | null;
    compliance_score: number;
    country: string | null;
    french_level: string | null;
    experience_years: number | null;
    skills: string[] | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const documents = [
  { icon: FileText, label: "Scan diplôme + tampon MINFOG", status: "Vérifié" },
  { icon: CreditCard, label: "Copie passeport + visa", status: "Disponible" },
  { icon: PenLine, label: "Contrat type pré-rempli", status: "Prêt" },
];

export default function TalentDossierModal({ talent, open, onOpenChange }: TalentDossierModalProps) {
  const handleSendOffer = () => {
    toast.success(`Offre envoyée à ${talent.full_name}`, {
      description: "Un email avec le lien de signature DocuSign a été envoyé.",
    });
    onOpenChange(false);
  };

  const scoreColor = talent.compliance_score >= 80 ? "text-success" : talent.compliance_score >= 50 ? "text-accent" : "text-destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
              <ShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl">{talent.full_name || "Talent"}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-0.5">
                {talent.rome_code && (
                  <span className="font-mono text-accent text-xs">{talent.rome_code}</span>
                )}
                {talent.rome_label && <span>· {talent.rome_label}</span>}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <InfoItem label="Pays" value={talent.country || "—"} />
          <InfoItem label="Français" value={talent.french_level || "—"} />
          <InfoItem label="Expérience" value={talent.experience_years ? `${talent.experience_years} ans` : "—"} />
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Score conformité</p>
            <p className={`font-display text-2xl font-bold ${scoreColor}`}>
              {talent.compliance_score}<span className="text-muted-foreground text-sm font-normal">/100</span>
            </p>
          </div>
        </div>

        {/* Skills */}
        {talent.skills && talent.skills.length > 0 && (
          <div className="mt-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">Compétences</p>
            <div className="flex flex-wrap gap-1.5">
              {talent.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Documents */}
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Documents du dossier</p>
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.label}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.label}</p>
                  </div>
                  <Badge className="bg-success/15 text-success border border-success/30 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {doc.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* CTA */}
        <Button
          onClick={handleSendOffer}
          className="w-full bg-success text-success-foreground hover:bg-success/90 shadow-lg shadow-success/20 border-0 gap-2 py-6 text-base font-semibold rounded-xl"
        >
          <Send className="h-4 w-4" /> Envoyer offre + signature DocuSign
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
