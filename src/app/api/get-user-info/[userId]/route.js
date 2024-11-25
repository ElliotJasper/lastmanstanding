import { SupabaseClient } from "../../../../../lib/supabaseClient.ts";

export async function GET(req, { params }) {
  const { userId } = params;

  const supabaseClient = new SupabaseClient();

  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const userInfo = await supabaseClient.getProfile(userData.id);
  return new Response(JSON.stringify(userInfo), { status: 200 });
}
