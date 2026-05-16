import { describe, it, expect, beforeEach, vi } from "vitest";

// Le module maintient un état global (Map). On réinitialise en rejouant le module.
describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("autorise les premières tentatives jusqu'à la limite", async () => {
    const { checkRateLimit } = await import("@/lib/rateLimiter");
    // signup = max 3
    expect(checkRateLimit("signup").allowed).toBe(true);
    expect(checkRateLimit("signup").allowed).toBe(true);
    expect(checkRateLimit("signup").allowed).toBe(true);
  });

  it("bloque après avoir atteint la limite", async () => {
    const { checkRateLimit } = await import("@/lib/rateLimiter");
    checkRateLimit("signup");
    checkRateLimit("signup");
    checkRateLimit("signup");
    const result = checkRateLimit("signup");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("les actions différentes ont des compteurs indépendants", async () => {
    const { checkRateLimit } = await import("@/lib/rateLimiter");
    checkRateLimit("signup");
    checkRateLimit("signup");
    checkRateLimit("signup");
    // login a une limite de 5
    expect(checkRateLimit("login").allowed).toBe(true);
  });

  it("utilise la limite par défaut pour une action inconnue", async () => {
    const { checkRateLimit } = await import("@/lib/rateLimiter");
    // default = 5
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("action_inconnue").allowed).toBe(true);
    }
    expect(checkRateLimit("action_inconnue").allowed).toBe(false);
  });
});
