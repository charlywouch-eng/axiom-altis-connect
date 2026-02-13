import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Briefcase, Globe, TrendingUp, Search, GraduationCap } from "lucide-react";
import { PremiumStatCard } from "@/components/PremiumStatCard";

export default function AdminDashboard() {
  return (
    <DashboardLayout sidebarVariant="admin">
      <AdminContent />
    </DashboardLayout>
  );
}

function AdminContent() {
  const [search, setSearch] = useState("");

  // Real talent count from talent_profiles
  const { data: talentProfiles = [], isLoading: loadingTalents } = useQuery({
    queryKey: ["admin_talent_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Real offer count
  const { data: offerStats } = useQuery({
    queryKey: ["admin_offer_stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select("status");
      if (error) throw error;
      const open = (data || []).filter((o) => o.status === "open").length;
      const total = (data || []).length;
      return { open, total };
    },
  });

  // Real entreprise count
  const { data: entrepriseCount = 0 } = useQuery({
    queryKey: ["admin_entreprise_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "entreprise");
      if (error) throw error;
      return count || 0;
    },
  });

  // Also fetch profiles for display
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "talent");
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);
      if (error) throw error;
      return data || [];
    },
  });

  const availableTalents = talentProfiles.filter((t) => t.available);
  const avgScore = talentProfiles.length > 0
    ? Math.round(talentProfiles.reduce((sum, t) => sum + (t.score || 0), 0) / talentProfiles.length)
    : 0;

  const filtered = profiles.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.email?.toLowerCase().includes(q) ||
      t.country?.toLowerCase().includes(q) ||
      t.full_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Back-office Admin</h2>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PremiumStatCard icon={Users} title="Talents inscrits" value={String(talentProfiles.length)} accent="blue" />
        <PremiumStatCard icon={Globe} title="Talents disponibles" value={String(availableTalents.length)} accent="green" />
        <PremiumStatCard icon={Briefcase} title="Offres ouvertes" value={String(offerStats?.open ?? 0)} />
        <PremiumStatCard icon={GraduationCap} title="Entreprises" value={String(entrepriseCount)} accent="blue" />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Score moyen des talents</p>
            <p className="text-2xl font-bold font-display mt-1">{avgScore}<span className="text-sm text-muted-foreground font-normal"> /100</span></p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total offres</p>
            <p className="text-2xl font-bold font-display mt-1">{offerStats?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Profils utilisateurs</p>
            <p className="text-2xl font-bold font-display mt-1">{profiles.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Talents Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Talents</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email ou pays…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingTalents ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun talent trouvé.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Français</TableHead>
                  <TableHead>Compétences</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.full_name || "—"}</TableCell>
                    <TableCell>{t.email}</TableCell>
                    <TableCell>{t.country || "—"}</TableCell>
                    <TableCell>{t.french_level || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.skills && t.skills.length > 0
                          ? t.skills.slice(0, 3).map((s: string) => (
                              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                            ))
                          : "—"}
                        {t.skills && t.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{t.skills.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
