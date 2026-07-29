/**
 * Personal / blocked time imported from the owner's calendar.
 *
 * Each entry becomes a bare "Blocked" appointment — date, time, and length
 * only, no price, no customer info. Status CONFIRMED makes the booking
 * engine treat the window as busy, hiding any arrival slot whose job would
 * overlap it. The seed upserts these on every deploy.
 *
 * Managing blocks:
 *  - Add a block: add a line here and deploy (or add an appointment named
 *    "Blocked" in the admin job book by hand).
 *  - Free a slot permanently: delete the line HERE first, then delete the
 *    row in the admin job book — deploys re-insert entries still listed
 *    here.
 *
 * Times are shop-local 24h "HH:MM"; minutes is how long the window lasts.
 */
export type PersonalBlock = {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  minutes: number;
};

const HOUR = 60;

export const PERSONAL_BLOCKS: PersonalBlock[] = [
  // Wed Jul 29
  { date: "2026-07-29", time: "09:30", minutes: HOUR },
  { date: "2026-07-29", time: "12:30", minutes: HOUR },
  { date: "2026-07-29", time: "16:30", minutes: HOUR },
  // Thu Jul 30
  { date: "2026-07-30", time: "10:30", minutes: HOUR },
  { date: "2026-07-30", time: "12:30", minutes: HOUR },
  // Fri Jul 31
  { date: "2026-07-31", time: "11:30", minutes: HOUR },
  // Sat Aug 1
  { date: "2026-08-01", time: "09:30", minutes: HOUR },
  { date: "2026-08-01", time: "13:30", minutes: HOUR },
  { date: "2026-08-01", time: "16:30", minutes: HOUR },
  // Mon Aug 3
  { date: "2026-08-03", time: "12:30", minutes: HOUR },
  // Wed Aug 5
  { date: "2026-08-05", time: "12:30", minutes: HOUR },
  // Wed Aug 12
  { date: "2026-08-12", time: "09:30", minutes: HOUR },
];
