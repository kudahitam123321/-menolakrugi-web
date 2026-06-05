
export interface LeaderboardEntry {
  memberId: string;
  nama: string;
  trades: number;
  winRatio: number;
  profit: number;
  gain: number;
}

interface Props {
  entries: LeaderboardEntry[];
  currentMemberId: string | null;
  compact?: boolean;
  isMobile?: boolean;
  onViewStats?: (entry: LeaderboardEntry, rank: number) => void;
}

const UP_COLOR = '#22c55e';

function RankImg({ rank, size = 28 }: { rank: number; size?: number }) {
  const src = rank === 1 ? '/rank_1.png'
    : rank === 2 ? '/rank_2.png'
    : rank === 3 ? '/rank_3.png'
    : rank <= 10 ? '/rank_4-10.png'
    : rank <= 20 ? '/rank_11-20.png'
    : '/rank_21-sampai_seterusnya.png';
  return <img src={src} alt={`#${rank}`} style={{ width: size, height: size, objectFit: 'contain' }} />;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function LeaderboardTable({ entries, currentMemberId, compact = false, isMobile = false, onViewStats }: Props) {
  if (entries.length === 0) {
    return (
      <div style={{
        padding: '40px 20px', textAlign: 'center' as const,
        color: 'var(--mr-dim)', fontFamily: '"Geist Mono",monospace', fontSize: 13,
      }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
        Belum ada peserta.
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--mr-dimmer)' }}>
          Leaderboard terisi otomatis saat member mengisi jurnal.
        </div>
      </div>
    );
  }

  const pad = isMobile ? '10px 10px' : compact ? '8px 10px' : '12px 14px';

  return (
    <div style={{ overflowX: 'auto' as const, WebkitOverflowScrolling: 'touch' as const }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: isMobile ? 12 : 13, minWidth: isMobile ? 0 : 480 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--mr-border)' }}>
            {/* Rank */}
            <th style={{ fontFamily: '"Geist Mono",monospace', fontSize: 9, letterSpacing: 1, color: 'var(--mr-dim)', fontWeight: 700, padding: pad, textAlign: 'center' as const, whiteSpace: 'nowrap' as const }}>
              RANK
            </th>
            {/* Nama */}
            <th style={{ fontFamily: '"Geist Mono",monospace', fontSize: 9, letterSpacing: 1, color: 'var(--mr-dim)', fontWeight: 700, padding: pad, textAlign: 'left' as const, whiteSpace: 'nowrap' as const }}>
              NAMA
            </th>
            {/* Trades — sembunyikan di mobile */}
            {!isMobile && (
              <th style={{ fontFamily: '"Geist Mono",monospace', fontSize: 9, letterSpacing: 1, color: 'var(--mr-dim)', fontWeight: 700, padding: pad, textAlign: 'left' as const, whiteSpace: 'nowrap' as const }}>
                TRADES
              </th>
            )}
            {/* Win % — sembunyikan di mobile */}
            {!isMobile && (
              <th style={{ fontFamily: '"Geist Mono",monospace', fontSize: 9, letterSpacing: 1, color: 'var(--mr-dim)', fontWeight: 700, padding: pad, textAlign: 'left' as const, whiteSpace: 'nowrap' as const }}>
                WIN %
              </th>
            )}
            {/* Profit — sembunyikan di mobile */}
            {!isMobile && (
              <th style={{ fontFamily: '"Geist Mono",monospace', fontSize: 9, letterSpacing: 1, color: 'var(--mr-dim)', fontWeight: 700, padding: pad, textAlign: 'left' as const, whiteSpace: 'nowrap' as const }}>
                PROFIT
              </th>
            )}
            {/* Gain — selalu tampil */}
            <th style={{ fontFamily: '"Geist Mono",monospace', fontSize: 9, letterSpacing: 1, color: 'var(--mr-dim)', fontWeight: 700, padding: pad, textAlign: 'left' as const, whiteSpace: 'nowrap' as const }}>
              GAIN
            </th>
            {/* Stats button column */}
            {onViewStats && <th style={{ padding: pad, width: 40 }} />}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const isMine = e.memberId === currentMemberId;
            const rank   = i + 1;
            return (
              <tr key={e.memberId} style={{
                background: isMine ? 'rgba(22,163,74,0.06)' : 'transparent',
                borderBottom: '1px solid var(--mr-border)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={ev => (ev.currentTarget as HTMLElement).style.background = isMine ? 'rgba(22,163,74,0.10)' : 'var(--mr-panel)'}
                onMouseLeave={ev => (ev.currentTarget as HTMLElement).style.background = isMine ? 'rgba(22,163,74,0.06)' : 'transparent'}
              >
                {/* Rank */}
                <td style={{ padding: pad, textAlign: 'center' as const }}>
                  <RankImg rank={rank} size={isMobile ? 22 : 28} />
                </td>
                {/* Nama */}
                <td style={{ padding: pad, maxWidth: isMobile ? 100 : 160 }}>
                  <div style={{ fontWeight: 600, color: isMine ? UP_COLOR : 'var(--mr-text)', display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                    {isMine && (
                      <span style={{ fontFamily: '"Geist Mono",monospace', fontSize: 7, color: UP_COLOR, background: 'rgba(22,163,74,0.12)', padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>
                        KAMU
                      </span>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {isMobile ? e.nama.split(' ')[0] : e.nama}
                    </span>
                  </div>
                </td>
                {/* Trades */}
                {!isMobile && (
                  <td style={{ padding: pad, fontFamily: '"Geist Mono",monospace', color: 'var(--mr-text)' }}>
                    {e.trades}
                  </td>
                )}
                {/* Win Ratio */}
                {!isMobile && (
                  <td style={{ padding: pad, fontFamily: '"Geist Mono",monospace' }}>
                    <span style={{ color: e.winRatio >= 50 ? UP_COLOR : 'var(--mr-dim)' }}>
                      {e.winRatio > 0 ? `${e.winRatio.toFixed(1)}%` : '0%'}
                    </span>
                  </td>
                )}
                {/* Profit */}
                {!isMobile && (
                  <td style={{ padding: pad, fontFamily: '"Geist Mono",monospace' }}>
                    <span style={{ color: e.profit >= 0 ? UP_COLOR : '#ef4444' }}>
                      {e.profit >= 0 ? '+' : ''}${fmt(e.profit)}
                    </span>
                  </td>
                )}
                {/* Gain */}
                <td style={{ padding: pad, fontFamily: '"Geist Mono",monospace' }}>
                  <span style={{ color: e.gain >= 0 ? UP_COLOR : '#ef4444', fontWeight: isMobile ? 700 : 400 }}>
                    {e.gain >= 0 ? '+' : ''}{e.gain.toFixed(2)}%
                  </span>
                </td>
                {/* Stats button */}
                {onViewStats && (
                  <td style={{ padding: `${isMobile ? '6px' : '8px'} 10px`, textAlign: 'center' as const }}>
                    <button
                      onClick={() => onViewStats(e, rank)}
                      title={`Lihat stats ${e.nama}`}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--mr-border2)',
                        borderRadius: 6,
                        width: 28, height: 28,
                        cursor: 'pointer',
                        color: UP_COLOR,
                        fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={ev => {
                        (ev.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.10)';
                        (ev.currentTarget as HTMLElement).style.borderColor = UP_COLOR;
                      }}
                      onMouseLeave={ev => {
                        (ev.currentTarget as HTMLElement).style.background = 'transparent';
                        (ev.currentTarget as HTMLElement).style.borderColor = 'var(--mr-border2)';
                      }}
                    >
                      ↗
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
