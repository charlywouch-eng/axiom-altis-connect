import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { EditablePreviewTable } from "@/components/EditablePreviewTable";

interface ParsedRow {
  full_name: string;
  country: string;
  french_level: string;
  experience_years: number;
  skills: string[];
  score: number;
}

const EXPECTED_HEADERS = ["full_name", "country", "french_level", "experience_years", "skills", "score"];
const ACCEPTED_EXTENSIONS = [".csv", ".pdf"];
const MAX_FILE_SIZE_MB = 10;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], errors: ["Le fichier est vide ou ne contient que l'en-tête."] };

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { rows: [], errors: [`Colonnes manquantes : ${missing.join(", ")}`] };
  }

  const idx = Object.fromEntries(EXPECTED_HEADERS.map((h) => [h, headers.indexOf(h)]));
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < headers.length) {
      errors.push(`Ligne ${i + 1} : nombre de colonnes insuffisant`);
      continue;
    }
    const name = cols[idx.full_name];
    if (!name) {
      errors.push(`Ligne ${i + 1} : full_name manquant`);
      continue;
    }
    const expYears = parseInt(cols[idx.experience_years], 10);
    const score = parseFloat(cols[idx.score]);
    if (isNaN(expYears) || isNaN(score)) {
      errors.push(`Ligne ${i + 1} : experience_years ou score invalide`);
      continue;
    }
    if (score < 0 || score > 100) {
      errors.push(`Ligne ${i + 1} : score doit être entre 0 et 100`);
      continue;
    }
    rows.push({
      full_name: name,
      country: cols[idx.country] || "",
      french_level: cols[idx.french_level] || "",
      experience_years: expYears,
      skills: cols[idx.skills]
        ? cols[idx.skills].split(";").map((s) => s.trim()).filter(Boolean)
        : [],
      score,
    });
  }

  return { rows, errors };
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

export function CsvTalentUpload({ onImportComplete }: { onImportComplete?: () => void } = {}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [done, setDone] = useState(false);

  const getFileExtension = (name: string) => {
    const ext = name.toLowerCase().slice(name.lastIndexOf("."));
    return ext;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDone(false);
    setPreview(null);
    setParseErrors([]);
    setFileName(file.name);

    const ext = getFileExtension(file.name);

    // Validate file extension
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setParseErrors([`Format de fichier invalide. Seuls les fichiers ${ACCEPTED_EXTENSIONS.join(", ")} sont acceptés.`]);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setParseErrors([`Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). La taille maximale est de ${MAX_FILE_SIZE_MB} Mo.`]);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    // Validate non-empty file
    if (file.size === 0) {
      setParseErrors(["Le fichier est vide. Veuillez sélectionner un fichier contenant des données."]);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    if (ext === ".csv") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (!text.trim()) {
          setParseErrors(["Le fichier ne contient aucune donnée exploitable."]);
          return;
        }
        const { rows, errors } = parseCsv(text);
        setPreview(rows);
        setParseErrors(errors);
      };
      reader.onerror = () => {
        setParseErrors(["Impossible de lire le fichier. Vérifiez qu'il n'est pas corrompu."]);
      };
      reader.readAsText(file);
    } else if (ext === ".pdf") {
      await handlePdfFile(file);
    }
  };

  const handlePdfFile = async (file: File) => {
    setExtracting(true);
    try {
      // Step 1: Extract text from PDF on client side
      const pdfText = await extractTextFromPdf(file);
      
      if (!pdfText.trim()) {
        setParseErrors(["Le PDF ne contient aucun texte extractible. Vérifiez que le document n'est pas un scan sans OCR."]);
        setExtracting(false);
        return;
      }

      // Step 2: Send text to edge function for AI extraction
      const { data, error } = await supabase.functions.invoke("extract-pdf-talents", {
        body: { pdfText },
      });

      if (error) {
        setParseErrors([`Erreur lors de l'extraction IA : ${error.message}`]);
        setExtracting(false);
        return;
      }

      if (!data.success) {
        setParseErrors([data.error || "Erreur inconnue lors de l'extraction."]);
        setExtracting(false);
        return;
      }

      const profiles: ParsedRow[] = (data.profiles || []).map((p: any) => ({
        full_name: p.full_name || "",
        country: p.country || "",
        french_level: p.french_level || "",
        experience_years: Number(p.experience_years) || 0,
        skills: Array.isArray(p.skills) ? p.skills : [],
        score: Math.min(100, Math.max(0, Number(p.score) || 50)),
      }));

      if (profiles.length === 0) {
        setParseErrors(["Aucun profil de talent n'a pu être extrait du document PDF."]);
      } else {
        setPreview(profiles);
        toast({
          title: "Extraction PDF réussie",
          description: `${profiles.length} profil(s) extrait(s) par l'IA. Vérifiez les données avant d'importer.`,
        });
      }
    } catch (err: any) {
      console.error("PDF extraction error:", err);
      setParseErrors([`Erreur lors du traitement du PDF : ${err.message || "erreur inconnue"}`]);
    } finally {
      setExtracting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = EXPECTED_HEADERS.join(",");
    const sampleRows = [
      ["Jean Dupont", "France", "Natif", "5", "React;TypeScript;Node.js", "85"].join(","),
      ["Marie Martin", "Belgique", "Fluent", "3", "Python;PostgreSQL;Docker", "78"].join(","),
      ["Carlos García", "Espagne", "Avancé", "7", "Java;Spring;Kubernetes", "92"].join(","),
      ["Sophie Laurent", "Suisse", "Courant", "2", "React;CSS;JavaScript", "72"].join(","),
    ];
    const csvContent = [headers, ...sampleRows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modele_talents.csv";
    link.click();
  };

  const handleUpload = async () => {
    if (!preview || preview.length === 0) return;
    setUploading(true);
    let importId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const { data: importRecord, error: importError } = await supabase
        .from("csv_import_history")
        .insert({
          admin_id: user.id,
          file_name: fileName || "fichier",
          profiles_count: preview.length,
          errors_count: parseErrors.length,
          status: "success",
        })
        .select("id")
        .single();
      if (importError) throw importError;
      importId = importRecord.id;

      const inserts = preview.map((r) => ({
        user_id: crypto.randomUUID(),
        full_name: r.full_name,
        country: r.country,
        french_level: r.french_level,
        experience_years: r.experience_years,
        skills: r.skills,
        score: r.score,
        available: true,
        import_id: importId,
      }));

      const { error } = await supabase.from("talent_profiles").insert(inserts);
      if (error) throw error;

      toast({
        title: "Import réussi",
        description: `${preview.length} profils talent importés avec succès.`,
      });
      setDone(true);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      toast({
        title: "Erreur d'import",
        description: err.message || "Une erreur est survenue lors de l'import.",
        variant: "destructive",
      });
      if (importId) {
        try {
          await supabase.from("csv_import_history").delete().eq("id", importId);
        } catch {
          // Silently fail
        }
      }
    } finally {
      onImportComplete?.();
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-accent" />
          Import de profils talents
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          <strong>CSV</strong> : Format attendu → <code className="rounded bg-muted px-1.5 py-0.5 text-xs">full_name,country,french_level,experience_years,skills,score</code>
          <br />
          Les compétences doivent être séparées par des points-virgules (ex: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">React;Node.js;Python</code>).
          <br />
          <strong>PDF</strong> : Le document sera analysé par l'IA pour extraire automatiquement les profils de talents.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.pdf"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            type="button"
            variant="default"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => fileRef.current?.click()}
            disabled={extracting}
          >
            {extracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extraction en cours…
              </>
            ) : (
              "Choisir un fichier"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
          >
            Télécharger un modèle CSV
          </Button>
          <span className="text-sm text-muted-foreground">
            {extracting
              ? "Analyse du PDF par l'IA…"
              : fileName || "Aucun fichier sélectionné"}
          </span>
        </div>

        {parseErrors.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
            <p className="text-sm font-medium text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> Erreurs de traitement
            </p>
            {parseErrors.slice(0, 5).map((err, i) => (
              <p key={i} className="text-xs text-destructive/80">{err}</p>
            ))}
            {parseErrors.length > 5 && (
              <p className="text-xs text-destructive/80">…et {parseErrors.length - 5} autres erreurs</p>
            )}
          </div>
        )}

        {preview && preview.length > 0 && (
          <EditablePreviewTable
            preview={preview}
            setPreview={setPreview}
            fileName={fileName}
            uploading={uploading}
            onUpload={handleUpload}
          />
        )}

        {done && (
          <p className="text-sm text-accent flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Import terminé avec succès !
          </p>
        )}
      </CardContent>
    </Card>
  );
}
