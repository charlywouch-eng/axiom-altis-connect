import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Plane, Home, FileText, Users, Shield, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { trackFunnel } from "@/lib/trackFunnel";
import { trackGA4 } from "@/lib/ga4";

const ALTIS_STEPS = [
  { icon: FileText, title: "Préparation dossier ANEF", desc: "Constitution complète de votre dossier de visa de travail via la procédure ANEF." },
  { icon: Plane,    title: "Accueil aéroport",         desc: "Prise en charge à votre arrivée en France par un membre de l'équipe ALTIS." },
  { icon: Home,     title: "Logement meublé 1 mois",   desc: "Hébergement meublé garanti pendant votre premier mois en France." },
  { icon: Users,    title: "Accompagnement administratif", desc: "Aide pour la Sécurité sociale, compte bancaire, titre de séjour et démarches." },
  { icon: Shield,   title: "Certification MINEFOP",    desc: "Validation officielle de vos diplômes et qualifications professionnelles." },
];

export default function PackAltisSuccess() {
  useEffect(() => {
    trackFunnel({
      event_name: "pack_altis_payment_success",
      source: "pack-altis-success",
    });
    trackGA4("conversion_pack_altis_success", {
      value: 29,
      currency: "EUR",
    });
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(222 47% 6%) 0%, hsl(222 47% 10%) 50%, hsl(221 83% 12%) 100%)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 700px 500px at 50% 30%, hsl(158 64% 38% / 0.08) 0%, transparent 70%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center gap-6"
          style={{
            background: "hsl(222 47% 9% / 0.95)",
            border: "1px solid hsl(158 64% 38% / 0.3)",
            boxShadow: "0 0 60px hsl(158 64% 38% / 0.12), 0 24px 48px hsl(0 0% 0% / 0.5)",
          }}
        >
          {/* Animated check */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="flex items-center justify-center w-24 h-24 rounded-full mx-auto"
            style={{ background: "radial-gradient(circle, hsl(158 64% 38% / 0.18) 0%, transparent 70%)" }}
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{
              background: "linear-gradient(135deg, hsl(45 93% 47% / 0.15), hsl(36 100% 50% / 0.15))",
              border: "1px solid hsl(45 93% 47% / 0.4)",
              color: "hsl(45 93% 60%)",
            }}
          >
            <Zap className="w-3 h-3" />
            Pack ALTIS activé ✓
          </motion.div>

          {/* Title */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
            <h1 className="text-2xl font-extrabold text-white mb-1">
              Votre Pack ALTIS est confirmé !
            </h1>
            <p className="text-sm" style={{ color: "hsl(215 16% 57%)" }}>
              Paiement de 29 € validé · Service complet débloqué
            </p>
          </motion.div>

          {/* Recap */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full rounded-xl p-5"
            style={{ background: "hsl(222 47% 6%)", border: "1px solid hsl(222 47% 18%)" }}
          >
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Récapitulatif de votre Pack
            </h2>
            <ul className="space-y-3">
              {ALTIS_STEPS.map(({ icon: Icon, title, desc }, i) => (
                <motion.li
                  key={title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + i * 0.1 }}
                  className="flex gap-3 text-left"
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: "hsl(158 64% 38% / 0.12)", border: "1px solid hsl(158 64% 38% / 0.25)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "hsl(158 64% 52%)" }} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs" style={{ color: "hsl(215 16% 57%)" }}>{desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Priority badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="w-full rounded-lg p-3 flex items-center gap-3"
            style={{ background: "hsl(158 64% 38% / 0.08)", border: "1px solid hsl(158 64% 38% / 0.2)" }}
          >
            <span className="text-2xl">🚀</span>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Priorité recruteurs ×3</p>
              <p className="text-xs" style={{ color: "hsl(158 64% 52%)" }}>
                Votre profil est désormais mis en avant auprès des entreprises françaises.
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
            className="w-full space-y-3"
          >
            <Link to="/dashboard-talent" className="block w-full">
              <Button
                className="w-full h-12 text-base font-bold rounded-xl flex items-center justify-center gap-2 group"
                style={{
                  background: "linear-gradient(135deg, hsl(158 64% 30%), hsl(158 64% 42%))",
                  boxShadow: "0 4px 24px hsl(158 64% 38% / 0.4)",
                }}
              >
                Accéder à mon Dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <p className="text-xs text-center" style={{ color: "hsl(215 16% 47%)" }}>
              Votre parcours ALTIS démarre maintenant · Un conseiller vous contactera sous 48h
            </p>
          </motion.div>
        </div>

        {/* Footer trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="flex items-center justify-center gap-6 mt-6 flex-wrap"
        >
          {[
            { icon: Shield, text: "RGPD compliant" },
            { icon: FileText, text: "Facture disponible" },
            { icon: Users, text: "MINEFOP certifié" },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-xs" style={{ color: "hsl(215 16% 47%)" }}>
              <Icon className="w-3.5 h-3.5" />
              {text}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
