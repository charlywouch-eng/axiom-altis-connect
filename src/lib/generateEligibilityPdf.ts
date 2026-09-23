import jsPDF from "jspdf";
import { BAND_LABELS, DISCLAIMER, shareLink, type SimulationResult } from "@/lib/simulator";

/** Helvetica (police intégrée à jsPDF) ne connaît pas certains symboles : on les remplace. */
const safe = (s: string | null | undefined) =>
  (s ?? "")
    .replace(/→/g, "->").replace(/[★☆]/g, "*").replace(/[—–]/g, "-")
    .replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/…/g, "...")
    .replace(/[^\x20-\x7E\u00A0-\u00FF\u20AC]/g, "");

export function generateEligibilityPdf(r: SimulationResult): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297, margin = 18, contentW = W - margin * 2;
  const navy = [15, 23, 42] as const;
  const accent = [14, 165, 233] as const;
  const grey = [100, 116, 139] as const;
  const light = [241, 245, 249] as const;
  let y = 0;

  const ensure = (h: number) => { if (y + h > H - 28) { doc.addPage(); y = 20; } };
  const heading = (t: string) => {
    ensure(14);
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...navy);
    doc.text(safe(t), margin, y); y += 2;
    doc.setDrawColor(...accent); doc.setLineWidth(0.6); doc.line(margin, y, margin + 18, y); y += 6;
  };
  const para = (t: string, size = 10, color: readonly [number, number, number] = navy) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(safe(t), contentW);
    ensure(lines.length * size * 0.45 + 2);
    doc.text(lines, margin, y); y += lines.length * size * 0.45 + 2;
  };

  // En-tête
  doc.setFillColor(...navy); doc.rect(0, 0, W, 38, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(255, 255, 255);
  doc.text("AXIOM", margin, 17);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(180, 200, 220);
  doc.text("Rapport d'éligibilité - métiers en tension en France", margin, 24);
  doc.text("Bêta - projet en cours d'immatriculation", margin, 29);
  doc.setFontSize(8);
  const date = new Date(r.created_at || Date.now()).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(safe(date), W - margin, 17, { align: "right" });
  doc.text("axiom-talents.com", W - margin, 22, { align: "right" });
  y = 50;

  // Bloc score
  const band = BAND_LABELS[r.band] ?? BAND_LABELS.reel;
  doc.setFillColor(...light); doc.roundedRect(margin, y, contentW, 34, 3, 3, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(30); doc.setTextColor(...accent);
  doc.text(`${r.score}`, margin + 8, y + 20);
  const scoreW = doc.getTextWidth(`${r.score}`);
  doc.setFontSize(10); doc.setTextColor(...grey);
  doc.text("/ 100", margin + 8 + scoreW + 2, y + 20);
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...navy);
  doc.text(safe(`${r.first_name} - ${band.label}`), margin + 55, y + 13);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(...grey);
  doc.text(safe(`${r.metier.titre} (ROME ${r.metier.rome_code})`), margin + 55, y + 20);
  doc.text(safe(`Demande en France : ${r.metier.tension} · Salaire moyen : ${r.metier.salaire}`), margin + 55, y + 26);
  y += 42;
  if (r.founder) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(180, 130, 10);
    doc.text("* MEMBRE FONDATEUR - priorité de mise en relation dès l'ouverture du recrutement AXIOM", margin, y);
    y += 8;
  }

  // Critères
  heading("Détail de votre indice");
  for (const c of r.criteres ?? []) {
    ensure(11);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...navy);
    doc.text(safe(c.label), margin, y);
    doc.setFont("helvetica", "bold");
    doc.text(`${c.points} / ${c.max}`, W - margin, y, { align: "right" });
    y += 2.5;
    doc.setFillColor(226, 232, 240); doc.roundedRect(margin, y, contentW, 2.6, 1.3, 1.3, "F");
    doc.setFillColor(...accent); doc.roundedRect(margin, y, Math.max(2, contentW * c.points / c.max), 2.6, 1.3, 1.3, "F");
    y += 8;
  }

  // Recommandations
  heading("Vos prochaines étapes");
  (r.recommandations ?? []).forEach((t, i) => para(`${i + 1}. ${t}`));
  y += 2;

  if (r.legalisation || r.niveau_requis) {
    heading("Reconnaissance de votre diplôme");
    if (r.niveau_requis) para(`Niveau habituellement demandé : ${r.niveau_requis}`);
    if (r.legalisation) para(`Circuit de légalisation : ${r.legalisation}`);
  }
  if (r.competences?.length) {
    heading("Compétences attendues");
    para(r.competences.join(" · "));
  }

  // Pied de page (toutes les pages)
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3); doc.line(margin, H - 22, W - margin, H - 22);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...grey);
    doc.text(doc.splitTextToSize(safe(DISCLAIMER), contentW), margin, H - 17);
    doc.setTextColor(...accent);
    doc.text(safe(`Faites le test vous aussi : ${shareLink(r.referral_code)}`), margin, H - 9);
    doc.setTextColor(...grey);
    doc.text(`${p} / ${pages}`, W - margin, H - 9, { align: "right" });
  }
  return doc;
}

export function downloadEligibilityPdf(r: SimulationResult) {
  const name = (r.first_name || "candidat").normalize("NFD").replace(/[^\w-]/g, "").slice(0, 30) || "candidat";
  generateEligibilityPdf(r).save(`AXIOM-rapport-eligibilite-${name}.pdf`);
}
