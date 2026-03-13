import { useEffect, useState } from "react";
import { trackFunnel } from "@/lib/trackFunnel";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Star, ArrowRight, Zap, Shield, Globe, Briefcase, Crown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/* ─── Secteurs mirror from Leads.tsx ────────────────────────────*/
const SECTEURS: Record<string, { label: string; icon: string; demand: string }> = {
  F1703: { label: "Maçonnerie / BTP",         icon: "🏗️", demand: "Très forte" },
  J1501: { label: "Aide-soignant / Santé",    icon: "🏥", demand: "Très forte" },
  N4101: { label: "Transport / Logistique",   icon: "🚛", demand: "Forte"      },
  G1602: { label: "Service salle / CHR",      icon: "🍽️", demand: "Forte"      },
  I1304: { label: "Maintenance industrielle", icon: "⚙️", demand: "Forte"      },
  G1703: { label: "Hôtellerie / Accueil",     icon: "🏨", demand: "Modérée"    },
  D1212: { label: "Commerce / Distribution",  icon: "🛒", demand: "Modérée"    },
  A1401: { label: "Agriculture / Agroalim.",  icon: "🌱", demand: "Forte"      },
  M1607: { label: "Support & Administratif",  icon: "💼", demand: "Modérée"    },
};

/* ─── Score circle SVG ──────────────────────────────────────────*/
function ScoreCircle({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(score), 400);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
      <svg className="rotate-[-90deg]" width="144" height="144" viewBox="0 0 144 144">
        {/* Track */}
        <circle cx="72" cy="72" r={radius} fill="none" stroke="hsl(222 47% 14%)" strokeWidth="10" />
        {/* Progress */}
        <circle
          cx="72" cy="72" r={radius}
          fill="none"
          stroke="hsl(158 64% 38%)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * progress) / 100}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white">{score}%</span>
        <span className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">MATCH IA</span>
      </div>
    </div>
  );
}

/* ─── Animated checkmark SVG ────────────────────────────────────*/
function AnimatedCheck() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      className="flex items-center justify-center w-24 h-24 rounded-full mx-auto mb-2"
      style={{ background: "radial-gradient(circle, hsl(158 64% 38% / 0.18) 0%, transparent 70%)" }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.25 }}
      >
        <CheckCircle2 className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />
      </motion.div>
    </motion.div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────*/
export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const rome      = searchParams.get("rome") ?? "F1703";
  const exp       = searchParams.get("exp")  ?? "0-2";
  const scoreRaw  = searchParams.get("score");
  const tier      = searchParams.get("tier") ?? "test"; // "test" or "full"
  const secteur   = SECTEURS[rome] ?? SECTEURS["F1703"];

  /* score: from URL param OR derive from rome */
  const BASE_SCORES: Record<string, number> = {
    F1703: 88, J1501: 86, N4101: 81, G1602: 79,
    I1304: 77, G1703: 76, D1212: 71, A1401: 73, M1607: 74,
  };
  const EXP_BONUS: Record<string, number> = {
    "0-2": 0, "2-5": 4, "5-10": 7, "10+": 10,
  };
  const computedScore = Math.min(95, (BASE_SCORES[rome] ?? 75) + (EXP_BONUS[exp] ?? 0));
  const score = scoreRaw ? parseInt(scoreRaw, 10) : computedScore;

  const signupUrl = `/signup-light?premium=true&rome=${rome}&exp=${exp}`;

  const handleUpgradeToFull = async () => {
    setUpgradeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-talent", {
        body: { tier: "full" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch {
      // fallback: redirect to signup
      window.location.href = signupUrl;
    } finally {
      setUpgradeLoading(false);
    }
  };


  useEffect(() => {
    trackFunnel({
      event_name: "payment_success",
      rome_code: rome,
      experience: exp,
      source: "payment-success",
      metadata: { score },
    });
  }, []);

  const perks = [
    { icon: Star,      text: "Score détaillé par compétence & niveau ROME" },
    { icon: Briefcase, text: "3 à 5 offres CDI France Travail matchées" },
    { icon: Globe,     text: "Parcours ALTIS : visa + billet + logement" },
    { icon: Shield,    text: "Accompagnement MINEFOP certifié" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(222 47% 6%) 0%, hsl(222 47% 10%) 50%, hsl(221 83% 12%) 100%)" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 700px 500px at 50% 30%, hsl(158 64% 38% / 0.08) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center gap-6"
          style={{
            background: "hsl(222 47% 9% / 0.95)",
            border: "1px solid hsl(158 64% 38% / 0.3)",
            boxShadow: "0 0 60px hsl(158 64% 38% / 0.12), 0 24px 48px hsl(0 0% 0% / 0.5)",
          }}
        >
          {/* Check */}
          <AnimatedCheck />

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{
              background: "hsl(158 64% 38% / 0.15)",
              border: "1px solid hsl(158 64% 38% / 0.4)",
              color: "hsl(158 64% 58%)",
            }}
          >
            <Zap className="w-3 h-3" />
            Accès premium activé ✓
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            <h1 className="text-2xl font-extrabold text-white mb-1">
              Votre analyse complète est prête !
            </h1>
            <p className="text-sm" style={{ color: "hsl(215 16% 57%)" }}>
              Paiement confirmé · Score et offres débloqués
            </p>
          </motion.div>

          {/* Score recap card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            className="w-full rounded-xl p-5 flex flex-col items-center gap-4"
            style={{
              background: "hsl(222 47% 6%)",
              border: "1px solid hsl(222 47% 18%)",
            }}
          >
            <ScoreCircle score={score} />

            <div>
              <p className="text-lg font-bold text-white">
                {secteur.icon} {secteur.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(215 16% 57%)" }}>
                Code ROME : <span className="text-white font-semibold">{rome}</span>
                &nbsp;·&nbsp;
                Tension&nbsp;
                <span
                  className="font-semibold"
                  style={{ color: secteur.demand === "Très forte" ? "hsl(158 64% 52%)" : "hsl(189 94% 52%)" }}
                >
                  {secteur.demand}
                </span>
              </p>
            </div>
          </motion.div>

          {/* Perks */}
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.9 } },
              hidden: {},
            }}
            className="w-full space-y-2 text-left"
          >
            {perks.map(({ icon: Icon, text }) => (
              <motion.li
                key={text}
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0 },
                }}
                className="flex items-center gap-3 text-sm"
                style={{ color: "hsl(210 40% 80%)" }}
              >
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(158 64% 38% / 0.12)", border: "1px solid hsl(158 64% 38% / 0.25)" }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: "hsl(158 64% 52%)" }} />
                </span>
                {text}
              </motion.li>
            ))}
          </motion.ul>

          {/* CTA — upgrade to full or create account */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.45 }}
            className="w-full space-y-3"
          >
            {tier === "test" && (
              <Button
                onClick={handleUpgradeToFull}
                disabled={upgradeLoading}
                className="w-full h-12 text-base font-bold rounded-xl flex items-center justify-center gap-2 group"
                style={{
                  background: "linear-gradient(135deg, hsl(158 64% 30%), hsl(158 64% 42%))",
                  boxShadow: "0 4px 24px hsl(158 64% 38% / 0.4)",
                }}
              >
                <Crown className="w-4 h-4" />
                Déblocage complet — 29 €
                <Rocket className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
            <Link to={signupUrl} className="block w-full">
              <Button
                variant={tier === "test" ? "outline" : "default"}
                className={`w-full h-12 text-base font-bold rounded-xl flex items-center justify-center gap-2 group ${
                  tier === "test"
                    ? "border-white/20 text-white hover:bg-white/10"
                    : ""
                }`}
                style={tier !== "test" ? {
                  background: "linear-gradient(135deg, hsl(221 83% 38%), hsl(189 94% 43%))",
                  boxShadow: "0 4px 24px hsl(221 83% 38% / 0.4)",
                } : undefined}
              >
                Créer mon compte complet
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            {tier === "test" && (
              <p className="text-center text-[11px]" style={{ color: "hsl(158 64% 52%)" }}>
                🔓 Score détaillé + offres matchées + parcours ALTIS + certification MINEFOP
              </p>
            )}
            <p className="text-xs text-center" style={{ color: "hsl(215 16% 47%)" }}>
              Accès gratuit · Score complet disponible immédiatement après inscription
            </p>
          </motion.div>
        </div>

        {/* Footer trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="flex items-center justify-center gap-6 mt-6 flex-wrap"
        >
          {[
            { icon: Shield, text: "RGPD compliant" },
            { icon: Globe,  text: "Afrique → France" },
            { icon: Star,   text: "MINEFOP certifié" },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(215 16% 47%)" }}>
              <Icon className="w-3.5 h-3.5" />
              {text}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
