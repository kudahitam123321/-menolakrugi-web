-- ═══════════════════════════════════════════════════════════
-- FIX: RLS Policy tabel competitions
--
-- Masalah: Policy sebelumnya mengecek auth.uid() dari Supabase Auth,
-- tapi app ini pakai custom auth (localStorage), bukan Supabase Auth.
-- Akibatnya auth.uid() selalu null → update/insert diblokir diam-diam.
--
-- Jalankan file ini di Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Hapus policy lama yang restrictive
drop policy if exists "competitions_insert_admin" on competitions;
drop policy if exists "competitions_update_admin" on competitions;
drop policy if exists "competitions_delete_admin" on competitions;

-- Buat policy baru yang permissive (konsisten dengan tabel lain di app ini)
-- Autentikasi admin ditangani di level aplikasi, bukan Supabase RLS
create policy "competitions_insert_all"
  on competitions for insert
  with check (true);

create policy "competitions_update_all"
  on competitions for update
  using (true);

create policy "competitions_delete_all"
  on competitions for delete
  using (true);
