import { NextResponse } from "next/server";
import { ownerEmail, sendEmail } from "@/lib/email";
import { clientReminder } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import { shopNowHM, shopTodayISO } from "@/lib/shop-config";
import { addDaysISO, localStampMinutes } from "@/lib/time";

export const dynamic = "force-dynamic";

// Appointments are reminded once they fall within this many minutes of now.
const WINDOW_MIN = 24 * 60;

/**
 * GET|POST /api/cron/reminders — send 24h reminder emails.
 *
 * Protected by CRON_SECRET (header `Authorization: Bearer <secret>` or
 * `?secret=<secret>`). Designed to be hit by any external scheduler
 * (cron-job.org, GitHub Actions, etc.) roughly hourly — Render's free tier has
 * no built-in cron. `reminderSentAt` guards against duplicate sends, so running
 * it more often is harmless.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  return url.searchParams.get("secret") === secret || bearer === secret;
}

async function run(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured." }, { status: 503 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = shopTodayISO();
  const nowStamp = localStampMinutes(today, shopNowHM());
  // Anything within 24h is either today or tomorrow (salon-local).
  const horizon = addDaysISO(today, 1);

  const candidates = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      date: { gte: today, lte: horizon },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  let sent = 0;
  let skipped = 0;
  for (const a of candidates) {
    const minutesUntil = localStampMinutes(a.date, a.startTime) - nowStamp;
    if (minutesUntil <= 0 || minutesUntil > WINDOW_MIN) continue; // not in the next 24h

    if (!a.customerEmail) {
      // No address to remind — stamp it so we stop re-checking this one.
      await prisma.appointment.update({ where: { id: a.id }, data: { reminderSentAt: new Date() } });
      continue;
    }

    const result = await sendEmail({
      to: a.customerEmail,
      replyTo: ownerEmail(),
      ...clientReminder(a),
    });

    if (result.ok && !result.skipped) {
      await prisma.appointment.update({ where: { id: a.id }, data: { reminderSentAt: new Date() } });
      sent++;
    } else {
      skipped++; // delivery disabled or failed — leave it to retry next run
    }
  }

  return NextResponse.json({ ok: true, checked: candidates.length, sent, skipped });
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
