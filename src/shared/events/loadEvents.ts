import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Event } from "./event";

async function findJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
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

  return events.sort((a, b) => a.startTime.localeCompare(b.startTime));
}
