/**
 * Branded, email-client-safe HTML for the shop's transactional messages.
 *
 * Email clients ignore <style>/external CSS and strip many tags, so everything
 * here is built from tables + inline styles. Each builder returns a subject and
 * both an HTML and a plain-text body.
 */
import { formatDateLong, formatDuration, formatPrice, formatTime12 } from "./format";
import { SHOP } from "./shop-config";

/** The appointment fields the templates need (a Prisma Appointment satisfies this). */
export type EmailAppointment = {
  id: string;
  serviceName: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  priceCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicle: string;
  notes: string;
};

export type BuiltEmail = { subject: string; html: string; text: string };

const GOLD = "#B08D28"; // deep gold — reads well on white
const GOLD_BAR = "#D4AF37";
const INK = "#141414";
const MUTED = "#6E675C";
const PAPER = "#F7F4EC";
const LINE = "#E7E0D2";

/** Escape user-supplied text before placing it into HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://revivedetail.autos").replace(/\/$/, "");
}

/** Branded shell around a message body (raw, already-escaped HTML). */
function shell(opts: { preheader: string; eyebrow: string; heading: string; body: string }): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${PAPER};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:28px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${LINE};border-radius:18px;overflow:hidden;">
        <tr><td style="background:#0A0A0B;padding:14px 38px;">
          <span style="font-family:Georgia,'Times New Roman',serif;color:${GOLD_BAR};font-size:17px;letter-spacing:3px;font-weight:700;">AUTO&nbsp;REVIVAL</span>
        </td></tr>
        <tr><td style="background:${GOLD_BAR};height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:30px 38px 6px;">
          <div style="font-family:Helvetica,Arial,sans-serif;color:${GOLD};font-size:12px;letter-spacing:3px;text-transform:uppercase;">${esc(opts.eyebrow)}</div>
          <h1 style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;color:${INK};font-size:25px;font-weight:600;">${esc(opts.heading)}</h1>
        </td></tr>
        <tr><td style="padding:14px 38px 28px;font-family:Helvetica,Arial,sans-serif;color:${INK};font-size:15px;line-height:1.65;">
          ${opts.body}
        </td></tr>
        <tr><td style="padding:20px 38px 28px;border-top:1px solid ${LINE};font-family:Helvetica,Arial,sans-serif;color:${MUTED};font-size:12px;line-height:1.6;">
          <strong style="color:${INK};">${esc(SHOP.name)}</strong><br/>
          ${esc(SHOP.address)}, ${esc(SHOP.cityLine)}<br/>
          ${esc(SHOP.phone)} &middot; ${esc(SHOP.email)}
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

function detailsTable(a: EmailAppointment): string {
  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:7px 2px;color:${MUTED};font-size:13px;">${label}</td>
      <td style="padding:7px 2px;text-align:right;color:${INK};font-weight:600;">${value}</td>
    </tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="margin:18px 0;background:${PAPER};border:1px solid ${LINE};border-radius:12px;padding:4px 16px;">
    ${row("Service", esc(a.serviceName))}
    ${a.vehicle ? row("Vehicle", esc(a.vehicle)) : ""}
    ${row("Date", formatDateLong(a.date))}
    ${row("Drop-off", formatTime12(a.startTime))}
    ${row("Duration", formatDuration(a.durationMinutes))}
    ${a.priceCents ? row("Price", formatPrice(a.priceCents)) : ""}
  </table>`;
}

function detailsText(a: EmailAppointment): string {
  const lines = [`  Service:   ${a.serviceName}`];
  if (a.vehicle) lines.push(`  Vehicle:   ${a.vehicle}`);
  lines.push(
    `  Date:      ${formatDateLong(a.date)}`,
    `  Drop-off:  ${formatTime12(a.startTime)}`,
    `  Duration:  ${formatDuration(a.durationMinutes)}`,
  );
  if (a.priceCents) lines.push(`  Price:     ${formatPrice(a.priceCents)}`);
  return lines.join("\n");
}

function footerText(): string {
  return `${SHOP.name}\n${SHOP.address}, ${SHOP.cityLine}\n${SHOP.phone} · ${SHOP.email}`;
}

// --------------------------------------------------------------- Client: booked
export function clientBookingConfirmation(a: EmailAppointment): BuiltEmail {
  const subject = `You're booked — ${formatDateLong(a.date)} at ${formatTime12(a.startTime)}`;
  const body = `
    <p style="margin:0 0 4px;">Hi ${esc(firstName(a.customerName))}, your appointment at ${esc(SHOP.name)} is confirmed — we can't wait to get to work.</p>
    ${detailsTable(a)}
    <p style="color:${MUTED};font-size:13px;margin:0;">Need to change or cancel? Just reply to this email or call us at ${esc(SHOP.phone)}.</p>`;
  const text =
    `Hi ${firstName(a.customerName)}, your appointment at ${SHOP.name} is confirmed.\n\n` +
    detailsText(a) +
    `\n\nNeed to change or cancel? Reply to this email or call ${SHOP.phone}.\n\n${footerText()}`;
  return {
    subject,
    html: shell({ preheader: "Your detail is booked.", eyebrow: "Booking confirmed", heading: "You're booked!", body }),
    text,
  };
}

// ----------------------------------------------------------- Owner: new booking
export function ownerNewBooking(a: EmailAppointment): BuiltEmail {
  const subject = `New booking · ${a.customerName} · ${formatDateLong(a.date)} ${formatTime12(a.startTime)}`;
  const contactRow = (label: string, value: string) =>
    `<tr><td style="padding:4px 2px;color:${MUTED};font-size:13px;">${label}</td><td style="padding:4px 2px;text-align:right;color:${INK};">${value}</td></tr>`;
  const contact = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:2px 0 0;">
      ${contactRow("Client", `<strong>${esc(a.customerName)}</strong>`)}
      ${a.customerPhone ? contactRow("Phone", esc(a.customerPhone)) : ""}
      ${a.customerEmail ? contactRow("Email", esc(a.customerEmail)) : ""}
    </table>`;
  const body = `
    <p style="margin:0 0 4px;">A new appointment just came in.</p>
    ${detailsTable(a)}
    ${contact}
    ${a.notes ? `<p style="margin:16px 0 0;"><span style="color:${MUTED};font-size:13px;">Notes:</span><br/>${esc(a.notes)}</p>` : ""}
    <p style="margin:18px 0 0;"><a href="${siteUrl()}/admin" style="color:${GOLD};font-weight:600;text-decoration:none;">Open the job book →</a></p>`;
  const text =
    `New appointment at ${SHOP.name}.\n\n` +
    detailsText(a) +
    `\n\n  Client:    ${a.customerName}` +
    (a.customerPhone ? `\n  Phone:     ${a.customerPhone}` : "") +
    (a.customerEmail ? `\n  Email:     ${a.customerEmail}` : "") +
    (a.notes ? `\n\nNotes: ${a.notes}` : "") +
    `\n\nAdmin: ${siteUrl()}/admin`;
  return {
    subject,
    html: shell({ preheader: `${a.customerName} — ${formatDateLong(a.date)}`, eyebrow: "New booking", heading: "New appointment", body }),
    text,
  };
}

// ------------------------------------------------------------ Client: cancelled
export function clientCancellation(a: EmailAppointment): BuiltEmail {
  const subject = `Cancelled — your ${SHOP.shortName} appointment on ${formatDateLong(a.date)}`;
  const body = `
    <p style="margin:0 0 4px;">Hi ${esc(firstName(a.customerName))}, the appointment below has been cancelled.</p>
    ${detailsTable(a)}
    <p style="margin:0;">Changed your mind? We'd love to get your car in — <a href="${siteUrl()}/book" style="color:${GOLD};font-weight:600;">book a new time</a> or call us at ${esc(SHOP.phone)}.</p>`;
  const text =
    `Hi ${firstName(a.customerName)}, the appointment below has been cancelled.\n\n` +
    detailsText(a) +
    `\n\nBook a new time: ${siteUrl()}/book  ·  or call ${SHOP.phone}\n\n${footerText()}`;
  return {
    subject,
    html: shell({ preheader: "Your appointment has been cancelled.", eyebrow: "Booking update", heading: "Appointment cancelled", body }),
    text,
  };
}

// ------------------------------------------------------------- Client: reminder
export function clientReminder(a: EmailAppointment): BuiltEmail {
  const subject = `Reminder · ${SHOP.shortName} on ${formatDateLong(a.date)} at ${formatTime12(a.startTime)}`;
  const body = `
    <p style="margin:0 0 4px;">Hi ${esc(firstName(a.customerName))}, just a friendly reminder about your upcoming detail. Please clear out any personal items before drop-off.</p>
    ${detailsTable(a)}
    <p style="color:${MUTED};font-size:13px;margin:0;">Can't make it? Reply to this email or call ${esc(SHOP.phone)} and we'll find a better time.</p>`;
  const text =
    `Hi ${firstName(a.customerName)}, a friendly reminder about your upcoming detail. Please clear out any personal items before drop-off.\n\n` +
    detailsText(a) +
    `\n\nCan't make it? Reply to this email or call ${SHOP.phone}.\n\n${footerText()}`;
  return {
    subject,
    html: shell({ preheader: "A reminder about your upcoming detail.", eyebrow: "See you soon", heading: "Appointment reminder", body }),
    text,
  };
}
