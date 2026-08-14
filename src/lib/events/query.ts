import type { Event } from "./event";

const LA_TIME_ZONE = "America/Los_Angeles";
const laDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: LA_TIME_ZONE });

// The America/Los_Angeles calendar day a given instant falls on, as
// "YYYY-MM-DD" — shared by findByDateRange and groupByDay, so both agree
// on which showtimes belong to which day.
export function localDayOf(date: Date): string {
	return laDateFormatter.format(date);
}

export function findByTitle(events: Event[], query: string): Event[] {
	const needle = query.toLowerCase();
	return events
		.filter((event) => event.title.toLowerCase().includes(needle))
		.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// startDate/endDate are inclusive "YYYY-MM-DD" strings in
// America/Los_Angeles, e.g. from the day-filter's DayRangeSelection.
export function findByDateRange(events: Event[], startDate: string, endDate: string): Event[] {
	return events
		.filter((event) => {
			const day = localDayOf(new Date(event.startTime));
			return day >= startDate && day <= endDate;
		})
		.sort((a, b) => a.startTime.localeCompare(b.startTime));
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
