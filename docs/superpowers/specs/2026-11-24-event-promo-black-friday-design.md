# Event Promo (Black Friday) — Design

**Tanggal:** 2026-11-24 · **Status:** menunggu persetujuan

## Tujuan
Halaman event promo seperti Black Friday TradingView, tapi bergaya Menolak Rugi. Harga promo berlaku otomatis dalam rentang waktu tertentu, lalu kembali normal sendiri, tanpa admin mengganti harga tengah malam. Event pertama: **Black Friday, 27–30 Nov 2026**. Setelah event selesai, promo rilis v5 (50% s/d 1 Des) jalan lagi seperti biasa.

**Non-goal:** kode voucher baru, banyak event sekaligus, pembayaran otomatis.
**Anti-goal:** harga di halaman event berbeda dengan harga yang ditagih di /bayar atau di dashboard.

## Pendekatan
- **A. Event diatur dari admin (dipilih).** Satu baris konfigurasi event: mulai, selesai, diskon per produk dan paket. Selama event berjalan, diskon itu mengganti diskon produk di semua tempat harga dihitung.
- B. Pakai kolom diskon produk yang ada: harga harus diganti manual 2×, dan tidak bisa menyimpan dua promo berurutan. Ditolak.
- C. Tanggal dan diskon ditulis di kode: tidak bisa diubah dari admin. Ditolak.

## Desain

**Data:** tabel `promo_event`, satu baris id=1 (pola sama dengan `landing_preview_config`). Kolomnya:
- `aktif` bool
- `nama` text
- `judul` text
- `subjudul` text
- `mulai` timestamptz
- `selesai` timestamptz
- `diskon` jsonb `{ "<product_id>": { "bulanan": 20, "tahunan": 30, "lifetime": 40 } }`
- `bonus` text
- `unggulan` jsonb `{ "product_id", "plan" }` untuk kartu "PENAWARAN TERBAIK"

RLS `using (true)` mengikuti pola app. Migration: `supabase-promo-event-migration.sql`, dijalankan sekali oleh user.

**Logika** (`src/lib/indikatorV5.ts`, diuji di `scripts/check-indikator-v5.mjs`):
- `eventBerjalan(ev, now)` bernilai true jika `aktif && mulai <= now <= selesai`.
- `paketDariProduk(p, now, ev?)`: jika event berjalan dan punya diskon untuk produk dan paket itu, pakai diskon event. Jika tidak, pakai aturan lama (`diskon_*` + `diskon_hingga`). Satu-satunya sumber harga, jadi harga sama di mana pun.
- Hook `usePromoEvent()` di `src/hooks/index.ts`.

**Tempat yang memakai harga event:**
- `/pricing-indikator` (`paketDariProduk`)
- `/bayar` (`paketDariProduk`, `diskon_applied` tercatat dengan diskon event)
- Katalog Produk di dashboard. Saat ini menghitung diskon inline; diganti memanggil `paketDariProduk`.

**Halaman `/promo`** (route baru di `App.tsx`; `/black-friday` diarahkan ke sini), berisi:
- Hero gelap: judul, subjudul, hitung mundur ke `selesai`.
- Kartu per paket berdiskon: badge −X% besar, harga coret, harga promo, "Hemat RpX". Bonus ditampilkan di bawah harga. Kartu unggulan diberi badge "PENAWARAN TERBAIK". Tombol beli menuju `/bayar?produk=&plan=`.
- Kartu Data Backtest v5 dan tabel perbandingan (komponen yang sudah ada).
- FAQ statis: cara bayar, kapan akun aktif, beda v4.2 vs v5, pemilik lama bisa ikut?, setelah promo harga kembali berapa.
- Sebelum `mulai`: "Segera hadir" + hitung mundur ke `mulai`.
- Sesudah `selesai`: "Promo sudah berakhir" + tombol ke /pricing-indikator.

**Banner** (`PromoBanner`): saat event berjalan, tampil banner event paling atas, misalnya "🖤 Black Friday — diskon hingga 60% · berakhir dalam 2h 14j → Lihat promo". Di luar event, perilaku lama.

**Admin:** Admin → Produk → Preview Landing → bagian baru "// EVENT PROMO". Isinya form aktif/nama/judul/subjudul/mulai/selesai, tabel diskon per produk × paket (hanya paket yang punya harga), pilihan unggulan, teks bonus, dan tautan "Lihat halaman →".

**Isi untuk Black Friday 2026** (diisi lewat admin setelah migration):

| Pengaturan | Nilai |
|---|---|
| Mulai | 27 Nov 00.00 WIB |
| Selesai | 30 Nov 23.59 WIB |
| v5 Lifetime | 60% (unggulan) |
| v4.2 Bulanan | 20% |
| v4.2 Tahunan | 30% |
| v4.2 Lifetime | 40% |
| Bonus | "Bonus indikator scalping SCOB POI untuk semua pembeli" |

## Diserahkan ke builder
Detail visual, mengikuti token `LP` dan gaya halaman pricing; jangan meniru aset TradingView. Teks FAQ final.
