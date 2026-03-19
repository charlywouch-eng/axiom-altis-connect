import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, text, context } = await req.json();

    let systemPrompt: string;
    let userPrompt: string;

    if (action === "translate") {
      systemPrompt = "Tu es un traducteur professionnel. Traduis le texte suivant. Si le texte est en français, traduis-le en anglais. Si le texte est dans une autre langue, traduis-le en français. Retourne UNIQUEMENT la traduction, sans explication.";
      userPrompt = text;
    } else if (action === "suggest") {
      systemPrompt = `Tu es un assistant de messagerie professionnelle pour une plateforme de recrutement international (AXIOM). Génère exactement 3 réponses rapides courtes et professionnelles (max 15 mots chacune) au dernier message reçu. Le contexte est le recrutement de talents internationaux. Retourne les 3 suggestions séparées par "|||" sans numérotation ni puces.`;
      userPrompt = `Dernier message reçu: "${text}"${context ? `\nContexte de la conversation: ${context}` : ""}`;
    } else {
      return new Response(JSON.stringify({ error: "Action inconnue" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques secondes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error(`AI gateway error ${status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    if (action === "translate") {
      return new Response(JSON.stringify({ translation: result.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const suggestions = result.split("|||").map((s: string) => s.trim()).filter(Boolean).slice(0, 3);
      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("chat-ai-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
