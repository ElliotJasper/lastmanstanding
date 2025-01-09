import { SupabaseClient } from "../../../../../lib/supabaseClient.ts";

export async function POST(req, { params }) {
  const { leagueId } = params;
  const supabaseClient = new SupabaseClient();

  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  await supabaseClient.activateLeague(leagueId, userData.id);
  return new Response(JSON.stringify({ status: 200 }));
}
