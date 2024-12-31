import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

// Helper function to mark the last standing user as the winner
async function markLastUserAsWinner() {
  // Query all active leagues
  const { data: leagues, error: leaguesError } = await supabase.from("leagues").select("id").eq("isactive", true);

  if (leaguesError) {
    console.error("Error fetching leagues:", leaguesError);
    return;
  }

  if (!leagues || leagues.length === 0) {
    console.log("No active leagues found.");
    return;
  }

  for (const league of leagues) {
    // Fetch all users of the current league who are not eliminated
    const { data: activeUsers, error: activeUsersError } = await supabase
      .from("league_users")
      .select("user_id, id")
      .eq("league_id", league.id)
      .eq("isEliminated", false);

    if (activeUsersError) {
      console.error(`Error fetching users for league ${league.id}:`, activeUsersError);
      continue;
    }

    // If only one active user remains, check their picks
    if (activeUsers.length === 1) {
      const lastUser = activeUsers[0];

      // Fetch all picks for the last remaining user
      const { data: picks, error: picksError } = await supabase
        .from("picks")
        .select("teamName, date")
        .eq("league_id", league.id)
        .eq("user_id", lastUser.user_id);

      if (picksError) {
        console.error(`Error fetching picks for user ${lastUser.user_id}:`, picksError);
        continue;
      }

      // Check if all games for their picks are completed
      let allGamesCompleted = true;

      for (const pick of picks) {
        // Query games table for home team match
        const { data: homeGames, error: homeGamesError } = await supabase
          .from("games")
          .select("eventProgress")
          .eq("homeTeam", pick.teamName)
          .eq("date", pick.date);

        // Query games table for away team match
        const { data: awayGames, error: awayGamesError } = await supabase
          .from("games")
          .select("eventProgress")
          .eq("awayTeam", pick.teamName)
          .eq("date", pick.date);

        if (homeGamesError) {
          console.error(`Error fetching home game for pick:`, homeGamesError);
          allGamesCompleted = false;
          break;
        }

        if (awayGamesError) {
          console.error(`Error fetching away game for pick:`, awayGamesError);
          allGamesCompleted = false;
          break;
        }

        // Combine results from both queries
        const matchingGames = [...(homeGames || []), ...(awayGames || [])];

        // Check if any matching game is not completed
        if (!matchingGames.length || !matchingGames.every((game) => game.eventProgress === "PostEvent")) {
          allGamesCompleted = false;
          break;
        }
      }

      // Only update winner status if all games are completed
      if (allGamesCompleted) {
        const { error: updateError } = await supabase
          .from("league_users")
          .update({
            winner: true,
            canPick: false,
          })
          .eq("id", lastUser.id);

        const { error: updateLeagueError } = await supabase
          .from("leagues")
          .update({
            isactive: false,
          })
          .eq("id", league.id);

        if (updateError) {
          console.error(`Error updating user ${lastUser.id}:`, updateError);
        } else {
          console.log(
            `User ${lastUser.id} in league ${league.id} has been marked as the winner and cannot pick further.`
          );
        }
      }
    }
  }

  console.log("Winner check completed.");
}

// Setup type definitions for built-in Supabase Runtime APIs

// Execute the function
markLastUserAsWinner();
