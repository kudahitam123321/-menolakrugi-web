-- Antrian pesan Discord dari admin ke bot
-- Jalankan di Supabase Dashboard → SQL Editor

create table if not exists discord_messages (
  id          uuid primary key default gen_random_uuid(),
  channel_id  text not null,
  message     text not null,
  status      text not null default 'pending', -- 'pending' | 'sent' | 'error'
  error_msg   text,
  created_at  timestamptz default now()
);

alter table discord_messages enable row level security;

create policy "discord_messages_select_all" on discord_messages for select using (true);
create policy "discord_messages_insert_all" on discord_messages for insert with check (true);
create policy "discord_messages_update_all" on discord_messages for update using (true) with check (true);
