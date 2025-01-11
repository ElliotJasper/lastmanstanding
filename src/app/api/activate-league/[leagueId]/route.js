import { SupabaseClient } from "../../../../../lib/supabaseClient.ts";

export async function POST(req, { params }) {
  const { leagueId } = params;
  const supabaseClient = new SupabaseClient();

  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const response = await supabaseClient.activateLeague(leagueId, userData.id);
  console.log(response);
  if (response.error) {
    return new Response(JSON.stringify({ error: "League cannot be activated during pick time" }), { status: 400 });
  }
  return new Response(JSON.stringify({ status: 200 }));
}
