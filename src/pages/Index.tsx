import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight, Mail, Shield, CheckCircle2,
  Zap, Globe, Users, Clock, BarChart3, Plane, Star, Lock,
  Sparkles, BellRing, MapPin, Briefcase,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageLoader } from "@/components/FullPageLoader";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroTechNetwork from "@/assets/hero-tech-network.jpg";
import heroTechNetworkWebp from "@/assets/hero-tech-network.jpg?format=webp";
import { OptimizedImage } from "@/components/OptimizedImage";

const NetworkCanvas = lazy(() => import("@/components/landing/NetworkCanvas"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const PartnersCarousel = lazy(() => import("@/components/landing/PartnersCarousel"));

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
// ── Animated Counter ──────────────────────────────────────────
function AnimatedCounter({ end, suffix, duration = 1.8 }: { end: number; suffix: string; duration?: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / (duration * 1000), 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <p ref={ref} className="font-black text-3xl text-foreground tabular-nums">
      {display}{suffix}
    </p>
  );
}


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
  { icon: Plane, title: "Pack ALTIS Zéro Stress", desc: "Formalités visa de travail (procédure ANEF) + billet A/R + accueil aéroport + logement meublé 1 mois + accompagnement administratif", accent: "text-primary", bg: "bg-primary/10" },
  { icon: Star, title: "Inscription gratuite", desc: "Commencez sans engagement, débloquez le premium après", accent: "text-tension", bg: "bg-tension/10" },
];

const LIVE_OFFERS = [
  { poste: "Maçon qualifié", ville: "Lyon", secteur: "BTP", delay: 0 },
  { poste: "Aide-soignant(e)", ville: "Paris", secteur: "Santé", delay: 4000 },
  { poste: "Chauffeur PL", ville: "Bordeaux", secteur: "Transport", delay: 8000 },
  { poste: "Serveur / Serveuse", ville: "Marseille", secteur: "CHR", delay: 12000 },
  { poste: "Technicien maintenance", ville: "Toulouse", secteur: "Industrie", delay: 16000 },
];

const METIER_OPTIONS = [
  { label: "Maçonnerie / BTP", value: "F1703", icon: "🏗️" },
  { label: "Aide-soignant / Santé", value: "J1501", icon: "🏥" },
  { label: "Transport / Logistique", value: "N1101", icon: "🚛" },
  { label: "Service salle / CHR", value: "G1602", icon: "🍽️" },
  { label: "Maintenance industrielle", value: "I1304", icon: "⚙️" },
  { label: "Commerce / Distribution", value: "D1212", icon: "🛒" },
  { label: "Agriculture / Agroalim.", value: "A1401", icon: "🌱" },
];

// ── Component ─────────────────────────────────────────────────
export default function Index() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const [teaserEmail, setTeaserEmail] = useState("");
  const [teaserMetier, setTeaserMetier] = useState("");
  const [currentAlert, setCurrentAlert] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  // Parallax scroll tracking
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Rotate live alerts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAlert((prev) => (prev + 1) % LIVE_OFFERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <FullPageLoader />;
  if (session && role === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;
  if (session && role === "talent") return <Navigate to="/dashboard-talent" replace />;
  if (session && role === "admin") return <Navigate to="/admin" replace />;
  if (session && role === "recruteur") return <Navigate to="/dashboard-recruteur" replace />;
  if (session) return <Navigate to="/dashboard" replace />;

  const handleTeaserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (teaserEmail) params.set("email", teaserEmail);
    if (teaserMetier) params.set("metier", teaserMetier);
    navigate(`/leads?${params.toString()}`);
  };

  const currentOffer = LIVE_OFFERS[currentAlert];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[hsl(222,47%,8%)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-black text-xs">A</span>
            </div>
            <span className="font-black text-xl tracking-tight text-white">AXIOM</span>
            <span className="hidden sm:inline text-xs font-medium text-white/40 border-l border-white/15 pl-2.5 ml-0.5">× ALTIS Mobility</span>
          </div>
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <Link to="/a-propos" className="hidden md:inline text-sm font-medium text-white/50 hover:text-white/90 transition-colors px-3 py-1.5">
              À propos
            </Link>
            <Link to="/fiches-metiers" className="hidden md:inline text-sm font-medium text-white/50 hover:text-white/90 transition-colors px-3 py-1.5">
              Fiches métiers
            </Link>
            <Link to="/metiers-en-tension" className="hidden lg:inline text-sm font-medium text-white/50 hover:text-white/90 transition-colors px-3 py-1.5">
              Métiers en tension
            </Link>
            <Link to="/demande-devis" className="hidden lg:inline text-sm font-semibold text-accent hover:text-accent/80 transition-colors px-3 py-1.5">
              Demander un devis
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/8 border border-white/10 text-xs sm:text-sm px-2.5 sm:px-3">Connexion</Button>
            </Link>
            <Link to="/signup-light">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg shadow-accent/25 border-0 text-xs sm:text-sm px-3 sm:px-4">
                Commencer
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Full-Screen ─────────────────────────────────── */}
      <section ref={heroRef} className="relative lg:min-h-screen flex items-start lg:items-center overflow-x-hidden pt-16 pb-24 lg:pb-0">
        {/* Tech network background — enriched multi-layer gradient */}
        <div className="absolute inset-0">
          <OptimizedImage webpSrc={heroTechNetworkWebp} fallbackSrc={heroTechNetwork} alt="" className="w-full h-full object-cover opacity-50" loading="eager" decoding="async" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,4%)]/98 via-[hsl(221,83%,12%)]/92 to-[hsl(187,94%,15%)]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,4%)] via-transparent to-[hsl(222,47%,4%)]/60" />
          {/* Radial spotlight from center-left */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_50%,hsl(187,94%,43%,0.08),transparent_70%)]" />
        </div>
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-hero-dots opacity-40 z-[1]" />
        {/* Animated node network */}
        <div className="absolute inset-0 z-[2]">
          <Suspense fallback={null}>
            <NetworkCanvas nodeCount={50} maxDistance={190} />
          </Suspense>
        </div>
        {/* Floating orbs with parallax — each moves at different speed */}
        <div className="absolute top-[20%] right-[12%] w-[380px] h-[380px] rounded-full bg-accent/12 blur-[140px] pointer-events-none animate-float-orb transition-transform duration-100 will-change-transform" style={{ transform: `translateY(${scrollY * -0.12}px)` }} />
        <div className="absolute bottom-[20%] left-[8%] w-[450px] h-[450px] rounded-full bg-primary/14 blur-[160px] pointer-events-none animate-float-orb-slow transition-transform duration-100 will-change-transform" style={{ transform: `translateY(${scrollY * 0.08}px)` }} />
        <div className="absolute top-[50%] right-[30%] w-[280px] h-[280px] rounded-full bg-accent/8 blur-[110px] pointer-events-none animate-float-orb transition-transform duration-100 will-change-transform" style={{ transform: `translateY(${scrollY * -0.06}px) translateX(${scrollY * 0.03}px)` }} />
        <div className="absolute top-[10%] left-[40%] w-[200px] h-[200px] rounded-full bg-primary/6 blur-[100px] pointer-events-none animate-float-orb-slow transition-transform duration-100 will-change-transform" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />

        <div className="relative z-[3] mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* ── Left: Copy ───────────────────────────────────── */}
            <motion.div initial="hidden" animate="visible" className="flex-1 max-w-xl">

              <motion.div custom={0} variants={fadeUp} className="mb-6">
                <Badge className="border-accent/30 text-accent bg-accent/10 px-3.5 py-1.5 text-xs font-bold tracking-wider gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  Infrastructure souveraine · France — Afrique
                </Badge>
              </motion.div>

              <motion.h1
                custom={1} variants={fadeUp}
                className="text-[38px] font-black leading-[1.04] text-white sm:text-[50px] md:text-[58px] tracking-tight"
              >
                La France cherche des{" "}
                <span className="text-gradient-accent">talents comme le vôtre</span>
              </motion.h1>

              <motion.p
                custom={2} variants={fadeUp}
                className="mt-5 max-w-lg text-base text-white/65 leading-relaxed md:text-lg"
              >
                Dans les secteurs les plus demandés : <strong className="text-white/85">construction, santé, restauration, maintenance</strong> et bien plus encore.
              </motion.p>

              {/* Proof points */}
              <motion.div custom={3} variants={fadeUp} className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                {["Gratuit depuis l'Afrique", "Certifications MINEFOP", "Score vérifié en 30 sec", "Visa & logement inclus"].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-sm text-white/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                    {item}
                  </span>
                ))}
              </motion.div>

              {/* Single CTA */}
              <motion.div custom={4} variants={fadeUp} className="mt-10 flex justify-center">
                <Button
                  asChild
                  size="lg"
                  className="w-[90%] max-w-md sm:w-auto text-base px-10 py-6 h-auto rounded-2xl font-bold shadow-2xl shadow-accent/30 bg-gradient-cta hover:opacity-90 hover:scale-[1.03] border-0 group text-white btn-ripple animate-micro-pulse transition-transform duration-200 mx-auto"
                >
                  <Link to="/signup-light">
                    Commencer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
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

            {/* ── Right: Live Alerts + Teaser Form ──────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.8, ease }}
              className="flex flex-col w-full lg:w-[420px] xl:w-[460px] gap-5 relative z-10"
            >
              {/* Live offer alert */}
              <div className="rounded-2xl border border-accent/15 bg-white/5 backdrop-blur-md p-4 overflow-hidden shadow-lg shadow-accent/5">
                <div className="flex items-center gap-2 mb-3">
                  <BellRing className="h-4 w-4 text-accent animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Offres live</span>
                  <span className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentAlert}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{currentOffer.poste}</p>
                      <p className="text-xs text-white/50 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {currentOffer.ville}
                        <span className="text-accent">·</span> {currentOffer.secteur}
                      </p>
                    </div>
                    <Badge className="bg-success/15 text-success border-success/25 text-[10px] shrink-0">CDI</Badge>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-2.5 text-[11px] text-accent/80 font-semibold flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3 w-3 text-accent" /> Votre profil match 85 % – Éligible visa ?
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Teaser leads form */}
              <form onSubmit={handleTeaserSubmit} className="rounded-2xl border border-accent/15 bg-white/5 backdrop-blur-md p-5 shadow-lg shadow-primary/5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-bold text-white">Testez votre éligibilité</span>
                  <Badge className="ml-auto bg-accent/15 text-accent border-accent/25 text-[9px]">Gratuit</Badge>
                </div>
                <div className="space-y-3">
                  <Input
                    placeholder="Email ou téléphone +237"
                    value={teaserEmail}
                    onChange={(e) => setTeaserEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 text-base sm:text-sm focus:border-accent/40 focus:ring-accent/20 w-full"
                  />
                  <Select value={teaserMetier} onValueChange={setTeaserMetier}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 text-base sm:text-sm w-full">
                      <SelectValue placeholder="Votre métier…" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                      {METIER_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          <span className="flex items-center gap-2">
                            <span>{m.icon}</span> {m.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full h-12 bg-gradient-cta text-white font-bold border-0 hover:opacity-90 shadow-lg shadow-accent/20 text-base sm:text-sm">
                    Voir mon score IA <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-white/30 mt-3 text-center">
                  Score calculé en 30 sec · Aucun engagement
                </p>
              </form>
            </motion.div>

          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 lg:h-40 bg-gradient-to-t from-background via-background/70 to-transparent z-[4] pointer-events-none" />
      </section>

      {/* ── Stats Band ───────────────────────────────────────── */}
      <section className="relative z-10 -mt-8 px-5 md:px-10" style={{ contentVisibility: "auto" as any, containIntrinsicSize: "0 200px" }}>
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-success/20 shadow-2xl shadow-primary/10 ring-1 ring-white/10"
          >
            {[
              { end: 500, suffix: "+", label: "Talents qualifiés", icon: Users },
              { end: 98, suffix: "%", label: "Taux de rétention", icon: BarChart3 },
              { end: 15, suffix: "", label: "Pays d'origine", icon: Globe },
              { end: 30, suffix: "j", label: "Délai moyen", icon: Clock },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} custom={i} variants={scaleIn} className="group bg-card/98 backdrop-blur-sm px-5 py-8 text-center transition-all duration-300 hover:bg-accent/5">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <Icon className="h-[18px] w-[18px] text-accent" />
                  </div>
                  <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                  <p className="mt-1 text-xs text-muted-foreground font-medium">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Partners Carousel ─────────────────────────────────── */}
      <Suspense fallback={null}>
        <PartnersCarousel />
      </Suspense>

      {/* ── 9 Secteurs Grid ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32" style={{ contentVisibility: "auto", containIntrinsicSize: "0 600px" }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
          <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
            Opportunités 2026
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
              className={`group relative rounded-2xl border bg-gradient-to-br p-5 cursor-default transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 hover:border-accent/30 ${s.color}`}
            >
              <div className="absolute inset-0 rounded-2xl bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{s.emoji}</span>
                  <Badge className="bg-tension/12 text-tension border-tension/25 text-[10px] px-2 py-0.5 font-bold shrink-0">
                    {s.tag}
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1 group-hover:text-accent transition-colors">{s.label}</h3>
                <p className="text-[11px] text-muted-foreground font-mono mb-3">{s.rome}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                  Certifiable MINEFOP
                </div>
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

      {/* ── How It Works ─────────────────────────────────────── */}
      <Suspense fallback={null}>
        <HowItWorksSection />
      </Suspense>

      {/* ── 4 Cartes Confiance ───────────────────────────────── */}
      <section className="bg-muted/30 py-20 md:py-28" style={{ contentVisibility: "auto", containIntrinsicSize: "0 400px" }}>
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
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {TRUST_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  custom={i}
                  variants={scaleIn}
                  className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 hover:border-accent/30"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${card.bg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 ${card.accent}`} />
                  </div>
                  <h3 className="mb-2 font-bold text-base text-foreground group-hover:text-accent transition-colors">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <Suspense fallback={null}>
        <TestimonialsSection />
      </Suspense>

      {/* ── CTA Final ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Tech background with network */}
        <div className="absolute inset-0">
          <OptimizedImage webpSrc={heroTechNetworkWebp} fallbackSrc={heroTechNetwork} alt="" className="w-full h-full object-cover opacity-30" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-[hsl(222,47%,5%)]/90" />
        </div>
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <Suspense fallback={null}>
            <NetworkCanvas nodeCount={22} maxDistance={140} />
          </Suspense>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/8 blur-3xl pointer-events-none" />

        <div className="relative z-[2] mx-auto max-w-2xl px-5 py-24 text-center md:px-10 md:py-28">
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
             <motion.div custom={3} variants={fadeUp} className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center relative z-10">
              <Button
                size="lg"
                className="w-[90%] max-w-md sm:w-auto text-base px-10 py-5 h-auto rounded-2xl font-bold shadow-2xl bg-gradient-cta hover:opacity-90 border-0 group text-white mx-auto sm:mx-0"
                onClick={() => navigate("/signup-light")}
              >
                Commencer gratuitement <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white/50 hover:text-white hover:bg-white/8 text-base px-8 py-5 h-auto rounded-2xl"
                onClick={() => window.location.href = "mailto:contact@axiom-talents.com"}
              >
                <Mail className="mr-2 h-4 w-4" /> Nous contacter
              </Button>
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
              <Link to="/signup-light" className="hover:text-foreground transition-colors flex items-center gap-1.5 font-medium text-accent/80 hover:text-accent">
                <ArrowRight className="h-3 w-3" /> S'inscrire
              </Link>
              <span className="text-muted-foreground/30">·</span>
              <Link to="/leads" className="hover:text-foreground transition-colors flex items-center gap-1.5 font-medium text-accent/80 hover:text-accent">
                <Zap className="h-3 w-3" /> Tester mon profil
              </Link>
              <span className="text-muted-foreground/30">·</span>
              <Link to="/pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
              <Link to="/a-propos" className="hover:text-foreground transition-colors">À propos</Link>
              <Link to="/fiches-metiers" className="hover:text-foreground transition-colors">Fiches métiers</Link>
              <Link to="/rgpd-light" className="hover:text-foreground transition-colors">Mentions légales</Link>
              <Link to="/rgpd-light" className="hover:text-foreground transition-colors">CGU</Link>
              <Link to="/rgpd-light" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Lock className="h-3 w-3" /> RGPD
              </Link>
              <a href="mailto:charly@axiom-talents.com" className="hover:text-foreground transition-colors flex items-center gap-1"><Mail className="h-3 w-3" /> charly@axiom-talents.com</a>
              <a href="tel:+33686401810" className="hover:text-foreground transition-colors text-xs">+33 6 86 40 18 10</a>
            </div>
          </div>
          <div className="mt-5 border-t border-border/30 pt-4 text-center text-xs text-muted-foreground/40">
            © 2026 AXIOM × ALTIS Mobility · SIRET en cours d'immatriculation ·{" "}
            <Link to="/rgpd" className="hover:text-muted-foreground transition-colors">Politique de confidentialité</Link>
          </div>
          <CesedaLegalNotice />
        </div>
      </footer>
    </div>
  );
}
