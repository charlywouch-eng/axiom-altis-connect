import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, MapPin, Banknote, Star, Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

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

        {/* Description */}
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
                        const isMatch = offer.required_skills?.includes(sk);
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


      </div>
    </DashboardLayout>
  );
}
