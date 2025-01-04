import { createClient } from "jsr:@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

const getDatesFridayToMonday = () => {
  const formattedDates = [];
  const currentDate = new Date();

  // Calculate days until next Friday
  let daysUntilFriday = 5 - currentDate.getDay();
  if (daysUntilFriday <= 0) {
    daysUntilFriday += 7; // If we're past Friday, get next Friday
  }

  // Set start date (Friday)
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() + daysUntilFriday);
  startDate.setHours(0, 0, 0, 0);
  formattedDates.push(startDate.toISOString());

  // Set end date (following Monday)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 3); // Add 3 days to get to Monday
  endDate.setHours(23, 59, 59, 999);
  formattedDates.push(endDate.toISOString());

  return formattedDates;
};

async function isEnoughGames() {
  const dates = getDatesFridayToMonday();
  console.log(dates);

  const { data: games, error: picksError } = await supabase
    .from("games")
    .select("homeTeam, awayTeam, date, eventProgress")
    .gt("date", dates[0])
    .lte("date", dates[dates.length - 1])
    .order("date", { ascending: true });

  if (picksError) {
    console.error("Picks Error Details:", picksError);
    throw new Error(`Error fetching pickable games: ${picksError.message}`);
  }

  const gameDetails = games.flatMap((game) => [
    {
      team: game.homeTeam,
      date: game.date,
      opponent: game.awayTeam,
    },
    {
      team: game.awayTeam,
      date: game.date,
      opponent: game.homeTeam,
    },
  ]);
  if (gameDetails.length < 8) {
    // Update in game_week_info table where id is 1 set the activeWeek to false
    const { error: updateError } = await supabase.from("game_week_info").update({ activeWeek: false }).eq("id", 1);
    if (updateError) {
      console.error("Update Error Details:", updateError);
      throw new Error(`Error updating active week: ${updateError.message}`);
    }
  } else {
    // Update in game_week_info table where id is 1 set the activeWeek to true
    const { error: updateError } = await supabase.from("game_week_info").update({ activeWeek: true }).eq("id", 1);
    if (updateError) {
      console.error("Update Error Details:", updateError);
      throw new Error(`Error updating active week: ${updateError.message}`);
    }
  }
}


import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Define and serve the function
Deno.serve(async (req) => {
  await isEnoughGames(); // Trigger the winner marking process once a day

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
