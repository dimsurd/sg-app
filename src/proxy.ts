import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "sg_app_session";

/**
 * Optimistic routing only. Reads the role from the session JWT payload
 * WITHOUT verifying it, purely to send tutors to /tutor and students to
 * /student. Every API call still verifies the token and the role, so a forged
 * cookie gets a page shell and nothing else.
 */
function roleFromToken(token: string | undefined): "tutor" | "student" | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const role = JSON.parse(atob(payload)).role;
    return role === "tutor" || role === "student" ? role : null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = roleFromToken(request.cookies.get(SESSION_COOKIE)?.value);
  const home = role ? `/${role}` : "/login";

  if (pathname === "/login") {
    return role ? NextResponse.redirect(new URL(home, request.url)) : NextResponse.next();
  }
  if (pathname === "/offline") return NextResponse.next();
  if (!role) return NextResponse.redirect(new URL("/login", request.url));
  if (pathname === "/" || !pathname.startsWith(home)) {
    return NextResponse.redirect(new URL(home, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip API, all framework internals (/_next/*, /__nextjs*), and PWA/static files.
    "/((?!api|_next|__next|favicon.ico|sw.js|manifest.webmanifest|pwa-icon|.*\\.(?:svg|png|jpg|ico|webp|js|map)$).*)",
  ],
};
