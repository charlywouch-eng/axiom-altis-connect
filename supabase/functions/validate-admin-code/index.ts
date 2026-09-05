import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// SECURITY (2026-09-05 audit): best-effort in-memory rate limit. This resets on cold
// start and does not coordinate across parallel instances — it raises the bar against
// casual brute-forcing but is not a hard guarantee at scale. For a durable guarantee,
// back this with a DB table (e.g. an `admin_code_attempts` row per user with a DB-level
// lockout), since this endpoint is the only path to the "admin" role in this app.
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const attemptsByUser = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const attempts = (attemptsByUser.get(key) || []).filter((t) => now - t < WINDOW_MS);
  attempts.push(now);
  attemptsByUser.set(key, attempts);
  return attempts.length > MAX_ATTEMPTS;
}

// Constant-time comparison: scans every character regardless of where a mismatch
// occurs, so response timing cannot be used to recover the secret one byte at a time.
function constantTimeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    console.log("Claims result:", { claimsData: claimsData?.claims?.sub, claimsError: claimsError?.message });
    if (claimsError || !claimsData?.claims) {
      console.log("Auth failed - returning 401");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    if (isRateLimited(userId)) {
      console.warn("validate-admin-code: rate limit exceeded for user", userId);
      return new Response(JSON.stringify({ valid: false, error: "Trop de tentatives. Réessayez plus tard." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ valid: false, error: "Code requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminSecret = Deno.env.get("ADMIN_SECRET_CODE");
    if (!adminSecret) {
      console.error("ADMIN_SECRET_CODE not configured");
      return new Response(JSON.stringify({ valid: false, error: "Configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Never log the code, the secret, or their lengths — only the outcome, and only on failure.
    if (!constantTimeEqual(code, adminSecret)) {
      console.warn("validate-admin-code: invalid attempt by user", userId);
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Code is valid — update role server-side using service role key
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await adminClient
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating role:", updateError);
      return new Response(JSON.stringify({ valid: false, error: "Failed to set role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ valid: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("validate-admin-code error:", error);
    return new Response(JSON.stringify({ valid: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
