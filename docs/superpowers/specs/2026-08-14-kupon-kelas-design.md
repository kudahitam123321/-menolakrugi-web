# Kode Diskon untuk Pembelian Kelas — Design Spec

**Tanggal**: 2026-08-14

## Latar Belakang

Kode diskon (`discount_codes`) sudah bisa dipakai visitor saat membeli produk **Indikator** lewat `/bayar` ([2026-08-14-bayar-kode-diskon-design.md](2026-08-14-bayar-kode-diskon-design.md)). Pembelian **Kelas** (course) belum tersambung sama sekali — alurnya beda struktur dari Indikator, sehingga penyambungannya perlu penyesuaian, bukan copy-paste langsung.

## Perbedaan Alur Kelas vs Indikator

- **Indikator** (`/bayar`): satu halaman — ringkasan, kupon, metode bayar, dan submit order semuanya di tempat yang sama. Order baru dibuat di Supabase saat submit.
- **Kelas**: dua halaman — `/signup?tier=X` (isi akun + pilih tier, order langsung dibuat di Supabase) lalu redirect ke `/payment?order=<id>` (pilih metode bayar, tampilkan ringkasan, tombol "Konfirmasi via WhatsApp"). Order sudah ada di database sejak halaman `/payment` dibuka.
- **Model harga**: Indikator pakai `harga_asli` (rupiah) + `diskon` (persen) terpisah. Kelas (`pricing_tiers`) pakai `price` (rupiah, harga jual final) + `original_price` (rupiah, harga coret opsional) — **tidak ada field persen**. Perbandingan "kupon vs diskon bawaan" karena itu dilakukan dalam rupiah, bukan persen.

## Perilaku

- Input kode kupon ada di **`/payment`** (`PaymentPage.tsx`), di kartu "Ringkasan Pesanan" — bukan di `/signup`. Alasan: `/payment` adalah tempat total transfer ditentukan dan order sudah tercatat, paling analog dengan peran `/bayar` di alur Indikator.
- Validasi kode (klik "Terapkan") sama seperti pola yang sudah ada: kode harus `aktif`, belum lewat `berlaku_hingga`, dan `terpakai < max_penggunaan`. Klik "Terapkan" **tidak** menulis apa pun ke database — cuma memvalidasi dan menyimpan state di halaman.
- Kalkulasi harga: `harga_asli = tier.original_price ?? tier.price`. Kalau kupon diterapkan, `harga_dengan_kupon = round(harga_asli * (1 - kupon.diskon / 100))`. Harga final yang ditampilkan = **nilai rupiah terkecil** antara `harga_dengan_kupon` dan `tier.price` (harga tier yang sudah berjalan) — supaya kupon tidak pernah membuat harga lebih mahal dari harga normal, konsisten dengan perilaku yang sudah diperbaiki di alur Indikator.
- Kupon baru benar-benar "dipakai" — order di-update dengan `kode_diskon`/`diskon_applied`, dan `discount_codes.terpakai` bertambah — saat pengguna klik **"KONFIRMASI VIA WHATSAPP"** (bukan saat klik "Terapkan"). Ini analog dengan submit final di `/bayar`.
- Sebelum benar-benar menulis ke order saat klik konfirmasi, kode divalidasi ulang (fetch ulang + cek `aktif`/`berlaku_hingga`/`max_penggunaan`) — mengikuti mitigasi race-condition yang sudah diterapkan di `/bayar`. Kalau kode ternyata sudah tidak valid lagi (kadaluarsa/kuota habis di antara "Terapkan" dan "Konfirmasi"), tampilkan error dan batalkan aksi konfirmasi (jangan lanjut buka WhatsApp), pengguna bisa coba kode lain atau lanjut tanpa kode.
- Update `discount_codes.terpakai` pakai pola compare-and-swap yang sama seperti di `/bayar` (`.eq('terpakai', nilai_yang_baru_dibaca)`) untuk mengurangi risiko race dua konfirmasi bersamaan.
- Badge "🎟️ KODE -X%" di daftar pesanan admin (`AdminPage.tsx`) **tidak perlu diubah** — sudah generik, otomatis merender untuk order jenis apa pun yang punya `kode_diskon`/`diskon_applied` terisi.

## Di Luar Scope

- Tidak ada perubahan di `/signup` (`SignupPage.tsx`) — kupon tidak muncul di langkah 1.
- Tidak ada perubahan pada pesan konfirmasi WhatsApp (`konfirmasiWA`) selain memastikan order sudah ter-update sebelum pesan dibuka — pesan WA itu sendiri saat ini memang belum menyertakan nominal harga sama sekali (gap yang sudah ada sebelum fitur ini, di luar scope untuk diperbaiki di sini).
- Tidak ada perubahan skema database — kolom `orders.kode_diskon`/`diskon_applied` dan seluruh kolom `discount_codes` sudah ada dari fitur kupon Indikator sebelumnya.
- Tidak ada perubahan di admin panel — badge kupon di daftar pesanan sudah generik dan otomatis berfungsi.
