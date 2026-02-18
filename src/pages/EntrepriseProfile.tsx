import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Building2,
  Camera,
  Save,
  Loader2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Hash,
  Briefcase,
} from "lucide-react";

const SECTEURS = [
  "BTP & Travaux publics",
  "Commerce & Distribution",
  "Hôtellerie & Restauration",
  "Industrie & Maintenance",
  "Logistique & Transport",
  "Numérique & Tech",
  "Santé & Aide à la personne",
  "Support & Services entreprise",
  "Agriculture & Environnement",
  "Autre",
];

interface CompanyProfile {
  id?: string;
  user_id: string;
  company_name: string;
  sector: string | null;
  siret: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  logo_url: string | null;
}

export default function EntrepriseProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUploading, setLogoUploading] = useState(false);
  const [form, setForm] = useState<Omit<CompanyProfile, "id" | "user_id">>({
    company_name: "",
    sector: null,
    siret: null,
    contact_email: null,
    contact_phone: null,
    address: null,
    website: null,
    logo_url: null,
  });

  const { isLoading } = useQuery({
    queryKey: ["company_profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setForm({
          company_name: data.company_name ?? "",
          sector: data.sector,
          siret: data.siret,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          address: data.address,
          website: data.website,
          logo_url: data.logo_url,
        });
      }
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        ...form,
        company_name: form.company_name.trim() || "Mon entreprise",
      };
      const { error } = await supabase
        .from("company_profiles")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company_profile"] });
      toast({ title: "✅ Profil enregistré", description: "Vos informations ont été mises à jour." });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Fichier trop lourd", description: "Maximum 2 Mo.", variant: "destructive" });
      return;
    }
    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("company-logos")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
      setForm((f) => ({ ...f, logo_url: data.publicUrl + `?t=${Date.now()}` }));
      toast({ title: "Logo téléchargé", description: "Enregistrez pour sauvegarder." });
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    } finally {
      setLogoUploading(false);
    }
  };

  const field = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value || null }));

  if (isLoading) {
    return (
      <DashboardLayout sidebarVariant="entreprise">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarVariant="entreprise">
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Profil entreprise
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ces informations seront visibles dans vos offres et pour l'équipe AXIOM.
          </p>
        </motion.div>

        {/* Logo section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Logo de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div
                  className="relative h-24 w-24 rounded-2xl bg-muted border-2 border-dashed border-border overflow-hidden cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt="Logo entreprise"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Building2 className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    {logoUploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Cliquez pour changer le logo
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG – max 2 Mo</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoUploading}
                  >
                    {logoUploading ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Envoi…</>
                    ) : (
                      <><Camera className="h-3.5 w-3.5 mr-1.5" />Choisir un fichier</>
                    )}
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Identity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Identité de l'entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                <Input
                  id="company_name"
                  placeholder="AXIOM RH Tech SAS"
                  value={form.company_name ?? ""}
                  onChange={(e) => field("company_name", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="siret">
                  <Hash className="inline h-3.5 w-3.5 mr-1 opacity-60" />
                  SIRET
                </Label>
                <Input
                  id="siret"
                  placeholder="123 456 789 01234"
                  value={form.siret ?? ""}
                  onChange={(e) => field("siret", e.target.value)}
                  maxLength={17}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sector">Secteur d'activité</Label>
                <select
                  id="sector"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.sector ?? ""}
                  onChange={(e) => field("sector", e.target.value)}
                >
                  <option value="">— Choisir un secteur —</option>
                  {SECTEURS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Informations de contact
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contact_email">
                  <Mail className="inline h-3.5 w-3.5 mr-1 opacity-60" />
                  Email de contact
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="rh@monentreprise.fr"
                  value={form.contact_email ?? ""}
                  onChange={(e) => field("contact_email", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact_phone">
                  <Phone className="inline h-3.5 w-3.5 mr-1 opacity-60" />
                  Téléphone
                </Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  placeholder="+33 1 23 45 67 89"
                  value={form.contact_phone ?? ""}
                  onChange={(e) => field("contact_phone", e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">
                  <MapPin className="inline h-3.5 w-3.5 mr-1 opacity-60" />
                  Adresse
                </Label>
                <Input
                  id="address"
                  placeholder="12 rue de la Paix, 75001 Paris"
                  value={form.address ?? ""}
                  onChange={(e) => field("address", e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="website">
                  <Globe className="inline h-3.5 w-3.5 mr-1 opacity-60" />
                  Site web
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://monentreprise.fr"
                  value={form.website ?? ""}
                  onChange={(e) => field("website", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save button */}
        <motion.div
          className="flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Button
            size="lg"
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 min-w-[160px]"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement…</>
            ) : (
              <><Save className="h-4 w-4" />Enregistrer</>
            )}
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
