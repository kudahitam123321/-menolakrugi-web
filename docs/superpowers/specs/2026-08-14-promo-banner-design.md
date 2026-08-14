# Banner Promo Kode Diskon — Design Spec

**Tanggal**: 2026-08-14

## Latar Belakang

Referensi: situs kompetitor (FundingPips) menampilkan bar promo tipis di paling atas halaman ("New here? Get 20% OFF your first challenge with code HELLO. Excludes 100K accounts.") yang mengumumkan kode diskon aktif ke semua pengunjung. Kita ingin hal serupa: begitu admin membuat kode diskon dan menandainya untuk ditampilkan, sebuah bar promo otomatis muncul di halaman-halaman publik.

Kode diskon (`discount_codes`) di sistem ini bersifat general-purpose — admin bisa saja membuat kode privat untuk satu pembeli tertentu (hasil nego lewat WhatsApp), bukan untuk disiarkan ke publik. Karena itu **tidak semua kode aktif otomatis tampil di banner** — admin harus menandai secara eksplisit kode mana yang mau di-broadcast.

## Perilaku

- Admin menambahkan 2 hal baru saat **membuat** kode diskon (bukan edit — kode diskon di sistem ini memang hanya bisa dibuat sekali dan di-nonaktifkan/dihapus, tidak ada alur edit untuk field-field lain seperti `kode`/`diskon`/`max_penggunaan`/`berlaku_hingga`; field banner baru ini ikut pola yang sama):
  - Toggle **"Tampil di Banner"** (default OFF).
  - Kolom teks bebas **"Teks Banner"** — admin menulis kalimat promonya sendiri (termasuk menyebut kodenya di dalam kalimat itu sendiri, seperti contoh FundingPips), bukan format otomatis dari sistem.
  - Kalau toggle ON, "Teks Banner" wajib diisi (validasi sama seperti field wajib lain di form ini).
- Banner publik menampilkan **satu** kode yang memenuhi syarat: `aktif = true`, `tampil_banner = true`, belum melewati `berlaku_hingga` (kalau diisi), dan `terpakai < max_penggunaan` (kalau diisi). Kalau lebih dari satu kode memenuhi syarat sekaligus (seharusnya jarang terjadi, tapi tidak dicegah oleh sistem), ambil yang paling baru dibuat.
- Kalau tidak ada kode yang memenuhi syarat, banner **tidak render sama sekali** (tidak ada bar kosong yang makan tempat).
- Banner tidak bisa ditutup pengunjung — tetap tampil selama kodenya masih memenuhi syarat di atas.
- Banner tampil di 6 halaman publik: landing page (`/`), `/pricing-indikator`, `/pricing-kelas`, `/bayar`, `/login`, `/signup`. Tidak tampil di halaman member/admin (butuh login) maupun halaman publik lain yang tidak disebut di atas (`/checkout`, `/payment`, `/partnership`, `/calendar`, `/komunitas`, `/competition`, `/bayar/akun`).
- Di daftar kode diskon admin, kode yang sedang tampil di banner (memenuhi semua syarat di atas) diberi badge kecil "📢 BANNER" supaya admin bisa lihat sekilas kode mana yang sedang di-broadcast.

## Perubahan Data

Tambah 2 kolom ke tabel `discount_codes` (via migrasi SQL manual — dijalankan sendiri oleh admin/user di Supabase SQL editor, sama seperti semua file `supabase-*.sql` lain di repo ini):
- `tampil_banner boolean not null default false`
- `banner_teks text` (nullable)

Tidak ada perubahan pada tabel lain.

## Perubahan Kode

1. **`src/pages/AdminPage.tsx`** (sub-tab `kode-diskon`):
   - State baru untuk form buat kode: teks banner (string) dan toggle tampil-di-banner (boolean).
   - `addDiscountCode()`: validasi baru (toggle ON tapi teks kosong → error), lalu sertakan `tampil_banner`/`banner_teks` di insert.
   - JSX form "BUAT KODE DISKON": tambah input teks banner + tombol toggle, mengikuti gaya toggle `dcAktif` yang sudah ada di form yang sama.
   - JSX daftar kode: tambah badge "📢 BANNER" dengan logika kelayakan yang sama seperti yang dipakai `PromoBanner` (lihat di bawah).

2. **Komponen baru `src/components/PromoBanner.tsx`**:
   - Query `discount_codes` untuk kode yang `aktif = true` dan `tampil_banner = true`, urut `created_at` menurun, ambil satu.
   - Cek kelayakan (belum kadaluarsa, belum habis kuota) di sisi client, sama seperti pengecekan yang sudah ada di `cekKodeDiskon` (`BayarPage.tsx`/`DashboardPage.tsx`).
   - Kalau tidak ada yang lolos atau `banner_teks` kosong: render `null`.
   - Kalau ada: render bar penuh lebar, background `var(--mr-gold)`, teks putih, di tengah, menampilkan `banner_teks` apa adanya.

3. **`src/App.tsx`**: render `<PromoBanner />` sebelum komponen halaman untuk 6 rute publik yang disebut di atas (home/signup/bayar/pricing-indikator/pricing-kelas/login).

## Di Luar Scope

- Tidak ada tombol tutup/dismiss di banner.
- Tidak ada alur edit untuk kode diskon yang sudah dibuat (termasuk field banner baru ini) — konsisten dengan keterbatasan yang sudah ada di fitur kode diskon saat ini.
- Tidak ada pembatasan sistem yang mencegah admin menandai lebih dari satu kode sebagai "tampil di banner" sekaligus — kalau itu terjadi, sistem cukup menampilkan salah satu (paling baru) tanpa error.
- Tidak ada perubahan pada halaman non-publik (member dashboard, admin panel) atau halaman publik yang tidak disebut secara eksplisit di atas.
