// ─── Secteurs en tension avec code ROME ─────────────────────────────────────
export interface SecteurRome {
  secteur: string;
  metier: string;
  codeRome: string;
  label: string;
}

export const SECTEURS_ROME: SecteurRome[] = [
  { secteur: "Bâtiment & Construction", metier: "Maçon", codeRome: "F1703", label: "BÂTIMENT & CONSTRUCTION – Maçon – F1703" },
  { secteur: "Santé – Soins infirmiers", metier: "Infirmier(ère)", codeRome: "J1506", label: "SANTÉ – Infirmier(ère) – J1506" },
  { secteur: "Santé – Aide à domicile", metier: "Aide-soignant(e)", codeRome: "J1501", label: "SANTÉ – Aide-soignant(e) – J1501" },
  { secteur: "Hôtellerie & Restauration", metier: "Cuisinier(ère)", codeRome: "G1602", label: "HÔTELLERIE & RESTAURATION – Cuisinier(ère) – G1602" },
  { secteur: "Transport & Logistique", metier: "Conducteur PL", codeRome: "N4101", label: "TRANSPORT & LOGISTIQUE – Conducteur PL – N4101" },
  { secteur: "Maintenance Industrielle", metier: "Technicien de maintenance", codeRome: "I1304", label: "MAINTENANCE INDUSTRIELLE – Technicien de maintenance – I1304" },
  { secteur: "Commerce & Distribution", metier: "Vendeur conseil", codeRome: "D1211", label: "COMMERCE & DISTRIBUTION – Vendeur conseil – D1211" },
  { secteur: "Agriculture & Agroalimentaire", metier: "Ouvrier agricole", codeRome: "A1401", label: "AGRICULTURE & AGROALIMENTAIRE – Ouvrier agricole – A1401" },
  { secteur: "Support Entreprise", metier: "Assistant(e) de direction", codeRome: "M1604", label: "SUPPORT ENTREPRISE – Assistant(e) de direction – M1604" },
];

// ─── Offres mock ──────────────────────────────────────────────────────────────
export interface MockOffer {
  id: string;
  title: string;
  secteur: string;
  codeRome: string;
  location: string;
  salary: string;
  description: string;
  skills: string[];
  status: "open" | "closed" | "filled";
  applicantsCount: number;
  createdAt: string;
}

export const MOCK_OFFERS: MockOffer[] = [
  {
    id: "offer-1",
    title: "Maçon – Chantier Grand Paris",
    secteur: "Bâtiment & Construction",
    codeRome: "F1703",
    location: "Paris, Île-de-France",
    salary: "32 000",
    description: "Intégration sur chantiers Grand Paris Express. Pose briques, parpaings, enduits.",
    skills: ["Maçonnerie", "Coffrage", "Lecture de plans", "Sécurité chantier"],
    status: "open",
    applicantsCount: 8,
    createdAt: "2026-01-15",
  },
  {
    id: "offer-2",
    title: "Infirmier(ère) DE – Urgences",
    secteur: "Santé – Soins infirmiers",
    codeRome: "J1506",
    location: "Lyon, Auvergne-Rhône-Alpes",
    salary: "42 000",
    description: "Service urgences adultes, soins intensifs. Diplôme d'État + expérience 2 ans minimum.",
    skills: ["Soins intensifs", "Urgences", "Gestion douleur", "Teamwork"],
    status: "open",
    applicantsCount: 12,
    createdAt: "2026-01-20",
  },
  {
    id: "offer-3",
    title: "Réceptionniste Hôtel 4★",
    secteur: "Hôtellerie & Restauration",
    codeRome: "G1602",
    location: "Nice, Côte d'Azur",
    salary: "28 000",
    description: "Accueil clientèle internationale, gestion réservations, PMS Opera.",
    skills: ["Anglais courant", "Opera PMS", "Relation client", "Espagnol apprécié"],
    status: "open",
    applicantsCount: 5,
    createdAt: "2026-02-01",
  },
  {
    id: "offer-4",
    title: "Conducteur Poids Lourd – Longue Distance",
    secteur: "Transport & Logistique",
    codeRome: "N4101",
    location: "Marseille, PACA",
    salary: "35 000",
    description: "Livraisons nationales et européennes. Permis CE + FIMO exigés.",
    skills: ["Permis CE", "FIMO", "Tachygraphe", "ADR apprécié"],
    status: "open",
    applicantsCount: 3,
    createdAt: "2026-02-05",
  },
  {
    id: "offer-5",
    title: "Technicien Maintenance Industrielle",
    secteur: "Maintenance Industrielle",
    codeRome: "I1304",
    location: "Bordeaux, Nouvelle-Aquitaine",
    salary: "38 000",
    description: "Maintenance préventive et curative lignes de production agroalimentaire.",
    skills: ["Électrotechnique", "Pneumatique", "GMAO", "Diagnostic panne"],
    status: "open",
    applicantsCount: 6,
    createdAt: "2026-02-10",
  },
];

// ─── Candidats mock ──────────────────────────────────────────────────────────
export interface MockCandidate {
  id: string;
  name: string;
  country: string;
  codeRome: string;
  secteur: string;
  score: number; // 0-100
  romeScore: number; // 0-100 composante matching
  skillsScore: number;
  frenchLevel: string;
  experienceYears: number;
  certifiedMinefop: boolean;
  certifiedMinrex: boolean;
  available: boolean;
  avatar?: string;
}

export const MOCK_CANDIDATES: MockCandidate[] = [
  {
    id: "c1",
    name: "Alexis Mbala Nguema",
    country: "Cameroun",
    codeRome: "F1703",
    secteur: "Bâtiment & Construction",
    score: 92,
    romeScore: 95,
    skillsScore: 90,
    frenchLevel: "C1",
    experienceYears: 7,
    certifiedMinefop: true,
    certifiedMinrex: true,
    available: true,
  },
  {
    id: "c2",
    name: "Patience Ekwueme",
    country: "Cameroun",
    codeRome: "J1506",
    secteur: "Santé – Soins infirmiers",
    score: 88,
    romeScore: 90,
    skillsScore: 85,
    frenchLevel: "B2",
    experienceYears: 5,
    certifiedMinefop: true,
    certifiedMinrex: false,
    available: true,
  },
  {
    id: "c3",
    name: "Fabrice Onana Bello",
    country: "Cameroun",
    codeRome: "N4101",
    secteur: "Transport & Logistique",
    score: 83,
    romeScore: 85,
    skillsScore: 80,
    frenchLevel: "B2",
    experienceYears: 4,
    certifiedMinefop: true,
    certifiedMinrex: false,
    available: true,
  },
  {
    id: "c4",
    name: "Marie-Claire Fouda",
    country: "Cameroun",
    codeRome: "J1506",
    secteur: "Santé – Soins infirmiers",
    score: 79,
    romeScore: 80,
    skillsScore: 75,
    frenchLevel: "C1",
    experienceYears: 3,
    certifiedMinefop: false,
    certifiedMinrex: false,
    available: true,
  },
  {
    id: "c5",
    name: "Roland Tchangani",
    country: "Cameroun",
    codeRome: "I1304",
    secteur: "Maintenance Industrielle",
    score: 91,
    romeScore: 93,
    skillsScore: 88,
    frenchLevel: "C1",
    experienceYears: 8,
    certifiedMinefop: true,
    certifiedMinrex: true,
    available: true,
  },
  {
    id: "c6",
    name: "Sophie Njike",
    country: "Cameroun",
    codeRome: "G1602",
    secteur: "Hôtellerie & Restauration",
    score: 75,
    romeScore: 78,
    skillsScore: 70,
    frenchLevel: "B2",
    experienceYears: 3,
    certifiedMinefop: false,
    certifiedMinrex: false,
    available: true,
  },
  {
    id: "c7",
    name: "Emmanuel Essomba",
    country: "Cameroun",
    codeRome: "F1703",
    secteur: "Bâtiment & Construction",
    score: 68,
    romeScore: 70,
    skillsScore: 65,
    frenchLevel: "B1",
    experienceYears: 2,
    certifiedMinefop: false,
    certifiedMinrex: false,
    available: true,
  },
  {
    id: "c8",
    name: "Christelle Abomo",
    country: "Cameroun",
    codeRome: "M1604",
    secteur: "Support Entreprise",
    score: 85,
    romeScore: 88,
    skillsScore: 82,
    frenchLevel: "C1",
    experienceYears: 6,
    certifiedMinefop: true,
    certifiedMinrex: true,
    available: true,
  },
  {
    id: "c9",
    name: "Patrick Nzomo",
    country: "Cameroun",
    codeRome: "N4101",
    secteur: "Transport & Logistique",
    score: 62,
    romeScore: 65,
    skillsScore: 58,
    frenchLevel: "B1",
    experienceYears: 2,
    certifiedMinefop: false,
    certifiedMinrex: false,
    available: true,
  },
  {
    id: "c10",
    name: "Armelle Tchoupo",
    country: "Cameroun",
    codeRome: "J1501",
    secteur: "Santé – Aide à domicile",
    score: 77,
    romeScore: 80,
    skillsScore: 73,
    frenchLevel: "B2",
    experienceYears: 4,
    certifiedMinefop: true,
    certifiedMinrex: false,
    available: true,
  },
];

// Calcul score de conformité prédictif
export function computeComplianceScore(candidate: MockCandidate, requiredRome?: string): number {
  const romeMatch = requiredRome
    ? candidate.codeRome === requiredRome
      ? candidate.romeScore
      : candidate.romeScore * 0.4
    : candidate.romeScore;

  const countryBonus = candidate.country === "Cameroun" ? 100 : 60;
  const certBonus = (candidate.certifiedMinefop ? 60 : 0) + (candidate.certifiedMinrex ? 40 : 0);

  return Math.round(romeMatch * 0.7 + countryBonus * 0.2 + certBonus * 0.1);
}
