import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Star, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Login() {
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/onboarding-role" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-ocre/20 border border-gold/20">
            <Globe className="h-8 w-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground">
            Bon retour
          </h1>
          <p className="mt-2 text-primary-foreground/50">
            Connectez-vous à votre espace premium
          </p>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-primary-foreground/70 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                className="bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-primary-foreground/70 font-medium">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-gold to-ocre text-white hover:opacity-90 border-0 rounded-xl text-base font-semibold shadow-lg shadow-ocre/20"
              disabled={submitting}
            >
              {submitting ? "Connexion…" : (
                <>Se connecter <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center"><span className="bg-transparent px-3 text-xs text-primary-foreground/30">ou</span></div>
          </div>

          <p className="text-center text-sm text-primary-foreground/40">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="font-semibold text-gold hover:text-ocre transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-primary-foreground/30">
          <Star className="inline h-3 w-3 mr-1 text-gold/50" />
          Service Premium • Axiom & Altis Mobility
        </p>
      </motion.div>
    </div>
  );
}
