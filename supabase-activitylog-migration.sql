-- ═══════════════════════════════════════════════════════════
-- Tabel: activity_log
--
-- Menyimpan semua aksi admin (approve, reject, simpan, dll).
-- Jalankan di Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

create table if not exists activity_log (
  id         uuid        primary key default gen_random_uuid(),
  action     text        not null,
  detail     text,
  admin_name text        not null default 'admin',
  created_at timestamptz default now()
);

alter table activity_log enable row level security;

-- App pakai custom auth (localStorage), bukan Supabase Auth.
-- auth.uid() selalu null → policy permissive, kontrol di app layer.
create policy "activity_log_select_all" on activity_log for select using (true);
create policy "activity_log_insert_all" on activity_log for insert with check (true);
create policy "activity_log_delete_all" on activity_log for delete using (true);
