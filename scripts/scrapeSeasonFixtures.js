import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

async function scrapeScores() {
  let games = [];
  let total = 0;
  const requestUrl = `https://www.bbc.co.uk/wc-data/container/sport-data-scores-fixtures?selectedEndDate=2025-08-01&selectedStartDate=2024-08-01&todayDate=2024-09-08&urn=urn%3Abbc%3Asportsdata%3Afootball%3Atournament%3Apremier-league&useSdApi=false`;
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
        league: event.tournament.name,
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
  console.log("Total games:", total);
  console.log("First game:", games[0]);
  console.log("Last game:", games[games.length - 1]);
}

async function saveScoresToDatabase(scores) {
  // Format the data for upsert
  const formattedScores = scores.map((score) => ({
    date: new Date(score.date),
    homeTeam: score.homeTeam,
    homeScore: score.homeScore,
    homeOutcome: score.homeOutcome,
    awayTeam: score.awayTeam,
    awayScore: score.awayScore,
    awayOutcome: score.awayOutcome,
    eventProgress: score.eventProgress,
    league: score.league, // Add the league field
    created_at: new Date(),
    updated_at: new Date(),
  }));

  // Perform upsert with update on conflict
  const { error } = await supabase.from("games").upsert(formattedScores, {
    onConflict: "homeTeam,awayTeam", // Specify conflict columns as a comma-separated string
    returning: true, // Optional: returns the affected rows
    ignoreDuplicates: false, // We want to update on conflicts, not ignore them
  });

  if (error) {
    console.error("Error upserting games:", error);
    throw error;
  } else {
    console.log("Scores upserted successfully!");
  }
}

scrapeScores();
