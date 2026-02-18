import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Euro, Code } from "lucide-react";
import { SECTEURS_ROME, type SecteurRome } from "@/data/dashboardMockData";

export interface OfferFormData {
  title: string;
  description: string;
  salary: string;
  location: string;
  skills: string;
  secteur?: string;
  codeRome?: string;
}

interface OfferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OfferFormData) => void;
  submitting: boolean;
  initialData?: OfferFormData | null;
}

export function OfferFormDialog({ open, onOpenChange, onSubmit, submitting, initialData }: OfferFormDialogProps) {
  const isEdit = !!initialData;
  const [form, setForm] = useState<OfferFormData>({
    title: "",
    description: "",
    salary: "",
    location: "France",
    skills: "",
    secteur: "",
    codeRome: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedSecteur, setSelectedSecteur] = useState<SecteurRome | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        initialData ?? {
          title: "",
          description: "",
          salary: "",
          location: "France",
          skills: "",
          secteur: "",
          codeRome: "",
        }
      );
      setFormErrors({});
      setSelectedSecteur(null);
    }
  }, [open, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSecteurChange = (value: string) => {
    const s = SECTEURS_ROME.find((r) => r.codeRome === value) ?? null;
    setSelectedSecteur(s);
    setForm((prev) => ({
      ...prev,
      secteur: s?.secteur ?? "",
      codeRome: s?.codeRome ?? "",
      title: prev.title || (s ? `${s.metier} – ${s.secteur}` : ""),
      skills: prev.skills || (s ? s.metier : ""),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const title = form.title.trim();
    const description = form.description.trim();
    const location = form.location.trim();
    const salary = form.salary.trim();

    if (!title) errors.title = "Le titre est requis.";
    else if (title.length > 200) errors.title = "Le titre ne doit pas dépasser 200 caractères.";
    if (!description) errors.description = "La description est requise.";
    else if (description.length > 5000) errors.description = "La description ne doit pas dépasser 5000 caractères.";
    if (!location) errors.location = "La localisation est requise.";
    else if (location.length > 100) errors.location = "Ne doit pas dépasser 100 caractères.";
    if (salary && salary.length > 50) errors.salary = "Ne doit pas dépasser 50 caractères.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEdit ? "Modifier l'offre" : "Publier une nouvelle offre"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEdit
              ? "Modifiez les informations de votre offre."
              : "Décrivez le poste en tension que vous souhaitez pourvoir."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Secteur ROME */}
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="secteur" className="text-sm font-medium flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                Secteur en tension
              </Label>
              <Select onValueChange={handleSecteurChange} value={form.codeRome || undefined}>
                <SelectTrigger id="secteur" className="h-10">
                  <SelectValue placeholder="Sélectionner un secteur prioritaire France 2026…" />
                </SelectTrigger>
                <SelectContent>
                  {SECTEURS_ROME.map((s) => (
                    <SelectItem key={s.codeRome} value={s.codeRome}>
                      <span className="flex items-center gap-2">
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSecteur && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="gap-1 text-xs border-accent/40 text-accent bg-accent/5">
                    <Code className="h-3 w-3" />
                    Code ROME : {selectedSecteur.codeRome}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{selectedSecteur.secteur}</span>
                </div>
              )}
            </div>
          )}

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titre du poste <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ex : Maçon – Chantier Grand Paris"
              maxLength={200}
              className="h-10"
            />
            {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Missions, contexte, prérequis…"
              rows={3}
              maxLength={5000}
              className="resize-none"
            />
            {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
          </div>

          {/* Salaire + Localisation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-sm font-medium flex items-center gap-1.5">
                <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                Salaire brut annuel (€)
              </Label>
              <Input
                id="salary"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                placeholder="35 000"
                maxLength={50}
                className="h-10"
              />
              {formErrors.salary && <p className="text-xs text-destructive">{formErrors.salary}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Localisation <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Paris, Île-de-France"
                maxLength={100}
                className="h-10"
              />
              {formErrors.location && <p className="text-xs text-destructive">{formErrors.location}</p>}
            </div>
          </div>

          {/* Compétences */}
          <div className="space-y-2">
            <Label htmlFor="skills" className="text-sm font-medium">
              Compétences clés <span className="text-muted-foreground text-xs font-normal">(séparées par des virgules)</span>
            </Label>
            <Input
              id="skills"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="Ex : Maçonnerie, Coffrage, Sécurité chantier…"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-sm"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-2"
              disabled={submitting}
            >
              {submitting
                ? isEdit ? "Enregistrement…" : "Publication…"
                : isEdit ? "Enregistrer les modifications" : "Publier l'offre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
