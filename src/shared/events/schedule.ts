import type { Event } from "./event";
import { zonedTimeToUtc } from "../timezone";

const LA_TIME_ZONE = "America/Los_Angeles";
const laDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: LA_TIME_ZONE });

// The America/Los_Angeles calendar day a given instant falls on, as
// "YYYY-MM-DD" — shared by groupByDay and the filter selection, so both agree
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
