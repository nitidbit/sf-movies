import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fetchRoxieEvents, parseRoxieCalendar } from "./roxie";

const fixtureHtml = readFileSync(
  join(__dirname, "__fixtures__", "roxie-calendar.html"),
  "utf-8",
);

describe("parseRoxieCalendar", () => {
  it("parses a single showtime for a film", () => {
    const events = parseRoxieCalendar(fixtureHtml, "Roxie");
    const roxieFirstLooks = events.find((e) => e.title === "Roxie First Looks #12");

    expect(roxieFirstLooks).toEqual({
      theater: "Roxie",
      title: "Roxie First Looks #12",
      startTime: "2026-08-13T16:15:00-07:00",
      sourceUrl:
        "https://roxie.com/film/roxie-first-looks-12/#showtimes-20260813-1615",
    });
  });

  it("parses multiple showtimes for one film on one day as separate events with distinct sourceUrls", () => {
    const events = parseRoxieCalendar(fixtureHtml, "Roxie");
    const samurai = events.filter((e) => e.title === "The Samurai and the Prisoner");

    expect(samurai).toEqual([
      {
        theater: "Roxie",
        title: "The Samurai and the Prisoner",
        startTime: "2026-08-16T15:10:00-07:00",
        sourceUrl:
          "https://roxie.com/film/the-samurai-and-the-prisoner/#showtimes-20260816-1510",
      },
      {
        theater: "Roxie",
        title: "The Samurai and the Prisoner",
        startTime: "2026-08-16T19:10:00-07:00",
        sourceUrl:
          "https://roxie.com/film/the-samurai-and-the-prisoner/#showtimes-20260816-1910",
      },
    ]);
  });

  it("parses every day and film on the page, not just the first", () => {
    const events = parseRoxieCalendar(fixtureHtml, "Roxie");
    expect(events).toHaveLength(4);
    expect(events.map((e) => e.title)).toEqual([
      "Roxie First Looks #12",
      "Arthouse 50: Radiograph of a Family",
      "The Samurai and the Prisoner",
      "The Samurai and the Prisoner",
    ]);
  });
});

describe("fetchRoxieEvents", () => {
  it("fetches /calendar/ and parses the response", async () => {
    const fetchFn = vi.fn(async () => ({ text: async () => fixtureHtml }) as Response);

    const events = await fetchRoxieEvents("https://roxie.com", "Roxie", fetchFn);

    expect(fetchFn).toHaveBeenCalledWith("https://roxie.com/calendar/");
    expect(events).toEqual(parseRoxieCalendar(fixtureHtml, "Roxie"));
  });
});
