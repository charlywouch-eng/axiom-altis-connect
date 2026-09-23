import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Lock, Copy, Check, Download, Share2, FileText, RotateCcw, CheckCircle2, Users, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackGA4 } from "@/lib/ga4";
import {
  BAND_LABELS, BAND_SCALE, DISCLAIMER, METHODOLOGY, getResult, reportReference, sendTestimonial,
  serverErrorMessage, shareLink, shareMessage, usePaidMode, type SimulationResult,
} from "@/lib/simulator";
import { SimShell, Stepper, T } from "@/components/simulator/SimShell";

const MIN_TESTIMONIAL = 40;

/** Échelle 0–100 découpée en 4 paliers, avec un repère sur le score. */
function ScoreScale({ score }: { score: number }) {
  return (
    <div>
      <div className="relative" style={{ paddingTop: 30 }}>
        <div className="absolute" style={{ left: `calc(${score}% - 1px)`, top: 0, transform: "translateX(-50%)" }}>
          <span className="ax-num" style={{ display: "block", font: `600 12px ${T.sans}`, color: T.ink, background: "#fff", border: `1px solid ${T.lineStrong}`, borderRadius: 6, padding: "2px 7px" }}>{score}</span>
        </div>
        <div className="flex gap-[3px]" style={{ height: 10 }}>
          {BAND_SCALE.map(b => (
            <span key={b.key} style={{ flex: b.to - b.from + 1, background: BAND_LABELS[b.key].color, opacity: score >= b.from && score <= b.to ? 1 : 0.18, borderRadius: 2 }} />
          ))}
        </div>
        <span className="absolute" style={{ left: `${score}%`, top: 24, width: 2, height: 22, background: T.ink, transform: "translateX(-1px)" }} />
      </div>
      <div className="flex gap-[3px] mt-2">
        {BAND_SCALE.map(b => (
          <span key={b.key} style={{ flex: b.to - b.from + 1, font: `11px/1.3 ${T.sans}`, color: T.muted }}>
            <span className="ax-num">{b.from}–{b.to}</span><span className="hidden sm:block">{BAND_LABELS[b.key].label.replace("Préparation ", "")}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ShareActions({ code, onShare }: { code: string; onShare: (canal: string) => void }) {
  const [copied, setCopied] = useState(false);
  const link = shareLink(code);
  const msg = shareMessage(code);
  const canNative = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const copy = async () => {
    onShare("copy");
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sélection manuelle possible */ }
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <a className="ax-btn" style={{ background: "#128C4A" }} href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" onClick={() => onShare("whatsapp")}>Partager sur WhatsApp</a>
      <a className="ax-btn" style={{ background: "#1B4F9C" }} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer" onClick={() => onShare("facebook")}>Partager sur Facebook</a>
      <button type="button" className="ax-btn ax-btn-ghost" onClick={copy}>{copied ? <><Check className="h-4 w-4" /> Lien copié</> : <><Copy className="h-4 w-4" /> Copier le lien</>}</button>
      {canNative && <button type="button" className="ax-btn ax-btn-ghost" onClick={async () => { onShare("native"); try { await navigator.share({ title: "Évaluation AXIOM", text: msg }); } catch { /* annulé */ } }}><Share2 className="h-4 w-4" /> Autres applications</button>}
      <p className="sm:col-span-2" style={{ font: `13px/1.5 ${T.sans}`, color: T.muted, margin: "4px 0 0" }}>
        Votre code de recommandation : <strong style={{ fontFamily: T.mono, color: T.ink, letterSpacing: ".06em" }}>{code}</strong>. Il est intégré au lien que vous partagez : chaque proche qui l'ouvre est compté automatiquement.
      </p>
    </div>
  );
}

export default function SimulationResultat() {
  const { token = "" } = useParams();
  const paidMode = usePaidMode();
  const [r, setR] = useState<SimulationResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"share" | "review">("share");
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
    } catch (e) { setError(serverErrorMessage(e)); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
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
      setR(data); wasUnlocked.current = true;
      trackGA4("sim_unlocked", { method: "temoignage" });
    } catch (e) { setTestiError(serverErrorMessage(e)); } finally { setSending(false); }
  };

  const downloadPdf = async () => {
    if (!r) return;
    const { downloadEligibilityPdf } = await import("@/lib/generateEligibilityPdf");
    downloadEligibilityPdf(r);
    trackGA4("sim_pdf_downloaded", { rome_code: r.metier.rome_code });
  };

  const pay = async () => {
    if (!r) return;
    setPayLoading(true);
    trackGA4("paiement_4_99_started", { rome_code: r.metier.rome_code, source: "simulateur" });
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-lead", { body: { metier: r.metier.titre, rome_code: r.metier.rome_code, source: "simulateur" } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch { setPayLoading(false); }
  };

  const band = r ? BAND_LABELS[r.band] ?? BAND_LABELS.reel : null;
  const date = r ? new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
  const points = (cle: string) => r?.criteres?.find(c => c.cle === cle)?.points;
  const remaining = r ? Math.max(0, r.threshold - r.clicks) : 0;

  return (
    <SimShell title="Votre rapport d'évaluation — AXIOM">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-7 sm:py-10">
        <div className="mb-6"><Stepper step={3} /></div>

        {error && (
          <div className="ax-card p-8 text-center">
            <p style={{ font: `15px ${T.sans}`, marginBottom: 16 }}>{error}</p>
            <Link to="/leads" className="ax-btn">Commencer une évaluation</Link>
          </div>
        )}
        {!error && !r && <p style={{ font: `14px ${T.sans}`, color: T.muted }}>Chargement de votre rapport…</p>}

        {r && band && (
          <div className="grid gap-5">
            {/* ── En-tête du rapport ── */}
            <section className="ax-card overflow-hidden">
              <div className="px-5 sm:px-7 pt-6 pb-5" style={{ borderBottom: `1px solid ${T.line}` }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="ax-eyebrow">Rapport d'évaluation</p>
                    <h1 style={{ font: `600 clamp(22px,3.4vw,30px)/1.2 ${T.serif}`, margin: "8px 0 0" }}>Éligibilité à l'emploi en France</h1>
                  </div>
                  {r.founder && (
                    <span style={{ font: `600 12px ${T.sans}`, color: T.brand, background: T.brandSoft, borderRadius: 999, padding: "6px 12px" }}>Membre fondateur · Cohorte bêta 2026</span>
                  )}
                </div>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mt-6" style={{ font: `14px ${T.sans}` }}>
                  {[
                    ["Candidat", r.first_name],
                    ["Métier évalué", `${r.metier.titre}`],
                    ["Pays de résidence", r.pays],
                    ["Date", date],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt style={{ font: `12px ${T.sans}`, color: T.muted, marginBottom: 2 }}>{k}</dt>
                      <dd style={{ fontWeight: 600, margin: 0 }}>{v}</dd>
                    </div>
                  ))}
                </dl>
                <p style={{ font: `12px ${T.sans}`, color: T.muted, margin: "10px 0 0" }}>
                  Code ROME <span style={{ fontFamily: T.mono }}>{r.metier.rome_code}</span> · Réf. <span style={{ fontFamily: T.mono }}>{reportReference(r)}</span>
                </p>
              </div>

              {/* ── Synthèse ── */}
              <div className="px-5 sm:px-7 py-6 grid gap-6 md:grid-cols-[220px_1fr] items-start">
                <div>
                  <p className="ax-eyebrow">Indice de préparation</p>
                  <p className="ax-num" style={{ margin: "6px 0 0", lineHeight: 1 }}>
                    <span style={{ font: `600 64px/1 ${T.serif}`, color: T.ink }}>{r.score}</span>
                    <span style={{ font: `500 20px ${T.sans}`, color: T.faint }}> / 100</span>
                  </p>
                  <span className="inline-block mt-3" style={{ font: `600 13px ${T.sans}`, color: band.color, background: band.soft, borderRadius: 6, padding: "5px 10px" }}>{band.label}</span>
                </div>
                <div>
                  <p style={{ font: `16px/1.6 ${T.sans}`, color: T.ink2, margin: "0 0 18px", maxWidth: 620 }}>{band.summary}</p>
                  <ScoreScale score={r.score} />
                </div>
              </div>
            </section>

            {/* ── Grille d'évaluation (méthode publique, points si débloqué) ── */}
            <section className="ax-card overflow-hidden">
              <div className="px-5 sm:px-7 pt-6 pb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 style={{ font: `600 18px ${T.sans}`, margin: 0 }}>Grille d'évaluation</h2>
                <span style={{ font: `12px ${T.sans}`, color: T.muted }}>Identique pour tous les candidats</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ font: `14px ${T.sans}`, borderCollapse: "collapse", minWidth: 520 }}>
                  <thead>
                    <tr style={{ background: T.bg, color: T.muted, font: `600 12px ${T.sans}`, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      <th className="text-left px-5 sm:px-7 py-2.5">Critère</th>
                      <th className="text-right px-3 py-2.5">Pondération</th>
                      <th className="text-right px-5 sm:px-7 py-2.5">Vos points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {METHODOLOGY.map(c => {
                      const p = points(c.cle);
                      return (
                        <tr key={c.cle} style={{ borderTop: `1px solid ${T.line}` }}>
                          <td className="px-5 sm:px-7 py-3.5">
                            <span style={{ display: "block", fontWeight: 600 }}>{c.label}</span>
                            <span style={{ display: "block", font: `12.5px ${T.sans}`, color: T.muted }}>{c.detail}</span>
                          </td>
                          <td className="px-3 py-3.5 text-right ax-num" style={{ color: T.ink2 }}>{c.max}</td>
                          <td className="px-5 sm:px-7 py-3.5 text-right">
                            {p === undefined
                              ? <span className="inline-flex items-center gap-1.5" style={{ color: T.faint, font: `12.5px ${T.sans}` }}><Lock className="h-3.5 w-3.5" /> Rapport complet</span>
                              : <span className="inline-flex items-center gap-3 justify-end">
                                  <span style={{ width: 64, height: 6, background: T.line, borderRadius: 3, overflow: "hidden" }} className="hidden sm:block">
                                    <span style={{ display: "block", height: "100%", width: `${(p / c.max) * 100}%`, background: T.brand }} />
                                  </span>
                                  <span className="ax-num" style={{ fontWeight: 600 }}>{p}<span style={{ color: T.faint, fontWeight: 400 }}> / {c.max}</span></span>
                                </span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Rapport complet ou accès bêta ── */}
            {r.unlocked ? (
              <section className="ax-card p-5 sm:p-7 grid gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 style={{ font: `600 18px ${T.sans}`, margin: 0 }}>Plan d'action recommandé</h2>
                  <button type="button" className="ax-btn" onClick={downloadPdf}><Download className="h-4 w-4" /> Télécharger le rapport (PDF)</button>
                </div>
                <ol className="grid gap-3" style={{ listStyle: "none", padding: 0, margin: 0, counterReset: "step" }}>
                  {(r.recommandations ?? []).map((t, i) => (
                    <li key={i} className="flex gap-3" style={{ font: `15px/1.55 ${T.sans}`, color: T.ink2 }}>
                      <span className="ax-num inline-flex items-center justify-center shrink-0 rounded-full" style={{ width: 26, height: 26, background: T.brandSoft, color: T.brand, font: `600 13px ${T.sans}` }}>{i + 1}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
                {(r.legalisation || r.niveau_requis) && (
                  <div className="grid gap-4 sm:grid-cols-2 pt-5" style={{ borderTop: `1px solid ${T.line}` }}>
                    {r.niveau_requis && <div><p className="ax-eyebrow">Qualification habituellement demandée</p><p style={{ font: `15px ${T.sans}`, margin: "6px 0 0" }}>{r.niveau_requis}</p></div>}
                    {r.legalisation && <div><p className="ax-eyebrow">Reconnaissance du diplôme</p><p style={{ font: `15px ${T.sans}`, margin: "6px 0 0" }}>{r.legalisation}</p></div>}
                  </div>
                )}
                {!!r.competences?.length && (
                  <div>
                    <p className="ax-eyebrow" style={{ marginBottom: 8 }}>Compétences attendues par les employeurs</p>
                    <div className="flex flex-wrap gap-2">{r.competences.map(c => <span key={c} style={{ font: `13px ${T.sans}`, border: `1px solid ${T.line}`, borderRadius: 6, padding: "4px 10px", color: T.ink2 }}>{c}</span>)}</div>
                  </div>
                )}
                <div className="pt-5" style={{ borderTop: `1px solid ${T.line}` }}>
                  <p style={{ font: `600 14px ${T.sans}`, margin: "0 0 10px" }}>Recommandez l'évaluation à vos proches</p>
                  <ShareActions code={r.referral_code} onShare={canal => trackGA4("sim_share_clicked", { canal })} />
                </div>
              </section>
            ) : (
              <section className="ax-card overflow-hidden">
                <div className="px-5 sm:px-7 pt-6 pb-5 grid gap-5 md:grid-cols-[1fr_260px]" style={{ borderBottom: `1px solid ${T.line}` }}>
                  <div>
                    <p className="ax-eyebrow">Rapport complet · Accès bêta</p>
                    <h2 style={{ font: `600 18px ${T.sans}`, margin: "6px 0 8px" }}>Débloquez gratuitement votre rapport détaillé</h2>
                    <p style={{ font: `14px/1.6 ${T.sans}`, color: T.ink2, margin: 0 }}>
                      Pendant la phase bêta, le rapport complet est offert aux candidats qui nous aident à faire connaître l'évaluation.
                    </p>
                  </div>
                  <ul className="grid gap-2" style={{ listStyle: "none", padding: 0, margin: 0, font: `13.5px ${T.sans}`, color: T.ink2 }}>
                    {["Vos points sur chaque critère", "Votre plan d'action personnalisé", "Le circuit de reconnaissance du diplôme", "Le rapport en PDF"].map(i => (
                      <li key={i} className="flex gap-2 items-start"><FileText className="h-4 w-4 shrink-0 mt-0.5" style={{ color: T.brand }} />{i}</li>
                    ))}
                  </ul>
                </div>

                <div role="tablist" className="flex" style={{ borderBottom: `1px solid ${T.line}` }}>
                  {([["share", Users, "Recommander à 10 personnes"], ["review", MessageSquare, "Donner votre avis"]] as const).map(([k, Icon, label]) => (
                    <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className="flex-1 inline-flex items-center justify-center gap-2 py-3.5"
                      style={{ font: `600 14px ${T.sans}`, color: tab === k ? T.brand : T.muted, background: "none", border: 0, borderBottom: `2px solid ${tab === k ? T.brand : "transparent"}`, cursor: "pointer" }}>
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  ))}
                </div>

                <div className="px-5 sm:px-7 py-6">
                  {tab === "share" ? (
                    <div className="grid gap-4">
                      <div>
                        <div className="flex justify-between" style={{ font: `14px ${T.sans}`, marginBottom: 8 }}>
                          <span style={{ fontWeight: 600 }}>Personnes ayant ouvert votre lien</span>
                          <span className="ax-num" style={{ fontWeight: 600 }}>{r.clicks} / {r.threshold}</span>
                        </div>
                        <div style={{ height: 8, background: T.line, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(100, (r.clicks / r.threshold) * 100)}%`, background: T.brand, transition: "width .6s" }} />
                        </div>
                        <p style={{ font: `13px ${T.sans}`, color: T.muted, margin: "8px 0 0" }}>
                          {remaining > 0 ? `Encore ${remaining} ${remaining > 1 ? "personnes" : "personne"}. Chaque visiteur n'est compté qu'une fois ; cette page se met à jour automatiquement.` : "Seuil atteint : votre rapport se débloque."}
                        </p>
                      </div>
                      <ShareActions code={r.referral_code} onShare={canal => trackGA4("sim_share_clicked", { canal })} />
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <label className="ax-label" htmlFor="sim-temoignage">Qu'avez-vous pensé de cette évaluation ?</label>
                      <p className="ax-help" style={{ margin: 0 }}>Votre avis nous aide à améliorer le service. Il peut être publié de façon anonyme, avec votre prénom et votre pays uniquement.</p>
                      <textarea id="sim-temoignage" rows={4} maxLength={2000} className="ax-input" style={{ height: "auto", padding: 12, lineHeight: 1.5 }}
                        value={testimonial} onChange={e => setTestimonial(e.target.value)} />
                      <div className="flex justify-between items-center gap-3 flex-wrap">
                        <span role="alert" style={{ font: `13px ${T.sans}`, color: "#B42318" }}>{testiError}</span>
                        <span className="ax-num" style={{ font: `12px ${T.sans}`, color: testimonial.trim().length >= MIN_TESTIMONIAL ? "#0F7B5F" : T.muted }}>
                          {testimonial.trim().length >= MIN_TESTIMONIAL ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Longueur suffisante</span> : `${testimonial.trim().length} / ${MIN_TESTIMONIAL} caractères minimum`}
                        </span>
                      </div>
                      <button type="button" className="ax-btn w-full sm:w-auto" disabled={sending || testimonial.trim().length < MIN_TESTIMONIAL} onClick={submitTestimonial}>
                        {sending ? "Envoi…" : "Envoyer mon avis et débloquer le rapport"}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {paidMode && !r.unlocked && (
              <button type="button" className="ax-btn ax-btn-ghost" onClick={pay} disabled={payLoading}>{payLoading ? "Redirection…" : "Accéder directement au rapport complet — 4,99 €"}</button>
            )}

            <section className="grid gap-3 sm:grid-cols-[1fr_auto] items-start" style={{ font: `12.5px/1.6 ${T.sans}`, color: T.muted }}>
              <p style={{ margin: 0, maxWidth: 720 }}><strong style={{ color: T.ink2 }}>Méthodologie et limites.</strong> {DISCLAIMER}</p>
              <Link to="/leads" className="inline-flex items-center gap-1.5" style={{ color: T.brand, fontWeight: 500 }}><RotateCcw className="h-3.5 w-3.5" /> Nouvelle évaluation</Link>
            </section>
          </div>
        )}
      </main>
    </SimShell>
  );
}
