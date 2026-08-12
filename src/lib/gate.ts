/**
 * Site-wide password gate ("lockdown").
 *
 * While lockdown is on, src/middleware.ts walls off every page and API route
 * behind the gate at /locked. Two environment variables control it:
 *
 *   SITE_LOCKDOWN       Lockdown is ON unless this is set to "0" / "false" /
 *                       "off". Unset means LOCKED — deploying this code is
 *                       what seals the site.
 *   SITE_GATE_PASSWORD  The password that opens the gate. While it is unset
 *                       or empty, NO password is accepted and the site stays
 *                       fully bricked.
 *
 * Everything here sticks to the Web Crypto API so the same code runs in
 * middleware and in Node route handlers.
 */

export const GATE_COOKIE = "revival_gate";

/** True when the gate is switched off entirely (site fully public). */
export function gateBypassed(): boolean {
  const v = (process.env.SITE_LOCKDOWN || "").trim().toLowerCase();
  return v === "0" || v === "false" || v === "off";
}

/** SHA-256 hex of the given string. */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derive the unlock token for a password candidate. SESSION_SECRET is mixed
 * in so the cookie value can't be forged (or cracked offline) without it.
 */
export async function deriveGateToken(password: string): Promise<string> {
  const secret = process.env.SESSION_SECRET || "insecure-dev-secret-change-me";
  return sha256Hex(`revival-gate-v1|${secret}|${password}`);
}

/**
 * The one token that unlocks the site, or null while no password is
 * configured — in which case nothing validates and every attempt fails.
 */
export async function gateToken(): Promise<string | null> {
  const password = process.env.SITE_GATE_PASSWORD;
  if (!password) return null;
  return deriveGateToken(password);
}
