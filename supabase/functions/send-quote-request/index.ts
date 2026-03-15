import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const COMMERCIAL_EMAIL = "contact@axiom-altis.com";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-QUOTE-REQUEST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body = await req.json();
    const { company, sector, volume, message, user_email } = body;

    // Try to get authenticated user, but allow unauthenticated requests
    let userEmail = user_email;
    let userId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData?.user) {
        userEmail = userData.user.email || userEmail;
        userId = userData.user.id;
        logStep("User authenticated", { email: userEmail });
      }
    }

    if (!userEmail) throw new Error("Email requis");
    if (!company || !sector) {
      throw new Error("Champs obligatoires manquants (entreprise, secteur)");
    }

    logStep("Quote request received", { company, sector, volume });

    // Persist in database
    const { error: insertError } = await supabaseClient
      .from("quote_requests")
      .insert({
        user_id: userId || "00000000-0000-0000-0000-000000000000",
        user_email: userEmail,
        company,
        sector,
        volume: volume || null,
        message: message || null,
      });
    if (insertError) {
      logStep("DB insert error (non-blocking)", { error: insertError.message });
    } else {
      logStep("Quote request saved to DB");
    }

    const htmlContent = `
      <h2>📋 Nouvelle demande de devis</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${userEmail}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Entreprise</td><td style="padding:8px;border:1px solid #ddd;">${company}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Secteur</td><td style="padding:8px;border:1px solid #ddd;">${sector}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Volume</td><td style="padding:8px;border:1px solid #ddd;">${volume || "Non précisé"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Formule</td><td style="padding:8px;border:1px solid #ddd;">Success Fee – 25% du brut annuel</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Message</td><td style="padding:8px;border:1px solid #ddd;">${message || "—"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Date</td><td style="padding:8px;border:1px solid #ddd;">${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</td></tr>
      </table>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AXIOM ALTIS <noreply@axiom-altis.com>",
        to: [COMMERCIAL_EMAIL],
        subject: `[Devis] ${company} – ${sector}`,
        html: htmlContent,
        reply_to: userEmail,
      }),
    });

    const resendData = await resendRes.json();
    logStep("Resend response", { status: resendRes.status, data: resendData });

    if (!resendRes.ok) {
      throw new Error(`Resend error: ${JSON.stringify(resendData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Demande de devis envoyée avec succès." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
