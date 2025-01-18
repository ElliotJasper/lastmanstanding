import { SupabaseClient } from "../../../../../lib/supabaseClient.ts";

export async function POST(req, { params }) {
  const supabaseClient = new SupabaseClient();

  const userData = await supabaseClient.getAuthenticatedUser();
  if (!userData) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const formData = await req.json();

  if (formData.profile_picture) {
    try {
      // First, list and delete any existing avatar
      const { data: listData, error: listError } = await supabaseClient.client.storage.from("avatars").list();

      if (listError) {
        console.error("Error listing files:", listError);
        return new Response(JSON.stringify({ message: "Failed to check existing avatar" }), {
          status: 500,
        });
      }

      // Find existing avatar file for this user (checking all possible extensions)
      const existingAvatar = listData?.find((file) => file.name.startsWith(`${userData.id}.`));

      if (existingAvatar) {
        // Delete the existing avatar
        const { error: deleteError } = await supabaseClient.client.storage
          .from("avatars")
          .remove([existingAvatar.name]);

        if (deleteError) {
          console.error("Error deleting existing avatar:", deleteError);
          return new Response(JSON.stringify({ message: "Failed to delete existing avatar" }), {
            status: 500,
          });
        }
      }

      // Now proceed with uploading the new avatar
      const matches = formData.profile_picture.match(/^data:(image\/\w+);base64,/);
      const mimeType = matches ? matches[1] : "image/png";
      const extension = mimeType.split("/")[1];

      const base64Data = formData.profile_picture.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const filePath = `${userData.id}.${extension}`;
      const { error } = await supabaseClient.uploadAvatar(filePath, buffer, mimeType);

      if (error) {
        return new Response(JSON.stringify({ message: "Failed to upload avatar" }), {
          status: 500,
        });
      }
    } catch (error) {
      console.error("Avatar update error:", error);
      return new Response(JSON.stringify({ message: "Failed to process avatar update" }), {
        status: 500,
      });
    }
  }

  // Update profile info in your database
  const userInfo = await supabaseClient.updateProfile(userData.id, formData.display_name);
  return new Response(JSON.stringify({ status: 200 }));
}
