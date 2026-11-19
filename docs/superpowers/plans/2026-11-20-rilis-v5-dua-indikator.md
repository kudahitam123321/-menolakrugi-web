# Rilis v5 sebagai Produk Kedua — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jual v4.2 dan v5 berdampingan. Pemilik v4.2 sebelum tanggal rilis dapat tombol "Klaim v5 Gratis" yang membuka WhatsApp admin.

**Architecture:** Harga per produk diambil dari tabel `products`, dan `/bayar` membawa `?produk=<id>`. Logika kelayakan klaim berupa fungsi murni di `src/lib/indikatorV5.ts`, dicek dengan skrip Node. UI klaim jadi cabang baru di `IndikatorV5Info`, dipakai saat tidak dalam mode pre-order.

**Tech Stack:** React 18 + TS + Vite, Supabase JS, skrip cek Node (`esbuild` + `node:assert`), Playwright dengan route Supabase di-mock untuk verifikasi UI.

**Spec:** `docs/superpowers/specs/2026-11-20-rilis-v5-dua-indikator-design.md`

## Global Constraints
- Bahasa Indonesia untuk semua teks UI. Tanpa disclaimer.
- Inline style dengan token lokal `LP`/`C`/`G` yang sudah ada di tiap file. Font Geist / Geist Mono.
- Nomor WA admin: `6281242224939`.
- Batas kelayakan = `tanggal_rilis` produk v5 pukul `T00:00:00+07:00`.
- Link lama `/bayar?plan=x` (tanpa `produk`) harus tetap bekerja seperti sekarang.
- Tidak menyentuh tabel. Tidak ada migrasi SQL.
- Validasi: `npm run typecheck`, `npm run build`, `node scripts/check-indikator-v5.mjs`.

## Review Focus
1. Produk dengan sebagian harga kosong (mis. hanya lifetime): kartu paket kosong tidak tampil, dan `/bayar?plan=` untuk paket kosong menampilkan "Plan tidak valid".
2. `?produk=` berisi id tidak dikenal atau produk nonaktif: `/bayar` jatuh ke perilaku lama (config + produk teratas), bukan halaman kosong.
3. Member yang punya order v4.2 **dan** order v5: tidak melihat tombol klaim karena sudah punya v5.
4. Order v4.2 aktif tanpa `activated_at`: tidak berhak (tidak bisa dibuktikan sebelum batas).
5. Belum ada produk ber-`tanggal_rilis`: tidak ada tombol klaim sama sekali.

---

### Task 1: Logika kelayakan klaim v5

**Files:**
- Modify: `src/lib/indikatorV5.ts`
- Modify: `scripts/check-indikator-v5.mjs`

**Interfaces:**
- Produces: `OrderIndikator` dapat field opsional `product_id?: string | null`.
- Produces: `berhakKlaimV5(orders: OrderIndikator[], v5Id: string | null, batas: Date | null): OrderIndikator | null` mengembalikan order v4.2 yang menjadi dasar klaim (pakai `pilihOrderIndikator` atas order yang memenuhi syarat), atau `null`.

- [ ] **Step 1: Tulis assertion di `scripts/check-indikator-v5.mjs`** (tambahkan di akhir, sebelum log sukses). Dengan `batas = new Date('2026-11-20T00:00:00+07:00')`, `V5 = 'v5'`, `V4 = 'v4'`, dan helper `ok(plan, status, activated_at, product_id)`:
  - lifetime aktif v4, activated 2026-05-01 → bukan null
  - bulanan aktif v4, activated 2026-11-01 (JT 1 Des ≥ batas) → bukan null
  - bulanan aktif v4, activated 2026-10-01 (JT 1 Nov < batas) → null
  - lifetime aktif v4, activated 2026-11-21 (setelah batas) → null
  - lifetime aktif v4, activated null → null
  - lifetime aktif v4 + bulanan aktif v5 → null (sudah punya v5)
  - lifetime **pending** v4 → null
  - `v5Id = null` atau `batas = null` → null
  - campuran tahunan v4 (activated 2026-03-01) + bulanan v4 (activated 2026-11-01) → `plan_type === 'tahunan'`
- [ ] **Step 2: Jalankan** `node scripts/check-indikator-v5.mjs`. Expected: gagal karena `L.berhakKlaimV5 is not a function`.
- [ ] **Step 3: Implementasi** `berhakKlaimV5` di `src/lib/indikatorV5.ts` sesuai spec §3: order indikator (`plan_type` ada), `status === 'aktif'`, `product_id !== v5Id`, `activated_at` ada dan `< batas`, dan (lifetime atau `hitungJatuhTempo >= batas`). Kalau ada order indikator aktif dengan `product_id === v5Id`, return null.
- [ ] **Step 4: Jalankan lagi.** Expected: lulus, dengan log sukses.
- [ ] **Step 5: Commit** `feat: eligibility check for free v5 claim`.

### Task 2: Tombol "Klaim v5 Gratis" di dashboard

**Files:**
- Modify: `src/hooks/index.ts` (tambah hook)
- Modify: `src/components/IndikatorV5Info.tsx`
- Modify: `src/pages/member/DashboardPage.tsx:1463,2685` (oper `member` untuk isi pesan WA)

**Interfaces:**
- Consumes: `berhakKlaimV5` (Task 1).
- Produces: `useProdukRilis(): { produk: { id: string; nama: string; tanggal_rilis: string } | null; batas: Date | null }`. Ambil produk aktif yang `tanggal_rilis` tidak null dan `status = 'tersedia'`, urut `urutan`, limit 1.
- `IndikatorV5Info` props jadi `{ orders; onBeli; member?: { nama?: string; email?: string } }`.

- [ ] **Step 1: Tambah `useProdukRilis`** di `src/hooks/index.ts`, bentuknya mengikuti `useProdukIndikator`.
- [ ] **Step 2: Cabang klaim di `IndikatorV5Info`.** Saat `!preorder`: hitung `dasar = berhakKlaimV5(orders, produk?.id ?? null, batas)`. Kalau null, return null. Kalau ada, render kotak 🎁 dengan judul `Kamu dapat {produk.nama} gratis`, teks "Kamu pemilik indikator sebelum rilis. Klaim lalu admin kirim link-nya lewat WhatsApp.", dan tombol **Klaim v5 Gratis →** yang memanggil `window.open('https://wa.me/6281242224939?text=' + encodeURIComponent(pesan), '_blank')`. `pesan` = `Halo admin, saya mau klaim {produk.nama} gratis.\nNama: {nama}\nEmail: {email}\nPaket lama: {dasar.plan_type}`. Atribut `data-v5-status="klaim"`. Cabang pre-order yang lama tetap utuh.
- [ ] **Step 3: Oper `member`** dari DashboardPage di kedua pemakaian, memakai objek member/session yang sudah ada di scope. Tab Produk: kondisi pembungkus `myOrders.some(o => o.plan_type)` tetap.
- [ ] **Step 4: Verifikasi** `npm run typecheck`, lalu Playwright (mock Supabase) login sebagai member dengan order lifetime aktif v4 sebelum batas. Expected: kotak `[data-v5-status="klaim"]` tampil di Beranda, dan klik tombol membuka URL `wa.me/6281242224939?text=` yang memuat nama produk. Member dengan order v5 saja: kotak tidak tampil.
- [ ] **Step 5: Commit** `feat: free v5 claim button for pre-release owners`.

### Task 3: Admin menyimpan tanggal rilis untuk status Tersedia

**Files:**
- Modify: `src/pages/AdminPage.tsx` (sekitar 1668, 1745, 2993–3003, 3156–3166)

- [ ] **Step 1:** Simpan `tanggal_rilis: pTanggalRilis || null` (tambah) dan `editPTanggalRilis || null` (edit) tanpa syarat status. Validasi wajib-isi untuk preorder tetap.
- [ ] **Step 2:** Input tanggal ditampilkan untuk kedua status. `onChange` select tidak lagi mengosongkan tanggal. Placeholder/label kecil: "Tanggal rilis (wajib untuk pre-order; untuk produk baru = batas klaim gratis)".
- [ ] **Step 3: Verifikasi** `npm run typecheck`. Expected: lulus.
- [ ] **Step 4: Commit** `fix: keep release date when product is available`.

### Task 4: Halaman pricing dua produk

**Files:**
- Modify: `src/hooks/index.ts` (hook produk publik)
- Modify: `src/pages/PricingIndikatorPage.tsx`

**Interfaces:**
- Produces: `useProdukDijual(): { produk: ProdukJual[]; loading: boolean }`, dengan `ProdukJual = { id; nama; deskripsi; status; tanggal_rilis; harga_bulanan; diskon_bulanan; harga_tahunan; diskon_tahunan; harga_lifetime; diskon_lifetime }` (angka boleh null). Ambil produk aktif, urut `urutan`.
- Produces: `paketDariProduk(p: ProdukJual): { key: 'bulanan'|'tahunan'|'lifetime'; nama: string; harga_asli: number; diskon: number }[]`, diekspor dari `src/lib/indikatorV5.ts` supaya bisa dicek Node dan dipakai ulang oleh `/bayar`. Nama paket: Bulanan / Tahunan / Lifetime. Paket dengan harga null atau 0 dibuang.

- [ ] **Step 1: Assertion `paketDariProduk`** di skrip cek: produk dengan tiga harga → 3 paket. Hanya lifetime → 1 paket `key 'lifetime'`. Diskon null → 0. Jalankan; Expected: gagal (fungsi belum ada).
- [ ] **Step 2: Implementasi `paketDariProduk`.** Jalankan skrip; Expected: lulus.
- [ ] **Step 3: `ProductPreview`** menerima `plans` (hasil `paketDariProduk`), `produkId?`, `judul?`, dan `badge?`, menggantikan `config` sebagai sumber kartu. Tombol → `/bayar?produk=${produkId}&plan=${key}` bila `produkId` ada, else `/bayar?plan=${key}`. Kartu tengah (tahunan) tetap featured bila ada.
- [ ] **Step 4: Halaman.** Saat bukan pre-order dan `useProdukDijual` mengembalikan ≥1 produk: render `HeroV5` (non-preorder), lalu satu `ProductPreview` per produk berurutan, dengan judul `nama` dan badge "TERBARU" untuk produk yang `tanggal_rilis`-nya terbaru. Setelah itu `FiturV5`, `RiwayatDataCard`, `LangkahPembelian`. Kalau produk kosong atau gagal dibaca, pakai paket dari `landing_preview_config` seperti sekarang. Cabang pre-order tidak diubah.
- [ ] **Step 5: Verifikasi** `npm run typecheck`, lalu Playwright (mock: 2 produk aktif v5 urutan 0 + v4.2 urutan 1) di 1280px dan 375px. Expected: dua blok berurutan, badge TERBARU di v5, tombol v5 tahunan mengarah ke `/bayar?produk=<idV5>&plan=tahunan`, dan halaman tidak overflow horizontal di 375px.
- [ ] **Step 6: Commit** `feat: show v4.2 and v5 side by side on pricing page`.

### Task 5: `/bayar` mengikuti produk

**Files:**
- Modify: `src/pages/BayarPage.tsx`

**Interfaces:**
- Consumes: `paketDariProduk` (Task 4).

- [ ] **Step 1:** Baca `params.get('produk')`. Di `load()`, bila ada, ambil produk itu (`aktif = true`, `maybeSingle`). Kalau ketemu: `productId` = id itu, `plan` = paket `planKey` dari `paketDariProduk`, dan simpan `namaProduk`. Kalau tidak ketemu: perilaku lama (config + produk teratas).
- [ ] **Step 2:** Label ringkasan jadi `{namaProduk ?? 'INDIKATOR SMC'} · {plan.nama}`. Label PRE-ORDER hanya tampil bila produk yang dibeli berstatus preorder (untuk jalur lama tetap pakai `preorder` global).
- [ ] **Step 3: Verifikasi** `npm run typecheck && npm run build`, lalu Playwright (mock) dengan `/bayar?produk=<idV5>&plan=lifetime`. Expected: harga = `harga_lifetime` v5 setelah diskon, dan payload insert `orders` berisi `product_id = idV5`. Lalu `/bayar?plan=bulanan` tanpa produk: harga dari config seperti sekarang. Lalu `/bayar?produk=tidak-ada&plan=bulanan`: jatuh ke config.
- [ ] **Step 4: Commit** `feat: checkout records the chosen indicator product`.

### Task 6: Dokumentasi

**Files:**
- Modify: `CLAUDE.md` (bagian "Indicator v5 Pre-order Phase"). Hanya baris milik kita yang di-stage (`git update-index --cacheinfo` seperti sebelumnya), karena pemilik punya perubahan CLAUDE.md sendiri yang belum di-commit.

- [ ] **Step 1:** Tambah paragraf "Two products after v5 release": harga dari `products`, `/bayar?produk=`, `berhakKlaimV5` dan tombol klaim WA, `tanggal_rilis` dipakai sebagai batas klaim.
- [ ] **Step 2: Commit** `docs: document two-product indicator sales`.
