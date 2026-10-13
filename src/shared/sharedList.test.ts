import { describe, expect, it } from "vitest";
import { listIdFromPath, newListId, othersWatching } from "./sharedList";

describe("listIdFromPath", () => {
  it("reads the id from a list URL", () => {
    expect(listIdFromPath("/list/k7f3q9x2m4ab")).toEqual("k7f3q9x2m4ab");
  });

  it("returns null on the plain front page", () => {
    expect(listIdFromPath("/")).toBeNull();
  });
});

describe("newListId", () => {
  it("makes 12 lowercase letters and digits", () => {
    expect(newListId()).toMatch(/^[a-z0-9]{12}$/);
  });

  it("makes a different id each time", () => {
    expect(newListId()).not.toEqual(newListId());
  });
});

describe("othersWatching", () => {
  it("leaves out your own handle", () => {
    expect(othersWatching(["AN", "BE", "CY"], "BE")).toEqual(["AN", "CY"]);
  });
});
