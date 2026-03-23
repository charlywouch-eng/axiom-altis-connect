import { useState, useEffect, useRef, lazy, Suspense } from "react";
import MatchingIASection from "@/components/landing/MatchingIASection";
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
  Sparkles, BellRing, MapPin, Briefcase, Award, GraduationCap,
  Building2, Target, HeartHandshake, FileCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageLoader } from "@/components/FullPageLoader";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import heroTechNetwork from "@/assets/hero-tech-network.jpg";
import heroTechNetworkWebp from "@/assets/hero-tech-network.jpg?format=webp";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getAvatarForTalent, TALENT_PHOTOS_WEBP } from "@/lib/metierAvatars";

const NetworkCanvas = lazy(() => import("@/components/landing/NetworkCanvas"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const PartnersCarousel = lazy(() => import("@/components/landing/PartnersCarousel"));

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

const LIVE_OFFERS = [
  { poste: "Maçon qualifié", ville: "Lyon", secteur: "BTP" },
  { poste: "Aide-soignant(e)", ville: "Paris", secteur: "Santé" },
  { poste: "Chauffeur PL", ville: "Bordeaux", secteur: "Transport" },
  { poste: "Serveur / Serveuse", ville: "Marseille", secteur: "CHR" },
  { poste: "Technicien maintenance", ville: "Toulouse", secteur: "Industrie" },
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

const TALENT_CARDS = [
  {
    icon: Target,
    title: "Évaluation & badge AXIOM READY",
    desc: "Vos compétences sont évaluées selon les référentiels français. Les profils conformes reçoivent le badge AXIOM READY visible par les recruteurs.",
    badge: "AXIOM READY",
    badgeColor: "bg-accent/15 text-accent border-accent/25",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    bullets: [
      "Score de conformité IA 0-100 % en temps réel",
      "Analyse croisée ROME + référentiel MINEFOP",
      "Visibilité prioritaire auprès des recruteurs",
      "Badge « AXIOM READY » dès 80 % de conformité",
      "Tableau de bord personnel avec suivi progression",
    ],
  },
  {
    icon: GraduationCap,
    title: "Formations certifiées MINEFOP",
    desc: "Parcours personnalisés alignés avec les exigences françaises. Formations CQP/DQP certifiées, Classes Miroirs et mises à niveau linguistiques.",
    badge: "Certifié",
    badgeColor: "bg-primary/15 text-primary border-primary/25",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    bullets: [
      "Parcours CQP/DQP officiels certifiés",
      "Classes Miroirs AXIOM (standards FR)",
      "Mise à niveau français B1 → B2 incluse",
      "Préparation métier par secteur en tension",
      "Certification reconnue par France Travail",
    ],
  },
  {
    icon: Plane,
    title: "Pack ALTIS Zéro Stress",
    desc: "Visa de travail (ANEF), accueil aéroport, logement meublé, accompagnement administratif complet. ALTIS s'occupe de tout pour 2 450 €.",
    badge: "Tout inclus",
    badgeColor: "bg-success/15 text-success border-success/25",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    bullets: [
      "Procédure visa ANEF entièrement gérée",
      "Billet d'avion aller vers la France inclus",
      "Logement meublé garanti le 1er mois",
      "Accueil aéroport + transfert domicile",
      "Garantie intégration employeur 30 jours",
    ],
  },
];

const ENTREPRISE_CARDS = [
  {
    icon: FileCheck,
    title: "Talents vérifiés et certifiés",
    desc: "Chaque candidat est certifié conforme aux exigences françaises avant d'être présenté. Zéro mauvaise surprise.",
    badge: "Certifié",
    badgeColor: "bg-accent/15 text-accent border-accent/25",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    bullets: [
      "Diplômes apostillés MINREX",
      "Vérification d'identité complète",
      "Antécédents professionnels validés",
    ],
  },
  {
    icon: BarChart3,
    title: "Conformité et précision",
    desc: "Certification officielle + conformité rigoureuse aux normes françaises + accompagnement complet. 98 % de rétention à 12 mois.",
    badge: "Premium",
    badgeColor: "bg-primary/15 text-primary border-primary/25",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    bullets: [
      "Matching IA prédictif multi-critères",
      "Score conformité ROME vérifié",
      "Réduction risque onboarding −80 %",
    ],
  },
  {
    icon: HeartHandshake,
    title: "Service ALTIS complet",
    desc: "De la sélection à l'intégration opérationnelle jour 1 : visa, hébergement, transport, accompagnement RH. Forfait 2 450 € tout compris.",
    badge: "2 450 €",
    badgeColor: "bg-tension/15 text-tension border-tension/25",
    iconBg: "bg-tension/10",
    iconColor: "text-tension",
    bullets: [
      "Procédure visa ANEF gérée",
      "Accueil aéroport + logement meublé",
      "Interlocuteur unique entreprise",
    ],
  },
];

export default function Index() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const [teaserEmail, setTeaserEmail] = useState("");
  const [teaserMetier, setTeaserMetier] = useState("");
  const [currentAlert, setCurrentAlert] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <div className="absolute inset-0">
          <OptimizedImage webpSrc={heroTechNetworkWebp} fallbackSrc={heroTechNetwork} alt="" className="w-full h-full object-cover opacity-50" loading="eager" decoding="async" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,4%)]/98 via-[hsl(221,83%,12%)]/92 to-[hsl(187,94%,15%)]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,4%)] via-transparent to-[hsl(222,47%,4%)]/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_50%,hsl(187,94%,43%,0.08),transparent_70%)]" />
        </div>
        <div className="absolute inset-0 bg-hero-dots opacity-40 z-[1]" />
        <div className="absolute inset-0 z-[2]">
          <Suspense fallback={null}>
            <NetworkCanvas nodeCount={50} maxDistance={190} />
          </Suspense>
        </div>
        <div className="absolute top-[20%] right-[12%] w-[380px] h-[380px] rounded-full bg-accent/12 blur-[140px] pointer-events-none animate-float-orb transition-transform duration-100 will-change-transform" style={{ transform: `translateY(${scrollY * -0.12}px)` }} />
        <div className="absolute bottom-[20%] left-[8%] w-[450px] h-[450px] rounded-full bg-primary/14 blur-[160px] pointer-events-none animate-float-orb-slow transition-transform duration-100 will-change-transform" style={{ transform: `translateY(${scrollY * 0.08}px)` }} />
        <div className="absolute top-[50%] right-[30%] w-[280px] h-[280px] rounded-full bg-accent/8 blur-[110px] pointer-events-none animate-float-orb transition-transform duration-100 will-change-transform" style={{ transform: `translateY(${scrollY * -0.06}px) translateX(${scrollY * 0.03}px)` }} />

        <div className="relative z-[3] mx-auto max-w-6xl px-5 py-20 md:px-10 md:py-28 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            <motion.div initial="hidden" animate="visible" className="flex-1 max-w-xl">
              <motion.div custom={0} variants={fadeUp} className="mb-6">
                <Badge className="border-accent/30 text-accent bg-accent/10 px-3.5 py-1.5 text-xs font-bold tracking-wider gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  Infrastructure souveraine · France — Afrique
                </Badge>
              </motion.div>

              <motion.h1
                custom={1} variants={fadeUp}
                className="text-[34px] font-black leading-[1.06] text-white sm:text-[46px] md:text-[54px] tracking-tight"
              >
                Les secteurs qui recrutent le plus en France{" "}
                <span className="text-gradient-accent">vous attendent</span>
              </motion.h1>

              <motion.p
                custom={2} variants={fadeUp}
                className="mt-5 max-w-lg text-base text-white/65 leading-relaxed md:text-lg"
              >
                Talents d'Afrique certifiés • Conformité aux normes françaises • Accompagnement <strong className="text-accent">ALTIS Zéro Stress</strong>
              </motion.p>

              <motion.div custom={3} variants={fadeUp} className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                {["Gratuit depuis l'Afrique", "Certifications MINEFOP", "Éligibilité vérifiée", "Visa & logement inclus"].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-sm text-white/50">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                    {item}
                  </span>
                ))}
              </motion.div>

              {/* Dual CTAs */}
              <motion.div custom={4} variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-5 h-auto rounded-2xl font-bold shadow-2xl shadow-accent/30 bg-accent hover:bg-accent/90 border-0 group text-accent-foreground btn-ripple animate-micro-pulse"
                >
                  <Link to="/signup-light">
                    Commencer mon évaluation gratuite
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-5 h-auto rounded-2xl font-semibold border-white/15 text-white/80 hover:text-white hover:bg-white/8 hover:border-white/25"
                >
                  <Link to="/signup">
                    <Building2 className="mr-2 h-4 w-4" />
                    Je suis une entreprise → Recruter
                  </Link>
                </Button>
              </motion.div>

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
                </AnimatePresence>
              </div>

              <form onSubmit={handleTeaserSubmit} className="rounded-2xl border border-accent/15 bg-white/5 backdrop-blur-md p-5 shadow-lg shadow-primary/5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-bold text-white">Évaluation gratuite (30 secondes)</span>
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
                    Commencer mon évaluation gratuite <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-white/30 mt-3 text-center">
                  Score calculé en 30 sec · Aucun engagement
                </p>
              </form>
            </motion.div>

          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 lg:h-40 bg-gradient-to-t from-background via-background/70 to-transparent z-[4] pointer-events-none" />
      </section>

      {/* ── Stats Band ───────────────────────────────────────── */}
      <section className="relative z-10 -mt-8 px-5 md:px-10">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial="hidden" animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-success/20 shadow-2xl shadow-primary/10 ring-1 ring-white/10"
          >
            {[
              { end: 500, suffix: "+", label: "Talents qualifiés", icon: Users },
              { end: 98, suffix: "%", label: "Taux de rétention", icon: BarChart3 },
              { text: "Multi-pays", label: "Couverture Afrique", icon: Globe },
              { text: "Express", label: "Délai de placement", icon: Clock },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} custom={i} variants={scaleIn} className="group bg-card/98 backdrop-blur-sm px-5 py-8 text-center transition-all duration-300 hover:bg-accent/5">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <Icon className="h-[18px] w-[18px] text-accent" />
                  </div>
                  {'text' in stat ? <p className="text-3xl font-bold font-display tracking-tight text-foreground">{stat.text}</p> : <AnimatedCounter end={stat.end!} suffix={stat.suffix!} />}
                  <p className="mt-1 text-xs text-muted-foreground font-medium">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Partenariat Officiel MINEFOP ─────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-20 md:px-10 md:py-28">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-12">
          <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
            Nos partenariats officiels
          </motion.p>
          <motion.h2 custom={1} variants={fadeUp} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
            Partenariat Officiel avec le{" "}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">MINEFOP – Cameroun</span>
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="mb-12">
          <motion.p custom={2} variants={fadeUp} className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto text-center">
            Nous travaillons en étroite collaboration avec le Ministère de l'Emploi et de la Formation Professionnelle du Cameroun.
            Chaque talent est formé selon les programmes <strong className="text-foreground">CQP/DQP officiels</strong>, audités et complétés par nos{" "}
            <strong className="text-foreground">Classes Miroirs</strong> pour correspondre parfaitement aux exigences françaises (Codes ROME).
            <br className="hidden sm:block" />
            <span className="mt-2 inline-block">
              Résultat : le badge <strong className="text-accent">« AXIOM READY »</strong> garanti aux entreprises.
            </span>
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: Building2,
              title: "MINEFOP",
              desc: "Ministère de l'Emploi et de la Formation Professionnelle – Cameroun",
              color: "text-primary",
              bg: "bg-primary/10",
              border: "border-primary/20",
            },
            {
              icon: FileCheck,
              title: "Certification CQP/DQP",
              desc: "Programmes officiels audités et alignés sur les standards français",
              color: "text-accent",
              bg: "bg-accent/10",
              border: "border-accent/20",
            },
            {
              icon: Award,
              title: "AXIOM READY",
              desc: "Badge qualité garanti : talent formé, vérifié, prêt à travailler en France",
              color: "text-success",
              bg: "bg-success/10",
              border: "border-success/20",
            },
          ].map((card, i) => {
            const CardIcon = card.icon;
            return (
              <motion.div
                key={card.title}
                custom={i}
                variants={scaleIn}
                className={`group rounded-2xl border ${card.border} bg-card p-6 text-center transition-all duration-300 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-1`}
              >
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${card.bg} transition-colors group-hover:scale-110`}>
                  <CardIcon className={`h-7 w-7 ${card.color}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ── Partners ─────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <PartnersCarousel />
      </Suspense>

      {/* ══════════════════════════════════════════════════════════
           SECTION « POUR LES TALENTS »
         ══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 py-24 md:px-10 md:py-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
            Pour les Talents
          </motion.p>
          <motion.h2 custom={1} variants={fadeUp} className="font-black text-3xl md:text-[42px] leading-tight tracking-tight">
            Votre avenir en France,{" "}
            <span className="text-gradient-accent">simplifié</span>
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} className="mt-4 text-muted-foreground text-base max-w-2xl mx-auto">
            De l'inscription gratuite au premier jour de travail — certification, formations certifiées et relocalisation complète.
          </motion.p>
        </motion.div>

        {/* Avatars cosmopolites */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} className="flex justify-center gap-3 mb-12">
          {TALENT_PHOTOS_WEBP.slice(0, 5).map((src, i) => (
            <motion.div key={i} custom={i} variants={scaleIn} className="relative">
              <img
                src={src}
                alt={`Talent ${i + 1}`}
                className="h-14 w-14 md:h-16 md:w-16 rounded-full object-cover border-2 border-accent/30 shadow-lg shadow-accent/10"
                loading="lazy"
              />
              {i === 2 && (
                <Badge className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground text-[8px] px-1.5 py-0.5 border-0">
                  <Award className="h-2.5 w-2.5 mr-0.5" /> READY
                </Badge>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TALENT_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                custom={i}
                variants={scaleIn}
                className="group rounded-2xl border border-accent/15 bg-card p-7 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 hover:border-accent/30"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <Badge className={`${card.badgeColor} text-[10px] font-bold`}>{card.badge}</Badge>
                </div>
                <h3 className="mb-3 font-bold text-lg text-foreground group-hover:text-accent transition-colors">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{card.desc}</p>
                <ul className="space-y-2">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${card.iconColor}`} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-10">
          <motion.div custom={0} variants={fadeUp}>
            <Button asChild size="lg" className="rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 py-5 h-auto shadow-lg shadow-accent/25 border-0 group">
              <Link to="/signup-light">
                Commencer mon évaluation gratuite (30 secondes)
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           SECTION « POUR LES ENTREPRISES »
         ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,8%)] via-[hsl(217,33%,12%)] to-[hsl(199,89%,48%/0.08)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(var(--accent)/0.06),transparent_70%)]" />
        <div className="absolute inset-0 bg-hero-dots opacity-20" />

        <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
            <motion.p custom={0} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3">
              Pour les Entreprises
            </motion.p>
            <motion.h2 custom={1} variants={fadeUp} className="font-black text-3xl md:text-[42px] leading-tight tracking-tight text-white">
              Recrutez des <span className="text-gradient-accent">talents certifiés</span> d'Afrique
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="mt-4 text-white/60 text-base max-w-2xl mx-auto">
              Secteurs en tension (BTP, Santé, CHR, Logistique) — des profils opérationnels jour 1, certifiés et accompagnés.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {ENTREPRISE_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  custom={i}
                  variants={scaleIn}
                  className="group rounded-2xl border border-accent/15 glass-card p-7 transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 hover:border-accent/30 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent opacity-60" />
                  <div className="flex items-start justify-between mb-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <Badge className={`${card.badgeColor} text-[10px] font-bold`}>{card.badge}</Badge>
                  </div>
                  <h3 className="mb-3 font-bold text-lg text-white group-hover:text-accent transition-colors">{card.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed mb-4">{card.desc}</p>
                  <ul className="space-y-2">
                    {card.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs text-white/50">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-10">
            <motion.div custom={0} variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 py-5 h-auto shadow-lg shadow-accent/25 border-0 group">
                <Link to="/signup">
                  Recruter maintenant
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl border-white/15 text-white/80 hover:text-white hover:bg-white/8 px-8 py-5 h-auto">
                <Link to="/demande-devis">
                  Demander un devis personnalisé
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Matching IA Prédictif ────────────────────────────── */}
      <MatchingIASection variant="light" />

      {/* ── How It Works ─────────────────────────────────────── */}
      <Suspense fallback={null}>
        <HowItWorksSection />
      </Suspense>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <Suspense fallback={null}>
        <TestimonialsSection />
      </Suspense>

      {/* ── CTA Final ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
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
                className="w-[90%] max-w-md sm:w-auto text-base px-10 py-5 h-auto rounded-2xl font-bold shadow-2xl bg-accent hover:bg-accent/90 border-0 group text-accent-foreground mx-auto sm:mx-0"
                onClick={() => navigate("/signup-light")}
              >
                Commencer mon évaluation gratuite <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
      <footer className="border-t border-border/50 bg-card px-5 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-black text-[10px]">A</span>
                </div>
                <span className="font-black text-base text-primary">AXIOM</span>
                <span className="text-muted-foreground/40 text-sm mx-1">·</span>
                <span className="font-bold text-sm text-accent">ALTIS</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Infrastructure Souveraine France-Afrique. Recrutement certifié, conformité rigoureuse et relocalisation complète.
              </p>
            </div>

            {/* Talents */}
            <div>
              <p className="font-bold text-sm text-foreground mb-3">Talents</p>
              <div className="flex flex-col gap-2">
                <Link to="/signup-light" className="text-sm text-muted-foreground hover:text-accent transition-colors">S'inscrire gratuitement</Link>
                <Link to="/leads" className="text-sm text-muted-foreground hover:text-accent transition-colors">Tester mon profil</Link>
                <Link to="/fiches-metiers" className="text-sm text-muted-foreground hover:text-accent transition-colors">Fiches métiers</Link>
                <Link to="/metiers-en-tension" className="text-sm text-muted-foreground hover:text-accent transition-colors">Métiers en tension</Link>
              </div>
            </div>

            {/* Entreprises */}
            <div>
              <p className="font-bold text-sm text-foreground mb-3">Entreprises</p>
              <div className="flex flex-col gap-2">
                <Link to="/signup" className="text-sm text-muted-foreground hover:text-accent transition-colors">Recruter des talents</Link>
                <Link to="/demande-devis" className="text-sm text-muted-foreground hover:text-accent transition-colors">Demander un devis</Link>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-accent transition-colors">Tarifs</Link>
              </div>
            </div>

            {/* Légal */}
            <div>
              <p className="font-bold text-sm text-foreground mb-3">Légal & Contact</p>
              <div className="flex flex-col gap-2">
                <Link to="/rgpd" className="text-sm text-muted-foreground hover:text-accent transition-colors">RGPD & Confidentialité</Link>
                <Link to="/a-propos" className="text-sm text-muted-foreground hover:text-accent transition-colors">À propos</Link>
                <a href="mailto:contact@axiom-talents.com" className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> contact@axiom-talents.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-accent/60" />
              <p className="text-xs text-muted-foreground/60">
                Infrastructure Souveraine France-Afrique · Données hébergées en UE · Conformité RGPD
              </p>
            </div>
            <p className="text-xs text-muted-foreground/40">
              © {new Date().getFullYear()} AXIOM × ALTIS Mobility — Tous droits réservés
            </p>
          </div>

          <CesedaLegalNotice />
        </div>
      </footer>
    </div>
  );
}
