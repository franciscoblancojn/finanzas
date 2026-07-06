## Development

When starting the dev server, use background mode:

```
npx astro dev --background
```

Manage the background server with `npx astro dev stop`, `npx astro dev status`, and `npx astro dev logs`.

## Build

The project builds to a single self-contained HTML file:

```
npm run build
```

Output: `dist/index.html` — a single HTML file with CSS and JavaScript inlined.
This file can be opened directly in any browser without a server.

## APK (Android)

Build the HTML and package it into a small APK:

```
npm run build:apk
```

Output: `dist/finanzas.apk` — a standalone Android app that loads the HTML in a WebView.
Requirements: Java 17+ (JDK) and curl installed. The script downloads the Android SDK
and Gradle wrapper automatically on first run.

## Architecture

- `src/scripts/` — Client-side JavaScript modules
- `src/scripts/components/` — UI components (Balance, ExpenseForm, Analytics, Settings, etc.)
- `src/styles/` — CSS styles
- `src/layouts/` — Astro layouts
- `src/pages/` — Astro pages (single page app)
- `scripts/` — Build tooling (post-build inlining)

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
