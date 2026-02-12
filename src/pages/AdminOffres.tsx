import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Briefcase } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  open: { label: "Ouverte", variant: "default" },
  closed: { label: "Fermée", variant: "secondary" },
  filled: { label: "Pourvue", variant: "destructive" },
};

export default function AdminOffres() {
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["admin_offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout sidebarVariant="admin">
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Toutes les offres</h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-accent" /> {offers.length} offre{offers.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : offers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune offre publiée.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Salaire</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((o) => {
                    const s = statusLabels[o.status] ?? statusLabels.open;
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.title}</TableCell>
                        <TableCell>{o.location}</TableCell>
                        <TableCell>{o.salary_range || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(o.created_at), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
