function partGetter(formatter: Intl.DateTimeFormat, date: Date): (type: Intl.DateTimeFormatPartTypes) => string {
  const parts = formatter.formatToParts(date);
  return (type) => parts.find((part) => part.type === type)?.value ?? "";
}

// Return e.g. "Sat, Aug 15, 2026"
export function preferredDateFmt(formatter: Intl.DateTimeFormat, date: Date): string {
  const get = partGetter(formatter, date);
  return `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")}`;
}

// Return e.g. "9:30pm, Sat Aug 15"
export function preferredDateTimeFmt(formatter: Intl.DateTimeFormat, date: Date): string {
  const get = partGetter(formatter, date);
  return `${get("hour")}:${get("minute")}${get("dayPeriod").toLowerCase()}, ${get("weekday")} ${get("month")} ${get("day")}`;
}
