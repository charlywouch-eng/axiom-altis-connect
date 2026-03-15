import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateQuotePdf, type QuoteItem, type QuoteData } from "@/lib/generateQuotePdf";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Download, Send, Loader2 } from "lucide-react";

interface QuoteGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
  contactEmail?: string;
  onQuoteGenerated?: () => void;
}

const SECTORS = [
  { value: "batiment", label: "Bâtiment & Construction" },
  { value: "sante", label: "Santé" },
  { value: "hotellerie", label: "Hôtellerie & Restauration" },
  { value: "transport", label: "Transport & Logistique" },
  { value: "maintenance", label: "Maintenance Industrielle" },
  { value: "commerce", label: "Commerce & Distribution" },
  { value: "agriculture", label: "Agriculture & Agroalimentaire" },
  { value: "support", label: "Support Entreprise" },
  { value: "autre", label: "Autre" },
];

const VOLUMES = [
  { value: "1", label: "1 talent" },
  { value: "2", label: "2 talents" },
  { value: "3", label: "3 talents" },
  { value: "5", label: "5 talents" },
  { value: "10", label: "10 talents" },
  { value: "15", label: "15 talents" },
  { value: "20", label: "20+ talents" },
];

export function QuoteGeneratorDialog({
  open,
  onOpenChange,
  companyName = "",
  contactEmail = "",
  onQuoteGenerated,
}: QuoteGeneratorDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "preview">("form");
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [form, setForm] = useState({
    company: companyName,
    email: contactEmail || user?.email || "",
    sector: "",
    volumeStr: "1",
    includePackAltis: true,
    includeSubscription: false,
    includeSuccessFee: false,
    notes: "",
  });

  const [generatedData, setGeneratedData] = useState<QuoteData | null>(null);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);

  const reset = () => {
    setStep("form");
    setForm({
      company: companyName,
      email: contactEmail || user?.email || "",
      sector: "",
      volumeStr: "1",
      includePackAltis: true,
      includeSubscription: false,
      includeSuccessFee: false,
      notes: "",
    });
    setGeneratedData(null);
    setSavedQuoteId(null);
  };

  const buildItems = (): QuoteItem[] => {
    const items: QuoteItem[] = [];
    const volume = parseInt(form.volumeStr) || 1;

    if (form.includePackAltis) {
      items.push({
        label: "Pack ALTIS",
        description: "Visa ANEF + billet A/R + accueil aéroport + logement meublé 1 mois + accompagnement administratif",
        quantity: volume,
        unitPrice: 2450,
        total: 2450 * volume,
      });
    }

    if (form.includeSubscription) {
      items.push({
        label: "Abonnement SaaS Premium",
        description: "Accès illimité base talents vérifiés · Priorité matching · Dashboard complet · Support prioritaire",
        quantity: 12,
        unitPrice: 499,
        total: 499 * 12,
      });
    }

    if (form.includeSuccessFee) {
      items.push({
        label: "Success Fee (estimation)",
        description: "25 % du salaire brut annuel — facturé à la signature du CDI. Montant estimatif sur base d'un salaire moyen de 28 000 €/an",
        quantity: volume,
        unitPrice: 7000,
        total: 7000 * volume,
      });
    }

    return items;
  };

  const handleGenerate = async () => {
    if (!form.company || !form.email || !form.sector) {
      toast({ title: "Champs requis", description: "Remplissez le nom d'entreprise, l'email et le secteur.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const validity = addDays(now, 30);
      const quoteNumber = `AX-${format(now, "yyyyMM")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const items = buildItems();
      const totalHT = items.reduce((s, i) => s + i.total, 0);
      const totalTTC = Math.round(totalHT * 1.2 * 100) / 100;

      const quoteData: QuoteData = {
        quoteNumber,
        date: format(now, "dd MMMM yyyy", { locale: fr }),
        validityDate: format(validity, "dd MMMM yyyy", { locale: fr }),
        companyName: form.company,
        contactEmail: form.email,
        sector: SECTORS.find((s) => s.value === form.sector)?.label || form.sector,
        volume: form.volumeStr + " talent(s)",
        items,
        totalHT,
        totalTTC,
        notes: form.notes || undefined,
      };

      // Save to DB
      const { data: inserted, error } = await supabase
        .from("generated_quotes" as any)
        .insert({
          user_id: user!.id,
          quote_number: quoteNumber,
          company_name: form.company,
          contact_email: form.email,
          sector: form.sector,
          volume: form.volumeStr,
          items: items as any,
          total_ht: totalHT,
          total_ttc: totalTTC,
          validity_date: format(validity, "yyyy-MM-dd"),
          status: "draft",
          notes: form.notes || null,
        } as any)
        .select("id")
        .single();

      if (error) throw error;
      setSavedQuoteId((inserted as any)?.id || null);

      setGeneratedData(quoteData);
      setStep("preview");
      toast({ title: "✅ Devis généré", description: `Devis ${quoteNumber} prêt à télécharger.` });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de générer le devis.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedData) return;
    const doc = generateQuotePdf(generatedData);
    doc.save(`Devis_${generatedData.quoteNumber}.pdf`);
  };

  const handleSendEmail = async () => {
    if (!generatedData) return;
    setSendingEmail(true);
    try {
      const doc = generateQuotePdf(generatedData);
      const pdfBase64 = doc.output("datauristring").split(",")[1];

      const { error } = await supabase.functions.invoke("send-quote-pdf", {
        body: {
          quoteData: generatedData,
          pdfBase64,
          recipientEmail: form.email,
          quoteId: savedQuoteId,
        },
      });

      if (error) throw error;
      toast({ title: "📧 Devis envoyé", description: `Le devis a été envoyé à ${form.email}.` });
      onQuoteGenerated?.();
    } catch (err: any) {
      toast({ title: "Erreur d'envoi", description: err.message || "Impossible d'envoyer le devis par email.", variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Générer un devis B2B
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "Configurez les prestations souhaitées pour générer un devis professionnel."
              : "Votre devis est prêt. Téléchargez-le ou envoyez-le par email."}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qg-company">Entreprise *</Label>
                <Input
                  id="qg-company"
                  placeholder="Nom de l'entreprise"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qg-email">Email professionnel *</Label>
                <Input
                  id="qg-email"
                  type="email"
                  placeholder="rh@entreprise.fr"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Secteur d'activité *</Label>
                <Select value={form.sector} onValueChange={(v) => setForm((f) => ({ ...f, sector: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nombre de talents</Label>
                <Select value={form.volumeStr} onValueChange={(v) => setForm((f) => ({ ...f, volumeStr: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VOLUMES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
              <Label className="text-sm font-semibold">Prestations à inclure</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pack-altis"
                  checked={form.includePackAltis}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, includePackAltis: !!v }))}
                />
                <label htmlFor="pack-altis" className="text-sm cursor-pointer">
                  Pack ALTIS — <span className="font-semibold text-foreground">2 450 €/talent</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="subscription"
                  checked={form.includeSubscription}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, includeSubscription: !!v }))}
                />
                <label htmlFor="subscription" className="text-sm cursor-pointer">
                  Abonnement SaaS Premium — <span className="font-semibold text-foreground">499 €/mois</span> (12 mois)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="success-fee"
                  checked={form.includeSuccessFee}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, includeSuccessFee: !!v }))}
                />
                <label htmlFor="success-fee" className="text-sm cursor-pointer">
                  Success Fee — <span className="font-semibold text-foreground">25 % du brut annuel</span> (estimation)
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qg-notes">Notes internes (optionnel)</Label>
              <Textarea
                id="qg-notes"
                placeholder="Remarques ou conditions particulières…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full font-bold gap-2" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Génération en cours…</>
              ) : (
                <><FileText className="h-4 w-4" /> Générer le devis</>
              )}
            </Button>
          </form>
        ) : generatedData ? (
          <div className="space-y-4 mt-2">
            {/* Preview summary */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-foreground">Devis {generatedData.quoteNumber}</p>
                  <p className="text-xs text-muted-foreground">Émis le {generatedData.date}</p>
                  <p className="text-xs text-muted-foreground">Valide jusqu'au {generatedData.validityDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="text-sm font-semibold text-foreground">{generatedData.companyName}</p>
                  <p className="text-xs text-muted-foreground">{generatedData.contactEmail}</p>
                </div>
              </div>

              <div className="border-t border-border pt-3 space-y-1.5">
                {generatedData.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.label} × {item.quantity}
                    </span>
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total HT</span>
                <span className="font-semibold text-foreground">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(generatedData.totalHT)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Total TTC</span>
                <span className="text-lg font-extrabold text-primary">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(generatedData.totalTTC)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleDownload} variant="outline" className="font-semibold gap-2">
                <Download className="h-4 w-4" /> Télécharger PDF
              </Button>
              <Button onClick={handleSendEmail} disabled={sendingEmail} className="font-semibold gap-2">
                {sendingEmail ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</>
                ) : (
                  <><Send className="h-4 w-4" /> Envoyer par email</>
                )}
              </Button>
            </div>

            <Button variant="ghost" className="w-full text-sm" onClick={() => setStep("form")}>
              ← Modifier le devis
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
