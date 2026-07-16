# MPMS Frontend — alblue-tracker-fe (staging)

> **First session?** Read `../../skysoft/algreen-tracker/algreen-tracker-be/docs/CLAUDE_ONBOARDING.md`
> first — covers the 5-repo picture, infrastructure, deploy targets, workflow
> rules, and Milos's preferences. This file is per-repo coding conventions +
> workflows only.

**This repo:** alblue-tracker-fe = **staging** FE (Bojan/Sale QA-test before
Mile sees it). Active development happens here. Mirror to algreen-tracker-fe
(pilot) when shipping.

---

## Project at a glance

Multi-tenant Manufacturing Execution System. pnpm monorepo, two React apps:
- **Dashboard** (`apps/dashboard`, port 5941) — desktop, antd
- **Tablet** (`apps/tablet`, port 5942) — PWA, Tailwind, vite-plugin-pwa

Backend (single source of truth): `../alblue-tracker-be/` — .NET 9, PostgreSQL,
JWT, SignalR. Deploys to both staging + pilot droplets.

```
packages/
  shared-types/   → @alblue/shared-types (enums, DTOs, request/event types)
  api-client/     → @alblue/api-client (axios + JWT interceptors)
  signalr-client/ → @alblue/signalr-client (connection manager + React hook)
  auth/           → @alblue/auth (Zustand store + route guards)
apps/dashboard/   → desktop dashboard (managers/coordinators/sales/admin)
apps/tablet/      → tablet PWA (factory-floor workers)
```

---

## Common workflows

### Run locally
```bash
pnpm install                     # auto-installs husky pre-commit
pnpm --filter dashboard dev      # http://localhost:5941
pnpm --filter tablet dev         # http://localhost:5942
```

### Test
```bash
pnpm --filter dashboard test     # vitest (unit tests for hooks/utils)
pnpm typecheck                   # full monorepo
pnpm e2e                         # Playwright (dashboard + tablet projects)
```

### Deploy alblue staging
```bash
./deploy.sh all          # build + rsync dashboard + tablet to staging droplet
./deploy.sh dashboard    # only dashboard
./deploy.sh tablet       # only tablet
```

### Mirror to algreen-tracker-fe (pilot)
Same MPMS app, just a different deploy target. Use `rsync` to copy changed
files (hand-writing is wasteful):
```bash
# List changed files: git diff --name-only <since>
rsync -av <changed-file> ../../algreen-mes/algreen-tracker-fe/<same-path>
# In algreen-tracker-fe: pnpm typecheck && pnpm test, then commit + push + ./deploy.sh all
```
Keep `@alblue/*` namespace verbatim (algreen uses the same package names).
Only `.env` and `deploy.sh` are repo-specific — never rsync those. Files that
legitimately diverge (logos, theme colors): Read both and Edit the diff.

---

## Pre-commit chain (~5s, runs on every commit)
1. Merge conflict markers (`<<<<<<<` / `=======` / `>>>>>>>`)
2. i18n key existence (every `t('key')` exists in both sr/en)
3. i18n placeholder + empty-value match
4. Brand leaks: no user-visible `algreen` / `alblue` / `Skysoft`
5. Hardcoded colors in `.tsx` (hex / rgb / rgba forbidden outside theme.ts)
6. File-size soft cap: 1500 lines (`OrderListPage` allow-listed)
7. ESLint via lint-staged on changed `.ts`/`.tsx` (max-warnings=0)
8. TypeScript typecheck (full monorepo via `pnpm -r typecheck`)

Bypass with `--no-verify` only when reverting. CI mirrors all of these.

---

## Code conventions
- TypeScript strict mode.
- Enums: string values matching backend exactly.
- API services return the axios response → access `.data` for the payload.
- All list endpoints return `PagedResult<T>` → use `.items` for the array.
- TanStack Query for server state, Zustand for client state.
- antd Form for dashboard forms; controlled inputs for tablet.
- Auth: JWT in localStorage, refresh on 401, route guards
  (`RequireAuth`, `RequireRole`). Roles: Admin, Manager, Coordinator,
  SalesManager, Department.

### Color rule (no hardcoded colors)
- Use antd tokens via `theme.useToken()`: `colorError`, `colorBgContainer`,
  `colorBorderSecondary`, `colorSuccessBg`, `colorWarningBorder`, etc.
- **Exceptions** (intentional):
  - `apps/dashboard/src/styles/theme.ts` (theme definition itself)
  - Semantic process palettes in `OrderListPage.tsx` (`processStatusColors`,
    `orderTypeColors`, `orderStatusTextColors`) and the cells that render them
    (`ProcessCell`, `ItemProcessBar`, `ProcessTimeline`) — Excel parity
  - User-configurable defaults stored in DB (tenant warning/critical pickers)
- New code: token first, hex only if no token fits, document why with a comment.

### Mobile-responsive filters
Use `useFilterWidth()` (`apps/dashboard/src/hooks/useFilterWidth.ts`) instead
of inline `style={{ width: 260 }}` on filter inputs. Returns pixel number on
tablet+ and `'100%'` on mobile so filters wrap full-width on phones. Mirror of
`useFixedColumn` (which does the same for fixed table columns).

---

## Tooling
- **CI** (`.github/workflows/ci.yml`): static checks + lint + typecheck +
  vitest + dashboard/tablet builds on push to main + PR.
- **Dependabot**: weekly grouped npm patch/minor, immediate security
  advisories, monthly GHA.
- **Bundle analyzer**: `ANALYZE=1 pnpm --filter dashboard build` opens
  `dist/stats.html` (interactive treemap).
- **Vitest** (`apps/dashboard`): unit tests for hooks + utils. Setup at
  `apps/dashboard/src/test/setup.ts` (jsdom + matchMedia stub for antd).
- **Playwright** (`e2e/*.spec.ts`):
  - Two projects: `dashboard` (Desktop Chrome :5941) and `tablet` (Pixel 5 :5942).
  - Files prefixed `tablet-` run only in the tablet project.
  - First run: `pnpm exec playwright install chromium`.
  - Run: `pnpm e2e` (headless) or `pnpm e2e:ui`.
  - Default creds: `admin@demo.com` / `Admin123!` / tenant `DEMO`. Override via
    `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` / `E2E_TENANT_CODE`.

### CI E2E one-time setup
Opt-in via repo settings (Settings → Secrets and variables → Actions):
1. **Variables**: `E2E_ENABLED=true` (without it the job is skipped)
2. **Secrets**: `BE_CHECKOUT_TOKEN` = fine-grained GH PAT with `Contents:read`
   on `NikolaMilanovic22/AlgreenMES`

---

## Environment variables (per-app `.env`)
- `VITE_API_BASE_URL` (default `http://localhost:5031/api`)
- `VITE_SIGNALR_URL` (default `http://localhost:5031/hubs/production`)
- `VITE_SENTRY_DSN` / `_ENVIRONMENT` / `_RELEASE` — `deploy.sh` injects these
  per environment

---

## Project surface (derive from code rather than memorize)

Things that change often — grep instead of relying on this file:
- **Routes** → `apps/dashboard/src/App.tsx`, `apps/tablet/src/App.tsx`
- **API services** → `packages/api-client/src/api/*.ts` (1:1 with BE controllers)
- **SignalR event names** → `packages/signalr-client/src/event-names.ts`
- **Shared types/enums** → `packages/shared-types/src/`

Tablet has no explicit check-in step (removed ~03.2026); work_session is
created implicitly when worker logs in / starts first process. See memory
`no-explicit-check-in`.

---

## Known gaps
- Dashboard API response types for `/dashboard` endpoints are generic
  (backend DTO shapes not finalized).
- Tablet offline sync is scaffolded but not fully wired.
