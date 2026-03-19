import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FT_TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";

const MDT_BASE_URL =
  "https://api.francetravail.io/partenaire/infotravail/v1";

async function getToken(
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  const scopes = [
    "api_infotravailv1",
    "api_infotravailv1 o2dsoffre",
    "api_marchedutravailv1",
    "api_marchedutravailv1 o2dsoffre",
  ];

  for (const scope of scopes) {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    });
    const res = await fetch(FT_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        console.log(`MDT auth OK — scope: "${scope}"`);
        return data.access_token;
      }
    }
    const text = await res.text();
    console.log(`MDT scope "${scope}" failed [${res.status}]: ${text}`);
  }

  console.warn("Marché du travail: all scope combinations failed — returning empty.");
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("FRANCE_TRAVAIL_CLIENT_ID");
    if (!clientId) throw new Error("FRANCE_TRAVAIL_CLIENT_ID not configured");

    const clientSecret = Deno.env.get("FRANCE_TRAVAIL_CLIENT_SECRET");
    if (!clientSecret) throw new Error("FRANCE_TRAVAIL_CLIENT_SECRET not configured");

    const body = await req.json().catch(() => ({}));
    const { codeRome, codeDepartement, codeRegion } = body;

    const token = await getToken(clientId, clientSecret);

    if (!token) {
      return new Response(
        JSON.stringify({ tensions: [], salaires: [], bmo: null, source: "unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const authHeader = { Authorization: `Bearer ${token}`, Accept: "application/json" };

    // Build parallel requests for tensions, salaires, and BMO data
    const requests: Promise<Response>[] = [];
    const requestLabels: string[] = [];

    // 1. Tensions métier
    if (codeRome) {
      const tensionParams = new URLSearchParams();
      tensionParams.set("codeRome", codeRome);
      if (codeDepartement) tensionParams.set("codeDepartement", codeDepartement);
      requests.push(
        fetch(`${MDT_BASE_URL}/metier/${codeRome}/tension?${tensionParams}`, { headers: authHeader }),
      );
      requestLabels.push("tension");
    }

    // 2. Salaires
    if (codeRome) {
      const salaireParams = new URLSearchParams({ codeRome });
      if (codeDepartement) salaireParams.set("codeDepartement", codeDepartement);
      requests.push(
        fetch(`${MDT_BASE_URL}/metier/${codeRome}/salaire?${salaireParams}`, { headers: authHeader }),
      );
      requestLabels.push("salaire");
    }

    // 3. BMO (Besoins en Main d'Oeuvre)
    if (codeRome) {
      const bmoParams = new URLSearchParams({ codeRome });
      if (codeRegion) bmoParams.set("codeRegion", codeRegion);
      requests.push(
        fetch(`${MDT_BASE_URL}/metier/${codeRome}/bmo?${bmoParams}`, { headers: authHeader }),
      );
      requestLabels.push("bmo");
    }

    if (requests.length === 0) {
      return new Response(
        JSON.stringify({ error: "codeRome is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const responses = await Promise.allSettled(requests);

    const result: Record<string, unknown> = {
      tensions: [],
      salaires: [],
      bmo: null,
      source: "france_travail",
    };

    for (let i = 0; i < responses.length; i++) {
      const label = requestLabels[i];
      const settled = responses[i];

      if (settled.status === "rejected") {
        console.warn(`MDT ${label} rejected:`, settled.reason);
        continue;
      }

      const res = settled.value;
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`MDT ${label} [${res.status}]: ${errText}`);
        continue;
      }

      const data = await res.json();

      if (label === "tension") {
        result.tensions = Array.isArray(data) ? data : data.tensions || data.resultats || [data];
      } else if (label === "salaire") {
        result.salaires = Array.isArray(data) ? data : data.salaires || data.resultats || [data];
      } else if (label === "bmo") {
        result.bmo = data;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Marché du travail error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
