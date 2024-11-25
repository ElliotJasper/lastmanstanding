import { SupabaseClient } from "../../../../../../lib/supabaseClient.ts";
import { getTeamImage } from "../../../../../../lib/TeamImageMapping.ts";

export async function GET(req, { params }) {
  const supabaseClient = new SupabaseClient();

  const { userId, leagueId } = params;

  // Check if the user is authenticated
  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  // Fetch all possible picks, user picks, and league user data
  const [availablePicks, userPicks, leagueUser] = await Promise.all([
    supabaseClient.getPickableGames(),
    supabaseClient.getUserPicks(userData.id, parseInt(leagueId)),
    supabaseClient.getLeagueUserData(userData.id, parseInt(leagueId)),
  ]);

  // Filter available picks by excluding teams already picked by the user
  const filteredAvailablePicks = availablePicks.filter(
    (pick) => !userPicks.some((userPick) => userPick.teamName === pick.team)
  );

  // Add team images to filtered available picks
  const availablePicksWithImages = filteredAvailablePicks.map((pick) => ({
    ...pick,
    teamImg: getTeamImage(pick.team),
  }));

  // Return response with relevant data
  return new Response(
    JSON.stringify({
      userId: userData.id,
      leagueId,
      isEliminated: leagueUser.isEliminated,
      availablePicks: availablePicksWithImages,
      gameWeeks: userPicks.length,
      winner: leagueUser.winner,
    }),
    { status: 200 }
  );
}
