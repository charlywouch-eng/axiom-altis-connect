import jsPDF from "jspdf";
import { BAND_LABELS, BAND_SCALE, METHODOLOGY, reportReference, shareLink, type SimulationResult } from "@/lib/simulator";

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
const BRAND_SOFT: RGB = hex("#EAF1FB");
const ACCENT: RGB = hex("#4C8DF6");

const W = 210, H = 297, M = 18, CW = W - 2 * M;
const FOOTER_TOP = H - 21;

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

/**
 * Compose le rapport sur une page. `k` (≤ 1) resserre espacements et corps de texte
 * quand le plan d'action est long ; renvoie la position verticale atteinte.
 */
function compose(doc: jsPDF, r: SimulationResult, k: number): number {
  const ref = reportReference(r);
  const band = BAND_LABELS[r.band] ?? BAND_LABELS.reel;
  const date = new Date(r.created_at || Date.now()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const font = (w: "normal" | "bold", size: number, color: RGB = INK) => { doc.setFont("helvetica", w); doc.setFontSize(size); doc.setTextColor(...color); };
  const gap = (mm: number) => mm * k;
  let y = 0;

  const section = (n: number, title: string) => {
    y += gap(5);
    font("bold", 7.5, MUTED); doc.text(String(n).padStart(2, "0"), M, y);
    font("bold", 11.5); doc.text(safe(title), M + 8, y);
    y += gap(2.6); doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += gap(5.5);
  };

  // ── En-tête ──
  drawMark(doc, M, 13, 10.5);
  font("bold", 12); doc.setCharSpace(1.6); doc.text("AXIOM", M + 14, 18.8); doc.setCharSpace(0);
  font("normal", 6.8, MUTED); doc.setCharSpace(0.6); doc.text("TALENT MOBILITY", M + 14, 22.4); doc.setCharSpace(0);
  font("bold", 7.5, MUTED); doc.text("RAPPORT D'EVALUATION", W - M, 16, { align: "right" });
  font("normal", 7.5, MUTED); doc.text(safe(`Réf. ${ref}`), W - M, 19.8, { align: "right" }); doc.text(safe(date), W - M, 23.6, { align: "right" });
  doc.setDrawColor(...INK); doc.setLineWidth(0.6); doc.line(M, 28.5, W - M, 28.5);
  y = 39;

  font("bold", 18); doc.text(safe("Éligibilité à l'emploi en France"), M, y); y += 5.5;
  font("normal", 9, MUTED); doc.text(safe("Évaluation de préparation d'un projet de recrutement sur un métier en tension"), M, y); y += gap(6);

  // ── Identification : 2 lignes × 3 colonnes ──
  const rows: [string, string][] = [
    ["Candidat", r.first_name], ["Métier évalué", `${r.metier.titre}`], ["Pays de résidence", r.pays],
    ["Code ROME", r.metier.rome_code], ["Demande en France", r.metier.tension], ["Salaire moyen constaté", r.metier.salaire],
  ];
  const boxH = gap(22);
  doc.setFillColor(...BG); doc.setDrawColor(...LINE); doc.roundedRect(M, y, CW, boxH, 2, 2, "FD");
  const colW = CW / 3;
  rows.forEach(([key, v], i) => {
    const cx = M + 5 + (i % 3) * colW, cy = y + gap(7) + Math.floor(i / 3) * gap(9);
    font("normal", 6.8, MUTED); doc.text(safe(key.toUpperCase()), cx, cy);
    font("bold", 9); doc.text(doc.splitTextToSize(safe(v), colW - 8)[0], cx, cy + 3.8);
  });
  y += boxH;
  if (r.founder) {
    y += gap(4.5);
    font("bold", 7.5, BRAND); doc.text(safe("MEMBRE FONDATEUR - COHORTE BÊTA 2026"), M, y);
    y += gap(2);
  }

  // ── 01 Synthèse ──
  section(1, "Synthèse");
  font("bold", 34, INK); doc.text(`${r.score}`, M, y + 9);
  const sw = doc.getTextWidth(`${r.score}`);
  font("normal", 11, MUTED); doc.text("/ 100", M + sw + 2, y + 9);
  font("normal", 6.8, MUTED); doc.text("INDICE DE PREPARATION", M, y + 13.5);
  font("bold", 10.5, hex(band.color)); doc.text(safe(band.label), M + 52, y + 2);
  font("normal", 9, INK2); const sl = doc.splitTextToSize(safe(band.summary), CW - 52); doc.text(sl, M + 52, y + 6.8);
  y += Math.max(17, 7 + sl.length * 3.9) + gap(4);
  // échelle
  let sx = M;
  BAND_SCALE.forEach(b => {
    const w = (CW - 3) * (b.to - b.from + 1) / 100;
    const c = hex(BAND_LABELS[b.key].color);
    const on = r.score >= b.from && r.score <= b.to;
    const mix = (v: number) => Math.round(on ? v : v + (255 - v) * 0.8);
    doc.setFillColor(mix(c[0]), mix(c[1]), mix(c[2])); doc.rect(sx, y, w, 2.4, "F");
    font("normal", 6.5, MUTED); doc.text(safe(`${b.from}-${b.to} · ${BAND_LABELS[b.key].label.replace("Préparation ", "")}`), sx, y + 6);
    sx += w + 1;
  });
  const mx = M + (CW - 3) * r.score / 100;
  doc.setFillColor(...INK); doc.triangle(mx - 1.5, y - 2.8, mx + 1.5, y - 2.8, mx, y - 0.5, "F");
  y += gap(8);

  // ── 02 Grille ──
  section(2, "Grille d'évaluation");
  font("bold", 6.8, MUTED);
  doc.text("CRITERE", M, y); doc.text("PONDERATION", M + CW - 52, y, { align: "right" }); doc.text("POINTS OBTENUS", W - M, y, { align: "right" });
  y += gap(2.2); doc.setDrawColor(...LINE); doc.line(M, y, W - M, y); y += gap(4.6);
  METHODOLOGY.forEach(c => {
    const p = r.criteres?.find(x => x.cle === c.cle)?.points ?? 0;
    font("bold", 9); doc.text(safe(c.label), M, y);
    font("normal", 9, INK2); doc.text(`${c.max}`, M + CW - 52, y, { align: "right" });
    doc.setFillColor(...LINE); doc.rect(W - M - 38, y - 2.2, 20, 1.8, "F");
    doc.setFillColor(...BRAND); doc.rect(W - M - 38, y - 2.2, 20 * p / c.max, 1.8, "F");
    font("bold", 9); doc.text(`${p} / ${c.max}`, W - M, y, { align: "right" });
    y += gap(2.6); doc.setDrawColor(...LINE); doc.line(M, y, W - M, y); y += gap(4.6);
  });
  font("bold", 9); doc.text("Total", M, y); doc.text(`${r.score} / 100`, W - M, y, { align: "right" });

  // ── 03 Plan d'action ──
  section(3, "Plan d'action recommandé");
  const planSize = 8.8 * Math.max(0.9, k);
  (r.recommandations ?? []).forEach((t, i) => {
    doc.setFillColor(...BRAND_SOFT); doc.circle(M + 2.3, y - 1.1, 2.3, "F");
    font("bold", 7.5, BRAND); doc.text(`${i + 1}`, M + 2.3, y, { align: "center" });
    font("normal", planSize, INK2);
    const lines = doc.splitTextToSize(safe(t), CW - 8);
    doc.text(lines, M + 7.5, y);
    y += lines.length * planSize * 0.4 + gap(2.4);
  });

  // ── 04 Reconnaissance (encadré compact) ──
  if (r.legalisation || r.niveau_requis) {
    y += gap(2);
    const items: [string, string][] = [];
    if (r.niveau_requis) items.push(["QUALIFICATION HABITUELLEMENT DEMANDEE", r.niveau_requis]);
    if (r.legalisation) items.push(["RECONNAISSANCE DU DIPLOME", r.legalisation]);
    if (r.competences?.length) items.push(["COMPETENCES ATTENDUES", r.competences.join(", ")]);
    const cw = CW / items.length;
    font("bold", 8.5);
    const wrapped = items.map(([, v]) => doc.splitTextToSize(safe(v), cw - 8).slice(0, 3) as string[]);
    const maxLines = Math.max(...wrapped.map(w => w.length));
    const h = gap(9) + maxLines * 3.6;
    doc.setDrawColor(...LINE); doc.roundedRect(M, y, CW, h, 2, 2, "S");
    items.forEach(([key], i) => {
      const cx = M + 5 + i * cw;
      font("normal", 6.5, MUTED); doc.text(key, cx, y + gap(5));
      font("bold", 8.5); doc.text(wrapped[i], cx, y + gap(5) + 4);
    });
    y += h;
  }

  // ── Méthodologie (note) ──
  y += gap(5);
  font("bold", 7, INK2); doc.text("Méthodologie et limites.", M, y);
  font("normal", 7, MUTED);
  const note = doc.splitTextToSize(safe(
    "Indice sur 100 points calculé selon une grille fixe, identique pour tous les candidats, à partir de vos réponses déclarées et de notre référentiel des métiers en tension (nomenclature ROME). " +
    "Les pièces (diplômes, attestations, passeport) sont vérifiées lors de l'accompagnement. Cet indice est indicatif : il ne constitue ni une décision administrative, ni une garantie de visa ou d'embauche. " +
    "AXIOM est un service indépendant, non affilié à France Travail ni à l'administration française."
  ), CW);
  doc.text(note, M, y + 3.4);
  y += 3.4 + note.length * 2.9;
  return y;
}

export function generateEligibilityPdf(r: SimulationResult): jsPDF {
  // Une seule page : on resserre progressivement la mise en page si le contenu déborde.
  let k = 1, doc = new jsPDF({ unit: "mm", format: "a4" });
  for (;;) {
    const bottom = compose(doc, r, k);
    if (bottom <= FOOTER_TOP - 3 || k <= 0.6) break;
    k -= 0.08;
    doc = new jsPDF({ unit: "mm", format: "a4" });
  }

  // ── Pied de page humain ──
  const ref = reportReference(r);
  const link = shareLink(r.referral_code);
  doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, FOOTER_TOP, W - M, FOOTER_TOP);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...INK2);
  doc.text(safe("Un proche souhaite, lui aussi, travailler en France ?"), M, FOOTER_TOP + 5.5);
  doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
  const l2a = safe("Il peut réaliser son évaluation gratuitement sur ");
  doc.text(l2a, M, FOOTER_TOP + 9.5);
  const x2 = M + doc.getTextWidth(l2a);
  doc.setTextColor(...BRAND); doc.setFont("helvetica", "bold");
  doc.textWithLink("axiom-talents.com", x2, FOOTER_TOP + 9.5, { url: link });
  const x3 = x2 + doc.getTextWidth("axiom-talents.com");
  doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
  doc.text(safe(`, avec votre code de recommandation `), x3, FOOTER_TOP + 9.5);
  const x4 = x3 + doc.getTextWidth(safe(`, avec votre code de recommandation `));
  doc.setFont("helvetica", "bold"); doc.setTextColor(...INK); doc.text(r.referral_code, x4, FOOTER_TOP + 9.5);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text(safe(`AXIOM Talent Mobility · axiom-talents.com`), M, FOOTER_TOP + 14.5);
  doc.text(safe(`Réf. ${ref}`), W - M, FOOTER_TOP + 14.5, { align: "right" });
  return doc;
}

export function downloadEligibilityPdf(r: SimulationResult) {
  const name = (r.first_name || "candidat").normalize("NFD").replace(/[^\w-]/g, "").slice(0, 30) || "candidat";
  generateEligibilityPdf(r).save(`AXIOM-rapport-evaluation-${name}.pdf`);
}
