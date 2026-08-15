function partGetter(formatter: Intl.DateTimeFormat, date: Date): (type: Intl.DateTimeFormatPartTypes) => string {
  const parts = formatter.formatToParts(date);
  return (type) => parts.find((part) => part.type === type)?.value ?? "";
}

export function preferredDateFmt(formatter: Intl.DateTimeFormat, date: Date): string {
  const get = partGetter(formatter, date);
  return `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")}`;
}

export function preferredDateTimeFmt(formatter: Intl.DateTimeFormat, date: Date): string {
  const get = partGetter(formatter, date);
  return `${get("weekday")}, ${get("month")} ${get("day")}, ${get("hour")}:${get("minute")} ${get("dayPeriod").toLowerCase()}`;
}
