import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Building2, Users, Shield, ArrowRight, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: easeOut },
  }),
};

export default function OnboardingRole() {
  const { session, role, loading, user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminCode, setAdminCode] = useState("");

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (role === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;
  if (role === "talent") return <Navigate to="/dashboard-talent" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role) return <Navigate to="/dashboard" replace />;

  const selectRole = async (selectedRole: "entreprise" | "talent" | "admin") => {
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

    toast({ title: "Bienvenue !", description: "Votre rôle a été défini avec succès." });
    const dest = selectedRole === "entreprise" ? "/dashboard-entreprise" : selectedRole === "talent" ? "/dashboard-talent" : selectedRole === "admin" ? "/admin" : "/dashboard";
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
        toast({ title: "Bienvenue !", description: "Votre rôle a été défini avec succès." });
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div
        initial="hidden" animate="visible"
        className="relative w-full max-w-lg"
      >
        <motion.div custom={0} variants={fadeUp} className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-ocre/20 border border-gold/20">
            <Globe className="h-8 w-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground">
            Choisissez votre profil
          </h1>
          <p className="mt-2 text-primary-foreground/50">
            Comment souhaitez-vous utiliser Axiom & Altis Mobility ?
          </p>
        </motion.div>

        <div className="space-y-4">
          <motion.button
            custom={1} variants={fadeUp}
            disabled={submitting}
            onClick={() => selectRole("entreprise")}
            className="glass-card group flex w-full items-start gap-5 rounded-2xl p-6 text-left transition-all hover:bg-white/10 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 disabled:opacity-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-ocre/20">
              <Building2 className="h-6 w-6 text-gold" />
            </div>
            <div className="flex-1">
              <p className="font-display text-lg font-semibold text-primary-foreground group-hover:text-gold transition-colors">
                Je suis une entreprise
              </p>
              <p className="mt-1 text-sm text-primary-foreground/50 leading-relaxed">
                Recrutez des talents internationaux pour vos projets de mobilité.
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 text-primary-foreground/20 group-hover:text-gold transition-colors shrink-0" />
          </motion.button>

          <motion.button
            custom={2} variants={fadeUp}
            disabled={submitting}
            onClick={() => selectRole("talent")}
            className="glass-card group flex w-full items-start gap-5 rounded-2xl p-6 text-left transition-all hover:bg-white/10 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 disabled:opacity-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-display text-lg font-semibold text-primary-foreground group-hover:text-accent transition-colors">
                Je suis un talent
              </p>
              <p className="mt-1 text-sm text-primary-foreground/50 leading-relaxed">
                Gérez votre profil, vos candidatures et votre parcours de relocation.
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 text-primary-foreground/20 group-hover:text-accent transition-colors shrink-0" />
          </motion.button>

          {!showAdminInput ? (
            <motion.button
              custom={3} variants={fadeUp}
              disabled={submitting}
              onClick={() => setShowAdminInput(true)}
              className="glass-card group flex w-full items-start gap-5 rounded-2xl p-6 text-left transition-all hover:bg-white/10 disabled:opacity-50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/5">
                <Shield className="h-6 w-6 text-primary-foreground/40" />
              </div>
              <div className="flex-1">
                <p className="font-display text-lg font-semibold text-primary-foreground/60 group-hover:text-primary-foreground transition-colors">
                  Je suis administrateur
                </p>
                <p className="mt-1 text-sm text-primary-foreground/30 leading-relaxed">
                  Accédez au back-office pour gérer la plateforme.
                </p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 text-primary-foreground/10 group-hover:text-primary-foreground/40 transition-colors shrink-0" />
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/5">
                  <Shield className="h-5 w-5 text-primary-foreground/60" />
                </div>
                <p className="font-display font-semibold text-primary-foreground">Code administrateur requis</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-code" className="text-primary-foreground/60">Entrez le code secret</Label>
                <Input
                  id="admin-code"
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleAdminSubmit()}
                  className="bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-white/10 text-primary-foreground/60 hover:bg-white/5" onClick={() => { setShowAdminInput(false); setAdminCode(""); }}>
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-gold to-ocre text-white hover:opacity-90 border-0"
                  disabled={submitting || !adminCode}
                  onClick={handleAdminSubmit}
                >
                  Valider
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        <motion.p custom={4} variants={fadeUp} className="mt-8 text-center text-xs text-primary-foreground/30">
          <Star className="inline h-3 w-3 mr-1 text-gold/50" />
          Service Premium • Axiom & Altis Mobility
        </motion.p>
      </motion.div>
    </div>
  );
}
