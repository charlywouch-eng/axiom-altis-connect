import { Brain, CheckCircle2, Shield, Cpu, Target, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.08, duration: 0.45, ease },
  }),
};

function AnimatedScoreBar({ target = 87 }: { target?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = performance.now();
          const duration = 1400;
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setScore(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <div ref={ref} className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Score de Conformité</span>
        <span className="text-2xl font-black text-accent tabular-nums">{score}%</span>
      </div>
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={hasAnimated ? { width: `${target}%` } : { width: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Brain,
    title: "Algorithme prédictif multi-critères",
    desc: "Analyse croisée des compétences ROME, certifications MINEFOP, niveau de français et expérience sectorielle.",
  },
  {
    icon: Shield,
    title: "Score de conformité vérifié",
    desc: "Chaque talent reçoit un score 0-100 % basé sur la conformité aux exigences réglementaires françaises (ROME, ANEF, visa).",
  },
  {
    icon: Target,
    title: "Sourcing prioritaire intelligent",
    desc: "Les entreprises abonnées accèdent en priorité aux talents les mieux notés et pré-certifiés pour leur secteur.",
  },
  {
    icon: Users,
    title: "Matching sectoriel ciblé",
    desc: "BTP, Santé, CHR, Logistique, Agriculture — l'IA cible les métiers en tension avec les profils les plus adaptés.",
  },
];

interface MatchingIASectionProps {
  variant?: "light" | "dark";
}

export default function MatchingIASection({ variant = "light" }: MatchingIASectionProps) {
  const isDark = variant === "dark";

  return (
    <section className={`py-24 md:py-32 relative overflow-hidden ${isDark ? "" : ""}`}>
      {isDark && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,8%)] via-[hsl(217,33%,12%)] to-[hsl(199,89%,48%/0.08)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(var(--accent)/0.06),transparent_70%)]" />
          <div className="absolute inset-0 bg-hero-dots opacity-20" />
        </>
      )}

      <div className={`relative z-10 mx-auto max-w-6xl px-5 md:px-10`}>
        {/* Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="text-center mb-14">
          <motion.div custom={0} variants={fadeUp}>
            <Badge className="border-accent/30 text-accent bg-accent/10 px-4 py-1.5 text-xs font-bold tracking-wider gap-2 mb-4">
              <Cpu className="h-3.5 w-3.5" />
              Intelligence Artificielle
            </Badge>
          </motion.div>
          <motion.h2 custom={1} variants={fadeUp} className={`font-black text-3xl md:text-[42px] leading-tight tracking-tight ${isDark ? "text-white" : ""}`}>
            Matching IA <span className="text-gradient-accent">Prédictif</span>
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} className={`mt-4 text-base max-w-2xl mx-auto ${isDark ? "text-white/60" : "text-muted-foreground"}`}>
            Notre algorithme d'intelligence artificielle analyse et croise des dizaines de critères pour garantir le meilleur matching entre talents certifiés et entreprises françaises.
          </motion.p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: Features grid */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
            className="lg:col-span-3 grid gap-4 sm:grid-cols-2"
          >
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  custom={i}
                  variants={scaleIn}
                  className={`group rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-accent/30 ${
                    isDark
                      ? "border-white/10 glass-card"
                      : "border-border/50 bg-card shadow-sm"
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className={`font-bold text-sm mb-2 group-hover:text-accent transition-colors ${isDark ? "text-white" : "text-foreground"}`}>
                    {feat.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-white/55" : "text-muted-foreground"}`}>
                    {feat.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right: Score visual */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="lg:col-span-2 flex flex-col gap-5"
          >
            <motion.div
              custom={0}
              variants={scaleIn}
              className={`rounded-2xl border p-7 relative overflow-hidden ${
                isDark
                  ? "border-white/10 glass-card"
                  : "border-border/50 bg-card shadow-sm"
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <Brain className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className={`font-bold text-sm ${isDark ? "text-white" : "text-foreground"}`}>Exemple de profil</p>
                  <p className={`text-xs ${isDark ? "text-white/50" : "text-muted-foreground"}`}>Maçon qualifié · Cameroun</p>
                </div>
              </div>

              <AnimatedScoreBar target={87} />

              <div className="mt-6 space-y-2.5">
                {[
                  { label: "Compétences ROME F1703", score: "92%", color: "text-accent" },
                  { label: "Certification MINEFOP", score: "Vérifié", color: "text-success" },
                  { label: "Niveau français B2", score: "Confirmé", color: "text-primary" },
                  { label: "Expérience 5+ ans", score: "Validé", color: "text-accent" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className={`text-xs ${isDark ? "text-white/60" : "text-muted-foreground"}`}>{item.label}</span>
                    <span className={`text-xs font-bold ${item.color}`}>{item.score}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              custom={1}
              variants={scaleIn}
              className={`rounded-2xl border p-5 ${
                isDark
                  ? "border-accent/20 bg-accent/5"
                  : "border-accent/20 bg-accent/[0.03]"
              }`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-foreground"}`}>
                    Précision certifiée
                  </p>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-white/55" : "text-muted-foreground"}`}>
                    98 % de taux de rétention à 12 mois grâce à notre matching IA combiné à la pré-certification MINEFOP/MINREX.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
