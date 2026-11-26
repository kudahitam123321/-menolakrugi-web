# Evaluasi Jurnal Keseluruhan + Notifikasi Koreksi — Design

Tanggal: 2026-11-26 · Disetujui pemilik di chat.

## Kenapa
Admin sudah bisa memberi koreksi per trade (`trading_journals.admin_note`), tapi tidak ada tempat untuk evaluasi keseluruhan jurnal seorang member (pola kesalahan, model setup yang berhasil, aturan ke depan), dan member tidak tahu kalau ada koreksi baru kecuali membuka tabel jurnal satu per satu.

## Keputusan
- **Penyimpanan:** tabel baru `journal_reviews` (1 baris per member: `member_id` PK, `catatan`, `oleh`, `updated_at`). Tidak memakai `journal_settings` karena JurnalPage meng-upsert `...settings` saat member menyimpan pengaturan → catatan admin bisa tertimpa versi lama. RLS `using (true)` (auth app-level). Migrasi: `supabase-journal-reviews-migration.sql` (juga menambah `journal_reviews` dan `trading_journals` ke publikasi realtime).
- **Admin** (`AdminPage.tsx`, detail jurnal member): kotak "// EVALUASI KESELURUHAN" di atas "Riwayat Trade" — textarea + simpan (upsert), tampil penulis & tanggal.
- **Member** (`JurnalPage.tsx`): kartu "📋 Evaluasi dari Mentor" di atas; baris "X koreksi baru" + tombol filter "hanya trade yang dikoreksi"; koreksi yang baru ditandai label BARU.
- **Notifikasi** (`DashboardPage.tsx`):
  - real-time toast lewat channel `member-updates-{id}`: UPDATE `trading_journals` (filter member) yang membawa `admin_note_at` baru, dan INSERT/UPDATE `journal_reviews`.
  - badge angka di menu "Jurnal Trading" = koreksi + evaluasi dengan waktu > terakhir dilihat. "Terakhir dilihat" disimpan di `localStorage` (`mr_koreksi_seen_<memberId>`), di-set saat member membuka tab Jurnal.
- Logika hitung di `src/lib/koreksiJurnal.ts`, dicek `node scripts/check-koreksi-jurnal.mjs`.

## Di luar cakupan
Notifikasi Discord/WhatsApp; riwayat versi evaluasi (hanya versi terakhir disimpan); status dibaca lintas perangkat.
