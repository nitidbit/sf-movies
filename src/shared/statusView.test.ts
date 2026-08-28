import { describe, expect, it } from "vitest";
import type { ScraperStatusBlock } from "./scraperStatus";
import { deriveStatus } from "./statusView";

// A block as recordScraperStatus writes it, in full agreement. Tests tweak
// only what matters to the case at hand.
function sampleBlock(overrides: Partial<ScraperStatusBlock> = {}): ScraperStatusBlock {
  return {
    slug: "balboa",
    theater: "Balboa",
    generatedAt: "2026-08-28T05:00:00.000Z",
    status: "ok",
    report: {
      matched: 22,
      timeMismatches: [],
      titleMismatches: [],
      oursOnly: [],
      scenefOnly: [],
      collapsedDuplicates: 0,
      excluded: { ours: 3, scenef: 0 },
    },
    ...overrides,
  };
}

// One hour after the sample block was generated.
const NOW = new Date("2026-08-28T06:00:00.000Z");

describe("deriveStatus", () => {
  it("derives green with counts for a fresh block in full agreement", () => {
    expect(deriveStatus(sampleBlock(), NOW)).toEqual({
      verdict: "green",
      stale: false,
      counts: {
        matched: 22,
        timeMismatches: 0,
        titleMismatches: 0,
        oursOnly: 0,
        scenefOnly: 0,
        excluded: { ours: 3, scenef: 0 },
      },
    });
  });

  it("flips to red when any discrepancy class is non-empty", () => {
    const row = { title: "Akira", startTime: "2026-09-04T19:30:00-07:00" };
    const disagreements = [
      { timeMismatches: [{ title: "Akira", ourStartTime: row.startTime, scenefStartTime: row.startTime }] },
      { titleMismatches: [{ startTime: row.startTime, ourTitle: "Akira", scenefTitle: "Cure" }] },
      { oursOnly: [row] },
      { scenefOnly: [row] },
    ];

    for (const disagreement of disagreements) {
      const block = sampleBlock();
      const view = deriveStatus({ ...block, report: { ...block.report!, ...disagreement } }, NOW);
      expect(view.verdict).toBe("red");
    }
  });

  it("derives unavailable, with no counts, when the comparison could not run", () => {
    const block = sampleBlock({ status: "unavailable", report: undefined, error: "SceneF request timed out" });

    expect(deriveStatus(block, NOW)).toEqual({
      verdict: "unavailable",
      stale: false,
      error: "SceneF request timed out",
    });
  });

  it("flags a block older than 48 hours as stale, on either side of the boundary", () => {
    // Block generated 2026-08-28T05:00Z; the daily workflow may be dead.
    const justUnder = new Date("2026-08-30T04:59:00.000Z");
    const justOver = new Date("2026-08-30T05:01:00.000Z");

    expect(deriveStatus(sampleBlock(), justUnder).stale).toBe(false);
    expect(deriveStatus(sampleBlock(), justOver).stale).toBe(true);
    expect(deriveStatus(sampleBlock(), justOver).verdict).toBe("green");
  });
});
