-- supabase/migrations/20260511_pricing_tiers.sql
-- Tabel untuk menyimpan pricing tier dari database
-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id              TEXT PRIMARY KEY,       -- 'trial', 'bronze', 'gold', 'platinum'
  tag             TEXT NOT NULL,          -- 'Trial', 'Bronze', dll
  name            TEXT NOT NULL,          -- 'SMC Gold Mentorship'
  price           INTEGER NOT NULL,       -- dalam rupiah (tanpa desimal)
  original_price  INTEGER,               -- harga sebelum diskon
  period          TEXT NOT NULL DEFAULT 'sekali bayar',
  badge           TEXT,                  -- 'Paling Direkomendasikan'
  pitch           TEXT NOT NULL,
  perks           JSONB NOT NULL DEFAULT '[]',
  accent          TEXT NOT NULL DEFAULT 'neutral',
  note            TEXT,
  is_featured     BOOLEAN DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone bisa baca (landing page public)
CREATE POLICY "public read pricing_tiers"
  ON pricing_tiers FOR SELECT
  USING (active = TRUE);

-- Hanya admin yang bisa edit
CREATE POLICY "admin write pricing_tiers"
  ON pricing_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid()
      AND members.role IN ('admin', 'superadmin')
    )
  );

-- ─── Seed data (sesuaikan harga sebelum insert) ───────────────────────────────

INSERT INTO pricing_tiers (id, tag, name, price, original_price, period, badge, pitch, perks, accent, note, is_featured, sort_order) VALUES
(
  'trial', 'Trial', 'SMC Trial',
  99000, NULL, '/bulan', NULL,
  'Coba dulu tanpa komitmen.',
  '["Channel Outlook harian dari mentor", "Sesi live mingguan komunitas", "Materi dasar SMC: struktur, candle, baca chart", "Akses channel komunitas", "Bebas berhenti / upgrade kapan saja"]',
  'neutral', NULL, FALSE, 1
),
(
  'bronze', 'Bronze', 'SMC Bronze',
  500000, 750000, 'sekali bayar', 'Hemat 33%',
  'Materi lengkap, akses seumur hidup.',
  '["Semua fitur Trial", "Materi SMC lengkap: BOS, IDM, order block, daily bias", "Video pembelajaran terstruktur, bisa ditonton ulang", "Update materi gratis selamanya", "Live session Q&A"]',
  'bronze', '≈ Rp 1.370/hari di tahun pertama', FALSE, 2
),
(
  'gold', 'Gold', 'SMC Gold Mentorship',
  1000000, 1500000, 'sekali bayar', 'Paling Direkomendasikan',
  'Mentoring intensif, evaluasi tiap minggu.',
  '["Semua fitur Bronze", "2× live mentoring per minggu", "Review chart langsung di depan grup", "Evaluasi trading mingguan", "Channel Question eksklusif", "Channel Funded Trader (prop firm)", "Mentor Result — setup mentor tiap minggu"]',
  'gold', '≈ Rp 2.740/hari di tahun pertama', TRUE, 3
),
(
  'platinum', 'Platinum', 'SMC Platinum 1-on-1',
  3500000, 5000000, 'sekali bayar', 'Maks. 10 / batch',
  'Privat. Kurikulum dibentuk dari kelemahan kamu.',
  '["Semua fitur Gold selamanya", "Sesi 1-on-1 privat dengan mentor", "Kurikulum personal sesuai kelemahanmu", "Review trading journal rutin", "Prioritas respons semua channel", "Pendampingan prop firm hingga lulus challenge"]',
  'platinum', 'Setara 11 sesi private @ Rp 300rb', FALSE, 4
)
ON CONFLICT (id) DO UPDATE SET
  price          = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  badge          = EXCLUDED.badge,
  perks          = EXCLUDED.perks,
  is_featured    = EXCLUDED.is_featured,
  updated_at     = NOW();

-- ─── Kolom tambahan di tabel members (jika belum ada) ────────────────────────

ALTER TABLE members ADD COLUMN IF NOT EXISTS is_funded     BOOLEAN DEFAULT FALSE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS funded_firm   TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS role          TEXT DEFAULT 'member';

-- Update admin yang sudah ada
-- UPDATE members SET role = 'superadmin' WHERE email = 'your-admin@email.com';

-- ─── Index untuk performa ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_members_tier      ON members (tier);
CREATE INDEX IF NOT EXISTS idx_members_last_seen ON members (last_seen DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials (status);
CREATE INDEX IF NOT EXISTS idx_journals_member_date ON journals (member_id, trade_date DESC);
