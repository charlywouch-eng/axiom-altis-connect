import { useState } from "react";
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
import { Bell, Mail, Shield, Search, RefreshCw, Clock, CheckCircle, XCircle, Filter } from "lucide-react";
import { formatDistanceToNow, format, subDays, subHours } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

type TimeRange = "24h" | "7d" | "30d" | "all";

const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
  profile_viewed: { label: "Profil consulté", icon: "👀", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  sector_match: { label: "Match secteur", icon: "🎯", color: "bg-accent/10 text-accent border-accent/20" },
  match_talent: { label: "Match offre", icon: "🤝", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  visa_status: { label: "Visa", icon: "📋", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  diploma_status: { label: "Diplôme", icon: "🎓", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  security_alert: { label: "Sécurité", icon: "🚨", color: "bg-destructive/10 text-destructive border-destructive/20" },
  incomplete_reminder: { label: "Relance profil", icon: "📝", color: "bg-muted text-muted-foreground border-border" },
};

function getTimeFilter(range: TimeRange): string | null {
  switch (range) {
    case "24h": return subHours(new Date(), 24).toISOString();
    case "7d": return subDays(new Date(), 7).toISOString();
    case "30d": return subDays(new Date(), 30).toISOString();
    default: return null;
  }
}

export default function AdminNotifications() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // ── Notifications (push in-app) ──
  const { data: notifications, isLoading: loadingNotifs, refetch: refetchNotifs } = useQuery({
    queryKey: ["admin-notifications", timeRange, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      const cutoff = getTimeFilter(timeRange);
      if (cutoff) query = query.gte("created_at", cutoff);
      if (typeFilter !== "all") query = query.eq("type", typeFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Anti-spam log ──
  const { data: spamLogs, isLoading: loadingSpam, refetch: refetchSpam } = useQuery({
    queryKey: ["admin-spam-log", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("talent_notification_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      const cutoff = getTimeFilter(timeRange);
      if (cutoff) query = query.gte("created_at", cutoff);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const refetchAll = () => { refetchNotifs(); refetchSpam(); };

  // ── Stats ──
  const totalNotifs = notifications?.length ?? 0;
  const unreadCount = notifications?.filter(n => !(n as any).read).length ?? 0;
  const typeBreakdown = notifications?.reduce((acc, n) => {
    const t = (n as any).type || "info";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};
  const totalSpamBlocked = spamLogs?.length ?? 0;

  // ── Unique notification types for filter ──
  const uniqueTypes = Array.from(new Set(notifications?.map(n => (n as any).type) ?? [])).sort();

  // ── Filtered notifications ──
  const filtered = notifications?.filter(n => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (n as any).title?.toLowerCase().includes(s) ||
      (n as any).message?.toLowerCase().includes(s) ||
      (n as any).user_id?.toLowerCase().includes(s)
    );
  }) ?? [];

  return (
    <DashboardLayout variant="admin">
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-6 w-6 text-accent" />
              Notifications & Anti-spam
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Suivi des notifications push et emails envoyés aux talents
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refetchAll} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Actualiser
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {(["24h", "7d", "30d", "all"] as TimeRange[]).map(r => (
              <Button
                key={r}
                size="sm"
                variant={timeRange === r ? "default" : "ghost"}
                className={`text-xs h-7 px-3 ${timeRange === r ? "bg-accent text-accent-foreground" : ""}`}
                onClick={() => setTimeRange(r)}
              >
                {r === "24h" ? "24h" : r === "7d" ? "7 jours" : r === "30d" ? "30 jours" : "Tout"}
              </Button>
            ))}
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <Filter className="h-3 w-3 mr-1.5" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {uniqueTypes.map(t => (
                <SelectItem key={t} value={t}>
                  {typeLabels[t]?.icon ?? "🔔"} {typeLabels[t]?.label ?? t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par titre, message, user_id..."
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Bell className="h-4 w-4" />}
            label="Notifications envoyées"
            value={totalNotifs}
            color="text-accent"
          />
          <StatCard
            icon={<Mail className="h-4 w-4" />}
            label="Non lues"
            value={unreadCount}
            color="text-amber-400"
          />
          <StatCard
            icon={<Shield className="h-4 w-4" />}
            label="Logs anti-spam"
            value={totalSpamBlocked}
            color="text-emerald-400"
          />
          <StatCard
            icon={<CheckCircle className="h-4 w-4" />}
            label="Types distincts"
            value={uniqueTypes.length}
            color="text-blue-400"
          />
        </div>

        {/* Type Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const meta = typeLabels[type];
                return (
                  <Badge key={type} variant="outline" className={`text-xs gap-1.5 px-3 py-1 ${meta?.color ?? ""}`}>
                    {meta?.icon ?? "🔔"} {meta?.label ?? type}: <span className="font-bold">{count}</span>
                  </Badge>
                );
              })}
              {Object.keys(typeBreakdown).length === 0 && (
                <p className="text-xs text-muted-foreground">Aucune notification sur cette période</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" />
              Notifications push ({filtered.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[420px]">
              {loadingNotifs ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Aucune notification trouvée
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs w-[100px]">Type</TableHead>
                      <TableHead className="text-xs">Titre</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Message</TableHead>
                      <TableHead className="text-xs w-[80px]">Statut</TableHead>
                      <TableHead className="text-xs w-[130px]">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((notif, i) => {
                      const n = notif as any;
                      const meta = typeLabels[n.type];
                      return (
                        <motion.tr
                          key={n.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.015 }}
                          className="border-b border-border/50 hover:bg-muted/30"
                        >
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] gap-1 ${meta?.color ?? ""}`}>
                              {meta?.icon ?? "🔔"} {meta?.label ?? n.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium max-w-[200px] truncate">{n.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate hidden md:table-cell">{n.message}</TableCell>
                          <TableCell>
                            {n.read ? (
                              <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">Lu</Badge>
                            ) : (
                              <Badge className="text-[10px] bg-accent/10 text-accent border-accent/20">Non lu</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Anti-Spam Log Table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Logs anti-spam ({spamLogs?.length ?? 0})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Chaque entrée représente un email envoyé — un seul par type et par talent par jour
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[350px]">
              {loadingSpam ? (
                <div className="flex justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : (spamLogs?.length ?? 0) === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Aucun log anti-spam sur cette période
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Type de notification</TableHead>
                      <TableHead className="text-xs">Talent (user_id)</TableHead>
                      <TableHead className="text-xs w-[160px]">Date d'envoi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {spamLogs?.map((log, i) => {
                      const l = log as any;
                      const meta = typeLabels[l.notification_type];
                      return (
                        <motion.tr
                          key={l.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.015 }}
                          className="border-b border-border/50 hover:bg-muted/30"
                        >
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] gap-1 ${meta?.color ?? ""}`}>
                              {meta?.icon ?? "📧"} {meta?.label ?? l.notification_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                            {l.talent_user_id?.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(l.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted/50 ${color}`}>{icon}</div>
          <div>
            <p className="text-2xl font-display font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
