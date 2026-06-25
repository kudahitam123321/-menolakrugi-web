-- Landing Preview Config
-- Jalankan di Supabase Dashboard → SQL Editor

create table if not exists landing_preview_config (
  id               int primary key default 1,
  yt_url           text,
  plan1_nama       text not null default 'Bulanan',
  plan1_harga_asli int  not null default 0,
  plan1_diskon     int  not null default 0,
  plan2_nama       text not null default 'Tahunan',
  plan2_harga_asli int  not null default 0,
  plan2_diskon     int  not null default 0,
  plan3_nama       text not null default 'Lifetime',
  plan3_harga_asli int  not null default 0,
  plan3_diskon     int  not null default 0,
  updated_at       timestamptz default now()
);

alter table landing_preview_config enable row level security;

create policy "select all" on landing_preview_config for select using (true);
create policy "insert all" on landing_preview_config for insert with check (true);
create policy "update all" on landing_preview_config for update using (true) with check (true);

-- Seed baris awal supaya upsert admin langsung bisa jalan
insert into landing_preview_config (id) values (1) on conflict (id) do nothing;
