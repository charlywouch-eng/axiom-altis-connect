import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Check, Zap, Crown, Building2, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.5 } }),
};

const TALENT_TEST_PERKS = [
  "Score de compatibilité IA",
  "Analyse ROME de base",
  "Accès aux offres en tension",
];

const TALENT_FULL_PERKS = [
  "Analyse ROME complète de votre profil",
  "Score détaillé par compétence",
  "Parcours ALTIS personnalisé (visa + billet + logement)",
  "Certification MINEFOP / MINREX",
  "Priorité matching recruteurs ×3",
];

const RECRUTEUR_PERKS = [
  "Accès illimité aux talents certifiés",
  "Matching IA avancé par compétences",
  "Dossiers conformité vérifiés",
  "Pipeline de recrutement intégré",
  "Tooltips ROI & analytics",
  "Support prioritaire dédié",
];

const MONTHLY_PRICE = 499;
const ANNUAL_MONTHLY_PRICE = Math.round(MONTHLY_PRICE * 0.8); // 20% off

export default function Pricing() {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const displayPrice = isAnnual ? ANNUAL_MONTHLY_PRICE : MONTHLY_PRICE;
  const billingLabel = isAnnual ? "/ mois (facturé annuellement)" : "/ mois";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Tarifs AXIOM – Test 4,99 € · Déblocage 29 € | Entreprise 499 €/mois</title>
        <meta name="description" content="Test d'éligibilité à 4,99 €, déblocage complet à 29 €. Abonnement Recruteur 499 €/mois (399 €/mois en annuel). Success fee 25 % + Pack ALTIS 2 450 €/talent." />
        <link rel="canonical" href="https://axiom-talents.com/pricing" />
        <meta property="og:title" content="Tarifs AXIOM – Recrutement international abordable" />
        <meta property="og:description" content="Test 4,99 € · Déblocage 29 € · Entreprise 499 €/mois · Pack ALTIS 2 450 €. Recrutez des talents certifiés Afrique-France." />
        <meta property="og:url" content="https://axiom-talents.com/pricing" />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-md shadow-accent/20">
              <Zap className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">AXIOM</span>
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
              Connexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        {/* Hero */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="mb-10 text-center"
        >
          <Badge variant="secondary" className="mb-4 gap-1">
            <Shield className="h-3 w-3" />
            Tarification transparente
          </Badge>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Choisissez votre plan
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Que vous soyez talent ou recruteur, AXIOM vous connecte aux meilleures opportunités France-Afrique.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.5}
          className="mb-12 flex items-center justify-center gap-3"
        >
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Mensuel
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isAnnual ? "bg-accent" : "bg-muted"
            }`}
            aria-label="Basculer entre mensuel et annuel"
          >
            <span
              className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                isAnnual ? "translate-x-[27px]" : "translate-x-[3px]"
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
            Annuel
          </span>
          {isAnnual && (
            <Badge className="bg-accent/15 text-accent border-accent/30 text-xs font-bold">
              -20 %
            </Badge>
          )}
        </motion.div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Talent – Test */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <Card className="relative flex h-full flex-col overflow-hidden border-border/60">
              <CardHeader className="pb-2">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Test d'éligibilité</CardTitle>
                <CardDescription>Score IA + analyse ROME de base</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="mb-6">
                  <span className="font-display text-5xl font-bold">4,99&nbsp;€</span>
                  <span className="ml-1 text-muted-foreground">/ paiement unique</span>
                </div>
                <ul className="mb-4 flex-1 space-y-3">
                  {TALENT_TEST_PERKS.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-3">
                  <p className="text-xs font-semibold text-accent mb-1">⬆ Déblocage complet — 29 €</p>
                  <ul className="space-y-1.5">
                    {TALENT_FULL_PERKS.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full gap-2" size="lg" onClick={() => navigate("/signup-light")}>
                  Commencer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recruteur / Entreprise */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <Card className="relative flex h-full flex-col overflow-hidden border-accent/40 shadow-lg shadow-accent/10">
              <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
              <CardHeader className="pb-2">
                <Badge className="mb-2 w-fit bg-accent text-accent-foreground">Populaire</Badge>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">Recruteur / Entreprise</CardTitle>
                <CardDescription>Accès illimité aux talents certifiés</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="mb-6">
                  <motion.span
                    key={displayPrice}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-display text-5xl font-bold"
                  >
                    {displayPrice}&nbsp;€
                  </motion.span>
                  <span className="ml-1 text-muted-foreground">{billingLabel}</span>
                  {isAnnual && (
                    <div className="mt-1">
                      <span className="text-sm text-muted-foreground line-through">{MONTHLY_PRICE} €/mois</span>
                      <span className="ml-2 text-sm font-semibold text-accent">
                        Économisez {(MONTHLY_PRICE - ANNUAL_MONTHLY_PRICE) * 12} €/an
                      </span>
                    </div>
                  )}
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {RECRUTEUR_PERKS.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90" size="lg" onClick={() => navigate("/signup")}>
                  Souscrire
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom note */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          Success Fee additionnel de 25 % du salaire annuel brut à la signature du CDI.
          <br />
          Pack ALTIS Intégral disponible à 2 450 € / talent (visa, billet, accueil, logement).
        </motion.p>
      </main>
    </div>
  );
}
