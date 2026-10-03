# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

**DevTools Suite** - a modular Next.js 14 (App Router) application bundling ~20 internal
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
| Utilities | `crypto-js`, `pako`, `diff-match-patch`, `jsoneditor`         |
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

- Node: `.nvmrc` pins **22**; CI uses **20.x**; Dockerfile uses 18-alpine.
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
lib/                    # NEW tool logic (pure, unit-testable functions) - prefer this
utils/                  # Older tool logic (same role as lib/)
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
- **No Em Dashes**: Never use em dashes anywhere in the project (code, comments, documentation, UI strings). Always use standard hyphens (`-`) or ASCII dashes instead.

## Adding a New Tool (checklist)

1. `app/<slug>/page.tsx` - the tool page (`'use client'`, `Sidebar`, `PageHeader`).
2. `lib/<slug>.ts` - pure logic (use `lib/` for new code, not `utils/`).
3. `components/Sidebar.tsx` - add entry to `navItems` with a lucide icon.
4. `app/page.tsx` - add card to the `TOOLS` array (title, desc, href, category, icon, tags).
5. `__tests__/<name>.test.ts` (+ `<name>Page.test.tsx`) - tests for logic and page.

## Gotchas

- `jest.config.js` `collectCoverageFrom` covers `app/`, `components/`, `utils/`,
  and `lib/`. SonarCloud quality gate requires 80% coverage on new code.
- `jest.setup.js` polyfills `TextEncoder`/`TextDecoder` - needed by some utils.
- `Dockerfile` uses `npm install --legacy-peer-deps` (React peer conflicts).
- `scratch/` and `manual-test-saudi-ids.js` are ad-hoc/manual testing artifacts.
- A `.codegraph/` index exists - use `codegraph_explore` MCP tool (or `codegraph
  explore "<query>"`) before grepping to locate/understand code.
