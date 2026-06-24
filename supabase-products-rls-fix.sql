-- ═══════════════════════════════════════════════════════════
-- FIX: RLS Policy tabel products
--
-- Masalah: Policy "products_all for all with check (true)" tidak
-- mencakup UPDATE dengan benar. UPDATE butuh USING clause (untuk
-- mengizinkan row lama diubah), bukan hanya WITH CHECK.
-- Akibatnya: admin edit produk → perubahan tidak tersimpan.
--
-- Jalankan di Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Hapus policy lama
drop policy if exists "products_all"    on products;
drop policy if exists "products_select" on products;

-- Buat policy baru eksplisit per operasi
create policy "products_select_all"
  on products for select
  using (true);

create policy "products_insert_all"
  on products for insert
  with check (true);

create policy "products_update_all"
  on products for update
  using (true)
  with check (true);

create policy "products_delete_all"
  on products for delete
  using (true);
