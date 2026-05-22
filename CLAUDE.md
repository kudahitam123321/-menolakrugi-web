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

## Architecture

**Menolak Rugi** is a React + TypeScript SPA for a trading education platform (Smart Money Concept). All content is in Indonesian.

### Routing

No routing library. `App.tsx` inspects `window.location.pathname` in a `getPage()` function and conditionally renders the correct page component. Navigation is done via `window.location.href` assignments.

```
/                → LandingPage
/login, /signup  → Auth pages
/member          → DashboardPage (requires session)
/member/kurikulum → CurriculumPage
/admin           → AdminPanel
/partnership/**  → PartnershipPage (multi-step)
```

### Session Management

No auth library. Session stored in `localStorage` under key `mr_session` as a plain object `{ type: 'member', nama, tier, ... }`. Checked via `getSession()` calls in components — not a context or global store.

### Data Layer

All data comes from Supabase (PostgreSQL + RLS). The client is initialized in `src/lib/supabase.ts` with a hardcoded public anon key. Queries are raw `.from('table').select()...` chains — no ORM. Custom hooks in `src/hooks/index.ts` encapsulate all Supabase queries with fallback data where appropriate (e.g., `PRICING_FALLBACK` in `usePricing`).

Key tables: `members`, `pricing_tiers`, `videos`, `journals`, `watch_history`, `testimonials`, `funded_brokers`, `partnerships`.

### State Management

No state management library. Components use `useState`/`useEffect` with direct Supabase calls. Large pages like `DashboardPage` and `AdminPanel` manage all their state locally.

### Design System

Design tokens live in `src/lib/theme.ts` as the `MR` object (colors, fonts). Responsive layout tokens are CSS variables in `src/index.css` (e.g., `--pad-page`, `--font-hero`) overridden at mobile breakpoints. Tailwind is used for utility classes. The color palette is dark-mode only: `#070707` background, `#e7e5e4` text, `#eab308` gold CTA, `#10b981` profit green, `#ef4444` loss red.

### Tier System

Four membership tiers: **Trial**, **Bronze**, **Gold**, **Platinum**. Tier controls video access (`tier_access` column on `videos`). Tier accent colors are mapped in `theme.ts` via `TIER_ACCENT`. Admin roles: `member`, `admin`, `superadmin`.

### Key Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Main router |
| `src/lib/theme.ts` | Design tokens and tier color map |
| `src/types/mr.types.ts` | All TypeScript interfaces |
| `src/hooks/index.ts` | All custom hooks (Supabase queries) |
| `src/hooks/useWatchHistory.ts` | Video progress tracking |
| `src/pages/member/DashboardPage.tsx` | Member dashboard (sidebar + multi-tab) |
| `src/pages/admin/AdminPanel.tsx` | Admin control panel (single file, multi-tab) |
| `src/components/mr/index.tsx` | Shared atomic components (MRLogo, Ticker, CandleChart) |
| `supabase-migration.sql` | Database schema with RLS policies |
| `src/constants.ts` | WhatsApp number and URL constants |
