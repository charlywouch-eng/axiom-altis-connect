import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2, Users, Search, Shield, ArrowRight, CheckCircle2,
  Briefcase, Globe, Star, Zap, ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import heroImg from "@/assets/hero-france-afrique.png";

/* ─── animation variants ─── */
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
};

/* ─── role card config ─── */
const ROLES = [
  {
    id: "talent" as const,
    label: "Je suis un talent",
    sublabel: "Candidat à la mobilité",
    description: "Gérez votre profil, vos diplômes, et accédez aux offres en France certifiées ALTIS.",
    icon: Users,
    gradient: "from-[hsl(189,94%,20%)] to-[hsl(189,94%,35%)]",
    accent: "hsl(189,94%,43%)",
    accentLight: "hsl(189,94%,43%,0.15)",
    perks: ["Score matching IA", "Suivi visa & relocation", "Offres BTP / Santé / CHR"],
    dest: "/dashboard-talent",
  },
  {
    id: "recruteur" as const,
    label: "Je suis recruteur",
    sublabel: "Chasseur de talents",
    description: "Recherchez, sélectionnez et matchez des profils certifiés pour vos missions.",
    icon: Search,
    gradient: "from-[hsl(221,83%,20%)] to-[hsl(221,83%,38%)]",
    accent: "hsl(221,83%,60%)",
    accentLight: "hsl(221,83%,60%,0.15)",
    perks: ["Pipeline recrutement", "Matching IA avancé", "Dossiers vérifiés MINEFOP"],
    dest: "/dashboard-recruteur",
  },
  {
    id: "entreprise" as const,
    label: "Je suis une entreprise",
    sublabel: "Employeur / DRH",
    description: "Recrutez des talents internationaux qualifiés pour vos besoins en mobilité.",
    icon: Building2,
    gradient: "from-[hsl(222,47%,10%)] to-[hsl(222,47%,22%)]",
    accent: "hsl(37,91%,55%)",
    accentLight: "hsl(37,91%,55%,0.15)",
    perks: ["Offres multi-postes", "Compliance & subventions", "Tableau de bord RH"],
    dest: "/dashboard-entreprise",
  },
];

export default function OnboardingRole() {
  const { session, role, loading, user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminCode, setAdminCode] = useState("");

  /* ─── guards ─── */
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (role === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;
  if (role === "talent") return <Navigate to="/dashboard-talent" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "recruteur") return <Navigate to="/dashboard-recruteur" replace />;
  if (role) return <Navigate to="/dashboard" replace />;

  /* ─── handlers ─── */
  const selectRole = async (selectedRole: "entreprise" | "talent" | "recruteur") => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("user_roles")
      .update({ role: selectedRole })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    const dest = ROLES.find((r) => r.id === selectedRole)?.dest ?? "/dashboard";
    window.location.href = dest;
  };

  const handleAdminSubmit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-admin-code", {
        body: { code: adminCode },
      });
      if (error) throw error;
      if (data?.valid) {
        window.location.href = "/admin";
      } else {
        toast({ title: "Code invalide", description: "Le code administrateur est incorrect.", variant: "destructive" });
        setAdminCode("");
        setSubmitting(false);
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: "linear-gradient(135deg, hsl(222,47%,7%) 0%, hsl(221,83%,14%) 100%)" }}>

      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* glow blobs */}
        <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "hsl(189,94%,43%,0.08)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full blur-3xl" style={{ background: "hsl(221,83%,60%,0.10)" }} />

        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "hsl(189,94%,43%,0.18)" }}>
              <Zap className="h-5 w-5" style={{ color: "hsl(189,94%,43%)" }} />
            </div>
            <span className="font-bold text-xl tracking-wide" style={{ color: "hsl(0,0%,100%)" }}>
              AXIOM <span style={{ color: "hsl(189,94%,43%)" }}>×</span> ALTIS
            </span>
          </div>

          {/* hero image */}
          <motion.img
            src={heroImg}
            alt="France-Afrique RH"
            className="w-72 mx-auto mb-8 rounded-2xl"
            style={{ filter: "drop-shadow(0 20px 40px hsl(189,94%,43%,0.25))" }}
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />

          <h2 className="text-2xl font-bold mb-3" style={{ color: "hsl(0,0%,100%)" }}>
            Bienvenue sur la plateforme
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "hsl(215,25%,65%)" }}>
            Choisissez votre profil pour accéder à votre espace personnalisé et commencer votre parcours.
          </p>

          {/* trust badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {[
              { icon: Globe, label: "Cameroun → France" },
              { icon: Star, label: "MINEFOP certifié" },
              { icon: Briefcase, label: "9 métiers en tension" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: "hsl(0,0%,100%,0.07)", color: "hsl(215,25%,70%)" }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: "hsl(189,94%,43%)" }} />
                {label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right panel: role cards ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 lg:py-8 lg:px-10">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "hsl(189,94%,43%,0.18)" }}>
            <Zap className="h-4 w-4" style={{ color: "hsl(189,94%,43%)" }} />
          </div>
          <span className="font-bold text-lg tracking-wide" style={{ color: "hsl(0,0%,100%)" }}>
            AXIOM <span style={{ color: "hsl(189,94%,43%)" }}>×</span> ALTIS
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-7 text-center lg:text-left">
            <h1 className="text-2xl font-bold mb-1.5" style={{ color: "hsl(0,0%,100%)" }}>
              Choisissez votre profil
            </h1>
            <p className="text-sm" style={{ color: "hsl(215,25%,55%)" }}>
              Comment souhaitez-vous utiliser AXIOM ?
            </p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isHovered = hovered === r.id;
              return (
                <motion.button
                  key={r.id}
                  variants={cardVariant}
                  disabled={submitting}
                  onClick={() => selectRole(r.id)}
                  onMouseEnter={() => setHovered(r.id)}
                  onMouseLeave={() => setHovered(null)}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="w-full text-left rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden"
                  style={{
                    background: isHovered
                      ? `linear-gradient(135deg, ${r.accentLight}, hsl(0,0%,100%,0.05))`
                      : "hsl(0,0%,100%,0.04)",
                    borderColor: isHovered ? r.accent : "hsl(0,0%,100%,0.08)",
                    boxShadow: isHovered ? `0 8px 32px ${r.accent}22` : "none",
                  }}
                >
                  {/* Glow edge */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none rounded-2xl"
                        style={{ background: `linear-gradient(135deg, ${r.accent}10 0%, transparent 60%)` }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="flex items-start gap-4 relative z-10">
                    {/* Icon */}
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-300"
                      style={{ background: isHovered ? `${r.accent}25` : "hsl(0,0%,100%,0.07)" }}
                    >
                      <Icon className="h-5 w-5 transition-colors duration-300" style={{ color: isHovered ? r.accent : "hsl(215,25%,60%)" }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span
                          className="font-semibold text-base transition-colors duration-300"
                          style={{ color: isHovered ? "hsl(0,0%,100%)" : "hsl(215,25%,88%)" }}
                        >
                          {r.label}
                        </span>
                        <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: "hsl(0,0%,100%,0.07)", color: "hsl(215,25%,50%)" }}>
                          {r.sublabel}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed mb-3" style={{ color: "hsl(215,25%,50%)" }}>
                        {r.description}
                      </p>
                      {/* perks */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {r.perks.map((p) => (
                          <span key={p} className="flex items-center gap-1 text-xs" style={{ color: "hsl(215,25%,55%)" }}>
                            <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: r.accent }} />
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <motion.div
                      animate={{ x: isHovered ? 2 : 0, opacity: isHovered ? 1 : 0.3 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 mt-1"
                    >
                      <ChevronRight className="h-4 w-4" style={{ color: r.accent }} />
                    </motion.div>
                  </div>
                </motion.button>
              );
            })}

            {/* Admin subtle option */}
            {!showAdminInput ? (
              <motion.button
                variants={cardVariant}
                disabled={submitting}
                onClick={() => setShowAdminInput(true)}
                className="w-full text-left rounded-xl px-5 py-3 border flex items-center gap-3 transition-all duration-200 hover:bg-white/[0.04]"
                style={{ borderColor: "hsl(0,0%,100%,0.05)", color: "hsl(215,25%,40%)" }}
              >
                <Shield className="h-4 w-4 shrink-0" />
                <span className="text-sm">Accès administrateur</span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 border space-y-3"
                style={{ background: "hsl(0,0%,100%,0.04)", borderColor: "hsl(0,0%,100%,0.08)" }}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: "hsl(215,25%,50%)" }} />
                  <p className="text-sm font-medium" style={{ color: "hsl(215,25%,70%)" }}>Code administrateur requis</p>
                </div>
                <Input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleAdminSubmit()}
                  className="text-sm"
                  style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                    style={{ color: "hsl(215,25%,45%)" }}
                    onClick={() => { setShowAdminInput(false); setAdminCode(""); }}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    disabled={submitting || !adminCode}
                    onClick={handleAdminSubmit}
                    className="flex-1 text-xs font-semibold"
                    style={{ background: "hsl(189,94%,43%)", color: "hsl(222,47%,7%)" }}
                  >
                    Valider
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>

          <p className="mt-6 text-center text-xs" style={{ color: "hsl(215,25%,35%)" }}>
            Plateforme RH certifiée · Données sécurisées · RGPD
          </p>
        </motion.div>
      </div>
    </div>
  );
}
