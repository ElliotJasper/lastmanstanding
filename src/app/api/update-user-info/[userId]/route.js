import { SupabaseClient } from "../../../../../lib/supabaseClient.ts";

export async function POST(req, { params }) {
  const { userId } = params; // Access userId from the route params

  const supabaseClient = new SupabaseClient();
  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const formData = await req.json();
  console.log("formdata: ", formData);

  // Use userId from params to update profile
  const userInfo = await supabaseClient.updateProfile(userId, formData.display_name);
  return new Response(JSON.stringify({ status: 200 }));
}
