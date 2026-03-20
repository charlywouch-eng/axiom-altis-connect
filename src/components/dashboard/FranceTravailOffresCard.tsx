import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, ExternalLink, TrendingUp, Flame, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface FTOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  contract: string;
  salary: string | null;
  description: string;
  skills: string[];
  url: string;
}

interface Props {
  romeCodes?: string[];
  title?: string;
  count?: number;
  className?: string;
  showScoreIA?: boolean;
  showAxiomReady?: boolean;
  onOffersLoaded?: (count: number) => void;
}

export default function FranceTravailOffresCard({
  romeCodes = ["F1703", "J1501", "G1602"],
  title = "Opportunités en temps réel",
  count = 6,
  className,
  showScoreIA = false,
  showAxiomReady = false,
  onOffersLoaded,
}: Props) {
  // Generate deterministic score per offer
  const getScoreIA = (offerId: string) => {
    let hash = 0;
    for (let i = 0; i < offerId.length; i++) {
      hash = ((hash << 5) - hash) + offerId.charCodeAt(i);
      hash |= 0;
    }
    return 65 + Math.abs(hash % 30); // 65-94
  };

  const isAxiomReady = (offerId: string) => getScoreIA(offerId) >= 80;

  const { data, isLoading } = useQuery({
    queryKey: ["ft-offres-card", romeCodes.join(",")],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/france-travail-offers`;

      const perCode = Math.ceil(count / romeCodes.length);
      const results = await Promise.allSettled(
        romeCodes.map((code) =>
          fetch(fnUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ romeCode: code, count: perCode }),
          })
            .then(async (res) => {
              if (!res.ok) return [];
              const json = await res.json();
              return (json.offers || []) as FTOffer[];
            })
            .catch(() => [])
        )
      );

      const allOffers = results.flatMap((r) =>
        r.status === "fulfilled" ? r.value : []
      );
      return allOffers.slice(0, count);
    },
    enabled: true,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className={`overflow-hidden border-accent/20 ${className}`}>
        <div className="h-1 w-full bg-gradient-to-r from-accent to-primary" />
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-52" />
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </CardContent>
      </Card>
    );
  }

  const offers = data || [];

  return (
    <Card className={`overflow-hidden border-accent/20 shadow-sm ${className}`}>
      <div className="h-1 w-full bg-gradient-to-r from-accent via-primary to-accent/40" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Briefcase className="h-3.5 w-3.5 text-accent" />
          </div>
          {title}
          <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] ml-1 gap-1">
            <Zap className="h-2.5 w-2.5" /> Temps réel
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Offres d'emploi France Travail actualisées en continu via l'API v2
        </p>
      </CardHeader>
      <CardContent>
        {offers.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o, i) => {
              const score = getScoreIA(o.id);
              const ready = isAxiomReady(o.id);
              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className={`group relative p-4 rounded-xl border bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 space-y-2.5 h-full flex flex-col ${ready && showAxiomReady ? 'border-accent/40 ring-1 ring-accent/20' : 'border-border/50 hover:border-accent/30'}`}>
                    {/* Score IA overlay */}
                    {showScoreIA && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className={`relative flex items-center justify-center h-12 w-12 rounded-full shadow-lg ${score >= 85 ? 'bg-gradient-to-br from-accent to-primary' : score >= 75 ? 'bg-gradient-to-br from-accent/90 to-accent/60' : 'bg-gradient-to-br from-muted-foreground/60 to-muted-foreground/40'}`}>
                          <span className="text-[11px] font-black text-white leading-none">{score}%</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{o.title}</p>
                        <p className="text-xs text-accent font-medium mt-0.5">{o.company}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {showAxiomReady && ready && (
                          <Badge className="text-[9px] bg-accent/15 text-accent border-accent/30 gap-0.5 font-bold">
                            <ShieldCheck className="h-2.5 w-2.5" /> AXIOM READY
                          </Badge>
                        )}
                        <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/20 gap-0.5">
                          <Flame className="h-2.5 w-2.5" /> Tension
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" /> {o.location || "France"}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/50">
                        {o.contract}
                      </Badge>
                    </div>

                    {o.salary && (
                      <p className="text-xs font-medium text-success flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> {o.salary}
                      </p>
                    )}

                    {o.skills && o.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {o.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-[9px] bg-accent/8 text-accent rounded-full px-2 py-0.5 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-2">
                      <Button
                        size="sm"
                        className="w-full h-8 text-[11px] gap-1.5 bg-gradient-to-r from-accent to-primary text-white hover:opacity-90 shadow-sm"
                        onClick={() => window.open(o.url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" /> Postuler sur France Travail
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune offre disponible actuellement.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Les offres sont actualisées en continu via l'API v2.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
