import { Info, X } from "lucide-react";
import { useState } from "react";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative z-[60] bg-[#FEF3C7] text-gray-700 text-center text-xs sm:text-sm font-medium py-1.5 px-4">
      <span className="inline-flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
        Mode démo 17 mars 2026 – Emails envoyés via canal alternatif sécurisé (transition Resend en cours)
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-amber-200/50 transition-colors"
        aria-label="Fermer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
