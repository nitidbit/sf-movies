import * as cheerio from "cheerio";
import type { Event } from "../events/event";
import { zonedIsoString, zonedTimeToUtc } from "../timezone";

const LA_TIME_ZONE = "America/Los_Angeles";
const DATE_URL_PATTERN = /\/(\d{4})(\d{2})(\d{2})\.html$/;
const MUSIC_TIME_PATTERN = /music at (\d{1,2}):(\d{2})\s*(am|pm)/i;

function to24Hour(hour12: number, minute: number, meridiem: string): { hour: number; minute: number } {
  const hour = (hour12 % 12) + (meridiem.toLowerCase() === "pm" ? 12 : 0);
  return { hour, minute };
}

// Parses a single show detail page (e.g. bottomofthehill.com/20260909.html).
// Date is extracted from the URL; bands come from <h4> tags; music start time
// from the "music at X:XXpm" line in the page text.
export function parseBottomOfTheHillDetail(html: string, url: string, theater: string): Event | null {
  const dateMatch = url.match(DATE_URL_PATTERN);
  if (!dateMatch) return null;
  const [, yearStr, monthStr, dayStr] = dateMatch;

  const $ = cheerio.load(html);

  let musicHour = 20;
  let musicMinute = 30;
  $("p").each((_, el) => {
    const match = $(el).text().match(MUSIC_TIME_PATTERN);
    if (match) {
      ({ hour: musicHour, minute: musicMinute } = to24Hour(
        Number(match[1]),
        Number(match[2]),
        match[3],
      ));
      return false;
    }
  });

  const bands: string[] = [];
  $("h4").each((_, el) => {
    const name = $(el).text().trim();
    if (name) bands.push(name);
  });
  if (bands.length === 0) return null;

  const startTime = zonedTimeToUtc(
    Number(yearStr),
    Number(monthStr),
    Number(dayStr),
    musicHour,
    musicMinute,
    LA_TIME_ZONE,
  );

  return {
    theater,
    title: bands[0],
    startTime: zonedIsoString(startTime, LA_TIME_ZONE),
    sourceUrl: url,
    ...(bands.length > 1 && { synopsis: `with ${bands.slice(1).join(", ")}` }),
  };
}

export async function fetchBottomOfTheHillEvents(
  baseUrl: string,
  theater: string,
  fetchFn: (url: string) => Promise<Response> = fetch,
): Promise<Event[]> {
  const calendarResponse = await fetchFn(`${baseUrl}/calendar.html`);
  const calendarHtml = await calendarResponse.text();
  const $ = cheerio.load(calendarHtml);

  const detailUrls = new Set<string>();
  $("a").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const url = href.startsWith("http") ? href : `${baseUrl}${href}`;
    if (DATE_URL_PATTERN.test(url)) {
      detailUrls.add(url);
    }
  });

  const results = await Promise.all(
    [...detailUrls].map(async (url) => {
      const response = await fetchFn(url);
      const html = await response.text();
      return parseBottomOfTheHillDetail(html, url, theater);
    }),
  );

  return results.filter((e): e is Event => e !== null);
}
