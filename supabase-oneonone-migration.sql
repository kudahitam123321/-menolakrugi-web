-- ═══════════════════════════════════════════════════════════
-- Fitur: 1-on-1 Mentoring Request
--
-- Jalankan file ini di Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

create table if not exists oneonone_requests (
  id               uuid        primary key default gen_random_uuid(),
  member_id        text        not null,
  member_name      text        not null,
  member_tier      text        not null,
  discord_nickname text        not null,
  topic            text        not null,
  status           text        not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  scheduled_at     timestamptz,
  rejection_reason text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table oneonone_requests enable row level security;

-- App pakai custom auth (localStorage), bukan Supabase Auth.
-- auth.uid() selalu null → gunakan policy permissive, akses dikontrol di app layer.
create policy "oneonone_select_all" on oneonone_requests for select using (true);
create policy "oneonone_insert_all" on oneonone_requests for insert with check (true);
create policy "oneonone_update_all" on oneonone_requests for update using (true);
create policy "oneonone_delete_all" on oneonone_requests for delete using (true);
