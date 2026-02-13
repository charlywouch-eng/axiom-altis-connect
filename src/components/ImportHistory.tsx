import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { History, Trash2, CalendarIcon, X } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ImportRecord {
  id: string;
  file_name: string;
  profiles_count: number;
  errors_count: number;
  status: string;
  created_at: string;
}

export function ImportHistory({ refreshKey }: { refreshKey?: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

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

  const filteredImports = imports.filter((imp) => {
    const impDate = new Date(imp.created_at);
    if (dateFrom && isBefore(impDate, startOfDay(dateFrom))) return false;
    if (dateTo && isAfter(impDate, endOfDay(dateTo))) return false;
    return true;
  });

  const deleteMutation = useMutation({
    mutationFn: async (importId: string) => {
      const { error } = await supabase
        .from("csv_import_history")
        .delete()
        .eq("id", importId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["csv_import_history"] });
      toast({ title: "Import supprimé", description: "L'import et les profils associés ont été supprimés." });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message || "Impossible de supprimer l'import.", variant: "destructive" });
    },
  });

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasFilters = dateFrom || dateTo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5 text-accent" />
          Historique des imports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: fr }) : "Date début"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
                locale={fr}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <span className="text-sm text-muted-foreground">→</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd MMM yyyy", { locale: fr }) : "Date fin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                locale={fr}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="mr-1 h-4 w-4" /> Réinitialiser
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : filteredImports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {hasFilters ? "Aucun import trouvé pour cette période." : "Aucun import enregistré."}
          </p>
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
                  <th className="px-3 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredImports.map((imp) => (
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
                    <td className="px-3 py-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cet import ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera l'enregistrement d'import <strong>{imp.file_name}</strong> ainsi que
                              les <strong>{imp.profiles_count} profil(s)</strong> talent associés. Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(imp.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
