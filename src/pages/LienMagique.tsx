import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function LienMagique() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
    setSubmitting(false);
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
            <Mail className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground">Retrouver mon accès</h1>
          <p className="mt-2 text-primary-foreground/50">
            Recevez un lien de connexion sécurisé par email
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
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
                  onClick={() => { setSent(false); setEmail(""); }}
                >
                  Utiliser une autre adresse
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: easeOut }}
                className="space-y-6"
              >
                <p className="text-sm text-primary-foreground/50">
                  AXIOM utilise un système <strong className="text-primary-foreground/70">sans mot de passe</strong>. 
                  Entrez votre email pour recevoir un lien de connexion sécurisé.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
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
                  <Button
                    type="submit"
                    className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 border-0 rounded-xl text-base font-semibold shadow-lg shadow-accent/20"
                    disabled={submitting}
                  >
                    {submitting ? "Envoi…" : "Recevoir mon lien de connexion"}
                  </Button>
                </form>

                <div className="text-center">
                  <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 font-semibold transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour à la connexion
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-8 text-center text-xs text-primary-foreground/30">
          <Zap className="inline h-3 w-3 mr-1 text-accent/50" />
          AXIOM • Connexion sécurisée sans mot de passe
        </p>
      </motion.div>
    </div>
  );
}
