import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight, Send, UserCheck, Plane, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Index() {
  const { session, role, loading } = useAuth();

  if (loading) return null;
  if (session && role === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;
  if (session && role === "talent") return <Navigate to="/dashboard-talent" replace />;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <Globe className="h-7 w-7 text-accent" />
          <span className="font-display text-xl font-bold text-foreground">
            Axiom<span className="text-accent">&</span>Altis
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost">Connexion</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              S'inscrire
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center px-6 py-24 text-center md:py-36"
        style={{ background: "var(--gradient-hero)" }}
      >
        <h1 className="max-w-4xl animate-fade-in font-display text-3xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
          Recrutez et installez des talents internationaux en France{" "}
          <span className="text-accent">sans effort</span> — tout inclus
        </h1>
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-lg text-primary-foreground/70 animate-fade-in [animation-delay:200ms]">
          <span>visa</span><span className="text-accent">•</span>
          <span>billet</span><span className="text-accent">•</span>
          <span>logement</span><span className="text-accent">•</span>
          <span>formation subventionnée</span><span className="text-accent">•</span>
          <span>zéro paperasse</span>
        </p>
        <div className="mt-10 animate-fade-in [animation-delay:400ms]">
          <Link to="/login">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 py-6 h-auto">
              Publier une offre <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
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

      {/* Footer */}
      <footer className="border-t bg-muted/30 px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            <span className="font-display text-sm font-bold">Axiom<span className="text-accent">&</span>Altis</span>
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

function StepCard({ step, icon: Icon, title, desc }: { step: number; icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <Icon className="h-7 w-7 text-accent" />
        </div>
        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
          {step}
        </span>
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
