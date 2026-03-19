import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Search,
  Users,
  Clock,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  submitted: { label: "Dossier soumis", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: ClipboardList },
  in_review: { label: "En cours d'analyse", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: Search },
  interview: { label: "Entretien planifié", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: MessageSquare },
  altis_active: { label: "Pack ALTIS activé", color: "bg-accent/15 text-accent border-accent/30", icon: Sparkles },
  hired: { label: "Recruté ✓", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: CheckCircle2 },
  rejected: { label: "Non retenu", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: XCircle },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export default function AdminCandidatures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: candidatures, isLoading } = useQuery({
    queryKey: ["admin-candidatures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidatures")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("candidatures")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-candidatures"] });
      const label = STATUS_CONFIG[variables.status]?.label || variables.status;
      toast({ title: "Statut mis à jour", description: `Candidature passée en "${label}".` });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const filtered = candidatures?.filter((c) => {
    const matchesSearch =
      !search ||
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.competences?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = candidatures?.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) ?? {};

  const summaryStats = [
    { label: "Total", value: candidatures?.length ?? 0, icon: ClipboardList, accent: "text-accent" },
    { label: "En analyse", value: statusCounts["in_review"] ?? 0, icon: Search, accent: "text-yellow-400" },
    { label: "Entretiens", value: statusCounts["interview"] ?? 0, icon: MessageSquare, accent: "text-purple-400" },
    { label: "ALTIS activé", value: statusCounts["altis_active"] ?? 0, icon: Sparkles, accent: "text-accent" },
    { label: "Recrutés", value: statusCounts["hired"] ?? 0, icon: CheckCircle2, accent: "text-green-400" },
  ];

  return (
    <DashboardLayout sidebarVariant="admin">
      <motion.div
        className="space-y-6 pb-12"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            Suivi des Recrutements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez le statut des candidatures et suivez le pipeline de recrutement ALTIS.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {summaryStats.map((s) => (
            <Card key={s.label} className="bg-card border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                  <s.icon className={`h-5 w-5 ${s.accent}`} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="font-display text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un talent…"
              className="pl-10 bg-card border-border/50 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-52 bg-card border-border/50 h-10">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="bg-card border-border/50 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground text-sm">Chargement…</div>
            ) : filtered && filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30">
                      <TableHead className="text-xs">Talent</TableHead>
                      <TableHead className="text-xs">Ville</TableHead>
                      <TableHead className="text-xs">Compétences</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Statut actuel</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => {
                      const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.submitted;
                      return (
                        <TableRow key={c.id} className="border-border/20 hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {(c.full_name || "T")[0].toUpperCase()}
                              </div>
                              <span className="font-semibold text-sm text-foreground">{c.full_name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.city || "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {c.competences?.slice(0, 3).map((s: string) => (
                                <span key={s} className="text-[10px] bg-muted/50 text-muted-foreground rounded-full px-2 py-0.5">{s}</span>
                              ))}
                              {(c.competences?.length ?? 0) > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{c.competences!.length - 3}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-accent/15 text-accent border-0 text-xs font-bold tabular-nums">
                              {c.compliance_score}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(c.created_at), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] border font-semibold ${st.color}`}>
                              {st.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={c.status}
                              onValueChange={(newStatus) =>
                                updateStatusMutation.mutate({ id: c.id, status: newStatus })
                              }
                            >
                              <SelectTrigger className="w-44 h-8 text-xs bg-muted/30 border-border/50">
                                <RefreshCw className="h-3 w-3 mr-1.5 text-muted-foreground" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune candidature trouvée.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
