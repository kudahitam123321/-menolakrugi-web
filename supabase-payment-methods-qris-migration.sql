-- Adds QRIS payment method support to payment_methods.
-- Run once in the Supabase SQL editor.

alter table payment_methods
  add column if not exists jenis text not null default 'bank' check (jenis in ('bank', 'qris')),
  add column if not exists qris_image_url text;

-- QRIS methods have no bank account, so these can no longer be mandatory.
alter table payment_methods
  alter column nomor_rekening drop not null,
  alter column nama_rekening drop not null;
