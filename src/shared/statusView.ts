import { hasDiscrepancies } from "./scenefCompare";
import type { ScraperStatusBlock } from "./scraperStatus";

// Everything the status page decides — verdict, staleness, which numbers to
// show — is decided here, so the page template stays purely presentational.

// A block older than this means the daily workflow itself has stopped
// running — a different failure than SceneF being unavailable.
const STALE_AFTER_MS = 48 * 60 * 60 * 1000;

export interface StatusCounts {
  matched: number;
  timeMismatches: number;
  titleMismatches: number;
  oursOnly: number;
  scenefOnly: number;
  excluded: { ours: number; scenef: number };
}

export interface StatusView {
  verdict: "green" | "red" | "unavailable";
  stale: boolean;
  counts?: StatusCounts;
  error?: string;
}

export function deriveStatus(block: ScraperStatusBlock, now: Date): StatusView {
  const stale = now.getTime() - new Date(block.generatedAt).getTime() > STALE_AFTER_MS;

  const report = block.report;
  if (report === undefined) {
    return {
      verdict: "unavailable",
      stale,
      error: block.error ?? "comparison unavailable",
    };
  }

  return {
    verdict: hasDiscrepancies(report) ? "red" : "green",
    stale,
    counts: {
      matched: report.matched,
      timeMismatches: report.timeMismatches.length,
      titleMismatches: report.titleMismatches.length,
      oursOnly: report.oursOnly.length,
      scenefOnly: report.scenefOnly.length,
      excluded: report.excluded,
    },
  };
}
