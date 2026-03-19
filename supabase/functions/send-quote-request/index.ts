import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const COMMERCIAL_EMAIL = "contact@axiom-talents.com";

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
        from: "AXIOM ALTIS <notify@axiom-talents.com>",
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

    // ── Confirmation email to the prospect ──────────────────────
    const confirmationHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0F172A,#1E3A5F);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">AXIOM ALTIS</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">TIaaS — Talent Infrastructure as a Service</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 16px;color:#0F172A;font-size:20px;">Merci pour votre demande de devis !</h2>
            <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
              Bonjour,<br><br>
              Nous avons bien reçu votre demande de devis pour <strong>${company}</strong> dans le secteur <strong>${sector}</strong>.
            </p>
            <table style="width:100%;border-collapse:collapse;margin:0 0 24px;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
              <tr style="background:#f8fafc;">
                <td style="padding:10px 16px;font-weight:600;color:#334155;font-size:14px;border-bottom:1px solid #e2e8f0;">Entreprise</td>
                <td style="padding:10px 16px;color:#475569;font-size:14px;border-bottom:1px solid #e2e8f0;">${company}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-weight:600;color:#334155;font-size:14px;border-bottom:1px solid #e2e8f0;">Secteur</td>
                <td style="padding:10px 16px;color:#475569;font-size:14px;border-bottom:1px solid #e2e8f0;">${sector}</td>
              </tr>
              <tr style="background:#f8fafc;">
                <td style="padding:10px 16px;font-weight:600;color:#334155;font-size:14px;border-bottom:1px solid #e2e8f0;">Volume</td>
                <td style="padding:10px 16px;color:#475569;font-size:14px;border-bottom:1px solid #e2e8f0;">${volume || "Non précisé"}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-weight:600;color:#334155;font-size:14px;">Pack inclus</td>
                <td style="padding:10px 16px;color:#475569;font-size:14px;">Formalités visa de travail (procédure ANEF) + billet A/R + accueil aéroport + logement meublé 1 mois + accompagnement administratif</td>
              </tr>
            </table>
            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
              Notre équipe commerciale reviendra vers vous sous <strong>24 à 48 heures</strong> avec un devis personnalisé adapté à vos besoins.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#0ea5e9;border-radius:8px;">
                  <a href="https://axiom-talents.com/pricing" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;">Voir nos tarifs</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">AXIOM ALTIS — Recrutement international Afrique → France</p>
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              <a href="https://axiom-talents.com" style="color:#0ea5e9;text-decoration:none;">axiom-talents.com</a>
              &nbsp;·&nbsp;
              <a href="mailto:contact@axiom-talents.com" style="color:#0ea5e9;text-decoration:none;">contact@axiom-talents.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const confirmRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AXIOM ALTIS <notify@axiom-talents.com>",
        to: [userEmail],
        subject: "Votre demande de devis a bien été reçue — AXIOM ALTIS",
        html: confirmationHtml,
        reply_to: COMMERCIAL_EMAIL,
      }),
    });

    const confirmData = await confirmRes.json();
    logStep("Confirmation email response", { status: confirmRes.status, data: confirmData });
    if (!confirmRes.ok) {
      logStep("Confirmation email error (non-blocking)", { error: confirmData });
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
