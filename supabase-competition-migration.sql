-- ═══════════════════════════════════════════════════════════
-- Migration: Competition / Leaderboard Feature
-- Menolak Rugi Platform
-- ═══════════════════════════════════════════════════════════

-- Tabel competitions
create table if not exists competitions (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  platform_tag text default 'matchtrader',
  status       text default 'ongoing',          -- ongoing | ended
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  entry_type   text default 'Free',
  prize_pool   text,                            -- teks bebas, bisa null
  more_info    text,                            -- teks bebas / URL, bisa null
  trading_rules text[],                         -- array string aturan trading
  organizer    text default 'Menolak Rugi',
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- RLS
alter table competitions enable row level security;

-- Semua user terautentikasi (dan anon) bisa baca
create policy "competitions_select_all"
  on competitions for select
  using (true);

-- Hanya admin yang bisa insert/update/delete
-- (admin diidentifikasi dari tabel members dengan role = 'admin' atau 'superadmin')
create policy "competitions_insert_admin"
  on competitions for insert
  with check (
    exists (
      select 1 from members
      where members.id = auth.uid()
        and members.role in ('admin', 'superadmin')
    )
  );

create policy "competitions_update_admin"
  on competitions for update
  using (
    exists (
      select 1 from members
      where members.id = auth.uid()
        and members.role in ('admin', 'superadmin')
    )
  );

create policy "competitions_delete_admin"
  on competitions for delete
  using (
    exists (
      select 1 from members
      where members.id = auth.uid()
        and members.role in ('admin', 'superadmin')
    )
  );

-- Seed: satu kompetisi contoh (opsional, hapus jika tidak diinginkan)
insert into competitions (
  title, platform_tag, status, starts_at, ends_at,
  entry_type, organizer, trading_rules, is_active
) values (
  'June 2026 Monthly Competition',
  'matchtrader',
  'ongoing',
  '2026-06-01 00:00:00+07',
  '2026-06-30 23:59:00+07',
  'Free',
  'Menolak Rugi',
  array[
    '10% Max Overall Loss',
    '5% Max Daily Loss',
    'Minimum 3 Trades',
    'No Weekend Holding',
    'Use proper Risk Management'
  ],
  true
);
