import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ArrowRight, ArrowLeft, Clock, ShieldCheck, Scale, Info } from "lucide-react";
import { trackGA4 } from "@/lib/ga4";
import { trackFunnel } from "@/lib/trackFunnel";
import {
  captureReferral, fetchMetiers, runSimulation, serverErrorMessage,
  EXPERIENCES, DIPLOMES, NIVEAUX_FRANCAIS, PAYS, tensionRank, type Metier,
} from "@/lib/simulator";
import { SimShell, Stepper, T } from "@/components/simulator/SimShell";

/** Jauge de tension en 4 barres (plus sobre qu'un badge coloré). */
function TensionMeter({ level }: { level: string }) {
  const filled = 4 - Math.min(3, tensionRank(level));
  return (
    <span className="inline-flex items-center gap-2" title={`Demande en France : ${level}`}>
      <span className="inline-flex items-end gap-[3px]" aria-hidden>
        {[0, 1, 2, 3].map(i => (
          <span key={i} style={{ width: 4, height: 6 + i * 3, borderRadius: 1, background: i < filled ? T.brand : T.line }} />
        ))}
      </span>
      <span style={{ font: `500 12px ${T.sans}`, color: T.muted, whiteSpace: "nowrap" }}>{level}</span>
    </span>
  );
}

function Segmented<V extends string | boolean>({ options, value, onChange, label }:
  { options: { value: V; label: string }[]; value: V | ""; onChange: (v: V) => void; label: string }) {
  return (
    <div className="ax-seg" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [metiers, setMetiers] = useState<Metier[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Metier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "", experience: "", diplome: "", niveauFrancais: "",
    passeport: "" as boolean | "", pays: "", emailOrPhone: "", rgpd: false,
  });

  useEffect(() => { captureReferral(location.search); }, [location.search]);

  useEffect(() => {
    fetchMetiers()
      .then(list => {
        setMetiers(list);
        const pre = searchParams.get("metier");
        const found = pre && list.find(m => m.rome_code === pre);
        if (found) { setSelected(found); setStep(2); }
      })
      .catch(() => setLoadError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return metiers;
    return metiers.filter(m => `${m.minefop_title} ${m.rome_title} ${m.rome_code}`.toLowerCase().includes(q));
  }, [metiers, query]);

  const choose = (m: Metier) => {
    setSelected(m); setStep(2); setError("");
    trackGA4("metier_selected", { rome_code: m.rome_code });
    trackGA4("sim_started", { rome_code: m.rome_code });
    window.scrollTo({ top: 0 });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing =
      !form.firstName.trim() ? "Indiquez votre prénom."
      : !form.experience ? "Indiquez vos années d'expérience."
      : !form.diplome ? "Indiquez votre diplôme ou formation."
      : !form.niveauFrancais ? "Indiquez votre niveau de français."
      : form.passeport === "" ? "Indiquez si vous disposez d'un passeport valide."
      : !form.pays ? "Indiquez votre pays de résidence."
      : form.emailOrPhone.trim().length < 6 ? "Indiquez un email ou un numéro WhatsApp valide."
      : !form.rgpd ? "Merci d'accepter la politique de confidentialité pour recevoir votre rapport."
      : "";
    if (missing) { setError(missing); return; }
    setLoading(true); setError("");
    try {
      const result = await runSimulation({
        firstName: form.firstName.trim(), romeCode: selected!.rome_code, experience: form.experience,
        diplome: form.diplome, niveauFrancais: form.niveauFrancais, passeport: form.passeport === true,
        pays: form.pays, emailOrPhone: form.emailOrPhone.trim(), rgpd: form.rgpd,
        utmSource: searchParams.get("utm_source"), utmMedium: searchParams.get("utm_medium"), utmCampaign: searchParams.get("utm_campaign"),
      });
      trackGA4("sim_completed", { rome_code: selected!.rome_code, score: result.score, pays: form.pays });
      trackGA4("rgpd_accepted");
      trackFunnel({ event_name: "lead_form_submitted", rome_code: selected!.rome_code, experience: form.experience, source: "simulateur_beta", metadata: { pays: form.pays } });
      navigate(`/leads/resultat/${result.token}`);
    } catch (err) {
      setError(serverErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <SimShell title="Évaluation d'éligibilité à l'emploi en France — AXIOM">
      {/* En-tête de page */}
      <section style={{ background: T.surface, borderBottom: `1px solid ${T.line}` }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-7 sm:pt-12 sm:pb-10">
          <p className="ax-eyebrow">Évaluation d'éligibilité · Accès bêta gratuit</p>
          <h1 style={{ font: `600 clamp(26px,4.2vw,40px)/1.15 ${T.serif}`, margin: "10px 0 12px", maxWidth: 760 }}>
            Mesurez vos chances d'être recruté en France dans un métier qui recrute.
          </h1>
          <p style={{ font: `16px/1.6 ${T.sans}`, color: T.ink2, maxWidth: 640, margin: 0 }}>
            Une évaluation structurée en cinq critères, fondée sur la nomenclature des métiers ROME et notre
            référentiel des métiers en tension. Vous recevez un rapport lisible, avec les étapes concrètes pour avancer.
          </p>
          <ul className="grid gap-3 sm:grid-cols-3 mt-6" style={{ listStyle: "none", padding: 0, margin: "24px 0 0" }}>
            {[
              [Clock, "2 minutes, sans engagement", "Aucun paiement ni création de compte."],
              [Scale, "Méthode transparente", "5 critères pondérés, publiés dans votre rapport."],
              [ShieldCheck, "Données protégées", "Traitement conforme au RGPD, jamais revendues."],
            ].map(([Icon, title, sub]) => {
              const I = Icon as typeof Clock;
              return (
                <li key={title as string} className="flex gap-3 items-start">
                  <span className="inline-flex items-center justify-center rounded-lg shrink-0" style={{ width: 34, height: 34, background: T.brandSoft }}>
                    <I className="h-4 w-4" style={{ color: T.brand }} />
                  </span>
                  <span>
                    <span style={{ display: "block", font: `600 14px ${T.sans}`, color: T.ink }}>{title as string}</span>
                    <span style={{ display: "block", font: `13px/1.45 ${T.sans}`, color: T.muted }}>{sub as string}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-7 sm:py-10">
        <div className="mb-6"><Stepper step={step} /></div>

        {step === 1 && (
          <section className="ax-card overflow-hidden">
            <div className="p-5 sm:p-6" style={{ borderBottom: `1px solid ${T.line}` }}>
              <h2 style={{ font: `600 20px ${T.sans}`, margin: "0 0 4px" }}>Quel métier visez-vous en France ?</h2>
              <p className="ax-help" style={{ marginBottom: 14 }}>Les métiers sont classés du plus demandé au moins demandé par les employeurs en France.</p>
              <label htmlFor="sim-search" className="sr-only">Rechercher un métier</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: T.faint }} />
                <input id="sim-search" className="ax-input" style={{ paddingLeft: 40 }} value={query}
                  onChange={e => setQuery(e.target.value)} placeholder="Rechercher : maçon, aide-soignant, cuisinier, code ROME…" />
              </div>
            </div>

            {loadError && <p className="p-6" style={{ color: "#B42318", font: `14px ${T.sans}` }}>La liste des métiers n'a pas pu être chargée. Vérifiez votre connexion puis rechargez la page.</p>}
            {!loadError && !metiers.length && <p className="p-6" style={{ color: T.muted, font: `14px ${T.sans}` }}>Chargement des métiers…</p>}

            <div role="list">
              {filtered.map(m => (
                <button key={m.rome_code} role="listitem" className="ax-row" onClick={() => choose(m)}>
                  <span className="min-w-0">
                    <span style={{ display: "block", font: `600 15px ${T.sans}`, color: T.ink }}>{m.minefop_title}</span>
                    <span className="block truncate" style={{ font: `13px ${T.sans}`, color: T.muted }}>
                      <span style={{ fontFamily: T.mono }}>{m.rome_code}</span> · {m.rome_title}
                    </span>
                  </span>
                  <span className="flex items-center gap-4 sm:gap-8">
                    <span className="hidden sm:inline"><TensionMeter level={m.niveau_tension} /></span>
                    <span className="hidden md:inline ax-num" style={{ font: `500 13px ${T.sans}`, color: T.ink2, minWidth: 96, textAlign: "right" }}>{m.salaire_moyen_france}</span>
                    <ArrowRight className="h-4 w-4" style={{ color: T.faint }} />
                  </span>
                </button>
              ))}
              {metiers.length > 0 && !filtered.length && (
                <p className="p-6" style={{ color: T.muted, font: `14px ${T.sans}` }}>Aucun métier ne correspond à « {query} ».</p>
              )}
            </div>
          </section>
        )}

        {step === 2 && selected && (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
            <form onSubmit={submit} noValidate className="ax-card p-5 sm:p-7">
              <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 mb-5"
                style={{ font: `500 13px ${T.sans}`, color: T.brand, background: "none", border: 0, cursor: "pointer", padding: 0 }}>
                <ArrowLeft className="h-4 w-4" /> Changer de métier
              </button>
              <h2 style={{ font: `600 20px ${T.sans}`, margin: "0 0 4px" }}>Votre profil</h2>
              <p className="ax-help" style={{ marginBottom: 22 }}>Répondez honnêtement : l'évaluation n'a de valeur que si elle reflète votre situation réelle.</p>

              <div className="grid gap-6">
                <div>
                  <label className="ax-label" htmlFor="sim-prenom">Prénom</label>
                  <input id="sim-prenom" className="ax-input" autoComplete="given-name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <span className="ax-label">Expérience dans ce métier</span>
                  <p className="ax-help">Expérience professionnelle réelle, stages et apprentissage compris.</p>
                  <Segmented label="Expérience" options={EXPERIENCES} value={form.experience} onChange={v => setForm(f => ({ ...f, experience: v }))} />
                </div>
                <div>
                  <span className="ax-label">Diplôme ou formation le plus élevé</span>
                  <Segmented label="Diplôme" options={DIPLOMES} value={form.diplome} onChange={v => setForm(f => ({ ...f, diplome: v }))} />
                </div>
                <div>
                  <span className="ax-label">Niveau de français</span>
                  <p className="ax-help">Selon le Cadre européen (CECR). Scolarisé en français : choisissez « Langue maternelle ».</p>
                  <Segmented label="Français" options={NIVEAUX_FRANCAIS} value={form.niveauFrancais} onChange={v => setForm(f => ({ ...f, niveauFrancais: v }))} />
                </div>
                <div>
                  <span className="ax-label">Passeport en cours de validité</span>
                  <Segmented<boolean> label="Passeport" options={[{ value: true, label: "Oui" }, { value: false, label: "Non" }]} value={form.passeport} onChange={v => setForm(f => ({ ...f, passeport: v }))} />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="ax-label" htmlFor="sim-pays">Pays de résidence</label>
                    <select id="sim-pays" className="ax-input" value={form.pays} onChange={e => setForm(f => ({ ...f, pays: e.target.value }))}>
                      <option value="">Sélectionnez…</option>
                      {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="ax-label" htmlFor="sim-contact">Email ou WhatsApp</label>
                    <input id="sim-contact" className="ax-input" value={form.emailOrPhone} placeholder="nom@email.com ou +237…" onChange={e => setForm(f => ({ ...f, emailOrPhone: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
                  <Checkbox id="sim-rgpd" checked={form.rgpd} onCheckedChange={v => setForm(f => ({ ...f, rgpd: !!v }))} className="mt-0.5 shrink-0" />
                  <label htmlFor="sim-rgpd" style={{ font: `13px/1.5 ${T.sans}`, color: T.ink2, cursor: "pointer" }}>
                    J'accepte que mes réponses soient traitées par AXIOM pour établir mon rapport et me proposer des offres
                    correspondant à mon profil. <Link to="/rgpd-light" target="_blank" className="underline underline-offset-2" style={{ color: T.brand }}>Politique de confidentialité</Link>. Retrait possible à tout moment.
                  </label>
                </div>
              </div>

              <p role="alert" style={{ font: `14px ${T.sans}`, color: "#B42318", minHeight: 22, margin: "16px 0 4px" }}>{error}</p>
              <button type="submit" className="ax-btn w-full sm:w-auto" disabled={loading}>
                {loading ? "Analyse en cours…" : <>Obtenir mon rapport <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <aside className="ax-card p-5 lg:sticky lg:top-6">
              <p className="ax-eyebrow">Métier évalué</p>
              <p style={{ font: `600 17px ${T.sans}`, margin: "8px 0 2px" }}>{selected.minefop_title}</p>
              <p style={{ font: `13px ${T.sans}`, color: T.muted, margin: 0 }}><span style={{ fontFamily: T.mono }}>{selected.rome_code}</span> · {selected.rome_title}</p>
              <dl className="grid gap-3 mt-5" style={{ font: `13px ${T.sans}` }}>
                <div className="flex justify-between gap-3"><dt style={{ color: T.muted }}>Demande en France</dt><dd><TensionMeter level={selected.niveau_tension} /></dd></div>
                <div className="flex justify-between gap-3"><dt style={{ color: T.muted }}>Salaire moyen</dt><dd className="ax-num" style={{ fontWeight: 600 }}>{selected.salaire_moyen_france}</dd></div>
              </dl>
              <div className="flex gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${T.line}`, font: `12px/1.5 ${T.sans}`, color: T.muted }}>
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Votre indice est calculé par nos serveurs selon une grille fixe, identique pour tous les candidats.</span>
              </div>
            </aside>
          </div>
        )}
      </main>
    </SimShell>
  );
}
