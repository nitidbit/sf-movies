import type { Event } from "../events/event";
import { zonedIsoString } from "../timezone";

const ATTRIBUTION = "Showtimes via SceneF.com";
const LA_TIME_ZONE = "America/Los_Angeles";

export interface SceneFFilm {
  key: string;
  title: string;
  overview?: string;
}

export interface SceneFScreening {
  id: string;
  filmKey: string;
  startsAt: string;
  ticketUrl: string;
}

export interface SceneFListingsResponse {
  films: SceneFFilm[];
  screenings: SceneFScreening[];
}

export function parseSceneFListings(data: SceneFListingsResponse, theater: string): Event[] {
  const filmByKey = new Map(data.films.map((film) => [film.key, film]));

  return data.screenings.map((screening) => {
    const film = filmByKey.get(screening.filmKey);
    const synopsis = film?.overview;

    return {
      theater,
      title: film?.title ?? "Unknown film",
      startTime: zonedIsoString(new Date(screening.startsAt), LA_TIME_ZONE),
      sourceUrl: screening.ticketUrl,
      attribution: ATTRIBUTION,
      ...(synopsis !== undefined && synopsis.length > 0 && { synopsis }),
    };
  });
}

// Alamo Drafthouse's own site is a Cloudflare-protected SPA with no public
// data feed — its showtimes here come from SceneF.com's licensed chain-data
// feed instead (see https://scenef.com/agents for their usage terms,
// including the "Showtimes via SceneF.com" attribution this scraper sets
// on every event).
export async function fetchSceneFEvents(
  venueId: string,
  theater: string,
  fetchFn: (url: string) => Promise<Response> = fetch,
): Promise<Event[]> {
  // The full feed, not "compact=1": film overviews (our synopsis) are only
  // in this one.
  const response = await fetchFn(`https://scenef.com/api/listings?venue=${venueId}`);
  const data: SceneFListingsResponse = await response.json();
  return parseSceneFListings(data, theater);
}
