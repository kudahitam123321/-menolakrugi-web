// types/mr.types.ts — Semua TypeScript interface untuk proyek Menolak Rugi

// ─── Supabase tables ─────────────────────────────────────────────────────────

export interface Member {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  tier: 'trial' | 'bronze' | 'smc silver' | 'gold' | 'platinum';
  discord_username?: string;
  password: string;           // hashed di backend
  last_seen?: string;         // ISO string
  is_funded?: boolean;
  funded_firm?: string;       // FTMO, MFF, dll
  created_at: string;
  role?: 'member' | 'admin' | 'superadmin';
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  category: string;           // 'basic' | 'advanced' | dll
  module_number?: string;     // '01', '02', dst
  unit_number?: number;
  duration_seconds?: number;
  video_url?: string;
  thumbnail_url?: string;
  tier_access: string[];      // ['bronze', 'gold', 'platinum'] dst
  status: 'published' | 'coming_soon' | 'draft';
  sort_order?: number;
  created_at: string;
}

export interface Testimonial {
  id: string;
  member_id?: string;
  member_name: string;
  member_role?: string;       // "Funded $25k FTMO", "Member sejak Mar 2025"
  pl_result?: string;         // "+12.4%"
  duration?: string;          // "21 hari"
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface FundedBroker {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  challenge_url?: string;
  min_capital?: number;
  max_capital?: number;
  profit_split?: number;      // persen, mis. 80
  tags?: string[];
  is_recommended?: boolean;
  sort_order?: number;
  created_at: string;
}

export interface Journal {
  id: string;
  member_id: string;
  member?: Pick<Member, 'name' | 'tier'>;
  pair: string;
  setup_type?: string;        // "OB H4", "BOS M15", dll
  side: 'LONG' | 'SHORT';
  entry_price: number;
  sl_price: number;
  tp_price?: number;
  result_r?: number;          // mis. +2.1, -1.0
  outcome?: 'win' | 'loss' | 'breakeven' | 'running';
  note?: string;
  screenshot_url?: string;
  link_url?: string;
  trade_date: string;         // ISO date
  created_at: string;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface PricingTier {
  id: string;
  tag: string;                // 'Trial', 'Bronze', 'Gold', 'Platinum'
  name: string;               // 'SMC Gold Mentorship'
  price: number;              // dalam rupiah, mis. 1000000
  original_price?: number;    // harga coret
  period: string;             // 'sekali bayar' | '/bulan'
  badge?: string;             // 'Paling Direkomendasikan'
  pitch: string;              // satu kalimat singkat
  perks: string[];            // list keuntungan
  accent: 'neutral' | 'bronze' | 'gold' | 'platinum';
  note?: string;              // "≈ Rp 2.740/hari"
  is_featured?: boolean;
  sort_order: number;
  active: boolean;
}

// ─── Landing page stats ───────────────────────────────────────────────────────

export interface LandingStats {
  memberCount: number;
  fundedCount: number;
  newMembersThisMonth: number;
  rating: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  curriculumProgress: number; // 0–100
  currentModule: string;      // "03"
  totalModules: number;       // 5
  currentUnit: string;        // "03.2"
  currentUnitTitle: string;
  unitProgress: number;       // 0–100
  tradeCountThisMonth: number;
  tradeCountDelta: number;
  winRate30d: number;
  winRatePrev30d: number;
  runningPL: number;          // dalam R
  prevMonthPL: number;
}

export interface NextLiveSession {
  title: string;
  scheduled_at: string;       // ISO string
  join_url?: string;
}

// ─── Ticker ──────────────────────────────────────────────────────────────────

export interface TickerPair {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

// ─── Admin panel tabs ─────────────────────────────────────────────────────────

export type AdminTab =
  | 'member'
  | 'video'
  | 'request_advance'
  | 'pengumuman'
  | 'broker'
  | 'ulasan'
  | 'klaim_partnership'
  | 'admin';
