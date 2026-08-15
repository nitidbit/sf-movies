// A single showtime, normalized across all theater sources.
// startTime/endTime are ISO 8601 instants written in America/Los_Angeles
// local time (e.g. "2026-08-14T19:00:00-07:00", not UTC) — still an
// unambiguous instant since the offset is explicit, but keeps
// movie-data/*.json checkable at a glance against a theater's own listing.
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
