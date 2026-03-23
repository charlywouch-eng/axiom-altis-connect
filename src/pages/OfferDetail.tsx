import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, MapPin, Banknote, Star, Send, MessageSquare, Shield, CheckCircle2, Package } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { MOCK_OFFERS } from "@/data/dashboardMockData";
import { Link } from "react-router-dom";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  open: { label: "Ouverte", variant: "default" },
  closed: { label: "Fermée", variant: "secondary" },
  filled: { label: "Pourvue", variant: "destructive" },
};



function scoreColor(score: number) {
  if (score >= 90) return "text-accent";
  if (score >= 80) return "text-foreground";
  return "text-muted-foreground";
}

export default function OfferDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: offer, isLoading } = useQuery({
    queryKey: ["job_offer", id],
    queryFn: async () => {
      if (!id || !UUID_REGEX.test(id)) return null;
      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .eq("id", id!)
        .eq("company_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user && UUID_REGEX.test(id),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["talent_matches", id, offer?.required_skills],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("match_talents_for_offer", {
        _required_skills: offer?.required_skills ?? [],
        _min_score: 50,
        _limit_count: 10,
      });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        score: Math.round(t.compatibility_score),
        contacted: false,
      }));
    },
    enabled: !!id && !!offer,
  });

  // Fallback to mock data for non-UUID IDs
  const mockOffer = !UUID_REGEX.test(id || "") ? MOCK_OFFERS.find(o => o.id === id) : null;

  const handleContact = (_matchId: string) => {
    toast({ title: "Talent contacté", description: "Une proposition a été envoyée au talent." });
  };

  if (isLoading) {
    return (
      <DashboardLayout sidebarVariant="entreprise">
        <p className="text-muted-foreground">Chargement…</p>
      </DashboardLayout>
    );
  }

  if (!offer && !mockOffer) {
    return (
      <DashboardLayout sidebarVariant="entreprise">
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard-entreprise")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour aux offres
          </Button>
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background p-8 text-center space-y-4">
            <h2 className="text-xl font-bold">Cette offre n'est plus disponible</h2>
            <p className="text-muted-foreground">Consultez nos métiers en tension pour découvrir les opportunités actuelles.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button asChild><Link to="/metiers-en-tension">Voir les métiers en tension</Link></Button>
              <Button variant="outline" asChild><Link to="/dashboard-entreprise">Retour au dashboard</Link></Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Use real offer or mock offer
  const displayOffer = offer || {
    id: mockOffer!.id,
    title: mockOffer!.title,
    location: mockOffer!.location,
    salary_range: mockOffer!.salary,
    description: mockOffer!.description,
    required_skills: mockOffer!.skills,
    status: mockOffer!.status,
    created_at: mockOffer!.createdAt,
    company_id: user?.id || "",
  };

  const s = statusLabels[displayOffer.status] ?? statusLabels.open;
  const codeRome = mockOffer?.codeRome;

  return (
    <DashboardLayout sidebarVariant="entreprise">
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard-entreprise")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour aux offres
        </Button>

        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background p-6 md:p-8">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-start justify-between gap-4 relative">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h2 className="font-display text-xl md:text-2xl font-bold">{displayOffer.title}</h2>
                {codeRome && (
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-400/40 gap-1">
                    <Shield className="h-3 w-3" /> AXIOM READY
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {displayOffer.location}</span>
                {displayOffer.salary_range && (
                  <span className="flex items-center gap-1"><Banknote className="h-3.5 w-3.5" /> {displayOffer.salary_range} €/an</span>
                )}
                {displayOffer.created_at && <span>Publiée le {format(new Date(displayOffer.created_at), "dd MMMM yyyy", { locale: fr })}</span>}
                {codeRome && <Badge variant="outline" className="text-[10px]">ROME {codeRome}</Badge>}
              </div>
            </div>
            <Badge variant={s.variant}>{s.label}</Badge>
          </div>
        </div>

        {/* Description */}
        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">{displayOffer.description}</p>
            {displayOffer.required_skills && displayOffer.required_skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {displayOffer.required_skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accompagnement ALTIS */}
        {mockOffer && (
          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" /> Accompagnement ALTIS Zéro Stress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["Procédure visa ANEF prise en charge", "Accueil aéroport + transfert", "Logement meublé garanti 1 mois", "Accompagnement administratif complet", "Intégration professionnelle sur site"].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Talents recommandés (matching) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" /> Talents recommandés
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Talents classés par score de compatibilité (compétences 60%, français 20%, expérience 20%)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {matches && matches.length > 0 ? (
              matches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/30"
                >
                  {/* Score */}
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-2xl font-bold ${scoreColor(m.score)}`}>
                      {m.score}
                    </span>
                    <Progress value={m.score} className="h-1.5 w-12" />
                  </div>

                   {/* Info */}
                   <div className="flex-1 min-w-0">
                     <p className="font-semibold">{m.full_name || "Talent anonyme"}</p>
                     <p className="text-sm text-muted-foreground">
                       {m.country} · {m.french_level} · {m.experience_years} ans d'expérience
                     </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.skills.map((sk) => {
                        const isMatch = displayOffer.required_skills?.includes(sk);
                        return (
                          <Badge
                            key={sk}
                            variant={isMatch ? "default" : "outline"}
                            className={isMatch ? "bg-accent text-accent-foreground" : ""}
                          >
                            {sk}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    {m.contacted ? (
                      <Badge variant="outline" className="border-accent text-accent">
                        <MessageSquare className="mr-1 h-3 w-3" /> Contacté
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => handleContact(m.id)}
                      >
                        <Send className="mr-1 h-3.5 w-3.5" /> Proposer
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucun talent correspondant pour le moment.</p>
            )}
          </CardContent>
        </Card>

        {/* CTA bottom */}
        {codeRome && (
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to={`/metier/${codeRome}`}>Voir la fiche métier {codeRome}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/metiers-en-tension">Voir tous les talents</Link>
            </Button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
