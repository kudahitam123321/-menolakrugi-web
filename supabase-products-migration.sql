-- ═══════════════════════════════════════════════════════════
-- Produk Indikator TradingView — Products & Orders
--
-- Jalankan di Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Tabel produk
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  nama          text not null,
  deskripsi     text not null,
  harga_asli    integer not null,
  diskon        integer,
  harga_diskon  integer,
  gambar_url    text,
  status        text not null default 'tersedia',
  tanggal_rilis date,
  tier_access   text[] not null default '{trial,bronze,gold,platinum}',
  urutan        integer not null default 0,
  aktif         boolean not null default true,
  created_at    timestamptz default now()
);

alter table products enable row level security;
create policy "products_select" on products for select using (true);
create policy "products_all"    on products for all    with check (true);

-- Tabel order pembelian
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references products(id) on delete set null,
  member_id     text not null,
  nama_member   text not null,
  email_member  text,
  tier_member   text not null,
  status        text not null default 'pending',
  catatan       text,
  created_at    timestamptz default now()
);

alter table orders enable row level security;
create policy "orders_select" on orders for select using (true);
create policy "orders_all"    on orders for all    with check (true);
