import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FT_TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const EVENTS_URL = "https://api.francetravail.io/partenaire/mesevenementsemploi/v1/evenements";

async function getToken(clientId: string, clientSecret: string): Promise<string | null> {
  const scopes = [
    "api_mesevenementsemploiv1 o2dsoffre",
    "api_mesevenementsemploiv1",
    "mesevenementsemploi o2dsoffre",
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
          console.log(`Events auth OK with scope: "${scope}"`);
          return data.access_token;
        }
      }
      const text = await res.text();
      console.log(`Events scope "${scope}" failed [${res.status}]: ${text}`);
    } catch (e) {
      console.log(`Events scope "${scope}" error:`, e);
    }
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

    const { codeDepartement, codePostal, count = 6 } = await req.json();

    const token = await getToken(clientId, clientSecret);

    if (token) {
      const params = new URLSearchParams();
      if (codeDepartement) params.set("codeDepartement", codeDepartement);
      if (codePostal) params.set("codePostal", codePostal);

      const url = params.toString() ? `${EVENTS_URL}?${params.toString()}` : EVENTS_URL;

      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        console.log(`Events API status: ${res.status}`);

        if (res.ok) {
          const rawData = await res.json();
          const rawEvents = Array.isArray(rawData) ? rawData : rawData.evenements || rawData.results || [];

          const events = rawEvents.slice(0, count).map((e: Record<string, unknown>) => {
            const lieu = e.lieu as Record<string, unknown> | undefined;
            return {
              id: e.id || e.idEvenement || crypto.randomUUID(),
              title: (e.titre as string) || (e.intitule as string) || "Événement emploi",
              description: ((e.description as string) || "").slice(0, 200),
              date: (e.dateDebut as string) || (e.date as string) || null,
              endDate: (e.dateFin as string) || null,
              city: (lieu?.ville as string) || (lieu?.commune as string) || (e.ville as string) || "",
              address: (lieu?.adresse as string) || (lieu?.libelle as string) || "",
              organizer: (e.organisateur as string) || (e.organisme as string) || "France Travail",
              type: (e.typeEvenement as string) || (e.type as string) || "Forum",
              url: (e.url as string) || (e.lienInscription as string) || null,
            };
          });

          if (events.length > 0) {
            console.log(`Events API returned ${events.length} results`);
            return new Response(JSON.stringify({ events, source: "api" }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          const text = await res.text();
          console.log(`Events API error: ${text.substring(0, 200)}`);
        }
      } catch (apiErr) {
        console.log("Events API fetch error:", apiErr);
      }
    }

    console.log("Events: using fallback data");
    return new Response(JSON.stringify({ events: getFallbackEvents(), source: "fallback" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Events error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getFallbackEvents(): Array<Record<string, unknown>> {
  const now = new Date();
  const addDays = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date.toISOString();
  };

  return [
    {
      id: "evt-1",
      title: "Forum Emploi BTP & Industrie",
      description: "Rencontrez les entreprises du BTP et de l'industrie qui recrutent. Apportez votre CV et préparez-vous à des entretiens sur place.",
      date: addDays(5),
      endDate: addDays(5),
      city: "Paris",
      address: "Espace Grande Arche, La Défense",
      organizer: "France Travail Île-de-France",
      type: "Forum",
      url: "https://mesevenementsemploi.francetravail.fr",
    },
    {
      id: "evt-2",
      title: "Journée Recrutement Santé & Aide à la personne",
      description: "Journée dédiée aux métiers de la santé : aide-soignant, infirmier, auxiliaire de vie. Entretiens express avec les recruteurs.",
      date: addDays(12),
      endDate: addDays(12),
      city: "Lyon",
      address: "Hôtel de Région, 1 Esplanade F. Mitterrand",
      organizer: "France Travail Auvergne-Rhône-Alpes",
      type: "Journée de recrutement",
      url: "https://mesevenementsemploi.francetravail.fr",
    },
    {
      id: "evt-3",
      title: "Atelier CV & Entretien — Spécial Nouveaux Arrivants",
      description: "Atelier d'accompagnement pour les travailleurs internationaux : rédaction de CV français, simulation d'entretien, conseils administratifs.",
      date: addDays(8),
      endDate: addDays(8),
      city: "Marseille",
      address: "France Travail Joliette, 35 Bd de la Joliette",
      organizer: "France Travail PACA",
      type: "Atelier",
      url: "https://mesevenementsemploi.francetravail.fr",
    },
    {
      id: "evt-4",
      title: "Salon Hôtellerie-Restauration Méditerranée",
      description: "Les professionnels de l'hôtellerie et la restauration recrutent pour la saison. Plus de 50 postes à pourvoir.",
      date: addDays(18),
      endDate: addDays(19),
      city: "Bordeaux",
      address: "Palais des Congrès, Avenue Jean Gabriel Domergue",
      organizer: "France Travail Nouvelle-Aquitaine",
      type: "Salon",
      url: "https://mesevenementsemploi.francetravail.fr",
    },
  ];
}
