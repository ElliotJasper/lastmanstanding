import { createClient } from "../../../../utils/supabase/server.js";

export async function POST(req) {
  const supabase = createClient();
  const formData = await req.json();

  // Get the authenticated user from Supabase
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Check if the user is authenticated
  if (userError || !user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  // Check if the user is allowed to make a pick (i.e., canPick is true and isEliminated is false)
  const { data: leagueUser, error: leagueUserError } = await supabase
    .from("league_users")
    .select("canPick, isEliminated")
    .eq("user_id", formData.userId)
    .eq("league_id", parseInt(formData.leagueId))
    .single(); // We expect a single record (composite key)

  if (leagueUserError || !leagueUser) {
    console.error("Error fetching league user:", leagueUserError?.message);
    return new Response(JSON.stringify({ message: "User not found in league." }), {
      status: 400,
    });
  }

  // Check if the user can make a pick or is eliminated
  if (!leagueUser.canPick || leagueUser.isEliminated) {
    return new Response(JSON.stringify({ message: "You cannot make a pick at this time." }), {
      status: 400,
    });
  }

  // Fetch the user's previous picks for this league
  const { data: previousPicks, error: previousPicksError } = await supabase
    .from("picks")
    .select("teamName")
    .eq("user_id", formData.userId)
    .eq("league_id", parseInt(formData.leagueId));

  if (previousPicksError) {
    console.error("Error fetching previous picks:", previousPicksError.message);
    return new Response(JSON.stringify({ message: "Error fetching picks." }), {
      status: 500,
    });
  }

  // Extract team names from previous picks
  const teamNames = previousPicks.map((pick) => pick.teamName);
  console.log("User's previous picks:", teamNames);

  // Check if the selected team has already been picked
  if (teamNames.includes(formData.selectedPick.team)) {
    return new Response(JSON.stringify({ message: "You have already picked this team." }), {
      status: 400,
    });
  }

  // Insert the new pick into the database
  const { data: newPick, error: insertPickError } = await supabase
    .from("picks")
    .insert({
      user_id: formData.userId,
      league_id: parseInt(formData.leagueId),
      teamName: formData.selectedPick.team,
      date: formData.selectedPick.date,
    })
    .select(); // To return the inserted data if necessary

  if (insertPickError) {
    console.error("Error inserting new pick:", insertPickError.message);
    return new Response(JSON.stringify({ message: "Error submitting pick." }), {
      status: 500,
    });
  }

  // Update the user's canPick status to false
  const { error: updateCanPickError } = await supabase
    .from("league_users")
    .update({ canPick: false })
    .eq("user_id", formData.userId)
    .eq("league_id", parseInt(formData.leagueId));

  if (updateCanPickError) {
    console.error("Error updating canPick status:", updateCanPickError.message);
    return new Response(JSON.stringify({ message: "Error updating user status." }), {
      status: 500,
    });
  }

  console.log("Inserted pick:", newPick);

  return new Response(JSON.stringify({ message: "Pick submitted successfully." }), {
    status: 200,
  });
}
