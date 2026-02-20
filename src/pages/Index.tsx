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
import dashboardHero from "@/assets/dashboard-hero.jpg";

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
    transition: { delay: i * 0.1, duration: 0.45, ease },
  }),
};

// ── Data ──────────────────────────────────────────────────────
const SECTEURS = [
  { emoji: "🏗️", label: "BTP & Construction", rome: "F1703", tag: "Grande demande", color: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800/40" },
  { emoji: "🏥", label: "Santé & Aide à la personne", rome: "J1501", tag: "Pénurie critique", color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40" },
  { emoji: "🍽️", label: "Hôtellerie & Restauration", rome: "G1602", tag: "Grande demande", color: "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800/40" },
  { emoji: "🚚", label: "Transport & Logistique", rome: "N4101", tag: "Forte tension", color: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800/40" },
  { emoji: "⚡", label: "Maintenance & Industrie", rome: "I1304", tag: "Grande demande", color: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800/40" },
  { emoji: "🌾", label: "Agriculture & Agroalimentaire", rome: "A1414", tag: "Saisonnier+", color: "bg-lime-50 border-lime-200 dark:bg-lime-950/30 dark:border-lime-800/40" },
  { emoji: "💻", label: "Informatique & Tech", rome: "M1805", tag: "Grande demande", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/40" },
  { emoji: "👔", label: "Commerce & Vente", rome: "D1502", tag: "Flux constant", color: "bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800/40" },
  { emoji: "🏢", label: "Support & Entreprise", rome: "M1607", tag: "Stable & élevé", color: "bg-slate-50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800/40" },
];

const TRUST_CARDS = [
  { icon: Zap, title: "Matching IA précis", desc: "Algorithme ROME certifié — profil scoré en 30 secondes", accent: "text-accent" },
  { icon: Shield, title: "Certifications MINEFOP", desc: "Diplômes apostillés, reconnus par l'État français", accent: "text-success" },
  { icon: Plane, title: "Pack ALTIS Zéro Stress", desc: "Visa + billet + logement meublé pris en charge", accent: "text-primary" },
  { icon: Star, title: "Inscription gratuite", desc: "Commencez sans engagement, débloquez le premium après", accent: "text-tension" },
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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-10">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-xl font-extrabold tracking-tight text-primary">AXIOM</span>
            <span className="hidden sm:inline text-xs font-medium text-muted-foreground">× ALTIS Mobility</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/metiers-en-tension" className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Métiers en tension
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground">Connexion</Button>
            </Link>
            <Link to="/signup-light">
              <Button size="sm" className="shadow-md">Commencer</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Full-Screen ─────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background gradient */}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-32 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* ── Left: Copy ───────────────────────────────────── */}
            <motion.div initial="hidden" animate="visible" className="flex-1 max-w-2xl">
              <motion.div custom={0} variants={fadeUp}>
                <Badge className="mb-8 border-white/20 text-white/80 bg-white/8 px-4 py-2 text-xs font-semibold tracking-wider gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  Infrastructure souveraine France — Cameroun
                </Badge>
              </motion.div>

              <motion.h1
                custom={1} variants={fadeUp}
                className="text-[36px] font-extrabold leading-[1.06] text-white sm:text-[46px] md:text-[54px] tracking-tight"
              >
                9 métiers en{" "}
                <span className="relative">
                  <span className="text-gradient-accent">pénurie en France</span>
                </span>{" "}
                vous attendent
              </motion.h1>

              <motion.p
                custom={2} variants={fadeUp}
                className="mt-6 max-w-xl text-lg text-white/70 leading-relaxed md:text-xl"
              >
                Matching IA + visa + billet d'avion + logement pris en charge.{" "}
                <strong className="text-white/90">Opérationnel dès le Jour 1.</strong>
              </motion.p>

              {/* Proof points */}
              <motion.div custom={3} variants={fadeUp} className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {["Gratuit depuis le Cameroun", "Certifications MINEFOP reconnues", "Scores vérifiés en 30 sec", "Visa & logement inclus"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-sm text-white/55">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                    {item}
                  </span>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div custom={4} variants={fadeUp} className="mt-12 flex flex-col gap-4 sm:flex-row">
                <Link to="/signup-light">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base px-8 py-6 h-auto rounded-2xl font-bold shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 border-0"
                  >
                    Commencer gratuitement (Cameroun) <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-base px-8 py-6 h-auto rounded-2xl font-semibold border-2 border-white/50 bg-white/10 text-white hover:bg-white/20 hover:border-white/70 backdrop-blur-sm transition-all"
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Recrutez des talents certifiés
                  </Button>
                </Link>
              </motion.div>

              {/* Social proof micro */}
              <motion.div custom={5} variants={fadeUp} className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["🇨🇲", "🇸🇳", "🇨🇮", "🇬🇳"].map((flag, i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-base backdrop-blur-sm">
                      {flag}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/55">
                  <span className="text-white/80 font-semibold">500+ talents</span> inscrits · 98 % de rétention
                </p>
              </motion.div>
            </motion.div>

            {/* ── Right: Brand Image ───────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:flex flex-shrink-0 w-[420px] xl:w-[480px] items-center justify-center relative"
            >
              {/* Glow ring behind image */}
              <div className="absolute inset-0 rounded-3xl bg-accent/20 blur-2xl scale-110" />
              <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/15">
                <img
                  src={dashboardHero}
                  alt="Plateforme RH Tech France-Afrique — AXIOM ALTIS"
                  className="w-full h-[520px] object-cover"
                  style={{ mixBlendMode: "luminosity", filter: "brightness(0.88) contrast(1.08)" }}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />
                {/* Brand label */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent mb-1.5">AXIOM × ALTIS Mobility</p>
                  <h2 className="text-white font-extrabold text-[22px] leading-tight tracking-tight">
                    Plateforme RH Tech<br />France-Afrique
                  </h2>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-xs text-white/70 font-medium">Infrastructure souveraine · Certifiée MINEFOP</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── Stats Band ───────────────────────────────────────── */}
      <section className="relative z-10 -mt-10 px-5 md:px-10">
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
                  <Icon className="h-4.5 w-4.5 text-accent mx-auto mb-2 h-[18px] w-[18px]" />
                  <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
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
          <motion.p custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">
            Opportunités 2025-2026
          </motion.p>
          <motion.h2 custom={1} variants={fadeUp} className="font-display text-3xl font-bold md:text-[42px] leading-tight">
            Les <span className="text-gradient-primary">9 secteurs</span> les plus demandés en France
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
            Chaque secteur offre une forte probabilité d'embauche et un accompagnement ALTIS complet.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {SECTEURS.map((s, i) => (
            <motion.div
              key={s.rome}
              custom={i}
              variants={scaleIn}
              className={`group relative rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default ${s.color}`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{s.emoji}</span>
                <Badge className="bg-tension/15 text-tension border-tension/30 text-[10px] px-2 py-0.5 font-bold shrink-0">
                  {s.tag}
                </Badge>
              </div>
              <h3 className="font-display font-bold text-base text-foreground mb-1.5">{s.label}</h3>
              <p className="text-xs text-muted-foreground font-mono">{s.rome}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                Certifiable MINEFOP
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mt-10"
        >
          <motion.div custom={0} variants={fadeUp}>
            <Link to="/metiers-en-tension">
              <Button variant="outline" className="rounded-xl border-primary/30 text-primary hover:bg-primary/5 font-semibold">
                Voir tous les métiers en tension <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Trust Cards ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-muted/40 py-20 md:py-28">
        {/* Brand image — decorative background */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <img
            src={dashboardHero}
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-auto max-w-[55%] object-cover opacity-[0.06] dark:opacity-[0.04]"
            style={{ filter: "grayscale(100%) contrast(1.1)" }}
          />
          {/* Fade edges so it blends into section */}
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-muted/40 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-muted/40 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 md:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold md:text-[40px]">
              Pourquoi choisir <span className="text-gradient-primary">AXIOM × ALTIS</span> ?
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {TRUST_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  custom={i}
                  variants={scaleIn}
                  className="rounded-2xl border bg-card/90 backdrop-blur-sm p-7 shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 ${card.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-display font-bold text-base text-foreground">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-accent/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-5 py-24 text-center md:px-10 md:py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-white md:text-5xl leading-tight">
              Votre emploi en France,{" "}
              <span className="text-gradient-accent">dès aujourd'hui</span>
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-5 text-lg text-white/60 max-w-xl mx-auto">
              Inscription en 30 secondes. Score immédiat. Accompagnement ALTIS complet.
            </motion.p>
            <motion.div custom={2} variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/signup-light">
                <Button size="lg" className="text-base px-10 py-6 h-auto rounded-2xl font-bold shadow-xl bg-primary hover:bg-primary/90 border-0">
                  Commencer gratuitement <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="mailto:contact@axiom-talents.com">
                <Button size="lg" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 text-base px-8 py-6 h-auto rounded-2xl">
                  <Mail className="mr-2 h-4 w-4" /> Nous contacter
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t bg-card px-5 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div>
              <span className="font-display text-lg font-bold text-primary">AXIOM</span>
              <span className="text-muted-foreground text-sm ml-2">– Plateforme RH Tech</span>
              <span className="text-muted-foreground/40 text-sm mx-2">|</span>
              <span className="font-display text-sm font-semibold text-accent">ALTIS Mobility</span>
              <span className="text-muted-foreground text-sm ml-2">– Logistique & Accueil</span>
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
          <div className="mt-6 border-t pt-5 text-center text-xs text-muted-foreground/50">
            © 2026 AXIOM × ALTIS Mobility. Tous droits réservés. –{" "}
            <Link to="/rgpd" className="hover:text-muted-foreground transition-colors">Politique de confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
