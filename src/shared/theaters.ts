export interface TheaterConfig {
  slug: string;
  name: string;
  baseUrl: string;
  source: "squarespace" | "roxie" | "scenef";
  // Required when source is "scenef" — the venue id in SceneF's feed.
  venueId?: string;
}

// Adding a Squarespace-based theater here (Vogue, 4-Star) is the only change
// scrape-theater.ts needs to pick it up — no code changes required.
export const theaters: Record<string, TheaterConfig> = {
  balboa: {
    slug: "balboa",
    name: "Balboa",
    baseUrl: "https://www.balboamovies.com",
    source: "squarespace",
  },
  vogue: {
    slug: "vogue",
    name: "Vogue",
    baseUrl: "https://voguemovies.com",
    source: "squarespace",
  },
  "four-star": {
    slug: "four-star",
    name: "4-Star",
    baseUrl: "https://www.4-star-movies.com",
    source: "squarespace",
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
};
