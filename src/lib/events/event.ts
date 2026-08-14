// A single showtime, normalized across all theater sources.
// startTime/endTime are ISO 8601 UTC instants (unambiguous across DST);
// pages format them in America/Los_Angeles for display.
export interface Event {
	theater: string;
	title: string;
	startTime: string;
	endTime?: string;
	sourceUrl: string;
	notes?: string;
	// Required credit line for events sourced from a third-party feed
	// (e.g. "Showtimes via SceneF.com") — a licensing condition of using
	// that data, not a general-purpose note.
	attribution?: string;
}
