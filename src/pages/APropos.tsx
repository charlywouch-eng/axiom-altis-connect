import { lazy, Suspense, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import ContactForm from "@/components/about/ContactForm";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Globe, Brain, Plane, Shield, CheckCircle2,
  Users, Target, Cpu, Lock, Zap, Building2, Mail,
  TrendingUp, TrendingDown, Minus, Crown,
} from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import heroTechNetwork from "@/assets/hero-tech-network.jpg";
import heroTechNetworkWebp from "@/assets/hero-tech-network.jpg?format=webp";
import { OptimizedImage } from "@/components/OptimizedImage";

const NetworkCanvas = lazy(() => import("@/components/landing/NetworkCanvas"));

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.08, duration: 0.45, ease },
  }),
};

const VISION_ITEMS = [
  {
    icon: Brain,
    title: "AXIOM — La plateforme de certification",
    points: [
      "Mise en relation qualifiée France ↔ Afrique",
      "Certification officielle des compétences",
      "Conformité rigoureuse aux normes françaises",
      "Souveraineté totale de la donnée",
    ],
    accent: "text-accent", bg: "bg-accent/10", border: "border-accent/20",
  },
  {
    icon: Plane,
    title: "ALTIS — Les bras opérationnels",
    points: [
      "Pack Zéro Stress : formalités visa de travail (procédure ANEF)",
      "Accueil & assistance aéroport + logement meublé 1 mois",
      "Accompagnement administratif J1 → J30",
    ],
    accent: "text-primary", bg: "bg-primary/10", border: "border-primary/20",
  },
  {
    icon: Shield,
    title: "Positionnement premium",
    points: [
      "100 % des profils vérifiés & certifiés MINEFOP/MINREX",
      "Réduction du risque onboarding de 80 %",
      "Conformité totale : ROME, ANEF, visa",
      "Accompagnement terrain de bout en bout",
    ],
    accent: "text-success", bg: "bg-success/10", border: "border-success/20",
  },
  {
    icon: Target,
    title: "Modèle économique",
    points: [
      "Freemium candidats → 4,99 € test + 29 € déblocage",
      "SaaS recruteurs : 499 €/mois",
      "Success fee : 25 % à l'embauche",
      "Forfait ALTIS Intégral : 2 450 €/talent",
    ],
    accent: "text-tension", bg: "bg-tension/10", border: "border-tension/20",
  },
];

const SECTORS = [
  { emoji: "🏗️", label: "BTP" },
  { emoji: "🏥", label: "Santé" },
  { emoji: "🍽️", label: "CHR" },
  { emoji: "🚚", label: "Logistique" },
  { emoji: "⚡", label: "Industrie" },
  { emoji: "🌾", label: "Agriculture" },
];

export default function APropos() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>À propos d'AXIOM – Plateforme de recrutement souveraine France-Afrique</title>
        <meta name="description" content="AXIOM connecte les talents certifiés d'Afrique aux entreprises françaises en pénurie. IA de matching, certifications MINEFOP/MINREX, logistique ALTIS intégrée." />
        <link rel="canonical" href="https://axiom-talents.com/a-propos" />
        <meta property="og:title" content="À propos d'AXIOM – Recrutement souverain France-Afrique" />
        <meta property="og:description" content="Notre mission : connecter les talents certifiés d'Afrique aux métiers en tension en France via l'IA et la conformité." />
        <meta property="og:url" content="https://axiom-talents.com/a-propos" />
      </Helmet>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[hsl(222,47%,8%)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-black text-xs">A</span>
            </div>
            <span className="font-black text-xl tracking-tight text-white">AXIOM</span>
            <span className="hidden sm:inline text-xs font-medium text-white/40 border-l border-white/15 pl-2.5 ml-0.5">× ALTIS Mobility</span>
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/a-propos" className="hidden md:inline text-sm font-medium text-white/50 hover:text-white/90 transition-colors px-3 py-1.5">
              À propos
            </Link>
            <Link to="/fiches-metiers" className="hidden md:inline text-sm font-medium text-white/50 hover:text-white/90 transition-colors px-3 py-1.5">
              Fiches métiers
            </Link>
            <Link to="/pricing" className="hidden md:inline text-sm font-medium text-white/50 hover:text-white/90 transition-colors px-3 py-1.5">
              Tarifs
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/8 border border-white/10">Se connecter</Button>
            </Link>
            <Link to="/signup-light">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg shadow-accent/25 border-0">
                Commencer
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <OptimizedImage webpSrc={heroTechNetworkWebp} fallbackSrc={heroTechNetwork} alt="" className="w-full h-full object-cover opacity-40" loading="eager" decoding="async" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,4%)]/98 via-[hsl(221,83%,12%)]/92 to-[hsl(187,94%,15%)]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,4%)] via-transparent to-[hsl(222,47%,4%)]/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,hsl(187,94%,43%,0.06),transparent_70%)]" />
        </div>
        <div className="absolute inset-0 bg-hero-dots opacity-30 z-[1]" />
        <div className="absolute inset-0 z-[2]">
          <Suspense fallback={null}>
            <NetworkCanvas nodeCount={40} maxDistance={170} />
          </Suspense>
        </div>
        {/* Parallax orbs */}
        <div className="absolute top-[18%] right-[10%] w-[350px] h-[350px] rounded-full bg-accent/10 blur-[130px] pointer-events-none animate-float-orb will-change-transform" style={{ transform: `translateY(${scrollY * -0.1}px)` }} />
        <div className="absolute bottom-[25%] left-[5%] w-[400px] h-[400px] rounded-full bg-primary/12 blur-[150px] pointer-events-none animate-float-orb-slow will-change-transform" style={{ transform: `translateY(${scrollY * 0.07}px)` }} />

        <div className="relative z-[3] mx-auto max-w-4xl px-5 py-20 md:py-32 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div custom={0} variants={fadeUp} className="mb-6">
              <Badge className="border-accent/30 text-accent bg-accent/10 px-4 py-1.5 text-xs font-bold tracking-wider gap-2">
                <Globe className="h-3.5 w-3.5" />
                TIaaS — Talent Infrastructure as a Service
              </Badge>
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} className="text-[32px] sm:text-[42px] md:text-[54px] font-black leading-[1.06] text-white tracking-tight">
              <span className="text-gradient-accent">AXIOM & ALTIS</span>
              <br />
              <span className="text-white/90">La première infrastructure souveraine de talents France-Afrique</span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="mt-6 text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Nous ne recrutons pas. Nous <strong className="text-white/85">connectons durablement</strong> les talents d'Afrique francophone aux métiers en tension français.
            </motion.p>

            {/* Sectors badges */}
            <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              {SECTORS.map((s) => (
                <span key={s.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 font-medium backdrop-blur-sm">
                  {s.emoji} {s.label}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/70 to-transparent z-[4]" />
      </section>

      {/* ── Mission ────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 md:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
            <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
              Notre Mission
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="font-black text-3xl md:text-[40px] tracking-tight leading-tight">
              Répondre <span className="text-gradient-primary">industriellement</span> à la pénurie
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-12 rounded-3xl border border-border/50 bg-card p-8 md:p-12 shadow-card relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-cta" />
            <motion.p custom={2} variants={fadeUp} className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Répondre industriellement à la pénurie de main-d'œuvre en France{" "}
              <span className="font-semibold text-foreground">(BTP, Santé, CHR, Logistique)</span>{" "}
              en activant des talents certifiés d'Afrique francophone, opérationnels jour 1, avec accompagnement physique complet et conformité totale{" "}
              <span className="font-semibold text-foreground">(ROME, MINEFOP/MINREX, formalités visa de travail – procédure ANEF)</span>.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: "9", label: "Métiers en tension", icon: Zap },
                { value: "100%", label: "Profils vérifiés", icon: Shield },
                { value: "J1", label: "Opérationnel", icon: CheckCircle2 },
                { value: "80%", label: "Risque réduit", icon: Target },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center p-4 rounded-2xl bg-muted/30">
                    <Icon className="h-4 w-4 text-accent mx-auto mb-2" />
                    <p className="font-black text-2xl text-foreground">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Vision & Positionnement ────────────────────────── */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="mx-auto max-w-6xl px-5 md:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
              Vision & Positionnement
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="font-black text-3xl md:text-[40px] tracking-tight">
              Deux piliers, <span className="text-gradient-primary">une infrastructure</span>
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="mt-4 text-muted-foreground text-base max-w-lg mx-auto">
              Technologie souveraine + opérations terrain : la combinaison qui change la donne du recrutement international.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
            className="grid gap-5 sm:grid-cols-2"
          >
            {VISION_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  custom={i}
                  variants={scaleIn}
                  className={`rounded-2xl border ${item.border} bg-card p-7 md:p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
                >
                  <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}>
                    <Icon className={`h-5 w-5 ${item.accent}`} />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-4">{item.title}</h3>
                  <ul className="space-y-2.5">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                        <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${item.accent}`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Tendances RH 2026 ─────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.div custom={0} variants={fadeUp}>
              <Badge className="border-accent/30 text-accent bg-accent/10 px-4 py-1.5 text-xs font-bold tracking-wider gap-2 mb-4">
                <TrendingUp className="h-3.5 w-3.5" />
                Benchmark 2026
              </Badge>
            </motion.div>
            <motion.h2 custom={1} variants={fadeUp} className="font-black text-3xl md:text-[40px] tracking-tight">
              Tendances RH <span className="text-gradient-accent">2026</span>
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="mt-4 text-muted-foreground text-base max-w-2xl mx-auto">
               AXIOM & ALTIS combine certification officielle des compétences, conformité rigoureuse aux normes françaises et un accompagnement physique complet pour une intégration réussie et sécurisée.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { trend: "Pénurie structurelle BTP/Santé/CHR", direction: "up" as const, impact: "Critique", detail: "200 000+ postes non pourvus en France. AXIOM identifie les talents qualifiés en Afrique francophone.", axiom: "Certification officielle des compétences" },
              { trend: "Durcissement conformité visa/ANEF", direction: "up" as const, impact: "Fort", detail: "Complexité administrative croissante. ALTIS prend en charge 100 % des formalités.", axiom: "Pack ALTIS Zéro Stress intégré" },
              { trend: "Exigences de conformité RH", direction: "up" as const, impact: "Transformateur", detail: "Les entreprises exigent des profils certifiés et conformes aux référentiels français.", axiom: "Certification et conformité intégrées" },
              { trend: "Coût d'un mauvais recrutement", direction: "up" as const, impact: "45 000 € moy.", detail: "Turnover coûteux. AXIOM réduit le risque d'intégration grâce à la pré-certification.", axiom: "Réduction risque -80 %" },
              { trend: "Plateformes généralistes", direction: "down" as const, impact: "Saturation", detail: "Les grandes plateformes manquent de conformité internationale. AXIOM = niche premium certifiée.", axiom: "Positionnement TIaaS unique" },
              { trend: "RSE & diversité", direction: "up" as const, impact: "Priorité DRH", detail: "Recrutement inclusif international = levier RSE fort. AXIOM documente l'impact social.", axiom: "Impact social mesuré & certifié" },
            ].map((item, i) => (
              <motion.div
                key={item.trend}
                custom={i}
                variants={scaleIn}
                className="group rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-accent/30 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {item.direction === "up" ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                        <TrendingUp className="h-4 w-4 text-accent" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-accent/30 text-accent">
                    {item.impact}
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground mb-2 leading-snug">{item.trend}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{item.detail}</p>
                <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                  <Crown className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="text-xs font-semibold text-accent">{item.axiom}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* TIaaS positioning banner */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-12 rounded-3xl border border-accent/20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 p-8 md:p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-cta" />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent/5 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex-1">
                <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">
                  Notre avantage concurrentiel
                </motion.p>
                <motion.h3 custom={1} variants={fadeUp} className="font-black text-xl md:text-2xl tracking-tight">
                  TIaaS — <span className="text-gradient-accent">Talent Infrastructure as a Service</span>
                </motion.h3>
                <motion.p custom={2} variants={fadeUp} className="mt-3 text-sm text-muted-foreground leading-relaxed">
                   Aucune plateforme ne combine <strong className="text-foreground">certification officielle des compétences</strong>, <strong className="text-foreground">conformité MINEFOP/MINREX</strong>, <strong className="text-foreground">prise en charge visa ANEF</strong> et <strong className="text-foreground">accompagnement terrain ALTIS</strong> dans une seule infrastructure souveraine.
                </motion.p>
              </div>
              <div className="shrink-0">
                <Link to="/pricing">
                  <Button size="lg" className="rounded-2xl font-bold bg-gradient-cta hover:opacity-90 border-0 text-white px-8 py-5 h-auto shadow-xl shadow-accent/20 group">
                    Découvrir les offres
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-2xl px-5 md:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
              Contact
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="font-black text-3xl md:text-[40px] tracking-tight">
              Une question ? <span className="text-gradient-primary">Parlons-en</span>
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="mt-4 text-muted-foreground text-base max-w-lg mx-auto">
              Recruteur, talent ou partenaire — nous répondons sous 24-48h.
            </motion.p>
          </motion.div>
          <div className="rounded-3xl border border-border/50 bg-card p-8 md:p-10 shadow-card relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-cta" />
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── CTA Final ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <OptimizedImage webpSrc={heroTechNetworkWebp} fallbackSrc={heroTechNetwork} alt="" className="w-full h-full object-cover opacity-25" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-[hsl(222,47%,5%)]/92" />
        </div>
        <div className="absolute inset-0 z-[1]">
          <Suspense fallback={null}>
            <NetworkCanvas nodeCount={20} maxDistance={130} />
          </Suspense>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl" />

        <div className="relative z-[2] mx-auto max-w-2xl px-5 py-24 text-center md:px-10 md:py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-4">
              Rejoignez l'avenir
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="font-black text-3xl text-white md:text-5xl leading-tight tracking-tight">
              Prêt à recruter ou à{" "}
              <span className="text-gradient-accent">rejoindre l'avenir</span> ?
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="mt-4 text-base text-white/50 max-w-md mx-auto">
              Talents certifiés. Conformité rigoureuse. Accompagnement complet. Infrastructure souveraine.
            </motion.p>
            <motion.div custom={3} variants={fadeUp} className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/signup-light">
                <Button size="lg" className="text-base px-8 py-5 h-auto rounded-2xl font-bold shadow-2xl bg-gradient-cta hover:opacity-90 border-0 group text-white">
                  Commencer gratuitement <span className="text-white/60 ml-1 text-sm font-normal">(talents)</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" className="text-base px-8 py-5 h-auto rounded-2xl font-bold border-2 border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 backdrop-blur-sm">
                  <Building2 className="mr-2 h-4 w-4" />
                  Démo recruteur
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/50 bg-card px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-black text-[10px]">A</span>
              </div>
              <span className="font-black text-base text-primary">AXIOM</span>
              <span className="text-muted-foreground/40 text-sm mx-1.5">·</span>
              <span className="font-bold text-sm text-accent">ALTIS Mobility</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
              <Link to="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
              <Link to="/a-propos" className="hover:text-foreground transition-colors">À propos</Link>
              <Link to="/metiers-en-tension" className="hover:text-foreground transition-colors">Métiers</Link>
              <Link to="/rgpd-light" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Lock className="h-3 w-3" /> RGPD
              </Link>
              <a href="mailto:contact@axiom-talents.com" className="hover:text-foreground transition-colors flex items-center gap-1"><Mail className="h-3 w-3" /> contact@axiom-talents.com</a>
            </div>
          </div>
          <div className="mt-5 border-t border-border/30 pt-4 text-center text-xs text-muted-foreground/40">
            © 2026 AXIOM × ALTIS Mobility — Tous droits réservés
          </div>
          <CesedaLegalNotice />
        </div>
      </footer>
    </div>
  );
}
