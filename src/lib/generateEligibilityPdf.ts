import jsPDF from "jspdf";
import { BAND_LABELS, BAND_SCALE, DISCLAIMER, METHODOLOGY, reportReference, shareLink, type SimulationResult } from "@/lib/simulator";

/** Helvetica (police intégrée à jsPDF) ne connaît pas certains symboles : on les remplace. */
const safe = (s: string | null | undefined) =>
  (s ?? "")
    .replace(/→/g, ">").replace(/[★☆]/g, "*").replace(/[—–]/g, "-")
    .replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/…/g, "...")
    .replace(/[^\x20-\x7E\u00A0-\u00FF\u20AC]/g, "");

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const INK: RGB = hex("#0B1F3A");
const INK2: RGB = hex("#2C3E57");
const MUTED: RGB = hex("#5B6B82");
const LINE: RGB = hex("#E1E6ED");
const BG: RGB = hex("#F5F7FA");
const BRAND: RGB = hex("#123E7C");
const ACCENT: RGB = hex("#4C8DF6");

/** Monogramme AXIOM dessiné en vectoriel (identique au logo du site). */
function drawMark(doc: jsPDF, x: number, y: number, s: number) {
  const k = s / 40;
  doc.setFillColor(...INK); doc.roundedRect(x, y, s, s, 9 * k, 9 * k, "F");
  doc.setLineCap("round"); doc.setLineJoin("round"); doc.setLineWidth(3.4 * k);
  doc.setDrawColor(255, 255, 255);
  doc.lines([[7.2 * k, -19.5 * k], [3.6 * k, 0], [7.2 * k, 19.5 * k]], x + 11 * k, y + 30 * k, [1, 1], "S", false);
  doc.setDrawColor(...ACCENT);
  doc.line(x + 15.2 * k, y + 23.5 * k, x + 33 * k, y + 23.5 * k);
  doc.setLineCap("butt");
}

export function generateEligibilityPdf(r: SimulationResult): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297, M = 20, CW = W - 2 * M;
  const ref = reportReference(r);
  const band = BAND_LABELS[r.band] ?? BAND_LABELS.reel;
  const date = new Date(r.created_at || Date.now()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  let y = 0;

  const font = (w: "normal" | "bold", size: number, color: RGB = INK) => { doc.setFont("helvetica", w); doc.setFontSize(size); doc.setTextColor(...color); };
  const ensure = (h: number) => { if (y + h > H - 30) { doc.addPage(); y = 24; } };
  const section = (n: number, title: string) => {
    ensure(18); y += 4;
    font("bold", 8, MUTED); doc.text(safe(`${String(n).padStart(2, "0")}`), M, y);
    font("bold", 12.5); doc.text(safe(title), M + 9, y);
    y += 3; doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 7;
  };
  const para = (t: string, size = 10, color: RGB = INK2, indent = 0) => {
    font("normal", size, color);
    const lines = doc.splitTextToSize(safe(t), CW - indent);
    const lh = size * 0.42;
    ensure(lines.length * lh + 2);
    doc.text(lines, M + indent, y); y += lines.length * lh + 2.5;
  };

  // ── En-tête ──
  drawMark(doc, M, 16, 11);
  font("bold", 12.5); doc.setCharSpace(1.6); doc.text("AXIOM", M + 15, 22.2); doc.setCharSpace(0);
  font("normal", 7, MUTED); doc.setCharSpace(0.6); doc.text("TALENT MOBILITY", M + 15, 26); doc.setCharSpace(0);
  font("bold", 8, MUTED); doc.text("RAPPORT D'EVALUATION", W - M, 19.5, { align: "right" });
  font("normal", 8, MUTED); doc.text(safe(`Réf. ${ref}`), W - M, 23.5, { align: "right" }); doc.text(safe(date), W - M, 27.5, { align: "right" });
  doc.setDrawColor(...INK); doc.setLineWidth(0.6); doc.line(M, 33, W - M, 33);
  y = 46;

  font("bold", 20); doc.text(safe("Éligibilité à l'emploi en France"), M, y); y += 7;
  font("normal", 10, MUTED); doc.text(safe("Évaluation de préparation d'un projet de recrutement sur un métier en tension"), M, y); y += 9;

  // ── Identification ──
  const rows: [string, string][] = [
    ["Candidat", r.first_name], ["Pays de résidence", r.pays],
    ["Métier évalué", `${r.metier.titre} (ROME ${r.metier.rome_code})`], ["Demande en France", r.metier.tension],
    ["Salaire moyen constaté", r.metier.salaire], ["Statut", r.founder ? "Membre fondateur - cohorte bêta 2026" : "Cohorte bêta 2026"],
  ];
  doc.setFillColor(...BG); doc.setDrawColor(...LINE); doc.roundedRect(M, y, CW, 33, 2, 2, "FD");
  rows.forEach(([k, v], i) => {
    const cx = M + 6 + (i % 2) * (CW / 2), cy = y + 8 + Math.floor(i / 2) * 9.5;
    font("normal", 7.5, MUTED); doc.text(safe(k.toUpperCase()), cx, cy);
    font("bold", 9.5); doc.text(doc.splitTextToSize(safe(v), CW / 2 - 10)[0], cx, cy + 4.2);
  });
  y += 43;

  // ── 1. Synthèse ──
  section(1, "Synthèse");
  font("bold", 40, INK); doc.text(`${r.score}`, M, y + 12);
  const sw = doc.getTextWidth(`${r.score}`);
  font("normal", 12, MUTED); doc.text("/ 100", M + sw + 2, y + 12);
  font("normal", 7.5, MUTED); doc.text("INDICE DE PREPARATION", M, y + 17.5);
  const [br, bgc, bb] = hex(band.color);
  font("bold", 11, [br, bgc, bb]); doc.text(safe(band.label), M + 55, y + 3);
  font("normal", 9.5, INK2); const sl = doc.splitTextToSize(safe(band.summary), CW - 55); doc.text(sl, M + 55, y + 8.5);
  y += Math.max(22, 10 + sl.length * 4) + 4;
  // échelle
  let sx = M;
  BAND_SCALE.forEach(b => {
    const w = (CW - 3) * (b.to - b.from + 1) / 100;
    const c = hex(BAND_LABELS[b.key].color);
    const on = r.score >= b.from && r.score <= b.to;
    const mix = (v: number) => Math.round(on ? v : v + (255 - v) * 0.8);
    doc.setFillColor(mix(c[0]), mix(c[1]), mix(c[2])); doc.rect(sx, y, w, 2.8, "F");
    font("normal", 7, MUTED); doc.text(`${b.from}-${b.to}`, sx, y + 7);
    doc.text(safe(BAND_LABELS[b.key].label.replace("Préparation ", "")), sx, y + 10.5);
    sx += w + 1;
  });
  const mx = M + (CW - 3) * r.score / 100;
  doc.setFillColor(...INK); doc.triangle(mx - 1.6, y - 3, mx + 1.6, y - 3, mx, y - 0.6, "F");
  y += 17;

  // ── 2. Grille ──
  section(2, "Grille d'évaluation");
  font("bold", 7.5, MUTED);
  doc.text("CRITERE", M, y); doc.text("PONDERATION", M + CW - 48, y, { align: "right" }); doc.text("POINTS OBTENUS", W - M, y, { align: "right" });
  y += 2.5; doc.setDrawColor(...LINE); doc.line(M, y, W - M, y); y += 5;
  METHODOLOGY.forEach(c => {
    ensure(12);
    const p = r.criteres?.find(x => x.cle === c.cle)?.points ?? 0;
    font("bold", 9.5); doc.text(safe(c.label), M, y);
    font("normal", 8, MUTED); doc.text(safe(c.detail), M, y + 4);
    font("normal", 9.5, INK2); doc.text(`${c.max}`, M + CW - 48, y, { align: "right" });
    doc.setFillColor(...LINE); doc.rect(W - M - 40, y - 2.4, 22, 2, "F");
    doc.setFillColor(...BRAND); doc.rect(W - M - 40, y - 2.4, 22 * p / c.max, 2, "F");
    font("bold", 9.5); doc.text(`${p} / ${c.max}`, W - M, y, { align: "right" });
    y += 7.5; doc.setDrawColor(...LINE); doc.line(M, y, W - M, y); y += 5;
  });
  font("bold", 9.5); doc.text("Total", M, y); doc.text(`${r.score} / 100`, W - M, y, { align: "right" }); y += 6;

  // ── 3. Plan d'action ──
  section(3, "Plan d'action recommandé");
  (r.recommandations ?? []).forEach((t, i) => {
    ensure(10);
    doc.setFillColor(...hex("#EAF1FB")); doc.circle(M + 2.6, y - 1.2, 2.6, "F");
    font("bold", 8, BRAND); doc.text(`${i + 1}`, M + 2.6, y, { align: "center" });
    para(t, 9.5, INK2, 8);
    y += 1;
  });

  // ── 4. Reconnaissance ──
  if (r.legalisation || r.niveau_requis || r.competences?.length) {
    section(4, "Reconnaissance du diplôme et compétences");
    if (r.niveau_requis) para(`Qualification habituellement demandée : ${r.niveau_requis}.`);
    if (r.legalisation) para(`Circuit de reconnaissance : ${r.legalisation}.`);
    if (r.competences?.length) para(`Compétences attendues par les employeurs : ${r.competences.join(", ")}.`);
  }

  // ── 5. Méthodologie ──
  section(5, "Méthodologie et limites");
  para("L'indice est calculé sur 100 points selon une grille fixe, identique pour tous les candidats, à partir des réponses déclarées et de notre référentiel des métiers en tension établi sur la nomenclature ROME. Les réponses n'ont pas été vérifiées à ce stade : la vérification des pièces (diplômes, attestations, passeport) intervient lors de l'accompagnement.", 9, MUTED);
  para(DISCLAIMER, 9, MUTED);

  // ── Pied de page ──
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, H - 18, W - M, H - 18);
    font("normal", 7.5, MUTED);
    doc.text(safe(`AXIOM Talent Mobility - axiom-talents.com - Réf. ${ref}`), M, H - 12.5);
    doc.text(`Page ${p} / ${pages}`, W - M, H - 12.5, { align: "right" });
    font("normal", 7, MUTED);
    doc.text(safe(`Évaluation gratuite : ${shareLink(r.referral_code)}`), M, H - 8.5);
  }
  return doc;
}

export function downloadEligibilityPdf(r: SimulationResult) {
  const name = (r.first_name || "candidat").normalize("NFD").replace(/[^\w-]/g, "").slice(0, 30) || "candidat";
  generateEligibilityPdf(r).save(`AXIOM-rapport-evaluation-${name}.pdf`);
}
