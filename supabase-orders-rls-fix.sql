-- ═══════════════════════════════════════════════════════════
-- FIX: RLS Policy tabel orders
--
-- Masalah: Policy "orders_all for all with check (true)" tidak
-- mencakup UPDATE dengan benar. UPDATE butuh USING clause (untuk
-- mengizinkan row lama diubah), bukan hanya WITH CHECK.
--
-- Jalankan di Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Hapus policy lama
drop policy if exists "orders_all"    on orders;
drop policy if exists "orders_select" on orders;

-- Buat policy baru yang eksplisit per operasi
create policy "orders_select_all"
  on orders for select
  using (true);

create policy "orders_insert_all"
  on orders for insert
  with check (true);

create policy "orders_update_all"
  on orders for update
  using (true)
  with check (true);

create policy "orders_delete_all"
  on orders for delete
  using (true);

-- Pastikan kolom tambahan sudah ada (jalankan jika belum)
alter table orders add column if not exists plan_type      text;
alter table orders add column if not exists kode_diskon    text;
alter table orders add column if not exists diskon_applied integer;
