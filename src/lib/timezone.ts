// Converts a wall-clock date/time in a named timezone into the correct UTC
// instant, without a date library. Roxie's calendar only gives us local PT
// times as plain text ("7:10 pm"), so this is what turns that into an
// unambiguous, DST-correct timestamp.
export function zonedTimeToUtc(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	timeZone: string,
): Date {
	const anchor = Date.UTC(year, month - 1, day, hour, minute);

	const offsetFormatter = new Intl.DateTimeFormat("en-US", {
		timeZone,
		timeZoneName: "longOffset",
	});
	const offsetName = offsetFormatter
		.formatToParts(anchor)
		.find((part) => part.type === "timeZoneName")?.value;

	const match = offsetName?.match(/^GMT([+-])(\d{2}):(\d{2})$/);
	if (!match) {
		throw new Error(`Could not determine UTC offset for ${timeZone} at ${offsetName}`);
	}

	const sign = match[1] === "-" ? -1 : 1;
	const offsetMinutes = sign * (Number(match[2]) * 60 + Number(match[3]));

	return new Date(anchor - offsetMinutes * 60_000);
}
