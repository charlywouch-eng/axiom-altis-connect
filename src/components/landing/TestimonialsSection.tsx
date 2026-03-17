import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import avatarJeanPierre from "@/assets/avatar-jean-pierre.jpg";
import avatarFatou from "@/assets/avatar-fatou.jpg";
import avatarEmmanuel from "@/assets/avatar-emmanuel.jpg";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease },
  }),
};

const TESTIMONIALS = [
  {
    name: "Jean-Pierre M.",
    role: "Maçon qualifié",
    origin: "🇨🇲 Douala → Lyon",
    avatar: avatarJeanPierre,
    quote:
      "En 6 semaines j'ai eu mon visa et mon CDI. Le Pack ALTIS m'a tout organisé : billet, logement, accueil à l'aéroport. Je recommande à 100%.",
    score: 92,
    sector: "BTP",
  },
  {
    name: "Fatou D.",
    role: "Aide-soignante",
    origin: "🇸🇳 Dakar → Marseille",
    avatar: avatarFatou,
    quote:
      "Mon diplôme MINEFOP a été reconnu grâce à AXIOM. Le matching IA m'a trouvé un poste qui correspond exactement à mes compétences.",
    score: 88,
    sector: "Santé",
  },
  {
    name: "Emmanuel K.",
    role: "Technicien maintenance",
    origin: "🇨🇮 Abidjan → Toulouse",
    avatar: avatarEmmanuel,
    quote:
      "Le processus est transparent et rapide. Mon score était de 85 et j'ai été embauché en CDI dans les 30 jours.",
    score: 85,
    sector: "Industrie",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,6%)] via-[hsl(222,45%,10%)] to-[hsl(222,38%,14%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/6 blur-[180px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-5 md:px-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <motion.p
            custom={0}
            variants={fadeUp}
            className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-3"
          >
            Témoignages
          </motion.p>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="font-black text-3xl md:text-[42px] leading-tight tracking-tight text-white"
          >
            Ils ont fait le{" "}
            <span className="text-gradient-accent">grand saut</span>
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-4 text-white/50 text-base max-w-md mx-auto"
          >
            Des talents africains qualifiés, aujourd'hui en CDI en France.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-6 md:grid-cols-3"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              variants={fadeUp}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 transition-all duration-500 hover:bg-accent/5 hover:border-accent/30 hover:-translate-y-1"
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-accent/20 mb-4" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star
                    key={j}
                    className="h-3.5 w-3.5 fill-accent text-accent"
                  />
                ))}
              </div>

              <p className="text-sm text-white/70 leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/30"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">
                      {t.role} · {t.origin}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-accent/15 text-accent border-accent/25 text-[10px] font-bold">
                    Score {t.score}%
                  </Badge>
                  <p className="text-[10px] text-white/30 mt-1">{t.sector}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
