import { NextRequest, NextResponse } from "next/server";

/**
 * Site freeze.
 *
 * Every request — pages, API routes, admin, assets — is answered with a bare
 * 503 notice. Nothing else in the app runs while this is on.
 *
 * The freeze is ON by default. To bring the site back up, set SITE_FROZEN to
 * "false" (or "0" / "off") in the host's environment and redeploy; no code
 * change is needed.
 */

const NOTICE = "SITE DOWN UNTIL PAYMENT RENDERED";

function isFrozen(): boolean {
  const flag = (process.env.SITE_FROZEN || "").trim().toLowerCase();
  return !(flag === "false" || flag === "0" || flag === "off");
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${NOTICE}</title>
<style>
  html,body{height:100%;margin:0}
  body{
    display:flex;align-items:center;justify-content:center;
    background:#000;color:#fff;
    font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;
    text-align:center;padding:1.5rem;
  }
  p{
    margin:0;font-size:clamp(1.1rem,4.5vw,2rem);
    font-weight:600;letter-spacing:.08em;line-height:1.4;
  }
</style>
</head>
<body><p>${NOTICE}</p></body>
</html>`;

export function middleware(request: NextRequest) {
  if (!isFrozen()) return NextResponse.next();

  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Retry-After": "3600",
    "X-Robots-Tag": "noindex, nofollow",
  };

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: NOTICE },
      { status: 503, headers },
    );
  }

  return new NextResponse(PAGE, {
    status: 503,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}

// Match everything. No route, asset, or API endpoint is exempt.
export const config = {
  matcher: "/:path*",
};
