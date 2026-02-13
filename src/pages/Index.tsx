import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight, Send, UserCheck, Plane, Mail, Shield, Building2, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import heroImage from "@/assets/hero-talents.jpg";

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
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-12">
          <div className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-accent" />
            <span className="font-display text-xl font-bold text-foreground">
              Axiom<span className="text-ocre">&</span>Altis
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-ocre text-ocre-foreground hover:bg-ocre/90">
                S'inscrire
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Talents africains qualifiés en France"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/50" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col items-start px-6 py-28 md:px-12 md:py-40">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent animate-fade-in">
            <Shield className="h-3.5 w-3.5" /> Recrutement tout inclus
          </span>
          <h1 className="max-w-3xl animate-fade-in font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
            Talents d'Afrique{" "}
            <span className="text-ocre">→</span>{" "}
            France
            <br />
            <span className="text-accent">tout inclus</span>
          </h1>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg text-primary-foreground/80 animate-fade-in [animation-delay:200ms]">
            <span>visa</span><span className="text-ocre">•</span>
            <span>billet</span><span className="text-ocre">•</span>
            <span>logement</span><span className="text-ocre">•</span>
            <span>formation subventionnée</span><span className="text-ocre">•</span>
            <span>zéro paperasse</span>
          </p>
          <div className="mt-10 flex flex-wrap gap-4 animate-fade-in [animation-delay:400ms]">
            <Link to="/signup">
              <Button size="lg" className="bg-ocre text-ocre-foreground hover:bg-ocre/90 text-base px-8 py-6 h-auto shadow-lg shadow-ocre/20">
                Publier une offre <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8 py-6 h-auto">
                Je suis un talent
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4 md:px-12">
          <StatItem value="500+" label="Talents qualifiés" />
          <StatItem value="98%" label="Taux de rétention" />
          <StatItem value="15" label="Pays d'origine" />
          <StatItem value="30j" label="Délai moyen d'installation" />
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-5xl px-6 py-24 md:px-12">
        <h2 className="mb-4 text-center font-display text-3xl font-bold">
          Comment ça marche ?
        </h2>
        <p className="mx-auto mb-16 max-w-xl text-center text-muted-foreground">
          Trois étapes simples. Nous nous occupons de tout le reste.
        </p>
        <div className="grid gap-10 md:grid-cols-3">
          <StepCard
            step={1}
            icon={Send}
            title="Postez votre offre"
            desc="Décrivez le poste, le salaire et les compétences recherchées. Ça prend 2 minutes."
          />
          <StepCard
            step={2}
            icon={UserCheck}
            title="Sélectionnez un talent"
            desc="Parcourez les profils pré-qualifiés et choisissez le candidat idéal pour votre équipe."
          />
          <StepCard
            step={3}
            icon={Plane}
            title="Le talent arrive"
            desc="Visa, billet, logement, formation — on gère tout. Votre talent est opérationnel dès J1."
          />
        </div>
      </section>

      {/* Avantages */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-24 md:px-12">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">
            Pourquoi Axiom<span className="text-ocre">&</span>Altis ?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <AdvantageCard
              icon={Shield}
              title="Conformité garantie"
              desc="Visa, contrat, déclarations — tout est 100% conforme au droit du travail français."
            />
            <AdvantageCard
              icon={Building2}
              title="Logement clé en main"
              desc="Hébergement meublé à l'arrivée, proche du lieu de travail, pour une intégration sereine."
            />
            <AdvantageCard
              icon={GraduationCap}
              title="Formation subventionnée"
              desc="FLE, habilitations métiers, certifications ROME — financé par les dispositifs publics."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:px-12">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Prêt à recruter vos prochains talents ?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/70">
            Créez votre compte gratuitement et publiez votre première offre en 2 minutes.
          </p>
          <div className="mt-8">
            <Link to="/signup">
              <Button size="lg" className="bg-ocre text-ocre-foreground hover:bg-ocre/90 text-base px-10 py-6 h-auto shadow-lg shadow-ocre/20">
                Commencer maintenant <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            <span className="font-display text-sm font-bold">Axiom<span className="text-ocre">&</span>Altis</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>Mentions légales</span>
            <span>Politique de confidentialité</span>
            <a href="mailto:contact@axiom-altis.com" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Mail className="h-3.5 w-3.5" /> contact@axiom-altis.com
            </a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Axiom & Altis Mobility</p>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-2xl font-bold text-ocre md:text-3xl">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function StepCard({ step, icon: Icon, title, desc }: { step: number; icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <Icon className="h-7 w-7 text-accent" />
        </div>
        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ocre text-xs font-bold text-ocre-foreground">
          {step}
        </span>
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function AdvantageCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-ocre/10">
        <Icon className="h-6 w-6 text-ocre" />
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
