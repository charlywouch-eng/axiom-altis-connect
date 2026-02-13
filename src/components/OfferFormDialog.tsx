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

export interface OfferFormData {
  title: string;
  description: string;
  salary: string;
  location: string;
  skills: string;
}

interface OfferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OfferFormData) => void;
  submitting: boolean;
  /** If provided, the dialog is in edit mode */
  initialData?: OfferFormData | null;
}

export function OfferFormDialog({ open, onOpenChange, onSubmit, submitting, initialData }: OfferFormDialogProps) {
  const isEdit = !!initialData;
  const [form, setForm] = useState<OfferFormData>({
    title: "",
    description: "",
    salary: "",
    location: "",
    skills: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(initialData ?? { title: "", description: "", salary: "", location: "", skills: "" });
      setFormErrors({});
    }
  }, [open, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    else if (location.length > 100) errors.location = "La localisation ne doit pas dépasser 100 caractères.";

    if (salary && salary.length > 50) errors.salary = "Le salaire ne doit pas dépasser 50 caractères.";

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'offre" : "Publier une nouvelle offre"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez les informations de votre offre." : "Décrivez le poste que vous souhaitez pourvoir."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du poste</Label>
            <Input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Ex: Développeur Full-Stack" maxLength={200} />
            {formErrors.title && <p className="text-sm text-destructive">{formErrors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Missions, contexte…" rows={3} maxLength={5000} />
            {formErrors.description && <p className="text-sm text-destructive">{formErrors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Salaire (€/an)</Label>
              <Input id="salary" name="salary" value={form.salary} onChange={handleChange} placeholder="45 000" maxLength={50} />
              {formErrors.salary && <p className="text-sm text-destructive">{formErrors.salary}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input id="location" name="location" value={form.location} onChange={handleChange} placeholder="Paris" maxLength={100} />
              {formErrors.location && <p className="text-sm text-destructive">{formErrors.location}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Compétences clés (séparées par des virgules)</Label>
            <Input id="skills" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, SQL…" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={submitting}>
              {submitting ? (isEdit ? "Enregistrement…" : "Publication…") : (isEdit ? "Enregistrer" : "Publier")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
