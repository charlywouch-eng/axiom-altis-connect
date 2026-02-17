import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface CvUploadSectionProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  analysisState: "idle" | "analyzing" | "done";
  mockScore: number;
}

export function CvUploadSection({ file, onFileSelect, analysisState, mockScore }: CvUploadSectionProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && validateFile(f)) onFileSelect(f);
    },
    [onFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) onFileSelect(f);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[#1F2937]">
        CV <span className="text-muted-foreground font-normal">(PDF ou Word, max 5 Mo)</span>
      </label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer ${
          dragOver
            ? "border-[#3B82F6] bg-[#3B82F6]/5"
            : file
            ? "border-emerald-400/50 bg-emerald-50/30"
            : "border-border hover:border-[#3B82F6]/40 hover:bg-[#3B82F6]/[0.02]"
        }`}
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt du CV"
        onClick={() => document.getElementById("cv-input")?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") document.getElementById("cv-input")?.click(); }}
      >
        <input
          id="cv-input"
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          onChange={handleFileInput}
        />

        {file ? (
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-[#1F2937]">{file.name}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground text-center">
              Glissez votre CV ici ou <span className="text-[#3B82F6] font-medium">parcourir</span>
            </p>
          </>
        )}
      </div>

      {/* Mock CV analysis */}
      <AnimatePresence>
        {analysisState !== "idle" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/[0.03] p-4 space-y-3">
              {analysisState === "analyzing" ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
                  <span className="text-sm text-[#1F2937] font-medium">Analyse en cours…</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                    <span className="text-sm font-semibold text-[#1F2937]">Analyse terminée</span>
                  </div>
                  <p className="text-xs text-[#1F2937]/70 leading-relaxed">
                    Compétences détectées et mappées vers Codes ROME français (exemple : Maçonnerie → F1703).
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#1F2937]/70">Score de conformité estimé :</span>
                    <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 hover:bg-[#3B82F6]/15">
                      {mockScore} %
                    </Badge>
                  </div>
                  <p className="text-xs text-[#1F2937]/50 italic">
                    Améliorez votre profil avec certification MINEFOP pour +20 % de matchs.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function validateFile(f: File): boolean {
  const validTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!validTypes.includes(f.type)) return false;
  if (f.size > 5 * 1024 * 1024) return false;
  return true;
}
