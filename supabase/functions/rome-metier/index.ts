import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FT_TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const ROME_BASE_URL = "https://api.francetravail.io/partenaire/rome/v1";

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  const scopes = [
    "api_romev1 o2dsoffre",
    "api_romev1",
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
        console.log(`ROME auth OK with scope: "${scope}"`);
        return data.access_token;
      }
    }
    const text = await res.text();
    console.warn(`ROME scope "${scope}" failed [${res.status}]: ${text}`);
  }
  throw new Error(
    "Code ROME API: auth failed. Ensure 'Référentiel ROME v1' is subscribed on francetravail.io."
  );
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

    const { romeCode } = await req.json();
    if (!romeCode) {
      return new Response(
        JSON.stringify({ error: "romeCode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = await getToken(clientId, clientSecret);
    const authHeader = { Authorization: `Bearer ${token}`, Accept: "application/json" };

    // Fetch all data in parallel: metier details + formations + debouches + environnements
    const [metierRes, formationsRes, debouchesRes, competencesRes] = await Promise.all([
      fetch(`${ROME_BASE_URL}/metier/${romeCode}`, { headers: authHeader }),
      fetch(`${ROME_BASE_URL}/metier/${romeCode}/formation`, { headers: authHeader }),
      fetch(`${ROME_BASE_URL}/metier/${romeCode}/metierTransverse`, { headers: authHeader }),
      fetch(`${ROME_BASE_URL}/metier/${romeCode}/competence`, { headers: authHeader }),
    ]);

    // Parse metier
    let metierData: Record<string, unknown> = {};
    if (metierRes.ok) {
      metierData = await metierRes.json();
    } else {
      const errText = await metierRes.text();
      console.warn(`ROME metier [${metierRes.status}]: ${errText}`);
    }

    // Parse formations
    let formationsData: unknown[] = [];
    if (formationsRes.ok) {
      const fd = await formationsRes.json();
      formationsData = Array.isArray(fd) ? fd : (fd.listeFormation || []);
    } else {
      await formationsRes.text();
    }

    // Parse debouches / métiers transverses
    let debouchesData: unknown[] = [];
    if (debouchesRes.ok) {
      const dd = await debouchesRes.json();
      debouchesData = Array.isArray(dd) ? dd : (dd.listeMetierTransverse || []);
    } else {
      await debouchesRes.text();
    }

    // Parse competences officielles
    let competencesData: unknown[] = [];
    if (competencesRes.ok) {
      const cd = await competencesRes.json();
      competencesData = Array.isArray(cd) ? cd : (cd.listeCompetence || cd.listeCompetenceGenerale || []);
    } else {
      await competencesRes.text();
    }

    // Normalize the response
    const result = {
      code: romeCode,
      label: (metierData.libelle as string) || (metierData.intitule as string) || "",
      definition: (metierData.definition as string) || (metierData.description as string) || "",
      accessCondition: (metierData.conditionAcces as string) || "",
      environments: ((metierData.listeEnvironnementTravail as Array<{ libelle?: string; code?: string }>) || [])
        .map((e) => e.libelle || e.code || "")
        .filter(Boolean)
        .slice(0, 8),
      competences: (competencesData as Array<{ libelle?: string; code?: string }>)
        .map((c) => c.libelle || c.code || "")
        .filter(Boolean)
        .slice(0, 12),
      formations: (formationsData as Array<{ libelle?: string; niveau?: string; code?: string }>)
        .map((f) => ({
          label: f.libelle || f.code || "",
          niveau: f.niveau || "",
        }))
        .filter((f) => f.label)
        .slice(0, 8),
      debouches: (debouchesData as Array<{ libelle?: string; code?: string; codeRome?: string }>)
        .map((d) => ({
          label: d.libelle || d.code || "",
          code: d.codeRome || d.code || "",
        }))
        .filter((d) => d.label)
        .slice(0, 6),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("ROME Métier error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
