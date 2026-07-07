# Dashboard Berbeda untuk Member Indikator

## Latar belakang

Pembeli produk indikator (tier `Indikator Bulanan`/`Tahunan`/`Lifetime`, dari fitur sebelumnya — lihat `docs/superpowers/specs/2026-07-07-indikator-tier-design.md`) bisa login ke `/member` dan saat ini melihat **dashboard yang sama persis** dengan member kelas: 18 tab sidebar, tab home penuh widget progress belajar (video selesai, progress kategori, status trading), dsb — semuanya tidak relevan buat mereka.

Tujuan: mereka tetap login ke website yang sama (satu `DashboardPage.tsx`, tidak ada halaman terpisah), tapi fitur khusus member kelas dikunci dengan ajakan upgrade, dan tab utama (home) diganti jadi ringkas — status pesanan indikator mereka + akses cepat beli lagi + hubungkan Discord.

## Solusi

### 1. Kunci 12 tab khusus kelas (bukan disembunyikan)

Sidebar tetap menampilkan semua 18 item — **tidak difilter**. Yang berubah adalah **isi tab**-nya ketika diakses oleh member indikator.

Tambah helper di `member/DashboardPage.tsx`:

```ts
const isIndikatorMember = normalizeTier(member.tier) === 'indikator';
```

(`normalizeTier` sudah mengembalikan `'indikator'` untuk 3 tier baru — hasil dari fitur sebelumnya.)

12 tab yang perlu dikunci: `kelas`, `materi`, `jurnal`, `trading-plan`, `komunitas`, `tools`, `funded`, `peringkat`, `competition`, `sertifikat`, `ulasan`, `referral`.

**Tab `1on1` tidak perlu disentuh** — sudah ada gating tier sendiri di baris 2339-2380 (`ELIGIBLE_TIERS` cuma Gold/Platinum), otomatis mengunci tier indikator juga karena tidak ada di daftar itu. Pesannya ("Fitur Eksklusif Gold & Platinum") sudah cukup jelas dan tidak perlu diubah.

**Pendekatan** (meniru pola yang sudah ada persis di tab `1on1`, baris 2358-2379 — kartu 🔒 + judul + deskripsi + badge tier + tombol upgrade):

1. Komponen baru `LockedClassFeature({ label }: { label: string })` — kartu terkunci generik:
   - Emoji 🔒, judul "Fitur Khusus Member Kelas"
   - Deskripsi: `{label} hanya tersedia untuk member kelas SMC (Trial, Bronze, Gold, atau Platinum).`
   - Badge tier saat ini (pola sama seperti baris 2370-2372)
   - Tombol `<a href="/pricing-kelas">Gabung Kelas →</a>` (bukan `/checkout` seperti pola lama di 1on1 — `/pricing-kelas` adalah halaman pricing kelas yang sudah dibuat di fitur revamp sebelumnya dan merupakan tujuan yang benar saat ini)
2. Untuk masing-masing dari 12 blok `{active === 'X' && (...)}`, tambahkan `&& !isIndikatorMember` ke kondisinya (jadi `{active === 'X' && !isIndikatorMember && (...)}`).
3. Tambahkan **satu** blok baru (diletakkan di dekat blok-blok tab lain) yang menangani ke-12 kasus itu sekaligus:
   ```tsx
   {isIndikatorMember && ['kelas','materi','jurnal','trading-plan','komunitas','tools','funded','peringkat','competition','sertifikat','ulasan','referral'].includes(active) && (
     <LockedClassFeature label={SIDEBAR.find(s => s.id === active)?.label || 'Fitur ini'} />
   )}
   ```

### 2. Tab "Dashboard" (home) versi member indikator

Tab `dashboard` (baris 1332 dst.) saat ini render widget progress kelas (welcome + pill % selesai/video + progress kategori + status trading, dst — semua diambil dari data `videos`/`progress`, kosong/nol untuk member indikator).

Tambahkan percabangan di awal blok `{active === 'dashboard' && (...)}`: kalau `isIndikatorMember`, render versi ringkas berikut alih-alih isi yang sekarang (isi lama tetap dipakai untuk member kelas, tidak diubah):

1. **Welcome header** — nama member saja, tanpa pill progress/badge ADVANCE.
2. **Kartu Status Pesanan** — ambil `myOrders[0]` (query sudah `order('created_at', {ascending:false})`, jadi index 0 = pesanan terbaru). Tampilkan nama produk, `plan_type` (badge, sama styling seperti kartu "Pesanan Saya" di baris 2628), status dengan warna yang sama seperti baris 2622-2623 (`aktif`=hijau, `dibayar`=biru, lainnya=kuning), dan jatuh tempo — pakai `hitungJatuhTempo(o.activated_at, o.plan_type)` (fungsi yang sudah ada, sama seperti baris 2632-2638; `lifetime` → "Seumur Hidup"). Kalau `myOrders` kosong, tampilkan "Belum ada pesanan."
3. **Tombol "Beli/Perpanjang Indikator →"** — `onClick={() => setActive('produk')}`.
4. **Tombol Discord**: kalau `member.discord_username` ada → tampilkan teks "✓ Terhubung sebagai @{member.discord_username}" (hijau, meniru baris 2136). Kalau belum → tombol `onClick={handleConnectDiscordOAuth}` bergaya sama seperti baris 2140 ("HUBUNGKAN VIA DISCORD OAUTH").

## Di luar cakupan

- Tidak ada perubahan pada `SIDEBAR` array itu sendiri (tidak difilter/disembunyikan).
- Tidak menyentuh tab `1on1` (sudah otomatis terkunci lewat mekanisme tier eligibility yang ada).
- Tidak menutup celah `/trading-plan` direct-URL (baris 369) secara khusus — karena sekarang tab itu pun akan menampilkan `LockedClassFeature` saat `active === 'trading-plan'` dan `isIndikatorMember`, celah itu otomatis tertutup oleh solusi Bagian 1 tanpa perlu penanganan terpisah.
- Tidak mengubah halaman `DashboardPage.tsx` (legacy) atau `MemberPage.tsx` (legacy) — keduanya tidak di-routing dari `App.tsx`.
