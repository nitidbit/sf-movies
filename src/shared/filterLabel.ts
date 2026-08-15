const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

// Parses a plain "YYYY-MM-DD" calendar-day string at UTC noon, so the
// browser's local timezone can't reinterpret it onto the wrong day.
function formatDay(date: string): string {
  return monthDayFormatter.format(new Date(`${date}T12:00:00Z`));
}

export function titleFilterLabel(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" ? "title" : `title: ${trimmed}`;
}

export function dayFilterLabel(from: string, to: string): string {
  if (from === "") return "day";
  if (from === to) return `day: ${formatDay(from)}`;
  return `day: ${formatDay(from)}–${formatDay(to)}`;
}
