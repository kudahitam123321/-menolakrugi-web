-- Tambah kolom no_hp ke orders — nomor WhatsApp pembeli dari form /bayar,
-- disimpan terpisah supaya tidak hilang kalau admin edit field catatan
-- (sebelumnya nomor HP cuma nyempil di teks catatan).
-- Jalankan di Supabase Dashboard → SQL Editor.

alter table orders add column if not exists no_hp text;
