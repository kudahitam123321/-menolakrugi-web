-- Backtest Config — data halaman /backtest-indikator
-- Jalankan di Supabase Dashboard → SQL Editor
--
-- Satu baris (id = 1, pola upsert seperti landing_preview_config).
-- data      = { trades: [...], settings: [...] } persis format dashboard PTMR Backtest
--             (hasil src/lib/backtest.ts dari export Strategy Tester TradingView).
-- risk_asli = risk per trade (% equity) yang dipakai saat backtest, untuk simulasi
--             modal & risk di halaman (bukan "Risk per Trade (%)" kalkulator lot).

create table if not exists backtest_config (
  id          int primary key default 1,
  judul       text not null default 'PTMR Backtest',
  data        jsonb not null default '{"trades":[],"settings":[]}'::jsonb,
  risk_asli   numeric not null default 0.5,
  tampil      boolean not null default false,
  sumber_file text default '',
  updated_at  timestamptz default now()
);

alter table backtest_config enable row level security;

create policy "select all" on backtest_config for select using (true);
create policy "insert all" on backtest_config for insert with check (true);
create policy "update all" on backtest_config for update using (true) with check (true);
