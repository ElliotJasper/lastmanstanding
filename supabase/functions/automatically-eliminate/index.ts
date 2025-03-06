// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

// get all league users from active leagues whos isEliminated is false and canPick is true
// eliminate them if they have not picked a team
async function eliminateUsers() {
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
    const { data: activeUsers, error: activeUsersError } = await supabase
      .from("league_users")
      .select("id")
      .eq("league_id", league.id)
      .eq("isEliminated", false)
      .eq("canPick", true);

    if (activeUsersError) {
      console.error(`Error fetching users for league ${league.id}:`, activeUsersError);
      continue;
    }

    // Eliminate these users
    for (const user of activeUsers) {
      const { error: updateError } = await supabase
        .from("league_users")
        .update({
          isEliminated: true,
          canPick: false,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(`Error eliminating user ${user.id}:`, updateError);
      } else {
        console.log(`User ${user.id} in league ${league.id} has been eliminated.`);
      }
    }
  }

  console.log("Elimination check completed.");
}

Deno.serve(async (req) => {
  // Select id 1 from game_week_info table
  const { data: gameWeekInfo, error: gameWeekInfoError } = await supabase
    .from("game_week_info")
    .select("activeWeek")
    .eq("id", 1);

  if (gameWeekInfoError) {
    console.error("Error fetching game week info:", gameWeekInfoError);
    return;
  }

  // If activeWeek is false, return early
  if (gameWeekInfo[0].activeWeek == false) {
    return new Response(JSON.stringify({ message: "Not an active week." }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  await eliminateUsers();

  const data = { message: "Elimination check completed." };

  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/automatically-eliminate' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
