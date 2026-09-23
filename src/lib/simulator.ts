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

export const BAND_LABELS: Record<Band, { label: string; color: string }> = {
  fort:        { label: "Potentiel fort",                               color: "hsl(158,64%,45%)" },
  reel:        { label: "Potentiel réel",                               color: "hsl(189,94%,43%)" },
  a_renforcer: { label: "Potentiel à renforcer",                        color: "hsl(45,93%,52%)" },
  pas_encore:  { label: "Pas encore prêt — voici comment progresser",   color: "hsl(0,80%,68%)" },
};

export const DISCLAIMER =
  "Indice indicatif calculé à partir de la liste des métiers en tension et de votre profil déclaré. " +
  "Il ne constitue ni une décision administrative ni une garantie de visa ou d'embauche.";

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
