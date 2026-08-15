import { describe, expect, it } from "vitest";
import { findByDateRange, findByTitle, groupByDay } from "./query";
import { sampleEvents } from "./sampleEvents";

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
