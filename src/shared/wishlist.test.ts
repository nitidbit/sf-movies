import { describe, expect, it } from "vitest";
import { parseWishlist, serializeWishlist } from "./wishlist";

describe("parseWishlist", () => {
  it("returns an empty list when there's nothing saved", () => {
    expect(parseWishlist(null)).toEqual([]);
  });

  it("parses a previously-saved list of sourceUrls", () => {
    expect(parseWishlist('["https://roxie.com/film/a","https://roxie.com/film/b"]')).toEqual([
      "https://roxie.com/film/a",
      "https://roxie.com/film/b",
    ]);
  });

  it("falls back to an empty list for invalid JSON rather than throwing", () => {
    expect(parseWishlist("not json")).toEqual([]);
  });

  it("falls back to an empty list when the saved value isn't an array", () => {
    expect(parseWishlist('{"not": "an array"}')).toEqual([]);
  });

  it("drops non-string entries from an otherwise-valid array", () => {
    expect(parseWishlist('["https://roxie.com/film/a", 42, null]')).toEqual([
      "https://roxie.com/film/a",
    ]);
  });
});

describe("serializeWishlist", () => {
  it("round-trips through parseWishlist", () => {
    const ids = ["https://roxie.com/film/a", "https://roxie.com/film/b"];
    expect(parseWishlist(serializeWishlist(ids))).toEqual(ids);
  });

  it("serializes an empty list", () => {
    expect(serializeWishlist([])).toEqual("[]");
  });
});
