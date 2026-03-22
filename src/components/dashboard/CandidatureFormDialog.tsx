import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  User, Phone, MapPin, Briefcase, GraduationCap,
  Award, Heart, ChevronRight, ChevronLeft, CheckCircle2,
  Plus, X, Loader2, Sparkles, Shield
} from "lucide-react";
import ExperiencePassportSection, { type AttestationFile } from "./ExperiencePassportSection";

interface Experience {
  poste: string;
  entreprise: string;
  duree: string;
  missions: string;
}

interface Formation {
  diplome: string;
  etablissement: string;
  annee: string;
  minefop: boolean;
}

const STEPS = [
  { label: "Informations", icon: User },
  { label: "Expérience", icon: Briefcase },
  { label: "Formation", icon: GraduationCap },
  { label: "Compétences", icon: Award },
  { label: "Souhait", icon: Heart },
  { label: "Passport", icon: Shield },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefillName?: string;
  prefillPhone?: string;
}

export default function CandidatureFormDialog({ open, onOpenChange, onSuccess, prefillName, prefillPhone }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Section 1
  const [fullName, setFullName] = useState(prefillName || "");
  const [phone, setPhone] = useState(prefillPhone || "");
  const [city, setCity] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  // Section 2
  const [experiences, setExperiences] = useState<Experience[]>([
    { poste: "", entreprise: "", duree: "", missions: "" },
  ]);

  // Section 3
  const [formations, setFormations] = useState<Formation[]>([
    { diplome: "", etablissement: "", annee: "", minefop: false },
  ]);

  // Section 4
  const [competences, setCompetences] = useState<string[]>([]);
  const [compInput, setCompInput] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certInput, setCertInput] = useState("");

  // Section 5
  const [contractType, setContractType] = useState("");
  const [mobility, setMobility] = useState("");
  const [desiredSalary, setDesiredSalary] = useState("");

  // Section 6 — Experience Passport
  const [attestations, setAttestations] = useState<AttestationFile[]>([]);
  const [minrexConsent, setMinrexConsent] = useState(false);
  const [employerVerification, setEmployerVerification] = useState(false);
  const [passportRgpd, setPassportRgpd] = useState(false);

  const addCompetence = () => {
    const v = compInput.trim();
    if (v && !competences.includes(v)) {
      setCompetences([...competences, v]);
      setCompInput("");
    }
  };

  const addCertification = () => {
    const v = certInput.trim();
    if (v && !certifications.includes(v)) {
      setCertifications([...certifications, v]);
      setCertInput("");
    }
  };

  const canProceed = () => {
    if (step === 0) return fullName.trim().length >= 2 && experienceYears.length > 0;
    if (step === 1) return experiences.some(e => e.poste.trim());
    if (step === 2) return formations.some(f => f.diplome.trim());
    if (step === 3) return competences.length > 0;
    if (step === 4) return contractType.trim().length > 0;
    if (step === 5) return passportRgpd && minrexConsent;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Compute a simple compliance score boost for experience
      const expBonus = experienceYears === "10+" ? 20 : experienceYears === "5-10" ? 15 : experienceYears === "2-5" ? 10 : 5;

      const { error } = await supabase.from("candidatures" as any).insert({
        talent_user_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        experiences: experiences.filter(e => e.poste.trim()),
        formations: formations.filter(f => f.diplome.trim()),
        competences,
        certifications,
        contract_type: contractType || null,
        mobility: mobility || null,
        desired_salary: desiredSalary || null,
        compliance_score: expBonus,
        status: "submitted",
      } as any);
      if (error) throw error;

      // Also update talent_profiles experience_years
      const expYearsNum = experienceYears === "10+" ? 12 : experienceYears === "5-10" ? 7 : experienceYears === "2-5" ? 3 : 1;
      await supabase.from("talent_profiles").update({ experience_years: expYearsNum } as any).eq("user_id", user.id);

      toast.success("Candidature envoyée ! Votre CV est maintenant visible par les recruteurs.");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header with progress */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-accent" />
              Postuler via AXIOM
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <button
                  key={i}
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-accent/15 text-accent"
                      : isDone
                      ? "text-accent/60 cursor-pointer hover:bg-accent/5"
                      : "text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* ── STEP 0: Informations personnelles */}
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-accent" /> Informations personnelles
                  </h3>
                  <p className="text-xs text-muted-foreground">Vos coordonnées seront partagées uniquement avec les recruteurs intéressés.</p>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="fn">Nom complet *</Label>
                      <Input id="fn" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ex: Jean-Pierre Kamga" />
                    </div>
                    <div>
                      <Label htmlFor="ph">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="ph" className="pl-10" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="ct">Ville (Cameroun)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="ct" className="pl-10" value={city} onChange={e => setCity(e.target.value)} placeholder="Douala, Yaoundé..." />
                      </div>
                    </div>
                    <div>
                      <Label>Années d'expérience professionnelle *</Label>
                      <Select value={experienceYears} onValueChange={setExperienceYears}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre expérience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-2">0 – 2 ans</SelectItem>
                          <SelectItem value="2-5">2 – 5 ans</SelectItem>
                          <SelectItem value="5-10">5 – 10 ans</SelectItem>
                          <SelectItem value="10+">10+ ans</SelectItem>
                        </SelectContent>
                      </Select>
                      {experienceYears && (experienceYears === "5-10" || experienceYears === "10+") && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] px-2 py-0.5 font-bold gap-1">
                            <Award className="h-2.5 w-2.5" /> Profil Expérimenté
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">Score IA boosté</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 1: Expérience */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-accent" /> Expérience professionnelle
                  </h3>
                  <p className="text-xs text-muted-foreground">Détaillez vos postes les plus pertinents pour le marché français.</p>
                  {experiences.map((exp, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Expérience {i + 1}</span>
                        {experiences.length > 1 && (
                          <button onClick={() => setExperiences(experiences.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <Input placeholder="Poste *" value={exp.poste} onChange={e => { const u = [...experiences]; u[i].poste = e.target.value; setExperiences(u); }} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Entreprise" value={exp.entreprise} onChange={e => { const u = [...experiences]; u[i].entreprise = e.target.value; setExperiences(u); }} />
                        <Input placeholder="Durée (ex: 3 ans)" value={exp.duree} onChange={e => { const u = [...experiences]; u[i].duree = e.target.value; setExperiences(u); }} />
                      </div>
                      <Textarea placeholder="Missions principales (1 par ligne)" value={exp.missions} onChange={e => { const u = [...experiences]; u[i].missions = e.target.value; setExperiences(u); }} rows={3} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setExperiences([...experiences, { poste: "", entreprise: "", duree: "", missions: "" }])} className="text-xs gap-1">
                    <Plus className="h-3 w-3" /> Ajouter une expérience
                  </Button>
                </div>
              )}

              {/* ── STEP 2: Formation */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-accent" /> Formation & Diplômes
                  </h3>
                  <p className="text-xs text-muted-foreground">Les diplômes certifiés MINEFOP augmentent votre score de +20%.</p>
                  {formations.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Formation {i + 1}</span>
                        {formations.length > 1 && (
                          <button onClick={() => setFormations(formations.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <Input placeholder="Diplôme / Certificat *" value={f.diplome} onChange={e => { const u = [...formations]; u[i].diplome = e.target.value; setFormations(u); }} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Établissement" value={f.etablissement} onChange={e => { const u = [...formations]; u[i].etablissement = e.target.value; setFormations(u); }} />
                        <Input placeholder="Année" value={f.annee} onChange={e => { const u = [...formations]; u[i].annee = e.target.value; setFormations(u); }} />
                      </div>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={f.minefop} onChange={e => { const u = [...formations]; u[i].minefop = e.target.checked; setFormations(u); }} className="rounded" />
                        <span>Certifié MINEFOP</span>
                      </label>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setFormations([...formations, { diplome: "", etablissement: "", annee: "", minefop: false }])} className="text-xs gap-1">
                    <Plus className="h-3 w-3" /> Ajouter une formation
                  </Button>
                </div>
              )}

              {/* ── STEP 3: Compétences */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Award className="h-4 w-4 text-accent" /> Compétences & Certifications
                  </h3>
                  <div>
                    <Label>Compétences *</Label>
                    <div className="flex gap-2">
                      <Input value={compInput} onChange={e => setCompInput(e.target.value)} placeholder="Ex: Maçonnerie, Soudure..." onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCompetence())} />
                      <Button variant="outline" size="sm" onClick={addCompetence} type="button">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {competences.map(c => (
                        <Badge key={c} className="bg-accent/10 text-accent border-accent/20 gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive" onClick={() => setCompetences(competences.filter(x => x !== c))}>
                          {c} <X className="h-2.5 w-2.5" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Attestations / Certifications</Label>
                    <div className="flex gap-2">
                      <Input value={certInput} onChange={e => setCertInput(e.target.value)} placeholder="Ex: Attestation de travail BTP..." onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCertification())} />
                      <Button variant="outline" size="sm" onClick={addCertification} type="button">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {certifications.map(c => (
                        <Badge key={c} variant="outline" className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive" onClick={() => setCertifications(certifications.filter(x => x !== c))}>
                          {c} <X className="h-2.5 w-2.5" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Souhait */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4 text-accent" /> Vos souhaits professionnels
                  </h3>
                  <p className="text-xs text-muted-foreground">Aidez les recruteurs à trouver le poste qui vous correspond.</p>
                  <div>
                    <Label>Type de contrat souhaité *</Label>
                    <Select value={contractType} onValueChange={setContractType}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CDI">CDI</SelectItem>
                        <SelectItem value="CDD">CDD</SelectItem>
                        <SelectItem value="Intérim">Intérim</SelectItem>
                        <SelectItem value="Saisonnier">Saisonnier</SelectItem>
                        <SelectItem value="Tout type">Ouvert à tout type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mobilité géographique</Label>
                    <Select value={mobility} onValueChange={setMobility}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Île-de-France">Île-de-France uniquement</SelectItem>
                        <SelectItem value="France entière">France entière</SelectItem>
                        <SelectItem value="Régions spécifiques">Régions spécifiques</SelectItem>
                        <SelectItem value="DOM-TOM inclus">DOM-TOM inclus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Salaire souhaité</Label>
                    <Input value={desiredSalary} onChange={e => setDesiredSalary(e.target.value)} placeholder="Ex: 1 800 € net/mois" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)} className="gap-1 text-xs">
            <ChevronLeft className="h-3.5 w-3.5" />
            {step === 0 ? "Annuler" : "Précédent"}
          </Button>

          {step < 4 ? (
            <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-1 text-xs bg-accent text-accent-foreground hover:bg-accent/90">
              Suivant <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={!canProceed() || submitting} className="gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Envoyer ma candidature
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
