import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4" style={{ background: "var(--gradient-hero)" }}>
      <Card className="w-full max-w-md animate-fade-in border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Globe className="h-6 w-6 text-accent-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">Axiom & Altis Mobility</CardTitle>
          <CardDescription>Connectez-vous à votre espace</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@exemple.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={submitting}>
              {submitting ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="font-medium text-accent hover:underline">
              S'inscrire
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
