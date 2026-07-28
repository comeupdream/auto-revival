/** Time + date string helpers. All times are salon-local "HH:MM" 24h strings. */

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Weekday (0=Sun..6=Sat) for an ISO "YYYY-MM-DD" date, in local terms. */
export function weekdayOf(dateISO: string): number {
  const [y, mo, d] = dateISO.split("-").map(Number);
  return new Date(y, mo - 1, d).getDay();
}

/** Validate "YYYY-MM-DD". */
export function isValidDateISO(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, mo, d] = s.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/** Validate "HH:MM" 24h. */
export function isValidTime(s: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(s)) return false;
  const [h, m] = s.split(":").map(Number);
  return h >= 0 && h < 24 && m >= 0 && m < 60;
}

/**
 * A salon-local date+time collapsed to a single minute count on a fixed
 * (UTC-based) arithmetic scale. The value is NOT a real instant — it's only
 * meaningful when comparing two such values (both built the same way), e.g.
 * "how many minutes until this appointment starts" independent of server TZ.
 */
export function localStampMinutes(dateISO: string, hhmm: string): number {
  const [y, mo, d] = dateISO.split("-").map(Number);
  const [h, m] = hhmm.split(":").map(Number);
  return Math.floor(Date.UTC(y, mo - 1, d, h, m) / 60000);
}

/** Add N days to an ISO date string, returning a new ISO date string. */
export function addDaysISO(dateISO: string, days: number): string {
  const [y, mo, d] = dateISO.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
