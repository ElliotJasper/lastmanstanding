import { SupabaseClient } from "../../../../lib/supabaseClient";
export async function GET(req) {
  const supabaseClient = new SupabaseClient();

  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  // Fetch the league isactive / other info
  const avatar = await supabaseClient.downloadAvatar(userData.id);
  return new Response(avatar, { status: 200 });
}
