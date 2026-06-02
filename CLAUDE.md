# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run preview      # Preview production build
npm run typecheck    # TypeScript check (tsc --noEmit -p tsconfig.app.json)
```

There is no test suite. Validate changes by running the dev server.

## Deployment

The app is deployed on **Cloudflare Pages**. Pushing to `main` triggers an automatic deploy. There is no manual deploy step.

## Architecture

**Menolak Rugi** is a React + TypeScript SPA for a trading education platform (Smart Money Concept). All content is in Indonesian.

### Routing

No routing library. `App.tsx` inspects `window.location.pathname` in a `getPage()` function and conditionally renders the correct page component. Navigation is done via `window.location.href` assignments.

```
/                      → LandingPage
/login                 → LoginPage
/signup                → SignupPage
/checkout              → CheckoutPage (legacy)
/payment               → PaymentPage
/partnership           → PartnershipPage step="intro"
/partnership/broker    → PartnershipPage step="broker"
/partnership/confirm   → PartnershipPage step="confirm"
/calendar              → CalendarPage
/komunitas             → KomunitasPage
/discord-callback      → DiscordCallbackPage
/trading-plan          → DashboardPage (member, opens trading-plan tab)
/member                → DashboardPage (requires session)
/member/kurikulum      → CurriculumPage
/admin/trading-plan    → AdminPanel
/admin/panel           → AdminPanel (new URL)
/admin                 → AdminPanel (legacy URL, same component)
```

There are legacy page files (`src/pages/DashboardPage.tsx`, `src/pages/MemberPage.tsx`, `src/pages/AdminPage.tsx`) that are no longer the primary entry points but are still imported by some components.

### Session Management

No auth library. Session stored in `localStorage` under key `mr_session` as a plain object. Each component that needs the session reads it directly — there is no shared `getSession` utility; the pattern is copy-pasted inline:

```ts
const raw = localStorage.getItem('mr_session');
const session = raw ? JSON.parse(raw) : null;
// session shape: { id, nama, tier, role, email, ... }
```

Logout is done by calling `localStorage.removeItem('mr_session')` then redirecting to `/login`.

### Data Layer

All data comes from Supabase (PostgreSQL + RLS). The client is initialized in `src/lib/supabase.ts` with a hardcoded public anon key. There is also `src/lib/supabaseClient.ts` — a second client file; prefer `src/lib/supabase.ts` for all new code.

Queries are raw `.from('table').select()...` chains — no ORM. Custom hooks in `src/hooks/index.ts` encapsulate all Supabase queries with fallback data where appropriate (e.g., `PRICING_FALLBACK` in `usePricing`).

Key tables: `members`, `pricing_tiers`, `videos`, `journals`, `watch_history`, `testimonials`, `funded_brokers`, `partnerships`, `activity_log`, `trading_plan_config`, `advance_requests`, `partnership_claims`.

Admin operations are logged via the module-level `logActivity(action, detail, adminName)` function in `AdminPanel.tsx`, which writes to `activity_log`.

The `xlsx` package is available for data exports (e.g., exporting member lists or journal data from the admin panel).

### State Management

No state management library. Components use `useState`/`useEffect` with direct Supabase calls. Large pages like `DashboardPage` and `AdminPanel` manage all their state locally.

### Design System

Design tokens are CSS custom properties in `src/index.css`, referenced via the `MR` object in `src/lib/theme.ts`. Use `var(--mr-*)` in React inline styles.

**Inline style pattern**: Large page files (DashboardPage, AdminPanel, JurnalPage, etc.) define their own local `C` and `G` constants at the top of the file that alias CSS variables — they do **not** import `MR` from `theme.ts`. Match this pattern when editing those files.

```ts
const C = { bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', text: 'var(--mr-text)', ... };
const G = { gold: 'var(--mr-gold)', gold2: 'var(--mr-gold2)' };
```

**Dark/light mode**: Toggle is supported via `initTheme()` / `toggleTheme()` in `theme.ts`. The `data-theme` attribute on `<html>` switches the palette; stored in `localStorage` as `mr_theme` (default: `'dark'`).

Primary accent (`--mr-gold`) is **green** (`#16a34a`), not yellow — it maps to the "profit green" brand color despite the variable name. Key semantic tokens:

| Token | Dark value | Purpose |
|---|---|---|
| `--mr-bg` | `#090909` | Page background |
| `--mr-text` | `#e7e5e4` | Body text |
| `--mr-gold` | `#16a34a` | Primary CTA / accent |
| `--mr-up` | `#22c55e` | Profit / positive |
| `--mr-down` | `#ef4444` | Loss / negative |

Responsive layout uses CSS variables like `--pad-page` and `--font-hero` overridden at mobile breakpoints. Tailwind is used for utility classes alongside inline styles.

### Tier System

Four membership tiers: **Trial**, **Bronze**, **Gold**, **Platinum**. Tier controls video access (`tier_access` column on `videos`). Tier accent colors are mapped in `theme.ts` via `TIER_ACCENT`. Admin roles: `member`, `admin`, `superadmin`.

### Member Dashboard Tabs

`DashboardPage` (`src/pages/member/DashboardPage.tsx`) is a sidebar-driven SPA-within-a-SPA. The sidebar IDs determine which tab renders — there is no URL change:

`dashboard` · `kelas` · `materi` · `news` (Chart) · `jurnal` · `trading-plan` · `komunitas` · `tools` (Broker) · `funded` · `peringkat` · `sertifikat` · `ulasan` · `referral` · `pengaturan` · `bantuan` · `logout`

`JurnalPage` and `LeaderboardPage` are rendered as tabs inside `DashboardPage`, not as standalone routes.

### Admin Panel Tabs

`AdminPanel` (`src/pages/admin/AdminPanel.tsx`) uses the same sidebar pattern. Sections and their tab IDs:

- **User Management**: `member` · `progress` · `jurnal` · `approvals` · `admin`
- **Content & Education**: `video` · `rating` · `trading-plan`
- **Partnership & Monetization**: `broker` · `referral` · `proprules`
- **Communication**: `pengumuman` / `broadcast` (both map to `announce` tab)
- **System**: `log` · `pengaturan`

The `ApprovalsTab` component (inside AdminPanel) handles three sub-tabs: `ulasan` (testimonials), `advance` (advance_requests), `klaim` (partnership_claims).

**Sidebar → tab ID mapping gotcha**: the `admin` sidebar item maps to tab ID `admins` (not `admin`). The `jurnal` sidebar item in AdminPanel renders `LeaderboardPage` (member rankings), not a journal view — the label "Peringkat Member" in the sidebar reflects this, but the sidebar ID `jurnal` can be misleading.

### Shared Components

`src/components/mr/index.tsx` and `src/components/mr/mr-components.tsx` both live in the same directory — `index.tsx` is the primary export barrel. Import shared components from `src/components/mr` (the index), not from `mr-components.tsx` directly.

### TradingView Widgets

TradingView charts are injected via `<script>` tags at runtime — **not** via an npm package. Multiple widget files exist: `src/components/mr/TradingViewWidget.tsx`, `src/components/mr/TradingViewWidgets.tsx`, and `src/pages/TradingViewWidget.tsx`. Prefer the component in `src/components/mr/` for new usage.

### Trading Plan Feature

A decision-tree-based trading plan tool added in a recent release.

- `src/types/tradingPlan.ts` — Types: `PlanConfig`, `PlanScenario`, `PlanStep`, `TradingPlanConfigRow`
- `src/components/trading-plan/TradingPlanDecisionTree.tsx` — Member-facing interactive decision tree
- `src/components/trading-plan/TradingPlanAdminEditor.tsx` — Admin UI for editing plan config
- `src/pages/member/MemberTradingPlan.tsx` — Member wrapper page
- `src/pages/admin/AdminTradingPlan.tsx` — Admin wrapper page

Config is stored per `plan_type` (`'basic'` | `'advanced'`) in the `trading_plan_config` Supabase table.

### Key Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Main router |
| `src/lib/theme.ts` | Design tokens, `initTheme`, `toggleTheme` |
| `src/index.css` | CSS variable definitions for dark + light themes |
| `src/types/mr.types.ts` | All TypeScript interfaces |
| `src/types/tradingPlan.ts` | Trading Plan types |
| `src/hooks/index.ts` | All custom hooks (Supabase queries) |
| `src/hooks/useWatchHistory.ts` | Video progress tracking |
| `src/pages/member/DashboardPage.tsx` | Member dashboard (sidebar + multi-tab) |
| `src/pages/admin/AdminPanel.tsx` | Admin control panel (single file, multi-tab) |
| `src/components/mr/index.tsx` | Shared atomic components (MRLogo, Ticker, CandleChart) |
| `src/constants.ts` | WhatsApp number and URL constants |
| `supabase-migration.sql` | Database schema with RLS policies |
