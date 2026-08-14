import { join } from "node:path";
import type { Event } from "../lib/events/event";
import { writeTheaterEvents } from "../lib/events/persist";
import { fetchRoxieEvents } from "../lib/scrapers/roxie";
import { fetchSceneFEvents } from "../lib/scrapers/scenef";
import { fetchSquarespaceEvents } from "../lib/scrapers/squarespace";
import { theaters, type TheaterConfig } from "../lib/theaters";

const DATA_DIR = join(process.cwd(), "movie-data");

function fetchEventsFor(theater: TheaterConfig): Promise<Event[]> {
	switch (theater.source) {
		case "squarespace":
			return fetchSquarespaceEvents(theater.baseUrl, theater.name);
		case "roxie":
			return fetchRoxieEvents(theater.baseUrl, theater.name);
		case "scenef":
			if (!theater.venueId) {
				throw new Error(`Theater "${theater.slug}" has source "scenef" but no venueId configured`);
			}
			return fetchSceneFEvents(theater.venueId, theater.name);
	}
}

async function main() {
	const slug = process.argv[2];
	const theater = slug ? theaters[slug] : undefined;
	if (!theater) {
		console.error(`Usage: scrape-theater.ts <slug>. Known theaters: ${Object.keys(theaters).join(", ")}`);
		process.exit(1);
	}

	const events = await fetchEventsFor(theater);
	console.log(`Fetched ${events.length} upcoming events for ${theater.name}`);

	const changedFiles = await writeTheaterEvents(DATA_DIR, theater.slug, events);
	console.log(
		changedFiles.length > 0
			? `Updated: ${changedFiles.join(", ")}`
			: "No changes — data already up to date",
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
