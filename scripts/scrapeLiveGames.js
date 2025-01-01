import { generateFormattedDatesUntilSunday } from "../lib/utils.js";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

export async function scrapeTodaysScores() {
  let games = [];
  let total = 0;
  const todayDate = generateFormattedDatesUntilSunday()[0].formatDateAPI;
  console.log(todayDate);
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
      onConflict: ["date", "homeTeam", "awayTeam"], // Specify the unique constraint columns
    }
  );

  if (error) {
    console.error("Error upserting games:", error);
  } else {
    console.log("Scores upserted successfully!");
  }
}

async function TestFunction(score) {
  const scoreDate = new Date(score.date).toISOString().slice(0, -5);

  // Function to update users based on team picks
  async function updateEliminationsForTeam(teamName, teamOutcome) {
    if (teamOutcome !== "win") {
      // Find all users who picked the team (either home or away) based on teamName and date
      const { data: users, error: fetchError } = await supabase
        .from("picks")
        .select("user_id, league_id")
        .eq("teamName", teamName) // Match the team name
        .eq("date", scoreDate); // Match the date

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
