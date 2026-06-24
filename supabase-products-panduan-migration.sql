-- Tambah kolom panduan ke tabel products
-- Jalankan di Supabase Dashboard → SQL Editor

alter table products add column if not exists panduan_url  text;
alter table products add column if not exists panduan_name text;
