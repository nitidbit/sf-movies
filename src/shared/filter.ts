import type { Event } from "./events/event";
import { zonedTimeToUtc } from "./timezone";

const LA_TIME_ZONE = "America/Los_Angeles";
const laDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: LA_TIME_ZONE });

// The America/Los_Angeles calendar day a given instant falls on, as
// "YYYY-MM-DD" — shared by findByDateRange and groupByDay, so both agree
// on which showtimes belong to which day.
export function localDayOf(date: Date): string {
  return laDateFormatter.format(date);
}

// Midnight at the start of `date`'s America/Los_Angeles calendar day, as a
// UTC instant.
function startOfLocalDay(date: Date): Date {
  const [year, month, day] = localDayOf(date).split("-").map(Number);
  return zonedTimeToUtc(year, month, day, 0, 0, LA_TIME_ZONE);
}

// Events from the start of `now`'s America/Los_Angeles calendar day onward.
// Showtimes earlier today stay on the list even after they've started —
// only a previous LA calendar day drops off.
export function findUpcoming<T extends Pick<Event, "startTime">>(events: T[], now: Date): T[] {
  const cutoff = startOfLocalDay(now).getTime();
  return events.filter((event) => new Date(event.startTime).getTime() >= cutoff);
}

// Chronological order by instant, not by string — startTime strings carry
// their own local UTC offset (see Event), so plain string comparison isn't
// reliable across a DST change. Every startTime sort in this codebase goes
// through this one function.
export function compareByStartTime(a: Pick<Event, "startTime">, b: Pick<Event, "startTime">): number {
  return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
}

// Case-insensitive substring match. An empty needle matches every title —
// no special-casing needed, since every string includes "".
export function matchesTitle(title: string, needle: string): boolean {
  return title.toLowerCase().includes(needle.toLowerCase());
}

// day/from/to are "YYYY-MM-DD" strings in America/Los_Angeles. An empty
// `from` means "no day filter" (matches every day) — the day-filter's
// "off" state.
export function matchesDayRange(day: string, from: string, to: string): boolean {
  return from === "" || (day >= from && day <= to);
}

// An empty `theaters` set means "no theater filter" (matches every
// theater) — the theater-filter's "off" state.
export function matchesTheater(theater: string, theaters: ReadonlySet<string>): boolean {
  return theaters.size === 0 || theaters.has(theater);
}

export function findByTitle(events: Event[], query: string): Event[] {
  return events.filter((event) => matchesTitle(event.title, query)).sort(compareByStartTime);
}

// startDate/endDate are inclusive "YYYY-MM-DD" strings in
// America/Los_Angeles, e.g. from the day-filter's DayRangeSelection.
export function findByDateRange(events: Event[], startDate: string, endDate: string): Event[] {
  return events
    .filter((event) => matchesDayRange(localDayOf(new Date(event.startTime)), startDate, endDate))
    .sort(compareByStartTime);
}

export interface DayGroup {
  date: string;
  events: Event[];
}

// Clusters an already-sorted Event[] into chronologically-ordered day
// groups. Every view on the Home page routes through this before
// rendering, filtered or not.
export function groupByDay(events: Event[]): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const event of events) {
    const date = localDayOf(new Date(event.startTime));
    const currentGroup = groups.at(-1);
    if (currentGroup?.date === date) {
      currentGroup.events.push(event);
    } else {
      groups.push({ date, events: [event] });
    }
  }

  return groups;
}
