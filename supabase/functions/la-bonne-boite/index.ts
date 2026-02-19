import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LBB_API_URL = "https://api.francetravail.io/partenaire/labonneboite/v1/company/";

const FT_TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";

async function getFranceTravailToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const scopes = ["api_labonneboitev1", "api_labonneboitev1 o2dsoffre"];

  console.log(`LBB auth attempt — clientId prefix: ${clientId.substring(0, 8)}...`);

  for (const scope of scopes) {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    });

    const response = await fetch(FT_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.access_token) {
        console.log(`LBB auth OK — scope: "${scope}"`);
        return data.access_token;
      }
    }
    const text = await response.text();
    console.log(`LBB scope "${scope}" failed [${response.status}]: ${text}`);
  }

  throw new Error(
    "La Bonne Boite: all scope combinations failed. Check credentials on francetravail.io."
  );
}

// ROME codes for BTP / Santé / CHR sectors
const SECTOR_ROME_CODES: Record<string, string[]> = {
  BTP: ["F1703", "F1602", "F1603", "F1701", "F1702"],
  Santé: ["J1501", "J1502", "J1303", "J1502"],
  CHR: ["G1602", "G1603", "G1201", "G1404"],
  Logistique: ["N1101", "N1103", "N1105", "N4101"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("FRANCE_TRAVAIL_CLIENT_ID");
    if (!clientId) throw new Error("FRANCE_TRAVAIL_CLIENT_ID is not configured");

    const clientSecret = Deno.env.get("FRANCE_TRAVAIL_CLIENT_SECRET");
    if (!clientSecret) throw new Error("FRANCE_TRAVAIL_CLIENT_SECRET is not configured");

    const body = await req.json().catch(() => ({}));
    const {
      rome_codes,
      latitude = "48.8566",
      longitude = "2.3522",
      distance = 30,
      count = 9,
      sectors = ["BTP", "Santé", "CHR"],
    } = body;

    // Build the list of ROME codes from sectors or use provided ones
    let romesToSearch: string[] = rome_codes || [];
    if (romesToSearch.length === 0) {
      for (const sector of sectors) {
        const codes = SECTOR_ROME_CODES[sector] || [];
        romesToSearch.push(...codes.slice(0, 2)); // max 2 per sector
      }
    }
    // Deduplicate
    romesToSearch = [...new Set(romesToSearch)].slice(0, 6);

    if (romesToSearch.length === 0) {
      return new Response(
        JSON.stringify({ error: "No ROME codes provided or resolved" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OAuth2 token
    const token = await getFranceTravailToken(clientId, clientSecret);

    // Query LBB for each ROME code and aggregate results
    const allCompanies: Record<string, unknown>[] = [];

    const fetchPromises = romesToSearch.map(async (romeCode) => {
      const params = new URLSearchParams({
        rome_codes: romeCode,
        latitude,
        longitude,
        distance: String(distance),
        from: "1",
        to: String(Math.ceil(count / romesToSearch.length) + 2),
      });

      const res = await fetch(`${LBB_API_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`LBB ROME ${romeCode} failed [${res.status}]: ${errText}`);
        return [];
      }

      const data = await res.json();
      return (data.companies || []) as Record<string, unknown>[];
    });

    const results = await Promise.all(fetchPromises);
    for (const companies of results) {
      allCompanies.push(...companies);
    }

    // Determine sector for each company based on ROME code
    const getRomeSector = (romeCode: string): string => {
      for (const [sector, codes] of Object.entries(SECTOR_ROME_CODES)) {
        if (codes.includes(romeCode)) return sector;
      }
      return "Autre";
    };

    // Normalize + deduplicate by SIRET
    const seenSirets = new Set<string>();
    const normalized = allCompanies
      .filter((c) => {
        const siret = c.siret as string;
        if (!siret || seenSirets.has(siret)) return false;
        seenSirets.add(siret);
        return true;
      })
      .slice(0, count)
      .map((c) => {
        const romeCode = (c.matched_rome_code || c.rome_code || "") as string;
        return {
          siret: c.siret as string,
          name: (c.name as string) || "Entreprise",
          sector: getRomeSector(romeCode),
          romeCode,
          romeLabel: (c.matched_rome_label || c.rome_label || "") as string,
          city: (c.city as string) || "",
          zipCode: (c.zip_code as string) || "",
          hiringPotential: (c.stars as number) ?? 0, // 0-5 stars (hiring probability)
          nafLabel: (c.naf_text as string) || "",
          url: c.url
            ? (c.url as string)
            : `https://labonneboite.francetravail.fr/entreprises/${c.siret}`,
          headcount: (c.headcount_text as string) || null,
          distance: (c.distance as number) ?? null,
        };
      });

    // Sort by hiring potential desc
    normalized.sort((a, b) => b.hiringPotential - a.hiringPotential);

    return new Response(
      JSON.stringify({ companies: normalized, total: normalized.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("La Bonne Boite error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
