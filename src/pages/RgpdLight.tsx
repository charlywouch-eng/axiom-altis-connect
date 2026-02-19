import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Eye,
  Pencil,
  Trash2,
  Ban,
  Download,
  Mail,
  ArrowLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const POINTS = [
  {
    icon: Eye,
    title: "Quelles données ?",
    desc: "Email, métier, expérience, région. Uniquement ce qui est nécessaire au matching emploi.",
  },
  {
    icon: Lock,
    title: "Pourquoi ?",
    desc: "Matching IA avec offres France en tension (BTP, Santé, CHR, Logistique) et mobilité professionnelle.",
  },
  {
    icon: Shield,
    title: "Vos droits",
    desc: "Accès · Rectification · Effacement · Opposition · Portabilité — exercez-les à tout moment.",
  },
  {
    icon: Download,
    title: "Transfert UE",
    desc: "Vos données peuvent être transférées vers l'UE via Clauses Contractuelles Types 2021 (conformité RGPD).",
  },
  {
    icon: Ban,
    title: "Pas de vente de données",
    desc: "Vos données ne sont jamais vendues ni partagées avec des tiers sans votre consentement explicite.",
  },
];

const DROITS = [
  { icon: Eye, label: "Accès", desc: "Voir vos données" },
  { icon: Pencil, label: "Rectification", desc: "Corriger vos données" },
  { icon: Trash2, label: "Effacement", desc: "Supprimer votre compte" },
  { icon: Ban, label: "Opposition", desc: "Refuser le traitement" },
  { icon: Download, label: "Portabilité", desc: "Exporter vos données" },
];

export default function RgpdLight() {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(220,60%,18%)] flex flex-col"
      style={{ minHeight: "-webkit-fill-available" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto w-full">
        <Link
          to="/signup"
          className="flex items-center gap-1.5 text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'inscription
        </Link>
        <span className="text-primary-foreground/60 text-xs">RGPD · Résumé</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-10">
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut }}
        >
          <div className="bg-card rounded-2xl shadow-2xl border border-border/30 overflow-hidden">
            {/* Header */}
            <div className="bg-primary/10 border-b border-border/30 px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-base leading-tight">
                  Protection de vos données
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Résumé RGPD · AXIOM SAS · Responsable du traitement
                </p>
              </div>
            </div>

            {/* 5 points clés */}
            <div className="divide-y divide-border/40">
              {POINTS.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3, ease: easeOut }}
                  className="flex items-start gap-3 px-5 py-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <p.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Droits utilisateurs */}
            <div className="px-5 py-4 border-t border-border/40 bg-muted/30">
              <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-3">
                Exercer vos droits
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {DROITS.map((d) => (
                  <div
                    key={d.label}
                    className="flex flex-col items-center gap-1.5 bg-card rounded-xl border border-border/50 p-3 text-center"
                  >
                    <d.icon className="h-4 w-4 text-primary" />
                    <span className="text-[11px] font-semibold text-foreground leading-tight">
                      {d.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {d.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DPO Contact */}
            <div className="px-5 py-4 border-t border-border/40 space-y-3">
              <div className="flex items-center gap-2.5 bg-primary/5 border border-primary/20 rounded-xl p-3">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Contact DPO</p>
                  <a
                    href="mailto:rgpd@axiom-talents.com"
                    className="text-xs text-primary underline hover:no-underline"
                  >
                    rgpd@axiom-talents.com
                  </a>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                Durée de conservation : 24 mois max · Responsable : AXIOM SAS
              </p>
            </div>

            {/* CTAs */}
            <div className="px-5 pb-6 pt-1 space-y-2">
              <Button asChild className="w-full h-11 rounded-xl font-semibold gap-2">
                <Link to="/signup">
                  J'accepte et je m'inscris
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full h-9 rounded-xl text-sm text-muted-foreground">
                <Link to="/rgpd">
                  Voir la politique complète
                </Link>
              </Button>
            </div>
          </div>

          <p className="text-center text-[11px] text-white/40 mt-4 px-4">
            Conforme au Règlement Général sur la Protection des Données (UE) 2016/679
          </p>
        </motion.div>
      </div>
    </div>
  );
}
