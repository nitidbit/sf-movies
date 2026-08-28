import type { Event } from "./events/event";
import type { SceneFListingsResponse } from "./scrapers/scenef";
import { zonedIsoString } from "./timezone";

const LA_TIME_ZONE = "America/Los_Angeles";

// One showing in a comparison report, reduced to what a human needs to chase
// the discrepancy: what was playing and when (ISO string in LA time, as both
// feeds already format it).
export interface ShowingRow {
  title: string;
  startTime: string;
}

// The same film paired across feeds at nearly-but-not-exactly the same
// time — the "are our scraped times right" signal.
export interface TimeDriftRow {
  title: string;
  ourStartTime: string;
  scenefStartTime: string;
}

// Different titles occupying the same start instant. Informational: two
// screens can genuinely play different films at once.
export interface TitleMismatchRow {
  startTime: string;
  ourTitle: string;
  scenefTitle: string;
}

export interface ComparisonReport {
  matched: number;
  timeDrifts: TimeDriftRow[];
  titleMismatches: TitleMismatchRow[];
  oursOnly: ShowingRow[];
  scenefOnly: ShowingRow[];
  excluded: { ours: number; scenef: number };
}

const DRIFT_TOLERANCE_MS = 15 * 60 * 1000;

// "Akira 4K" and "Akira" are the same film: titles are compatible when,
// lowercased and stripped to alphanumerics, one contains the other.
function titlesCompatible(a: string, b: string): boolean {
  const normalize = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const [shorter, longer] = [normalize(a), normalize(b)].sort((x, y) => x.length - y.length);
  return shorter.length > 0 && longer.includes(shorter);
}

// Diffs our freshly scraped events against SceneF's independently verified
// feed for the same venue. Showings pair up when they start at the same
// instant with the same title; leftovers on either side are reported so
// swallowed or phantom showtimes surface.
function laDate(isoInstant: string): string {
  return zonedIsoString(new Date(isoInstant), LA_TIME_ZONE).slice(0, 10);
}

// The two feeds look different distances into the future, so showings are
// only comparable on days both feeds cover: from the later of the two first
// days through the earlier of the two last days. Showings outside that
// window are counted as excluded, never as discrepancies.
function overlapWindow(oursDates: string[], theirsDates: string[]): { first: string; last: string } | undefined {
  if (oursDates.length === 0 || theirsDates.length === 0) return undefined;
  const bounds = (dates: string[]) => [dates.reduce((a, b) => (a < b ? a : b)), dates.reduce((a, b) => (a > b ? a : b))];
  const [oursFirst, oursLast] = bounds(oursDates);
  const [theirsFirst, theirsLast] = bounds(theirsDates);
  return {
    first: oursFirst > theirsFirst ? oursFirst : theirsFirst,
    last: oursLast < theirsLast ? oursLast : theirsLast,
  };
}

export function compareWithSceneF(ours: Event[], scenef: SceneFListingsResponse): ComparisonReport {
  const titleByFilmKey = new Map(scenef.films.map((film) => [film.key, film.title]));
  const theirs: ShowingRow[] = scenef.screenings.map((screening) => ({
    title: titleByFilmKey.get(screening.filmKey) ?? "Unknown film",
    startTime: screening.startsAt,
  }));

  const window = overlapWindow(ours.map((e) => laDate(e.startTime)), theirs.map((r) => laDate(r.startTime)));
  const inWindow = (isoInstant: string) =>
    window !== undefined && laDate(isoInstant) >= window.first && laDate(isoInstant) <= window.last;

  const comparableOurs = ours.filter((event) => inWindow(event.startTime));
  const comparableTheirs = theirs.filter((row) => inWindow(row.startTime));

  // Greedy, stable pairing: exact-instant matches claim their partner first,
  // then near-miss (drift) pairs form from what's left, and only true
  // leftovers land in the one-sided buckets.
  let matched = 0;
  const timeDrifts: TimeDriftRow[] = [];
  let unpairedOurs = [...comparableOurs];
  const unpairedTheirs = [...comparableTheirs];

  unpairedOurs = unpairedOurs.filter((event) => {
    const pairIndex = unpairedTheirs.findIndex(
      (row) =>
        Date.parse(row.startTime) === Date.parse(event.startTime) &&
        titlesCompatible(row.title, event.title),
    );
    if (pairIndex < 0) return true;
    unpairedTheirs.splice(pairIndex, 1);
    matched += 1;
    return false;
  });

  unpairedOurs = unpairedOurs.filter((event) => {
    const pairIndex = unpairedTheirs.findIndex(
      (row) =>
        laDate(row.startTime) === laDate(event.startTime) &&
        Math.abs(Date.parse(row.startTime) - Date.parse(event.startTime)) <= DRIFT_TOLERANCE_MS &&
        titlesCompatible(row.title, event.title),
    );
    if (pairIndex < 0) return true;
    const [row] = unpairedTheirs.splice(pairIndex, 1);
    timeDrifts.push({
      title: event.title,
      ourStartTime: event.startTime,
      scenefStartTime: row.startTime,
    });
    return false;
  });

  const titleMismatches: TitleMismatchRow[] = [];
  unpairedOurs = unpairedOurs.filter((event) => {
    const pairIndex = unpairedTheirs.findIndex(
      (row) => Date.parse(row.startTime) === Date.parse(event.startTime),
    );
    if (pairIndex < 0) return true;
    const [row] = unpairedTheirs.splice(pairIndex, 1);
    titleMismatches.push({
      startTime: event.startTime,
      ourTitle: event.title,
      scenefTitle: row.title,
    });
    return false;
  });

  return {
    matched,
    timeDrifts,
    titleMismatches,
    oursOnly: unpairedOurs.map((event) => ({ title: event.title, startTime: event.startTime })),
    scenefOnly: unpairedTheirs,
    excluded: {
      ours: ours.length - comparableOurs.length,
      scenef: theirs.length - comparableTheirs.length,
    },
  };
}
