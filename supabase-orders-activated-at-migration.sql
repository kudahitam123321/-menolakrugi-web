-- Tambah kolom activated_at ke orders — dipakai untuk menghitung tanggal
-- jatuh tempo produk bulanan/tahunan (activated_at + 1 bulan/tahun).
-- Diisi otomatis oleh AdminPage.tsx saat admin ubah status order jadi 'aktif'.
-- Jalankan di Supabase Dashboard → SQL Editor.

alter table orders add column if not exists activated_at timestamptz;
