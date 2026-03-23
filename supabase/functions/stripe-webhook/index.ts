import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildAltisEmailHtml(talentName: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;margin:0;}.container{max-width:600px;margin:auto;background:white;border-radius:12px;overflow:hidden;}.header{background:#0A2540;color:white;padding:30px;text-align:center;}.header h1{margin:0;font-size:22px;letter-spacing:1px;}.header p{margin:6px 0 0;font-size:12px;color:#94a3b8;}.content{padding:40px 30px;line-height:1.6;color:#333;}.badge{background:#00C4B4;color:white;padding:8px 20px;border-radius:30px;display:inline-block;margin:15px 0;font-size:13px;font-weight:700;letter-spacing:0.5px;}.btn{background:#00C4B4;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;margin:20px 0;font-weight:700;font-size:14px;}.footer{padding:20px 30px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;}ul{padding-left:20px;}ul li{margin-bottom:8px;font-size:14px;}</style></head>
<body><div class="container">
<div class="header"><h1>AXIOM × ALTIS</h1><p>Infrastructure Souveraine France-Afrique</p></div>
<div class="content">
<h2 style="margin-top:0;">✅ Félicitations ${talentName} !</h2>
<p>Votre <strong>Pack ALTIS Zéro Stress</strong> est maintenant activé.</p>
<div class="badge">PROFIL VÉRIFIÉ PREMIUM</div>
<p>Vous bénéficiez désormais de :</p>
<ul>
<li>🚀 <strong>Priorité recruteurs ×3</strong></li>
<li>📋 Préparation complète du dossier ANEF</li>
<li>📄 Accompagnement administratif renforcé</li>
<li>✈️ Accueil aéroport + 🏠 Logement 1 mois</li>
<li>🎓 Certification MINEFOP validée</li>
<li>🎯 Badge <strong>AXIOM READY</strong> visible par toutes les entreprises</li>
</ul>
<a href="https://axiom-altis-connect.lovable.app/dashboard-talent" class="btn">Accéder à mon tableau de bord</a>
<p style="font-size:13px;color:#666;">Nous vous contacterons sous 48h pour la prochaine étape de votre mobilité.</p>
</div>
<div class="footer">AXIOM × ALTIS · notify@axiom-talents.com</div>
</div></body></html>`;
}

const FROM_EMAIL = "AXIOM & ALTIS <notify@axiom-talents.com>";
const REPLY_TO = "contact@axiom-talents.com";

async function sendResendEmail(
  resendKey: string,
  to: string,
  talentName: string,
  supabaseClient: any,
  metadata: Record<string, any>
): Promise<boolean> {
  const emailHtml = buildAltisEmailHtml(talentName);

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        reply_to: REPLY_TO,
        subject: "✅ Votre Pack ALTIS Zéro Stress est activé !",
        html: emailHtml,
      }),
    });

    const resBody = await resendRes.text();

    if (resendRes.ok) {
      console.log(`[RESEND] Email envoyé à ${to} depuis ${FROM_EMAIL}`);
      await supabaseClient.from("email_send_log").insert({
        template_name: "altis-activation-29",
        recipient_email: to,
        status: "sent",
        metadata: { ...metadata, from: FROM_EMAIL },
      });
      return true;
    } else {
      console.error(`[RESEND] Erreur ${resendRes.status}: ${resBody}`);
      await supabaseClient.from("email_send_log").insert({
        template_name: "altis-activation-29",
        recipient_email: to,
        status: "failed",
        error_message: `${resendRes.status}: ${resBody}`,
        metadata: { ...metadata, from: FROM_EMAIL },
      });
      return false;
    }
  } catch (emailErr) {
    console.error(`[RESEND] Exception:`, emailErr);
    await supabaseClient.from("email_send_log").insert({
      template_name: "altis-activation-29",
      recipient_email: to,
      status: "failed",
      error_message: emailErr?.message || String(emailErr),
      metadata,
    });
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const url = new URL(req.url);

    // ── Manual test mode: GET /stripe-webhook?test_email=xxx ──
    if (req.method === "GET" && url.searchParams.get("test_email")) {
      const testEmail = url.searchParams.get("test_email")!;
      const resendKey = Deno.env.get("RESEND_API_KEY");
      console.log(`[TEST] Test email demandé vers ${testEmail}`);
      console.log(`[TEST] RESEND_API_KEY configurée: ${resendKey ? "OUI (" + resendKey.substring(0, 8) + "...)" : "NON"}`);

      if (!resendKey) {
        return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      const sent = await sendResendEmail(resendKey, testEmail, "Test Talent", supabaseClient, {
        test: true,
        triggered_at: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ success: sent, email: testEmail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: sent ? 200 : 500,
      });
    }

    // ── Stripe webhook processing ──
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("Missing stripe-signature header");

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`[WEBHOOK] Événement reçu: ${event.type} – ID: ${event.id}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const { offer_id, user_id, payment_type } = session.metadata || {};
      console.log(`[WEBHOOK] Webhook reçu – session ID: ${session.id}`);
      console.log(`[WEBHOOK] Metadata: user_id=${user_id}, payment_type=${payment_type}, offer_id=${offer_id}`);
      console.log(`[WEBHOOK] Customer email: ${session.customer_details?.email || session.customer_email || "N/A"}`);

      // ── Abonnement Premium Entreprise ───────────────────────
      if (payment_type === "entreprise_premium" && user_id) {
        console.log(`[WEBHOOK] Premium entreprise subscription activated for user ${user_id}`);
        const { error: subError } = await supabaseClient
          .from("company_profiles")
          .update({ is_subscribed: true, subscription_end: null })
          .eq("user_id", user_id);
        if (subError) console.error("[WEBHOOK] Error updating subscription status:", subError);
      }

      // ── Paiement talent ──
      if (
        (payment_type === "analyse_complete" ||
          payment_type === "analyse_complete_lead" ||
          payment_type === "deblocage_complet") &&
        user_id
      ) {
        console.log(`[WEBHOOK] Traitement paiement talent: ${payment_type} pour user ${user_id}`);

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
          if (error) {
            console.error("[WEBHOOK] Error updating premium flag:", error);
            throw error;
          }
          console.log(`[WEBHOOK] ✅ Premium flag mis à jour pour user ${user_id}`);
        } else {
          const { error } = await supabaseClient
            .from("talent_profiles")
            .insert({
              user_id,
              is_premium: true,
              premium_unlocked_at: new Date().toISOString(),
              visa_status: "en_attente",
            });
          if (error) {
            console.error("[WEBHOOK] Error inserting premium talent profile:", error);
            throw error;
          }
          console.log(`[WEBHOOK] ✅ Nouveau profil premium créé pour user ${user_id}`);
        }

        // Send confirmation email for full (29€) tier
        if (payment_type === "deblocage_complet") {
          const customerEmail = session.customer_details?.email || session.customer_email;
          console.log(`[WEBHOOK] Pack ALTIS 29€ détecté – Email client: ${customerEmail || "N/A"}`);

          if (customerEmail) {
            const { data: talentData } = await supabaseClient
              .from("talent_profiles")
              .select("full_name")
              .eq("user_id", user_id)
              .maybeSingle();

            const talentName = talentData?.full_name || "Talent";
            const resendKey = Deno.env.get("RESEND_API_KEY");
            console.log(`[WEBHOOK] RESEND_API_KEY configurée: ${resendKey ? "OUI" : "NON"}`);

            if (resendKey) {
              await sendResendEmail(resendKey, customerEmail, talentName, supabaseClient, {
                user_id,
                session_id: session.id,
                talent_name: talentName,
                payment_type,
              });
            } else {
              console.warn("[WEBHOOK] ⚠️ RESEND_API_KEY non configurée, email non envoyé");
            }
          } else {
            console.warn("[WEBHOOK] ⚠️ Pas d'email client trouvé dans la session Stripe");
          }
        }
      }

      // ── Paiement lead (pas de user_id) ──
      if (payment_type === "analyse_complete_lead" && !user_id) {
        const customerEmail = session.customer_details?.email || session.customer_email;
        if (customerEmail) {
          await supabaseClient
            .from("leads")
            .update({ status: "premium_paid" })
            .eq("email_or_phone", customerEmail);
          console.log(`[WEBHOOK] Lead ${customerEmail} marked as premium_paid`);
        }
      }

      // ── Paiement success fee entreprise (offre) ──
      if (
        offer_id &&
        user_id &&
        payment_type !== "analyse_complete" &&
        payment_type !== "entreprise_premium"
      ) {
        const { error: updateError } = await supabaseClient
          .from("job_offers")
          .update({ status: "filled" })
          .eq("id", offer_id)
          .eq("company_id", user_id);
        if (updateError) {
          console.error("[WEBHOOK] Error updating offer status:", updateError);
          throw updateError;
        }
        console.log(`[WEBHOOK] Offer ${offer_id} marked as filled after payment`);
      }
    }

    // ── Handle subscription cancellation ──
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as any;
      console.log(`[WEBHOOK] Subscription ${subscription.id} canceled`);

      const stripe2 = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });
      const customer = await stripe2.customers.retrieve(subscription.customer);
      if (customer && !customer.deleted && customer.email) {
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
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
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
    console.error("[WEBHOOK] ❌ Erreur webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
