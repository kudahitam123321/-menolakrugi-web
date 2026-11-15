# Indikator v5 — Tahap Pre-order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Selama produk indikator utama berstatus `preorder`, website menjual v5 sebagai pre-order early-bird (langsung dapat v4.2), menampilkan hitung mundur ke tanggal rilis, dan memberi tahu pemilik v4.2 bahwa mereka dapat v5 gratis.

**Architecture:** Satu modul murni `src/lib/indikatorV5.ts` (status pre-order pembeli, sisa waktu, pilih order indikator) dicek dengan skrip Node. Hook `useProdukIndikator()` membaca produk indikator aktif pertama (`products`, urut `urutan`) — `status === 'preorder'` menyalakan tampilan pre-order di banner, landing, halaman indikator, `/bayar`, dan dashboard. Tanpa produk pre-order, semua halaman tampil seperti sekarang.

**Tech Stack:** React 18 + TS, Supabase, inline style (`LP` / `C`/`G`), `npx esbuild` untuk skrip cek.

**Spec:** `docs/superpowers/specs/2026-11-15-indikator-v5-preorder-upgrade-design.md` — §"Dua tahap tampilan", §1, §2, §5, §6 (bagian tahap pre-order). Mockup: `.superpowers/brainstorm/588-1794725013/content/preorder-v3.html`. Tahap rilis & klaim upgrade = rencana terpisah.

## Global Constraints

- Tahap pre-order aktif **hanya** bila produk indikator aktif pertama (`products.aktif = true`, urut `urutan` asc) punya `status === 'preorder'`. Tanggal rilis = `products.tanggal_rilis`. Bila tidak → perilaku sekarang, tanpa perubahan tampilan selain teks Cara Pembelian.
- Nama di website: **"SMC by MenolakRugi v5"** / "Indikator v5". Tanggal tampil format `id-ID` ("1 Desember 2026").
- Tanpa disclaimer (keputusan user).
- Pengiriman indikator = link via WhatsApp oleh admin.
- Tidak ada test suite (CLAUDE.md): logika murni dicek `scripts/check-indikator-v5.mjs`; UI di dev server (respons Supabase disimulasikan Playwright) + `npm run build`.
- Tidak menambah dependensi; ikuti pola inline style file masing-masing.
- Kerjakan di branch `feat/indikator-v5-preorder`; merge/push hanya atas izin user.

## Review Focus

1. **Tanggal rilis sudah lewat tapi status masih `preorder`** → hitung mundur disembunyikan, teks jadi "Segera rilis", tidak ada angka negatif. (Task 1 cek.)
2. **Pembeli punya beberapa order indikator** (pending/dobel/aktif lama) → yang dipakai order aktif dengan jatuh tempo terjauh / lifetime; pending diabaikan. (Task 1 cek.)
3. **Order aktif tanpa `activated_at`** → tidak dianggap "aktif melewati rilis"; tampil kotak "Hubungi admin". (Task 1 cek.)
4. **Produk tidak ada / query gagal** → banner promo diskon lama & halaman tampil seperti sekarang, tanpa error. (Task 2.)
5. **HP 375px** → hitung mundur, kartu fitur, strip, dan sidebar baru tidak melebar. (Task 3/4.)

---

## File Structure

| File | Tanggung jawab |
|---|---|
| `src/lib/indikatorV5.ts` (baru) | Logika murni: `hitungJatuhTempo`, `pilihOrderIndikator`, `statusPreorder`, `sisaWaktu` |
| `scripts/check-indikator-v5.mjs` (baru) | Cek logika di atas |
| `src/hooks/index.ts` | `useProdukIndikator()` |
| `src/components/PromoBanner.tsx` | Banner pengumuman v5 saat pre-order (gantikan banner diskon) |
| `src/pages/LandingPage.tsx` | Menu "Indikator v5 · SEGERA", tombol hero "Pre-order Indikator v5" |
| `src/pages/PricingIndikatorPage.tsx` | Tata letak A: strip pemilik lama, hero + hitung mundur, 4 kartu fitur, harga early-bird, Cara Pembelian |
| `src/pages/BayarPage.tsx` | Catatan pre-order di ringkasan pesanan |
| `src/components/IndikatorV5Info.tsx` (baru) | Kotak info pre-order untuk dashboard (3 keadaan) |
| `src/pages/member/DashboardPage.tsx` | Sidebar pembeli indikator dirapikan; pasang `IndikatorV5Info` di Beranda & tab Produk |
| `CLAUDE.md` | Dokumentasi + checklist admin |

---

### Task 1: Logika status pre-order

**Files:** Create `src/lib/indikatorV5.ts`, `scripts/check-indikator-v5.mjs`

**Interfaces — Produces:**
```ts
export interface OrderIndikator { status: string; plan_type: string | null; activated_at: string | null; created_at: string; }
export function hitungJatuhTempo(activatedAt: string | null, planType: string | null): Date | null; // sama persis dgn versi di DashboardPage/AdminPage
export function pilihOrderIndikator<T extends OrderIndikator>(orders: T[]): T | null;
  // hanya plan_type != null & status 'aktif'; lifetime menang; lalu jatuh tempo terjauh; null bila tidak ada
export type StatusPreorder = 'aman' | 'perpanjang' | 'habis' | 'tidak-diketahui' | 'tidak-ada';
export function statusPreorder(orders: OrderIndikator[], tanggalRilis: Date | null, now: Date): StatusPreorder;
  // aman = lifetime, atau jatuh tempo >= tanggalRilis (tanggalRilis null → >= now)
  // perpanjang = aktif sekarang tapi jatuh tempo < tanggalRilis
  // habis = ada order indikator (aktif/dibayar) tapi semua jatuh tempo < now
  // tidak-diketahui = order aktif non-lifetime tanpa activated_at (dan tak ada yg 'aman')
  // tidak-ada = tak ada order indikator aktif sama sekali
export function sisaWaktu(target: Date, now: Date): { hari: number; jam: number; menit: number; detik: number } | null; // null bila target <= now
```

- [ ] **Step 1: Write `scripts/check-indikator-v5.mjs`** (bundle seperti `scripts/check-backtest.mjs`) dengan `rilis = new Date('2026-12-01T00:00:00+07:00')`, `now = new Date('2026-11-15T12:00:00+07:00')`, dan asersi:
  - lifetime aktif → `'aman'`; bulanan aktif `activated_at` 2026-11-20 (JT 20 Des) → `'aman'`; bulanan aktif `activated_at` 2026-10-20 (JT 20 Nov) → `'perpanjang'`; bulanan aktif `activated_at` 2026-09-01 (JT 1 Okt) → `'habis'`; bulanan aktif `activated_at: null` → `'tidak-diketahui'`; hanya pending → `'tidak-ada'`; `[]` → `'tidak-ada'`.
  - campuran [pending lifetime, aktif bulanan JT 20 Nov, aktif tahunan JT 2027] → `pilihOrderIndikator` memilih tahunan; status `'aman'`.
  - order tanpa `plan_type` (produk non-indikator) diabaikan.
  - `sisaWaktu(rilis, now)` → `{hari:15, jam:12, menit:0, detik:0}`; `sisaWaktu(rilis, new Date('2026-12-02'))` → `null`.
  - `statusPreorder(..., null, now)` dengan JT 20 Nov → `'aman'` (tanpa tanggal rilis, aktif = aman).
- [ ] **Step 2: Run** `node scripts/check-indikator-v5.mjs` → Expected: FAIL (esbuild tidak menemukan `src/lib/indikatorV5.ts`).
- [ ] **Step 3: Implement** `src/lib/indikatorV5.ts`.
- [ ] **Step 4: Run** → Expected: `OK — status pre-order`.
- [ ] **Step 5: Commit** `feat: add indicator v5 pre-order status logic`.

### Task 2: Hook produk + banner + landing

**Files:** Modify `src/hooks/index.ts`, `src/components/PromoBanner.tsx`, `src/pages/LandingPage.tsx`

**Interfaces — Produces:**
```ts
export interface ProdukIndikator { id: string; nama: string; status: string; tanggal_rilis: string | null; }
export function useProdukIndikator(): { produk: ProdukIndikator | null; preorder: boolean; tanggalRilis: Date | null; loading: boolean };
  // products.select('id,nama,status,tanggal_rilis').eq('aktif',true).order('urutan').limit(1); error → produk null
export function fmtTanggalRilis(d: Date | null): string; // '1 Desember 2026' | 'segera'
```
- [ ] **Step 1:** Hook di `src/hooks/index.ts`; `fmtTanggalRilis` di `src/lib/indikatorV5.ts` (tambahkan asersi `fmtTanggalRilis(rilis) === '1 Desember 2026'` dan `fmtTanggalRilis(null) === 'segera'` ke skrip cek Task 1, lihat gagal, lalu implement).
- [ ] **Step 2: PromoBanner** — bila `preorder`: banner hijau (gaya sama) berupa tautan ke `/pricing-indikator`: `⏳ SMC Indikator v5 rilis {fmtTanggalRilis} — pre-order harga early-bird sekarang, langsung dapat v4.2 →`. Selain itu: perilaku diskon lama.
- [ ] **Step 3: LandingPage** — `NavBar`: bila `preorder`, sisipkan item `Indikator v5` + badge kecil oranye `SEGERA` (`#d97706`) ke `/pricing-indikator` (desktop & menu mobile). Hero: tombol "Beli Indikator →" menjadi "Pre-order Indikator v5 →" + badge `EARLY-BIRD` (oranye, posisi pojok kanan atas tombol) bila `preorder`.
- [ ] **Step 4: Verify** `npm run build` → `✓ built`; dev server + Playwright (route `**/rest/v1/products*` → `[{id:'x',nama:'SMC by MenolakRugi v5',status:'preorder',tanggal_rilis:'2026-12-01'}]`): banner berisi "rilis 1 Desember 2026", menu "Indikator v5", tombol "Pre-order Indikator v5"; route → `[{…,status:'tersedia'}]`: tampilan lama (banner WINTER, "Beli Indikator →"). Lebar 375px tanpa overflow.
- [ ] **Step 5: Commit** `feat: announce indicator v5 pre-order on banner and landing page`.

### Task 3: Halaman indikator (tata letak A) + /bayar

**Files:** Modify `src/pages/PricingIndikatorPage.tsx`, `src/pages/BayarPage.tsx`

**Interfaces — Consumes:** `useProdukIndikator`, `fmtTanggalRilis`, `sisaWaktu` (Task 1–2).

- [ ] **Step 1: PricingIndikatorPage** — urutan saat `preorder` (persis mockup `preorder-v3.html` bagian 01b):
  1. Strip hijau muda: "✅ **Sudah pakai v4.2 & masih aktif?** Kamu otomatis dapat v5 **gratis** saat rilis {tgl} — tidak perlu beli lagi."
  2. Hero: label `// SMC BY MENOLAKRUGI · VERSI 5 · COMING SOON` (oranye pada "COMING SOON"), judul "Bukan cuma baca struktur — langsung tahu kapan entry.", subjudul "Pre-order sekarang dengan harga early-bird. **Langsung dapat v4.2 hari ini**, lalu otomatis upgrade ke v5 saat rilis.", hitung mundur 4 kotak gelap (HARI/JAM/MENIT/DETIK, update tiap detik via `setInterval`, berhenti saat `sisaWaktu` null → teks "Segera rilis"), teks mono "Harga early-bird berakhir saat rilis · {tgl}".
  3. 4 kartu fitur (ikon SVG, judul, deskripsi — teks persis spec §2.3): 3 Setup Otomatis / Label Order Siap Pasang / Kalkulator Lot Otomatis / Alarm Lengkap ke HP. Grid `repeat(auto-fit,minmax(200px,1fr))`.
  4. `RiwayatDataCard` (sudah ada).
  5. Catatan "Dioptimalkan untuk XAUUSD timeframe M5."
  6. Kartu harga (komponen `ProductPreview` yang ada): saat `preorder` dan `diskon > 0` badge `EARLY-BIRD -{diskon}%`; poin "v4.2 langsung hari ini" + "v5 otomatis saat rilis" (+ "Discord private" untuk tahunan/lifetime); tombol "Pre-order {nama} →". Judul lama "Belum Paham SMC? Tidak Masalah." dan teks benefit Discord dipertahankan bila tidak `preorder`.
  Bila tidak `preorder`: kartu fitur + Riwayat Data + harga seperti sekarang (tanpa strip/hitung mundur/early-bird).
- [ ] **Step 2: Cara Pembelian** (selalu): langkah 5–6 diganti — 5 "Terima Link Indikator: Admin mengirim link indikator ke WhatsApp kamu setelah pembayaran terverifikasi." 6 "Pasang & Mulai Pakai: Buka link di TradingView, tambahkan ke chart XAUUSD M5." Saat `preorder`, langkah 5 ditambah kalimat "Pre-order: link v4.2 dikirim sekarang, link v5 dikirim saat rilis." Hapus tautan Join Discord di langkah 5.
- [ ] **Step 3: BayarPage** — di kartu ringkasan pesanan, bila `preorder`: label `PRE-ORDER · RILIS {tgl}` (oranye) di atas nama plan + catatan kecil "Link v4.2 dikirim setelah verifikasi, link v5 saat rilis."
- [ ] **Step 4: Verify** build; Playwright (route products preorder + landing_preview_config asli): strip, hitung mundur berjalan (nilai detik berubah dalam 2 detik), 4 kartu, badge EARLY-BIRD hanya bila diskon>0, tombol "Pre-order Bulanan →"; `/bayar?plan=bulanan` menampilkan label PRE-ORDER. 375px tanpa overflow. Status `tersedia` → tidak ada strip/hitung mundur.
- [ ] **Step 5: Commit** `feat: pre-order layout for indicator v5 pricing page`.

### Task 4: Dashboard — kotak info v5 + sidebar pembeli indikator

**Files:** Create `src/components/IndikatorV5Info.tsx`; Modify `src/pages/member/DashboardPage.tsx`

**Interfaces:**
- Consumes: `statusPreorder`, `pilihOrderIndikator`, `hitungJatuhTempo`, `sisaWaktu` (Task 1); `useProdukIndikator`, `fmtTanggalRilis` (Task 2).
- Produces: `export default function IndikatorV5Info(p: { orders: OrderIndikator[]; onBeli: () => void }): JSX.Element | null;` — null bila tidak `preorder` atau status `'tidak-ada'` dan member bukan pembeli indikator (prop `tampilkanSaatKosong?: boolean`, default false).

- [ ] **Step 1: `IndikatorV5Info`** (gaya `LP`, kotak putih border hijau, ikon 🎁):
  - `aman`: "**v5 rilis {tgl} — gratis untukmu**" / "Langgananmu aktif sampai rilis. Tombol klaim muncul di sini saat rilis." + badge "{hari} hari lagi".
  - `perpanjang`: "**v5 rilis {tgl}**" / "Perpanjang sebelum {tgl} supaya tetap aktif & dapat v5 gratis." + tombol **Perpanjang →** (`onBeli`).
  - `habis`: "**Pre-order v5 harga early-bird**" / "Langsung aktif lagi dengan v4.2, otomatis v5 saat rilis." + tombol **Pre-order →** (`onBeli`).
  - `tidak-diketahui`: "**v5 rilis {tgl}**" / "Hubungi admin untuk cek kelayakan upgrade gratis." + tombol WA `https://wa.me/6281242224939`.
- [ ] **Step 2: Pasang** di Beranda pembeli indikator (di bawah kartu "Langganan Indikator", sebelum tombol Beli/Perpanjang) dengan `onBeli={() => setActive('produk')}`, dan di tab `produk` di atas sub-tab untuk member yang punya order indikator (`myOrders.some(o => o.plan_type)`).
- [ ] **Step 3: Sidebar pembeli indikator** — bila `isIndikatorMember`, sidebar memakai urutan: Dashboard, Produk, Chart, separator `ACCOUNT` (Pengaturan, Bantuan, Logout), separator `KHUSUS MEMBER KELAS`, lalu item terkunci (Kelas Saya, Materi, Jurnal Trading, Trading Plan, Komunitas, Broker, Status Trading, Peringkat, Kompetisi, Sertifikat, 1-on-1 Mentoring, Tulis Ulasan, Referral) masing-masing dengan ikon gembok kecil di kanan dan warna redup. Item terkunci tetap bisa diklik (membuka halaman "Fitur Khusus Member Kelas" yang sudah ada). Member kelas: sidebar tidak berubah. Berlaku di sidebar desktop & drawer mobile (keduanya memakai `filterSidebar(SIDEBAR, …)` → ganti dengan daftar terpilih).
- [ ] **Step 4: Verify** build + typecheck file yang disentuh. Dev server tidak bisa login tanpa data produksi → verifikasi logika lewat Task 1 cek; tampilan komponen dicek di Playwright dengan halaman uji sementara di luar repo (render `IndikatorV5Info` 4 keadaan) — atau di produksi setelah deploy oleh user. Catat di ledger.
- [ ] **Step 5: Commit** `feat: v5 pre-order info and tidier sidebar for indicator buyers`.

### Task 5: Dokumentasi + checklist admin

**Files:** Modify `CLAUDE.md` (hanya tambahan sendiri; perubahan user yang belum di-commit tidak ikut)

- [ ] **Step 1:** Bagian "Indicator v5 pre-order": sumber kebenaran (`useProdukIndikator`, produk aktif pertama berstatus `preorder`), file yang terlibat, dan **checklist admin**: (1) Katalog Produk → tambah "SMC by MenolakRugi v5", status Pre-order, tanggal rilis 2026-12-01, urutan paling kecil; (2) nonaktifkan produk v4.2; (3) Preview Landing → isi diskon early-bird per paket; (4) ganti video bila ada. Hari rilis: status → Tersedia, diskon → 0.
- [ ] **Step 2: Verify** `npm run build` → `✓ built`.
- [ ] **Step 3: Commit** `docs: document indicator v5 pre-order phase`.
