import { supabase } from "@/integrations/supabase/client";

type FunnelEvent =
  | "lead_form_submitted"
  | "lead_score_viewed"
  | "lead_payment_clicked"
  | "payment_success"
  | "signup_started"
  | "signup_completed";

interface FunnelPayload {
  event_name: FunnelEvent;
  rome_code?: string;
  experience?: string;
  email_hash?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

/** Simple SHA-256 hash for RGPD-safe email tracking */
async function hashEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(email.trim().toLowerCase());
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Fire-and-forget funnel event tracking.
 * Never throws — errors are silently logged.
 */
export async function trackFunnel(payload: FunnelPayload) {
  try {
    const emailHash = payload.email_hash
      ? await hashEmail(payload.email_hash)
      : undefined;

    await (supabase.from as any)("funnel_events").insert({
      event_name: payload.event_name,
      rome_code: payload.rome_code ?? null,
      experience: payload.experience ?? null,
      email_hash: emailHash ?? null,
      source: payload.source ?? null,
      metadata: payload.metadata ?? {},
    });
  } catch (err) {
    console.warn("[trackFunnel]", err);
  }
}
