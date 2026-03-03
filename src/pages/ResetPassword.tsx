import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { checkPasswordStrength, checkHIBP } from "@/lib/passwordSecurity";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [hibpCount, setHibpCount] = useState<number | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    if (window.location.hash.includes("type=recovery")) setIsRecovery(true);
    return () => subscription.unsubscribe();
  }, []);

  // Debounced HIBP check
  useEffect(() => {
    if (password.length < 8) { setHibpCount(null); return; }
    const t = setTimeout(() => { checkHIBP(password).then(setHibpCount); }, 600);
    return () => clearTimeout(t);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const strength = checkPasswordStrength(password);
    if (!strength.valid) {
      toast({ title: "Mot de passe trop faible", description: strength.issues[0], variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    // Block breached passwords
    if (hibpCount === null) {
      const count = await checkHIBP(password);
      setHibpCount(count);
      if (count > 0) {
        toast({ title: "Mot de passe compromis", description: "Ce mot de passe apparaît dans des fuites de données. Choisissez-en un autre.", variant: "destructive" });
        return;
      }
    } else if (hibpCount > 0) {
      toast({ title: "Mot de passe compromis", description: "Choisissez un mot de passe qui n'a pas été exposé.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      toast({ title: "Succès", description: "Votre mot de passe a été mis à jour." });
      setTimeout(() => navigate("/login"), 3000);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 border border-accent/20">
            <Lock className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground">Nouveau mot de passe</h1>
          <p className="mt-2 text-primary-foreground/50">Choisissez un mot de passe sécurisé</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-primary-foreground font-semibold text-lg">Mot de passe mis à jour !</p>
              <p className="text-primary-foreground/50 text-sm">Redirection vers la page de connexion…</p>
            </motion.div>
          ) : !isRecovery ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-primary-foreground/70">Ce lien n'est pas valide ou a expiré.</p>
              <Button variant="outline" className="border-white/10 text-primary-foreground hover:bg-white/10" onClick={() => navigate("/login")}>
                Retour à la connexion
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-primary-foreground/70 font-medium">Nouveau mot de passe</Label>
                <Input
                  id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required minLength={8} placeholder="Minimum 8 caractères, majuscule + chiffre"
                  className="bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl focus:border-accent/50 focus:ring-accent/20"
                />
                <PasswordStrengthBar password={password} hibpCount={hibpCount} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-primary-foreground/70 font-medium">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword" type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required minLength={8} placeholder="Retapez le mot de passe"
                  className="bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl focus:border-accent/50 focus:ring-accent/20"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400">Les mots de passe ne correspondent pas</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 border-0 rounded-xl text-base font-semibold shadow-lg shadow-accent/20"
                disabled={submitting || (hibpCount != null && hibpCount > 0)}
              >
                {submitting ? "Mise à jour…" : <>Mettre à jour <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-primary-foreground/30">
          <Zap className="inline h-3 w-3 mr-1 text-accent/50" />
          AXIOM • Plateforme RH Tech
        </p>
      </motion.div>
    </div>
  );
}
