import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, ExternalLink, MapPin, Clock, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface Formation {
  id: string;
  title: string;
  organism: string;
  city: string;
  duration: string;
  cpf: boolean;
  url: string | null;
  romeCode: string;
}

interface Props {
  romeCode?: string | null;
  className?: string;
}

export default function FranceTravailFormationsCard({ romeCode, className }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["ft-formations", romeCode],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/france-travail-formations`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ romeCode: romeCode || "F1703", count: 4 }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.formations as Formation[];
    },
    enabled: true,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className={`overflow-hidden border-accent/20 ${className}`}>
        <div className="h-1 w-full bg-gradient-to-r from-accent to-primary/40" />
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </CardContent>
      </Card>
    );
  }

  const formations = data || [];

  return (
    <Card className={`overflow-hidden border-accent/20 shadow-sm ${className}`}>
      <div className="h-1 w-full bg-gradient-to-r from-accent via-primary to-accent/40" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <GraduationCap className="h-3.5 w-3.5 text-accent" />
          </div>
          Formations Recommandées
          <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px] ml-1 gap-1">
            <BookOpen className="h-2.5 w-2.5" /> France Travail
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Formations qualifiantes éligibles CPF pour votre métier
        </p>
      </CardHeader>
      <CardContent>
        {formations.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {formations.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="group flex gap-3 p-3.5 rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/20 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 transition-all duration-300">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/15 to-primary/15 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.organism}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {f.city && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" /> {f.city}
                        </span>
                      )}
                      {f.duration && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" /> {f.duration}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {f.cpf && (
                        <Badge className="text-[9px] px-1.5 py-0 bg-success/10 text-success border-success/30 font-bold">
                          CPF ✓
                        </Badge>
                      )}
                      {f.url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1.5 text-[10px] text-accent hover:text-accent gap-0.5"
                          onClick={() => window.open(f.url!, "_blank")}
                        >
                          Détails <ExternalLink className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <GraduationCap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune formation trouvée pour ce métier.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
