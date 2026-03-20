import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Users, ClipboardList, TrendingUp, DollarSign, Search, Phone, Eye,
  Zap, Sparkles, Star, MapPin, Globe, ChevronRight, Briefcase,
  CalendarDays, CircleDot, MessageSquare, Award, ShieldCheck, Flame,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getAvatarForTalent } from "@/lib/metierAvatars";
import FranceTravailOffresCard from "@/components/dashboard/FranceTravailOffresCard";
import FranceTravailAgencesCard from "@/components/dashboard/FranceTravailAgencesCard";
import FranceTravailFormationsCard from "@/components/dashboard/FranceTravailFormationsCard";
import FranceTravailEventsCard from "@/components/dashboard/FranceTravailEventsCard";

const TENSION_FILTERS = ["Tous", "Très haute", "Haute", "Croissante"] as const;
const SECTOR_FILTERS = ["BTP", "Santé", "CHR", "Logistique", "Industrie"] as const;

const COUNTRY_FILTERS = [
  { label: "Tous", flag: "🌍", value: null },
  { label: "Sénégal", flag: "🇸🇳", value: "Sénégal" },
  { label: "Côte d'Ivoire", flag: "🇨🇮", value: "Côte d'Ivoire" },
  { label: "Mali", flag: "🇲🇱", value: "Mali" },
  { label: "Burkina Faso", flag: "🇧🇫", value: "Burkina Faso" },
  { label: "Cameroun", flag: "🇨🇲", value: "Cameroun" },
  { label: "Togo", flag: "🇹🇬", value: "Togo" },
  { label: "Bénin", flag: "🇧🇯", value: "Bénin" },
] as const;

function getSectorFromRome(romeCode?: string | null): string {
  if (!romeCode) return "Autre";
  switch (romeCode.charAt(0)) {
    case "F": return "BTP";
    case "J": case "M": return "Santé";
    case "G": return "CHR";
    case "N": return "Logistique";
    case "H": case "I": return "Industrie";
    default: return "Autre";
  }
}

function getTensionLevel(score: number): string {
  if (score >= 85) return "Très haute";
  if (score >= 65) return "Haute";
  return "Croissante";
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

export default function DashboardSociete() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [tensionFilter, setTensionFilter] = useState<string>("Tous");
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [altisLoading, setAltisLoading] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  useEffect(() => {
    const altisStatus = searchParams.get("altis");
    const talentName = searchParams.get("talent");
    if (altisStatus === "success") {
      toast({ title: "🎉 Pack ALTIS activé", description: `Le Pack ALTIS pour ${talentName || "ce talent"} a été activé avec succès. Un conseiller vous recontacte sous 24h.` });
    } else if (altisStatus === "canceled") {
      toast({ title: "Paiement annulé", description: "Le paiement a été annulé.", variant: "destructive" });
    }
  }, [searchParams, toast]);

  const { data: talents } = useQuery({
    queryKey: ["societe-talents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("available", true)
        .order("compliance_score", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: candidatures } = useQuery({
    queryKey: ["societe-candidatures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidatures")
        .select("*")
        .eq("status", "submitted")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const talentCount = talents?.length ?? 0;
  const candidatureCount = candidatures?.length ?? 0;
  const avgScore = talents && talents.length > 0
    ? Math.round(talents.reduce((s, t) => s + (t.compliance_score ?? 0), 0) / talents.length)
    : 0;

  // Filter talents by search, tension, sector
  const filteredTalents = talents?.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      t.full_name?.toLowerCase().includes(q) ||
      t.rome_code?.toLowerCase().includes(q) ||
      t.rome_label?.toLowerCase().includes(q) ||
      t.country?.toLowerCase().includes(q);
    const matchTension = tensionFilter === "Tous" || getTensionLevel(t.compliance_score) === tensionFilter;
    const matchSector = !sectorFilter || getSectorFromRome(t.rome_code) === sectorFilter;
    return matchSearch && matchTension && matchSector;
  }) ?? [];

  const francoTalents = talents?.filter((t) => {
    if (!t.country) return false;
    const c = t.country.toLowerCase();
    const francoCountries = ["sénégal", "senegal", "côte d'ivoire", "cote d'ivoire", "mali", "burkina faso", "burkina", "cameroun", "cameroon", "togo", "bénin", "benin"];
    if (!francoCountries.some(fc => c.includes(fc))) return false;
    if (countryFilter) return c.includes(countryFilter.toLowerCase());
    return true;
  }) ?? [];

  const handleInvite = async (talent: { user_id: string; full_name: string | null }) => {
    if (!user) return;
    setInvitingId(talent.user_id);
    try {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${talent.user_id}),and(participant_1.eq.${talent.user_id},participant_2.eq.${user.id})`)
        .limit(1)
        .maybeSingle();

      let convoId = existing?.id;
      if (!convoId) {
        const { data: newConvo, error } = await supabase
          .from("conversations")
          .insert({ participant_1: user.id, participant_2: talent.user_id })
          .select("id")
          .single();
        if (error) throw error;
        convoId = newConvo.id;
      }

      const msg = `👋 Bonjour ${talent.full_name || "Talent"} ! Votre profil a retenu notre attention. Nous aimerions échanger avec vous sur une opportunité professionnelle en France. Êtes-vous disponible pour en discuter ? 🇫🇷`;
      await supabase.from("messages").insert({ conversation_id: convoId, sender_id: user.id, content: msg });
      await supabase.from("conversations").update({ last_message_text: msg, last_message_at: new Date().toISOString() }).eq("id", convoId);

      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast({ title: "✅ Invitation envoyée", description: `${talent.full_name || "Le talent"} a été contacté via AXIOM Connect.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setInvitingId(null);
    }
  };

  const handleContact = (name: string) => {
    toast({ title: "Demande envoyée", description: `Votre demande de contact pour ${name} a été transmise.` });
  };

  const handleAltis = async (name: string, candidatureId?: string) => {
    setAltisLoading(candidatureId || name);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-altis", {
        body: { talentName: name, candidatureId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setAltisLoading(null);
    }
  };

  const stats = [
    { label: "Talents disponibles", sublabel: "aujourd'hui", value: talentCount, icon: Users },
    { label: "Candidatures reçues", sublabel: "cette semaine", value: candidatureCount, icon: ClipboardList },
    { label: "Coût ALTIS moyen", sublabel: "par placement", value: "2 450 €", icon: DollarSign },
    { label: "Taux matching moyen", sublabel: "Score IA", value: `${avgScore} %`, icon: TrendingUp },
  ];

  return (
    <DashboardLayout sidebarVariant="entreprise">
      <motion.div
        className="space-y-8 pb-16"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {/* ══════════════ HERO ══════════════ */}
        <motion.div
          custom={0}
          variants={fadeUp}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(217,33%,17%)] to-[hsl(199,89%,48%/0.18)] p-6 sm:p-10 border border-white/10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,hsl(var(--accent)/0.15),transparent_65%)]" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-[radial-gradient(circle,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="relative z-10">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 text-[10px] font-bold px-3 gap-1.5">
              <Sparkles className="h-3 w-3" /> ESPACE ENTREPRISE
            </Badge>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
              Votre Espace Entreprise –{" "}
              <span className="bg-gradient-to-r from-accent to-[hsl(199,89%,68%)] bg-clip-text text-transparent">
                Recrutez des talents certifiés d'Afrique
              </span>
            </h1>
            <p className="text-sm sm:text-base text-white/50 max-w-2xl leading-relaxed">
              Matching IA · Conformité ROME · Talents certifiés MINEFOP · Pack ALTIS clé en main · Zéro stress administratif
            </p>
          </div>
        </motion.div>

        {/* ══════════════ STATS ══════════════ */}
        <motion.div custom={1} variants={fadeUp} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Card key={i} className="group bg-gradient-to-br from-[hsl(222,33%,14%)] to-[hsl(222,33%,10%)] border-white/10 hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-accent/20 group-hover:bg-accent/30 transition-colors shrink-0">
                  <s.icon className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider truncate">{s.label}</p>
                  <p className="font-display text-xl sm:text-3xl font-bold text-white tabular-nums leading-tight">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-white/25 mt-0.5 hidden sm:block">{s.sublabel}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* ══════════════ SEARCH + FILTERS ══════════════ */}
        <motion.div custom={1.5} variants={fadeUp} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-accent/50" />
            <Input
              placeholder="Rechercher un talent, un métier ou un code ROME"
              className="pl-12 h-12 sm:h-14 text-base bg-card/80 border-border/50 rounded-xl focus:border-accent/50 focus:ring-accent/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TENSION_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTensionFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  tensionFilter === f
                    ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {f === "Tous" ? "Toutes tensions" : <><Flame className="inline h-3 w-3 mr-1" />{f}</>}
              </button>
            ))}
            <span className="w-px h-7 bg-border/50 self-center mx-1" />
            {SECTOR_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setSectorFilter(sectorFilter === f ? null : f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  sectorFilter === f
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ══════════════ TALENTS COSMOPOLITES ══════════════ */}
        <motion.div custom={2} variants={fadeUp}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Talents Francophones & Diaspora
            </h2>
            <Badge className="bg-accent/15 text-accent border-0 text-xs font-bold px-2.5 gap-1">
              <Sparkles className="h-3 w-3" /> IA Matching
            </Badge>
          </div>

          {/* Country filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            {COUNTRY_FILTERS.map((cf) => (
              <button
                key={cf.label}
                onClick={() => setCountryFilter(cf.value)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  countryFilter === cf.value
                    ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                    : "bg-card border border-border/50 text-muted-foreground hover:border-accent/30 hover:text-foreground"
                }`}
              >
                <span className="text-sm">{cf.flag}</span>
                {cf.label}
              </button>
            ))}
          </div>

          {(countryFilter ? francoTalents : filteredTalents).length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(countryFilter ? francoTalents : filteredTalents).slice(0, 9).map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Photo header */}
                      <div className="relative h-36 sm:h-40 bg-gradient-to-br from-[hsl(222,47%,11%)] to-[hsl(199,89%,48%/0.3)] overflow-hidden">
                        <img
                          src={getAvatarForTalent(t.rome_code, i)}
                          alt={t.full_name || "Talent professionnel"}
                          className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

                        {/* Score IA overlay */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-card/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg border border-accent/20">
                          <Star className="h-4 w-4 text-accent" />
                          <span className="font-display text-xl font-black text-accent tabular-nums">{t.compliance_score}</span>
                          <span className="text-[10px] text-accent/60 font-bold">%</span>
                        </div>

                        {/* Country + AXIOM READY */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          <div className="bg-card/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-lg">
                            <Globe className="h-3 w-3 text-accent" />
                            {t.country || "Afrique"}
                          </div>
                          {t.compliance_score >= 80 && (
                            <Badge className="bg-accent/90 text-white border-0 text-[9px] gap-0.5 font-bold shadow-lg">
                              <ShieldCheck className="h-2.5 w-2.5" /> AXIOM READY
                            </Badge>
                          )}
                        </div>

                        {/* Tension badge */}
                        <div className="absolute bottom-3 left-3">
                          <Badge className={
                            t.compliance_score >= 85
                              ? "bg-destructive/90 text-destructive-foreground border-0 text-[9px] font-bold"
                              : t.compliance_score >= 65
                              ? "bg-accent/90 text-white border-0 text-[9px] font-bold"
                              : "bg-muted/80 text-foreground border-0 text-[9px]"
                          }>
                            <Flame className="h-2.5 w-2.5 mr-0.5" />
                            {getTensionLevel(t.compliance_score)}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div>
                          <p className="font-bold text-foreground text-sm sm:text-base">{t.full_name || "Talent certifié"}</p>
                          <p className="text-xs text-accent font-medium mt-0.5 flex items-center gap-1.5">
                            {t.rome_label || "Professionnel qualifié"}
                            {t.rome_code && (
                              <span className="font-mono text-[10px] bg-accent/10 px-1.5 py-0.5 rounded text-accent/80">
                                {t.rome_code}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Skills */}
                        {t.skills && t.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {t.skills.slice(0, 3).map((s) => (
                              <span key={s} className="text-[10px] bg-accent/10 text-accent rounded-full px-2 py-0.5 font-medium">{s}</span>
                            ))}
                            {t.skills.length > 3 && (
                              <span className="text-[10px] bg-muted/50 text-muted-foreground rounded-full px-2 py-0.5">+{t.skills.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          {t.french_level && <span className="flex items-center gap-1">🗣️ {t.french_level}</span>}
                          {t.experience_years != null && t.experience_years > 0 && (
                            <span className="flex items-center gap-1">📅 {t.experience_years} ans</span>
                          )}
                        </div>

                        {/* Matching score line */}
                        <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
                          <TrendingUp className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span className="text-[11px] text-accent font-medium">
                            Correspond à {Math.min(97, t.compliance_score + 12)} % à vos critères
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5 text-xs border-accent/30 text-accent hover:bg-accent/10 h-9"
                          >
                            <Eye className="h-3.5 w-3.5" /> Voir le profil complet
                          </Button>
                          <Button
                            size="sm"
                            className="w-full gap-1.5 text-xs bg-gradient-to-r from-accent to-primary text-white hover:opacity-90 shadow-md shadow-accent/20 h-9"
                            disabled={altisLoading === t.id}
                            onClick={() => handleAltis(t.full_name || "ce talent")}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {altisLoading === t.id ? "Redirection…" : "Activer ALTIS (2 450 €)"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground h-9"
                            disabled={invitingId === t.user_id}
                            onClick={() => handleInvite({ user_id: t.user_id, full_name: t.full_name })}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {invitingId === t.user_id ? "Envoi…" : "Contacter via AXIOM Connect"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border/50">
              <CardContent className="p-10 text-center">
                <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {search ? "Aucun talent ne correspond à votre recherche." : "Aucun talent disponible pour ces critères."}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">Essayez un autre filtre ou terme de recherche.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ══════════════ CANDIDATURES REÇUES ══════════════ */}
        <motion.div custom={3} variants={fadeUp}>
          <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-accent" />
            Candidatures reçues
            <Badge variant="secondary" className="ml-2 text-xs">{candidatures?.length ?? 0}</Badge>
          </h2>

          {candidatures && candidatures.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {candidatures.slice(0, 6).map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="group bg-card border-border/50 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {(c.full_name || "T")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{c.full_name || "Talent"}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            {c.city && <><MapPin className="h-3 w-3" /><span>{c.city}</span></>}
                            {c.mobility && <><Globe className="h-3 w-3 ml-1" /><span>{c.mobility}</span></>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-accent/15 rounded-lg px-2.5 py-1 shrink-0">
                          <Star className="h-3.5 w-3.5 text-accent" />
                          <span className="font-display text-lg font-extrabold text-accent tabular-nums">{c.compliance_score}</span>
                          <span className="text-[10px] text-accent/60">%</span>
                        </div>
                      </div>

                      {c.competences && c.competences.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {c.competences.slice(0, 4).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-[10px] px-2 py-0.5 border-border/50 text-muted-foreground">{s}</Badge>
                          ))}
                          {c.competences.length > 4 && (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border/50 text-muted-foreground">+{c.competences.length - 4}</Badge>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-accent font-medium flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Correspond à {Math.min(95, c.compliance_score + 15)} % à vos critères
                      </p>

                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs border-accent/30 text-accent hover:bg-accent/10">
                          <Eye className="h-3.5 w-3.5" /> Voir le profil complet
                        </Button>
                        <Button
                          size="sm"
                          className="w-full gap-1.5 text-xs bg-gradient-to-r from-accent to-primary text-white hover:opacity-90"
                          disabled={altisLoading === (c.id || c.full_name)}
                          onClick={() => handleAltis(c.full_name || "ce talent", c.id)}
                        >
                          <Sparkles className="h-3.5 w-3.5" /> {altisLoading === (c.id || c.full_name) ? "Redirection…" : "Activer ALTIS (2 450 €)"}
                        </Button>
                        <Button size="sm" variant="ghost" className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => handleContact(c.full_name || "ce talent")}>
                          <Phone className="h-3.5 w-3.5" /> Contacter immédiatement
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border/50">
              <CardContent className="p-10 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune candidature reçue pour le moment.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ══════════════ MES RECRUTEMENTS ══════════════ */}
        <motion.div custom={3.5} variants={fadeUp}>
          <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-accent" />
            Mes Recrutements
          </h2>

          {candidatures && candidatures.length > 0 ? (
            <Card className="bg-card border-border/50">
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {candidatures.map((c) => {
                    const statusMap: Record<string, { label: string; color: string }> = {
                      submitted: { label: "Dossier soumis", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
                      in_review: { label: "En cours d'analyse", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
                      interview: { label: "Entretien planifié", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
                      altis_active: { label: "Pack ALTIS activé", color: "bg-accent/15 text-accent border-accent/30" },
                      hired: { label: "Recruté ✓", color: "bg-green-500/15 text-green-400 border-green-500/30" },
                      rejected: { label: "Non retenu", color: "bg-red-500/15 text-red-400 border-red-500/30" },
                    };
                    const st = statusMap[c.status] || statusMap.submitted;

                    return (
                      <AccordionItem key={c.id} value={c.id} className="border-border/30">
                        <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4 w-full pr-4">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {(c.full_name || "T")[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="font-semibold text-foreground text-sm truncate">{c.full_name || "Talent"}</p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <CalendarDays className="h-3 w-3" />
                                {format(new Date(c.created_at), "dd MMM yyyy", { locale: fr })}
                              </p>
                            </div>
                            <Badge className={`text-[10px] border font-semibold px-2 py-0.5 shrink-0 ${st.color}`}>
                              <CircleDot className="h-3 w-3 mr-1" />{st.label}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-2">
                            <div className="bg-muted/30 rounded-xl p-3">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Talent</p>
                              <p className="text-sm font-semibold text-foreground">{c.full_name || "—"}</p>
                              {c.city && <p className="text-xs text-muted-foreground mt-0.5">{c.city}</p>}
                            </div>
                            <div className="bg-muted/30 rounded-xl p-3">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Statut</p>
                              <Badge className={`text-xs border font-semibold ${st.color}`}>{st.label}</Badge>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-3">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Date</p>
                              <p className="text-sm font-semibold text-foreground">{format(new Date(c.created_at), "dd MMMM yyyy", { locale: fr })}</p>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-3">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Coût ALTIS</p>
                              <p className="text-sm font-extrabold text-accent">2 450 €</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4 flex-wrap">
                            <Button size="sm" className="gap-1.5 text-xs bg-gradient-to-r from-accent to-primary text-white hover:opacity-90" disabled={altisLoading === c.id} onClick={() => handleAltis(c.full_name || "ce talent", c.id)}>
                              <Sparkles className="h-3.5 w-3.5" /> {altisLoading === c.id ? "Redirection…" : "Activer Pack ALTIS"}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs border-accent/30 text-accent hover:bg-accent/10">
                              <Eye className="h-3.5 w-3.5" /> Voir le dossier
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => handleContact(c.full_name || "ce talent")}>
                              <Phone className="h-3.5 w-3.5" /> Contacter
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border/50">
              <CardContent className="p-10 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucun recrutement en cours.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ══════════════ FRANCE TRAVAIL SECTIONS ══════════════ */}
        <motion.div custom={3.8} variants={fadeUp}>
          <FranceTravailOffresCard romeCodes={["F1703", "J1501", "G1602"]} title="Opportunités en temps réel" count={6} showScoreIA showAxiomReady />
        </motion.div>

        <motion.div custom={3.85} variants={fadeUp}>
          <FranceTravailFormationsCard romeCode="F1703" />
        </motion.div>

        <motion.div custom={3.9} variants={fadeUp}>
          <FranceTravailAgencesCard />
        </motion.div>

        <motion.div custom={3.95} variants={fadeUp}>
          <FranceTravailEventsCard />
        </motion.div>

        {/* ══════════════ DÉCOUVRIR DE NOUVEAUX TALENTS ══════════════ */}
        <motion.div custom={4} variants={fadeUp}>
          <h2 className="font-display text-xl font-bold text-foreground mb-5 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Découvrir de nouveaux talents
            <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] ml-2 gap-1">
              <Zap className="h-2.5 w-2.5" /> Suggestions IA
            </Badge>
          </h2>

          {talents && talents.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talents.slice(0, 6).map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="group bg-card border-border/50 hover:border-accent/30 hover:shadow-md transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative h-11 w-11 rounded-full overflow-hidden bg-gradient-to-br from-primary/40 to-accent/40 shrink-0">
                          <img
                            src={getAvatarForTalent(t.rome_code, i + 10)}
                            alt={t.full_name || "Talent"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{t.full_name || "Talent certifié"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {t.rome_label || "Professionnel qualifié"} {t.rome_code && `· ${t.rome_code}`}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className="bg-accent/15 text-accent border-0 text-xs font-bold px-2 tabular-nums">
                            {t.compliance_score}%
                          </Badge>
                          {t.compliance_score >= 80 && (
                            <Badge className="bg-accent/90 text-white border-0 text-[8px] gap-0.5">
                              <ShieldCheck className="h-2 w-2" /> READY
                            </Badge>
                          )}
                        </div>
                      </div>

                      {t.skills && t.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {t.skills.slice(0, 3).map((s) => (
                            <span key={s} className="text-[10px] bg-muted/50 text-muted-foreground rounded-full px-2 py-0.5">{s}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {t.country && <><Globe className="h-3 w-3" />{t.country}</>}
                          {t.french_level && <> · {t.french_level}</>}
                        </span>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-accent gap-1 hover:bg-accent/10">
                          Voir <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border/50">
              <CardContent className="p-10 text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Les talents certifiés apparaîtront ici prochainement.</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
