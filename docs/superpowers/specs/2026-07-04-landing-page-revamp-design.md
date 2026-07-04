# Design: Revamp Visual Landing Page (`src/pages/LandingPage.tsx`)

Date: 2026-07-04

## Overview

Landing page saat ini bergaya "terminal dark" (bg `#090909`, aksen hijau, font mono dominan, layout padat). Revamp ini mengganti **total** gaya visual jadi terang & minimalis (Swiss Modernism / clean SaaS), terinspirasi dari referensi `headshotpro.com` (bold typography, social proof berat, before/after) dan `busy.app` (whitespace lega, flat, product-visual-led).

Scope murni **visual + struktur presentasi**. Tidak ada perubahan data layer — semua hook Supabase yang sudah ada (`useLandingStats`, `useApprovedTestimonials`, `usePricing`, `useLandingPreview`) dipakai ulang tanpa modifikasi. Halaman lain (login, signup, dashboard, admin) **tidak berubah** — tetap dark-terminal seperti sekarang, toggle tema global tetap berfungsi normal di sana.

---

## 1. Keputusan Kunci

- **Landing dikunci terang** — tidak ada toggle dark/light di halaman ini. Tombol toggle tema dihapus dari `NavBar`.
- **Token warna baru, terisolasi** — bukan reuse `--mr-*` (supaya tidak mengubah tampilan light-mode halaman lain yang sudah share var yang sama). Didefinisikan sebagai blok CSS baru di `src/index.css`, scoped ke class `.mr-landing-v2`:

  ```css
  .mr-landing-v2 {
    --lp-bg:            #FAFAFA;
    --lp-surface:       #FFFFFF;
    --lp-text:          #0F172A;
    --lp-muted:         #64748B;
    --lp-border:        #E5E7EB;
    --lp-primary:       #16a34a;   /* sama dengan --mr-gold, brand hijau tetap konsisten */
    --lp-primary-hover: #15803d;
    --lp-primary-tint:  rgba(22,163,74,0.08);
    --lp-danger:        #ef4444;   /* konsisten dgn --mr-down di app */
  }
  ```

  `LandingPage()` membungkus root `<div>` dengan class `mr-landing-v2` (menggantikan pemakaian `MR.bg`/`MR.text` dari `theme.ts` untuk elemen-elemen section baru).

- **Font tetap Geist / Geist Mono** — tidak menambah font baru. Geist Mono perannya diperkecil: hanya untuk eyebrow label kecil (mis. "// KURIKULUM" style dipertahankan sebagai ciri khas brand, tapi ukuran font-weight tubuh & headline pakai Geist sans, bukan mono).
- **Skala tipografi baru**: headline hero 40–64px (mobile 32px) weight 800, H2 section 28–36px weight 700, body 16–18px line-height 1.6, label/eyebrow 11px mono uppercase.
- **Ikon**: ganti seluruh ikon emoji (📚 🎓 💬 🤝 📅 di `NavBar`, dan emoji lain yang dipakai sebagai ikon struktural di section lain) dengan `lucide-react` (sudah jadi dependency). Emoji tetap boleh dipakai sebagai elemen ekspresif non-struktural (mis. di pesan sukses "✅"), bukan sebagai ikon navigasi/fungsional.
- **Efek visual**: flat design, shadow tipis (`0 1px 3px rgba(0,0,0,0.06)` untuk card, `0 8px 24px rgba(0,0,0,0.08)` untuk elevated/hover), border radius 12–16px, tanpa gradient neon/glow ala terminal yang sekarang dipakai di `StatsBar`/`Pricing`. Animasi fade-up/stagger yang sudah ada (`mr-fadeup`, `useFadeUp`, `useInView`, `useCounter`) **dipertahankan** — mekanismenya sudah bagus, cuma disesuaikan easing/durasi kalau perlu (150–300ms, `ease-out`).

---

## 2. Pemetaan Section (existing function → treatment baru)

Urutan render final di `LandingPage()`:

| # | Section baru | Fungsi existing | Treatment |
|---|---|---|---|
| 1 | NavBar | `NavBar()` | Restyle terang, sticky+blur on scroll (`backdrop-filter: blur(12px)` + bg semi-transparan saat `scrollY > 0`), ganti emoji nav jadi ikon lucide, hapus tombol toggle tema. CTA kanan: 1 tombol solid primer. |
| 2 | Hero | `Hero()` | Restyle: headline besar Geist sans (bukan lagi center-align mono badge look), 2 CTA (`PILIH KELAS` tetap primer solid, sekunder outline), badge "LIVE ·..." disederhanakan jadi eyebrow text kecil. Visual kanan (desktop): frame mockup berisi `CandleChart`/`Ticker` yang sudah ada, dibingkai card putih dengan shadow — bukan lagi background grid candle transparan penuh layar. |
| 3 | Stats bar | `StatsBar()` | Ganti gradient dark + radial glow jadi grid kartu putih (border tipis, shadow kecil), angka besar tetap pakai `useCounter`, warna angka solid `--lp-primary` (bukan lagi gradient text `radial-gradient` + `WebkitBackgroundClip`). |
| 4 | Bukti Hasil (baru, gabungan) | `LandingLeaderboard()` (saat ini **dead code**, tidak dirender) + `Mentor()` (juga dead code) | Dihidupkan kembali & digabung jadi satu section "Bukti Hasil" — leaderboard ringkas (top 3 kompetisi, reuse query yang sama) + kartu kredibilitas mentor (foto, funded proof, quote). Ini pengganti pola "before/after" dari referensi HeadshotPro, versi trading: bukti hasil member vs klaim marketing kosong. |
| 5 | Preview Produk | `ProductPreview({ config })` | Restyle jadi card/frame terang, embed video/preview tetap sama. |
| 6 | Pricing | `Pricing({ tiers })` | Restyle jadi kartu SaaS terang: card putih border tipis, 1 tier "Populer" di-highlight (border `--lp-primary` + shadow elevated), hapus efek glow/hover-transform berlebihan (`mr-card-glow`, translateY besar) — ganti hover jadi scale 1.02 halus. |
| 7 | Kurikulum | `Curriculum()` | Struktur accordion 2 kolom (Basic/Advanced) **dipertahankan** — sudah bagus. Restyle warna: card putih, border abu muda, accent dot tetap hijau, hapus mono-heavy styling di body item (`MR.mono` di label modul boleh tetap sebagai badge kecil, tapi title & item pakai sans). |
| 8 | Komunitas (baru, gabungan) | `GallerySlider()` + `DiscordCTA()` | Digabung satu section: galeri foto/hasil di atas, CTA join Discord di bawah dalam satu blok visual — bukan dua section terpisah dengan border berbeda. |
| 9 | Testimoni | `Testimonials({ testimonials })` | Card putih, quote + nama + tier badge + rating bintang (pakai ikon lucide `Star`, bukan emoji ⭐ kalau saat ini emoji). |
| 10 | FAQ | `FaqSection()` | Accordion terang, chevron icon lucide. |
| 11 | CTA penutup | `CTA()` (saat ini **dead code**) | Dihidupkan kembali sebagai banner penutup tegas sebelum footer — headline pendek + 1 tombol besar. |
| 12 | Footer | `Footer()` | Restyle terang, multi-kolom, tetap tampilkan info WA/kontak yang sudah ada. |

**Dihapus dari render final dan dari file:** `Manifesto()` — kontennya (soal market structure/BOS) sudah tercakup di copy Hero baru; section ini di-drop untuk mengurangi redundansi. Karena tidak dipanggil di mana pun setelah revamp, fungsinya dihapus sekalian dari `LandingPage.tsx` (bukan dibiarkan sebagai dead code).

---

## 3. Yang TIDAK berubah

- Semua data fetching: `useLandingStats`, `useApprovedTestimonials(12)`, `usePricing`, `useLandingPreview` — dipakai persis sama, hanya cara render hasilnya yang berubah.
- Query internal `LandingLeaderboard` (`members`, `trading_journals`, `journal_settings`) — logic ranking tidak diubah, hanya restyle tampilan & dipersingkat (top 3 saja untuk konteks landing, bukan tabel penuh).
- Routing (`App.tsx`) — tidak ada perubahan, tetap `/` → `LandingPage`.
- `NavBar`'s gotcha membaca `localStorage.getItem('mr_member')` untuk status login — logic dipertahankan, cuma tampilannya yang berubah.
- Responsive breakpoint mobile (`max-width: 767px`) dan pola `isMobile` state per section — dipertahankan sebagai mekanisme, nilai style di dalamnya disesuaikan ke skala baru.

---

## 4. Dampak File

- `src/pages/LandingPage.tsx` — rewrite besar, tetap satu file dengan sub-section sebagai fungsi lokal (konvensi existing, sesuai catatan di `CLAUDE.md`).
- `src/index.css` — tambah blok `.mr-landing-v2 { --lp-*: ... }` baru. Tidak mengubah blok `:root` atau `[data-theme="light"]` yang sudah ada.
- Tidak ada perubahan Supabase schema/migration.
- Tidak ada dependency baru (lucide-react sudah ada).

---

## 5. Out of Scope

- Tidak menyentuh halaman lain (`LoginPage`, `SignupPage`, `DashboardPage`, `AdminPanel`, dll) — semuanya tetap dark-terminal.
- Tidak mengubah toggle tema global (`initTheme`/`toggleTheme` di `theme.ts`) — tetap berfungsi seperti sekarang di halaman-halaman lain.
- Tidak menambah konten/copy marketing baru di luar yang sudah expose lewat data existing (mis. tidak menambah testimonial dummy, tidak menambah tier pricing baru).
- Tidak melakukan A/B test atau analytics tracking baru.
- Tidak mengoptimasi SEO/meta tags (di luar scope revamp visual).
