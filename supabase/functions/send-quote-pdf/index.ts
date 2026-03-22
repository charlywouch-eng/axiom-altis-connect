import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const COMMERCIAL_EMAIL = "contact@axiom-talents.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    if (!userData?.user) throw new Error("Non authentifié");

    const { quoteData, pdfBase64, recipientEmail, quoteId } = await req.json();
    if (!quoteData || !pdfBase64 || !recipientEmail) {
      throw new Error("Données manquantes");
    }

    // Format items for email
    const itemsHtml = quoteData.items.map((item: any) =>
      `<tr>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;">${item.label}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;font-size:13px;">${item.quantity}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-size:13px;">${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(item.unitPrice)}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;font-weight:600;font-size:13px;">${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(item.total)}</td>
      </tr>`
    ).join("");

    const totalHTFormatted = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(quoteData.totalHT);
    const totalTTCFormatted = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(quoteData.totalTTC);

    const htmlEmail = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0F172A,#1E3A5F);padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">AXIOM ALTIS</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">TIaaS — Talent Infrastructure as a Service</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h2 style="margin:0 0 8px;color:#0F172A;font-size:18px;">Votre devis ${quoteData.quoteNumber}</h2>
            <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
              Bonjour,<br><br>
              Veuillez trouver ci-joint votre devis pour <strong>${quoteData.companyName}</strong>.<br>
              Ce devis est valable jusqu'au <strong>${quoteData.validityDate}</strong>.
            </p>
            <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
              <tr style="background:#0F172A;">
                <th style="padding:8px 12px;color:#fff;text-align:left;font-size:12px;">Désignation</th>
                <th style="padding:8px 12px;color:#fff;text-align:center;font-size:12px;">Qté</th>
                <th style="padding:8px 12px;color:#fff;text-align:right;font-size:12px;">Prix unit.</th>
                <th style="padding:8px 12px;color:#fff;text-align:right;font-size:12px;">Total HT</th>
              </tr>
              ${itemsHtml}
            </table>
            <table style="width:100%;margin:0 0 24px;">
              <tr>
                <td style="text-align:right;padding:4px 12px;font-size:13px;color:#64748b;">Total HT : <strong style="color:#0F172A;">${totalHTFormatted}</strong></td>
              </tr>
              <tr>
                <td style="text-align:right;padding:8px 12px;font-size:16px;font-weight:800;color:#0ea5e9;">Total TTC : ${totalTTCFormatted}</td>
              </tr>
            </table>
            <p style="margin:0 0 12px;color:#475569;font-size:13px;line-height:1.5;">
              <strong>Conditions :</strong> Acompte 50 % à la signature · Solde 50 % à la mise à disposition · Garantie remplacement 3 mois
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#0ea5e9;border-radius:8px;">
                  <a href="https://axiom-talents.com/pricing" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">Voir nos tarifs</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:11px;">AXIOM ALTIS — Recrutement international Afrique → France</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:11px;">
              <a href="https://axiom-talents.com" style="color:#0ea5e9;">axiom-talents.com</a> · 
              <a href="mailto:contact@axiom-talents.com" style="color:#0ea5e9;">contact@axiom-talents.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Decode base64 PDF for attachment
    const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    // Convert to base64 for Resend attachment
    const base64Content = pdfBase64;

    // Send to client
    const clientRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "AXIOM × ALTIS <contact@axiom-talents.com>",
        to: [recipientEmail],
        subject: `Votre devis ${quoteData.quoteNumber} — AXIOM ALTIS`,
        html: htmlEmail,
        reply_to: COMMERCIAL_EMAIL,
        attachments: [{ filename: `Devis_${quoteData.quoteNumber}.pdf`, content: base64Content }],
      }),
    });

    const clientData = await clientRes.json();
    if (!clientRes.ok) throw new Error(`Resend error: ${JSON.stringify(clientData)}`);

    // Send copy to commercial
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "AXIOM ALTIS <notify@axiom-talents.com>",
        to: [COMMERCIAL_EMAIL],
        subject: `[Devis généré] ${quoteData.quoteNumber} — ${quoteData.companyName}`,
        html: htmlEmail,
        reply_to: recipientEmail,
        attachments: [{ filename: `Devis_${quoteData.quoteNumber}.pdf`, content: base64Content }],
      }),
    });

    // Update quote status
    if (quoteId) {
      await supabaseClient
        .from("generated_quotes")
        .update({ status: "sent" })
        .eq("id", quoteId);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[SEND-QUOTE-PDF]", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
