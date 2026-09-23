import { useCallback, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";
import { Zap, Lock, Share2, Copy, Check, Download, Star, MessageSquareQuote, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackGA4 } from "@/lib/ga4";
import {
  BAND_LABELS, DISCLAIMER, getResult, sendTestimonial, serverErrorMessage,
  shareLink, shareMessage, usePaidMode, type SimulationResult,
} from "@/lib/simulator";

const cardBg = "hsl(0,0%,100%,0.04)";
const cardBorder = "hsl(0,0%,100%,0.09)";
const textPrimary = "hsl(0,0%,97%)";
const textSecondary = "hsl(215,25%,62%)";
const textMuted = "hsl(215,25%,45%)";
const accentColor = "hsl(189,94%,43%)";
const bleuSouverain = "hsl(221,83%,53%)";
const MIN_TESTIMONIAL = 40;

function Bars({ r, blurred }: { r: SimulationResult | null; blurred?: boolean }) {
  // En mode flouté, on n'a pas le détail (le serveur ne l'envoie pas) : barres factices.
  const rows = r?.criteres ?? [
    { cle: "a", label: "Demande du métier en France", points: 20, max: 30 },
    { cle: "b", label: "Expérience professionnelle", points: 15, max: 25 },
    { cle: "c", label: "Qualification / diplôme", points: 12, max: 20 },
    { cle: "d", label: "Niveau de français", points: 9, max: 15 },
    { cle: "e", label: "Passeport valide", points: 6, max: 10 },
  ];
  return (
    <div className={blurred ? "select-none pointer-events-none" : ""} style={blurred ? { filter: "blur(5px)", opacity: 0.5 } : undefined} aria-hidden={blurred}>
      {rows.map(c => (
        <div key={c.cle} className="mb-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: textSecondary }}>
            <span>{c.label}</span>
            <span className="font-mono" style={{ color: textPrimary }}>{c.points}/{c.max}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(0,0%,100%,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: `${(c.points / c.max) * 100}%`, background: accentColor }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ShareButtons({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = shareLink(code);
  const msg = shareMessage(code);
  const canNative = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async () => {
    trackGA4("sim_share_clicked", { canal: "copy" });
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt?.("Copiez votre lien :", link); }
  };
  const native = async () => {
    trackGA4("sim_share_clicked", { canal: "native" });
    try { await navigator.share({ title: "Test AXIOM", text: msg }); } catch { /* annulé */ }
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
        onClick={() => trackGA4("sim_share_clicked", { canal: "whatsapp" })}
        className="h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white"
        style={{ background: "hsl(142,70%,36%)" }}>
        WhatsApp
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer"
        onClick={() => trackGA4("sim_share_clicked", { canal: "facebook" })}
        className="h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white"
        style={{ background: "hsl(221,70%,50%)" }}>
        Facebook
      </a>
      <button onClick={copy} className="h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold border"
        style={{ borderColor: cardBorder, color: textPrimary, gridColumn: canNative ? undefined : "1 / -1" }}>
        {copied ? <><Check className="h-4 w-4" /> Lien copié</> : <><Copy className="h-4 w-4" /> Copier mon lien</>}
      </button>
      {canNative && (
        <button onClick={native} className="h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold border"
          style={{ borderColor: cardBorder, color: textPrimary }}>
          <Share2 className="h-4 w-4" /> Autres apps
        </button>
      )}
    </div>
  );
}

export default function SimulationResultat() {
  const { token = "" } = useParams();
  const paidMode = usePaidMode();
  const [r, setR] = useState<SimulationResult | null>(null);
  const [error, setError] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [sending, setSending] = useState(false);
  const [testiError, setTestiError] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const wasUnlocked = useRef<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getResult(token);
      setR(data);
      if (wasUnlocked.current === false && data.unlocked) trackGA4("sim_unlocked", { method: data.unlock_method ?? "" });
      wasUnlocked.current = data.unlocked;
    } catch (e) {
      setError(serverErrorMessage(e));
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Rafraîchit le compteur de partages toutes les 20 s tant que ce n'est pas débloqué
  useEffect(() => {
    if (!r || r.unlocked) return;
    const id = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 20000);
    return () => window.clearInterval(id);
  }, [r, load]);

  const submitTestimonial = async () => {
    if (testimonial.trim().length < MIN_TESTIMONIAL) return;
    setSending(true); setTestiError("");
    try {
      const data = await sendTestimonial(token, testimonial.trim());
      setR(data);
      wasUnlocked.current = true;
      trackGA4("sim_unlocked", { method: "temoignage" });
    } catch (e) {
      setTestiError(serverErrorMessage(e));
    } finally { setSending(false); }
  };

  const downloadPdf = async () => {
    if (!r) return;
    const { downloadEligibilityPdf } = await import("@/lib/generateEligibilityPdf");
    downloadEligibilityPdf(r);
    trackGA4("sim_pdf_downloaded", { rome_code: r.metier.rome_code });
  };

  // Uniquement si paid_mode = true (après la bêta)
  const pay = async () => {
    if (!r) return;
    setPayLoading(true);
    trackGA4("paiement_4_99_started", { rome_code: r.metier.rome_code, source: "simulateur" });
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-lead", {
        body: { metier: r.metier.titre, rome_code: r.metier.rome_code, source: "simulateur" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch { setPayLoading(false); }
  };

  const band = r ? BAND_LABELS[r.band] ?? BAND_LABELS.reel : null;
  const C = 2 * Math.PI * 44;
  const pct = r ? Math.min(100, Math.round((r.clicks / r.threshold) * 100)) : 0;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, hsl(222,47%,7%) 0%, hsl(221,83%,14%) 65%, hsl(189,94%,10%) 100%)" }}>
      <Helmet>
        <title>Mon résultat – Test d'éligibilité AXIOM</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="sticky top-0 z-50 border-b" style={{ background: "hsl(222,47%,7%,0.88)", backdropFilter: "blur(14px)", borderColor: "hsl(0,0%,100%,0.07)" }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: accentColor }} />
            <span className="font-bold text-sm tracking-wide" style={{ color: textPrimary }}>AXIOM <span style={{ color: accentColor }}>×</span> ALTIS</span>
          </Link>
          <Badge variant="outline" className="text-[10px] tracking-widest" style={{ borderColor: `${accentColor}66`, color: accentColor }}>BÊTA</Badge>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-12">
        {error && (
          <div className="text-center py-16">
            <p className="mb-4" style={{ color: textPrimary }}>{error}</p>
            <Button asChild style={{ background: bleuSouverain }}><Link to="/leads">Faire le test</Link></Button>
          </div>
        )}

        {!error && !r && <p className="text-center py-20 text-sm" style={{ color: textSecondary }}>Chargement de votre résultat…</p>}

        {r && band && (
          <>
            {/* ── Palier 70 % : toujours visible ── */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="relative h-40 w-40 mx-auto">
                <svg className="h-40 w-40 -rotate-90" viewBox="0 0 100 100" aria-hidden>
                  <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(0,0%,100%,0.07)" strokeWidth="7" />
                  <motion.circle cx="50" cy="50" r="44" fill="none" strokeWidth="7" stroke={band.color} strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${C}` }} animate={{ strokeDasharray: `${(r.score / 100) * C} ${C}` }}
                    transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold" style={{ color: textPrimary }}>{r.score}</span>
                  <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: textMuted }}>Indice / 100</span>
                </div>
              </div>
              <p className="text-lg font-bold mt-3" style={{ color: band.color }}>{band.label}</p>
              <p className="text-sm mt-1" style={{ color: textSecondary }}>
                {r.first_name} · {r.metier.titre} · {r.metier.salaire}
              </p>
              <p className="text-xs mt-0.5" style={{ color: textMuted }}>ROME {r.metier.rome_code} · Demande en France : {r.metier.tension}</p>
              {r.founder && (
                <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold rounded-full px-3 py-1"
                  style={{ color: "hsl(45,93%,60%)", border: "1px solid hsl(45,93%,60%,0.4)" }}>
                  <Star className="h-3 w-3" /> Membre fondateur
                </span>
              )}
            </motion.section>

            {/* ── Palier 100 % ── */}
            {r.unlocked ? (
              <section className="rounded-2xl border p-5 mt-6" style={{ background: "hsl(158,64%,42%,0.06)", borderColor: "hsl(158,64%,42%,0.35)" }}>
                <h2 className="font-bold text-base mb-1" style={{ color: textPrimary }}>Votre rapport complet</h2>
                <p className="text-xs mb-4" style={{ color: textSecondary }}>
                  Débloqué par {r.unlock_method === "temoignage" ? "votre témoignage" : "le partage à 10 personnes"}. Merci !
                </p>
                <Bars r={r} />
                <h3 className="font-semibold text-sm mt-5 mb-2" style={{ color: textPrimary }}>Vos prochaines étapes</h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm" style={{ color: textSecondary }}>
                  {(r.recommandations ?? []).map((t, i) => <li key={i}>{t}</li>)}
                </ol>
                {(r.legalisation || r.niveau_requis) && (
                  <>
                    <h3 className="font-semibold text-sm mt-5 mb-1" style={{ color: textPrimary }}>Reconnaissance du diplôme</h3>
                    {r.niveau_requis && <p className="text-sm" style={{ color: textSecondary }}>Niveau habituellement demandé : {r.niveau_requis}</p>}
                    {r.legalisation && <p className="text-sm" style={{ color: textSecondary }}>Circuit : {r.legalisation}</p>}
                  </>
                )}
                {!!r.competences?.length && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {r.competences.map(c => (
                      <span key={c} className="text-[11px] rounded-full px-2.5 py-1" style={{ background: "hsl(0,0%,100%,0.06)", color: textSecondary }}>{c}</span>
                    ))}
                  </div>
                )}
                <Button onClick={downloadPdf} className="w-full h-12 mt-5 font-bold rounded-xl" style={{ background: bleuSouverain, color: "white" }}>
                  <Download className="h-4 w-4 mr-2" /> Télécharger mon rapport PDF
                </Button>
                <p className="text-xs text-center mt-5" style={{ color: textSecondary }}>Continuez à partager : chaque ami qui fait le test vous aide.</p>
                <ShareButtons code={r.referral_code} />
              </section>
            ) : (
              <section className="rounded-2xl border p-5 mt-6" style={{ background: "hsl(189,94%,43%,0.05)", borderColor: `${accentColor}55` }}>
                <h2 className="font-bold text-base flex items-center gap-2" style={{ color: textPrimary }}>
                  <Lock className="h-4 w-4" style={{ color: accentColor }} /> Débloquez votre rapport complet + PDF
                </h2>
                <p className="text-xs mt-1 mb-3" style={{ color: textSecondary }}>
                  Détail de vos points, conseils personnalisés, étapes de légalisation du diplôme.
                </p>
                <Bars r={null} blurred />

                <div className="flex justify-between text-xs font-mono mt-4 mb-1.5" style={{ color: textPrimary }}>
                  <span>Partage à {r.threshold} personnes</span><span>{r.clicks}/{r.threshold}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(0,0%,100%,0.08)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: accentColor }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs mt-2" style={{ color: textSecondary }}>
                  {r.clicks} personne{r.clicks > 1 ? "s ont" : " a"} ouvert votre lien. Il en faut {Math.max(0, r.threshold - r.clicks)} de plus.
                </p>
                <ShareButtons code={r.referral_code} />

                <div className="flex items-center gap-3 my-5" aria-hidden>
                  <div className="h-px flex-1" style={{ background: cardBorder }} /><span className="text-xs" style={{ color: textMuted }}>ou</span><div className="h-px flex-1" style={{ background: cardBorder }} />
                </div>

                <label htmlFor="sim-temoignage" className="text-sm font-semibold flex items-center gap-2" style={{ color: textPrimary }}>
                  <MessageSquareQuote className="h-4 w-4" style={{ color: accentColor }} /> Laissez un témoignage
                </label>
                <p className="text-xs mt-1 mb-2" style={{ color: textMuted }}>Qu'avez-vous pensé du test ? Qu'est-ce qu'il vous a appris ?</p>
                <Textarea id="sim-temoignage" rows={3} value={testimonial} maxLength={2000}
                  onChange={e => setTestimonial(e.target.value)}
                  className="rounded-xl" style={{ background: "hsl(0,0%,100%,0.05)", borderColor: "hsl(0,0%,100%,0.10)", color: "hsl(0,0%,90%)" }} />
                <div className="flex justify-between text-xs mt-1" style={{ color: textMuted }}>
                  <span role="alert" style={{ color: "hsl(0,80%,70%)" }}>{testiError}</span>
                  <span className="font-mono">{testimonial.trim().length}/{MIN_TESTIMONIAL}</span>
                </div>
                <Button onClick={submitTestimonial} disabled={sending || testimonial.trim().length < MIN_TESTIMONIAL}
                  variant="outline" className="w-full h-11 mt-2 rounded-xl font-semibold"
                  style={{ borderColor: cardBorder, color: textPrimary, background: "transparent" }}>
                  {sending ? "Envoi…" : "Envoyer et débloquer"}
                </Button>
              </section>
            )}

            {paidMode && !r.unlocked && (
              <Button onClick={pay} disabled={payLoading} className="w-full h-12 mt-4 font-bold rounded-xl" style={{ background: bleuSouverain, color: "white" }}>
                {payLoading ? "Redirection…" : "Débloquer directement — 4,99 €"}
              </Button>
            )}

            <p className="text-[11px] leading-relaxed mt-6" style={{ color: textMuted }}>{DISCLAIMER}</p>
            <Button asChild variant="ghost" className="w-full mt-3 text-xs" style={{ color: textMuted }}>
              <Link to="/leads"><RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Refaire le test</Link>
            </Button>
          </>
        )}
      </main>

      <footer className="border-t py-6 px-4 text-center" style={{ borderColor: "hsl(0,0%,100%,0.06)" }}>
        <p className="text-xs" style={{ color: "hsl(215,25%,40%)" }}>
          © 2026 AXIOM — projet en cours d'immatriculation · <Link to="/rgpd-light" className="underline">RGPD</Link>
        </p>
        <CesedaLegalNotice />
      </footer>
    </div>
  );
}
