import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirect for signed-out visitors (Next 16 replaced middleware
 * with proxy).
 *
 * This only looks for the presence of a session cookie — it is a UX
 * shortcut, not a security control. Every workspace page and API route
 * independently loads the session, re-reads the role from the database, and
 * checks permissions.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/maintenance",
    "/inventory",
    "/shift-log",
    "/follow-ups",
    "/team",
    "/audit-log",
  ],
};
