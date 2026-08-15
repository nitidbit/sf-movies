import type { Event } from "../events/event";

interface RawSquarespaceEvent {
  title: string;
  startDate: number;
  endDate?: number;
  fullUrl: string;
}

interface SquarespaceCalendarPage {
  upcoming: RawSquarespaceEvent[];
  pagination?: {
    nextPageUrl?: string;
  };
}

// Titles look like "Movie Name ~ 7 PM (Final Show)" or
// "Movie ~ 4:30 PM & 7 PM (Subtitled)" — the time(s) duplicate startDate/endDate,
// so only whatever's left after stripping every time mention is a real "note".
const TIME_TOKEN = /\b(doors|show)\s+at\s+\d{1,2}(:\d{2})?\s*(am|pm)\b|\b\d{1,2}(:\d{2})?\s*(am|pm)\b/gi;
const DANGLING_JOINERS = /^[\s,&/-]+|[\s,&/-]+$/g;

function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function splitTitleAndNotes(rawTitle: string): { title: string; notes?: string } {
  const [titlePart, ...rest] = rawTitle.split("~");
  const remainder = unescapeHtml(rest.join("~")).trim();
  const notes = remainder.replace(TIME_TOKEN, "").replace(DANGLING_JOINERS, "").trim();

  return {
    title: unescapeHtml(titlePart).trim(),
    notes: notes.length > 0 ? notes : undefined,
  };
}

export function parseSquarespaceEvent(
  raw: RawSquarespaceEvent,
  theater: string,
  baseUrl: string,
): Event {
  const { title, notes } = splitTitleAndNotes(raw.title);

  return {
    theater,
    title,
    startTime: new Date(raw.startDate).toISOString(),
    ...(raw.endDate !== undefined && { endTime: new Date(raw.endDate).toISOString() }),
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
