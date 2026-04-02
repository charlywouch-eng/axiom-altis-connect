import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, TrendingUp, Zap, CreditCard, UserPlus, Activity,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--card-foreground))",
  fontSize: "13px",
};

function KpiCard({ icon: Icon, title, value, change, changeLabel }: {
  icon: any; title: string; value: string | number; change?: number; changeLabel?: string;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Icon className="h-5 w-5 text-accent" />
          </div>
          {change !== undefined && (
            <Badge className={`text-[10px] gap-0.5 border-0 ${isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <p className="mt-3 text-2xl font-bold font-display">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
        {changeLabel && <p className="text-[10px] text-muted-foreground/60 mt-1">{changeLabel}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminAnalytics() {
  return (
    <DashboardLayout sidebarVariant="admin">
      <AnalyticsContent />
    </DashboardLayout>
  );
}

function AnalyticsContent() {
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");
  const queryClient = useQueryClient();

  // Realtime subscription for live updates
  useEffect(() => {
    const channels = [
      supabase.channel("analytics-profiles").on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "talent_profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["analytics-registrations"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-kpis"] });
        }
      ).subscribe(),
      supabase.channel("analytics-roles").on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["analytics-kpis"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-registrations"] });
        }
      ).subscribe(),
      supabase.channel("analytics-premium").on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "talent_profiles", filter: "is_premium=eq.true" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["analytics-kpis"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-conversions"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-payment-conversions"] });
        }
      ).subscribe(),
      supabase.channel("analytics-funnel-rt").on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "funnel_events" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["analytics-funnel-summary"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-payment-conversions"] });
        }
      ).subscribe(),
      supabase.channel("analytics-leads-rt").on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["analytics-kpis"] });
          queryClient.invalidateQueries({ queryKey: ["analytics-payment-conversions"] });
        }
      ).subscribe(),
    ];
    return () => { channels.forEach((c) => supabase.removeChannel(c)); };
  }, [queryClient]);

  const days = Number(period);
  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }, [days]);

  // KPIs
  const { data: kpis } = useQuery({
    queryKey: ["analytics-kpis", period],
    queryFn: async () => {
      const prevSince = new Date();
      prevSince.setDate(prevSince.getDate() - days * 2);

      const [talents, entreprises, premiums, leads, prevTalents, prevLeads] = await Promise.all([
        supabase.from("talent_profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "entreprise").gte("id", ""),
        supabase.from("talent_profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("talent_profiles").select("id", { count: "exact", head: true })
          .gte("created_at", prevSince.toISOString()).lt("created_at", since),
        supabase.from("leads").select("id", { count: "exact", head: true })
          .gte("created_at", prevSince.toISOString()).lt("created_at", since),
      ]);

      const currentTalents = talents.count ?? 0;
      const previousTalents = prevTalents.count ?? 0;
      const talentChange = previousTalents > 0 ? Math.round(((currentTalents - previousTalents) / previousTalents) * 100) : 0;

      const currentLeads = leads.count ?? 0;
      const previousLeadsCount = prevLeads.count ?? 0;
      const leadChange = previousLeadsCount > 0 ? Math.round(((currentLeads - previousLeadsCount) / previousLeadsCount) * 100) : 0;

      const premiumCount = premiums.count ?? 0;
      const conversionRate = currentTalents > 0 ? Math.round((premiumCount / (currentTalents || 1)) * 100) : 0;

      return {
        newTalents: currentTalents,
        talentChange,
        entreprises: entreprises.count ?? 0,
        premiums: premiumCount,
        leads: currentLeads,
        leadChange,
        conversionRate,
        revenue: premiumCount * 29,
      };
    },
  });

  // Daily registrations
  const { data: registrations = [] } = useQuery({
    queryKey: ["analytics-registrations", period],
    queryFn: async () => {
      const [talentsRes] = await Promise.all([
        supabase.from("talent_profiles").select("created_at").gte("created_at", since).order("created_at"),
      ]);
      const talents = talentsRes.data ?? [];

      // Build daily map
      const map: Record<string, { talents: number; total: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        map[d.toISOString().slice(0, 10)] = { talents: 0, total: 0 };
      }

      talents.forEach((t) => {
        const key = t.created_at.slice(0, 10);
        if (map[key]) {
          map[key].talents++;
          map[key].total++;
        }
      });

      return Object.entries(map).map(([date, v]) => ({
        date: date.slice(5),
        talents: v.talents,
        total: v.total,
      }));
    },
  });

  // Conversions (leads → premium)
  const { data: conversions = [] } = useQuery({
    queryKey: ["analytics-conversions", period],
    queryFn: async () => {
      const [leadsRes, funnelRes] = await Promise.all([
        supabase.from("leads").select("created_at, status").gte("created_at", since).order("created_at"),
        (supabase.from as any)("funnel_events").select("event_name, created_at").gte("created_at", since).order("created_at"),
      ]);
      const leads = leadsRes.data ?? [];
      const funnelData = (funnelRes.data ?? []) as { event_name: string; created_at: string }[];

      const map: Record<string, { leads: number; premium: number; signups: number }> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        map[d.toISOString().slice(0, 10)] = { leads: 0, premium: 0, signups: 0 };
      }

      leads.forEach((l) => {
        const key = l.created_at.slice(0, 10);
        if (map[key]) {
          map[key].leads++;
          if (l.status === "premium_paid") map[key].premium++;
        }
      });

      funnelData.forEach((f) => {
        const key = f.created_at.slice(0, 10);
        if (map[key] && f.event_name === "signup_completed") {
          map[key].signups++;
        }
      });

      return Object.entries(map).map(([date, v]) => ({
        date: date.slice(5),
        leads: v.leads,
        premium: v.premium,
        signups: v.signups,
      }));
    },
  });

  // Funnel summary
  const { data: funnelSummary } = useQuery({
    queryKey: ["analytics-funnel-summary", period],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("funnel_events")
        .select("event_name")
        .gte("created_at", since);
      if (error) throw error;
      const events = data as { event_name: string }[];
      const counts: Record<string, number> = {};
      events.forEach((e) => { counts[e.event_name] = (counts[e.event_name] || 0) + 1; });
      return counts;
    },
  });

  const funnelSteps = [
    { key: "signup_started", label: "Démarrage", color: "hsl(var(--accent))" },
    { key: "lead_form_submitted", label: "Formulaire", color: "hsl(210, 70%, 55%)" },
    { key: "lead_score_viewed", label: "Score vu", color: "hsl(45, 80%, 55%)" },
    { key: "lead_payment_clicked", label: "Paiement", color: "hsl(340, 65%, 55%)" },
    { key: "signup_completed", label: "Terminé", color: "hsl(160, 60%, 45%)" },
  ];

  const funnelBarData = funnelSteps.map((s) => ({
    name: s.label,
    value: funnelSummary?.[s.key] ?? 0,
    fill: s.color,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20">
            <Activity className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Analytics temps réel</h2>
            <p className="text-sm text-muted-foreground">Inscriptions, conversions et revenus</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">Temps réel</span>
          <div className="ml-3 flex gap-1">
            {(["7", "30", "90"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setPeriod(p)}
              >
                {p}j
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={UserPlus}
          title={`Nouveaux talents (${period}j)`}
          value={kpis?.newTalents ?? 0}
          change={kpis?.talentChange}
          changeLabel="vs période précédente"
        />
        <KpiCard
          icon={TrendingUp}
          title={`Leads captés (${period}j)`}
          value={kpis?.leads ?? 0}
          change={kpis?.leadChange}
          changeLabel="vs période précédente"
        />
        <KpiCard
          icon={CreditCard}
          title="Pack ALTIS activés"
          value={kpis?.premiums ?? 0}
        />
        <KpiCard
          icon={Zap}
          title="Taux de conversion"
          value={`${kpis?.conversionRate ?? 0}%`}
          changeLabel={`${kpis?.revenue ?? 0} € de revenus estimés`}
        />
      </div>

      {/* Charts row 1: Registrations + Conversions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily registrations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-accent" />
              Inscriptions quotidiennes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={registrations}>
                <defs>
                  <linearGradient id="gradTalents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="talents"
                  name="Talents"
                  stroke="hsl(var(--accent))"
                  fill="url(#gradTalents)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily conversions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-accent" />
              Conversions quotidiennes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={conversions}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(210, 70%, 55%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="premium" name="Premium" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="signups" name="Inscriptions" stroke="hsl(160, 60%, 45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Funnel overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-accent" />
            Tunnel de conversion ({period} jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnelBarData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="name" fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} width={120} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Événements" radius={[0, 6, 6, 0]}>
                {funnelBarData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Conversion rates */}
          <div className="flex flex-wrap gap-3 mt-4">
            {funnelSteps.map((step, i) => {
              const count = funnelSummary?.[step.key] ?? 0;
              const firstCount = funnelSummary?.[funnelSteps[0].key] ?? 0;
              const pct = firstCount > 0 ? Math.round((count / firstCount) * 100) : 0;
              return (
                <div key={step.key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: step.color }} />
                  <span className="text-xs font-medium">{step.label}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5">{count}</Badge>
                  {i > 0 && <span className="text-[10px] text-muted-foreground">{pct}%</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue estimate */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20">
            <CreditCard className="h-7 w-7 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Revenus estimés (Pack ALTIS × 29 €)</p>
            <p className="text-3xl font-bold font-display text-accent">{kpis?.revenue ?? 0} €</p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis?.premiums ?? 0} activations • Taux de conversion : {kpis?.conversionRate ?? 0}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
