export interface TheaterConfig {
  slug: string;
  name: string;
  baseUrl: string;
  source: "cinema-sf" | "roxie" | "scenef" | "tribe";
  // Required when source is "scenef" — the venue id in SceneF's feed.
  venueId?: string;
}

// Cinema SF operates the Balboa, Vogue, and 4-Star on Squarespace sites that
// share one calendar format. Adding another of their venues here is the only
// change scrape-theater.ts needs to pick it up — no code changes required.
export const theaters: Record<string, TheaterConfig> = {
  balboa: {
    slug: "balboa",
    name: "Balboa",
    baseUrl: "https://www.balboamovies.com",
    source: "cinema-sf",
  },
  vogue: {
    slug: "vogue",
    name: "Vogue",
    baseUrl: "https://voguemovies.com",
    source: "cinema-sf",
  },
  "four-star": {
    slug: "four-star",
    name: "4-Star",
    baseUrl: "https://www.4-star-movies.com",
    source: "cinema-sf",
  },
  roxie: {
    slug: "roxie",
    name: "Roxie",
    baseUrl: "https://roxie.com",
    source: "roxie",
  },
  alamo: {
    slug: "alamo",
    name: "Alamo",
    baseUrl: "https://drafthouse.com/sf",
    source: "scenef",
    venueId: "alamo-new-mission",
  },
  ata: {
    slug: "ata",
    name: "ATA",
    baseUrl: "https://artiststelevisionaccess.org",
    source: "tribe",
  },
};
