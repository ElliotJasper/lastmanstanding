import { createClient } from "@supabase/supabase-js";
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

console.log(isBeforeThursdayMidnight());

async function scrapeScores() {
  let games = [];
  let total = 0;
  const todayDate = generateFormattedDatesUntilSunday()[0].formatDateAPI;
  const requestUrl = `https://www.bbc.co.uk/wc-data/container/sport-data-scores-fixtures?selectedEndDate=2025-08-01&selectedStartDate=${todayDate}&todayDate=${todayDate}&urn=urn%3Abbc%3Asportsdata%3Afootball%3Atournament%3Apremier-league&useSdApi=false`;
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

  await saveScoresToDatabase(games);
  console.log("Total games:", total);
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
    const { error } = await supabase.from("games").upsert(
      scoresToUpsert.map((score) => ({
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
        const shouldResetPicks = isBeforeThursdayMidnight();

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
        if (shouldResetPicks && homePicksToDelete && homePicksToDelete.length > 0) {
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
        if (shouldResetPicks && awayPicksToDelete && awayPicksToDelete.length > 0) {
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

scrapeScores();
