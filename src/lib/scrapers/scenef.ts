import type { Event } from "../events/event";

const ATTRIBUTION = "Showtimes via SceneF.com";

interface SceneFFilm {
	key: string;
	title: string;
}

interface SceneFScreening {
	id: string;
	filmKey: string;
	startsAt: string;
	ticketUrl: string;
	tags?: string[];
}

interface SceneFListingsResponse {
	films: SceneFFilm[];
	screenings: SceneFScreening[];
}

export function parseSceneFListings(data: SceneFListingsResponse, theater: string): Event[] {
	const titleByFilmKey = new Map(data.films.map((film) => [film.key, film.title]));

	return data.screenings.map((screening) => ({
		theater,
		title: titleByFilmKey.get(screening.filmKey) ?? "Unknown film",
		startTime: new Date(screening.startsAt).toISOString(),
		sourceUrl: screening.ticketUrl,
		attribution: ATTRIBUTION,
		...(screening.tags && screening.tags.length > 0 && { notes: screening.tags.join(", ") }),
	}));
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
	const response = await fetchFn(`https://scenef.com/api/listings?venue=${venueId}&compact=1`);
	const data: SceneFListingsResponse = await response.json();
	return parseSceneFListings(data, theater);
}
