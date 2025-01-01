import { createClient } from "../../../../utils/supabase/server.js";
import { SupabaseClient } from "../../../../lib/supabaseClient.ts";

export async function POST(req) {
  const supabaseClient = new SupabaseClient();

  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }
  //************************************************** */
  const supabase = createClient();
  const formData = await req.json();

  // Get the authenticated user from Supabase
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Check if the user is authenticated
  if (userError || !user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  const leagueUserData = await supabaseClient.getLeagueUserData(userData.id, formData.leagueId);

  // Check if the user can make a pick or is eliminated
  if (!leagueUserData.canPick || leagueUserData.isEliminated) {
    return new Response(JSON.stringify({ message: "You cannot make a pick at this time." }), {
      status: 400,
    });
  }

  // Fetch the user's previous picks for this league
  const previousPicks = await supabaseClient.getUserPicks(userData.id, formData.leagueId);

  // Extract team names from previous picks
  const teamNames = previousPicks.map((pick) => pick.teamName);

  // Check if the selected team has already been picked
  if (teamNames.includes(formData.selectedPick.team)) {
    return new Response(JSON.stringify({ message: "You have already picked this team." }), {
      status: 400,
    });
  }

  await supabaseClient.submitPick(
    userData.id,
    formData.leagueId,
    formData.selectedPick.team,
    formData.selectedPick.date
  );

  // Update the user's canPick status to false
  const { error: updateCanPickError } = await supabase
    .from("league_users")
    .update({ canPick: false })
    .eq("user_id", formData.userId)
    .eq("league_id", parseInt(formData.leagueId));

  if (updateCanPickError) {
    console.error("Error updating canPick status:", updateCanPickError.message);
    return new Response(JSON.stringify({ message: "Error updating user status." }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ message: "Pick submitted successfully." }), {
    status: 200,
  });
}
