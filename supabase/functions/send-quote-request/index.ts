import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-QUOTE-REQUEST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { email: user.email });

    const body = await req.json();
    const { company, sector, volume, message } = body;

    if (!company || !sector) {
      throw new Error("Champs obligatoires manquants (entreprise, secteur)");
    }

    logStep("Quote request received", { company, sector, volume, message });

    // Store the quote request for admin tracking
    // We'll use a simple approach: log it and notify via Supabase
    // In production, integrate with an email service like Resend

    const quoteData = {
      user_email: user.email,
      user_id: user.id,
      company,
      sector,
      volume: volume || "Non précisé",
      message: message || "",
      formula: "Success Fee – 25% du brut annuel",
      requested_at: new Date().toISOString(),
    };

    logStep("Quote data compiled", quoteData);

    // For now, we log the request. The admin can see it in the edge function logs.
    // TODO: Connect to Resend or another email provider for actual email delivery.
    console.log(`[QUOTE REQUEST] New quote from ${user.email}:`, JSON.stringify(quoteData, null, 2));

    return new Response(
      JSON.stringify({ success: true, message: "Demande de devis envoyée avec succès." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
