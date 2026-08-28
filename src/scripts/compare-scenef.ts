import type { ShowingRow } from "../shared/scenefCompare";
import { runSceneFComparison, scenefVenueIdFor } from "../shared/scraperStatus";
import { fetchEventsFor } from "../shared/scrapers/fetchEvents";
import { theaters } from "../shared/theaters";

function printRows(label: string, rows: ShowingRow[]) {
  if (rows.length === 0) return;
  console.log(`  ${label}:`);
  for (const row of rows) {
    console.log(`    ${row.startTime.slice(0, 10)} ${row.startTime.slice(11, 16)}  ${row.title}`);
  }
}

async function compareTheater(slug: string) {
  const theater = theaters[slug];
  const venueId = theater && scenefVenueIdFor(theater);
  if (!theater || !venueId) throw new Error(`No SceneF venue mapping for "${slug}"`);

  const ours = await fetchEventsFor(theater);
  const report = await runSceneFComparison(theater, ours);
  const selfComparison =
    theater.source === "scenef" ? " — self-comparison, SceneF is our source" : "";
  console.log(`== ${theater.name} (vs SceneF venue "${venueId}"${selfComparison})`);
  console.log(
    `  matched: ${report.matched}   time-mismatch: ${report.timeMismatches.length}   title-mismatch: ${report.titleMismatches.length}` +
      `   ours-only: ${report.oursOnly.length}   scenef-only: ${report.scenefOnly.length}` +
      `   excluded: ours ${report.excluded.ours} / scenef ${report.excluded.scenef}`,
  );
  if (report.timeMismatches.length > 0) {
    console.log("  time-mismatch:");
    for (const mismatch of report.timeMismatches) {
      console.log(
        `    ${mismatch.ourStartTime.slice(0, 10)}  ours ${mismatch.ourStartTime.slice(11, 16)} vs scenef ${mismatch.scenefStartTime.slice(11, 16)}  ${mismatch.title}`,
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
