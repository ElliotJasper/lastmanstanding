import { SupabaseClient } from "../../../../../lib/supabaseClient.ts";

export async function GET(req, { params }) {
  const { leagueId } = params;

  const supabaseClient = new SupabaseClient();

  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  // Fetch the league isactive / other info
  const leagueInfo = await supabaseClient.getLeagueInfo(leagueId);
  return new Response(JSON.stringify(leagueInfo), { status: 200 });
}
