# Design: Revamp Visual Dashboard Member — Fase 1 (Shell + Tab Dashboard)

Date: 2026-07-05

## Overview

`src/pages/member/DashboardPage.tsx` (3014 baris, 18 tab sidebar) saat ini bertema dark-terminal, sama seperti landing page sebelum direvamp. Setelah landing page selesai direvamp ke tema terang (lihat `docs/superpowers/specs/2026-07-04-landing-page-revamp-design.md`), member sekarang minta Dashboard ikut direvamp ke tema terang yang sama.

Karena skalanya jauh lebih besar dari landing page (3014 baris vs 1450 baris, 18 tab vs 12 section), pekerjaan ini dipecah jadi beberapa fase. **Spec ini hanya mencakup Fase 1**: shell (topbar + sidebar desktop + sidebar mobile overlay) dan tab `dashboard` (home/overview). 17 tab sisanya (`kelas`, `materi`, `news`, `jurnal`, `trading-plan`, `komunitas`, `tools`, `produk`, `funded`, `peringkat`, `competition`, `sertifikat`, `1on1`, `ulasan`, `referral`, `pengaturan`, `bantuan`) **tetap dark-terminal** sampai fase berikutnya direncanakan terpisah.

---

## 1. Keputusan Kunci

- **Dashboard dikunci terang** — sama seperti landing page, tidak ada toggle dark/light di dashboard. Tombol toggle tema di topbar (baris ~1127-1131) dihapus.
- **Reuse token `--lp-*` dari landing page, bukan bikin set token baru.** Class CSS `.mr-landing-v2` di `src/index.css` di-**rename** jadi `.mr-light-v2` (nama netral, tidak spesifik-landing lagi) dan dipakai di root wrapper `DashboardPage` juga. Ini satu-satunya perubahan pada file CSS shared — semua reference `className="mr-landing-v2"` di `LandingPage.tsx` ikut di-update ke `mr-light-v2` supaya tidak ada regresi.
- **Tidak menyentuh `--mr-*` / `[data-theme="light"]` global** — Login, Signup, AdminPanel, dan 17 tab dashboard yang belum direvamp tetap pakai sistem tema lama, tidak terpengaruh.
- **Struktur sidebar (grouping via `separator`, collapse desktop, overlay mobile) dipertahankan** — hanya direstyle, bukan dirombak. Data `SIDEBAR` array (id/label/icon/separator/badge) tetap sama strukturnya, hanya field `icon` (saat ini emoji) diganti jadi key yang dipetakan ke komponen `lucide-react`.
- **Kartu membership di bawah sidebar dipertahankan** (bukan diganti tombol profil generik ala referensi) karena berisi info fungsional: tier aktif, sisa hari trial, tombol upgrade/reaktivasi. Hanya direstyle terang.
- **Search box sidebar baru, dan benar-benar fungsional** — filter live daftar item `SIDEBAR` berdasarkan `label` (case-insensitive substring match), bukan sekadar dekorasi. Item yang tidak cocok disembunyikan; separator ikut disembunyikan kalau semua item di bawahnya tersembunyi. Search direset saat sidebar collapse (desktop) atau overlay ditutup (mobile).
- **Ikon**: semua field `icon` di `SIDEBAR` (saat ini emoji: ⊞ ▶ 📚 📈 📓 📋 💬 🏦 🛍️ 🚀 🏆 🥇 🎖 🎯 ⭐ 🔗 ⚙ ❓ ⏻) diganti `lucide-react`. Bell notifikasi (🔔) dan ikon status notifikasi (✅❌ℹ️) di dropdown juga diganti lucide. Emoji dekoratif non-ikon (mis. "🎉" di teks "Advance Disetujui 🎉") **boleh tetap** — bukan ikon struktural.

---

## 2. Pemetaan Perubahan

### 2a. `src/index.css`

Rename blok `.mr-landing-v2` → `.mr-light-v2` (isi/value token `--lp-*` tidak berubah).

### 2b. `src/pages/LandingPage.tsx`

Satu-satunya perubahan: setiap `className="mr-landing-v2"` → `className="mr-light-v2"` (kemungkinan cuma 1 tempat, di root wrapper `LandingPage()`). Tidak ada perubahan visual/fungsional lain di landing page.

### 2c. `src/pages/member/DashboardPage.tsx` — root wrapper

Root `<div>` yang membungkus seluruh dashboard (di awal `return` milik `DashboardPage()`) ditambah `className="mr-light-v2"`, dan warna dasar (background/text) di-switch dari `C.bg`/`C.text` (var `--mr-*`) ke token `LP.*` (didefinisikan lokal, sama pola seperti `LandingPage.tsx` — lihat §3).

**Catatan penting**: Tab-tab yang BELUM direvamp (kelas, materi, dst.) tetap merender pakai `C.*`/`G.*` (var `--mr-*`, warna dark). Karena root wrapper sekarang membawa class `.mr-light-v2` yang HANYA mendefinisikan `--lp-*` (tidak override `--mr-*`), tab-tab lama tetap resolve ke `--mr-*` dark seperti biasa — tidak ada konflik. Tab lama akan terlihat dark-terminal di dalam shell yang sekarang terang (efek transisi ini disengaja/diterima sebagai kondisi transisi sampai fase berikutnya menuntaskan semua tab).

### 2d. Topbar (baris ~1033-1134)

- Hapus tombol toggle tema (🌙/☀️) sepenuhnya.
- Restyle ke `LP.*` tokens: background `LP.surface`, border `LP.border`, teks `LP.text`/`LP.muted`.
- Hamburger/collapse button: restyle terang (border `LP.border`, garis hamburger `LP.muted`).
- Logo + brand text: teks jadi `LP.text` (bold) / `LP.muted` (subtitle mono kecil) — logo image tidak berubah.
- Badge tier (mis. "ADVANCE"): restyle pakai `LP.primaryTint`/`LP.primary` (pola sama seperti badge di landing page).
- Bell notifikasi: ganti emoji 🔔 dengan ikon lucide `Bell`; badge unread count tetap merah (`LP.danger`) dengan teks putih. Dropdown notifikasi: background `LP.surface`, border `LP.border`, ikon status ganti ke lucide (`CheckCircle2` untuk approve, `XCircle` untuk reject, `Info` untuk info generik), tombol close (×) tetap teks `×` (bukan ikon fungsional kompleks, cukup dengan warna `LP.muted`).
- Avatar + nama member: avatar tetap inisial huruf pertama dengan background gradient hijau (`LP.primary`→`LP.primaryHover`), teks `LP.text`.
- Link "Web ↗": restyle border `LP.border`, teks `LP.muted`.

### 2e. Sidebar desktop (baris ~1186-1248)

- Background `LP.surface`, border kanan `LP.border`.
- Search box baru: input teks di bagian atas (di bawah padding-top, sebelum daftar `SIDEBAR.map`), style konsisten dengan input lain di app (`LP.surface` bg, `LP.border` border, `LP.muted` placeholder, ikon `Search` dari lucide di kiri input). Disembunyikan total saat `sidebarCollapsed` true (tidak ada versi collapsed dari search).
- Separator: garis `LP.border`, label mono kecil `LP.muted`.
- Item nav: background aktif `LP.primaryTint`, border-left aktif `LP.primary`, warna teks aktif `LP.primary`, teks non-aktif `LP.muted`. Ikon per item diganti lucide (lihat mapping di §3). Badge (jika ada) tetap merah (`LP.danger`).
- Kartu membership: restyle terang. Background `LP.primaryTint` (bukan lagi hardcode `#0d0c00`/`#2a2200` kuning-gelap), border `LP.primary` transparan tipis, label "AKSES MEMBERSHIP" mono kecil `LP.muted`, nilai tier `LP.primary` bold, tanggal aktif/sisa hari `LP.text`/warning oranye (`#f97316`, dipertahankan sebagai warna warning) kalau ≤7 hari, merah (`LP.danger`) kalau expired. Tombol "NAIK TIER ▸"/"AKTIFKAN LAGI" pakai `LP.primary` (atau `LP.danger` kalau expired) sebagai background solid.

### 2f. Sidebar mobile overlay (baris ~1136-1182)

Restyle paralel dengan sidebar desktop (search box, separator, item nav, kartu membership) — struktur JSX-nya memang duplikat dari desktop (pola existing codebase), jadi perubahannya duplikat juga secara konsisten, bukan disatukan jadi komponen bersama (di luar scope fase ini untuk refactor struktural).

### 2g. Tab `dashboard` / home (baris ~1253-1546)

Setiap widget berikut direstyle dari `C.*`/`G.*` (dark) ke `LP.*` (terang), tanpa mengubah logic/data:
- Welcome header + pill stats (progress %, video count, badge ADVANCE)
- Progress belajar (compact bars)
- Status row 2 kolom (Status Trading, Akses Kelas)
- Action banners (compact)
- Banner broker rekomendasi
- My Trading Stats (equity gain banner + stat grid)
- Top 3 Jurnal Trading
- Panel Pengumuman (Discord status, notifikasi personal advance approve/reject, pengumuman global)

Ikon emoji dekoratif di dalam widget-widget ini (📢 status pengumuman, ✅ "tidak ada notifikasi", dll.) **ikut diganti lucide** kalau posisinya sebagai ikon struktural (leading icon di baris data); emoji yang murni ekspresif dalam kalimat teks (🎉 dst.) dibiarkan.

**Catatan:** komponen `Spark` dan `GaugeChart` (didefinisikan di baris ~51 dan ~58) sudah dead code sejak sebelum fase ini — tidak dirender di mana pun di file, termasuk di tab `dashboard`. Ini bukan bagian dari scope Fase 1 (tidak perlu direstyle karena tidak pernah tampil); dibiarkan seperti apa adanya, tidak dihapus juga (pembersihan dead code di luar scope perubahan visual ini).

---

## 3. Detail Teknis

### Token lokal

Sama pola seperti `LandingPage.tsx`, `DashboardPage.tsx` menambah const lokal (tidak import dari file lain):

```ts
const LP = {
  bg: 'var(--lp-bg)', surface: 'var(--lp-surface)', text: 'var(--lp-text)', muted: 'var(--lp-muted)',
  border: 'var(--lp-border)', primary: 'var(--lp-primary)', primaryHover: 'var(--lp-primary-hover)',
  primaryTint: 'var(--lp-primary-tint)', danger: 'var(--lp-danger)',
  sans: '"Geist",system-ui,sans-serif', mono: '"Geist Mono",monospace',
  radius: 16, radiusSm: 10, shadowSm: '0 1px 3px rgba(0,0,0,0.06)', shadowMd: '0 8px 24px rgba(0,0,0,0.08)',
};
```

(Nilai identik dengan `LP` di `LandingPage.tsx` — didefinisikan ulang secara lokal per file, bukan diimpor lintas file, konsisten dengan pola `C`/`G` yang sudah ada di setiap file besar di codebase ini.)

### Pemetaan ikon `SIDEBAR`

| id | Emoji lama | Ikon lucide baru |
|---|---|---|
| dashboard | ⊞ | `LayoutGrid` |
| kelas | ▶ | `PlayCircle` |
| materi | 📚 | `BookOpen` |
| news | 📈 | `LineChart` |
| jurnal | 📓 | `NotebookPen` |
| trading-plan | 📋 | `ClipboardList` |
| komunitas | 💬 | `MessageCircle` |
| tools | 🏦 | `Landmark` |
| produk | 🛍️ | `ShoppingBag` |
| funded | 🚀 | `Rocket` |
| peringkat | 🏆 | `Trophy` |
| competition | 🥇 | `Medal` |
| sertifikat | 🎖 | `Award` |
| 1on1 | 🎯 | `Target` |
| ulasan | ⭐ | `Star` |
| referral | 🔗 | `Link2` |
| pengaturan | ⚙ | `Settings` |
| bantuan | ❓ | `HelpCircle` |
| logout | ⏻ | `LogOut` |

`SIDEBAR` array diubah field `icon: string` (emoji) jadi `Icon: LucideIcon` (component reference), dipakai sebagai `<item.Icon size={17} />` menggantikan `<span>{item.icon}</span>`.

---

## 4. Yang TIDAK berubah (Fase 1)

- 17 tab lain (kelas, materi, news, jurnal, trading-plan, komunitas, tools, produk, funded, peringkat, competition, sertifikat, 1on1, ulasan, referral, pengaturan, bantuan) — tetap dark-terminal, tidak disentuh sama sekali.
- Semua query Supabase / state management / logic bisnis (progress belajar, watch history, notifikasi, dsb.) — tidak berubah, murni restyle presentasi.
- `JurnalPage`, `LeaderboardPage`, `MemberTradingPlan`, `CompetitionPage` (komponen terpisah yang di-import) — tidak disentuh.
- Routing (`App.tsx`), halaman lain (Login, Signup, AdminPanel).
- Perilaku collapse sidebar desktop, overlay mobile, dan responsive breakpoint (`isMobile`) — mekanismenya dipertahankan.

## 5. Out of Scope

- Fase berikutnya (restyle 17 tab tersisa) — direncanakan terpisah, spec/plan sendiri, kemungkinan dipecah lagi per kelompok tab (mis. "Learning": kelas/materi/news; "Trading tools": jurnal/trading-plan/tools/funded/peringkat/competition; "Commerce": produk; "Account": komunitas/1on1/ulasan/referral/pengaturan/bantuan/sertifikat).
- Tidak ada perubahan pada AdminPanel meskipun secara visual mirip pola sidebar-nya (AdminPanel adalah file terpisah, tidak dalam scope).
- Tidak menambah fitur baru di luar search-filter sidebar yang disebutkan di §1.
