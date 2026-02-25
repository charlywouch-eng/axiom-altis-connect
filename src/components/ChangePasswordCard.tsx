import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function ChangePasswordCard() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const rules = [
    { label: "8 caractères minimum", ok: newPassword.length >= 8 },
    { label: "Une majuscule", ok: /[A-Z]/.test(newPassword) },
    { label: "Un chiffre", ok: /\d/.test(newPassword) },
  ];

  const allValid =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    newPassword === confirmPassword &&
    confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "✅ Mot de passe modifié", description: "Votre nouveau mot de passe est actif." });
      setTimeout(() => setDone(false), 4000);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de modifier le mot de passe.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-primary to-accent/40" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lock className="h-3.5 w-3.5 text-primary" />
          </div>
          Changer le mot de passe
        </CardTitle>
      </CardHeader>
      <CardContent>
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 rounded-lg bg-success/10 border border-success/30 px-4 py-3"
          >
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <p className="text-sm font-medium text-foreground">
              Mot de passe mis à jour avec succès.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new_password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  {rules.map((r) => (
                    <span
                      key={r.label}
                      className={`text-[11px] flex items-center gap-1 ${r.ok ? "text-success" : "text-muted-foreground"}`}
                    >
                      <CheckCircle2 className={`h-3 w-3 ${r.ok ? "text-success" : "text-muted-foreground/40"}`} />
                      {r.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p className="text-[11px] text-destructive">Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" disabled={!allValid || submitting} className="gap-1.5">
                {submitting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Modification…</>
                ) : (
                  <><Lock className="h-3.5 w-3.5" />Modifier le mot de passe</>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
