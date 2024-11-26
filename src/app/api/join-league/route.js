import { SupabaseClient } from "../../../../lib/supabaseClient.ts";

export async function POST(req) {
  const supabaseClient = new SupabaseClient();

  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const formData = await req.json();
    const league = await supabaseClient.getLeagueByCode(formData.leagueCode);

    if (league.length > 0) {
      await supabaseClient.addUserToLeague(userData.id, league[0].id);
    }

    return new Response(JSON.stringify({ message: "League joined" }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to join league" }), {
      status: 500,
    });
  }
}
