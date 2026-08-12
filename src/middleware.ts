import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, gateBypassed, gateToken } from "@/lib/gate";

/**
 * Site lockdown. Every request — pages and API routes alike — is walled off
 * behind the password gate at /locked until a valid unlock cookie is
 * presented. See src/lib/gate.ts for the env switches.
 */
export async function middleware(req: NextRequest) {
  if (gateBypassed()) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // The gate's own endpoint must stay reachable so the form can submit.
  if (pathname === "/api/gate") return NextResponse.next();

  const token = await gateToken();
  const unlocked =
    token !== null && req.cookies.get(GATE_COOKIE)?.value === token;

  if (unlocked) {
    // No reason to look at the gate once through it.
    return pathname === "/locked"
      ? NextResponse.redirect(new URL("/", req.url))
      : NextResponse.next();
  }

  // Locked. Refuse API calls outright…
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "This site is locked." },
      { status: 423, headers: { "Cache-Control": "no-store" } },
    );
  }

  // …and show the gate for every page URL, without changing the address bar,
  // so bookmarked links land where they pointed once the site reopens.
  const res =
    pathname === "/locked"
      ? NextResponse.next()
      : NextResponse.rewrite(new URL("/locked", req.url));
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  // Gate everything except Next internals (static chunks, fonts, HMR), the
  // favicon set, social-preview images, and the brand logo the gate page
  // itself displays.
  matcher: [
    "/((?!_next/|favicon.ico|icon.png|apple-icon.png|opengraph-image.png|twitter-image.png|brand/).*)",
  ],
};
