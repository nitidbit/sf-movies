import type { Event } from "./event";

export function mergeEvents(existing: Event[], incoming: Event[]): Event[] {
  const incomingUrls = new Set(incoming.map((event) => event.sourceUrl));
  const unrelated = existing.filter((event) => !incomingUrls.has(event.sourceUrl));
  return [...unrelated, ...incoming];
}
