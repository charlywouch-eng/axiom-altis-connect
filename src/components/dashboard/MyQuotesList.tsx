import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { generateQuotePdf, type QuoteData, type QuoteItem } from "@/lib/generateQuotePdf";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  sent: { label: "Envoyé", variant: "default" },
  accepted: { label: "Accepté", variant: "default" },
  rejected: { label: "Refusé", variant: "destructive" },
};

export function MyQuotesList() {
  const { user } = useAuth();

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["my_generated_quotes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_quotes" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const handleDownload = (quote: any) => {
    const items = (quote.items || []) as QuoteItem[];
    const quoteData: QuoteData = {
      quoteNumber: quote.quote_number,
      date: format(new Date(quote.created_at), "dd MMMM yyyy", { locale: fr }),
      validityDate: format(new Date(quote.validity_date), "dd MMMM yyyy", { locale: fr }),
      companyName: quote.company_name,
      contactEmail: quote.contact_email,
      sector: quote.sector || "",
      volume: (quote.volume || "1") + " talent(s)",
      items,
      totalHT: Number(quote.total_ht),
      totalTTC: Number(quote.total_ttc),
      notes: quote.notes || undefined,
    };
    const doc = generateQuotePdf(quoteData);
    doc.save(`Devis_${quote.quote_number}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6 border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Mes devis générés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Devis</TableHead>
                <TableHead className="hidden sm:table-cell">Client</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Total TTC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((q: any) => {
                const status = STATUS_MAP[q.status] || STATUS_MAP.draft;
                return (
                  <TableRow key={q.id}>
                    <TableCell className="font-mono text-xs font-semibold">{q.quote_number}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{q.company_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {format(new Date(q.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(q.total_ttc))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(q)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
