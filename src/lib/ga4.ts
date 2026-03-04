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

export const GA_MEASUREMENT_ID = "G-XXXXXXX";

type GA4Event =
  | "inscription_start"
  | "score_viewed"
  | "teaser_10_eu"
  | "paiement_started"
  | "dashboard_talent_view"
  | "dashboard_entreprise_view";

/**
 * Fire a custom GA4 event (fire-and-forget).
 */
export function trackGA4(
  event: GA4Event,
  params?: Record<string, string | number | boolean | undefined>
) {
  try {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", event, params);
    }
  } catch {
    // silent
  }
}

/**
 * Track a page view manually (useful for SPA route changes).
 */
export function trackPageView(path: string, title?: string) {
  try {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "page_view", {
        page_path: path,
        page_title: title,
      });
    }
  } catch {
    // silent
  }
}
