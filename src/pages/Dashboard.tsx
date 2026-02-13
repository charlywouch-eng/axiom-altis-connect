import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Globe, TrendingUp } from "lucide-react";
import { PremiumStatCard } from "@/components/PremiumStatCard";

function TalentDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Mon Espace Talent</h2>
        <p className="text-sm text-muted-foreground mt-1">Suivez votre parcours de mobilité internationale</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PremiumStatCard icon={Globe} title="Statut Relocation" value="En cours" accent="gold" />
        <PremiumStatCard icon={Briefcase} title="Candidatures" value="3" accent="green" />
        <PremiumStatCard icon={TrendingUp} title="Vues profil" value="12" />
      </div>
      <Card className="border-border/50">
        <CardHeader><CardTitle className="font-display">Bienvenue !</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Votre espace personnel vous permet de suivre votre parcours de mobilité internationale. Complétez votre profil pour maximiser vos chances.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function EntrepriseDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Espace Entreprise</h2>
        <p className="text-sm text-muted-foreground mt-1">Gérez vos offres et suivez vos recrutements</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PremiumStatCard icon={Users} title="Talents disponibles" value="48" accent="gold" />
        <PremiumStatCard icon={Briefcase} title="Postes ouverts" value="5" accent="green" />
        <PremiumStatCard icon={TrendingUp} title="Entretiens planifiés" value="2" />
      </div>
      <Card className="border-border/50">
        <CardHeader><CardTitle className="font-display">Recrutez les meilleurs talents internationaux</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Parcourez notre base de talents qualifiés et lancez vos processus de recrutement en quelques clics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Back-office Admin</h2>
        <p className="text-sm text-muted-foreground mt-1">Vue d'ensemble de la plateforme</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PremiumStatCard icon={Users} title="Utilisateurs" value="124" accent="gold" />
        <PremiumStatCard icon={Briefcase} title="Entreprises" value="18" accent="green" />
        <PremiumStatCard icon={Globe} title="Relocations actives" value="32" />
        <PremiumStatCard icon={TrendingUp} title="Ce mois" value="+15%" accent="gold" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { role } = useAuth();

  return (
    <DashboardLayout>
      {role === "admin" ? (
        <AdminDashboard />
      ) : role === "entreprise" ? (
        <EntrepriseDashboard />
      ) : (
        <TalentDashboard />
      )}
    </DashboardLayout>
  );
}
