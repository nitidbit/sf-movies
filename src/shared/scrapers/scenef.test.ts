import { describe, expect, it, vi } from "vitest";
import { fetchSceneFEvents, parseSceneFListings } from "./scenef";

const sampleResponse = {
  films: [
    { key: "tmdb-1368337", title: "The Odyssey" },
    { key: "tmdb-1240889", title: "Teenage Sex and Death at Camp Miasma" },
  ],
  screenings: [
    {
      id: "1f708f4cec96",
      filmKey: "tmdb-1368337",
      startsAt: "2026-08-13T16:45:00-07:00",
      ticketUrl: "https://scenef.com/go/1f708f4cec96",
    },
    {
      id: "bfc1113620df",
      filmKey: "tmdb-1240889",
      startsAt: "2026-08-13T17:00:00-07:00",
      ticketUrl: "https://scenef.com/go/bfc1113620df",
      tags: ["sold-out"],
    },
  ],
};

describe("parseSceneFListings", () => {
  it("joins screenings to films and normalizes into events with attribution", () => {
    expect(parseSceneFListings(sampleResponse, "Alamo Drafthouse New Mission")).toEqual([
      {
        theater: "Alamo Drafthouse New Mission",
        title: "The Odyssey",
        startTime: "2026-08-13T16:45:00-07:00",
        sourceUrl: "https://scenef.com/go/1f708f4cec96",
        attribution: "Showtimes via SceneF.com",
      },
      {
        theater: "Alamo Drafthouse New Mission",
        title: "Teenage Sex and Death at Camp Miasma",
        startTime: "2026-08-13T17:00:00-07:00",
        sourceUrl: "https://scenef.com/go/bfc1113620df",
        attribution: "Showtimes via SceneF.com",
        notes: "sold-out",
      },
    ]);
  });
});

describe("fetchSceneFEvents", () => {
  it("queries the given venue and parses the response", async () => {
    const fetchFn = vi.fn(async () => ({ json: async () => sampleResponse }) as Response);

    const events = await fetchSceneFEvents("alamo-new-mission", "Alamo Drafthouse New Mission", fetchFn);

    expect(fetchFn).toHaveBeenCalledWith(
      "https://scenef.com/api/listings?venue=alamo-new-mission&compact=1",
    );
    expect(events).toEqual(parseSceneFListings(sampleResponse, "Alamo Drafthouse New Mission"));
  });
});
