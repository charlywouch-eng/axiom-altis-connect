import { motion } from "framer-motion";
import { UserPlus, Brain, Plane } from "lucide-react";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease },
  }),
};

const STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Inscription gratuite",
    desc: "Créez votre profil en 30 secondes. Renseignez votre métier, vos certifications MINEFOP et votre expérience.",
    accent: "from-primary to-primary/60",
    glow: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: Brain,
    step: "02",
    title: "Évaluation de vos compétences",
    desc: "Vos compétences et certifications sont analysées au regard des normes françaises pour vérifier votre éligibilité aux métiers en tension.",
    accent: "from-accent to-accent/60",
    glow: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    icon: Plane,
    step: "03",
    title: "Pack ALTIS complet",
    desc: "Formalités visa de travail (procédure ANEF), accueil aéroport, logement meublé 1 mois et accompagnement administratif. Opérationnel J1.",
    accent: "from-success to-success/60",
    glow: "bg-success/15",
    iconColor: "text-success",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-10">
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3"
          >
            Processus simplifié
          </motion.p>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="font-black text-3xl md:text-[42px] leading-tight tracking-tight"
          >
            3 étapes vers{" "}
            <span className="text-gradient-accent">votre emploi en France</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          className="relative grid gap-6 md:grid-cols-3 md:gap-8"
        >
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-[72px] left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-primary/30 via-accent/30 to-success/30" />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                custom={i}
                variants={fadeUp}
                className="group relative"
              >
                <div className="relative rounded-2xl border border-border/50 bg-card p-7 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 hover:border-accent/30">
                  {/* Step number + icon */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative">
                      <div
                        className={`absolute inset-0 rounded-2xl ${step.glow} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      />
                      <div
                        className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.accent} shadow-lg`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <span className="font-mono text-4xl font-black text-muted-foreground/15 group-hover:text-accent/20 transition-colors">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-accent transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>

                  {/* Arrow connector for mobile */}
                  {i < STEPS.length - 1 && (
                    <div className="md:hidden flex justify-center mt-5 -mb-2">
                      <div className="h-8 w-px bg-gradient-to-b from-accent/40 to-transparent" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
