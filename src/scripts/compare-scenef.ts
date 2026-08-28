import { compareWithSceneF, type ShowingRow } from "../shared/scenefCompare";
import { fetchEventsFor } from "../shared/scrapers/fetchEvents";
import type { SceneFListingsResponse } from "../shared/scrapers/scenef";
import { theaters } from "../shared/theaters";

// Our slug -> SceneF venue id. A diagnostic concern, deliberately kept out
// of the production theater config.
const SCENEF_VENUE_IDS: Record<string, string> = {
  balboa: "balboa",
  vogue: "vogue",
  "four-star": "4star",
  roxie: "roxie",
  ata: "ata",
};

function venueIdFor(slug: string): string | undefined {
  return theaters[slug]?.venueId ?? SCENEF_VENUE_IDS[slug];
}

function printRows(label: string, rows: ShowingRow[]) {
  if (rows.length === 0) return;
  console.log(`  ${label}:`);
  for (const row of rows) {
    console.log(`    ${row.startTime.slice(0, 10)} ${row.startTime.slice(11, 16)}  ${row.title}`);
  }
}

async function compareTheater(slug: string) {
  const theater = theaters[slug];
  const venueId = venueIdFor(slug);
  if (!theater || !venueId) throw new Error(`No SceneF venue mapping for "${slug}"`);

  const [ours, response] = await Promise.all([
    fetchEventsFor(theater),
    fetch(`https://scenef.com/api/listings?venue=${venueId}&compact=1`),
  ]);
  const scenef: SceneFListingsResponse = await response.json();

  const report = compareWithSceneF(ours, scenef);
  const selfComparison =
    theater.source === "scenef" ? " — self-comparison, SceneF is our source" : "";
  console.log(`== ${theater.name} (vs SceneF venue "${venueId}"${selfComparison})`);
  console.log(
    `  matched: ${report.matched}   time-drift: ${report.timeDrifts.length}   title-mismatch: ${report.titleMismatches.length}` +
      `   ours-only: ${report.oursOnly.length}   scenef-only: ${report.scenefOnly.length}` +
      `   excluded: ours ${report.excluded.ours} / scenef ${report.excluded.scenef}`,
  );
  if (report.timeDrifts.length > 0) {
    console.log("  time-drift:");
    for (const drift of report.timeDrifts) {
      console.log(
        `    ${drift.ourStartTime.slice(0, 10)}  ours ${drift.ourStartTime.slice(11, 16)} vs scenef ${drift.scenefStartTime.slice(11, 16)}  ${drift.title}`,
      );
    }
  }
  if (report.titleMismatches.length > 0) {
    console.log("  title-mismatch:");
    for (const mismatch of report.titleMismatches) {
      console.log(
        `    ${mismatch.startTime.slice(0, 10)} ${mismatch.startTime.slice(11, 16)}  ours "${mismatch.ourTitle}" vs scenef "${mismatch.scenefTitle}"`,
      );
    }
  }
  printRows("ours-only", report.oursOnly);
  printRows("scenef-only", report.scenefOnly);
}

async function main() {
  const slug = process.argv[2];
  if (slug && !theaters[slug]) {
    console.error(`Usage: compare-scenef.ts [slug]. Known theaters: ${Object.keys(theaters).join(", ")}`);
    process.exit(1);
  }

  for (const theaterSlug of slug ? [slug] : Object.keys(theaters)) {
    await compareTheater(theaterSlug);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
