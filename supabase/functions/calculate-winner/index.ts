import { createClient } from "jsr:@supabase/supabase-js";

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
      .select("id")
      .eq("league_id", league.id)
      .eq("isEliminated", false);

    if (activeUsersError) {
      console.error(`Error fetching users for league ${league.id}:`, activeUsersError);
      continue;
    }

    // If only one active user remains, mark them as the winner
    if (activeUsers.length === 1) {
      const lastUser = activeUsers[0];

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

  console.log("Winner check completed.");
}

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Define and serve the function
Deno.serve(async (req) => {
  await markLastUserAsWinner(); // Trigger the winner marking process once a day

  const data = {
    message: `Winner check completed.`,
  };

  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/winner-check' \
    --header 'Authorization: Bearer <YOUR_SUPABASE_KEY>' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
