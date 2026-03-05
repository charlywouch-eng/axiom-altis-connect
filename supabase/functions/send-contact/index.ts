import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Tous les champs sont requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Basic validation
    if (name.length > 100 || email.length > 255 || message.length > 2000) {
      return new Response(JSON.stringify({ error: "Champs trop longs" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0F172A,#1E3A5F);padding:24px 32px;">
          <h1 style="color:#ffffff;font-size:20px;margin:0;">📩 Nouveau message — AXIOM</h1>
        </div>
        <div style="padding:24px 32px;">
          <p style="margin:0 0 8px;"><strong>Nom :</strong> ${name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <p style="margin:0 0 8px;"><strong>Email :</strong> ${email.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
          <p style="margin:0;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Envoyé depuis le formulaire de contact axiom-talents.com</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AXIOM Contact <notify@axiom-talents.com>",
        to: ["charly@axiom-talents.com"],
        subject: `[Contact AXIOM] Message de ${name}`,
        html,
        reply_to: email,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      throw new Error(data.message || "Erreur d'envoi");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-contact error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
