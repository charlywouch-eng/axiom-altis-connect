import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Banknote, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  open: { label: "Ouverte", variant: "default" },
  closed: { label: "Fermée", variant: "secondary" },
  filled: { label: "Pourvue", variant: "destructive" },
};

const MOCK_CANDIDATES = [
  { name: "Amina Diallo", country: "Sénégal", skill: "React / Node.js", status: "En cours d'évaluation" },
  { name: "Carlos Mendes", country: "Brésil", skill: "Java / Spring", status: "Entretien planifié" },
  { name: "Fatou Keita", country: "Côte d'Ivoire", skill: "Python / Django", status: "Nouveau" },
];

export default function OfferDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: offer, isLoading } = useQuery({
    queryKey: ["job_offer", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .eq("id", id!)
        .eq("company_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  if (isLoading) {
    return (
      <DashboardLayout sidebarVariant="entreprise">
        <p className="text-muted-foreground">Chargement…</p>
      </DashboardLayout>
    );
  }

  if (!offer) {
    return (
      <DashboardLayout sidebarVariant="entreprise">
        <p className="text-muted-foreground">Offre introuvable.</p>
      </DashboardLayout>
    );
  }

  const s = statusLabels[offer.status] ?? statusLabels.open;

  return (
    <DashboardLayout sidebarVariant="entreprise">
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard-entreprise")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour aux offres
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">{offer.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {offer.location}</span>
              {offer.salary_range && (
                <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" /> {offer.salary_range} €/an</span>
              )}
              <span>Publiée le {format(new Date(offer.created_at), "dd MMMM yyyy", { locale: fr })}</span>
            </div>
          </div>
          <Badge variant={s.variant}>{s.label}</Badge>
        </div>

        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">{offer.description}</p>
            {offer.required_skills && offer.required_skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {offer.required_skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidats proposés (mock) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" /> Candidats proposés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {MOCK_CANDIDATES.map((c) => (
                <div key={c.name} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.country} · {c.skill}</p>
                  </div>
                  <Badge variant="outline">{c.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
