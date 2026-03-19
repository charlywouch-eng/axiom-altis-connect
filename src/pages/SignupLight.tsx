import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { trackFunnel } from "@/lib/trackFunnel";
import { trackGA4 } from "@/lib/ga4";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, CheckCircle2, Lock, Sparkles, MapPin,
  Briefcase, Zap, Award, TrendingUp, ChevronRight, Shield,
  Star, Mail, Phone, Info,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { PhoneInput } from "@/components/PhoneInput";
import { ConfettiCanvas } from "@/components/ConfettiCanvas";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const NetworkCanvas = lazy(() => import("@/components/landing/NetworkCanvas"));

// ── Secteurs ROME ───────────────────────────────────────────────
const SECTEURS = [
  { value: "F1703", rome: "F1703", label: "🏗️ BTP & Construction", metier: "Maçon / Ouvrier qualifié bâtiment" },
  { value: "J1501", rome: "J1501", label: "🏥 Santé & Aide à la personne", metier: "Aide-soignant / Auxiliaire de vie" },
  { value: "G1602", rome: "G1602", label: "🍽️ Hôtellerie & Restauration", metier: "Cuisinier / Agent hôtelier" },
  { value: "N4101", rome: "N4101", label: "🚚 Transport & Logistique", metier: "Chauffeur PL / Agent logistique" },
  { value: "I1304", rome: "I1304", label: "⚡ Maintenance & Industrie", metier: "Technicien de maintenance" },
  { value: "A1414", rome: "A1414", label: "🌾 Agriculture & Agroalimentaire", metier: "Ouvrier agricole / Agent agroalimentaire" },
  { value: "M1805", rome: "M1805", label: "💻 Informatique & Tech", metier: "Développeur / Technicien IT" },
  { value: "D1502", rome: "D1502", label: "👔 Commerce & Vente", metier: "Commercial / Conseiller de vente" },
  { value: "M1607", rome: "M1607", label: "🏢 Support Administratif", metier: "Assistant(e) administratif(ve)" },
];

const EXPERIENCE_OPTIONS = [
  { value: "0-2",  label: "0–2 ans",   shortLabel: "Junior",      teaser: "Profil junior – forte demande pour formations ALTIS" },
  { value: "2-5",  label: "2–5 ans",   shortLabel: "Confirmé",    teaser: "Profil intermédiaire très demandé en France" },
  { value: "5-10", label: "5–10 ans",  shortLabel: "Expérimenté", teaser: "Profil expérimenté – priorité recruteurs partenaires" },
  { value: "10+",  label: "+10 ans",   shortLabel: "Expert",      teaser: "Expert confirmé – accès direct entreprises premium" },
];

const SECTOR_TENSION: Record<string, string> = {
  F1703: "grande tension BTP",
  J1501: "pénurie critique Santé",
  G1602: "grande tension CHR",
  N4101: "forte tension Transport",
  I1304: "grande tension Industrie",
  A1414: "demande saisonnière Agriculture",
  M1805: "grande tension Tech",
  D1502: "flux constant Commerce",
  M1607: "demande stable Support",
};

// ── Score calculation ────────────────────────────────────────────
const ROME_BASE_SCORES: Record<string, number> = {
  F1703: 88, J1501: 86, N4101: 83, G1602: 79,
  I1304: 77, A1414: 73, M1805: 72, D1502: 71, M1607: 74,
};
const EXP_BONUS: Record<string, number> = {
  "0-2": 0, "2-5": 4, "5-10": 7, "10+": 10,
};
const EXP_URL_MAP: Record<string, string> = {
  "0-1": "0-2", "1-3": "0-2", "3-5": "2-5",
  "0-2": "0-2", "2-5": "2-5", "5-10": "5-10", "10+": "10+",
};

const MOCK_OFFERS = [
  { title: "Maçon qualifié H/F", location: "Lyon, 69", salary: "2 200 – 2 800 €/mois", rome: "F1703", sector: "🏗️", score: 92, contract: "CDI" },
  { title: "Aide-soignant(e)", location: "Paris, 75", salary: "2 000 – 2 500 €/mois", rome: "J1501", sector: "🏥", score: 88, contract: "CDI" },
  { title: "Cuisinier confirmé", location: "Bordeaux, 33", salary: "2 100 – 2 600 €/mois", rome: "G1602", sector: "🍽️", score: 81, contract: "CDI" },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

function isPhone(value: string) {
  return /^[+\d\s().-]{7,}$/.test(value.trim()) && !value.includes("@");
}

// ── Country list with flags ──────────────────────────────────────
const PAYS_OPTIONS = [
  { value: "Cameroun",       flag: "🇨🇲" },
  { value: "Sénégal",        flag: "🇸🇳" },
  { value: "Côte d'Ivoire",  flag: "🇨🇮" },
  { value: "Guinée",         flag: "🇬🇳" },
  { value: "Mali",           flag: "🇲🇱" },
  { value: "Bénin",          flag: "🇧🇯" },
  { value: "Togo",           flag: "🇹🇬" },
  { value: "Burkina Faso",   flag: "🇧🇫" },
  { value: "Congo (RDC)",    flag: "🇨🇩" },
  { value: "Autre",          flag: "🌍" },
];

// ── Progress Steps ──────────────────────────────────────────────
type FunnelStep = "contact" | "secteur" | "experience" | "pays" | "confirm" | "score";

const STEP_PROGRESS: Record<FunnelStep, number> = {
  contact: 30,
  secteur: 40,
  experience: 50,
  pays: 70,
  confirm: 85,
  score: 95,
};

const STEP_MESSAGES: Record<FunnelStep, string> = {
  contact: "Commencez votre évaluation d'éligibilité pour travailler en France.",
  secteur: "Félicitations ! Vous êtes éligible à un poste en France.",
  experience: "Votre secteur est en forte demande. Continuez pour affiner votre score.",
  pays: "Votre profil correspond déjà à plusieurs offres en tension en France.",
  confirm: "Dernière étape ! Validez pour obtenir votre score IA complet.",
  score: "Votre score IA complet est prêt.",
};

// ── Main Component ──────────────────────────────────────────────
export default function SignupLight() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const isPremium   = searchParams.get("premium") === "true";
  const premiumRome = searchParams.get("rome") ?? "";
  const rawExp      = searchParams.get("exp") ?? "";
  const premiumExp  = EXP_URL_MAP[rawExp] ?? rawExp;

  const premiumSecteur = SECTEURS.find((s) => s.value === premiumRome);
  const premiumScore   = Math.min(95,
    (ROME_BASE_SCORES[premiumRome] ?? 75) + (EXP_BONUS[premiumExp] ?? 0)
  );

  const [funnelStep, setFunnelStep] = useState<FunnelStep>("contact");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [fullPaymentLoading, setFullPaymentLoading] = useState(false);
  const [rgpd, setRgpd] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const [usePhone, setUsePhone] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [form, setForm] = useState({
    contact:    "",
    secteur:    premiumRome || "",
    experience: premiumExp  || "",
    pays:       "Cameroun",
  });

  // If premium params pre-fill, skip to later steps
  const selectedSecteur  = SECTEURS.find((s) => s.value === form.secteur);
  const selectedExp      = EXPERIENCE_OPTIONS.find((e) => e.value === form.experience);
  const score            = Math.min(95,
    (ROME_BASE_SCORES[form.secteur] ?? 75) + (EXP_BONUS[form.experience] ?? 0)
  );

  const progress = STEP_PROGRESS[funnelStep];
  const motivationalMessage = useMemo(() => {
    if (funnelStep === "secteur" && form.contact) {
      return "Félicitations ! Vous êtes éligible à un poste en France (30 % du parcours complété).";
    }
    if (funnelStep === "experience" && form.secteur) {
      return `Secteur ${selectedSecteur?.label?.replace(/^.+?\s/, "") ?? ""} en ${SECTOR_TENSION[form.secteur] ?? "forte demande"}. Vous êtes à 40 % de votre score complet.`;
    }
    if (funnelStep === "pays") {
      return `Votre profil correspond déjà à plusieurs offres en tension en France. Vous êtes à 50 % de votre score complet.`;
    }
    if (funnelStep === "confirm") {
      return `Excellent ! Vous êtes à 70 % de votre score complet. Dernière validation avant résultat.`;
    }
    if (funnelStep === "score") {
      return `Votre score IA complet est prêt — ${score}% de compatibilité.`;
    }
    return STEP_MESSAGES[funnelStep];
  }, [funnelStep, form.contact, form.secteur, selectedSecteur, score]);

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const advanceToNextStep = () => {
    if (funnelStep === "contact") {
      if (!form.contact) {
        toast({ title: "Champ requis", description: "Entrez votre email ou téléphone.", variant: "destructive" });
        return;
      }
      if (usePhone && !phoneValid) {
        toast({ title: "Numéro invalide", description: "Vérifiez le format du numéro.", variant: "destructive" });
        return;
      }
      trackGA4("funnel_step_contact" as any, { source: "signup-light" });
      trackFunnel({ event_name: "signup_started", email_hash: form.contact, source: "signup-light", metadata: { step: "contact" } });
      setFunnelStep("secteur");
    } else if (funnelStep === "secteur") {
      if (!form.secteur) {
        toast({ title: "Champ requis", description: "Choisissez votre secteur.", variant: "destructive" });
        return;
      }
      trackGA4("funnel_step_secteur" as any, { rome_code: form.secteur, source: "signup-light" });
      trackFunnel({ event_name: "lead_form_submitted", rome_code: form.secteur, email_hash: form.contact, source: "signup-light", metadata: { step: "secteur" } });
      setFunnelStep("experience");
    } else if (funnelStep === "experience") {
      if (!form.experience) {
        toast({ title: "Champ requis", description: "Sélectionnez votre expérience.", variant: "destructive" });
        return;
      }
      trackGA4("funnel_step_experience" as any, { experience: form.experience, source: "signup-light" });
      trackFunnel({ event_name: "lead_score_viewed", rome_code: form.secteur, experience: form.experience, email_hash: form.contact, source: "signup-light", metadata: { step: "experience" } });
      setFunnelStep("pays");
    } else if (funnelStep === "pays") {
      trackGA4("funnel_step_pays" as any, { country: form.pays, source: "signup-light" });
      trackFunnel({ event_name: "lead_payment_clicked", rome_code: form.secteur, experience: form.experience, email_hash: form.contact, source: "signup-light", metadata: { step: "pays", country: form.pays } });
      setFunnelStep("confirm");
    } else if (funnelStep === "confirm") {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!rgpd) {
      toast({ title: "RGPD requis", description: "Vous devez accepter la politique RGPD.", variant: "destructive" });
      return;
    }

    setLoading(true);
    trackGA4("inscription_start", { rome_code: form.secteur, experience: form.experience, source: "signup-light" });
    try {
      const meta = {
        rome_code: form.secteur,
        rome_label: selectedSecteur?.label ?? "",
        experience: form.experience,
        country: form.pays,
        role: "talent",
      };

      if (usePhone) {
        localStorage.setItem("axiom_pending_profile", JSON.stringify(meta));
        localStorage.setItem("axiom_contact", form.contact);
        setFunnelStep("score");
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: form.contact.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: meta,
          },
        });
        if (error) throw error;
        localStorage.setItem("axiom_pending_profile", JSON.stringify(meta));
        localStorage.setItem("axiom_contact", form.contact);

        trackFunnel({
          event_name: "signup_completed",
          rome_code: form.secteur,
          experience: form.experience,
          email_hash: form.contact,
          source: isPremium ? "signup-light-premium" : "signup-light",
          metadata: { step: "confirm" },
        });

        setFunnelStep("score");
        trackGA4("score_viewed", { rome_code: form.secteur, source: "signup-light" });
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePremiumPayment = async () => {
    setPaymentLoading(true);
    trackGA4("paiement_4_99_started", { rome_code: form.secteur, source: "signup-light" });
    trackGA4("paiement_started", { rome_code: form.secteur, source: "signup-light" });
    trackFunnel({ event_name: "lead_payment_clicked", rome_code: form.secteur, experience: form.experience, email_hash: form.contact, source: "signup-light", metadata: { tier: "4.99", step: "payment" } });
    try {
      const contact = form.contact || localStorage.getItem("axiom_contact") || "";
      const isEmailContact = contact.includes("@");
      const { data, error } = await supabase.functions.invoke("create-payment-lead", {
        body: {
          email:      isEmailContact ? contact : undefined,
          metier:     selectedSecteur?.metier ?? selectedSecteur?.label ?? "",
          rome_code:  form.secteur,
          experience: form.experience,
          source:     "signup-light",
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Erreur paiement");
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Erreur paiement", description: err.message, variant: "destructive" });
      setPaymentLoading(false);
    }
  };

  const handleFullPayment = async () => {
    setFullPaymentLoading(true);
    trackGA4("paiement_29_started", { rome_code: form.secteur, source: "signup-light-full" });
    trackGA4("paiement_started", { rome_code: form.secteur, source: "signup-light-full" });
    trackFunnel({ event_name: "lead_payment_clicked", rome_code: form.secteur, experience: form.experience, email_hash: form.contact, source: "signup-light-full", metadata: { tier: "29", step: "payment_full" } });
    try {
      const contact = form.contact || localStorage.getItem("axiom_contact") || "";
      const isEmailContact = contact.includes("@");
      const { data, error } = await supabase.functions.invoke("create-payment-lead", {
        body: {
          email:      isEmailContact ? contact : undefined,
          metier:     selectedSecteur?.metier ?? selectedSecteur?.label ?? "",
          rome_code:  form.secteur,
          experience: form.experience,
          source:     "signup-light",
          tier:       "full",
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Erreur paiement");
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Erreur paiement", description: err.message, variant: "destructive" });
      setFullPaymentLoading(false);
    }
  };

  // Step-specific CTA labels
  const ctaLabel = useMemo(() => {
    switch (funnelStep) {
      case "contact": return "Continuer mon évaluation d'éligibilité";
      case "secteur": return "Continuer — affiner mon profil";
      case "experience": return "Continuer — presque terminé";
      case "pays": return "Valider et voir mon score";
      case "confirm": return loading ? "Analyse en cours…" : "Obtenir mon score IA maintenant";
      default: return "Continuer";
    }
  }, [funnelStep, loading]);

  const isFormStep = funnelStep !== "score";

  const showConfetti = funnelStep === "score";

  return (
    <div className="min-h-screen flex flex-col bg-hero-gradient relative overflow-hidden">
      <ConfettiCanvas trigger={showConfetti} />
      <Helmet>
        <title>Inscription talent rapide – AXIOM & ALTIS | Travaillez en France</title>
        <meta name="description" content="Inscrivez-vous en 2 min sans mot de passe. Score de compatibilité IA gratuit pour les métiers en tension en France : BTP, santé, CHR, logistique. Certification MINEFOP + Pack ALTIS visa." />
        <link rel="canonical" href="https://axiom-talents.com/signup-light" />
        <meta property="og:title" content="Inscription talent rapide – AXIOM & ALTIS" />
        <meta property="og:description" content="Score IA gratuit + certification MINEFOP. Inscription sans mot de passe en 2 min pour travailler en France." />
        <meta property="og:url" content="https://axiom-talents.com/signup-light" />
      </Helmet>

      {/* Animated network background */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <Suspense fallback={null}>
          <NetworkCanvas nodeCount={30} maxDistance={140} color="187, 94%, 43%" color2="221, 83%, 53%" />
        </Suspense>
      </div>
      <div className="absolute inset-0 opacity-[0.06] bg-hero-dots pointer-events-none" />

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 max-w-md mx-auto w-full">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-accent/15 border border-accent/30">
            <Zap className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="font-black text-lg text-white tracking-tight">AXIOM</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">TALENTS</span>
        </Link>
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/8 text-sm border border-white/10">
            Se connecter
          </Button>
        </Link>
      </div>

      {/* ── Progressive progress bar ──────────────────────── */}
      <div className="px-5 pb-1 max-w-md mx-auto w-full">
        <div className="h-1.5 w-full rounded-full overflow-hidden bg-white/[0.08]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(221 83% 40%), hsl(187 94% 43%))" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.7, ease }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] text-white/40 font-medium">
            {progress}% complété
          </p>
          <p className="text-[10px] text-accent/60 font-semibold">
            {funnelStep === "score" ? "Résultat prêt ✓" : `Étape ${["contact", "secteur", "experience", "pays", "confirm"].indexOf(funnelStep) + 1}/5`}
          </p>
        </div>
      </div>

      {/* ── Motivational message ──────────────────────────── */}
      <div className="px-5 pb-3 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={funnelStep}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.35 }}
            className="flex items-start gap-2 px-3 py-2 rounded-xl bg-accent/[0.06] border border-accent/15"
          >
            {funnelStep === "score" ? (
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-accent" />
            )}
            <p className="text-xs leading-relaxed text-white/60">
              {motivationalMessage}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-3 sm:px-4 py-2 pb-12">
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════
              FORM STEPS (contact → secteur → experience → pays → confirm)
          ══════════════════════════════════════════════════ */}
          {isFormStep && (
            <motion.div
              key={`form-${funnelStep}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease }}
              className="w-full max-w-md"
            >
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl dark-surface">
                <div className="h-1 w-full bg-gradient-cta" />
                <div className="p-4 sm:p-8">

                  {/* ── Premium banner ── */}
                  <AnimatePresence>
                    {isPremium && premiumSecteur && funnelStep === "contact" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.45, ease }}
                        className="mb-6 rounded-2xl overflow-hidden bg-success/[0.08] border border-success/30"
                      >
                        <div className="h-px w-full bg-gradient-to-r from-success to-accent" />
                        <div className="px-4 py-3.5 flex items-center gap-3">
                          <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-success/15 border border-success/30">
                            <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold leading-tight text-success">
                              ✓ Accès premium inclus — Analyse Complète débloquée
                            </p>
                            <p className="text-xs mt-0.5 truncate text-success/60">
                              {premiumSecteur.label} · Code ROME <span className="font-mono font-semibold text-success/80">{premiumRome}</span>
                            </p>
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-success/10 border border-success/25">
                            <span className="text-base font-extrabold leading-none text-success">{premiumScore}%</span>
                            <span className="text-[9px] font-semibold uppercase tracking-wide leading-tight text-success/50">match</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Step Header ── */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 text-xs font-bold bg-accent/10 border border-accent/20 text-accent">
                      <Zap className="h-3 w-3" />
                      {funnelStep === "contact" && "Inscription gratuite · 45 secondes"}
                      {funnelStep === "secteur" && "Étape 2 · Votre métier"}
                      {funnelStep === "experience" && "Étape 3 · Votre expérience"}
                      {funnelStep === "pays" && "Étape 4 · Pays de résidence"}
                      {funnelStep === "confirm" && "Dernière étape · Validation"}
                    </div>
                    <h1 className="font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                      {funnelStep === "contact" && "Votre profil talent en France"}
                      {funnelStep === "secteur" && "Dans quel secteur travaillez-vous ?"}
                      {funnelStep === "experience" && "Quelle est votre expérience ?"}
                      {funnelStep === "pays" && "Votre pays de résidence"}
                      {funnelStep === "confirm" && "Validez votre évaluation"}
                    </h1>
                    <p className="text-white/45 text-sm mt-2">
                      {funnelStep === "contact" && "Score IA · Matching ROME certifié · Offres France Travail"}
                      {funnelStep === "secteur" && "Sélectionnez le secteur correspondant à votre expertise."}
                      {funnelStep === "experience" && "Votre expérience augmente votre score de compatibilité."}
                      {funnelStep === "pays" && "Cette information nous aide à personnaliser votre parcours."}
                      {funnelStep === "confirm" && "Acceptez les conditions pour découvrir votre score."}
                    </p>
                  </div>

                  {/* ── Social login (only on contact step) ── */}
                  {funnelStep === "contact" && (
                    <>
                      <div className="space-y-2.5 mb-6">
                        <Button
                          type="button"
                          className="w-full h-12 rounded-xl font-semibold text-sm flex items-center gap-2.5 justify-center bg-white/[0.06] border border-white/12 text-white hover:bg-white/10"
                          disabled={oauthLoading !== null}
                          onClick={async () => {
                            setOauthLoading("google");
                            try {
                              const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                              if (error) toast({ title: "Problème avec Google ?", description: "Utilisez votre email ci-dessous.", variant: "destructive" });
                            } catch {
                              toast({ title: "Problème technique ?", description: "Utilisez votre email ci-dessous.", variant: "destructive" });
                            }
                            setOauthLoading(null);
                          }}
                        >
                          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          {oauthLoading === "google" ? "Connexion…" : "Continuer avec Google"}
                        </Button>
                        <Button
                          type="button"
                          className="w-full h-12 rounded-xl font-semibold text-sm flex items-center gap-2.5 justify-center bg-white/[0.06] border border-white/12 text-white hover:bg-white/10"
                          disabled={oauthLoading !== null}
                          onClick={async () => {
                            setOauthLoading("apple");
                            try {
                              const { error } = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
                              if (error) toast({ title: "Problème avec Apple ?", description: "Utilisez votre email ci-dessous.", variant: "destructive" });
                            } catch {
                              toast({ title: "Problème technique ?", description: "Utilisez votre email ci-dessous.", variant: "destructive" });
                            }
                            setOauthLoading(null);
                          }}
                        >
                          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.23.74 3.01.8.88-.15 1.93-.81 3.13-.69 1.53.14 2.68.8 3.4 2.04-3.1 1.87-2.58 5.9.69 7.04-.68 1.61-1.59 3.2-2.23 3.69zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                          </svg>
                          {oauthLoading === "apple" ? "Connexion…" : "Continuer avec Apple"}
                        </Button>
                      </div>
                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/[0.07]" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-3 text-xs bg-[hsl(222,47%,11%)] text-white/25">
                            ou avec email / téléphone
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── STEP: Contact ── */}
                  {funnelStep === "contact" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[15px] font-semibold text-white/70 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            {usePhone ? <Phone className="h-4 w-4 text-accent" /> : <Mail className="h-4 w-4 text-accent" />}
                            {usePhone ? "Téléphone" : "Email"}
                          </span>
                        </Label>
                        {usePhone ? (
                          <div className="space-y-2">
                            <PhoneInput
                              value={form.contact}
                              onChange={(fullValue, isValid) => {
                                handleChange("contact", fullValue);
                                setPhoneValid(isValid);
                              }}
                              className="[&_button]:h-14 [&_input]:h-14"
                            />
                            {form.contact.replace(/^\+\d{2,3}\s?/, "").replace(/\s/g, "").length > 3 && !phoneValid && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <Info className="h-3 w-3" /> Numéro invalide pour le pays sélectionné
                              </p>
                            )}
                            <button
                              type="button"
                              onClick={() => { setUsePhone(false); handleChange("contact", ""); }}
                              className="text-xs text-accent/70 hover:text-accent transition-colors"
                            >
                              ← Utiliser un email
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              type="email"
                              placeholder="votre@email.com"
                              value={form.contact}
                              onChange={(e) => handleChange("contact", e.target.value)}
                              autoComplete="email"
                              inputMode="email"
                              autoFocus
                              className="h-14 rounded-xl text-lg pl-4 pr-4 bg-white/5 border-white/10 text-white placeholder:text-white/25"
                            />
                            <button
                              type="button"
                              onClick={() => { setUsePhone(true); handleChange("contact", "+237 "); }}
                              className="text-xs text-accent/70 hover:text-accent transition-colors"
                            >
                              📱 Utiliser un numéro de téléphone
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── STEP: Secteur ── */}
                  {funnelStep === "secteur" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[15px] font-semibold text-white/70 flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-accent" />
                          Métier principal
                          {form.secteur && (
                            <span className="font-mono text-xs font-normal text-accent">{form.secteur}</span>
                          )}
                        </Label>
                        <Select value={form.secteur} onValueChange={(v) => handleChange("secteur", v)}>
                          <SelectTrigger className="h-14 rounded-xl text-lg text-white bg-white/5 border-white/10">
                            <SelectValue placeholder="Choisissez votre secteur…" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl max-h-[60vh] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                            {SECTEURS.map((s) => (
                              <SelectItem key={s.value} value={s.value} className="text-base py-3.5">
                                <div className="flex items-center justify-between w-full gap-3">
                                  <span>{s.label}</span>
                                  <span className="text-xs font-mono text-muted-foreground">{s.rome}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <AnimatePresence>
                          {selectedSecteur && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-sm px-1 text-accent"
                            >
                              → {selectedSecteur.metier}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* ── STEP: Experience ── */}
                  {funnelStep === "experience" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[15px] font-semibold text-white/70 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-accent" />
                          Années d'expérience
                        </Label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {EXPERIENCE_OPTIONS.map((o) => {
                            const isSelected = form.experience === o.value;
                            return (
                              <button
                                key={o.value}
                                type="button"
                                onClick={() => handleChange("experience", o.value)}
                                className={`relative h-14 rounded-xl text-center font-bold text-base transition-all duration-200 border-2 ${
                                  isSelected
                                    ? "bg-accent/15 border-accent text-accent shadow-lg shadow-accent/10"
                                    : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.97]"
                                }`}
                              >
                                <span className="block text-lg font-extrabold leading-tight">{o.label}</span>
                                <span className={`block text-[10px] font-medium mt-0.5 ${isSelected ? "text-accent/70" : "text-white/35"}`}>
                                  {o.shortLabel}
                                </span>
                                {isSelected && (
                                  <motion.div
                                    layoutId="exp-check"
                                    className="absolute top-1.5 right-1.5"
                                    initial={false}
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-accent" />
                                  </motion.div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <AnimatePresence>
                          {selectedExp && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-1.5 px-1"
                            >
                              <span className="text-sm text-tension/80">⚡</span>
                              <p className="text-sm font-medium text-tension/80">
                                {selectedExp.teaser}{form.secteur ? ` (${SECTOR_TENSION[form.secteur] ?? ""})` : ""}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Inline score teaser */}
                      {form.secteur && form.experience && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-2xl overflow-hidden bg-accent/[0.06] border border-accent/20"
                        >
                          <div className="px-4 py-3 flex items-center gap-3">
                            <div className="relative w-12 h-12 shrink-0">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                                <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                                <motion.circle
                                  cx="28" cy="28" r="23"
                                  fill="none"
                                  stroke="hsl(var(--accent))"
                                  strokeWidth="4"
                                  strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 23}`}
                                  strokeDashoffset={`${2 * Math.PI * 23}`}
                                  animate={{ strokeDashoffset: `${2 * Math.PI * 23 * (1 - score / 100)}` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-black text-sm text-white">{score}%</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white">Score IA estimé</p>
                              <p className="text-xs mt-0.5 text-white/45">
                                Complétez le formulaire pour le score détaillé
                              </p>
                            </div>
                            <Sparkles className="h-4 w-4 text-accent/60 shrink-0" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* ── STEP: Pays ── */}
                  {funnelStep === "pays" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[15px] font-semibold text-white/70 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-accent" />
                          Pays de résidence
                        </Label>
                        <Select value={form.pays} onValueChange={(v) => handleChange("pays", v)}>
                          <SelectTrigger className="h-14 rounded-xl text-lg text-white bg-white/5 border-white/10">
                            <SelectValue placeholder="Sélectionnez votre pays…">
                              {form.pays && (
                                <span className="flex items-center gap-2">
                                  <span className="text-lg">{PAYS_OPTIONS.find(p => p.value === form.pays)?.flag}</span>
                                  {form.pays}
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)]">
                            {PAYS_OPTIONS.map((p) => (
                              <SelectItem key={p.value} value={p.value} className="text-base py-3.5">
                                <span className="flex items-center gap-2.5">
                                  <span className="text-lg">{p.flag}</span>
                                  {p.value}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Summary so far */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl p-3 space-y-1.5 bg-white/[0.04] border border-white/[0.07]"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Récapitulatif</p>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Briefcase className="h-3 w-3 text-accent" />
                          {selectedSecteur?.label}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <TrendingUp className="h-3 w-3 text-accent" />
                          {selectedExp?.label} d'expérience
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* ── STEP: Confirm (RGPD + submit) ── */}
                  {funnelStep === "confirm" && (
                    <div className="space-y-4">
                      {/* Full recap */}
                      <div className="rounded-xl p-4 space-y-2 bg-white/[0.04] border border-white/[0.07]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Votre profil</p>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          {usePhone ? <Phone className="h-3 w-3 text-accent" /> : <Mail className="h-3 w-3 text-accent" />}
                          {form.contact}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Briefcase className="h-3 w-3 text-accent" />
                          {selectedSecteur?.label}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <TrendingUp className="h-3 w-3 text-accent" />
                          {selectedExp?.label} d'expérience
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <MapPin className="h-3 w-3 text-accent" />
                          {PAYS_OPTIONS.find(p => p.value === form.pays)?.flag} {form.pays}
                        </div>
                      </div>

                      {/* Score preview */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl overflow-hidden bg-accent/[0.06] border border-accent/20"
                      >
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="relative w-14 h-14 shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                              <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                              <motion.circle
                                cx="28" cy="28" r="23"
                                fill="none"
                                stroke="hsl(var(--accent))"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 23}`}
                                strokeDashoffset={`${2 * Math.PI * 23}`}
                                animate={{ strokeDashoffset: `${2 * Math.PI * 23 * (1 - score / 100)}` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="font-black text-base text-white">{score}%</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">
                              Score IA estimé : {score}%
                            </p>
                            <p className="text-xs mt-0.5 text-white/45">
                              Validez pour voir le détail complet
                            </p>
                          </div>
                          <Sparkles className="h-5 w-5 text-accent/60 shrink-0" />
                        </div>
                      </motion.div>

                      {/* RGPD */}
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                        <Checkbox
                          id="rgpd"
                          checked={rgpd}
                          onCheckedChange={(v) => {
                            setRgpd(v as boolean);
                            if (v) trackGA4("rgpd_accepted", { source: "signup-light" });
                          }}
                          className="mt-0.5 h-5 w-5"
                        />
                        <label htmlFor="rgpd" className="text-sm text-white/45 leading-relaxed cursor-pointer">
                          J'accepte la{" "}
                          <Link to="/rgpd-light" className="font-semibold text-accent hover:underline" target="_blank">
                            politique RGPD & CGU
                          </Link>{" "}
                          — CCT 2021 UE.
                        </label>
                      </div>
                    </div>
                  )}

                  {/* ── CTA Button (all form steps) ── */}
                  <div className="mt-6 relative group/cta">
                    <Button
                      type="button"
                      size="lg"
                      disabled={loading || (funnelStep === "confirm" && !rgpd)}
                      onClick={advanceToNextStep}
                      className="w-full h-16 text-lg rounded-xl font-bold shadow-xl py-4 group relative overflow-hidden bg-gradient-cta border-0 text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:saturate-0"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-cta-hover" />
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Analyse en cours…
                          </>
                        ) : (
                          <>
                            {ctaLabel}
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </span>
                    </Button>
                    {funnelStep === "confirm" && !rgpd && (
                      <p className="text-xs text-center text-white/40 mt-2 flex items-center justify-center gap-1">
                        <Lock className="h-3 w-3" />
                        Acceptez les CGU pour continuer
                      </p>
                    )}
                    {funnelStep !== "contact" && (
                      <button
                        type="button"
                        onClick={() => {
                          const steps: FunnelStep[] = ["contact", "secteur", "experience", "pays", "confirm"];
                          const idx = steps.indexOf(funnelStep);
                          if (idx > 0) setFunnelStep(steps[idx - 1]);
                        }}
                        className="w-full text-center text-xs mt-3 py-1 text-white/30 hover:text-white/50 transition-colors"
                      >
                        ← Étape précédente
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Trust strip */}
              <div className="mt-4 flex items-center justify-center gap-5 text-xs text-white/30">
                <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> RGPD conforme</span>
                <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> SSL chiffré</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> 100% gratuit</span>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════
              STEP: SCORE + UPSELL (95%)
          ══════════════════════════════════════════════════ */}
          {funnelStep === "score" && (
            <motion.div
              key="score"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease }}
              className="w-full max-w-md space-y-4"
            >

              {/* ── Score card ── */}
              <div className="rounded-3xl overflow-hidden shadow-2xl dark-surface">
                <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-success" />
                <div className="p-6 sm:p-8">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-5 text-xs font-bold bg-success/10 border border-success/25 text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Profil analysé avec succès — 95 %
                    </div>

                    {/* Score circle */}
                    <div className="relative w-36 h-36 mx-auto mb-5">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                        <motion.circle
                          cx="60" cy="60" r="52"
                          fill="none"
                          stroke="url(#scoreGradAlt)"
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 52}`}
                          strokeDashoffset={`${2 * Math.PI * 52}`}
                          animate={{ strokeDashoffset: `${2 * Math.PI * 52 * (1 - score / 100)}` }}
                          transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                        />
                        <defs>
                          <linearGradient id="scoreGradAlt" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(221,83%,38%)" />
                            <stop offset="100%" stopColor="hsl(187,94%,43%)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                          className="font-black text-4xl text-white"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1, duration: 0.4 }}
                        >
                          {score}%
                        </motion.span>
                        <span className="text-[10px] font-medium mt-0.5 text-white/40">Score global</span>
                      </div>
                    </div>

                    <h2 className="font-black text-xl text-white mb-1">
                      Excellent profil {selectedSecteur?.metier?.split("/")[0]?.trim() ?? ""}
                    </h2>
                    {selectedExp && (
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="text-xs font-semibold mb-2 text-tension"
                      >
                        ⚡ {selectedExp.teaser}{form.secteur ? ` (${SECTOR_TENSION[form.secteur] ?? ""})` : ""}
                      </motion.p>
                    )}
                    <p className="text-sm leading-relaxed mb-2 text-white/50">
                      Votre profil <span className="font-semibold text-white">{selectedSecteur?.metier?.split("/")[0]?.trim() ?? selectedSecteur?.label ?? ""}</span>
                      {form.secteur && <span className="font-mono text-accent"> ({form.secteur})</span>}
                      {form.experience && <span className="text-white/70"> {selectedExp?.label}</span>} match{" "}
                      <span className="font-bold text-accent">
                        {Math.max(score - 7, 60)}–{score} %
                      </span>{" "}
                      sur offres en tension France
                    </p>
                    <p className="text-xs text-white/30">
                      Vérifiez votre email pour activer votre compte AXIOM.
                    </p>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2.5 mt-6">
                    {[
                      { icon: TrendingUp, label: "Matching", value: score >= 80 ? "Élevé" : "Bon",   color: "text-success", bg: "bg-success/[0.08]" },
                      { icon: Award,      label: "MINEFOP",  value: "Éligible",                      color: "text-accent", bg: "bg-accent/[0.08]"  },
                      { icon: Star,       label: "Priorité", value: score >= 85 ? "Haute" : "Normale", color: "text-tension", bg: "bg-tension/[0.08]" },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className={`rounded-xl p-3 text-center ${s.bg}`}>
                          <Icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                          <p className="text-[10px] text-white/40">{s.label}</p>
                          <p className="text-xs font-bold text-white">{s.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Share buttons */}
                  {(() => {
                    const shareText = `🚀 Mon score AXIOM Talents : ${score}% de compatibilité pour travailler en France en ${selectedSecteur?.label?.replace(/^.+?\s/, "") ?? "mon secteur"} !`;
                    const shareUrl = "https://axiom-talents.com/signup-light";
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6, duration: 0.4 }}
                        className="mt-5 space-y-2"
                      >
                        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-1">Partagez · +30 % visibilité recruteurs</p>
                        <div className="grid grid-cols-3 gap-2">
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n✅ Métier en tension · Matching ROME certifié\n📊 Faites votre test gratuit → ${shareUrl}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.97] bg-[#25D366]/10 border border-[#25D366]/25 hover:bg-[#25D366]/15"
                          >
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#25D366">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <span className="text-xs font-bold text-[#25D366]">WhatsApp</span>
                          </a>
                          <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.97] bg-[#0A66C2]/10 border border-[#0A66C2]/25 hover:bg-[#0A66C2]/15"
                          >
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#0A66C2">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <span className="text-xs font-bold text-[#0A66C2]">LinkedIn</span>
                          </a>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.97] bg-[#1877F2]/10 border border-[#1877F2]/25 hover:bg-[#1877F2]/15"
                          >
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#1877F2">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span className="text-xs font-bold text-[#1877F2]">Facebook</span>
                          </a>
                        </div>
                      </motion.div>
                    );
                  })()}
                </div>
              </div>

              {/* ── Offres teasées ── */}
              <div className="rounded-3xl overflow-hidden shadow-xl dark-surface">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="h-4 w-4 text-accent" />
                    <h3 className="font-bold text-sm text-white">3 offres disponibles pour vous</h3>
                    <Badge className="ml-auto text-[10px] bg-accent/10 text-accent border border-accent/20">Aperçu</Badge>
                  </div>
                  <div className="space-y-2.5">
                    {MOCK_OFFERS.map((offer, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl relative overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                        {i > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl bg-[hsl(222,47%,11%)]/70 backdrop-blur-sm">
                            <div className="flex items-center gap-1.5 text-white/35">
                              <Lock className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">Débloquer</span>
                            </div>
                          </div>
                        )}
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-lg bg-primary/15">
                          {offer.sector}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{offer.title}</p>
                          <p className="text-[10px] flex items-center gap-1 mt-0.5 text-white/40">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            {offer.location} · {offer.salary}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className="text-[10px] font-bold bg-success/10 text-success border border-success/25">{offer.score}%</Badge>
                          <span className="text-[9px] font-medium text-white/30">{offer.contract}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── CTA: Débloquer résultat ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.5 }}
                className="rounded-3xl overflow-hidden shadow-xl bg-[hsl(222,47%,11%)] border border-accent/20"
              >
                <div className="h-px w-full bg-gradient-cta" />
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-accent/10 border border-accent/20">
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">Votre score IA complet est prêt.</p>
                      <p className="text-xs mt-1 leading-relaxed text-white/45">
                        Pour débloquer le PDF détaillé + priorité recruteurs modérée + accès à vos offres personnalisées, payez 4,99&nbsp;€ (une seule fois).
                      </p>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-14 text-base rounded-xl font-bold shadow-md group relative overflow-hidden bg-gradient-cta border-0 text-white animate-micro-pulse"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-cta-hover" />
                    <span className="relative flex items-center justify-center gap-2">
                      Débloquer mon résultat maintenant – 4,99&nbsp;€
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Button>

                  <p className="text-center text-[10px] mt-2 text-white/25">
                    🔒 Paiement sécurisé Stripe · Résultat immédiat
                  </p>

                  <button
                    onClick={() => window.location.href = "/dashboard-talent"}
                    className="w-full text-center text-xs mt-3 py-2 transition-colors hover:underline text-white/30"
                  >
                    Continuer gratuitement (version limitée) →
                  </button>
                </div>
              </motion.div>

              {/* Footer */}
              <p className="text-center text-[11px] pb-2 text-white/20">
                Vos données protégées (RGPD) · Contact DPO :{" "}
                <a href="mailto:rgpd@axiom-talents.com" className="hover:underline text-accent/50">
                  rgpd@axiom-talents.com
                </a>
              </p>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════
          Payment Dialog — Elegant non-aggressive popup
      ══════════════════════════════════════════════════ */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-sm rounded-3xl border-accent/20 bg-[hsl(222,47%,9%)] text-white shadow-2xl p-0 overflow-hidden">
          <div className="h-1 w-full bg-gradient-cta" />
          <div className="p-6 space-y-5">
            <DialogHeader className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center bg-accent/10 border border-accent/20">
                <Award className="h-8 w-8 text-accent" />
              </div>
              <DialogTitle className="font-black text-xl text-white">
                Votre score IA complet est prêt.
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-white/50">
                Pour débloquer le PDF détaillé + priorité recruteurs modérée + accès à vos offres personnalisées, payez 4,99&nbsp;€ (une seule fois).
              </DialogDescription>
            </DialogHeader>

            {/* Option 4,99 € */}
            <button
              onClick={handlePremiumPayment}
              disabled={paymentLoading}
              className="w-full text-left p-4 rounded-2xl border-2 border-accent/30 bg-accent/[0.06] hover:bg-accent/[0.12] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white">Débloquer mon résultat maintenant</span>
                <span className="font-black text-lg text-accent">4,99&nbsp;€</span>
              </div>
              <div className="space-y-1">
                {["PDF score détaillé", "Priorité recruteurs modérée", "Offres personnalisées", "Résultat immédiat"].map(i => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-white/50">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
                    {i}
                  </div>
                ))}
              </div>
              {paymentLoading && (
                <div className="mt-2 flex items-center gap-2 text-xs text-accent">
                  <span className="h-3 w-3 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                  Redirection Stripe…
                </div>
              )}
            </button>

            {/* Option 29 € */}
            <button
              onClick={handleFullPayment}
              disabled={fullPaymentLoading}
              className="w-full text-left p-4 rounded-2xl border-2 border-success/30 bg-success/[0.06] hover:bg-success/[0.12] transition-all relative"
            >
              <Badge className="absolute -top-2 right-3 text-[10px] bg-success/20 text-success border border-success/30">Recommandé</Badge>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white">Déblocage complet</span>
                <span className="font-black text-lg text-success">29 €</span>
              </div>
              <div className="space-y-1">
                {["Score détaillé par compétence", "3–5 offres CDI matchées", "Pack ALTIS : visa + billet + logement", "Certification MINEFOP officielle", "Priorité recruteurs ×3"].map(i => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-white/50">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
                    {i}
                  </div>
                ))}
              </div>
              {fullPaymentLoading && (
                <div className="mt-2 flex items-center gap-2 text-xs text-success">
                  <span className="h-3 w-3 rounded-full border-2 border-success/30 border-t-success animate-spin" />
                  Redirection Stripe…
                </div>
              )}
            </button>

            <p className="text-center text-[10px] text-white/25">
              🔒 Paiement sécurisé Stripe · Accès immédiat après paiement
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
