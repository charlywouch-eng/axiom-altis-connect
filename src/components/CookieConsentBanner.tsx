import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GA_MEASUREMENT_ID } from "@/lib/ga4";

const CONSENT_KEY = "axiom_cookie_consent";

type ConsentValue = "accepted" | "refused";

/** Load the GA4 script dynamically (only once). */
function loadGA4Script() {
  if (document.getElementById("ga4-script")) return;

  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}

/** Remove GA4 cookies & script when consent is refused. */
function removeGA4() {
  // Delete _ga* cookies
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name.startsWith("_ga")) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
  const el = document.getElementById("ga4-script");
  if (el) el.remove();
  window.gtag = undefined;
}

export function getConsentValue(): ConsentValue | null {
  return localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
}

export function hasAnalyticsConsent(): boolean {
  return getConsentValue() === "accepted";
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsentValue();
    if (!consent) {
      setVisible(true);
    } else if (consent === "accepted") {
      loadGA4Script();
    }
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    loadGA4Script();
    setVisible(false);
  }, []);

  const handleRefuse = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "refused");
    removeGA4();
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card/95 backdrop-blur-lg shadow-2xl p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 rounded-full bg-primary/10 p-2">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm leading-relaxed text-foreground">
              Ce site utilise des cookies d'analyse (Google Analytics) pour mesurer l'audience
              et améliorer votre expérience. Aucun cookie publicitaire n'est déposé.{" "}
              <Link to="/rgpd" className="underline text-primary hover:text-primary/80 transition-colors">
                Politique de confidentialité
              </Link>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleAccept} className="rounded-full px-5">
                Accepter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefuse}
                className="rounded-full px-5"
              >
                Refuser
              </Button>
            </div>
          </div>
          <button
            onClick={handleRefuse}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
