import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Globe, TrendingUp } from "lucide-react";

function TalentDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Mon Espace Talent</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Globe} title="Statut Relocation" value="En cours" />
        <StatCard icon={Briefcase} title="Candidatures" value="3" />
        <StatCard icon={TrendingUp} title="Vues profil" value="12" />
      </div>
      <Card>
        <CardHeader><CardTitle>Bienvenue !</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
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
      <h2 className="font-display text-2xl font-bold">Espace Entreprise</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} title="Talents disponibles" value="48" />
        <StatCard icon={Briefcase} title="Postes ouverts" value="5" />
        <StatCard icon={TrendingUp} title="Entretiens planifiés" value="2" />
      </div>
      <Card>
        <CardHeader><CardTitle>Recrutez les meilleurs talents internationaux</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
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
      <h2 className="font-display text-2xl font-bold">Back-office Admin</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} title="Utilisateurs" value="124" />
        <StatCard icon={Briefcase} title="Entreprises" value="18" />
        <StatCard icon={Globe} title="Relocations actives" value="32" />
        <StatCard icon={TrendingUp} title="Ce mois" value="+15%" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value }: { icon: any; title: string; value: string }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
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
