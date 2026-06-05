import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface MyCompetitionStats {
  totalTrades: number;
  winRatio: number;
  highestProfitTrade: number;  // dollar
  mostTradedPair: string;
  startingBalance: number;     // equity_awal dari journal_settings
  currentBalance: number;      // startingBalance + sum(pnl) selama kompetisi
  totalGain: number;           // persen
  totalPnl: number;            // sum pnl selama kompetisi
}

interface Params {
  memberId: string | null;
  startsAt: string;
  endsAt: string;
}

export function useMyCompetitionStats({ memberId, startsAt, endsAt }: Params) {
  const [stats, setStats]     = useState<MyCompetitionStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!memberId || !startsAt || !endsAt) return;

    let cancelled = false;
    setLoading(true);
    setStats(null);

    (async () => {
      try {
        const startDate = new Date(startsAt).toISOString().split('T')[0];
        const endDate   = new Date(endsAt).toISOString().split('T')[0];

        console.log('[MyStats] memberId:', memberId);
        console.log('[MyStats] filter:', startDate, '→', endDate);

        // Fetch jurnal kompetisi + equity_awal sekaligus
        const [{ data: journals, error: jErr }, { data: settings }] = await Promise.all([
          supabase
            .from('trading_journals')
            .select('tanggal,pair,hasil,pnl')
            .eq('member_id', memberId)
            .gte('tanggal', startDate)
            .lte('tanggal', endDate)
            .order('tanggal', { ascending: true }),
          supabase
            .from('journal_settings')
            .select('equity_awal')
            .eq('member_id', memberId)
            .single(),
        ]);

        console.log('[MyStats] journals:', journals?.length, 'error:', jErr?.message);
        console.log('[MyStats] sample tanggal:', journals?.[0]?.tanggal);

        if (cancelled) return;

        if (!journals || journals.length === 0) {
          setStats(null);
          if (!cancelled) setLoading(false);
          return;
        }

        // Starting balance = equity_awal yang member set di halaman jurnal
        const startingBalance: number = settings?.equity_awal ?? 10000;

        // Hitung agregat dari jurnal selama periode kompetisi
        let totalPnl = 0;
        let wins     = 0;
        let highestProfitTrade = -Infinity;
        const pairCount: Record<string, number> = {};

        journals.forEach((j: any) => {
          const pnl = j.pnl ?? 0;
          totalPnl += pnl;
          if (pnl > highestProfitTrade) highestProfitTrade = pnl;

          // 'Take Profit' dan 'SL Profit' dihitung sebagai win
          if (j.hasil === 'Take Profit' || j.hasil === 'SL Profit') wins++;

          const pair = j.pair || 'N/A';
          pairCount[pair] = (pairCount[pair] || 0) + 1;
        });

        const total            = journals.length;
        const winRatio         = (wins / total) * 100;
        const currentBalance   = startingBalance + totalPnl;
        const totalGain        = startingBalance !== 0
          ? (totalPnl / startingBalance) * 100
          : 0;
        const mostTradedPair   = Object.entries(pairCount)
          .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

        if (!cancelled) {
          setStats({
            totalTrades: total,
            winRatio,
            highestProfitTrade: highestProfitTrade === -Infinity ? 0 : highestProfitTrade,
            mostTradedPair,
            startingBalance,
            currentBalance,
            totalGain,
            totalPnl,
          });
        }
      } catch (e) {
        console.error('useMyCompetitionStats error:', e);
        if (!cancelled) setStats(null);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [memberId, startsAt, endsAt]);

  return { stats, loading };
}
