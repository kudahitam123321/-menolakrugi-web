# Design: Revamp Visual Dashboard Member — Fase 2 (Kelas Saya, Materi, Chart)

Date: 2026-07-05

## Overview

Fase 1 (`docs/superpowers/specs/2026-07-05-dashboard-shell-revamp-design.md`) merestyle shell (topbar + sidebar) dan tab `dashboard` di `src/pages/member/DashboardPage.tsx` dari dark-terminal ke tema terang. 17 tab lain masih dark-terminal, disengaja, dan direncanakan bertahap.

Spec ini adalah **Fase 2**, mencakup 3 tab dari kelompok "Belajar": `kelas` (Kelas Saya), `materi` (File Materi), dan `news` (Chart). 14 tab sisanya (`jurnal`, `trading-plan`, `komunitas`, `tools`, `produk`, `funded`, `peringkat`, `competition`, `sertifikat`, `1on1`, `ulasan`, `referral`, `pengaturan`, `bantuan`) tetap dark-terminal, di luar scope fase ini.

---

## 1. Keputusan Kunci

- **Reuse pola & token dari Fase 1 sepenuhnya** — `LP` token object (sudah ada di file ini sejak Fase 1 Task 1), tidak ada token baru. Tab-tab ini dikunci terang, konsisten dengan shell & tab `dashboard`.
- **Tidak menyentuh logic/data sama sekali** — semua query Supabase (`member_progress` upsert, `trackVideoWatch`, `rateVideo`), state (`showAdvModal`, `jurnal1/2/3`, `jurnalMode`, `jurnalFiles`, `advMsg`, `advSubmitting`, `videoRatings`, `watchRefreshKey`), dan computed values (`vids`, `done`, `pct`, `locked`) dipertahankan persis — murni restyle presentasi + ganti emoji jadi ikon lucide.
- **Ikon emoji struktural diganti `lucide-react`** (tabel lengkap di §3). Emoji ekspresif dalam kalimat (kalau ada) dibiarkan, konsisten dengan aturan Fase 1.
- **Tab `active === 'live'` ("Live Trading") TIDAK disentuh** — kode-nya ada di file (antara `materi` dan `news`) tapi tidak ada entry `id: 'live'` di array `SIDEBAR`, jadi tidak bisa diakses dari navigasi manapun. Ini kemungkinan sisa kode lama yang sudah tidak dipakai (mirip kasus "Mobile Bottom Nav" yang ditemukan di Fase 1). Dibiarkan dark-terminal apa adanya, tidak dihapus, tidak direstyle — di luar scope.
- **Komponen `AdvancedChartWidget`** (dipakai di tab `news`/Chart) adalah komponen terpisah (TradingView embed) — **tidak disentuh**, hanya wrapper card/header di sekitarnya yang direstyle.

---

## 2. Pemetaan Perubahan

### 2a. Tab `kelas` (Kelas Saya) — baris ±1614-1813 di kondisi saat ini

Isi yang direstyle (struktur/logic tidak berubah):
- Header ("Kelas Saya" / "Kurikulum Saya")
- Modal "Request Naik Kelas Advanced": deskripsi, 3 slot jurnal (toggle link/file, input link, file picker, tombol hapus file), pesan error, tombol kirim/batal
- Grid kurikulum per kategori (`intro`/`basic`/`tips-basic`/`advanced`/`tips-advanced`): card per kategori dengan progress bar, badge lock (kalau `locked`), status request advance (pending/rejected/belum), dan daftar video (status icon, judul, deskripsi, badge "SEGERA", tombol Tonton/Selesai/Reset, rating bintang)

### 2b. Tab `materi` (File Materi) — baris ±1816-1882

Isi yang direstyle:
- Header + deskripsi
- Card per kategori file (`file-basic`, `file-advanced`): daftar file dengan ikon per tipe file, judul, nama file, tombol download
- Empty state ("Belum ada file materi")

### 2c. Tab `news` (Chart) — baris ±1940-1956

Isi yang direstyle:
- Header card (label + "POWERED BY TRADINGVIEW")
- Wrapper card di sekitar `<AdvancedChartWidget/>` (komponennya sendiri tidak disentuh)

---

## 3. Pemetaan Ikon

| Konteks | Emoji lama | Ikon lucide baru |
|---|---|---|
| Toggle mode jurnal — Link | 🔗 | `Link2` |
| Toggle mode jurnal — File | 📎 | `Paperclip` |
| File jurnal terpilih (prefix nama file) | ✓ | `Check` |
| Kategori terkunci (butuh Advance) | 🔒 | `Lock` |
| Status "request sedang direview" | ⏳ | `Clock` |
| Status "request ditolak" | ❌ | `XCircle` |
| Status video: selesai | ✓ (dalam lingkaran) | `Check` |
| Status video: sedang ditonton | ▶ (dalam lingkaran) | `Play` |
| Status video: belum ditonton | ○ (dalam lingkaran) | `Circle` |
| Tombol "Tonton" | ▶ | `Play` |
| Tombol "Selesai" | ✓ | `Check` |
| Tombol "Reset" | ↩ | `RotateCcw` |
| Rating bintang video | ★ (teks unicode) | `Star` (filled/outline sesuai rating, pola sama seperti Testimonials landing page) |
| Badge panduan (materi) | 📘 | `BookOpen` |
| File PDF | 📕 | `FileText` |
| File DOCX/DOC | 📝 | `FileText` (warna beda dari PDF untuk bedain, sama seperti pola `CircleDot` dipakai 2x beda warna di Fase 1) |
| File PPTX/PPT | 📊 | `Presentation` |
| File XLSX/XLS | 📗 | `FileSpreadsheet` |
| File default/lainnya | 📄 | `File` |
| Tombol Download | ↓ | `Download` |

Semua ikon di atas ditambahkan ke import `lucide-react` yang sudah ada di file ini (baris dekat atas file, sudah berisi ikon-ikon dari Fase 1) — tidak membuat import baru terpisah.

---

## 4. Yang TIDAK berubah

- 14 tab lain (jurnal, trading-plan, komunitas, tools, produk, funded, peringkat, competition, sertifikat, 1on1, ulasan, referral, pengaturan, bantuan) — tetap dark-terminal.
- Tab `live` (Live Trading) — dark-terminal, dibiarkan, tidak dihapus/direstyle (lihat §1).
- Semua state, query Supabase, dan computed logic di ketiga tab yang direstyle.
- `AdvancedChartWidget` komponennya sendiri.
- `JurnalPage.tsx`, `LeaderboardPage.tsx`, `MemberTradingPlan.tsx`, `CompetitionPage.tsx` — tidak disentuh (bukan bagian dari 3 tab ini).
- Routing (`App.tsx`), halaman lain.

## 5. Out of Scope

- Fase berikutnya (14 tab sisa) — direncanakan terpisah per kelompok ("Trading Tools", "Komersial", "Akun & Komunitas" — lihat catatan Fase 1).
- Tidak menghapus tab `live` yang orphan — hanya dicatat, keputusan hapus/tidak diserahkan ke user secara terpisah kalau diperlukan.
- Tidak ada perubahan pada `AdvancedChartWidget` atau komponen widget lain yang di-embed.
