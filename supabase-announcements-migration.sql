-- Tabel announcements untuk fitur broadcast admin
-- Jalankan di Supabase Dashboard → SQL Editor

create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  judul      text not null default 'Pengumuman',
  content    text not null,
  type       text not null default 'info',  -- 'info' | 'warning' | 'success'
  created_at timestamptz default now()
);

alter table announcements enable row level security;

create policy "announcements_select_all"
  on announcements for select
  using (true);

create policy "announcements_insert_all"
  on announcements for insert
  with check (true);

create policy "announcements_delete_all"
  on announcements for delete
  using (true);
