import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Download, Search, Copy, CheckCircle2,
  Globe, ExternalLink, Zap, ChevronRight, TrendingUp, Euro,
} from "lucide-react";
import { motion } from "framer-motion";

/* ─── Types ──────────────────────────────────────────────────── */
interface Lead {
  id: string;
  email_or_phone: string;
  metier: string;
  rome_code: string;
  experience_bracket: string;
  score_mock: number;
  status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

/* ─── Config ──────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  a_contacter: { label: "À contacter",   color: "bg-amber-500/10 text-amber-600 border-amber-300/40"   },
  inscrit_10:  { label: "Inscrit 10 €",  color: "bg-primary/10 text-primary border-primary/30"         },
  premium_30:  { label: "Premium 30 €",  color: "bg-emerald-500/10 text-emerald-600 border-emerald-300/40" },
  converti:    { label: "Converti",      color: "bg-success/10 text-success border-success/30"         },
  inactif:     { label: "Inactif",       color: "bg-muted text-muted-foreground border-border"          },
};

const BASE_URL = "https://axiom-altis-connect.lovable.app/leads";

const UTM_CHANNELS = [
  {
    name: "Facebook / Meta",
    icon: "📘",
    utm: "utm_source=facebook&utm_medium=organic&utm_campaign=phase1-cameroun",
    cta: `🇫🇷 Il y a 6 mois, Roméo était maçon à Douala. Aujourd'hui, il est en CDI à Lyon.\n\nBTP, Santé, CHR, Logistique... Des centaines d'entreprises françaises cherchent DES TALENTS COMME VOUS.\n\n✅ Matching IA\n✅ Visa accompagné\n✅ Logement ALTIS\n\n→ Testez votre profil GRATUITEMENT maintenant\n\n#EmploiFrance #TalentsCameroun #Opportunités`,
  },
  {
    name: "LinkedIn",
    icon: "💼",
    utm: "utm_source=linkedin&utm_medium=organic&utm_campaign=phase1-cameroun",
    cta: `Le marché du travail français manque cruellement de talents qualifiés dans le BTP, la Santé et la Logistique.\n\nAXIOM connecte les talents africains certifiés aux entreprises françaises via :\n→ Score IA de compatibilité ROME\n→ Accompagnement visa & titre professionnel\n→ CDI 2-4× le salaire actuel\n\nPreuves sociales : +2 400 talents placés · Paris · Lyon · Bordeaux\n\nProfil gratuit en 45 secondes →`,
  },
  {
    name: "TikTok",
    icon: "🎵",
    utm: "utm_source=tiktok&utm_medium=organic&utm_campaign=phase1-cameroun",
    cta: `Il y a 6 mois il était maçon à Douala 🇨🇲\nAujourd'hui il est en CDI à Lyon 🇫🇷\n\nComment ? AXIOM l'a connecté aux entreprises françaises qui manquent de talents comme lui.\n\n→ Testez votre profil en 45 sec (lien en bio)\n\n#EmploiFrance #Cameroun #Opportunité #CDI`,
  },
  {
    name: "Instagram",
    icon: "📸",
    utm: "utm_source=instagram&utm_medium=organic&utm_campaign=phase1-cameroun",
    cta: `Et si votre avenir était en France ? 🇫🇷\n\n9 métiers qui manquent de bras.\nDes entreprises qui CHERCHENT des talents comme vous.\nUn matching IA + visa + logement inclus.\n\nTous les détails dans notre bio ↗️\n\n#TalentsCameroun #EmploiFrance #BTP #Santé #CHR`,
  },
];

const PIXEL_SNIPPETS = [
  {
    name: "Meta Pixel (Facebook)",
    code: `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'VOTRE_PIXEL_ID');
fbq('track', 'PageView');
fbq('track', 'Lead'); // Appeler après soumission formulaire
</script>`,
  },
  {
    name: "LinkedIn Insight Tag",
    code: `<!-- LinkedIn Insight Tag -->
<script type="text/javascript">
_linkedin_partner_id = "VOTRE_PARTNER_ID";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
<script type="text/javascript">
(function(l) {
  if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
  window.lintrk.q=[]}
  var s = document.getElementsByTagName("script")[0];
  var b = document.createElement("script");
  b.type = "text/javascript"; b.async = true;
  b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
  s.parentNode.insertBefore(b, s);
})(window.lintrk);
</script>`,
  },
  {
    name: "TikTok Pixel",
    code: `<!-- TikTok Pixel -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off",
    "once","ready","alias","group","enableCookie","disableCookie"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(
    Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.load('VOTRE_TIKTOK_PIXEL_ID');
  ttq.page();
}(window, document, 'ttq');
</script>`,
  },
];

/* ─── Component ─────────────────────────────────────────────────*/
export default function AdminLeads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedIdx,    setCopiedIdx]    = useState<string | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin_leads"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from as any)("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_leads"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const exportCsv = () => {
    const headers = ["id", "contact", "metier", "rome", "experience", "score", "statut", "utm_source", "utm_medium", "utm_campaign", "date"];
    const rows = leads.map(l => [
      l.id, l.email_or_phone, l.metier, l.rome_code,
      l.experience_bracket, l.score_mock, l.status,
      l.utm_source ?? "", l.utm_medium ?? "", l.utm_campaign ?? "",
      new Date(l.created_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `axiom-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "Export CSV RGPD téléchargé ✓" });
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(key);
    toast({ title: "Copié !" });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const filteredLeads = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.email_or_phone.toLowerCase().includes(q) || l.metier.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:      leads.length,
    aContacter: leads.filter(l => l.status === "a_contacter").length,
    payants:    leads.filter(l => ["inscrit_10", "premium_30", "converti"].includes(l.status)).length,
    avgScore:   leads.length ? Math.round(leads.reduce((s, l) => s + l.score_mock, 0) / leads.length) : 0,
    revenue:    leads.filter(l => l.status === "inscrit_10").length * 10
              + leads.filter(l => l.status === "premium_30").length * 30
              + leads.filter(l => l.status === "converti").length * 10,
  };

  return (
    <DashboardLayout sidebarVariant="admin">
      <div className="space-y-6 pb-12">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Leads Marketing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pipeline de conversion · Tracking multi-canaux · Export RGPD</p>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total leads",    value: stats.total,           icon: Users,       color: "text-foreground"  },
            { label: "À contacter",    value: stats.aContacter,      icon: TrendingUp,  color: "text-amber-600"   },
            { label: "Convertis",      value: stats.payants,         icon: CheckCircle2, color: "text-primary"    },
            { label: "Score moyen",    value: `${stats.avgScore}%`,  icon: Zap,         color: "text-accent"      },
            { label: "CA estimé",      value: `${stats.revenue} €`,  icon: Euro,        color: "text-success"     },
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

        {/* ── Tabs ── */}
        <Tabs defaultValue="leads">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex h-auto gap-1 bg-muted/60 p-1 rounded-xl mb-4">
            <TabsTrigger value="leads" className="text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="h-3.5 w-3.5 mr-1.5" />Leads entrants
            </TabsTrigger>
            <TabsTrigger value="marketing" className="text-xs font-medium px-4 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Globe className="h-3.5 w-3.5 mr-1.5" />Marketing & Tracking
            </TabsTrigger>
          </TabsList>

          {/* ── TAB LEADS ── */}
          <TabsContent value="leads">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Leads entrants ({filteredLeads.length})
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8 h-8 text-xs w-full sm:w-48"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 text-xs w-full sm:w-40">
                        <SelectValue placeholder="Filtrer statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={exportCsv}>
                      <Download className="h-3.5 w-3.5" />CSV RGPD
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
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Aucun lead pour le moment</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Les soumissions de /leads apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-border/50">
                          {["Contact", "Métier / ROME", "Exp.", "Score", "UTM source", "Statut", "Date"].map(h => (
                            <th key={h} className="text-left pb-2.5 pr-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeads.map((lead, i) => {
                          const status = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.a_contacter;
                          const scoreColor = lead.score_mock >= 88 ? "text-emerald-500" : lead.score_mock >= 80 ? "text-primary" : "text-amber-500";
                          const contactDisplay = lead.email_or_phone.length > 22
                            ? `${lead.email_or_phone.slice(0, 12)}…${lead.email_or_phone.slice(-5)}`
                            : lead.email_or_phone;
                          return (
                            <motion.tr
                              key={lead.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.025 }}
                              className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-2.5 pr-4 font-medium text-foreground max-w-[160px]">
                                <span className="truncate block" title={lead.email_or_phone}>{contactDisplay}</span>
                              </td>
                              <td className="py-2.5 pr-4 text-muted-foreground">
                                <span className="block max-w-[130px] truncate">{lead.metier}</span>
                                <span className="text-[10px] text-muted-foreground/50">{lead.rome_code}</span>
                              </td>
                              <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{lead.experience_bracket}</td>
                              <td className={`py-2.5 pr-4 font-bold ${scoreColor}`}>{lead.score_mock}%</td>
                              <td className="py-2.5 pr-4">
                                {lead.utm_source
                                  ? <Badge variant="outline" className="text-[9px] px-1.5 py-0">{lead.utm_source}</Badge>
                                  : <span className="text-muted-foreground/30">—</span>
                                }
                              </td>
                              <td className="py-2.5 pr-4">
                                <Select
                                  value={lead.status}
                                  onValueChange={val => updateStatus.mutate({ id: lead.id, status: val })}
                                >
                                  <SelectTrigger className="h-auto border-0 p-0 focus:ring-0 w-fit shadow-none bg-transparent">
                                    <Badge className={`text-[9px] px-1.5 py-0 border cursor-pointer ${status.color}`}>
                                      {status.label}
                                    </Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                      <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2.5 text-muted-foreground/50 whitespace-nowrap">
                                {new Date(lead.created_at).toLocaleDateString("fr-FR")}
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
          </TabsContent>

          {/* ── TAB MARKETING ── */}
          <TabsContent value="marketing" className="space-y-5">

            {/* UTM links */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  Liens UTM par canal
                </CardTitle>
                <p className="text-xs text-muted-foreground">Liens pré-configurés pour vos campagnes — copiez et collez dans vos ads</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {UTM_CHANNELS.map((ch, i) => {
                  const fullUrl = `${BASE_URL}?${ch.utm}`;
                  return (
                    <div key={ch.name} className="rounded-xl border border-border/50 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{ch.icon}</span>
                          <h3 className="text-sm font-semibold text-foreground">{ch.name}</h3>
                        </div>
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs gap-1.5 shrink-0"
                          onClick={() => copy(fullUrl, `url-${i}`)}
                        >
                          {copiedIdx === `url-${i}` ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                          Copier le lien
                        </Button>
                      </div>

                      <div className="bg-muted/40 rounded-lg p-2.5 font-mono text-[10px] text-muted-foreground break-all select-all">
                        {fullUrl}
                      </div>

                      <details className="group">
                        <summary className="text-xs text-primary cursor-pointer list-none flex items-center gap-1 select-none">
                          <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                          Voir le template de post {ch.name}
                        </summary>
                        <div className="mt-2 relative">
                          <pre className="bg-muted/40 rounded-lg p-3 text-[10px] text-muted-foreground whitespace-pre-wrap font-sans overflow-x-auto leading-relaxed">
                            {ch.cta}
                          </pre>
                          <Button
                            size="sm" variant="ghost"
                            className="absolute top-2 right-2 h-6 text-[10px] gap-1"
                            onClick={() => copy(ch.cta, `cta-${i}`)}
                          >
                            {copiedIdx === `cta-${i}` ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </details>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Pixel snippets */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Pixels &amp; Tags de tracking
                </CardTitle>
                <p className="text-xs text-muted-foreground">Collez ces snippets dans votre &lt;head&gt; ou Google Tag Manager</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {PIXEL_SNIPPETS.map((snippet, i) => (
                  <div key={snippet.name} className="rounded-xl border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground">{snippet.name}</h3>
                      <Button
                        size="sm" variant="outline" className="h-7 text-xs gap-1.5"
                        onClick={() => copy(snippet.code, `pixel-${i}`)}
                      >
                        {copiedIdx === `pixel-${i}` ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                        Copier
                      </Button>
                    </div>
                    <pre className="bg-muted/40 rounded-lg p-3 text-[10px] text-muted-foreground overflow-x-auto font-mono whitespace-pre leading-relaxed">
                      {snippet.code}
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
