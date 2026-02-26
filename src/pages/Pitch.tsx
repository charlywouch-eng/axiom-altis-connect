import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Zap,
  Globe,
  CreditCard,
  Users,
  ArrowLeft,
  Maximize2,
  
  HardHat,
  Stethoscope,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── slide data ─── */
const SLIDES = [
  {
    id: "probleme",
    badge: "Le Problème",
    icon: AlertTriangle,
    iconColor: "text-red-400",
    title: "La France manque de bras.\nL'Afrique regorge de talents.",
    bullets: [
      "200 000+ postes non pourvus en métiers en tension (BTP, Santé, CHR, Logistique)",
      "Procédures d'immigration opaques et coûteuses",
      "Aucune plateforme ne connecte offre & demande de façon conforme",
      "Les recruteurs perdent 6 à 12 mois par embauche internationale",
    ],
    stat: { value: "200K+", label: "postes vacants en France" },
    gradient: "from-red-950/80 via-slate-950 to-slate-950",
  },
  {
    id: "solution",
    badge: "La Solution",
    icon: Zap,
    iconColor: "text-cyan-400",
    title: "AXIOM × ALTIS\nLe recrutement souverain.",
    bullets: [
      "Matching IA basé sur les codes ROME & référentiel MINEFOP",
      "Vérification diplômes, apostilles et conformité visa en temps réel",
      "Pipeline de recrutement intégré du sourcing à l'accueil en France",
      "Accompagnement physique ALTIS : visa, billet, logement, intégration",
    ],
    stat: { value: "72h", label: "du matching à la shortlist" },
    gradient: "from-cyan-950/80 via-slate-950 to-slate-950",
  },
  {
    id: "marche",
    badge: "Le Marché",
    icon: Globe,
    iconColor: "text-emerald-400",
    title: "Un marché de €2,4 Mds\nen croissance structurelle.",
    bullets: [
      "Secteurs cibles : BTP, Santé, CHR, Logistique, Agriculture",
      "400 000 titres de séjour « travail » délivrés/an en France",
      "Croissance démographique africaine → vivier illimité",
      "Cadre réglementaire favorable (accords bilatéraux, loi immigration 2024)",
    ],
    sectors: [
      { icon: HardHat, label: "BTP" },
      { icon: Stethoscope, label: "Santé" },
      { icon: UtensilsCrossed, label: "CHR" },
      { icon: Truck, label: "Logistique" },
    ],
    stat: { value: "€2,4 Mds", label: "marché adressable" },
    gradient: "from-emerald-950/80 via-slate-950 to-slate-950",
  },
  {
    id: "pricing",
    badge: "Pricing",
    icon: CreditCard,
    iconColor: "text-amber-400",
    title: "Un modèle économique\nhybride et scalable.",
    pricingCards: [
      {
        tier: "Talent",
        price: "10 €",
        period: "unique",
        features: ["Analyse ROME complète", "Score IA", "Pack ALTIS", "Certification MINEFOP"],
      },
      {
        tier: "Recruteur",
        price: "499 €",
        period: "/mois",
        features: ["Talents illimités", "Matching IA", "Pipeline intégré", "Support dédié"],
        highlight: true,
      },
    ],
    extraLine: "Success Fee 25 % · Pack ALTIS Intégral 1 200 €/talent",
    stat: { value: "499€", label: "/mois abonnement B2B" },
    gradient: "from-amber-950/80 via-slate-950 to-slate-950",
  },
  {
    id: "equipe",
    badge: "L'Équipe",
    icon: Users,
    iconColor: "text-violet-400",
    title: "Une équipe terrain\n& technologie.",
    team: [
      { role: "CEO & Fondateur", desc: "10 ans recrutement international France-Afrique" },
      { role: "CTO", desc: "Ex lead engineer, IA & plateformes SaaS" },
      { role: "Directrice Opérations ALTIS", desc: "Logistique visa, accueil & intégration terrain" },
      { role: "Head of Compliance", desc: "Droit du travail, immigration & RGPD" },
    ],
    stat: { value: "4", label: "co-fondateurs complémentaires" },
    gradient: "from-violet-950/80 via-slate-950 to-slate-950",
  },
];

/* ─── component ─── */
export default function Pitch() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const slide = SLIDES[current];

  const go = useCallback(
    (dir: 1 | -1) => setCurrent((c) => Math.max(0, Math.min(SLIDES.length - 1, c + dir))),
    [],
  );

  /* keyboard nav */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "Escape" && isFullscreen) toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div className={`min-h-screen bg-slate-950 text-white flex flex-col ${isFullscreen ? "cursor-none" : ""}`}>
      {/* top bar */}
      {!isFullscreen && (
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-950/90 backdrop-blur-md z-50">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" /> Accueil
          </Button>
          <span className="text-sm text-white/40 font-mono">
            AXIOM · Pitch Deck — {current + 1}/{SLIDES.length}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white/60 hover:text-white">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </header>
      )}

      {/* slide area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center select-none" onClick={() => go(1)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} flex items-center`}
          >
            <div className="w-full max-w-6xl mx-auto px-8 md:px-16 grid md:grid-cols-5 gap-12 items-center">
              {/* left col — content */}
              <div className="md:col-span-3 space-y-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wider uppercase">
                  <slide.icon className={`h-4 w-4 ${slide.iconColor}`} />
                  {slide.badge}
                </span>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight whitespace-pre-line font-heading">
                  {slide.title}
                </h1>

                {/* bullets */}
                {slide.bullets && (
                  <ul className="space-y-3 text-white/70 text-base md:text-lg">
                    {slide.bullets.map((b, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                        {b}
                      </motion.li>
                    ))}
                  </ul>
                )}

                {/* pricing cards */}
                {slide.pricingCards && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {slide.pricingCards.map((card) => (
                      <div
                        key={card.tier}
                        className={`rounded-xl p-5 border ${
                          card.highlight
                            ? "border-cyan-500/50 bg-cyan-950/30"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <p className="text-sm font-semibold text-white/60 mb-1">{card.tier}</p>
                        <p className="text-3xl font-bold">
                          {card.price}
                          <span className="text-sm font-normal text-white/50 ml-1">{card.period}</span>
                        </p>
                        <ul className="mt-3 space-y-1 text-sm text-white/60">
                          {card.features.map((f) => (
                            <li key={f} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {slide.extraLine && (
                      <p className="col-span-2 text-xs text-white/40 text-center pt-1">{slide.extraLine}</p>
                    )}
                  </div>
                )}

                {/* team */}
                {slide.team && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {slide.team.map((m, i) => (
                      <motion.div
                        key={m.role}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <p className="font-semibold text-sm">{m.role}</p>
                        <p className="text-xs text-white/50 mt-1">{m.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* sectors icons */}
                {slide.sectors && (
                  <div className="flex gap-6 pt-2">
                    {slide.sectors.map((s) => (
                      <div key={s.label} className="flex flex-col items-center gap-1 text-white/60">
                        <s.icon className="h-8 w-8" />
                        <span className="text-xs">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* right col — stat */}
              <div className="md:col-span-2 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
                  className="text-center"
                >
                  <p className="text-7xl md:text-8xl font-black tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                    {slide.stat.value}
                  </p>
                  <p className="text-lg text-white/50 mt-2">{slide.stat.label}</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* nav arrows */}
        {current > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {current < SLIDES.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* dots */}
      {!isFullscreen && (
        <footer className="flex items-center justify-center gap-2 py-4 bg-slate-950/90 border-t border-white/10">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? "w-8 bg-cyan-400" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </footer>
      )}
    </div>
  );
}
