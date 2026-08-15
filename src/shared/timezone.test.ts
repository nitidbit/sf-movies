import { describe, expect, it } from "vitest";
import { zonedIsoString, zonedTimeToUtc } from "./timezone";

describe("zonedTimeToUtc", () => {
  it("converts a summer (PDT, UTC-7) wall-clock time to the correct UTC instant", () => {
    const result = zonedTimeToUtc(2026, 8, 14, 19, 0, "America/Los_Angeles");
    expect(result.toISOString()).toBe("2026-08-15T02:00:00.000Z");
  });

  it("converts a winter (PST, UTC-8) wall-clock time to the correct UTC instant", () => {
    const result = zonedTimeToUtc(2026, 1, 14, 19, 0, "America/Los_Angeles");
    expect(result.toISOString()).toBe("2026-01-15T03:00:00.000Z");
  });
});

describe("zonedIsoString", () => {
  it("formats a summer (PDT, UTC-7) instant with the local wall-clock time and offset", () => {
    const instant = new Date("2026-08-15T02:00:00.000Z");
    expect(zonedIsoString(instant, "America/Los_Angeles")).toBe("2026-08-14T19:00:00-07:00");
  });

  it("formats a winter (PST, UTC-8) instant with the local wall-clock time and offset", () => {
    const instant = new Date("2026-01-15T03:00:00.000Z");
    expect(zonedIsoString(instant, "America/Los_Angeles")).toBe("2026-01-14T19:00:00-08:00");
  });

  it("round-trips through zonedTimeToUtc", () => {
    const instant = zonedTimeToUtc(2026, 8, 14, 19, 0, "America/Los_Angeles");
    expect(zonedIsoString(instant, "America/Los_Angeles")).toBe("2026-08-14T19:00:00-07:00");
  });

  it("still parses back to the same instant regardless of the offset in the string", () => {
    const instant = new Date("2026-08-15T02:00:00.000Z");
    const zoned = zonedIsoString(instant, "America/Los_Angeles");
    expect(new Date(zoned).getTime()).toBe(instant.getTime());
  });
});
