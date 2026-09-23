/**
 * Logo AXIOM — monogramme + logotype.
 * Le monogramme est un « A » construit en deux fûts, dont la barre
 * se prolonge vers la droite : un pont entre deux rives.
 */
interface Props {
  /** Hauteur du monogramme en px */
  size?: number;
  /** "dark" = sur fond clair (encre marine), "light" = sur fond sombre */
  tone?: "dark" | "light";
  /** Affiche la signature « Talent Mobility » */
  tagline?: boolean;
}

export function AxiomMark({ size = 32, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  const bg = tone === "dark" ? "#0B1F3A" : "#FFFFFF";
  const fg = tone === "dark" ? "#FFFFFF" : "#0B1F3A";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="AXIOM" style={{ flexShrink: 0 }}>
      <rect width="40" height="40" rx="9" fill={bg} />
      <path d="M11 30 L18.2 10.5 H21.8 L29 30" fill="none" stroke={fg} strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M15.2 23.5 H33" stroke="#4C8DF6" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export function AxiomLogo({ size = 32, tone = "dark", tagline = true }: Props) {
  const ink = tone === "dark" ? "#0B1F3A" : "#FFFFFF";
  const muted = tone === "dark" ? "#5B6B82" : "rgba(255,255,255,0.65)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <AxiomMark size={size} tone={tone} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 10, lineHeight: 1 }}>
        <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 600, fontSize: size * 0.56, letterSpacing: "0.16em", color: ink }}>
          AXIOM
        </span>
        {tagline && (
          <>
            <span aria-hidden style={{ width: 1, height: size * 0.55, background: tone === "dark" ? "#D5DCE6" : "rgba(255,255,255,0.3)" }} />
            <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 500, fontSize: size * 0.34, letterSpacing: "0.08em", textTransform: "uppercase", color: muted }}>
              Talent Mobility
            </span>
          </>
        )}
      </span>
    </span>
  );
}
