import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowRight, Building2, Mail, Lock, User, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { z } from "zod";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const signupSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Minimum 2 caractères")
    .max(100, "Maximum 100 caractères"),
  fullName: z
    .string()
    .trim()
    .min(2, "Minimum 2 caractères")
    .max(100, "Maximum 100 caractères"),
  email: z
    .string()
    .trim()
    .email("Adresse email invalide")
    .max(255, "Maximum 255 caractères"),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre"),
});

type FormData = z.infer<typeof signupSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;
type TouchedFields = Partial<Record<keyof FormData, boolean>>;

const passwordRules = [
  { label: "8 caractères minimum", test: (v: string) => v.length >= 8 },
  { label: "Une majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Un chiffre", test: (v: string) => /[0-9]/.test(v) },
];

export default function Signup() {
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>({
    companyName: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState<TouchedFields>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const errors = useMemo<FormErrors>(() => {
    const result = signupSchema.safeParse(form);
    if (result.success) return {};
    const fieldErrors: FormErrors = {};
    result.error.issues.forEach((issue) => {
      const key = issue.path[0] as keyof FormData;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    });
    return fieldErrors;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  if (loading) return null;
  if (session) return <Navigate to="/onboarding-role" replace />;

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ companyName: true, fullName: true, email: true, password: true });

    if (!isValid) return;

    setSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: form.fullName.trim(),
          company_name: form.companyName.trim(),
        },
      },
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Inscription réussie",
        description: "Vérifiez votre email pour confirmer votre compte.",
      });
    }
    setSubmitting(false);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 border border-accent/20">
            <Building2 className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground">
            Espace Entreprise
          </h1>
          <p className="mt-2 text-primary-foreground/50">
            Créez votre compte et recrutez vos futurs talents
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Company Name */}
            <FormField
              id="companyName"
              label="Nom de l'entreprise"
              icon={Building2}
              type="text"
              placeholder="Votre entreprise"
              value={form.companyName}
              error={touched.companyName ? errors.companyName : undefined}
              onChange={(v) => updateField("companyName", v)}
              onBlur={() => markTouched("companyName")}
              isValid={touched.companyName && !errors.companyName && form.companyName.length > 0}
            />

            {/* Full Name */}
            <FormField
              id="fullName"
              label="Nom complet"
              icon={User}
              type="text"
              placeholder="Prénom Nom"
              value={form.fullName}
              error={touched.fullName ? errors.fullName : undefined}
              onChange={(v) => updateField("fullName", v)}
              onBlur={() => markTouched("fullName")}
              isValid={touched.fullName && !errors.fullName && form.fullName.length > 0}
            />

            {/* Email */}
            <FormField
              id="email"
              label="Email professionnel"
              icon={Mail}
              type="email"
              placeholder="vous@entreprise.com"
              value={form.email}
              error={touched.email ? errors.email : undefined}
              onChange={(v) => updateField("email", v)}
              onBlur={() => markTouched("email")}
              isValid={touched.email && !errors.email && form.email.length > 0}
            />

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-primary-foreground/70 font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/30" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  onBlur={() => markTouched("password")}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl pl-10 pr-10 focus:border-accent/50 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength indicators */}
              {form.password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 pt-1"
                >
                  {passwordRules.map((rule) => {
                    const passes = rule.test(form.password);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        {passes ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-primary-foreground/25 shrink-0" />
                        )}
                        <span
                          className={`text-xs transition-colors ${
                            passes ? "text-emerald-400" : "text-primary-foreground/30"
                          }`}
                        >
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 border-0 rounded-xl text-base font-semibold shadow-lg shadow-accent/20 disabled:opacity-50"
              disabled={submitting || !isValid}
            >
              {submitting ? (
                "Création…"
              ) : (
                <>
                  Créer mon compte <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-3 text-xs text-primary-foreground/30">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-white/10 bg-white/5 text-primary-foreground hover:bg-white/10 font-medium"
            disabled={googleLoading}
            onClick={async () => {
              setGoogleLoading(true);
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast({ title: "Erreur", description: String(error), variant: "destructive" });
              }
              setGoogleLoading(false);
            }}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Connexion…" : "Continuer avec Google"}
          </Button>

          <div className="flex flex-col gap-2 text-center text-sm">
            <p className="text-primary-foreground/40">
              Vous êtes un talent ?{" "}
              <Link to="/signup-talent" className="font-semibold text-accent hover:text-accent/80 transition-colors">
                Inscription talent
              </Link>
            </p>
            <p className="text-primary-foreground/40">
              Déjà inscrit ?{" "}
              <Link to="/login" className="font-semibold text-accent hover:text-accent/80 transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-primary-foreground/30">
          <Zap className="inline h-3 w-3 mr-1 text-accent/50" />
          AXIOM • Plateforme RH Tech
        </p>
      </motion.div>
    </div>
  );
}

/* ── Reusable form field ── */

interface FormFieldProps {
  id: string;
  label: string;
  icon: typeof Mail;
  type: string;
  placeholder: string;
  value: string;
  error?: string;
  isValid: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function FormField({ id, label, icon: Icon, type, placeholder, value, error, isValid, onChange, onBlur }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-primary-foreground/70 font-medium">
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/30" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl pl-10 pr-10 focus:border-accent/50 focus:ring-accent/20 transition-colors ${
            error ? "border-destructive/50" : isValid ? "border-emerald-500/50" : ""
          }`}
        />
        {isValid && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
        )}
        {error && (
          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
