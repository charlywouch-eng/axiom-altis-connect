import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Mail, Shield, CheckCircle2,
  Zap, Globe, Users, Clock, BarChart3, Plane, Star, Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroFranceAfrique from "@/assets/hero-france-afrique.png";

// ── Animation configs ──────────────────────────────────────────
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.13, duration: 0.6, ease },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.07, duration: 0.45, ease },
  }),
};

// ── Data ──────────────────────────────────────────────────────
const SECTEURS = [
  { emoji: "🏗️", label: "BTP & Construction", rome: "F1703", tag: "Grande demande", color: "from-orange-500/10 to-orange-500/5 border-orange-300/30 dark:border-orange-700/30" },
  { emoji: "🏥", label: "Santé & Aide à la personne", rome: "J1501", tag: "Pénurie critique", color: "from-emerald-500/10 to-emerald-500/5 border-emerald-300/30 dark:border-emerald-700/30" },
  { emoji: "🍽️", label: "Hôtellerie & Restauration", rome: "G1602", tag: "Grande demande", color: "from-purple-500/10 to-purple-500/5 border-purple-300/30 dark:border-purple-700/30" },
  { emoji: "🚚", label: "Transport & Logistique", rome: "N4101", tag: "Forte tension", color: "from-sky-500/10 to-sky-500/5 border-sky-300/30 dark:border-sky-700/30" },
  { emoji: "⚡", label: "Maintenance & Industrie", rome: "I1304", tag: "Grande demande", color: "from-yellow-500/10 to-yellow-500/5 border-yellow-300/30 dark:border-yellow-700/30" },
  { emoji: "🌾", label: "Agriculture & Agroalimentaire", rome: "A1414", tag: "Saisonnier+", color: "from-lime-500/10 to-lime-500/5 border-lime-300/30 dark:border-lime-700/30" },
  { emoji: "💻", label: "Informatique & Tech", rome: "M1805", tag: "Grande demande", color: "from-blue-500/10 to-blue-500/5 border-blue-300/30 dark:border-blue-700/30" },
  { emoji: "👔", label: "Commerce & Vente", rome: "D1502", tag: "Flux constant", color: "from-pink-500/10 to-pink-500/5 border-pink-300/30 dark:border-pink-700/30" },
  { emoji: "🏢", label: "Support & Entreprise", rome: "M1607", tag: "Stable & élevé", color: "from-slate-500/10 to-slate-500/5 border-slate-300/30 dark:border-slate-700/30" },
];

const TRUST_CARDS = [
  { icon: Zap, title: "Matching IA précis", desc: "Algorithme ROME certifié — profil scoré en 30 secondes", accent: "text-accent", bg: "bg-accent/10" },
  { icon: Shield, title: "Certifications MINEFOP", desc: "Diplômes apostillés, reconnus par l'État français", accent: "text-success", bg: "bg-success/10" },
  { icon: Plane, title: "Pack ALTIS Zéro Stress", desc: "Visa + billet + logement meublé pris en charge", accent: "text-primary", bg: "bg-primary/10" },
  { icon: Star, title: "Inscription gratuite", desc: "Commencez sans engagement, débloquez le premium après", accent: "text-tension", bg: "bg-tension/10" },
];

// ── Component ─────────────────────────────────────────────────
export default function Index() {
  const { session, role, loading } = useAuth();

  if (loading) return null;
  if (session && role === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;
  if (session && role === "talent") return <Navigate to="/dashboard-talent" replace />;
  if (session && role === "admin") return <Navigate to="/admin" replace />;
  if (session && role === "recruteur") return <Navigate to="/dashboard-recruteur" replace />;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[hsl(222,47%,8%)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-10">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-black text-xs">A</span>
            </div>
            <span className="font-black text-xl tracking-tight text-white">AXIOM</span>
            <span className="hidden sm:inline text-xs font-medium text-white/40 border-l border-white/15 pl-2.5 ml-0.5">× ALTIS Mobility</span>
          </div>
          <nav className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link to="/metiers-en-tension" className="hidden md:inline text-sm font-medium text-white/50 hover:text-white/90 transition-colors px-3 py-1.5">
              Métiers en tension
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/8 border border-white/10">Se connecter</Button>
            </Link>
            <Link to="/signup-light">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-semibold shadow-lg shadow-accent/25 border-0">
                Commencer
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Full-Screen ─────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, hsl(222,47%,6%) 0%, hsl(221,83%,18%) 55%, hsl(189,94%,22%) 100%)" }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        {/* Glow orbs */}
        <div className="absolute top-1/3 right-10 w-[380px] h-[380px] rounded-full bg-accent/12 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-[320px] h-[320px] rounded-full bg-primary/18 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* ── Left: Copy ───────────────────────────────────── */}
            <motion.div initial="hidden" animate="visible" className="flex-1 max-w-xl">

              <motion.div custom={0} variants={fadeUp} className="mb-6">
                <Badge className="border-accent/30 text-accent bg-accent/10 px-3.5 py-1.5 text-xs font-bold tracking-wider gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  Infrastructure souveraine · France — Cameroun
                </Badge>
              </motion.div>

              <motion.h1
                custom={1} variants={fadeUp}
                className="text-[38px] font-black leading-[1.04] text-white sm:text-[50px] md:text-[58px] tracking-tight"
              >
                9 métiers en{" "}
                <span className="text-gradient-accent">pénurie</span>{" "}
                vous attendent<br className="hidden sm:block" /> en France
              </motion.h1>

              <motion.p
                custom={2} variants={fadeUp}
                className="mt-5 max-w-lg text-base text-white/65 leading-relaxed md:text-lg"
              >
                Matching IA + visa + billet d'avion + logement ALTIS pris en charge.{" "}
                <strong className="text-white/85">Opérationnel dès le Jour 1.</strong>
              </motion.p>

              {/* Proof points */}
              <motion.div custom={3} variants={fadeUp} className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
                {["Gratuit depuis le Cameroun", "Certifications MINEFOP", "Score vérifié en 30 sec", "Visa & logement inclus"].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-sm text-white/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                    {item}
                  </span>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div custom={4} variants={fadeUp} className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link to="/signup-light">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base px-8 py-5 h-auto rounded-2xl font-bold shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 border-0 group"
                  >
                    Commencer gratuitement (Cameroun)
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-base px-7 py-5 h-auto rounded-2xl font-semibold border border-white/20 bg-white/6 text-white hover:bg-white/12 hover:border-white/35 backdrop-blur-sm transition-all"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Recruteurs & Entreprises
                  </Button>
                </Link>
              </motion.div>

              {/* Social proof */}
              <motion.div custom={5} variants={fadeUp} className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["🇨🇲", "🇸🇳", "🇨🇮", "🇬🇳"].map((flag, i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm backdrop-blur-sm">
                      {flag}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/45">
                  <span className="text-white/75 font-bold">500+ talents</span> inscrits · 98 % rétention
                </p>
              </motion.div>
            </motion.div>

            {/* ── Right: Hero Image ────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.8, ease }}
              className="hidden lg:flex flex-shrink-0 w-[400px] xl:w-[460px] items-center justify-center relative"
            >
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-3xl bg-accent/15 blur-3xl scale-105" />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full"
              >
                <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl shadow-black/40 p-8">
                  <img
                    src={heroFranceAfrique}
                    alt="Mixte RH Tech Inovant France-Afrique — AXIOM ALTIS"
                    className="w-full object-contain"
                    style={{ filter: "drop-shadow(0 16px 32px rgba(6,182,212,0.30))" }}
                  />
                  {/* Badge overlay */}
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 px-4 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-accent mb-0.5">AXIOM × ALTIS Mobility</p>
                      <p className="text-white font-bold text-sm leading-tight">Plateforme RH Tech<br />France-Afrique</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[10px] text-white/55">Infrastructure souveraine · MINEFOP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── Stats Band ───────────────────────────────────────── */}
      <section className="relative z-10 -mt-8 px-5 md:px-10">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl bg-border shadow-xl"
          >
            {[
              { value: "500+", label: "Talents qualifiés", icon: Users },
              { value: "98%", label: "Taux de rétention", icon: BarChart3 },
              { value: "15", label: "Pays d'origine", icon: Globe },
              { value: "30j", label: "Délai moyen", icon: Clock },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} custom={i} variants={scaleIn} className="bg-card px-5 py-7 text-center">
                  <Icon className="h-[18px] w-[18px] text-accent mx-auto mb-2" />
                  <p className="font-black text-3xl text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── 9 Secteurs Grid ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
          <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
            Opportunités 2025–2026
          </motion.p>
          <motion.h2 custom={1} variants={fadeUp} className="font-black text-3xl md:text-[42px] leading-tight tracking-tight">
            Les <span className="text-gradient-primary">9 secteurs</span> les plus demandés
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} className="mt-4 text-muted-foreground text-base max-w-lg mx-auto">
            Forte probabilité d'embauche + accompagnement ALTIS complet pour chaque secteur.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
        >
          {SECTEURS.map((s, i) => (
            <motion.div
              key={s.rome}
              custom={i}
              variants={scaleIn}
              className={`group relative rounded-2xl border bg-gradient-to-br p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default ${s.color}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{s.emoji}</span>
                <Badge className="bg-tension/12 text-tension border-tension/25 text-[10px] px-2 py-0.5 font-bold shrink-0">
                  {s.tag}
                </Badge>
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1">{s.label}</h3>
              <p className="text-[11px] text-muted-foreground font-mono mb-3">{s.rome}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                Certifiable MINEFOP
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-10">
          <motion.div custom={0} variants={fadeUp}>
            <Link to="/metiers-en-tension">
              <Button variant="outline" className="rounded-xl border-primary/25 text-primary hover:bg-primary/5 font-semibold">
                Voir tous les métiers en tension <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── 4 Cartes Confiance ───────────────────────────────── */}
      <section className="bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 custom={0} variants={fadeUp} className="font-black text-3xl md:text-[38px] tracking-tight">
              Pourquoi <span className="text-gradient-primary">AXIOM × ALTIS</span> ?
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-3 text-muted-foreground text-base max-w-md mx-auto">
              Une infrastructure complète de bout en bout, de l'inscription au premier jour de travail.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {TRUST_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  custom={i}
                  variants={scaleIn}
                  className="rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.accent}`} />
                  </div>
                  <h3 className="mb-1.5 font-bold text-sm text-foreground">{card.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(222,47%,6%) 0%, hsl(221,83%,18%) 55%, hsl(189,94%,22%) 100%)" }}>
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/8 blur-3xl" />

        <div className="relative mx-auto max-w-2xl px-5 py-24 text-center md:px-10 md:py-28">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-4">
              Prêt à commencer ?
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="font-black text-3xl text-white md:text-5xl leading-tight tracking-tight">
              Votre emploi en France,{" "}
              <span className="text-gradient-accent">dès aujourd'hui</span>
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="mt-4 text-base text-white/55 max-w-md mx-auto">
              Inscription en 30 secondes. Score immédiat. Accompagnement ALTIS complet.
            </motion.p>
            <motion.div custom={3} variants={fadeUp} className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/signup-light">
                <Button size="lg" className="text-base px-10 py-5 h-auto rounded-2xl font-bold shadow-2xl bg-primary hover:bg-primary/90 border-0 group">
                  Commencer gratuitement <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <a href="mailto:contact@axiom-talents.com">
                <Button size="lg" variant="ghost" className="text-white/50 hover:text-white hover:bg-white/8 text-base px-8 py-5 h-auto rounded-2xl">
                  <Mail className="mr-2 h-4 w-4" /> Nous contacter
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border/50 bg-card px-5 py-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-5 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-black text-[10px]">A</span>
              </div>
              <span className="font-black text-base text-primary">AXIOM</span>
              <span className="text-muted-foreground/40 text-sm mx-1.5">·</span>
              <span className="font-bold text-sm text-accent">ALTIS Mobility</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors">Mentions légales</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">CGU</span>
              <Link to="/rgpd-light" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Lock className="h-3 w-3" /> RGPD
              </Link>
              <a href="mailto:contact@axiom-talents.com" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-5 border-t border-border/30 pt-4 text-center text-xs text-muted-foreground/40">
            © 2026 AXIOM × ALTIS Mobility. Tous droits réservés. ·{" "}
            <Link to="/rgpd" className="hover:text-muted-foreground transition-colors">Politique de confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
