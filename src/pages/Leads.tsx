import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { trackFunnel } from "@/lib/trackFunnel";
import { trackGA4 } from "@/lib/ga4";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, CheckCircle2, ArrowRight, ArrowLeft, Shield, Globe,
  Sparkles, Star,
} from "lucide-react";
import { getAvatarForTalent } from "@/lib/metierAvatars";

/* ─── Data ─────────────────────────────────────────────────────── */
const METIERS = [
  { rome: "F1703", label: "Maçon qualifié",            salary: "2 200 – 2 800 €/mois", sector: "BTP",        demand: "Très forte", icon: "🏗️", base: 88 },
  { rome: "J1501", label: "Aide-soignant(e)",          salary: "2 000 – 2 500 €/mois", sector: "Santé",      demand: "Très forte", icon: "🏥", base: 86 },
  { rome: "I1308", label: "Technicien maintenance",    salary: "2 300 – 3 000 €/mois", sector: "Industrie",  demand: "Forte",      icon: "⚙️", base: 84 },
  { rome: "J1506", label: "Infirmier(ère) DE",         salary: "2 400 – 3 200 €/mois", sector: "Santé",      demand: "Très forte", icon: "🏥", base: 87 },
  { rome: "G1602", label: "Cuisinier / CHR",           salary: "2 100 – 2 600 €/mois", sector: "CHR",        demand: "Forte",      icon: "🍽️", base: 79 },
  { rome: "N4101", label: "Chauffeur routier",         salary: "2 100 – 2 700 €/mois", sector: "Logistique", demand: "Forte",      icon: "🚛", base: 81 },
  { rome: "F1702", label: "Couvreur",                  salary: "2 200 – 2 900 €/mois", sector: "BTP",        demand: "Forte",      icon: "🏗️", base: 82 },
  { rome: "A1101", label: "Ouvrier agricole",          salary: "1 800 – 2 200 €/mois", sector: "Agriculture",demand: "Forte",      icon: "🌱", base: 73 },
  { rome: "F1605", label: "Plombier-chauffagiste",     salary: "2 300 – 3 000 €/mois", sector: "BTP",        demand: "Forte",      icon: "🏗️", base: 83 },
];

const EXP_BRACKETS = [
  { label: "Moins de 2 ans", value: "0-2",  bonus: 0  },
  { label: "2 à 5 ans",      value: "2-5",  bonus: 4  },
  { label: "5 à 10 ans",     value: "5-10", bonus: 7  },
  { label: "Plus de 10 ans", value: "10+",  bonus: 10 },
];

const DIPLOMES = [
  { value: "CQP",     label: "CQP (Certificat de Qualification Professionnelle)" },
  { value: "DQP",     label: "DQP (Diplôme de Qualification Professionnelle)" },
  { value: "BAC_PRO", label: "Bac Pro / BEP / CAP" },
  { value: "BTS",     label: "BTS / DUT / Licence" },
  { value: "MASTER",  label: "Master / Ingénieur" },
  { value: "AUTRE",   label: "Autre formation" },
];

const PAYS = [
  "Cameroun", "Sénégal", "Côte d'Ivoire", "Mali", "Guinée",
  "Burkina Faso", "Togo", "Bénin", "Niger", "Congo (RDC)",
  "Congo (Brazzaville)", "Gabon", "Madagascar", "Tunisie", "Maroc", "Autre",
];

// Score: 40% compétences métier, 25% expérience, 20% visa, 15% intégration
function calcScore(rome: string, exp: string, diplome: string): number {
  const metier = METIERS.find(m => m.rome === rome);
  const expBracket = EXP_BRACKETS.find(e => e.value === exp);

  // 40% compétences → base du métier normalisé
  const competenceScore = ((metier?.base ?? 70) / 100) * 40;

  // 25% expérience
  const expScore = exp === "10+" ? 25 : exp === "5-10" ? 20 : exp === "2-5" ? 15 : 8;

  // 20% éligibilité visa (diplôme impact)
  const visaScore = ["CQP", "DQP", "BAC_PRO"].includes(diplome) ? 18
    : ["BTS", "MASTER"].includes(diplome) ? 20 : 12;

  // 15% intégration/logement (fixed for now)
  const integrationScore = 12;

  return Math.min(95, Math.round(competenceScore + expScore + visaScore + integrationScore + (expBracket?.bonus ?? 0)));
}

function getScoreLabel(score: number) {
  if (score >= 85) return { label: "Excellent potentiel", color: "hsl(158,64%,42%)" };
  if (score >= 75) return { label: "Très bon potentiel",  color: "hsl(189,94%,43%)" };
  if (score >= 65) return { label: "Bon potentiel",       color: "hsl(221,83%,53%)" };
  return             { label: "Potentiel confirmé",        color: "hsl(45,93%,47%)" };
}

/* ─── Shared styles ────────────────────────────────────────────── */
const cardBg = "hsl(0,0%,100%,0.04)";
const cardBorder = "hsl(0,0%,100%,0.09)";
const textPrimary = "hsl(0,0%,97%)";
const textSecondary = "hsl(215,25%,62%)";
const textMuted = "hsl(215,25%,45%)";
const accentColor = "hsl(189,94%,43%)";
const bleuSouverain = "hsl(221,83%,53%)";

/* ─── Component ────────────────────────────────────────────────── */
export default function Leads() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedMetier, setSelectedMetier] = useState<typeof METIERS[0] | null>(null);
  const [_paymentLoading, setPaymentLoading] = useState(false);
  const [fullPaymentLoading, setFullPaymentLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", experience: "", diplome: "", pays: "",
    emailOrPhone: "", rgpd: false,
  });

  const utmSource   = searchParams.get("utm_source");
  const utmMedium   = searchParams.get("utm_medium");
  const utmCampaign = searchParams.get("utm_campaign");

  // Pre-fill from URL
  useEffect(() => {
    const metier = searchParams.get("metier");
    const canceled = searchParams.get("canceled");
    if (metier) {
      const found = METIERS.find(m => m.rome === metier);
      if (found) { setSelectedMetier(found); setStep(2); }
    }
    if (canceled === "true") {
      toast({ title: "Paiement annulé", description: "Vous pouvez réessayer à tout moment." });
    }
  }, [searchParams, toast]);

  /* ─── Step 1: Select métier ────────────────────────────────── */
  const handleSelectMetier = (metier: typeof METIERS[0]) => {
    setSelectedMetier(metier);
    setStep(2);
    trackGA4("metier_selected", { rome_code: metier.rome });
  };

  /* ─── Step 2: Submit form → calculate score ────────────────── */
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({ title: "Champ requis", description: "Entrez votre nom et prénom.", variant: "destructive" }); return;
    }
    if (!form.experience) {
      toast({ title: "Champ requis", description: "Sélectionnez vos années d'expérience.", variant: "destructive" }); return;
    }
    if (!form.diplome) {
      toast({ title: "Champ requis", description: "Sélectionnez votre diplôme.", variant: "destructive" }); return;
    }
    if (!form.pays) {
      toast({ title: "Champ requis", description: "Sélectionnez votre pays.", variant: "destructive" }); return;
    }
    if (!form.emailOrPhone.trim()) {
      toast({ title: "Champ requis", description: "Entrez votre email ou téléphone.", variant: "destructive" }); return;
    }
    if (!form.rgpd) {
      toast({ title: "Consentement requis", description: "Acceptez la politique RGPD.", variant: "destructive" }); return;
    }

    setLoading(true);
    const calculatedScore = calcScore(selectedMetier!.rome, form.experience, form.diplome);

    try {
      await (supabase.from as any)("leads").insert({
        email_or_phone:     form.emailOrPhone.trim(),
        metier:             selectedMetier?.label ?? "",
        rome_code:          selectedMetier?.rome ?? "",
        experience_bracket: form.experience,
        score_mock:         calculatedScore,
        rgpd_consent:       true,
        utm_source:         utmSource,
        utm_medium:         utmMedium,
        utm_campaign:       utmCampaign,
        status:             "a_contacter",
      });
    } catch (err) {
      console.error("Lead save:", err);
    }

    setScore(calculatedScore);
    setLoading(false);
    setStep(3);
    trackGA4("score_viewed", { rome_code: selectedMetier?.rome, score: calculatedScore });
    trackFunnel({
      event_name: "lead_form_submitted",
      rome_code: selectedMetier?.rome ?? "",
      experience: form.experience,
      email_hash: form.emailOrPhone,
      source: "leads",
      metadata: { utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign },
    });
  };

  /* ─── Payment handlers ─────────────────────────────────────── */
  const handlePayment = async (tier: "test" | "full") => {
    const setLoader = tier === "full" ? setFullPaymentLoading : setPaymentLoading;
    setLoader(true);
    trackGA4("paiement_started", { rome_code: selectedMetier?.rome, source: `leads_${tier}` });
    try {
      const email = form.emailOrPhone.includes("@") ? form.emailOrPhone : undefined;
      const { data, error } = await supabase.functions.invoke("create-payment-lead", {
        body: {
          email,
          metier: selectedMetier?.label ?? "",
          rome_code: selectedMetier?.rome ?? "",
          experience: form.experience,
          source: "leads",
          ...(tier === "full" ? { tier: "full" } : {}),
        },
      });
      if (error) throw error;
      if (data?.url) {
        trackFunnel({
          event_name: "lead_payment_clicked",
          rome_code: selectedMetier?.rome ?? "",
          experience: form.experience,
          email_hash: form.emailOrPhone,
          source: "leads",
        });
        window.location.href = data.url;
      } else throw new Error("Aucune URL Stripe reçue");
    } catch (err: any) {
      toast({ title: "Erreur de paiement", description: err.message ?? "Réessayez.", variant: "destructive" });
    } finally {
      setLoader(false);
    }
  };

  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score);
  const circumference = 2 * Math.PI * 44;
  const isAxiomReady = score >= 70;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, hsl(222,47%,7%) 0%, hsl(221,83%,14%) 60%, hsl(189,94%,10%) 100%)" }}>
      <Helmet>
        <title>Test d'éligibilité gratuit – AXIOM & ALTIS | Travaillez en France</title>
        <meta name="description" content="Testez gratuitement votre éligibilité au marché français. Choisissez votre métier, évaluez votre profil, obtenez votre score IA." />
        <link rel="canonical" href="https://axiom-talents.com/leads" />
      </Helmet>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b safe-top" style={{ background: "hsl(222,47%,7%,0.88)", backdropFilter: "blur(14px)", borderColor: "hsl(0,0%,100%,0.07)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}18` }}>
              <Zap className="h-4 w-4" style={{ color: accentColor }} />
            </div>
            <span className="font-bold text-sm tracking-wide" style={{ color: textPrimary }}>
              AXIOM <span style={{ color: accentColor }}>×</span> ALTIS
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:block" style={{ color: textMuted }}>Déjà inscrit ?</span>
            <Button variant="outline" size="sm" className="text-xs h-8" style={{ borderColor: cardBorder, color: textSecondary }} asChild>
              <Link to="/login">Connexion</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{ background: step >= s ? accentColor : "hsl(0,0%,100%,0.08)" }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-center" style={{ color: textMuted }}>
          Étape {step}/3 · {step === 1 ? "Choisissez votre métier" : step === 2 ? "Complétez votre profil" : "Votre résultat"}
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ═══════════════ STEP 1 : MÉTIER CARDS ═══════════════ */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }} className="max-w-5xl mx-auto px-4 pb-16">
            <div className="text-center mb-8 mt-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: textPrimary }}>
                Quel métier visez-vous <span style={{ color: accentColor }}>en France ?</span>
              </h1>
              <p className="text-sm max-w-lg mx-auto" style={{ color: textSecondary }}>
                Sélectionnez le poste qui correspond à votre expérience. Nos offres concernent les métiers en tension les plus demandés.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {METIERS.map((m, i) => (
                <motion.button
                  key={m.rome}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelectMetier(m)}
                  className="group text-left rounded-2xl border p-0 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10"
                  style={{ background: cardBg, borderColor: cardBorder }}
                >
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={getAvatarForTalent(m.rome, i)}
                      alt={m.label}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-sm font-bold text-white">{m.label}</p>
                      <p className="text-[11px] text-white/70">ROME {m.rome}</p>
                    </div>
                    <Badge
                      className="absolute top-2 right-2 text-[9px] font-bold"
                      style={{
                        background: m.demand === "Très forte" ? "hsl(0,70%,50%,0.85)" : "hsl(45,93%,47%,0.85)",
                        color: "white", border: "none",
                      }}
                    >
                      {m.demand}
                    </Badge>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium" style={{ color: accentColor }}>{m.salary}</p>
                      <p className="text-[10px]" style={{ color: textMuted }}>{m.sector} · France</p>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accentColor }} />
                  </div>
                </motion.button>
              ))}
            </div>

            <p className="text-center text-xs mt-6" style={{ color: textMuted }}>
              🔒 Évaluation 100 % gratuite · Sans engagement · Résultats immédiats
            </p>
          </motion.div>
        )}

        {/* ═══════════════ STEP 2 : FORMULAIRE ═══════════════ */}
        {step === 2 && selectedMetier && (
          <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="max-w-lg mx-auto px-4 pb-16 mt-4">

            {/* Back + selected métier */}
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs mb-4 hover:underline" style={{ color: textSecondary }}>
              <ArrowLeft className="h-3.5 w-3.5" /> Changer de métier
            </button>

            <div className="flex items-center gap-3 rounded-xl p-3 mb-6 border" style={{ background: cardBg, borderColor: `${accentColor}33` }}>
              <img src={getAvatarForTalent(selectedMetier.rome, 0)} alt={selectedMetier.label} className="h-12 w-12 rounded-lg object-cover" />
              <div>
                <p className="text-sm font-bold" style={{ color: textPrimary }}>{selectedMetier.label}</p>
                <p className="text-[11px]" style={{ color: accentColor }}>ROME {selectedMetier.rome} · {selectedMetier.salary}</p>
              </div>
            </div>

            <div className="rounded-2xl p-6 sm:p-8 border" style={{ background: cardBg, borderColor: cardBorder }}>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5" style={{ color: accentColor }} />
                <h2 className="text-lg font-bold" style={{ color: textPrimary }}>
                  Complétez votre profil
                </h2>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                {/* Nom + Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: textSecondary }}>Prénom *</label>
                    <Input
                      placeholder="Jean"
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className="h-11 rounded-xl"
                      style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: textSecondary }}>Nom *</label>
                    <Input
                      placeholder="Dupont"
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className="h-11 rounded-xl"
                      style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }}
                    />
                  </div>
                </div>

                {/* Expérience */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: textSecondary }}>
                    Années d'expérience en {selectedMetier.label.toLowerCase()} *
                  </label>
                  <Select value={form.experience} onValueChange={v => setForm(f => ({ ...f, experience: v }))}>
                    <SelectTrigger className="h-11 rounded-xl" style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }}>
                      <SelectValue placeholder="Sélectionnez…" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXP_BRACKETS.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Diplôme */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: textSecondary }}>
                    Diplôme / Formation *
                  </label>
                  <Select value={form.diplome} onValueChange={v => setForm(f => ({ ...f, diplome: v }))}>
                    <SelectTrigger className="h-11 rounded-xl" style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }}>
                      <SelectValue placeholder="Sélectionnez votre diplôme…" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIPLOMES.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pays */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: textSecondary }}>
                    Pays de résidence *
                  </label>
                  <Select value={form.pays} onValueChange={v => setForm(f => ({ ...f, pays: v }))}>
                    <SelectTrigger className="h-11 rounded-xl" style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }}>
                      <SelectValue placeholder="Sélectionnez votre pays…" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYS.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Email / Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" style={{ color: textSecondary }}>
                    Email ou téléphone *
                  </label>
                  <Input
                    placeholder="exemple@email.com ou +237 6XX XXX XXX"
                    value={form.emailOrPhone}
                    onChange={e => setForm(f => ({ ...f, emailOrPhone: e.target.value }))}
                    inputMode="email"
                    autoComplete="email"
                    className="h-11 rounded-xl"
                    style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }}
                  />
                </div>

                {/* RGPD */}
                <div className="flex items-start gap-3 pt-1">
                  <Checkbox
                    id="rgpd-lead"
                    checked={form.rgpd}
                    onCheckedChange={v => setForm(f => ({ ...f, rgpd: !!v }))}
                    className="mt-0.5 shrink-0"
                  />
                  <label htmlFor="rgpd-lead" className="text-xs leading-relaxed cursor-pointer" style={{ color: textMuted }}>
                    J'accepte la{" "}
                    <Link to="/rgpd-light" target="_blank" className="underline" style={{ color: accentColor }}>
                      politique RGPD & CGU
                    </Link>{" "}
                    d'AXIOM · Données traitées à des fins de mise en relation professionnelle.
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 text-base font-bold rounded-xl mt-2"
                  style={{ background: bleuSouverain, color: "white" }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Calcul du score IA en cours…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Lancer mon évaluation gratuite
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <p className="mt-4 text-center text-xs" style={{ color: textMuted }}>
                🔒 Aucune carte bancaire · Données sécurisées · RGPD Art. 13
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ STEP 3 : SCORE ═══════════════ */}
        {step === 3 && selectedMetier && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg mx-auto px-4 py-8 sm:py-12"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
                className="inline-flex h-16 w-16 items-center justify-center rounded-full mb-4"
                style={{ background: `${accentColor}18`, border: `2px solid ${accentColor}44` }}
              >
                <CheckCircle2 className="h-8 w-8" style={{ color: accentColor }} />
              </motion.div>
              <h2 className="text-xl font-bold mb-1" style={{ color: textPrimary }}>Analyse terminée !</h2>
              <p className="text-sm" style={{ color: textSecondary }}>
                Votre profil correspond à <strong style={{ color: accentColor }}>{score} %</strong> au poste de <strong style={{ color: textPrimary }}>{selectedMetier.label}</strong>
              </p>
            </div>

            {/* Score circle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.55 }}
              className="flex flex-col items-center mb-8"
            >
              <div className="relative h-40 w-40">
                <svg className="h-40 w-40 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(0,0%,100%,0.07)" strokeWidth="7" />
                  <motion.circle
                    cx="50" cy="50" r="44" fill="none" strokeWidth="7"
                    stroke={scoreColor}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray: `${(score / 100) * circumference} ${circumference}` }}
                    transition={{ delay: 0.5, duration: 1.3, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-4xl font-extrabold"
                    style={{ color: textPrimary }}
                  >
                    {score}%
                  </motion.span>
                  <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: textMuted }}>MATCH IA</span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="text-center mt-3"
              >
                <div className="flex items-center gap-2 justify-center">
                  <p className="text-lg font-bold" style={{ color: scoreColor }}>{scoreLabel}</p>
                  {isAxiomReady && (
                    <Badge className="text-[10px] font-bold gap-1" style={{ background: "hsl(158,64%,42%,0.15)", color: "hsl(158,64%,42%)", border: "1px solid hsl(158,64%,42%,0.3)" }}>
                      <Shield className="h-3 w-3" /> AXIOM READY
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-1" style={{ color: textSecondary }}>
                  {selectedMetier.label} · ROME {selectedMetier.rome} · {selectedMetier.salary}
                </p>
              </motion.div>
            </motion.div>

            {/* Score breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="rounded-xl p-4 border mb-6 space-y-2"
              style={{ background: cardBg, borderColor: cardBorder }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: textPrimary }}>Détail du calcul</p>
              {[
                { label: "Compétences métier", pct: "40%", color: accentColor },
                { label: "Expérience professionnelle", pct: "25%", color: bleuSouverain },
                { label: "Éligibilité visa", pct: "20%", color: "hsl(158,64%,42%)" },
                { label: "Intégration & logement", pct: "15%", color: "hsl(45,93%,47%)" },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs flex-1" style={{ color: textSecondary }}>{label}</span>
                  <span className="text-xs font-medium" style={{ color: textPrimary }}>{pct}</span>
                </div>
              ))}
            </motion.div>

            {/* Upsell */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="rounded-2xl p-6 border mb-6"
              style={{ background: "hsl(221,83%,14%,0.55)", borderColor: `${accentColor}40` }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: "hsl(0,0%,90%)" }}>
                🎯 {isAxiomReady
                  ? `Félicitations ${form.firstName} ! Votre profil est compatible avec les offres en tension.`
                  : `${form.firstName}, votre profil montre un bon potentiel. L'accompagnement ALTIS peut maximiser vos chances.`
                }
              </p>

              <div className="space-y-2 mb-5">
                {[
                  "Rapport complet : score détaillé par compétence",
                  "3 à 5 offres CDI matchées en France",
                  "Préparation dossier ALTIS : visa + accueil + logement 1er mois",
                ].map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: accentColor }} />
                    <span className="text-xs" style={{ color: textSecondary }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* ── Full unlock CTA ── */}
              <div className="relative rounded-xl p-3 mb-3 border text-center" style={{ background: `${accentColor}0A`, borderColor: `${accentColor}33` }}>
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.08, 1], opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                  className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-lg"
                  style={{ background: "linear-gradient(135deg, hsl(158,64%,38%), hsl(158,64%,48%))", color: "white" }}
                >
                  ⭐ Recommandé
                </motion.span>
                <p className="text-xs" style={{ color: textSecondary }}>
                  Débloquer le rapport complet + préparation dossier
                </p>
                <p className="mt-1">
                  <strong style={{ color: accentColor, fontSize: "1.25rem" }}>29 €</strong>{" "}
                  <span className="text-[10px]" style={{ color: textMuted }}>une seule fois</span>
                </p>
              </div>

              <Button
                className="w-full h-12 font-bold text-sm rounded-xl mb-2"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${bleuSouverain})`, color: "white" }}
                onClick={() => handlePayment("full")}
                disabled={fullPaymentLoading}
              >
                {fullPaymentLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                      className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Redirection…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Débloquer le rapport complet — 29 €
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs h-8"
                style={{ color: textMuted }}
                asChild
              >
                <Link to="/signup-light">Continuer gratuitement (version limitée)</Link>
              </Button>
            </motion.div>

            {/* Trust */}
            <div className="flex justify-center gap-5">
              {[
                { icon: Shield, label: "RGPD compliant" },
                { icon: Globe,  label: "Afrique → France" },
                { icon: Star,   label: "MINEFOP certifié" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: textMuted }}>
                  <Icon className="h-3 w-3" />{label}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer className="border-t py-6 px-4 text-center" style={{ borderColor: "hsl(0,0%,100%,0.06)" }}>
        <p className="text-xs" style={{ color: "hsl(215,25%,32%)" }}>
          © 2026 AXIOM SAS ·{" "}
          <Link to="/rgpd-light" className="underline" style={{ color: "hsl(215,25%,42%)" }}>RGPD</Link>{" "}
          · rgpd@axiom-talents.com · Données conservées 24 mois
        </p>
        <CesedaLegalNotice />
      </footer>
    </div>
  );
}
