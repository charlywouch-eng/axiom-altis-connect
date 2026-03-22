import { useState, useEffect, useMemo } from "react";
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
import { CreditCard, CheckCircle, XCircle, ExternalLink, FileText, RefreshCw, Receipt, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subMonths, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface StripeInvoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  pdf_url: string | null;
  hosted_url: string | null;
}

interface StripePayment {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  receipt_url: string | null;
}

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

  const {
    data: billingData,
    isLoading: billingLoading,
    refetch: refetchBilling,
  } = useQuery({
    queryKey: ["stripe-invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-invoices");
      if (error) throw error;
      return data as { invoices: StripeInvoice[]; payments: StripePayment[] };
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const invoices = billingData?.invoices ?? [];
  const payments = billingData?.payments ?? [];
  const allTransactions = [
    ...invoices.map((inv) => ({ ...inv, type: "invoice" as const })),
    ...payments.map((p) => ({ ...p, type: "payment" as const, pdf_url: null, hosted_url: null, receipt_url: p.receipt_url })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Compute monthly spending for chart (last 6 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, "yyyy-MM");
      months.push({ key, label: format(d, "MMM yyyy", { locale: fr }), total: 0 });
    }
    for (const tx of allTransactions) {
      if (tx.status !== "paid") continue;
      const txKey = format(new Date(tx.date), "yyyy-MM");
      const month = months.find((m) => m.key === txKey);
      if (month) month.total += tx.amount;
    }
    return months;
  }, [allTransactions]);

  const totalPaid = allTransactions.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const currentMonthTotal = monthlyData[monthlyData.length - 1]?.total ?? 0;
  const prevMonthTotal = monthlyData[monthlyData.length - 2]?.total ?? 0;
  const trend = prevMonthTotal === 0 ? 0 : ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;

  useEffect(() => {
    const handlePaymentResult = async () => {
      const offerId = searchParams.get("offer");
      if (searchParams.get("success") === "true") {
        toast({ title: "Paiement réussi ✓", description: "Le success fee a été enregistré." });
        refetchBilling();

        if (offerId && user) {
          try {
            await supabase
              .from("job_offers")
              .update({ status: "filled" })
              .eq("id", offerId)
              .eq("company_id", user.id);

            toast({
              title: "Offre mise à jour",
              description: "Le statut de l'offre est passé à « Pourvue » et le talent est en cours de relocation.",
            });
          } catch (err: any) {
            console.error("Post-payment update error:", err);
          }
        }
      }
      if (searchParams.get("canceled") === "true") {
        toast({ title: "Paiement annulé", description: "Le paiement a été annulé.", variant: "destructive" });
      }
    };
    handlePaymentResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-accent text-accent-foreground">
            <CheckCircle className="mr-1 h-3 w-3" /> Payée
          </Badge>
        );
      case "pending":
      case "open":
        return (
          <Badge variant="outline">
            <XCircle className="mr-1 h-3 w-3" /> En attente
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout sidebarVariant="entreprise">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Facturation</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchBilling()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={handleManageSubscription}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Gérer l'abonnement
            </Button>
          </div>
        </div>

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

        {/* Real invoice & payment history */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Historique des factures et paiements
            </CardTitle>
            <CardDescription>
              Transactions Stripe en temps réel liées à votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {billingLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : allTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune transaction trouvée. Vos factures apparaîtront ici après votre premier paiement.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Réf.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((tx, idx) => (
                    <TableRow key={`${tx.type}-${tx.id}-${idx}`}>
                      <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                      <TableCell>
                        {format(new Date(tx.date), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className="text-right font-medium">
                        {tx.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                      </TableCell>
                      <TableCell>{statusBadge(tx.status)}</TableCell>
                      <TableCell className="text-right">
                        {tx.type === "invoice" && tx.pdf_url ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={tx.pdf_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="mr-1 h-3.5 w-3.5" /> PDF
                            </a>
                          </Button>
                        ) : tx.type === "payment" && (tx as any).receipt_url ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={(tx as any).receipt_url} target="_blank" rel="noopener noreferrer">
                              <Receipt className="mr-1 h-3.5 w-3.5" /> Reçu
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
