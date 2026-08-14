# Kode Diskon di /bayar — Design Spec

**Tanggal**: 2026-08-14

## Latar Belakang

Tabel `discount_codes` dan CRUD-nya di admin (`AdminPage.tsx`, sub-tab `kode-diskon`) sudah ada dan aktif dipakai, tapi hanya tersambung ke flow upgrade produk member yang sudah login (`DashboardPage.tsx` — fungsi `cekKodeDiskon` + `buatOrder`). Halaman `/bayar` (`BayarPage.tsx`), yaitu jalur pembelian indikator dari CTA landing page untuk visitor baru, belum bisa menerima kode kupon — harga di sana murni dari diskon plan statis (`plan1_diskon`/`plan2_diskon`/`plan3_diskon` di `landing_preview_config`).

Tujuan: visitor yang checkout lewat `/bayar` bisa memasukkan kode kupon yang dibuat admin, dan pesanan yang tercatat merefleksikan kode tersebut — sama seperti yang sudah berjalan di flow member.

## Perilaku Diskon

Saat kode kupon valid diterapkan, diskonnya **menggantikan** diskon plan bawaan (tidak ditumpuk) — identik dengan perilaku `buatOrder` di `DashboardPage.tsx:554` (`diskonPct = appliedCode ? appliedCode.diskon : produk[...]`).

## Perubahan

Semua di `src/pages/BayarPage.tsx`. Mengikuti pola yang sudah terbukti di `DashboardPage.tsx` (state `kodeDiskon`/`kodeDiskonData`/`kodeErr`/`kodeLoading`, fungsi `cekKodeDiskon`, insert order dengan increment `terpakai`).

1. **State baru**: `kodeDiskon` (input mentah), `kodeDiskonData` (row `discount_codes` tervalidasi atau `null`), `kodeErr`, `kodeLoading`.
2. **Validasi (`cekKodeDiskon`)**: query `discount_codes` where `kode = input.toUpperCase().trim()` dan `aktif = true`. Tolak dengan pesan error jika: tidak ditemukan/nonaktif, `berlaku_hingga` sudah lewat, atau `max_penggunaan` tercapai (`terpakai >= max_penggunaan`). Sama persis dengan `DashboardPage.tsx:530-540`.
3. **UI**: input teks (uppercase otomatis) + tombol "Terapkan" ditambahkan di dalam kartu "Ringkasan Pesanan" (di bawah harga, sebelum bagian metode pembayaran). Enter di input men-trigger validasi juga. Tampilkan pesan sukses (hijau, ikon check) atau error (merah) di bawah input — mengikuti styling `DashboardPage.tsx:2850-2860` diadaptasi ke local `C`/`G` tokens milik `BayarPage.tsx`.
4. **Kalkulasi harga**: `hargaDiskon` dihitung ulang — jika `kodeDiskonData` ada, pakai `kodeDiskonData.diskon`; kalau tidak, fallback ke `plan.diskon` seperti sekarang. Badge "-X%" dan teks "Hemat Rp..." mengikuti nilai yang aktif dipakai (kode atau plan).
5. **Submit (`handleSubmit`)**: insert `orders` menyertakan `kode_diskon: kodeDiskonData?.kode || null` dan `diskon_applied: kodeDiskonData ? kodeDiskonData.diskon : (plan.diskon || null)`. Setelah insert order berhasil dan kode dipakai, update `discount_codes` set `terpakai = kodeDiskonData.terpakai + 1` where `id = kodeDiskonData.id` (fire-and-forget, tidak menghalangi redirect — sama seperti `DashboardPage.tsx:570-572`).
6. **Reset**: jika input kode diubah, `kodeDiskonData` dan `kodeErr` di-reset ke `null`/`''` (kode lama tidak boleh nyangkut kalau user ganti teks).

## Di Luar Scope

- Tidak ada perubahan di admin panel — tampilan pesanan (`AdminPage.tsx:3321`) sudah otomatis menampilkan `kode_diskon`/`diskon_applied` untuk order apa pun, termasuk dari `/bayar`.
- Tidak ada perubahan skema database — kolom `kode_diskon`/`diskon_applied` di `orders` dan `terpakai`/`max_penggunaan`/`berlaku_hingga`/`aktif` di `discount_codes` sudah ada.
- Tidak menambah pembatasan kode per-produk — `discount_codes` tetap kode global seperti sekarang.

## Error Handling

- Kode tidak ditemukan/nonaktif → "Kode tidak valid atau sudah tidak aktif."
- Kode kadaluarsa → "Kode sudah kadaluarsa."
- Kode habis kuota → "Kode sudah mencapai batas penggunaan."
- Gagal update `terpakai` setelah order tersimpan → diabaikan secara diam-diam (order tetap valid; admin bisa melihat kode yang dipakai dari data order itu sendiri), konsisten dengan pola di `DashboardPage.tsx`.
