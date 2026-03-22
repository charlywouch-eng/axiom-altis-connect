import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const { offer_id, user_id, payment_type } = session.metadata || {};

      // ── Abonnement Premium Entreprise ───────────────────────
      if (payment_type === "entreprise_premium" && user_id) {
        console.log(`[WEBHOOK] Premium entreprise subscription activated for user ${user_id}`);
        // Mark company as subscribed in DB for RLS enforcement
        const { error: subError } = await supabaseClient
          .from("company_profiles")
          .update({ is_subscribed: true, subscription_end: null })
          .eq("user_id", user_id);
        if (subError) console.error("Error updating subscription status:", subError);
      }

      // ── Paiement talent (test 4,99 € / déblocage complet 29 €) ──
      if ((payment_type === "analyse_complete" || payment_type === "analyse_complete_lead" || payment_type === "deblocage_complet") && user_id) {
        const { data: existingProfile } = await supabaseClient
          .from("talent_profiles")
          .select("id")
          .eq("user_id", user_id)
          .maybeSingle();

        if (existingProfile) {
          const { error } = await supabaseClient
            .from("talent_profiles")
            .update({ is_premium: true, premium_unlocked_at: new Date().toISOString() })
            .eq("user_id", user_id);
          if (error) { console.error("Error updating premium flag:", error); throw error; }
        } else {
          const { error } = await supabaseClient
            .from("talent_profiles")
            .insert({
              user_id,
              is_premium: true,
              premium_unlocked_at: new Date().toISOString(),
              visa_status: "en_attente",
            });
          if (error) { console.error("Error inserting premium talent profile:", error); throw error; }
        }
        console.log(`Premium unlocked for user ${user_id}`);

        // Send Pack ALTIS confirmation email via Resend for full (29€) tier
        if (payment_type === "deblocage_complet") {
          const customerEmail = session.customer_details?.email || session.customer_email;
          if (customerEmail) {
            const { data: talentData } = await supabaseClient
              .from("talent_profiles")
              .select("full_name")
              .eq("user_id", user_id)
              .maybeSingle();

            const talentName = talentData?.full_name || "Talent";
            const resendKey = Deno.env.get("RESEND_API_KEY");

            if (resendKey) {
              const emailHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
<tr><td style="background:#0F172A;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
<p style="font-size:20px;font-weight:800;color:#ffffff;margin:0;letter-spacing:1px;">AXIOM × ALTIS</p>
<p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">TIaaS — Talent Infrastructure as a Service</p>
</td></tr>
<tr><td style="padding:24px 32px 8px;text-align:center;">
<span style="display:inline-block;background:#ecfdf5;color:#059669;font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;border:1px solid #a7f3d0;">✅ PACK ALTIS ACTIVÉ</span>
</td></tr>
<tr><td style="padding:16px 32px 8px;text-align:center;">
<h1 style="font-size:24px;font-weight:800;color:#0F172A;margin:0;">Félicitations ${talentName} !</h1>
</td></tr>
<tr><td style="padding:0 32px 16px;">
<p style="font-size:14px;color:#475569;line-height:1.6;">Votre paiement de <strong>29 €</strong> a été confirmé. Votre Pack ALTIS Zéro Stress est maintenant actif.</p>
<p style="font-size:14px;color:#475569;line-height:1.6;">Un conseiller AXIOM vous contactera sous <strong>48 heures</strong> pour démarrer votre dossier.</p>
</td></tr>
<tr><td style="padding:0 32px 20px;">
<table width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;">
<tr><td><p style="font-size:14px;font-weight:700;color:#0F172A;margin:0 0 16px;">📦 Votre Pack ALTIS inclut</p></td></tr>
<tr><td style="padding:0 0 10px;"><p style="margin:0;font-size:13px;"><strong>📋 Préparation dossier ANEF</strong></p><p style="margin:2px 0 0;font-size:12px;color:#64748b;">Constitution complète de votre dossier de visa de travail.</p></td></tr>
<tr><td style="padding:0 0 10px;"><p style="margin:0;font-size:13px;"><strong>🎯 Matching prioritaire recruteurs</strong></p><p style="margin:2px 0 0;font-size:12px;color:#64748b;">Votre profil est mis en avant ×3 auprès des entreprises françaises.</p></td></tr>
<tr><td style="padding:0 0 10px;"><p style="margin:0;font-size:13px;"><strong>✈️ Accueil aéroport + 🏠 Logement 1 mois</strong></p><p style="margin:2px 0 0;font-size:12px;color:#64748b;">Prise en charge et hébergement garanti.</p></td></tr>
<tr><td style="padding:0 0 10px;"><p style="margin:0;font-size:13px;"><strong>📄 Accompagnement administratif</strong></p><p style="margin:2px 0 0;font-size:12px;color:#64748b;">Sécurité sociale, compte bancaire, titre de séjour.</p></td></tr>
<tr><td><p style="margin:0;font-size:13px;"><strong>🎓 Certification MINEFOP</strong></p><p style="margin:2px 0 0;font-size:12px;color:#64748b;">Validation officielle de vos qualifications.</p></td></tr>
</table>
</td></tr>
<tr><td style="padding:0 32px 20px;">
<table width="100%" style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:14px 20px;">
<tr><td><p style="font-size:13px;color:#0d9488;margin:0;">🚀 <strong>Badge Profil Vérifié Premium activé</strong> — Les recruteurs voient votre profil en priorité.</p></td></tr>
</table>
</td></tr>
<tr><td style="text-align:center;padding:8px 0 24px;">
<a href="https://axiom-altis-connect.lovable.app/dashboard-talent" style="display:inline-block;background:#1E40AF;color:#ffffff;font-size:14px;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;">Accéder à mon Dashboard</a>
</td></tr>
<tr><td style="border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
<p style="font-size:11px;color:#94a3b8;">AXIOM × ALTIS · notify@axiom-talents.com</p>
</td></tr>
</table></body></html>`;

              try {
                const resendRes = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    from: "AXIOM × ALTIS <notify@axiom-talents.com>",
                    to: [customerEmail],
                    subject: "✅ Votre Pack ALTIS Zéro Stress est activé !",
                    html: emailHtml,
                  }),
                });
                if (resendRes.ok) {
                  console.log(`Pack ALTIS confirmation email sent via Resend to ${customerEmail}`);
                } else {
                  console.error(`Resend error: ${resendRes.status} ${await resendRes.text()}`);
                }
              } catch (emailErr) {
                console.error("Failed to send Resend email:", emailErr);
              }
            } else {
              console.warn("RESEND_API_KEY not configured, skipping confirmation email");
            }
          }
        }
      }

      // ── Paiement lead (pas de user_id) — stocker le flag par email ──
      if (payment_type === "analyse_complete_lead" && !user_id) {
        const customerEmail = session.customer_details?.email || session.customer_email;
        if (customerEmail) {
          // Update lead status to "premium_paid"
          await supabaseClient
            .from("leads")
            .update({ status: "premium_paid" })
            .eq("email_or_phone", customerEmail);
          console.log(`Lead ${customerEmail} marked as premium_paid`);
        }
      }

      // ── Paiement success fee entreprise (offre) ─────────────
      if (offer_id && user_id && payment_type !== "analyse_complete" && payment_type !== "entreprise_premium") {
        const { error: updateError } = await supabaseClient
          .from("job_offers")
          .update({ status: "filled" })
          .eq("id", offer_id)
          .eq("company_id", user_id);
        if (updateError) { console.error("Error updating offer status:", updateError); throw updateError; }
        console.log(`Offer ${offer_id} marked as filled after payment`);
      }
    }

    // ── Handle subscription cancellation ──────────────────────
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as any;
      console.log(`[WEBHOOK] Subscription ${subscription.id} canceled`);
      
      // Find customer email to locate the company profile
      const stripe2 = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
      const customer = await stripe2.customers.retrieve(subscription.customer);
      if (customer && !customer.deleted && customer.email) {
        // Find company profile by email match via profiles table
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("email", customer.email)
          .maybeSingle();
        if (profile) {
          await supabaseClient
            .from("company_profiles")
            .update({ 
              is_subscribed: false, 
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString() 
            })
            .eq("user_id", profile.id);
          console.log(`[WEBHOOK] Company ${customer.email} subscription deactivated`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
