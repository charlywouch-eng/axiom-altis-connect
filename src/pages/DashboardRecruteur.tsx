import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, Briefcase, Brain, CreditCard, Search, LogOut,
  ShieldCheck, FileText, GraduationCap, Flame,
  Zap, ArrowRight
} from "lucide-react";


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
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === "talents" && <TalentsTab onSelectTalent={setSelectedTalent} />}
        {activeTab === "missions" && <MissionsTab />}
        {activeTab === "matching" && <MatchingTab query={matchQuery} setQuery={setMatchQuery} />}
        {activeTab === "facturation" && <FacturationTab />}
      </main>

      {/* Talent Dossier Modal */}
      <TalentDossierDialog talent={selectedTalent} onClose={() => setSelectedTalent(null)} />
    </div>
  );
}

/* ──────────── TALENTS TAB ──────────── */
function TalentsTab({ onSelectTalent }: { onSelectTalent: (t: any) => void }) {
  const [search, setSearch] = useState("");

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

  const filtered = talents?.filter(t =>
    !search || t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.rome_code?.toLowerCase().includes(search.toLowerCase()) ||
    t.rome_label?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <motion.div initial="hidden" animate="visible">
      <motion.div custom={0} variants={fadeUp} className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Talents certifiés</h2>
          <p className="text-white/50 text-sm mt-1">{filtered.length} talent{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, ROME..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((talent, i) => (
            <motion.div key={talent.id} custom={i + 1} variants={fadeUp}>
              <Card className="bg-[hsl(222,33%,12%)] border-white/10 hover:border-accent/40 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-[100px] w-[100px] shrink-0">
                      <AvatarFallback className="bg-accent/20 text-accent font-bold text-2xl">
                        {talent.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-white truncate">{talent.full_name || "Talent"}</h3>
                      <p className="text-xs text-white/40 mt-0.5">{talent.country || "Cameroun"}</p>
                      <p className="text-xs font-mono text-accent mt-2">
                        {talent.rome_code && `ROME ${talent.rome_code}`}
                      </p>
                      <p className="text-xs text-white/50 truncate">{talent.rome_label}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {talent.compliance_score >= 70 && (
                      <Badge className="bg-accent/20 text-accent border-0 text-[10px] gap-1">
                        <ShieldCheck className="h-3 w-3" /> MINREX validé
                      </Badge>
                    )}
                    {talent.french_level && (
                      <Badge variant="outline" className="border-white/20 text-white/60 text-[10px]">
                        FR: {talent.french_level}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-accent" />
                      <span className="font-display font-bold text-lg text-accent">{talent.compliance_score}</span>
                      <span className="text-xs text-white/30">/100</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onSelectTalent(talent)}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 border-0 text-xs"
                    >
                      Voir dossier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="mx-auto h-12 w-12 text-white/20 mb-4" />
          <p className="text-white/50">Aucun talent trouvé.</p>
        </div>
      )}
    </motion.div>
  );
}

/* ──────────── TALENT DOSSIER MODAL ──────────── */
function TalentDossierDialog({ talent, onClose }: { talent: any; onClose: () => void }) {
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

  if (!talent) return null;

  return (
    <Dialog open={!!talent} onOpenChange={() => onClose()}>
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
              <Badge className={talent.visa_status === 'approuve' ? 'bg-success/20 text-success border-0' : 'bg-accent/20 text-accent border-0'}>
                {talent.visa_status === 'approuve' ? 'Approuvé' : talent.visa_status === 'en_attente' ? 'En attente' : talent.visa_status}
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

          {/* Documents */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4" /> Documents du dossier
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                <GraduationCap className="h-5 w-5 text-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Diplôme CQP/DQP</p>
                  <p className="text-xs text-white/40">{diplomas?.length ? `${diplomas.length} document(s)` : 'Non soumis'}</p>
                </div>
                {diplomas?.length ? (
                  <Badge className="bg-success/20 text-success border-0 text-xs">Vérifié</Badge>
                ) : (
                  <Badge variant="outline" className="border-white/20 text-white/40 text-xs">En attente</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                <FileText className="h-5 w-5 text-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Visa / Titre de séjour</p>
                  <p className="text-xs text-white/40">Statut: {talent.visa_status}</p>
                </div>
                <Badge className={talent.visa_status === 'approuve' ? 'bg-success/20 text-success border-0 text-xs' : 'bg-accent/20 text-accent border-0 text-xs'}>
                  {talent.visa_status === 'approuve' ? 'OK' : 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Apostille MINREX</p>
                  <p className="text-xs text-white/40">{talent.apostille_date ? `Date: ${talent.apostille_date}` : 'Non apostillé'}</p>
                </div>
                {talent.apostille_date ? (
                  <Badge className="bg-success/20 text-success border-0 text-xs">Validé</Badge>
                ) : (
                  <Badge variant="outline" className="border-white/20 text-white/40 text-xs">En attente</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
                          {offer.status === 'open' ? 'Active' : offer.status === 'filled' ? 'Pourvue' : offer.status}
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
                    <p className="text-[10px] text-white/30 mt-0.5">Score match</p>
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
  return (
    <motion.div initial="hidden" animate="visible">
      <motion.div custom={0} variants={fadeUp} className="mb-6">
        <h2 className="font-display text-2xl font-bold text-white">Facturation</h2>
        <p className="text-white/50 text-sm mt-1">Gérez votre abonnement Pro</p>
      </motion.div>

      <motion.div custom={1} variants={fadeUp}>
        <Card className="bg-[hsl(222,33%,12%)] border-accent/30 max-w-lg">
          <CardHeader>
            <CardTitle className="font-display text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" /> Abonnement Pro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-4xl font-display font-bold text-white">199€<span className="text-lg text-white/40 font-normal">/mois</span></p>
              <p className="text-sm text-white/50 mt-2">Accès illimité aux talents, matching IA, dossiers complets et support prioritaire.</p>
            </div>
            <ul className="space-y-2">
              {["Matching IA illimité", "Dossiers talents complets", "Export PDF contrats", "Support prioritaire 24/7"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <ShieldCheck className="h-4 w-4 text-accent shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border-0 py-6 text-base font-semibold rounded-xl shadow-lg shadow-accent/20">
              <CreditCard className="mr-2 h-5 w-5" /> S'abonner — 199€/mois
            </Button>
            <p className="text-xs text-white/30 text-center">Paiement sécurisé par Stripe. Annulable à tout moment.</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
