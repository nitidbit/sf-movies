import type { Event } from "./event";

// A complete, realistic slice of scraped data spanning two theaters, two
// LA-calendar days, and one repeated title across theaters/showtimes —
// used by every query-layer test so each test documents exactly what the
// query functions return, not just that they don't throw.
//
// Note: events 2 and 3 have UTC dates one day ahead of their LA-calendar
// day (e.g. 19:00 PT on Aug 14 is already Aug 15 in UTC) — this is
// intentional, to make sure day-based queries key off America/Los_Angeles,
// not the UTC date.
export const sampleEvents: Event[] = [
  {
    theater: "Balboa",
    title: "Your Name.",
    startTime: "2026-08-14T23:30:00.000Z", // Aug 14, 4:30 PM PT
    sourceUrl: "https://www.balboamovies.com/calendar-of-events/your-name-balboa-aug14-mat",
  },
  {
    theater: "Balboa",
    title: "Your Name.",
    startTime: "2026-08-15T02:00:00.000Z", // Aug 14, 7:00 PM PT
    sourceUrl: "https://www.balboamovies.com/calendar-of-events/your-name-balboa-aug14-eve",
  },
  {
    theater: "Vogue",
    title: "The Handmaiden",
    startTime: "2026-08-15T02:30:00.000Z", // Aug 14, 7:30 PM PT
    sourceUrl: "https://voguemovies.com/calendar-of-events/handmaiden-vogue-aug14",
  },
  {
    theater: "Vogue",
    title: "Your Name.",
    startTime: "2026-08-16T00:00:00.000Z", // Aug 15, 5:00 PM PT
    sourceUrl: "https://voguemovies.com/calendar-of-events/your-name-vogue-aug15",
  },
  {
    theater: "4-Star",
    title: "My Sassy Girl",
    startTime: "2026-08-16T02:30:00.000Z", // Aug 15, 7:30 PM PT
    sourceUrl: "https://www.4-star-movies.com/calendar-of-events/my-sassy-girl-fourstar-aug15",
    notes: "(25th Anniversary 4K)",
  },
];
