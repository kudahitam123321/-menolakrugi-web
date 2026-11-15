# Design: Indikator v5 — Pre-order, Upgrade Gratis, dan Halaman Backtest

Date: 2026-11-15
Mockup: `.superpowers/brainstorm/588-1794725013/content/preorder-v3.html` (tahap pre-order) dan `tiga-halaman-v2.html` (tahap rilis). Tata letak halaman indikator = opsi **A** yang dipilih user.

## Intent

Menolak Rugi akan merilis indikator baru (di kode: "PTMR 3 SETUP v1.2", di website disebut **SMC by MenolakRugi v5**) pada **1 Desember 2026**. Ini bukan perbaikan kecil dari v4.2: v4.2 membantu *membaca* struktur (BOS/CHoCH/IDM/OB), versi baru memakai mesin struktur yang sama lalu **langsung memberi setup trading lengkap** (entry, SL, TP 3R, lot, alarm).

Tujuan bisnis:
1. **Dapat uang lebih awal** lewat pre-order harga early-bird sebelum rilis.
2. **Menghargai pembeli lama**: pemilik v4.2 yang masih aktif dapat v5 gratis.
3. **Membangun kepercayaan** dengan menampilkan data backtest secara terbuka.

Sekaligus menutup masalah operasional yang ditemukan: admin lupa menonaktifkan langganan yang jatuh tempo (indikator dibagikan lewat link, tidak bisa dicabut). Filter "Jatuh Tempo" di Pesanan Masuk sudah dibuat terpisah (commit `153c0c1`); fitur ini menambah dorongan perpanjangan.

## Aturan bisnis (keputusan user)

- **v5 menggantikan v4.2.** v4.2 tidak dijual lagi (disembunyikan dari katalog).
- **Siapa berhak upgrade gratis:** pemilik order indikator **Lifetime**, atau **Bulanan/Tahunan yang masih aktif** (jatuh tempo belum lewat) **pada saat klaim**. Langganan yang sudah habis tidak berhak — diarahkan untuk membeli.
- **Pre-order (sekarang s/d rilis):** pembeli membayar harga early-bird, **langsung menerima link v4.2**, masa langganan mulai dihitung sejak admin mengaktifkan order (seperti sekarang). Saat v5 rilis, mereka termasuk "pemilik lama yang aktif" → klaim upgrade gratis seperti yang lain.
- **Harga early-bird berakhir saat rilis** (1 Des 2026). Besaran diskon diatur admin sendiri lewat kolom diskon per paket yang sudah ada (`landing_preview_config.planN_diskon`); angka di mockup hanya contoh.
- **Pengiriman tetap manual via WhatsApp:** admin mengirim link indikator. (Rencana jangka panjang: script invite-only TradingView setelah akun Premium — di luar cakupan.)
- **Upgrade tidak menambah masa aktif:** jatuh tempo order upgrade = jatuh tempo order lama.

## Dua tahap tampilan

Tahap ditentukan oleh **status produk v5** di katalog (`products`):
- `status = 'preorder'` → **Tahap Pre-order**. `tanggal_rilis` (sudah ada, wajib diisi untuk pre-order) dipakai untuk hitung mundur dan teks "rilis 1 Desember".
- `status = 'tersedia'` → **Tahap Rilis**. Admin mengubahnya sendiri pada hari rilis (tidak berpindah otomatis saat tanggal lewat — supaya rilis tidak terjadi sebelum file v5 siap). Kalau `tanggal_rilis` sudah lewat tapi status masih `preorder`, hitung mundur disembunyikan dan teks jadi "Segera rilis".

"Produk v5" = produk indikator aktif dengan `urutan` terkecil (pola yang sudah dipakai `BayarPage.tsx`). v4.2 dinonaktifkan (`aktif = false`) oleh admin saat v5 dibuat — order lama tetap menunjuk ke v4.2.

## Perubahan per halaman

### 1. Halaman utama (`LandingPage.tsx`)
- **Banner atas**: selama v5 berstatus pre-order *atau* 14 hari pertama setelah rilis, banner menampilkan pengumuman v5 (pre-order: "⏳ SMC Indikator v5 rilis 1 Desember — pre-order harga early-bird sekarang, langsung dapat v4.2 →"; rilis: "🚀 SMC Indikator v5 sudah rilis — pemilik v4.2 yang masih aktif upgrade gratis →"), menggantikan banner kode diskon (`PromoBanner`). Di luar masa itu `PromoBanner` kembali seperti biasa. *(Keputusan pembuat desain — user belum memilih; mudah diubah.)*
- Menu navbar: item **"Indikator v5"** + badge (`SEGERA` oranye saat pre-order, `BARU` merah 14 hari setelah rilis) → `/pricing-indikator`.
- Tombol hero "Beli Indikator →" menjadi **"Pre-order Indikator v5 →"** + badge `EARLY-BIRD` (pre-order) / **"Beli Indikator v5 →"** + badge `NEW` (rilis).
- Video hero tetap dari `landing_preview_config.yt_url` (admin mengganti ke video v5 kapan pun).

### 2. Halaman indikator (`PricingIndikatorPage.tsx`) — tata letak A
Urutan dari atas:
1. **Strip pemilik lama** (hijau muda, lebar penuh):
   - Pre-order: "✅ Sudah pakai v4.2 & masih aktif? Kamu otomatis dapat v5 gratis saat rilis 1 Desember — tidak perlu beli lagi." (tanpa tombol)
   - Rilis: "⚡ Sudah pakai v4.2? Upgrade ke v5 gratis — untuk Lifetime & langganan yang masih aktif." + tombol **Masuk & Klaim →** (`/login`; jika sudah login → `/member`).
2. **Hero**: label `// SMC BY MENOLAKRUGI · VERSI 5` (+ `· COMING SOON` saat pre-order), judul "Bukan cuma baca struktur — langsung tahu kapan entry.", subjudul pre-order "Pre-order sekarang dengan harga early-bird. **Langsung dapat v4.2 hari ini**, lalu otomatis upgrade ke v5 saat rilis." Saat pre-order: **hitung mundur** (hari/jam/menit/detik) ke `tanggal_rilis` + teks "Harga early-bird berakhir saat rilis · <tanggal>".
3. **4 kartu fitur** (konten tetap di kode — diverifikasi dari script `PTMR 3 SETUP v1.2`):
   - **3 Setup Otomatis** — Follow Trend, Counter Trend, dan SCOB POI — entry, SL & TP langsung tergambar di chart.
   - **Label Order Siap Pasang** — `📌 SELL LIMIT · SL · TP 3R` lengkap jam WITA, otomatis ✅ Terisi / ✖ Batal.
   - **Kalkulator Lot Otomatis** — isi saldo, leverage & risk % — lot muncul di label dan alarm, ada peringatan margin.
   - **Alarm Lengkap ke HP** — saat limit dipasang, terisi, digeser, atau dibatalkan, lengkap dengan alasannya.
4. **Kartu ke-5 "Riwayat Data Jelas"** (lebar penuh, latar gelap): "Setiap parameter dikunci dari riset backtest XAUUSD M5 — lihat sendiri daftar trade, win rate, dan hasilnya." + tombol **Lihat Data Backtest →** (`/backtest-indikator`). Kartu ini disembunyikan kalau belum ada data backtest yang diunggah.
5. **Catatan instrumen** (satu baris di bawah kartu): "Dioptimalkan untuk XAUUSD timeframe M5."
6. **Kartu harga** (3 paket, data dari `landing_preview_config` seperti sekarang). Saat pre-order: label `EARLY-BIRD -X%` jika diskon > 0, harga coret, poin "v4.2 langsung hari ini · v5 otomatis saat rilis", tombol "Pre-order <Paket> →". Saat rilis: poin "Indikator v5 · update selama aktif", tombol "Pilih <Paket> →". Tombol tetap ke `/bayar?plan=<key>`.
7. **Cara Pembelian** — teks diperbarui: langkah 5–6 lama (join Discord, channel privat) diganti dengan "Admin mengirim link indikator via WhatsApp" (+ saat pre-order: "link v4.2 dikirim sekarang, link v5 dikirim saat rilis").

Hapus klaim lama "dashboard multi-timeframe" (fitur itu tidak ada di script).

### 3. Halaman backtest baru (`/backtest-indikator`)
**Pembaruan:** halaman = salinan bersih file user `D:\backtest\BACKTEST FIX.html` sebagai file statis `public/backtest-indikator.html` (tampilan & perhitungan identik), data diambil dari `backtest_config`. Menu **Script dihapus**; menu **Data & Simulasi tetap ada tanpa sandi, hanya berisi simulasi Modal awal + Risk per trade**. Rincian di bawah menggambarkan isinya:
- Sidebar teal: logo Menolak Rugi, menu **Ringkasan · Analisa Waktu · BUY vs SELL · Streak · Daftar Trade**, footer "Menolak Rugi (PTMR) Backtest Dashboard". Di mobile sidebar jadi tab horizontal di atas.
- Header judul (diambil dari data unggahan, mis. "PTMR Backtest — XAUUSD 5m"), filter **Periode** (Semua / per bulan) dan **Arah posisi** (Semua/BUY/SELL), tombol Reset filter, teks ringkas "Periode …: net … dari N trade".
- **Ringkasan**: 6 kartu (Total Trade + BUY/SELL, Net Profit + % dari equity awal, Win Rate + win/loss, Profit Factor + avg win/loss, Max Drawdown + nominal, Expectancy per trade), gauge **Win Rate vs Impas** (impas = 1/(1+TP R)), grafik **Pertumbuhan Equity** (toggle "Lanjut dari keseluruhan data" / "Mulai dari modal awal"), bar **Net Profit BUY vs SELL**, area **Drawdown**.
- **Analisa Waktu**: PnL per bulan, per jam entry (WITA), per hari.
- **BUY vs SELL**: tabel statistik berdampingan.
- **Streak**: 5 loss beruntun terpanjang, 5 win beruntun terpanjang.
- **Daftar Trade**: tabel semua trade.
- Tombol kembali ke halaman indikator di bawah. Tanpa disclaimer (keputusan user).
- Semua metrik dihitung di browser dari daftar trade + modal awal. Grafik digambar dengan SVG tangan (tidak menambah dependensi).
- Warna mengikuti dashboard asli (teal); font Geist seperti website.

### 4. Unggah data backtest (Admin → Produk → Preview Landing)
Bagian baru "// DATA BACKTEST":
- Input: judul (default "PTMR Backtest — XAUUSD 5m"), modal awal (default 10.000), TP (R) untuk garis impas (default 3), file export **List of Trades** dari Strategy Tester TradingView (`.csv` atau `.xlsx`, dibaca dengan paket `xlsx` yang sudah ada).
- Setelah file dipilih: pratinjau jumlah trade, rentang tanggal, net profit hasil parsing → tombol **Simpan & Tampilkan**. Simpan mengganti data lama sepenuhnya.
- Tombol **Sembunyikan** untuk mematikan halaman/kartu backtest tanpa menghapus data.
- Export TradingView berisi 2 baris per trade (Entry + Exit); parser menggabungkannya menjadi 1 baris per trade (seperti dataset "trades" di dashboard asli).

Penyimpanan: tabel single-row `backtest_config` (pola sama dengan `landing_preview_config`, upsert id=1): `judul`, `modal_awal`, `tp_r`, `trades jsonb` (array trade yang sudah dinormalisasi), `tampil boolean`, `updated_at`. RLS `using (true)` sesuai konvensi proyek. Migrasi: `supabase-backtest-config-migration.sql`.

### 5. Dashboard member kelas (`member/DashboardPage.tsx`, tab `produk`)
- **Katalog**: hanya menampilkan produk aktif (v5). Saat pre-order: badge `PRE-ORDER · RILIS <tgl>`, chip harga early-bird, tombol "Pre-order v5 →". Saat rilis: badge `BARU`, tombol "Beli v5 →". (Mengikuti alur beli member yang sudah ada.)
- **Kotak upgrade** di atas "Pesanan Saya" (dan versi kecil di Beranda) untuk member yang punya order indikator — isinya sama dengan dashboard pembeli indikator (§6).

### 6. Dashboard pembeli indikator (tier `Indikator *`, `member/DashboardPage.tsx`)
**Kartu "Langganan Indikator"** di Beranda (sudah ada) ditambah progress bar sisa hari, dan di bawahnya satu kotak sesuai keadaan:

Tahap pre-order:
| Keadaan | Kotak |
|---|---|
| Aktif & jatuh tempo **setelah** tanggal rilis, atau Lifetime | 🎁 "v5 rilis 1 Desember — gratis untukmu. Tombol klaim muncul di sini saat rilis." + badge "N hari lagi" |
| Aktif tapi jatuh tempo **sebelum** tanggal rilis | 🎁 "Perpanjang sebelum 1 Des supaya tetap aktif & dapat v5 gratis." + tombol **Perpanjang →** |
| Sudah habis | "Pre-order v5 harga early-bird — langsung aktif lagi dengan v4.2, otomatis v5 saat rilis." + tombol **Pre-order →** |

Tahap rilis:
| Keadaan | Kotak |
|---|---|
| Berhak upgrade, belum klaim | Kotak gradasi hijau "✨ v5 rilis — upgrade gratis. Masa aktif tetap sampai <tgl>." + tombol **Klaim Upgrade Gratis →** |
| Sudah klaim, order upgrade masih pending | Kotak kuning "⏳ Klaim upgrade v5 terkirim — admin akan mengirim link v5 ke WhatsApp kamu." + tombol Chat Admin |
| Sudah di-upgrade (order upgrade aktif) | Kartu menampilkan v5; tombol Perpanjang seperti biasa |
| Sudah habis | "v5 sudah rilis — perpanjang untuk langsung dapat versi terbaru." + tombol **Beli v5 →** |

**Sidebar pembeli indikator dirapikan**: menu yang bisa dipakai di atas (Beranda, Indikator Saya/Produk, Chart, Pengaturan, Bantuan), menu khusus member kelas dikelompokkan di bawah judul "KHUSUS MEMBER KELAS" dengan ikon gembok — bukan 13 menu terkunci bercampur.

### 7. Klaim upgrade — data & admin
**Kelayakan** (dihitung di frontend dari order milik member):
- Ada order indikator berstatus `aktif` yang Lifetime, atau jatuh temponya (`hitungJatuhTempo`) belum lewat, **dan**
- order itu bukan "sudah v5": produknya bukan v5, **atau** produknya v5 tapi `activated_at` < `tanggal_rilis` (pembeli pre-order yang menerima v4.2), **dan**
- belum ada order upgrade (`is_upgrade = true`) milik member itu.

**Klik "Klaim Upgrade Gratis"** → insert `orders`: `product_id` = v5, `member_id`, `nama_member`, `tier_member`, `no_hp` (dari order asal), `plan_type` = sama dengan order asal, `status = 'pending'`, `is_upgrade = true`, `upgrade_dari = <id order asal>`, harga/diskon tidak relevan. Lalu buka WA admin dengan pesan otomatis ("Halo Admin, saya <nama> klaim upgrade gratis ke v5. Order asal: <plan>, jatuh tempo <tgl>.").

Migrasi `supabase-orders-upgrade-migration.sql`: `alter table orders add column if not exists is_upgrade boolean not null default false; add column if not exists upgrade_dari uuid;`

**Admin → Pesanan Masuk**:
- Filter baru **UPGRADE (n)** (ungu) di samping filter yang sudah ada.
- Baris order upgrade berlabel `UPGRADE · GRATIS` + teks "v4.2 <PLAN> → v5 · ikut jatuh tempo lama: <tgl>".
- Saat admin mengubah order upgrade menjadi `aktif`, `activated_at` **disalin dari order asal** (bukan waktu sekarang), sehingga jatuh tempo upgrade = jatuh tempo lama. Order asal tidak diubah.
- Dashboard member: jika ada order upgrade aktif, kartu langganan menampilkan order itu (v5) dan menyembunyikan order asalnya.

## Non-goals
- Pengiriman otomatis link / integrasi TradingView invite-only.
- Mencabut akses pemakai link v4.2 yang langganannya habis (link tidak bisa dicabut).
- Tabel perbandingan v4.2 vs v5, pembayaran upgrade berbayar, paket bundel.
- Data & Simulasi, Script di halaman backtest publik.
- Perbaikan keamanan sandi/RLS (dicatat terpisah — sandi admin & member tersimpan tanpa enkripsi dan kemungkinan terbaca publik).

## Anti-goals
- Halaman menjanjikan fitur yang tidak ada di script (mis. "dashboard multi-timeframe").
- Menampilkan angka performa dari data yang tidak sesuai produk yang dijual.
- Upgrade gratis memperpanjang masa langganan.
- Pembeli lama yang berhak harus membayar lagi, atau pembeli yang habis langganannya dapat v5 gratis.

## Constraints
- Tanpa library routing/state/chart baru; ikuti pola inline style + `var(--lp-*)` / `C`/`G` lokal per file (lihat CLAUDE.md).
- Auth custom localStorage; RLS `using (true)`.
- Deploy otomatis saat push ke `main` — fitur harus aman ditampilkan sebelum admin selesai mengisi data (kartu backtest tersembunyi bila belum ada data; tanpa produk pre-order, halaman tampil seperti tahap rilis).

## Approaches considered
- **Klaim upgrade**: (A) klaim lewat dashboard, tercatat sebagai order — **dipilih**: hanya yang berhak bisa klaim, admin punya catatan, tidak dobel; (B) tombol WA saja — cepat tapi siapa pun bisa klik dan tidak tercatat; (C) admin kirim massal — butuh halaman daftar khusus dan repot.
- **Tata letak halaman indikator**: (A) fokus produk baru + strip upgrade di atas — **dipilih**; (B) harga dulu + tabel perbandingan.
- **Masa pre-order**: (1) pre-order early-bird, langsung dapat v4.2 — **dipilih**; (2) waitlist; (3) pre-order murni menunggu v5.
- **Data backtest**: unggah sendiri dari admin — **dipilih** (indikator sering diperbarui); alternatif data statis di repo diperbarui developer.

## Dibiarkan ke builder
- Pemecahan komponen dan nama state; cara menggambar grafik SVG.
- Format parser export TradingView (kolom persisnya dibaca dari file contoh yang diunggah user).
- Teks microcopy minor selain yang dikutip di atas.

## Keputusan yang dibuat pembuat desain (mohon dicek)
1. Banner pengumuman v5 menggantikan banner promo diskon selama pre-order dan 14 hari setelah rilis.
2. Perpindahan ke tahap rilis manual lewat status produk (bukan otomatis saat tanggal lewat).
3. Konten 4 kartu fitur ditulis tetap di kode (bukan bisa diedit admin), karena sudah diverifikasi dari script.
4. Catatan "Dioptimalkan untuk XAUUSD M5" ditampilkan di halaman indikator.
5. Data backtest disimpan sebagai satu baris `backtest_config` (jsonb), satu set data aktif dalam satu waktu.
6. Klaim upgrade memakai tabel `orders` yang ada (kolom `is_upgrade`, `upgrade_dari`), bukan tabel baru.
7. Order Bulanan/Tahunan aktif yang **tidak punya `activated_at`** (diaktifkan sebelum fitur jatuh tempo ada — saat ini 16 order) dianggap **tidak berhak otomatis**, karena jatuh temponya tidak diketahui. Kotak di dashboard mereka: "Hubungi admin untuk cek kelayakan upgrade" + tombol WA. Admin bisa set ulang status ke Aktif supaya tanggalnya tercatat.
8. Harga early-bird **tidak berakhir otomatis**: pada hari rilis admin mengubah status produk v5 ke Tersedia **dan** mengosongkan diskon paket di Preview Landing. Panel admin menampilkan pengingat di bagian Preview Landing saat produk v5 berstatus Tersedia tapi diskon paket masih > 0.

## Checklist admin hari H (1 Desember)
1. Katalog Produk → v5: status Pre-order → **Tersedia**.
2. Preview Landing → diskon paket early-bird → 0 (atau harga normal baru).
3. Ganti video hero ke video v5 bila belum.
4. Pastikan data backtest versi 3 setup sudah diunggah.
5. Proses klaim di filter **UPGRADE**: kirim link v5 via WA → set Aktif.
6. Kirim link v5 ke pembeli pre-order yang mengklaim.
