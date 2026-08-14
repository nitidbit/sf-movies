import { describe, expect, it, vi } from "vitest";
import { fetchSquarespaceEvents, parseSquarespaceEvent } from "./squarespace";

describe("parseSquarespaceEvent", () => {
	it("normalizes a plain showtime with no extra notes", () => {
		const raw = {
			title: "The Handmaiden ~ 7:30 PM",
			startDate: 1786764600529,
			endDate: 1786774200529,
			fullUrl: "/calendar-of-events/the-handmaiden-august-13",
		};

		expect(parseSquarespaceEvent(raw, "Balboa", "https://www.balboamovies.com")).toEqual({
			theater: "Balboa",
			title: "The Handmaiden",
			startTime: new Date(1786764600529).toISOString(),
			endTime: new Date(1786774200529).toISOString(),
			sourceUrl: "https://www.balboamovies.com/calendar-of-events/the-handmaiden-august-13",
		});
	});

	it("keeps a parenthetical note after the showtime", () => {
		const raw = {
			title: "The Odyssey ~ 7 PM  (Final Show)",
			startDate: 1786672800164,
			endDate: 1786684200164,
			fullUrl: "/calendar-of-events/the-odyssey-august-13",
		};

		expect(parseSquarespaceEvent(raw, "Balboa", "https://www.balboamovies.com").notes).toBe(
			"(Final Show)",
		);
	});

	it("drops multiple showtimes and keeps only the trailing note", () => {
		const raw = {
			title: "Your Name. 10th Anniversary ~ 4:30 PM &amp; 7 PM (Subtitled)",
			startDate: 1786764600771,
			endDate: 1786780500771,
			fullUrl: "/calendar-of-events/your-name-10th-anniversary-august-14",
		};

		const parsed = parseSquarespaceEvent(raw, "Vogue", "https://voguemovies.com");
		expect(parsed.title).toBe("Your Name. 10th Anniversary");
		expect(parsed.notes).toBe("(Subtitled)");
	});

	it("has no notes when the showtime has nothing else attached", () => {
		const raw = {
			title: "Slacker ~ 7:30 PM",
			startDate: 1786765800945,
			endDate: 1786772700945,
			fullUrl: "/calendar-of-events/slacker-august-14",
		};

		expect(parseSquarespaceEvent(raw, "Balboa", "https://www.balboamovies.com").notes).toBeUndefined();
	});
});

describe("fetchSquarespaceEvents", () => {
	it("follows pagination and normalizes every page's events", async () => {
		const page1 = {
			upcoming: [
				{
					title: "The Odyssey ~ 7 PM  (Final Show)",
					startDate: 1786672800164,
					endDate: 1786684200164,
					fullUrl: "/calendar-of-events/the-odyssey-august-13",
				},
			],
			pagination: { nextPageUrl: "/calendar-of-events?offset=111" },
		};
		const page2 = {
			upcoming: [
				{
					title: "Slacker ~ 7:30 PM",
					startDate: 1786765800945,
					endDate: 1786772700945,
					fullUrl: "/calendar-of-events/slacker-august-14",
				},
			],
			pagination: {},
		};

		const fetchFn = vi.fn(async (url: string) => {
			const body = url.includes("offset=111") ? page2 : page1;
			return { json: async () => body } as Response;
		});

		const events = await fetchSquarespaceEvents("https://www.balboamovies.com", "Balboa", fetchFn);

		expect(fetchFn).toHaveBeenCalledTimes(2);
		expect(events).toEqual([
			parseSquarespaceEvent(page1.upcoming[0], "Balboa", "https://www.balboamovies.com"),
			parseSquarespaceEvent(page2.upcoming[0], "Balboa", "https://www.balboamovies.com"),
		]);
	});
});
