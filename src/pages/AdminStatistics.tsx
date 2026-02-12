import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, GraduationCap, Star, TrendingUp, Award } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--primary))",
  "hsl(210, 70%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(45, 80%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(270, 55%, 55%)",
  "hsl(20, 75%, 55%)",
];

interface TalentProfile {
  id: string;
  full_name: string | null;
  country: string | null;
  french_level: string | null;
  experience_years: number | null;
  skills: string[] | null;
  score: number | null;
  available: boolean | null;
}

function StatCard({ icon: Icon, title, value, subtitle }: { icon: any; title: string; value: string; subtitle?: string }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = fn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export default function AdminStatistics() {
  const { data: talents = [], isLoading } = useQuery({
    queryKey: ["admin_talent_stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*");
      if (error) throw error;
      return (data || []) as TalentProfile[];
    },
  });

  const countryData = Object.entries(groupBy(talents, (t) => t.country || "Inconnu"))
    .map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);

  const frenchLevelData = Object.entries(groupBy(talents, (t) => t.french_level || "Non renseigné"))
    .map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);

  const skillCounts: Record<string, number> = {};
  talents.forEach((t) => {
    (t.skills || []).forEach((s) => {
      skillCounts[s] = (skillCounts[s] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const expBuckets = [
    { name: "0-2 ans", min: 0, max: 2 },
    { name: "3-5 ans", min: 3, max: 5 },
    { name: "6-10 ans", min: 6, max: 10 },
    { name: "10+ ans", min: 11, max: 100 },
  ];
  const expData = expBuckets.map((b) => ({
    name: b.name,
    count: talents.filter((t) => (t.experience_years ?? 0) >= b.min && (t.experience_years ?? 0) <= b.max).length,
  }));

  const scoreBuckets = [
    { name: "0-50", min: 0, max: 50 },
    { name: "51-70", min: 51, max: 70 },
    { name: "71-85", min: 71, max: 85 },
    { name: "86-100", min: 86, max: 100 },
  ];
  const scoreData = scoreBuckets.map((b) => ({
    name: b.name,
    count: talents.filter((t) => (t.score ?? 0) >= b.min && (t.score ?? 0) <= b.max).length,
  }));

  const avgScore = talents.length > 0
    ? Math.round(talents.reduce((s, t) => s + (t.score ?? 0), 0) / talents.length)
    : 0;
  const avgExp = talents.length > 0
    ? (talents.reduce((s, t) => s + (t.experience_years ?? 0), 0) / talents.length).toFixed(1)
    : "0";
  const availableCount = talents.filter((t) => t.available).length;

  const customTooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--card-foreground))",
    fontSize: "13px",
  };

  return (
    <DashboardLayout sidebarVariant="admin">
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Statistiques des talents</h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : talents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Aucun talent importé. Importez des talents via CSV pour voir les statistiques.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Users} title="Total talents" value={String(talents.length)} />
              <StatCard icon={Star} title="Score moyen" value={`${avgScore}/100`} />
              <StatCard icon={TrendingUp} title="Expérience moy." value={`${avgExp} ans`} />
              <StatCard icon={Award} title="Disponibles" value={`${availableCount}/${talents.length}`} />
            </div>

            {/* Charts Row 1: Country + French Level */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4 text-accent" />
                    Répartition par pays
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={countryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={3}
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={true}
                      >
                        {countryData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={customTooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4 text-accent" />
                    Niveau de français
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={frenchLevelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="value" name="Talents" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2: Skills + Experience */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top compétences</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topSkills}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        angle={-35}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="count" name="Talents" fill="hsl(210, 70%, 55%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Expérience professionnelle</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={expData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <Tooltip contentStyle={customTooltipStyle} />
                      <Bar dataKey="count" name="Talents" fill="hsl(160, 60%, 45%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribution des scores</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="count" name="Talents" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
