import { useState, useMemo, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Zap,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { z } from "zod";
import { CvUploadSection } from "@/components/signup/CvUploadSection";
import { PremiumBadge } from "@/components/signup/PremiumBadge";

/* ── Validation ── */

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Minimum 2 caractères").max(100),
    email: z.string().trim().email("Adresse email invalide").max(255),
    phone: z.string().trim().min(8, "Numéro invalide").max(20),
    country: z.string().min(1, "Champ requis"),
    password: z
      .string()
      .min(8, "Minimum 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre"),
    confirmPassword: z.string(),
    acceptCgu: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter les CGU" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof signupSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;
type TouchedFields = Partial<Record<keyof FormData, boolean>>;

const passwordRules = [
  { label: "8 caractères minimum", test: (v: string) => v.length >= 8 },
  { label: "Une majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Un chiffre", test: (v: string) => /[0-9]/.test(v) },
];

const countries = [
  "Cameroun",
  "Sénégal",
  "Côte d'Ivoire",
  "Mali",
  "Burkina Faso",
  "Congo (RDC)",
  "Gabon",
  "Bénin",
  "Togo",
  "Guinée",
  "Autre",
];

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── Component ── */

export default function Signup() {
  const { session, loading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "+237 ",
    country: "Cameroun",
    password: "",
    confirmPassword: "",
    acceptCgu: false as boolean,
  });
  const [touched, setTouched] = useState<TouchedFields>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [certifyMinefop, setCertifyMinefop] = useState(false);

  // CV upload
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvAnalysis, setCvAnalysis] = useState<"idle" | "analyzing" | "done">("idle");
  const [mockScore] = useState(() => Math.floor(Math.random() * 31) + 65); // 65-95

  useEffect(() => {
    if (cvFile && cvAnalysis === "idle") {
      setCvAnalysis("analyzing");
      const timer = setTimeout(() => setCvAnalysis("done"), 2200);
      return () => clearTimeout(timer);
    }
  }, [cvFile, cvAnalysis]);

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

  const updateField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const markTouched = (field: keyof FormData) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: TouchedFields = {
      fullName: true,
      email: true,
      phone: true,
      country: true,
      password: true,
      confirmPassword: true,
      acceptCgu: true,
    };
    setTouched(allTouched);
    if (!isValid) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          country: form.country,
          role: "talent",
          certify_minefop: certifyMinefop,
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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero header */}
      <div className="bg-[#1E3A8A] text-white">
        <div className="container max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Inscription Candidat – Gratuit et sans engagement
            </h1>
            <p className="mt-4 text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Rejoignez la première plateforme de mobilité professionnelle France-Afrique.
              Matching prédictif + certifications MINEFOP/MINREX.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="container max-w-lg mx-auto px-4 -mt-6 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
        >
          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-black/[0.04] p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSignup} className="space-y-5">
              {/* Full Name */}
              <FieldWrapper
                id="fullName"
                label="Nom complet"
                icon={User}
                error={touched.fullName ? errors.fullName : undefined}
                isValid={touched.fullName && !errors.fullName && form.fullName.length > 0}
              >
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  onBlur={() => markTouched("fullName")}
                  placeholder="Prénom Nom"
                  className="pl-10 pr-10 h-11 rounded-xl border-black/10 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20"
                />
              </FieldWrapper>

              {/* Email */}
              <FieldWrapper
                id="email"
                label="Email"
                icon={Mail}
                error={touched.email ? errors.email : undefined}
                isValid={touched.email && !errors.email && form.email.length > 0}
              >
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  onBlur={() => markTouched("email")}
                  placeholder="vous@email.com"
                  className="pl-10 pr-10 h-11 rounded-xl border-black/10 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20"
                />
              </FieldWrapper>

              {/* Phone */}
              <FieldWrapper
                id="phone"
                label="Téléphone"
                icon={Phone}
                error={touched.phone ? errors.phone : undefined}
                isValid={touched.phone && !errors.phone && form.phone.length > 5}
              >
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  onBlur={() => markTouched("phone")}
                  placeholder="+237 6XX XX XX XX"
                  className="pl-10 pr-10 h-11 rounded-xl border-black/10 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20"
                />
              </FieldWrapper>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-[#1F2937]">
                  Pays d'origine
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 z-10 pointer-events-none" />
                  <Select value={form.country} onValueChange={(v) => updateField("country", v)}>
                    <SelectTrigger className="pl-10 h-11 rounded-xl border-black/10 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#1F2937]">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    onBlur={() => markTouched("password")}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 rounded-xl border-black/10 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1 pt-1"
                  >
                    {passwordRules.map((rule) => {
                      const passes = rule.test(form.password);
                      return (
                        <div key={rule.label} className="flex items-center gap-2">
                          {passes ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className={`text-xs ${passes ? "text-emerald-600" : "text-muted-foreground/50"}`}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <FieldWrapper
                id="confirmPassword"
                label="Confirmer le mot de passe"
                icon={Lock}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                isValid={
                  touched.confirmPassword &&
                  !errors.confirmPassword &&
                  form.confirmPassword.length > 0 &&
                  form.password === form.confirmPassword
                }
              >
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  onBlur={() => markTouched("confirmPassword")}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 rounded-xl border-black/10 focus:border-[#3B82F6] focus:ring-[#3B82F6]/20"
                />
              </FieldWrapper>

              {/* CV Upload */}
              <CvUploadSection
                file={cvFile}
                onFileSelect={(f) => { setCvFile(f); setCvAnalysis("idle"); }}
                analysisState={cvAnalysis}
                mockScore={mockScore}
              />

              {/* CGU Checkbox */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acceptCgu"
                    checked={form.acceptCgu}
                    onCheckedChange={(v) => {
                      updateField("acceptCgu", v === true);
                      markTouched("acceptCgu");
                    }}
                    className="mt-0.5"
                  />
                  <Label htmlFor="acceptCgu" className="text-xs text-[#1F2937]/70 leading-relaxed cursor-pointer">
                    J'accepte les{" "}
                    <span className="text-[#3B82F6] underline">CGU</span> et la{" "}
                    <span className="text-[#3B82F6] underline">politique de confidentialité</span>{" "}
                    (RGPD compliant)
                  </Label>
                </div>
                {touched.acceptCgu && errors.acceptCgu && (
                  <p className="text-xs text-destructive">{errors.acceptCgu}</p>
                )}

                {/* MINEFOP Checkbox + Premium Badge */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="certifyMinefop"
                    checked={certifyMinefop}
                    onCheckedChange={(v) => setCertifyMinefop(v === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1.5">
                    <Label htmlFor="certifyMinefop" className="text-xs text-[#1F2937]/70 leading-relaxed cursor-pointer">
                      Je souhaite certifier mes diplômes via MINEFOP/MINREX
                    </Label>
                    <PremiumBadge />
                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                      Visibilité prioritaire + badge AXIOM READY
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting || !isValid}
                className="w-full h-12 rounded-xl text-base font-semibold bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-lg shadow-[#3B82F6]/20 transition-all duration-200 hover:shadow-[#3B82F6]/30 disabled:opacity-50"
              >
                {submitting ? (
                  "Création en cours…"
                ) : (
                  <>
                    Créer mon profil gratuitement <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl border-black/10 hover:bg-black/[0.02] font-medium"
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
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {googleLoading ? "Connexion…" : "Continuer avec Google"}
            </Button>

            {/* Links */}
            <div className="flex flex-col gap-2 text-center text-sm">
              <p className="text-muted-foreground">
                Je suis une entreprise →{" "}
                <Link to="/signup-talent" className="font-semibold text-[#3B82F6] hover:text-[#1E3A8A] transition-colors">
                  Inscription recruteur
                </Link>
              </p>
              <p className="text-muted-foreground">
                Déjà inscrit ?{" "}
                <Link to="/login" className="font-semibold text-[#3B82F6] hover:text-[#1E3A8A] transition-colors">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-1">
            <p className="text-xs text-muted-foreground/60">
              <Zap className="inline h-3 w-3 mr-1 text-[#3B82F6]/50" />
              AXIOM – TIaaS | ALTIS Mobility – Pack Zéro Stress
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Reusable field wrapper ── */

interface FieldWrapperProps {
  id: string;
  label: string;
  icon: typeof Mail;
  error?: string;
  isValid: boolean;
  children: React.ReactNode;
}

function FieldWrapper({ id, label, icon: Icon, error, isValid, children }: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-[#1F2937]">
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
        {children}
        {isValid && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
        )}
        {error && (
          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive pointer-events-none" />
        )}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">
          {error}
        </motion.p>
      )}
    </div>
  );
}
