# LinkNest

Your personal space for saved links.

LinkNest is a lightweight, bilingual (English/Arabic) personal bookmark manager built with HTML, CSS, and vanilla JavaScript. It runs entirely in the browser and stores data in LocalStorage. Optional link metadata extraction is provided by a Cloudflare Pages Function.

## Features

- Add, edit, and delete bookmarks
- Favorites
- Categories (create, rename, delete; bookmarks move to Uncategorized)
- Search and filters
- Light/dark theme
- English and Arabic with RTL/LTR support
- Desktop sidebar collapse and mobile drawer
- Automatic title/description fetching via Cloudflare Pages Function

## Project structure

```
index.html
css/style.css
js/app.js
js/i18n.js
assets/favicon.svg
functions/api/link-preview.js
```

## Run locally

Serve the static files with any static server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Note: the static server does not run Cloudflare Pages Functions, so `/api/link-preview` returns 404 locally. Bookmark CRUD still works.

## Test the Link Preview endpoint locally

Use Wrangler:

```bash
npx wrangler pages dev .
```

Then open the provided local URL and use the "Fetch details" button, or call:

```
GET /api/link-preview?url=https://example.com
```

## Deploy to Cloudflare Pages

1. Push the repository to GitHub.
2. Create a Cloudflare Pages project connected to the repository.
3. Build command: none (static site).
4. Build output directory: `/` (root).
5. Cloudflare Pages automatically detects `functions/api/link-preview.js` and deploys it as a Pages Function.

No database or authentication is required.

## Security notes

- Bookmark URLs are validated and restricted to HTTP/HTTPS.
- External links open with `rel="noopener noreferrer"`.
- The preview endpoint rejects localhost, private/reserved IPs, internal hostnames, credentials, and unsafe redirects.
- Response size and request timeout are limited.

## Data storage

Bookmarks and categories are stored in the browser's LocalStorage under `linknest-data`. Theme and language preferences are stored separately.

## License

MIT
```
