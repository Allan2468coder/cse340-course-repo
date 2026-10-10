# Open Gallery

Open Gallery is a responsive art discovery experience that searches the Art Institute of Chicago (AIC) and The Metropolitan Museum of Art (The Met) from one page. It turns both APIs into a shared artwork format and preserves a direct link to each museum's collection record.

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; preview it with `npm run preview`. The app uses Vite and requires no API key or server-side secrets.

## Week 5 work

- Search either collection or both with suggested subject queries.
- Normalize results to one artwork shape: `id`, `museum`, `title`, `artist`, `date`, `medium`, `image`, `record`, `publicDomain`, and `department`.
- Display artwork cards with the museum record link, image fallback, title, artist, date, and collection label.
- Show searching, no-result, collection failure, and partial-failure states with an accessible live status.
- Sort the loaded set by title or artist and request another page of results.
- Support small screens, keyboard focus, reduced motion, and semantic labels.

## Data sources

- AIC Artworks API: <https://api.artic.edu/docs/>. The app requests only the fields it displays and builds image URLs from the API's IIIF configuration.
- The Met Collection API: <https://metmuseum.github.io/>. Search uses the paginated `/public/collection/v1.1/search` endpoint and fetches individual object records with a concurrency limit of five.

The APIs are public and can be temporarily unavailable or rate limited. The UI reports full and partial failures and keeps museum attribution attached to each result. The browser needs network access to the museums' API and image hosts.

## Project structure

- `index.html` — page structure, search controls, navigation, and content sections.
- `src/artworks.js` — API calls and source-specific normalization.
- `src/main.js` — search state, accessible status messages, sorting, paging, and card rendering.
- `src/styles.css` — responsive visual system and reduced-motion support.
- `docs/development-report.md` — Week 5 work report, skill reflection, and evidence map.
- `docs/trello-progress.md` — Week 5 board review and progress record.

## Scope

This implementation completes the proposal's Week 5 search and results work. Artwork detail pages and saved favorites belong to the proposal's Week 6 work; accessibility refinement and deployment/demo belong to Week 7.
