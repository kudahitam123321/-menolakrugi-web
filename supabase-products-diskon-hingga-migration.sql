-- Batas waktu diskon per produk (promo rilis v5 -50% s/d 1 Desember 2026).
-- Diskon paket (diskon_bulanan/tahunan/lifetime) berlaku sampai akhir tanggal ini (WIB); null = tanpa batas.
-- Jalankan sekali di Supabase SQL editor SEBELUM deploy kode yang memakai kolom ini.
alter table products add column if not exists diskon_hingga date;
