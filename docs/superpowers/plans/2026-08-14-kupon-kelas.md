# Kode Diskon untuk Pembelian Kelas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors buying a class tier through `/payment` (the second step of the class checkout flow, after `/signup`) apply an admin-managed discount code, mirroring the already-shipped `/bayar` (indicator) coupon feature but adapted to the class flow's different structure and amount-based pricing model.

**Architecture:** `PaymentPage.tsx` gains the same `kodeDiskon`/`kodeDiskonData`/`kodeErr`/`kodeLoading` state and `cekKodeDiskon()` validation function already proven in `BayarPage.tsx`/`DashboardPage.tsx`. Unlike the indicator flow (percent-based `harga_asli`/`diskon`), class tiers (`pricing_tiers`) are amount-based (`price`/`original_price`), so "coupon never makes the price worse" is enforced by comparing two Rupiah amounts with `Math.min` rather than comparing two percentages with `Math.max`. Because the order already exists by the time `/payment` loads (created back in `/signup`), the coupon is only committed — order updated with `kode_diskon`/`diskon_applied`, and `discount_codes.terpakai` incremented via the same compare-and-swap pattern already used in `/bayar` — inside `konfirmasiWA()`, the page's one true "submit" action. Clicking "Terapkan" only validates and holds local state; it writes nothing to the database.

**Tech Stack:** React + TypeScript, Supabase (`discount_codes`/`orders` columns all already exist — no migration). No automated test framework in this repo — validate via `npm run typecheck` and manual dev-server verification.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-14-kupon-kelas-design.md`
- The coupon input lives in `PaymentPage.tsx` only. `SignupPage.tsx` (`/signup`, step 1) is untouched.
- Price comparison is amount-based (Rupiah), not percent-based: `hargaAsli = tier.original_price ?? tier.price`; `hargaDenganKode = round(hargaAsli * (1 - kode.diskon/100))` when a code is applied; final displayed/charged price = `Math.min(tier.price, hargaDenganKode)` (or just `tier.price` when no code is applied). This guarantees the coupon never produces a worse price than the tier's own existing price.
- The value persisted to `orders.diskon_applied` is the **effective total discount percent from `hargaAsli`** (`round((1 - hargaFinal / hargaAsli) * 100)`), not the raw coupon percent — this matches what `diskon_applied` means in the already-shipped `/bayar` flow (the actual percent off, whichever source produced it) and is what the admin order-list badge (`AdminPage.tsx:3321`, already generic, unchanged by this plan) displays.
- The coupon is committed (order updated, `terpakai` incremented) only inside `konfirmasiWA()`, guarded by a fresh re-validation of the code (same expiry/quota re-check pattern as `BayarPage.tsx`'s `handleSubmit`). If re-validation fails, show an error and stop — do not open the WhatsApp confirmation.
- The `discount_codes.terpakai` update uses the compare-and-swap guard already established in `/bayar`: `.eq('id', freshKode.id).eq('terpakai', freshKode.terpakai)`. This is a mitigation, not a full guarantee (no Postgres RPC/migration — same accepted tradeoff as `/bayar`).
- No changes to `konfirmasiWA`'s WhatsApp message text, `AdminPage.tsx`, or any database schema.
- Follow `PaymentPage.tsx`'s existing conventions exactly: imports `MR` from `../lib/theme` and uses `MR.gold`/`MR.dim`/`MR.dimmer`/`MR.up`/`MR.down`/`MR.panel`/`MR.border`/`MR.text`/`MR.mono` tokens (not local `C`/`G` objects — that's a different file's convention). No Tailwind, no new npm dependencies.
- "Testable deliverable" means: `npm run typecheck` passes for `PaymentPage.tsx`, and the manual dev-server checks below behave as stated.

---

### Task 1: Coupon input, validation, price override, and commit-on-confirm in PaymentPage

**Files:**
- Modify: `src/pages/PaymentPage.tsx:46` (state block), `src/pages/PaymentPage.tsx:65-67` (derived values), `src/pages/PaymentPage.tsx:75-87` (`konfirmasiWA`), `src/pages/PaymentPage.tsx:169-195` (order-summary JSX)

**Interfaces:**
- Consumes: `supabase` client, `MR` theme tokens, existing `order`/`tier`/`selected`/`fmt` — all already in scope in this file.
- Produces: nothing consumed by other tasks (this plan has a single task).

- [ ] **Step 1: Add coupon state variables**

In `src/pages/PaymentPage.tsx`, immediately after this existing line (46):

```ts
  const [copied, setCopied] = useState(false);
```

add:

```ts
  const [kodeDiskon, setKodeDiskon]         = useState('');
  const [kodeDiskonData, setKodeDiskonData] = useState<any | null>(null);
  const [kodeErr, setKodeErr]               = useState('');
  const [kodeLoading, setKodeLoading]       = useState(false);
```

- [ ] **Step 2: Add price-derivation constants**

Replace the existing block (currently lines 65-67):

```ts
  const tier = order ? tiers.find(t => t.id === order.tier_member) : undefined;
  const fmt  = (n: number) => new Intl.NumberFormat('id-ID').format(n);
  const selected = paymentMethods.find(pm => pm.id === selectedPm);
```

with:

```ts
  const tier = order ? tiers.find(t => t.id === order.tier_member) : undefined;
  const fmt  = (n: number) => new Intl.NumberFormat('id-ID').format(n);
  const selected = paymentMethods.find(pm => pm.id === selectedPm);

  const hargaAsli       = tier?.original_price ?? tier?.price ?? 0;
  const hargaDenganKode = kodeDiskonData ? Math.round(hargaAsli * (1 - kodeDiskonData.diskon / 100)) : null;
  const hargaFinal       = hargaDenganKode !== null ? Math.min(tier?.price ?? hargaAsli, hargaDenganKode) : (tier?.price ?? 0);
  const diskonAktifPct   = hargaAsli > 0 ? Math.round((1 - hargaFinal / hargaAsli) * 100) : 0;
```

- [ ] **Step 3: Add the `cekKodeDiskon` validation function**

Directly above `async function konfirmasiWA() {` (currently line 75), add:

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

- [ ] **Step 4: Re-validate and commit the coupon inside `konfirmasiWA`**

Replace the existing function (currently lines 75-87):

```ts
  async function konfirmasiWA() {
    if (!order) return;
    if (selected) {
      const metodeInfo = selected.jenis === 'qris'
        ? `QRIS (${selected.nama_bank})`
        : `Bank: ${selected.nama_bank} | Rek: ${selected.nomor_rekening || ''}`;
      await supabase.from('orders').update({ catatan: metodeInfo }).eq('id', order.id);
    }
    const waMsg = encodeURIComponent(
      `Halo admin, saya sudah transfer untuk ${tier?.name ?? order.tier_member} atas nama ${order.nama_member}. Order: #${order.id}. Berikut bukti transfernya.`
    );
    window.open(`https://wa.me/6281242224939?text=${waMsg}`, '_blank');
  }
```

with:

```ts
  async function konfirmasiWA() {
    if (!order) return;

    if (kodeDiskonData) {
      const { data: freshKode } = await supabase.from('discount_codes')
        .select('*').eq('id', kodeDiskonData.id).eq('aktif', true).single();
      const stillValid = !!freshKode
        && !(freshKode.berlaku_hingga && new Date(freshKode.berlaku_hingga) < new Date())
        && !(freshKode.max_penggunaan && freshKode.terpakai >= freshKode.max_penggunaan);
      if (!stillValid) {
        setKodeErr('Kode diskon sudah tidak berlaku lagi. Hapus kode dan coba lagi.');
        setKodeDiskonData(null);
        return;
      }
      await supabase.from('orders').update({ kode_diskon: freshKode.kode, diskon_applied: diskonAktifPct }).eq('id', order.id);
      await supabase.from('discount_codes')
        .update({ terpakai: freshKode.terpakai + 1 })
        .eq('id', freshKode.id)
        .eq('terpakai', freshKode.terpakai);
    }

    if (selected) {
      const metodeInfo = selected.jenis === 'qris'
        ? `QRIS (${selected.nama_bank})`
        : `Bank: ${selected.nama_bank} | Rek: ${selected.nomor_rekening || ''}`;
      await supabase.from('orders').update({ catatan: metodeInfo }).eq('id', order.id);
    }
    const waMsg = encodeURIComponent(
      `Halo admin, saya sudah transfer untuk ${tier?.name ?? order.tier_member} atas nama ${order.nama_member}. Order: #${order.id}. Berikut bukti transfernya.`
    );
    window.open(`https://wa.me/6281242224939?text=${waMsg}`, '_blank');
  }
```

- [ ] **Step 5: Add the coupon input and update the price display in the order-summary JSX**

Replace the "Right — ringkasan pesanan" panel (currently lines 169-195):

```tsx
        <div style={{ border: `1px solid ${MR.gold}`, background: '#0a0800', padding: isMobile ? 20 : 28, display: 'flex', flexDirection: 'column' as const, gap: 20, alignSelf: 'start', position: isMobile ? 'static' as const : 'sticky' as const, top: 20, marginTop: isMobile ? 20 : 0 }}>
          <div style={{ fontFamily: MR.mono, display: 'flex', justifyContent: 'space-between', color: MR.dim, fontSize: 11 }}>
            <span>◉ RINGKASAN PESANAN</span>
            <span style={{ color: MR.gold }}>#{order.id.slice(0, 8)}</span>
          </div>

          <div>
            <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 6 }}>KELAS DIPILIH</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{tier?.name ?? order.tier_member}</div>
          </div>

          <div style={{ borderTop: `1px solid ${MR.border}`, paddingTop: 16, display: 'grid', gap: 10, fontSize: 13, fontFamily: MR.mono }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontSize: 18 }}>
              <span>TOTAL TRANSFER</span>
              <span style={{ color: MR.gold, fontWeight: 700 }}>Rp {fmt(tier?.price ?? 0)}</span>
            </div>
          </div>

          <button onClick={konfirmasiWA} disabled={!selectedPm}
            style={{ width: '100%', fontFamily: MR.mono, background: selectedPm ? MR.gold : MR.border, color: selectedPm ? '#181000' : MR.dim, padding: '16px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, border: 'none', cursor: selectedPm ? 'pointer' : 'not-allowed' }}>
            KONFIRMASI VIA WHATSAPP ▸
          </button>
          <div style={{ fontFamily: MR.mono, fontSize: 10, color: MR.dimmer, textAlign: 'center' as const, lineHeight: 1.5 }}>
            Akses dibuka admin setelah verifikasi pembayaran.
          </div>
        </div>
```

with:

```tsx
        <div style={{ border: `1px solid ${MR.gold}`, background: '#0a0800', padding: isMobile ? 20 : 28, display: 'flex', flexDirection: 'column' as const, gap: 20, alignSelf: 'start', position: isMobile ? 'static' as const : 'sticky' as const, top: 20, marginTop: isMobile ? 20 : 0 }}>
          <div style={{ fontFamily: MR.mono, display: 'flex', justifyContent: 'space-between', color: MR.dim, fontSize: 11 }}>
            <span>◉ RINGKASAN PESANAN</span>
            <span style={{ color: MR.gold }}>#{order.id.slice(0, 8)}</span>
          </div>

          <div>
            <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 6 }}>KELAS DIPILIH</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{tier?.name ?? order.tier_member}</div>
          </div>

          <div>
            <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>PUNYA KODE KUPON? (OPSIONAL)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={kodeDiskon}
                onChange={e => { setKodeDiskon(e.target.value.toUpperCase()); setKodeDiskonData(null); setKodeErr(''); }}
                onKeyDown={e => { if (e.key === 'Enter') cekKodeDiskon(); }}
                placeholder="MASUKKAN KODE"
                style={{ flex: 1, background: MR.panel, border: `1.5px solid ${kodeDiskonData ? MR.up : kodeErr ? MR.down : MR.border}`, color: MR.text, padding: '10px 14px', fontSize: 13, fontFamily: MR.mono, outline: 'none', letterSpacing: 1 }} />
              <button
                onClick={cekKodeDiskon}
                disabled={kodeLoading || !kodeDiskon.trim()}
                style={{ padding: '10px 18px', fontFamily: MR.mono, fontSize: 12, fontWeight: 700, background: 'transparent', color: MR.gold, border: `1px solid ${MR.gold}`, cursor: kodeLoading || !kodeDiskon.trim() ? 'not-allowed' : 'pointer', opacity: !kodeDiskon.trim() ? 0.4 : 1, whiteSpace: 'nowrap' as const }}>
                {kodeLoading ? '...' : 'Terapkan'}
              </button>
            </div>
            {kodeDiskonData && (
              <div style={{ fontFamily: MR.mono, fontSize: 11, color: MR.up, marginTop: 6 }}>
                ✓ Kode valid — diskon {kodeDiskonData.diskon}% diterapkan
              </div>
            )}
            {kodeErr && (
              <div style={{ fontFamily: MR.mono, fontSize: 11, color: MR.down, marginTop: 6 }}>
                {kodeErr}
              </div>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${MR.border}`, paddingTop: 16, display: 'grid', gap: 10, fontSize: 13, fontFamily: MR.mono }}>
            {hargaFinal < (tier?.price ?? 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: MR.dim }}>
                <span>Harga normal</span>
                <span style={{ textDecoration: 'line-through' }}>Rp {fmt(tier?.price ?? 0)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontSize: 18 }}>
              <span>TOTAL TRANSFER</span>
              <span style={{ color: MR.gold, fontWeight: 700 }}>Rp {fmt(hargaFinal)}</span>
            </div>
          </div>

          <button onClick={konfirmasiWA} disabled={!selectedPm}
            style={{ width: '100%', fontFamily: MR.mono, background: selectedPm ? MR.gold : MR.border, color: selectedPm ? '#181000' : MR.dim, padding: '16px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, border: 'none', cursor: selectedPm ? 'pointer' : 'not-allowed' }}>
            KONFIRMASI VIA WHATSAPP ▸
          </button>
          <div style={{ fontFamily: MR.mono, fontSize: 10, color: MR.dimmer, textAlign: 'center' as const, lineHeight: 1.5 }}>
            Akses dibuka admin setelah verifikasi pembayaran.
          </div>
        </div>
```

- [ ] **Step 6: Verify with typecheck**

Run: `npm run typecheck`
Expected: no errors attributable to `src/pages/PaymentPage.tsx` (this repo has many pre-existing, unrelated typecheck errors elsewhere — ignore those).

- [ ] **Step 7: Manual verification**

Prerequisite: in Admin → Produk Indikator → Kode Diskon, create (or reuse) an active test code, e.g. `TESKELASKUPON` at 15%, no expiry, no usage cap. Also note a tier that has `original_price` set (shows a "Hemat X%" badge on `/pricing-kelas`) to confirm the "never worse than the tier's own price" behavior, and a tier without `original_price` to confirm the simple case.

Run `npm run dev`.
- Go through `/pricing-kelas` → pick a tier → `/signup?tier=...` → fill the form → submit → land on `/payment?order=...`.
- Confirm the "PUNYA KODE KUPON?" input renders in the Ringkasan Pesanan panel, below "KELAS DIPILIH".
- Type an invalid code and click "Terapkan" → expect red "Kode tidak valid atau sudah tidak aktif." message, TOTAL TRANSFER unchanged.
- Type `TESKELASKUPON` and press Enter → expect green "Kode valid — diskon 15% diterapkan" message, and TOTAL TRANSFER to update. If the tier has no `original_price` (i.e. `hargaAsli === tier.price`), confirm the price drops to 85% of that price with a "Harga normal" strikethrough line appearing above it. If the tier already has a steeper built-in discount (its `original_price`-vs-`price` gap is bigger than 15%), confirm TOTAL TRANSFER stays exactly at `tier.price` (the coupon does not make it worse) and no strikethrough line appears (since `hargaFinal` would equal `tier.price`, not be less than it).
- Edit the input text after a code is applied → confirm the success message disappears immediately.
- Select a payment method, click "KONFIRMASI VIA WHATSAPP" → confirm no error, WhatsApp opens.
- In Admin → Produk Indikator → Pesanan, confirm the order now shows the `🎟️ TESKELASKUPON -X%` badge (existing generic rendering at `AdminPage.tsx:3321`) with the correct effective percent.
- In Admin → Produk Indikator → Kode Diskon, confirm `TESKELASKUPON`'s "Terpakai" count went up by 1.
- Repeat the full flow without entering any code → confirm the order still uses the tier's own price as before (regression check), and no `kode_diskon`/`diskon_applied` gets written to that order.

- [ ] **Step 8: Commit**

```bash
git add src/pages/PaymentPage.tsx
git commit -m "feat: let class buyers apply discount codes on /payment"
```

---

## Self-Review Notes

- **Spec coverage:** coupon location on `/payment` not `/signup` (spec "Perilaku" §1) → Step 5 only touches `PaymentPage.tsx`. Amount-based "never worse" comparison (spec §3) → Step 2's `Math.min`. Commit-on-confirm with re-validation (spec §4-5) → Step 4. CAS `terpakai` update (spec §6) → Step 4. Effective-percent storage semantics (Global Constraints) → `diskonAktifPct` computed in Step 2, used in Step 4. Out-of-scope items (`/signup`, WA message text, admin panel, schema) are untouched by this plan.
- **Type consistency:** `kodeDiskonData` is `any | null`, matching the exact pattern already used in `BayarPage.tsx`. `hargaAsli`/`hargaDenganKode`/`hargaFinal`/`diskonAktifPct` are the only new derived values, all defined once in Step 2 and consumed consistently in Steps 4 and 5 — no renamed duplicates.
- **No placeholders:** every step contains full, pasteable code; no "TBD" or unresolved validation logic.
