/**
 * Central shop configuration.
 *
 * Everything the front-of-house & booking engine needs to know about the
 * business lives here so it's easy to tweak without hunting through the code.
 */

export type DayHours = { open: string; close: string } | null;

export const SHOP = {
  name: "Auto Revival",
  shortName: "Auto Revival",
  tagline: "Premium auto detailing — showroom shine, brought back to life.",
  phone: "(540) 705-8671",
  email: "revivedetail13@gmail.com",
  // TODO: replace with the shop's real address / service area.
  address: "123 Main Street",
  cityLine: "Elkton, VA 22827",
  facebook: "https://www.facebook.com/profile.php?id=61581237587135",
  instagram: "@autorevival",

  /** IANA timezone the shop operates in. Drives "today" / past-slot logic. */
  timezone: "America/New_York",

  /** Spacing between offered start times, in minutes. */
  slotIntervalMinutes: 30,

  /** How far ahead clients may book, in days. */
  bookingHorizonDays: 60,

  /** Minimum lead time before a job can start today, in minutes. */
  minLeadMinutes: 60,

  /**
   * Opening hours per weekday in shop-local time (24h "HH:MM").
   * Index: 0 = Sunday … 6 = Saturday. `null` means closed that day.
   */
  hours: {
    0: null, // Sunday — closed
    1: { open: "08:00", close: "18:00" }, // Monday
    2: { open: "08:00", close: "18:00" }, // Tuesday
    3: { open: "08:00", close: "18:00" }, // Wednesday
    4: { open: "08:00", close: "18:00" }, // Thursday
    5: { open: "08:00", close: "18:00" }, // Friday
    6: { open: "08:00", close: "15:00" }, // Saturday
  } as Record<number, DayHours>,
} as const;

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Human-readable hours list for display on the site. */
export function hoursForDisplay(): { day: string; hours: string }[] {
  return WEEKDAY_LABELS.map((day, i) => {
    const h = SHOP.hours[i];
    return {
      day,
      hours: h ? `${to12h(h.open)} – ${to12h(h.close)}` : "Closed",
    };
  });
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

/** Current date in the shop timezone as "YYYY-MM-DD". */
export function shopTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Current time in the shop timezone as "HH:MM" (24h). */
export function shopNowHM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}
