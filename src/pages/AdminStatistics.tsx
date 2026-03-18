import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, GraduationCap, Star, TrendingUp, Award, X, Download, FileImage, FileText, Zap, FileCheck, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, AreaChart, Area,
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
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedFrenchLevel, setSelectedFrenchLevel] = useState<string | null>(null);
  const [scoreRange, setScoreRange] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const captureSnapshot = useCallback(async () => {
    if (!dashboardRef.current) return null;
    return html2canvas(dashboardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--background").trim()
        ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--background").trim()})`
        : "#ffffff",
    });
  }, []);

  const exportAsImage = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = await captureSnapshot();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `statistiques-talents-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image exportée avec succès");
    } catch {
      toast.error("Erreur lors de l'export en image");
    } finally {
      setIsExporting(false);
    }
  }, [captureSnapshot]);

  const exportAsPdf = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = await captureSnapshot();
      if (!canvas) return;
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? "landscape" : "portrait",
        unit: "px",
        format: [imgWidth, imgHeight],
      });
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`statistiques-talents-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF exporté avec succès");
    } catch {
      toast.error("Erreur lors de l'export en PDF");
    } finally {
      setIsExporting(false);
    }
  }, [captureSnapshot]);

  const [funnelPeriod, setFunnelPeriod] = useState<"7" | "30" | "90">("30");

  // Funnel analytics query
  const { data: funnelEvents = [] } = useQuery({
    queryKey: ["admin_funnel_stats", funnelPeriod],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - Number(funnelPeriod));
      const { data, error } = await (supabase.from as any)("funnel_events")
        .select("event_name, rome_code, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as { event_name: string; rome_code: string | null; created_at: string }[];
    },
  });

  // Daily leads over last 30 days
  const { data: dailyLeads = [] } = useQuery({
    queryKey: ["admin_daily_leads"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("leads")
        .select("created_at, status")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as { created_at: string; status: string }[];
    },
  });

  const dailyLeadsChart = useMemo(() => {
    const map: Record<string, { total: number; premium: number }> = {};
    // Pre-fill 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { total: 0, premium: 0 };
    }
    dailyLeads.forEach((l) => {
      const key = l.created_at.slice(0, 10);
      if (map[key]) {
        map[key].total++;
        if (l.status === "premium_paid") map[key].premium++;
      }
    });
    return Object.entries(map).map(([date, v]) => ({
      date: date.slice(5), // MM-DD
      total: v.total,
      premium: v.premium,
    }));
  }, [dailyLeads]);

  const funnelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    funnelEvents.forEach((e) => {
      counts[e.event_name] = (counts[e.event_name] || 0) + 1;
    });
    return counts;
  }, [funnelEvents]);

  const funnelSteps = [
    { key: "lead_form_submitted", label: "Lead soumis", color: "hsl(var(--accent))" },
    { key: "lead_payment_clicked", label: "Clic paiement 4,99 €", color: "hsl(210, 70%, 55%)" },
    { key: "payment_success", label: "Paiement réussi", color: "hsl(160, 60%, 45%)" },
    { key: "signup_started", label: "Inscription démarrée", color: "hsl(var(--primary))" },
  ];

  const ga4FunnelSteps = [
    { key: "inscription_start", label: "Inscription démarrée", color: "hsl(var(--accent))" },
    { key: "rgpd_accepted", label: "RGPD accepté", color: "hsl(210, 70%, 55%)" },
    { key: "paiement_4_99_started", label: "Paiement 4,99 € cliqué", color: "hsl(45, 80%, 55%)" },
    { key: "paiement_29_started", label: "Paiement 29 € cliqué", color: "hsl(160, 60%, 45%)" },
  ];

  const funnelChartData = funnelSteps.map((s) => ({
    name: s.label,
    count: funnelCounts[s.key] || 0,
    fill: s.color,
  }));

  const ga4FunnelChartData = ga4FunnelSteps.map((s) => ({
    name: s.label,
    count: funnelCounts[s.key] || 0,
    fill: s.color,
  }));

  // Signup-light progressive funnel steps
  const signupLightSteps = [
    { key: "signup_started", label: "Contact", color: "hsl(var(--accent))" },
    { key: "lead_form_submitted", label: "Secteur", color: "hsl(210, 70%, 55%)" },
    { key: "lead_score_viewed", label: "Expérience", color: "hsl(45, 80%, 55%)" },
    { key: "lead_payment_clicked", label: "Pays / Score", color: "hsl(340, 65%, 55%)" },
    { key: "signup_completed", label: "Confirmé", color: "hsl(160, 60%, 45%)" },
  ];

  const signupLightData = signupLightSteps.map((s, i) => {
    const count = funnelCounts[s.key] || 0;
    const first = funnelCounts[signupLightSteps[0].key] || 0;
    const prev = i === 0 ? count : funnelCounts[signupLightSteps[i - 1].key] || 0;
    return {
      label: s.label,
      count,
      color: s.color,
      pctOfTotal: first > 0 ? Math.round((count / first) * 100) : 0,
      stepRate: i === 0 ? 100 : prev > 0 ? Math.round((count / prev) * 100) : 0,
    };
  });

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

  // Filtrer les talents selon les sélections
  const filteredTalents = useMemo(() => {
    return talents.filter((t) => {
      const countryMatch = !selectedCountry || t.country === selectedCountry;
      const frenchMatch = !selectedFrenchLevel || t.french_level === selectedFrenchLevel;
      const score = t.score ?? 0;
      let scoreMatch = true;
      
      switch (scoreRange) {
        case "0-50":
          scoreMatch = score >= 0 && score <= 50;
          break;
        case "51-70":
          scoreMatch = score >= 51 && score <= 70;
          break;
        case "71-85":
          scoreMatch = score >= 71 && score <= 85;
          break;
        case "86-100":
          scoreMatch = score >= 86 && score <= 100;
          break;
        default:
          scoreMatch = true;
      }
      
      return countryMatch && frenchMatch && scoreMatch;
    });
  }, [talents, selectedCountry, selectedFrenchLevel, scoreRange]);

  // Obtenir les listes uniques pour les dropdowns
  const countries = useMemo(() => {
    return Array.from(new Set(talents.map((t) => t.country).filter(Boolean))).sort();
  }, [talents]);

  const frenchLevels = useMemo(() => {
    return Array.from(new Set(talents.map((t) => t.french_level).filter(Boolean))).sort();
  }, [talents]);

  // Weekly quote requests
  const { data: quoteRequests = [] } = useQuery({
    queryKey: ["admin_weekly_quotes"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data, error } = await (supabase.from as any)("quote_requests")
        .select("created_at, status")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as { created_at: string; status: string }[];
    },
  });

  const weeklyQuotesChart = useMemo(() => {
    const map: Record<string, { total: number; contacte: number; converti: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const key = weekStart.toISOString().slice(0, 10);
      map[key] = { total: 0, contacte: 0, converti: 0 };
    }
    const weekKeys = Object.keys(map).sort();
    quoteRequests.forEach((q) => {
      const qDate = new Date(q.created_at);
      const weekStart = new Date(qDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const key = weekStart.toISOString().slice(0, 10);
      if (map[key]) {
        map[key].total++;
        if (q.status === "contacte" || q.status === "en_cours") map[key].contacte++;
        if (q.status === "converti") map[key].converti++;
      }
    });
    return weekKeys.map((key) => ({
      semaine: `S${key.slice(5, 7)}/${key.slice(8, 10)}`,
      total: map[key].total,
      contacte: map[key].contacte,
      converti: map[key].converti,
    }));
  }, [quoteRequests]);


  const countryData = Object.entries(groupBy(filteredTalents, (t) => t.country || "Inconnu"))
    .map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);

  const frenchLevelData = Object.entries(groupBy(filteredTalents, (t) => t.french_level || "Non renseigné"))
    .map(([name, items]) => ({ name, value: items.length }))
    .sort((a, b) => b.value - a.value);

  const skillCounts: Record<string, number> = {};
  filteredTalents.forEach((t) => {
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
    count: filteredTalents.filter((t) => (t.experience_years ?? 0) >= b.min && (t.experience_years ?? 0) <= b.max).length,
  }));

  const scoreBuckets = [
    { name: "0-50", min: 0, max: 50 },
    { name: "51-70", min: 51, max: 70 },
    { name: "71-85", min: 71, max: 85 },
    { name: "86-100", min: 86, max: 100 },
  ];
  const scoreData = scoreBuckets.map((b) => ({
    name: b.name,
    count: filteredTalents.filter((t) => (t.score ?? 0) >= b.min && (t.score ?? 0) <= b.max).length,
  }));

  const avgScore = filteredTalents.length > 0
    ? Math.round(filteredTalents.reduce((s, t) => s + (t.score ?? 0), 0) / filteredTalents.length)
    : 0;
  const avgExp = filteredTalents.length > 0
    ? (filteredTalents.reduce((s, t) => s + (t.experience_years ?? 0), 0) / filteredTalents.length).toFixed(1)
    : "0";
  const availableCount = filteredTalents.filter((t) => t.available).length;

  const customTooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--card-foreground))",
    fontSize: "13px",
  };

  return (
    <DashboardLayout sidebarVariant="admin">
      <div className="space-y-6" ref={dashboardRef}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-display text-2xl font-bold">Statistiques des talents</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportAsImage} disabled={isExporting || talents.length === 0}>
              <FileImage className="h-4 w-4 mr-2" />
              Image
            </Button>
            <Button variant="outline" size="sm" onClick={exportAsPdf} disabled={isExporting || talents.length === 0}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pays</label>
                <Select value={selectedCountry || "all-countries"} onValueChange={(val) => setSelectedCountry(val === "all-countries" ? null : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-countries">Tous les pays</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Niveau de français</label>
                <Select value={selectedFrenchLevel || "all-levels"} onValueChange={(val) => setSelectedFrenchLevel(val === "all-levels" ? null : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les niveaux" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-levels">Tous les niveaux</SelectItem>
                    {frenchLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Plage de score</label>
                <Select value={scoreRange} onValueChange={setScoreRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les scores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les scores</SelectItem>
                    <SelectItem value="0-50">0-50</SelectItem>
                    <SelectItem value="51-70">51-70</SelectItem>
                    <SelectItem value="71-85">71-85</SelectItem>
                    <SelectItem value="86-100">86-100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCountry(null);
                    setSelectedFrenchLevel(null);
                    setScoreRange("all");
                  }}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Résultats : <strong>{filteredTalents.length}</strong> talent{filteredTalents.length !== 1 ? "s" : ""} sur {talents.length}
            </p>
          </CardContent>
        </Card>

        {/* Funnel Conversion */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-accent" />
              Tunnel de conversion
            </CardTitle>
            <div className="flex gap-1">
              {(["7", "30", "90"] as const).map((p) => (
                <Button
                  key={p}
                  variant={funnelPeriod === p ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setFunnelPeriod(p)}
                >
                  {p}j
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {funnelEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun événement de funnel enregistré.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-4 mb-6">
                  {funnelSteps.map((s, i) => {
                    const count = funnelCounts[s.key] || 0;
                    const prevCount = i === 0 ? count : funnelCounts[funnelSteps[i - 1].key] || 0;
                    const rate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
                    return (
                      <div key={s.key} className="rounded-lg p-3 text-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                        <p className="text-2xl font-bold" style={{ color: s.color }}>{count}</p>
                        <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                        {i > 0 && <p className="text-[10px] font-semibold mt-1" style={{ color: s.color }}>{rate}% conv.</p>}
                      </div>
                    );
                  })}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={funnelChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="count" name="Événements" radius={[6, 6, 0, 0]}>
                      {funnelChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>

        {/* GA4 Conversion Funnel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Funnel GA4 – Acquisition &amp; Paiement
            </CardTitle>
            <div className="flex gap-1">
              {(["7", "30", "90"] as const).map((p) => (
                <Button
                  key={p}
                  variant={funnelPeriod === p ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setFunnelPeriod(p)}
                >
                  {p}j
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {funnelEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun événement GA4 enregistré sur cette période.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-4 mb-6">
                  {ga4FunnelSteps.map((s, i) => {
                    const count = funnelCounts[s.key] || 0;
                    const prevCount = i === 0 ? count : funnelCounts[ga4FunnelSteps[i - 1].key] || 0;
                    const rate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
                    return (
                      <div key={s.key} className="rounded-lg p-3 text-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                        <p className="text-2xl font-bold" style={{ color: s.color }}>{count}</p>
                        <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                        {i > 0 && <p className="text-[10px] font-semibold mt-1" style={{ color: s.color }}>{rate}% conv.</p>}
                      </div>
                    );
                  })}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ga4FunnelChartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="count" name="Événements" radius={[6, 6, 0, 0]}>
                      {ga4FunnelChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>

        {/* Signup-Light Visual Funnel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-accent" />
              Entonnoir Signup-Light – Drop-offs par étape
            </CardTitle>
            <div className="flex gap-1">
              {(["7", "30", "90"] as const).map((p) => (
                <Button
                  key={p}
                  variant={funnelPeriod === p ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setFunnelPeriod(p)}
                >
                  {p}j
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {signupLightData[0].count === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun événement signup-light enregistré sur cette période.</p>
            ) : (
              <div className="space-y-3">
                {signupLightData.map((step, i) => {
                  const maxCount = signupLightData[0].count;
                  const barWidth = maxCount > 0 ? Math.max(8, (step.count / maxCount) * 100) : 0;
                  const dropoff = i > 0 ? signupLightData[i - 1].count - step.count : 0;
                  return (
                    <div key={step.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: step.color }}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium">{step.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {i > 0 && dropoff > 0 && (
                            <span className="text-destructive font-medium">-{dropoff} ({100 - step.stepRate}%)</span>
                          )}
                          <span className="font-bold text-foreground">{step.count}</span>
                          <span className="text-muted-foreground">({step.pctOfTotal}%)</span>
                        </div>
                      </div>
                      <div className="relative h-8 w-full rounded-md bg-muted/50 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-md transition-all duration-700 ease-out"
                          style={{
                            width: `${barWidth}%`,
                            background: `linear-gradient(90deg, ${step.color}, ${step.color}cc)`,
                            opacity: 0.85,
                          }}
                        />
                        {i > 0 && step.stepRate < 100 && (
                          <div
                            className="absolute inset-y-0 rounded-r-md bg-destructive/10"
                            style={{
                              left: `${barWidth}%`,
                              width: `${Math.max(0, (signupLightData[i - 1].count - step.count) / maxCount * 100)}%`,
                            }}
                          />
                        )}
                      </div>
                      {i < signupLightData.length - 1 && (
                        <div className="flex justify-center py-0.5">
                          <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted-foreground/40">
                            <path d="M6 0 L6 12 M2 8 L6 12 L10 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Taux de conversion global
                  </p>
                  <p className="text-lg font-bold" style={{ color: signupLightData[signupLightData.length - 1].color }}>
                    {signupLightData[0].count > 0
                      ? Math.round((signupLightData[signupLightData.length - 1].count / signupLightData[0].count) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-accent" />
              Leads par jour (30 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyLeadsChart}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="total" name="Total leads" stroke="hsl(var(--accent))" fill="url(#gradTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="premium" name="Premium payés" stroke="hsl(160, 60%, 45%)" fill="url(#gradPremium)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Quote Requests Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-4 w-4 text-primary" />
              Demandes de devis par semaine (12 dernières semaines)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyQuotesChart}>
                <defs>
                  <linearGradient id="gradQuoteTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradQuoteConverti" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="semaine" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="total" name="Total devis" stroke="hsl(var(--primary))" fill="url(#gradQuoteTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="contacte" name="Contactés" stroke="hsl(var(--accent))" fill="none" strokeWidth={2} strokeDasharray="4 2" />
                <Area type="monotone" dataKey="converti" name="Convertis" stroke="hsl(160, 60%, 45%)" fill="url(#gradQuoteConverti)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
