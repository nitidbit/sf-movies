import * as cheerio from "cheerio";
import type { Event } from "../events/event";
import { zonedIsoString } from "../timezone";

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
// the real title; the time(s) and any parenthetical duplicate startDate/endDate
// and the body's own synopsis, so they're discarded here.
function extractTitle(rawTitle: string): string {
  const [titlePart] = rawTitle.split("~");
  return unescapeHtml(titlePart).trim();
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

export function parseSquarespaceEvent(
  raw: RawSquarespaceEvent,
  theater: string,
  baseUrl: string,
): Event {
  const notes = extractDescription(raw.body);

  return {
    theater,
    title: extractTitle(raw.title),
    startTime: zonedIsoString(new Date(raw.startDate), LA_TIME_ZONE),
    ...(raw.endDate !== undefined && { endTime: zonedIsoString(new Date(raw.endDate), LA_TIME_ZONE) }),
    sourceUrl: `${baseUrl}${raw.fullUrl}`,
    ...(notes !== undefined && { notes }),
  };
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
      events.push(parseSquarespaceEvent(raw, theater, baseUrl));
    }

    const nextPageUrl = page.pagination?.nextPageUrl;
    url = nextPageUrl ? `${baseUrl}${nextPageUrl}&format=json` : undefined;
  }

  return events;
}
