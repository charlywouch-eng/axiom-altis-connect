import { Scale } from "lucide-react";

export function CesedaLegalNotice() {
  return (
    <div className="mt-4 pt-3 border-t border-border/20 text-center">
      <p className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50 leading-relaxed max-w-2xl mx-auto">
        <Scale className="h-3 w-3 shrink-0" />
        Seules les autorités françaises (ANEF + Préfecture) sont habilitées à délivrer un visa de travail — Code CESEDA, Articles L.313-10 et R.313-10.
      </p>
    </div>
  );
}
