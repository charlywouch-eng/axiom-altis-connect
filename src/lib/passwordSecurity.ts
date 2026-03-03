/**
 * Password security utilities:
 * - Strength validation (length, complexity)
 * - HIBP (Have I Been Pwned) breach check via k-Anonymity API
 *
 * Supabase Auth already uses bcrypt for hashing — this layer
 * adds client-side UX feedback before submission.
 */

export interface PasswordCheck {
  valid: boolean;
  score: number; // 0-4
  issues: string[];
}

const MIN_LENGTH = 8;

export function checkPasswordStrength(pw: string): PasswordCheck {
  const issues: string[] = [];
  let score = 0;

  if (pw.length < MIN_LENGTH) issues.push(`Minimum ${MIN_LENGTH} caractères`);
  else score++;

  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  else issues.push("Ajoutez majuscules et minuscules");

  if (/\d/.test(pw)) score++;
  else issues.push("Ajoutez au moins un chiffre");

  if (/[^A-Za-z0-9]/.test(pw)) score++;
  else issues.push("Ajoutez un caractère spécial (!, @, #…)");

  return { valid: issues.length === 0 && pw.length >= MIN_LENGTH, score: Math.min(score, 4), issues };
}

/**
 * Check HIBP using k-Anonymity (only first 5 chars of SHA-1 sent).
 * Returns the number of times the password appeared in breaches, or 0.
 */
export async function checkHIBP(password: string): Promise<number> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });

    if (!res.ok) return 0; // Fail open — don't block user if API is down

    const text = await res.text();
    const match = text.split("\n").find((line) => line.startsWith(suffix));
    if (!match) return 0;

    return parseInt(match.split(":")[1].trim(), 10) || 0;
  } catch {
    return 0; // Fail open
  }
}

export const STRENGTH_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Très faible", color: "bg-red-500" },
  1: { label: "Faible", color: "bg-orange-500" },
  2: { label: "Moyen", color: "bg-yellow-500" },
  3: { label: "Fort", color: "bg-emerald-500" },
  4: { label: "Excellent", color: "bg-green-500" },
};
