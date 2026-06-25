# Design: Landing Page Preview Section + Payment Page

Date: 2026-06-25

## Overview

Tambah section baru di landing page yang menampilkan video preview YouTube (autoplay) dan 3 kartu harga (Bulanan/Tahunan/Lifetime) dalam IDR. Admin bisa konfigurasi dari dashboard. Klik kartu → payment page baru untuk visitor non-member.

---

## 1. Database

### Tabel baru: `landing_preview_config`

Singleton — selalu tepat 1 baris (`id = 1`). Upsert on save.

```sql
create table landing_preview_config (
  id               int primary key default 1,
  yt_url           text,
  plan1_nama       text not null default 'Bulanan',
  plan1_harga_asli int  not null default 0,
  plan1_diskon     int  not null default 0,  -- persen 0–100
  plan2_nama       text not null default 'Tahunan',
  plan2_harga_asli int  not null default 0,
  plan2_diskon     int  not null default 0,
  plan3_nama       text not null default 'Lifetime',
  plan3_harga_asli int  not null default 0,
  plan3_diskon     int  not null default 0,
  updated_at       timestamptz default now()
);

-- RLS: semua using(true)/with check(true) sesuai pola project
alter table landing_preview_config enable row level security;
create policy "select all" on landing_preview_config for select using (true);
create policy "insert all" on landing_preview_config for insert with check (true);
create policy "update all" on landing_preview_config for update using (true) with check (true);
```

Migration file: `supabase-landing-preview-migration.sql`

### Tabel `orders` (sudah ada)

Order dari payment page baru menggunakan kolom yang sudah ada:
- `plan_type`: `'bulanan' | 'tahunan' | 'lifetime'`
- `nama`, `email`, `no_hp` (atau field yang tersedia)
- `status`: `'pending'`
- `kode_diskon`, `diskon_applied`: kosong/null untuk alur ini

---

## 2. Landing Page Section (`ProductPreview`)

**File:** `src/pages/LandingPage.tsx` — tambah fungsi `ProductPreview` baru.

**Posisi di render tree:** Antara `<StatsBar>` dan `<Pricing tiers={tiers} />`.

**Data fetch:** Hook baru `useLandingPreview()` di `src/hooks/index.ts` — query `landing_preview_config` where `id = 1`. Return null jika belum dikonfigurasi admin (section tidak render).

### Layout

```
section#preview-produk
  ├── header: "// PREVIEW PLATFORM" + heading
  ├── YouTube iframe (16:9, max-width 860px, centered)
  │     src: https://www.youtube.com/embed/{videoId}
  │          ?autoplay=1&mute=1&loop=1&playlist={videoId}&controls=0
  └── pricing cards row (3 kartu)
        ├── Plan 1 (Bulanan)  — border normal
        ├── Plan 2 (Tahunan)  — border --mr-gold, badge "Paling Populer" hardcoded
        └── Plan 3 (Lifetime) — border normal
```

### Tiap kartu menampilkan

- Nama plan
- Harga asli dicoret: `Rp xxx.xxx`
- Harga diskon (hijau): `Rp xxx.xxx` — dihitung `harga_asli * (1 - diskon/100)`, dibulatkan
- Persentase hemat: `Hemat X%`
- Tombol CTA → `window.location.href = '/bayar?plan=bulanan'`

### YouTube embed

Ekstrak `videoId` dari URL dengan regex:
```ts
const videoId = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/)?.[1];
```
Jika `videoId` null atau `yt_url` kosong, iframe tidak dirender (hanya kartu harga yang tampil).

### Responsif

- Desktop: 3 kartu grid `repeat(3, 1fr)`, video full-width dalam container
- Mobile (`max-width: 767px`): kartu stack vertikal `1fr`, video tetap 16:9

---

## 3. Admin UI

**File:** `src/pages/AdminPage.tsx` — tambah sub-section "Preview Landing Page" di tab `produk`, posisi di atas daftar produk indikator yang sudah ada.

### Form fields

- Input teks: Link YouTube Preview
- 3 kolom (Bulanan / Tahunan / Lifetime), tiap kolom:
  - Nama Plan (text input)
  - Harga Asli (number input, dalam Rupiah)
  - Diskon % (number input, 0–100)
  - Preview harga otomatis (kalkulasi live di UI, tidak disimpan)

### Behaviour

- Load: fetch `landing_preview_config` where `id = 1` saat tab `produk` dibuka
- Simpan: upsert dengan `id = 1`
- Validasi: diskon 0–100, harga asli ≥ 0
- Setelah simpan: `logActivity('Update Preview Landing', 'Konfigurasi preview diperbarui', adminName)`

---

## 4. Payment Page Baru (`BayarPage`)

**File baru:** `src/pages/BayarPage.tsx`

**Route:** `/bayar` (ditambah di `src/App.tsx`)

**URL param:** `?plan=bulanan | tahunan | lifetime`

### Data

- Fetch `landing_preview_config` untuk tampilkan ringkasan harga sesuai plan di param
- Fetch `payment_methods` (tabel yang sudah ada) untuk pilihan pembayaran

### Alur

1. Tampil ringkasan: nama plan, harga asli (coret), harga diskon, nominal hemat
2. Form data pemesan: Nama Lengkap, Email, No. WhatsApp
3. Pilih metode pembayaran (grid dari `payment_methods`)
4. Submit → insert ke `orders`:
   ```ts
   {
     plan_type: 'bulanan' | 'tahunan' | 'lifetime',
     total: harga_diskon,
     diskon_applied: diskon_persen,
     status: 'pending',
     // + data pemesan
   }
   ```
5. Redirect ke `/bayar/konfirmasi` atau tampil inline: pesan sukses + instruksi cek WA

### Tidak perlu session

Halaman ini untuk visitor (belum login). Tidak ada `mr_session` check.

### Style

Ikuti pola `C`/`G` constants seperti halaman besar lain. Tidak import `MR` dari theme.ts.

---

## 5. File Changes Summary

| File | Aksi |
|---|---|
| `supabase-landing-preview-migration.sql` | Buat baru — DDL tabel |
| `src/hooks/index.ts` | Tambah `useLandingPreview()` hook |
| `src/pages/LandingPage.tsx` | Tambah fungsi `ProductPreview`, render di antara StatsBar dan Pricing |
| `src/pages/AdminPage.tsx` | Tambah sub-section form di tab `produk` |
| `src/pages/BayarPage.tsx` | Buat baru — payment page untuk visitor |
| `src/App.tsx` | Tambah route `/bayar` → `BayarPage` |

---

## 6. Out of Scope

- Notifikasi WhatsApp / email otomatis setelah order
- Konfirmasi pembayaran otomatis
- Integrasi payment gateway
- Admin approval flow untuk order dari BayarPage (bisa pakai admin panel produk tab `orders` yang sudah ada)
