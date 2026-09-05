// SECURITY (2026-09-05 audit): shared CORS allowlist for public (unauthenticated)
// write endpoints — contact form, quote request, payment-lead checkout.
//
// These functions used to send "Access-Control-Allow-Origin: *", which lets a
// script on ANY website (including a phishing clone of this site) call them
// directly from a visitor's browser. Scoping this to our own known origins
// does not by itself stop a server-to-server forgery (that still needs
// server-side validation/rate-limiting, which each function already has or
// now has), but it does close off the "embed our contact form's endpoint in
// someone else's page" class of abuse.
//
// Keep this list in sync with real deployments: production custom domains,
// this Vercel project's preview/alias hostnames, and local dev.
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/axiom-talents\.com$/,
  /^https:\/\/www\.axiom-talents\.com$/,
  // Vercel previews + aliases for this project, e.g.:
  //   axiom-altis-connect.vercel.app
  //   axiom-altis-connect-git-main-charly-wouches-projects.vercel.app
  //   axiom-altis-connect-b1rk94dna-charly-wouches-projects.vercel.app
  /^https:\/\/axiom-altis-connect(-[a-z0-9-]+-charly-wouches-projects)?\.vercel\.app$/,
  // Local development (Vite default port is 8080 per vite.config.ts; 5173 kept
  // as a fallback in case a contributor runs `vite` without the custom config).
  /^http:\/\/localhost:(8080|5173)$/,
  // Legacy Lovable-hosted staging deployment. This was the original hardcoded
  // fallback in create-payment-lead — kept here so that environment doesn't
  // silently break if it's still reachable/in use.
  /^https:\/\/axiom-altis-connect\.lovable\.app$/,
];

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

// Returns per-request CORS headers. Echoes the request's Origin back only when
// it matches the allowlist (required for the browser to accept a non-wildcard
// Access-Control-Allow-Origin); otherwise falls back to the canonical
// production origin, which will cause the browser to correctly block reads
// from an untrusted origin while a preflight still gets a valid response.
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) && origin ? origin : "https://axiom-talents.com",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

// For building redirect URLs (e.g. Stripe success_url/cancel_url) from the
// caller's Origin header: never interpolate the raw header into a URL, since
// an attacker can set Origin to anything. Only ever return a known-good
// origin from the same allowlist above.
export function safeRedirectOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  return isAllowedOrigin(origin) && origin ? origin : "https://axiom-talents.com";
}
