import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/ga4";

/**
 * Tracks page_view on every SPA route change.
 * Place inside <BrowserRouter>.
 */
export function GA4RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null;
}
