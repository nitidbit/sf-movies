import { describe, expect, it } from "vitest";
import { parseShortlist, serializeShortlist } from "./shortlist";

describe("parseShortlist", () => {
  it("returns an empty list when there's nothing saved", () => {
    expect(parseShortlist(null)).toEqual([]);
  });

  it("parses a previously-saved list of sourceUrls", () => {
    expect(parseShortlist('["https://roxie.com/film/a","https://roxie.com/film/b"]')).toEqual([
      "https://roxie.com/film/a",
      "https://roxie.com/film/b",
    ]);
  });

  it("falls back to an empty list for invalid JSON rather than throwing", () => {
    expect(parseShortlist("not json")).toEqual([]);
  });

  it("falls back to an empty list when the saved value isn't an array", () => {
    expect(parseShortlist('{"not": "an array"}')).toEqual([]);
  });

  it("drops non-string entries from an otherwise-valid array", () => {
    expect(parseShortlist('["https://roxie.com/film/a", 42, null]')).toEqual([
      "https://roxie.com/film/a",
    ]);
  });
});

describe("serializeShortlist", () => {
  it("round-trips through parseShortlist", () => {
    const ids = ["https://roxie.com/film/a", "https://roxie.com/film/b"];
    expect(parseShortlist(serializeShortlist(ids))).toEqual(ids);
  });

  it("serializes an empty list", () => {
    expect(serializeShortlist([])).toEqual("[]");
  });
});
