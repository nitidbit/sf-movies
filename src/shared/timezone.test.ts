import { describe, expect, it } from "vitest";
import { zonedTimeToUtc } from "./timezone";

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
