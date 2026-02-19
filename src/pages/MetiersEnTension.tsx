import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, TrendingUp, Banknote, ShieldCheck, Search,
  Users, Globe, ArrowLeft, Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: easeOut },
  }),
};

const tensionColor: Record<string, string> = {
  "Très haute": "bg-destructive/90 text-destructive-foreground border-0",
  "Haute":       "bg-accent text-accent-foreground border-0",
  "Croissante":  "bg-success/80 text-success-foreground border-0",
  "Moyenne-haute":"bg-accent/60 text-accent-foreground border-0",
  "Moyenne":     "bg-muted text-muted-foreground border-0",
};

const tensionPriority: Record<string, number> = {
  "Très haute": 4, "Haute": 3, "Croissante": 2, "Moyenne-haute": 1, "Moyenne": 0,
};

export default function MetiersEnTension() {
  const [selectedTensions, setSelectedTensions] = useState<string[]>(["Très haute", "Haute", "Croissante"]);
  const [search, setSearch] = useState("");

  const { data: metiers, isLoading: loadingMetiers } = useQuery({
    queryKey: ["metiers-tension-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metiers_minefop_rome")
        .select("*")
        .order("score_matching", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Comptage des talents disponibles par code ROME
  const { data: talentCounts } = useQuery({
    queryKey: ["talent-counts-by-rome"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("rome_code")
        .eq("available", true);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((t) => {
        if (t.rome_code) counts[t.rome_code] = (counts[t.rome_code] || 0) + 1;
      });
      return counts;
    },
  });

  const filtered = (metiers ?? [])
    .filter((m) => {
      const tensionOk = selectedTensions.length === 0 || selectedTensions.includes(m.niveau_tension ?? "Moyenne");
      const searchOk = !search || (
        (m.metier_tension_fr ?? m.rome_title).toLowerCase().includes(search.toLowerCase()) ||
        m.rome_code.toLowerCase().includes(search.toLowerCase()) ||
        m.minefop_title.toLowerCase().includes(search.toLowerCase())
      );
      return tensionOk && searchOk;
    })
    .sort((a, b) => (tensionPriority[b.niveau_tension ?? "Moyenne"] - tensionPriority[a.niveau_tension ?? "Moyenne"]) || (b.score_matching ?? 0) - (a.score_matching ?? 0));

  const totalTalents = Object.values(talentCounts ?? {}).reduce((s, v) => s + v, 0);
  const totalMetiers = filtered.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 md:px-12">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Accueil</span>
            </Link>
            <span className="text-border">|</span>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                <Zap className="h-3.5 w-3.5 text-accent-foreground" />
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight text-primary">AXIOM</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/signup">
              <Button size="sm" className="shadow-lg shadow-accent/20">Recruter des talents</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-6xl px-6 md:px-12">
          <motion.div initial="hidden" animate="visible" className="text-center">
            <motion.span custom={0} variants={fadeUp} className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-accent/90">
              <TrendingUp className="h-4 w-4" /> France Travail BMO 2025 · Données officielles
            </motion.span>
            <motion.h1 custom={1} variants={fadeUp} className="mt-4 font-display text-4xl font-extrabold text-white md:text-6xl leading-tight">
              Métiers en tension <br />
              <span style={{ background: "var(--gradient-accent)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                France 2026
              </span>
            </motion.h1>
            <motion.p custom={2} variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-white/60 text-lg">
              Croisement officiel formations CQP/DQP MINEFOP Cameroun × métiers en pénurie France.
              Chaque fiche affiche le vivier de talents AXIOM disponibles et certifiés.
            </motion.p>

            {/* KPIs */}
            <motion.div custom={3} variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-6">
              {[
                { icon: TrendingUp, value: `${totalMetiers}`, label: "Métiers référencés" },
                { icon: Users, value: totalTalents > 0 ? `${totalTalents}+` : "500+", label: "Talents disponibles" },
                { icon: Globe, value: "15", label: "Pays représentés" },
                { icon: ShieldCheck, value: "100%", label: "Certifiés MINEFOP" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <Icon className="h-4 w-4 text-accent" />
                  <div className="text-left">
                    <p className="font-display text-xl font-bold text-white">{value}</p>
                    <p className="text-xs text-white/50">{label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Filtres */}
      <section className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-4 md:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Recherche */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Chercher un métier, code ROME…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Tension filter */}
            <ToggleGroup
              type="multiple"
              value={selectedTensions}
              onValueChange={setSelectedTensions}
              className="bg-muted/40 border rounded-lg p-1 flex-wrap justify-start"
            >
              {["Très haute", "Haute", "Croissante", "Moyenne"].map((t) => (
                <ToggleGroupItem key={t} value={t} className="text-xs font-semibold h-8 px-3">
                  {t}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </section>

      {/* Grille */}
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-12">
        {loadingMetiers ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            <Search className="mx-auto h-10 w-10 mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucun métier trouvé</p>
            <p className="text-sm mt-1">Essayez d'ajuster vos filtres</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((m, i) => {
              const talentCount = talentCounts?.[m.rome_code] ?? 0;
              return (
                <motion.div key={m.id} custom={i} variants={fadeUp}>
                  <Link
                    to={`/metier/${m.rome_code}`}
                    className="group relative flex flex-col h-full rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/40 overflow-hidden"
                  >
                    {/* Score cercle */}
                    <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
                      <span className="text-sm font-bold text-accent">{m.score_matching}</span>
                    </div>

                    <Badge className={`text-[10px] font-bold w-fit mb-4 ${tensionColor[m.niveau_tension ?? "Moyenne"]}`}>
                      {m.niveau_tension ?? "Moyenne"}
                    </Badge>

                    <h3 className="font-display text-lg font-bold leading-snug group-hover:text-accent transition-colors pr-10">
                      {m.metier_tension_fr || m.rome_title}
                    </h3>

                    <p className="mt-1 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                      ROME {m.rome_code} · {m.minefop_title}
                    </p>

                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
                      {m.description}
                    </p>

                    {/* Footer card */}
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="h-3.5 w-3.5 text-success" />
                        <span className="text-sm font-semibold text-success">{m.salaire_moyen_france || "NC"}</span>
                      </div>
                      {/* Comptage talents */}
                      <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1">
                        <Users className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs font-bold text-accent">
                          {talentCount > 0 ? `${talentCount} talent${talentCount > 1 ? "s" : ""}` : "Vivier actif"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-xs text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Voir le dossier métier <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* CTA bas */}
        <div className="mt-20 rounded-2xl border bg-card p-10 text-center" style={{ background: "var(--gradient-premium)" }}>
          <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
            Recrutez dans ces métiers en pénurie
          </h2>
          <p className="mt-3 text-white/60 max-w-xl mx-auto">
            Accédez en 48h à des talents camerounais certifiés MINEFOP, visa-ready et opérationnels dès J1.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="px-10 py-5 h-auto font-semibold text-base shadow-xl shadow-accent/30 rounded-xl">
                Créer un compte entreprise <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="mailto:contact@axiom-talents.com">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-10 py-5 h-auto rounded-xl">
                Nous contacter
              </Button>
            </a>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="border-t bg-card px-6 py-8 text-center text-sm text-muted-foreground">
        © 2026 AXIOM × ALTIS Mobility · <a href="mailto:contact@axiom-talents.com" className="hover:text-foreground transition-colors">contact@axiom-talents.com</a>
      </footer>
    </div>
  );
}
