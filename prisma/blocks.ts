/**
 * Personal / blocked time imported from the owner's calendar.
 *
 * Each entry becomes a $0 "Blocked — personal" appointment (status
 * CONFIRMED), so the booking engine treats the window as busy and hides any
 * arrival slot whose job would overlap it. The seed inserts these
 * idempotently on every deploy (already-present ids are skipped).
 *
 * Managing blocks:
 *  - Add a new block: add a line here and deploy (or add an appointment in
 *    the admin job book by hand).
 *  - Free a slot permanently: delete the line HERE first, then delete the
 *    row in the admin job book — deploys re-insert any entry still in this
 *    list that's missing from the database.
 *
 * Times are shop-local 24h "HH:MM"; minutes is how long the window lasts.
 */
export type PersonalBlock = {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  minutes: number;
  label: string;
};

const HOUR = 60;

export const PERSONAL_BLOCKS: PersonalBlock[] = [
  // Wed Jul 29
  { date: "2026-07-29", time: "09:30", minutes: HOUR, label: "Personal (calendar import)" },
  { date: "2026-07-29", time: "12:30", minutes: HOUR, label: "Personal (calendar import)" },
  { date: "2026-07-29", time: "16:30", minutes: HOUR, label: "Personal (calendar import)" },
  // Thu Jul 30
  { date: "2026-07-30", time: "10:30", minutes: HOUR, label: "Personal (calendar import)" },
  { date: "2026-07-30", time: "12:30", minutes: HOUR, label: "Personal (calendar import)" },
  // Fri Jul 31
  { date: "2026-07-31", time: "11:30", minutes: HOUR, label: "Personal (calendar import)" },
  // Sat Aug 1
  { date: "2026-08-01", time: "09:30", minutes: HOUR, label: "Personal (calendar import)" },
  { date: "2026-08-01", time: "13:30", minutes: HOUR, label: "Personal (calendar import)" },
  { date: "2026-08-01", time: "16:30", minutes: HOUR, label: "Personal (calendar import)" },
  // Mon Aug 3
  { date: "2026-08-03", time: "12:30", minutes: HOUR, label: "Personal (calendar import)" },
  // Wed Aug 5
  { date: "2026-08-05", time: "12:30", minutes: HOUR, label: "Personal (calendar import)" },
];
