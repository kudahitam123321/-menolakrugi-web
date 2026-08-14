-- Adds banner-promo fields to discount_codes.
-- Run once in the Supabase SQL editor.

alter table discount_codes
  add column if not exists tampil_banner boolean not null default false,
  add column if not exists banner_teks text;
