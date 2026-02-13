import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ImportRecord {
  id: string;
  file_name: string;
  profiles_count: number;
  errors_count: number;
  status: string;
  created_at: string;
}

export function ImportHistory({ refreshKey }: { refreshKey?: number }) {
  const { data: imports = [], isLoading } = useQuery({
    queryKey: ["csv_import_history", refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("csv_import_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as ImportRecord[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5 text-accent" />
          Historique des imports
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : imports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun import enregistré.</p>
        ) : (
          <div className="rounded-lg border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Fichier</th>
                  <th className="px-3 py-2 text-left font-medium">Profils</th>
                  <th className="px-3 py-2 text-left font-medium">Erreurs</th>
                  <th className="px-3 py-2 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {imports.map((imp) => (
                  <tr key={imp.id}>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {format(new Date(imp.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                    </td>
                    <td className="px-3 py-2 font-medium truncate max-w-[200px]">{imp.file_name}</td>
                    <td className="px-3 py-2">{imp.profiles_count}</td>
                    <td className="px-3 py-2">{imp.errors_count}</td>
                    <td className="px-3 py-2">
                      <Badge variant={imp.status === "success" ? "default" : "destructive"} className="text-xs">
                        {imp.status === "success" ? "Succès" : "Erreur"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
