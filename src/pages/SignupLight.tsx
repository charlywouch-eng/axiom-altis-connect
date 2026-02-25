import { useState } from "react";
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
  { value: "0-2",  label: "Moins de 2 ans",  teaser: "Profil junior – forte demande pour formations ALTIS" },
  { value: "2-5",  label: "2 à 5 ans",       teaser: "Profil intermédiaire très demandé en France" },
  { value: "5-10", label: "5 à 10 ans",      teaser: "Profil expérimenté – priorité recruteurs partenaires" },
  { value: "10+",  label: "Plus de 10 ans",  teaser: "Expert confirmé – accès direct entreprises premium" },
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

  const [step, setStep] = useState<"form" | "magic-sent" | "score">("form");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [rgpd, setRgpd] = useState(false);
  const [showPremiumTooltip, setShowPremiumTooltip] = useState(false);

  const [form, setForm] = useState({
    contact:    "",
    secteur:    premiumRome || "",
    experience: premiumExp  || "",
    pays:       "Cameroun",
  });

  const selectedSecteur  = SECTEURS.find((s) => s.value === form.secteur);
  const selectedExp      = EXPERIENCE_OPTIONS.find((e) => e.value === form.experience);
  const score            = Math.min(95,
    (ROME_BASE_SCORES[form.secteur] ?? 75) + (EXP_BONUS[form.experience] ?? 0)
  );

  const handleChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contact || !form.secteur || !form.experience) {
      toast({ title: "Champs manquants", description: "Merci de remplir tous les champs.", variant: "destructive" });
      return;
    }
    if (!rgpd) {
      toast({ title: "RGPD requis", description: "Vous devez accepter la politique RGPD.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const meta = {
        rome_code: form.secteur,
        rome_label: selectedSecteur?.label ?? "",
        experience: form.experience,
        country: form.pays,
        role: "talent",
      };

      if (isPhone(form.contact)) {
        localStorage.setItem("axiom_pending_profile", JSON.stringify(meta));
        localStorage.setItem("axiom_contact", form.contact);
        setStep("score");
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
        setStep("score");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePremiumPayment = async () => {
    setPaymentLoading(true);
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

  return (
    <div className="min-h-screen flex flex-col bg-hero-gradient relative overflow-hidden">
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

      {/* ── Progress bar ───────────────────────────────────── */}
      <div className="px-5 pb-3 max-w-md mx-auto w-full">
        <div className="h-0.5 w-full rounded-full overflow-hidden bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-cta"
            initial={{ width: "0%" }}
            animate={{ width: step === "form" ? "45%" : "100%" }}
            transition={{ duration: 0.6, ease }}
          />
        </div>
        <p className="text-[10px] text-white/30 mt-1.5 text-right">
          {step === "form" ? "Étape 1/2 · 45 secondes" : "Étape 2/2"}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 pb-12">
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════
              STEP 1 — FORM
          ══════════════════════════════════════════════════ */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease }}
              className="w-full max-w-md"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl dark-surface">
                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-cta" />

                <div className="p-6 sm:p-8">

                  {/* ── Premium banner ── */}
                  <AnimatePresence>
                    {isPremium && premiumSecteur && (
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

                  {/* ── Header ── */}
                  <div className="text-center mb-7">
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 text-xs font-bold bg-accent/10 border border-accent/20 text-accent">
                      <Zap className="h-3 w-3" />
                      {isPremium ? "Complétez votre inscription · 30 secondes" : "Inscription gratuite · 45 secondes"}
                    </div>
                    <h1 className="font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                      {isPremium ? "Activez votre compte premium" : "Votre profil talent en France"}
                    </h1>
                    <p className="text-white/45 text-sm mt-2">
                      Score IA · Matching ROME certifié · Offres France Travail
                    </p>
                  </div>

                  {/* ── Social login ── */}
                  <div className="space-y-2.5 mb-6">
                    <Button
                      type="button"
                      className="w-full h-12 rounded-xl font-semibold text-sm flex items-center gap-2.5 justify-center bg-white/[0.06] border border-white/12 text-white hover:bg-white/10"
                      disabled={oauthLoading !== null}
                      onClick={async () => {
                        setOauthLoading("google");
                        const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                        if (error) toast({ title: "Erreur", description: String(error), variant: "destructive" });
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
                        const { error } = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
                        if (error) toast({ title: "Erreur", description: String(error), variant: "destructive" });
                        setOauthLoading(null);
                      }}
                    >
                      <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.23.74 3.01.8.88-.15 1.93-.81 3.13-.69 1.53.14 2.68.8 3.4 2.04-3.1 1.87-2.58 5.9.69 7.04-.68 1.61-1.59 3.2-2.23 3.69zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      {oauthLoading === "apple" ? "Connexion…" : "Continuer avec Apple"}
                    </Button>
                  </div>

                  {/* ── Separator ── */}
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

                  {/* ── Form ── */}
                  <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Contact */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-white/70 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          {isPhone(form.contact) ? <Phone className="h-3.5 w-3.5 text-accent" /> : <Mail className="h-3.5 w-3.5 text-accent" />}
                          Email ou Téléphone
                        </span>
                      </Label>
                      {isPhone(form.contact) || (!form.contact && !form.contact.includes("@")) ? (
                        <div className="space-y-2">
                          <PhoneInput
                            value={form.contact}
                            onChange={(fullValue) => handleChange("contact", fullValue)}
                          />
                          <button
                            type="button"
                            onClick={() => handleChange("contact", "")}
                            className="text-xs text-accent/70 hover:text-accent transition-colors"
                          >
                            Utiliser un email à la place
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
                            className="h-12 rounded-xl text-base pl-4 pr-4 bg-white/5 border-white/10 text-white placeholder:text-white/25"
                          />
                          <button
                            type="button"
                            onClick={() => handleChange("contact", "+237 ")}
                            className="text-xs text-accent/70 hover:text-accent transition-colors"
                          >
                            Utiliser un numéro de téléphone
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Secteur ROME */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-white/70 flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-accent" />
                        Métier principal
                        {form.secteur && (
                          <span className="font-mono text-xs font-normal text-accent">{form.secteur}</span>
                        )}
                      </Label>
                      <Select value={form.secteur} onValueChange={(v) => handleChange("secteur", v)}>
                        <SelectTrigger className="h-12 rounded-xl text-base text-white bg-white/5 border-white/10">
                          <SelectValue placeholder="Choisissez votre secteur…" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {SECTEURS.map((s) => (
                            <SelectItem key={s.value} value={s.value} className="text-sm py-3">
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
                            className="text-xs px-1 text-accent"
                          >
                            → {selectedSecteur.metier}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Expérience */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-white/70 flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-accent" />
                        Années d'expérience
                      </Label>
                      <Select value={form.experience} onValueChange={(v) => handleChange("experience", v)}>
                        <SelectTrigger className="h-12 rounded-xl text-base text-white bg-white/5 border-white/10">
                          <SelectValue placeholder="Sélectionnez une tranche…" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {EXPERIENCE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-sm py-3">
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <AnimatePresence>
                        {selectedExp && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-1.5 px-1"
                          >
                            <span className="text-xs text-tension/80">⚡</span>
                            <p className="text-xs font-medium text-tension/80">
                              {selectedExp.teaser}{form.secteur ? ` (${SECTOR_TENSION[form.secteur] ?? ""})` : ""}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Pays */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-white/70 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-accent" />
                        Pays de résidence
                      </Label>
                      <Select value={form.pays} onValueChange={(v) => handleChange("pays", v)}>
                        <SelectTrigger className="h-12 rounded-xl text-base text-white bg-white/5 border-white/10">
                          <SelectValue placeholder="Sélectionnez votre pays…" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {["Cameroun", "Sénégal", "Côte d'Ivoire", "Guinée", "Mali", "Bénin", "Togo", "Burkina Faso", "Congo (RDC)", "Autre"].map((p) => (
                            <SelectItem key={p} value={p} className="text-sm py-3">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* RGPD */}
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                      <Checkbox
                        id="rgpd"
                        checked={rgpd}
                        onCheckedChange={(v) => setRgpd(v as boolean)}
                        className="mt-0.5"
                      />
                      <label htmlFor="rgpd" className="text-xs text-white/45 leading-relaxed cursor-pointer">
                        J'accepte la{" "}
                        <Link to="/rgpd-light" className="font-semibold text-accent hover:underline" target="_blank">
                          politique RGPD & CGU
                        </Link>{" "}
                        — Données traitées conformément aux CCT 2021 UE.
                      </label>
                    </div>

                    {/* CTA */}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="w-full h-13 text-base rounded-xl font-bold shadow-xl py-4 group relative overflow-hidden bg-gradient-cta border-0 text-white"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-cta-hover" />
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Analyse en cours…
                          </>
                        ) : (
                          <>
                            Voir mon score maintenant
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </span>
                    </Button>
                  </form>
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
              STEP 2 — SCORE + UPSELL
          ══════════════════════════════════════════════════ */}
          {step === "score" && (
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
                      Profil analysé avec succès
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

              {/* ── Upsell 10 € ── */}
              <div className="rounded-3xl overflow-hidden shadow-xl bg-[hsl(222,47%,11%)] border border-accent/20">
                <div className="h-px w-full bg-gradient-cta" />
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-accent/10 border border-accent/20">
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">Débloquez maintenant</p>
                      <p className="text-xs mt-0.5 leading-relaxed text-white/45">
                        Score détaillé + offres France Travail matchées + parcours ALTIS personnalisé (visa ANEF + billet + logement) — <span className="font-semibold text-accent">10 € unique</span> (analyse approfondie & priorité)
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
                      <div key={item} className="flex items-center gap-1.5 text-xs text-white/50">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* CTA 10€ */}
                  <Button
                    size="lg"
                    className="w-full h-12 text-base rounded-xl font-bold shadow-md group relative overflow-hidden bg-gradient-cta border-0 text-white"
                    onClick={handlePremiumPayment}
                    disabled={paymentLoading}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-cta-hover" />
                    <span className="relative flex items-center justify-center gap-2">
                      {paymentLoading ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Redirection Stripe…
                        </>
                      ) : (
                        <>
                          Débloquer pour 10 €
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </span>
                  </Button>

                  {/* Free CTA */}
                  <button
                    onClick={() => window.location.href = "/dashboard-talent"}
                    className="w-full text-center text-xs mt-3 py-2 transition-colors hover:underline text-white/30"
                  >
                    Continuer gratuitement (version limitée : score global sans détails) →
                  </button>

                  {/* Premium 30€ tooltip */}
                  <div className="mt-4 rounded-xl p-3 relative bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-start gap-2.5">
                      <Star className="h-3.5 w-3.5 shrink-0 mt-0.5 text-tension" />
                      <div className="flex-1">
                        <p className="text-[11px] leading-relaxed text-white/40">
                          <span className="font-bold text-white">Plus tard — Premium 30 €</span> : Badge vérifié MINEFOP/MINREX officiel + visibilité ×3 auprès des recruteurs partenaires
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPremiumTooltip(!showPremiumTooltip)}
                        className="flex-shrink-0 mt-0.5"
                      >
                        <Info className="h-3.5 w-3.5 text-white/20" />
                      </button>
                    </div>
                    <AnimatePresence>
                      {showPremiumTooltip && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 pt-2 text-[10px] leading-relaxed text-white/30 border-t border-white/[0.06]"
                        >
                          Le badge MINEFOP/MINREX certifie vos diplômes camerounais reconnus en France. Il triple votre visibilité auprès des recruteurs partenaires AXIOM et accélère l'instruction de votre visa travail.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

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
    </div>
  );
}