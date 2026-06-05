import React from 'react';
import { TrendingUp, Wallet, BarChart2, List, SlidersHorizontal, X, CandlestickChart } from 'lucide-react';
import { useMyCompetitionStats } from '../../hooks/useMyCompetitionStats';

interface Competition {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  memberRank: number | null;
  competition: Competition;
}

const C = {
  bg: 'var(--mr-bg)', sidebar: 'var(--mr-sidebar)', panel: 'var(--mr-panel)',
  border: 'var(--mr-border)', border2: 'var(--mr-border2)',
  dim: 'var(--mr-dim)', dimmer: 'var(--mr-dimmer)', muted: 'var(--mr-muted)',
  text: 'var(--mr-text)', up: 'var(--mr-up)', down: 'var(--mr-down)',
  gold: 'var(--mr-gold)', mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};

function fmt(n: number, dec = 2) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
}

function Skeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 14px', height: 84, gridColumn: i === 6 ? 'span 3' : undefined }}>
          <div style={{ width: '40%', height: 7, background: C.border2, borderRadius: 4, marginBottom: 10 }} />
          <div style={{ width: '65%', height: 20, background: C.border2, borderRadius: 4, opacity: 0.6 }} />
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = C.text, wide = false }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; color?: string; wide?: boolean;
}) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: '16px 14px', display: 'flex', flexDirection: 'column' as const, gap: 8,
      gridColumn: wide ? 'span 3' : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.dim }}>
        <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
        <span style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: 0.8 }}>{label.toUpperCase()}</span>
      </div>
      <div style={{ fontFamily: C.mono, fontSize: wide ? 24 : 18, fontWeight: 800, letterSpacing: -0.5, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dimmer }}>{sub}</div>}
    </div>
  );
}

export default function MyStatsModal({ isOpen, onClose, memberId, memberName, memberRank, competition }: Props) {
  const { stats, loading } = useMyCompetitionStats({
    memberId,
    startsAt: competition.starts_at,
    endsAt:   competition.ends_at,
  });

  if (!isOpen) return null;

  const rankStr  = memberRank !== null ? `#${memberRank}` : '--';
  const hasData  = !loading && stats !== null;

  const gainColor = stats
    ? stats.totalGain >= 0 ? '#16a34a' : '#ef4444'
    : C.text;

  const gainStr = stats
    ? `${stats.totalGain >= 0 ? '+' : ''}${fmt(stats.totalGain)}%`
    : '--';

  const pnlColor = stats
    ? stats.totalPnl >= 0 ? '#16a34a' : '#ef4444'
    : C.text;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.sidebar, border: `1px solid ${C.border2}`, borderRadius: 18, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' as const }}
      >
        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, letterSpacing: 1, marginBottom: 10 }}>// MY STATS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
              <div style={{ fontFamily: C.mono, fontSize: 44, fontWeight: 900, letterSpacing: -2, color: C.text, lineHeight: 1 }}>
                {rankStr}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{memberName}</div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.dim, marginTop: 3 }}>{competition.title}</div>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: C.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px 24px' }}>
          {loading ? (
            <Skeleton />
          ) : !hasData ? (
            <div style={{ textAlign: 'center' as const, padding: '36px 0', color: C.dim, fontFamily: C.mono, fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              Belum ada jurnal di periode kompetisi ini.
              <div style={{ fontSize: 11, color: C.dimmer, marginTop: 8, lineHeight: 1.6 }}>
                Isi jurnal trading kamu untuk masuk leaderboard.
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>

                {/* Baris 1 */}
                <StatCard
                  icon={<TrendingUp size={13} />}
                  label="Total Gain"
                  value={gainStr}
                  sub={`${stats!.totalPnl >= 0 ? '+' : ''}$${fmt(stats!.totalPnl)} PnL`}
                  color={gainColor}
                />
                <StatCard
                  icon={<Wallet size={13} />}
                  label="Starting Balance"
                  value={`$${fmt(stats!.startingBalance)}`}
                  sub="equity awal dari jurnal"
                />
                <StatCard
                  icon={<BarChart2 size={13} />}
                  label="Current Balance"
                  value={`$${fmt(stats!.currentBalance)}`}
                  sub={`${stats!.totalPnl >= 0 ? '+' : ''}$${fmt(stats!.totalPnl)} selama kompetisi`}
                  color={pnlColor}
                />

                {/* Baris 2 */}
                <StatCard
                  icon={<TrendingUp size={13} />}
                  label="Highest Profit"
                  value={stats!.highestProfitTrade > 0 ? `+$${fmt(stats!.highestProfitTrade)}` : `$${fmt(stats!.highestProfitTrade)}`}
                  sub="profit terbesar 1 trade"
                  color={stats!.highestProfitTrade > 0 ? '#16a34a' : '#ef4444'}
                />
                <StatCard
                  icon={<CandlestickChart size={13} />}
                  label="Top Instrument"
                  value={stats!.mostTradedPair}
                  sub="paling sering ditrade"
                />
                <StatCard
                  icon={<List size={13} />}
                  label="Total Trades"
                  value={String(stats!.totalTrades)}
                  sub="selama periode kompetisi"
                />

                {/* Win Ratio — full width */}
                <StatCard
                  icon={<SlidersHorizontal size={13} />}
                  label="Win Ratio"
                  value={`${fmt(stats!.winRatio)}%`}
                  sub={`${Math.round(stats!.winRatio * stats!.totalTrades / 100)} WIN dari ${stats!.totalTrades} trade`}
                  color={stats!.winRatio >= 50 ? '#16a34a' : stats!.winRatio >= 40 ? '#eab308' : '#ef4444'}
                  wide
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
