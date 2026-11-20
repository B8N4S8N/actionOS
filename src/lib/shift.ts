export type Shift = "day" | "swing" | "overnight";

export const SHIFT_LABELS: Record<Shift, string> = {
  day: "Day",
  swing: "Swing",
  overnight: "Overnight",
};

/** Hour-of-day in a given IANA timezone, 0-23. */
export function hourInTimeZone(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  });
  const parsed = Number.parseInt(formatter.format(date), 10);
  // Intl can render midnight as "24" in some runtimes.
  return Number.isFinite(parsed) ? parsed % 24 : date.getUTCHours();
}

/**
 * Shelter shifts, using the pattern most transitional housing sites run:
 * day 07:00-14:59, swing 15:00-22:59, overnight 23:00-06:59.
 */
export function shiftForHour(hour: number): Shift {
  if (hour >= 7 && hour < 15) return "day";
  if (hour >= 15 && hour < 23) return "swing";
  return "overnight";
}

export function currentShift(
  timeZone = "America/Los_Angeles",
  now = new Date(),
): Shift {
  return shiftForHour(hourInTimeZone(now, timeZone));
}

const STEP_MS = 15 * 60 * 1000;
const MAX_STEPS = (48 * 60) / 15;

/**
 * The start and end of the most recent occurrence of a shift, in the site's
 * timezone.
 *
 * Walking backwards in 15-minute steps and asking `Intl` for the local hour
 * sidesteps every daylight-saving edge case that arithmetic on UTC offsets
 * runs into, and 192 iterations of integer math is cheaper than pulling in a
 * timezone library.
 */
export function findLastShiftWindow(
  shift: Shift,
  timeZone = "America/Los_Angeles",
  now = new Date(),
): { start: Date; end: Date } {
  let cursor = now.getTime();
  let steps = 0;

  // Walk back to the last moment that was inside the target shift.
  while (
    shiftForHour(hourInTimeZone(new Date(cursor), timeZone)) !== shift &&
    steps < MAX_STEPS
  ) {
    cursor -= STEP_MS;
    steps += 1;
  }

  const end = cursor;

  // Then walk back to where that shift began.
  while (
    shiftForHour(hourInTimeZone(new Date(cursor - STEP_MS), timeZone)) === shift &&
    steps < MAX_STEPS
  ) {
    cursor -= STEP_MS;
    steps += 1;
  }

  return { start: new Date(cursor), end: new Date(end) };
}

/** The shift that just ended, which is what a briefing summarizes. */
export function previousShift(shift: Shift): Shift {
  switch (shift) {
    case "day":
      return "overnight";
    case "swing":
      return "day";
    case "overnight":
      return "swing";
  }
}
