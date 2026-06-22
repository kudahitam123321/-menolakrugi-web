# Design: Halaman Produk Indikator TradingView

## Overview

Menambahkan fitur katalog produk indikator TradingView ke platform Menolak Rugi. Admin mengelola produk dan pesanan via tab baru di AdminPage. Member melihat katalog, melakukan order (tersedia langsung atau pre-order), dan memantau status pesanan di tab baru DashboardPage.

## Data Model

### Tabel `products`

```sql
create table products (
  id           uuid primary key default gen_random_uuid(),
  nama         text not null,
  deskripsi    text not null,
  harga_asli   integer not null,
  diskon       integer,           -- persentase 0–100, nullable
  harga_diskon integer,           -- nullable, bisa auto-hitung atau override admin
  gambar_url   text,              -- URL dari bucket 'materi', prefix 'produk_'
  status       text not null default 'tersedia', -- 'tersedia' | 'preorder'
  tanggal_rilis date,             -- nullable, hanya diisi jika status = 'preorder'
  tier_access  text[] not null default '{trial,bronze,gold,platinum}',
  urutan       integer not null default 0,
  aktif        boolean not null default true,
  created_at   timestamptz default now()
);

alter table products enable row level security;
create policy "public read" on products for select using (true);
create policy "public write" on products for all with check (true);
```

**Catatan `tier_access`**: Semua tier dapat *melihat* produk. `tier_access` hanya membatasi siapa yang bisa *order*. Jika tier member tidak ada di array ini, tombol beli diganti "🔒 Upgrade Tier".

**Catatan `tanggal_rilis`**: Hanya relevan saat `status = 'preorder'`. Pre-order berarti member bisa bayar sekarang, produk dikirim/diaktifkan pada tanggal rilis. Admin ubah status order ke `aktif` setelah tanggal rilis.

### Tabel `orders`

```sql
create table orders (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references products(id),
  member_id     text not null,
  nama_member   text not null,
  email_member  text,
  tier_member   text not null,
  status        text not null default 'pending', -- 'pending' | 'dibayar' | 'aktif'
  catatan       text,
  created_at    timestamptz default now()
);

alter table orders enable row level security;
create policy "public read" on orders for select using (true);
create policy "public write" on orders for all with check (true);
```

## Admin Side — `AdminPage.tsx`

Tab baru `produk` ditambahkan ke state type dan sidebar AdminPage.

### Sub-tab `katalog` — Kelola Produk

Form tambah/edit produk (collapsible, pola sama dengan form broker di AdminPage):

- **Nama** (text input)
- **Deskripsi** (textarea)
- **Harga Asli** (number, IDR)
- **Diskon %** (number, 0–100, optional)
- **Harga Diskon** (number, optional — auto-fill dari `harga_asli - (harga_asli * diskon / 100)` saat diskon diubah, tapi bisa di-override manual)
- **Status** (select: Tersedia / Pre-order)
- **Tanggal Rilis** (date picker — hanya muncul saat status = `preorder`, di-clear jika status diganti ke `tersedia`)
- **Tier Access** (multi-checkbox: Trial / Bronze / Gold / Platinum)
- **Upload Gambar** (upload ke bucket `materi`, prefix `produk_`)
- **Urutan** (number)
- **Aktif** (toggle)

List produk: tabel dengan kolom Gambar, Nama, Harga, Diskon, Status, Rilis, Tier, Aktif, Aksi (Edit / Hapus). Edit mengisi ulang form di atas.

### Sub-tab `pesanan` — Kelola Order

Tabel order dengan kolom: Tanggal, Nama Member, Tier, Produk, Status, Catatan, Aksi.

- **Filter** by status (Semua / Pending / Dibayar / Aktif) dan search by nama member
- **Aksi per baris**: dropdown ubah status + textarea catatan opsional → tombol Simpan
- Status flow: `pending` → `dibayar` → `aktif`
- Order pre-order: admin tahu tidak perlu aktifkan sampai `tanggal_rilis` produk

## Member Side — `DashboardPage.tsx`

Tab `produk` (icon 🛍️) ditambah ke sidebar setelah tab `funded`.

### View: Katalog

Toggle header: **Katalog** | **Pesanan Saya**

Grid card produk (2 kolom mobile, 3 kolom desktop). Hanya produk `aktif = true` yang ditampilkan. Tiap card:

- Gambar (fallback: placeholder icon 📊)
- Badge: `TERSEDIA` (hijau `--mr-up`) atau `PRE-ORDER · Rilis DD MMM YYYY` (gold `--mr-gold`)
- Nama produk
- Deskripsi (truncate 2 baris)
- Harga: jika ada diskon → harga asli dicoret + harga diskon (merah); jika tidak → harga normal
- Tombol aksi:

| Kondisi | Tombol |
|---|---|
| Tier tidak ada di `tier_access` | "🔒 Upgrade Tier" (disabled, warna `--mr-border`) |
| `status = 'tersedia'` dan tier OK | "Beli Sekarang" (hijau `--mr-gold`) |
| `status = 'preorder'` dan tier OK | "Pre-order Sekarang" (gold `--mr-gold2`) |

### Flow Order

Klik tombol beli/pre-order → modal konfirmasi muncul:
- Ringkasan: nama produk, harga, status
- Jika pre-order: tampilkan "Produk akan tersedia pada [tanggal_rilis]"
- Tombol **Konfirmasi Order** dan **Batal**

Setelah konfirmasi:
1. Insert ke tabel `orders` (`status: 'pending'`)
2. Redirect ke WhatsApp (`WA_NUMBER` dari `src/constants.ts`) dengan pesan pre-fill:
   ```
   Halo, saya [nama_member] ingin [membeli / pre-order] produk *[nama_produk]* 
   seharga Rp[harga_diskon ?? harga_asli]. 
   Order ID: [order.id]
   ```

### View: Pesanan Saya

Toggle ke tab `Pesanan Saya` menampilkan tabel riwayat order member saat ini:

- Kolom: Tanggal, Nama Produk, Harga, Status badge, Catatan Admin
- Status badge: `Pending` (abu) | `Dibayar` (biru) | `Aktif` (hijau `--mr-up`)
- Real-time update via Supabase `postgres_changes` subscription pada tabel `orders` (filter: `member_id=eq.{id}`) — pola sama seperti notifikasi yang sudah ada di DashboardPage

## File yang Diubah

| File | Perubahan |
|---|---|
| `src/pages/AdminPage.tsx` | Tambah tab `produk` (sub-tab katalog + pesanan) |
| `src/pages/member/DashboardPage.tsx` | Tambah tab `produk` (katalog + pesanan saya) |
| `supabase-products-migration.sql` | Schema tabel `products` dan `orders` dengan RLS |
| `CLAUDE.md` | Update tabel key, daftar tabel Supabase, daftar tab member |

## Tidak Termasuk Scope

- Payment gateway (pembayaran via WA manual)
- Download/delivery otomatis indikator (admin deliver manual)
- Review/rating produk
- Stok/inventory tracking
