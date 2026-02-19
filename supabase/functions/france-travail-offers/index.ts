import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FT_TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const FT_OFFERS_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";

async function getFranceTravailToken(clientId: string, clientSecret: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "api_offresdemploiv2 o2dsoffre",
  });

  const response = await fetch(FT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`France Travail auth failed [${response.status}]: ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("FRANCE_TRAVAIL_CLIENT_ID");
    if (!clientId) throw new Error("FRANCE_TRAVAIL_CLIENT_ID is not configured");

    const clientSecret = Deno.env.get("FRANCE_TRAVAIL_CLIENT_SECRET");
    if (!clientSecret) throw new Error("FRANCE_TRAVAIL_CLIENT_SECRET is not configured");

    // Parse query params from request body
    const { romeCode, keywords, location, distance = 50, count = 5 } = await req.json();

    if (!romeCode) {
      return new Response(
        JSON.stringify({ error: "romeCode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OAuth2 token
    const token = await getFranceTravailToken(clientId, clientSecret);

    // Build search params
    const params = new URLSearchParams({
      codeROME: romeCode,
      nombreResultats: String(Math.min(count, 15)),
      distance: String(distance),
    });

    if (keywords) params.set("motsCles", keywords);
    if (location) params.set("commune", location);

    // Search offers
    const offersResponse = await fetch(`${FT_OFFERS_URL}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!offersResponse.ok) {
      const text = await offersResponse.text();
      throw new Error(`France Travail API error [${offersResponse.status}]: ${text}`);
    }

    const offersData = await offersResponse.json();
    const rawOffers = offersData.resultats || [];

    // Normalize offers to our format
    const offers = rawOffers.map((o: Record<string, unknown>) => {
      const lieu = o.lieuTravail as Record<string, unknown> | undefined;
      const salaire = o.salaire as Record<string, unknown> | undefined;
      const competences = (o.competences as Array<Record<string, unknown>> | undefined) || [];
      const qualifications = (o.qualificationLibelle as string | undefined) || "";
      
      return {
        id: o.id as string,
        title: o.intitule as string,
        company: (o.entreprise as Record<string, unknown> | undefined)?.nom || "Entreprise non communiquée",
        location: lieu?.libelle as string || "",
        contract: (o.typeContratLibelle as string) || (o.typeContrat as string) || "CDI",
        codeRome: romeCode,
        salary: salaire?.libelle as string || null,
        description: (o.description as string || "").slice(0, 300),
        skills: competences.slice(0, 4).map((c) => c.libelle as string),
        qualification: qualifications,
        dateCreation: o.dateCreation as string || null,
        url: o.origineOffre
          ? (o.origineOffre as Record<string, unknown>).urlOrigine as string
          : `https://candidat.francetravail.fr/offres/recherche/detail/${o.id}`,
      };
    });

    return new Response(JSON.stringify({ offers, total: offersData.totalResults || offers.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("France Travail error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
