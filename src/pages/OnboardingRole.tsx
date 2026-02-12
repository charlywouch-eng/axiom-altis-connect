import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Building2, Users, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ADMIN_SECRET = "axiom2026";

export default function OnboardingRole() {
  const { session, role, loading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminCode, setAdminCode] = useState("");

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (role === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;
  if (role === "talent") return <Navigate to="/dashboard-talent" replace />;
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
    const dest = selectedRole === "entreprise" ? "/dashboard-entreprise" : selectedRole === "talent" ? "/dashboard-talent" : "/dashboard";
    window.location.href = dest;
  };

  const handleAdminSubmit = () => {
    if (adminCode === ADMIN_SECRET) {
      selectRole("admin");
    } else {
      toast({ title: "Code invalide", description: "Le code administrateur est incorrect.", variant: "destructive" });
      setAdminCode("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" style={{ background: "var(--gradient-hero)" }}>
      <Card className="w-full max-w-lg animate-fade-in border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Globe className="h-6 w-6 text-accent-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">Choisissez votre profil</CardTitle>
          <CardDescription>Comment souhaitez-vous utiliser Axiom & Altis Mobility ?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="flex h-auto w-full items-start gap-4 p-5 text-left"
            disabled={submitting}
            onClick={() => selectRole("entreprise")}
          >
            <Building2 className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
            <div>
              <p className="font-semibold">Je suis une entreprise</p>
              <p className="text-sm text-muted-foreground">Recrutez des talents internationaux pour vos projets de mobilité.</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex h-auto w-full items-start gap-4 p-5 text-left"
            disabled={submitting}
            onClick={() => selectRole("talent")}
          >
            <Users className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
            <div>
              <p className="font-semibold">Je suis un talent en recherche</p>
              <p className="text-sm text-muted-foreground">Gérez votre profil, vos candidatures et votre parcours de relocation.</p>
            </div>
          </Button>

          {!showAdminInput ? (
            <Button
              variant="outline"
              className="flex h-auto w-full items-start gap-4 p-5 text-left"
              disabled={submitting}
              onClick={() => setShowAdminInput(true)}
            >
              <Shield className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
              <div>
                <p className="font-semibold">Je suis administrateur</p>
                <p className="text-sm text-muted-foreground">Accédez au back-office pour gérer la plateforme.</p>
              </div>
            </Button>
          ) : (
            <div className="rounded-lg border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <p className="font-semibold">Code administrateur requis</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-code">Entrez le code secret</Label>
                <Input
                  id="admin-code"
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleAdminSubmit()}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowAdminInput(false); setAdminCode(""); }}>
                  Annuler
                </Button>
                <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" disabled={submitting || !adminCode} onClick={handleAdminSubmit}>
                  Valider
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
