import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type LucideIcon } from "lucide-react";

type TensionLevel = "critical" | "high" | "medium" | "low" | "none";

interface PremiumStatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  accent?: "blue" | "green" | "default";
  tensionLevel?: TensionLevel;
  tensionLabel?: string;
  subtitle?: string;
}

const tensionConfig: Record<TensionLevel, { className: string; defaultLabel: string }> = {
  critical: { className: "bg-destructive/10 text-destructive border-destructive/20", defaultLabel: "Flux Critique" },
  high: { className: "bg-orange-500/10 text-orange-600 border-orange-500/20", defaultLabel: "Tension Haute" },
  medium: { className: "bg-amber-500/10 text-amber-600 border-amber-500/20", defaultLabel: "Modéré" },
  low: { className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", defaultLabel: "Stable" },
  none: { className: "bg-muted text-muted-foreground border-border", defaultLabel: "—" },
};

export function PremiumStatCard({
  icon: Icon,
  title,
  value,
  accent = "default",
  tensionLevel,
  tensionLabel,
  subtitle,
}: PremiumStatCardProps) {
  const iconColor =
    accent === "blue"
      ? "text-accent"
      : accent === "green"
      ? "text-emerald-500"
      : "text-muted-foreground";

  const tension = tensionLevel ? tensionConfig[tensionLevel] : null;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border/40 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5">
      <CardContent className="flex flex-col gap-4 p-6">
        {/* Top row: icon + tension badge */}
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary transition-transform duration-300 group-hover:scale-110">
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          {tension && (
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold uppercase tracking-wider border ${tension.className}`}
            >
              {tensionLabel || tension.defaultLabel}
            </Badge>
          )}
        </div>

        {/* Value + title */}
        <div className="space-y-1">
          <p className="text-3xl font-bold font-display tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
