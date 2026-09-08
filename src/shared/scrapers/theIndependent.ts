import * as cheerio from "cheerio";
import type { Event } from "../events/event";
import { zonedIsoString, zonedTimeToUtc } from "../timezone";

const LA_TIME_ZONE = "America/Los_Angeles";
// Date format on the listing: "9.8" = month 9, day 8. No year in source HTML.
const DATE_PATTERN = /^(\d{1,2})\.(\d{1,2})$/;
const TIME_PATTERN = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;

function to24Hour(hour12: number, minute: number, meridiem: string): { hour: number; minute: number } {
  const hour = (hour12 % 12) + (meridiem.toUpperCase() === "PM" ? 12 : 0);
  return { hour, minute };
}

// The listing omits the year. If month/day has already passed this calendar
// year, the show must be next year.
function inferYear(month: number, day: number): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return month < m || (month === m && day < d) ? y + 1 : y;
}

export function parseTheIndependentPage(html: string, baseUrl: string, theater: string): Event[] {
  const $ = cheerio.load(html);
  const events: Event[] = [];

  $(".tw-event-item").each((_, el) => {
    const dateText = $(el).find(".tw-event-date").text().trim();
    const dateMatch = dateText.match(DATE_PATTERN);
    if (!dateMatch) return;
    const month = Number(dateMatch[1]);
    const day = Number(dateMatch[2]);
    const year = inferYear(month, day);

    let hour = 20;
    let minute = 0;
    const timeMatch = $(el).find(".tw-event-time").text().trim().match(TIME_PATTERN);
    if (timeMatch) {
      ({ hour, minute } = to24Hour(Number(timeMatch[1]), Number(timeMatch[2]), timeMatch[3]));
    }

    const nameLink = $(el).find(".tw-name a").first();
    const title = nameLink.text().trim();
    const href = nameLink.attr("href") ?? "";
    if (!title || !href) return;
    const sourceUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;

    const attractions = $(el).find(".tw-attractions").text().trim();

    const startTime = zonedTimeToUtc(year, month, day, hour, minute, LA_TIME_ZONE);

    events.push({
      theater,
      title,
      startTime: zonedIsoString(startTime, LA_TIME_ZONE),
      sourceUrl,
      ...(attractions.length > 0 && { synopsis: attractions }),
    });
  });

  return events;
}

export async function fetchTheIndependentEvents(
  baseUrl: string,
  theater: string,
  fetchFn: (url: string) => Promise<Response> = fetch,
): Promise<Event[]> {
  const response = await fetchFn(`${baseUrl}/`);
  const html = await response.text();
  return parseTheIndependentPage(html, baseUrl, theater);
}
