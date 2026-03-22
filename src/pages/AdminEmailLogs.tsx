import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const TIME_RANGES = [
  { label: "24 heures", value: "24h", hours: 24 },
  { label: "7 jours", value: "7d", hours: 168 },
  { label: "30 jours", value: "30d", hours: 720 },
] as const;

const STATUS_OPTIONS = [
  { label: "Tous", value: "all" },
  { label: "Envoyé", value: "sent" },
  { label: "Échoué", value: "failed" },
] as const;

function statusBadge(status: string) {
  switch (status) {
    case "sent":
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" />Envoyé</Badge>;
    case "failed":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
    default:
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
  }
}

export default function AdminEmailLogs() {
  const [timeRange, setTimeRange] = useState("7d");
  const [statusFilter, setStatusFilter] = useState("all");

  const hours = TIME_RANGES.find((t) => t.value === timeRange)?.hours ?? 168;
  const since = new Date(Date.now() - hours * 3600_000).toISOString();

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["email_send_log", timeRange, statusFilter],
    queryFn: async () => {
      let q = (supabase as any)
        .from("email_send_log")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        q = q.eq("status", statusFilter);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        template_name: string;
        recipient_email: string;
        status: string;
        error_message: string | null;
        metadata: Record<string, unknown> | null;
        created_at: string;
      }>;
    },
  });

  const total = logs?.length ?? 0;
  const sent = logs?.filter((l) => l.status === "sent").length ?? 0;
  const failed = logs?.filter((l) => l.status === "failed").length ?? 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="w-6 h-6 text-accent" />
              Historique des emails
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Suivi des confirmations Pack ALTIS envoyées via Resend</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground">Total emails</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{sent}</p>
              <p className="text-xs text-muted-foreground">Envoyés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-destructive">{failed}</p>
              <p className="text-xs text-muted-foreground">Échoués</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {logs && logs.length > 0 && (() => {
          const sinceDate = new Date(since);
          const days = eachDayOfInterval({ start: sinceDate, end: new Date() });
          const chartData = days.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayLogs = logs.filter((l) => l.created_at.startsWith(dayStr));
            return {
              date: format(day, "dd MMM", { locale: fr }),
              envoyés: dayLogs.filter((l) => l.status === "sent").length,
              échoués: dayLogs.filter((l) => l.status === "failed").length,
            };
          });
          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Évolution des envois par jour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="envoyés" stroke="hsl(var(--accent))" fill="url(#gradSent)" strokeWidth={2} />
                      <Area type="monotone" dataKey="échoués" stroke="hsl(var(--destructive))" fill="url(#gradFailed)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Logs d'envoi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Chargement…</p>
            ) : !logs?.length ? (
              <p className="text-center text-muted-foreground py-8">Aucun email trouvé pour cette période.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Destinataire</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Erreur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.template_name}</TableCell>
                        <TableCell className="text-sm">{log.recipient_email}</TableCell>
                        <TableCell>{statusBadge(log.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                          {log.error_message || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
