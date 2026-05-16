import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeConfig = {
    sm: { wrapper: "py-8", icon: "h-8 w-8", iconBox: "h-14 w-14", title: "text-sm", desc: "text-xs" },
    md: { wrapper: "py-12", icon: "h-10 w-10", iconBox: "h-18 w-18", title: "text-base", desc: "text-sm" },
    lg: { wrapper: "py-16", icon: "h-12 w-12", iconBox: "h-20 w-20", title: "text-lg", desc: "text-sm" },
  }[size];

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", sizeConfig.wrapper, className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-muted/50 border border-border/40 mb-4",
          size === "sm" ? "h-14 w-14" : size === "lg" ? "h-20 w-20" : "h-16 w-16"
        )}
      >
        <Icon className={cn(sizeConfig.icon, "text-muted-foreground/60")} />
      </div>
      <p className={cn("font-semibold text-foreground mb-1", sizeConfig.title)}>{title}</p>
      {description && (
        <p className={cn("text-muted-foreground max-w-xs mb-5 leading-relaxed", sizeConfig.desc)}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Button size={size === "sm" ? "sm" : "default"} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size={size === "sm" ? "sm" : "default"}
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
