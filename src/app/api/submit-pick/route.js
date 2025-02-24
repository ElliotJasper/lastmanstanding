import { createClient } from "../../../../utils/supabase/server.js";
import { SupabaseClient } from "../../../../lib/supabaseClient.ts";

export async function POST(req) {
  try {
    const supabaseClient = new SupabaseClient();

    // Check authenticated user using supabaseClient
    const userData = await supabaseClient.getAuthenticatedUser();
    if (!userData) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    // Parse request body
    let formData;
    try {
      formData = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({ message: "Invalid request body" }), {
        status: 400,
      });
    }

    // Validate required fields
    if (!formData.leagueId || !formData.selectedPick?.team || !formData.selectedPick?.date) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
      });
    }

    // Check league user status
    let leagueUserData;
    try {
      leagueUserData = await supabaseClient.getLeagueUserData(userData.id, formData.leagueId);
    } catch (error) {
      return new Response(JSON.stringify({ message: "Error fetching league user data" }), {
        status: 500,
      });
    }

    if (!leagueUserData.canPick || leagueUserData.isEliminated) {
      return new Response(JSON.stringify({ message: "You cannot make a pick at this time." }), {
        status: 400,
      });
    }

    // Check previous picks
    let previousPicks;
    try {
      previousPicks = await supabaseClient.getUserPicks(userData.id, formData.leagueId);
    } catch (error) {
      return new Response(JSON.stringify({ message: "Error fetching previous picks" }), {
        status: 500,
      });
    }

    const teamNames = previousPicks.map((pick) => pick.teamName);
    if (teamNames.includes(formData.selectedPick.team)) {
      return new Response(JSON.stringify({ message: "You have already picked this team." }), {
        status: 400,
      });
    }

    // Ensure the pick is real
    try {
      const { date, team } = formData.selectedPick;
      const game = await supabaseClient.getSingleGame(date, team);

      if (game.length < 1) {
        return new Response(JSON.stringify({ message: "This pick is not valid." }), {
          status: 400,
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ message: "Error checking pick." }), {
        status: 500,
      });
    }

    // Submit the pick
    try {
      await supabaseClient.submitPick(
        userData.id,
        formData.leagueId,
        formData.selectedPick.team,
        formData.selectedPick.date
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          message: "Error submitting pick",
          error: error.message,
        }),
        {
          status: 500,
        }
      );
    }

    return new Response(JSON.stringify({ ok: "Pick submitted successfully." }), {
      status: 200,
    });
  } catch (error) {
    // Catch any unexpected errors
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        message: "An unexpected error occurred",
        error: error.message,
      }),
      {
        status: 500,
      }
    );
  }
}
