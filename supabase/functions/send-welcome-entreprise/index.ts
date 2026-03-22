import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const DASHBOARD_URL = "https://axiom-talents.com/dashboard-entreprise";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("User not authenticated");

    const user = userData.user;
    const displayName = user.user_metadata?.full_name || user.email;

    console.log(`[WELCOME-ENTREPRISE] Sending to ${user.email}`);

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%);padding:40px 32px;text-align:center;">
  <h1 style="color:#ffffff;font-size:24px;margin:0 0 8px;">Bienvenue sur AXIOM × ALTIS</h1>
  <p style="color:#94a3b8;font-size:14px;margin:0;">Plateforme de recrutement international certifié</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px;">
  <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
    Bonjour <strong>${displayName}</strong>,
  </p>
  <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
    Votre espace entreprise est actif. Vous pouvez dès maintenant accéder à notre base de talents certifiés MINEFOP/MINREX, opérationnels jour 1 en France.
  </p>

  <!-- Pricing table -->
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
    <tr style="background:#f1f5f9;">
      <td style="padding:12px 16px;font-weight:700;color:#0F172A;font-size:13px;border-bottom:1px solid #e2e8f0;">Formule</td>
      <td style="padding:12px 16px;font-weight:700;color:#0F172A;font-size:13px;border-bottom:1px solid #e2e8f0;">Tarif</td>
      <td style="padding:12px 16px;font-weight:700;color:#0F172A;font-size:13px;border-bottom:1px solid #e2e8f0;">Inclus</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;color:#475569;font-size:13px;border-bottom:1px solid #f1f5f9;">Découverte</td>
      <td style="padding:12px 16px;color:#16a34a;font-weight:600;font-size:13px;border-bottom:1px solid #f1f5f9;">Gratuit</td>
      <td style="padding:12px 16px;color:#475569;font-size:13px;border-bottom:1px solid #f1f5f9;">3 profils consultables</td>
    </tr>
    <tr style="background:#f8fafc;">
      <td style="padding:12px 16px;color:#475569;font-size:13px;border-bottom:1px solid #f1f5f9;">Premium SaaS</td>
      <td style="padding:12px 16px;color:#1E40AF;font-weight:700;font-size:13px;border-bottom:1px solid #f1f5f9;">499 €/mois</td>
      <td style="padding:12px 16px;color:#475569;font-size:13px;border-bottom:1px solid #f1f5f9;">Accès illimité base vérifiée + matching IA + dashboard complet</td>
    </tr>
    <tr>
      <td style="padding:12px 16px;color:#475569;font-size:13px;border-bottom:1px solid #f1f5f9;">Success Fee</td>
      <td style="padding:12px 16px;color:#475569;font-weight:600;font-size:13px;border-bottom:1px solid #f1f5f9;">25 % brut annuel</td>
      <td style="padding:12px 16px;color:#475569;font-size:13px;border-bottom:1px solid #f1f5f9;">Facturé uniquement à la signature CDI</td>
    </tr>
    <tr style="background:#f8fafc;">
      <td style="padding:12px 16px;color:#475569;font-size:13px;">Pack ALTIS</td>
      <td style="padding:12px 16px;color:#06B6D4;font-weight:700;font-size:13px;">2 450 €/talent</td>
      <td style="padding:12px 16px;color:#475569;font-size:13px;">Formalités visa de travail (procédure ANEF) + accueil aéroport + logement 1 mois + accompagnement administratif</td>
    </tr>
  </table>

  <!-- CTA -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:8px 0 24px;">
      <a href="${DASHBOARD_URL}" style="display:inline-block;background:#1E40AF;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;">
        Accéder à mon dashboard →
      </a>
    </td></tr>
  </table>

  <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0;">
    Besoin d'aide ? Répondez directement à cet email ou contactez-nous à <a href="mailto:support@axiom-talents.com" style="color:#1E40AF;">support@axiom-talents.com</a>.
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
  <p style="color:#94a3b8;font-size:11px;margin:0;">© ${new Date().getFullYear()} AXIOM ALTIS – Recrutement international certifié Cameroun → France</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AXIOM × ALTIS <contact@axiom-talents.com>",
        to: [user.email],
        subject: "Bienvenue sur AXIOM × ALTIS – Votre espace recruteur est prêt",
        html,
        reply_to: "support@axiom-talents.com",
      }),
    });

    const resendData = await resendRes.json();
    console.log(`[WELCOME-ENTREPRISE] Resend status: ${resendRes.status}`, resendData);

    if (!resendRes.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[WELCOME-ENTREPRISE] ERROR: ${msg}`);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
