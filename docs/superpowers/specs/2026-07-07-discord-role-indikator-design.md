# Role Discord Otomatis untuk Pembeli Indikator

## Latar belakang

Pembeli produk indikator (baik member tier `Indikator Bulanan`/`Tahunan`/`Lifetime` murni, maupun member kelas yang beli indikator sebagai tambahan lewat tab `produk`) perlu masuk private channel Discord topik indikator. Sekarang ini dilakukan admin secara manual. Tujuannya: begitu pesanan indikator mereka berstatus Aktif, otomatis dapat role Discord sesuai paket yang dibeli — dan role itu otomatis dicabut kalau langganan mereka tidak lagi aktif (termasuk kalau sudah lewat jatuh tempo tanpa perpanjangan, walau tidak ada admin yang mengubah apa-apa).

## Solusi

### 1. Aturan kelayakan role

Role ID (sudah dikonfirmasi user):
- `bulanan` → `1523561374838689792`
- `tahunan` → `1524314446133072084`
- `lifetime` → `1519657058608218293`

**Sumber kebenaran**: pesanan (`orders`) dengan `plan_type` terisi `'bulanan'`/`'tahunan'`/`'lifetime'` — sinyal ini sudah terbukti aman membedakan pesanan indikator dari pesanan kelas (pesanan kelas dari `SignupPage.tsx` tidak pernah mengisi `plan_type` sama sekali). Berlaku untuk member manapun yang punya pesanan begitu, terlepas dari `members.tier` mereka (jadi juga berlaku untuk member kelas yang beli indikator lewat tab `produk` di dashboard mereka sendiri).

**Pesanan yang menentukan**: pesanan indikator dengan `status = 'aktif'` yang **paling baru** (`created_at` terbesar) milik member tersebut. Kalau pesanan terbaru itu bukan status Aktif, member tidak dapat role — walau ada pesanan Aktif yang lebih lama.

**"Aktif" juga berarti belum lewat jatuh tempo** — dihitung dari `activated_at + 1 bulan` (bulanan) atau `activated_at + 1 tahun` (tahunan); `lifetime` tidak pernah kadaluarsa. Ini logic yang sama seperti `hitungJatuhTempo()` yang sudah ada di frontend, direplikasi di sisi bot (JS biasa, tidak perlu shared code antar-repo terpisah).

**Hasil akhir per member**: tepat 0 atau 1 dari 3 role indikator. Kalau member berganti paket (mis. upgrade bulanan → tahunan), role lama dilepas dan role baru ditambahkan dalam operasi yang sama.

### 2. Pemicu sinkronisasi instan

Dua titik yang langsung memanggil bot (idempotent — aman dipanggil berkali-kali):

1. **`updateOrderStatus()` di `AdminPage.tsx`** (perubahan status pesanan oleh admin) — setelah update Supabase berhasil, kalau pesanan itu punya `plan_type` terisi (pesanan indikator), panggil `POST /api/mrbot/sync-indicator` dengan `member_id` (pola sama seperti panggilan bot lain yang sudah ada di file ini — proxy lewat `/api/mrbot/*` yang sudah ada, tidak perlu proxy baru).
2. **`/discord/callback` di bot** (OAuth connect pertama kali member) — setelah assign role tier kelas & nickname seperti sekarang, sekalian jalankan sinkronisasi role indikator berdasarkan pesanan aktif member itu saat itu juga.

### 3. Pengecekan berkala (jaring pengaman kadaluarsa)

Bot menambah satu `setInterval` baru (pola sama seperti fitur "Session Scheduler" yang sudah ada, yang cek waktu WITA tiap menit) — kali ini jalan **setiap 24 jam**. Setiap kali jalan:

1. Query semua member yang punya minimal satu pesanan dengan `plan_type` terisi dan `discord_id` terhubung.
2. Untuk masing-masing, jalankan ulang logic Bagian 1 (assign role kalau seharusnya punya tapi belum; cabut kalau sudah punya tapi seharusnya tidak lagi — termasuk kasus jatuh tempo lewat walau `status` masih `'aktif'` di database).

Ini menutup celah: member yang lupa perpanjang dan tidak ada admin/member yang memicu apapun, tetap ter-update dalam maksimal 24 jam.

## File yang terlibat

- **Bot** (`kudahitam123321/menolakrugi-bot`, repo terpisah, lokasi kerja: clone lokal di scratchpad sesi ini): `index.js` — tambah `INDICATOR_ROLES` map, fungsi `syncIndicatorRole(memberId)`, endpoint baru `POST /discord/sync-indicator`, perluas `/discord/callback`, tambah `setInterval` 24 jam baru.
- **Website** (`d:/bolt/menolak-rugi/final-project`): `src/pages/AdminPage.tsx` — `updateOrderStatus()` memanggil `/api/mrbot/sync-indicator` setelah update berhasil.

## Di luar cakupan

- Tidak menyentuh role tier kelas / funded status yang sudah ada (`ROLES`, `FUNDED_ROLES`, `setMemberRoles()`) — ini fitur terpisah dengan mapping role sendiri.
- Tidak menangani kasus multi-produk indikator (saat ini cuma ada 1 produk aktif di katalog) — kalau nanti ada produk indikator kedua dengan role Discord berbeda, perlu desain ulang.
- Tidak membuat status pesanan baru (mis. "Kadaluarsa") — deteksi kadaluarsa murni dihitung on-the-fly dari `activated_at`+`plan_type`, tidak disimpan sebagai kolom status baru.
