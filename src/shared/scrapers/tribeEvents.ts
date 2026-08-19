import * as cheerio from "cheerio";
import type { Event } from "../events/event";
import { zonedIsoString, zonedTimeToUtc } from "../timezone";

interface TribeEventsPage {
  events: RawTribeEvent[];
  next_rest_url?: string;
}

interface RawTribeEvent {
  title: string;
  start_date: string;
  end_date?: string;
  timezone: string;
  url: string;
  description?: string;
}

const WALL_CLOCK_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

function toIsoString(dateString: string, timeZone: string): string {
  const match = dateString.match(WALL_CLOCK_PATTERN);
  if (!match) {
    throw new Error(`Unrecognized tribe events date: ${dateString}`);
  }
  const [, year, month, day, hour, minute] = match;
  const utc = zonedTimeToUtc(Number(year), Number(month), Number(day), Number(hour), Number(minute), timeZone);
  return zonedIsoString(utc, timeZone);
}

function htmlToText(html: string): string {
  return cheerio.load(html).text().trim();
}

export function parseTribeEvent(raw: RawTribeEvent, theater: string): Event {
  return {
    theater,
    title: raw.title,
    startTime: toIsoString(raw.start_date, raw.timezone),
    ...(raw.end_date !== undefined && { endTime: toIsoString(raw.end_date, raw.timezone) }),
    sourceUrl: raw.url,
    ...(raw.description !== undefined && { notes: htmlToText(raw.description) }),
  };
}

export async function fetchTribeEvents(
  baseUrl: string,
  theater: string,
  fetchFn: (url: string) => Promise<Response> = fetch,
): Promise<Event[]> {
  const events: Event[] = [];
  let url: string | undefined = `${baseUrl}/wp-json/tribe/events/v1/events?per_page=50`;

  while (url) {
    const response = await fetchFn(url);
    const page: TribeEventsPage = await response.json();

    for (const raw of page.events) {
      events.push(parseTribeEvent(raw, theater));
    }

    url = page.next_rest_url;
  }

  return events;
}
