import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageLoader } from "@/components/FullPageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Login() {
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) return <FullPageLoader />;
  if (session) return <Navigate to="/onboarding-role" replace />;

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setMagicSent(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <Helmet>
        <title>Connexion – AXIOM & ALTIS | Espace recruteur & talent</title>
        <meta name="description" content="Connectez-vous à votre espace AXIOM : recruteur, entreprise ou talent. Accédez aux profils certifiés et au suivi de vos recrutements." />
        <link rel="canonical" href="https://axiom-talents.com/login" />
        <meta property="og:title" content="Connexion – AXIOM & ALTIS" />
        <meta property="og:description" content="Accédez à votre tableau de bord recruteur ou talent. Certification officielle + conformité garantie." />
        <meta property="og:url" content="https://axiom-talents.com/login" />
      </Helmet>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 border border-accent/20">
            <Zap className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground">Bon retour</h1>
          <p className="mt-2 text-primary-foreground/50">Connectez-vous à votre espace AXIOM</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {magicSent ? (
              <motion.div
                key="magic-sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-primary-foreground font-semibold text-lg">Lien envoyé !</p>
                <p className="text-primary-foreground/50 text-sm">
                  Vérifiez votre boîte mail <span className="font-medium text-primary-foreground/70">{email}</span> et cliquez sur le lien pour vous connecter.
                </p>
                <Button
                  variant="ghost"
                  className="text-accent hover:text-accent/80 font-semibold"
                  onClick={() => { setMagicSent(false); setEmail(""); }}
                >
                  Utiliser une autre adresse
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: easeOut }}
                className="space-y-6"
              >
                <form onSubmit={usePassword ? handlePasswordLogin : handleMagicLink} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary-foreground/70 font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/30" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="vous@exemple.com"
                        className="pl-10 bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl focus:border-accent/50 focus:ring-accent/20"
                      />
                    </div>
                  </div>
                  {usePassword && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-primary-foreground/70 font-medium">Mot de passe</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl focus:border-accent/50 focus:ring-accent/20"
                      />
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 border-0 rounded-xl text-base font-semibold shadow-lg shadow-accent/20"
                    disabled={submitting}
                  >
                    {submitting ? "Connexion…" : usePassword ? (
                      <>Se connecter <ArrowRight className="ml-2 h-4 w-4" /></>
                    ) : (
                      <>Recevoir un lien de connexion <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-xs text-primary-foreground/40 hover:text-accent transition-colors"
                    onClick={() => setUsePassword(!usePassword)}
                  >
                    {usePassword ? "Utiliser un lien magique" : "Se connecter avec un mot de passe"}
                  </button>
                </form>

                <div className="text-center space-y-2">
                  <p className="text-sm text-primary-foreground/40">
                    Pas encore de compte ?{" "}
                    <Link to="/signup-light" className="font-semibold text-accent hover:text-accent/80 transition-colors">
                      Créer un compte
                    </Link>
                  </p>
                  <p className="text-sm text-primary-foreground/40">
                    <Link to="/lien-magique" className="font-semibold text-primary-foreground/60 hover:text-accent transition-colors">
                      Accès perdu ? Renvoyer un lien
                    </Link>
                  </p>
                  <button
                    type="button"
                    className="text-xs text-primary-foreground/30 hover:text-accent transition-colors"
                    onClick={async () => {
                      if (!email.trim()) {
                        toast({ title: "Erreur", description: "Entrez votre email d'abord", variant: "destructive" });
                        return;
                      }
                      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
                      else toast({ title: "Email envoyé", description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe." });
                    }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-8 text-center text-xs text-primary-foreground/30">
          <Zap className="inline h-3 w-3 mr-1 text-accent/50" />
          AXIOM • Plateforme RH Tech
        </p>
      </motion.div>
    </div>
  );
}
