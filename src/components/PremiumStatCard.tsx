import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface PremiumStatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  accent?: "gold" | "green" | "default";
}

export function PremiumStatCard({ icon: Icon, title, value, accent = "default" }: PremiumStatCardProps) {
  const iconBg = accent === "gold"
    ? "bg-gradient-to-br from-gold/15 to-ocre/10"
    : accent === "green"
    ? "bg-accent/10"
    : "bg-muted";

  const iconColor = accent === "gold"
    ? "text-gold"
    : accent === "green"
    ? "text-accent"
    : "text-muted-foreground";

  const valueClass = accent === "gold"
    ? "text-gradient-gold"
    : "";

  return (
    <Card className="group border-border/50 transition-all hover:shadow-xl hover:shadow-gold/5 hover:-translate-y-0.5">
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} transition-transform group-hover:scale-110`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={`text-2xl font-bold font-display ${valueClass}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
