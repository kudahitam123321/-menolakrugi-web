# Design: Revamp Visual Dashboard Member — Fase 3 (Tab Produk)

Date: 2026-07-05

## Overview

Fase 1 (`docs/superpowers/specs/2026-07-05-dashboard-shell-revamp-design.md`) merestyle shell (topbar + sidebar) dan tab `dashboard` di `src/pages/member/DashboardPage.tsx` dari dark-terminal ke tema terang. Fase 2 (`docs/superpowers/specs/2026-07-05-dashboard-belajar-tabs-revamp-design.md`) merestyle kelompok "Belajar" (`kelas`, `materi`, `news`).

Spec ini adalah **Fase 3**, mencakup satu tab dari kelompok "Komersial": `produk` (Toko Produk Indikator). 13 tab sisanya (`jurnal`, `trading-plan`, `komunitas`, `tools`, `funded`, `1on1`, `peringkat`, `competition`, `sertifikat`, `ulasan`, `referral`, `pengaturan`, `bantuan`) tetap dark-terminal, di luar scope fase ini.

Referensi visual: user memberikan contoh HTML grid produk e-commerce ("Our featured items" — badge overlay NEW/SALE, gambar zoom on hover, harga di kanan). Desain di bawah ini mengadaptasi gaya tersebut ke kebutuhan fungsional tab Produk yang sudah ada (multi-paket harga, kode diskon, status member, panduan download) — bukan replikasi 1:1, karena data produk kita tidak punya kolom rating dan strukturnya multi-paket, bukan harga tunggal.

---

## 1. Keputusan Kunci

- **Reuse pola & token dari Fase 1/2 sepenuhnya** — `LP` token object, tidak ada token baru.
- **Tidak menyentuh logic/data Supabase** — `products`, `myOrders`, `orderModal`, `pendingOrder`, `paymentMethods`, `kodeDiskon`/`kodeDiskonData`, fungsi `buatOrder`, `cekKodeDiskon`, `konfirmasiKePembayaranWA`, `closeOrderModal`, `normalizeTier`, dan semua computed value (`bisaOrder`, `plans`, `finalHarga`, dst) dipertahankan persis.
- **Satu state UI baru per-card**: `selectedPlan` (lokal, murni presentasi) untuk toggle paket harga di card katalog — dijelaskan detail di §2a. Ini BUKAN perubahan logic bisnis; hasil akhirnya tetap memanggil `buatOrder`/`setOrderModal` yang sama persis, hanya sumber `_selectedPlan` yang berbeda (dari state toggle, bukan dari klik baris terpisah).
- **Ikon emoji struktural diganti `lucide-react`** (tabel lengkap di §3). Emoji ekspresif dalam nama platform dsb (kalau ada, tidak ada di tab ini) dibiarkan.
- **`<main>`'s conditional background/color diperluas** dari `['dashboard','kelas','materi','news'].includes(active)` menjadi `['dashboard','kelas','materi','news','produk'].includes(active)`.
- **Tidak ada perubahan struktur file/komponen** — tetap satu blok `active === 'produk'` di dalam `DashboardPage.tsx`, tidak dipecah jadi komponen terpisah.

---

## 2. Pemetaan Perubahan

### 2a. Card Katalog (grid produk) — inti perubahan visual

Layout card, dari atas ke bawah:

1. **Gambar/video** (`aspect-ratio: 16/9`, tetap — dibutuhkan untuk video embed YouTube): tambah efek zoom halus saat hover (`transform: scale(1.05)` on `:hover`, `transition: transform 0.3s`).
2. **Badge status** pindah jadi pill yang menumpuk di pojok kiri-atas gambar (`position: absolute`), bukan di bawah gambar seperti sekarang:
   - Tersedia: pill putih/`LP.surface`, teks `LP.text`, ikon `CheckCircle2`
   - Pre-order: pill gelap (`LP.text` sebagai bg, putih sebagai teks) + info tanggal rilis, ikon `Clock`
3. **Nama produk** (bold, `LP.text`) + **deskripsi** (line-clamp 3, `LP.muted`).
4. **Segmented plan-toggle** (BARU — state lokal `selectedPlan`, lihat di bawah): pill kecil berisi label paket yang tersedia dari array `plans` yang sudah difilter (misal `Bulanan · Tahunan · Lifetime` — hanya paket dengan harga terisi yang muncul; kalau cuma 1 paket tersedia, toggle ini tidak ditampilkan sama sekali, langsung tampilkan 1 harga).
   - Default: `plans[0]` (mengikuti urutan array yang sudah ada: bulanan → tahunan → lifetime).
   - Klik pill lain → `setSelectedPlan(plan)` mengubah paket yang tampil aktif.
5. **Harga tunggal** untuk `selectedPlan` yang aktif: harga coret (kalau ada diskon) + harga final besar + badge `-X%` — style sama seperti baris harga yang sudah ada sekarang, hanya sekarang cuma 1 yang tampil bukan list.
6. **Tombol CTA tunggal**:
   - Kalau `bisaOrder` (member tier eligible): tombol "Pilih Paket" solid `LP.primary`, `onClick` memanggil `setKodeDiskon(''); setKodeDiskonData(null); setKodeErr(''); setOrderModal({ ...p, _selectedPlan: selectedPlan.plan, _selectedLabel: selectedPlan.label, _selectedHarga: finalHargaSelectedPlan, _hargaBase: selectedPlan.h })` — **logic identik** dengan yang sekarang dipanggil per-baris, hanya sumber datanya dari `selectedPlan` bukan dari `row` di dalam `.map()`.
   - Kalau tidak eligible: tombol disabled "Upgrade Tier untuk Order", ikon `Lock`.
7. **Tombol Download Panduan** (kalau `p.panduan_url` ada): tetap di bawah, ikon `BookOpen` + `Download`, logic fetch/blob/download **tidak diubah**.

**State baru yang perlu ditambahkan**: satu `useState` di level komponen `DashboardPage` (bukan di dalam `.map()` — hook tidak boleh dipanggil per-iterasi), bentuknya `Record<string, string>` di-key oleh `p.id`, menyimpan `plan` yang sedang aktif per produk (pola identik dengan `videoRatings: Record<string, number>` yang sudah ada di tab `kelas`). Contoh: `const [selectedPlanByProduct, setSelectedPlanByProduct] = useState<Record<string, string>>({})`. Di dalam card, paket aktif dihitung sebagai `selectedPlanByProduct[p.id] ?? plans[0]?.plan`, dan klik pill toggle memanggil `setSelectedPlanByProduct(prev => ({ ...prev, [p.id]: plan.plan }))`.

### 2b. Empty State Katalog

Pesan "Belum ada produk tersedia saat ini." — tetap di tengah, `LP.mono`/`LP.muted`, tanpa border baru.

### 2c. Toggle Katalog / Pesanan Saya (header)

Pill switcher, gaya sama dengan toggle mode jurnal Fase 2: aktif = border + background tint `LP.primary`, non-aktif = `LP.border`/`LP.muted`. Ikon `Package` (Katalog) dan `Receipt` (Pesanan Saya), emoji 📦/🧾 dihapus.

### 2d. Tab Pesanan Saya

- List card per order: `LP.surface`/`LP.border`.
- Badge status (kanan): `Aktif` (hijau, `LP.up`/`LP.primary`), `Dibayar` (biru `#3b82f6`, tetap), `Pending` (kuning `#eab308`, tetap) — jadi pill dengan background tipis warna solid, bukan cuma teks berwarna seperti sekarang.
- Badge `plan_type` tetap ada, warna `LP.primary`.
- Kode diskon terpakai → ikon `Ticket` + teks hijau (ganti emoji 🎟️).
- Catatan (`o.catatan`, kalau ada) → ikon `MessageSquare` + teks `LP.muted` (ganti emoji 💬).

### 2e. Modal Step 1 — Konfirmasi Order

- Card modal: `LP.surface`/`LP.border`/`LP.shadowMd`, radius 16 (overlay dim tetap `#000a`, tidak diubah).
- Eyebrow header "KONFIRMASI ORDER · LANGKAH 1/2" → `LP.mono`/`LP.primary`, drop prefix `//`.
- Info pre-order (kalau ada) → ikon `Clock` (ganti emoji ⏳), badge kuning tetap.
- Box ringkasan paket & harga → `LP.bg`/`LP.border`, border berubah jadi `LP.primary` saat kode diskon aktif.
- Input kode diskon → styling konsisten dengan input form lain di dashboard terang (border `LP.border`, fokus `LP.primary`).
- Kode valid → ikon `CheckCircle2` hijau (ganti ✅); kode invalid → ikon `XCircle` merah (ganti ❌).
- Tombol utama "Lanjutkan ke Pembayaran →" → solid `LP.primary`; tombol "Batal" → outline `LP.border`.

### 2f. Modal Step 2 — Detail Pembayaran

- Card modal: sama seperti step 1 (`LP.surface`/`LP.border`/`LP.shadowMd`).
- Box ringkasan order → `LP.bg`/`LP.border`.
- Kode diskon terpakai di ringkasan → ikon `Ticket` (ganti 🎟️).
- Daftar metode pembayaran: card `LP.surface`/`LP.border` (ganti dari hijau gelap `#0a1a0e`/`#16a34a33`).
- Nomor rekening tetap mono besar; tombol "Salin" → outline `LP.primary`, jadi solid `LP.primary` + ikon `Check` saat kondisi "Disalin" (ganti ✓).
- Gambar QRIS: tetap background putih (`#fff`) — sudah cocok tema terang, tidak berubah.
- Catatan metode pembayaran (`pm.catatan`) → ikon `ClipboardList` (ganti 📋).
- Tombol "Konfirmasi Pembayaran ke WA Admin": tetap hijau WhatsApp `#25D366` (brand color eksternal, bukan token `LP`), ikon `CheckCircle2` ganti emoji ✅.
- Tombol "Tutup": outline `LP.border`.

---

## 3. Pemetaan Ikon

| Konteks | Emoji lama | Ikon lucide baru |
|---|---|---|
| Toggle header — Katalog | 📦 | `Package` |
| Toggle header — Pesanan Saya | 🧾 | `Receipt` |
| Badge status: Tersedia | ✅ | `CheckCircle2` (sudah ada) |
| Badge status: Pre-order | ⏳ | `Clock` (sudah ada) |
| Placeholder gambar produk kosong | 📊 | `BarChart3` |
| Tombol disabled "Upgrade Tier" | 🔒 | `Lock` (sudah ada) |
| Tombol Download Panduan | 📘 ↓ | `BookOpen` (sudah ada) + `Download` (sudah ada) |
| Kode diskon valid | ✅ | `CheckCircle2` |
| Kode diskon invalid | ❌ | `XCircle` (sudah ada) |
| Kode diskon terpakai (badge di Pesanan Saya & ringkasan modal) | 🎟️ | `Ticket` |
| Catatan pesanan | 💬 | `MessageSquare` |
| Catatan metode pembayaran | 📋 | `ClipboardList` (sudah ada) |
| Tombol Salin — kondisi "Disalin" | ✓ | `Check` (sudah ada) |
| Tombol Konfirmasi WA | ✅ | `CheckCircle2` |

Semua ikon baru (`Package`, `Receipt`, `BarChart3`, `Ticket`, `MessageSquare`) ditambahkan ke import `lucide-react` yang sudah ada di file ini — tidak membuat import baru terpisah.

---

## 4. Yang TIDAK berubah

- 13 tab lain (jurnal, trading-plan, komunitas, tools, funded, 1on1, peringkat, competition, sertifikat, ulasan, referral, pengaturan, bantuan) — tetap dark-terminal.
- Tab `live` (Live Trading, dead code, tidak ada entry `SIDEBAR`) — dibiarkan, tidak disentuh.
- Semua query Supabase, handler (`buatOrder`, `cekKodeDiskon`, `konfirmasiKePembayaranWA`, `closeOrderModal`), dan computed logic di tab `produk` — kecuali penambahan 1 state UI `selectedPlan` per §2a.
- Warna brand eksternal: hijau WhatsApp `#25D366`, warna status `Dibayar` biru `#3b82f6`, warna status `Pending` kuning `#eab308` — dipertahankan (bukan token `LP`, sudah kontras cukup di tema terang).
- Gambar QRIS (background putih, sudah sesuai tema terang).
- Routing (`App.tsx`), halaman lain, `JurnalPage.tsx`, `LeaderboardPage.tsx`, dll.

## 5. Out of Scope

- Fase berikutnya (kelompok "Trading Tools" dan "Akun & Komunitas") — direncanakan terpisah, menunggu instruksi user.
- Tidak ada perubahan skema database atau kolom baru (misalnya kolom rating produk) — kalau nanti dibutuhkan, itu keputusan produk terpisah, bukan bagian revamp visual ini.
- Tidak mereplikasi 1:1 referensi HTML e-commerce (single price, star rating) karena data & struktur produk kita berbeda (multi-paket, tanpa rating) — sudah diadaptasi sesuai §2a.
