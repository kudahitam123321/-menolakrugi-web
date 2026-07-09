# Produk Gratis (Link) di Katalog Indikator

## Latar belakang

Admin ingin bisa menambahkan produk indikator yang **gratis** — bukan berupa plan berbayar (Bulanan/Tahunan/Lifetime), tapi cukup sebuah link yang langsung tersedia begitu member klaim. Cocok untuk lead magnet, bonus, atau produk promosi.

## Solusi

### 1. Data

Kolom baru di tabel `products`:
- `is_gratis boolean default false`
- `link_gratis text` (nullable — hanya wajib diisi kalau `is_gratis = true`)

### 2. Admin — Tambah/Edit Produk

Di form "Tambah Produk" (`AdminPage.tsx`, state `p*`) dan "Edit Produk" (state `editP*`):

- Tambah toggle/checkbox **"Produk Gratis?"** (`pIsGratis`/`editPIsGratis`).
- Kalau dicentang: sembunyikan 3 field harga+diskon (Bulanan/Tahunan/Lifetime), tampilkan 1 field teks **"Link Produk"** (`pLinkGratis`/`editPLinkGratis`) — wajib diisi kalau toggle aktif.
- Validasi submit: kalau `is_gratis` dicentang, `link_gratis` wajib diisi (bukan wajib isi harga seperti sekarang). Kalau tidak dicentang, validasi harga tetap seperti sekarang (minimal satu harga wajib diisi) — perilaku produk berbayar sama sekali tidak berubah.
- Simpan: `is_gratis`, `link_gratis` diisi; `harga_bulanan/tahunan/lifetime` dan `diskon_*` diisi `null` saat `is_gratis = true` (produk gratis tidak dan tidak boleh sekaligus punya harga).
- Daftar produk di admin (list card), tampilkan badge "GRATIS" di produk yang `is_gratis = true` sebagai pengganti label harga.

### 3. Member — Katalog

Di `member/DashboardPage.tsx`, kartu katalog (`products.map(p => ...)`): kalau `p.is_gratis`, ambil jalur render yang sepenuhnya berbeda dari produk berbayar (bukan sekadar harga Rp0) — tidak ada pemilihan plan Bulanan/Tahunan/Lifetime, tidak ada harga, tidak ada `bisaOrder`/tier-gating (produk gratis terbuka untuk semua member, tanpa syarat tier):

- Badge **"GRATIS"** menggantikan baris harga.
- Kalau member **belum pernah klaim** produk ini (dicek dari `myOrders`, `product_id` cocok): tombol **"Klaim Gratis"**.
- Kalau **sudah pernah klaim**: tombol berubah jadi **"Buka Link →"** (langsung `window.open(p.link_gratis, '_blank')`), tanpa perlu pindah tab.
- Klik "Klaim Gratis" → insert 1 baris `orders` baru: `product_id: p.id, member_id, nama_member, tier_member: member.tier, status: 'aktif', activated_at: now(), plan_type: 'gratis'` — langsung aktif, tidak ada tahap pending/pembayaran. Update `myOrders` state secara optimistic (tanpa refetch), lalu tombol langsung berubah jadi "Buka Link →".

### 4. Tampilan `plan_type: 'gratis'` di tempat lain

Nilai `plan_type` baru ini (`'gratis'`) muncul juga di 3 tempat yang sudah ada logic "kalau lifetime jangan tampilkan jatuh tempo" — tambahkan `'gratis'` di kondisi yang sama supaya tampil "Akses Permanen" (bukan mencoba hitung jatuh tempo yang tidak relevan untuk produk gratis):
- `member/DashboardPage.tsx` — kartu "STATUS PESANAN" di tab Dashboard (home ringkas member indikator).
- `member/DashboardPage.tsx` — list "Pesanan Saya" di tab Produk.
- `AdminPage.tsx` — baris "Pesanan Masuk".

Badge plan (`{order.plan_type.toUpperCase()}`) otomatis menampilkan "GRATIS" di ketiga tempat itu tanpa perlu ubah kode tambahan (karena sudah generic, cuma uppercase string apa adanya).

## Di luar cakupan

- Tidak ada validasi format URL untuk `link_gratis` — teks bebas, sama seperti field link lain di codebase ini (`tradingview_url`, dll).
- Tidak membatasi jumlah klaim gratis per hari/bulan — sekali klaim, langsung permanen (mirip lifetime), tidak ada re-claim/reset.
- Tidak mengubah sistem role Discord — order dengan `plan_type: 'gratis'` **tidak** ikut ke sinkronisasi role Discord (yang cuma memproses `bulanan`/`tahunan`/`lifetime`), karena produk gratis bukan bagian dari subscription plan berbayar yang sama.
- Tidak menyentuh sistem `tier_access` yang sudah ada untuk produk berbayar (perk gratis akses dari tier kelas) — ini fitur produk gratis yang berdiri sendiri, beda konsep.
