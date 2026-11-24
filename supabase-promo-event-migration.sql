-- Promo Event — event promo berbatas waktu (mis. Black Friday), halaman /promo
-- Jalankan di Supabase Dashboard → SQL Editor
--
-- Satu baris (id = 1, pola upsert seperti backtest_config / landing_preview_config).
-- Selama aktif = true dan now() di antara mulai..selesai, diskon di kolom `diskon`
-- menggantikan diskon produk di semua halaman harga (lihat src/lib/indikatorV5.ts).
-- diskon   = { "<product_id>": { "bulanan": 20, "tahunan": 30, "lifetime": 40 } }
-- unggulan = { "product_id": "<id>", "plan": "lifetime" }  → kartu "PENAWARAN TERBAIK"

create table if not exists promo_event (
  id         int primary key default 1 check (id = 1),
  aktif      boolean not null default false,
  nama       text not null default 'Promo',
  judul      text,
  subjudul   text,
  mulai      timestamptz,
  selesai    timestamptz,
  diskon     jsonb not null default '{}'::jsonb,
  bonus      text,
  unggulan   jsonb,
  updated_at timestamptz default now()
);

alter table promo_event enable row level security;

create policy "select all" on promo_event for select using (true);
create policy "insert all" on promo_event for insert with check (true);
create policy "update all" on promo_event for update using (true) with check (true);
