import { checkPasswordStrength, STRENGTH_LABELS } from "@/lib/passwordSecurity";
import { ShieldAlert } from "lucide-react";

interface Props {
  password: string;
  hibpCount?: number | null;
}

export function PasswordStrengthBar({ password, hibpCount }: Props) {
  if (!password) return null;
  const { score, issues } = checkPasswordStrength(password);
  const meta = STRENGTH_LABELS[score];

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? meta.color : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="text-xs text-primary-foreground/50">
        Sécurité : <span className="font-semibold text-primary-foreground/70">{meta.label}</span>
      </p>
      {issues.length > 0 && (
        <ul className="text-xs text-primary-foreground/40 space-y-0.5">
          {issues.map((issue) => (
            <li key={issue}>• {issue}</li>
          ))}
        </ul>
      )}
      {hibpCount != null && hibpCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            Ce mot de passe apparaît dans <strong>{hibpCount.toLocaleString("fr-FR")}</strong> fuites de données. Choisissez-en un autre.
          </span>
        </div>
      )}
    </div>
  );
}
