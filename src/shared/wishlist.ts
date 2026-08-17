const STORAGE_KEY = "sf-movies:wishlist";

// Parses the raw localStorage value into a list of wishlisted sourceUrls.
// Missing, malformed, or unexpected-shape data all fall back to an empty
// list rather than throwing — a corrupted saved value should never break
// the page.
export function parseWishlist(raw: string | null): string[] {
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is string => typeof item === "string");
}

export function serializeWishlist(ids: string[]): string {
  return JSON.stringify(ids);
}

export function loadWishlist(): string[] {
  return parseWishlist(localStorage.getItem(STORAGE_KEY));
}

export function saveWishlist(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, serializeWishlist(ids));
}
