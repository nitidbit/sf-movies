# 2. SceneF verifies our showtimes; it does not supply them

Date: 2026-08-27

## Status

Accepted

## Context

SceneF publishes an SF-only showtime feed covering all six of our theaters,
verified against each venue twice daily and free to call. It is markedly good
data. In particular it carries the Balboa's showings as separate screenings
with correct times — the exact thing our Cinema SF scraper has to recover by
parsing times out of an event title.

The obvious move is to drop that parsing and take SceneF's feed as the source
for those theaters. We considered it seriously and rejected it.

The Alamo is already sourced from SceneF, because Alamo's own site is a
Cloudflare-protected single-page app with no public feed to read.

## Decision

Keep scraping each theater's own site as the source of showtimes. Use SceneF
only to verify what we scraped, via the comparison and the status page.

The Alamo remains the exception, and stays labelled as one: comparing the
Alamo against SceneF is comparing SceneF to itself, so it is excluded from the
status page entirely.

Reasons for rejecting SceneF as a source:

- **Identity.** Its ticket links are opaque redirects (`scenef.com/go/<id>`).
  Adopting them would replace links to the theater's own page, and — because
  `sourceUrl` is also the wish-list key (see ADR 1) — would tie every saved
  star to an identifier we do not control and cannot reason about.
- **Synopses.** Its film descriptions come from TMDB and describe the film.
  The venues' own prose describes the *screening*: the series it belongs to,
  the guest in attendance, the print being shown. That is the interesting text
  and SceneF does not carry it.
- **Editorial inconsistency.** For hybrid evenings (doors, live music, then a
  film) SceneF sometimes publishes the music time and sometimes the film time.
  The venue's own structured start time is at least consistently the start.
- **Dependence.** It would make a second theater's listings contingent on a
  third party's continued goodwill and uptime.

## Consequences

We keep the cost of parsing each theater's idiosyncratic listings, including
the multi-showtime titles, and we keep the bugs that come with it. The status
page exists precisely because we accepted that cost — it is how those bugs
get found.

We keep theater-page links, venue prose, and stable star keys.

SceneF's terms require the "Showtimes via SceneF.com" attribution wherever its
data appears; this is carried on Alamo events and displayed on the status page.

If SceneF disappears, we lose verification and the Alamo's listings. The
showtimes for the other five theaters are unaffected — which is the main thing
this decision buys.
