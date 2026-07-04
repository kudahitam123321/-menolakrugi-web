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

There is no test suite. Validate changes by running the dev server. Playwright is installed as a dev dependency but has no written tests.

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
/competition           → CompetitionPage (standalone, or embedded as a DashboardPage tab)
/bayar                 → BayarPage (visitor payment page from landing page CTA)
/bayar/akun            → BayarAkunPage (post-submit account credentials, ?order=<uuid>)
/trading-plan          → DashboardPage (member, opens trading-plan tab)
/member                → DashboardPage (requires session)
/member/kurikulum      → CurriculumPage
/admin/trading-plan    → AdminPanel
/admin/competition     → AdminPanel (opens competition management tab)
/admin/panel           → AdminPanel (new URL)
/admin                 → AdminPanel (legacy URL, same component)
```

There are legacy page files (`src/pages/DashboardPage.tsx`, `src/pages/MemberPage.tsx`) that are no longer the primary entry points.

**Important**: `src/pages/AdminPage.tsx` is **not** legacy — `AdminPanel.tsx` imports it and renders `<AdminPage embedded={true} initialTab={...} />` as the main content area for most admin tabs. Broker management (CRUD + logo upload), video management, member management, and most admin tab UIs live inside `AdminPage.tsx`, not `AdminPanel.tsx`. `AdminPanel.tsx` is the shell (sidebar + notifications) that delegates content rendering to `AdminPage`.

The old landing-page section components in `src/components/` (`Navbar.tsx`, `Hero.tsx`, `Courses.tsx`, `Footer.tsx`, etc.) are imported in `App.tsx` but **unused** — `App.tsx` renders `<LandingPage />` directly for the home route. Do not add new logic to those files.

**Stale root-level files**: `App.tsx` and `theme.ts` exist at the project root **and** inside `src/`. The root-level copies are leftover artifacts — always edit `src/App.tsx` and `src/lib/theme.ts`. `INTEGRATION_GUIDE.tsx` at the project root is also a stale planning artifact; ignore it.

### Session Management

No auth library. Session stored in `localStorage` under key `mr_session` as a plain object. Each component that needs the session reads it directly — there is no shared `getSession` utility; the pattern is copy-pasted inline:

```ts
const raw = localStorage.getItem('mr_session');
const session = raw ? JSON.parse(raw) : null;
// session shape: { id, nama, tier, role, email, ... }
```

Logout is done by calling `localStorage.removeItem('mr_session')` then redirecting to `/login`.

**Gotcha**: `LandingPage.tsx`'s navbar checks `localStorage.getItem('mr_member')` (not `mr_session`) for login status — this is an inconsistency from legacy code. `CompetitionPage.tsx` and `DiscordCallbackPage.tsx` also read `mr_member` (from either localStorage or sessionStorage) instead of `mr_session`. All other pages use `mr_session`.

### Data Layer

All data comes from Supabase (PostgreSQL + RLS). The client is initialized in `src/lib/supabase.ts` with a hardcoded public anon key. There is also `src/lib/supabaseClient.ts` — a second client file; prefer `src/lib/supabase.ts` for all new code.

Queries are raw `.from('table').select()...` chains — no ORM. Custom hooks in `src/hooks/index.ts` encapsulate all Supabase queries with fallback data where appropriate (e.g., `PRICING_FALLBACK` in `usePricing`).

**Critical RLS gotcha**: This app uses custom localStorage-based auth, **not** Supabase Auth. `auth.uid()` is always `null` at the database level. All RLS policies must use `using (true)` / `with check (true)` — access control is enforced at the application layer, not the database layer. Using `auth.uid()` in a policy will silently block inserts/updates. See `supabase-competition-rls-fix.sql` for the fix pattern.

Key tables: `members`, `pricing_tiers`, `videos`, `journals`, `watch_history`, `testimonials`, `brokers`, `partnerships`, `activity_log`, `trading_plan_config`, `advance_requests`, `partnership_claims`, `landing_gallery`, `competitions`, `trading_journals`, `journal_settings`, `oneonone_requests`, `products`, `orders`, `payment_methods`, `discount_codes`, `announcements`, `discord_messages`, `landing_preview_config`.

`products` has columns `panduan_url` and `panduan_name` (nullable) — admin can attach a downloadable guide file per product (`.pdf`, `.docx`, `.pptx`, etc.). Files stored in the `materi` bucket with `panduan_produk_*` prefix. Member's `produk` tab shows a "Download Panduan" button when the column is set. Migration: `supabase-products-panduan-migration.sql`.

`members` has columns `last_seen` (ISO timestamp, updated on login and every 2 min while dashboard is open — used for "Online Sekarang" / "Terakhir Login" in admin) and `funded_status` (prop firm status string: `'DA'` | `'P1'` | `'P2'` | `'Master'` | `'MPAID'`; always written to DB first, Discord bot update is optional/async with 8 s timeout).

`orders` has extra columns `plan_type`, `kode_diskon`, `diskon_applied` (added in `supabase-orders-rls-fix.sql`).

**Visitor payment / auto account creation**: `BayarPage.tsx` (`/bayar`) submits the form by first inserting a new row into `members` directly (`tier: 'SMC Trial'`, a random 8-char generated `password`, `is_active: false`), then inserting the linked `orders` row (`member_id` set to the new member), then redirecting to `/bayar/akun?order=<orderId>`. `BayarAkunPage.tsx` looks up the order and its member to display the login credentials (name + generated password) and a "confirm via WhatsApp" button. The account stays unusable until an admin flips `is_active` to `true` after verifying payment — `LoginPage.tsx` blocks login while `is_active === false`. `payment_methods` rows have a `jenis` column (`'transfer'` | `'qris'`); QRIS methods render a `qris_image_url` image instead of `nomor_rekening`/`nama_rekening`.

**Table name gotcha**: The broker/prop firm table is `brokers` (not `funded_brokers`). It has columns `jenis` (`'broker'` | `'propfirm'`), `logo_url` (optional image), `nama`, `link`, `diskon`, `deskripsi`, `urutan`.

Supabase Storage buckets:
- `gallery` — landing-page images (Admin `galeri` tab). Metadata in `landing_gallery`.
- `materi` — video files, downloadable course files, **and broker/prop firm logos** (`brokerlogo_*.ext` prefix). All non-gallery uploads go here.

Admin operations are logged via the module-level `logActivity(action, detail, adminName)` function in `AdminPanel.tsx`, which writes to `activity_log`.

`announcements` stores admin broadcast messages (judul, content, type: `'info'`|`'warning'`|`'success'`). Members see these in real-time via a Supabase subscription in `DashboardPage`. `discord_messages` is a queue table for sending Discord bot messages — admin inserts a row, the Discord bot polls and sends, updating `status` (`'pending'`|`'sent'`|`'error'`). This pattern was introduced to bypass HTTP/CORS issues when calling the bot directly from the browser. `landing_preview_config` is a single-row config table (id=1, upsert pattern) holding the YouTube URL and three pricing plan cards shown on the landing page product preview section.

### Cloudflare Pages Functions

`functions/api/discord/[[path]].js` is a Cloudflare Pages Function that proxies requests from the browser to the Discord bot running at `http://93.115.101.152:12772` (Wispbyte), forwarding both path and query string. The proxy path is `/api/discord/*`. This resolves the mixed-content CORS issue of calling an HTTP bot from an HTTPS page. When browser → bot calls fail (e.g., bot is down), the code falls back to inserting into the `discord_messages` queue table instead.

The member dashboard's `pengaturan` tab has a "Hubungkan via Discord OAuth" button (`DashboardPage.tsx`) that starts the OAuth flow; `DiscordCallbackPage.tsx` (`/discord-callback`) completes it by reading the member id from `mr_member`, calling the bot via the proxy to link the account and assign the Discord auto-role, then updating trading status through the same proxy (never the old Railway URL, which is decommissioned).

The `xlsx` package is available for data exports (e.g., exporting member lists or journal data from the admin panel).

### State Management

No state management library. Components use `useState`/`useEffect` with direct Supabase calls. Large pages like `DashboardPage` and `AdminPanel` manage all their state locally.

### Design System

Design tokens are CSS custom properties in `src/index.css`, referenced via the `MR` object in `src/lib/theme.ts`. Use `var(--mr-*)` in React inline styles.

**Inline style pattern**: Large page files (DashboardPage, AdminPanel, JurnalPage, etc.) define their own local `C` and `G` constants at the top of the file that alias CSS variables — they do **not** import `MR` from `theme.ts`. Match this pattern when editing those files. Exception: `LandingPage.tsx` imports `MR` directly from `theme.ts` and defines all its sub-sections as local functions within the same file (e.g. `NavBar`, `PricingSection`) rather than separate component files.

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

Fonts are **Geist** (sans-serif) and **Geist Mono** (monospace), referenced as `'"Geist",system-ui,sans-serif'` and `'"Geist Mono",monospace'` in inline styles. `lucide-react` is available for icons. Responsive layout uses CSS variables like `--pad-page` and `--font-hero` overridden at mobile breakpoints. Tailwind is used for utility classes alongside inline styles.

### Tier System

Four primary membership tiers: **Trial**, **Bronze**, **Gold**, **Platinum**. A legacy `smc silver` value also exists in the `Member` type. Tier controls video access (`tier_access` column on `videos`). Tier accent colors are mapped in `theme.ts` via `TIER_ACCENT`. Admin roles: `member`, `admin`, `superadmin`.

### Member Dashboard Tabs

`DashboardPage` (`src/pages/member/DashboardPage.tsx`) is a sidebar-driven SPA-within-a-SPA. The sidebar IDs determine which tab renders — there is no URL change:

`dashboard` · `kelas` · `materi` · `news` (Chart) · `jurnal` · `trading-plan` · `komunitas` · `tools` (Broker) · `produk` (Produk Indikator) · `funded` · `1on1` (1-on-1 Mentoring) · `peringkat` · `competition` · `sertifikat` · `ulasan` · `referral` · `pengaturan` · `bantuan` · `logout`

The `1on1` tab lets Gold/Platinum members request a 1-on-1 mentoring session (form: Discord nickname + topic). Trial/Bronze see a locked upgrade prompt. Backed by the `oneonone_requests` table. Admin approves with a scheduled datetime or rejects with a reason in the `ApprovalsTab`.

`JurnalPage` and `LeaderboardPage` are rendered as tabs inside `DashboardPage`, not as standalone routes.

### Admin Panel Tabs

`AdminPanel` (`src/pages/admin/AdminPanel.tsx`) uses the same sidebar pattern. Sections and their tab IDs:

- **User Management**: `member` · `progress` · `jurnal` · `approvals` · `admin`
- **Competition**: Accessed at `/admin/competition`; renders `AdminCompetitionPage` embedded inside AdminPanel.
- **Content & Education**: `video` · `rating` · `trading-plan`
- **Partnership & Monetization**: `broker` · `referral` · `proprules` · `produk` (indicator products catalog, orders, payment methods CRUD, discount codes)
- **Communication**: `pengumuman` / `broadcast` (both map to `announce` tab)
- **System**: `galeri` · `log` · `pengaturan`

The `ApprovalsTab` component (inside AdminPanel) handles four sub-tabs: `ulasan` (testimonials), `advance` (advance_requests), `klaim` (partnership_claims), `1on1` (oneonone_requests — admin sets schedule datetime or rejection reason).

**Sidebar → tab ID mapping gotcha**: the `admin` sidebar item maps to tab ID `admins` (not `admin`); `pengaturan` maps to `settings`; `pengumuman` and `broadcast` both map to `announce`. The `jurnal` sidebar item in AdminPanel renders `LeaderboardPage` (member rankings), not a journal view — the label "Peringkat Member" in the sidebar reflects this, but the sidebar ID `jurnal` can be misleading.

### Real-Time Notifications

Both the member dashboard and admin panel use Supabase `postgres_changes` subscriptions for live toast notifications. These are wired up in a single `useEffect` that returns a cleanup removing the channel.

**Member side** (`DashboardPage`): One channel (`member-updates-{id}`) subscribes to:
- `advance_requests` (filter: `member_id=eq.{id}`) — toast on tier upgrade approval/rejection
- `oneonone_requests` (filter: `member_id=eq.{id}`) — toast on 1-on-1 approved (shows schedule) or rejected
- `testimonials` (filter: `member_id=eq.{id}`) — toast on review approved/rejected
- `videos` (INSERT) — toast when admin uploads a new video/file; also refreshes `kelas` tab data

**Admin side** (`AdminPanel`): Subscribes to all four tables (no member filter) — shows toast pop-ups in the bottom-right corner, updates the pending-count badge on the Persetujuan sidebar item, and keeps the notification bell dropdown sorted by newest first.

Toast auto-dismisses after 7 seconds and can be closed manually.

### Competition Feature

A trading competition system where members auto-enter the leaderboard by filling their trading journal — no manual registration.

- `src/pages/CompetitionPage.tsx` — Member-facing competition view (standalone route or embedded tab). Reads session from `mr_member` (localStorage or sessionStorage), not `mr_session`.
- `src/pages/admin/AdminCompetitionPage.tsx` — Admin UI to create/edit competitions.
- `src/components/competition/CompetitionCountdown.tsx` — Countdown timer to competition end.
- `src/components/competition/CompetitionPodium.tsx` — Top-3 podium display.
- `src/components/competition/LeaderboardTable.tsx` — Ranked table; exports `LeaderboardEntry` interface.
- `src/components/competition/MyStatsModal.tsx` — Per-member stats modal (uses `useMyCompetitionStats`).
- `src/hooks/useMyCompetitionStats.ts` — Fetches `trading_journals` + `journal_settings` for a member over the competition date range.
- `supabase-competition-migration.sql` — Schema for the `competitions` table with RLS.

**Ranking logic**: leaderboard is computed from `trading_journals` (filtered by `starts_at`/`ends_at` date range). Rank = `sum(pnl) / equity_awal * 100` (equity gain %). `equity_awal` comes from `journal_settings`; defaults to 10,000 if unset. Wins counted when `hasil` is `'Take Profit'` or `'SL Profit'`. Leaderboard updates in real time via a Supabase `postgres_changes` subscription on `trading_journals`.

Only one competition can be `is_active = true` at a time; `CompetitionPage` fetches the most-recently-created active one.

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
| `src/components/LanjutkanBelajar.tsx` | "Continue Learning" widget shown on member dashboard — reads last-watched video and latest uploads |
| `src/components/PartnershipClaimForm.tsx` | Standalone form for submitting a partnership claim (embedded in PartnershipPage) |
| `src/pages/member/DashboardPage.tsx` | Member dashboard (sidebar + multi-tab) |
| `src/pages/admin/AdminPanel.tsx` | Admin control panel (single file, multi-tab) |
| `src/components/mr/index.tsx` | Shared atomic components (MRLogo, Ticker, CandleChart) |
| `src/constants.ts` | WhatsApp number and URL constants |
| `supabase-migration.sql` | Database schema with RLS policies |
| `supabase-competition-migration.sql` | `competitions` table schema with RLS |
| `supabase-competition-rls-fix.sql` | Fixes competition RLS to use `with check (true)` — run in Supabase SQL editor if competition saves are blocked |
| `supabase-oneonone-migration.sql` | Schema for `oneonone_requests` table (1-on-1 mentoring feature) |
| `supabase-activitylog-migration.sql` | Schema for `activity_log` table |
| `supabase-broker-logo-migration.sql` | Adds `logo_url` column to `brokers` table — run once in Supabase SQL editor |
| `supabase-products-migration.sql` | Schema tabel `products` dan `orders` untuk fitur produk indikator |
| `supabase-orders-rls-fix.sql` | Fixes `orders` RLS to include USING clause for UPDATE; also adds `plan_type`, `kode_diskon`, `diskon_applied` columns |
| `supabase-products-rls-fix.sql` | Fixes `products` RLS — same pattern: splits `for all with check (true)` into per-operation policies so UPDATE actually works |
| `supabase-products-panduan-migration.sql` | Adds `panduan_url` and `panduan_name` columns to `products` table — run once in Supabase SQL editor |
| `supabase-landing-preview-migration.sql` | Schema for `landing_preview_config` table (single-row upsert, id=1) |
| `supabase-announcements-migration.sql` | Schema for `announcements` table (admin broadcast messages) |
| `supabase-discord-queue-migration.sql` | Schema for `discord_messages` queue table (bot message delivery fallback) |
| `functions/api/discord/[[path]].js` | Cloudflare Pages Function proxy — routes `/api/discord/*` to the Discord bot, bypassing CORS/mixed-content |
| `src/pages/BayarPage.tsx` | Visitor payment page reached from landing page CTA; creates the member row and order |
| `src/pages/BayarAkunPage.tsx` | Post-submit page (`/bayar/akun`) showing generated login credentials |
| `src/pages/CompetitionPage.tsx` | Member-facing competition + live leaderboard |
| `src/pages/admin/AdminCompetitionPage.tsx` | Admin competition create/edit UI |
| `src/hooks/useMyCompetitionStats.ts` | Per-member competition stats hook |
| `src/pages/member/JurnalPage.tsx` | Member trading journal UI (embedded as `jurnal` tab in DashboardPage) |
