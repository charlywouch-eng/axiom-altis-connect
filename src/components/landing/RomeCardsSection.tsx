import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Monitor, HeartPulse, HardHat, Truck, GraduationCap, Zap, Wrench,
  Droplets, Sun, BarChart3, Leaf, Bus, ClipboardCheck, Milk, Cpu
} from "lucide-react";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: easeOut },
  }),
};

const TENSION_CODES = ["M1805", "J1501", "F1502", "F1603", "I1308"];

const iconMap: Record<string, React.ElementType> = {
  M1805: Monitor,
  J1501: HeartPulse,
  F1502: HardHat,
  F1603: Zap,
  F1605: Droplets,
  I1308: Sun,
  M1403: BarChart3,
  I1304: Wrench,
  T2Z90: Leaf,
  T2A00: Truck,
  T2C00: Bus,
  H1401: ClipboardCheck,
  K2101: GraduationCap,
  J1405: Cpu,
  A1303: Milk,
};

export default function RomeCardsSection() {
  const { data: metiers } = useQuery({
    queryKey: ["metiers-landing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metiers_minefop_rome")
        .select("*")
        .order("rome_code");
      if (error) throw error;
      return data;
    },
  });

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
          Référentiel ROME × MINEFOP
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
          Nos talents sont formés au Cameroun (CQP/DQP MINEFOP) et classés
          selon le référentiel ROME de France Travail. Les métiers « en
          tension » disposent de viviers renforcés.
        </motion.p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="mt-16 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
      >
        {(metiers ?? []).map((m, i) => {
          const Icon = iconMap[m.rome_code] ?? Wrench;
          const isTension = TENSION_CODES.includes(m.rome_code);
          return (
            <motion.div key={m.id} custom={i} variants={scaleIn}>
              <Link
                to={`/metier/${m.rome_code}`}
                className="group relative block rounded-2xl border bg-card p-6 text-center transition-all hover:shadow-xl hover:-translate-y-1"
              >
                {isTension && (
                  <Badge className="absolute -top-2.5 right-3 bg-success text-success-foreground text-[10px] font-bold shadow-md border-0">
                    En tension
                  </Badge>
                )}
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  {m.rome_code}
                </p>
                <h3 className="mt-1 font-display text-sm font-semibold leading-snug">
                  {m.minefop_title}
                </h3>
                <p className="mt-2 text-xs text-accent font-semibold">
                  {m.salaire_moyen_france}
                </p>
                <Badge
                  variant="outline"
                  className="mt-3 text-[10px] border-success/40 text-success"
                >
                  Visa-ready
                </Badge>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
