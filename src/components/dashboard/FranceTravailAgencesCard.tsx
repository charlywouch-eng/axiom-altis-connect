import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Building2, Navigation, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface Agence {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string | null;
  email: string | null;
  services: string[];
}

interface Props {
  codePostal?: string;
  codeDepartement?: string;
  className?: string;
}

export default function FranceTravailAgencesCard({ codePostal, codeDepartement, className }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["ft-agences", codePostal, codeDepartement],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/france-travail-agences`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ codePostal, codeDepartement, count: 4 }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.agences as Agence[];
    },
    enabled: true,
    retry: false,
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className={`overflow-hidden border-primary/20 ${className}`}>
        <div className="h-1 w-full bg-gradient-to-r from-primary to-accent/40" />
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-52" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </CardContent>
      </Card>
    );
  }

  const agences = data || [];

  return (
    <Card className={`overflow-hidden border-primary/20 shadow-sm ${className}`}>
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </div>
          Agences France Travail
          <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] ml-1 gap-1">
            <MapPin className="h-2.5 w-2.5" /> Près de chez vous
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Trouvez votre agence pour l'inscription et l'accompagnement
        </p>
      </CardHeader>
      <CardContent>
        {agences.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {agences.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="group p-4 rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/20 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{a.name}</p>
                      <Badge className="mt-1 text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {a.type === "APE" ? "Agence principale" : a.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-primary/60" />
                      <span>{a.address}</span>
                    </p>
                    {a.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-primary/60" />
                        <a href={`tel:${a.phone}`} className="text-primary hover:underline font-medium">{a.phone}</a>
                      </p>
                    )}
                  </div>

                  {a.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {a.services.map((s) => (
                        <span key={s} className="text-[9px] bg-accent/8 text-accent rounded-full px-2 py-0.5 font-medium border border-accent/15">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/5 flex-1"
                      onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(a.address)}`, "_blank")}
                    >
                      <Navigation className="h-2.5 w-2.5" /> Itinéraire
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1 border-accent/30 text-accent hover:bg-accent/5 flex-1"
                      onClick={() => window.open("https://www.francetravail.fr/accueil/", "_blank")}
                    >
                      <ExternalLink className="h-2.5 w-2.5" /> francetravail.fr
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune agence trouvée à proximité.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
