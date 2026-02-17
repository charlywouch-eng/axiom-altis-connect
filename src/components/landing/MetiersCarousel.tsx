import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Heart, Briefcase, HardHat, ShoppingCart, UtensilsCrossed, Truck, Wrench, Leaf, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import imgSanteAide from "@/assets/secteur-sante-aide.jpg";
import imgSupport from "@/assets/secteur-support-entreprise.jpg";
import imgBatiment from "@/assets/secteur-batiment.jpg";
import imgCommerce from "@/assets/secteur-commerce.jpg";
import imgHotellerie from "@/assets/secteur-hotellerie.jpg";
import imgTransport from "@/assets/secteur-transport.jpg";
import imgMaintenance from "@/assets/secteur-maintenance.jpg";
import imgAgriculture from "@/assets/secteur-agriculture.jpg";
import imgSanteInfirmier from "@/assets/secteur-sante-infirmier.jpg";

const secteurs = [
  {
    id: 1, secteur: "SERVICE À LA PERSONNE", metier: "Aide-soignant", rome: "J1501",
    icon: Heart, gradient: "from-pink-500/20 to-rose-500/20", iconColor: "text-pink-500", image: imgSanteAide,
  },
  {
    id: 2, secteur: "SUPPORT À L'ENTREPRISE", metier: "Administratif / Gestion", rome: "M1202 / M1805",
    icon: Briefcase, gradient: "from-blue-500/20 to-indigo-500/20", iconColor: "text-blue-500", image: imgSupport,
  },
  {
    id: 3, secteur: "BÂTIMENT ET CONSTRUCTION", metier: "Maçon / Plombier", rome: "F1703 / F1603",
    icon: HardHat, gradient: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-500", image: imgBatiment,
  },
  {
    id: 4, secteur: "COMMERCE & VENTE", metier: "Vendeur / Employé de magasin", rome: "D1211 / D1225",
    icon: ShoppingCart, gradient: "from-emerald-500/20 to-green-500/20", iconColor: "text-emerald-500", image: imgCommerce,
  },
  {
    id: 5, secteur: "HÔTELLERIE RESTAURATION", metier: "Serveur / Cuisinier", rome: "G1602 / G1802",
    icon: UtensilsCrossed, gradient: "from-red-500/20 to-rose-500/20", iconColor: "text-red-500", image: imgHotellerie,
  },
  {
    id: 6, secteur: "TRANSPORT & LOGISTIQUE", metier: "Chauffeur / Cariste", rome: "N4101 / N1103",
    icon: Truck, gradient: "from-sky-500/20 to-cyan-500/20", iconColor: "text-sky-500", image: imgTransport,
  },
  {
    id: 7, secteur: "INSTALLATION & MAINTENANCE", metier: "Technicien maintenance", rome: "I1309 / I1604",
    icon: Wrench, gradient: "from-violet-500/20 to-purple-500/20", iconColor: "text-violet-500", image: imgMaintenance,
  },
  {
    id: 8, secteur: "AGRICULTURE ET ÉLEVAGE", metier: "Ouvrier agricole / Viticole", rome: "A1414 / A1418",
    icon: Leaf, gradient: "from-lime-500/20 to-green-500/20", iconColor: "text-lime-600", image: imgAgriculture,
  },
  {
    id: 9, secteur: "SANTÉ", metier: "Infirmier / Aide-soignant", rome: "J1501",
    icon: Stethoscope, gradient: "from-teal-500/20 to-emerald-500/20", iconColor: "text-teal-500", image: imgSanteInfirmier,
  },
];

export default function MetiersCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 text-xs font-semibold tracking-wider uppercase border-accent/30 text-accent px-4 py-1.5">
            Secteurs en tension France 2025-2026
          </Badge>
          <h2 className="font-display text-3xl font-bold md:text-5xl text-foreground">
            9 secteurs, des milliers de{" "}
            <span className="text-gradient-accent">talents prêts</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Nos viviers couvrent les métiers les plus demandés en France. Chaque talent est certifié MINEFOP et classé ROME.
          </p>
        </motion.div>

        <div className="relative">
          {/* Arrows */}
          <button
            onClick={scrollPrev}
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card border shadow-lg hover:bg-accent hover:text-accent-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Secteur précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card border shadow-lg hover:bg-accent hover:text-accent-foreground transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Secteur suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div ref={emblaRef} className="overflow-hidden rounded-2xl">
            <div className="flex">
              {secteurs.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.id}
                    className="min-w-0 shrink-0 grow-0 basis-full sm:basis-1/2 lg:basis-1/3 pl-4 first:pl-0"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: (s.id % 3) * 0.1 }}
                      className="group relative h-full"
                    >
                      <div className="h-full rounded-2xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/30 flex flex-col">
                        {/* Image */}
                        <div className="relative h-40 w-full overflow-hidden">
                          <img src={s.image} alt={s.secteur} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className={cn("absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm shadow-md")}>
                            <Icon className={cn("h-5 w-5", s.iconColor)} />
                          </div>
                        </div>

                        <div className="p-5 flex flex-col flex-1">

                        {/* Content */}
                        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-foreground mb-1">
                          {s.secteur}
                        </h3>
                        <p className="text-base font-medium text-foreground/80 mb-2">
                          {s.metier}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground tracking-wider mb-4">
                          Code ROME : {s.rome}
                        </p>

                        <div className="mt-auto flex items-center justify-between">
                          <Badge className="bg-accent/10 text-accent border-0 text-[10px] font-semibold">
                            Métiers en tension France 2025-2026
                          </Badge>
                        </div>

                        {/* Hover CTA */}
                        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground"
                          >
                            Voir les offres
                          </Button>
                        </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring",
                  i === selectedIndex ? "w-8 bg-accent" : "w-2 bg-border hover:bg-muted-foreground/30"
                )}
                aria-label={`Aller au groupe ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
