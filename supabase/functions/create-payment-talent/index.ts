import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICES: Record<string, { id: string; payment_type: string }> = {
  test: {
    id: "price_1TAcRuLLoCKfmmI1JCKUqUey",   // Test Éligibilité 4,99 €
    payment_type: "analyse_complete",
  },
  full: {
    id: "price_1TAcSgLLoCKfmmI1jy4TZp8h",   // Déblocage Complet 29 €
    payment_type: "deblocage_complet",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    if (!userEmail) throw new Error("User email not available");

    // Parse tier from body (default: "test" for backward compat)
    let tier = "test";
    try {
      const body = await req.json();
      if (body?.tier === "full") tier = "full";
    } catch {
      // no body → default to test
    }

    const priceConfig = PRICES[tier];

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://axiom-altis-connect.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: priceConfig.id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/dashboard-talent?payment=success&tier=${tier}`,
      cancel_url: `${origin}/dashboard-talent?payment=cancel`,
      metadata: {
        user_id: userId,
        payment_type: priceConfig.payment_type,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
