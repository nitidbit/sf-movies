import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Event } from "./event";
import { loadAllEvents } from "./loadEvents";

const sampleEvent: Event = {
  theater: "Balboa",
  title: "The Tale of Zatoichi",
  startTime: "2026-08-30T14:30:00-07:00",
  sourceUrl: "https://www.balboamovies.com/calendar-of-events/the-tale-of-zatoichi-august-30",
};

let dataDir: string;

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "sf-movies-load-"));
});

afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

describe("loadAllEvents", () => {
  it("loads month files but ignores the scraper-status directory", async () => {
    await mkdir(join(dataDir, "2026", "balboa"), { recursive: true });
    await writeFile(join(dataDir, "2026", "balboa", "08.json"), JSON.stringify([sampleEvent]));

    // Status blocks share movie-data (so the scrape workflows commit them)
    // but are not events and must never reach the site.
    await mkdir(join(dataDir, "scraper-status"), { recursive: true });
    await writeFile(
      join(dataDir, "scraper-status", "balboa.json"),
      JSON.stringify({ slug: "balboa", status: "ok" }),
    );

    expect(await loadAllEvents(dataDir)).toEqual([sampleEvent]);
  });
});
