import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfText } = await req.json();

    if (!pdfText || typeof pdfText !== "string" || pdfText.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Le contenu du PDF est vide ou invalide." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un assistant spécialisé dans l'extraction de profils de talents à partir de documents PDF.
Tu dois extraire les profils de talents et retourner les données structurées.
Chaque profil doit contenir : full_name, country, french_level, experience_years (nombre), skills (tableau de compétences), score (nombre entre 0 et 100).
Si une information est manquante, utilise une valeur par défaut raisonnable (pays vide, niveau français "non spécifié", 0 ans d'expérience, tableau vide, score 50).
Retourne UNIQUEMENT les profils trouvés via l'outil fourni.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extrais tous les profils de talents du document suivant :\n\n${pdfText.substring(0, 30000)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_talent_profiles",
              description: "Retourne les profils de talents extraits du document PDF.",
              parameters: {
                type: "object",
                properties: {
                  profiles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        full_name: { type: "string", description: "Nom complet du talent" },
                        country: { type: "string", description: "Pays d'origine ou de résidence" },
                        french_level: { type: "string", description: "Niveau de français (A1, A2, B1, B2, C1, C2, natif)" },
                        experience_years: { type: "number", description: "Années d'expérience" },
                        skills: { type: "array", items: { type: "string" }, description: "Liste des compétences" },
                        score: { type: "number", description: "Score du talent entre 0 et 100" },
                      },
                      required: ["full_name", "country", "french_level", "experience_years", "skills", "score"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["profiles"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_talent_profiles" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Trop de requêtes. Veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Crédits IA insuffisants. Veuillez ajouter des crédits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur lors de l'extraction IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ success: false, error: "Aucun profil de talent n'a pu être extrait du document.", profiles: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const profiles = parsed.profiles || [];

    console.log(`Extracted ${profiles.length} profiles from PDF`);

    return new Response(
      JSON.stringify({ success: true, profiles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-pdf-talents error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
