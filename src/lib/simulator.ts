/**
 * Simulateur d'éligibilité — bêta.
 * Toute la logique de score vit côté serveur (fonctions Postgres
 * simulate_eligibility / get_simulation_result / track_referral_click /
 * submit_testimonial). Ce module ne fait qu'appeler ces fonctions.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase.rpc as any)(fn, args) as Promise<{ data: any; error: any }>;

/* ─── Types ─────────────────────────────────────────────────────── */
export type Band = "fort" | "reel" | "a_renforcer" | "pas_encore";

export interface Critere { cle: string; label: string; points: number; max: number }

export interface SimulationResult {
  token: string;
  first_name: string;
  referral_code: string;
  score: number;
  band: Band;
  metier: { rome_code: string; titre: string; tension: string; salaire: string };
  pays: string;
  clicks: number;
  threshold: number;
  unlocked: boolean;
  unlock_method: "partage" | "temoignage" | null;
  founder: boolean;
  created_at: string;
  // présents uniquement si unlocked = true
  criteres?: Critere[];
  recommandations?: string[];
  legalisation?: string;
  niveau_requis?: string;
  competences?: string[] | null;
}

export interface Metier {
  rome_code: string;
  rome_title: string;
  minefop_title: string;
  niveau_tension: string;
  salaire_moyen_france: string;
}

export interface SimulationInput {
  firstName: string;
  romeCode: string;
  experience: string;
  diplome: string;
  niveauFrancais: string;
  passeport: boolean;
  pays: string;
  emailOrPhone: string;
  rgpd: boolean;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

/* ─── Référentiels du formulaire ────────────────────────────────── */
export const EXPERIENCES = [
  { value: "0-2", label: "0-2 ans" },
  { value: "2-5", label: "2-5 ans" },
  { value: "5-10", label: "5-10 ans" },
  { value: "10+", label: "10 ans +" },
];

export const DIPLOMES = [
  { value: "CQP", label: "CQP" },
  { value: "DQP", label: "DQP" },
  { value: "BAC_PRO", label: "Bac pro / CAP" },
  { value: "BTS", label: "BTS / Licence" },
  { value: "MASTER", label: "Master / Ingénieur" },
  { value: "AUTRE", label: "Autre" },
];

export const NIVEAUX_FRANCAIS = [
  { value: "NATIF", label: "Langue maternelle" },
  { value: "C1", label: "C1" },
  { value: "B2", label: "B2" },
  { value: "B1", label: "B1" },
  { value: "A2", label: "A2" },
  { value: "A1", label: "A1" },
];

export const PAYS = [
  "Cameroun", "Gabon", "Centrafrique", "Côte d'Ivoire", "Maroc", "Tunisie",
  "Sénégal", "Mali", "Guinée", "Burkina Faso", "Togo", "Bénin", "Niger",
  "Congo (RDC)", "Congo (Brazzaville)", "Madagascar", "Autre",
];

const TENSION_ORDER: Record<string, number> = {
  "Très haute": 0, "Haute": 1, "Moyenne-haute": 2, "Croissante": 2, "Moyenne": 3,
};
export const tensionRank = (t: string) => TENSION_ORDER[t] ?? 9;

export const BAND_LABELS: Record<Band, { label: string; color: string; soft: string; summary: string }> = {
  fort: {
    label: "Préparation élevée", color: "#0F7B5F", soft: "#E7F5F0",
    summary: "Votre profil correspond bien à un métier où les employeurs français peinent à recruter. Les éléments clés d'un dossier sont réunis ; il reste à les documenter.",
  },
  reel: {
    label: "Préparation intermédiaire", color: "#1D5FB8", soft: "#EAF1FB",
    summary: "Votre profil présente de vrais atouts pour ce métier. Un ou deux points doivent être renforcés avant une candidature auprès d'employeurs en France.",
  },
  a_renforcer: {
    label: "Préparation à consolider", color: "#A15C00", soft: "#FDF3E4",
    summary: "Le projet est réaliste mais plusieurs critères sont encore en dessous des attentes des employeurs. Le plan d'action détaillé indique par où commencer.",
  },
  pas_encore: {
    label: "Préparation initiale", color: "#B42318", soft: "#FDECEA",
    summary: "À ce stade, votre dossier serait difficile à défendre auprès d'un employeur. Les étapes prioritaires peuvent toutefois faire progresser votre indice rapidement.",
  },
};

export const BAND_SCALE = [
  { from: 0, to: 39, key: "pas_encore" as Band },
  { from: 40, to: 54, key: "a_renforcer" as Band },
  { from: 55, to: 74, key: "reel" as Band },
  { from: 75, to: 100, key: "fort" as Band },
];

/** Pondérations publiques de la méthode (identiques à la fonction serveur _sim_score). */
export const METHODOLOGY = [
  { cle: "tension", label: "Demande du métier en France", max: 30, detail: "Niveau de tension du métier selon notre référentiel ROME." },
  { cle: "experience", label: "Expérience professionnelle", max: 25, detail: "Années d'expérience déclarées dans le métier visé." },
  { cle: "diplome", label: "Qualification / diplôme", max: 20, detail: "Niveau de qualification et possibilité de reconnaissance en France." },
  { cle: "francais", label: "Niveau de français", max: 15, detail: "Niveau déclaré selon le Cadre européen commun de référence (CECR)." },
  { cle: "passeport", label: "Passeport valide", max: 10, detail: "Condition préalable à toute démarche de visa de travail." },
];

export const reportReference = (r: { token: string; created_at?: string }) =>
  `AX-${new Date(r.created_at || Date.now()).getFullYear()}-${r.token.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

export const DISCLAIMER =
  "Indice indicatif calculé à partir de votre profil déclaré et de notre référentiel des métiers en tension (nomenclature ROME). " +
  "Il ne constitue ni une décision administrative, ni une garantie de visa ou d'embauche. " +
  "AXIOM est un service indépendant, non affilié à France Travail ni à l'administration française.";

const SERVER_ERRORS: Record<string, string> = {
  rgpd_required: "Cochez la case RGPD pour continuer.",
  contact_invalid: "Indiquez un email ou un numéro WhatsApp valide.",
  name_invalid: "Indiquez votre prénom.",
  metier_unknown: "Ce métier n'est plus disponible. Choisissez-en un autre.",
  testimonial_too_short: "Votre témoignage doit faire au moins 40 caractères.",
  result_not_found: "Résultat introuvable. Refaites le test.",
};
export function serverErrorMessage(err: any): string {
  const msg: string = err?.message ?? "";
  const key = Object.keys(SERVER_ERRORS).find(k => msg.includes(k));
  return key ? SERVER_ERRORS[key] : "Une erreur est survenue. Vérifiez votre connexion et réessayez.";
}

/* ─── Stockage local (try/catch : navigation privée, etc.) ──────── */
function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* silencieux */ }
}

let memoryDevice: string | null = null;
/** Identifiant anonyme de l'appareil (sert à exclure l'auto-clic sur son propre lien). */
export function getDeviceId(): string {
  const existing = lsGet("axiom_device") ?? memoryDevice;
  if (existing) return existing;
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  memoryDevice = id;
  lsSet("axiom_device", id);
  return id;
}

export const getStoredReferrer = () => lsGet("axiom_ref");
export const getStoredToken = () => lsGet("axiom_sim_token");

/**
 * À l'arrivée avec ?ref=CODE : mémorise le parrain et compte un clic
 * (une seule fois par appareil et par code). Silencieux.
 */
export async function captureReferral(search: string) {
  const code = new URLSearchParams(search).get("ref")?.trim().toUpperCase();
  if (!code || !/^[A-Z0-9]{4,12}$/.test(code)) return;
  lsSet("axiom_ref", code);
  const doneKey = `axiom_ref_tracked_${code}`;
  if (lsGet(doneKey)) return;
  try {
    await rpc("track_referral_click", { _code: code, _visitor: getDeviceId() });
    lsSet(doneKey, "1");
  } catch { /* silencieux */ }
}

/* ─── Appels serveur ────────────────────────────────────────────── */
export async function fetchMetiers(): Promise<Metier[]> {
  const { data, error } = await (supabase.from as any)("metiers_minefop_rome")
    .select("rome_code, rome_title, minefop_title, niveau_tension, salaire_moyen_france");
  if (error) throw error;
  return ((data ?? []) as Metier[]).sort(
    (a, b) => tensionRank(a.niveau_tension) - tensionRank(b.niveau_tension)
      || a.minefop_title.localeCompare(b.minefop_title, "fr"),
  );
}

export async function runSimulation(input: SimulationInput): Promise<SimulationResult> {
  const { data, error } = await rpc("simulate_eligibility", {
    _first_name: input.firstName,
    _rome_code: input.romeCode,
    _experience: input.experience,
    _diplome: input.diplome,
    _niveau_francais: input.niveauFrancais,
    _passeport: input.passeport,
    _pays: input.pays,
    _email_or_phone: input.emailOrPhone,
    _rgpd: input.rgpd,
    _referred_by: getStoredReferrer(),
    _device: getDeviceId(),
    _utm_source: input.utmSource ?? null,
    _utm_medium: input.utmMedium ?? null,
    _utm_campaign: input.utmCampaign ?? null,
  });
  if (error) throw error;
  lsSet("axiom_sim_token", data.token);
  return data as SimulationResult;
}

export async function getResult(token: string): Promise<SimulationResult> {
  const { data, error } = await rpc("get_simulation_result", { _token: token });
  if (error) throw error;
  return data as SimulationResult;
}

export async function sendTestimonial(token: string, text: string): Promise<SimulationResult> {
  const { data, error } = await rpc("submit_testimonial", { _token: token, _text: text });
  if (error) throw error;
  return data as SimulationResult;
}

/** paid_mode = false pendant la bêta → aucun bouton de paiement affiché. */
export function usePaidMode(): boolean {
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    let alive = true;
    (supabase.from as any)("simulator_settings")
      .select("value").eq("key", "paid_mode").maybeSingle()
      .then(({ data }: any) => { if (alive) setPaid(data?.value === true); })
      .catch(() => { /* reste false */ });
    return () => { alive = false; };
  }, []);
  return paid;
}

export const shareLink = (code: string) =>
  `https://axiom-talents.com/leads?ref=${encodeURIComponent(code)}&utm_source=parrainage`;

export const shareMessage = (code: string) =>
  "Je viens de tester mes chances de travailler en France dans les métiers qui recrutent. " +
  `C'est gratuit et ça prend 2 minutes. Fais le test ici : ${shareLink(code)}`;
