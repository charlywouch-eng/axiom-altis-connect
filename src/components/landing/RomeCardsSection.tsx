import { motion } from "framer-motion";
import { Monitor, HeartPulse, HardHat, Truck, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: easeOut },
  }),
};

const romeCards = [
  {
    icon: Monitor,
    code: "M1805",
    title: "Développeur informatique",
    count: "120+ profils",
    tension: true,
  },
  {
    icon: HeartPulse,
    code: "J1506",
    title: "Aide-soignant",
    count: "85+ profils",
    tension: true,
  },
  {
    icon: HardHat,
    code: "F1704",
    title: "Maçon / Coffreur",
    count: "95+ profils",
    tension: true,
  },
  {
    icon: Truck,
    code: "N1103",
    title: "Agent logistique",
    count: "70+ profils",
    tension: false,
  },
  {
    icon: GraduationCap,
    code: "K2111",
    title: "Formateur technique",
    count: "45+ profils",
    tension: false,
  },
];

export default function RomeCardsSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28 md:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-center"
      >
        <motion.span
          custom={0}
          variants={scaleIn}
          className="text-sm font-semibold uppercase tracking-widest text-accent"
        >
          Référentiel ROME
        </motion.span>
        <motion.h2
          custom={1}
          variants={scaleIn}
          className="mt-3 font-display text-3xl font-bold md:text-5xl"
        >
          Métiers disponibles,{" "}
          <span className="text-gradient-accent">talents prêts</span>
        </motion.h2>
        <motion.p
          custom={2}
          variants={scaleIn}
          className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg"
        >
          Nos talents sont classés selon le référentiel ROME de France Travail.
          Les métiers « en tension » disposent de viviers renforcés.
        </motion.p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        {romeCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.code}
              custom={i}
              variants={scaleIn}
              className="group relative rounded-2xl border bg-card p-6 text-center transition-all hover:shadow-xl hover:-translate-y-1"
            >
              {card.tension && (
                <Badge className="absolute -top-2.5 right-3 bg-success text-success-foreground text-[10px] font-bold shadow-md border-0">
                  En tension
                </Badge>
              )}
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                {card.code}
              </p>
              <h3 className="mt-1 font-display text-sm font-semibold leading-snug">
                {card.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground font-medium">
                {card.count}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
