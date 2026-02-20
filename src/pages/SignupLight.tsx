import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, CheckCircle2, Star, Lock, Sparkles, MapPin,
  Briefcase, Zap, Award, TrendingUp, ChevronRight, Shield,
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
  { title: "Maçon qualifié H/F", location: "Lyon, 69", salary: "2 200 – 2 800 €/mois", rome: "F1703", sector: "🏗️", score: 92, contract: "CDI" },
  { title: "Aide-soignant(e)", location: "Paris, 75", salary: "2 000 – 2 500 €/mois", rome: "J1501", sector: "🏥", score: 88, contract: "CDI" },
  { title: "Cuisinier confirmé", location: "Bordeaux, 33", salary: "2 100 – 2 600 €/mois", rome: "G1602", sector: "🍽️", score: 81, contract: "CDI" },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease } }),
};

// ── Score map for ROME codes ───────────────────────────────────
const ROME_BASE_SCORES: Record<string, number> = {
  F1703: 88, J1501: 86, N1101: 81, G1602: 79,
  I1304: 77, G1703: 76, D1212: 71, A1401: 73, M1607: 74,
  N4101: 81, A1414: 73, M1805: 72, D1502: 71,
};
const EXP_BONUS: Record<string, number> = {
  "0-1": 0, "0-2": 0, "1-3": 2, "2-5": 4, "3-5": 5, "5-10": 7, "10+": 10,
};

// ── Main Component ─────────────────────────────────────────────
export default function SignupLight() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // ── Premium context from /payment-success redirect ─────────
  const isPremium  = searchParams.get("premium") === "true";
  const premiumRome = searchParams.get("rome") ?? "";
  const premiumExp  = searchParams.get("exp")  ?? "";
  const premiumSecteur = SECTEURS.find((s) => s.value === premiumRome || s.rome === premiumRome);
  const premiumScore = Math.min(95,
    (ROME_BASE_SCORES[premiumRome] ?? 75) + (EXP_BONUS[premiumExp] ?? 0)
  );

  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [step, setStep] = useState<"form" | "score">("form");
  const [rgpd, setRgpd] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    secteur: premiumRome || "",
    experience: premiumExp || "",
  });

  const selectedSecteur = SECTEURS.find((s) => s.value === form.secteur);
  const score = 78;

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.secteur || !form.experience) {
      toast({ title: "Champs manquants", description: "Merci de remplir tous les champs.", variant: "destructive" });
      return;
    }
    if (!rgpd) {
      toast({ title: "RGPD requis", description: "Vous devez accepter la politique RGPD.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { rome_code: form.secteur, experience: form.experience, role: "talent" } },
      });
      if (error) throw error;
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
        toast({ title: "Connexion requise", description: "Vérifiez votre email pour activer votre compte.", variant: "destructive" });
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
      style={{ background: "linear-gradient(135deg, hsl(222,47%,6%) 0%, hsl(221,83%,18%) 55%, hsl(189,94%,22%) 100%)" }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 max-w-md mx-auto w-full">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-white/15 flex items-center justify-center">
            <span className="text-white font-black text-[10px]">A</span>
          </div>
          <span className="font-black text-lg text-white tracking-tight">AXIOM</span>
        </Link>
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/8 text-sm border border-white/10">
            Déjà inscrit ?
          </Button>
        </Link>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div className="px-5 pb-3 max-w-md mx-auto w-full">
        <div className="h-0.5 w-full bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: step === "form" ? "50%" : "100%" }}
            transition={{ duration: 0.6, ease }}
          />
        </div>
        <p className="text-[10px] text-white/30 mt-1.5 text-right">
          {step === "form" ? "Étape 1/2" : "Étape 2/2"}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 pb-10">
        <AnimatePresence mode="wait">

          {/* ── STEP 1 : Form ──────────────────────────────── */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease }}
              className="w-full max-w-md"
            >
              <div className="rounded-3xl bg-card shadow-2xl overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-success" />

                <div className="p-7 sm:p-8">

                  {/* ── Premium banner (visible only after Stripe payment) ── */}
                  <AnimatePresence>
                    {isPremium && premiumSecteur && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="mb-5 rounded-2xl overflow-hidden"
                        style={{
                          background: "linear-gradient(135deg, hsl(158 64% 10%) 0%, hsl(158 64% 7%) 100%)",
                          border: "1px solid hsl(158 64% 38% / 0.45)",
                          boxShadow: "0 4px 24px hsl(158 64% 38% / 0.12)",
                        }}
                      >
                        {/* Green top bar */}
                        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                        <div className="px-4 py-3.5 flex items-center gap-3">
                          {/* Icon */}
                          <div
                            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: "hsl(158 64% 38% / 0.18)", border: "1px solid hsl(158 64% 38% / 0.35)" }}
                          >
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" strokeWidth={2} />
                          </div>
                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-emerald-400 leading-tight">
                              ✓ Accès premium inclus — Analyse Complète débloquée
                            </p>
                            <p className="text-xs mt-0.5 text-emerald-200/60 truncate">
                              {premiumSecteur.label}&nbsp;·&nbsp;Code ROME&nbsp;
                              <span className="font-mono font-semibold text-emerald-300/80">{premiumRome}</span>
                            </p>
                          </div>
                          {/* Score badge */}
                          <div
                            className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl"
                            style={{ background: "hsl(158 64% 38% / 0.14)", border: "1px solid hsl(158 64% 38% / 0.3)" }}
                          >
                            <span className="text-base font-extrabold text-emerald-400 leading-none">{premiumScore}%</span>
                            <span className="text-[9px] font-semibold text-emerald-400/60 uppercase tracking-wide leading-tight">match</span>
                          </div>
                        </div>
                        {/* Footer hint */}
                        <div className="px-4 pb-2.5">
                          <p className="text-[10px] text-emerald-300/40">
                            Créez votre compte pour accéder à votre analyse complète · Gratuit
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Header */}
                  <div className="text-center mb-7">
                    <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
                      <Zap className="h-3 w-3 text-accent" />
                      <span className="text-xs font-bold text-accent">
                        {isPremium ? "Complétez votre inscription · 30 secondes" : "Inscription gratuite · 45 secondes"}
                      </span>
                    </div>
                    <h1 className="font-black text-2xl text-foreground tracking-tight">
                      {isPremium ? "Activez votre compte premium" : "Votre score en France"}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1.5">
                      Score immédiat · Matching IA ROME certifié
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                        Email ou téléphone
                        <span className="text-muted-foreground font-normal ml-1 text-xs">(+237 accepté)</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="h-12 rounded-xl text-base border-border/70 focus:border-primary bg-background"
                        autoComplete="email"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                        Mot de passe
                        <span className="text-muted-foreground font-normal ml-1 text-xs">6 caractères min.</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className="h-12 rounded-xl text-base border-border/70 focus:border-primary bg-background"
                        autoComplete="new-password"
                      />
                    </div>

                    {/* Secteur ROME */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        Métier principal
                        {form.secteur && (
                          <span className="text-xs text-muted-foreground font-mono font-normal">{form.secteur}</span>
                        )}
                      </Label>
                      <Select value={form.secteur} onValueChange={(v) => handleChange("secteur", v)}>
                        <SelectTrigger className="h-12 rounded-xl text-base border-border/70 focus:border-primary bg-background">
                          <SelectValue placeholder="Choisissez votre secteur…" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {SECTEURS.map((s) => (
                            <SelectItem key={s.value} value={s.value} className="text-base py-3">
                              <div className="flex items-center justify-between w-full gap-3">
                                <span>{s.label}</span>
                                <span className="text-xs text-muted-foreground font-mono">{s.rome}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Expérience */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-foreground">
                        Années d'expérience
                      </Label>
                      <Select value={form.experience} onValueChange={(v) => handleChange("experience", v)}>
                        <SelectTrigger className="h-12 rounded-xl text-base border-border/70 focus:border-primary bg-background">
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
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                      <Checkbox
                        id="rgpd"
                        checked={rgpd}
                        onCheckedChange={(v) => setRgpd(v as boolean)}
                        className="mt-0.5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label htmlFor="rgpd" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                        J'accepte la{" "}
                        <Link to="/rgpd-light" className="text-primary font-semibold hover:underline" target="_blank">
                          politique RGPD & CGU
                        </Link>{" "}
                        — Données traitées conformément aux CCT 2021 UE.
                      </label>
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="w-full h-13 text-base rounded-xl font-bold shadow-lg py-4 group"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Analyse en cours…
                        </span>
                      ) : (
                        <>
                          Voir mon score maintenant
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-xs text-muted-foreground mt-4">
                    Déjà inscrit ?{" "}
                    <Link to="/login" className="text-primary font-semibold hover:underline">Se connecter</Link>
                  </p>
                </div>
              </div>

              {/* Reassurance strip */}
              <div className="mt-4 flex items-center justify-center gap-5 text-white/35 text-xs">
                <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> RGPD conforme</span>
                <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> SSL chiffré</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> 100% gratuit</span>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2 : Score + Upsell ────────────────────── */}
          {step === "score" && (
            <motion.div
              key="score"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease }}
              className="w-full max-w-md space-y-4"
            >
              {/* ── Score Card ── */}
              <div className="rounded-3xl bg-card shadow-2xl overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-success" />
                <div className="p-7">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 bg-success/10 border border-success/20 rounded-full px-3 py-1 mb-5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span className="text-xs font-bold text-success">Profil analysé avec succès</span>
                    </div>

                    {/* Score Circle */}
                    <div className="relative w-36 h-36 mx-auto mb-5">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
                        <motion.circle
                          cx="60" cy="60" r="52"
                          fill="none"
                          stroke="url(#scoreGrad)"
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 52}`}
                          strokeDashoffset={`${2 * Math.PI * 52}`}
                          animate={{ strokeDashoffset: `${2 * Math.PI * 52 * (1 - score / 100)}` }}
                          transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
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
                          className="font-black text-4xl text-foreground"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1, duration: 0.4 }}
                        >
                          {score}%
                        </motion.span>
                        <span className="text-[10px] text-muted-foreground font-medium mt-0.5">Score global</span>
                      </div>
                    </div>

                    <h2 className="font-black text-xl text-foreground mb-1">
                      Excellent profil {selectedSecteur?.label.split(" ")[1] ?? ""}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Vérifiez votre email pour activer votre compte AXIOM.
                    </p>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2.5 mt-6">
                    {[
                      { icon: TrendingUp, label: "Matching", value: "Élevé", color: "text-success", bg: "bg-success/8" },
                      { icon: Award, label: "MINEFOP", value: "Éligible", color: "text-accent", bg: "bg-accent/8" },
                      { icon: Star, label: "Priorité", value: "Normale", color: "text-tension", bg: "bg-tension/8" },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className={`rounded-xl ${s.bg} p-3 text-center`}>
                          <Icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          <p className="text-xs font-bold text-foreground">{s.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── 3 Offres teasées ── */}
              <div className="rounded-3xl bg-card shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">3 offres disponibles pour vous</h3>
                    <Badge className="ml-auto bg-primary/8 text-primary border-primary/20 text-[10px]">Aperçu</Badge>
                  </div>
                  <div className="space-y-2.5">
                    {MOCK_OFFERS.map((offer, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 relative overflow-hidden border border-border/40">
                        {i > 0 && (
                          <div className="absolute inset-0 bg-background/55 backdrop-blur-[3px] flex items-center justify-center z-10 rounded-xl">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Lock className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">Débloquer</span>
                            </div>
                          </div>
                        )}
                        <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 text-lg">
                          {offer.sector}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{offer.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            {offer.location} · {offer.salary}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className="bg-success/12 text-success border-success/25 text-[10px] font-bold">{offer.score}%</Badge>
                          <span className="text-[9px] text-muted-foreground font-medium">{offer.contract}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Upsell 10 € ── */}
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
                <div className="bg-card p-6">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl bg-accent/12 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-foreground">Débloquez votre analyse complète</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Score détaillé · Toutes les offres France Travail · Parcours ALTIS · Priorité recruteur
                      </p>
                    </div>
                  </div>

                  {/* Value props */}
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {[
                      "Analyse approfondie ROME",
                      "Offres France Travail illimitées",
                      "Parcours ALTIS complet",
                      "Priorité recruteurs ×3",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-12 text-base rounded-xl font-bold shadow-md group"
                    onClick={handlePremiumPayment}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Redirection…
                      </span>
                    ) : (
                      <>
                        Débloquer pour 10 €
                        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>

                  <button
                    onClick={() => navigate("/dashboard-talent")}
                    className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors py-1"
                  >
                    Continuer gratuitement (version limitée) →
                  </button>

                  {/* Premium preview */}
                  <div className="mt-4 rounded-xl bg-muted/40 border border-border/40 p-3 flex items-start gap-2.5">
                    <Star className="h-3.5 w-3.5 text-tension mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-bold text-foreground">Plus tard — Premium 30 €</span> : Badge MINEFOP/MINREX officiel + visibilité ×3 auprès des recruteurs partenaires
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
