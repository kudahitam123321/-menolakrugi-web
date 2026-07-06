# Design: Tabel Perbandingan Fitur untuk `TierPricing` di `/pricing-kelas`

Date: 2026-07-06

## Overview

Komponen `TierPricing` di `src/pages/PricingKelasPage.tsx` (grid 4 kartu, tiap kartu menampilkan 5 perks bebas milik tier masing-masing) diganti dengan tabel perbandingan fitur bergaya referensi yang diberikan user (harga di header kolom, kolom "Populer" gelap menonjol di tengah, baris fitur bersama dengan tanda centang per kolom, baris tombol CTA di bawah).

**Referensi visual**: user memberi contoh HTML/Tailwind (template hosting: Free/Team/Popular/Enterprise, baris fitur seperti "Website number", "Server storage" dengan nilai/centang beda per kolom) dan screenshot. Desain di bawah mengadaptasi *bentuk* tabel itu, bukan replikasi 1:1 — warna diganti ke palet hijau brand (`LP.primary`), dan konten baris fitur direinterpretasi dari data `perks` yang sudah ada (dijelaskan di bawah), karena data kita tidak berbentuk feature-matrix per tier seperti contoh hosting.

## Keputusan Kunci

- **Hanya `TierPricing` di `src/pages/PricingKelasPage.tsx` yang diganti.** `Curriculum`, routing, halaman lain — tidak disentuh.
- **Data tier tetap dari `usePricing()`** (`tiers: PricingTier[]`, real data dari `pricing_tiers` + fallback) — harga, nama, badge, `is_featured` tetap dipakai apa adanya.
- **8 baris fitur bersama, hardcoded** sebagai const lokal `FEATURE_ROWS`, di-key oleh `tier.id` (`'trial' | 'bronze' | 'gold' | 'platinum'`) — bukan derivasi otomatis dari `tier.perks` (yang teksnya bebas/tidak seragam), tapi ditelusuri manual dari makna `perks` yang sudah ada:

  | # | Fitur | Trial | Bronze | Gold | Platinum |
  |---|---|---|---|---|---|
  | 1 | Materi Dasar SMC (struktur, candle, baca chart) | ✓ | ✓ | ✓ | ✓ |
  | 2 | Materi SMC Lengkap (BOS, IDM, Order Block, Daily Bias) | – | ✓ | ✓ | ✓ |
  | 3 | Live Session Q&A Mingguan | – | ✓ | ✓ | ✓ |
  | 4 | Live Mentoring 2×/Minggu | – | – | ✓ | ✓ |
  | 5 | Evaluasi Trading Mingguan | – | – | ✓ | ✓ |
  | 6 | Channel Funded Trader (Prop Firm) | – | – | ✓ | ✓ |
  | 7 | Sesi 1-on-1 Privat dengan Mentor | – | – | – | ✓ |
  | 8 | Kurikulum Personal | – | – | – | ✓ |

  **Batasan yang diterima secara sadar**: mapping ini di-key by tier id string (`'trial'`/`'bronze'`/`'gold'`/`'platinum'`), bukan dari kolom database manapun. Ini konsisten dengan asumsi yang sudah ada di seluruh app (4 tier ini nama/id-nya tetap — lihat `CLAUDE.md` "Tier System", `SignupPage.tsx`, `PRICING_FALLBACK` di `src/hooks/index.ts`) — tidak butuh fallback khusus untuk tier id lain karena app ini tidak pernah punya tier di luar 4 itu.
- **Kolom "Populer" = tier dengan `is_featured === true`** (saat ini Gold) — bukan hardcoded posisi kolom ke-3, supaya tetap benar kalau admin ubah `is_featured` di tabel `pricing_tiers`. Kolom ini dapat background gelap (`LP.text`, sudah dekat hitam: `#0F172A`), teks putih, badge pill "POPULER" pakai `LP.primary`.
- **Satu warna aksen** dipakai konsisten (`LP.primary`, hijau brand) untuk badge "Populer", checkmark, dan tombol CTA kolom populer — tidak menambah warna oranye/biru baru dari referensi asli, supaya konsisten dengan palet yang sudah dipakai di seluruh halaman ini dan situs.
- **Desktop (`!isMobile`)**: elemen `<table>` semantik sungguhan (bukan grid div), kolom = tier, baris = 8 fitur + baris CTA di akhir. Struktur: `<thead>` (nama tier + badge + harga), `<tbody>` (8 baris fitur dengan ikon `Check` dari `lucide-react` untuk yang tersedia, tanda "–" untuk yang tidak — bukan ikon silang merah, supaya tetap terasa positif), baris terakhir tombol "Pilih {tag} →" per kolom (perilaku klik sama persis seperti sekarang: `window.location.href = /signup?tier=${tier.id}`).
- **Mobile (`isMobile`)**: tetap 1 kartu per tier ditumpuk vertikal (pola yang sudah ada di halaman ini), tapi badan kartu sekarang menampilkan ke-8 baris fitur (dengan ikon centang/dash yang sama) menggantikan `tier.perks.slice(0,5)` — bukan meniru grid 4-kolom-mepet dari referensi (itu tidak dipakai, supaya konsisten dengan pola mobile-stack yang sudah ada di aplikasi ini).
- **Loading state** (`usePricing()` masih loading) tetap sama seperti sekarang ("Memuat...").

## Error Handling

Tidak ada Supabase call baru — komponen ini murni presentational di atas `tiers` yang sudah di-fetch oleh `usePricing()` (sudah ada fallback `PRICING_FALLBACK` di level hook kalau tabel kosong/error, tidak berubah). Kalau suatu saat ada tier dengan `id` di luar 4 yang dikenal (skenario yang secara sadar tidak ditangani di atas), baris fiturnya akan tampil semua "–" (tidak crash, `FEATURE_ROWS[i].included[tier.id]` bernilai `undefined` → falsy → dianggap tidak termasuk).

## Testing / Verifikasi

Tidak ada test suite di proyek ini. Verifikasi manual:
1. `npm run typecheck` — 0 error baru di `PricingKelasPage.tsx`.
2. `npm run dev` → buka `/pricing-kelas` desktop: tabel 4 kolom tampil, kolom Gold gelap dengan badge "POPULER", 8 baris fitur dengan centang/dash sesuai tabel di atas, tombol "Pilih ... →" tiap kolom mengarah ke `/signup?tier=<id>` yang benar.
3. Resize ke lebar mobile (atau devtools responsive): tampilan berubah jadi kartu bertumpuk, tiap kartu tampilkan 8 baris fitur yang sama.
4. `npm run build` sukses.

## Ringkasan File yang Disentuh

| File | Perubahan |
|---|---|
| `src/pages/PricingKelasPage.tsx` | Ganti total isi fungsi `TierPricing` (tambah const `FEATURE_ROWS`, import `Check` dari `lucide-react`) — sisa file (`Curriculum`, `PricingKelasPage`, dll.) tidak berubah |
