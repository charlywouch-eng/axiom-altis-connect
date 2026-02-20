import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
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
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  // Forgot password state — can be pre-activated via navigation state from /signup-light
  const [forgotMode, setForgotMode] = useState((location.state as any)?.forgotMode === true);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setForgotSent(true);
    }
    setForgotSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
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
          <AnimatePresence mode="wait">
            {forgotMode ? (
              <motion.div key="forgot-title" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h1 className="font-display text-3xl font-bold text-primary-foreground">Mot de passe oublié</h1>
                <p className="mt-2 text-primary-foreground/50">Nous vous enverrons un lien de réinitialisation</p>
              </motion.div>
            ) : (
              <motion.div key="login-title" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h1 className="font-display text-3xl font-bold text-primary-foreground">Bon retour</h1>
                <p className="mt-2 text-primary-foreground/50">Connectez-vous à votre espace AXIOM</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {forgotMode ? (
              <motion.div
                key="forgot-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: easeOut }}
                className="space-y-5"
              >
                {forgotSent ? (
                  <div className="flex flex-col items-center gap-4 py-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                    </div>
                    <p className="text-primary-foreground font-semibold text-lg">Email envoyé !</p>
                    <p className="text-primary-foreground/50 text-sm">
                      Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                    </p>
                    <Button
                      variant="ghost"
                      className="text-accent hover:text-accent/80 font-semibold"
                      onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(""); }}
                    >
                      Retour à la connexion
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-primary-foreground/70 font-medium">
                        Votre adresse email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/30" />
                        <Input
                          id="forgot-email"
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          autoFocus
                          placeholder="vous@exemple.com"
                          className="pl-10 bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl focus:border-accent/50 focus:ring-accent/20"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 border-0 rounded-xl text-base font-semibold shadow-lg shadow-accent/20"
                      disabled={forgotSubmitting}
                    >
                      {forgotSubmitting ? "Envoi…" : (
                        <>Envoyer le lien <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setForgotMode(false)}
                      className="w-full text-center text-sm text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
                    >
                      ← Retour à la connexion
                    </button>
                  </form>
                )}
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
                      className="bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl focus:border-accent/50 focus:ring-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-primary-foreground/70 font-medium">Mot de passe</Label>
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
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
                  <Button
                    type="submit"
                    className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 border-0 rounded-xl text-base font-semibold shadow-lg shadow-accent/20"
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

                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-white/5 border-white/10 text-primary-foreground hover:bg-white/10 rounded-xl font-medium"
                    disabled={oauthLoading !== null}
                    onClick={async () => {
                      setOauthLoading("google");
                      const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                      if (error) toast({ title: "Erreur", description: String(error), variant: "destructive" });
                      setOauthLoading(null);
                    }}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {oauthLoading === "google" ? "Connexion…" : "Continuer avec Google"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-white/5 border-white/10 text-primary-foreground hover:bg-white/10 rounded-xl font-medium"
                    disabled={oauthLoading !== null}
                    onClick={async () => {
                      setOauthLoading("apple");
                      const { error } = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
                      if (error) toast({ title: "Erreur", description: String(error), variant: "destructive" });
                      setOauthLoading(null);
                    }}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.23.74 3.01.8.88-.15 1.93-.81 3.13-.69 1.53.14 2.68.8 3.4 2.04-3.1 1.87-2.58 5.9.69 7.04-.68 1.61-1.59 3.2-2.23 3.69zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    {oauthLoading === "apple" ? "Connexion…" : "Continuer avec Apple"}
                  </Button>
                </div>

                <p className="text-center text-sm text-primary-foreground/40">
                  Pas encore de compte ?{" "}
                  <Link to="/signup" className="font-semibold text-accent hover:text-accent/80 transition-colors">
                    Créer un compte
                  </Link>
                </p>
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
