import { SHOP, shopNowHM, shopTodayISO } from "./shop-config";
import { minutesToTime, timeToMinutes, weekdayOf } from "./time";

/** A booked block that occupies the calendar on a given day. */
export type BusyBlock = { startTime: string; durationMinutes: number };

/**
 * Compute bookable start times for a date + job duration.
 *
 * The shop offers a fixed set of daily start times (SHOP.slotTimes). A slot
 * is offered when:
 *  - the day is open,
 *  - the whole job (start + duration) finishes before closing,
 *  - it doesn't overlap an existing busy block (long jobs consume the
 *    following slot(s) automatically),
 *  - and, for "today", it respects the minimum lead time.
 *
 * Returns "HH:MM" start times, ascending.
 */
export function computeAvailableSlots(
  dateISO: string,
  durationMinutes: number,
  busy: BusyBlock[],
): string[] {
  const hours = SHOP.hours[weekdayOf(dateISO)];
  if (!hours) return []; // closed that day

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);

  // Earliest allowed start if the date is today.
  let earliest = openMin;
  if (dateISO === shopTodayISO()) {
    earliest = Math.max(earliest, timeToMinutes(shopNowHM()) + SHOP.minLeadMinutes);
  }

  const busyRanges = busy.map((b) => {
    const s = timeToMinutes(b.startTime);
    return [s, s + b.durationMinutes] as const;
  });

  return SHOP.slotTimes.filter((t) => {
    const start = timeToMinutes(t);
    if (start < earliest) return false;
    const end = start + durationMinutes;
    if (start < openMin || end > closeMin) return false;
    return !busyRanges.some(([bs, be]) => start < be && bs < end);
  });
}

/** Does a proposed booking overlap any existing busy block? */
export function hasConflict(
  startTime: string,
  durationMinutes: number,
  busy: BusyBlock[],
): boolean {
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  return busy.some((b) => {
    const bs = timeToMinutes(b.startTime);
    const be = bs + b.durationMinutes;
    return start < be && bs < end;
  });
}

/** Is the proposed start within opening hours and fully before close? */
export function isWithinHours(
  dateISO: string,
  startTime: string,
  durationMinutes: number,
): boolean {
  const hours = SHOP.hours[weekdayOf(dateISO)];
  if (!hours) return false;
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  return start >= timeToMinutes(hours.open) && end <= timeToMinutes(hours.close);
}
