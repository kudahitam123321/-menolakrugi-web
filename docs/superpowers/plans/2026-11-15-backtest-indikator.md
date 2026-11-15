# Halaman & Data Backtest Indikator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pengunjung bisa membuka `/backtest-indikator` yang identik dengan dashboard `D:\backtest\BACKTEST FIX.html` milik user (tanpa menu Script; menu Data & Simulasi hanya berisi simulasi Modal awal + Risk per trade), datanya dari database, awalnya terisi `SMC PTMR v5.xlsx`, dan admin bisa mengganti data dengan mengunggah export TradingView.

**Architecture:** Halaman publik = salinan bersih `BACKTEST FIX.html` sebagai file statis `public/backtest-indikator.html` (d3 + runtime `dash` + semua fungsi gambar tetap apa adanya), dengan data tertanam (`window.__BT_DATA__`) diganti loader yang mengambil `backtest_config` dari Supabase REST. Konversi xlsx → format data dashboard memakai port TypeScript dari fungsi `btToTrades`/`btLoadFile` di file itu, sehingga data dari admin berformat sama persis dengan yang dipahami dashboard.

**Tech Stack:** HTML statis + d3 v7.9.2 (sudah inline di file user), React 18 + TS (admin & halaman indikator), Supabase, paket `xlsx`, `npx esbuild` (sudah ada via Vite) untuk skrip cek.

**Spec:** `docs/superpowers/specs/2026-11-15-indikator-v5-preorder-upgrade-design.md` §3–§4 + kartu ke-5 §2.4. Referensi tampilan & logika: `D:\backtest\BACKTEST FIX.html`. Rencana ini hanya backtest; pre-order/halaman indikator dan klaim upgrade di rencana terpisah.

## Global Constraints

- Tampilan, teks, warna, dan perhitungan halaman backtest **tidak diubah** dari `BACKTEST FIX.html` kecuali yang disebut di Task 3.
- **Tanpa disclaimer** di halaman backtest maupun kartu "Riwayat Data Jelas" (keputusan user).
- Tidak ada test suite (CLAUDE.md): logika murni dicek dengan `scripts/check-backtest.mjs`; UI dicek di dev server + `npm run build`.
- Tidak menambah dependensi npm.
- RLS `using (true)` / `with check (true)`; migrasi SQL dijalankan **user** di Supabase SQL Editor.
- Push ke `main` = deploy produksi. Halaman/kartu harus aman saat tabel belum ada atau `tampil = false`.
- Data format (= `window.__BT_DATA__` di file user): `{ trades: Trade[], settings: {setting: string, value: string}[] }`, dengan `Trade = { trade, side: 'BUY'|'SELL', entry_time, exit_time, entry_price, exit_price, qty, pnl_usd, cum_pnl_usd, bars, result: 'Win'|'Loss', entry_hour, weekday, weekday_no, month }` persis seperti keluaran `btToTrades`.
- **Risk asli** untuk simulasi tidak diambil dari setting `Risk per Trade (%)` (itu input kalkulator lot = 1, bukan risk backtest). Disimpan terpisah di `backtest_config.risk_asli` (default 0.5 = "Risk Follow Trend (% equity)").

## Review Focus

1. **File export lain format** (CSV List of Trades, xlsx tanpa sheet Properties, kolom berbeda) → konversi sama dengan dashboard asli; kalau gagal, admin melihat pesan jelas dan tidak ada yang tersimpan. (Task 1 cek + Task 4.)
2. **Tabel belum dibuat / `tampil = false` / jaringan gagal** → halaman menampilkan "Data backtest belum tersedia." + tombol kembali, bukan halaman kosong atau error JS. (Task 3.)
3. **Simulasi dengan input kosong/0/negatif** → pesan error bawaan muncul, angka asli tetap. (Task 3.)
4. **URL `/backtest-indikator` di Cloudflare** tertimpa SPA fallback `/* /index.html 200` → harus menyajikan file statis. (Task 3.)
5. **Layar HP 375px** → tidak ada scroll horizontal di setiap menu (file asli punya `@media (max-width:760px)`). (Task 3.)

---

## File Structure

| File | Tanggung jawab |
|---|---|
| `src/lib/backtest.ts` (baru) | Port `btToTrades` + pemilihan sheet + Properties dari file user: workbook/CSV → `{trades, settings}` |
| `scripts/check-backtest.mjs` (baru) | Bandingkan hasil port dengan fungsi asli di `BACKTEST FIX.html` + angka TradingView |
| `scripts/generate-backtest-seed.mjs` (baru) | Buat `supabase-backtest-seed.sql` dari xlsx |
| `supabase-backtest-config-migration.sql` (baru) | Tabel `backtest_config` |
| `supabase-backtest-seed.sql` (baru, hasil generate) | Data SMC PTMR v5 |
| `public/backtest-indikator.html` (baru) | Salinan bersih dashboard user + loader Supabase |
| `public/_redirects` | Rule `/backtest-indikator` sebelum SPA fallback |
| `src/hooks/index.ts` | `useBacktestConfig()` |
| `src/pages/AdminPage.tsx` | Bagian "// DATA BACKTEST" di Produk → Preview Landing |
| `src/pages/PricingIndikatorPage.tsx` | Kartu "Riwayat Data Jelas" |
| `CLAUDE.md` | Dokumentasi |

---

### Task 1: Port konversi export TradingView

**Files:**
- Create: `src/lib/backtest.ts`, `scripts/check-backtest.mjs`

**Interfaces:**
- Produces:
  ```ts
  export interface BtTrade { trade: number; side: 'BUY' | 'SELL'; entry_time: string; exit_time: string;
    entry_price: number | ''; exit_price: number | ''; qty: number | ''; pnl_usd: number; cum_pnl_usd: number;
    bars: number | ''; result: 'Win' | 'Loss'; entry_hour: number; weekday: string; weekday_no: number; month: string; }
  export interface BtSetting { setting: string; value: string }
  export interface BtData { trades: BtTrade[]; settings: BtSetting[] }
  export function tradesDariTabel(table: unknown[][]): BtTrade[];            // = btToTrades; throw Error('missing columns' | 'no trades')
  export function bacaWorkbook(wb: import('xlsx').WorkBook): BtData;         // = cabang .xlsx btLoadFile
  export function bacaCsv(text: string): BtData;                              // = cabang .csv btLoadFile (btReadCsv)
  export function riskAsliDefault(settings: BtSetting[]): number;             // 'Risk Follow Trend (% equity)' → angka, else 0.5
  export function ringkasCek(d: BtData): { total: number; net: number; menang: number }; // untuk pratinjau admin
  ```

- [ ] **Step 1: Write `scripts/check-backtest.mjs`**

  Bundle lib (`npx esbuild src/lib/backtest.ts --bundle --format=esm --platform=node --outfile=<tmp>`), lalu:
  - Ambil teks fungsi asli dari `D:/backtest/BACKTEST FIX.html` (regex `window.btToTrades = (table) => {…};` sampai baris `window.btDraws`), jalankan dengan `new Function` pada tabel yang sama (`XLSX.utils.sheet_to_json(ws,{header:1,raw:true})` sheet `Trades`), dan `assert.deepStrictEqual(port, asli)`.
  - Dari `SMC PTMR v5.xlsx`: `trades.length === 303`; `sum(pnl_usd)` ≈ 14944.44 (±0.01); `menang === 128`; `trades.at(-1).cum_pnl_usd` ≈ 14944.44; `settings` memuat `{setting:'Initial capital', value:'10000'}` dan `Symbol = FOREXCOM:XAUUSD`; `riskAsliDefault(settings) === 0.5`.
  - Tabel tanpa kolom PnL → throws `/missing columns/`.

- [ ] **Step 2: Run to verify it fails**

  Run: `node scripts/check-backtest.mjs "D:/backtest/indikator/SMC PTMR v5.xlsx" "D:/backtest/BACKTEST FIX.html"`
  Expected: FAIL — esbuild tidak menemukan `src/lib/backtest.ts`.

- [ ] **Step 3: Implement `src/lib/backtest.ts`**

  Port baris-per-baris dari `BACKTEST FIX.html`: `btToTrades` (regex kolom, `toTime` serial Excel, urutan trade, pembulatan, nama hari Indonesia `Minggu..Sabtu`), pemilihan sheet `btLoadFile` (`/trades$/i` bukan `/analysis/i`, lalu `/trade/i`; Properties `/propert/i` → `settings`; tambah `Initial capital` 10000 bila tidak ada), dan `btReadCsv`. Baca sheet dengan `XLSX.utils.sheet_to_json(ws, { header: 1, raw: true })` (pengganti `btReadXlsx` buatan file itu).

- [ ] **Step 4: Run to verify it passes** — perintah sama; Expected: `OK — port identik, 303 trade, net 14944.44`, exit 0.

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/backtest.ts scripts/check-backtest.mjs
  git commit -m "feat: port backtest dashboard's TradingView export reader"
  ```

### Task 2: Tabel `backtest_config`, data awal, hook

**Files:**
- Create: `supabase-backtest-config-migration.sql`, `scripts/generate-backtest-seed.mjs`, `supabase-backtest-seed.sql` (generated)
- Modify: `src/hooks/index.ts`

**Interfaces:**
- Consumes: `bacaWorkbook`, `riskAsliDefault`, `BtData` (Task 1).
- Produces:
  ```ts
  export interface BacktestConfig { id: 1; judul: string; data: BtData; risk_asli: number; tampil: boolean; sumber_file: string; updated_at: string; }
  export function useBacktestConfig(opts?: { semua?: boolean }): { config: BacktestConfig | null; loading: boolean; reload: () => void };
  ```
  `config = null` bila tabel/baris tidak ada atau (tanpa `semua`) `tampil = false`; error tidak di-throw.

- [ ] **Step 1: Migration** — `create table if not exists backtest_config (id int primary key default 1, judul text not null default 'PTMR Backtest', data jsonb not null default '{"trades":[],"settings":[]}', risk_asli numeric not null default 0.5, tampil boolean not null default false, sumber_file text default '', updated_at timestamptz default now());` + policy select/insert/update persis `supabase-landing-preview-migration.sql`.

- [ ] **Step 2: Seed generator** — `node scripts/generate-backtest-seed.mjs "D:/backtest/indikator/SMC PTMR v5.xlsx"` menulis `supabase-backtest-seed.sql` berisi satu `insert … values (1, 'PTMR Backtest', '<json>'::jsonb, 0.5, true, 'SMC PTMR v5.xlsx', now()) on conflict (id) do update set …` (petik tunggal di-escape `''`). Expected output: `303 trade ditulis ke supabase-backtest-seed.sql`.

- [ ] **Step 3: Hook** — `supabase.from('backtest_config').select('*').eq('id', 1).maybeSingle()`.

- [ ] **Step 4: Verify** — `npm run build` → `✓ built`.

- [ ] **Step 5: Commit**
  ```bash
  git add supabase-backtest-config-migration.sql supabase-backtest-seed.sql scripts/generate-backtest-seed.mjs src/hooks/index.ts
  git commit -m "feat: add backtest_config table and SMC PTMR v5 seed"
  ```
  **Lalu minta user** menjalankan migrasi lalu seed di Supabase SQL Editor.

### Task 3: Halaman statis `public/backtest-indikator.html`

**Files:**
- Create: `public/backtest-indikator.html` (dari `D:\backtest\BACKTEST FIX.html`)
- Modify: `public/_redirects`

**Interfaces:**
- Consumes: baris `backtest_config` (Task 2) lewat REST: `GET https://pogjfldmmzcphjwgzofb.supabase.co/rest/v1/backtest_config?id=eq.1&select=data,risk_asli,tampil,judul` dengan header `apikey`/`Authorization: Bearer` = anon key yang sama dengan `src/lib/supabase.ts`.

- [ ] **Step 1: Copy & strip**
  - Hapus: tombol nav `data-page="script"` dan `<section id="script">`; baris `window.__BT_SCRIPT_ENC__` (blob terenkripsi); semua kode `btScriptSrc`/`btScriptTxt`/unlock script; kartu kunci `bt-datalock` + kode kunci PBKDF2 Data & Simulasi (`// ── Kunci menu Data & Simulasi`) sehingga isi Data & Simulasi langsung terlihat; kartu **Import Data**, `<details>` **Setting strategi**, **Laporan asli TradingView**, **Definisi istilah**; paragraf `bt-banner` import; footer "file HTML mandiri…".
  - Kartu Simulasi: hanya input **Modal awal ($)** dan **Risk per trade (%)** + tombol Terapkan / Kembali ke angka asli. Input "Risk asli di data" dihapus; di `btApplySim`/`btFillSim` nilai `origRisk` diambil dari `window.__BT_RISK_ASLI__`. Teks catatan: "Hasil tiap trade diubah ke kelipatan risk, lalu dihitung ulang dengan modal awal dan risk per trade di bawah (risk dari equity berjalan). Semua halaman langsung ikut berubah." Default Risk per trade = `__BT_RISK_ASLI__`.
  - Hapus `'origtable'` dari `window.btDraws` beserta draw-nya.
  - Ganti `<script>window.__BT_DATA__ = {...}</script>` dengan loader: fetch REST di atas → set `window.__BT_DATA__ = row.data`, `window.__BT_RISK_ASLI__ = Number(row.risk_asli)`, isi judul `<title>` → lalu sisipkan script runtime berikutnya secara berurutan (runtime dibungkus fungsi `window.__btBoot()` yang dipanggil loader). Bila error / tidak ada baris / `tampil` false → ganti isi `.bt-main` dengan kartu "Data backtest belum tersedia." + tautan "← Kembali ke Indikator".
  - Tambah tautan "← Kembali ke Indikator" (`/pricing-indikator`) di bawah sidebar menu (sebelum `.bt-side-foot`) dan favicon `/logo.png`.

- [ ] **Step 2: Redirect** — `public/_redirects` menjadi:
  ```
  /backtest-indikator /backtest-indikator.html 200
  /* /index.html 200
  ```

- [ ] **Step 3: Verify (setelah user menjalankan migrasi + seed)**
  - `npm run dev`, buka `http://localhost:5173/backtest-indikator.html`: Ringkasan menampilkan Total Trade **303**, Net Profit **+$14,944.44**, Win Rate **42.24%**, judul "PTMR Backtest — FOREXCOM:XAUUSD". Tidak ada menu Script; Data & Simulasi hanya Modal awal + Risk per trade.
  - Simulasi Modal awal 1000, Risk 1 → Terapkan → banner "Sedang menampilkan simulasi: modal awal $1,000.00, risk 1% per trade" dan semua angka berubah; "Kembali ke angka asli" mengembalikan 14,944.44. Isi 0 → pesan error, angka tidak berubah.
  - Ubah sementara `select` ke tabel yang tidak ada (atau `tampil=false`) → kartu "Data backtest belum tersedia." tanpa error console lain.
  - Viewport 375px tiap menu: `document.documentElement.scrollWidth === 375`.
  - Setelah deploy: `https://menolakrugi.com/backtest-indikator` menyajikan halaman ini (bukan SPA).

- [ ] **Step 4: Commit**
  ```bash
  git add public/backtest-indikator.html public/_redirects
  git commit -m "feat: publish backtest dashboard page backed by backtest_config"
  ```

### Task 4: Unggah data backtest di admin

**Files:**
- Modify: `src/pages/AdminPage.tsx` (sub-tab `prodSubTab === 'preview'`)

**Interfaces:**
- Consumes: `bacaWorkbook`, `bacaCsv`, `riskAsliDefault`, `ringkasCek` (Task 1); `useBacktestConfig({ semua: true })` (Task 2).

- [ ] **Step 1: Section "// DATA BACKTEST"**
  Status saat ini ("303 trade · <Trading range> · diperbarui <tgl> · TAMPIL/TERSEMBUNYI" + tautan "Lihat halaman →" `/backtest-indikator`); input **Judul**; input **Risk asli di data (%)** (default `riskAsliDefault` dari file); input file `.xlsx,.csv` → `XLSX.read(await f.arrayBuffer())` → `bacaWorkbook` (atau `bacaCsv`). Pratinjau "N trade · net +$… · M menang"; error → teks merah "File tidak bisa dibaca. Pastikan ini export Strategy Tester (.xlsx) atau CSV List of Trades." dan tombol simpan nonaktif. **Simpan & Tampilkan** → `upsert({ id:1, judul, data, risk_asli, tampil:true, sumber_file:f.name, updated_at })`. **Sembunyikan/Tampilkan** → update `tampil` saja.

- [ ] **Step 2: Verify** — `npm run build` → `✓ built`. Manual: unggah `SMC PTMR v5.xlsx` → pratinjau "303 trade · net +$14,944.44 · 128 menang"; simpan → `/backtest-indikator.html` tetap sama. Unggah xlsx acak → pesan merah, tidak tersimpan.

- [ ] **Step 3: Commit**
  ```bash
  git add src/pages/AdminPage.tsx
  git commit -m "feat: let admin upload TradingView backtest export"
  ```

### Task 5: Kartu "Riwayat Data Jelas" + dokumentasi

**Files:**
- Modify: `src/pages/PricingIndikatorPage.tsx`, `CLAUDE.md`

**Interfaces:**
- Consumes: `useBacktestConfig()` (Task 2).

- [ ] **Step 1: Card** — tampil hanya bila `config` ada, di antara kartu harga dan "Cara Pembelian": kartu gelap lebar penuh (`linear-gradient(90deg,#0B1220,#13203a)`), ikon grafik, **"Riwayat Data Jelas"**, "Setiap parameter dikunci dari riset backtest XAUUSD M5 — lihat sendiri daftar trade, win rate, dan hasilnya.", tombol hijau **"Lihat Data Backtest →"** (`/backtest-indikator`). Mobile: tombol di bawah teks.

- [ ] **Step 2: CLAUDE.md** — route `/backtest-indikator` (file statis `public/backtest-indikator.html`, bukan komponen React; rule di `_redirects`), tabel `backtest_config`, `src/lib/backtest.ts`, migrasi/seed, cara update data (Admin → Produk → Preview Landing → Data Backtest), dan asal file (`D:\backtest\BACKTEST FIX.html`).

- [ ] **Step 3: Verify** — `npm run build` → `✓ built`; kartu muncul saat `tampil=true`, hilang saat disembunyikan.

- [ ] **Step 4: Commit**
  ```bash
  git add src/pages/PricingIndikatorPage.tsx CLAUDE.md
  git commit -m "feat: link pricing page to backtest data; document backtest feature"
  ```
