import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight, Users, Building2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <Globe className="h-7 w-7 text-accent" />
          <span className="font-display text-xl font-bold text-primary">
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
        className="flex flex-col items-center justify-center px-6 py-24 text-center md:py-32"
        style={{ background: "var(--gradient-hero)" }}
      >
        <h1 className="max-w-3xl animate-fade-in font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
          La mobilité internationale,{" "}
          <span className="text-accent" style={{ color: "hsl(155 60% 48%)" }}>simplifiée</span>
        </h1>
        <p className="mt-6 max-w-xl animate-fade-in text-lg text-primary-foreground/75 [animation-delay:200ms]">
          Connectez les meilleurs talents aux entreprises qui recrutent à l'international. Relocation, visa, intégration — tout en un seul endroit.
        </p>
        <div className="mt-8 flex animate-fade-in gap-4 [animation-delay:400ms]">
          <Link to="/signup">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Commencer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:px-12">
        <h2 className="mb-12 text-center font-display text-3xl font-bold">
          Une plateforme, trois profils
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={Users}
            title="Talents"
            desc="Créez votre profil, suivez votre relocation et accédez aux meilleures opportunités internationales."
          />
          <FeatureCard
            icon={Building2}
            title="Entreprises"
            desc="Recrutez des talents qualifiés et gérez vos processus de mobilité en toute simplicité."
          />
          <FeatureCard
            icon={Shield}
            title="Administration"
            desc="Pilotez la plateforme avec un back-office complet, des statistiques et un contrôle total."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        © 2026 Axiom & Altis Mobility. Tous droits réservés.
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center transition-shadow hover:shadow-lg">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
