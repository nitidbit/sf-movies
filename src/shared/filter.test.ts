import { describe, expect, it } from "vitest";
import {
  compareByStartTime,
  findByDateRange,
  findByTitle,
  groupByDay,
  matchesDayRange,
  matchesTheater,
  matchesTitle,
} from "./filter";
import { sampleEvents } from "./events/sampleEvents";

describe("compareByStartTime", () => {
  it("orders by instant, not by string, across a DST fall-back where the local hour repeats", () => {
    // 2026-11-01 is when PDT (-07:00) falls back to PST (-08:00): 1:15 AM PST
    // is a later instant than 1:30 AM PDT, even though "01:15" sorts before
    // "01:30" as a string.
    const later = { startTime: "2026-11-01T01:15:00-08:00" } as const;
    const earlier = { startTime: "2026-11-01T01:30:00-07:00" } as const;

    expect(compareByStartTime(earlier, later)).toBeLessThan(0);
    expect(compareByStartTime(later, earlier)).toBeGreaterThan(0);
  });
});

describe("matchesTitle", () => {
  it("matches everything when the needle is empty", () => {
    expect(matchesTitle("The Odyssey", "")).toBe(true);
  });

  it("matches case-insensitively and by partial title", () => {
    expect(matchesTitle("The Odyssey", "odys")).toBe(true);
  });

  it("returns false when the title doesn't contain the needle", () => {
    expect(matchesTitle("The Odyssey", "Nonexistent")).toBe(false);
  });
});

describe("matchesDayRange", () => {
  it("matches everything when from is empty (the day filter's off state)", () => {
    expect(matchesDayRange("2026-08-15", "", "")).toBe(true);
  });

  it("includes a day exactly on the start or end boundary", () => {
    expect(matchesDayRange("2026-08-14", "2026-08-14", "2026-08-15")).toBe(true);
    expect(matchesDayRange("2026-08-15", "2026-08-14", "2026-08-15")).toBe(true);
  });

  it("returns false for a day outside the range", () => {
    expect(matchesDayRange("2026-08-20", "2026-08-14", "2026-08-15")).toBe(false);
  });
});

describe("matchesTheater", () => {
  it("matches everything when the set is empty (the theater filter's off state)", () => {
    expect(matchesTheater("Roxie", new Set())).toBe(true);
  });

  it("matches a theater that's in the set", () => {
    expect(matchesTheater("Roxie", new Set(["Roxie", "Alamo"]))).toBe(true);
  });

  it("returns false for a theater that's not in the set", () => {
    expect(matchesTheater("Balboa", new Set(["Roxie", "Alamo"]))).toBe(false);
  });
});

describe("findByTitle", () => {
  it("matches an exact title", () => {
    expect(findByTitle(sampleEvents, "The Handmaiden")).toEqual([sampleEvents[2]]);
  });

  it("matches case-insensitively and by partial title, across theaters, sorted chronologically", () => {
    expect(findByTitle(sampleEvents, "your name")).toEqual([
      sampleEvents[0],
      sampleEvents[1],
      sampleEvents[3],
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(findByTitle(sampleEvents, "Nonexistent Movie")).toEqual([]);
  });
});

describe("findByDateRange", () => {
  it("finds events across a multi-day range, sorted chronologically", () => {
    expect(findByDateRange(sampleEvents, "2026-08-14", "2026-08-15")).toEqual(sampleEvents);
  });

  it("includes events exactly on the start and end boundary dates", () => {
    expect(findByDateRange(sampleEvents, "2026-08-15", "2026-08-15")).toEqual([
      sampleEvents[3],
      sampleEvents[4],
    ]);
  });

  it("returns an empty list for a range with no matching events", () => {
    expect(findByDateRange(sampleEvents, "2026-08-20", "2026-08-21")).toEqual([]);
  });
});

describe("groupByDay", () => {
  it("clusters already-sorted events into chronologically-ordered day groups", () => {
    expect(groupByDay(sampleEvents)).toEqual([
      {
        date: "2026-08-14",
        events: [sampleEvents[0], sampleEvents[1], sampleEvents[2]],
      },
      {
        date: "2026-08-15",
        events: [sampleEvents[3], sampleEvents[4]],
      },
    ]);
  });

  it("returns an empty list for an empty input", () => {
    expect(groupByDay([])).toEqual([]);
  });
});
