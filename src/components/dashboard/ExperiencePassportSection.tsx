import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Shield, ExternalLink, Upload, X,
  CheckCircle2, Lock, AlertTriangle, Briefcase
} from "lucide-react";

export interface AttestationFile {
  file: File;
  type: "travail" | "stage" | "formation";
  minrexNumber: string;
}

interface Props {
  attestations: AttestationFile[];
  onAttestationsChange: (a: AttestationFile[]) => void;
  minrexConsent: boolean;
  onMinrexConsentChange: (v: boolean) => void;
  employerVerification: boolean;
  onEmployerVerificationChange: (v: boolean) => void;
  rgpdConsent: boolean;
  onRgpdConsentChange: (v: boolean) => void;
}

const ATTESTATION_TYPES = [
  { value: "travail" as const, label: "Attestation de travail", icon: Briefcase },
  { value: "stage" as const, label: "Attestation de stage", icon: FileText },
  { value: "formation" as const, label: "Attestation de formation", icon: FileText },
];

export default function ExperiencePassportSection({
  attestations,
  onAttestationsChange,
  minrexConsent,
  onMinrexConsentChange,
  employerVerification,
  onEmployerVerificationChange,
  rgpdConsent,
  onRgpdConsentChange,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedType, setSelectedType] = useState<"travail" | "stage" | "formation">("travail");

  const handleFileAdd = useCallback((file: File) => {
    const validTypes = ["application/pdf"];
    if (!validTypes.includes(file.type)) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) return;
    onAttestationsChange([
      ...attestations,
      { file, type: selectedType, minrexNumber: "" },
    ]);
  }, [attestations, onAttestationsChange, selectedType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileAdd(file);
  }, [handleFileAdd]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileAdd(file);
    e.target.value = "";
  }, [handleFileAdd]);

  const updateMinrex = (index: number, value: string) => {
    const updated = [...attestations];
    updated[index].minrexNumber = value;
    onAttestationsChange(updated);
  };

  const removeAttestation = (index: number) => {
    onAttestationsChange(attestations.filter((_, i) => i !== index));
  };

  const openMinrexVerification = (minrexNumber: string) => {
    const url = `https://www.minrex.cm/verification-legalisation/?ref=${encodeURIComponent(minrexNumber)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-accent/10 p-2.5">
          <Shield className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            AXIOM Verified Experience Passport
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Faites certifier vos attestations d'expérience avec la légalisation MINREX.
          </p>
        </div>
      </div>

      {/* Price badge */}
      <div className="flex items-center gap-2">
        <Badge className="bg-accent/15 text-accent border-accent/30 text-xs gap-1 px-3 py-1">
          <Lock className="h-3 w-3" /> 39 € — Vérification unique
        </Badge>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          Badge "AXIOM Verified Experience"
        </Badge>
      </div>

      {/* Type selector */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Type d'attestation</Label>
        <div className="flex flex-wrap gap-2">
          {ATTESTATION_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSelectedType(t.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedType === t.value
                  ? "bg-accent/15 text-accent border-accent/40"
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:border-accent/30"
              }`}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border/50 hover:border-accent/40 hover:bg-accent/5"
        }`}
        onClick={() => document.getElementById("attestation-upload")?.click()}
      >
        <input
          id="attestation-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        <Upload className="h-8 w-8 text-accent/50 mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">
          Glissez votre attestation PDF ici
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          PDF uniquement • 10 Mo max
        </p>
      </div>

      {/* Uploaded attestations */}
      <AnimatePresence>
        {attestations.map((att, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {att.file.name}
                    </span>
                    <Badge className="bg-accent/15 text-accent border-accent/30 text-[9px]">
                      {ATTESTATION_TYPES.find(t => t.value === att.type)?.label}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttestation(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* MINREX Number */}
                <div>
                  <Label className="text-xs">Numéro de légalisation MINREX</Label>
                  <Input
                    value={att.minrexNumber}
                    onChange={e => updateMinrex(i, e.target.value)}
                    placeholder="Ex: MINREX/LEG/2024/XXXXX"
                    className="mt-1 text-sm"
                  />
                </div>

                {/* Verify button */}
                {att.minrexNumber.trim().length > 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openMinrexVerification(att.minrexNumber)}
                    className="gap-1.5 text-xs border-accent/40 text-accent hover:bg-accent/10 w-full sm:w-auto"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Vérifier Légalisation MINREX
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* RGPD + Consents */}
      <div className="space-y-3 rounded-xl border border-border/50 bg-muted/30 p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3" /> Consentements obligatoires
        </h4>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={rgpdConsent}
            onCheckedChange={(v) => onRgpdConsentChange(v === true)}
            className="mt-0.5"
          />
          <span className="text-xs text-foreground/80 leading-relaxed">
            J'accepte que mes attestations d'expérience soient traitées par AXIOM conformément au{" "}
            <a href="/rgpd" className="text-accent underline" target="_blank">RGPD</a> et aux{" "}
            <a href="/rgpd" className="text-accent underline" target="_blank">CGU</a>.
            Mes documents seront conservés de manière sécurisée et partagés uniquement
            avec les recruteurs autorisés. *
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={minrexConsent}
            onCheckedChange={(v) => onMinrexConsentChange(v === true)}
            className="mt-0.5"
          />
          <span className="text-xs text-foreground/80 leading-relaxed">
            J'autorise AXIOM à vérifier l'authenticité de mes attestations auprès du
            Ministère des Relations Extérieures (MINREX) du Cameroun. *
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={employerVerification}
            onCheckedChange={(v) => onEmployerVerificationChange(v === true)}
            className="mt-0.5"
          />
          <span className="text-xs text-foreground/80 leading-relaxed">
            J'autorise la vérification sécurisée de mes références employeur par les
            recruteurs partenaires AXIOM (optionnel).
          </span>
        </label>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 rounded-lg bg-accent/5 border border-accent/20 p-3">
        <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <p className="text-[11px] text-foreground/70 leading-relaxed">
          Le badge <strong>"AXIOM Verified Experience"</strong> sera affiché sur votre profil
          après vérification. Ce service est facturé <strong>39 €</strong> (paiement unique)
          et inclut la vérification MINREX de toutes vos attestations.
        </p>
      </div>
    </div>
  );
}
