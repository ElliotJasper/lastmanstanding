// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "jsr:@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

const generateFormattedDatesUntilSunday = () => {
  const formattedDates = [];
  const date_ob = new Date();
  const currentDayOfWeek = date_ob.getDay(); // 0 (Sunday) to 6 (Saturday)
  const daysUntilSunday = 9 - currentDayOfWeek; // Days remaining until the next Sunday

  for (let i = 0; i < daysUntilSunday; i++) {
    const tempDate = new Date(date_ob);
    tempDate.setDate(date_ob.getDate() + i);
    const weekday = tempDate.toLocaleString("en-us", { weekday: "long" });
    let date = tempDate.getDate().toString();
    if (date.length === 1) {
      date = "0" + date;
    }
    let month = (tempDate.getMonth() + 1).toString().padStart(2, "0");
    let year = tempDate.getFullYear();
    let monthName = tempDate.toLocaleString("default", { month: "long" });

    const nth = function (d) {
      if (d > 3 && d < 21) return "th";
      switch (d % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    const formatDatePath = `${weekday}-${date}${nth(date)}-${monthName}`;
    const formatDateAPI = `${year}-${month}-${date}`;
    const formatDateISO = tempDate.toISOString(); // ISO 8601 format

    formattedDates.push({ formatDatePath, formatDateAPI, formatDateISO });
  }
  return formattedDates;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const LEAGUES = ["premier-league", "championship", "league-one", "league-two"];

const leaguesMap = {
  "premier-league": "Premier League",
  championship: "Championship",
  "league-one": "League One",
  "league-two": "League Two",
}

function isBeforeThursdayMidnight() {
  // Get the current date and time
  const now = new Date();

  // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = now.getDay();

  // Return false if today is Friday (5), Saturday (6), Sunday (0), or Monday (1)
  if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 || dayOfWeek === 1) {
    return false;
  }
  return true
}

console.log(isBeforeThursdayMidnight());

async function scrapeScores() {
  let totalGames = 0;
  const todayDate = generateFormattedDatesUntilSunday()[0].formatDateAPI;

  for (const league of LEAGUES) {
    console.log(`Scraping ${league}...`);

    const requestUrl = `https://www.bbc.co.uk/wc-data/container/sport-data-scores-fixtures?selectedEndDate=2025-08-01&selectedStartDate=${todayDate}&todayDate=${todayDate}&urn=urn%3Abbc%3Asportsdata%3Afootball%3Atournament%3A${league}&useSdApi=false`;

    try {
      const response = await fetch(requestUrl);
      const data = await response.json();
      let games = [];
      let path = data.eventGroups;

      for (let eventGroup of path) {
        path = eventGroup.secondaryGroups[0].events;

        for (let event of path) {
          totalGames++;
          let game = {
            date: event.date.iso,
            homeTeam: event.home.fullName,
            homeScore: event.home.score ? parseInt(event.home.score) : 0,
            awayTeam: event.away.fullName,
            awayScore: event.away.score ? parseInt(event.away.score) : 0,
            eventProgress: event.status,
            league: leaguesMap[league],
          };

          // Determine game outcome
          if (event.winner && event.winner === "draw") {
            game.homeOutcome = "draw";
            game.awayOutcome = "draw";
          } else if (event.winner && event.winner === "home") {
            game.homeOutcome = "win";
            game.awayOutcome = "loss";
          } else if (event.winner && event.winner === "away") {
            game.homeOutcome = "loss";
            game.awayOutcome = "win";
          } else {
            game.homeOutcome = "unknown";
            game.awayOutcome = "unknown";
          }

          games.push(game);
        }
      }

      await saveScoresToDatabase(games);
      console.log(`${league}: Processed ${games.length} games`);

      // Add delay before processing next league (except for the last one)
      if (league !== LEAGUES[LEAGUES.length - 1]) {
        console.log("Waiting 5 seconds before next league...");
        await delay(5000);
      }
    } catch (error) {
      console.error(`Error scraping ${league}:`, error);
    }
  }

  console.log(`Total games processed across all leagues: ${totalGames}`);
}

async function saveScoresToDatabase(scores) {
  // First, fetch existing games to compare
  const { data: existingGames, error: fetchError } = await supabase
    .from("games")
    .select("*")
    .in(
      "homeTeam",
      scores.map((score) => score.homeTeam)
    )
    .in(
      "awayTeam",
      scores.map((score) => score.awayTeam)
    );

  if (fetchError) {
    console.error("Error fetching existing games:", fetchError);
    return;
  }

  // Filter scores to only include games with changes
  const scoresToUpsert = scores.filter((newScore) => {
    const existingGame = existingGames.find(
      (game) => game.homeTeam === newScore.homeTeam && game.awayTeam === newScore.awayTeam
    );

    // If no existing game, always upsert
    if (!existingGame) return true;

    // Compare relevant fields to check if anything changed
    return (
      existingGame.homeScore !== newScore.homeScore ||
      existingGame.awayScore !== newScore.awayScore ||
      existingGame.eventProgress !== newScore.eventProgress ||
      existingGame.homeOutcome !== newScore.homeOutcome ||
      existingGame.awayOutcome !== newScore.awayOutcome ||
      existingGame.date !== newScore.date.slice(0, -1)
    );
  });
  // Only upsert games with changes
  if (scoresToUpsert.length > 0) {
    console.log(scoresToUpsert[0].league);
    const { error } = await supabase.from("games").upsert(
      scoresToUpsert.map((score) => ({
        date: new Date(score.date),
        homeTeam: score.homeTeam,
        homeScore: score.homeScore,
        homeOutcome: score.homeOutcome,
        awayTeam: score.awayTeam,
        awayScore: score.awayScore,
        league: score.league,
        awayOutcome: score.awayOutcome,
        eventProgress: score.eventProgress,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {
        onConflict: ["homeTeam", "awayTeam"],
      }
    );

    if (error) {
      console.error("Error upserting games:", error);
    } else {
      console.log(`Upserted ${scoresToUpsert.length} games with changes`);
    }

    // Delete picks for rescheduled games
    for (let score of scoresToUpsert) {
      // Find the existing game to get the old date
      const existingGame = existingGames.find(
        (game) => game.homeTeam === score.homeTeam && game.awayTeam === score.awayTeam
      );

      if (existingGame) {
        // Fetch the picks to be deleted for the home team
        const { data: homePicksToDelete, error: homePicksFetchError } = await supabase
          .from("picks")
          .select("league_id, user_id")
          .eq("teamName", score.homeTeam)
          .eq("date", existingGame.date);

        // Fetch the picks to be deleted for the away team
        const { data: awayPicksToDelete, error: awayPicksFetchError } = await supabase
          .from("picks")
          .select("league_id, user_id")
          .eq("teamName", score.awayTeam)
          .eq("date", existingGame.date);

        // Reset can_pick for users who had picks for home team
        if (homePicksToDelete && homePicksToDelete.length > 0) {
          const homeUserUpdatePromises = homePicksToDelete.map(async (pick) => {
            const { error: updateError } = await supabase
              .from("league_users")
              .update({ canPick: true })
              .eq("user_id", pick.user_id)
              .eq("league_id", pick.league_id);

            if (updateError) {
              console.error(`Error updating can_pick for home team pick:`, updateError);
            }
          });

          await Promise.all(homeUserUpdatePromises);
        } 

        // Reset can_pick for users who had picks for away team
        if (awayPicksToDelete && awayPicksToDelete.length > 0) {
          const awayUserUpdatePromises = awayPicksToDelete.map(async (pick) => {
            const { error: updateError } = await supabase
              .from("league_users")
              .update({ canPick: true,  })
              .eq("user_id", pick.user_id)
              .eq("league_id", pick.league_id);

            if (updateError) {
              console.error(`Error updating can_pick for away team pick:`, updateError);
            }
          });

          await Promise.all(awayUserUpdatePromises);
        } 

        // Delete picks for the home team with the old date
        const { error: deleteHomePicksError } = await supabase
          .from("picks")
          .delete()
          .eq("teamName", score.homeTeam)
          .eq("date", existingGame.date);

        // Delete picks for the away team with the old date
        const { error: deleteAwayPicksError } = await supabase
          .from("picks")
          .delete()
          .eq("teamName", score.awayTeam)
          .eq("date", existingGame.date);

        if (deleteHomePicksError) {
          console.error(`Error deleting picks for home team ${score.homeTeam}:`, deleteHomePicksError);
        }

        if (deleteAwayPicksError) {
          console.error(`Error deleting picks for away team ${score.awayTeam}:`, deleteAwayPicksError);
        }
      }
    }
  } else {
    console.log("No games with changes to update");
  }
}

Deno.serve(async (req) => {
  await scrapeScores();

  const data = {
    message: `Done`,
  };

  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/reschedule-games' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
