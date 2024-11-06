import { SupabaseClient } from "../../../../../lib/supabaseClient.ts";

export async function POST(req, { params }) {
  const { leagueId } = params;
  console.log("hi");
  const supabaseClient = new SupabaseClient();

  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  await supabaseClient.activateLeague(leagueId);
  return new Response({ status: 200 });
}
