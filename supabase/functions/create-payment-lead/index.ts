import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_ID = "price_1T2hDLLLoCKfmmI1xOjgrx0l"; // Analyse Complète 10 €

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.json().catch(() => ({}));
    const { email, metier, rome_code, experience } = body as {
      email?: string;
      metier?: string;
      rome_code?: string;
      experience?: string;
    };

    const origin = req.headers.get("origin") || "https://axiom-altis-connect.lovable.app";

    // Build success URL with context so DashboardTalent can show the premium state
    const successParams = new URLSearchParams({
      premium: "true",
      session_id: "{CHECKOUT_SESSION_ID}",
      ...(rome_code ? { rome: rome_code } : {}),
      ...(experience ? { exp: experience } : {}),
    });

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/signup-light?${successParams.toString()}`,
      cancel_url: `${origin}/leads?canceled=true`,
      metadata: {
        payment_type: "analyse_complete_lead",
        metier: metier ?? "",
        rome_code: rome_code ?? "",
        experience: experience ?? "",
      },
    };

    // If email provided, pre-fill Stripe Checkout (no account needed)
    if (email && email.includes("@")) {
      // Check if Stripe customer already exists for this email
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        sessionParams.customer = customers.data[0].id;
      } else {
        sessionParams.customer_email = email;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-payment-lead error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
