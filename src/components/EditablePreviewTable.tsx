import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Trash2, Pencil, Check, X } from "lucide-react";

interface ParsedRow {
  full_name: string;
  country: string;
  french_level: string;
  experience_years: number;
  skills: string[];
  score: number;
}

interface EditingCell {
  rowIndex: number;
  field: keyof ParsedRow;
}

interface EditablePreviewTableProps {
  preview: ParsedRow[];
  setPreview: (rows: ParsedRow[] | null) => void;
  fileName: string;
  uploading: boolean;
  onUpload: () => void;
}

export function EditablePreviewTable({
  preview,
  setPreview,
  fileName,
  uploading,
  onUpload,
}: EditablePreviewTableProps) {
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (rowIndex: number, field: keyof ParsedRow) => {
    const row = preview[rowIndex];
    const value = field === "skills" ? row.skills.join("; ") : String(row[field]);
    setEditing({ rowIndex, field });
    setEditValue(value);
  };

  const confirmEdit = () => {
    if (!editing) return;
    const { rowIndex, field } = editing;
    const updated = [...preview];
    const row = { ...updated[rowIndex] };

    if (field === "experience_years") {
      const parsed = parseInt(editValue, 10);
      if (!isNaN(parsed)) row.experience_years = parsed;
    } else if (field === "score") {
      const parsed = parseFloat(editValue);
      if (!isNaN(parsed)) row.score = Math.min(100, Math.max(0, parsed));
    } else if (field === "skills") {
      row.skills = editValue.split(";").map((s) => s.trim()).filter(Boolean);
    } else {
      (row as any)[field] = editValue.trim();
    }

    updated[rowIndex] = row;
    setPreview(updated);
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  const deleteRow = (index: number) => {
    const updated = preview.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setPreview(null);
    } else {
      setPreview(updated);
    }
  };

  const isEditing = (rowIndex: number, field: keyof ParsedRow) =>
    editing?.rowIndex === rowIndex && editing?.field === field;

  const renderCell = (row: ParsedRow, rowIndex: number, field: keyof ParsedRow) => {
    if (isEditing(rowIndex, field)) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            className="h-7 text-xs"
            autoFocus
          />
          <button onClick={confirmEdit} className="text-accent hover:text-accent/80" aria-label="Confirmer">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={cancelEdit} className="text-destructive hover:text-destructive/80" aria-label="Annuler">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }

    let display: React.ReactNode;
    if (field === "skills") {
      display = (
        <div className="flex flex-wrap gap-1">
          {row.skills.map((s) => (
            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
          ))}
        </div>
      );
    } else if (field === "experience_years") {
      display = `${row.experience_years} ans`;
    } else if (field === "score") {
      display = <span className="font-semibold">{row.score}</span>;
    } else {
      display = row[field] as string;
    }

    return (
      <div
        className="group/cell flex items-center gap-1 cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50"
        onClick={() => startEdit(rowIndex, field)}
        title="Cliquer pour modifier"
      >
        <span className="flex-1">{display}</span>
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity" />
      </div>
    );
  };

  const fields: (keyof ParsedRow)[] = ["full_name", "country", "french_level", "experience_years", "skills", "score"];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        <FileText className="mr-1 inline h-4 w-4" />
        {preview.length} profil(s) prêt(s) à importer
        {fileName.toLowerCase().endsWith(".pdf") && (
          <Badge variant="outline" className="ml-2 text-xs">Extrait par IA</Badge>
        )}
        <span className="ml-2 text-xs text-muted-foreground font-normal">
          — Cliquez sur une cellule pour la modifier
        </span>
      </p>
      <div className="max-h-72 overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Nom</th>
              <th className="px-3 py-2 text-left font-medium">Pays</th>
              <th className="px-3 py-2 text-left font-medium">Français</th>
              <th className="px-3 py-2 text-left font-medium">Exp.</th>
              <th className="px-3 py-2 text-left font-medium">Skills</th>
              <th className="px-3 py-2 text-left font-medium">Score</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {preview.map((r, i) => (
              <tr key={i} className="group">
                {fields.map((field) => (
                  <td key={field} className="px-3 py-2">
                    {renderCell(r, i, field)}
                  </td>
                ))}
                <td className="px-2 py-2">
                  <button
                    onClick={() => deleteRow(i)}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                    title="Supprimer cette ligne"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={onUpload} disabled={uploading} className="bg-accent text-accent-foreground hover:bg-accent/90">
        {uploading ? "Import en cours…" : `Importer ${preview.length} profils`}
      </Button>
    </div>
  );
}
