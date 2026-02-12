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
import { Users, Briefcase, Globe, TrendingUp, Search } from "lucide-react";

const MOCK_STATUSES = ["Offre acceptée", "Visa en cours", "Billet réservé", "Logement trouvé", "Formation démarrée", "En poste"];

function getRandomStatus() {
  return MOCK_STATUSES[Math.floor(Math.random() * MOCK_STATUSES.length)];
}

const statusVariant = (s: string): "default" | "secondary" | "outline" => {
  if (s === "En poste") return "default";
  if (s === "Visa en cours" || s === "Formation démarrée") return "secondary";
  return "outline";
};

function StatCard({ icon: Icon, title, value }: { icon: any; title: string; value: string }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardLayout sidebarVariant="admin">
      <AdminTalents />
    </DashboardLayout>
  );
}

export function AdminTalents() {
  const [search, setSearch] = useState("");

  const { data: talents = [], isLoading } = useQuery({
    queryKey: ["admin_talents"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "talent");
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);
      if (error) throw error;
      return (profiles || []).map((p) => ({
        ...p,
        mockStatus: getRandomStatus(),
      }));
    },
  });

  const filtered = talents.filter((t: any) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.email?.toLowerCase().includes(q) ||
      (t as any).country?.toLowerCase().includes(q) ||
      t.full_name?.toLowerCase().includes(q)
    );
  });

  const installedCount = talents.filter((t: any) => t.mockStatus === "En poste").length;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Back-office Admin</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} title="Talents inscrits" value={String(talents.length)} />
        <StatCard icon={TrendingUp} title="Installés ce mois" value={String(installedCount)} />
        <StatCard icon={Globe} title="Relocations actives" value={String(talents.length - installedCount)} />
        <StatCard icon={Briefcase} title="Offres ouvertes" value="—" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Talents</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par email ou pays…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                  <TableHead>Statut relocation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.full_name || "—"}</TableCell>
                    <TableCell>{t.email}</TableCell>
                    <TableCell>{(t as any).country || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(t.mockStatus)}>{t.mockStatus}</Badge>
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
