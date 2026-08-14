# Kode Diskon di /bayar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors buying an indicator plan through `/bayar` apply an admin-created discount code (`discount_codes` table), with the same validation and "replaces the plan's built-in discount" behavior already used in the member upgrade flow.

**Architecture:** `BayarPage.tsx` gains the same `kodeDiskon`/`kodeDiskonData`/`kodeErr`/`kodeLoading` state and `cekKodeDiskon()` validation function already present in `src/pages/member/DashboardPage.tsx:422-425,530-540`. Price calculation switches from `plan.diskon` to an effective `diskonAktif` (the applied code's `%` when present, else the plan's own `%`). On order submit, `kode_diskon`/`diskon_applied` are written to the new order row and, on success, `discount_codes.terpakai` is incremented by 1 for the code used — mirroring `DashboardPage.tsx:554-572`.

**Tech Stack:** React + TypeScript, Supabase (Postgres, table `discount_codes` — already exists, no migration needed). No automated test framework in this repo — validate via `npm run typecheck` and manual dev-server verification.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-14-bayar-kode-diskon-design.md`
- Coupon discount **replaces** the plan's built-in discount, it does not stack (per spec's "Perilaku Diskon" section).
- RLS on `discount_codes` and `orders` is already `using (true)` / `with check (true)` (this app has no Supabase Auth — see `CLAUDE.md` RLS gotcha). No RLS changes needed.
- Follow `BayarPage.tsx`'s existing inline-style conventions exactly: local `C`/`G` constant objects, `'"Geist Mono",monospace'` / `'"Geist",system-ui,sans-serif'` font families, no Tailwind, no new npm dependencies (no lucide-react import — the file currently has none; use the same colored-text-message pattern it already uses for `errMsg`).
- No database migration is required — `orders.kode_diskon`, `orders.diskon_applied`, and all `discount_codes` columns (`kode`, `diskon`, `aktif`, `max_penggunaan`, `terpakai`, `berlaku_hingga`) already exist and are already read/written elsewhere in the codebase.
- "Testable deliverable" for the task below means: `npm run typecheck` passes, and the manual checks in the running dev server (`npm run dev`) behave as described.

---

### Task 1: Coupon input, validation, price override, and order wiring in BayarPage

**Files:**
- Modify: `src/pages/BayarPage.tsx:57` (state block), `src/pages/BayarPage.tsx:82-88` (price calc), `src/pages/BayarPage.tsx:90-149` (`handleSubmit`), `src/pages/BayarPage.tsx:184-198` (order summary JSX)

**Interfaces:**
- Consumes: `supabase` client (`src/lib/supabase.ts`), existing `plan: PlanInfo | null`, `fmt`, `G`/`C` style tokens — all already in scope in this file.
- Produces: nothing consumed by other tasks (this plan has a single task).

- [ ] **Step 1: Add coupon state variables**

In `src/pages/BayarPage.tsx`, immediately after this existing line (57):

```ts
  const [submitting, setSubmitting] = useState(false);
```

add:

```ts
  const [kodeDiskon, setKodeDiskon]         = useState('');
  const [kodeDiskonData, setKodeDiskonData] = useState<any | null>(null);
  const [kodeErr, setKodeErr]               = useState('');
  const [kodeLoading, setKodeLoading]       = useState(false);
```

- [ ] **Step 2: Compute the effective discount and derive `hargaDiskon`/`hemat` from it**

Replace the existing block (lines 82-88):

```ts
  const plan = getPlanFromConfig(config, planKey);
  const fmt  = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const hargaDiskon = plan
    ? (plan.diskon > 0 ? Math.round(plan.harga_asli * (1 - plan.diskon / 100)) : plan.harga_asli)
    : 0;
  const hemat = plan ? plan.harga_asli - hargaDiskon : 0;
```

with:

```ts
  const plan = getPlanFromConfig(config, planKey);
  const fmt  = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const diskonAktif = kodeDiskonData ? kodeDiskonData.diskon : (plan?.diskon || 0);
  const hargaDiskon = plan
    ? (diskonAktif > 0 ? Math.round(plan.harga_asli * (1 - diskonAktif / 100)) : plan.harga_asli)
    : 0;
  const hemat = plan ? plan.harga_asli - hargaDiskon : 0;
```

- [ ] **Step 3: Add the `cekKodeDiskon` validation function**

Directly above `async function handleSubmit(e: React.FormEvent) {` (currently line 90), add:

```ts
  async function cekKodeDiskon() {
    if (!kodeDiskon.trim()) return;
    setKodeLoading(true); setKodeErr(''); setKodeDiskonData(null);
    const { data, error } = await supabase.from('discount_codes')
      .select('*').eq('kode', kodeDiskon.toUpperCase().trim()).eq('aktif', true).single();
    setKodeLoading(false);
    if (error || !data) { setKodeErr('Kode tidak valid atau sudah tidak aktif.'); return; }
    if (data.berlaku_hingga && new Date(data.berlaku_hingga) < new Date()) { setKodeErr('Kode sudah kadaluarsa.'); return; }
    if (data.max_penggunaan && data.terpakai >= data.max_penggunaan) { setKodeErr('Kode sudah mencapai batas penggunaan.'); return; }
    setKodeDiskonData(data);
  }

```

- [ ] **Step 4: Write the applied code to the order and increment its usage counter**

Replace the order-insert block inside `handleSubmit` (currently lines 130-146):

```ts
    // Simpan order, dikaitkan ke member baru
    const { data: newOrder, error } = await supabase.from('orders').insert({
      member_id:      newMember.id,
      product_id:     productId,
      tier_member:    tierFromPlan(plan.key),
      nama_member:    nama.trim(),
      email_member:   email.trim(),
      no_hp:          noHp.trim(),
      catatan:        `WA: ${noHp.trim()} | ${metodeInfo}`,
      plan_type:      plan.key,
      kode_diskon:    kodeDiskonData?.kode || null,
      diskon_applied: diskonAktif || null,
      status:         'pending',
    }).select('id').single();
    if (error || !newOrder) {
      setErrMsg('Gagal menyimpan pesanan: ' + (error?.message || 'unknown error'));
      setSubmitting(false);
      return;
    }
    if (kodeDiskonData) {
      await supabase.from('discount_codes').update({ terpakai: kodeDiskonData.terpakai + 1 }).eq('id', kodeDiskonData.id);
    }
```

(Everything else in `handleSubmit` — the `nama.trim()`/`email.trim()`/`noHp.trim()`/`metodePm`/`plan` checks above this block, the member-creation insert above it, and the `window.location.href` redirect below it — stays unchanged.)

- [ ] **Step 5: Show the effective discount in the order summary and add the coupon input**

Replace the discount-badge/price/hemat block inside the `plan ? (<>...</>)` branch (currently lines 184-198):

```tsx
                {diskonAktif > 0 && (
                  <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 12, color: C.dimmer, marginBottom: 6 }}>
                    <s>Rp {fmt(plan.harga_asli)}</s>
                    <span style={{ marginLeft: 8, color: G.up, background: G.up + '15', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>-{diskonAktif}%</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: diskonAktif > 0 ? 8 : 0 }}>
                  <span style={{ fontFamily: '"Geist Mono",monospace', color: G.gold, fontSize: 15 }}>Rp</span>
                  <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -2, lineHeight: 1, color: C.text }}>{fmt(hargaDiskon)}</span>
                </div>
                {diskonAktif > 0 && (
                  <div style={{ fontFamily: '"Geist Mono",monospace', color: G.up, fontSize: 11 }}>
                    Hemat Rp {fmt(hemat)}
                  </div>
                )}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dim, fontSize: 10, letterSpacing: 0.6, marginBottom: 8 }}>PUNYA KODE KUPON? (OPSIONAL)</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={kodeDiskon}
                      onChange={e => { setKodeDiskon(e.target.value.toUpperCase()); setKodeDiskonData(null); setKodeErr(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') cekKodeDiskon(); }}
                      placeholder="MASUKKAN KODE"
                      style={{ flex: 1, background: C.bg, border: `1.5px solid ${kodeDiskonData ? G.up : kodeErr ? G.down : C.border}`, color: C.text, padding: '10px 14px', fontSize: 13, fontFamily: '"Geist Mono",monospace', outline: 'none', borderRadius: 8, letterSpacing: 1 }} />
                    <button
                      onClick={cekKodeDiskon}
                      disabled={kodeLoading || !kodeDiskon.trim()}
                      style={{ padding: '10px 18px', fontFamily: '"Geist Mono",monospace', fontSize: 12, fontWeight: 700, background: 'transparent', color: G.gold, border: `1px solid ${G.gold}`, borderRadius: 8, cursor: kodeLoading || !kodeDiskon.trim() ? 'not-allowed' : 'pointer', opacity: !kodeDiskon.trim() ? 0.4 : 1, whiteSpace: 'nowrap' as const }}>
                      {kodeLoading ? '...' : 'Terapkan'}
                    </button>
                  </div>
                  {kodeDiskonData && (
                    <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 11, color: G.up, marginTop: 6 }}>
                      ✓ Kode valid — diskon {kodeDiskonData.diskon}% diterapkan
                    </div>
                  )}
                  {kodeErr && (
                    <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 11, color: G.down, marginTop: 6 }}>
                      {kodeErr}
                    </div>
                  )}
                </div>
```

- [ ] **Step 6: Verify with typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Manual verification**

Prerequisite: in Admin → Produk Indikator → Kode Diskon, create an active test code, e.g. `TESTKUPON` at 15%, no expiry, no usage cap. Also note an existing plan's built-in discount (e.g. if `plan1_diskon` in landing preview config is 10%) to confirm override behavior.

Run: `npm run dev`, visit `/bayar?plan=bulanan` (or whichever plan key has a nonzero `diskon` configured).
- Confirm the "PUNYA KODE KUPON?" input renders below the price inside the order-summary card.
- Type an invalid code (e.g. `NOPE123`) and click "Terapkan" → expect red "Kode tidak valid atau sudah tidak aktif." message, price unchanged.
- Type `TESTKUPON` and press Enter → expect green "Kode valid — diskon 15% diterapkan", the struck-through original price, the `-15%` badge, and the big price updating to reflect 15% off (not stacked with the plan's own discount).
- Edit the input text after a code is applied → confirm the success message and badge disappear immediately (state reset on change) until "Terapkan" is clicked again.
- Fill in the rest of the form (nama, email, no HP, pilih metode pembayaran) and submit → confirm no error and redirect to `/bayar/akun?order=...`.
- In Admin → Produk Indikator → Pesanan, confirm the new order shows the `🎟️ TESTKUPON -15%` badge (existing rendering at `AdminPage.tsx:3321`).
- In Admin → Produk Indikator → Kode Diskon, confirm `TESTKUPON`'s "Terpakai" count went up by 1.
- Repeat the submit flow without entering any code → confirm the order still uses the plan's own built-in discount as before (regression check).

- [ ] **Step 8: Commit**

```bash
git add src/pages/BayarPage.tsx
git commit -m "feat: let visitors apply discount codes on /bayar"
```

---

## Self-Review Notes

- **Spec coverage:** state/validation (spec §1-2) → Step 1, 3. Price override behavior "replaces, not stacks" (spec "Perilaku Diskon") → Step 2. UI placement inside "Ringkasan Pesanan" (spec §3) → Step 5. Order insert + `terpakai` increment (spec §4-5) → Step 4. Reset-on-edit (spec §6) → already covered by the `onChange` handler in Step 5. Error messages (spec "Error Handling") → verbatim in Step 3. Out-of-scope items (admin UI, DB schema, per-product restriction) are untouched.
- **Type consistency:** `kodeDiskonData` is typed `any | null` throughout (matches the existing `any`-typed Supabase row pattern already used for `config`/`paymentMethods` in this same file), and its `.kode`/`.diskon`/`.id`/`.terpakai`/`.berlaku_hingga`/`.max_penggunaan` field accesses are consistent with the columns already read in `AdminPage.tsx` and `DashboardPage.tsx`.
- **No placeholders:** every step contains full, pasteable code; no "TBD" or unresolved validation logic.
