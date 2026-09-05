import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { corsHeadersFor, safeRedirectOrigin } from "../_shared/cors.ts";

const PRICES: Record<string, { id: string; payment_type: string }> = {
  test: { id: "price_1TAcRuLLoCKfmmI1JCKUqUey", payment_type: "analyse_complete_lead" },
  full: { id: "price_1TAcSgLLoCKfmmI1jy4TZp8h", payment_type: "deblocage_complet_lead" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeadersFor(req) });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.json().catch(() => ({}));
    const { email, metier, rome_code, experience, source, tier } = body as {
      email?: string;
      metier?: string;
      rome_code?: string;
      experience?: string;
      source?: string;
      tier?: string;
    };

    const priceConfig = PRICES[tier === "full" ? "full" : "test"];

    // SECURITY (2026-09-05 audit): the Origin header used to be interpolated
    // directly into Stripe's success_url/cancel_url. A caller could set an
    // arbitrary Origin and have Stripe redirect a paying customer to an
    // attacker-controlled domain right after checkout. Only ever build these
    // URLs from a known-good origin (same allowlist as CORS, above).
    const origin = safeRedirectOrigin(req);

    // Build success URL with context so DashboardTalent can show the premium state
    // Compute score to forward in success URL
    const BASE_SCORES: Record<string, number> = {
      F1703: 88, J1501: 86, N4101: 83, G1602: 79,
      I1304: 77, G1703: 76, D1212: 71, A1401: 73, M1607: 74, A1414: 73, M1805: 72, D1502: 71,
    };
    const EXP_BONUS: Record<string, number> = { "0-2": 0, "2-5": 4, "5-10": 7, "10+": 10 };
    const computedScore = Math.min(95, (BASE_SCORES[rome_code ?? ""] ?? 75) + (EXP_BONUS[experience ?? ""] ?? 0));

    const successParams = new URLSearchParams({
      premium: "true",
      session_id: "{CHECKOUT_SESSION_ID}",
      ...(rome_code ? { rome: rome_code } : {}),
      ...(experience ? { exp: experience } : {}),
      score: String(computedScore),
      ...(tier === "full" ? { tier: "full" } : {}),
    });

    const cancelPage = source === "signup-light" ? "/signup-light" : "/leads";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: priceConfig.id, quantity: 1 }],
      mode: "payment",
      success_url: tier === "full"
        ? `${origin}/pack-altis-success?session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/payment-success?${successParams.toString()}`,
      cancel_url: `${origin}${cancelPage}?canceled=true`,
      metadata: {
        payment_type: priceConfig.payment_type,
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
      headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-payment-lead error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
