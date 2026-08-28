import { describe, expect, it, vi } from "vitest";
import { fetchCinemaSfEvents, parseCinemaSfEvents } from "./cinemaSf";
import { zonedIsoString } from "../timezone";

const LA_TIME_ZONE = "America/Los_Angeles";

describe("parseCinemaSfEvents", () => {
  it("normalizes a plain showtime with no synopsis", () => {
    const raw = {
      title: "The Handmaiden ~ 7:30 PM",
      startDate: 1786764600529,
      endDate: 1786774200529,
      fullUrl: "/calendar-of-events/the-handmaiden-august-13",
    };

    expect(parseCinemaSfEvents(raw, "Balboa", "https://www.balboamovies.com")).toEqual([{
      theater: "Balboa",
      title: "The Handmaiden",
      startTime: zonedIsoString(new Date(1786764600529), LA_TIME_ZONE),
      endTime: zonedIsoString(new Date(1786774200529), LA_TIME_ZONE),
      sourceUrl: "https://www.balboamovies.com/calendar-of-events/the-handmaiden-august-13",
    }]);
  });

  it("strips the trailing showtime/note annotation from the title", () => {
    const raw = {
      title: "The Odyssey ~ 7 PM  (Final Show)",
      startDate: 1786672800164,
      endDate: 1786684200164,
      fullUrl: "/calendar-of-events/the-odyssey-august-13",
    };

    expect(parseCinemaSfEvents(raw, "Balboa", "https://www.balboamovies.com")[0].title).toBe(
      "The Odyssey",
    );
  });

  it("splits showtimes even with a trailing parenthetical annotation", () => {
    const raw = {
      title: "Your Name. 10th Anniversary ~ 4:30 PM &amp; 7 PM (Subtitled)",
      startDate: 1786750200771,
      endDate: 1786766100771,
      fullUrl: "/calendar-of-events/your-name-10th-anniversary-august-14",
    };

    const events = parseCinemaSfEvents(raw, "Vogue", "https://voguemovies.com");

    expect(events.map((event) => [event.title, event.startTime])).toEqual([
      ["Your Name. 10th Anniversary", "2026-08-14T16:30:00-07:00"],
      ["Your Name. 10th Anniversary", "2026-08-14T19:00:00-07:00"],
    ]);
  });

  it("splits a two-showtime title into one event per showing", () => {
    // Real Balboa event: one Squarespace entry spanning both shows, the
    // individual times only in the title. Each showing becomes its own
    // event with a Roxie-style fragment sourceUrl; the spanning endDate is
    // wrong per-showing, so no endTime.
    const raw = {
      title: "Southland Tales ~ 4 PM &amp; 7:30 PM",
      startDate: 1788044400979,
      endDate: 1788066600979,
      fullUrl: "/calendar-of-events/southland-tales-august-29",
    };

    expect(parseCinemaSfEvents(raw, "Balboa", "https://www.balboamovies.com")).toEqual([
      {
        theater: "Balboa",
        title: "Southland Tales",
        startTime: "2026-08-29T16:00:00-07:00",
        sourceUrl:
          "https://www.balboamovies.com/calendar-of-events/southland-tales-august-29#showtimes-20260829-1600",
      },
      {
        theater: "Balboa",
        title: "Southland Tales",
        startTime: "2026-08-29T19:30:00-07:00",
        sourceUrl:
          "https://www.balboamovies.com/calendar-of-events/southland-tales-august-29#showtimes-20260829-1930",
      },
    ]);
  });

  it("splits a comma-and-ampersand list of three showtimes", () => {
    const raw = {
      title: "The Tale of Zatoichi ~ 2:30 PM, 5 PM &amp; 7:30 PM",
      startDate: 1788125400697,
      endDate: 1788150300697,
      fullUrl: "/calendar-of-events/the-tale-of-zatoichi-august-30",
    };

    const events = parseCinemaSfEvents(raw, "Balboa", "https://www.balboamovies.com");

    expect(events.map((event) => event.startTime)).toEqual([
      "2026-08-30T14:30:00-07:00",
      "2026-08-30T17:00:00-07:00",
      "2026-08-30T19:30:00-07:00",
    ]);
  });

  it("keeps a late show before midnight on the same LA calendar day", () => {
    const raw = {
      title: "The Rocky Horror Picture Show ~ 7:30 PM &amp; 11 PM (W/ The Bawdy Caste)  ",
      startDate: 1788057000763,
      endDate: 1788076500763,
      fullUrl: "/calendar-of-events/the-rocky-horror-picture-show-august-29",
    };

    const events = parseCinemaSfEvents(raw, "Balboa", "https://www.balboamovies.com");

    expect(events.map((event) => event.startTime)).toEqual([
      "2026-08-29T19:30:00-07:00",
      "2026-08-29T23:00:00-07:00",
    ]);
  });

  it("keeps one event when words ride along with the times", () => {
    // 4-Star lists a single hybrid evening's phases, not three showings.
    const raw = {
      title:
        "Messy Bitch Cinema: Without You I'm Nothing (with LIVE MUSIC from The Containers &amp; Ribbit Shaped Brain) ~ Doors at 7:00 PM, Music at 7:30 PM, Film at 9:15 PM",
      startDate: 1787884200507,
      endDate: 1787895000507,
      fullUrl: "/calendar-of-events/messy-bitch-cinema-august-27",
    };

    expect(parseCinemaSfEvents(raw, "4-Star", "https://www.4-star-movies.com")).toEqual([
      {
        theater: "4-Star",
        title:
          "Messy Bitch Cinema: Without You I'm Nothing (with LIVE MUSIC from The Containers & Ribbit Shaped Brain)",
        startTime: "2026-08-27T19:30:00-07:00",
        endTime: "2026-08-27T22:30:00-07:00",
        sourceUrl: "https://www.4-star-movies.com/calendar-of-events/messy-bitch-cinema-august-27",
      },
    ]);
  });

  it("falls back to the structured startDate when the title's first time disagrees", () => {
    // Title claims 7 PM & 9 PM, but the structured start is 7:30 PM — a
    // typo somewhere. Trust the structured data, keep one event, and warn
    // so the scrape logs surface the inconsistency.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const raw = {
      title: "Slacker ~ 7 PM &amp; 9 PM",
      startDate: 1786765800945,
      endDate: 1786772700945,
      fullUrl: "/calendar-of-events/slacker-august-14",
    };

    expect(parseCinemaSfEvents(raw, "Balboa", "https://www.balboamovies.com")).toEqual([
      {
        theater: "Balboa",
        title: "Slacker",
        startTime: "2026-08-14T20:50:00-07:00",
        endTime: "2026-08-14T22:45:00-07:00",
        sourceUrl: "https://www.balboamovies.com/calendar-of-events/slacker-august-14",
      },
    ]);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain("Slacker");
    warn.mockRestore();
  });

  it("has no synopsis when the raw event has no body", () => {
    const raw = {
      title: "Slacker ~ 7:30 PM",
      startDate: 1786765800945,
      endDate: 1786772700945,
      fullUrl: "/calendar-of-events/slacker-august-14",
    };

    expect(parseCinemaSfEvents(raw, "Balboa", "https://www.balboamovies.com")[0].synopsis).toBeUndefined();
  });

  it("extracts the synopsis text out of the body's text blocks", () => {
    const raw = {
      title: "Wag the Dog ~ 7 PM",
      startDate: 1786672800164,
      endDate: 1786684200164,
      fullUrl: "/calendar-of-events/wag-the-dog-august-13",
      body: '<div class="sqs-block video-block"><div class="sqs-block-content">not this</div></div><div class="sqs-block html-block"><div class="sqs-block-content"><div class="sqs-html-content"><p>Robert De Niro &amp; Dustin Hoffman star in a tale of politics.</p></div></div></div>',
    };

    expect(parseCinemaSfEvents(raw, "Balboa", "https://www.balboamovies.com")[0].synopsis).toBe(
      "Robert De Niro & Dustin Hoffman star in a tale of politics.",
    );
  });

  it("has no synopsis when the body has no text block", () => {
    const raw = {
      title: "Wag the Dog ~ 7 PM",
      startDate: 1786672800164,
      endDate: 1786684200164,
      fullUrl: "/calendar-of-events/wag-the-dog-august-13",
      body: '<div class="sqs-block video-block"><div class="sqs-block-content">just a trailer embed</div></div>',
    };

    expect(parseCinemaSfEvents(raw, "Balboa", "https://www.balboamovies.com")[0].synopsis).toBeUndefined();
  });
});

describe("fetchCinemaSfEvents", () => {
  it("follows pagination and normalizes every page's events", async () => {
    const page1 = {
      upcoming: [
        {
          title: "The Odyssey ~ 7 PM  (Final Show)",
          startDate: 1786672800164,
          endDate: 1786684200164,
          fullUrl: "/calendar-of-events/the-odyssey-august-13",
        },
      ],
      pagination: { nextPageUrl: "/calendar-of-events?offset=111" },
    };
    const page2 = {
      upcoming: [
        {
          title: "Slacker ~ 7:30 PM",
          startDate: 1786765800945,
          endDate: 1786772700945,
          fullUrl: "/calendar-of-events/slacker-august-14",
        },
        {
          // Splits into two events — the flattened list holds three total.
          title: "Southland Tales ~ 4 PM &amp; 7:30 PM",
          startDate: 1788044400979,
          endDate: 1788066600979,
          fullUrl: "/calendar-of-events/southland-tales-august-29",
        },
      ],
      pagination: {},
    };

    const fetchFn = vi.fn(async (url: string) => {
      const body = url.includes("offset=111") ? page2 : page1;
      return { json: async () => body } as Response;
    });

    const events = await fetchCinemaSfEvents("https://www.balboamovies.com", "Balboa", fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(events).toEqual([
      ...parseCinemaSfEvents(page1.upcoming[0], "Balboa", "https://www.balboamovies.com"),
      ...parseCinemaSfEvents(page2.upcoming[0], "Balboa", "https://www.balboamovies.com"),
      ...parseCinemaSfEvents(page2.upcoming[1], "Balboa", "https://www.balboamovies.com"),
    ]);
  });
});
