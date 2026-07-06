# Design: Tanggal Jatuh Tempo Order Produk (Bulanan/Tahunan)

Date: 2026-07-06

## Overview

Order produk indikator dengan `plan_type` `bulanan` atau `tahunan` sekarang tidak punya informasi kapan masa aktifnya berakhir — admin dan member cuma lihat tanggal order dibuat (`created_at`). Fitur ini menambahkan tanggal jatuh tempo otomatis: dihitung dari kapan order **diaktifkan** (bukan dari kapan order dibuat), supaya adil buat customer yang baru dikonfirmasi pembayarannya beberapa hari setelah order masuk.

## Keputusan Kunci

- **Basis hitung: `activated_at`**, bukan `created_at`. Kolom baru `orders.activated_at` (timestamptz, nullable) diisi otomatis oleh `updateOrderStatus()` di `AdminPage.tsx` setiap kali admin mengubah status order jadi `'aktif'` (termasuk kalau ini reaktivasi/perpanjangan — tiap kali status di-set ke `'aktif'`, `activated_at` di-update ke waktu saat itu, me-reset hitungan mundur untuk periode baru).
- **Jatuh tempo dihitung di frontend, tidak disimpan sebagai kolom terpisah** — pola ini konsisten dengan cara "sisa hari Trial" sudah dihitung di `member/DashboardPage.tsx` (`expiryDate`/`isExpired`/`daysLeft`, baris ~966-974): murni derivasi dari data yang ada, dihitung ulang tiap render.
- **Aturan per `plan_type`**:
  - `bulanan` → `activated_at` + 1 bulan (`date.setMonth(date.getMonth() + 1)`)
  - `tahunan` → `activated_at` + 1 tahun (`date.setFullYear(date.getFullYear() + 1)`)
  - `lifetime` (atau `plan_type` kosong/null) → tidak ada jatuh tempo, tampilkan "Seumur Hidup"
  - `activated_at` belum ada (order belum pernah di-set Aktif setelah fitur ini ada) → tampilkan "—"
- **Perilaku edge-case tanggal diterima apa adanya** (bukan bug yang perlu ditangani): `setMonth`/`setFullYear` bawaan JavaScript kalau tanggal asal tidak ada di bulan/tahun tujuan (mis. aktivasi 31 Januari + 1 bulan → otomatis jadi awal Maret, karena 31 Februari tidak ada) akan roll-over secara natural. Ini jarang terjadi dan tidak di-clamp secara khusus.
- **Highlight visual kalau sudah lewat jatuh tempo**: teks tanggal jatuh tempo diberi warna "danger"/merah kalau tanggal yang dihitung sudah lewat dari sekarang — murni visual, **tidak** mengubah `status` order secara otomatis (tetap manual, keputusan admin).
- **Ditampilkan di 2 tempat**: Admin Panel tab Produk → section "Pesanan Masuk" (`AdminPage.tsx`), dan Member Dashboard tab Produk → sub-tab "Pesanan Saya" (`src/pages/member/DashboardPage.tsx`). Keduanya baris baru persis di bawah baris tanggal transaksi (`created_at`) yang sudah ada.
- **Fungsi hitung didefinisikan lokal di masing-masing file** (bukan util bersama) — konsisten dengan konvensi codebase ini (file besar mendefinisikan helper lokal sendiri, lihat `CLAUDE.md` "Inline style pattern" dan preseden `useInView`/`useFadeUp` yang sengaja diduplikasi antara `LandingPage.tsx` dan `PricingKelasPage.tsx` di kerjaan sebelumnya).

## Data Model

Migrasi baru (mengikuti pola migrasi per-fitur yang sudah ada, mis. `supabase-broker-logo-migration.sql`): `supabase-orders-activated-at-migration.sql`

```sql
alter table orders add column if not exists activated_at timestamptz;
```

Tidak ada perubahan kolom lain, tidak ada backfill untuk order lama (sesuai keputusan: order lama yang sudah `'aktif'` sebelum migrasi ini tetap tampil "—" sampai admin toggle ulang statusnya).

## Perubahan Kode

### `src/pages/AdminPage.tsx`

- `updateOrderStatus(orderId, newStatus)` ([AdminPage.tsx:1727](src/pages/AdminPage.tsx#L1727)): payload update dibangun secara kondisional — kunci `activated_at` cuma ditambahkan ke object payload kalau `newStatus === 'aktif'`, supaya kalau admin set status ke selain `'aktif'` (mis. `'pending'`), kolom `activated_at` yang sudah ada tidak ikut ke-update/ter-reset (bukan dikirim `undefined` di dalam ternary — dibangun eksplisit lewat `if`, supaya tidak bergantung pada perilaku implisit "undefined hilang saat JSON.stringify"):
  ```ts
  async function updateOrderStatus(orderId: string, newStatus: string) {
    const payload: { status: string; catatan: string | null; activated_at?: string } = {
      status: newStatus,
      catatan: orderCatatanMap[orderId] ?? null,
    };
    if (newStatus === 'aktif') payload.activated_at = new Date().toISOString();
    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Status pesanan diperbarui!'); loadData(); }
  }
  ```
- Section "PESANAN MASUK" ([AdminPage.tsx:3291](src/pages/AdminPage.tsx#L3291) area): tambah baris baru di bawah baris tanggal transaksi, menampilkan hasil fungsi `hitungJatuhTempo(o.activated_at, o.plan_type)`.
- Warna teks: pola warna file ini pakai hex literal langsung (bukan token `LP`) — jatuh tempo yang sudah lewat pakai `#ef4444` (warna yang sama dipakai tombol HAPUS di file ini), yang belum lewat pakai abu-abu netral yang sudah dipakai baris tanggal transaksi (`#444`).

### `src/pages/member/DashboardPage.tsx`

- Section "Pesanan Saya" ([DashboardPage.tsx:2607-2634](src/pages/member/DashboardPage.tsx#L2607-L2634)): tambah baris baru di bawah baris tanggal transaksi (baris ~2621), menampilkan hasil fungsi `hitungJatuhTempo(o.activated_at, o.plan_type)` yang sama (fungsi didefinisikan lokal di file ini, bukan import dari `AdminPage.tsx`).
- Warna teks: file ini pakai token `LP` — jatuh tempo yang sudah lewat pakai `LP.danger`, yang belum lewat pakai `LP.muted` (sama seperti baris tanggal transaksi yang sudah ada).
- Tidak perlu ubah query Supabase di kedua file — keduanya sudah `select('*, products(...))'`, jadi `activated_at` otomatis ikut terbaca begitu kolomnya ada.

### Fungsi `hitungJatuhTempo` (didefinisikan identik di kedua file)

```ts
function hitungJatuhTempo(activatedAt: string | null, planType: string | null): Date | null {
  if (!activatedAt || !planType || planType === 'lifetime') return null;
  const d = new Date(activatedAt);
  if (planType === 'bulanan') { d.setMonth(d.getMonth() + 1); return d; }
  if (planType === 'tahunan') { d.setFullYear(d.getFullYear() + 1); return d; }
  return null;
}
```

## Di Luar Scope

- Tidak ada auto-perubahan `status` order (mis. dari `'aktif'` ke status lain) saat tanggal jatuh tempo lewat — itu keputusan manual admin, sistem cuma menampilkan tanggalnya.
- Tidak ada notifikasi/reminder (WA, email, in-app) menjelang jatuh tempo — kalau dibutuhkan nanti, itu fitur terpisah.
- Tidak ada perubahan pada order membership tier (`/signup`→`/payment`) — fitur ini khusus order produk indikator (`orders` yang punya `plan_type` bulanan/tahunan/lifetime, dari `/bayar` dan tab Produk dashboard).

## Error Handling

Tidak ada error baru yang mungkin muncul — `hitungJatuhTempo` murni fungsi kalkulasi tanpa I/O, aman dipanggil dengan `activated_at`/`plan_type` apapun (termasuk `null`/`undefined`) karena early-return di awal fungsi.

## Testing / Verifikasi

Tidak ada test suite di proyek ini. Verifikasi manual:
1. `npm run typecheck` — 0 error baru di `AdminPage.tsx` dan `member/DashboardPage.tsx`.
2. Jalankan migrasi `supabase-orders-activated-at-migration.sql` di Supabase SQL Editor.
3. `npm run dev` → Admin Panel tab Produk, ubah status salah satu order (plan `bulanan`) jadi "Aktif" → cek baris jatuh tempo muncul, tanggalnya = hari ini + 1 bulan.
4. Login sebagai member pemilik order itu → tab Produk → Pesanan Saya → cek tanggal jatuh tempo yang sama muncul.
5. Cek order dengan `plan_type` `lifetime` menampilkan "Seumur Hidup", dan order lama (belum pernah di-set Aktif setelah migrasi) menampilkan "—".
6. `npm run build` sukses.

## Ringkasan File yang Disentuh

| File | Perubahan |
|---|---|
| `supabase-orders-activated-at-migration.sql` | **Baru** — migrasi tambah kolom `activated_at` |
| `src/pages/AdminPage.tsx` | `updateOrderStatus` set `activated_at`, tambah baris jatuh tempo di Pesanan Masuk |
| `src/pages/member/DashboardPage.tsx` | Tambah baris jatuh tempo di Pesanan Saya |
