import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MOCK_INVOICES = [
  { id: "INV-001", date: "2026-01-15", description: "Success Fee – Dev Full-Stack", amount: 3500, status: "paid" },
  { id: "INV-002", date: "2026-02-01", description: "Success Fee – Designer UX", amount: 3500, status: "pending" },
];

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [paying, setPaying] = useState(false);

  const { data: offers = [] } = useQuery({
    queryKey: ["job_offers_billing", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_offers")
        .select("id, title, status")
        .eq("company_id", user!.id)
        .eq("status", "open");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "Paiement réussi ✓", description: "Le success fee a été enregistré." });
    }
    if (searchParams.get("canceled") === "true") {
      toast({ title: "Paiement annulé", description: "Le paiement a été annulé.", variant: "destructive" });
    }
  }, [searchParams, toast]);

  const handlePay = async (offerId?: string) => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { offerId: offerId || "" },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  return (
    <DashboardLayout sidebarVariant="entreprise">
      <div className="space-y-6">
        <h2 className="font-display text-2xl font-bold">Facturation</h2>

        {/* Pay success fee */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" /> Payer un success fee
            </CardTitle>
            <CardDescription>
              3 500 € HT par recrutement finalisé via la plateforme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {offers.length > 0 ? (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="font-medium">{offer.title}</span>
                    <Button
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                      disabled={paying}
                      onClick={() => handlePay(offer.id)}
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      {paying ? "Redirection…" : "Payer 3 500 €"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune offre ouverte à facturer.</p>
            )}
          </CardContent>
        </Card>

        {/* Invoice history */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des factures</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_INVOICES.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                    <TableCell>
                      {format(new Date(inv.date), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>{inv.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      {inv.amount.toLocaleString("fr-FR")} €
                    </TableCell>
                    <TableCell>
                      {inv.status === "paid" ? (
                        <Badge className="bg-accent text-accent-foreground">
                          <CheckCircle className="mr-1 h-3 w-3" /> Payée
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="mr-1 h-3 w-3" /> En attente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
