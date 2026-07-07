# Tier Terpisah untuk Pembeli Indikator

## Masalah

Pembeli produk indikator (alur `/bayar`) saat ini diberi `tier: 'SMC Trial'` — nilai yang **persis sama** dengan tier resmi member kelas Trial (lihat `TIERS` di `AdminPage.tsx:6`). Akibatnya:

1. Pembeli indikator tercatat sebagai member kelas Trial tulen di database.
2. `isTrial` di `member/DashboardPage.tsx:975` (`member.tier?.toLowerCase().includes('trial')`) mencocokkan `'SMC Trial'`, sehingga pembeli indikator ikut melihat banner "trial kelas akan berakhir dalam X hari" (dihitung 30 hari dari `created_at`) — logic yang sama sekali tidak relevan untuk mereka (mereka punya jatuh-tempo order indikator sendiri, dari fitur sebelumnya).
3. `normalizeTier()` di `member/DashboardPage.tsx:477-483` men-default tier apapun yang tidak mengandung "platinum"/"gold"/"bronze" menjadi `'trial'` — perilaku lama yang berlaku juga untuk tier baru kalau tidak ditangani eksplisit.

## Solusi

### 1. Tier baru

Tiga nilai literal baru di kolom `members.tier` (kolom teks bebas, tanpa constraint DB, jadi tidak perlu migrasi skema):

- `Indikator Bulanan`
- `Indikator Tahunan`
- `Indikator Lifetime`

Dipetakan dari `plan.key` yang sudah ada di `BayarPage.tsx` (`bulanan` / `tahunan` / `lifetime`).

### 2. Titik penetapan tier

- **`BayarPage.tsx:107`** (insert `members.tier`) dan **`BayarPage.tsx:122`** (insert `orders.tier_member`): ganti hardcode `'SMC Trial'` dengan hasil mapping dari `plan.key`.
- **`AdminPage.tsx:2283`** (dropdown "Tambah Member Baru"): tambahkan 3 opsi baru supaya admin bisa assign tier indikator secara manual (mis. untuk pembayaran transfer langsung di luar alur `/bayar`).

### 3. Perbaikan tabrakan

- **`isTrial`** (`member/DashboardPage.tsx:975`): ganti dari `.toLowerCase().includes('trial')` menjadi exact-match `member.tier === 'SMC Trial'`. Menghilangkan banner jatuh-tempo trial kelas palsu untuk pembeli indikator.
- **`normalizeTier()`** (`member/DashboardPage.tsx:477-483`): tambah pengecekan eksplisit — tier yang mengandung kata "indikator" mengembalikan `'indikator'`, bukan fallback ke `'trial'`. Satu-satunya pemakai (`bisaOrder` di baris 2525, kelayakan perk produk indikator berdasar tier kelas) otomatis jadi `false` untuk tier indikator — ini benar karena mereka bukan member kelas.
- **`tierColor()`** (`AdminPage.tsx:786-792`): tambah `if(tier?.includes('Indikator')) return '#3b82f6';` sebelum fallback abu-abu, supaya badge tier indikator di panel admin punya warna sendiri.

### 4. Migrasi data lama — **sudah dijalankan**

Member yang sudah terlanjur `tier = 'SMC Trial'` dari pembelian indikator (dibedakan lewat `orders.no_hp is not null`, sinyal yang cuma diisi oleh alur `/bayar`) sudah dimigrasi ke tier baru berdasarkan `plan_type` order terbarunya. Query preview dan update sudah dijalankan manual oleh user di Supabase SQL editor (dengan cast eksplisit `o.member_id = m.id::text` karena `orders.member_id` bertipe `text` sedangkan `members.id` bertipe `uuid`). File referensi: `supabase-indikator-tier-migration.sql` (ditambahkan ke repo untuk dokumentasi, walau sudah dieksekusi).

## Di luar cakupan

- Dashboard/sidebar yang berbeda tampilan untuk tier indikator vs member kelas — dibahas terpisah nanti.
- Gating akses video kelas (`videos.tier_access`) — ditemukan tidak benar-benar di-enforce di manapun saat ini (satu-satunya pemakai `tier_access` di member dashboard adalah untuk `products`, bukan `videos`). Di luar cakupan perubahan ini karena tidak terkait langsung dengan penamaan tier.
- `src/pages/DashboardPage.tsx` (legacy, tidak di-routing dari `App.tsx`) — tidak disentuh.
