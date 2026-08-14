import { describe, expect, it } from "vitest";
import { findByDay, findByTitle } from "./query";
import { sampleEvents } from "./sampleEvents";

describe("findByTitle", () => {
	it("matches an exact title", () => {
		expect(findByTitle(sampleEvents, "The Handmaiden")).toEqual([sampleEvents[2]]);
	});

	it("matches case-insensitively and by partial title, across theaters, sorted chronologically", () => {
		expect(findByTitle(sampleEvents, "your name")).toEqual([
			sampleEvents[0],
			sampleEvents[1],
			sampleEvents[3],
		]);
	});

	it("returns an empty list when nothing matches", () => {
		expect(findByTitle(sampleEvents, "Nonexistent Movie")).toEqual([]);
	});
});

describe("findByDay", () => {
	it("finds a day with multiple theaters showing different movies", () => {
		// 2026-08-15 in America/Los_Angeles: Vogue's "Your Name." (5pm) and
		// 4-Star's "My Sassy Girl" (7:30pm) — both stored as UTC timestamps
		// that fall on 2026-08-16 in UTC.
		expect(findByDay(sampleEvents, "2026-08-15")).toEqual([sampleEvents[3], sampleEvents[4]]);
	});

	it("returns an empty list for a day with no events", () => {
		expect(findByDay(sampleEvents, "2026-08-16")).toEqual([]);
	});

	it("finds a day where one theater has multiple showtimes, sorted chronologically", () => {
		// 2026-08-14 in America/Los_Angeles: Balboa's two "Your Name." showings
		// plus Vogue's "The Handmaiden".
		expect(findByDay(sampleEvents, "2026-08-14")).toEqual([
			sampleEvents[0],
			sampleEvents[1],
			sampleEvents[2],
		]);
	});
});
