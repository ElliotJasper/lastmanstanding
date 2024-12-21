// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "jsr:@supabase/supabase-js";

function isBeforeThursdayMidnight() {
  // Get the current date and time
  const now = new Date();

  // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = now.getDay();

  // Get the current year, month, and date
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const date = now.getDate();

  // Calculate the upcoming Thursday midnight
  let thursdayMidnight;
  if (dayOfWeek <= 4) {
    // If today is Sunday (0) to Thursday (4)
    thursdayMidnight = new Date(year, month, date + (4 - dayOfWeek) + 1);
  } else {
    // If today is Friday (5) or Saturday (6), move to next week's Thursday
    thursdayMidnight = new Date(year, month, date + (11 - dayOfWeek));
  }
  // Set the time for Thursday midnight (start of Friday)
  thursdayMidnight.setHours(0, 0, 0, 0);

  // Return true if the current time is before Thursday midnight
  return now < thursdayMidnight;
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

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

async function scrapeTodaysScores() {
  let games = [];
  let total = 0;
  const todayDate = generateFormattedDatesUntilSunday()[0].formatDateAPI;
  const requestUrl = `https://www.bbc.co.uk/wc-data/container/sport-data-scores-fixtures?selectedEndDate=${todayDate}&selectedStartDate=${todayDate}&todayDate=${todayDate}&urn=urn%3Abbc%3Asportsdata%3Afootball%3Atournament%3Apremier-league&useSdApi=false`;

  const response = await fetch(requestUrl);
  const data = await response.json();
  let path = data.eventGroups;

  for (let eventGroup of path) {
    path = eventGroup.secondaryGroups[0].events;
    for (let event of path) {
      total++;
      let game = {
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

  if (games.length > 0) {
    await saveScoresToDatabase(games);
  } else {
    console.log("No games today");
  }
}

async function saveScoresToDatabase(scores) {
  // Retrieve the current game records from the database for comparison
  const { data: existingGames, error: fetchError } = await supabase
    .from("games")
    .select("date, homeTeam, awayTeam, eventProgress")
    .in(
      "date",
      scores.map((score) => new Date(score.date).toISOString())
    );
  console.log("date", existingGames[0].date);

  if (fetchError) {
    console.error("Error fetching existing games:", fetchError);
    return;
  }

  // Compare eventProgress and call TestFunction if transitioning to 'PostEvent'
  scores.forEach((score) => {
    const scoreDate = new Date(score.date).toISOString().slice(0, -5);
    const existingGame = existingGames.find(
      (g) => g.date === scoreDate && g.homeTeam === score.homeTeam && g.awayTeam === score.awayTeam
    );

    if (existingGame) {
      if (existingGame.eventProgress !== "PostEvent" && score.eventProgress === "PostEvent") {
        console.log("PostEvent detected, calling TestFunction for:", score.homeTeam, "vs", score.awayTeam);
        TestFunction(score);
      }
    }

    if (existingGame) {
      if (existingGame.eventProgress !== "Postponed" && score.eventProgress === "Postponed") {
        console.log("Postponed detected, calling TestFunction for:", score.homeTeam, "vs", score.awayTeam);
        EliminateFunction(score);
      }
    }
  });

  // Perform upsert into the database using Supabase
  const { error } = await supabase.from("games").upsert(
    scores.map((score) => ({
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
      onConflict: ["date", "homeTeam", "awayTeam"],
    }
  );

  if (error) {
    console.error("Error upserting games:", error);
  } else {
    console.log("Scores upserted successfully!");
  }
}

async function EliminateFunction(score) {
  let isBeforeThursdayMidnight = isBeforeThursdayMidnight();
  const scoreDate = new Date(score.date).toISOString();

  if (isBeforeThursdayMidnight) {
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
          .update({ canPick: true })
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
      .eq("date", score.date);

    // Delete picks for the away team with the old date
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
  } else {
    // Set isEliminated to true for users who picked the home team
    const { error: updateHomeUsersError } = await supabase
      .from("league_users")
      .update({ isEliminated: true, canPick: false })
      .eq("teamName", score.homeTeam)
      .eq("date", score.date);

    // Set isEliminated to true for users who picked the away team
    const { error: updateAwayUsersError } = await supabase
      .from("league_users")
      .update({ isEliminated: true, canPick: false })
      .eq("teamName", score.awayTeam)
      .eq("date", score.date);

    if (updateHomeUsersError) {
      console.error(`Error updating league_users for home team ${score.homeTeam}:`, updateHomeUsersError);
    }
    if (updateAwayUsersError) {
      console.error(`Error updating league_users for away team ${score.awayTeam}:`, updateAwayUsersError);
    }
  }
}

async function TestFunction(score) {
  const scoreDate = new Date(score.date).toISOString();
  console.log(score);
  async function updateEliminationsForTeam(teamName, teamOutcome) {
    if (teamOutcome !== "win") {
      // Find all users who picked the team (either home or away) based on teamName and date
      const { data: users, error: fetchError } = await supabase
        .from("picks")
        .select("user_id, league_id")
        .eq("teamName", teamName) // Match the team name
        .eq("date", scoreDate); // Match the date
      console.log("USERS", users);
      if (fetchError) {
        console.error(`Error fetching users who picked ${teamName}:`, fetchError);
        return;
      }

      console.log("Team:", teamName);
      console.log("Score Date:", scoreDate);
      console.log(`Users who picked ${teamName}:`, users);

      if (users.length === 0) {
        console.log(`No users picked ${teamName}.`);
        return;
      }

      // Update the league_users table for the users who picked this team
      const updates = users.map(async (user) => {
        const { error: updateError } = await supabase
          .from("league_users")
          .update({
            isEliminated: true, // Mark the user as eliminated
            canPick: false, // Prevent them from picking further
          })
          .eq("user_id", user.user_id) // Match the user_id from picks
          .eq("league_id", user.league_id); // Match the league_id from picks

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
