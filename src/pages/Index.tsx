import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Send, UserCheck, Plane, Mail, Shield,
  GraduationCap, CheckCircle2, Zap, Globe, Users, Clock, BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import MetiersCarousel from "@/components/landing/MetiersCarousel";
import SecurityComplianceSection from "@/components/landing/SecurityComplianceSection";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: easeOut },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.45, ease: easeOut },
  }),
};

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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 md:px-12">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-extrabold tracking-tight text-primary">
              AXIOM
            </span>
            <span className="hidden sm:inline text-xs font-medium text-muted-foreground tracking-wide">
              × ALTIS Mobility
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/metiers-en-tension" className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Métiers en tension
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground">
                Connexion
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="shadow-lg shadow-accent/20">
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-12 md:py-32">
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <Badge variant="outline" className="mb-8 border-white/20 text-white/80 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wider">
                <Globe className="h-3.5 w-3.5 mr-2" />
                Infrastructure souveraine France-Afrique
              </Badge>
            </motion.div>

            <motion.h1
              initial="hidden" animate="visible" custom={1} variants={fadeUp}
              className="font-display text-[40px] font-extrabold leading-[1.08] text-white sm:text-[48px] md:text-[56px]"
            >
              AXIOM : La première infrastructure de talents souveraine{" "}
              <span className="text-gradient-accent">France-Afrique</span>
            </motion.h1>

            <motion.p
              initial="hidden" animate="visible" custom={2} variants={fadeUp}
              className="mt-6 max-w-2xl text-lg text-white/70 leading-relaxed md:text-xl"
            >
              Matching prédictif IA + conformité ROME + certifications MINEFOP/MINREX →{" "}
              <strong className="text-white/90">opérationnel jour 1</strong>
            </motion.p>

            <motion.div
              initial="hidden" animate="visible" custom={3} variants={fadeUp}
              className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2"
            >
              {["Conformité ROME garantie", "Visa & logement inclus", "Opérationnel dès J1", "Certifications MINEFOP"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-sm text-white/50">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> {item}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial="hidden" animate="visible" custom={4} variants={fadeUp}
              className="mt-12 flex flex-col gap-4 sm:flex-row"
            >
              <Link to="/signup">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6 h-auto shadow-xl shadow-accent/30 rounded-xl font-semibold">
                  Inscrivez-vous gratuitement (Cameroun) <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard-entreprise">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base px-8 py-6 h-auto rounded-xl font-semibold border-2 border-white/60 bg-white/15 text-white hover:bg-white/25 hover:border-white/80 backdrop-blur-sm transition-all shadow-lg"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Recrutez des talents certifiés
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ─── Stats band ─── */}
      <section className="relative z-10 -mt-12 px-6 md:px-12">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl bg-border shadow-2xl"
          >
            {[
              { value: "500+", label: "Talents qualifiés", icon: Users },
              { value: "98%", label: "Taux de rétention", icon: BarChart3 },
              { value: "15", label: "Pays d'origine", icon: Globe },
              { value: "30j", label: "Délai moyen", icon: Clock },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} custom={i} variants={scaleIn} className="bg-card px-6 py-8 text-center">
                  <Icon className="h-5 w-5 text-accent mx-auto mb-2" />
                  <p className="font-display text-3xl font-bold text-foreground md:text-4xl">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Carrousel 9 secteurs ─── */}
      <MetiersCarousel />

      {/* ─── Double Expertise ─── */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:px-12 md:py-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
          <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold md:text-5xl">
            Deux piliers, <span className="text-gradient-accent">une seule mission</span>
          </motion.h2>
          <motion.p custom={1} variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
            La fusion du sourcing intelligent et de la mobilité sécurisée pour un recrutement international sans friction.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="mt-16 grid gap-8 md:grid-cols-2">
          {/* AXIOM Talent */}
          <motion.div custom={0} variants={scaleIn} className="group rounded-2xl border bg-card p-10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold">AXIOM <span className="text-accent">Talent</span></h3>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Sourcing & Matching IA</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Nous sélectionnons des profils vérifiés, testés et alignés avec la culture de votre entreprise.
              </p>
              <ul className="space-y-3">
                {["Vivier de talents certifiés", "Entretiens techniques pré-qualifiés", "Matching assisté par IA"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* ALTIS Mobility */}
          <motion.div custom={1} variants={scaleIn} className="group rounded-2xl border bg-card p-10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden relative">
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Plane className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold">ALTIS <span className="text-accent">Mobility</span></h3>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Mobilité & Logistique</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Le recrutement international ne doit plus être un casse-tête. Nous gérons l'humain et le matériel.
              </p>
              <ul className="space-y-3">
                {["Gestion complète des visas et titres de séjour", "Organisation du transport et aide au logement", "Accompagnement à l'intégration (Onboarding)"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Processus ─── */}
      <section className="bg-muted/30 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold md:text-5xl">
              Trois étapes, <span className="text-gradient-accent">un seul interlocuteur</span>
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mx-auto mt-4 max-w-xl text-muted-foreground text-lg">
              Concentrez-vous sur votre cœur de métier. Nous orchestrons tout le reste.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="mt-20 grid gap-8 md:grid-cols-3">
            <StepCard custom={0} step={1} icon={Send} title="Publiez votre offre" desc="Décrivez le poste et les compétences recherchées. Notre équipe commence le sourcing sous 24h." />
            <StepCard custom={1} step={2} icon={UserCheck} title="Sélectionnez" desc="Parcourez les profils pré-qualifiés, menez vos entretiens. Nous gérons la conformité." />
            <StepCard custom={2} step={3} icon={Plane} title="Installation clé en main" desc="Visa, billet, logement meublé, formations certifiantes — votre talent est opérationnel dès J1." />
          </motion.div>
        </div>
      </section>

      {/* ─── Sécurité & Conformité ─── */}
      <SecurityComplianceSection />

      {/* ─── Pourquoi nous ? ─── */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-premium)" }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:px-12 md:py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-white md:text-5xl">
              La solution complète pour <span className="text-gradient-accent">recruter l'excellence</span>
            </motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="mt-16 grid gap-6 md:grid-cols-3">
            <AdvantageCard custom={0} icon={Shield} title="Sécurité Totale" desc="Conformité juridique stricte avec les lois du travail françaises et africaines." />
            <AdvantageCard custom={1} icon={Zap} title="Gain de Temps" desc="Réduisez vos délais de recrutement international de 40%. Un seul interlocuteur." />
            <AdvantageCard custom={2} icon={GraduationCap} title="Impact Social" desc="Participez à la circulation des compétences et au développement des talents." />
          </motion.div>
        </div>
      </section>

      {/* ─── CTA final ─── */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center md:px-12 md:py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-white md:text-5xl leading-tight">
              Prêt à recruter <span className="text-gradient-accent">vos prochains talents ?</span>
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-6 text-lg text-white/60">
              Créez votre compte et publiez votre première offre en 2 minutes. Sans engagement.
            </motion.p>
            <motion.div custom={2} variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/signup">
                <Button size="lg" className="text-base px-12 py-6 h-auto shadow-xl shadow-accent/30 rounded-xl font-semibold">
                  Commencer maintenant <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="mailto:contact@axiom-talents.com">
                <Button size="lg" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 text-base px-8 py-6 h-auto rounded-xl">
                  <Mail className="mr-2 h-4 w-4" /> Nous contacter
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t bg-card px-6 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div>
              <span className="font-display text-lg font-bold text-primary">AXIOM</span>
              <span className="text-muted-foreground text-sm ml-2">– Plateforme RH Tech</span>
              <span className="text-muted-foreground/40 text-sm mx-2">|</span>
              <span className="font-display text-sm font-semibold text-primary/70">ALTIS Mobility</span>
              <span className="text-muted-foreground text-sm ml-2">– Logistique & Accueil sans stress</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors">Mentions légales</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">CGU</span>
              <Link to="/rgpd" className="hover:text-foreground transition-colors font-medium text-primary/70 hover:text-primary">
                🔒 Protection des données (RGPD)
              </Link>
              <a href="mailto:contact@axiom-talents.com" className="hover:text-foreground transition-colors">Contact</a>
              <span className="hover:text-foreground cursor-pointer transition-colors">Partenariats MINEFOP</span>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground/50">
            © 2026 AXIOM × ALTIS Mobility. Tous droits réservés. –{" "}
            <Link to="/rgpd" className="hover:text-muted-foreground transition-colors">Politique de confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ step, icon: Icon, title, desc, custom }: { step: number; icon: any; title: string; desc: string; custom: number }) {
  return (
    <motion.div custom={custom} variants={scaleIn} className="group relative rounded-2xl border bg-card p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
          <Icon className="h-6 w-6 text-accent" />
        </div>
        <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground shadow-md">
          {step}
        </span>
      </div>
      <h3 className="mb-3 font-display text-xl font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function AdvantageCard({ icon: Icon, title, desc, custom }: { icon: any; title: string; desc: string; custom: number }) {
  return (
    <motion.div custom={custom} variants={scaleIn} className="glass-card rounded-2xl p-8 transition-all duration-300 hover:bg-white/10">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <h3 className="mb-3 font-display text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
    </motion.div>
  );
}
