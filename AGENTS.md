# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

**DevTools Suite** - a modular Next.js 14 (App Router) application bundling ~27 internal
developer utilities behind one UI: JSON formatters/differs, encoders/decoders, JWT decoder,
Saudi fake-data generator, Liquibase checksum, timezone/case/color converters, etc.

- All tools are client-side (`'use client'` pages); no backend besides health routes.
- Dark mode throughout via `next-themes` + Tailwind `darkMode: 'class'`.
- Deployed to Vercel and via Docker (`output: 'standalone'` in `next.config.js`).

## Tech Stack

| Area      | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Framework | Next.js 14 App Router, React 18, TypeScript (strict)          |
| Styling   | TailwindCSS 3, neutral/zinc palette, `dark:` variants         |
| Icons     | `lucide-react` (primary), `@heroicons/react` (legacy)         |
| Feedback  | `react-hot-toast`                                             |
| Utilities | `crypto-js`, `pako`, `diff-match-patch`, `js-yaml`, `jsoneditor` |
| Testing   | Jest 29 + React Testing Library, `jest-environment-jsdom`     |
| CI        | GitHub Actions (`ci.yml`) + SonarCloud                        |

## Commands

```bash
npm install            # install deps
npm run dev            # dev server on :3000
npm run build          # production build (ESLint is skipped during build)
npm run lint           # ESLint - run this separately; CI runs it
npm test               # Jest once
npm run test:coverage  # Jest with coverage (what CI runs)
```

- Node: `.nvmrc`, CI and the Dockerfile all pin **22**. Keep them in step.
- CI (`ci.yml`) runs on push/PR to `main`, `master`, `v2` - current branch is `v2`.
- Lint failures do NOT fail `next build` (eslint `ignoreDuringBuilds: true`), but they do fail CI.

## Project Structure

```
app/                    # One directory per tool route, each with page.tsx
  api/health/route.ts   # Health endpoint (also app/health/route.ts)
  layout.tsx            # Root layout (Inter font, Providers)
  providers.tsx         # ThemeProvider + SidebarProvider + Toaster
  page.tsx              # Home dashboard - TOOLS array lists every tool
components/             # Shared UI: Sidebar, PageHeader, SidebarContext,
                        # ThemeToggle, JsonEditorComponent, InteractiveJson, ...
lib/                    # All tool logic (pure, unit-testable functions)
__tests__/              # Flat test dir: <name>.test.ts (logic) + <name>Page.test.tsx (page)
public/                 # Static assets (favicons, etc.)
```

## Conventions

- **Path alias**: `@/*` → repo root. Pages import `@/components/...`, `@/lib/...`.
  Tests use relative imports (`../lib/foo`).
- **Tool pages**: `'use client'`, composed of `Sidebar` + `PageHeader` + tool UI,
  state via React hooks (`useState`/`useMemo`), lucide icons.
- **Keep logic out of pages**: put pure functions in `lib/` (new code) and test them
  from `__tests__/`. Page tests use React Testing Library (`screen`, `userEvent`).
- **Styling**: Tailwind utility classes only; always provide a `dark:` variant.
  Palette is neutral-based (`bg-white dark:bg-[#0a0a0c]`, `neutral-*`, `brand-*`).
- **ESLint**: extends `next/core-web-vitals` + `next/typescript`; `no-explicit-any`
  and `no-unused-vars` are warnings.
- **Commits**: Conventional Commits with scope, e.g. `feat(jwt-decoder): ...`,
  `fix(sql-date-filter): ...`.
- **Favourites**: `lib/favourites.ts` holds the store (localStorage, versioned
  envelope, bounded, tolerant of corrupt values) and `components/useFavourites.ts`
  exposes it through `useSyncExternalStore`. Always read it through the hook: it
  serves the empty server snapshot during hydration and syncs across tabs. A tool
  becomes favouritable just by being in `TOOLS` and `navItems`, no extra wiring.
- **Uploads**: every file entry point (picker, drag and drop, clipboard paste)
  must run `checkUpload` from `lib/fileGuards.ts` and surface the returned error.
  Images are checked again after decode with `checkImagePixels`, because a small
  compressed file can still expand into a very large bitmap. `accept` on an input
  is a hint, never a guard: drag and drop and paste bypass it entirely.
- **Client storage tiers**: preferences under ~50 KB (favourites, theme, sidebar)
  go in localStorage as plain versioned JSON. Anything document sized belongs in
  IndexedDB, not localStorage, which is synchronous and capped near 5 MB. Large
  binaries (images, video) are never persisted: hold an object URL and revoke it
  on replace. Do not compress small values; `pako` plus base64 makes a few
  hundred bytes bigger, not smaller.
- **Deprecating a tool**: do not delete the route. Set `deprecated: true` and
  `replacedBy: '/<replacement>'` on its `TOOLS_SEO` entry: that keeps it out of
  `sitemap.xml`, marks it `noindex, follow`, and points its canonical at the
  replacement, so existing links keep working while search traffic moves on.
  Keep the in-page banner and the `Deprecated` badge in `navItems` and `TOOLS`.
  `/json-comparison` is the worked example.
- **Parsing untrusted structured input**: prefer a real parser over a regex, but
  pin it to plain data. `lib/yamlConverter.ts` uses js-yaml with `JSON_SCHEMA`
  so no YAML tag can construct an object. `lib/asn1.ts` is a hand written,
  bounds checked DER reader (depth capped, indefinite lengths refused) rather
  than a crypto library, to keep it out of the client bundle; `lib/certDecoder.ts`
  builds on it and refuses a pasted private key outright.
- **PWA**: `app/manifest.ts` plus the `icon-*.png` files in `public/` make the
  suite installable. There is deliberately no service worker, so there is no
  cache to invalidate on deploy; adding one is a considered decision, not a tweak.
- **No Em Dashes**: Never use em dashes anywhere in the project (code, comments, documentation, UI strings). Always use standard hyphens (`-`) or ASCII dashes instead.

## Adding a New Tool (checklist)

1. `app/<slug>/page.tsx` - the tool page (`'use client'`, `Sidebar`, `PageHeader`).
2. `lib/<slug>.ts` - pure logic. All logic lives in `lib/`; `utils/` is gone.
3. `components/Sidebar.tsx` - add entry to `navItems` with a lucide icon.
4. `app/page.tsx` - add card to the `TOOLS` array (title, desc, href, category, icon, tags).
5. `lib/seo.ts` - add a `TOOLS_SEO` entry, and create `app/<slug>/layout.tsx`
   exporting `createToolMetadata('/<slug>')`. This drives per-page metadata and
   `sitemap.xml`; a tool without it is invisible to search engines.
6. `__tests__/<name>.test.ts` (+ `<name>Page.test.tsx`) - tests for logic and page.

## Gotchas

- `jest.config.js` `collectCoverageFrom` covers `app/`, `components/` and `lib/`.
  SonarCloud quality gate requires 80% coverage on new code.
- `jest.setup.js` polyfills `TextEncoder`/`TextDecoder` - needed by some utils.
- Wrap every `localStorage` access in try/catch: blocked site data and some
  private modes throw on access rather than returning null.
- `Dockerfile` uses `npm ci --legacy-peer-deps` (React peer conflicts).
- `manual-test-saudi-ids.js` is an ad-hoc/manual testing artifact.
- `/html-viewer` and `/markdown-viewer` are thin wrappers over the shared
  `components/MarkupViewer.tsx`, differing only by `initialMode`.
- `__tests__/fixtures/` holds shared test data, not suites, and is listed in
  `testPathIgnorePatterns`; jest would otherwise treat every file under
  `__tests__/` as a suite and fail on one with no tests.
- A test file with no top level `import`/`export` is a script to TypeScript, so
  its `const`s collide with every other such file and `next build` fails on
  duplicate identifiers. End those files with `export {};`.
- jsdom ships no WebCrypto: a test that touches `crypto.subtle` (hashes,
  certificate fingerprints) must install Node's `webcrypto` in `beforeAll`.
  Older WebCrypto (Node 20 and under) also rejects a bare `ArrayBuffer` that
  came from the jsdom realm, so pass a freshly allocated view to
  `subtle.digest`, never `.buffer`.
- **CI runs Node 22, this machine runs 24**, so a green local run is not proof
  about CI. Verify anything touching a platform API with
  `mise exec node@22 -- npx jest --ci --maxWorkers=2` before pushing.
- `userEvent.type` reads `[` and `{` as keyboard syntax, so a regex or JSON
  payload has to go in with `fireEvent.change` instead.
- `userEvent.setup()` installs its own clipboard stub, so a `navigator.clipboard`
  spy has to be defined after `setup()`, not before.
