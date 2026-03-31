# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── football-table-plugin/ # Photopea plugin for football standings
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Artifacts

### `artifacts/football-table-plugin` (`@workspace/football-table-plugin`)

A Photopea-compatible plugin for automating football standings table updates.

**Features:**
- League/season selector (Brasileirão, Premier League, La Liga, etc.)
- Data from Sofascore API (with fallback mock data)
- Batch update system: add 1, 2, 3, 5 or 10 positions at a time
- Layer mapper: reads PSD layers and maps them to standings fields
- Queue system: review changes before applying
- Communicates with Photopea via `window.photopea.runScript()` and `postMessage`

**Files:**
- `src/types/football.ts` — type definitions, league list, POPULAR_LEAGUES config
- `src/hooks/useSofascore.ts` — data fetching + fallback mock data
- `src/hooks/usePhotopea.ts` — Photopea bridge (scripts, layer reading, text updates)
- `src/components/LeagueSelector.tsx` — league/season dropdown
- `src/components/StandingsTable.tsx` — table with batch grouping
- `src/components/LayerMapper.tsx` — PSD layer mapping configuration
- `src/components/UpdateQueue.tsx` — update queue management
- `src/pages/PluginPage.tsx` — main plugin UI

**How to use in Photopea:**
1. Publish this app
2. In Photopea: Extras → Plugins → Open Plugin → paste the URL
3. Use the plugin panel to load standings, map layers, queue updates, and apply

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes:
- `GET /api/healthz` — health check
- `GET /api/sofascore?url=<encoded_url>` — proxy for Sofascore API (adds proper headers)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Vercel Deployment

The project is configured for deployment on Vercel. Key files:

- `vercel.json` — Vercel build configuration (install, build, output directory, rewrites)
- `api/sofascore.js` — Vercel serverless function: ESPN API proxy
- `api/healthz.js` — Vercel serverless function: health check
- `MANUAL_VERCEL.md` — Step-by-step deploy instructions in Portuguese

The `artifacts/football-table-plugin/vite.config.ts` was adapted so that `PORT` and `BASE_PATH`
are optional (no longer crash-on-missing). Replit-specific plugins are only loaded when `REPL_ID`
is defined in the environment.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
