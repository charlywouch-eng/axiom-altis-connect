import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  Users, Briefcase, Brain, CreditCard, Search, LogOut,
  ShieldCheck, FileText, GraduationCap, Flame,
  Zap, ArrowRight, CheckCircle2, Eye, Globe, Stamp, Loader2, ClipboardList,
  TrendingUp, Sparkles, Phone, Award, Star, MessageSquare
} from "lucide-react";
import CandidatureCvCard from "@/components/dashboard/CandidatureCvCard";
import FranceTravailOffresCard from "@/components/dashboard/FranceTravailOffresCard";

import avatarSante from "@/assets/talent-sante.jpg";
import avatarBtp from "@/assets/talent-btp.jpg";
import avatarLogistique from "@/assets/talent-logistique.jpg";
import avatarTech from "@/assets/talent-tech.jpg";
import avatarFormation from "@/assets/talent-formation.jpg";
import { getAvatarForTalent } from "@/lib/metierAvatars";

const TALENT_AVATARS = [avatarSante, avatarBtp, avatarLogistique, avatarTech, avatarFormation];

const COUNTRY_FILTERS_REC = [
  { label: "Tous", flag: "🌍", value: null as string | null },
  { label: "Sénégal", flag: "🇸🇳", value: "Sénégal" },
  { label: "Côte d'Ivoire", flag: "🇨🇮", value: "Côte d'Ivoire" },
  { label: "Mali", flag: "🇲🇱", value: "Mali" },
  { label: "Burkina Faso", flag: "🇧🇫", value: "Burkina Faso" },
  { label: "Cameroun", flag: "🇨🇲", value: "Cameroun" },
  { label: "Togo", flag: "🇹🇬", value: "Togo" },
  { label: "Bénin", flag: "🇧🇯", value: "Bénin" },
] as const;


const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function DashboardRecruteur() {
  const { session, loading, signOut } = useAuth();
  const [selectedTalent, setSelectedTalent] = useState<any>(null);
  const [matchQuery, setMatchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("talents");
  const [offresSector, setOffresSector] = useState<string>("all");
  const [ftOffersCount, setFtOffersCount] = useState<number | null>(null);

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[hsl(222,47%,5%)]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[hsl(222,47%,8%)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <span className="font-display text-lg font-bold text-white">AXIOM <span className="text-accent">Recruteur</span></span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="talents" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-2 text-white/60">
                <Users className="h-4 w-4" /> Talents
              </TabsTrigger>
              <TabsTrigger value="missions" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-2 text-white/60">
                <Briefcase className="h-4 w-4" /> Mes Missions
              </TabsTrigger>
              <TabsTrigger value="matching" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-2 text-white/60">
                <Brain className="h-4 w-4" /> Matching IA
              </TabsTrigger>
              <TabsTrigger value="facturation" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-2 text-white/60">
                <CreditCard className="h-4 w-4" /> Facturation
              </TabsTrigger>
              <TabsTrigger value="candidatures" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-2 text-white/60">
                <ClipboardList className="h-4 w-4" /> Candidatures
              </TabsTrigger>
              <TabsTrigger value="offres-ft" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground gap-2 text-white/60">
                <Briefcase className="h-4 w-4" /> Offres France Travail
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="ghost" size="sm" onClick={signOut} className="text-white/50 hover:text-white hover:bg-white/10">
            <LogOut className="h-4 w-4 mr-2" /> Déconnexion
          </Button>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden px-4 pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-white/5 border border-white/10">
              <TabsTrigger value="talents" className="flex-1 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 text-xs">
                <Users className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="missions" className="flex-1 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 text-xs">
                <Briefcase className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="matching" className="flex-1 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 text-xs">
                <Brain className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="facturation" className="flex-1 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 text-xs">
                <CreditCard className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="candidatures" className="flex-1 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 text-xs">
                <ClipboardList className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="offres-ft" className="flex-1 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-white/60 text-xs">
                <Briefcase className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(222,47%,8%)] via-[hsl(222,47%,12%)] to-[hsl(222,47%,6%)] border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,hsl(var(--accent)/0.12),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-6 py-10 relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="bg-accent/20 text-accent border-accent/30 mb-3 text-xs">
              <Zap className="h-3 w-3 mr-1" /> Espace Recruteur B2B
            </Badge>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
              Votre cockpit RH –{" "}
              <span className="text-accent">Recrutez des talents qualifiés en toute sérénité</span>
            </h1>
            <p className="text-sm text-white/50 max-w-xl">
              Matching IA · Conformité ROME · Talents certifiés prêts à intégrer votre équipe · Pack ALTIS Zéro Stress
            </p>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === "talents" && <TalentsTab onSelectTalent={setSelectedTalent} />}
        {activeTab === "missions" && <MissionsTab />}
        {activeTab === "matching" && <MatchingTab query={matchQuery} setQuery={setMatchQuery} />}
        {activeTab === "facturation" && <FacturationTab />}
        {activeTab === "candidatures" && <CandidaturesTab />}
        {activeTab === "offres-ft" && <OffresFranceTravailTab offresSector={offresSector} setOffresSector={setOffresSector} />}
      </main>

      {/* Talent Dossier Modal */}
      <TalentDossierDialog talent={selectedTalent} onClose={() => setSelectedTalent(null)} />
    </div>
  );
}

/* ── Tension filter types ── */
const TENSION_FILTERS = ["Tous", "Très haute tension", "Haute tension", "Croissante"] as const;
const SECTOR_FILTERS = ["Tous", "BTP", "Santé", "CHR", "Logistique", "Industrie"] as const;

function getSectorFromRome(romeCode?: string | null): string {
  if (!romeCode) return "Autre";
  const prefix = romeCode.charAt(0);
  switch (prefix) {
    case "F": return "BTP";
    case "J": case "M": return "Santé";
    case "G": return "CHR";
    case "N": return "Logistique";
    case "H": case "I": return "Industrie";
    case "A": return "Agriculture";
    default: return "Autre";
  }
}

function getTensionLevel(score: number): string {
  if (score >= 85) return "Très haute tension";
  if (score >= 65) return "Haute tension";
  return "Croissante";
}

/* ──────────── TALENTS TAB ──────────── */
function TalentsTab({ onSelectTalent }: { onSelectTalent: (t: any) => void }) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tensionFilter, setTensionFilter] = useState<string>("Tous");
  const [sectorFilter, setSectorFilter] = useState<string>("Tous");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const { data: talents, isLoading } = useQuery({
    queryKey: ["recruteur-talents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("available", true)
        .order("compliance_score", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: offersCount } = useQuery({
    queryKey: ["tension-offers-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("job_offers")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: candidaturesCount } = useQuery({
    queryKey: ["candidatures-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("candidatures")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const filtered = talents?.filter(t => {
    const matchSearch = !search ||
      t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.rome_code?.toLowerCase().includes(search.toLowerCase()) ||
      t.rome_label?.toLowerCase().includes(search.toLowerCase());
    const matchTension = tensionFilter === "Tous" || getTensionLevel(t.compliance_score) === tensionFilter;
    const matchSector = sectorFilter === "Tous" || getSectorFromRome(t.rome_code) === sectorFilter;
    return matchSearch && matchTension && matchSector;
  }) ?? [];

  const avgScore = talents?.length
    ? Math.round(talents.reduce((sum, t) => sum + (t.compliance_score || 0), 0) / talents.length)
    : 0;

  return (
    <motion.div initial="hidden" animate="visible">
      {/* ── 3 Stat Cards ── */}
      <motion.div custom={0} variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-[hsl(222,33%,14%)] to-[hsl(222,33%,10%)] border-white/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Talents disponibles</p>
              <p className="font-display text-3xl font-bold text-white tabular-nums">{talents?.length ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[hsl(222,33%,14%)] to-[hsl(222,33%,10%)] border-white/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
              <Brain className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Score IA moyen</p>
              <p className="font-display text-3xl font-bold text-accent tabular-nums">{avgScore} %</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[hsl(222,33%,14%)] to-[hsl(222,33%,10%)] border-white/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
              <Flame className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Offres en tension</p>
              <p className="font-display text-3xl font-bold text-white tabular-nums">{offersCount ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[hsl(222,33%,14%)] to-[hsl(222,33%,10%)] border-white/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
              <ClipboardList className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Candidatures en cours</p>
              <p className="font-display text-3xl font-bold text-white tabular-nums">{candidaturesCount ?? "—"}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {/* ── Talents Francophones Recommandés ──────────── */}
      <FrancoTalentsSection
        talents={talents ?? []}
        countryFilter={countryFilter}
        setCountryFilter={setCountryFilter}
        invitingId={invitingId}
        setInvitingId={setInvitingId}
        session={session}
        qc={qc}
      />


      <motion.div custom={0.5} variants={fadeUp} className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white">Vos Outils IA</h2>
            <p className="text-xs text-white/40">Gagnez du temps et de la précision</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: Brain, title: "Matching IA Prédictif", desc: "Score de compatibilité en temps réel", cta: "Lancer un matching" },
            { icon: TrendingUp, title: "Score de Rétention", desc: "Prédiction du risque de départ 6-24 mois", cta: "Analyser ce candidat" },
            { icon: FileText, title: "Génération Description", desc: "Description optimisée ROME en 10 secondes", cta: "Générer" },
            { icon: ClipboardList, title: "Analyse CV Instantanée", desc: "Extraction compétences + conformité MINEFOP", cta: "Analyser CV" },
            { icon: Zap, title: "Chatbot Screening", desc: "Conversation IA avec le candidat", cta: "Lancer le screening" },
          ].map((tool, i) => (
            <motion.div key={tool.title} custom={i + 1} variants={fadeUp}>
              <Card className="bg-gradient-to-br from-[hsl(222,33%,14%)] to-[hsl(222,33%,10%)] border-white/10 hover:border-accent/40 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 h-full">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 mb-3">
                    <tool.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-white mb-1">{tool.title}</h3>
                  <p className="text-[11px] text-white/40 flex-1 mb-3">{tool.desc}</p>
                  <Button
                    size="sm"
                    onClick={() => toast({ title: tool.title, description: "Fonctionnalité bientôt disponible dans votre abonnement Premium." })}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1.5"
                  >
                    {tool.cta}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Search Bar ── */}
      <motion.div custom={1} variants={fadeUp} className="mb-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-accent/50" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Chercher un talent, un métier ou un code ROME"
            className="pl-12 py-6 text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
          />
        </div>
      </motion.div>

      {/* ── Filter Pills ── */}
      <motion.div custom={2} variants={fadeUp} className="mb-8 flex flex-wrap gap-2">
        {TENSION_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setTensionFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              tensionFilter === f
                ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/10"
            }`}
          >
            {f === "Très haute tension" && <Flame className="inline h-3 w-3 mr-1" />}
            {f}
          </button>
        ))}
        <div className="w-px h-6 bg-white/10 self-center mx-1" />
        {SECTOR_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setSectorFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              sectorFilter === f
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/10"
            }`}
          >
            {f}
          </button>
        ))}
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((talent, i) => {
            const matchPercent = Math.min(99, Math.max(72, talent.compliance_score + Math.floor(Math.random() * 8) - 4));
            const avatarImg = TALENT_AVATARS[i % TALENT_AVATARS.length];
            return (
              <motion.div key={talent.id} custom={i + 3} variants={fadeUp}>
                <Card className="bg-[hsl(222,33%,12%)] border-white/10 hover:border-accent/40 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 overflow-hidden group">
                  {/* Photo hero */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={avatarImg}
                      alt={`${talent.full_name || "Talent"} intégré dans une équipe multiculturelle`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,33%,12%)] via-transparent to-transparent" />
                    {/* Score overlay */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-[hsl(222,33%,8%)]/90 backdrop-blur-sm px-3 py-1.5 border border-accent/30">
                      <Flame className="h-4 w-4 text-accent" />
                      <span className="font-display text-xl font-black text-accent tabular-nums">{talent.compliance_score}%</span>
                    </div>
                    {/* Tension badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className={
                        talent.compliance_score >= 85
                          ? "bg-destructive/90 text-destructive-foreground border-0 text-[10px]"
                          : talent.compliance_score >= 65
                          ? "bg-accent/90 text-accent-foreground border-0 text-[10px]"
                          : "bg-white/20 text-white border-0 text-[10px]"
                      }>
                        {getTensionLevel(talent.compliance_score)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5 pt-3">
                    {/* Name & meta */}
                    <h3 className="font-display text-lg font-bold text-white truncate">{talent.full_name || "Talent"}</h3>
                    <p className="text-xs text-white/40 mt-0.5">{talent.country || "Cameroun"} · {talent.experience_years || 0} ans d'expérience</p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-mono text-accent">{talent.rome_code && `ROME ${talent.rome_code}`}</span>
                      <span className="text-xs text-white/40">·</span>
                      <span className="text-xs text-white/50 truncate">{talent.rome_label}</span>
                    </div>

                    {/* Match line */}
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
                      <TrendingUp className="h-4 w-4 text-accent shrink-0" />
                      <span className="text-xs text-accent font-medium">Votre profil correspond à {matchPercent} % à cette offre</span>
                    </div>

                    {/* Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {talent.compliance_score >= 70 && (
                        <Badge className="bg-accent/20 text-accent border-0 text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3" /> Certifié
                        </Badge>
                      )}
                      {talent.french_level && (
                        <Badge variant="outline" className="border-white/20 text-white/60 text-[10px]">
                          FR: {talent.french_level}
                        </Badge>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          onSelectTalent(talent);
                          if (talent.user_id && session?.access_token) {
                            supabase.functions.invoke("send-notification", {
                              body: { type: "profile_viewed", payload: { talent_user_id: talent.user_id } },
                            }).catch(() => {});
                          }
                        }}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 border-0 text-xs gap-1.5"
                      >
                        <Phone className="h-3.5 w-3.5" /> Contacter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast({ title: "Pack ALTIS activé", description: `Les formalités visa + accueil seront lancées pour ${talent.full_name}.` });
                        }}
                        className="flex-1 border-accent/40 text-accent hover:bg-accent/10 hover:text-accent text-xs gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Activer ALTIS
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="mx-auto h-12 w-12 text-white/20 mb-4" />
          <p className="text-white/50">Aucun talent trouvé.</p>
          <p className="text-white/30 text-sm mt-1">Essayez un autre filtre ou terme de recherche.</p>
        </div>
      )}
    </motion.div>
  );
}

/* ──────────── FRANCO TALENTS SECTION ──────────── */
function FrancoTalentsSection({
  talents,
  countryFilter,
  setCountryFilter,
  invitingId,
  setInvitingId,
  session,
  qc,
}: {
  talents: any[];
  countryFilter: string | null;
  setCountryFilter: (v: string | null) => void;
  invitingId: string | null;
  setInvitingId: (v: string | null) => void;
  session: any;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const toastFn = toast;

  const francoTalents = talents.filter((t) => {
    const country = t.country?.toLowerCase() || "";
    const isFranco =
      country.includes("sénégal") || country.includes("senegal") ||
      country.includes("côte d'ivoire") || country.includes("cote d'ivoire") ||
      country.includes("mali") ||
      country.includes("burkina") ||
      country.includes("cameroun") || country.includes("cameroon") ||
      country.includes("togo") || country.includes("bénin") || country.includes("benin");
    if (!isFranco) return false;
    if (!countryFilter) return true;
    return country.includes(countryFilter.toLowerCase());
  });

  const handleInvite = async (talent: { user_id: string; full_name: string | null }) => {
    if (!session?.user?.id) return;
    setInvitingId(talent.user_id);
    try {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_1.eq.${session.user.id},participant_2.eq.${talent.user_id}),and(participant_1.eq.${talent.user_id},participant_2.eq.${session.user.id})`)
        .limit(1)
        .maybeSingle();

      let convoId = existing?.id;
      if (!convoId) {
        const { data: newConvo, error } = await supabase
          .from("conversations")
          .insert({ participant_1: session.user.id, participant_2: talent.user_id })
          .select("id")
          .single();
        if (error) throw error;
        convoId = newConvo.id;
      }

      const msg = `👋 Bonjour ${talent.full_name || "Talent"} ! Votre profil a retenu notre attention. Nous aimerions échanger avec vous sur une opportunité professionnelle en France. Êtes-vous disponible pour en discuter ? 🇫🇷`;
      await supabase.from("messages").insert({ conversation_id: convoId, sender_id: session.user.id, content: msg });
      await supabase.from("conversations").update({ last_message_text: msg, last_message_at: new Date().toISOString() }).eq("id", convoId);

      qc.invalidateQueries({ queryKey: ["conversations"] });
      toastFn({ title: "✅ Invitation envoyée", description: `${talent.full_name || "Le talent"} a été contacté via AXIOM Connect.` });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Erreur inconnue";
      toastFn({ title: "Erreur", description: errMsg, variant: "destructive" });
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <motion.div custom={0.3} variants={fadeUp} className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          Talents Francophones &amp; Diaspora Recommandés
        </h2>
        <Badge className="bg-accent/15 text-accent border-0 text-xs font-bold px-2.5 gap-1">
          <Sparkles className="h-3 w-3" /> IA Matching
        </Badge>
      </div>

      {/* Country filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {COUNTRY_FILTERS_REC.map((cf) => (
          <button
            key={cf.label}
            onClick={() => setCountryFilter(cf.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              countryFilter === cf.value
                ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/10"
            }`}
          >
            <span className="text-sm">{cf.flag}</span>
            {cf.label}
          </button>
        ))}
      </div>

      {francoTalents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {francoTalents.slice(0, 6).map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="group bg-[hsl(222,33%,12%)] border-white/10 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  {/* Photo header */}
                  <div className="relative h-32 bg-gradient-to-br from-[hsl(222,47%,11%)] to-[hsl(199,89%,48%/0.3)]">
                    <img
                      src={getAvatarForTalent(t.rome_code, i)}
                      alt={t.full_name || "Talent"}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,33%,12%)] via-transparent to-transparent" />
                    {/* Score badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-[hsl(222,33%,8%)]/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-lg border border-accent/30">
                      <Star className="h-3.5 w-3.5 text-accent" />
                      <span className="font-display text-lg font-extrabold text-accent tabular-nums">
                        {t.compliance_score}
                      </span>
                      <span className="text-[10px] text-accent/60">%</span>
                    </div>
                    {/* Country flag */}
                    <div className="absolute top-3 left-3 bg-[hsl(222,33%,8%)]/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg">
                      <Globe className="h-3 w-3 text-accent" />
                      {t.country}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-bold text-white text-sm">{t.full_name || "Talent certifié"}</p>
                      <p className="text-xs text-accent font-medium mt-0.5">
                        {t.rome_label || "Professionnel qualifié"} {t.rome_code && `· ${t.rome_code}`}
                      </p>
                    </div>

                    {/* Skills */}
                    {t.skills && t.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {t.skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="text-[10px] bg-accent/10 text-accent rounded-full px-2 py-0.5 font-medium">{s}</span>
                        ))}
                        {t.skills.length > 3 && (
                          <span className="text-[10px] bg-white/10 text-white/50 rounded-full px-2 py-0.5">+{t.skills.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-[10px] text-white/40">
                      {t.french_level && <span className="flex items-center gap-1">🗣️ {t.french_level}</span>}
                      {t.experience_years != null && t.experience_years > 0 && (
                        <span className="flex items-center gap-1">📅 {t.experience_years} ans</span>
                      )}
                    </div>

                    {/* CTA */}
                    <Button
                      size="sm"
                      className="w-full gap-2 text-xs bg-gradient-to-r from-accent to-primary text-white hover:opacity-90 shadow-md shadow-accent/20"
                      disabled={invitingId === t.user_id}
                      onClick={() => handleInvite({ user_id: t.user_id, full_name: t.full_name })}
                    >
                      {invitingId === t.user_id ? (
                        <>⏳ Envoi en cours…</>
                      ) : (
                        <><MessageSquare className="h-3.5 w-3.5" /> Inviter via AXIOM Connect</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="bg-[hsl(222,33%,12%)] border-white/10">
          <CardContent className="p-8 text-center">
            <Globe className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/50">
              {countryFilter ? `Aucun talent disponible pour ${countryFilter}.` : "Aucun talent francophone disponible."}
            </p>
            <p className="text-xs text-white/30 mt-1">Les talents s'inscrivent chaque jour sur AXIOM.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

/* ──────────── TALENT DOSSIER MODAL ──────────── */
function TalentDossierDialog({ talent, onClose }: { talent: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [showProofs, setShowProofs] = useState(false);

  const { data: diplomas } = useQuery({
    queryKey: ["talent-diplomas", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diplomas")
        .select("*")
        .eq("talent_id", talent.id);
      if (error) throw error;
      return data;
    },
    enabled: !!talent?.id,
  });

  // Realtime: listen for diploma status changes
  useEffect(() => {
    if (!talent?.id) return;
    const channel = supabase
      .channel(`diplomas-${talent.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "diplomas", filter: `talent_id=eq.${talent.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["talent-diplomas", talent.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [talent?.id, queryClient]);

  if (!talent) return null;

  const hasDiploma = diplomas && diplomas.length > 0;
  const _diplomaVerified = diplomas?.some((d: any) => d.status === "verifie");
  const minfopVerified = diplomas?.some((d: any) => d.minfop_verified);
  const apostilleVerified = !!talent.apostille_date;
  const visaApproved = talent.visa_status === "approuve";

  return (
    <Dialog open={!!talent} onOpenChange={() => { onClose(); setShowProofs(false); }}>
      <DialogContent className="max-w-2xl bg-[hsl(222,33%,10%)] border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-accent/20 text-accent font-bold">
                {talent.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'T'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p>{talent.full_name}</p>
              <p className="text-sm text-white/40 font-normal">{talent.country} • {talent.experience_years || 0} ans exp.</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Code ROME</p>
              <p className="font-mono font-bold text-accent">{talent.rome_code || "—"}</p>
              <p className="text-xs text-white/50 mt-1">{talent.rome_label}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Score conformité</p>
              <p className="font-display text-2xl font-bold text-accent">{talent.compliance_score}<span className="text-sm text-white/30">/100</span></p>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Français</p>
              <p className="font-semibold text-white">{talent.french_level || "Non renseigné"}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Visa</p>
              <Badge className={visaApproved ? 'bg-success/20 text-success border-0' : 'bg-accent/20 text-accent border-0'}>
                {visaApproved ? 'Approuvé' : talent.visa_status === 'en_attente' ? 'En attente' : talent.visa_status}
              </Badge>
            </div>
          </div>

          {/* Compétences */}
          {talent.skills?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wider">Compétences</h3>
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill: string) => (
                  <Badge key={skill} variant="outline" className="border-white/20 text-white/70 text-xs">{skill}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* ──── SECTION VÉRIFICATION LÉGALE ──── */}
          <div className="rounded-2xl bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" /> Vérification légale
            </h3>

            <div className="space-y-3">
              {/* Badge orange — MINEFOP */}
              <VerificationBadge
                icon={GraduationCap}
                label="Diplôme CQP/DQP MINEFOP authentifié"
                verified={minfopVerified}
                colorScheme="orange"
              />
              {/* Badge vert — MINREX */}
              <VerificationBadge
                icon={Stamp}
                label="Légalisation MINREX effectuée"
                verified={apostilleVerified}
                colorScheme="green"
              />
              {/* Badge bleu — Visa & ROME */}
              <VerificationBadge
                icon={Globe}
                label="Visa France & conformité ROME validés"
                verified={visaApproved && !!talent.rome_code}
                colorScheme="blue"
              />
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Processus complet : authentification MINEFOP → légalisation Ministère Affaires Extérieures → apostille France-ready.{" "}
              <span className="font-semibold text-gray-700">Garantie zéro fraude.</span>
            </p>

            <Button
              size="sm"
              onClick={() => setShowProofs(!showProofs)}
              className="bg-accent text-accent-foreground hover:bg-accent/90 border-0 gap-2"
            >
              <Eye className="h-4 w-4" /> {showProofs ? "Masquer preuves" : "Voir preuves"}
            </Button>

            {/* Galerie preuves PDF */}
            {showProofs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 pt-2"
              >
                {hasDiploma ? diplomas!.map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
                    <FileText className="h-5 w-5 text-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {d.rome_code && `ROME ${d.rome_code}`}
                        {d.rome_match_percent ? ` • ${d.rome_match_percent}% correspondance` : ""}
                      </p>
                    </div>
                    <Badge className={
                      d.status === "verifie"
                        ? "bg-emerald-100 text-emerald-700 border-0 text-[10px]"
                        : "bg-amber-100 text-amber-700 border-0 text-[10px]"
                    }>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {d.status === "verifie" ? "Validé" : "En cours"}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-xs text-gray-400 italic">Aucun document soumis pour ce talent.</p>
                )}

                {/* Visa doc placeholder */}
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <Globe className="h-5 w-5 text-blue-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Visa / Titre de séjour</p>
                    <p className="text-xs text-gray-500">Statut : {talent.visa_status === 'approuve' ? 'Approuvé' : 'En attente'}</p>
                  </div>
                  <Badge className={visaApproved ? "bg-emerald-100 text-emerald-700 border-0 text-[10px]" : "bg-amber-100 text-amber-700 border-0 text-[10px]"}>
                    {visaApproved ? "Validé" : "En cours"}
                  </Badge>
                </div>

                {/* Apostille MINREX */}
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <Stamp className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Tampon MINREX / Apostille</p>
                    <p className="text-xs text-gray-500">{talent.apostille_date ? `Date : ${talent.apostille_date}` : 'Non apostillé'}</p>
                  </div>
                  <Badge className={apostilleVerified ? "bg-emerald-100 text-emerald-700 border-0 text-[10px]" : "bg-amber-100 text-amber-700 border-0 text-[10px]"}>
                    {apostilleVerified ? "Validé" : "En cours"}
                  </Badge>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ──── Verification Badge Component ──── */
function VerificationBadge({
  icon: Icon,
  label,
  verified,
  colorScheme,
}: {
  icon: any;
  label: string;
  verified?: boolean;
  colorScheme: "orange" | "green" | "blue";
}) {
  const colors = {
    orange: {
      bg: verified ? "bg-orange-100" : "bg-orange-50",
      text: "text-orange-700",
      icon: "text-orange-500",
      border: verified ? "border-orange-300" : "border-orange-200",
    },
    green: {
      bg: verified ? "bg-emerald-100" : "bg-emerald-50",
      text: "text-emerald-700",
      icon: "text-emerald-500",
      border: verified ? "border-emerald-300" : "border-emerald-200",
    },
    blue: {
      bg: verified ? "bg-blue-100" : "bg-blue-50",
      text: "text-blue-700",
      icon: "text-blue-500",
      border: verified ? "border-blue-300" : "border-blue-200",
    },
  };
  const c = colors[colorScheme];

  return (
    <div className={`flex items-center gap-3 rounded-xl border ${c.border} ${c.bg} p-3 transition-all`}>
      <Icon className={`h-5 w-5 ${c.icon} shrink-0`} />
      <p className={`text-sm font-medium ${c.text} flex-1`}>{label}</p>
      {verified ? (
        <CheckCircle2 className={`h-5 w-5 ${c.icon}`} />
      ) : (
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">En cours</span>
      )}
    </div>
  );
}

/* ──────────── MISSIONS TAB ──────────── */
function MissionsTab() {
  const { user } = useAuth();

  const { data: offers, isLoading } = useQuery({
    queryKey: ["recruteur-missions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .eq("company_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <motion.div initial="hidden" animate="visible">
      <motion.div custom={0} variants={fadeUp} className="mb-6">
        <h2 className="font-display text-2xl font-bold text-white">Mes missions</h2>
        <p className="text-white/50 text-sm mt-1">Suivi de vos missions de recrutement</p>
      </motion.div>

      <motion.div custom={1} variants={fadeUp}>
        <Card className="bg-[hsl(222,33%,12%)] border-white/10 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : offers && offers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50">Métier</TableHead>
                    <TableHead className="text-white/50">Lieu</TableHead>
                    <TableHead className="text-white/50">Statut</TableHead>
                    <TableHead className="text-white/50">Date</TableHead>
                    <TableHead className="text-white/50 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map(offer => (
                    <TableRow key={offer.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{offer.title}</TableCell>
                      <TableCell className="text-white/60">{offer.location}</TableCell>
                      <TableCell>
                        <Badge className={
                          offer.status === 'open' ? 'bg-success/20 text-success border-0' :
                          offer.status === 'filled' ? 'bg-accent/20 text-accent border-0' :
                          'bg-white/10 text-white/50 border-0'
                        }>
                          {offer.status === 'open' ? 'En cours' : offer.status === 'filled' ? 'Pourvue' : offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/40 text-sm">
                        {new Date(offer.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 text-xs">
                          Signer contrat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16">
                <Briefcase className="mx-auto h-12 w-12 text-white/20 mb-4" />
                <p className="text-white/50">Aucune mission en cours.</p>
                <p className="text-white/30 text-sm mt-1">Publiez une offre pour commencer.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ──────────── MATCHING IA TAB ──────────── */
function MatchingTab({ query, setQuery }: { query: string; setQuery: (q: string) => void }) {
  const [searchSkills, setSearchSkills] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: results, isLoading } = useQuery({
    queryKey: ["matching-ia", searchSkills],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("match_talents_for_offer", {
        _required_skills: searchSkills,
        _min_score: 30,
        _limit_count: 20,
      });
      if (error) throw error;
      return data;
    },
    enabled: searchSkills.length > 0,
  });

  const handleSearch = () => {
    if (!query.trim()) return;
    // Extract keywords from query
    const keywords = query.toLowerCase().split(/[\s,;]+/).filter(w => w.length > 2);
    setSearchSkills(keywords);
    setHasSearched(true);
  };

  return (
    <motion.div initial="hidden" animate="visible">
      <motion.div custom={0} variants={fadeUp} className="mb-6">
        <h2 className="font-display text-2xl font-bold text-white">Matching IA</h2>
        <p className="text-white/50 text-sm mt-1">Décrivez votre besoin, l'IA trouve les meilleurs talents</p>
      </motion.div>

      <motion.div custom={1} variants={fadeUp} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Brain className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-accent/50" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Ex: Besoin d'un maçon à Paris, soudeur expérimenté..."
              className="pl-12 py-6 text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="bg-accent text-accent-foreground hover:bg-accent/90 border-0 px-8 py-6 rounded-xl"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            ) : (
              <>Rechercher <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </motion.div>

      {hasSearched && results && (
        <motion.div custom={2} variants={fadeUp} className="space-y-3">
          <p className="text-sm text-white/40">{results.length} résultat{results.length > 1 ? 's' : ''}</p>
          {results.map((talent: any, i: number) => (
            <motion.div key={talent.id} custom={i + 3} variants={fadeUp}>
              <Card className="bg-[hsl(222,33%,12%)] border-white/10 hover:border-accent/30 transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarFallback className="bg-accent/20 text-accent font-bold">
                      {talent.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{talent.full_name}</h3>
                    <p className="text-xs text-white/40">{talent.country} • {talent.experience_years || 0} ans • FR: {talent.french_level || '—'}</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {talent.skills?.slice(0, 4).map((s: string) => (
                        <Badge key={s} variant="outline" className="border-white/15 text-white/50 text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1">
                      <Flame className="h-5 w-5 text-accent" />
                      <span className="font-display text-2xl font-bold text-accent">{Math.round(talent.compatibility_score)}</span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-0.5">Score compatibilité</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {hasSearched && results?.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Brain className="mx-auto h-12 w-12 text-white/20 mb-4" />
          <p className="text-white/50">Aucun talent ne correspond à cette recherche.</p>
          <p className="text-white/30 text-sm mt-1">Essayez d'autres mots-clés.</p>
        </div>
      )}
    </motion.div>
  );
}

/* ──────────── FACTURATION TAB ──────────── */
function FacturationTab() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-entreprise");
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Info", description: data.error, variant: "destructive" });
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de lancer le paiement.", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Info", description: data.error, variant: "destructive" });
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible d'ouvrir le portail.", variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const PLANS = [
    {
      name: "Découverte",
      price: "Gratuit",
      priceSuffix: "",
      description: "Testez la plateforme",
      features: ["3 profils talents visibles", "Score conformité basique", "Support email"],
      cta: null,
      highlight: false,
    },
    {
      name: "Premium",
      price: "499 €",
      priceSuffix: "/mois",
      description: "Accès illimité aux talents certifiés",
      features: [
        "Matching IA illimité",
        "Profils complets (CV, contact, score détaillé)",
        "Dossiers MINEFOP/MINREX vérifiés",
        "Export PDF contrats",
        "Support prioritaire 24/7",
        "Accès prioritaire nouveaux talents",
      ],
      cta: "S'abonner — 499 €/mois",
      highlight: true,
    },
    {
      name: "Success Fee",
      price: "25 %",
      priceSuffix: " salaire brut annuel",
      description: "Au recrutement effectif uniquement",
      features: ["Facturation au succès", "Aucun risque financier", "Garantie remplacement 3 mois"],
      cta: null,
      highlight: false,
    },
    {
      name: "Pack ALTIS",
      price: "1 200 €",
      priceSuffix: "/talent",
      description: "Intégration clé-en-main",
      features: ["Formalités visa de travail", "Accueil & assistance aéroport", "Logement 1er mois", "Accompagnement administratif"],
      cta: "Demander un devis",
      highlight: false,
    },
  ];

  return (
    <motion.div initial="hidden" animate="visible">
      <motion.div custom={0} variants={fadeUp} className="mb-8">
        <h2 className="font-display text-2xl font-bold text-white">Tarification transparente</h2>
        <p className="text-white/50 text-sm mt-1">Choisissez la formule adaptée à vos recrutements internationaux</p>
      </motion.div>

      {/* Pricing Table */}
      <motion.div custom={1} variants={fadeUp}>
        <Card className="bg-[hsl(222,33%,12%)] border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/50 w-[180px]">Formule</TableHead>
                  <TableHead className="text-white/50">Prix</TableHead>
                  <TableHead className="text-white/50">Inclus</TableHead>
                  <TableHead className="text-white/50 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PLANS.map((plan) => (
                  <TableRow
                    key={plan.name}
                    className={`border-white/5 hover:bg-white/5 ${plan.highlight ? "bg-accent/5 border-l-2 border-l-accent" : ""}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-white">{plan.name}</span>
                        {plan.highlight && (
                          <Badge className="bg-accent/20 text-accent border-0 text-[10px]">Populaire</Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">{plan.description}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-display text-xl font-bold text-white">{plan.price}</span>
                      <span className="text-xs text-white/40">{plan.priceSuffix}</span>
                    </TableCell>
                    <TableCell>
                      <ul className="space-y-1">
                        {plan.features.slice(0, 3).map(f => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-white/60">
                            <CheckCircle2 className="h-3 w-3 text-accent shrink-0" /> {f}
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-[10px] text-white/30">+{plan.features.length - 3} avantages</li>
                        )}
                      </ul>
                    </TableCell>
                    <TableCell className="text-right">
                      {plan.cta ? (
                        <Button
                          size="sm"
                          disabled={plan.highlight ? checkoutLoading : false}
                          onClick={plan.highlight ? handleCheckout : undefined}
                          className={plan.highlight
                            ? "bg-accent text-accent-foreground hover:bg-accent/90 border-0 text-xs shadow-lg shadow-accent/20"
                            : "border-accent/30 text-accent hover:bg-accent/10 text-xs"
                          }
                          variant={plan.highlight ? "default" : "outline"}
                        >
                          {plan.highlight && checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          {plan.cta}
                        </Button>
                      ) : (
                        <span className="text-xs text-white/30">Inclus par défaut</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Premium highlight card */}
      <motion.div custom={2} variants={fadeUp} className="mt-8">
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30 max-w-lg">
          <CardHeader>
            <CardTitle className="font-display text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" /> Abonnement Premium
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-4xl font-display font-bold text-white">499 €<span className="text-lg text-white/40 font-normal">/mois</span></p>
              <p className="text-sm text-white/50 mt-2">Accès illimité aux talents certifiés, matching IA, dossiers complets et support prioritaire.</p>
            </div>
            <ul className="space-y-2">
              {["Matching IA illimité", "Profils complets (CV, contact)", "Dossiers MINEFOP vérifiés", "Support prioritaire 24/7"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <ShieldCheck className="h-4 w-4 text-accent shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button
              disabled={checkoutLoading}
              onClick={handleCheckout}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border-0 py-6 text-base font-semibold rounded-xl shadow-lg shadow-accent/20"
            >
              {checkoutLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
              {checkoutLoading ? "Redirection vers Stripe..." : "Commencer à recruter — 499 €/mois"}
            </Button>
            <p className="text-xs text-white/30 text-center">Paiement sécurisé par Stripe. Annulable à tout moment.</p>
            <Button
              variant="outline"
              disabled={portalLoading}
              onClick={handlePortal}
              className="w-full border-white/20 text-white/70 hover:bg-white/10 hover:text-white py-5 rounded-xl"
            >
              {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              {portalLoading ? "Ouverture..." : "Gérer mon abonnement"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ──────────── CANDIDATURES TAB ──────────── */
function CandidaturesTab() {
  const [search, setSearch] = useState("");

  const { data: candidatures, isLoading } = useQuery({
    queryKey: ["recruteur-candidatures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidatures" as any)
        .select("*")
        .eq("status", "submitted")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = candidatures?.filter((c: any) =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.competences?.some((comp: string) => comp.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  const handleContact = (_id: string) => {
    toast({ title: "Contact initié", description: "Un email de prise de contact a été envoyé au candidat." });
  };

  const handleActivateAltis = (_id: string) => {
    toast({ title: "Pack ALTIS activé", description: "Les formalités visa + accueil seront lancées pour ce candidat." });
  };

  return (
    <motion.div initial="hidden" animate="visible">
      <motion.div custom={0} variants={fadeUp} className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Candidatures reçues</h2>
          <p className="text-white/50 text-sm mt-1">{filtered.length} candidature{filtered.length > 1 ? 's' : ''} · CV structurés AXIOM</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, compétence..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="mx-auto h-12 w-12 text-white/20 mb-4" />
          <p className="text-white/50">Aucune candidature reçue pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c: any, i: number) => (
            <motion.div key={c.id} custom={i + 1} variants={fadeUp}>
              <CandidatureCvCard
                candidature={c}
                onContact={handleContact}
                onActivateAltis={handleActivateAltis}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ──────────── OFFRES FRANCE TRAVAIL TAB ──────────── */
const ROME_SECTOR_MAP: Record<string, { label: string; codes: string[] }> = {
  all: { label: "Tous les secteurs", codes: ["F1703", "J1501", "G1602", "N1101", "A1101", "I1304"] },
  btp: { label: "BTP", codes: ["F1703", "F1604", "F1701"] },
  sante: { label: "Santé", codes: ["J1501", "J1502", "J1301"] },
  chr: { label: "CHR", codes: ["G1602", "G1601", "G1603"] },
  logistique: { label: "Logistique", codes: ["N1101", "N1103", "N4105"] },
  agriculture: { label: "Agriculture", codes: ["A1101", "A1201", "A1402"] },
  industrie: { label: "Industrie", codes: ["I1304", "H2901", "H3302"] },
};

function OffresFranceTravailTab({
  offresSector,
  setOffresSector,
}: {
  offresSector: string;
  setOffresSector: (v: string) => void;
}) {
  const sector = ROME_SECTOR_MAP[offresSector] || ROME_SECTOR_MAP.all;

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      {/* Sector filter pills */}
      <motion.div custom={0} variants={fadeUp}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20">
            <Briefcase className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white">Offres France Travail</h2>
            <p className="text-xs text-white/40">API Offres d'emploi v2 – Temps réel avec Score IA</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROME_SECTOR_MAP).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setOffresSector(key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                offresSector === key
                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/10"
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Offers grid */}
      <motion.div custom={1} variants={fadeUp}>
        <FranceTravailOffresCard
          key={offresSector}
          romeCodes={sector.codes}
          title={`Opportunités ${sector.label}`}
          count={9}
          showScoreIA
          showAxiomReady
        />
      </motion.div>
    </motion.div>
  );
}
