import type { Member, Journal, Testimonial, PricingTier } from '../types/mr.types';
// hooks/useLandingStats.ts — Fetch stats untuk landing page dari Supabase

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { LandingStats, PricingTier, Testimonial } from '../types/mr.types';

// ─── Landing Stats (member count, funded count, rating) ──────────────────────

export function useLandingStats() {
  const [stats, setStats]   = useState<LandingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        // Total member
        const { count: memberCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true });

        // Member bulan ini (30 hari terakhir)
        const since30 = new Date();
        since30.setDate(since30.getDate() - 30);
        const { count: newThisMonth } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', since30.toISOString());

        // Funded traders — hitung member yang punya funded_status apapun
        const { count: fundedCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .not('funded_status', 'is', null);

        setStats({
          memberCount:          memberCount ?? 0,
          fundedCount:          fundedCount ?? 0,
          newMembersThisMonth:  newThisMonth ?? 0,
          rating:               4.9,   // bisa di-hardcode atau simpan di DB settings
        });
      } catch (e) {
        console.error('useLandingStats error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { stats, loading };
}

// ─── Testimonials (approved) ──────────────────────────────────────────────────

export function useApprovedTestimonials(limit = 6) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('*')
      .in('status', ['approved','disetujui'])
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (!error && data) setTestimonials(data);
        setLoading(false);
      });
  }, [limit]);

  return { testimonials, loading };
}

// ─── Pricing tiers from DB ────────────────────────────────────────────────────

// Fallback jika tabel pricing_tiers belum ada atau kosong
const PRICING_FALLBACK: PricingTier[] = [
  {
    id: 'trial', tag: 'Trial', name: 'SMC Trial',
    price: 99000, period: '/bulan', badge: undefined,
    pitch: 'Coba dulu tanpa komitmen.',
    perks: ['Channel Outlook harian dari mentor', 'Sesi live mingguan komunitas', 'Materi dasar SMC: struktur, candle, baca chart', 'Akses channel komunitas', 'Bebas berhenti / upgrade kapan saja'],
    accent: 'neutral', sort_order: 1, active: true,
  },
  {
    id: 'bronze', tag: 'Bronze', name: 'SMC Bronze',
    price: 500000, original_price: 750000, period: 'sekali bayar', badge: 'Hemat 33%',
    pitch: 'Materi lengkap, akses seumur hidup.',
    perks: ['Semua fitur Trial', 'Materi SMC lengkap: BOS, IDM, order block, daily bias', 'Video pembelajaran terstruktur, bisa ditonton ulang', 'Update materi gratis selamanya', 'Live session Q&A'],
    accent: 'bronze', note: '≈ Rp 1.370/hari di tahun pertama', sort_order: 2, active: true,
  },
  {
    id: 'gold', tag: 'Gold', name: 'SMC Gold Mentorship',
    price: 1000000, original_price: 1500000, period: 'sekali bayar', badge: 'Paling Direkomendasikan',
    pitch: 'Mentoring intensif, evaluasi tiap minggu.',
    perks: ['Semua fitur Bronze', '2× live mentoring per minggu', 'Review chart langsung di depan grup', 'Evaluasi trading mingguan', 'Channel Question eksklusif', 'Channel Funded Trader (prop firm)', 'Mentor Result — setup mentor tiap minggu'],
    accent: 'gold', note: '≈ Rp 2.740/hari di tahun pertama', is_featured: true, sort_order: 3, active: true,
  },
  {
    id: 'platinum', tag: 'Platinum', name: 'SMC Platinum 1-on-1',
    price: 3500000, original_price: 5000000, period: 'sekali bayar', badge: 'Maks. 10 / batch',
    pitch: 'Privat. Kurikulum dibentuk dari kelemahan kamu.',
    perks: ['Semua fitur Gold selamanya', 'Sesi 1-on-1 privat dengan mentor', 'Kurikulum personal sesuai kelemahanmu', 'Review trading journal rutin', 'Prioritas respons semua channel', 'Pendampingan prop firm hingga lulus challenge'],
    accent: 'platinum', note: 'Setara 11 sesi private @ Rp 300rb', sort_order: 4, active: true,
  },
];

export function usePricing() {
  const [tiers, setTiers]   = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('pricing_tiers')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setTiers(data as PricingTier[]);
        } else {
          // Tabel belum ada atau kosong — pakai fallback
          setTiers(PRICING_FALLBACK);
        }
        setLoading(false);
      });
  }, []);

  return { tiers, loading };
}

// ─── Dashboard stats (per member) ────────────────────────────────────────────

export function useMemberDashboard(memberId: string) {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!memberId) return;

    // Journal minggu ini
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    supabase
      .from('journals')
      .select('*')
      .eq('member_id', memberId)
      .gte('trade_date', weekAgo.toISOString().split('T')[0])
      .order('trade_date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setJournals(data as Journal[]);
        setLoading(false);
      });
  }, [memberId]);

  // Hitung net R dari journals minggu ini
  const netR = journals.reduce((acc, j) => acc + (j.result_r ?? 0), 0);

  return { journals, netR, loading };
}

// ─── Admin member list ────────────────────────────────────────────────────────

export function useAdminMembers() {
  const [members, setMembers]   = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    supabase
      .from('members')
      .select('*')
      .order('last_seen', { ascending: false, nullsFirst: false })
      .then(({ data, error }) => {
        if (!error && data) setMembers(data as Member[]);
        setLoading(false);
      });
  }, []);

  // Online = last_seen dalam 5 menit terakhir
  const onlineCount = members.filter(m => {
    if (!m.last_seen) return false;
    return Date.now() - new Date(m.last_seen).getTime() < 5 * 60 * 1000;
  }).length;

  const everLoggedIn   = members.filter(m => !!m.last_seen);
  const neverLoggedIn  = members.filter(m => !m.last_seen);

  return { members, onlineCount, everLoggedIn, neverLoggedIn, loading };
}
