export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "../../../../utils/supabase/server";

export async function GET(request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/home";

    if (!code) {
      console.error("No code provided in callback");
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = request.headers.get("host");

    let baseUrl;
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    } else if (process.env.NODE_ENV === "development") {
      baseUrl = origin;
    } else {
      baseUrl = forwardedHost ? `https://${forwardedHost}` : `https://${host}`;
    }

    const redirectUrl = `${baseUrl}${next}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }
}
