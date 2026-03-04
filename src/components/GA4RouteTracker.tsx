import { useEffect, forwardRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/ga4";

/**
 * Tracks page_view on every SPA route change.
 * Place inside <BrowserRouter>.
 * Wrapped in forwardRef to avoid React warnings when used as a direct child of layout components.
 */
export const GA4RouteTracker = forwardRef<HTMLDivElement>(function GA4RouteTracker(_props, _ref) {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return null;
});
