import { NextResponse } from "next/server";
import { GATE_COOKIE, deriveGateToken, gateToken } from "@/lib/gate";

export const dynamic = "force-dynamic";

const WRONG = "Incorrect password.";

/** Attempt to open the site-wide lockdown gate. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const password =
    body && typeof body.password === "string" ? body.password : "";

  const expected = await gateToken();

  // While SITE_GATE_PASSWORD is unset, `expected` is null: every attempt
  // lands here and the site stays sealed.
  if (!expected || !password) {
    return NextResponse.json({ error: WRONG }, { status: 401 });
  }

  // Digest-vs-digest comparison, so a mismatch reveals nothing via timing.
  const provided = await deriveGateToken(password);
  if (provided !== expected) {
    return NextResponse.json({ error: WRONG }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: GATE_COOKIE,
    value: expected,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
