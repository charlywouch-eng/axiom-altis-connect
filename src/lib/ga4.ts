/**
 * Google Analytics 4 – lightweight wrapper.
 * The gtag script is loaded in index.html.
 * All custom events are typed here for consistency.
 */

// Extend Window for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const GA_MEASUREMENT_ID = "G-4KKLB8SDHZ";

type GA4Event =
  | "inscription_start"
  | "score_viewed"
  | "metier_selected"
  | "teaser_10_eu"
  | "paiement_started"
  | "paiement_4_99_started"
  | "paiement_29_started"
  | "rgpd_accepted"
  | "dashboard_talent_view"
  | "dashboard_entreprise_view"
  | "funnel_step_contact"
  | "funnel_step_secteur"
  | "funnel_step_experience"
  | "funnel_step_pays";

/**
 * Check if analytics consent has been given.
 */
function hasConsent(): boolean {
  try {
    return localStorage.getItem("axiom_cookie_consent") === "accepted";
  } catch {
    return false;
  }
}

/**
 * Fire a custom GA4 event (fire-and-forget).
 * Skipped silently if consent was not given.
 */
export function trackGA4(
  event: GA4Event,
  params?: Record<string, string | number | boolean | undefined>
) {
  try {
    if (typeof window !== "undefined" && window.gtag && hasConsent()) {
      window.gtag("event", event, params);
    }
  } catch {
    // silent
  }
}

/**
 * Track a page view manually (useful for SPA route changes).
 * Skipped silently if consent was not given.
 */
export function trackPageView(path: string, title?: string) {
  try {
    if (typeof window !== "undefined" && window.gtag && hasConsent()) {
      window.gtag("event", "page_view", {
        page_path: path,
        page_title: title,
      });
    }
  } catch {
    // silent
  }
}
