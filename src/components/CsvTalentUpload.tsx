import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface ParsedRow {
  full_name: string;
  country: string;
  french_level: string;
  experience_years: number;
  skills: string[];
  score: number;
}

const EXPECTED_HEADERS = ["full_name", "country", "french_level", "experience_years", "skills", "score"];

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

export function CsvTalentUpload({ onImportComplete }: { onImportComplete?: () => void } = {}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDone(false);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors } = parseCsv(text);
      setPreview(rows);
      setParseErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!preview || preview.length === 0) return;
    setUploading(true);
    let status = "success";
    let importId: string | null = null;
    try {
      // Create import history record first to get the import_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const { data: importRecord, error: importError } = await supabase
        .from("csv_import_history")
        .insert({
          admin_id: user.id,
          file_name: fileName || "fichier.csv",
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
      // Update import record status to error if it was created
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
          Import CSV de profils talents
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Format attendu : <code className="rounded bg-muted px-1.5 py-0.5 text-xs">full_name,country,french_level,experience_years,skills,score</code>
          <br />
          Les compétences doivent être séparées par des points-virgules (ex: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">React;Node.js;Python</code>).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-foreground hover:file:bg-accent/90"
          />
        </div>

        {parseErrors.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
            <p className="text-sm font-medium text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> Erreurs de parsing
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
          <div className="space-y-3">
            <p className="text-sm font-medium">
              <FileText className="mr-1 inline h-4 w-4" />
              {preview.length} profil(s) prêt(s) à importer
            </p>
            <div className="max-h-60 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Nom</th>
                    <th className="px-3 py-2 text-left font-medium">Pays</th>
                    <th className="px-3 py-2 text-left font-medium">Français</th>
                    <th className="px-3 py-2 text-left font-medium">Exp.</th>
                    <th className="px-3 py-2 text-left font-medium">Skills</th>
                    <th className="px-3 py-2 text-left font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.slice(0, 10).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{r.full_name}</td>
                      <td className="px-3 py-2">{r.country}</td>
                      <td className="px-3 py-2">{r.french_level}</td>
                      <td className="px-3 py-2">{r.experience_years} ans</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {r.skills.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-semibold">{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  …et {preview.length - 10} autres lignes
                </p>
              )}
            </div>
            <Button onClick={handleUpload} disabled={uploading} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {uploading ? "Import en cours…" : `Importer ${preview.length} profils`}
            </Button>
          </div>
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
