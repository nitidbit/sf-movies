import * as cheerio from "cheerio";
import type { Event } from "../events/event";
import { zonedIsoString, zonedTimeToUtc } from "../timezone";

const LA_TIME_ZONE = "America/Los_Angeles";
const DAY_ID_PATTERN = /^day-(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /(\d{1,2}):(\d{2})\s*(am|pm)/i;

function to24Hour(hour12: number, minute: number, meridiem: string): { hour: number; minute: number } {
  let hour = hour12 % 12;
  if (meridiem.toLowerCase() === "pm") hour += 12;
  return { hour, minute };
}

// Roxie has no per-showtime URL — every showing of a film links to the same
// film page. We disambiguate by appending the date+time to the fragment, so
// each showing still gets a unique sourceUrl for the event store's merge
// key, while the link itself still opens the right film page.
function sourceUrlFor(filmUrl: string, year: string, month: string, day: string, hour: number, minute: number): string {
  const time = `${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}`;
  return `${filmUrl}#showtimes-${year}${month}${day}-${time}`;
}

export function parseRoxieCalendar(html: string, theater: string): Event[] {
  const $ = cheerio.load(html);
  const events: Event[] = [];

  $(".calendar-block__day").each((_, dayEl) => {
    const dayMatch = ($(dayEl).attr("id") ?? "").match(DAY_ID_PATTERN);
    if (!dayMatch) return;
    const [, year, month, day] = dayMatch;

    $(dayEl)
      .find(".film-strip")
      .each((_, filmEl) => {
        const titleLink = $(filmEl).find(".film-strip__title a").first();
        const title = titleLink.text().trim();
        const filmUrl = titleLink.attr("href") ?? "";

        $(filmEl)
          .find(".film-strip__showtimes p a")
          .each((_, timeEl) => {
            const timeMatch = $(timeEl).text().trim().match(TIME_PATTERN);
            if (!timeMatch) return;
            const { hour, minute } = to24Hour(
              Number(timeMatch[1]),
              Number(timeMatch[2]),
              timeMatch[3],
            );

            const startTime = zonedTimeToUtc(
              Number(year),
              Number(month),
              Number(day),
              hour,
              minute,
              LA_TIME_ZONE,
            );

            events.push({
              theater,
              title,
              startTime: zonedIsoString(startTime, LA_TIME_ZONE),
              sourceUrl: sourceUrlFor(filmUrl, year, month, day, hour, minute),
            });
          });
      });
  });

  return events;
}

export async function fetchRoxieEvents(
  baseUrl: string,
  theater: string,
  fetchFn: (url: string) => Promise<Response> = fetch,
): Promise<Event[]> {
  const response = await fetchFn(`${baseUrl}/calendar/`);
  const html = await response.text();
  return parseRoxieCalendar(html, theater);
}
