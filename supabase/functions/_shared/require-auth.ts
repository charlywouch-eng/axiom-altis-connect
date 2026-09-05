import { createClient } from "npm:@supabase/supabase-js@2.57.2";

/**
 * Validates the caller's Supabase JWT.
 * Returns the authenticated user, or a ready-to-return 401 Response.
 */
export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<{ user: { id: string; email?: string } } | { response: Response }> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  const unauthorized = () =>
    new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (!token) return { response: unauthorized() };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { response: unauthorized() };

  return { user: { id: data.user.id, email: data.user.email ?? undefined } };
}
