-- Migrasi tier pembeli indikator: dari 'SMC Trial' (tabrakan dengan tier kelas Trial asli)
-- ke tier khusus indikator berdasarkan plan_type order mereka.
-- Sudah dijalankan manual di Supabase SQL editor pada 2026-07-07 — file ini untuk dokumentasi.

-- 1. Preview dulu (jalankan ini duluan, cek hasilnya sebelum lanjut ke UPDATE)
select m.id, m.nama, o.plan_type, o.created_at
from members m
join orders o on o.member_id = m.id::text
where m.tier = 'SMC Trial' and o.no_hp is not null
order by o.created_at desc;

-- 2. Update (jalankan setelah preview di atas terlihat benar)
update members m set tier = case o.plan_type
  when 'bulanan'  then 'Indikator Bulanan'
  when 'tahunan'  then 'Indikator Tahunan'
  when 'lifetime' then 'Indikator Lifetime'
  else m.tier
end
from (
  select distinct on (member_id) member_id, plan_type
  from orders
  where no_hp is not null
  order by member_id, created_at desc
) o
where o.member_id = m.id::text and m.tier = 'SMC Trial';
