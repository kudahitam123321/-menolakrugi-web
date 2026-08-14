# Banner Promo Kode Diskon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admin mark a discount code to be broadcast as a promo bar at the top of public pages (landing page, pricing pages, `/bayar`, `/login`, `/signup`), with admin writing the bar's exact text themselves — mirroring the FundingPips-style "New here? Get 20% OFF..." banner referenced by the product owner.

**Architecture:** Two new nullable/defaulted columns on the existing `discount_codes` table (`tampil_banner`, `banner_teks`) are set only at code-creation time in `AdminPage.tsx`'s existing "BUAT KODE DISKON" form (this feature's fields are never editable afterward, matching every other field in that form). A new standalone component `src/components/PromoBanner.tsx` independently queries `discount_codes` for the one active+flagged+still-valid code and renders its `banner_teks`, or renders nothing. `App.tsx` mounts `<PromoBanner />` immediately above 6 specific public page components.

**Tech Stack:** React + TypeScript, Supabase (Postgres — new columns via manual SQL migration, no RLS changes needed since `discount_codes` policies are already `using (true)`/`with check (true)`). No automated test framework in this repo — validate via `npm run typecheck` and manual dev-server verification.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-14-promo-banner-design.md`
- No dismiss/close button on the banner — it stays visible for as long as the featured code stays valid.
- No edit flow for discount codes (including the two new fields) — creation-time only, consistent with every other field on `discount_codes` today.
- Exactly 6 pages get the banner: home (`/`), `/pricing-indikator`, `/pricing-kelas`, `/bayar`, `/login`, `/signup`. No other route.
- A code counts as "featured and valid" when: `aktif = true`, `tampil_banner = true`, `banner_teks` is non-empty, `berlaku_hingga` is null or in the future, and `max_penggunaan` is null or `terpakai < max_penggunaan`. This exact rule is used in three places (admin form validation is a subset of it, the admin list's "📢 BANNER" badge, and `PromoBanner.tsx` itself) — keep them consistent.
- This repo has no CLI-driven migration runner — all `supabase-*.sql` files are run manually by the user in the Supabase SQL editor. The agent cannot execute `ALTER TABLE` itself (the anon key only has PostgREST/DML access, not DDL).
- Follow each touched file's existing inline-style conventions exactly: `AdminPage.tsx` uses hex-literal style objects (`'#16a34a'`, `'#111'`, etc.) and `fontFamily:'monospace'`; the new `PromoBanner.tsx` should use this app's CSS-variable tokens (`var(--mr-gold)`) and `'"Geist",system-ui,sans-serif'`, matching `BayarPage.tsx`'s `C`/`G`-token convention family. No Tailwind, no new npm dependencies.
- "Testable deliverable" for each task below means: `npm run typecheck` passes, and the described manual check in the running dev server (`npm run dev`) behaves as stated. Full end-to-end manual verification (Tasks 2 and 3) requires Task 1's migration to have actually been run against the live Supabase project first.

---

### Task 1: Database migration — `tampil_banner` + `banner_teks` columns

**Files:**
- Create: `supabase-discount-codes-banner-migration.sql`

**Interfaces:**
- Produces: `discount_codes.tampil_banner` (`boolean`, not null, default `false`), `discount_codes.banner_teks` (`text`, nullable). Tasks 2 and 3 both read/write these two columns.

- [ ] **Step 1: Write the migration file**

```sql
-- Adds banner-promo fields to discount_codes.
-- Run once in the Supabase SQL editor.

alter table discount_codes
  add column if not exists tampil_banner boolean not null default false,
  add column if not exists banner_teks text;
```

- [ ] **Step 2: Run it in the Supabase SQL editor**

This project has no CLI-driven migration runner (see `CLAUDE.md`). Open the Supabase project's SQL editor, paste the contents of `supabase-discount-codes-banner-migration.sql`, and run it.

Expected: statement succeeds; `select column_name from information_schema.columns where table_name = 'discount_codes';` now lists `tampil_banner` and `banner_teks`.

- [ ] **Step 3: Commit**

```bash
git add supabase-discount-codes-banner-migration.sql
git commit -m "feat: add tampil_banner and banner_teks columns to discount_codes"
```

---

### Task 2: Admin — set banner fields when creating a discount code

**Files:**
- Modify: `src/pages/AdminPage.tsx:1318` (state block), `src/pages/AdminPage.tsx:1766-1779` (`addDiscountCode`), `src/pages/AdminPage.tsx:3229-3240` (create-form JSX), `src/pages/AdminPage.tsx:3254-3260` (list-row badge JSX)

**Interfaces:**
- Consumes: `discount_codes.tampil_banner`/`banner_teks` columns from Task 1.
- Produces: nothing consumed by Task 3 — `PromoBanner.tsx` queries `discount_codes` directly and does not depend on any `AdminPage.tsx` internals.

- [ ] **Step 1: Add form state for the two new fields**

In `src/pages/AdminPage.tsx`, immediately after this existing line (1318):

```ts
  const [dcBerlakuHingga, setDcBerlakuHingga] = useState('');
```

add:

```ts
  const [dcTampilBanner, setDcTampilBanner] = useState(false);
  const [dcBannerTeks, setDcBannerTeks]     = useState('');
```

- [ ] **Step 2: Validate and persist the new fields in `addDiscountCode`**

Replace the existing function (currently lines 1766-1779):

```ts
  async function addDiscountCode() {
    if (!dcKode.trim() || !dcDiskon) { notify('Kode dan besaran diskon wajib diisi.', 'err'); return; }
    const d = parseInt(dcDiskon);
    if (d < 1 || d > 100) { notify('Diskon harus antara 1–100%.', 'err'); return; }
    if (dcTampilBanner && !dcBannerTeks.trim()) { notify('Teks banner wajib diisi kalau kode ini mau ditampilkan di banner.', 'err'); return; }
    const { error } = await supabase.from('discount_codes').insert({
      kode: dcKode.toUpperCase().trim(),
      diskon: d,
      aktif: dcAktif,
      max_penggunaan: dcMaxPenggunaan ? parseInt(dcMaxPenggunaan) : null,
      berlaku_hingga: dcBerlakuHingga || null,
      tampil_banner: dcTampilBanner,
      banner_teks: dcTampilBanner ? dcBannerTeks.trim() : null,
    });
    if (error) notify(error.message.includes('unique') ? 'Kode sudah terdaftar.' : 'Error: ' + error.message, 'err');
    else {
      notify('Kode diskon berhasil ditambahkan!');
      setDcKode(''); setDcDiskon(''); setDcAktif(true); setDcMaxPenggunaan(''); setDcBerlakuHingga('');
      setDcTampilBanner(false); setDcBannerTeks('');
      loadData();
    }
  }
```

- [ ] **Step 3: Add the banner toggle + text input to the create-form JSX**

The create form currently ends with the `dcAktif` toggle block followed directly by the submit button (`src/pages/AdminPage.tsx:3229-3240`):

```tsx
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                    <button onClick={()=>setDcAktif(v=>!v)}
                      style={{fontFamily:'monospace',fontSize:10,fontWeight:700,padding:'5px 16px',border:`1px solid ${dcAktif?'#16a34a':'#2a2a2a'}`,background:dcAktif?'#0a1a0e':'transparent',color:dcAktif?'#16a34a':'#555',cursor:'pointer'}}>
                      {dcAktif?'✅ AKTIF':'⛔ NON-AKTIF'}
                    </button>
                    <span style={{fontFamily:'monospace',fontSize:10,color:'#333'}}>Status kode saat dibuat</span>
                  </div>
                  <button onClick={addDiscountCode} disabled={loading}
                    style={{background:loading?'#1a1a1a':'#16a34a',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer'}}>
                    + BUAT KODE DISKON
                  </button>
```

Replace it with (inserts a new block between the `dcAktif` toggle and the submit button):

```tsx
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                    <button onClick={()=>setDcAktif(v=>!v)}
                      style={{fontFamily:'monospace',fontSize:10,fontWeight:700,padding:'5px 16px',border:`1px solid ${dcAktif?'#16a34a':'#2a2a2a'}`,background:dcAktif?'#0a1a0e':'transparent',color:dcAktif?'#16a34a':'#555',cursor:'pointer'}}>
                      {dcAktif?'✅ AKTIF':'⛔ NON-AKTIF'}
                    </button>
                    <span style={{fontFamily:'monospace',fontSize:10,color:'#333'}}>Status kode saat dibuat</span>
                  </div>
                  <div style={{marginBottom:14}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                      <button onClick={()=>setDcTampilBanner(v=>!v)}
                        style={{fontFamily:'monospace',fontSize:10,fontWeight:700,padding:'5px 16px',border:`1px solid ${dcTampilBanner?'#16a34a':'#2a2a2a'}`,background:dcTampilBanner?'#0a1a0e':'transparent',color:dcTampilBanner?'#16a34a':'#555',cursor:'pointer'}}>
                        {dcTampilBanner?'📢 TAMPIL DI BANNER':'⛔ TIDAK TAMPIL DI BANNER'}
                      </button>
                      <span style={{fontFamily:'monospace',fontSize:10,color:'#333'}}>Broadcast ke bar promo di halaman publik</span>
                    </div>
                    {dcTampilBanner && (
                      <input value={dcBannerTeks} onChange={e=>setDcBannerTeks(e.target.value)} placeholder="Teks banner, mis: Diskon 20% pembelian pertama, pakai kode HELLO"
                        style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                        onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    )}
                  </div>
                  <button onClick={addDiscountCode} disabled={loading}
                    style={{background:loading?'#1a1a1a':'#16a34a',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer'}}>
                    + BUAT KODE DISKON
                  </button>
```

- [ ] **Step 4: Show a "📢 BANNER" badge on eligible rows in the list**

In the list-row JSX, the badges row currently ends with the status span (`src/pages/AdminPage.tsx:3254-3260`):

```tsx
                          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap' as const}}>
                            <span style={{fontFamily:'monospace',fontSize:15,fontWeight:700,letterSpacing:1,color:'#e7e5e4'}}>{dc.kode}</span>
                            <span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:'#ef4444',border:'1px solid #ef444433',padding:'2px 8px'}}>-{dc.diskon}%</span>
                            <span style={{fontFamily:'monospace',fontSize:9,color:sc,border:`1px solid ${sc}44`,padding:'2px 7px'}}>
                              {!dc.aktif?'NON-AKTIF':expired?'KADALUARSA':habis?'HABIS':'AKTIF'}
                            </span>
                          </div>
```

Replace it with (adds a conditional badge after the status span, using the exact same eligibility rule as `PromoBanner.tsx` will use):

```tsx
                          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap' as const}}>
                            <span style={{fontFamily:'monospace',fontSize:15,fontWeight:700,letterSpacing:1,color:'#e7e5e4'}}>{dc.kode}</span>
                            <span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:'#ef4444',border:'1px solid #ef444433',padding:'2px 8px'}}>-{dc.diskon}%</span>
                            <span style={{fontFamily:'monospace',fontSize:9,color:sc,border:`1px solid ${sc}44`,padding:'2px 7px'}}>
                              {!dc.aktif?'NON-AKTIF':expired?'KADALUARSA':habis?'HABIS':'AKTIF'}
                            </span>
                            {(dc.tampil_banner && dc.aktif && !expired && !habis) && (
                              <span style={{fontFamily:'monospace',fontSize:9,color:'#16a34a',border:'1px solid #16a34a44',padding:'2px 7px'}}>📢 BANNER</span>
                            )}
                          </div>
```

(`expired` and `habis` are already computed above this JSX in the existing `discountCodes.map(dc => { ... })` callback — no new variables needed.)

- [ ] **Step 5: Verify with typecheck**

Run: `npm run typecheck`
Expected: no new errors attributable to `AdminPage.tsx` (this repo has pre-existing unrelated typecheck errors elsewhere and even within `AdminPage.tsx` itself — ignore those; only new errors introduced by this diff matter).

- [ ] **Step 6: Manual verification**

Requires Task 1's migration to already be applied to the live database.

Run `npm run dev`, log in as admin, go to Produk Indikator → Kode Diskon.
- Leave "TIDAK TAMPIL DI BANNER" as-is (default) and create a code → confirm no banner-text input appears, code is created successfully, and it does **not** get a "📢 BANNER" badge in the list.
- Click "TAMPIL DI BANNER" to toggle it on for a new code, leave the text input empty, submit → expect error "Teks banner wajib diisi...".
- Fill in banner text, submit → expect success, and the new row shows both the status badge and a green "📢 BANNER" badge.
- Toggle that code inactive ("NONAKTIFKAN") → confirm the "📢 BANNER" badge disappears from that row (since eligibility requires `aktif`).

- [ ] **Step 7: Commit**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: let admin mark a discount code to broadcast on the public promo banner"
```

---

### Task 3: Public promo banner component + wiring into App.tsx

**Files:**
- Create: `src/components/PromoBanner.tsx`
- Modify: `src/App.tsx:31` (import block), `src/App.tsx:71,75,76,78,79,102` (6 return statements)

**Interfaces:**
- Consumes: `discount_codes.tampil_banner`/`banner_teks` columns from Task 1. Independent of Task 2's admin-form internals.

- [ ] **Step 1: Create the `PromoBanner` component**

Create `src/components/PromoBanner.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PromoBanner() {
  const [teks, setTeks] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('discount_codes')
        .select('*')
        .eq('aktif', true)
        .eq('tampil_banner', true)
        .order('created_at', { ascending: false })
        .limit(1);
      const dc = data?.[0];
      if (!dc || !dc.banner_teks) return;
      const expired = dc.berlaku_hingga && new Date(dc.berlaku_hingga) < new Date();
      const habis = dc.max_penggunaan && dc.terpakai >= dc.max_penggunaan;
      if (expired || habis) return;
      setTeks(dc.banner_teks);
    }
    load();
  }, []);

  if (!teks) return null;

  return (
    <div style={{
      background: 'var(--mr-gold)',
      color: '#fff',
      textAlign: 'center' as const,
      padding: '10px 16px',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: '"Geist",system-ui,sans-serif',
      lineHeight: 1.4,
    }}>
      {teks}
    </div>
  );
}
```

This mirrors the exact eligibility rule used in Task 2's admin badge (`aktif`, `tampil_banner`, not expired, not over quota) and the same expiry/quota-check pattern already used in `cekKodeDiskon` (`src/pages/BayarPage.tsx`, `src/pages/member/DashboardPage.tsx`).

- [ ] **Step 2: Import `PromoBanner` in `App.tsx`**

In `src/App.tsx`, immediately after this existing line (31):

```ts
import PricingKelasPage from './pages/PricingKelasPage';
```

add:

```ts
import PromoBanner from './components/PromoBanner';
```

- [ ] **Step 3: Wrap the 6 public-page returns with `<PromoBanner />`**

In `src/App.tsx`, make these 6 exact replacements (each is a single existing line):

Replace:
```tsx
  if (page === 'login')             return <LoginPage />;
```
with:
```tsx
  if (page === 'login')             return <><PromoBanner /><LoginPage /></>;
```

Replace:
```tsx
  if (page === 'signup')            return <SignupPage />;
```
with:
```tsx
  if (page === 'signup')            return <><PromoBanner /><SignupPage /></>;
```

Replace:
```tsx
  if (page === 'bayar')             return <BayarPage />;
```
with:
```tsx
  if (page === 'bayar')             return <><PromoBanner /><BayarPage /></>;
```

Replace:
```tsx
  if (page === 'pricing-indikator') return <PricingIndikatorPage />;
```
with:
```tsx
  if (page === 'pricing-indikator') return <><PromoBanner /><PricingIndikatorPage /></>;
```

Replace:
```tsx
  if (page === 'pricing-kelas')     return <PricingKelasPage />;
```
with:
```tsx
  if (page === 'pricing-kelas')     return <><PromoBanner /><PricingKelasPage /></>;
```

Replace (the final fallback / home route):
```tsx
  return <LandingPage />;
```
with:
```tsx
  return <><PromoBanner /><LandingPage /></>;
```

Do not change any other `return` line in `App.tsx` (e.g. `/checkout`, `/payment`, `/partnership`, `/calendar`, `/komunitas`, `/competition`, `/bayar/akun`, `/member`, `/admin*` all stay exactly as they are — out of scope per spec).

- [ ] **Step 4: Verify with typecheck**

Run: `npm run typecheck`
Expected: no new errors attributable to `App.tsx` or `PromoBanner.tsx`.

- [ ] **Step 5: Manual verification**

Requires Task 1's migration applied and Task 2's admin UI available (to create a featured code) — or, if Task 2 isn't done yet in your execution order, insert a test row directly: `update discount_codes set tampil_banner = true, banner_teks = 'Tes banner promo' where kode = '<some existing code>';`.

Run `npm run dev`.
- With no `aktif = true AND tampil_banner = true` code in the database: visit `/`, `/login`, `/signup`, `/bayar`, `/pricing-indikator`, `/pricing-kelas` → confirm no banner bar renders on any of them (no empty gap either).
- With one eligible code present: visit all 6 of the same routes → confirm the green bar with the exact `banner_teks` renders at the very top of each page, above that page's own header/nav.
- Visit `/checkout`, `/member` (or any route requiring login), and `/admin` → confirm the banner does **not** appear there (out of scope routes untouched).
- Set that code's `berlaku_hingga` to yesterday (or `aktif` to false) via the admin panel → refresh `/` → confirm the banner disappears.

- [ ] **Step 6: Commit**

```bash
git add src/components/PromoBanner.tsx src/App.tsx
git commit -m "feat: show promo banner with featured discount code on public pages"
```

---

## Self-Review Notes

- **Spec coverage:** DB columns (spec "Perubahan Data") → Task 1. Admin create-form fields + validation + list badge (spec "Perubahan Kode" §1) → Task 2. `PromoBanner` component + eligibility rule + no-dismiss + 6-route wiring (spec "Perubahan Kode" §2-3, "Perilaku") → Task 3. Out-of-scope items (no edit flow, no dismiss button, other routes untouched) are explicitly called out as "do not change" in Task 3 Step 3 and left untouched by Tasks 1-2.
- **Type consistency:** the eligibility check (`aktif && tampil_banner && not expired && not over quota`) is expressed identically in three places — Task 2's list badge, Task 3's `PromoBanner` — using the same field names (`dc.berlaku_hingga`, `dc.max_penggunaan`, `dc.terpakai`) already established by the existing `cekKodeDiskon` pattern elsewhere in the codebase, so no naming drift.
- **No placeholders:** every step contains full, pasteable code; no "TBD" or unresolved validation logic. Task 1's migration is explicitly manual (matches this repo's established convention, not a gap).
