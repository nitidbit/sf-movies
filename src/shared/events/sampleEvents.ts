import type { Event } from "./event";

// A complete, realistic slice of scraped data spanning two theaters, two
// LA-calendar days, and one repeated title across theaters/showtimes —
// used by every query-layer test so each test documents exactly what the
// query functions return, not just that they don't throw.
export const sampleEvents: Event[] = [
  {
    theater: "Balboa",
    title: "Your Name.",
    startTime: "2026-08-14T16:30:00-07:00",
    sourceUrl: "https://www.balboamovies.com/calendar-of-events/your-name-balboa-aug14-mat",
  },
  {
    theater: "Balboa",
    title: "Your Name.",
    startTime: "2026-08-14T19:00:00-07:00",
    sourceUrl: "https://www.balboamovies.com/calendar-of-events/your-name-balboa-aug14-eve",
  },
  {
    theater: "Vogue",
    title: "The Handmaiden",
    startTime: "2026-08-14T19:30:00-07:00",
    sourceUrl: "https://voguemovies.com/calendar-of-events/handmaiden-vogue-aug14",
  },
  {
    theater: "Vogue",
    title: "Your Name.",
    startTime: "2026-08-15T17:00:00-07:00",
    sourceUrl: "https://voguemovies.com/calendar-of-events/your-name-vogue-aug15",
  },
  {
    theater: "4-Star",
    title: "My Sassy Girl",
    startTime: "2026-08-15T19:30:00-07:00",
    sourceUrl: "https://www.4-star-movies.com/calendar-of-events/my-sassy-girl-fourstar-aug15",
    synopsis: "(25th Anniversary 4K)",
  },
];
