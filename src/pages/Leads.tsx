import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { trackGA4 } from "@/lib/ga4";
import { trackFunnel } from "@/lib/trackFunnel";
import { getAvatarForTalent } from "@/lib/metierAvatars";
import {
  captureReferral, fetchMetiers, runSimulation, serverErrorMessage,
  EXPERIENCES, DIPLOMES, NIVEAUX_FRANCAIS, PAYS, type Metier,
} from "@/lib/simulator";

/* ─── Styles partagés (identité AXIOM existante) ───────────────── */
const cardBg = "hsl(0,0%,100%,0.04)";
const cardBorder = "hsl(0,0%,100%,0.09)";
const textPrimary = "hsl(0,0%,97%)";
const textSecondary = "hsl(215,25%,62%)";
const textMuted = "hsl(215,25%,45%)";
const accentColor = "hsl(189,94%,43%)";
const bleuSouverain = "hsl(221,83%,53%)";
const fieldStyle = { background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" };

const TENSION_BADGE: Record<string, string> = {
  "Très haute": "hsl(0,70%,50%,0.85)",
  "Haute": "hsl(35,90%,45%,0.85)",
  "Moyenne-haute": "hsl(189,80%,35%,0.85)",
  "Croissante": "hsl(189,80%,35%,0.85)",
  "Moyenne": "hsl(215,20%,35%,0.85)",
};

function Pills<T extends string | boolean>({
  options, value, onChange, name,
}: { options: { value: T; label: string }[]; value: T | ""; onChange: (v: T) => void; name: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map(o => {
        const active = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="min-h-[42px] rounded-xl px-3.5 text-sm font-semibold border transition-colors"
            style={active
              ? { background: accentColor, borderColor: accentColor, color: "hsl(195,80%,10%)" }
              : { background: "hsl(0,0%,100%,0.04)", borderColor: cardBorder, color: textPrimary }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [metiers, setMetiers] = useState<Metier[]>([]);
  const [metiersError, setMetiersError] = useState(false);
  const [selected, setSelected] = useState<Metier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "", experience: "", diplome: "", niveauFrancais: "",
    passeport: "" as boolean | "", pays: "", emailOrPhone: "", rgpd: false,
  });

  // Lien parrain (?ref=CODE)
  useEffect(() => { captureReferral(location.search); }, [location.search]);

  // Métiers depuis la base (triés par tension)
  useEffect(() => {
    fetchMetiers()
      .then(list => {
        setMetiers(list);
        const pre = searchParams.get("metier");
        const found = pre && list.find(m => m.rome_code === pre);
        if (found) { setSelected(found); setStep(2); }
      })
      .catch(() => setMetiersError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (m: Metier) => {
    setSelected(m);
    setStep(2);
    setError("");
    trackGA4("metier_selected", { rome_code: m.rome_code });
    trackGA4("sim_started", { rome_code: m.rome_code });
    window.scrollTo({ top: 0 });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing =
      !form.firstName.trim() ? "Indiquez votre prénom."
      : !form.experience ? "Choisissez vos années d'expérience."
      : !form.diplome ? "Choisissez votre diplôme."
      : !form.niveauFrancais ? "Choisissez votre niveau de français."
      : form.passeport === "" ? "Indiquez si vous avez un passeport valide."
      : !form.pays ? "Choisissez votre pays."
      : form.emailOrPhone.trim().length < 6 ? "Indiquez un email ou un numéro WhatsApp valide."
      : !form.rgpd ? "Cochez la case RGPD pour continuer."
      : "";
    if (missing) { setError(missing); return; }

    setLoading(true);
    setError("");
    try {
      const result = await runSimulation({
        firstName: form.firstName.trim(),
        romeCode: selected!.rome_code,
        experience: form.experience,
        diplome: form.diplome,
        niveauFrancais: form.niveauFrancais,
        passeport: form.passeport === true,
        pays: form.pays,
        emailOrPhone: form.emailOrPhone.trim(),
        rgpd: form.rgpd,
        utmSource: searchParams.get("utm_source"),
        utmMedium: searchParams.get("utm_medium"),
        utmCampaign: searchParams.get("utm_campaign"),
      });
      trackGA4("sim_completed", { rome_code: selected!.rome_code, score: result.score, pays: form.pays });
      trackGA4("rgpd_accepted");
      trackFunnel({
        event_name: "lead_form_submitted",
        rome_code: selected!.rome_code,
        experience: form.experience,
        source: "simulateur_beta",
        metadata: { pays: form.pays },
      });
      navigate(`/leads/resultat/${result.token}`);
    } catch (err) {
      setError(serverErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, hsl(222,47%,7%) 0%, hsl(221,83%,14%) 60%, hsl(189,94%,10%) 100%)" }}>
      <Helmet>
        <title>Test d'éligibilité gratuit – AXIOM | Travailler en France</title>
        <meta name="description" content="Testez gratuitement vos chances de travailler en France dans les métiers qui recrutent. 2 minutes, résultat immédiat." />
        <link rel="canonical" href="https://axiom-talents.com/leads" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "hsl(222,47%,7%,0.88)", backdropFilter: "blur(14px)", borderColor: "hsl(0,0%,100%,0.07)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}18` }}>
              <Zap className="h-4 w-4" style={{ color: accentColor }} />
            </div>
            <span className="font-bold text-sm tracking-wide" style={{ color: textPrimary }}>
              AXIOM <span style={{ color: accentColor }}>×</span> ALTIS
            </span>
          </Link>
          <Badge variant="outline" className="text-[10px] tracking-widest" style={{ borderColor: `${accentColor}66`, color: accentColor }}>BÊTA</Badge>
        </div>
      </header>

      {/* Progression */}
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-1">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="h-1.5 flex-1 rounded-full transition-all duration-500"
              style={{ background: step >= s ? accentColor : "hsl(0,0%,100%,0.08)" }} />
          ))}
        </div>
        <p className="text-xs text-center" style={{ color: textMuted }}>
          Étape {step}/3 · {step === 1 ? "Choisissez votre métier" : "Votre profil"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }} className="max-w-5xl mx-auto px-4 pb-16">
            <div className="text-center mb-6 mt-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: textPrimary }}>
                Sais-tu que tu peux <span style={{ color: accentColor }}>travailler en France</span> ?
              </h1>
              <p className="text-sm max-w-lg mx-auto" style={{ color: textSecondary }}>
                Choisis ton métier. La liste est triée du plus demandé au moins demandé en France.
              </p>
            </div>

            {metiersError && (
              <p className="text-center text-sm mb-4" style={{ color: "hsl(0,80%,70%)" }}>
                Impossible de charger les métiers. Vérifiez votre connexion puis rechargez la page.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(metiers.length ? metiers : []).map((m, i) => (
                <motion.button
                  key={m.rome_code}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 10) * 0.03 }}
                  onClick={() => choose(m)}
                  className="group text-left rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: cardBg, borderColor: cardBorder }}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img src={getAvatarForTalent(m.rome_code, i)} alt={m.minefop_title} loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <p className="text-sm font-bold text-white">{m.minefop_title}</p>
                      <p className="text-[11px] text-white/70 truncate">ROME {m.rome_code} · {m.rome_title}</p>
                    </div>
                    <Badge className="absolute top-2 right-2 text-[9px] font-bold border-none text-white"
                      style={{ background: TENSION_BADGE[m.niveau_tension] ?? TENSION_BADGE["Moyenne"] }}>
                      {m.niveau_tension}
                    </Badge>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <p className="text-xs font-medium" style={{ color: accentColor }}>{m.salaire_moyen_france} · France</p>
                    <ArrowRight className="h-4 w-4 opacity-60 group-hover:opacity-100" style={{ color: accentColor }} />
                  </div>
                </motion.button>
              ))}
            </div>

            <p className="text-center text-xs mt-6" style={{ color: textMuted }}>
              Évaluation 100 % gratuite · Sans engagement · Résultat immédiat
            </p>
          </motion.div>
        )}

        {step === 2 && selected && (
          <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto px-4 pb-16 mt-3">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs mb-4 hover:underline" style={{ color: textSecondary }}>
              <ArrowLeft className="h-3.5 w-3.5" /> Changer de métier
            </button>

            <div className="flex items-center gap-3 rounded-xl p-3 mb-5 border" style={{ background: cardBg, borderColor: `${accentColor}33` }}>
              <img src={getAvatarForTalent(selected.rome_code, 0)} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <div>
                <p className="text-sm font-bold" style={{ color: textPrimary }}>{selected.minefop_title}</p>
                <p className="text-[11px]" style={{ color: accentColor }}>ROME {selected.rome_code} · {selected.niveau_tension} · {selected.salaire_moyen_france}</p>
              </div>
            </div>

            <form onSubmit={submit} noValidate className="rounded-2xl p-5 sm:p-7 border space-y-5" style={{ background: cardBg, borderColor: cardBorder }}>
              <div className="space-y-1.5">
                <label htmlFor="sim-prenom" className="text-sm font-medium" style={{ color: textSecondary }}>Prénom</label>
                <Input id="sim-prenom" autoComplete="given-name" value={form.firstName} placeholder="Jean"
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="h-11 rounded-xl" style={fieldStyle} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium" style={{ color: textSecondary }}>Années d'expérience dans ce métier</p>
                <Pills name="Expérience" options={EXPERIENCES} value={form.experience} onChange={v => setForm(f => ({ ...f, experience: v }))} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium" style={{ color: textSecondary }}>Diplôme ou formation</p>
                <Pills name="Diplôme" options={DIPLOMES} value={form.diplome} onChange={v => setForm(f => ({ ...f, diplome: v }))} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium" style={{ color: textSecondary }}>Niveau de français</p>
                <p className="text-xs -mt-1" style={{ color: textMuted }}>Scolarisé en français ? Choisissez « Langue maternelle ».</p>
                <Pills name="Français" options={NIVEAUX_FRANCAIS} value={form.niveauFrancais} onChange={v => setForm(f => ({ ...f, niveauFrancais: v }))} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium" style={{ color: textSecondary }}>Passeport valide</p>
                <Pills<boolean> name="Passeport" options={[{ value: true, label: "Oui" }, { value: false, label: "Non" }]}
                  value={form.passeport} onChange={v => setForm(f => ({ ...f, passeport: v }))} />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sim-pays" className="text-sm font-medium" style={{ color: textSecondary }}>Pays de résidence</label>
                <Select value={form.pays} onValueChange={v => setForm(f => ({ ...f, pays: v }))}>
                  <SelectTrigger id="sim-pays" className="h-11 rounded-xl" style={fieldStyle}>
                    <SelectValue placeholder="Choisissez votre pays…" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sim-contact" className="text-sm font-medium" style={{ color: textSecondary }}>Email ou WhatsApp</label>
                <Input id="sim-contact" value={form.emailOrPhone} placeholder="exemple@email.com ou +237 6XX XXX XXX"
                  onChange={e => setForm(f => ({ ...f, emailOrPhone: e.target.value }))} className="h-11 rounded-xl" style={fieldStyle} />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox id="sim-rgpd" checked={form.rgpd} onCheckedChange={v => setForm(f => ({ ...f, rgpd: !!v }))} className="mt-0.5 shrink-0" />
                <label htmlFor="sim-rgpd" className="text-xs leading-relaxed cursor-pointer" style={{ color: textMuted }}>
                  J'accepte la <Link to="/rgpd-light" target="_blank" className="underline" style={{ color: accentColor }}>politique RGPD</Link> d'AXIOM.
                  Données utilisées pour la mise en relation professionnelle.
                </label>
              </div>

              <p role="alert" className="text-sm min-h-[20px]" style={{ color: "hsl(0,80%,70%)" }}>{error}</p>

              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold rounded-xl" style={{ background: bleuSouverain, color: "white" }}>
                {loading ? "Analyse de votre profil…" : (
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Voir mon résultat gratuit <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t py-6 px-4 text-center" style={{ borderColor: "hsl(0,0%,100%,0.06)" }}>
        <p className="text-xs" style={{ color: "hsl(215,25%,40%)" }}>
          © 2026 AXIOM — projet en cours d'immatriculation ·{" "}
          <Link to="/rgpd-light" className="underline">RGPD</Link> · rgpd@axiom-talents.com
        </p>
        <CesedaLegalNotice />
      </footer>
    </div>
  );
}
