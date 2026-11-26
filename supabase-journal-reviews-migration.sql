-- Evaluasi keseluruhan jurnal dari admin/mentor (1 baris per member).
-- Jalankan sekali di Supabase SQL editor. Spec: docs/superpowers/specs/2026-11-26-evaluasi-jurnal-notifikasi-design.md

create table if not exists journal_reviews (
  member_id  uuid primary key,
  catatan    text not null default '',
  oleh       text,
  updated_at timestamptz not null default now()
);

-- Auth app ini custom (localStorage), auth.uid() selalu null → policy harus true.
alter table journal_reviews enable row level security;
drop policy if exists "journal_reviews_select" on journal_reviews;
drop policy if exists "journal_reviews_insert" on journal_reviews;
drop policy if exists "journal_reviews_update" on journal_reviews;
create policy "journal_reviews_select" on journal_reviews for select using (true);
create policy "journal_reviews_insert" on journal_reviews for insert with check (true);
create policy "journal_reviews_update" on journal_reviews for update using (true) with check (true);

-- Realtime untuk notifikasi member (abaikan bila sudah terdaftar).
do $$ begin
  alter publication supabase_realtime add table journal_reviews;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table trading_journals;
exception when duplicate_object then null; end $$;
