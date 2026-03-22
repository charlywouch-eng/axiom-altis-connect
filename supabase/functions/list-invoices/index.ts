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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ invoices: [], payments: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ invoices: [], payments: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;

    // Fetch invoices (subscription-based)
    const stripeInvoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50,
    });

    const invoices = stripeInvoices.data.map((inv) => ({
      id: inv.number || inv.id,
      date: new Date(inv.created * 1000).toISOString(),
      description: inv.lines.data.map((l) => l.description || "Abonnement").join(", ") || "Facture",
      amount: (inv.amount_paid ?? inv.total ?? 0) / 100,
      status: inv.status === "paid" ? "paid" : inv.status === "open" ? "pending" : inv.status || "unknown",
      pdf_url: inv.invoice_pdf || null,
      hosted_url: inv.hosted_invoice_url || null,
    }));

    // Fetch one-time payments (checkout sessions)
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 50,
    });

    const payments = paymentIntents.data
      .filter((pi) => pi.status === "succeeded")
      .map((pi) => ({
        id: pi.id.slice(-8).toUpperCase(),
        date: new Date(pi.created * 1000).toISOString(),
        description: pi.description || pi.metadata?.offer_id
          ? `Success Fee – Offre ${pi.metadata?.offer_id?.slice(0, 8) || ""}`
          : "Paiement unique",
        amount: pi.amount / 100,
        status: "paid" as const,
        receipt_url: pi.latest_charge
          ? null // Will be populated below
          : null,
      }));

    // Get receipt URLs for payments
    for (const payment of payments) {
      const matchingPi = paymentIntents.data.find(
        (pi) => pi.id.slice(-8).toUpperCase() === payment.id
      );
      if (matchingPi?.latest_charge && typeof matchingPi.latest_charge === "string") {
        try {
          const charge = await stripe.charges.retrieve(matchingPi.latest_charge);
          payment.receipt_url = charge.receipt_url || null;
        } catch {
          // Ignore charge retrieval errors
        }
      }
    }

    return new Response(JSON.stringify({ invoices, payments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
