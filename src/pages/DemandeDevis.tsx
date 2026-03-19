import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowLeft, Send, CheckCircle2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.55, ease },
  }),
};

const SECTORS = [
  "BTP & Construction",
  "Santé & Aide à la personne",
  "Hôtellerie & Restauration",
  "Transport & Logistique",
  "Agriculture & Agroalimentaire",
  "Commerce & Distribution",
  "Maintenance industrielle",
  "Support entreprise",
  "Autre",
];

const VOLUMES = ["1-5 talents", "5-10 talents", "10-25 talents", "25+ talents"];

export default function DemandeDevis() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [sector, setSector] = useState("");
  const [volume, setVolume] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !email.trim() || !sector) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Adresse email invalide.");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-quote-request", {
        body: {
          company: company.trim(),
          sector,
          volume: volume || null,
          message: message.trim() || null,
          user_email: email.trim(),
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Demande de devis envoyée !");
    } catch (err: any) {
      console.error("Quote request error:", err);
      toast.error(err.message || "Erreur lors de l'envoi. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Demande de devis — AXIOM ALTIS</title>
        <meta
          name="description"
          content="Demandez un devis personnalisé pour recruter des talents qualifiés avec le Pack ALTIS : formalités visa de travail (procédure ANEF), billet A/R, logement meublé 1 mois et accompagnement administratif."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Nav */}
        <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => navigate("/pricing")}
            >
              <ArrowLeft className="h-4 w-4" /> Tarifs
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-xl px-4 py-12 sm:py-16">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Demande envoyée !
              </h1>
              <p className="mt-3 text-muted-foreground">
                Notre équipe commerciale reviendra vers vous sous 24-48h avec un devis personnalisé.
              </p>
              <Button
                className="mt-8"
                variant="outline"
                onClick={() => navigate("/pricing")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux tarifs
              </Button>
            </motion.div>
          ) : (
            <motion.div initial="hidden" animate="visible">
              {/* Header */}
              <motion.div custom={0} variants={fadeUp} className="text-center mb-10">
                <Badge variant="outline" className="mb-3 gap-1.5 border-primary/30 text-primary">
                  <FileText className="h-3 w-3" />
                  Devis personnalisé
                </Badge>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                  Demander un devis
                </h1>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Pack ALTIS — formalités visa de travail (procédure ANEF) + billet A/R + accueil aéroport + logement meublé 1 mois + accompagnement administratif — à partir de 2 450 €/talent.
                </p>
              </motion.div>

              {/* Form */}
              <motion.div custom={1} variants={fadeUp}>
                <Card className="border-border/50">
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label htmlFor="dq-company" className="block text-sm font-medium text-foreground mb-1.5">
                          Nom de l'entreprise *
                        </label>
                        <Input
                          id="dq-company"
                          placeholder="AXIOM SAS"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          maxLength={150}
                          required
                          className="bg-muted/30 border-border/50"
                        />
                      </div>

                      <div>
                        <label htmlFor="dq-email" className="block text-sm font-medium text-foreground mb-1.5">
                          Email professionnel *
                        </label>
                        <Input
                          id="dq-email"
                          type="email"
                          placeholder="recrutement@entreprise.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          maxLength={255}
                          required
                          className="bg-muted/30 border-border/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Secteur d'activité *
                        </label>
                        <Select value={sector} onValueChange={setSector}>
                          <SelectTrigger className="bg-muted/30 border-border/50">
                            <SelectValue placeholder="Sélectionnez un secteur" />
                          </SelectTrigger>
                          <SelectContent>
                            {SECTORS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Volume estimé
                        </label>
                        <Select value={volume} onValueChange={setVolume}>
                          <SelectTrigger className="bg-muted/30 border-border/50">
                            <SelectValue placeholder="Nombre de talents souhaités" />
                          </SelectTrigger>
                          <SelectContent>
                            {VOLUMES.map((v) => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label htmlFor="dq-message" className="block text-sm font-medium text-foreground mb-1.5">
                          Message (optionnel)
                        </label>
                        <Textarea
                          id="dq-message"
                          placeholder="Décrivez vos besoins en recrutement, les postes à pourvoir…"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          maxLength={2000}
                          rows={4}
                          className="bg-muted/30 border-border/50 resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={sending}
                        className="w-full py-5 h-auto rounded-xl font-bold"
                        size="lg"
                      >
                        {sending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours…</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" /> Envoyer ma demande</>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </main>
      </div>
    </>
  );
}
