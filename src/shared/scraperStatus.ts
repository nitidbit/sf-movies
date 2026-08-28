import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Event } from "./events/event";
import { compareWithSceneF, hasDiscrepancies, type ComparisonReport } from "./scenefCompare";
import type { SceneFListingsResponse } from "./scrapers/scenef";
import type { TheaterConfig } from "./theaters";

// Status blocks live in this directory under movie-data, so the scrape
// workflows' existing "git add movie-data" commits them; loadEvents knows
// to skip it, and the status page reads it.
export const STATUS_DIR_NAME = "scraper-status";

// Our slug -> SceneF venue id for the independently scraped theaters. A
// diagnostic concern, deliberately kept out of the production theater config.
const SCENEF_VENUE_IDS: Record<string, string> = {
  balboa: "balboa",
  vogue: "vogue",
  "four-star": "4star",
  roxie: "roxie",
  ata: "ata",
};

export function scenefVenueIdFor(theater: TheaterConfig): string | undefined {
  return theater.venueId ?? SCENEF_VENUE_IDS[theater.slug];
}

// Fetches SceneF's feed for the theater's venue and diffs our freshly
// scraped events against it. Shared by the daily scrape (via
// recordScraperStatus) and the ad-hoc terminal comparison script.
export async function runSceneFComparison(
  theater: TheaterConfig,
  ours: Event[],
  fetchFn: (url: string) => Promise<Response> = fetch,
): Promise<ComparisonReport> {
  const venueId = scenefVenueIdFor(theater);
  if (!venueId) throw new Error(`No SceneF venue mapping for "${theater.slug}"`);

  const response = await fetchFn(`https://scenef.com/api/listings?venue=${venueId}&compact=1`);
  const scenef: SceneFListingsResponse = await response.json();
  return compareWithSceneF(ours, scenef);
}

export interface ScraperStatusBlock {
  slug: string;
  theater: string;
  generatedAt: string;
  status: "ok" | "discrepancies" | "unavailable";
  report?: ComparisonReport;
  error?: string;
}

export async function recordScraperStatus(
  statusDir: string,
  theater: TheaterConfig,
  events: Event[],
  fetchFn: (url: string) => Promise<Response> = fetch,
): Promise<void> {
  // A theater whose showtimes come FROM SceneF would only compare SceneF
  // to itself — circular, so it gets no status block at all.
  if (theater.source === "scenef") return;

  const block = await buildBlock(theater, events, fetchFn);
  await mkdir(statusDir, { recursive: true });
  await writeFile(join(statusDir, `${theater.slug}.json`), `${JSON.stringify(block, null, 2)}\n`);
}

// Every committed status block, for the status page to render at build
// time. A missing directory just means no scrape has run since the feature
// landed — an empty fleet, not an error.
export async function loadStatusBlocks(statusDir: string): Promise<ScraperStatusBlock[]> {
  let names: string[];
  try {
    names = (await readdir(statusDir)).filter((name) => name.endsWith(".json"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  return Promise.all(
    names.map(async (name) => JSON.parse(await readFile(join(statusDir, name), "utf-8"))),
  );
}

// Any failure reaching SceneF (network, bad response) becomes an
// "unavailable" block — the caller never sees an exception, so a SceneF
// outage can't break the scrape this rides along with.
async function buildBlock(
  theater: TheaterConfig,
  events: Event[],
  fetchFn: (url: string) => Promise<Response>,
): Promise<ScraperStatusBlock> {
  const identity = {
    slug: theater.slug,
    theater: theater.name,
    generatedAt: new Date().toISOString(),
  };

  try {
    const report = await runSceneFComparison(theater, events, fetchFn);
    return { ...identity, status: hasDiscrepancies(report) ? "discrepancies" : "ok", report };
  } catch (error) {
    return { ...identity, status: "unavailable", error: (error as Error).message };
  }
}
