import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FT_TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";

// ROME 4.0 API endpoints
const ROME4_BASE = "https://api.francetravail.io/partenaire/rome/v4";
// Fallback to v1 if v4 not available
const ROME1_BASE = "https://api.francetravail.io/partenaire/rome/v1";

async function getToken(
  clientId: string,
  clientSecret: string,
): Promise<{ token: string; version: "v4" | "v1" } | null> {
  // Try ROME 4.0 first, then fallback to v1
  const scopeSets: Array<{ scopes: string[]; version: "v4" | "v1" }> = [
    { scopes: ["api_rome40v1", "api_rome40v1 o2dsoffre"], version: "v4" },
    { scopes: ["api_romev1", "api_romev1 o2dsoffre"], version: "v1" },
  ];

  for (const { scopes, version } of scopeSets) {
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
          console.log(`Compétences auth OK — scope: "${scope}" (${version})`);
          return { token: data.access_token, version };
        }
      }
      const text = await res.text();
      console.log(`Compétences scope "${scope}" failed [${res.status}]: ${text}`);
    }
  }

  console.warn("Compétences ROME: all scope combinations failed.");
  return null;
}

interface CompetenceResult {
  code: string;
  label: string;
  type?: string;
  domain?: string;
  level?: string;
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
    const { romeCode, skills } = body;

    if (!romeCode && !skills) {
      return new Response(
        JSON.stringify({ error: "romeCode or skills array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const auth = await getToken(clientId, clientSecret);

    if (!auth) {
      return new Response(
        JSON.stringify({ competences: [], matchScore: null, source: "unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const { token, version } = auth;
    const baseUrl = version === "v4" ? ROME4_BASE : ROME1_BASE;
    const authHeader = { Authorization: `Bearer ${token}`, Accept: "application/json" };

    const result: Record<string, unknown> = {
      competences: [],
      savoirEtre: [],
      savoirFaire: [],
      contextes: [],
      matchScore: null,
      source: `rome_${version}`,
    };

    if (romeCode) {
      // Fetch competences for the ROME code
      const [compRes, savoirRes] = await Promise.allSettled([
        fetch(`${baseUrl}/metier/${romeCode}/competence`, { headers: authHeader }),
        fetch(`${baseUrl}/metier/${romeCode}`, { headers: authHeader }),
      ]);

      // Parse competences
      if (compRes.status === "fulfilled" && compRes.value.ok) {
        const data = await compRes.value.json();
        const rawComps = Array.isArray(data)
          ? data
          : data.listeCompetence || data.listeCompetenceGenerale || data.competences || [];

        const competences: CompetenceResult[] = rawComps.map(
          (c: Record<string, unknown>) => ({
            code: (c.code as string) || "",
            label: (c.libelle as string) || (c.label as string) || "",
            type: (c.typeCompetence as string) || (c.type as string) || "competence",
            domain: (c.domaine as string) || (c.enjeu as string) || "",
          }),
        );
        result.competences = competences;

        // Separate savoir-faire and savoir-être
        result.savoirFaire = competences.filter(
          (c) => c.type === "SAVOIR_FAIRE" || c.type === "savoir_faire",
        );
        result.savoirEtre = competences.filter(
          (c) => c.type === "SAVOIR_ETRE_PROFESSIONNEL" || c.type === "savoir_etre",
        );
      } else {
        const errText =
          compRes.status === "fulfilled" ? await compRes.value.text() : "rejected";
        console.warn(`Competences fetch failed: ${errText}`);
      }

      // Parse contextes de travail from metier data
      if (savoirRes.status === "fulfilled" && savoirRes.value.ok) {
        const metierData = await savoirRes.value.json();
        const contextes =
          (metierData.listeContexteTravail as Array<{ libelle?: string }>) ||
          (metierData.listeEnvironnementTravail as Array<{ libelle?: string }>) ||
          [];
        result.contextes = contextes
          .map((c) => c.libelle || "")
          .filter(Boolean)
          .slice(0, 10);
      } else if (savoirRes.status === "fulfilled") {
        await savoirRes.value.text();
      }

      // If skills provided, compute match score against ROME competences
      if (skills && Array.isArray(skills) && skills.length > 0) {
        const romeLabels = (result.competences as CompetenceResult[]).map((c) =>
          c.label.toLowerCase(),
        );
        const matchCount = skills.filter((s: string) =>
          romeLabels.some(
            (rl) =>
              rl.includes(s.toLowerCase()) || s.toLowerCase().includes(rl),
          ),
        ).length;

        const totalRequired = Math.max(romeLabels.length, 1);
        result.matchScore = Math.round((matchCount / Math.min(totalRequired, skills.length || 1)) * 100);
        result.matchedSkills = skills.filter((s: string) =>
          romeLabels.some(
            (rl) =>
              rl.includes(s.toLowerCase()) || s.toLowerCase().includes(rl),
          ),
        );
        result.missingSkills = skills.filter(
          (s: string) =>
            !romeLabels.some(
              (rl) =>
                rl.includes(s.toLowerCase()) || s.toLowerCase().includes(rl),
            ),
        );
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Compétences ROME error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
