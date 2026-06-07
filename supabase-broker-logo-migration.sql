-- ═══════════════════════════════════════════════════════════
-- Tambah kolom logo_url ke tabel brokers
--
-- Jalankan di Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

alter table brokers add column if not exists logo_url text;
