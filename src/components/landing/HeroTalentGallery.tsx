import talentTech from "@/assets/talent-tech.jpg";
import talentSante from "@/assets/talent-sante.jpg";
import talentBtp from "@/assets/talent-btp.jpg";
import talentLogistique from "@/assets/talent-logistique.jpg";
import talentFormation from "@/assets/talent-formation.jpg";
import { motion } from "framer-motion";

const talents = [
  { src: talentTech, label: "Tech" },
  { src: talentSante, label: "Santé" },
  { src: talentBtp, label: "BTP" },
  { src: talentLogistique, label: "Logistique" },
  { src: talentFormation, label: "Formation" },
];

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function HeroTalentGallery() {
  return (
    <div className="flex items-end gap-3 md:gap-4">
      {talents.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.12, duration: 0.6, ease: easeOut }}
          className="group relative"
          style={{ height: i === 2 ? 180 : 140 }}
        >
          <div className="relative h-full w-16 md:w-20 overflow-hidden rounded-2xl border-2 border-white/20 shadow-xl transition-transform group-hover:scale-105 group-hover:border-accent/50">
            <img
              src={t.src}
              alt={`Talent ${t.label}`}
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
          </div>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent/90 px-2.5 py-0.5 text-[10px] font-bold text-accent-foreground shadow-md">
            {t.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
