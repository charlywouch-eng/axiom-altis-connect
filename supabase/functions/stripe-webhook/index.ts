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

        // Send Pack ALTIS confirmation email for full (29€) tier
        if (payment_type === "deblocage_complet") {
          const customerEmail = session.customer_details?.email || session.customer_email;
          if (customerEmail) {
            // Fetch talent name for personalization
            const { data: talentData } = await supabaseClient
              .from("talent_profiles")
              .select("full_name")
              .eq("user_id", user_id)
              .maybeSingle();

            const { error: emailError } = await supabaseClient.functions.invoke("send-transactional-email", {
              body: {
                templateName: "pack-altis-confirmation",
                recipientEmail: customerEmail,
                idempotencyKey: `pack-altis-confirm-${session.id}`,
                templateData: { name: talentData?.full_name || undefined },
              },
            });
            if (emailError) {
              console.error("Failed to send Pack ALTIS confirmation email:", emailError);
            } else {
              console.log(`Pack ALTIS confirmation email queued for ${customerEmail}`);
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
