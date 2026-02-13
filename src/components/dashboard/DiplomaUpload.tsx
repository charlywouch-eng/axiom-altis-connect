import { useState, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, FileCheck, ShieldCheck, AlertTriangle, CheckCircle2,
  X, FileText, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  en_attente: { label: "En attente", icon: Loader2, className: "bg-muted text-muted-foreground" },
  verifie: { label: "Vérifié", icon: CheckCircle2, className: "bg-success/15 text-success border border-success/30" },
  refuse: { label: "Refusé", icon: AlertTriangle, className: "bg-destructive/15 text-destructive border border-destructive/30" },
};

export default function DiplomaUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Get talent profile
  const { data: talentProfile } = useQuery({
    queryKey: ["talent_profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get existing diplomas
  const { data: diplomas = [] } = useQuery({
    queryKey: ["diplomas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diplomas")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const processFile = useCallback(async (file: File) => {
    if (!user || !talentProfile) {
      toast.error("Profil talent introuvable. Veuillez compléter votre profil d'abord.");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez PDF, JPG ou PNG.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo).");
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      // Upload to storage
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      setProgress(30);
      const { error: uploadError } = await supabase.storage
        .from("diplomas")
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      setProgress(50);

      // Create diploma record
      const { data: diploma, error: insertError } = await supabase
        .from("diplomas")
        .insert({
          talent_id: talentProfile.id,
          user_id: user.id,
          file_path: filePath,
          file_name: file.name,
          status: "en_attente",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setProgress(70);
      setUploading(false);
      setVerifying(true);

      // Trigger verification
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        "verify-diploma",
        {
          body: {
            file_path: filePath,
            diploma_id: diploma.id,
            talent_id: talentProfile.id,
          },
        }
      );

      setProgress(100);

      if (verifyError) throw verifyError;

      queryClient.invalidateQueries({ queryKey: ["diplomas"] });
      queryClient.invalidateQueries({ queryKey: ["talent_profile"] });

      if (verifyData?.status === "verifie") {
        toast.success("Diplôme vérifié avec succès !", {
          description: `${verifyData.rome_label || "Métier identifié"} — Match ${verifyData.rome_match_percent}%`,
        });
      } else if (verifyData?.status === "refuse") {
        toast.error("Diplôme non conforme", {
          description: "Vérification MINFOP/apostille échouée. Veuillez soumettre un document valide.",
        });
      } else {
        toast.info("Diplôme en cours de vérification manuelle", {
          description: "Notre équipe finalisera la vérification sous 24h.",
        });
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erreur lors de l'upload", { description: err.message });
    } finally {
      setUploading(false);
      setVerifying(false);
      setProgress(0);
    }
  }, [user, talentProfile, queryClient]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [processFile]);

  const isProcessing = uploading || verifying;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-accent" /> Mes diplômes & certifications
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Uploadez vos diplômes pour vérification automatique (MINFOP, apostille, ROME)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
            dragActive
              ? "border-accent bg-accent/5 shadow-[0_0_30px_-5px_hsl(var(--accent)/0.2)]"
              : "border-border/50 hover:border-accent/40 hover:bg-muted/30"
          } ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isProcessing ? (
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 mx-auto text-accent animate-spin" />
              <p className="text-sm font-medium">
                {uploading ? "Upload en cours…" : "Vérification IA en cours…"}
              </p>
              <Progress value={progress} className="h-2 max-w-xs mx-auto" />
              <p className="text-xs text-muted-foreground">
                {verifying && "OCR → MINFOP → Apostille → ROME"}
              </p>
            </div>
          ) : (
            <>
              <Upload className={`h-10 w-10 mx-auto mb-3 transition-colors ${
                dragActive ? "text-accent" : "text-muted-foreground"
              }`} />
              <p className="text-sm font-medium">
                Glissez-déposez votre diplôme ici
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, JPG ou PNG — 10 Mo max
              </p>
            </>
          )}
        </div>

        {/* Existing diplomas */}
        <AnimatePresence>
          {diplomas.map((diploma, i) => {
            const config = statusConfig[diploma.status] || statusConfig.en_attente;
            const StatusIcon = config.icon;
            return (
              <motion.div
                key={diploma.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 transition-all hover:bg-muted/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{diploma.file_name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {diploma.extracted_field && (
                      <span className="text-xs text-muted-foreground">{diploma.extracted_field}</span>
                    )}
                    {diploma.rome_code && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {diploma.rome_code}
                      </Badge>
                    )}
                    {diploma.rome_match_percent > 0 && (
                      <span className="text-xs text-muted-foreground">Match {diploma.rome_match_percent}%</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {diploma.minfop_verified && (
                      <Badge className="bg-accent/15 text-accent border border-accent/30 text-[10px] gap-1">
                        <ShieldCheck className="h-3 w-3" /> MINFOP
                      </Badge>
                    )}
                    {diploma.apostille_verified && (
                      <Badge className="bg-accent/15 text-accent border border-accent/30 text-[10px] gap-1">
                        <ShieldCheck className="h-3 w-3" /> Apostille
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge className={`${config.className} text-xs gap-1 shrink-0`}>
                  <StatusIcon className={`h-3 w-3 ${diploma.status === "en_attente" ? "animate-spin" : ""}`} />
                  {config.label}
                </Badge>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
