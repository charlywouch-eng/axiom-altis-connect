import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FT_TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";

async function getToken(clientId: string, clientSecret: string): Promise<string | null> {
  const scopes = [
    "api_formationsv1 o2dsoffre",
    "api_formationsv1",
    "o2dsoffre",
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
        console.log(`Formations auth OK with scope: "${scope}"`);
        return data.access_token;
      }
    }
    const text = await res.text();
    console.log(`Formations scope "${scope}" failed [${res.status}]: ${text}`);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("FRANCE_TRAVAIL_CLIENT_ID");
    const clientSecret = Deno.env.get("FRANCE_TRAVAIL_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("France Travail credentials not configured");

    const { romeCode, region, count = 5 } = await req.json();
    if (!romeCode) {
      return new Response(JSON.stringify({ error: "romeCode is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getToken(clientId, clientSecret);

    // If token fails, return mock data for resilience
    if (!token) {
      console.log("Formations: auth failed, returning curated fallback data");
      const fallback = getFallbackFormations(romeCode);
      return new Response(JSON.stringify({ formations: fallback, source: "fallback" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try the Open Formation API
    const params = new URLSearchParams({
      codeRome: romeCode,
      nombre: String(Math.min(count, 10)),
    });
    if (region) params.set("codeRegion", region);

    const apiUrl = `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search`;
    // Alternative: catalog formations
    const formationsUrl = `https://labonneformation.francetravail.fr/api/v1/formations?romes=${romeCode}&limit=${Math.min(count, 10)}`;

    let formations: Array<Record<string, unknown>> = [];

    // Try La Bonne Formation API first
    try {
      const res = await fetch(formationsUrl, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : data.results || [];
        formations = results.slice(0, count).map((f: Record<string, unknown>) => ({
          id: f.id || crypto.randomUUID(),
          title: f.intitule || f.title || "Formation professionnelle",
          organism: f.organisme || f.organism || "Organisme certifié",
          city: f.ville || f.city || "",
          region: f.region || "",
          duration: f.duree || f.duration || "Variable",
          startDate: f.dateDebut || f.startDate || null,
          cpf: f.cpf ?? true,
          url: f.url || null,
          romeCode,
        }));
      }
    } catch (e) {
      console.log("La Bonne Formation API failed:", e);
    }

    // Fallback if no results
    if (formations.length === 0) {
      formations = getFallbackFormations(romeCode);
    }

    return new Response(JSON.stringify({ formations, source: formations[0]?.id?.toString().startsWith("fallback") ? "fallback" : "api" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Formations error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getFallbackFormations(romeCode: string): Array<Record<string, unknown>> {
  const prefix = romeCode?.charAt(0) || "F";
  const sectorFormations: Record<string, Array<Record<string, unknown>>> = {
    F: [
      { id: "fallback-1", title: "CQP Maçon du Bâtiment", organism: "AFPA", city: "Lyon", duration: "6 mois", cpf: true, romeCode, url: "https://www.afpa.fr" },
      { id: "fallback-2", title: "Titre Professionnel Coffreur Bancheur", organism: "Greta BTP", city: "Paris", duration: "8 mois", cpf: true, romeCode, url: "https://www.greta.fr" },
      { id: "fallback-3", title: "Habilitation Travaux en Hauteur", organism: "OPPBTP", city: "Marseille", duration: "5 jours", cpf: true, romeCode, url: "https://www.oppbtp.fr" },
    ],
    J: [
      { id: "fallback-1", title: "DEAS – Diplôme d'État d'Aide-Soignant", organism: "IFAS", city: "Paris", duration: "12 mois", cpf: true, romeCode, url: "https://www.ifas.fr" },
      { id: "fallback-2", title: "Formation Gestes et Soins d'Urgence (AFGSU)", organism: "CESU", city: "Lyon", duration: "3 jours", cpf: true, romeCode, url: null },
      { id: "fallback-3", title: "VAE Aide-Soignant", organism: "ANFH", city: "Bordeaux", duration: "Variable", cpf: true, romeCode, url: null },
    ],
    G: [
      { id: "fallback-1", title: "CAP Cuisine – Adultes", organism: "AFPA", city: "Paris", duration: "9 mois", cpf: true, romeCode, url: "https://www.afpa.fr" },
      { id: "fallback-2", title: "Certification HACCP Hygiène Alimentaire", organism: "CCI Formation", city: "Lyon", duration: "2 jours", cpf: true, romeCode, url: null },
      { id: "fallback-3", title: "Titre Pro Serveur en Restauration", organism: "Greta Hôtellerie", city: "Bordeaux", duration: "6 mois", cpf: true, romeCode, url: null },
    ],
    N: [
      { id: "fallback-1", title: "CACES R489 – Cariste", organism: "AFTRAL", city: "Paris", duration: "5 jours", cpf: true, romeCode, url: "https://www.aftral.com" },
      { id: "fallback-2", title: "Titre Pro Conducteur Routier", organism: "Promotrans", city: "Lyon", duration: "3 mois", cpf: true, romeCode, url: null },
    ],
    A: [
      { id: "fallback-1", title: "CQP Ouvrier Qualifié en Exploitation Agricole", organism: "CFPPA", city: "Tours", duration: "10 mois", cpf: true, romeCode, url: null },
      { id: "fallback-2", title: "Certiphyto – Utilisation des produits phyto", organism: "Chambre d'Agriculture", city: "Bordeaux", duration: "2 jours", cpf: true, romeCode, url: null },
    ],
    I: [
      { id: "fallback-1", title: "Titre Pro Technicien de Maintenance Industrielle", organism: "AFPA", city: "Lille", duration: "8 mois", cpf: true, romeCode, url: "https://www.afpa.fr" },
      { id: "fallback-2", title: "Habilitation Électrique BR/B2V", organism: "Apave", city: "Paris", duration: "3 jours", cpf: true, romeCode, url: "https://www.apave.com" },
    ],
  };

  return sectorFormations[prefix] || sectorFormations["F"];
}
