import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ChevronRight,
  Star,
  CheckCircle2,
  Zap,
  MapPin,
  Briefcase,
  TrendingUp,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

/* ── Constants ── */

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

const SECTEURS = [
  { label: "BTP / Construction", rome: "F1701" },
  { label: "Santé / Aide à la personne", rome: "J1501" },
  { label: "Hôtellerie / Restauration (CHR)", rome: "G1803" },
  { label: "Logistique / Transport", rome: "N1101" },
  { label: "Agriculture / Agroalimentaire", rome: "A1401" },
  { label: "Commerce / Distribution", rome: "D1211" },
  { label: "Maintenance industrielle", rome: "I1304" },
  { label: "Support entreprise / Admin", rome: "M1607" },
  { label: "Numérique / Informatique", rome: "M1805" },
];

const EXPERIENCE_TRANCHES = [
  "Moins d'1 an",
  "1 à 3 ans",
  "3 à 5 ans",
  "5 à 10 ans",
  "Plus de 10 ans",
];

const REGIONS_CAMEROUN = [
  "Yaoundé (Centre)",
  "Douala (Littoral)",
  "Bamenda (Nord-Ouest)",
  "Bafoussam (Ouest)",
  "Garoua (Nord)",
  "Maroua (Extrême-Nord)",
  "Bertoua (Est)",
  "Ngaoundéré (Adamaoua)",
  "Ebolowa (Sud)",
  "Kribi (Sud)",
  "Autre région",
];

/* ── Component ── */

export default function Signup() {
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step management
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1 – Quick signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 2 – Profile light
  const [secteur, setSecteur] = useState("");
  const [experience, setExperience] = useState("");
  const [region, setRegion] = useState("");

  // Step 3 – Score mock
  const mockScore = 78;

  if (loading) return null;
  if (session) return <Navigate to="/onboarding-role" replace />;

  const goTo = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  };

  /* ── Step 1 submit ── */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptCgu) {
      toast({ title: "Requis", description: "Veuillez accepter la politique de confidentialité.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Mot de passe trop court", description: "6 caractères minimum.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { role: "talent", country: "Cameroun" },
      },
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    setUserId(data.user?.id ?? null);
    setSubmitting(false);
    goTo(2);
  };

  /* ── Step 2 submit ── */
  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secteur || !experience || !region) {
      toast({ title: "Requis", description: "Merci de remplir les 3 champs.", variant: "destructive" });
      return;
    }
    const selectedSecteur = SECTEURS.find((s) => s.label === secteur);

    // Store profile data in localStorage — will be saved after email confirmation + session active
    localStorage.setItem("axiom_pending_profile", JSON.stringify({
      rome_label: secteur,
      rome_code: selectedSecteur?.rome ?? null,
      experience_years: experienceToNumber(experience),
      region,
      country: "Cameroun",
    }));

    // Also update auth metadata so trigger/onboarding can pick it up
    if (userId) {
      await supabase.auth.updateUser({
        data: {
          rome_label: secteur,
          rome_code: selectedSecteur?.rome ?? null,
          experience_years: experienceToNumber(experience),
          region,
          country: "Cameroun",
        },
      });
    }

    goTo(3);
  };

  const experienceToNumber = (t: string) => {
    if (t === "Moins d'1 an") return 0;
    if (t === "1 à 3 ans") return 2;
    if (t === "3 à 5 ans") return 4;
    if (t === "5 à 10 ans") return 7;
    return 12;
  };

  const handleUnlock = () => {
    toast({ title: "Paiement 10 €", description: "Redirection vers la page de paiement…" });
    navigate("/billing");
  };

  const handleFreeMode = () => {
    navigate("/onboarding-role");
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch {
      toast({ title: "Erreur Google", description: "Connexion impossible.", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ── Steps progress bar ── */
  const steps = ["Inscription", "Profil", "Score"];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(220,60%,18%)] flex flex-col" style={{ minHeight: '-webkit-fill-available' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto w-full">
          <Link to="/" className="text-primary-foreground/90 font-bold text-lg tracking-tight">
            AXIOM
          </Link>
          <Link
            to="/login"
            className="text-primary-foreground/70 text-sm hover:text-primary-foreground transition-colors"
          >
            Déjà inscrit ?{" "}
            <span className="underline">Se connecter</span>
          </Link>
        </div>

        {/* Progress steps */}
        <div className="max-w-lg mx-auto w-full px-4 pb-4">
          <div className="flex items-center gap-2">
            {steps.map((label, i) => {
              const idx = i + 1;
              const done = step > idx;
              const active = step === idx;
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        done
                          ? "bg-emerald-400 text-white"
                          : active
                          ? "bg-white text-[hsl(var(--primary))]"
                          : "bg-white/20 text-white/50"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx}
                    </div>
                    <span
                      className={`text-xs font-medium transition-all ${
                        active ? "text-white" : done ? "text-emerald-300" : "text-white/40"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-px bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/60 transition-all duration-500"
                        style={{ width: step > idx ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card container */}
        <div className="flex-1 flex items-start justify-center px-4 pb-[env(safe-area-inset-bottom,24px)] pb-8">
          <div className="w-full max-w-lg relative overflow-hidden">
            <AnimatePresence custom={direction} mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: easeOut }}
                >
                  <div className="bg-card rounded-2xl shadow-2xl border border-border/30 p-6 sm:p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-1.5">
                      <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                        Rejoignez AXIOM{" "}
                        <span className="text-primary">– Gratuit & sans engagement</span>
                      </h1>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Matching IA + offres France en tension{" "}
                        <span className="font-medium text-foreground/70">BTP · Santé · CHR · Logistique</span>
                      </p>
                    </div>

                    {/* Google OAuth */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 rounded-xl font-medium gap-2 border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                      onClick={handleGoogle}
                      disabled={googleLoading}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      {googleLoading ? "Connexion…" : "Continuer avec Google"}
                    </Button>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">ou par email</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSignup} className="space-y-4">
                      {/* Email */}
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email (ou téléphone +237)
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="vous@email.com"
                            required
                            className="pl-9 h-11 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm font-medium">
                          Mot de passe
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="6 caractères minimum"
                            required
                            className="pl-9 pr-10 h-11 rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {password.length > 0 && password.length < 6 && (
                          <p className="text-xs text-amber-500">6 caractères minimum</p>
                        )}
                      </div>

                      {/* RGPD checkbox */}
                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="cgu"
                          checked={acceptCgu}
                          onCheckedChange={(v) => setAcceptCgu(v === true)}
                          className="mt-0.5"
                        />
                        <Label htmlFor="cgu" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                          J'accepte la{" "}
                          <Link
                            to="/rgpd-light"
                            className="text-primary underline hover:no-underline"
                            target="_blank"
                          >
                            politique de confidentialité & CGU
                          </Link>{" "}
                          (RGPD)
                        </Label>
                      </div>

                      {/* CTA */}
                      <Button
                        type="submit"
                        disabled={submitting || !acceptCgu}
                        className="w-full h-12 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
                      >
                        {submitting ? "Création…" : "Continuer gratuitement"}
                        {!submitting && <ArrowRight className="h-4 w-4" />}
                      </Button>
                    </form>

                    {/* Footer RGPD */}
                    <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                      <Shield className="inline h-3 w-3 mr-1 mb-0.5" />
                      Vos données sont protégées (RGPD). Contact DPO :{" "}
                      <a href="mailto:rgpd@axiom-talents.com" className="underline">
                        rgpd@axiom-talents.com
                      </a>
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: easeOut }}
                >
                  <div className="bg-card rounded-2xl shadow-2xl border border-border/30 p-6 sm:p-8 space-y-6">
                    <div className="text-center space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-2">
                        <Zap className="h-3 w-3" />
                        30 secondes
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                        Complétez votre profil
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        3 champs pour activer votre matching IA
                      </p>
                    </div>

                    <form onSubmit={handleProfile} className="space-y-5">
                      {/* Métier */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-primary" />
                          Métier principal
                        </Label>
                        <Select value={secteur} onValueChange={setSecteur}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Choisir un secteur en tension…" />
                          </SelectTrigger>
                          <SelectContent>
                            {SECTEURS.map((s) => (
                              <SelectItem key={s.rome} value={s.label}>
                                <span>{s.label}</span>
                                <span className="ml-2 text-xs text-muted-foreground font-mono">{s.rome}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {secteur && (
                          <p className="text-xs text-primary flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Code ROME auto-suggéré :{" "}
                            <strong>{SECTEURS.find((s) => s.label === secteur)?.rome}</strong>
                          </p>
                        )}
                      </div>

                      {/* Expérience */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          Années d'expérience
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {EXPERIENCE_TRANCHES.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setExperience(t)}
                              className={`py-2 px-1 rounded-xl border text-xs font-medium transition-all text-center leading-tight ${
                                experience === t
                                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                  : "border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-foreground/70"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Région */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          Région (Cameroun)
                        </Label>
                        <Select value={region} onValueChange={setRegion}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Votre ville / région…" />
                          </SelectTrigger>
                          <SelectContent>
                            {REGIONS_CAMEROUN.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="submit"
                        disabled={!secteur || !experience || !region}
                        className="w-full h-12 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
                      >
                        Voir mon score de compatibilité
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </form>

                    <p className="text-center text-[11px] text-muted-foreground">
                      <Shield className="inline h-3 w-3 mr-1 mb-0.5" />
                      Données protégées RGPD · rgpd@axiom-talents.com
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: easeOut }}
                >
                  <div className="bg-card rounded-2xl shadow-2xl border border-border/30 p-6 sm:p-8 space-y-6">
                    {/* Score display */}
                    <div className="text-center space-y-3">
                      <div className="relative inline-flex">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            className="stroke-primary transition-all duration-1000"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            strokeDashoffset={`${2 * Math.PI * 42 * (1 - mockScore / 100)}`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-foreground">{mockScore}%</span>
                          <span className="text-[10px] text-muted-foreground">Score IA</span>
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                          Score estimé :{" "}
                          <span className="text-primary">{mockScore} % — Très bon potentiel !</span>
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Basé sur votre métier <strong>{secteur}</strong> et vos{" "}
                          <strong>{experience}</strong> d'expérience
                        </p>
                      </div>
                    </div>

                    {/* Value teaser */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                        Ce que vous débloquez avec Accès Essentiel 10 €
                      </p>
                      {[
                        "Score détaillé par compétence ROME",
                        "Offres France Travail matchées en temps réel",
                        "Parcours ALTIS complet (visa + billet + logement)",
                        "Priorité dans la file de matching entreprises",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/80">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA unlock */}
                    <div className="space-y-3">
                      <Button
                        onClick={handleUnlock}
                        className="w-full h-12 rounded-xl text-base font-semibold gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
                      >
                        <Star className="h-4 w-4" />
                        Débloquer pour 10 €
                      </Button>

                      <button
                        onClick={handleFreeMode}
                        className="w-full text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
                      >
                        Continuer gratuitement{" "}
                        <span className="text-muted-foreground/60">(version limitée)</span>
                      </button>
                    </div>

                    {/* Premium tooltip */}
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="flex items-center gap-1 hover:text-foreground transition-colors underline decoration-dotted">
                            <Info className="h-3 w-3" />
                            Premium 30 € disponible plus tard
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                          <p className="font-semibold mb-1">Badge vérifié MINEFOP/MINREX</p>
                          <p>
                            Certification officielle camerounaise + légalisation MINREX. Badge visible
                            par tous les recruteurs. Visibilité ×3 dans les résultats de matching.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Footer RGPD */}
                    <p className="text-center text-[11px] text-muted-foreground leading-relaxed">
                      <Shield className="inline h-3 w-3 mr-1 mb-0.5" />
                      Vos données sont protégées (RGPD). Contact DPO :{" "}
                      <a href="mailto:rgpd@axiom-talents.com" className="underline">
                        rgpd@axiom-talents.com
                      </a>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
