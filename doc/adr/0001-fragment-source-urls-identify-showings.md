# 1. A showing is identified by its source URL, with a time fragment when needed

Date: 2026-08-27

## Status

Accepted

## Context

`sourceUrl` is the identity of a showing. The event store merges on it, and
the browser's wish list stars on it. Nothing else in the system serves as a
key.

Two theaters give us no per-showtime URL of their own:

- The Roxie links every showing of a film to the same film page.
- The Cinema SF venues (Balboa, Vogue, 4-Star) publish a whole day's showings
  as one calendar entry, listing the individual times only in the entry's
  title. One URL, several showings.

Without a distinct URL per showing, the store would merge a day's showings
into one record and the wish list could not tell them apart.

## Decision

Where a theater has no per-showtime URL, append a fragment naming the showing's
local date and time: `#showtimes-YYYYMMDD-HHMM`.

The fragment makes the URL unique for the store and the wish list while the
link still opens the right page at the theater. The Roxie scraper established
this; the Cinema SF scraper follows it when it splits a multi-showtime title.

Showings that already have their own URL are left alone — no fragment is
invented where the theater supplies real identity.

## Consequences

Each showing is independently storable and independently starrable, which is
the behavior we want: a moviegoer stars the 7:30 screening, not the film.

Identity is now derived from the showtime itself, so a rescheduled showing is
a *different* showing as far as the system is concerned. Two costs follow.
The store never prunes, so the old record survives until its date passes and
the site stops rendering it. And a wish-list star silently orphans — the user
keeps a star on a screening that no longer exists, and gains none on its
replacement. Neither is currently handled.

The fragment format is now duplicated across two scrapers. If a third needs
it, extract it rather than copying it a second time.
