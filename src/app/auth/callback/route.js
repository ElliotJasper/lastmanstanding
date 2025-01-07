export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "../../../../utils/supabase/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    
    // If "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/";
    const isLocalEnv = process.env.NODE_ENV === "development";

    if (!code) {
      console.error("No code provided in callback");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/auth-code-error`);
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/auth-code-error`);
    }

    const forwardedHost = request.headers.get("x-forwarded-host"); // Original origin before load balancer
    let baseUrl;

    if (isLocalEnv) {
      // In development, use the origin from the request
      baseUrl = `http://${request.headers.get("host")}`;
    } else if (process.env.NEXT_PUBLIC_SITE_URL) {
      // In production, rely on the environment variable for the site URL
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    } else if (forwardedHost) {
      // Fallback if no NEXT_PUBLIC_SITE_URL but forwardedHost is available
      baseUrl = `https://${forwardedHost}`;
    } else {
      // Final fallback
      baseUrl = `https://${request.headers.get("host")}`;
    }

    const supabase = await createClient();

    if (token_hash && type == "email") {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
      } else {
        return NextResponse.redirect(next);
      }
    } else if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
      }
    }

    return NextResponse.redirect(`${baseUrl}${next}`);
  } catch (error) {
    console.error("Unexpected error in callback:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/auth/auth-code-error`);
  }
}
