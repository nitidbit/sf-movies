import { describe, expect, it } from "vitest";
import { dayFilterLabel, titleFilterLabel } from "./filterLabel";

describe("titleFilterLabel", () => {
  it("returns the plain label when the value is empty", () => {
    expect(titleFilterLabel("")).toEqual("title");
  });

  it("returns the plain label when the value is whitespace-only", () => {
    expect(titleFilterLabel("   ")).toEqual("title");
  });

  it("returns the trimmed value with its typed casing preserved", () => {
    expect(titleFilterLabel("  Odyssey  ")).toEqual("title: Odyssey");
  });
});

describe("dayFilterLabel", () => {
  it("returns the plain label when from is empty", () => {
    expect(dayFilterLabel("", "")).toEqual("day");
  });

  it("returns a single date when from and to are the same day", () => {
    expect(dayFilterLabel("2026-08-15", "2026-08-15")).toEqual("day: Aug 15");
  });

  it("returns a dashed range when from and to differ", () => {
    expect(dayFilterLabel("2026-08-15", "2026-08-22")).toEqual("day: Aug 15–Aug 22");
  });
});
