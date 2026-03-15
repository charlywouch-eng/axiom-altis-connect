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
  FileText, Search, Download, CheckCircle2, Clock, XCircle, MessageSquare, Euro, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

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
  estimated_amount: number | null;
  created_at: string;
}

export default function AdminQuotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");

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
    mutationFn: async ({ id, notes, estimated_amount }: { id: string; notes: string; estimated_amount: number | null }) => {
      const { error } = await (supabase.from as any)("quote_requests").update({ notes, estimated_amount }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_quotes"] });
      toast({ title: "Détails enregistrés" });
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
    contacte: quotes.filter(q => q.status === "contacte").length,
    converti: quotes.filter(q => q.status === "converti").length,
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
            { label: "Nouveaux",  value: stats.nouveau,   icon: Clock,        color: "text-amber-600" },
            { label: "Contactés", value: stats.contacte,  icon: MessageSquare, color: "text-primary" },
            { label: "Convertis", value: stats.converti,  icon: CheckCircle2, color: "text-emerald-600" },
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

        {/* Monthly Revenue Chart */}
        {(() => {
          const VOLUME_EST: Record<string, number> = {
            "1-5": 2450, "6-10": 2450 * 7, "11-20": 2450 * 15, "20+": 2450 * 25,
          };

          // Build 12-month timeline
          const now = new Date();
          const months: { key: string; label: string; demandes: number; ca: number }[] = [];
          for (let i = 11; i >= 0; i--) {
            const d = subMonths(now, i);
            const key = format(d, "yyyy-MM");
            months.push({ key, label: format(d, "MMM yy", { locale: fr }), demandes: 0, ca: 0 });
          }

          quotes.forEach(q => {
            const key = q.created_at.slice(0, 7);
            const m = months.find(mo => mo.key === key);
            if (!m) return;
            m.demandes += 1;
            if (q.status === "converti") {
              m.ca += q.estimated_amount != null ? q.estimated_amount : (VOLUME_EST[q.volume || "1-5"] || 2450);
            }
          });

          const hasData = months.some(m => m.demandes > 0);
          if (!hasData) return null;

          return (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Évolution mensuelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={months} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="demandesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                        formatter={(value: number, name: string) => [
                          name === "ca" ? `${value.toLocaleString("fr-FR")} €` : value,
                          name === "ca" ? "CA converti" : "Demandes"
                        ]}
                      />
                      <Area yAxisId="right" type="monotone" dataKey="demandes" stroke="hsl(var(--accent))" fill="url(#demandesGrad)" strokeWidth={2} dot={false} />
                      <Area yAxisId="left" type="monotone" dataKey="ca" stroke="hsl(var(--primary))" fill="url(#caGrad)" strokeWidth={2.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2 justify-center">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="w-3 h-0.5 rounded-full bg-primary" /> CA converti (€)
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="w-3 h-0.5 rounded-full bg-accent" /> Demandes
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Converted Quotes Summary */}
        {(() => {
          const convertis = quotes.filter(q => q.status === "converti");
          if (convertis.length === 0) return null;

          const VOLUME_ESTIMATES: Record<string, number> = {
            "1-5": 2450,
            "6-10": 2450 * 7,
            "11-20": 2450 * 15,
            "20+": 2450 * 25,
          };

          const totalEstime = convertis.reduce((sum, q) => {
            if (q.estimated_amount != null) return sum + q.estimated_amount;
            const vol = q.volume || "1-5";
            return sum + (VOLUME_ESTIMATES[vol] || 2450);
          }, 0);

          return (
            <Card className="border-emerald-300/30 bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Euro className="h-4 w-4 text-emerald-600" />
                  Devis convertis — Chiffre d'affaires estimé
                  <Badge className="ml-auto bg-emerald-500/10 text-emerald-600 border-emerald-300/40 text-xs border">
                    {totalEstime.toLocaleString("fr-FR")} €
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-emerald-300/20">
                        {["Date", "Entreprise", "Secteur", "Volume", "Montant estimé"].map(h => (
                          <th key={h} className="text-left pb-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {convertis.map(q => {
                        const vol = q.volume || "1-5";
                        const montant = q.estimated_amount != null ? q.estimated_amount : (VOLUME_ESTIMATES[vol] || 2450);
                        const isCustom = q.estimated_amount != null;
                        return (
                          <tr key={q.id} className="border-b border-border/20">
                            <td className="py-2 pr-4 text-muted-foreground">{new Date(q.created_at).toLocaleDateString("fr-FR")}</td>
                            <td className="py-2 pr-4 font-medium text-foreground">{q.company}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{q.sector}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{q.volume || "—"}</td>
                            <td className="py-2 pr-4 font-semibold text-emerald-600">
                              {montant.toLocaleString("fr-FR")} €
                              {isCustom && <span className="ml-1 text-[9px] font-normal text-muted-foreground">(personnalisé)</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })()}

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
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => { setSelectedQuote(q); setAdminNotes(q.notes ?? ""); setEstimatedAmount(q.estimated_amount != null ? String(q.estimated_amount) : ""); }}>
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
                  <span className="text-muted-foreground">Montant estimé (€)</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={estimatedAmount}
                    onChange={e => setEstimatedAmount(e.target.value)}
                    placeholder="Ex : 12 250 — laisser vide pour calcul auto"
                    className="text-xs h-8"
                  />
                  <p className="text-[10px] text-muted-foreground">Laissez vide pour utiliser l'estimation automatique basée sur le volume.</p>
                </div>
                <div className="text-xs space-y-1.5">
                  <span className="text-muted-foreground">Notes internes</span>
                  <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Ajouter des notes…" className="text-xs min-h-[80px]" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button size="sm" className="text-xs" onClick={() => selectedQuote && saveNotes.mutate({
                id: selectedQuote.id,
                notes: adminNotes,
                estimated_amount: estimatedAmount.trim() ? parseFloat(estimatedAmount) : null,
              })}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
