import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "revival_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function secret(): string {
  return process.env.SESSION_SECRET || "insecure-dev-secret-change-me";
}

/** Constant-time string compare. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Create a signed session token: base64url(payload).hmac */
export function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", iat: Date.now() }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token?: string | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return safeEqual(sig, expected);
}

/** Check the password against ADMIN_PASSWORD (constant-time). */
export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "revival-admin";
  return safeEqual(password, expected);
}

/** Read the admin cookie and verify it. For server components & route handlers. */
export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export const sessionCookieOptions = {
  name: ADMIN_COOKIE,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
