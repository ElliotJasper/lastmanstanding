import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Check if the user is already logged in
// And redirect them to the fixtures page (away from the login page)

export function middleware(req) {
  const isLoggedIn = req.cookies.get("sessionId")?.value;
  if (isLoggedIn) {
    return Response.redirect("http://localhost:3000/fixtures");
  }
}

export const config = {
  matcher: ["/login"],
};
