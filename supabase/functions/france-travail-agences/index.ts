import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FT_TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const AGENCES_URL = "https://api.francetravail.io/partenaire/infotravail/v1/agences";

async function getToken(clientId: string, clientSecret: string): Promise<string | null> {
  // Try multiple scope variations — France Travail scope naming varies by API
  const scopes = [
    "api_infotravailv1",
    "api_referentielagencesv1",
    "infotravail",
    "api_offresdemploiv2 o2dsoffre",
    "o2dsoffre",
  ];

  for (const scope of scopes) {
    try {
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
          console.log(`Agences auth OK with scope: "${scope}"`);
          return data.access_token;
        }
      }
      const text = await res.text();
      console.log(`Agences scope "${scope}" failed [${res.status}]: ${text}`);
    } catch (e) {
      console.log(`Agences scope "${scope}" error:`, e);
    }
  }
  return null;
}

async function tryAgencesAPI(token: string, params: URLSearchParams, count: number): Promise<{ agences: Array<Record<string, unknown>>; source: string } | null> {
  const url = params.toString() ? `${AGENCES_URL}?${params.toString()}` : AGENCES_URL;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.log(`Agences API error [${res.status}]: ${text}`);
    return null;
  }

  const rawData = await res.json();
  const rawAgences = Array.isArray(rawData) ? rawData : rawData.agences || rawData.results || [];

  const agences = rawAgences.slice(0, count).map((a: Record<string, unknown>) => {
    const adresse = a.adresse as Record<string, unknown> | undefined;
    const contact = a.contact as Record<string, unknown> | undefined;
    const horaires = a.horaires as Array<Record<string, unknown>> | undefined;

    return {
      id: a.code || a.id || crypto.randomUUID(),
      name: (a.libelle as string) || (a.libelleEtendu as string) || "Agence France Travail",
      type: (a.type as string) || "APE",
      address: adresse
        ? `${adresse.ligne4 || adresse.ligne || ""}, ${adresse.codePostal || ""} ${adresse.commune || adresse.localite || ""}`
        : "",
      city: (adresse?.commune as string) || (adresse?.localite as string) || "",
      postalCode: (adresse?.codePostal as string) || "",
      phone: (contact?.telephonePublic as string) || (contact?.telephone as string) || null,
      email: (contact?.email as string) || null,
      schedules: horaires?.map((h: Record<string, unknown>) => ({
        day: h.jour as string,
        hours: h.horaire as string || `${h.ouverture || ""} - ${h.fermeture || ""}`,
      })) || null,
      services: (a.siret as string) ? ["Inscription", "Accompagnement", "Formation"] : ["Accompagnement"],
    };
  });

  return { agences, source: "api" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("FRANCE_TRAVAIL_CLIENT_ID");
    const clientSecret = Deno.env.get("FRANCE_TRAVAIL_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("France Travail credentials not configured");

    const { commune, codePostal, codeDepartement, count = 5 } = await req.json();

    // Build search params
    const params = new URLSearchParams();
    if (commune) params.set("commune", commune);
    if (codePostal) params.set("codePostal", codePostal);
    if (codeDepartement) params.set("codeDepartement", codeDepartement);

    const token = await getToken(clientId, clientSecret);

    if (token) {
      const result = await tryAgencesAPI(token, params, count);
      if (result && result.agences.length > 0) {
        return new Response(JSON.stringify({ ...result, total: result.agences.length }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log("Agences: using fallback data");
    return new Response(JSON.stringify({ agences: getFallbackAgences(), source: "fallback" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Agences error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getFallbackAgences(): Array<Record<string, unknown>> {
  return [
    {
      id: "ft-paris-19",
      name: "France Travail Paris 19ème – Crimée",
      type: "APE",
      address: "27 Rue de Crimée, 75019 Paris",
      city: "Paris",
      postalCode: "75019",
      phone: "3949",
      email: null,
      services: ["Inscription", "Accompagnement", "Formation", "Aide à la mobilité"],
    },
    {
      id: "ft-lyon-3",
      name: "France Travail Lyon Part-Dieu",
      type: "APE",
      address: "55 Rue de la Villette, 69003 Lyon",
      city: "Lyon",
      postalCode: "69003",
      phone: "3949",
      email: null,
      services: ["Inscription", "Accompagnement", "Formation"],
    },
    {
      id: "ft-marseille-1",
      name: "France Travail Marseille Joliette",
      type: "APE",
      address: "35 Boulevard de la Joliette, 13002 Marseille",
      city: "Marseille",
      postalCode: "13002",
      phone: "3949",
      email: null,
      services: ["Inscription", "Accompagnement", "Formation"],
    },
    {
      id: "ft-bordeaux",
      name: "France Travail Bordeaux Mériadeck",
      type: "APE",
      address: "1 Terrasse Front du Médoc, 33000 Bordeaux",
      city: "Bordeaux",
      postalCode: "33000",
      phone: "3949",
      email: null,
      services: ["Inscription", "Accompagnement"],
    },
  ];
}
