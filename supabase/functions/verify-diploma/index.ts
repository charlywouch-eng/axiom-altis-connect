import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Static MINFOP institution database (Cameroon)
const MINFOP_INSTITUTIONS = [
  "université de yaoundé", "université de douala", "université de dschang",
  "université de buea", "université de bamenda", "université de maroua",
  "université de ngaoundéré", "école nationale supérieure polytechnique",
  "ensp", "esstic", "ens", "iut", "faculté de médecine",
  "institut supérieur de technologie", "école normale supérieure",
  "minfop", "minefop", "minesup", "minfog",
];

// ROME code mapping for common fields
const ROME_MAPPING: Record<string, { code: string; label: string }> = {
  "informatique": { code: "M1805", label: "Développement informatique" },
  "développement": { code: "M1805", label: "Développement informatique" },
  "programmation": { code: "M1805", label: "Développement informatique" },
  "logiciel": { code: "M1805", label: "Développement informatique" },
  "réseau": { code: "M1801", label: "Administration systèmes & réseaux" },
  "système": { code: "M1801", label: "Administration systèmes & réseaux" },
  "infirmier": { code: "J1506", label: "Soins infirmiers" },
  "infirmière": { code: "J1506", label: "Soins infirmiers" },
  "soins": { code: "J1506", label: "Soins infirmiers" },
  "médecine": { code: "J1102", label: "Médecine" },
  "pharmacie": { code: "J1202", label: "Pharmacie" },
  "génie civil": { code: "F1106", label: "Ingénierie & études BTP" },
  "bâtiment": { code: "F1106", label: "Ingénierie & études BTP" },
  "construction": { code: "F1106", label: "Ingénierie & études BTP" },
  "btp": { code: "F1106", label: "Ingénierie & études BTP" },
  "logistique": { code: "N1301", label: "Logistique" },
  "transport": { code: "N1301", label: "Logistique" },
  "supply chain": { code: "N1301", label: "Logistique" },
  "comptabilité": { code: "M1203", label: "Comptabilité" },
  "gestion": { code: "M1205", label: "Direction administrative & financière" },
  "finance": { code: "M1205", label: "Direction administrative & financière" },
  "marketing": { code: "M1705", label: "Marketing" },
  "commerce": { code: "D1406", label: "Management en force de vente" },
  "électrique": { code: "H1504", label: "Ingénierie électrique" },
  "électronique": { code: "H1504", label: "Ingénierie électrique" },
  "mécanique": { code: "H1502", label: "Ingénierie mécanique" },
  "agriculture": { code: "A1301", label: "Conseil & assistance en agriculture" },
  "agronomie": { code: "A1301", label: "Conseil & assistance en agriculture" },
  "enseignement": { code: "K2107", label: "Enseignement général" },
  "éducation": { code: "K2107", label: "Enseignement général" },
  "formation": { code: "K2111", label: "Formation professionnelle" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { file_path, diploma_id, talent_id } = await req.json();

    if (!file_path || !diploma_id || !talent_id) {
      return new Response(JSON.stringify({ error: "Paramètres manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the file from storage to get a signed URL for AI
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("diplomas")
      .createSignedUrl(file_path, 600);

    if (urlError || !signedUrlData?.signedUrl) {
      throw new Error("Impossible d'accéder au fichier: " + (urlError?.message || "URL non générée"));
    }

    // Step 1: OCR via Lovable AI (Gemini vision)
    console.log("Starting OCR analysis...");
    const ocrPrompt = `Analyze this diploma/certificate document image or PDF. Extract the following information in JSON format:
{
  "holder_name": "Full name of the diploma holder",
  "date": "Date of issuance (format: YYYY-MM-DD if possible)",
  "field_of_study": "Field of study or specialization",
  "institution": "Name of the institution that issued the diploma",
  "has_minfop_stamp": true/false - "Does it have any stamp or seal from MINFOP, MINEFOP, MINESUP, MINFOG or any Cameroonian ministry?",
  "has_apostille_stamp": true/false - "Does it have an apostille stamp or seal from 'Ministère des Affaires Étrangères' or similar foreign affairs ministry?",
  "diploma_type": "Type of diploma (Licence, Master, BTS, etc.)",
  "confidence": 0-100 - "How confident are you in the extraction?"
}
Return ONLY valid JSON, no markdown.`;

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: ocrPrompt },
              { type: "image_url", image_url: { url: signedUrlData.signedUrl } },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      throw new Error("Erreur OCR IA: " + aiResponse.status);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "{}";
    
    // Parse JSON from AI response (handle potential markdown wrapping)
    let ocrResult: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      ocrResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      console.error("Failed to parse OCR result:", rawContent);
      ocrResult = {};
    }

    console.log("OCR result:", JSON.stringify(ocrResult));

    // Step 2: MINFOP verification
    const institutionLower = (ocrResult.institution || "").toLowerCase();
    const minfopVerified = ocrResult.has_minfop_stamp === true ||
      MINFOP_INSTITUTIONS.some((inst) => institutionLower.includes(inst));

    // Step 3: Apostille verification
    const apostilleVerified = ocrResult.has_apostille_stamp === true;

    // Step 4: ROME mapping
    const fieldLower = (ocrResult.field_of_study || "").toLowerCase();
    let romeCode = "";
    let romeLabel = "";
    let romeMatchPercent = 0;

    for (const [keyword, rome] of Object.entries(ROME_MAPPING)) {
      if (fieldLower.includes(keyword)) {
        romeCode = rome.code;
        romeLabel = rome.label;
        romeMatchPercent = Math.min(95, (ocrResult.confidence || 50) + 10);
        break;
      }
    }

    // If no direct match, try with diploma type
    if (!romeCode && ocrResult.diploma_type) {
      const typeLower = ocrResult.diploma_type.toLowerCase();
      for (const [keyword, rome] of Object.entries(ROME_MAPPING)) {
        if (typeLower.includes(keyword)) {
          romeCode = rome.code;
          romeLabel = rome.label;
          romeMatchPercent = Math.min(75, (ocrResult.confidence || 30));
          break;
        }
      }
    }

    // Determine overall status
    let status = "en_attente";
    if (minfopVerified && apostilleVerified && romeMatchPercent >= 50) {
      status = "verifie";
    } else if (!minfopVerified && !apostilleVerified && romeMatchPercent < 30) {
      status = "refuse";
    }

    // Update diploma record
    const { error: updateError } = await supabase
      .from("diplomas")
      .update({
        extracted_name: ocrResult.holder_name || null,
        extracted_date: ocrResult.date || null,
        extracted_field: ocrResult.field_of_study || null,
        minfop_verified: minfopVerified,
        apostille_verified: apostilleVerified,
        rome_code: romeCode || null,
        rome_label: romeLabel || null,
        rome_match_percent: romeMatchPercent,
        status,
        verification_details: {
          ocr_confidence: ocrResult.confidence || 0,
          institution: ocrResult.institution || null,
          diploma_type: ocrResult.diploma_type || null,
          has_minfop_stamp: ocrResult.has_minfop_stamp || false,
          has_apostille_stamp: ocrResult.has_apostille_stamp || false,
          verified_at: new Date().toISOString(),
        },
      })
      .eq("id", diploma_id);

    if (updateError) throw updateError;

    // Update talent profile with ROME info and compliance score if verified
    if (status === "verifie" && romeCode) {
      const complianceScore = Math.round(
        (minfopVerified ? 30 : 0) +
        (apostilleVerified ? 30 : 0) +
        (romeMatchPercent * 0.4)
      );

      await supabase
        .from("talent_profiles")
        .update({
          rome_code: romeCode,
          rome_label: romeLabel,
          compliance_score: complianceScore,
          visa_status: apostilleVerified ? "apostille" : "en_cours",
          apostille_date: apostilleVerified ? new Date().toISOString().split("T")[0] : null,
        })
        .eq("id", talent_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status,
        minfop_verified: minfopVerified,
        apostille_verified: apostilleVerified,
        rome_code: romeCode,
        rome_label: romeLabel,
        rome_match_percent: romeMatchPercent,
        extracted: {
          name: ocrResult.holder_name,
          date: ocrResult.date,
          field: ocrResult.field_of_study,
          institution: ocrResult.institution,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify diploma error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
