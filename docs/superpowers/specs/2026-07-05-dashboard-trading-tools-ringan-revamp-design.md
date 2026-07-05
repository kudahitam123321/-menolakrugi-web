# Design: Revamp Visual Dashboard Member — Fase 4a (Broker, Status Trading, Peringkat)

Date: 2026-07-05

## Overview

Fase 1 (`docs/superpowers/specs/2026-07-05-dashboard-shell-revamp-design.md`) merestyle shell + tab `dashboard`. Fase 2 (`docs/superpowers/specs/2026-07-05-dashboard-belajar-tabs-revamp-design.md`) merestyle `kelas`/`materi`/`news`. Fase 3 (`docs/superpowers/specs/2026-07-05-dashboard-produk-tab-revamp-design.md`) merestyle `produk`.

Kelompok "Trading Tools" (6 tab) ternyata jauh lebih besar/heterogen dari fase-fase sebelumnya — dipecah jadi 2 sub-fase. Spec ini adalah **Fase 4a**, mencakup 3 tab paling ringan/mandiri: `tools` (Broker & Prop Firm), `funded` (Status Trading), `peringkat` (Peringkat/Leaderboard). Sisa 3 tab yang lebih berat (`jurnal`, `trading-plan`, `competition`) direncanakan sebagai **Fase 4b** terpisah.

9 tab lain di luar scope fase ini (`jurnal`, `trading-plan`, `komunitas`, `1on1`, `sertifikat`, `ulasan`, `referral`, `pengaturan`, `bantuan`, `competition`) tetap dark-terminal.

---

## 1. Keputusan Kunci

- **`tools` dan `funded`**: blok inline di `src/pages/member/DashboardPage.tsx`, reuse `LP` token object yang sudah ada sejak Fase 1 — tidak ada token baru.
- **`peringkat`**: seluruh isinya ada di file terpisah `src/pages/member/LeaderboardPage.tsx` (377 baris), yang punya token lokal sendiri (`C`/`G`, dark, di-map ke `--mr-*`) dan **belum punya import `lucide-react` sama sekali**. Mengikuti konvensi codebase (file besar mendefinisikan token lokal sendiri, bukan import lintas file — lihat `CLAUDE.md` bagian "Design System"), ditambahkan satu object `LP` baru di dalam `LeaderboardPage.tsx` dengan shape/value persis sama seperti `LP` di `DashboardPage.tsx`, plus satu blok import `lucide-react` baru khusus file ini.
- **`LotCalculator`** — komponen module-level di `DashboardPage.tsx` (baris ±238-291), dipakai di dalam tab `tools`. Ikut direstyle ke `LP` supaya tidak tetap gelap di tengah tab yang sudah terang. Tidak ada perubahan logic (state `balance`/`risk`/`sl`/`pair`, kalkulasi lot size).
- **Tidak menyentuh logic/data sama sekali** di ketiga tab: query Supabase (`brokers`, `propRules`, fetch progress/jurnal di `LeaderboardPage`), state (`selectedStatus`, `statusMsg`, `statusSaving`), fungsi (`handleUpdateStatus`, `fetchData` di `LeaderboardPage`) — murni restyle presentasi + ganti emoji struktural jadi ikon lucide.
- **CRITICAL — emoji di tab `funded` yang TIDAK boleh diganti**: string nickname Discord (`` `[${emoji}]${nama}_ᴾᵀᴹᴿ...` ``, baris ±2173-2185) memakai emoji 💎🥇🥈🥉🕒 sebagai **bagian dari data** yang benar-benar dikirim jadi nickname Discord member, bukan ikon UI dekoratif. Emoji ini dibiarkan persis sama. Hanya emoji ⚠ (2 kemunculan — banner "Discord belum terhubung" dan hint di bawah tombol simpan) yang murni dekoratif/fungsional dan diganti ikon.
- **Cleanup dead code di `LeaderboardPage.tsx`**: `MEDAL_ICONS` (baris 13) dan `PODIUM_BG` (baris 22) dikonfirmasi tidak pernah dipakai di manapun dalam file ini (sudah muncul sebagai error `TS6133` di baseline typecheck) — dihapus. `MEDAL_ICONS` juga kebetulan satu-satunya sumber emoji terstruktur di file ini, jadi penghapusannya sekaligus memenuhi aturan "tidak ada emoji sebagai ikon".
- **2 error type pre-existing di `LeaderboardPage.tsx`** (`TS2339: Property 'winRate' does not exist on type 'JurnalEntry'`, baris 333) adalah bug tipe asli yang tidak terkait tema — **tidak diperbaiki di fase ini**, tetap ada sebagai baseline setelah fase ini selesai.
- **`<main>`'s conditional background/color diperluas** dari `['dashboard','kelas','materi','news','produk'].includes(active)` menjadi `['dashboard','kelas','materi','news','produk','tools','funded','peringkat'].includes(active)`.
- Simbol non-emoji (`×`, `▸`, `→`, `●`, `✦`) dibiarkan apa adanya — konsisten dengan Fase 1-3, yang hanya mengganti emoji pictograph berwarna, bukan simbol tipografis ASCII-adjacent.

---

## 2. Pemetaan Perubahan

### 2a. Tab `tools` (Broker & Prop Firm) — baris ±1969-2073 di `DashboardPage.tsx`

Isi yang direstyle (struktur/logic tidak berubah):
- Header ("Broker & Prop Firm")
- `LotCalculator` (komponen terpisah, dipakai di dalam tab ini): input balance/risk/SL/pair, hasil lot size & risk amount
- Grid card Broker Rekomendasi dan Prop Firm Rekomendasi (logo/avatar huruf, badge diskon, deskripsi, tombol "DAFTAR")
- Grid card Prop Firm Rules (judul, deskripsi, tombol "BUKA LINK" dan "DOWNLOAD")

### 2b. Tab `funded` (Status Trading) — baris ±2150-2243 di `DashboardPage.tsx`

Isi yang direstyle:
- Header ("Status Trading Kamu")
- Banner status saat ini (termasuk preview nickname Discord — **string nickname sendiri tidak diubah**, hanya wrapper visualnya)
- Banner peringatan "Discord belum terhubung" (ikon ⚠ → `AlertTriangle`)
- Grid 6 pilihan status (DA/P1/P2/Master/MPAID/Ap) — warna per-status (`#3b82f6`/`#a855f7`/`#f59e0b`/`#22ab94`/`#eab308`/`#ec4899`) dipertahankan apa adanya (bukan token `LP`, ini warna semantik per-status bukan token tema)
- Tombol "Hapus Status", pesan status simpan, tombol "Simpan & Update Discord"
- Hint "Discord belum terhubung" di bawah tombol simpan (ikon ⚠ kedua → `AlertTriangle`)

### 2c. Tab `peringkat` (Peringkat/Leaderboard) — seluruh file `LeaderboardPage.tsx`

Isi yang direstyle:
- Tambah object `LP` baru (sama shape dengan `DashboardPage.tsx`) dan blok import `lucide-react` baru
- Header ("Leaderboard Member")
- 3 card ringkasan ("Peringkat Progress", "Peringkat Jurnal", "Total Member")
- Tab switcher "Progress Belajar" / "Jurnal Trading" (emoji 📚/📓 → `BookOpen`/`NotebookPen`)
- Komponen `Podium` (top-3 tampilan podium, dipakai di kedua sub-tab)
- Tabel progress belajar (rank, nama, tier, progress bar, materi selesai)
- Tabel jurnal trading (rank, nama, tier, trades, win rate, PnL, equity gain, tombol "Lihat")
- Empty state jurnal ("Belum ada member yang mengisi jurnal", emoji 📓 → `NotebookPen`)
- Komponen `MyRankBar` ("posisimu", muncul kalau rank member ≥ 10)
- Hapus `MEDAL_ICONS` dan `PODIUM_BG` (dead code, lihat §1)

---

## 3. Pemetaan Ikon

| Konteks | Emoji lama | Ikon lucide baru | File |
|---|---|---|---|
| Badge diskon broker | 🎁 | `Gift` (baru) | `DashboardPage.tsx` |
| Icon card Prop Firm Rules | 📋 | `ClipboardList` (sudah ada) | `DashboardPage.tsx` |
| Tombol download rules | ⬇ | `Download` (sudah ada) | `DashboardPage.tsx` |
| Banner "Discord belum terhubung" | ⚠ | `AlertTriangle` (baru) | `DashboardPage.tsx` |
| Hint "Discord belum terhubung" (bawah tombol simpan) | ⚠ | `AlertTriangle` (baru) | `DashboardPage.tsx` |
| String nickname Discord (💎🥇🥈🥉🕒) | — | **TIDAK diubah, ini data** | `DashboardPage.tsx` |
| Tab "Progress Belajar" | 📚 | `BookOpen` (baru di file ini) | `LeaderboardPage.tsx` |
| Tab "Jurnal Trading" + empty state | 📓 | `NotebookPen` (baru di file ini) | `LeaderboardPage.tsx` |
| `MEDAL_ICONS` (🥇🥈🥉, dead code) | — | dihapus | `LeaderboardPage.tsx` |

`Gift` dan `AlertTriangle` ditambahkan ke import `lucide-react` yang sudah ada di `DashboardPage.tsx`. `BookOpen` dan `NotebookPen` jadi bagian dari blok import `lucide-react` BARU yang ditambahkan ke `LeaderboardPage.tsx` (file ini belum pernah import `lucide-react` sebelumnya).

---

## 4. Yang TIDAK berubah

- 9 tab lain (`jurnal`, `trading-plan`, `komunitas`, `1on1`, `sertifikat`, `ulasan`, `referral`, `pengaturan`, `bantuan`) dan tab `competition` — tetap dark-terminal, direncanakan di fase terpisah (`jurnal`/`trading-plan`/`competition` → Fase 4b).
- Tab `live` (Live Trading, dead code) — dibiarkan.
- String nickname Discord (termasuk emoji-nya) di tab `funded` — data, bukan tema.
- Warna semantik per-status di grid Status Trading (`#3b82f6`, `#a855f7`, `#f59e0b`, `#22ab94`, `#eab308`, `#ec4899`) — bukan token `LP`, dipertahankan.
- 2 error `TS2339 winRate` pre-existing di `LeaderboardPage.tsx` — bug tipe tidak terkait tema, dibiarkan.
- Semua state, query Supabase, dan computed logic di ketiga tab.
- Routing (`App.tsx`), halaman lain.

## 5. Out of Scope

- Fase 4b (`jurnal`, `trading-plan`, `competition`) — direncanakan terpisah setelah Fase 4a selesai.
- Kelompok "Akun & Komunitas" (7 tab) — direncanakan terpisah, menunggu instruksi user.
- Tidak memperbaiki bug tipe `winRate` di `LeaderboardPage.tsx` — di luar scope revamp visual, bisa jadi task terpisah kalau diperlukan.
- Tidak ada perubahan pada `CertificateCanvas` atau komponen lain yang tidak termasuk 3 tab ini.
