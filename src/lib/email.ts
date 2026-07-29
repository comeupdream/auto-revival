/**
 * Transactional email sending.
 *
 * Talks to Resend's REST API directly (no SDK dependency) so the build stays
 * light and the provider is easy to swap. Sending is a safe no-op (logged,
 * never thrown) until RESEND_API_KEY is set — so the booking flow works with
 * or without email configured, and a provider hiccup can never fail a booking.
 *
 * Env to actually send mail:
 *   RESEND_API_KEY  – from https://resend.com  → API Keys
 *   EMAIL_FROM      – a verified sender, e.g. "Revive Detail <hello@yourdomain>"
 *                     (falls back to Resend's onboarding@resend.dev test sender)
 *   OWNER_EMAIL     – where new-booking alerts go (defaults to SHOP.email)
 */
import { SHOP } from "./shop-config";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Whether real email delivery is configured. */
export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** The "From" header. onboarding@resend.dev works without domain verification
 *  but only delivers to your own Resend account email — fine for a first test. */
export function emailFrom(): string {
  return process.env.EMAIL_FROM || `${SHOP.name} <onboarding@resend.dev>`;
}

/** Where owner-facing alerts are sent. */
export function ownerEmail(): string {
  return process.env.OWNER_EMAIL || SHOP.email;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; id?: string; skipped?: boolean }
  | { ok: false; error: string };

/** Send one email. Never throws — returns a result object instead. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipients = (Array.isArray(input.to) ? input.to : [input.to])
    .map((t) => t.trim())
    .filter(Boolean);
  if (recipients.length === 0) return { ok: false, error: "No recipient." };

  if (!isEmailEnabled()) {
    // Not configured yet — visible in logs, but the flow continues normally.
    console.info(
      `[email] skipped (RESEND_API_KEY unset): "${input.subject}" -> ${recipients.join(", ")}`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: recipients,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] send failed (${res.status}): ${detail}`);
      return { ok: false, error: `Provider responded ${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[email] send threw:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
