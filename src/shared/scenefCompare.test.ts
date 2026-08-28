import { describe, expect, it } from "vitest";
import type { Event } from "./events/event";
import type { SceneFListingsResponse, SceneFScreening } from "./scrapers/scenef";
import { compareWithSceneF } from "./scenefCompare";

// Real captured shapes (Balboa / SceneF, Aug 2026). Tests tweak only the
// fields that matter to the case at hand.
function sampleOurEvent(overrides: Partial<Event> = {}): Event {
  return {
    theater: "Balboa",
    title: "The Tale of Zatoichi",
    startTime: "2026-08-30T14:30:00-07:00",
    sourceUrl: "https://www.balboamovies.com/calendar-of-events/the-tale-of-zatoichi-august-30",
    ...overrides,
  };
}

function sampleScreening(overrides: Partial<SceneFScreening> = {}): SceneFScreening {
  return {
    id: "ce9ec0a9ff39",
    filmKey: "tmdb-16692",
    startsAt: "2026-08-30T14:30:00-07:00",
    ticketUrl: "https://scenef.com/go/ce9ec0a9ff39",
    ...overrides,
  };
}

function sampleListings(overrides: Partial<SceneFListingsResponse> = {}): SceneFListingsResponse {
  return {
    films: [{ key: "tmdb-16692", title: "The Tale of Zatoichi" }],
    screenings: [sampleScreening()],
    ...overrides,
  };
}

describe("compareWithSceneF", () => {
  it("counts a showing with the same start instant and title as matched", () => {
    expect(compareWithSceneF([sampleOurEvent()], sampleListings())).toEqual({
      matched: 1,
      timeDrifts: [],
      titleMismatches: [],
      oursOnly: [],
      scenefOnly: [],
      excluded: { ours: 0, scenef: 0 },
    });
  });

  it("treats titles as compatible when one contains the other, ignoring case and punctuation", () => {
    // The venue annotates ("Akira 4K"); SceneF uses the canonical film title.
    const ours = [sampleOurEvent({ title: "Akira 4K" })];
    const scenef = sampleListings({ films: [{ key: "tmdb-16692", title: "Akira" }] });

    expect(compareWithSceneF(ours, scenef).matched).toBe(1);
  });

  it("reports showings only SceneF has — the collapsed-Balboa-day case", () => {
    // Our scraper collapsed "2:30 PM, 5 PM & 7:30 PM" to one 2:30 event;
    // SceneF (correctly) has three screenings that day.
    const ours = [sampleOurEvent()];
    const scenef = sampleListings({
      screenings: [
        sampleScreening(),
        sampleScreening({ id: "ef195d1f20d0", startsAt: "2026-08-30T17:00:00-07:00" }),
        sampleScreening({ id: "ec3b814ef6b2", startsAt: "2026-08-30T19:30:00-07:00" }),
      ],
    });

    expect(compareWithSceneF(ours, scenef)).toEqual({
      matched: 1,
      timeDrifts: [],
      titleMismatches: [],
      oursOnly: [],
      scenefOnly: [
        { title: "The Tale of Zatoichi", startTime: "2026-08-30T17:00:00-07:00" },
        { title: "The Tale of Zatoichi", startTime: "2026-08-30T19:30:00-07:00" },
      ],
      excluded: { ours: 0, scenef: 0 },
    });
  });

  it("excludes our showings beyond SceneF's horizon instead of reporting them", () => {
    // Squarespace lists events months out; SceneF's window is shorter. A
    // showing past SceneF's last day is unverifiable, not a discrepancy.
    const ours = [
      sampleOurEvent(),
      sampleOurEvent({ title: "Basic Instinct", startTime: "2026-09-15T19:00:00-07:00" }),
    ];

    expect(compareWithSceneF(ours, sampleListings())).toEqual({
      matched: 1,
      timeDrifts: [],
      titleMismatches: [],
      oursOnly: [],
      scenefOnly: [],
      excluded: { ours: 1, scenef: 0 },
    });
  });

  it("reports the same film a few minutes apart as time drift, with both times", () => {
    const ours = [sampleOurEvent({ startTime: "2026-08-30T14:35:00-07:00" })];

    expect(compareWithSceneF(ours, sampleListings())).toEqual({
      matched: 0,
      timeDrifts: [
        {
          title: "The Tale of Zatoichi",
          ourStartTime: "2026-08-30T14:35:00-07:00",
          scenefStartTime: "2026-08-30T14:30:00-07:00",
        },
      ],
      titleMismatches: [],
      oursOnly: [],
      scenefOnly: [],
      excluded: { ours: 0, scenef: 0 },
    });
  });

  it("reports different films at the same instant as a title mismatch", () => {
    const ours = [sampleOurEvent({ title: "Basic Instinct" })];

    expect(compareWithSceneF(ours, sampleListings())).toEqual({
      matched: 0,
      timeDrifts: [],
      titleMismatches: [
        {
          startTime: "2026-08-30T14:30:00-07:00",
          ourTitle: "Basic Instinct",
          scenefTitle: "The Tale of Zatoichi",
        },
      ],
      oursOnly: [],
      scenefOnly: [],
      excluded: { ours: 0, scenef: 0 },
    });
  });

  it("excludes SceneF showings beyond our horizon, symmetrically", () => {
    const scenef = sampleListings({
      screenings: [
        sampleScreening(),
        sampleScreening({ id: "aaa111bbb222", startsAt: "2026-09-20T19:00:00-07:00" }),
      ],
    });

    expect(compareWithSceneF([sampleOurEvent()], scenef)).toEqual({
      matched: 1,
      timeDrifts: [],
      titleMismatches: [],
      oursOnly: [],
      scenefOnly: [],
      excluded: { ours: 0, scenef: 1 },
    });
  });
});
