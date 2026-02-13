import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, TrendingUp, Banknote, ShieldCheck } from "lucide-react";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: easeOut },
  }),
};

const tensionColor: Record<string, string> = {
  "Très haute": "bg-destructive/90 text-destructive-foreground",
  "Haute": "bg-accent text-accent-foreground",
  "Croissante": "bg-success/80 text-success-foreground",
  "Moyenne-haute": "bg-accent/70 text-accent-foreground",
  "Moyenne": "bg-muted text-muted-foreground",
};

export default function TensionMetiersSection() {
  const { data: metiers } = useQuery({
    queryKey: ["metiers-tension"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metiers_minefop_rome")
        .select("*")
        .gte("score_matching", 7)
        .order("score_matching", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!metiers?.length) return null;

  return (
    <section className="relative overflow-hidden py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,8%)] via-[hsl(222,45%,14%)] to-[hsl(222,38%,20%)]" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
          <motion.span custom={0} variants={fadeUp} className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-accent">
            <TrendingUp className="h-4 w-4" /> Arrêté mai 2025 · France Travail BMO
          </motion.span>
          <motion.h2 custom={1} variants={fadeUp} className="mt-3 font-display text-3xl font-bold text-white md:text-5xl">
            Métiers prioritaires{" "}
            <span className="text-gradient-accent">France 2026</span>
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-white/60 text-lg">
            Croisement officiel : formations CQP/DQP MINEFOP Cameroun × métiers en tension France.
            Score de correspondance calculé par notre IA.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {metiers.map((m, i) => (
            <motion.div key={m.id} custom={i} variants={fadeUp}>
              <Link
                to={`/metier/${m.rome_code}`}
                className="group relative block rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 transition-all hover:bg-accent/10 hover:border-accent/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/10"
              >
                {/* Score */}
                <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 border border-accent/30">
                  <span className="text-sm font-bold text-accent">{m.score_matching}</span>
                </div>

                {/* Tension badge */}
                <Badge className={`text-[10px] font-bold border-0 mb-4 ${tensionColor[m.niveau_tension ?? "Moyenne"]}`}>
                  {m.niveau_tension}
                </Badge>

                <h3 className="font-display text-lg font-bold text-white group-hover:text-accent transition-colors">
                  {m.metier_tension_fr || m.rome_title}
                </h3>

                <p className="mt-1 text-xs font-mono text-white/40 uppercase tracking-wider">
                  ROME {m.rome_code} · CQP {m.minefop_title}
                </p>

                <p className="mt-3 text-sm text-white/50 leading-relaxed line-clamp-2">
                  {m.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-success" />
                    <span className="text-sm font-semibold text-success">{m.salaire_moyen_france}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-success/40 text-success">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Visa-ready
                  </Badge>
                </div>

                <div className="mt-4 flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  Voir talents Cameroun <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
          className="mt-12 text-center"
        >
          <Link to="/signup">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 border-0 px-10 py-6 text-base font-semibold rounded-xl shadow-xl shadow-accent/20">
              Recruter dans ces métiers <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
