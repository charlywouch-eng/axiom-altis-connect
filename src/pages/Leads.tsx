import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, CheckCircle2, ArrowRight, Lock, Globe, Briefcase,
  Star, Shield, ChevronRight, Sparkles, Users, MapPin,
} from "lucide-react";
import heroImg from "@/assets/hero-france-afrique.png";

/* ─── Config ──────────────────────────────────────────────────── */
const SECTEURS = [
  { label: "Maçonnerie / BTP",              rome: "F1703", sector: "BTP",         demand: "Très forte", icon: "🏗️", base: 88 },
  { label: "Aide-soignant / Santé",         rome: "J1501", sector: "Santé",       demand: "Très forte", icon: "🏥", base: 86 },
  { label: "Transport / Logistique",        rome: "N1101", sector: "Logistique",  demand: "Forte",      icon: "🚛", base: 81 },
  { label: "Service salle / CHR",           rome: "G1602", sector: "CHR",         demand: "Forte",      icon: "🍽️", base: 79 },
  { label: "Maintenance industrielle",      rome: "I1304", sector: "Maintenance", demand: "Forte",      icon: "⚙️", base: 77 },
  { label: "Hôtellerie / Accueil",          rome: "G1703", sector: "Hôtellerie",  demand: "Modérée",    icon: "🏨", base: 76 },
  { label: "Commerce / Distribution",       rome: "D1212", sector: "Commerce",    demand: "Modérée",    icon: "🛒", base: 71 },
  { label: "Agriculture / Agroalim.",       rome: "A1401", sector: "Agriculture", demand: "Forte",      icon: "🌱", base: 73 },
  { label: "Support & Administratif",       rome: "M1607", sector: "Support",     demand: "Modérée",    icon: "💼", base: 74 },
];

const EXP_BRACKETS = [
  { label: "Moins de 2 ans", value: "0-2",  bonus: 0  },
  { label: "2 à 5 ans",      value: "2-5",  bonus: 4  },
  { label: "5 à 10 ans",     value: "5-10", bonus: 7  },
  { label: "Plus de 10 ans", value: "10+",  bonus: 10 },
];

function calcScore(rome: string, exp: string): number {
  const s = SECTEURS.find(s => s.rome === rome);
  const e = EXP_BRACKETS.find(e => e.value === exp);
  return Math.min(95, (s?.base ?? 70) + (e?.bonus ?? 0));
}

function getScoreLabel(score: number) {
  if (score >= 88) return { label: "Excellent potentiel", color: "#10b981" };
  if (score >= 82) return { label: "Très bon potentiel",  color: "#06b6d4" };
  if (score >= 75) return { label: "Bon potentiel",       color: "#3b82f6" };
  return             { label: "Potentiel confirmé",        color: "#f59e0b" };
}

/* ─── Component ─────────────────────────────────────────────────*/
export default function Leads() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [step,     setStep]     = useState<"form" | "score">("form");
  const [loading,  setLoading]  = useState(false);
  const [score,    setScore]    = useState(0);
  const [selectedSecteur, setSelectedSecteur] = useState<typeof SECTEURS[0] | null>(null);
  const [form, setForm] = useState({ emailOrPhone: "", metier: "", experience: "", rgpd: false });

  const utmSource   = searchParams.get("utm_source");
  const utmMedium   = searchParams.get("utm_medium");
  const utmCampaign = searchParams.get("utm_campaign");

  const handleMetierChange = (value: string) => {
    setSelectedSecteur(SECTEURS.find(s => s.rome === value) ?? null);
    setForm(f => ({ ...f, metier: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.emailOrPhone.trim()) {
      toast({ title: "Champ requis", description: "Entrez votre email ou téléphone.", variant: "destructive" }); return;
    }
    if (!form.metier) {
      toast({ title: "Champ requis", description: "Sélectionnez votre métier.", variant: "destructive" }); return;
    }
    if (!form.experience) {
      toast({ title: "Champ requis", description: "Sélectionnez vos années d'expérience.", variant: "destructive" }); return;
    }
    if (!form.rgpd) {
      toast({ title: "Consentement requis", description: "Acceptez la politique RGPD pour continuer.", variant: "destructive" }); return;
    }

    setLoading(true);
    const calculatedScore = calcScore(form.metier, form.experience);

    try {
      await (supabase.from as any)("leads").insert({
        email_or_phone:    form.emailOrPhone.trim(),
        metier:            selectedSecteur?.label ?? form.metier,
        rome_code:         form.metier,
        experience_bracket: form.experience,
        score_mock:        calculatedScore,
        rgpd_consent:      true,
        utm_source:        utmSource,
        utm_medium:        utmMedium,
        utm_campaign:      utmCampaign,
        status:            "a_contacter",
      });
    } catch (err) {
      console.error("Lead save:", err);
    }

    setScore(calculatedScore);
    setLoading(false);
    setStep("score");
  };

  const [paymentLoading, setPaymentLoading] = useState(false);

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const email = form.emailOrPhone.includes("@") ? form.emailOrPhone : undefined;
      const { data, error } = await supabase.functions.invoke("create-payment-lead", {
        body: {
          email,
          metier: selectedSecteur?.label ?? form.metier,
          rome_code: form.metier,
          experience: form.experience,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Aucune URL Stripe reçue");
      }
    } catch (err: any) {
      toast({
        title: "Erreur de paiement",
        description: err.message ?? "Impossible d'initier le paiement. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const { label: scoreLabel, color: scoreColor } = getScoreLabel(score);
  const circumference = 2 * Math.PI * 44; // r=44

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, hsl(222,47%,7%) 0%, hsl(221,83%,14%) 60%, hsl(189,94%,10%) 100%)" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "hsl(222,47%,7%,0.88)", backdropFilter: "blur(14px)", borderColor: "hsl(0,0%,100%,0.07)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(189,94%,43%,0.18)" }}>
              <Zap className="h-4 w-4" style={{ color: "hsl(189,94%,43%)" }} />
            </div>
            <span className="font-bold text-sm tracking-wide" style={{ color: "hsl(0,0%,95%)" }}>
              AXIOM <span style={{ color: "hsl(189,94%,43%)" }}>×</span> ALTIS
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs hidden sm:block" style={{ color: "hsl(215,25%,45%)" }}>Déjà inscrit ?</span>
            <Button variant="outline" size="sm" className="text-xs h-8" style={{ borderColor: "hsl(0,0%,100%,0.12)", color: "hsl(215,25%,65%)" }} asChild>
              <Link to="/login">Connexion</Link>
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">

        {/* ═══════════════════ STEP 1 : FORM ═══════════════════ */}
        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -16 }}>

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-4 pt-12 pb-8">
              <div className="grid lg:grid-cols-2 gap-10 items-center">

                {/* Left copy */}
                <motion.div
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Badge className="mb-4 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: "hsl(189,94%,43%,0.14)", color: "hsl(189,94%,43%)", border: "1px solid hsl(189,94%,43%,0.25)" }}>
                    Gratuit & sans engagement
                  </Badge>

                  <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-5" style={{ color: "hsl(0,0%,97%)" }}>
                    Votre avenir en France<br />
                    <span style={{ color: "hsl(189,94%,43%)" }}>commence ici.</span>
                  </h1>

                  <div className="space-y-3 mb-6 text-base leading-relaxed" style={{ color: "hsl(215,25%,62%)" }}>
                    <p>
                      Imaginez décrocher un <strong style={{ color: "hsl(0,0%,88%)" }}>CDI en France</strong> dans les métiers qui manquent cruellement de bras — BTP, Santé, CHR, Logistique — sans passer des mois à chercher.
                    </p>
                    <p>
                      Des entreprises françaises cherchent <strong style={{ color: "hsl(0,0%,85%)" }}>activement des talents comme vous</strong> — certifiés et prêts jour 1.
                    </p>
                    <p>
                      AXIOM vous connecte en quelques clics :{" "}
                      <span style={{ color: "hsl(189,94%,43%)" }}>matching IA précis + score conformité + accompagnement visa & installation ALTIS.</span>
                    </p>
                    <div className="rounded-2xl p-4 border mt-4" style={{ background: "hsl(0,0%,100%,0.03)", borderColor: "hsl(189,94%,43%,0.2)" }}>
                      <p className="text-sm italic" style={{ color: "hsl(215,25%,60%)" }}>
                        "Des Camerounais comme vous sont déjà en poste à Paris, Lyon, Bordeaux…{" "}
                        <strong style={{ color: "hsl(189,94%,43%)" }}>Et si c'était votre tour ?"</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { icon: Users,    label: "+2 400 talents placés"  },
                      { icon: MapPin,   label: "Paris · Lyon · Bordeaux" },
                      { icon: Star,     label: "MINEFOP certifié"        },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5" style={{ background: "hsl(0,0%,100%,0.06)", color: "hsl(215,25%,60%)" }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: "hsl(189,94%,43%)" }} />{label}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Right image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="hidden lg:flex items-center justify-center"
                >
                  <motion.img
                    src={heroImg}
                    alt="Talents France-Afrique"
                    className="w-80 rounded-2xl"
                    style={{ filter: "drop-shadow(0 24px 48px hsl(189,94%,43%,0.22))" }}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  />
                </motion.div>
              </div>
            </section>

            {/* Form card */}
            <section className="max-w-lg mx-auto px-4 pb-16">
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl p-6 sm:p-8 border"
                style={{ background: "hsl(0,0%,100%,0.04)", borderColor: "hsl(0,0%,100%,0.09)" }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-5 w-5" style={{ color: "hsl(189,94%,43%)" }} />
                  <h2 className="text-lg font-bold" style={{ color: "hsl(0,0%,96%)" }}>
                    Tester mon profil gratuitement
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Email / Phone */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: "hsl(215,25%,72%)" }}>
                      Email ou téléphone +237 <span style={{ color: "hsl(0,60%,65%)" }}>*</span>
                    </label>
                    <Input
                      placeholder="exemple@email.com ou +237 6XX XXX XXX"
                      value={form.emailOrPhone}
                      onChange={e => setForm(f => ({ ...f, emailOrPhone: e.target.value }))}
                      className="text-sm"
                      style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }}
                    />
                  </div>

                  {/* Métier */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: "hsl(215,25%,72%)" }}>
                      Métier principal <span style={{ color: "hsl(0,60%,65%)" }}>*</span>
                    </label>
                    <Select value={form.metier} onValueChange={handleMetierChange}>
                      <SelectTrigger className="text-sm" style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }}>
                        <SelectValue placeholder="Sélectionnez votre secteur…" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTEURS.map(s => (
                          <SelectItem key={s.rome} value={s.rome}>
                            <span className="flex items-center gap-2">
                              <span>{s.icon}</span>
                              <span>{s.label}</span>
                              <Badge className="ml-1 text-[8px] px-1 py-0 border" style={{ background: "hsl(0,70%,50%,0.12)", color: "hsl(0,70%,60%)", borderColor: "hsl(0,70%,50%,0.25)" }}>{s.demand}</Badge>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSecteur && (
                      <p className="text-xs" style={{ color: "hsl(189,94%,43%)" }}>
                        Code ROME : <strong>{selectedSecteur.rome}</strong> · Tension {selectedSecteur.demand}
                      </p>
                    )}
                  </div>

                  {/* Expérience */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: "hsl(215,25%,72%)" }}>
                      Années d'expérience <span style={{ color: "hsl(0,60%,65%)" }}>*</span>
                    </label>
                    <Select value={form.experience} onValueChange={v => setForm(f => ({ ...f, experience: v }))}>
                      <SelectTrigger className="text-sm" style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }}>
                        <SelectValue placeholder="Sélectionnez une tranche…" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXP_BRACKETS.map(e => (
                          <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* RGPD */}
                  <div className="flex items-start gap-3 pt-1">
                    <Checkbox
                      id="rgpd-lead"
                      checked={form.rgpd}
                      onCheckedChange={v => setForm(f => ({ ...f, rgpd: !!v }))}
                      className="mt-0.5 shrink-0"
                    />
                    <label htmlFor="rgpd-lead" className="text-xs leading-relaxed cursor-pointer" style={{ color: "hsl(215,25%,48%)" }}>
                      J'accepte la{" "}
                      <Link to="/rgpd-light" target="_blank" className="underline" style={{ color: "hsl(189,94%,43%)" }}>
                        politique RGPD & CGU
                      </Link>{" "}
                      d'AXIOM · Données traitées à des fins de mise en relation professionnelle.
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 text-sm font-bold rounded-xl mt-1"
                    style={{ background: "hsl(221,83%,53%)", color: "white" }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Analyse IA en cours…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Recevoir mon score IA &amp; alertes offres
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <p className="mt-4 text-center text-xs" style={{ color: "hsl(215,25%,35%)" }}>
                  🔒 Aucune carte bancaire · Données sécurisées · RGPD Art. 13
                </p>
              </motion.div>
            </section>
          </motion.div>
        )}

        {/* ═══════════════════ STEP 2 : SCORE ═══════════════════ */}
        {step === "score" && (
          <motion.div
            key="score"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg mx-auto px-4 py-12"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
                className="inline-flex h-16 w-16 items-center justify-center rounded-full mb-4"
                style={{ background: "hsl(189,94%,43%,0.14)", border: "2px solid hsl(189,94%,43%,0.3)" }}
              >
                <CheckCircle2 className="h-8 w-8" style={{ color: "hsl(189,94%,43%)" }} />
              </motion.div>
              <h2 className="text-xl font-bold mb-1" style={{ color: "hsl(0,0%,96%)" }}>Analyse terminée !</h2>
              <p className="text-sm" style={{ color: "hsl(215,25%,50%)" }}>Votre score de compatibilité France · IA AXIOM</p>
            </div>

            {/* Score circle SVG */}
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
                    style={{ color: "hsl(0,0%,96%)" }}
                  >
                    {score}%
                  </motion.span>
                  <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "hsl(215,25%,50%)" }}>MATCH IA</span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="text-center mt-3"
              >
                <p className="text-lg font-bold" style={{ color: scoreColor }}>{scoreLabel}</p>
                <p className="text-sm mt-1" style={{ color: "hsl(215,25%,52%)" }}>
                  {selectedSecteur?.label ?? "BTP"} · Code ROME {selectedSecteur?.rome ?? "F1703"}
                </p>
              </motion.div>
            </motion.div>

            {/* Upsell card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="rounded-2xl p-6 border mb-6"
              style={{ background: "hsl(221,83%,14%,0.55)", borderColor: "hsl(189,94%,43%,0.25)" }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: "hsl(0,0%,90%)" }}>
                🎯 Votre profil correspond déjà à des offres en tension en France. Vous êtes potentiellement éligible au <strong style={{ color: "hsl(189,94%,43%)" }}>visa ANEF</strong>.
              </p>

              <div className="space-y-2 mb-5">
                {[
                  "Score détaillé par compétence & niveau ROME",
                  "3 à 5 offres CDI France Travail matchées",
                  "Parcours ALTIS : visa + billet + logement",
                ].map(item => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(189,94%,43%)" }} />
                    <span className="text-xs" style={{ color: "hsl(215,25%,62%)" }}>{item}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3 mb-4 border text-center" style={{ background: "hsl(0,0%,100%,0.03)", borderColor: "hsl(0,0%,100%,0.07)" }}>
                <p className="text-xs" style={{ color: "hsl(215,25%,58%)" }}>
                  Débloquez pour{" "}
                  <strong style={{ color: "hsl(189,94%,43%)", fontSize: "1rem" }}>10 € unique</strong>{" "}
                  : score détaillé + offres France Travail + parcours ALTIS
                </p>
              </div>

              <Button
                className="w-full h-12 font-bold text-sm rounded-xl mb-2"
                style={{ background: "hsl(221,83%,53%)", color: "white" }}
                onClick={handlePayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                      className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Redirection Stripe…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Débloquer pour 10 €
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs h-8"
                style={{ color: "hsl(215,25%,38%)" }}
                asChild
              >
                <Link to="/signup-light">Continuer gratuitement (version limitée)</Link>
              </Button>
            </motion.div>

            {/* Trust */}
            <div className="flex justify-center gap-5">
              {[
                { icon: Shield, label: "RGPD compliant"   },
                { icon: Globe,  label: "Cameroun → France" },
                { icon: Star,   label: "MINEFOP certifié"  },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(215,25%,38%)" }}>
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
      </footer>
    </div>
  );
}
