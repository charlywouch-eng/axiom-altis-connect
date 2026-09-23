import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Check, Search, Lock } from "lucide-react";
import { trackGA4 } from "@/lib/ga4";
import { trackFunnel } from "@/lib/trackFunnel";
import {
  captureReferral, fetchMetiers, runSimulation, serverErrorMessage,
  EXPERIENCES, DIPLOMES, NIVEAUX_FRANCAIS, PAYS, type Metier,
} from "@/lib/simulator";
import { SimShell, T } from "@/components/simulator/SimShell";

type Form = {
  metier: Metier | null; experience: string; diplome: string; niveauFrancais: string;
  passeport: boolean | null; pays: string; firstName: string; emailOrPhone: string; rgpd: boolean;
};

const TOTAL = 7;

/** Carte de question : un seul sujet par écran. */
function Question({ n, title, help, children }: { n: number; title: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="ax-in">
      <p className="ax-eyebrow">Question {n} sur {TOTAL}</p>
      <h2 style={{ font: `600 clamp(22px,4vw,28px)/1.25 ${T.serif}`, margin: "8px 0 6px" }}>{title}</h2>
      {help && <p style={{ font: `14.5px/1.55 ${T.sans}`, color: T.muted, margin: "0 0 20px" }}>{help}</p>}
      {children}
    </div>
  );
}

function Choices<V extends string | boolean>({ options, value, onPick }:
  { options: { value: V; label: string; hint?: string }[]; value: V | null | ""; onPick: (v: V) => void }) {
  return (
    <div role="radiogroup">
      {options.map(o => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} aria-pressed={value === o.value}
          className="ax-choice" onClick={() => onPick(o.value)}>
          <span>{o.label}{o.hint && <small>{o.hint}</small>}</span>
          {value === o.value ? <Check className="h-5 w-5" style={{ color: T.brand }} /> : <ArrowRight className="h-4 w-4" style={{ color: T.faint }} />}
        </button>
      ))}
    </div>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0); // 0 = accroche, 1..7 = questions
  const [metiers, setMetiers] = useState<Metier[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState<Form>({
    metier: null, experience: "", diplome: "", niveauFrancais: "", passeport: null,
    pays: "", firstName: "", emailOrPhone: "", rgpd: false,
  });

  useEffect(() => { captureReferral(location.search); }, [location.search]);
  useEffect(() => { fetchMetiers().then(setMetiers).catch(() => setLoadError(true)); }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (!q) return metiers;
    return metiers.filter(m => `${m.minefop_title} ${m.rome_title} ${m.rome_code}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q));
  }, [metiers, query]);

  // Choisir une réponse fait avancer automatiquement
  const pick = <K extends keyof Form>(key: K, value: Form[K]) => {
    setF(prev => ({ ...prev, [key]: value }));
    setTimeout(() => setStep(s => Math.min(TOTAL, s + 1)), 180);
  };

  const start = () => { setStep(1); trackGA4("sim_started", {}); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing =
      !f.firstName.trim() ? "Indiquez votre prénom."
      : f.emailOrPhone.trim().length < 6 ? "Indiquez un email ou un numéro WhatsApp valide."
      : !f.rgpd ? "Merci d'accepter la politique de confidentialité pour recevoir votre résultat."
      : "";
    if (missing) { setError(missing); return; }
    if (!f.metier || !f.experience || !f.diplome || !f.niveauFrancais || f.passeport === null || !f.pays) {
      setError("Une réponse manque. Revenez à la question précédente."); return;
    }
    setLoading(true); setError("");
    try {
      const result = await runSimulation({
        firstName: f.firstName.trim(), romeCode: f.metier.rome_code, experience: f.experience, diplome: f.diplome,
        niveauFrancais: f.niveauFrancais, passeport: f.passeport, pays: f.pays, emailOrPhone: f.emailOrPhone.trim(), rgpd: f.rgpd,
        utmSource: searchParams.get("utm_source"), utmMedium: searchParams.get("utm_medium"), utmCampaign: searchParams.get("utm_campaign"),
      });
      trackGA4("sim_completed", { rome_code: f.metier.rome_code, band: result.band, pays: f.pays });
      trackGA4("rgpd_accepted");
      trackFunnel({ event_name: "lead_form_submitted", rome_code: f.metier.rome_code, experience: f.experience, source: "simulateur_beta", metadata: { pays: f.pays } });
      navigate(`/leads/resultat/${result.token}`);
    } catch (err) {
      setError(serverErrorMessage(err)); setLoading(false);
    }
  };

  return (
    <SimShell title="Test d'éligibilité : votre profil est-il prêt pour la France ? — AXIOM">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14" style={{ minHeight: "calc(100vh - 64px - 150px)" }}>
        {step === 0 && (
          <section className="ax-in text-center sm:text-left" style={{ maxWidth: 640 }}>
            <p className="ax-eyebrow">Test d'éligibilité · 60 secondes</p>
            <h1 style={{ font: `600 clamp(30px,6vw,46px)/1.1 ${T.serif}`, margin: "12px 0 16px" }}>
              Votre métier est recherché en France.<br />Votre profil est-il prêt&nbsp;?
            </h1>
            <p style={{ font: `17px/1.6 ${T.sans}`, color: T.ink2, margin: "0 0 26px" }}>
              Sept questions, un verdict clair et le point qui fait la différence pour votre dossier.
            </p>
            <button type="button" className="ax-btn" style={{ height: 56, padding: "0 30px", fontSize: 16 }} onClick={start}>
              Commencer le test <ArrowRight className="h-5 w-5" />
            </button>
            <p style={{ font: `13px ${T.sans}`, color: T.muted, margin: "12px 0 0" }}>Gratuit · sans création de compte · résultat immédiat</p>

            <div className="mt-10 pt-6 flex gap-4 items-start text-left" style={{ borderTop: `1px solid ${T.line}` }}>
              <span className="ax-num" style={{ font: `600 34px/1 ${T.serif}`, color: T.brand, whiteSpace: "nowrap" }}>2,28 M</span>
              <p style={{ font: `14px/1.55 ${T.sans}`, color: T.ink2, margin: 0 }}>
                projets de recrutement en France en 2026, dont <strong>43,8 %</strong> jugés difficiles à pourvoir par les employeurs.
                <span style={{ display: "block", fontSize: 12, color: T.faint, marginTop: 2 }}>Source : France Travail, enquête Besoins en main-d'œuvre 2026.</span>
              </p>
            </div>
          </section>
        )}

        {step > 0 && (
          <>
            <div className="flex items-center gap-3 mb-8">
              <button type="button" onClick={() => setStep(s => Math.max(0, s - 1))} aria-label="Question précédente"
                className="inline-flex items-center justify-center rounded-full" style={{ width: 36, height: 36, border: `1px solid ${T.line}`, background: "#fff", cursor: "pointer" }}>
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex-1" style={{ height: 6, background: T.line, borderRadius: 3, overflow: "hidden" }} aria-hidden>
                <div style={{ height: "100%", width: `${(step / TOTAL) * 100}%`, background: T.brand, transition: "width .3s" }} />
              </div>
              <span className="ax-num" style={{ font: `500 13px ${T.sans}`, color: T.muted }}>{step}/{TOTAL}</span>
            </div>

            {step === 1 && (
              <Question n={1} title="Quel métier exercez-vous ?" help="Choisissez le métier dans lequel vous avez le plus d'expérience.">
                <div className="relative mb-4">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.faint }} />
                  <input className="ax-input" style={{ paddingLeft: 40, height: 50 }} value={query} autoFocus
                    onChange={e => setQuery(e.target.value)} placeholder="Maçon, aide-soignant, cuisinier…" aria-label="Rechercher un métier" />
                </div>
                {loadError && <p style={{ color: "#B42318", font: `14px ${T.sans}` }}>La liste des métiers n'a pas pu être chargée. Vérifiez votre connexion puis rechargez la page.</p>}
                {!loadError && !metiers.length && <p style={{ color: T.muted, font: `14px ${T.sans}` }}>Chargement…</p>}
                <Choices options={filtered.map(m => ({ value: m.rome_code, label: m.minefop_title, hint: `Demande en France : ${m.niveau_tension.toLowerCase()}` }))}
                  value={f.metier?.rome_code ?? ""} onPick={code => pick("metier", metiers.find(m => m.rome_code === code) ?? null)} />
                {metiers.length > 0 && !filtered.length && <p style={{ color: T.muted, font: `14px ${T.sans}` }}>Aucun métier ne correspond à « {query} ».</p>}
              </Question>
            )}
            {step === 2 && (
              <Question n={2} title={`Depuis combien de temps exercez-vous comme ${f.metier?.minefop_title.toLowerCase() ?? "professionnel"} ?`}
                help="Stages et apprentissage compris. L'expérience est le critère que les employeurs regardent en premier.">
                <Choices options={[
                  { value: "0-2", label: "Moins de 2 ans" }, { value: "2-5", label: "2 à 5 ans" },
                  { value: "5-10", label: "5 à 10 ans" }, { value: "10+", label: "Plus de 10 ans" },
                ].filter(o => EXPERIENCES.some(e => e.value === o.value))}
                  value={f.experience} onPick={v => pick("experience", v)} />
              </Question>
            )}
            {step === 3 && (
              <Question n={3} title="Quel est votre diplôme ou votre formation le plus élevé ?" help="Un diplôme reconnu ou certifié rassure un employeur français.">
                <Choices options={DIPLOMES} value={f.diplome} onPick={v => pick("diplome", v)} />
              </Question>
            )}
            {step === 4 && (
              <Question n={4} title="Comment évaluez-vous votre français ?" help="Scolarisé en français ? Choisissez « Langue maternelle ».">
                <Choices options={[
                  { value: "NATIF", label: "Langue maternelle", hint: "Scolarité en français" },
                  { value: "C1", label: "Très à l'aise (C1)", hint: "Je comprends et m'exprime sans difficulté" },
                  { value: "B2", label: "À l'aise (B2)", hint: "Je tiens une conversation professionnelle" },
                  { value: "B1", label: "Intermédiaire (B1)", hint: "Je me débrouille au quotidien" },
                  { value: "A2", label: "Débutant (A2)", hint: "Phrases simples" },
                  { value: "A1", label: "Grand débutant (A1)", hint: "Quelques mots" },
                ].filter(o => NIVEAUX_FRANCAIS.some(n => n.value === o.value))} value={f.niveauFrancais} onPick={v => pick("niveauFrancais", v)} />
              </Question>
            )}
            {step === 5 && (
              <Question n={5} title="Avez-vous un passeport en cours de validité ?" help="C'est la première pièce demandée pour toute démarche de visa de travail.">
                <Choices<boolean> options={[{ value: true, label: "Oui" }, { value: false, label: "Non, pas encore" }]} value={f.passeport} onPick={v => pick("passeport", v)} />
              </Question>
            )}
            {step === 6 && (
              <Question n={6} title="Dans quel pays vivez-vous actuellement ?">
                <Choices options={PAYS.map(p => ({ value: p, label: p }))} value={f.pays} onPick={v => pick("pays", v)} />
              </Question>
            )}
            {step === 7 && (
              <Question n={7} title="Votre résultat est prêt. À qui l'adressons-nous ?" help="Votre verdict s'affiche immédiatement ; nous l'envoyons aussi à ce contact.">
                <form onSubmit={submit} noValidate className="grid gap-5">
                  <div>
                    <label className="ax-label" htmlFor="sim-prenom">Prénom</label>
                    <input id="sim-prenom" className="ax-input" autoComplete="given-name" value={f.firstName} onChange={e => setF(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="ax-label" htmlFor="sim-contact">Email ou numéro WhatsApp</label>
                    <input id="sim-contact" className="ax-input" value={f.emailOrPhone} placeholder="nom@email.com ou +237…" onChange={e => setF(p => ({ ...p, emailOrPhone: e.target.value }))} />
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox id="sim-rgpd" checked={f.rgpd} onCheckedChange={v => setF(p => ({ ...p, rgpd: !!v }))} className="mt-0.5 shrink-0" />
                    <label htmlFor="sim-rgpd" style={{ font: `13px/1.5 ${T.sans}`, color: T.ink2, cursor: "pointer" }}>
                      J'accepte que mes réponses soient utilisées pour établir mon résultat et me proposer des offres adaptées.{" "}
                      <Link to="/rgpd-light" target="_blank" className="underline underline-offset-2" style={{ color: T.brand }}>Confidentialité</Link>. Retrait possible à tout moment.
                    </label>
                  </div>
                  <p role="alert" style={{ font: `14px ${T.sans}`, color: "#B42318", minHeight: 20, margin: 0 }}>{error}</p>
                  <button type="submit" className="ax-btn w-full" style={{ height: 54, fontSize: 16 }} disabled={loading}>
                    {loading ? "Analyse de votre profil…" : <>Voir mon résultat <ArrowRight className="h-5 w-5" /></>}
                  </button>
                  <p className="inline-flex items-center gap-1.5 justify-center" style={{ font: `12.5px ${T.sans}`, color: T.muted, margin: 0 }}>
                    <Lock className="h-3.5 w-3.5" /> Vos données ne sont jamais revendues.
                  </p>
                </form>
              </Question>
            )}
          </>
        )}
      </main>
    </SimShell>
  );
}
