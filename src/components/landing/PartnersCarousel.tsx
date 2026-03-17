import { motion } from "framer-motion";
import logoFranceTravail from "@/assets/logo-france-travail.png";
import logoRandstad from "@/assets/logo-randstad.png";
import logoManpower from "@/assets/logo-manpower.png";
import logoAdecco from "@/assets/logo-adecco.png";
import logoMinefop from "@/assets/logo-minefop.png";
import logoAnef from "@/assets/logo-anef.png";
import logoPoleEmploi from "@/assets/logo-pole-emploi.png";

const PARTNERS = [
  { name: "France Travail", logo: logoFranceTravail },
  { name: "MINEFOP", logo: logoMinefop },
  { name: "ANEF", logo: logoAnef },
  { name: "Pôle Emploi", logo: logoPoleEmploi },
  { name: "Adecco", logo: logoAdecco },
  { name: "Manpower", logo: logoManpower },
  { name: "Randstad", logo: logoRandstad },
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

        <div className="flex animate-[scroll_30s_linear_infinite] hover:[animation-play-state:paused] w-max items-center">
          {ITEMS.map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="flex-shrink-0 mx-8 md:mx-12 flex items-center justify-center h-14"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-10 md:h-12 w-auto max-w-[120px] object-contain opacity-60 hover:opacity-100 transition-all duration-300 grayscale hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
