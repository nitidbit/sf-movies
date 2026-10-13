// The Wish List a group of friends shares at /list/<id>. The server holds it;
// the browser keeps only the visitor's handle (their initials).

export interface ListComment {
  id: number;
  handle: string;
  body: string;
}

export interface ListShowing {
  sourceUrl: string;
  title: string;
  startTime: string;
  theater: string;
  stars: string[];
  comments: ListComment[];
}

// What the server sends after every change: the list, and the handles of
// everyone who has it open.
export interface ListMessage {
  showings: ListShowing[];
  watching: string[];
}

const HANDLE_KEY = "sf-movies:handle";
const ID_CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function listIdFromPath(path: string): string | null {
  return path.match(/^\/list\/([^/]+)/)?.[1] ?? null;
}

// Long and random, because the link is the only thing keeping a list private.
export function newListId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (byte) => ID_CHARACTERS[byte % ID_CHARACTERS.length]).join("");
}

// The server cleans handles, so the page stores the handle as the server
// will use it.
export async function cleanHandle(typed: string): Promise<string> {
  const response = await fetch(`/api/handle?typed=${encodeURIComponent(typed)}`);
  return (await response.json()).handle;
}

export function loadHandle(): string | null {
  return localStorage.getItem(HANDLE_KEY);
}

export function saveHandle(handle: string): void {
  localStorage.setItem(HANDLE_KEY, handle);
}

export function othersWatching(watching: string[], handle: string | null): string[] {
  return watching.filter((other) => other !== handle);
}

// Sends one change to the server and returns the whole list after it.
export async function sendChange(
  listId: string,
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body: object,
): Promise<ListMessage> {
  const response = await fetch(`/api/lists/${listId}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}
