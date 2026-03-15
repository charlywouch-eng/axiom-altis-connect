import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Search, Download, CheckCircle2, Clock, XCircle, MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  nouveau:    { label: "Nouveau",    color: "bg-amber-500/10 text-amber-600 border-amber-300/40",       icon: Clock },
  contacte:   { label: "Contacté",   color: "bg-primary/10 text-primary border-primary/30",             icon: MessageSquare },
  en_cours:   { label: "En cours",   color: "bg-sky-500/10 text-sky-600 border-sky-300/40",             icon: Clock },
  converti:   { label: "Converti",   color: "bg-emerald-500/10 text-emerald-600 border-emerald-300/40", icon: CheckCircle2 },
  refuse:     { label: "Refusé",     color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
};

interface QuoteRequest {
  id: string;
  user_email: string;
  company: string;
  sector: string;
  volume: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function AdminQuotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["admin_quotes"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("quote_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as QuoteRequest[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from as any)("quote_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_quotes"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const saveNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await (supabase.from as any)("quote_requests").update({ notes }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_quotes"] });
      toast({ title: "Notes enregistrées" });
      setSelectedQuote(null);
    },
  });

  const exportCsv = () => {
    const headers = ["date", "entreprise", "secteur", "volume", "email", "statut", "message"];
    const rows = quotes.map(q => [
      new Date(q.created_at).toLocaleDateString("fr-FR"),
      q.company, q.sector, q.volume ?? "", q.user_email, q.status, q.message ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `axiom-devis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "Export CSV téléchargé ✓" });
  };

  const filtered = quotes.filter(q => {
    const s = search.toLowerCase();
    const matchSearch = !s || q.company.toLowerCase().includes(s) || q.user_email.toLowerCase().includes(s) || q.sector.toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: quotes.length,
    nouveau: quotes.filter(q => q.status === "nouveau").length,
    enCours: quotes.filter(q => q.status === "en_cours").length,
    accepte: quotes.filter(q => q.status === "accepte").length,
  };

  return (
    <DashboardLayout sidebarVariant="admin">
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Demandes de devis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Suivi des demandes commerciales · Success Fee & Pack ALTIS</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total",    value: stats.total,    icon: FileText,     color: "text-foreground" },
            { label: "Nouveaux", value: stats.nouveau,  icon: Clock,        color: "text-amber-600" },
            { label: "En cours", value: stats.enCours,  icon: MessageSquare, color: "text-primary" },
            { label: "Acceptés", value: stats.accepte,  icon: CheckCircle2, color: "text-emerald-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Demandes ({filtered.length})
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-full sm:w-48" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-full sm:w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={exportCsv}>
                  <Download className="h-3.5 w-3.5" />CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune demande de devis</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border/50">
                      {["Date", "Entreprise", "Secteur", "Volume", "Email", "Statut", ""].map(h => (
                        <th key={h} className="text-left pb-2.5 pr-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((q, i) => {
                      const st = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.nouveau;
                      return (
                        <motion.tr key={q.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
                          className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pr-4 text-muted-foreground/50 whitespace-nowrap">{new Date(q.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="py-2.5 pr-4 font-medium text-foreground">{q.company}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{q.sector}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{q.volume || "—"}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground max-w-[160px] truncate" title={q.user_email}>{q.user_email}</td>
                          <td className="py-2.5 pr-4">
                            <Select value={q.status} onValueChange={val => updateStatus.mutate({ id: q.id, status: val })}>
                              <SelectTrigger className="h-auto border-0 p-0 focus:ring-0 w-fit shadow-none bg-transparent">
                                <Badge className={`text-[9px] px-1.5 py-0 border cursor-pointer ${st.color}`}>{st.label}</Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                  <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2.5">
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => { setSelectedQuote(q); setAdminNotes(q.notes ?? ""); }}>
                              <MessageSquare className="h-3 w-3" />Détails
                            </Button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail dialog */}
        <Dialog open={!!selectedQuote} onOpenChange={open => { if (!open) setSelectedQuote(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Détail demande – {selectedQuote?.company}
              </DialogTitle>
            </DialogHeader>
            {selectedQuote && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">Entreprise</span><p className="font-medium text-foreground">{selectedQuote.company}</p></div>
                  <div><span className="text-muted-foreground">Secteur</span><p className="font-medium text-foreground">{selectedQuote.sector}</p></div>
                  <div><span className="text-muted-foreground">Volume</span><p className="font-medium text-foreground">{selectedQuote.volume || "—"}</p></div>
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium text-foreground">{selectedQuote.user_email}</p></div>
                </div>
                {selectedQuote.message && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Message</span>
                    <p className="mt-1 bg-muted/40 rounded-lg p-3 text-foreground whitespace-pre-wrap">{selectedQuote.message}</p>
                  </div>
                )}
                <div className="text-xs space-y-1.5">
                  <span className="text-muted-foreground">Notes internes</span>
                  <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Ajouter des notes…" className="text-xs min-h-[80px]" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button size="sm" className="text-xs" onClick={() => selectedQuote && saveNotes.mutate({ id: selectedQuote.id, notes: adminNotes })}>
                Enregistrer les notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
