import { describe, it, expect, vi, beforeEach } from "vitest";

describe("trackGA4", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("ne fire pas si le consentement n'est pas donné", async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    // pas de consentement dans localStorage
    const { trackGA4 } = await import("@/lib/ga4");
    trackGA4("inscription_start");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("fire l'événement si le consentement est accepté", async () => {
    localStorage.setItem("axiom_cookie_consent", "accepted");
    const gtag = vi.fn();
    window.gtag = gtag;
    const { trackGA4 } = await import("@/lib/ga4");
    trackGA4("inscription_start", { source: "test" });
    expect(gtag).toHaveBeenCalledWith("event", "inscription_start", { source: "test" });
  });

  it("ne fire pas si window.gtag est absent", async () => {
    localStorage.setItem("axiom_cookie_consent", "accepted");
    window.gtag = undefined;
    const { trackGA4 } = await import("@/lib/ga4");
    expect(() => trackGA4("score_viewed")).not.toThrow();
  });
});

describe("trackPageView", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("fire page_view avec path et title si consentement donné", async () => {
    localStorage.setItem("axiom_cookie_consent", "accepted");
    const gtag = vi.fn();
    window.gtag = gtag;
    const { trackPageView } = await import("@/lib/ga4");
    trackPageView("/dashboard-talent", "Mon tableau de bord");
    expect(gtag).toHaveBeenCalledWith("event", "page_view", {
      page_path: "/dashboard-talent",
      page_title: "Mon tableau de bord",
    });
  });

  it("ne fire pas sans consentement", async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const { trackPageView } = await import("@/lib/ga4");
    trackPageView("/dashboard-talent");
    expect(gtag).not.toHaveBeenCalled();
  });
});
