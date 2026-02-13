import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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
  const [displayValue, setDisplayValue] = useState(0);
  const isNumeric = /^\d+$/.test(value);
  const numericValue = isNumeric ? parseInt(value, 10) : 0;

  useEffect(() => {
    if (!isNumeric) return;

    let animationFrame: number;
    let current = 0;
    const duration = 1200; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      current = Math.floor(progress * numericValue);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [numericValue, isNumeric]);

  const iconColor =
    accent === "blue"
      ? "text-accent"
      : accent === "green"
      ? "text-emerald-500"
      : "text-muted-foreground";

  const tension = tensionLevel ? tensionConfig[tensionLevel] : null;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.15,
        duration: 0.4,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="group relative overflow-hidden rounded-2xl border-border/40 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5">
        <CardContent className="flex flex-col gap-4 p-6">
          {/* Top row: icon + tension badge */}
          <motion.div
            className="flex items-start justify-between"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary transition-transform duration-300 group-hover:scale-110"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </motion.div>
            {tension && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold uppercase tracking-wider border ${tension.className}`}
                >
                  {tensionLabel || tension.defaultLabel}
                </Badge>
              </motion.div>
            )}
          </motion.div>

          {/* Value + title */}
          <motion.div
            className="space-y-1"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-3xl font-bold font-display tracking-tight text-foreground">
              {isNumeric ? displayValue : value}
            </p>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground/70">{subtitle}</p>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
