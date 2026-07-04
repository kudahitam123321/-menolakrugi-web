# Design: Metode Pembayaran QRIS (foto QR)

Date: 2026-07-04

## Overview

Admin saat ini hanya bisa menambah metode pembayaran bertipe transfer bank (`nama_bank` + `nomor_rekening` + `nama_rekening`, semua wajib) di tabel `payment_methods`. Fitur ini menambah tipe kedua: **QRIS**, di mana admin cukup mengunggah foto/gambar QR — tanpa nomor rekening. Metode pembayaran ini dikonsumsi di dua tempat: `BayarPage.tsx` (visitor) dan `DashboardPage.tsx` (checkout produk indikator member) — keduanya query tabel `payment_methods` yang sama, jadi perubahan skema otomatis berlaku di keduanya.

---

## 1. Database

### Migration baru: `supabase-payment-methods-qris-migration.sql`

```sql
alter table payment_methods
  add column if not exists jenis text not null default 'bank' check (jenis in ('bank', 'qris')),
  add column if not exists qris_image_url text;
```

Tidak ada perubahan RLS — kebijakan `using (true)` / `with check (true)` yang sudah ada tetap berlaku (sesuai pola project, lihat gotcha RLS di `CLAUDE.md`).

### Storage

Gambar QR diunggah ke bucket `materi` (bucket yang sama dipakai broker logo & gambar produk), dengan prefix nama file `qris_{timestamp}_{random}.{ext}`, pola identik dengan `uploadBrokerLogo` / `uploadProdukGambar` yang sudah ada di `AdminPage.tsx`.

---

## 2. Admin UI (`src/pages/AdminPage.tsx`, tab `settings` → sub-section Metode Pembayaran)

### Form tambah & form edit

Tambah toggle dua pilihan di atas field yang sudah ada: **Transfer Bank** / **QRIS** (state baru `pmJenis` / `editPmJenis`, default `'bank'`).

- **Saat `jenis === 'bank'`** (perilaku sekarang, tidak berubah): field Nama Bank, Nomor Rekening, Atas Nama semua wajib diisi.
- **Saat `jenis === 'qris'`**: field Nomor Rekening dan Atas Nama disembunyikan dari form (tidak wajib, dikirim sebagai `null`). Field Nama Bank tetap tampil sebagai label bebas (placeholder berubah jadi contoh "QRIS / QRIS Dana / QRIS Merchant ..."). Muncul input upload file gambar + preview, menggantikan posisi dua field yang disembunyikan.

### Fungsi baru

```ts
async function uploadQrisImage(file: File): Promise<string|null> {
  const ext = file.name.split('.').pop();
  const fileName = `qris_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('materi').upload(fileName, file, { upsert: true, cacheControl: '3600' });
  if (error) { notify('Gagal upload gambar QRIS: ' + error.message, 'err'); return null; }
  const { data } = supabase.storage.from('materi').getPublicUrl(fileName);
  return data.publicUrl;
}
```

### Validasi (`addPaymentMethod`, `saveEditPm`)

- `jenis === 'bank'`: validasi sama seperti sekarang (nama_bank, nomor_rekening, nama_rekening wajib).
- `jenis === 'qris'`: nama_bank wajib; gambar wajib — pada form tambah harus ada file baru; pada form edit, gambar baru ATAU `qris_image_url` yang sudah ada (kalau admin tidak ganti gambar saat edit).
- Insert/update mengirim `jenis`, `qris_image_url`, dan `nomor_rekening`/`nama_rekening` sebagai `null` ketika `jenis === 'qris'`.

### List tampilan metode pembayaran

Untuk item dengan `jenis === 'qris'`: tampilkan thumbnail kecil (~48px) gambar QR di samping nama label, badge teks "QRIS", dan sembunyikan baris nomor rekening. Tombol EDIT/NONAKTIF/HAPUS tidak berubah.

`startEditPm` diperbarui supaya mengisi `editPmJenis` dan preview gambar dari `pm.jenis` / `pm.qris_image_url`.

---

## 3. Checkout Consumers

### `src/pages/BayarPage.tsx`

- Kartu pilihan metode (di dalam `paymentMethods.map`, radio-select) untuk `pm.jenis === 'qris'`: ganti baris nomor rekening besar dengan `<img src={pm.qris_image_url}>` ukuran penuh (~280px, `object-fit: contain`, background putih supaya QR gelap-di-terang tetap kontras) langsung di dalam kartu — bukan thumbnail. Baris "a.n." disembunyikan untuk QRIS.
- Panel "metode terpilih" (`selectedPm`) di bawahnya: untuk QRIS, tampilkan ulang gambar full-size + label, tanpa tombol salin nomor (karena tidak ada nomor).
- `handleSubmit`: perbaiki string `catatan` order dan pesan WhatsApp supaya tidak mem-print `Rek: ` kosong untuk QRIS —
  ```ts
  const metodeInfo = pm?.jenis === 'qris' ? `QRIS (${pm.nama_bank})` : `Bank: ${pm?.nama_bank || metodePm} | Rek: ${pm?.nomor_rekening || ''}`;
  catatan: `WA: ${noHp.trim()} | ${metodeInfo}`,
  ```
  Begitu juga baris `*Transfer ke:*` di pesan WA — untuk QRIS jadi `*Metode:* QRIS (${pm.nama_bank}) — scan QR yang dikirim admin` (tanpa nomor rekening/atas nama).

### `src/pages/member/DashboardPage.tsx` (modal checkout produk indikator, step "pembayaran")

- Kartu tiap `pm` di `paymentMethods.map` (baris ±2653): untuk `pm.jenis === 'qris'`, ganti baris nomor rekening + tombol "Salin" dengan `<img src={pm.qris_image_url}>` full-size (~280px) di dalam kartu. Baris "a.n." disembunyikan. `catatan` (kalau ada) tetap tampil di bawah gambar seperti sekarang.
- Tidak ada logic clipboard (`rekCopied`) yang perlu dijalankan untuk kartu QRIS.

---

## 4. File Changes Summary

| File | Aksi |
|---|---|
| `supabase-payment-methods-qris-migration.sql` | Buat baru — tambah kolom `jenis`, `qris_image_url` ke `payment_methods` |
| `src/pages/AdminPage.tsx` | Tambah toggle jenis, upload gambar QRIS, validasi bercabang, update list & edit form metode pembayaran |
| `src/pages/BayarPage.tsx` | Render kartu QRIS (gambar full-size, tanpa nomor rekening); perbaiki string catatan/pesan WA |
| `src/pages/member/DashboardPage.tsx` | Render kartu QRIS di modal checkout produk (gambar full-size, tanpa tombol salin) |

---

## 5. Out of Scope

- Verifikasi otomatis pembayaran QRIS (tetap manual via konfirmasi WhatsApp, sama seperti transfer bank sekarang)
- Generate QR code secara dinamis/terprogram (admin upload gambar statis yang sudah dibuat dari aplikasi e-wallet/bank masing-masing)
- Menghapus atau mengubah alur metode transfer bank yang sudah ada
