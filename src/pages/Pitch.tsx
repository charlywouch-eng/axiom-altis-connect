import { useState, useCallback, useEffect } from "react";
import { flushSync } from "react-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronLeft, ChevronRight, AlertTriangle, Zap, Globe,
  CreditCard, Users, ArrowLeft, Maximize2, Download, Loader2,
  HardHat, Stethoscope, Truck, UtensilsCrossed, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ─── live metrics hook ─── */
function useLiveMetrics() {
  const [m, setM] = useState({ talents: "—", leads: "—", rome: "—", compliance: "—" });

  useEffect(() => {
    (async () => {
      try {
        const [t, l, r, c] = await Promise.all([
          supabase.from("talent_profiles").select("id", { count: "exact", head: true }),
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("talent_profiles").select("rome_code"),
          supabase.from("talent_profiles").select("compliance_score"),
        ]);
        const scores = (c.data ?? []).map((x) => x.compliance_score).filter(Boolean);
        setM({
          talents: String(t.count ?? 0),
          leads: String(l.count ?? 0),
          rome: String(new Set((r.data ?? []).map((x) => x.rome_code).filter(Boolean)).size),
          compliance: scores.length ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : "0%",
        });
      } catch { /* fallback */ }
    })();
  }, []);
  return m;
}

/* ─── slide definitions ─── */
interface SlideData {
  id: string;
  badge: string;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  gradient: string;
  stat: { value: string; label: string };
  isCover?: boolean;
  subtitle?: string;
  tagline?: string;
  bullets?: string[];
  sectors?: { icon: React.ElementType; label: string }[];
  pricingCards?: { tier: string; price: string; period: string; features: string[]; highlight?: boolean }[];
  extraLine?: string;
  team?: { role: string; desc: string }[];
  metrics?: { value: string; label: string }[];
  roadmap?: { phase: string; label: string; done: boolean }[];
}

function buildSlides(live: ReturnType<typeof useLiveMetrics>): SlideData[] {
  return [
    {
      id: "cover", badge: "Pitch Deck 2026", icon: Zap, iconColor: "text-cyan-400",
      title: "AXIOM × ALTIS", subtitle: "Talent Infrastructure as a Service",
      tagline: "Recrutez des talents d'Afrique certifiés — Opérationnels jour 1",
      stat: { value: "TIaaS", label: "axiom-talents.com" },
      gradient: "from-slate-950 via-cyan-950/40 to-slate-950", isCover: true,
    },
    {
      id: "probleme", badge: "Le Problème", icon: AlertTriangle, iconColor: "text-red-400",
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
      id: "solution", badge: "La Solution", icon: Zap, iconColor: "text-cyan-400",
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
      id: "marche", badge: "Le Marché", icon: Globe, iconColor: "text-emerald-400",
      title: "Un marché de €2,4 Mds\nen croissance structurelle.",
      bullets: [
        "Secteurs cibles : BTP, Santé, CHR, Logistique, Agriculture",
        "400 000 titres de séjour « travail » délivrés/an en France",
        "Croissance démographique africaine → vivier illimité",
        "Cadre réglementaire favorable (accords bilatéraux, loi immigration 2024)",
      ],
      sectors: [
        { icon: HardHat, label: "BTP" }, { icon: Stethoscope, label: "Santé" },
        { icon: UtensilsCrossed, label: "CHR" }, { icon: Truck, label: "Logistique" },
      ],
      stat: { value: "€2,4 Mds", label: "marché adressable" },
      gradient: "from-emerald-950/80 via-slate-950 to-slate-950",
    },
    {
      id: "pricing", badge: "Pricing", icon: CreditCard, iconColor: "text-amber-400",
      title: "Un modèle économique\nhybride et scalable.",
      pricingCards: [
        { tier: "Talent", price: "10 €", period: "unique", features: ["Analyse ROME complète", "Score IA", "Pack ALTIS", "Certification MINEFOP"] },
        { tier: "Recruteur", price: "499 €", period: "/mois", features: ["Talents illimités", "Matching IA", "Pipeline intégré", "Support dédié"], highlight: true },
      ],
      extraLine: "Success Fee 25 % · Pack ALTIS Intégral 1 200 €/talent",
      stat: { value: "499€", label: "/mois abonnement B2B" },
      gradient: "from-amber-950/80 via-slate-950 to-slate-950",
    },
    {
      id: "equipe", badge: "L'Équipe", icon: Users, iconColor: "text-violet-400",
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
    {
      id: "traction", badge: "Traction & Roadmap", icon: Rocket, iconColor: "text-sky-400",
      title: "Des premiers résultats\net une vision claire.",
      metrics: [
        { value: live.talents, label: "Talents inscrits" },
        { value: live.leads, label: "Leads qualifiés" },
        { value: live.rome, label: "Codes ROME couverts" },
        { value: live.compliance, label: "Score conformité moyen" },
      ],
      roadmap: [
        { phase: "T1 2026", label: "Lancement MVP & premiers placements", done: true },
        { phase: "T2 2026", label: "Matching IA v2 & app mobile talent", done: false },
        { phase: "T3 2026", label: "Expansion CHR & Agriculture", done: false },
        { phase: "T4 2026", label: "100 placements/mois & Série A", done: false },
      ],
      stat: { value: "10x", label: "croissance visée en 12 mois" },
      gradient: "from-sky-950/80 via-slate-950 to-slate-950",
    },
  ];
}

/* ─── component ─── */
export default function Pitch() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const navigate = useNavigate();
  const live = useLiveMetrics();
  const SLIDES = buildSlides(live);
  const slide = SLIDES[current];

  const go = useCallback(
    (dir: 1 | -1) => setCurrent((c) => Math.max(0, Math.min(6, c + dir))),
    [],
  );

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const el = document.getElementById("pitch-slide-area");
      if (!el) return;
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1920, 1080] });
      const saved = current;
      for (let i = 0; i < SLIDES.length; i++) {
        flushSync(() => setCurrent(i));
        await new Promise((r) => setTimeout(r, 1200));
        const canvas = await html2canvas(el, { backgroundColor: "#020617", scale: 2, useCORS: true, width: el.offsetWidth, height: el.offsetHeight });
        const img = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage([1920, 1080], "landscape");
        pdf.addImage(img, "JPEG", 0, 0, 1920, 1080);
      }
      pdf.save("AXIOM-Pitch-Deck-2026.pdf");
      setCurrent(saved);
      toast({ title: "PDF téléchargé ✓", description: `${SLIDES.length} slides exportées.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de générer le PDF.", variant: "destructive" });
    } finally { setPdfLoading(false); }
  };

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
    const fn = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);

  return (
    <div className={`min-h-screen bg-slate-950 text-white flex flex-col ${isFullscreen ? "cursor-none" : ""}`}>
      <Helmet>
        <title>AXIOM &amp; ALTIS – Pitch Deck Investisseurs 2026</title>
        <meta name="description" content="Infrastructure souveraine de talents France-Afrique. MVP live, matching IA, Pack ALTIS Zéro Stress. Recherche 100–200 K€ pour scaler corridor Cameroun." />
        <link rel="canonical" href="https://axiom-talents.com/pitch" />
        <meta property="og:title" content="AXIOM & ALTIS – Pitch Deck Investisseurs 2026" />
        <meta property="og:description" content="Infrastructure souveraine de talents France-Afrique. MVP live, matching IA, Pack ALTIS Zéro Stress. Recherche 100–200 K€ pour scaler corridor Cameroun." />
        <meta property="og:url" content="https://axiom-talents.com/pitch" />
      </Helmet>
      {!isFullscreen && (
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-slate-950/90 backdrop-blur-md z-50">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" /> Accueil
          </Button>
          <span className="text-sm text-white/40 font-mono">AXIOM · Pitch Deck — {current + 1}/{SLIDES.length}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDownloadPdf} disabled={pdfLoading} className="text-white/60 hover:text-white">
              {pdfLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {pdfLoading ? "Export…" : "PDF"}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white/60 hover:text-white">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </header>
      )}

      <div id="pitch-slide-area" className="flex-1 relative overflow-hidden flex items-center justify-center select-none" onClick={() => go(1)}>
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
              <div className={`space-y-6 ${slide.isCover ? "md:col-span-5 text-center" : "md:col-span-3"}`}>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wider uppercase">
                  <slide.icon className={`h-4 w-4 ${slide.iconColor}`} />
                  {slide.badge}
                </span>

                <h1 className={`font-bold leading-tight whitespace-pre-line ${slide.isCover ? "text-5xl sm:text-6xl md:text-7xl" : "text-3xl sm:text-4xl md:text-5xl"}`}>
                  {slide.title}
                </h1>

                {slide.subtitle && <p className="text-xl md:text-2xl text-cyan-400 font-semibold">{slide.subtitle}</p>}
                {slide.tagline && <p className="text-lg text-white/60 max-w-2xl mx-auto">{slide.tagline}</p>}

                {slide.bullets && (
                  <ul className="space-y-3 text-white/70 text-base md:text-lg">
                    {slide.bullets.map((b, i) => (
                      <motion.li key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-400 shrink-0" /> {b}
                      </motion.li>
                    ))}
                  </ul>
                )}

                {slide.pricingCards && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {slide.pricingCards.map((card) => (
                      <div key={card.tier} className={`rounded-xl p-5 border ${card.highlight ? "border-cyan-500/50 bg-cyan-950/30" : "border-white/10 bg-white/5"}`}>
                        <p className="text-sm font-semibold text-white/60 mb-1">{card.tier}</p>
                        <p className="text-3xl font-bold">{card.price}<span className="text-sm font-normal text-white/50 ml-1">{card.period}</span></p>
                        <ul className="mt-3 space-y-1 text-sm text-white/60">
                          {card.features.map((f) => <li key={f} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> {f}</li>)}
                        </ul>
                      </div>
                    ))}
                    {slide.extraLine && <p className="col-span-2 text-xs text-white/40 text-center pt-1">{slide.extraLine}</p>}
                  </div>
                )}

                {slide.team && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {slide.team.map((m, i) => (
                      <motion.div key={m.role} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="font-semibold text-sm">{m.role}</p>
                        <p className="text-xs text-white/50 mt-1">{m.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {slide.sectors && (
                  <div className="flex gap-6 pt-2">
                    {slide.sectors.map((s) => (
                      <div key={s.label} className="flex flex-col items-center gap-1 text-white/60">
                        <s.icon className="h-8 w-8" /><span className="text-xs">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {slide.metrics && (
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    {slide.metrics.map((m, i) => (
                      <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                        <p className="text-2xl font-bold text-cyan-400">{m.value}</p>
                        <p className="text-xs text-white/50 mt-1">{m.label}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {slide.roadmap && (
                  <div className="space-y-2 pt-2">
                    {slide.roadmap.map((step, i) => (
                      <motion.div key={step.phase} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full shrink-0 ${step.done ? "bg-cyan-400" : "border-2 border-white/30"}`} />
                        <span className="text-sm font-mono text-white/40 w-16 shrink-0">{step.phase}</span>
                        <span className={`text-sm ${step.done ? "text-white" : "text-white/50"}`}>{step.label}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {!slide.isCover && (
                <div className="md:col-span-2 flex items-center justify-center">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 120 }} className="text-center">
                    <p className="text-7xl md:text-8xl font-black tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">{slide.stat.value}</p>
                    <p className="text-lg text-white/50 mt-2">{slide.stat.label}</p>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {current > 0 && (
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-20">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {current < SLIDES.length - 1 && (
          <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-20">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {!isFullscreen && (
        <footer className="flex items-center justify-center gap-2 py-4 bg-slate-950/90 border-t border-white/10">
          {SLIDES.map((s, i) => (
            <button key={s.id} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? "w-8 bg-cyan-400" : "w-2 bg-white/20 hover:bg-white/40"}`} />
          ))}
        </footer>
      )}
    </div>
  );
}
