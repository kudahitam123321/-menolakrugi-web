# Design: Halaman Pricing Terpisah + Perbaikan Order pada Signup Member Baru

Date: 2026-07-06

## Overview

Saat ini ada 4 jalur pembayaran yang tumpang tindih dan tidak konsisten: `/checkout` (hardcoded, dipakai dashboard buat upgrade tier), `/signup` (jalur signup member baru sesungguhnya, tapi stepper visualnya rusak dan tidak pernah mencatat order), `/payment` (halaman pembayaran statis, tidak pernah membaca/menulis database sama sekali), dan `/bayar` + tab Produk dashboard (sudah berperilaku baik — order & metode bayar asli dari Supabase).

Spec ini menyelesaikan **dua bagian independen**:

- **Bagian A** — memindahkan section pricing yang sekarang menyatu di landing page (`LandingPage.tsx`) menjadi 2 halaman pricing berdiri sendiri.
- **Bagian B** — memperbaiki `/signup` → `/payment` (jalur member baru) supaya order tercatat nyata di tabel `orders` dan metode pembayaran diambil dari tabel `payment_methods`, bukan data statis/acak.

**Di luar scope spec ini** (dibahas terpisah nanti): penghapusan `/checkout` dan konsolidasi jalur **upgrade tier** untuk member yang sudah punya akun. `/checkout` dan ke-4 link yang mengarah ke sana (di `DashboardPage.tsx` legacy & `member/DashboardPage.tsx`) **tidak disentuh** oleh spec ini.

---

## Bagian A — Halaman Pricing Terpisah

### Keputusan Kunci

- 2 halaman baru, pola file flat mengikuti konvensi `src/pages/*.tsx` yang sudah ada:
  - `src/pages/PricingKelasPage.tsx` → route `/pricing-kelas`
  - `src/pages/PricingIndikatorPage.tsx` → route `/pricing-indikator`
- Kedua halaman baru mendefinisikan token lokal `LP` sendiri (copy shape dari `LandingPage.tsx`'s `LP` object) — **bukan** import dari `theme.ts` maupun dari `LandingPage.tsx`. Ini konsisten dengan konvensi codebase (file besar mendefinisikan alias token lokal sendiri) dan juga memperbaiki catatan lama di `CLAUDE.md` yang bilang `LandingPage.tsx` masih pakai `MR` dari `theme.ts` — itu sudah tidak akurat sejak revisi visual landing page terakhir (`LandingPage.tsx` sekarang sudah pakai `LP` lokal juga).
- Sumber data **tidak berubah**, cuma pindah lokasi kode:
  - `/pricing-kelas` pakai `usePricing()` (tabel `pricing_tiers`) — sama seperti section `id="kelas"` yang lama.
  - `/pricing-indikator` pakai `useLandingPreview()` (tabel `landing_preview_config`) — sama seperti komponen `ProductPreview` yang lama.
- `/pricing-kelas` berisi **2 bagian**: kartu pricing (Trial/Bronze/Gold/Platinum) di atas, lalu section **Kurikulum** (dipindah utuh dari `id="kurikulum"` di landing page) di bawahnya, dengan anchor `id="kurikulum"` dipertahankan di halaman baru ini.
- `/pricing-indikator` cuma berisi kartu pricing indikator (Bulanan/Tahunan/Lifetime) — tidak ada section tambahan.
- Tombol "Pilih"/"Pilih Bulanan" dst. di kedua halaman baru **tidak berubah tujuannya**: tier → `/signup?tier=<id>`, plan indikator → `/bayar?plan=<key>`.

### Perubahan di `LandingPage.tsx`

- Section `id="kelas"` (kartu pricing tier), section `id="kurikulum"`, dan komponen `ProductPreview` (section "Preview Platform") **dihapus seluruhnya** dari file ini.
- Tombol hero diganti dari `Pilih Kelas →` / `Lihat Kurikulum` menjadi:
  - **`Beli Kelas →`** → `window.location.href = '/pricing-kelas'`
  - **`Beli Indikator →`** → `window.location.href = '/pricing-indikator'`
- `NAV_ITEMS` (nav bar atas): entry `{ l: 'Kelas', href: '#kelas' }` → `{ l: 'Kelas', href: '/pricing-kelas' }`. Entry `{ l: 'Kurikulum', href: '#kurikulum' }` → `{ l: 'Kurikulum', href: '/pricing-kelas#kurikulum' }`.
- Footer: link `{ l: 'Kurikulum', href: '/#kurikulum' }` (di kolom BELAJAR) → `/pricing-kelas#kurikulum`. Link 4 tier di kolom KELAS (`/signup?tier=trial` dst.) **tidak berubah** — itu sudah langsung ke signup tanpa lewat halaman pricing, tetap dipertahankan sebagai pintasan cepat.
- Import `ProductPreview` component dan pemanggilannya di JSX utama dihapus. Fungsi lokal untuk section `kelas`/`kurikulum` (kalau berbentuk fungsi terpisah seperti pola `PricingSection`) ikut dihapus dari file ini setelah dipindah isinya ke halaman baru.

### Routing (`App.tsx`)

Tambah 2 entri baru mengikuti pola `getPage()`/render yang sudah ada:

```
/pricing-kelas      → PricingKelasPage
/pricing-indikator  → PricingIndikatorPage
```

---

## Bagian B — Perbaikan `/signup` → `/payment` (Member Baru)

### Masalah yang Diperbaiki

1. `handleSubmit` di `SignupPage.tsx` insert ke `members` (dan `referrals` bila ada kode referral), lalu redirect ke `/payment` lewat query string (`tier`, `name`, `method`) — **tidak ada apapun yang tercatat ke tabel `orders`**. Admin tidak punya jejak "siapa beli tier apa" untuk jalur ini, berbeda dengan `/bayar` dan tab Produk dashboard yang sudah tercatat rapi.
2. Stepper 3-langkah (`STEPS = ['AKUN', 'PEMBAYARAN', 'KONFIRMASI']`) di `SignupPage.tsx` tidak pernah benar-benar berpindah state — cuma tampilan step 1 yang pernah dirender, lalu langsung redirect keluar. Preview 4 tombol metode bayar (`PAY_METHODS`: QRIS/VA/E-wallet/Kartu) di bagian bawah form juga kosmetik — tidak terhubung ke tabel `payment_methods` sungguhan, murni dekorasi yang menyesatkan.
3. `PaymentPage.tsx` menampilkan 1 rekening bank hardcoded (`BANK_INFO`) dan nomor order yang di-generate acak di client (`MR-xxxxxx-xxxx`) — halaman ini tidak pernah membaca atau menulis apapun ke Supabase.

### Perubahan `SignupPage.tsx`

- **Tambah field Email** ke form akun (setelah Nama, sebelum Password) — wajib diisi. State baru `form.email` di object `form` yang sudah ada.
- **Hapus** `PAY_METHODS` const, state `method`, dan blok JSX "METODE PEMBAYARAN — STEP 2" beserta section-nya — pemilihan metode bayar sungguhan sekarang terjadi di `/payment`.
- **Sederhanakan stepper**: ganti indikator 3-step (`STEPS` map) jadi label statis "Langkah 1 dari 2 · Akun & Pilih Kelas" (tanpa progres visual palsu), karena tahap pembayaran sungguhan sekarang ada di halaman `/payment` terpisah, bukan step di dalam halaman ini.
- **`handleSubmit`**: setelah insert `members` berhasil (dan insert `referrals` bila ada referrer), tambah insert ke `orders`:
  ```ts
  const { data: newOrder, error: orderErr } = await supabase.from('orders').insert({
    product_id:   null,
    member_id:    newMember.id,
    nama_member:  form.nama.trim(),
    email_member: form.email.trim(),
    tier_member:  tier,
    status:       'pending',
  }).select('id').single();
  if (orderErr || !newOrder) throw new Error('Gagal membuat order: ' + (orderErr?.message ?? 'unknown error'));
  ```
- Redirect akhir berubah dari `/payment?tier=...&name=...&method=...` menjadi **`/payment?order=${newOrder.id}`**.
- Juga tambahkan `email: form.email.trim()` ke payload insert `members` — kolom ini sudah ada di tipe `Member` (`src/types/mr.types.ts`) tapi sejauh ini tidak pernah diisi oleh kode manapun; mulai diisi di sini bersifat prospektif (tidak ada migrasi/backfill untuk member lama, dan tidak ada bagian aplikasi lain yang mensyaratkan `email` selalu terisi — login tetap pakai Nama+Password).

### Perubahan `PaymentPage.tsx`

Rombak total dari halaman statis menjadi halaman berbasis data:

- Baca `?order=<uuid>` dari query string (bukan `tier`/`name`/`method` lagi).
- Fetch `orders` by id → dapat `member_id`, `nama_member`, `tier_member`, `status`.
- Fetch harga & nama tier: cari di hasil `usePricing()` (tabel `pricing_tiers`) berdasarkan `tier_member`, sama seperti yang sudah dilakukan `SignupPage.tsx`'s `TierSelector`.
- Fetch daftar `payment_methods` aktif (query identik dengan yang sudah dipakai di `BayarPage.tsx`: `.select('*').neq('aktif', false).order('urutan', { ascending: true })`), render sebagai list yang bisa dipilih (adaptasi pola selectable card dari `BayarPage.tsx`, termasuk render `qris_image_url` untuk metode QRIS dan nomor rekening + tombol salin untuk transfer).
- Ringkasan pesanan & status timeline (bagian kanan) tetap ada secara visual, tapi order number yang ditampilkan sekarang **`order.id` asli**, bukan string acak.
- Tombol "KONFIRMASI VIA WHATSAPP" memakai pesan yang menyertakan `order.id` asli, nama, dan tier — pola pesan mengikuti yang sudah ada di `BayarAkunPage.tsx`'s `konfirmasiWA()`.
- Kalau `order` tidak ditemukan (id salah/kadaluarsa) atau `member_id` null → tampilkan state "Data pesanan tidak ditemukan" dengan tombol kembali ke `/signup`, mengikuti pola persis `BayarAkunPage.tsx`.

### Data Model

**Tidak ada migrasi/perubahan skema.** Tabel `orders` sudah punya semua kolom yang dibutuhkan (`product_id` nullable, `member_id`, `nama_member`, `email_member` nullable, `tier_member`, `status`, `catatan` nullable) — pola insert untuk order membership ini konsisten dengan pola yang sudah dipakai `BayarPage.tsx` (`product_id: null`, `tier_member` diisi, `catatan`/`plan_type`/`kode_diskon` dibiarkan null karena tidak relevan untuk pembelian tier langsung tanpa kode diskon).

Kode diskon/kupon (`discount_codes`) **tidak diikutkan** di jalur `/signup` ini — fitur kupon yang dulu ada di `CheckoutPage.tsx` sudah lama tidak berfungsi (`COUPONS` object kosong), dan `/checkout` sendiri di luar scope spec ini. Kalau nanti dibutuhkan, itu follow-up terpisah.

### Error Handling

- Insert `orders` gagal setelah insert `members` sukses (mis. RLS/network error): tampilkan pesan error di form (`setError`), **jangan** redirect ke `/payment` — member row sudah terlanjur ada tapi tanpa order; kasus ini sama seperti error handling yang sudah ada di `BayarPage.tsx` (`setErrMsg('Gagal menyimpan pesanan: ...')`), jadi user bisa retry submit (akan kena "nama sudah terdaftar" — ini pre-existing gap yang sama juga ada di `/bayar`, tidak diperbaiki di spec ini karena di luar scope).
- `/payment` dengan `order` param kosong/tidak valid, atau `payment_methods` kosong (belum ada metode aktif) → tampilkan empty state yang jelas (pesan "Belum ada metode pembayaran aktif." untuk kasus kedua, mengikuti pola `BayarPage.tsx`), bukan crash/blank page.

### Testing / Verifikasi

Tidak ada test suite di proyek ini (lihat `CLAUDE.md`). Verifikasi manual via dev server:

1. `npm run typecheck` — pastikan tidak ada error baru di `SignupPage.tsx`, `PaymentPage.tsx`, `LandingPage.tsx`, `PricingKelasPage.tsx`, `PricingIndikatorPage.tsx`, `App.tsx`.
2. Jalankan `npm run dev`, buka `/` → klik "Beli Kelas →" dan "Beli Indikator →", pastikan mendarat di halaman baru dengan data pricing yang benar.
3. Dari `/pricing-kelas`, pilih salah satu tier → isi form `/signup` (Nama, Email, Password) → submit → cek row baru muncul di tabel `members` **dan** `orders` (Supabase dashboard atau Admin Panel), lalu cek redirect ke `/payment?order=<id>` menampilkan tier, harga, dan metode pembayaran yang benar sesuai data di `payment_methods`.
4. Cek nav bar & footer "Kelas"/"Kurikulum" mengarah ke halaman baru dan anchor `#kurikulum` scroll ke posisi yang benar.
5. `npm run build` harus sukses.

---

## Ringkasan File yang Disentuh

| File | Perubahan |
|---|---|
| `src/pages/LandingPage.tsx` | Hapus section `kelas`/`kurikulum`/`ProductPreview`, ubah tombol hero, update `NAV_ITEMS` & footer links |
| `src/pages/PricingKelasPage.tsx` | **Baru** — kartu pricing tier + section kurikulum |
| `src/pages/PricingIndikatorPage.tsx` | **Baru** — kartu pricing indikator |
| `src/App.tsx` | Tambah routing `/pricing-kelas`, `/pricing-indikator` |
| `src/pages/SignupPage.tsx` | Tambah field Email, hapus preview metode bayar dummy, sederhanakan stepper, insert `orders` setelah insert `members`, redirect pakai `order.id` |
| `src/pages/PaymentPage.tsx` | Rombak total: baca order asli dari Supabase, tampilkan `payment_methods` asli, order number asli |

**Tidak disentuh**: `/checkout` (`CheckoutPage.tsx`), jalur upgrade tier, `/bayar`, `/bayar/akun`, tab Produk dashboard, `CLAUDE.md` (update dokumentasi routing dilakukan terpisah setelah implementasi selesai, bukan bagian dari spec ini).
