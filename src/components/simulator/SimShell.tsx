import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
import { AxiomLogo } from "@/components/brand/AxiomLogo";
import { CesedaLegalNotice } from "@/components/CesedaLegalNotice";

/** Palette et typographie propres au simulateur (charte « rapport institutionnel »). */
export const T = {
  bg: "#F5F7FA",
  surface: "#FFFFFF",
  ink: "#0B1F3A",
  ink2: "#2C3E57",
  muted: "#5B6B82",
  faint: "#8A97AA",
  line: "#E1E6ED",
  lineStrong: "#C9D2DE",
  brand: "#123E7C",
  brandHover: "#0E3266",
  brandSoft: "#EAF1FB",
  accent: "#4C8DF6",
  sans: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  serif: "'Source Serif 4', Georgia, 'Times New Roman', serif",
  mono: "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace",
};

const CSS = `
.ax-sim{background:${T.bg};color:${T.ink};font-family:${T.sans};min-height:100vh;-webkit-font-smoothing:antialiased}
.ax-sim h1,.ax-sim h2,.ax-sim h3{color:${T.ink};text-wrap:balance}
.ax-card{background:${T.surface};border:1px solid ${T.line};border-radius:12px}
.ax-eyebrow{font:600 11px/1.2 ${T.sans};letter-spacing:.12em;text-transform:uppercase;color:${T.muted}}
.ax-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 22px;border-radius:8px;background:${T.brand};color:#fff;font:600 15px ${T.sans};border:0;cursor:pointer;transition:background .15s}
.ax-btn:hover{background:${T.brandHover}}
.ax-btn:disabled{opacity:.5;cursor:not-allowed}
.ax-btn-ghost{background:#fff;color:${T.ink};border:1px solid ${T.lineStrong}}
.ax-btn-ghost:hover{background:${T.bg}}
.ax-input{width:100%;height:46px;border:1px solid ${T.lineStrong};border-radius:8px;padding:0 14px;font:15px ${T.sans};color:${T.ink};background:#fff}
.ax-input:focus,.ax-seg button:focus-visible,.ax-btn:focus-visible,.ax-row:focus-visible{outline:2px solid ${T.accent};outline-offset:2px}
.ax-label{display:block;font:600 14px ${T.sans};color:${T.ink};margin-bottom:4px}
.ax-help{font:13px/1.45 ${T.sans};color:${T.muted};margin:0 0 8px}
.ax-seg{display:flex;flex-wrap:wrap;gap:8px}
.ax-seg button{min-height:44px;padding:0 16px;border-radius:8px;border:1px solid ${T.lineStrong};background:#fff;color:${T.ink2};font:500 14px ${T.sans};cursor:pointer}
.ax-seg button[aria-checked="true"]{background:${T.brandSoft};border-color:${T.brand};color:${T.brand};font-weight:600;box-shadow:inset 0 0 0 1px ${T.brand}}
.ax-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;width:100%;text-align:left;padding:16px 18px;background:#fff;border:0;border-bottom:1px solid ${T.line};cursor:pointer}
.ax-row:hover{background:#F9FBFD}
.ax-num{font-variant-numeric:tabular-nums}
.ax-choice{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:56px;text-align:left;padding:14px 18px;margin-bottom:10px;border:1px solid ${T.lineStrong};border-radius:12px;background:#fff;color:${T.ink};font:500 16px ${T.sans};cursor:pointer;transition:border-color .15s,background .15s}
.ax-choice:hover{border-color:${T.brand};background:#F9FBFE}
.ax-choice[aria-pressed="true"]{border-color:${T.brand};background:${T.brandSoft};box-shadow:inset 0 0 0 1px ${T.brand};font-weight:600}
.ax-choice:focus-visible{outline:2px solid ${T.accent};outline-offset:2px}
.ax-choice small{display:block;font:400 13px ${T.sans};color:${T.muted};margin-top:2px}
@keyframes axIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.ax-in{animation:axIn .28s ease-out}
@media (prefers-reduced-motion:reduce){.ax-sim *{transition:none!important;animation:none!important}}
`;

export function SimShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="ax-sim">
      <Helmet>
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap" />
      </Helmet>
      <style>{CSS}</style>

      <header style={{ background: T.surface, borderBottom: `1px solid ${T.line}` }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <span className="sm:hidden"><AxiomLogo size={28} tagline={false} /></span>
          <span className="hidden sm:inline-flex"><AxiomLogo size={28} /></span>
          <a href="/" className="inline-flex items-center gap-1.5" style={{ font: `600 13px ${T.sans}`, color: T.brand, whiteSpace: "nowrap" }}>
            Découvrir AXIOM <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      {children}

      <footer style={{ borderTop: `1px solid ${T.line}`, background: T.surface }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 grid gap-3" style={{ font: `12.5px/1.6 ${T.sans}`, color: T.muted }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: T.ink2 }}>AXIOM Talent Mobility</strong> accompagne le recrutement de talents francophones sur les métiers en tension en France.{" "}
            <a href="/" className="underline underline-offset-2" style={{ color: T.brand }}>En savoir plus sur axiom-talents.com</a>
          </p>
          <p style={{ margin: 0 }}>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" style={{ color: T.brand }} /> Données traitées conformément au RGPD</span>
            {" · "}<Link to="/rgpd-light" className="underline underline-offset-2">Confidentialité</Link>
            {" · "}Service indépendant, non affilié à France Travail ni à l'administration française · Projet en cours d'immatriculation.
          </p>
          <CesedaLegalNotice />
        </div>
      </footer>
    </div>
  );
}

/** Indicateur de progression en 3 étapes. */
export function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Métier visé", "Votre profil", "Rapport"];
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Progression">
      {steps.map((label, i) => {
        const n = i + 1, done = n < step, active = n === step;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3" aria-current={active ? "step" : undefined}>
            <span className="inline-flex items-center gap-2">
              <span className="ax-num inline-flex items-center justify-center rounded-full"
                style={{ width: 24, height: 24, font: `600 12px ${T.sans}`,
                  background: active || done ? T.brand : "#fff", color: active || done ? "#fff" : T.faint,
                  border: `1px solid ${active || done ? T.brand : T.lineStrong}` }}>
                {done ? "✓" : n}
              </span>
              <span className={active ? "" : "hidden sm:inline"} style={{ font: `${active ? 600 : 500} 13px ${T.sans}`, color: active ? T.ink : T.muted }}>{label}</span>
            </span>
            {n < 3 && <span aria-hidden style={{ width: 28, height: 1, background: T.lineStrong }} />}
          </li>
        );
      })}
    </ol>
  );
}
