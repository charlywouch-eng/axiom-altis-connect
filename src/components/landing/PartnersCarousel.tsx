import { motion } from "framer-motion";
import logoFranceTravail from "@/assets/logo-france-travail.png";

const PARTNERS = [
  { name: "France Travail", logo: logoFranceTravail },
  { name: "MINEFOP", logo: null },
  { name: "ANEF", logo: null },
  { name: "Campus France", logo: null },
  { name: "OFII", logo: null },
  { name: "Adecco", logo: null },
  { name: "Manpower", logo: null },
  { name: "Randstad", logo: null },
];

// Double the list for seamless infinite scroll
const ITEMS = [...PARTNERS, ...PARTNERS];

export default function PartnersCarousel() {
  return (
    <section className="py-12 overflow-hidden bg-muted/30 border-y border-border/40">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8"
      >
        Ils nous font confiance
      </motion.p>

      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

        <div className="flex animate-[scroll_30s_linear_infinite] hover:[animation-play-state:paused] w-max">
          {ITEMS.map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="flex-shrink-0 mx-8 md:mx-12 flex items-center justify-center h-12"
            >
              {partner.logo ? (
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-10 md:h-12 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0"
                />
              ) : (
                <span className="text-lg md:text-xl font-bold text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors duration-300 whitespace-nowrap select-none">
                  {partner.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
