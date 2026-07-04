# Bayar Akun Member Implementation Plan

> **Untuk pekerja agentic:** REQUIRED SUB-SKILL: Pakai superpowers:subagent-driven-development (disarankan) atau superpowers:executing-plans untuk eksekusi plan ini task demi task. Step pakai checkbox (`- [ ]`) untuk tracking.

**Goal:** Ganti tombol "Konfirmasi via WhatsApp" di `/bayar` supaya, sebelum membuka WhatsApp, sistem membuat akun `members` baru untuk pembeli dan mengarahkan mereka ke halaman baru `/bayar/akun` yang menampilkan username + password login dashboard member.

**Architecture:** `BayarPage.tsx` melakukan 2 insert berurutan (member lalu order dengan `member_id` terisi) lalu redirect via `window.location.href` ke `/bayar/akun?order=<id>` — pola routing yang sama dengan yang sudah dipakai di seluruh `App.tsx` (query string + `getPage()`). Halaman baru `BayarAkunPage.tsx` fetch order+member berdasarkan query param dan menampilkan kredensial, dengan tombol WhatsApp yang membangun ulang pesan konfirmasi dari data order tersebut.

**Tech Stack:** React + TypeScript, Supabase (`orders`, `members` tables — RLS `using(true)`, tidak ada perubahan skema).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-04-bayar-akun-member-design.md`
- Tidak ada migration SQL baru — semua kolom (`role`, `is_active`, `password`, dll.) sudah ada di tabel `members`.
- Tier akun baru selalu `'SMC Trial'` (persis string ini, harus cocok dengan salah satu opsi dropdown tier di `LoginPage.tsx`).
- Tidak ada auto-login setelah akun dibuat — pembeli tetap harus ke `/login` manual.
- Tidak ada test suite di repo ini (lihat `CLAUDE.md`) — validasi lewat `npm run typecheck` tiap task, dan verifikasi manual di dev server / Playwright di akhir (bukan bagian dari step task individual, tapi WAJIB sebelum melaporkan selesai — lihat catatan di akhir plan).

---

### Task 1: `BayarPage.tsx` — buat member baru & redirect, bukan buka WA langsung

**Files:**
- Modify: `src/pages/BayarPage.tsx:1-32` (state baru), `src/pages/BayarPage.tsx:75-116` (`handleSubmit`), `src/pages/BayarPage.tsx:283-309` (teks info bayar + tombol submit)

**Interfaces:**
- Consumes: `supabase` client (`src/lib/supabase.ts`), state `nama`/`email`/`noHp`/`metodePm`/`plan`/`paymentMethods` yang sudah ada di file ini.
- Produces: tidak ada — task ini adalah titik akhir dari alur redirect. Task 2 (`BayarAkunPage.tsx`) mengonsumsi hasilnya lewat query param `?order=<id>` dan lewat tabel `orders`/`members` di database (bukan lewat import kode).

- [ ] **Step 1: Tambah state `submitting` dan fungsi `generateMemberPassword`**

Di `src/pages/BayarPage.tsx`, cari baris:

```ts
  const [errMsg, setErrMsg] = useState('');
```

Ganti jadi:

```ts
  const [errMsg, setErrMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
```

Lalu tepat di atas `export default function BayarPage() {`, tambah:

```ts
function generateMemberPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

```

- [ ] **Step 2: Ganti isi `handleSubmit`**

Cari blok fungsi `handleSubmit` (dari `async function handleSubmit(e: React.FormEvent) {` sampai penutup `}` sebelum `if (loading) return (`). Isinya sekarang:

```ts
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg('');
    if (!nama.trim() || !email.trim() || !noHp.trim()) { setErrMsg('Semua field wajib diisi.'); return; }
    if (!metodePm) { setErrMsg('Pilih metode pembayaran terlebih dahulu.'); return; }
    if (!plan) { setErrMsg('Plan tidak valid.'); return; }

    const pm = paymentMethods.find(p => p.id === metodePm);
    const metodeInfo = pm?.jenis === 'qris'
      ? `QRIS (${pm.nama_bank})`
      : `Bank: ${pm?.nama_bank || metodePm} | Rek: ${pm?.nomor_rekening || ''}`;

    // Simpan ke DB dulu supaya masuk di dashboard admin
    const { error } = await supabase.from('orders').insert({
      member_id:      'guest',
      tier_member:    'visitor',
      nama_member:    nama.trim(),
      email_member:   email.trim(),
      catatan:        `WA: ${noHp.trim()} | ${metodeInfo}`,
      plan_type:      plan.key,
      diskon_applied: plan.diskon || null,
      status:         'pending',
    });
    if (error) { setErrMsg('Gagal menyimpan pesanan: ' + error.message); return; }

    // Lalu buka WA admin
    const metodeLine = pm
      ? (pm.jenis === 'qris'
          ? `*Metode:* QRIS (${pm.nama_bank}) — scan QR yang dikirim admin`
          : `*Transfer ke:* ${pm.nama_bank} — ${pm.nomor_rekening} a.n. ${pm.nama_rekening}`)
      : '';
    const msg = [
      `Halo Admin, saya ingin membeli Indikator SMC.`,
      ``,
      `*Nama:* ${nama.trim()}`,
      `*Email:* ${email.trim()}`,
      `*No. WA:* ${noHp.trim()}`,
      `*Plan:* ${plan.nama} — Rp ${fmt(hargaDiskon)}`,
      metodeLine,
      ``,
      `Mohon konfirmasi pesanan saya. Terima kasih!`,
    ].filter(Boolean).join('\n');

    const waUrl = `https://wa.me/62${WA_NUMBER.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }
```

Ganti seluruhnya jadi:

```ts
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg('');
    if (!nama.trim() || !email.trim() || !noHp.trim()) { setErrMsg('Semua field wajib diisi.'); return; }
    if (!metodePm) { setErrMsg('Pilih metode pembayaran terlebih dahulu.'); return; }
    if (!plan) { setErrMsg('Plan tidak valid.'); return; }

    setSubmitting(true);

    const pm = paymentMethods.find(p => p.id === metodePm);
    const metodeInfo = pm?.jenis === 'qris'
      ? `QRIS (${pm.nama_bank})`
      : `Bank: ${pm?.nama_bank || metodePm} | Rek: ${pm?.nomor_rekening || ''}`;

    // Cek nama sudah terdaftar sebagai member atau belum
    const { data: existing } = await supabase
      .from('members').select('id').ilike('nama', nama.trim()).single();
    if (existing) {
      setErrMsg('Nama sudah terdaftar. Silakan login atau hubungi admin jika ini akun kamu.');
      setSubmitting(false);
      return;
    }

    // Buat akun member baru (belum aktif — nunggu verifikasi admin)
    const memberPassword = generateMemberPassword();
    const { data: newMember, error: memberErr } = await supabase.from('members').insert({
      nama:      nama.trim(),
      tier:      'SMC Trial',
      password:  memberPassword,
      role:      'member',
      is_active: false,
      is_advance: false,
    }).select('id').single();
    if (memberErr || !newMember) {
      setErrMsg('Gagal membuat akun: ' + (memberErr?.message || 'unknown error'));
      setSubmitting(false);
      return;
    }

    // Simpan order, dikaitkan ke member baru
    const { data: newOrder, error } = await supabase.from('orders').insert({
      member_id:      newMember.id,
      tier_member:    'SMC Trial',
      nama_member:    nama.trim(),
      email_member:   email.trim(),
      catatan:        `WA: ${noHp.trim()} | ${metodeInfo}`,
      plan_type:      plan.key,
      diskon_applied: plan.diskon || null,
      status:         'pending',
    }).select('id').single();
    if (error || !newOrder) {
      setErrMsg('Gagal menyimpan pesanan: ' + (error?.message || 'unknown error'));
      setSubmitting(false);
      return;
    }

    window.location.href = `/bayar/akun?order=${newOrder.id}`;
  }
```

- [ ] **Step 3: Ganti teks info-bayar dan label tombol submit**

Cari:

```tsx
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', fontSize: 13, color: C.dim, lineHeight: 1.6 }}>
              Setelah mengisi form ini, transfer sesuai nominal ke rekening yang dipilih, lalu admin akan konfirmasi via WhatsApp.
            </div>
```

Ganti jadi:

```tsx
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', fontSize: 13, color: C.dim, lineHeight: 1.6 }}>
              Setelah mengisi form ini, kamu akan dapat akun member. Transfer sesuai nominal, lalu konfirmasi ke admin dari halaman berikutnya.
            </div>
```

Cari:

```tsx
            <button
              type="submit"
              style={{
                marginTop: 4,
                fontFamily: '"Geist Mono",monospace',
                padding: '15px 0',
                background: G.gold,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 0.8,
                borderRadius: 8,
              }}>
              KONFIRMASI VIA WHATSAPP →
            </button>
```

Ganti jadi:

```tsx
            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 4,
                fontFamily: '"Geist Mono",monospace',
                padding: '15px 0',
                background: G.gold,
                color: '#fff',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 0.8,
                borderRadius: 8,
              }}>
              {submitting ? 'MEMPROSES...' : 'LANJUTKAN & KONFIRMASI PEMBAYARAN →'}
            </button>
```

- [ ] **Step 4: Verifikasi dengan typecheck**

Run: `npm run typecheck`
Expected: tidak ada error baru terkait `src/pages/BayarPage.tsx` (bandingkan dengan baseline — banyak file lain di proyek ini sudah punya error pre-existing yang tidak terkait; fokus hanya pada baris yang barusan diedit).

- [ ] **Step 5: Verifikasi manual**

Run: `npm run dev`, buka `/bayar?plan=bulanan`.
- Isi form dengan nama BARU (belum pernah dipakai), pilih metode pembayaran, klik "LANJUTKAN & KONFIRMASI PEMBAYARAN →".
- Harus redirect ke `/bayar/akun?order=<uuid>` (halaman ini belum ada sampai Task 3 selesai — untuk sekarang cukup pastikan URL browser berubah dan tidak ada error di console; halaman akan blank/404 karena route belum ada, itu wajar untuk tahap ini).
- Cek di Supabase (lewat Admin Panel → Member) ada baris member baru dengan nama yang diisi tadi, `tier: SMC Trial`, `is_active: false`.
- Cek di Admin Panel → Produk → Pesanan Masuk ada order baru dengan nama yang sama dan `tier_member: SMC Trial`.
- Ulangi submit dengan NAMA YANG SAMA PERSIS → harus muncul error inline "Nama sudah terdaftar..." dan TIDAK ada member/order baru dibuat (cek jumlah member tidak nambah).

- [ ] **Step 6: Commit**

```bash
git add src/pages/BayarPage.tsx
git commit -m "feat: buat akun member otomatis saat submit form /bayar"
```

---

### Task 2: Halaman baru `src/pages/BayarAkunPage.tsx`

**Files:**
- Create: `src/pages/BayarAkunPage.tsx`

**Interfaces:**
- Consumes: query param `?order=<uuid>` dari URL (diproduksi oleh Task 1's redirect). Membaca tabel `orders` (kolom `id, member_id, nama_member, email_member, plan_type, diskon_applied, catatan`) dan `members` (kolom `nama, password`) lewat `supabase` client dari `src/lib/supabase.ts`.
- Produces: default export `BayarAkunPage` (komponen React tanpa props) — dikonsumsi oleh Task 3 di `App.tsx`.

- [ ] **Step 1: Tulis file lengkap**

```tsx
// pages/BayarAkunPage.tsx — Halaman kredensial akun setelah submit form /bayar
// URL: /bayar/akun?order=<uuid>

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { WA_NUMBER } from '../constants';

const C = {
  bg:      'var(--mr-bg)',
  panel:   'var(--mr-panel)',
  text:    'var(--mr-text)',
  border:  'var(--mr-border)',
  border2: 'var(--mr-border2)',
  dim:     'var(--mr-dim)',
  dimmer:  'var(--mr-dimmer)',
};
const G = { gold: 'var(--mr-gold)', up: 'var(--mr-up)', down: 'var(--mr-down)' };

interface OrderRow {
  id: string;
  member_id: string | null;
  nama_member: string;
  email_member: string;
  plan_type: string;
  diskon_applied: number | null;
  catatan: string | null;
}
interface MemberRow {
  nama: string;
  password: string;
}

export default function BayarAkunPage() {
  const orderId = new URLSearchParams(window.location.search).get('order');

  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [order, setOrder]       = useState<OrderRow | null>(null);
  const [member, setMember]     = useState<MemberRow | null>(null);
  const [copied, setCopied]     = useState<'nama' | 'password' | ''>('');

  useEffect(() => {
    async function load() {
      if (!orderId) { setNotFound(true); setLoading(false); return; }

      const { data: o } = await supabase
        .from('orders')
        .select('id, member_id, nama_member, email_member, plan_type, diskon_applied, catatan')
        .eq('id', orderId)
        .single();
      if (!o || !o.member_id) { setNotFound(true); setLoading(false); return; }

      const { data: m } = await supabase
        .from('members')
        .select('nama, password')
        .eq('id', o.member_id)
        .single();
      if (!m) { setNotFound(true); setLoading(false); return; }

      setOrder(o as OrderRow);
      setMember(m as MemberRow);
      setLoading(false);
    }
    load();
  }, [orderId]);

  function copy(field: 'nama' | 'password', value: string) {
    navigator.clipboard?.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  }

  function konfirmasiWA() {
    if (!order) return;
    const msg = [
      `Halo Admin, saya sudah isi data pembelian Indikator SMC.`,
      ``,
      `*Nama:* ${order.nama_member}`,
      `*Order ID:* ${order.id}`,
      `*Plan:* ${order.plan_type}`,
      `*Catatan:* ${order.catatan || '-'}`,
      ``,
      `Mohon konfirmasi pembayaran saya dan aktifkan akun member saya ya. Terima kasih!`,
    ].join('\n');
    const waUrl = `https://wa.me/62${WA_NUMBER.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontFamily: '"Geist Mono",monospace', fontSize: 13 }}>
      Memuat...
    </div>
  );

  if (notFound || !order || !member) return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"Geist",system-ui,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, textAlign: 'center' as const }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Data pesanan tidak ditemukan</div>
        <div style={{ color: C.dim, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          Link ini mungkin salah atau sudah tidak berlaku. Silakan ulangi dari halaman pembayaran.
        </div>
        <button onClick={() => window.location.href = '/bayar'}
          style={{ fontFamily: '"Geist Mono",monospace', background: G.gold, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
          ← KEMBALI KE /BAYAR
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"Geist",system-ui,sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '14px 24px' }}>
        <span style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 11, letterSpacing: 0.8 }}>// AKUN MEMBER</span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>Akun Kamu Sudah Dibuat!</div>
        </div>

        {/* Kartu kredensial */}
        <div style={{ background: G.gold + '0d', border: `1px solid ${G.gold}33`, borderRadius: 10, padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 14 }}>// KREDENSIAL LOGIN</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 10, color: C.dim, marginBottom: 4 }}>USERNAME (NAMA LENGKAP)</div>
            <div onClick={() => copy('nama', member.nama)} title="Klik untuk salin"
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>
              {member.nama}
              <span style={{ fontFamily: '"Geist Mono",monospace', fontSize: 10, color: copied === 'nama' ? G.up : C.dim }}>{copied === 'nama' ? '✓ disalin' : '⎘ salin'}</span>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 10, color: C.dim, marginBottom: 4 }}>PASSWORD</div>
            <div onClick={() => copy('password', member.password)} title="Klik untuk salin"
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: '"Geist Mono",monospace', fontSize: 20, fontWeight: 700, letterSpacing: 1.5, color: G.gold, cursor: 'pointer' }}>
              {member.password}
              <span style={{ fontFamily: '"Geist Mono",monospace', fontSize: 10, color: copied === 'password' ? G.up : C.dim }}>{copied === 'password' ? '✓ disalin' : '⎘ salin'}</span>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 10, color: C.dim, marginBottom: 4 }}>TIER</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>SMC Trial</div>
          </div>
        </div>

        {/* Warning */}
        <div style={{ background: '#3a2800', border: '1px solid #5a4000', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#d4a853', lineHeight: 1.6, marginBottom: 24 }}>
          ⚠ Simpan username & password ini baik-baik. Login baru bisa dipakai setelah admin memverifikasi pembayaran kamu (biasanya dalam beberapa saat setelah konfirmasi WhatsApp).
        </div>

        {/* Ringkasan order */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 24, fontSize: 12, color: C.dim, display: 'grid', gap: 6 }}>
          <div>Order ID: <span style={{ color: C.text, fontFamily: '"Geist Mono",monospace' }}>{order.id}</span></div>
          <div>Plan: <span style={{ color: C.text }}>{order.plan_type}</span></div>
          <div>Email: <span style={{ color: C.text }}>{order.email_member}</span></div>
        </div>

        <button onClick={konfirmasiWA}
          style={{ width: '100%', fontFamily: '"Geist Mono",monospace', padding: '15px 0', background: G.gold, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, letterSpacing: 0.8, borderRadius: 8, marginBottom: 14 }}>
          KONFIRMASI VIA WHATSAPP →
        </button>

        <div style={{ textAlign: 'center' as const }}>
          <a href="/login" style={{ fontFamily: '"Geist Mono",monospace', fontSize: 12, color: C.dim, textDecoration: 'underline' }}>Ke Halaman Login →</a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verifikasi dengan typecheck**

Run: `npm run typecheck`
Expected: tidak ada error baru terkait `src/pages/BayarAkunPage.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/BayarAkunPage.tsx
git commit -m "feat: tambah halaman kredensial akun /bayar/akun"
```

---

### Task 3: Routing — daftarkan `/bayar/akun` di `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `BayarAkunPage` default export dari Task 2 (`src/pages/BayarAkunPage.tsx`).

- [ ] **Step 1: Tambah import**

Cari baris:

```ts
import BayarPage from './pages/BayarPage';
```

Ganti jadi:

```ts
import BayarPage from './pages/BayarPage';
import BayarAkunPage from './pages/BayarAkunPage';
```

- [ ] **Step 2: Tambah route di `getPage()`**

Cari baris:

```ts
  if (path === '/bayar')                  return 'bayar';
```

Ganti jadi:

```ts
  if (path === '/bayar')                  return 'bayar';
  if (path === '/bayar/akun')             return 'bayar-akun';
```

- [ ] **Step 3: Tambah render di `App()`**

Cari baris:

```tsx
  if (page === 'bayar')             return <BayarPage />;
```

Ganti jadi:

```tsx
  if (page === 'bayar')             return <BayarPage />;
  if (page === 'bayar-akun')        return <BayarAkunPage />;
```

- [ ] **Step 4: Verifikasi dengan typecheck**

Run: `npm run typecheck`
Expected: tidak ada error baru terkait `src/App.tsx`.

- [ ] **Step 5: Verifikasi manual end-to-end**

Run: `npm run dev`. Ulangi alur lengkap:
1. Buka `/bayar?plan=bulanan`, isi form dengan nama baru, pilih metode pembayaran, submit.
2. Harus mendarat di `/bayar/akun?order=<uuid>` dan menampilkan Username, Password, Tier SMC Trial, warning box, ringkasan order.
3. Klik tombol salin di Username dan Password → label berubah jadi "✓ disalin" sesaat.
4. Klik "KONFIRMASI VIA WHATSAPP →" → tab/window baru wa.me terbuka dengan pesan berisi nama, order id, plan, catatan.
5. Klik "Ke Halaman Login →" → mendarat di `/login`.
6. Buka `/bayar/akun` TANPA query param `order` → harus tampil kartu "Data pesanan tidak ditemukan" + tombol kembali ke `/bayar`.
7. Cek Admin Panel → Member: member baru berstatus non-aktif. Klik badge is_active untuk aktifkan.
8. Login di `/login` pakai Nama (persis seperti yang diisi), Tier "SMC Trial", Password dari halaman kredensial → berhasil masuk ke `/member`.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: daftarkan route /bayar/akun"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (alur) → tercermin di urutan Task 1→2→3 dan langkah verifikasi manual gabungan di Task 3 Step 5. Section 2 (`BayarPage.tsx`) → Task 1. Section 3 (`BayarAkunPage.tsx`) → Task 2. Section 4 (routing) → Task 3. Section 5 (dampak data) → tercermin di kode Task 1 (`tier: 'SMC Trial'`, `role: 'member'`, `member_id` asli). Section 6 (error handling) → tercermin di Task 1 Step 2 (cek nama ganda, gagal insert member, gagal insert order) dan Task 2 Step 1 (`notFound` state). Section 7 (out of scope) — tidak ada task yang menambahkannya, sesuai rencana.
- **Placeholder scan:** semua step berisi kode lengkap yang bisa langsung ditempel; tidak ada "TBD"/"tambahkan validasi di sini".
- **Konsistensi tipe:** `OrderRow`/`MemberRow` di Task 2 memakai nama kolom persis sama dengan yang di-insert di Task 1 (`member_id`, `tier_member` tidak dibaca ulang karena tidak dipakai di halaman kredensial — sengaja tidak di-select supaya query minimal). Nama fungsi `generateMemberPassword` konsisten dipakai hanya di Task 1 (tidak diekspor/dipakai file lain).
