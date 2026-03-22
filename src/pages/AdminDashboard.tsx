import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Users, Briefcase, Globe, Search, GraduationCap, CreditCard, Star, TrendingUp } from "lucide-react";
import { PremiumStatCard } from "@/components/PremiumStatCard";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  return (
    <DashboardLayout sidebarVariant="admin">
      <AdminContent />
    </DashboardLayout>
  );
}

function AdminContent() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // Premium payments (Pack ALTIS activés)
  const { data: premiumTalents = [] } = useQuery({
    queryKey: ["admin_premium_talents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("id, user_id, full_name, premium_unlocked_at, is_premium")
        .eq("is_premium", true)
        .order("premium_unlocked_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Realtime: listen for new premium activations
  useEffect(() => {
    const channel = supabase
      .channel("admin-premium-watch")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "talent_profiles", filter: "is_premium=eq.true" },
        (payload) => {
          const newRow = payload.new as any;
          if (newRow.is_premium && payload.old && !(payload.old as any).is_premium) {
            toast({
              title: "💰 Nouveau Pack ALTIS activé !",
              description: `${newRow.full_name || "Un talent"} vient d'activer le Pack ALTIS (29 €)`,
            });
            queryClient.invalidateQueries({ queryKey: ["admin_premium_talents"] });
            queryClient.invalidateQueries({ queryKey: ["admin_talent_profiles"] });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, toast]);

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
  const estimatedRevenue = premiumTalents.length * 29;

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
        <PremiumStatCard
          icon={Users}
          title="Talents inscrits"
          value={String(talentProfiles.length)}
          accent="blue"
          tensionLevel={talentProfiles.length < 10 ? "high" : talentProfiles.length < 50 ? "medium" : "low"}
          subtitle="Profils dans la base"
        />
        <PremiumStatCard
          icon={Globe}
          title="Talents disponibles"
          value={String(availableTalents.length)}
          accent="green"
          tensionLevel={availableTalents.length === 0 ? "critical" : availableTalents.length < 5 ? "high" : "low"}
          subtitle="Prêts pour le recrutement"
        />
        <PremiumStatCard
          icon={Briefcase}
          title="Offres ouvertes"
          value={String(offerStats?.open ?? 0)}
          tensionLevel={(offerStats?.open ?? 0) === 0 ? "critical" : (offerStats?.open ?? 0) < 3 ? "medium" : "low"}
          subtitle="Postes à pourvoir"
        />
        <PremiumStatCard
          icon={GraduationCap}
          title="Entreprises"
          value={String(entrepriseCount)}
          accent="blue"
          tensionLevel={entrepriseCount < 3 ? "high" : "low"}
          subtitle="Partenaires actifs"
        />
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
