import { describe, it, expect } from "vitest";
import { checkPasswordStrength, STRENGTH_LABELS } from "@/lib/passwordSecurity";

describe("checkPasswordStrength", () => {
  it("marque un mot de passe vide comme invalide avec score 0", () => {
    const result = checkPasswordStrength("");
    expect(result.valid).toBe(false);
    expect(result.score).toBe(0);
  });

  it("marque un mot de passe trop court comme invalide", () => {
    const result = checkPasswordStrength("Ab1!");
    expect(result.valid).toBe(false);
    expect(result.issues).toContain("Minimum 8 caractères");
  });

  it("détecte l'absence de chiffre", () => {
    const result = checkPasswordStrength("Abcdefgh!");
    expect(result.issues).toContain("Ajoutez au moins un chiffre");
  });

  it("détecte l'absence de caractère spécial", () => {
    const result = checkPasswordStrength("Abcdefg1");
    expect(result.issues).toContain("Ajoutez un caractère spécial (!, @, #…)");
  });

  it("détecte l'absence de majuscule/minuscule mixte", () => {
    const result = checkPasswordStrength("abcdefg1!");
    expect(result.issues).toContain("Ajoutez majuscules et minuscules");
  });

  it("retourne valid=true et score maximal pour un mot de passe fort", () => {
    const result = checkPasswordStrength("MonMotDePasse1!");
    expect(result.valid).toBe(true);
    expect(result.score).toBe(4);
    expect(result.issues).toHaveLength(0);
  });

  it("bonus de score pour longueur >= 12", () => {
    // Sans caractère spécial : score 3 à 8 chars, score 4 à 12 chars (bonus longueur)
    const shortStrong = checkPasswordStrength("Aa1abcde");    // 8 chars, sans spécial → score 3
    const longStrong  = checkPasswordStrength("Aa1abcdefghi"); // 12 chars, sans spécial → score 4
    expect(longStrong.score).toBeGreaterThan(shortStrong.score);
  });

  it("le score ne dépasse pas 4", () => {
    const result = checkPasswordStrength("MonSuperMotDePasse1!XYZ");
    expect(result.score).toBeLessThanOrEqual(4);
  });
});

describe("STRENGTH_LABELS", () => {
  it("couvre tous les scores de 0 à 4", () => {
    for (let i = 0; i <= 4; i++) {
      expect(STRENGTH_LABELS[i]).toBeDefined();
      expect(STRENGTH_LABELS[i].label).toBeTruthy();
      expect(STRENGTH_LABELS[i].color).toMatch(/^bg-/);
    }
  });
});
