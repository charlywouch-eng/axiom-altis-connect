import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-muted/60", className)} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Bone className="h-10 w-10 rounded-xl" />
        <Bone className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Bone className="h-8 w-24" />
        <Bone className="h-4 w-36" />
        <Bone className="h-3 w-28" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-3">
          <Bone className={cn("h-4", i === 0 ? "w-32" : i === cols - 1 ? "w-16" : "w-24")} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-3 text-left">
                <Bone className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card">
      <Bone className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Bone className="h-4 w-48" />
        <Bone className="h-3 w-32" />
      </div>
      <Bone className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function CardContentSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid gap-4", count === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 lg:grid-cols-4")}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
