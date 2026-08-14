import { join } from "node:path";
import { writeTheaterEvents } from "../lib/events/persist";
import { fetchSquarespaceEvents } from "../lib/scrapers/squarespace";
import { theaters } from "../lib/theaters";

const DATA_DIR = join(process.cwd(), "movie-data");

async function main() {
	const slug = process.argv[2];
	const theater = slug ? theaters[slug] : undefined;
	if (!theater) {
		console.error(`Usage: scrape-theater.ts <slug>. Known theaters: ${Object.keys(theaters).join(", ")}`);
		process.exit(1);
	}

	const events = await fetchSquarespaceEvents(theater.baseUrl, theater.name);
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
