import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, CheckCircle2, Star, Lock, Sparkles, MapPin,
  Briefcase, Clock, Zap, Award, TrendingUp, ChevronRight,
} from "lucide-react";

// ── Data ───────────────────────────────────────────────────────
const SECTEURS = [
  { value: "F1703", label: "🏗️ BTP & Construction", rome: "F1703" },
  { value: "J1501", label: "🏥 Santé & Aide à la personne", rome: "J1501" },
  { value: "G1602", label: "🍽️ Hôtellerie & Restauration", rome: "G1602" },
  { value: "N4101", label: "🚚 Transport & Logistique", rome: "N4101" },
  { value: "I1304", label: "⚡ Maintenance & Industrie", rome: "I1304" },
  { value: "A1414", label: "🌾 Agriculture & Agroalimentaire", rome: "A1414" },
  { value: "M1805", label: "💻 Informatique & Tech", rome: "M1805" },
  { value: "D1502", label: "👔 Commerce & Vente", rome: "D1502" },
  { value: "M1607", label: "🏢 Support Administratif", rome: "M1607" },
];

const EXPERIENCE_OPTIONS = [
  { value: "0-1", label: "Moins de 1 an" },
  { value: "1-3", label: "1 à 3 ans" },
  { value: "3-5", label: "3 à 5 ans" },
  { value: "5-10", label: "5 à 10 ans" },
  { value: "10+", label: "Plus de 10 ans" },
];

const MOCK_OFFERS = [
  { title: "Maçon qualifié H/F", location: "Lyon, 69", salary: "2 200 – 2 800 €/mois", rome: "F1703", sector: "🏗️ BTP", score: 92 },
  { title: "Aide-soignant(e)", location: "Paris, 75", salary: "2 000 – 2 500 €/mois", rome: "J1501", sector: "🏥 Santé", score: 88 },
  { title: "Cuisinier confirmé", location: "Bordeaux, 33", salary: "2 100 – 2 600 €/mois", rome: "G1602", sector: "🍽️ CHR", score: 81 },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease } }),
};

// ── Main Component ─────────────────────────────────────────────
export default function SignupLight() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [step, setStep] = useState<"form" | "score">("form");
  const [rgpd, setRgpd] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    secteur: "",
    experience: "",
  });

  const selectedSecteur = SECTEURS.find((s) => s.value === form.secteur);
  const score = 78; // mock score

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.secteur || !form.experience) {
      toast({ title: "Champs manquants", description: "Merci de remplir tous les champs.", variant: "destructive" });
      return;
    }
    if (!rgpd) {
      toast({ title: "RGPD requis", description: "Vous devez accepter la politique RGPD pour continuer.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { rome_code: form.secteur, experience: form.experience, role: "talent" },
        },
      });
      if (error) throw error;

      // Save profile data for post-confirmation sync
      localStorage.setItem("axiom_pending_profile", JSON.stringify({
        rome_code: form.secteur,
        rome_label: selectedSecteur?.label ?? "",
        experience_years: parseInt(form.experience.split("-")[0]) || 0,
      }));

      setStep("score");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePremiumPayment = async () => {
    setPaymentLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Connexion requise", description: "Vérifiez votre email pour activer votre compte avant de payer.", variant: "destructive" });
        setPaymentLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-payment-talent", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || !data?.url) throw new Error(error?.message || "Erreur de paiement");
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Erreur paiement", description: err.message, variant: "destructive" });
      setPaymentLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--gradient-hero)", minHeight: "-webkit-fill-available" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <Link to="/" className="font-display text-lg font-extrabold text-white tracking-tight">AXIOM</Link>
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 text-sm">
            Déjà inscrit ?
          </Button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">

        <AnimatePresence mode="wait">

          {/* ── STEP 1 : Form ──────────────────────────────────── */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease }}
              className="w-full max-w-md"
            >
              {/* Card */}
              <div className="rounded-3xl bg-card shadow-2xl overflow-hidden">
                {/* Top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-success" />

                <div className="p-7 sm:p-8">
                  <div className="text-center mb-7">
                    <Badge className="mb-3 bg-accent/15 text-accent border-accent/30 font-semibold text-xs px-3 py-1 gap-1.5">
                      <Zap className="h-3 w-3" />
                      Inscription gratuite
                    </Badge>
                    <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">
                      Inscription gratuite
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">30 secondes · Votre score immédiatement</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email ou téléphone (+237)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="h-12 rounded-xl text-base border-border/80 focus:border-primary"
                        autoComplete="email"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground">
                        Mot de passe <span className="text-muted-foreground font-normal">(6 caractères min)</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className="h-12 rounded-xl text-base border-border/80 focus:border-primary"
                        autoComplete="new-password"
                      />
                    </div>

                    {/* Secteur ROME */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">
                        Métier principal
                      </Label>
                      <Select value={form.secteur} onValueChange={(v) => handleChange("secteur", v)}>
                        <SelectTrigger className="h-12 rounded-xl text-base border-border/80 focus:border-primary">
                          <SelectValue placeholder="Choisissez votre secteur…" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {SECTEURS.map((s) => (
                            <SelectItem key={s.value} value={s.value} className="text-base py-3">
                              <div className="flex items-center gap-2">
                                <span>{s.label}</span>
                                <span className="text-xs text-muted-foreground font-mono ml-auto">{s.rome}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Expérience */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">
                        Années d'expérience
                      </Label>
                      <Select value={form.experience} onValueChange={(v) => handleChange("experience", v)}>
                        <SelectTrigger className="h-12 rounded-xl text-base border-border/80 focus:border-primary">
                          <SelectValue placeholder="Sélectionnez une tranche…" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {EXPERIENCE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-base py-3">
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* RGPD */}
                    <div className="flex items-start gap-3 py-2">
                      <Checkbox
                        id="rgpd"
                        checked={rgpd}
                        onCheckedChange={(v) => setRgpd(v as boolean)}
                        className="mt-0.5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label htmlFor="rgpd" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                        J'accepte la{" "}
                        <Link to="/rgpd-light" className="text-primary font-medium hover:underline" target="_blank">
                          politique RGPD & CGU
                        </Link>
                      </label>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="w-full h-13 text-base rounded-xl font-bold shadow-lg py-4"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Calcul en cours…
                        </span>
                      ) : (
                        <>Voir mon score maintenant <ArrowRight className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-xs text-muted-foreground mt-5">
                    Déjà inscrit ?{" "}
                    <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2 : Score + Upsell ────────────────────────── */}
          {step === "score" && (
            <motion.div
              key="score"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease }}
              className="w-full max-w-md space-y-4"
            >
              {/* Score Card */}
              <div className="rounded-3xl bg-card shadow-2xl overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-success" />
                <div className="p-7">
                  <div className="text-center">
                    <Badge className="mb-4 bg-success/15 text-success border-success/30 font-bold text-xs px-3 py-1.5 gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Profil analysé avec succès
                    </Badge>

                    {/* Score Circle */}
                    <div className="relative w-32 h-32 mx-auto mb-5">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                        <motion.circle
                          cx="60" cy="60" r="52"
                          fill="none"
                          stroke="url(#scoreGrad)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 52}`}
                          strokeDashoffset={`${2 * Math.PI * 52 * (1 - score / 100)}`}
                          initial={{ strokeDashoffset: `${2 * Math.PI * 52}` }}
                          animate={{ strokeDashoffset: `${2 * Math.PI * 52 * (1 - score / 100)}` }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        />
                        <defs>
                          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" />
                            <stop offset="100%" stopColor="hsl(var(--accent))" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                          className="font-display text-3xl font-extrabold text-foreground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          {score}%
                        </motion.span>
                        <span className="text-xs text-muted-foreground font-medium">Score global</span>
                      </div>
                    </div>

                    <h2 className="font-display text-xl font-bold text-foreground mb-1">
                      Excellent profil {selectedSecteur?.label.split(" ")[0]}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Vérifiez votre email pour activer votre compte.
                    </p>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {[
                      { icon: TrendingUp, label: "Matching", value: "Élevé", color: "text-success" },
                      { icon: Award, label: "MINEFOP", value: "Éligible", color: "text-accent" },
                      { icon: Star, label: "Priorité", value: "Normale", color: "text-tension" },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="rounded-xl bg-muted/50 p-3 text-center">
                          <Icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          <p className="text-xs font-bold text-foreground">{s.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3 Teasered Offers */}
              <div className="rounded-3xl bg-card shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">Offres disponibles pour vous</h3>
                    <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-[10px]">3 aperçus</Badge>
                  </div>
                  <div className="space-y-3">
                    {MOCK_OFFERS.map((offer, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 relative overflow-hidden">
                        {/* Blur lock overlay for i > 0 */}
                        {i > 0 && (
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-xl">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-base">
                          {offer.sector.split(" ")[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{offer.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />{offer.location} · {offer.salary}
                          </p>
                        </div>
                        <Badge className="bg-success/15 text-success border-success/30 text-[10px] font-bold shrink-0">
                          {offer.score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 10€ Upsell */}
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
                <div className="bg-card p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">Débloquez votre analyse complète</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Score détaillé · Offres France Travail · Parcours ALTIS complet · Priorité recruteur
                      </p>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-12 text-base rounded-xl font-bold shadow-md"
                    onClick={handlePremiumPayment}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Redirection Stripe…
                      </span>
                    ) : (
                      <>Débloquer pour 10 € <ChevronRight className="ml-1 h-4 w-4" /></>
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    <button
                      onClick={() => navigate("/dashboard-talent")}
                      className="hover:text-foreground transition-colors"
                    >
                      Continuer gratuitement (version limitée) →
                    </button>
                  </p>

                  {/* Premium tooltip */}
                  <div className="mt-4 rounded-xl bg-muted/50 p-3 flex items-start gap-2.5">
                    <Star className="h-3.5 w-3.5 text-tension mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Plus tard : Premium 30 €</span> — Badge MINEFOP/MINREX officiel + visibilité x3 auprès des recruteurs
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
