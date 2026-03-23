import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  Bookmark, Download, Trash2, Search, Brain,
  ShieldCheck, Star, Eye, CheckCircle2,
  MessageSquare, Save, Loader2, Tag, X, Plus,
} from "lucide-react";

const PRESET_TAGS = [
  { label: "Prioritaire", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { label: "En attente", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { label: "Validé RH", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { label: "Entretien planifié", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { label: "Top profil", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { label: "À recontacter", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
] as const;

function getTagColor(tag: string) {
  const preset = PRESET_TAGS.find((p) => p.label === tag);
  return preset?.color ?? "bg-white/10 text-white/60 border-white/20";
}

interface ShortlistTabProps {
  onSelectTalent: (talent: any) => void;
}

export default function ShortlistTab({ onSelectTalent }: ShortlistTabProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set());
  const [tagMenuOpen, setTagMenuOpen] = useState<string | null>(null);

  const toggleTag = async (talentProfileId: string, tag: string) => {
    if (!session?.user?.id) return;
    const entry = shortlistEntries.find((e) => e.talent_profile_id === talentProfileId);
    const currentTags: string[] = (entry as any)?.tags ?? [];
    const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];
    const { error } = await supabase
      .from("talent_shortlist")
      .update({ tags: newTags } as any)
      .eq("recruiter_id", session.user.id)
      .eq("talent_profile_id", talentProfileId);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de modifier les tags.", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["shortlist-full"] });
    }
  };

  const saveNote = async (talentProfileId: string) => {
    if (!session?.user?.id) return;
    const note = editingNotes[talentProfileId] ?? "";
    setSavingNotes((prev) => new Set(prev).add(talentProfileId));
    const { error } = await supabase
      .from("talent_shortlist")
      .update({ notes: note || null })
      .eq("recruiter_id", session.user.id)
      .eq("talent_profile_id", talentProfileId);
    setSavingNotes((prev) => { const n = new Set(prev); n.delete(talentProfileId); return n; });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder la note.", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["shortlist-full"] });
      toast({ title: "✅ Note sauvegardée" });
      setEditingNotes((prev) => { const n = { ...prev }; delete n[talentProfileId]; return n; });
    }
  };

  const { data: shortlistEntries = [], isLoading } = useQuery({
    queryKey: ["shortlist-full", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talent_shortlist")
        .select("id, talent_profile_id, notes, tags, created_at")
        .eq("recruiter_id", session?.user?.id ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!session?.user?.id,
  });

  const talentIds = shortlistEntries.map((e) => e.talent_profile_id);

  const { data: talents = [] } = useQuery({
    queryKey: ["shortlist-talents", talentIds],
    queryFn: async () => {
      if (!talentIds.length) return [];
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .in("id", talentIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: talentIds.length > 0,
  });

  const filtered = talents.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.full_name?.toLowerCase().includes(q) ||
      t.rome_code?.toLowerCase().includes(q) ||
      t.rome_label?.toLowerCase().includes(q) ||
      t.country?.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.id)));
    }
  };

  const removeFromShortlist = async (ids: string[]) => {
    if (!session?.user?.id || !ids.length) return;
    const { error } = await supabase
      .from("talent_shortlist")
      .delete()
      .eq("recruiter_id", session.user.id)
      .in("talent_profile_id", ids);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de retirer les talents.", variant: "destructive" });
      return;
    }
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["shortlist-full"] });
    queryClient.invalidateQueries({ queryKey: ["recruiter-shortlist"] });
    toast({ title: "✅ Retiré de la shortlist", description: `${ids.length} talent(s) retiré(s).` });
  };

  const exportCsv = (talentList: typeof talents) => {
    if (!talentList.length) return;
    const headers = ["Nom", "Pays", "Code ROME", "Métier", "Score conformité", "Niveau français", "Expérience (ans)", "Disponible"];
    const rows = talentList.map((t) => [
      t.full_name || "", t.country || "", t.rome_code || "", t.rome_label || "",
      String(t.compliance_score ?? 0), t.french_level || "", String(t.experience_years ?? 0),
      t.available ? "Oui" : "Non",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shortlist-axiom-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "✅ Export CSV téléchargé", description: `${talentList.length} talent(s) exporté(s).` });
  };

  const selectedTalents = filtered.filter((t) => selected.has(t.id));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20">
            <Bookmark className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Ma Shortlist</h2>
            <p className="text-sm text-white/40">
              {talents.length} talent{talents.length !== 1 ? "s" : ""} sélectionné{talents.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              placeholder="Rechercher dans la shortlist…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-56 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-5 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            <Checkbox
              checked={selected.size === filtered.length && filtered.length > 0}
              className="border-white/30 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
            />
            <span>{selected.size === filtered.length ? "Tout désélectionner" : "Tout sélectionner"}</span>
          </button>

          {selected.size > 0 && (
            <>
              <Badge className="bg-accent/20 text-accent border-0 text-[10px]">
                {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
              </Badge>
              <div className="w-px h-5 bg-white/10" />
              <Button
                size="sm"
                variant="outline"
                className="border-accent/40 text-accent hover:bg-accent/10 text-xs gap-1.5"
                onClick={() => exportCsv(selectedTalents)}
              >
                <Download className="h-3.5 w-3.5" /> Exporter sélection
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs gap-1.5"
                onClick={() => removeFromShortlist([...selected])}
              >
                <Trash2 className="h-3.5 w-3.5" /> Retirer sélection
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="outline"
            className="ml-auto border-white/20 text-white/60 hover:bg-white/10 text-xs gap-1.5"
            onClick={() => exportCsv(filtered)}
          >
            <Download className="h-3.5 w-3.5" /> Exporter tout ({filtered.length})
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && talents.length === 0 && (
        <div className="text-center py-20">
          <Bookmark className="mx-auto h-14 w-14 text-white/15 mb-4" />
          <p className="text-white/50 font-medium">Votre shortlist est vide</p>
          <p className="text-white/30 text-sm mt-1">Ajoutez des talents depuis l'onglet Talents pour les retrouver ici.</p>
        </div>
      )}

      {/* Talent cards grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((talent, i) => {
            const isAxiomReady = talent.compliance_score >= 80;
            const isSelected = selected.has(talent.id);
            const entry = shortlistEntries.find((e) => e.talent_profile_id === talent.id);
            const salaryEstimate = talent.experience_years
              ? `${Math.round(25 + (talent.experience_years * 2.5))}k€`
              : "—";

            return (
              <motion.div
                key={talent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Card
                  className={`bg-[hsl(222,33%,12%)] border transition-all hover:-translate-y-0.5 hover:shadow-lg overflow-hidden ${
                    isSelected ? "border-accent/60 shadow-accent/10" : "border-white/10 hover:border-accent/30"
                  }`}
                >
                  <CardContent className="p-5">
                    {/* Top row: checkbox + name + score */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(talent.id)}
                        className="mt-1 border-white/30 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-bold text-white truncate">{talent.full_name || "Talent"}</h3>
                          {isAxiomReady && (
                            <Badge className="bg-emerald-500/90 text-white border-0 text-[9px] font-bold gap-0.5 shrink-0">
                              <Star className="h-2.5 w-2.5" /> READY
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">
                          {talent.country || "—"} · {talent.experience_years || 0} ans d'exp.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 border border-accent/30 shrink-0">
                        <Brain className="h-3.5 w-3.5 text-accent" />
                        <span className="font-display text-sm font-black text-accent tabular-nums">{talent.compliance_score}%</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-accent">{talent.rome_code || "—"}</span>
                        <span className="text-white/30">·</span>
                        <span className="text-white/50 truncate">{talent.rome_label || "—"}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>Français : <strong className="text-white/70">{talent.french_level || "—"}</strong></span>
                        <span>Salaire : <strong className="text-accent">{salaryEstimate}/an</strong></span>
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {talent.compliance_score >= 70 && (
                        <Badge className="bg-accent/20 text-accent border-0 text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3" /> Certifié
                        </Badge>
                      )}
                      {talent.visa_status && talent.visa_status !== "en_attente" && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Visa {talent.visa_status}
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-white/15 text-white/40 text-[10px]">
                        {talent.available ? "Disponible" : "Non disponible"}
                      </Badge>
                    </div>

                    {/* Tags */}
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Tag className="h-3 w-3 text-white/30" />
                        <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_TAGS.map((preset) => {
                          const entryTags: string[] = (entry as any)?.tags ?? [];
                          const isActive = entryTags.includes(preset.label);
                          return (
                            <button
                              key={preset.label}
                              onClick={() => toggleTag(talent.id, preset.label)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                                isActive
                                  ? `${preset.color} scale-100`
                                  : "bg-white/5 text-white/25 border-white/10 hover:border-white/20 hover:text-white/40"
                              }`}
                            >
                              {isActive && <X className="h-2.5 w-2.5" />}
                              {!isActive && <Plus className="h-2.5 w-2.5" />}
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onSelectTalent(talent)}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 border-0 text-xs gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" /> Voir dossier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/30 text-destructive/70 hover:bg-destructive/10 text-xs gap-1.5"
                        onClick={() => removeFromShortlist([talent.id])}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Retirer
                      </Button>
                    </div>

                    {/* Notes */}
                    <div className="mt-3 border-t border-white/5 pt-3">
                      {editingNotes[talent.id] !== undefined ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingNotes[talent.id]}
                            onChange={(e) => setEditingNotes((prev) => ({ ...prev, [talent.id]: e.target.value }))}
                            placeholder="Ajoutez une note sur ce candidat…"
                            maxLength={500}
                            rows={3}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white/40 hover:text-white text-xs h-7 px-2"
                              onClick={() => setEditingNotes((prev) => { const n = { ...prev }; delete n[talent.id]; return n; })}
                            >
                              Annuler
                            </Button>
                            <Button
                              size="sm"
                              className="bg-accent hover:bg-accent/80 text-white text-xs h-7 px-3 gap-1"
                              disabled={savingNotes.has(talent.id)}
                              onClick={() => saveNote(talent.id)}
                            >
                              {savingNotes.has(talent.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                              Sauvegarder
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingNotes((prev) => ({ ...prev, [talent.id]: entry?.notes || "" }))}
                          className="flex items-start gap-2 w-full text-left group"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-white/20 group-hover:text-accent mt-0.5 shrink-0 transition-colors" />
                          {entry?.notes ? (
                            <p className="text-xs text-white/50 group-hover:text-white/70 transition-colors line-clamp-2">
                              {entry.notes}
                            </p>
                          ) : (
                            <p className="text-xs text-white/20 group-hover:text-white/40 italic transition-colors">
                              Ajouter une note…
                            </p>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Added date */}
                    {entry && (
                      <p className="mt-2 text-[10px] text-white/20">
                        Ajouté le {new Date(entry.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && talents.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="mx-auto h-10 w-10 text-white/20 mb-3" />
          <p className="text-white/50">Aucun résultat pour "{search}"</p>
        </div>
      )}
    </motion.div>
  );
}
