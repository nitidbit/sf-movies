import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Event } from "./event";
import { writeTheaterEvents } from "./persist";

const augustEvent: Event = {
  theater: "Balboa",
  title: "The Odyssey",
  startTime: "2026-08-14T02:00:00.000Z", // 2026-08-13 19:00 PDT
  sourceUrl: "https://www.balboamovies.com/calendar-of-events/the-odyssey-august-13",
};

const septemberEvent: Event = {
  theater: "Balboa",
  title: "My Sassy Girl",
  startTime: "2026-09-19T03:30:00.000Z", // 2026-09-18 20:30 PDT
  sourceUrl: "https://www.balboamovies.com/calendar-of-events/my-sassy-girl-september-18",
};

let dataDir: string;

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "sf-movies-test-"));
});

afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

describe("writeTheaterEvents", () => {
  it("writes each event into its own year/theater/month.json file, keyed in America/Los_Angeles", async () => {
    await writeTheaterEvents(dataDir, "balboa", [augustEvent, septemberEvent]);

    const august = JSON.parse(
      await readFile(join(dataDir, "2026", "balboa", "08.json"), "utf-8"),
    );
    const september = JSON.parse(
      await readFile(join(dataDir, "2026", "balboa", "09.json"), "utf-8"),
    );

    expect(august).toEqual([augustEvent]);
    expect(september).toEqual([septemberEvent]);
  });

  it("reports no changed files when re-writing identical events", async () => {
    await writeTheaterEvents(dataDir, "balboa", [augustEvent]);
    const changed = await writeTheaterEvents(dataDir, "balboa", [augustEvent]);

    expect(changed).toEqual([]);
  });

  it("reports the file as changed when an event's data changes", async () => {
    await writeTheaterEvents(dataDir, "balboa", [augustEvent]);
    const updated: Event = { ...augustEvent, synopsis: "Final Show" };
    const changed = await writeTheaterEvents(dataDir, "balboa", [updated]);

    expect(changed).toEqual([join(dataDir, "2026", "balboa", "08.json")]);
  });
});
