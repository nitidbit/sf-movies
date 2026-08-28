import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { STATUS_DIR_NAME } from "../scraperStatus";
import type { Event } from "./event";
import { compareByStartTime } from "./schedule";

// The scraper-status directory holds per-theater comparison blocks — scrape
// by-products that share movie-data (so the workflows commit them) but are
// not events.
const NON_EVENT_DIRS = new Set([STATUS_DIR_NAME]);

async function findJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (NON_EVENT_DIRS.has(entry.name)) return [];
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return findJsonFiles(path);
      return entry.name.endsWith(".json") ? [path] : [];
    }),
  );
  return files.flat();
}

// Flattens every movie-data/<year>/<theater>/<month>.json file into one
// chronologically-sorted list. Each theater's scraper writes independently,
// so this is the one place that brings them back together for the site.
export async function loadAllEvents(dataDir: string): Promise<Event[]> {
  let files: string[];
  try {
    files = await findJsonFiles(dataDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const events = (
    await Promise.all(files.map(async (file) => JSON.parse(await readFile(file, "utf-8")) as Event[]))
  ).flat();

  return events.sort(compareByStartTime);
}
