import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, ExternalLink, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface FTEvent {
  id: string;
  title: string;
  description: string;
  date: string | null;
  endDate: string | null;
  city: string;
  address: string;
  organizer: string;
  type: string;
  url: string | null;
}

interface Props {
  codeDepartement?: string;
  className?: string;
}

export default function FranceTravailEventsCard({ codeDepartement, className }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["ft-events", codeDepartement],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/france-travail-events`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ codeDepartement, count: 4 }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.events as FTEvent[];
    },
    enabled: true,
    retry: false,
    staleTime: 15 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className={`overflow-hidden border-accent/20 ${className}`}>
        <div className="h-1 w-full bg-gradient-to-r from-primary to-accent/40" />
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </CardContent>
      </Card>
    );
  }

  const events = data || [];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), "d MMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("forum") || t.includes("salon")) return "bg-accent/10 text-accent border-accent/30";
    if (t.includes("atelier")) return "bg-primary/10 text-primary border-primary/30";
    if (t.includes("recrutement")) return "bg-destructive/10 text-destructive border-destructive/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <Card className={`overflow-hidden border-accent/20 shadow-sm ${className}`}>
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />
          </div>
          Événements emploi à venir
          <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] ml-1 gap-1">
            <Users className="h-2.5 w-2.5" /> France Travail
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Forums, salons et ateliers pour votre insertion professionnelle
        </p>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((evt, i) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="group p-4 rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/20 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 transition-all duration-300 space-y-2.5 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                        {evt.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{evt.organizer}</p>
                    </div>
                    <Badge className={`text-[9px] shrink-0 ${getTypeBadgeColor(evt.type)}`}>
                      {evt.type}
                    </Badge>
                  </div>

                  {evt.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{evt.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                    {evt.date && (
                      <span className="flex items-center gap-0.5 font-medium text-foreground">
                        <Clock className="h-2.5 w-2.5 text-accent" /> {formatDate(evt.date)}
                      </span>
                    )}
                    {evt.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" /> {evt.city}
                      </span>
                    )}
                  </div>

                  {evt.address && (
                    <p className="text-[10px] text-muted-foreground/70">{evt.address}</p>
                  )}

                  <div className="mt-auto pt-2 flex gap-2">
                    {evt.url && (
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-[10px] gap-1 bg-gradient-to-r from-accent to-primary text-white hover:opacity-90"
                        onClick={() => window.open(evt.url!, "_blank")}
                      >
                        <ExternalLink className="h-2.5 w-2.5" /> S'inscrire
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(evt.address || evt.city)}`, "_blank")}
                    >
                      <MapPin className="h-2.5 w-2.5" /> Itinéraire
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun événement à venir pour le moment.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Les événements sont actualisés régulièrement.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
