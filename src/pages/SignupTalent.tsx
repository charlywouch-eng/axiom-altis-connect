import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Zap, ArrowRight, GraduationCap, Mail, User, CheckCircle2, XCircle,
  Globe, Languages, Briefcase, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

const countries = [
  "Sénégal", "Côte d'Ivoire", "Cameroun", "Mali", "Guinée", "Burkina Faso",
  "Bénin", "Togo", "Niger", "Congo (RDC)", "Congo (Brazzaville)", "Gabon",
  "Tchad", "Madagascar", "Tunisie", "Maroc", "Algérie", "Autre",
];

const frenchLevels = [
  { value: "A1", label: "A1 — Débutant" },
  { value: "A2", label: "A2 — Élémentaire" },
  { value: "B1", label: "B1 — Intermédiaire" },
  { value: "B2", label: "B2 — Avancé" },
  { value: "C1", label: "C1 — Autonome" },
  { value: "C2", label: "C2 — Maîtrise" },
  { value: "natif", label: "Natif / Bilingue" },
];

const suggestedSkills = [
  "Développement Web", "Data Science", "Cybersécurité", "DevOps", "Cloud AWS",
  "React", "Python", "Java", "Soudure", "Électricité", "Plomberie",
  "Charpente", "Génie Civil", "Comptabilité", "Logistique", "Santé",
];

const signupSchema = z.object({
  firstName: z.string().trim().min(2, "Minimum 2 caractères").max(50, "Maximum 50 caractères"),
  lastName: z.string().trim().min(2, "Minimum 2 caractères").max(50, "Maximum 50 caractères"),
  email: z.string().trim().email("Adresse email invalide").max(255, "Maximum 255 caractères"),
  country: z.string().min(1, "Sélectionnez un pays"),
  frenchLevel: z.string().min(1, "Sélectionnez un niveau"),
  experienceYears: z.number().min(0, "Minimum 0").max(50, "Maximum 50 ans"),
  skills: z.array(z.string()).min(1, "Ajoutez au moins une compétence"),
});

type FormData = z.infer<typeof signupSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;
type TouchedFields = Partial<Record<keyof FormData, boolean>>;

export default function SignupTalent() {
  const { session, loading } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    frenchLevel: "",
    experienceYears: 0,
    skills: [],
  });
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");

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

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !form.skills.includes(trimmed) && form.skills.length < 10) {
      updateField("skills", [...form.skills, trimmed]);
      setSkillInput("");
      markTouched("skills");
    }
  };

  const removeSkill = (skill: string) => {
    updateField("skills", form.skills.filter((s) => s !== skill));
    markTouched("skills");
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: TouchedFields = {
      firstName: true, lastName: true, email: true,
      country: true, frenchLevel: true, experienceYears: true, skills: true,
    };
    setTouched(allTouched);

    if (!isValid) return;

    setSubmitting(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: form.email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: form.fullName.trim(),
          role: "talent",
          country: form.country,
          french_level: form.frenchLevel,
          experience_years: form.experienceYears,
          skills: form.skills,
        },
      },
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setMagicSent(true);
    }
    setSubmitting(false);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: "var(--gradient-hero)" }}
    >
      <Helmet>
        <title>Créer mon profil talent – AXIOM &amp; ALTIS | Métiers en pénurie France</title>
        <meta name="description" content="Créez votre profil talent certifié pour les métiers en pénurie en France. Maçon, aide-soignant, cuisinier, chauffeur… Matching IA + Pack ALTIS visa, billet, logement." />
        <link rel="canonical" href="https://axiom-talents.com/signup-talent" />
        <meta property="og:title" content="Créer mon profil talent – AXIOM & ALTIS" />
        <meta property="og:description" content="Profil certifié MINEFOP pour travailler en France. Matching IA sur les métiers en tension + logistique ALTIS intégrée." />
        <meta property="og:url" content="https://axiom-talents.com/signup-talent" />
      </Helmet>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-accent/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="relative w-full max-w-lg"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 border border-accent/20">
            <GraduationCap className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground">
            Espace Talent
          </h1>
          <p className="mt-2 text-primary-foreground/50">
            Créez votre profil et accédez aux meilleures opportunités en France
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          {magicSent ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-primary-foreground font-semibold text-lg">Lien envoyé !</p>
              <p className="text-primary-foreground/50 text-sm">
                Vérifiez votre boîte mail <span className="font-medium text-primary-foreground/70">{form.email}</span> et cliquez sur le lien pour activer votre profil.
              </p>
              <Button
                variant="ghost"
                className="text-accent hover:text-accent/80 font-semibold"
                onClick={() => { setMagicSent(false); }}
              >
                Utiliser une autre adresse
              </Button>
            </div>
          ) : (
          <>
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Full Name */}
            <TextFormField
              id="fullName" label="Nom complet" icon={User}
              placeholder="Prénom Nom" value={form.fullName}
              error={touched.fullName ? errors.fullName : undefined}
              onChange={(v) => updateField("fullName", v)}
              onBlur={() => markTouched("fullName")}
              isValid={touched.fullName && !errors.fullName && form.fullName.length > 0}
            />

            {/* Email */}
            <TextFormField
              id="email" label="Email" icon={Mail} type="email"
              placeholder="vous@email.com" value={form.email}
              error={touched.email ? errors.email : undefined}
              onChange={(v) => updateField("email", v)}
              onBlur={() => markTouched("email")}
              isValid={touched.email && !errors.email && form.email.length > 0}
            />

            {/* Country + French Level — side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Country */}
              <div className="space-y-2">
                <Label className="text-primary-foreground/70 font-medium flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Pays d'origine
                </Label>
                <Select
                  value={form.country}
                  onValueChange={(v) => { updateField("country", v); markTouched("country"); }}
                >
                  <SelectTrigger className={`bg-white/5 border-white/10 text-primary-foreground h-12 rounded-xl focus:border-accent/50 focus:ring-accent/20 ${
                    touched.country && errors.country ? "border-destructive/50" : touched.country && form.country ? "border-emerald-500/50" : ""
                  }`}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.country && errors.country && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">{errors.country}</motion.p>
                )}
              </div>

              {/* French Level */}
              <div className="space-y-2">
                <Label className="text-primary-foreground/70 font-medium flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5" /> Niveau de français
                </Label>
                <Select
                  value={form.frenchLevel}
                  onValueChange={(v) => { updateField("frenchLevel", v); markTouched("frenchLevel"); }}
                >
                  <SelectTrigger className={`bg-white/5 border-white/10 text-primary-foreground h-12 rounded-xl focus:border-accent/50 focus:ring-accent/20 ${
                    touched.frenchLevel && errors.frenchLevel ? "border-destructive/50" : touched.frenchLevel && form.frenchLevel ? "border-emerald-500/50" : ""
                  }`}>
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {frenchLevels.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.frenchLevel && errors.frenchLevel && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">{errors.frenchLevel}</motion.p>
                )}
              </div>
            </div>

            {/* Experience Years */}
            <div className="space-y-2">
              <Label htmlFor="experience" className="text-primary-foreground/70 font-medium flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Années d'expérience
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/30" />
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={50}
                  value={form.experienceYears}
                  onChange={(e) => { updateField("experienceYears", parseInt(e.target.value) || 0); markTouched("experienceYears"); }}
                  onBlur={() => markTouched("experienceYears")}
                  className={`bg-white/5 border-white/10 text-primary-foreground h-12 rounded-xl pl-10 focus:border-accent/50 focus:ring-accent/20 ${
                    touched.experienceYears && errors.experienceYears ? "border-destructive/50" : touched.experienceYears && !errors.experienceYears ? "border-emerald-500/50" : ""
                  }`}
                />
                {touched.experienceYears && !errors.experienceYears && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label className="text-primary-foreground/70 font-medium">
                Compétences <span className="text-primary-foreground/30 text-xs font-normal">({form.skills.length}/10)</span>
              </Label>

              {/* Skill badges */}
              <AnimatePresence>
                {form.skills.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2"
                  >
                    {form.skills.map((skill) => (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        layout
                      >
                        <Badge
                          variant="secondary"
                          className="bg-accent/15 text-accent border-accent/20 hover:bg-accent/25 cursor-pointer gap-1 py-1 px-2.5"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill}
                          <X className="h-3 w-3" />
                        </Badge>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Skill input */}
              <Input
                placeholder="Tapez une compétence et appuyez Entrée"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={() => { if (skillInput.trim()) addSkill(skillInput); markTouched("skills"); }}
                className={`bg-white/5 border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 h-12 rounded-xl focus:border-accent/50 focus:ring-accent/20 ${
                  touched.skills && errors.skills ? "border-destructive/50" : touched.skills && form.skills.length > 0 ? "border-emerald-500/50" : ""
                }`}
                disabled={form.skills.length >= 10}
              />

              {/* Suggestions */}
              {form.skills.length < 10 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {suggestedSkills
                    .filter((s) => !form.skills.includes(s))
                    .slice(0, 6)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSkill(s)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-primary-foreground/40 hover:text-accent hover:border-accent/30 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              )}

              {touched.skills && errors.skills && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">{errors.skills}</motion.p>
              )}
            </div>

            {/* Magic link info */}
            <p className="text-xs text-primary-foreground/40 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-accent" />
              Un lien de connexion sécurisé sera envoyé à votre email – sans mot de passe
            </p>

            <Button
              type="submit"
              className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 border-0 rounded-xl text-base font-semibold shadow-lg shadow-accent/20 disabled:opacity-50"
              disabled={submitting || !isValid}
            >
              {submitting ? "Création…" : (
                <>Créer mon profil <ArrowRight className="ml-2 h-4 w-4" /></>
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

          <div className="flex flex-col gap-3">
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
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-white/10 bg-white/5 text-primary-foreground hover:bg-white/10 font-medium"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  toast({ title: "Erreur", description: String(error), variant: "destructive" });
                }
              }}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.23.74 3.01.8.88-.15 1.93-.81 3.13-.69 1.53.14 2.68.8 3.4 2.04-3.1 1.87-2.58 5.9.69 7.04-.68 1.61-1.59 3.2-2.23 3.69zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continuer avec Apple
            </Button>
          </div>

          <div className="flex flex-col gap-2 text-center text-sm">
            <p className="text-primary-foreground/40">
              Vous êtes une entreprise ?{" "}
              <Link to="/signup" className="font-semibold text-accent hover:text-accent/80 transition-colors">
                Inscription entreprise
              </Link>
            </p>
            <p className="text-primary-foreground/40">
              Déjà inscrit ?{" "}
              <Link to="/login" className="font-semibold text-accent hover:text-accent/80 transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
          </>
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

/* ── Reusable text form field ── */
interface TextFormFieldProps {
  id: string;
  label: string;
  icon: typeof Mail;
  type?: string;
  placeholder: string;
  value: string;
  error?: string;
  isValid: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function TextFormField({ id, label, icon: Icon, type = "text", placeholder, value, error, isValid, onChange, onBlur }: TextFormFieldProps) {
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
        {isValid && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />}
        {error && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive">{error}</motion.p>
      )}
    </div>
  );
}
