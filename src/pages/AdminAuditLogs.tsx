import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, Search, AlertTriangle, Activity, Clock, Filter, RefreshCw, Bell } from "lucide-react";
import { format, formatDistanceToNow, subDays, subHours } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { label: string; severity: "critical" | "warning" | "info"; color: string }> = {
  premium_manipulation_blocked: { label: "Manipulation Premium", severity: "critical", color: "bg-destructive text-destructive-foreground" },
  premium_insert_manipulation_blocked: { label: "Insert Premium frauduleux", severity: "critical", color: "bg-destructive text-destructive-foreground" },
  subscription_manipulation_blocked: { label: "Manipulation Abonnement", severity: "critical", color: "bg-destructive text-destructive-foreground" },
  role_change_blocked: { label: "Changement de rôle bloqué", severity: "warning", color: "bg-orange-500 text-white" },
};

const SEVERITY_ICON = {
  critical: <ShieldAlert className="h-4 w-4 text-destructive" />,
  warning: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  info: <Activity className="h-4 w-4 text-muted-foreground" />,
};

const TIME_RANGES = [
  { label: "24h", value: "24h" },
  { label: "7 jours", value: "7d" },
  { label: "30 jours", value: "30d" },
  { label: "Tout", value: "all" },
];

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] ?? { label: action, severity: "info" as const, color: "bg-muted text-muted-foreground" };
}

function getTimeFilter(range: string): Date | null {
  if (range === "24h") return subHours(new Date(), 24);
  if (range === "7d") return subDays(new Date(), 7);
  if (range === "30d") return subDays(new Date(), 30);
  return null;
}

export default function AdminAuditLogs() {
  return (
    <DashboardLayout sidebarVariant="admin">
      <AuditLogsContent />
    </DashboardLayout>
  );
}

function AuditLogsContent() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("7d");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [realtimeLogs, setRealtimeLogs] = useState<AuditLog[]>([]);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["audit_logs", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      const since = getTimeFilter(timeRange);
      if (since) {
        query = query.gte("created_at", since.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("audit_logs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload) => {
          const newLog = payload.new as AuditLog;
          setRealtimeLogs((prev) => [newLog, ...prev]);
          const cfg = getActionConfig(newLog.action);
          if (cfg.severity === "critical") {
            toast({
              variant: "destructive",
              title: "🚨 Alerte sécurité",
              description: `${cfg.label} — ${formatDistanceToNow(new Date(newLog.created_at), { locale: fr, addSuffix: true })}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Merge realtime + fetched, deduplicate
  const allLogs = [...realtimeLogs, ...logs].reduce<AuditLog[]>((acc, log) => {
    if (!acc.find((l) => l.id === log.id)) acc.push(log);
    return acc;
  }, []);

  // Filter
  const filtered = allLogs.filter((log) => {
    const cfg = getActionConfig(log.action);
    if (severityFilter !== "all" && cfg.severity !== severityFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(s) ||
        log.user_id?.toLowerCase().includes(s) ||
        JSON.stringify(log.details).toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Stats
  const criticalCount = allLogs.filter((l) => getActionConfig(l.action).severity === "critical").length;
  const warningCount = allLogs.filter((l) => getActionConfig(l.action).severity === "warning").length;
  const uniqueUsers = new Set(allLogs.map((l) => l.user_id).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            Journal d'audit & Sécurité
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Surveillance en temps réel des tentatives de fraude
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">Alertes critiques</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-orange-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{warningCount}</p>
              <p className="text-xs text-muted-foreground">Avertissements</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{allLogs.length}</p>
              <p className="text-xs text-muted-foreground">Total événements</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-accent/20 p-2">
              <Bell className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{uniqueUsers}</p>
              <p className="text-xs text-muted-foreground">Utilisateurs impliqués</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher action, user_id, détails..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {TIME_RANGES.map((r) => (
              <Button
                key={r.value}
                variant={timeRange === r.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="critical">Critiques</SelectItem>
              <SelectItem value="warning">Avertissements</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Live indicator */}
      {realtimeLogs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
          </span>
          {realtimeLogs.length} nouvel(s) événement(s) en temps réel
        </div>
      )}

      {/* Table */}
      <Card>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Sév.</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun événement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => {
                  const cfg = getActionConfig(log.action);
                  return (
                    <TableRow key={log.id} className={cfg.severity === "critical" ? "bg-destructive/5" : ""}>
                      <TableCell>{SEVERITY_ICON[cfg.severity]}</TableCell>
                      <TableCell>
                        <Badge className={cfg.color}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                        {log.user_id ? log.user_id.slice(0, 8) + "…" : "—"}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {log.details ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                            {JSON.stringify(log.details)}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.created_at), { locale: fr, addSuffix: true })}
                        </div>
                        <div className="text-[10px] opacity-60">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}
