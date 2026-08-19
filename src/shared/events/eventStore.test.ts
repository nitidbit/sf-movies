import { describe, expect, it } from "vitest";
import type { Event } from "./event";
import { mergeEvents } from "./eventStore";

const sampleEvent: Event = {
  theater: "Balboa",
  title: "The Odyssey",
  startTime: "2026-08-14T02:00:00.000Z",
  endTime: "2026-08-14T05:10:00.000Z",
  sourceUrl: "https://www.balboamovies.com/calendar-of-events/the-odyssey-august-13",
  synopsis: "Final Show",
};

const otherEvent: Event = {
  theater: "Balboa",
  title: "The Handmaiden",
  startTime: "2026-08-14T02:30:00.000Z",
  sourceUrl: "https://www.balboamovies.com/calendar-of-events/the-handmaiden-august-13",
};

describe("mergeEvents", () => {
  it("adds new events to an empty list", () => {
    expect(mergeEvents([], [sampleEvent])).toEqual([sampleEvent]);
  });

  it("leaves existing events untouched when they are not part of the incoming batch", () => {
    expect(mergeEvents([otherEvent], [sampleEvent])).toEqual([otherEvent, sampleEvent]);
  });

  it("updates an event that changed, keyed by sourceUrl", () => {
    const updated: Event = { ...sampleEvent, synopsis: "Final Show — sold out" };
    expect(mergeEvents([sampleEvent], [updated])).toEqual([updated]);
  });
});
