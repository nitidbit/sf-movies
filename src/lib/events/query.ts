import type { Event } from "./event";

const LA_TIME_ZONE = "America/Los_Angeles";
const laDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: LA_TIME_ZONE });

// The America/Los_Angeles calendar day a given instant falls on, as
// "YYYY-MM-DD" — shared by findByDay and by the day-browse page, so both
// agree on which showtimes belong to which day.
export function localDayOf(date: Date): string {
	return laDateFormatter.format(date);
}

export function findByTitle(events: Event[], query: string): Event[] {
	const needle = query.toLowerCase();
	return events
		.filter((event) => event.title.toLowerCase().includes(needle))
		.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// date is a "YYYY-MM-DD" string in America/Los_Angeles, matching the
// calendar day a viewer would pick on the day-browse page.
export function findByDay(events: Event[], date: string): Event[] {
	return events
		.filter((event) => localDayOf(new Date(event.startTime)) === date)
		.sort((a, b) => a.startTime.localeCompare(b.startTime));
}
