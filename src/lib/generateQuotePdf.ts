import jsPDF from "jspdf";

export interface QuoteItem {
  label: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteData {
  quoteNumber: string;
  date: string;
  validityDate: string;
  companyName: string;
  contactEmail: string;
  sector: string;
  volume: string;
  items: QuoteItem[];
  totalHT: number;
  totalTTC: number;
  notes?: string;
}

export function generateQuotePdf(data: QuoteData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 20;
  const contentW = W - margin * 2;
  let y = 20;

  // ── Couleurs ──
  const navy = [15, 23, 42] as const;     // #0F172A
  const accent = [14, 165, 233] as const;  // #0EA5E9
  const grey = [100, 116, 139] as const;
  const lightGrey = [241, 245, 249] as const;

  // ── Header band ──
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 42, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("AXIOM ALTIS", margin, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 200, 220);
  doc.text("TIaaS — Talent Infrastructure as a Service", margin, 25);
  doc.text("Recrutement international Afrique → France", margin, 30);

  // Contact info right side
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 220);
  doc.text("contact@axiom-altis.com", W - margin, 18, { align: "right" });
  doc.text("axiom-talents.com", W - margin, 23, { align: "right" });
  doc.text("SIRET : En cours d'immatriculation", W - margin, 28, { align: "right" });

  y = 52;

  // ── Quote title ──
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text("DEVIS", margin, y);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...accent);
  doc.text(`N° ${data.quoteNumber}`, margin + 40, y);

  y += 12;

  // ── Meta info ──
  doc.setFontSize(9);
  doc.setTextColor(...grey);

  const metaLeft = [
    ["Date d'émission", data.date],
    ["Validité", data.validityDate],
    ["Statut", "En attente de validation"],
  ];

  const metaRight = [
    ["Client", data.companyName],
    ["Email", data.contactEmail],
    ["Secteur", data.sector],
    ["Volume", data.volume || "Non précisé"],
  ];

  metaLeft.forEach(([label, val], i) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label} :`, margin, y + i * 5.5);
    doc.setFont("helvetica", "normal");
    doc.text(val, margin + 35, y + i * 5.5);
  });

  metaRight.forEach(([label, val], i) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label} :`, W / 2 + 10, y + i * 5.5);
    doc.setFont("helvetica", "normal");
    doc.text(val, W / 2 + 35, y + i * 5.5);
  });

  y += Math.max(metaLeft.length, metaRight.length) * 5.5 + 10;

  // ── Separator ──
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // ── Table header ──
  doc.setFillColor(...navy);
  doc.rect(margin, y, contentW, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  const colX = {
    desc: margin + 3,
    qty: margin + 100,
    unit: margin + 120,
    total: margin + 150,
  };

  doc.text("Désignation", colX.desc, y + 5.5);
  doc.text("Qté", colX.qty, y + 5.5);
  doc.text("Prix unit. HT", colX.unit, y + 5.5);
  doc.text("Total HT", colX.total, y + 5.5);

  y += 8;

  // ── Table rows ──
  doc.setFontSize(8.5);
  data.items.forEach((item, i) => {
    const rowH = 14;
    if (i % 2 === 0) {
      doc.setFillColor(...lightGrey);
      doc.rect(margin, y, contentW, rowH, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    doc.text(item.label, colX.desc, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grey);
    doc.setFontSize(7.5);
    const descLines = doc.splitTextToSize(item.description, 90);
    doc.text(descLines.slice(0, 2), colX.desc, y + 9.5);

    doc.setFontSize(8.5);
    doc.setTextColor(...navy);
    doc.text(String(item.quantity), colX.qty, y + 7);
    doc.text(formatEur(item.unitPrice), colX.unit, y + 7);
    doc.setFont("helvetica", "bold");
    doc.text(formatEur(item.total), colX.total, y + 7);

    y += rowH;
  });

  y += 6;

  // ── Totals ──
  doc.setDrawColor(220, 220, 220);
  doc.line(colX.unit - 5, y, W - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...grey);
  doc.text("Total HT", colX.unit, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text(formatEur(data.totalHT), colX.total, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grey);
  doc.text("TVA (20 %)", colX.unit, y);
  doc.setTextColor(...navy);
  doc.text(formatEur(data.totalTTC - data.totalHT), colX.total, y);
  y += 6;

  doc.setFillColor(...accent);
  doc.rect(colX.unit - 5, y - 1, contentW - (colX.unit - 5 - margin), 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Total TTC", colX.unit, y + 5);
  doc.text(formatEur(data.totalTTC), colX.total, y + 5);

  y += 18;

  // ── Conditions ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...navy);
  doc.text("Conditions de paiement", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  const conditions = [
    "• Acompte de 50 % à la signature du devis",
    "• Solde de 50 % à la mise à disposition du ou des talent(s)",
    "• Paiement par virement bancaire sous 30 jours",
    "• Délai de mise à disposition : 8 à 12 semaines",
    "• Garantie de remplacement : 3 mois à compter de la prise de poste",
  ];
  conditions.forEach((c) => {
    doc.text(c, margin, y);
    y += 4.5;
  });

  y += 6;

  // ── Pack ALTIS details ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...navy);
  doc.text("Détail Pack ALTIS (inclus par talent)", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  const packDetails = [
    "• Visa ANEF : prise en charge complète de la procédure",
    "• Billet A/R : vol aller-retour Cameroun ↔ France",
    "• Accueil aéroport : transfert et accompagnement à l'arrivée",
    "• Logement meublé : 1 mois d'hébergement inclus",
    "• Accompagnement administratif : ouverture compte bancaire, sécurité sociale, titre de séjour",
  ];
  packDetails.forEach((d) => {
    doc.text(d, margin, y);
    y += 4.5;
  });

  y += 8;

  // ── Mentions légales ──
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(...lightGrey);
  doc.rect(margin, y, contentW, 30, "F");
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...navy);
  doc.text("Mentions légales", margin + 3, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...grey);
  const legal = [
    `Ce devis est valable jusqu'au ${data.validityDate}. Passé cette date, AXIOM ALTIS se réserve le droit de modifier les tarifs.`,
    "Les services financiers (avances sur salaire, services bancaires) sont explicitement exclus du présent devis.",
    "Conformément à la loi, en cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.",
    "Indemnité forfaitaire de recouvrement : 40 € (art. D. 441-5 du Code de commerce).",
    "AXIOM ALTIS — SAS en cours d'immatriculation — contact@axiom-altis.com",
  ];
  legal.forEach((l) => {
    const lines = doc.splitTextToSize(l, contentW - 6);
    doc.text(lines, margin + 3, y);
    y += lines.length * 3.2 + 1;
  });

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(...grey);
    doc.text(
      `AXIOM ALTIS — Devis ${data.quoteNumber} — Page ${p}/${pageCount}`,
      W / 2,
      290,
      { align: "center" }
    );
  }

  return doc;
}

function formatEur(val: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
}
