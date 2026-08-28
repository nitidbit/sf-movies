Films with Friends
==================

* [Production website, for now]( https://nitidbit.github.io/sf-movies/ )
* [Stories in Linear]( https://linear.app/butud/project/films-with-friends-cbb71adbd6f8/issues )
* [Github]( https://github.com/nitidbit/sf-movies )


## Prior Art
- [spiralhwy.github.io/web](https://spiralhwy.github.io/web/)
- [Fandango](https://www.fandango.com)


Architecture Summary as of Aug 2026
-----------------------------------
sf-movies is a static Astro site (~2,500 lines) that lists showtimes from six San Francisco indie theaters. It has no server and no database. Two halves:

(1) Scrape side (Node, runs in Github Actions). src/shared/theaters.ts is a config map of six theaters, each naming a source — one of four scrapers in src/shared/scrapers/ (squarespace, roxie, scenef, tribeEvents). src/scripts/scrape-theater.ts takes a slug, dispatches on source via a switch, and hands the results to src/shared/events/persist.ts, which groups them by LA month and merges into movie-data/<year>/<theater>/<month>.json keyed on sourceUrl (eventStore.ts). Six near-identical GitHub Actions workflows run one theater each, daily, and commit the JSON back to the repo.

(2) Site side (build time). src/shared/events/loadEvents.ts flattens all 624 JSON records into one sorted list. src/pages/index.astro drops past showings, clusters the rest into day groups, and renders every showing twice — once in a "Browsing" pane, once hidden in a "Wish List" pane — as MovieCard.astro `<li>` elements carrying data-title / data-date / data-theater / data-source-url.

Browser. Two small inline scripts, no framework. index.astro's script builds a sourceUrl → elements map so starring a card updates both copies and persists to localStorage (wishlist.ts). FilterBar.astro's script holds the filter state and hides non-matching cards by walking the DOM and reading those data attributes.

Shared throughout: timezone.ts (hand-rolled, no date library) keeps everything in America/Los_Angeles — Event.startTime is stored as an ISO instant with an explicit PT offset so the JSON stays readable against a theater's own listing.

Testing is vitest, pure-Node, no DOM environment. Coverage is good on the scrapers and the date logic, and absent on everything the browser actually runs.

### Folder Structure

Where to put things?
```text
  public/              -- Any static assets, like images
  src/
    pages/             -- Astro looks for `.astro` or `.md` files in
                          `src/pages/`. Each page is exposed as a route based on
                          its file name.
      index.astro
    components/        -- There's nothing special about `src/components/`, but
                          that's where we like to put any
                          Astro/React/Vue/Svelte/Preact components.
  package.json
```

Developer Setup
---------------

* npm i
* npm test
* ./dev-start.sh

### Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `./dev-start.sh`          | Run the dev server                               |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `astro dev --background`  | Dev server in background mode                    |

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.


### AI Workflow

* Write the story with requirements you can think of.
* `/write-a-prd`
* `/prd-to-issues`
* `/review-architecture` — Review code with "Characteristics of Good Code" in
