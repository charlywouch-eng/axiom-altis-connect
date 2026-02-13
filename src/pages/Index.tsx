import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Send, UserCheck, Plane, Mail, Shield, Building2, GraduationCap, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-map-connections.jpg";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: easeOut },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: easeOut },
  }),
};

export default function Index() {
  const { session, role, loading } = useAuth();

  if (loading) return null;
  if (session && role === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;
  if (session && role === "talent") return <Navigate to="/dashboard-talent" replace />;
  if (session && role === "admin") return <Navigate to="/admin" replace />;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-primary/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-12">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-accent" />
              <span className="font-display text-xl font-bold text-primary-foreground tracking-tight">
                AXIOM
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-accent/70" />
              <span className="font-display text-sm font-semibold text-primary-foreground/60 tracking-tight">
                ALTIS Mobility
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
                Connexion
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20 border-0">
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Talents africains qualifiés en France"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-primary/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-primary/30" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col items-start px-6 pt-32 pb-20 md:px-12 md:pt-40 md:pb-32">
          <motion.span
            initial="hidden" animate="visible" custom={0} variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-5 py-2 text-sm font-medium text-accent"
          >
            <Zap className="h-3.5 w-3.5" /> Talents Afrique → France · Métiers ROME
          </motion.span>

          <motion.h1
            initial="hidden" animate="visible" custom={1} variants={fadeUp}
            className="max-w-3xl font-display text-4xl font-bold leading-[1.1] text-primary-foreground md:text-6xl lg:text-7xl"
          >
            Des talents africains
            <br />
            <span className="text-gradient-accent">certifiés métiers ROME</span>
            <br />
            <span className="text-accent">prêts à travailler en France</span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" custom={2} variants={fadeUp}
            className="mt-8 max-w-xl text-lg text-primary-foreground/70 leading-relaxed md:text-xl"
          >
            <strong className="text-primary-foreground/90">AXIOM</strong> sélectionne les meilleurs profils du continent africain, qualifiés selon le référentiel <strong className="text-primary-foreground/90">ROME</strong> (Répertoire Opérationnel des Métiers).{" "}
            <strong className="text-primary-foreground/90">ALTIS</strong> organise leur mobilité et installation en France, clé en main.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" custom={3} variants={fadeUp}
            className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2"
          >
            {["Profils certifiés ROME", "Visa & logement inclus", "Opérationnels dès J1", "Conformité garantie"].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-sm text-primary-foreground/60">
                <CheckCircle2 className="h-4 w-4 text-accent" /> {item}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial="hidden" animate="visible" custom={4} variants={fadeUp}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link to="/signup">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-10 py-7 h-auto shadow-xl shadow-accent/30 border-0 rounded-xl text-lg font-semibold">
                Publier une offre <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/signup-talent">
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-white/10 text-base px-10 py-7 h-auto rounded-xl backdrop-blur-sm">
                Je suis un talent <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats band */}
      <section className="relative -mt-16 z-10 px-6 md:px-12">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border shadow-2xl md:grid-cols-4"
          >
            {[
              { value: "500+", label: "Talents qualifiés" },
              { value: "98%", label: "Taux de rétention" },
              { value: "15", label: "Pays d'origine" },
              { value: "30j", label: "Délai moyen" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label} custom={i} variants={scaleIn}
                className="bg-card px-6 py-8 text-center"
              >
                <p className="font-display text-3xl font-bold text-accent md:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Double Expertise */}
      <section className="mx-auto max-w-6xl px-6 py-28 md:px-12">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
          <motion.span custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-accent">
            Double Expertise
          </motion.span>
          <motion.h2 custom={1} variants={fadeUp} className="mt-3 font-display text-3xl font-bold md:text-5xl">
            Deux piliers, <span className="text-gradient-accent">une seule mission</span>
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg">
            La fusion du sourcing intelligent et de la mobilité sécurisée pour un recrutement international sans friction.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
          className="mt-16 grid gap-8 md:grid-cols-2"
        >
          {/* AXIOM Talent */}
          <motion.div custom={0} variants={scaleIn} className="group relative rounded-2xl border bg-card p-10 transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden">
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
                Nous ne nous contentons pas de trouver des CV. Nous sélectionnons des profils vérifiés, testés et alignés avec la culture de votre entreprise.
              </p>
              <ul className="space-y-3">
                {[
                  "Vivier de talents certifiés",
                  "Entretiens techniques pré-qualifiés",
                  "Matching assisté par IA",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* ALTIS Mobility */}
          <motion.div custom={1} variants={scaleIn} className="group relative rounded-2xl border bg-card p-10 transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden">
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
                Le recrutement international ne doit plus être un casse-tête administratif. Nous gérons l'humain et le matériel.
              </p>
              <ul className="space-y-3">
                {[
                  "Gestion complète des visas et titres de séjour",
                  "Organisation du transport et aide au logement",
                  "Accompagnement à l'intégration (Onboarding)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-6xl px-6 py-28 md:px-12">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
          <motion.span custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-accent">
            Processus
          </motion.span>
          <motion.h2 custom={1} variants={fadeUp} className="mt-3 font-display text-3xl font-bold md:text-5xl">
            Trois étapes,<br />
            <span className="text-gradient-accent">un seul interlocuteur</span>
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} className="mx-auto mt-6 max-w-xl text-muted-foreground text-lg">
            Concentrez-vous sur votre cœur de métier. Nous orchestrons tout le reste.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
          className="mt-20 grid gap-8 md:grid-cols-3"
        >
          <StepCard custom={0} step={1} icon={Send} title="Publiez votre offre" desc="Décrivez le poste et les compétences recherchées. Notre équipe commence le sourcing sous 24h." />
          <StepCard custom={1} step={2} icon={UserCheck} title="Sélectionnez" desc="Parcourez les profils pré-qualifiés, menez vos entretiens. Nous gérons la conformité." />
          <StepCard custom={2} step={3} icon={Plane} title="Installation clé en main" desc="Visa, billet, logement meublé, formations certifiantes — votre talent est opérationnel dès J1." />
        </motion.div>
      </section>

      {/* Pourquoi nous ? */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-premium)" }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative mx-auto max-w-6xl px-6 py-28 md:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
            <motion.span custom={0} variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-accent">
              Pourquoi nous ?
            </motion.span>
            <motion.h2 custom={1} variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-primary-foreground md:text-5xl">
              La solution complète pour<br />
              <span className="text-gradient-accent">recruter l'excellence</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            className="mt-16 grid gap-6 md:grid-cols-3"
          >
            <AdvantageCard custom={0} icon={Shield} title="Sécurité Totale" desc="Conformité juridique stricte avec les lois du travail françaises et africaines. Zéro risque, 100% confiance." />
            <AdvantageCard custom={1} icon={Zap} title="Gain de Temps" desc="Réduisez vos délais de recrutement international de 40%. Un seul interlocuteur pour tout." />
            <AdvantageCard custom={2} icon={GraduationCap} title="Impact Social" desc="Participez à la circulation des compétences et au développement des talents africains." />
          </motion.div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="border-y bg-card/50">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-12">
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
            className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground"
          >
            Ils recrutent avec Axiom
          </motion.p>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-16 gap-y-6"
          >
            {["Vinci", "Bouygues", "Eiffage", "Colas", "Spie"].map((name, i) => (
              <motion.span
                key={name} custom={i + 1} variants={fadeUp}
                className="font-display text-xl font-bold text-muted-foreground/40 md:text-2xl"
              >
                {name}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center md:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-primary-foreground md:text-5xl leading-tight">
              Prêt à recruter<br />
              <span className="text-gradient-accent">vos prochains talents ?</span>
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-6 text-lg text-primary-foreground/60">
              Créez votre compte et publiez votre première offre en 2 minutes.
              <br />Sans engagement. Sans frais cachés.
            </motion.p>
            <motion.div custom={2} variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-12 py-7 h-auto shadow-xl shadow-accent/30 border-0 rounded-xl font-semibold">
                  Commencer maintenant <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="mailto:contact@axiom.com">
                <Button size="lg" variant="ghost" className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 text-base px-8 py-7 h-auto rounded-xl">
                  <Mail className="mr-2 h-4 w-4" /> Nous contacter
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-primary px-6 py-14">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <span className="font-display text-sm font-bold text-primary-foreground">
              AXIOM
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-primary-foreground/40">
            <span className="hover:text-primary-foreground/60 cursor-pointer transition-colors">Mentions légales</span>
            <span className="hover:text-primary-foreground/60 cursor-pointer transition-colors">Confidentialité</span>
            <a href="mailto:contact@axiom.com" className="flex items-center gap-1.5 hover:text-primary-foreground/60 transition-colors">
              <Mail className="h-3.5 w-3.5" /> contact@axiom.com
            </a>
          </div>
          <p className="text-xs text-primary-foreground/30">© 2026 Axiom</p>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ step, icon: Icon, title, desc, custom }: { step: number; icon: any; title: string; desc: string; custom: number }) {
  return (
    <motion.div custom={custom} variants={scaleIn} className="group relative rounded-2xl border bg-card p-8 transition-all hover:shadow-xl hover:-translate-y-1">
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
    <motion.div custom={custom} variants={scaleIn} className="glass-card rounded-2xl p-8 transition-all hover:bg-white/10">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <h3 className="mb-3 font-display text-xl font-semibold text-primary-foreground">{title}</h3>
      <p className="text-sm text-primary-foreground/60 leading-relaxed">{desc}</p>
    </motion.div>
  );
}
