import { describe, expect, it } from "vitest";
import { compareByStartTime, findUpcoming, groupByDay } from "./schedule";
import { sampleEvents } from "./sampleEvents";

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

describe("findUpcoming", () => {
  it("includes an event from earlier the same LA calendar day, even though it already started", () => {
    // now is 9pm PDT on Aug 14; this event was 10am PDT the same LA day.
    const now = new Date("2026-08-15T04:00:00.000Z");
    const earlierToday = { startTime: "2026-08-14T10:00:00-07:00" } as const;

    expect(findUpcoming([earlierToday], now)).toEqual([earlierToday]);
  });

  it("excludes an event from the previous LA calendar day", () => {
    const now = new Date("2026-08-15T04:00:00.000Z");
    const yesterday = { startTime: "2026-08-13T22:00:00-07:00" } as const;

    expect(findUpcoming([yesterday], now)).toEqual([]);
  });

  it("includes an event later the same day and later days", () => {
    const now = new Date("2026-08-15T04:00:00.000Z");
    const laterToday = { startTime: "2026-08-14T23:00:00-07:00" } as const;
    const tomorrow = { startTime: "2026-08-15T19:00:00-07:00" } as const;

    expect(findUpcoming([laterToday, tomorrow], now)).toEqual([laterToday, tomorrow]);
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
