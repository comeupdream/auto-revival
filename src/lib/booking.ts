import { BLOCKING_STATUSES } from "./appointment-status";
import { BusyBlock, hasConflict, isWithinHours } from "./availability";
import { ownerEmail, sendEmail } from "./email";
import { clientBookingConfirmation, ownerNewBooking, type EmailAppointment } from "./email-templates";
import { prisma } from "./prisma";
import { SHOP, shopTodayISO } from "./shop-config";
import { addDaysISO, isValidDateISO, isValidTime } from "./time";

/** Existing appointments that occupy the calendar on a given date. */
export async function getBusyBlocks(dateISO: string): Promise<BusyBlock[]> {
  return prisma.appointment.findMany({
    where: { date: dateISO, status: { in: BLOCKING_STATUSES } },
    select: { startTime: true, durationMinutes: true },
  });
}

export type CreateBookingInput = {
  serviceId: string;
  date: string;
  startTime: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  vehicle?: string;
  notes?: string;
  source?: "online" | "admin";
  /** Admin bookings may bypass the lead-time / horizon limits. */
  bypassWindowChecks?: boolean;
  /** Which confirmation emails to fire. Defaults to both. */
  notify?: { client?: boolean; owner?: boolean };
};

export type CreateBookingResult =
  | { ok: true; appointmentId: string }
  | { ok: false; error: string; code: number };

/**
 * Validate + create an appointment with a server-side conflict check.
 * Shared by the public booking form and the admin "add appointment" action.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const name = input.customerName?.trim();
  if (!name) return { ok: false, error: "A name is required.", code: 400 };

  if (!isValidDateISO(input.date))
    return { ok: false, error: "Invalid date.", code: 400 };
  if (!isValidTime(input.startTime))
    return { ok: false, error: "Invalid time.", code: 400 };

  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
  });
  if (!service || !service.active)
    return { ok: false, error: "That service is unavailable.", code: 400 };

  // Date-window checks (skipped for admin walk-ins).
  if (!input.bypassWindowChecks) {
    const today = shopTodayISO();
    if (input.date < today)
      return { ok: false, error: "That date is in the past.", code: 400 };
    const horizon = addDaysISO(today, SHOP.bookingHorizonDays);
    if (input.date > horizon)
      return {
        ok: false,
        error: `Bookings are open up to ${SHOP.bookingHorizonDays} days out.`,
        code: 400,
      };
  }

  if (!isWithinHours(input.date, input.startTime, service.durationMinutes))
    return { ok: false, error: "We're closed at that time.", code: 409 };

  const busy = await getBusyBlocks(input.date);
  if (hasConflict(input.startTime, service.durationMinutes, busy))
    return {
      ok: false,
      error: "Sorry — that time was just taken. Please pick another.",
      code: 409,
    };

  const appt = await prisma.appointment.create({
    data: {
      serviceId: service.id,
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
      date: input.date,
      startTime: input.startTime,
      customerName: name,
      customerEmail: input.customerEmail?.trim() ?? "",
      customerPhone: input.customerPhone?.trim() ?? "",
      vehicle: input.vehicle?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      status: "CONFIRMED",
      source: input.source ?? "online",
    },
  });

  await sendBookingEmails(appt, input.notify);

  return { ok: true, appointmentId: appt.id };
}

/**
 * Fire the confirmation (client) + alert (owner) emails for a new booking.
 * Failures are swallowed inside sendEmail, so this never breaks a booking.
 */
async function sendBookingEmails(
  appt: EmailAppointment,
  notify: CreateBookingInput["notify"],
): Promise<void> {
  const wantClient = notify?.client ?? true;
  const wantOwner = notify?.owner ?? true;

  const tasks: Promise<unknown>[] = [];
  if (wantClient && appt.customerEmail) {
    tasks.push(
      sendEmail({ to: appt.customerEmail, replyTo: ownerEmail(), ...clientBookingConfirmation(appt) }),
    );
  }
  if (wantOwner) {
    tasks.push(
      sendEmail({
        to: ownerEmail(),
        replyTo: appt.customerEmail || undefined,
        ...ownerNewBooking(appt),
      }),
    );
  }
  await Promise.allSettled(tasks);
}
