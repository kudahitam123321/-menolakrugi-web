# Rilis Indikator v5 sebagai Produk Kedua — Desain Singkat

Tanggal: 2026-11-20 · Menggantikan rencana fase rilis di `2026-11-15-indikator-v5-preorder-upgrade-design.md`.

## Maksud
Pemilik memutuskan v5 bukan pengganti v4.2, melainkan **produk kedua**. v5 rilis **hari ini (20 November 2026)**, tanpa fase pre-order lagi.
- v4.2 tetap dijual dengan harga yang sama. v5 dijual lebih mahal. Pembeli bebas memilih.
- Yang sudah punya v4.2 **sebelum 20 November 2026** (Lifetime, atau Bulanan/Tahunan yang masih aktif) dapat v5 gratis.
- Setelah rilis tidak ada bonus silang. Membeli v4.2 hanya dapat v4.2.

## Non-goal
- Tidak ada pesanan upgrade atau filter UPGRADE di sistem. Tombol klaim hanya meneruskan ke WhatsApp admin, lalu admin mengirim link v5 secara manual.
- Tidak ada TradingView invite-only (nanti, setelah Premium).
- Kode pre-order dibiarkan dorman (aktif lagi kalau suatu saat ada produk berstatus pre-order). Tidak dihapus.

## Pendekatan
- **Klaim tercatat:** tombol "Klaim v5 Gratis" membuat pesanan gratis dan filter UPGRADE di admin. Tercatat rapi, tapi kira-kira setengah hari kerja.
- **Info + chat admin:** dashboard hanya menampilkan info "Anda berhak v5 gratis, chat admin".
- **Dipilih pemilik:** tombol **"Klaim v5 Gratis"** yang, saat diklik, membuka WhatsApp admin dengan pesan klaim terisi. Admin mengecek dan mengirim link. Tidak ada catatan klaim di sistem.

## Perubahan

### 1. Halaman `/pricing-indikator` menampilkan dua produk
- Kartu harga diambil dari tabel `products` (produk aktif, urut `urutan`), memakai kolom `harga_bulanan/tahunan/lifetime` dan `diskon_*`. Paket yang harganya kosong tidak ditampilkan.
- Tampilannya **dua blok produk berurutan** (v5 di atas, sesuai `urutan`), masing-masing berisi judul produk dan 3 kartu paket. Blok v5 diberi badge "TERBARU".
- Tombol beli → `/bayar?produk=<id>&plan=<bulanan|tahunan|lifetime>`.
- Kalau tabel `products` gagal dibaca atau kosong, halaman memakai 3 paket dari `landing_preview_config` seperti sekarang.

### 2. `/bayar` mengikuti produk yang dipilih
- Membaca `?produk=`. Harga dan diskon paket diambil dari baris produk itu, dan `orders.product_id` diisi id produk itu.
- Nama produk tampil di ringkasan pesanan.
- Tanpa `?produk=` (link lama), tetap memakai perilaku sekarang: harga dari config dan produk aktif teratas.
- Diskon efektif tetap `max(kode, diskon paket)`. Kode diskon berlaku untuk kedua produk.

### 3. Tombol "Klaim v5 Gratis" di dashboard
- **Produk v5** = produk aktif yang punya `tanggal_rilis`. **Batas** = `tanggal_rilis` pukul 00:00 WIB.
- **Berhak** = punya order indikator `aktif` untuk produk **selain v5**, `activated_at` < batas, dan (lifetime, atau jatuh tempo ≥ batas).
- Yang berhak melihat kotak 🎁 "Kamu dapat Indikator v5 gratis" dengan tombol **Klaim v5 Gratis →**. Tombol membuka `wa.me/6281242224939` di tab baru dengan pesan terisi: permintaan klaim v5 gratis, nama, email akun, dan paket v4.2-nya. Kotak tampil di Beranda dan tab Produk.
- Yang tidak berhak tidak melihat kotak itu. Fungsi kelayakan ditaruh di `src/lib/indikatorV5.ts` dan dicek oleh `scripts/check-indikator-v5.mjs`.

### 4. Admin: tanggal rilis tidak hilang saat status Tersedia
- Sekarang `tanggal_rilis` dikosongkan begitu status bukan `preorder`. Diubah: field Tanggal Rilis tetap bisa diisi dan disimpan untuk status Tersedia, karena dipakai sebagai batas kelayakan.

## Langkah admin hari ini (data, bukan kode)
1. Katalog Produk → v5: status **Tersedia**, tanggal rilis **2026-11-20**, isi harga 3 paket, urutan paling kecil.
2. Katalog Produk → v4.2: **aktifkan lagi**, harga tetap.
3. Kode Diskon → PREORDERV5: diubah jadi promo rilis atau dinonaktifkan dan dilepas dari banner (keputusan pemilik). Diskon early-bird di Preview Landing dikembalikan ke 0.
4. Sudah dicek: satu-satunya pesanan pre-order (17 Nov, bulanan, pending) menempel ke produk v5, jadi diperlakukan sebagai pembeli v5.

## Diserahkan ke pembangun
- Detail visual blok produk (ikuti gaya kartu yang ada).
- Teks persis pesan WhatsApp.
