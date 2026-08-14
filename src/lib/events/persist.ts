import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Event } from "./event";
import { mergeEvents } from "./eventStore";

const LA_TIME_ZONE = "America/Los_Angeles";

interface MonthGroup {
	year: string;
	month: string;
	events: Event[];
}

function monthOf(event: Event): { year: string; month: string } {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: LA_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
	}).formatToParts(new Date(event.startTime));

	const year = parts.find((part) => part.type === "year")?.value;
	const month = parts.find((part) => part.type === "month")?.value;
	if (!year || !month) {
		throw new Error(`Could not determine year/month for event startTime: ${event.startTime}`);
	}
	return { year, month };
}

function groupByMonth(events: Event[]): MonthGroup[] {
	const groups = new Map<string, MonthGroup>();
	for (const event of events) {
		const { year, month } = monthOf(event);
		const key = `${year}/${month}`;
		const group = groups.get(key) ?? { year, month, events: [] };
		group.events.push(event);
		groups.set(key, group);
	}
	return [...groups.values()];
}

async function readExistingEvents(filePath: string): Promise<Event[]> {
	try {
		return JSON.parse(await readFile(filePath, "utf-8"));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
		throw error;
	}
}

// Writes newly scraped events for one theater into movie-data/<year>/<theaterSlug>/<month>.json,
// merging with whatever's already on disk. Returns the file paths that changed, so the caller
// (the daily scrape script) knows whether there's anything to commit.
export async function writeTheaterEvents(
	dataDir: string,
	theaterSlug: string,
	events: Event[],
): Promise<string[]> {
	const changedFiles: string[] = [];

	for (const { year, month, events: incoming } of groupByMonth(events)) {
		const filePath = join(dataDir, year, theaterSlug, `${month}.json`);
		const existing = await readExistingEvents(filePath);
		const merged = mergeEvents(existing, incoming);

		const nextContent = `${JSON.stringify(merged, null, 2)}\n`;
		const previousContent = existing.length > 0 ? `${JSON.stringify(existing, null, 2)}\n` : null;

		if (nextContent !== previousContent) {
			await mkdir(dirname(filePath), { recursive: true });
			await writeFile(filePath, nextContent);
			changedFiles.push(filePath);
		}
	}

	return changedFiles;
}
