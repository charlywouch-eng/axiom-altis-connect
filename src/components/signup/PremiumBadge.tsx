import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PremiumBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className="bg-primary text-primary-foreground border-primary hover:bg-primary/90 cursor-help gap-1.5 px-3 py-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          Premium – Certifié MINEFOP/MINREX
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
        <p className="font-semibold mb-1">Garantie conformité ROME + opérationnel jour 1</p>
        <p>
          Audit Delta Classes Miroirs + légalisation MINREX. Pour les entreprises : frais d'audit
          certifié +15 % success fee (facturé post-contrat, réduction risque onboarding 80 %).
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
