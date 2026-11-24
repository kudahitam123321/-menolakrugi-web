# Event Promo (Black Friday) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A time-boxed promo event (first: Black Friday 27–30 Nov 2026), configured from admin, that overrides product discounts everywhere prices are computed and has its own `/promo` page.

**Architecture:** One config row `promo_event` (id=1). Pure functions in `src/lib/indikatorV5.ts` decide whether the event is running and which discount applies. `paketDariProduk` is the single price source; pricing, /bayar, the dashboard catalog and the new page all call it with the event.

**Tech Stack:** React 18 + TS + Vite, Supabase REST, inline styles (`LP` tokens), node:assert checks via `scripts/check-indikator-v5.mjs`, Playwright mocks in scratchpad for visual checks.

**Spec:** `docs/superpowers/specs/2026-11-24-event-promo-black-friday-design.md`

## Global Constraints
- Times are WIB. Black Friday runs from `2026-11-27T00:00:00+07:00` through `2026-11-30T23:59:59+07:00`.
- Black Friday discounts:
  - v5 Lifetime: 60 (unggulan)
  - v4.2 Bulanan: 20
  - v4.2 Tahunan: 30
  - v4.2 Lifetime: 40
- Bonus text: "Bonus indikator scalping SCOB POI untuk semua pembeli".
- RLS policies use `using (true)` / `with check (true)`. Never use `auth.uid()`.
- Indonesian UI copy. Geist fonts. Do not copy TradingView assets.
- Typecheck baseline is 122 errors; it must not increase.

## Review Focus
- **Event diskon 0/missing for a plan:** that plan falls back to normal product discount (incl. `diskon_hingga` rule), not to 0.
- **Event row `aktif=false` or outside the window:** behaviour is identical to today (v5 50% until 1 Des).
- **Dashboard order created during event:** `diskon_applied` and the WA amount equal the event price shown on the card.
- **Discount code applied during event:** the code replaces the event discount (current rule: a code replaces the product promo). Unchanged.
- **/promo before start / after end:** shows "Segera hadir" or "Promo sudah berakhir" instead of the price cards.

---

### Task 1: Event logic

**Files:** Modify `src/lib/indikatorV5.ts`, `scripts/check-indikator-v5.mjs`

**Interfaces — Produces:**
- `interface PromoEvent { aktif: boolean; nama: string; judul: string|null; subjudul: string|null; mulai: string; selesai: string; diskon: Record<string, Partial<Record<KeyPaket, number>>>; bonus: string|null; unggulan: { product_id: string; plan: KeyPaket } | null }`
- `eventBerjalan(ev: PromoEvent|null|undefined, now?: Date): boolean`
- `paketDariProduk(p, now = new Date(), ev?: PromoEvent|null): PaketProduk[]`: when `eventBerjalan` and `ev.diskon[p.id]?.[key] > 0`, use it; otherwise the existing rule.
- `labelPromo(p, now?, ev?)`: when the event is running and gives this product a discount, return `` `${ev.nama.toUpperCase()} -${maks}% · S/D ${tgl(selesai)}` ``. Otherwise keep the existing behaviour.
- `diskonMaksEvent(ev): number`: largest discount across the event.

- [ ] **Step 1: Add failing asserts** to `scripts/check-indikator-v5.mjs`. Use `ev = { aktif: true, nama: 'Black Friday', mulai: '2026-11-27T00:00:00+07:00', selesai: '2026-11-30T23:59:59+07:00', diskon: { v5: { lifetime: 60 } }, … }` and product `v5` with `harga_lifetime 3000000, diskon_lifetime 50, diskon_hingga '2026-12-01'`.
  - `eventBerjalan(ev, 26 Nov 23:59 WIB) === false`, `(27 Nov 00:00) === true`, `(30 Nov 23:59) === true`, `(1 Des 00:00) === false`, `({...ev, aktif:false}, 28 Nov) === false`, `(null) === false`
  - `paketDariProduk(v5, 28 Nov, ev)[0].diskon === 60`
  - `paketDariProduk(v5, 1 Des 10:00, ev)[0].diskon === 50` (promo rilis jalan lagi)
  - v4 product with `diskon: { v4: { bulanan: 20 } }`: bulanan = 20, tahunan = 0 (the product has no discount)
  - `labelPromo(v5, 28 Nov, ev) === 'BLACK FRIDAY -60% · S/D 30 NOVEMBER 2026'`
  - `diskonMaksEvent({ ...ev, diskon: { a: { bulanan: 20 }, b: { lifetime: 60 } } }) === 60`
- [ ] **Step 2:** Run `node scripts/check-indikator-v5.mjs`. Expected: FAIL.
- [ ] **Step 3:** Implement the functions in `src/lib/indikatorV5.ts`.
- [ ] **Step 4:** Run `node scripts/check-indikator-v5.mjs`. Expected: `OK — status pre-order`.
- [ ] **Step 5: Commit** `feat: promo event discount logic`

### Task 2: Table + hook

**Files:** Create `supabase-promo-event-migration.sql`; Modify `src/hooks/index.ts`

**Interfaces:**
- Consumes `PromoEvent` (Task 1).
- Produces `usePromoEvent(opts?: { semua?: boolean }): { event: PromoEvent|null; loading: boolean; reload(): void }`. Reads `promo_event` id=1 with `maybeSingle()`. Without `semua`, returns null when `aktif=false`.

- [ ] **Step 1:** Write the SQL:
  - `create table if not exists promo_event`, single row with `id int primary key default 1 check (id = 1)`, plus the columns from the spec.
  - `diskon jsonb not null default '{}'`, `aktif boolean not null default false`, `nama text not null default 'Promo'`, `updated_at timestamptz default now()`.
  - Enable RLS, with select/insert/update policies `using (true)`/`with check (true)`.
- [ ] **Step 2:** Add the hook following the `useBacktestConfig` pattern.
- [ ] **Step 3:** Run `npm run typecheck`. Expected: 122.
- [ ] **Step 4: Commit** `feat: promo_event table and hook`

### Task 3: Prices follow the event

**Files:** Modify `src/pages/PricingIndikatorPage.tsx`, `src/pages/BayarPage.tsx`, `src/pages/member/DashboardPage.tsx`

**Interfaces:** Consumes `usePromoEvent`, `paketDariProduk(p, now, ev)`, `labelPromo(p, now, ev)`.

- [ ] **Step 1:** Pricing page: pass `event` to every `paketDariProduk` and `labelPromo` call.
- [ ] **Step 2:** BayarPage: pass `event` to the `paketDariProduk(produkDipilih, new Date(), event)` call, so `diskon_applied` follows it.
- [ ] **Step 3:** Dashboard: replace the inline `promoAktif` and `plans` computation in the catalog (around line 2703) with `paketDariProduk(p, new Date(), event)`, keeping the `{plan,label,h,d}` shape. Do the same for `promoProduk` in `buatOrder`. Pass `event` to `labelPromo`.
- [ ] **Step 4:** Run the Playwright mock in scratchpad with an event row running and `products` v5/v4. Expected:
  - pricing shows v5 Lifetime Rp1.200.000 with −60%;
  - the dashboard card shows the same;
  - with `aktif:false`, v5 shows Rp1.500.000.
- [ ] **Step 5: Commit** `feat: pricing, bayar and dashboard use promo event discounts`

### Task 4: `/promo` page

**Files:** Create `src/pages/PromoPage.tsx`; Modify `src/App.tsx` (`/promo` and `/black-friday` → `'promo'`, rendered with `<PromoBanner />`)

**Interfaces:** Consumes `usePromoEvent`, `useProdukDijual`, `paketDariProduk`, `eventBerjalan`, `diskonMaksEvent`, `sisaWaktu`, `RiwayatDataCard`, `TabelPerbandingan`, `versiDari`, `terbaruDari`.

- [ ] **Step 1:** Build the page as in the spec:
  - Dark hero: `ev.judul || ev.nama`, `ev.subjudul || 'Diskon hingga X%'`, and a countdown box (hari/jam/mnt/dtk) ticking every second to `selesai`, or to `mulai` before the start.
  - Cards for every product×plan with event discount > 0. The `unggulan` card comes first and has a "PENAWARAN TERBAIK" badge. Each card shows −X% big, the struck original price, the promo price, "Hemat RpY", the bonus line, and a button to `/bayar?produk=&plan=`.
  - Below the cards: `RiwayatDataCard`, `TabelPerbandingan`, and the FAQ (`<details>` items).
  - States: no event → "Belum ada promo" + link to /pricing-indikator. Before start → "Segera hadir" + countdown to `mulai`. After end → "Promo sudah berakhir" + link.
  - Mobile: cards stack, 16px gutter.
- [ ] **Step 2:** Playwright mock screenshots at 1280 and 375 for the running, before and after states. Expected: no page errors; 4 cards; the v5 Lifetime card is first.
- [ ] **Step 3: Commit** `feat: /promo event page`

### Task 5: Banner

**Files:** Modify `src/components/PromoBanner.tsx`

- [ ] **Step 1:** At the top of the render, if `eventBerjalan(event)`, return a dark banner linking `/promo`: "🖤 {nama} — diskon hingga {maks}% · berakhir {tgl selesai} → Lihat promo". Otherwise keep the existing logic.
- [ ] **Step 2:** Mock check: running event → banner text present; inactive → the v5 release banner.
- [ ] **Step 3: Commit** `feat: promo event banner`

### Task 6: Admin section

**Files:** Create `src/components/admin/EventPromoSection.tsx`; Modify `src/pages/AdminPage.tsx` (render under the `preview` sub-tab next to `BacktestUploadSection`)

- [ ] **Step 1:** Form, styled like `BacktestUploadSection`:
  - Fields: aktif checkbox, nama, judul, subjudul, mulai/selesai (`datetime-local`, interpreted as WIB, saved as ISO with +07:00), bonus.
  - A table of active products × plans that have a price, each with a number input for diskon %.
  - Unggulan select.
  - Save button that upserts id=1, with `notify` on success or error.
  - "Lihat halaman →" link to `/promo`.
- [ ] **Step 2:** Typecheck 122. Admin mock: load and save round-trip with mocked REST.
- [ ] **Step 3: Commit** `feat: admin event promo section`

### Task 7: Go live (needs user)
- [ ] Final review of the branch. Push after the user approves.
- [ ] The user runs `supabase-promo-event-migration.sql`.
- [ ] Fill in the Black Friday values from Global Constraints, then verify `/promo` live shows "Segera hadir" before 27 Nov.
- [ ] Update CLAUDE.md with a paragraph committed alone, leaving the user's own edits unstaged.
