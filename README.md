# sf-movies.nitid.co

  For now, located at https://nitidbit.github.io/sf-movies/

## Prior Art
- [spiralhwy.github.io/web](https://spiralhwy.github.io/web/)


## Architecture as of Aug 2026
sf-movies is a static Astro site (~2,500 lines) that lists showtimes from six San Francisco indie theaters. It has no server and no database. Two halves:

(1) Scrape side (Node, runs in Github Actions). src/shared/theaters.ts is a config map of six theaters, each naming a source — one of four scrapers in src/shared/scrapers/ (squarespace, roxie, scenef, tribeEvents). src/scripts/scrape-theater.ts takes a slug, dispatches on source via a switch, and hands the results to src/shared/events/persist.ts, which groups them by LA month and merges into movie-data/<year>/<theater>/<month>.json keyed on sourceUrl (eventStore.ts). Six near-identical GitHub Actions workflows run one theater each, daily, and commit the JSON back to the repo.

(2) Site side (build time). src/shared/events/loadEvents.ts flattens all 624 JSON records into one sorted list. src/pages/index.astro drops past showings, clusters the rest into day groups, and renders every showing twice — once in a "Browsing" pane, once hidden in a "Wish List" pane — as MovieCard.astro <li> elements carrying data-title / data-date / data-theater / data-source-url.

Browser. Two small inline scripts, no framework. index.astro's script builds a sourceUrl → elements map so starring a card updates both copies and persists to localStorage (wishlist.ts). FilterBar.astro's script holds the filter state and hides non-matching cards by walking the DOM and reading those data attributes.

Shared throughout: timezone.ts (hand-rolled, no date library) keeps everything in America/Los_Angeles — Event.startTime is stored as an ISO instant with an explicit PT offset so the JSON stays readable against a theater's own listing.

Testing is vitest, pure-Node, no DOM environment. Coverage is good on the scrapers and the date logic, and absent on everything the browser actually runs.

### Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `./dev-start.sh`          | Run the dev server                               |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `astro dev --background`  | Dev server in background mode                    |

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Developer Setup

* npm i
* npm test
* ./dev-start.sh


## Astro Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Astro Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
  public/
  src/
      pages/
        index.astro
  package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
