// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "jsr:@supabase/supabase-js";

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
const LEAGUES = ["premier-league", "championship", "league-one", "league-two"];
const leaguesMap = {
  "premier-league": "Premier League",
  championship: "Championship",
  "league-one": "League One",
  "league-two": "League Two",
}
// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

async function scrapeLeagueScores(league, todayDate) {
  let games = [];
  const requestUrl = `https://www.bbc.co.uk/wc-data/container/sport-data-scores-fixtures?selectedEndDate=${todayDate}&selectedStartDate=${todayDate}&todayDate=${todayDate}&urn=urn%3Abbc%3Asportsdata%3Afootball%3Atournament%3A${league}&useSdApi=false`;

  try {
    const response = await fetch(requestUrl);
    const data = await response.json();
    let path = data.eventGroups;

    for (let eventGroup of path) {
      path = eventGroup.secondaryGroups[0].events;
      for (let event of path) {
        let game = {
          league: leaguesMap[league],
          date: event.date.iso,
          homeTeam: event.home.fullName,
          homeScore: event.home.score ? parseInt(event.home.score) : 0,
          awayTeam: event.away.fullName,
          awayScore: event.away.score ? parseInt(event.away.score) : 0,
          eventProgress: event.status,
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
  } catch (error) {
    console.error(`Error scraping ${league}:`, error);
  }

  return games;
}

async function scrapeTodaysScores() {
  let allGames = [];
  const todayDate = generateFormattedDatesUntilSunday()[0].formatDateAPI;

  // Scrape each league
  for (const league of LEAGUES) {
    const games = await scrapeLeagueScores(league, todayDate);
    console.log(`Scraped ${games.length} games from ${league}`);
    allGames = [...allGames, ...games];
  }

  if (allGames.length > 0) {
    await saveScoresToDatabase(allGames);
  } else {
    console.log("No games found in any league");
  }
}

async function saveScoresToDatabase(scores) {
  // Retrieve the current game records from the database for comparison
  const { data: existingGames, error: fetchError } = await supabase
    .from("games")
    .select("homeTeam, awayTeam, eventProgress")
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

  // Compare eventProgress and call TestFunction if transitioning to 'PostEvent'
  scores.forEach((score) => {
    const existingGame = existingGames.find(
      (g) => g.homeTeam === score.homeTeam && g.awayTeam === score.awayTeam
    );

    if (existingGame) {
      if (existingGame.eventProgress !== "PostEvent" && score.eventProgress === "PostEvent") {
        console.log(`PostEvent detected:`, score.homeTeam, "vs", score.awayTeam);
        TestFunction(score);
      }

      if (existingGame.eventProgress !== "Postponed" && score.eventProgress === "Postponed") {
        console.log(`Postponed detected:`, score.homeTeam, "vs", score.awayTeam);
        EliminateFunction(score);
      }
    }
  });

  // Perform upsert into the database using Supabase
  const { error } = await supabase.from("games").upsert(
    scores.map((score) => ({
      league: score.league,
      date: new Date(score.date),
      homeTeam: score.homeTeam,
      homeScore: score.homeScore,
      homeOutcome: score.homeOutcome,
      awayTeam: score.awayTeam,
      awayScore: score.awayScore,
      awayOutcome: score.awayOutcome,
      eventProgress: score.eventProgress,
      created_at: new Date(),
      updated_at: new Date(),
    })),
    {
      onConflict: ["homeTeam", "awayTeam"], // Only use team combinations for uniqueness
    }
  );

  if (error) {
    console.error("Error upserting games:", error);
  } else {
    console.log("Scores upserted successfully!");
  }
}

async function EliminateFunction(score) {
  let isBeforeThursday = isBeforeThursdayMidnight();
  const scoreDate = new Date(score.date).toISOString();

  // Fetch the picks to be deleted for the home team
  const { data: homePicksToDelete, error: homePicksFetchError } = await supabase
    .from("picks")
    .select("league_id, user_id")
    .eq("teamName", score.homeTeam)
    .eq("date", score.date);

  // Fetch the picks to be deleted for the away team
  const { data: awayPicksToDelete, error: awayPicksFetchError } = await supabase
    .from("picks")
    .select("league_id, user_id")
    .eq("teamName", score.awayTeam)
    .eq("date", score.date);

  // Reset can_pick for users who had picks for home team
  if (homePicksToDelete && homePicksToDelete.length > 0) {
    const homeUserUpdatePromises = homePicksToDelete.map(async (pick) => {
      const { error: updateError } = await supabase
        .from("league_users")
        .update({ 
          canPick: isBeforeThursday ? true : false,
          isEliminated: isBeforeThursday ? false : true
        })
        .eq("user_id", pick.user_id)
        .eq("league_id", pick.league_id);

      if (updateError) {
        console.error(`Error updating league_users for home team pick:`, updateError);
      }
    });

    await Promise.all(homeUserUpdatePromises);
  }

  // Reset can_pick for users who had picks for away team
  if (awayPicksToDelete && awayPicksToDelete.length > 0) {
    const awayUserUpdatePromises = awayPicksToDelete.map(async (pick) => {
      const { error: updateError } = await supabase
        .from("league_users")
        .update({ 
          canPick: isBeforeThursday ? true : false,
          isEliminated: isBeforeThursday ? false : true
        })
        .eq("user_id", pick.user_id)
        .eq("league_id", pick.league_id);

      if (updateError) {
        console.error(`Error updating league_users for away team pick:`, updateError);
      }
    });

    await Promise.all(awayUserUpdatePromises);
  }

  // Delete picks for both teams
  const { error: deleteHomePicksError } = await supabase
    .from("picks")
    .delete()
    .eq("teamName", score.homeTeam)
    .eq("date", score.date);

  const { error: deleteAwayPicksError } = await supabase
    .from("picks")
    .delete()
    .eq("teamName", score.awayTeam)
    .eq("date", score.date);

  if (deleteHomePicksError) {
    console.error(`Error deleting picks for home team ${score.homeTeam}:`, deleteHomePicksError);
  }

  if (deleteAwayPicksError) {
    console.error(`Error deleting picks for away team ${score.awayTeam}:`, deleteAwayPicksError);
  }
}

async function TestFunction(score) {
  const scoreDate = new Date(score.date).toISOString();
  console.log(score);

  async function updateEliminationsForTeam(teamName, teamOutcome) {
    // Modified query to join with leagues table and check isActive
    const { data: users, error: fetchError } = await supabase
      .from("picks")
      .select(`
        user_id,
        league_id,
        id,
        leagues!inner(isactive)
      `)
      .eq("teamName", teamName)
      .eq("date", scoreDate)
      .eq("leagues.isactive", true);

    console.log("USERS", users);
    if (fetchError) {
      console.error(`Error fetching users who picked ${teamName}:`, fetchError);
      return;
    }

    console.log("Team:", teamName);
    console.log("Score Date:", scoreDate);
    console.log(`Users who picked ${teamName}:`, users);

    if (users.length === 0) {
      console.log(`No users picked ${teamName} in active leagues.`);
      return;
    }

    // First, update all the picks with the game outcome
    const { error: picksUpdateError } = await supabase
      .from("picks")
      .update({
        outcome: teamOutcome
      })
      .eq("teamName", teamName)
      .eq("date", scoreDate);

    if (picksUpdateError) {
      console.error(`Error updating picks outcome for ${teamName}:`, picksUpdateError);
      return;
    }

    console.log(`Updated outcome to ${teamOutcome} for all picks of team ${teamName} on ${scoreDate}`);

    // If the team didn't win, proceed with eliminations
    if (teamOutcome !== "win") {
      // Update the league_users table for the users who picked this team
      const updates = users.map(async (user) => {
        const { error: updateError } = await supabase
          .from("league_users")
          .update({
            isEliminated: true,
            canPick: false,
          })
          .eq("user_id", user.user_id)
          .eq("league_id", user.league_id);

        if (updateError) {
          console.error(
            `Error updating league_users for user ${user.user_id} in league ${user.league_id}:`,
            updateError
          );
        } else {
          console.log(`User ${user.user_id} in league ${user.league_id} has been eliminated for picking ${teamName}.`);
        }
      });

      // Wait for all updates to complete
      await Promise.all(updates);
      console.log(`All updates for team ${teamName} processed.`);
    }
  }

  // Check and update for the home team
  await updateEliminationsForTeam(score.homeTeam, score.homeOutcome);

  // Check and update for the away team
  await updateEliminationsForTeam(score.awayTeam, score.awayOutcome);
}

// Trigger the score scraping
//scrapeTodaysScores();

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  await scrapeTodaysScores();

  const data = {
    message: `Done`,
  };

  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/scrape-live-games' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
