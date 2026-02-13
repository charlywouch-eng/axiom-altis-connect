import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Eye, Send, Search, ShieldCheck, FileText, Stamp, CreditCard, PenLine } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import TalentDossierModal from "./TalentDossierModal";

type VisaFilter = "all" | "en_cours" | "apostille" | "pret_j1";

const visaLabels: Record<string, { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-muted text-muted-foreground" },
  en_cours: { label: "Visa en cours", className: "bg-accent/15 text-accent border border-accent/30" },
  apostille: { label: "Apostillé", className: "bg-accent/20 text-accent font-semibold border border-accent/40" },
  pret_j1: { label: "Prêt J1", className: "bg-success/15 text-success border border-success/30 font-semibold" },
};

export default function VerifiedTalentsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<VisaFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);

  const { data: talents = [], isLoading } = useQuery({
    queryKey: ["verified-talents", filter, search],
    queryFn: async () => {
      let query = supabase
        .from("talent_profiles")
        .select("*")
        .eq("available", true)
        .order("compliance_score", { ascending: false });

      if (filter !== "all") {
        query = query.eq("visa_status", filter);
      }
      if (search.trim()) {
        query = query.ilike("full_name", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("talent-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "talent_profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["verified-talents"] });
          toast.info("Nouveau dossier talent mis à jour", { duration: 3000 });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const selectedTalent = talents.find((t) => t.id === selectedTalentId);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-accent";
    return "text-destructive";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Talents vérifiés</CardTitle>
                  <p className="text-sm text-muted-foreground">{talents.length} profil{talents.length !== 1 ? "s" : ""} disponible{talents.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un talent…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-52"
                  />
                </div>
                <Select value={filter} onValueChange={(v) => setFilter(v as VisaFilter)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_cours">Visa en cours</SelectItem>
                    <SelectItem value="apostille">Apostillé</SelectItem>
                    <SelectItem value="pret_j1">Prêt J1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Chargement des talents…</p>
            ) : talents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Aucun talent trouvé pour ce filtre.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Métier ROME</TableHead>
                      <TableHead>Statut visa</TableHead>
                      <TableHead>Date apostille</TableHead>
                      <TableHead className="text-center">Score conformité</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {talents.map((talent, i) => {
                      const visa = visaLabels[talent.visa_status] ?? visaLabels.en_attente;
                      return (
                        <motion.tr
                          key={talent.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.3 }}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{talent.full_name || "—"}</span>
                              <Badge className="bg-accent/15 text-accent border border-accent/30 text-[10px] px-1.5">
                                Vérifié
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {talent.rome_code ? (
                              <span className="text-sm">
                                <span className="font-mono text-accent">{talent.rome_code}</span>
                                {talent.rome_label && <span className="text-muted-foreground ml-1.5">· {talent.rome_label}</span>}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${visa.className}`}>
                              {visa.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {talent.apostille_date
                              ? format(new Date(talent.apostille_date), "dd MMM yyyy", { locale: fr })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-display text-lg font-bold ${scoreColor(talent.compliance_score)}`}>
                              {talent.compliance_score}
                            </span>
                            <span className="text-muted-foreground text-xs">/100</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 hover:border-accent/40 hover:text-accent"
                              onClick={() => setSelectedTalentId(talent.id)}
                            >
                              <Eye className="h-3.5 w-3.5" /> Voir dossier
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {selectedTalent && (
        <TalentDossierModal
          talent={selectedTalent}
          open={!!selectedTalentId}
          onOpenChange={(v) => !v && setSelectedTalentId(null)}
        />
      )}
    </>
  );
}
