import * as cheerio from "cheerio";
import type { Event } from "../events/event";
import { zonedIsoString, zonedTimeToUtc } from "../timezone";

const LA_TIME_ZONE = "America/Los_Angeles";

interface RawSquarespaceEvent {
  title: string;
  startDate: number;
  endDate?: number;
  fullUrl: string;
  body?: string;
}

interface SquarespaceCalendarPage {
  upcoming: RawSquarespaceEvent[];
  pagination?: {
    nextPageUrl?: string;
  };
}

function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Titles look like "Movie Name ~ 7 PM (Final Show)" — the part before "~" is
// the real title. For a single showing the time after "~" just duplicates
// startDate; but theaters also pack a whole day into one entry ("~ 2:30 PM,
// 5 PM & 7:30 PM"), where the times after "~" are the only record of the
// extra showings — extractShowtimes recovers those.
function extractTitle(rawTitle: string): string {
  const [titlePart] = rawTitle.split("~");
  return unescapeHtml(titlePart).trim();
}

const TIME_TOKEN = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i;

function parseTimeToken(token: string): { hour: number; minute: number } | undefined {
  const match = token.trim().match(TIME_TOKEN);
  if (!match) return undefined;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return { hour, minute: Number(match[2] ?? 0) };
}

// Recognizes a title whose "~" segment is purely a list of showtimes
// ("4 PM & 7:30 PM"). Anything else riding along ("Doors at 7 PM…") means
// the segment is NOT a list of showings, and the caller keeps the event
// whole, trusting the structured startDate.
function extractShowtimes(rawTitle: string): { hour: number; minute: number }[] | undefined {
  const tildeIndex = rawTitle.indexOf("~");
  if (tildeIndex < 0) return undefined;

  // Trailing annotations like "(Subtitled)" or "(W/ The Bawdy Caste)"
  // describe the showings, not the times — drop them before tokenizing.
  const segment = unescapeHtml(rawTitle.slice(tildeIndex + 1))
    .replace(/(\s*\([^)]*\))+\s*$/, "")
    .trim();

  const tokens = segment.split(/[,&]/).map((token) => parseTimeToken(token));
  if (tokens.length < 2 || tokens.some((time) => time === undefined)) return undefined;
  return tokens as { hour: number; minute: number }[];
}

// The synopsis lives in `body`, a full Squarespace layout (video embed,
// text block, ticket buttons) — only the ".sqs-html-content" text block(s)
// hold prose, so pull just that out.
function extractDescription(bodyHtml: string | undefined): string | undefined {
  if (!bodyHtml) return undefined;
  const $ = cheerio.load(bodyHtml);
  const text = $(".sqs-html-content")
    .map((_, el) => $(el).text().trim())
    .get()
    .join("\n")
    .trim();
  return text.length > 0 ? text : undefined;
}

// Safety anchor: a real showtime list always leads with the showing that
// startDate describes. If the first listed time disagrees with startDate's
// wall clock, something is mistyped — trust the structured data over our
// text parsing, and warn so the scrape logs surface the inconsistency.
function anchoredShowtimes(raw: RawSquarespaceEvent): { hour: number; minute: number }[] | undefined {
  const showtimes = extractShowtimes(raw.title);
  if (showtimes === undefined) return undefined;

  const startWallClock = zonedIsoString(new Date(raw.startDate), LA_TIME_ZONE).slice(11, 16);
  const firstListed = `${String(showtimes[0].hour).padStart(2, "0")}:${String(showtimes[0].minute).padStart(2, "0")}`;
  if (firstListed !== startWallClock) {
    console.warn(
      `Squarespace event "${raw.title.trim()}" lists showtimes starting ${firstListed} but its startDate is ${startWallClock} — keeping the single structured event`,
    );
    return undefined;
  }
  return showtimes;
}

export function parseSquarespaceEvents(
  raw: RawSquarespaceEvent,
  theater: string,
  baseUrl: string,
): Event[] {
  const synopsis = extractDescription(raw.body);
  const title = extractTitle(raw.title);

  const showtimes = anchoredShowtimes(raw);
  if (showtimes !== undefined) {
    // One event per listed showing, all on startDate's LA calendar day. The
    // fragment makes each sourceUrl unique (the event store's merge key and
    // the wishlist's star key) while still opening the same event page —
    // the same convention the Roxie scraper uses. The structured endDate
    // spans first show to last, wrong for any one showing, so it's dropped.
    const [year, month, day] = zonedIsoString(new Date(raw.startDate), LA_TIME_ZONE)
      .slice(0, 10)
      .split("-")
      .map(Number);

    return showtimes.map(({ hour, minute }) => {
      const startInstant = zonedTimeToUtc(year, month, day, hour, minute, LA_TIME_ZONE);
      const hhmm = `${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}`;
      const yyyymmdd = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;

      return {
        theater,
        title,
        startTime: zonedIsoString(startInstant, LA_TIME_ZONE),
        sourceUrl: `${baseUrl}${raw.fullUrl}#showtimes-${yyyymmdd}-${hhmm}`,
        ...(synopsis !== undefined && { synopsis }),
      };
    });
  }

  return [
    {
      theater,
      title,
      startTime: zonedIsoString(new Date(raw.startDate), LA_TIME_ZONE),
      ...(raw.endDate !== undefined && { endTime: zonedIsoString(new Date(raw.endDate), LA_TIME_ZONE) }),
      sourceUrl: `${baseUrl}${raw.fullUrl}`,
      ...(synopsis !== undefined && { synopsis }),
    },
  ];
}

export async function fetchSquarespaceEvents(
  baseUrl: string,
  theater: string,
  fetchFn: (url: string) => Promise<Response> = fetch,
): Promise<Event[]> {
  const events: Event[] = [];
  let url: string | undefined = `${baseUrl}/calendar-of-events?format=json`;

  while (url) {
    const response = await fetchFn(url);
    const page: SquarespaceCalendarPage = await response.json();

    for (const raw of page.upcoming) {
      events.push(...parseSquarespaceEvents(raw, theater, baseUrl));
    }

    const nextPageUrl = page.pagination?.nextPageUrl;
    url = nextPageUrl ? `${baseUrl}${nextPageUrl}&format=json` : undefined;
  }

  return events;
}
