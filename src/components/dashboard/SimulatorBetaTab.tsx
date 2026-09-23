import { Fragment, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical, MessageSquareQuote } from "lucide-react";

interface SimLead {
  id: string;
  first_name: string | null;
  email_or_phone: string;
  metier: string;
  rome_code: string;
  pays: string | null;
  niveau_francais: string | null;
  score_v2: number | null;
  referral_code: string | null;
  referred_by: string | null;
  unlock_method: "partage" | "temoignage" | null;
  testimonial: string | null;
  testimonial_ok: boolean | null;
  created_at: string;
}

interface KpiRow {
  semaine: string;
  pays: string | null;
  tests_termines: number;
  deblocages: number;
  deblocages_partage: number;
  deblocages_temoignage: number;
  venus_par_parrainage: number;
  score_moyen: number | null;
}

const scoreClass = (s: number | null) =>
  s == null ? "text-muted-foreground" : s >= 75 ? "text-emerald-500" : s >= 55 ? "text-primary" : s >= 40 ? "text-amber-500" : "text-red-500";

export function SimulatorBetaTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [onlyTestimonials, setOnlyTestimonials] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin_sim_leads"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("leads")
        .select("id, first_name, email_or_phone, metier, rome_code, pays, niveau_francais, score_v2, referral_code, referred_by, unlock_method, testimonial, testimonial_ok, created_at")
        .not("score_v2", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SimLead[];
    },
  });

  const { data: kpis = [] } = useQuery({
    queryKey: ["admin_sim_kpis"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("simulator_beta_kpis").select("*");
      if (error) throw error;
      return (data ?? []) as KpiRow[];
    },
  });

  const approve = useMutation({
    mutationFn: async ({ id, ok }: { id: string; ok: boolean }) => {
      const { error } = await (supabase.from as any)("leads").update({ testimonial_ok: ok }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_sim_leads"] }),
    onError: () => toast({ title: "Mise à jour impossible", variant: "destructive" }),
  });

  const totals = useMemo(() => {
    const t = { tests: 0, unlocks: 0, partage: 0, temoignage: 0, parrainage: 0 };
    kpis.forEach(k => {
      t.tests += Number(k.tests_termines); t.unlocks += Number(k.deblocages);
      t.partage += Number(k.deblocages_partage); t.temoignage += Number(k.deblocages_temoignage);
      t.parrainage += Number(k.venus_par_parrainage);
    });
    return t;
  }, [kpis]);

  const byCountry = useMemo(() => {
    const m = new Map<string, { tests: number; unlocks: number }>();
    kpis.forEach(k => {
      const key = k.pays ?? "—";
      const v = m.get(key) ?? { tests: 0, unlocks: 0 };
      v.tests += Number(k.tests_termines); v.unlocks += Number(k.deblocages);
      m.set(key, v);
    });
    return [...m.entries()].sort((a, b) => b[1].tests - a[1].tests);
  }, [kpis]);

  const list = onlyTestimonials ? rows.filter(r => r.testimonial) : rows;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Tests terminés", totals.tests.toString()],
          ["Déblocages", `${totals.unlocks} (${pct(totals.unlocks, totals.tests)})`],
          ["Partage / témoignage", `${totals.partage} / ${totals.temoignage}`],
          ["Venus par parrainage", totals.parrainage.toString()],
        ].map(([label, value]) => (
          <Card key={label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <p className="text-xl font-bold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {byCountry.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Par pays</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/50 text-muted-foreground">
                <th className="text-left pb-2 pr-4 font-medium">Pays</th>
                <th className="text-right pb-2 pr-4 font-medium">Tests</th>
                <th className="text-right pb-2 pr-4 font-medium">Déblocages</th>
                <th className="text-right pb-2 font-medium">Taux</th>
              </tr></thead>
              <tbody>
                {byCountry.map(([pays, v]) => (
                  <tr key={pays} className="border-b border-border/30">
                    <td className="py-2 pr-4">{pays}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{v.tests}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{v.unlocks}</td>
                    <td className="py-2 text-right tabular-nums">{pct(v.unlocks, v.tests)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" /> Candidats du simulateur ({list.length})
            </CardTitle>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={onlyTestimonials} onCheckedChange={v => setOnlyTestimonials(!!v)} />
              <MessageSquareQuote className="h-3.5 w-3.5" /> Témoignages uniquement
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-xs text-muted-foreground py-6 text-center">Chargement…</p>
          : list.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">Aucun test pour le moment.</p>
          : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs min-w-[760px]">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Prénom / contact", "Métier", "Pays", "Français", "Indice", "Parrain", "Déblocage", "Date"].map(h => (
                      <th key={h} className="text-left pb-2.5 pr-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map(r => (
                    <Fragment key={r.id}>
                      <tr className="border-b border-border/30 hover:bg-muted/30">
                        <td className="py-2.5 pr-4">
                          <span className="font-medium block">{r.first_name ?? "—"}</span>
                          <span className="text-[10px] text-muted-foreground block max-w-[160px] truncate" title={r.email_or_phone}>{r.email_or_phone}</span>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          <span className="block max-w-[150px] truncate">{r.metier}</span>
                          <span className="text-[10px] opacity-60">{r.rome_code}</span>
                        </td>
                        <td className="py-2.5 pr-4">{r.pays ?? "—"}</td>
                        <td className="py-2.5 pr-4">{r.niveau_francais ?? "—"}</td>
                        <td className={`py-2.5 pr-4 font-bold tabular-nums ${scoreClass(r.score_v2)}`}>{r.score_v2 ?? "—"}</td>
                        <td className="py-2.5 pr-4 font-mono text-[10px]">{r.referred_by ?? "—"}</td>
                        <td className="py-2.5 pr-4">
                          {r.unlock_method
                            ? <Badge variant="outline" className="text-[9px] px-1.5 py-0">{r.unlock_method === "partage" ? "Partage 10" : "Témoignage"}</Badge>
                            : <span className="text-muted-foreground/40">Verrouillé</span>}
                        </td>
                        <td className="py-2.5 text-muted-foreground/60 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                      </tr>
                      {r.testimonial && (
                        <tr className="border-b border-border/30 bg-muted/20">
                          <td colSpan={7} className="py-2 pr-4 pl-3 italic text-muted-foreground">« {r.testimonial} »</td>
                          <td className="py-2">
                            <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                              <Checkbox checked={!!r.testimonial_ok} onCheckedChange={v => approve.mutate({ id: r.id, ok: !!v })} />
                              Approuvé
                            </label>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
