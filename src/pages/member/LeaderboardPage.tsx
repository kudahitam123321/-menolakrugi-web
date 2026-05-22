import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const C = {
  bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', border: 'var(--mr-border)', border2: 'var(--mr-border2)',
  dim: 'var(--mr-dim)', muted: 'var(--mr-muted)', text: 'var(--mr-text)',
  up: 'var(--mr-up)', down: 'var(--mr-down)', warn: '#f59e0b',
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};
const G = { gold: 'var(--mr-gold)' };

const MEDAL_COLORS = ['#a78bfa', '#f97316', '#94a3b8'];
const MEDAL_ICONS  = ['🥇', '🥈', '🥉']; // fallback only
const RANK_IMGS: Record<string, string> = {
  '1':   '/rank_1.png',
  '2':   '/rank_2.png',
  '3':   '/rank_3.png',
  '4-10':'/rank_4-10.png',
  '11+': '/11_sampai_seterusnya.png',
};
const PODIUM_BG    = ['#1c1200', '#12161c', '#1a0f00'];
function RankImg({ rank, size = 32 }: { rank: number; size?: number }) {
  const src = rank === 1 ? RANK_IMGS['1']
            : rank === 2 ? RANK_IMGS['2']
            : rank === 3 ? RANK_IMGS['3']
            : rank <= 10 ? RANK_IMGS['4-10']
            : RANK_IMGS['11+'];
  return <img src={src} alt={`rank-${rank}`} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />;
}

interface ProgressEntry { id: string; nama: string; tier: string; selesai: number; }
interface JurnalEntry   { id: string; nama: string; tier: string; totalPnl: number; gainPct: number; trades: number; tp: number; sl: number; equityAwal: number; }

export default function LeaderboardPage({ memberId, onViewJurnal }: { memberId: string; onViewJurnal?: (m: any) => void }) {
  const [tab, setTab]         = useState<'progress' | 'jurnal'>('progress');
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [jurnal, setJurnal]   = useState<JurnalEntry[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: vids }, { data: progs }, { data: members }] = await Promise.all([
        supabase.from('videos').select('id'),
        supabase.from('member_progress').select('member_id,status'),
        supabase.from('members').select('id,nama,tier'),
      ]);
      setTotalVideos(vids?.length || 0);
      if (progs && members) {
        const counts: Record<string, number> = {};
        progs.forEach((p: any) => { if (p.status === 'selesai') counts[p.member_id] = (counts[p.member_id] || 0) + 1; });
        const lb = members
          .map((m: any) => ({ ...m, selesai: counts[m.id] || 0 }))
          .filter((m: any) => m.selesai > 0)
          .sort((a: any, b: any) => b.selesai - a.selesai);
        setProgress(lb);
      }

      // Jurnal
      const [{ data: jEntries }, { data: jSettings }] = await Promise.all([
        supabase.from('trading_journals').select('member_id,pnl,hasil'),
        supabase.from('journal_settings').select('member_id,equity_awal'),
      ]);
      if (jEntries && members) {
        const eqMap: Record<string, number> = {};
        (jSettings || []).forEach((s: any) => { eqMap[s.member_id] = s.equity_awal || 10000; });
        const pnlMap: Record<string, number> = {};
        const cntMap: Record<string, number> = {};
        const tpMap:  Record<string, number> = {};
        const slMap:  Record<string, number> = {};
        jEntries.forEach((e: any) => {
          pnlMap[e.member_id] = (pnlMap[e.member_id] || 0) + (e.pnl || 0);
          cntMap[e.member_id] = (cntMap[e.member_id] || 0) + 1;
          if (e.hasil === 'Take Profit') tpMap[e.member_id] = (tpMap[e.member_id] || 0) + 1;
          if (e.hasil === 'Stop Loss')   slMap[e.member_id] = (slMap[e.member_id] || 0) + 1;
        });
        const jb = members
          .filter((m: any) => cntMap[m.id])
          .map((m: any) => {
            const ea = eqMap[m.id] || 10000;
            const tp = tpMap[m.id] || 0;
            const sl = slMap[m.id] || 0;
            return {
              id: m.id, nama: m.nama, tier: m.tier,
              totalPnl: pnlMap[m.id] || 0,
              gainPct: ((pnlMap[m.id] || 0) / ea) * 100,
              trades: cntMap[m.id] || 0,
              tp, sl,
              winRate: (tp + sl) > 0 ? (tp / (tp + sl)) * 100 : 0,
              equityAwal: ea,
            };
          })
          .sort((a: any, b: any) => b.gainPct - a.gainPct);
        setJurnal(jb);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const myProgressRank = progress.findIndex(m => m.id === memberId);
  const myJurnalRank   = jurnal.findIndex(m => m.id === memberId);

  const tierColor = (tier: string) => {
    if (tier?.toLowerCase().includes('platinum')) return '#a855f7';
    if (tier?.toLowerCase().includes('gold'))     return '#f59e0b';
    if (tier?.toLowerCase().includes('silver'))   return '#94a3b8';
    return '#16a34a';
  };

  const tabStyle = (t: string): React.CSSProperties => ({
    fontFamily: C.mono, fontSize: 11, letterSpacing: 1, padding: '8px 20px',
    borderRadius: 6, cursor: 'pointer', border: 'none',
    background: tab === t ? G.gold : 'transparent',
    color: tab === t ? '#fff' : C.muted, transition: 'all .2s',
  });

  // ── Podium ─────────────────────────────────────────────────────────────────
  function Podium({ items, valueKey, valueFmt }: { items: any[]; valueKey: string; valueFmt: (v: any) => string }) {
    const top3 = items.slice(0, 3);
    if (top3.length === 0) return null;
    // Explicit podium heights per rank (not display order)
    // rankIdx 0 = 1st place, 1 = 2nd place, 2 = 3rd place
    const BLOCK_H: Record<number, number> = { 0: 120, 1: 72, 2: 50 };
    const ORDER = [1, 0, 2]; // display: left=silver, center=gold, right=bronze
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px 0 0', background: 'linear-gradient(180deg,#0a0a0a,#111)' }}>
        {ORDER.map(rankIdx => {
          const m = top3[rankIdx]; if (!m) return null;
          const isMe    = m.id === memberId;
          const col     = MEDAL_COLORS[rankIdx];
          const blockH  = BLOCK_H[rankIdx];
          return (
            <div key={m.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Info — fixed height container, content bottom-aligned */}
              <div style={{ height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5, paddingBottom: 8, width: '100%' }}>
                <RankImg rank={rankIdx + 1} size={rankIdx === 0 ? 52 : 40} />
                <div style={{ width: rankIdx === 0 ? 58 : 48, height: rankIdx === 0 ? 58 : 48, borderRadius: '50%', background: isMe ? `${col}33` : '#1a1a1a', border: `${rankIdx === 0 ? 3 : 2}px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: rankIdx === 0 ? 22 : 18, color: col, boxShadow: rankIdx === 0 ? `0 0 20px ${col}88` : 'none', flexShrink: 0 }}>
                  {m.nama?.[0]?.toUpperCase()}
                </div>
                <div style={{ fontWeight: rankIdx === 0 ? 800 : 700, fontSize: rankIdx === 0 ? 13 : 11, color: isMe ? col : C.text, textAlign: 'center' as const, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {m.nama}{isMe && <span style={{ color: G.gold, fontSize: 8 }}> ✦</span>}
                </div>
                <div style={{ fontFamily: C.mono, fontSize: rankIdx === 0 ? 13 : 10, fontWeight: 700, color: col }}>{valueFmt(m[valueKey])}</div>
              </div>
              {/* Podium block — explicit px height, flexShrink:0 prevents compression */}
              <div style={{ width: '100%', height: blockH, flexShrink: 0, background: `linear-gradient(180deg,${col}${rankIdx === 0 ? '66' : '44'},${col}${rankIdx === 0 ? '44' : '22'})`, border: `1px solid ${col}${rankIdx === 0 ? '88' : '55'}`, borderBottom: 'none', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: rankIdx === 0 ? `inset 0 0 20px ${col}33` : 'none' }}>
                <span style={{ fontFamily: C.mono, fontWeight: 900, fontSize: rankIdx === 0 ? 20 : 15, color: col }}>#{rankIdx + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── My Rank Bar ────────────────────────────────────────────────────────────
  function MyRankBar({ rank, m, valueLabel }: { rank: number; m: any; valueLabel: string }) {
    if (rank === -1 || rank < 10) return null;
    return (
      <div style={{ margin: '0 16px 16px', padding: '12px 16px', background: 'var(--mr-tint-green)', border: `1px solid var(--mr-gold-a20)`, borderRadius: 10 }}>
        <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 9, textAlign: 'center' as const, marginBottom: 8 }}>· · · POSISIMU · · ·</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: G.gold, minWidth: 36 }}>#{rank + 1}</div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2a2000', border: `2px solid ${G.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: G.gold }}>{m.nama?.[0]?.toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: G.gold }}>{m.nama}</div>
            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginTop: 2 }}>{valueLabel}</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center' as const, color: C.muted, fontFamily: C.mono, fontSize: 12 }}>
      Memuat data peringkat...
    </div>
  );

  return (
    <div style={{ fontFamily: C.sans, color: C.text }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>// PERINGKAT</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Leaderboard Member</div>
        <div style={{ color: C.muted, fontSize: 13 }}>Ranking progress belajar dan performa jurnal trading seluruh member.</div>
      </div>

      {/* My rank summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {myProgressRank !== -1 && (
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <RankImg rank={myProgressRank + 1} size={36} />
            <div>
              <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 9, letterSpacing: 1 }}>PERINGKAT PROGRESS</div>
              <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700, color: myProgressRank < 3 ? MEDAL_COLORS[myProgressRank] : G.gold }}>#{myProgressRank + 1}</div>
              <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>{progress[myProgressRank]?.selesai}/{totalVideos} materi</div>
            </div>
          </div>
        )}
        {myJurnalRank !== -1 && (
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <RankImg rank={myJurnalRank + 1} size={36} />
            <div>
              <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 9, letterSpacing: 1 }}>PERINGKAT JURNAL</div>
              <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700, color: myJurnalRank < 3 ? MEDAL_COLORS[myJurnalRank] : '#3b82f6' }}>#{myJurnalRank + 1}</div>
              <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>{jurnal[myJurnalRank]?.gainPct >= 0 ? '+' : ''}{jurnal[myJurnalRank]?.gainPct.toFixed(1)}% gain</div>
            </div>
          </div>
        )}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 20px' }}>
          <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 9, letterSpacing: 1 }}>TOTAL MEMBER</div>
          <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700, color: C.text }}>{progress.length + (progress.length === 0 ? 0 : 0)}</div>
          <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>aktif belajar</div>
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4, width: 'fit-content' }}>
        <button style={tabStyle('progress')} onClick={() => setTab('progress')}>📚 PROGRESS BELAJAR</button>
        <button style={tabStyle('jurnal')}   onClick={() => setTab('jurnal')}>📓 JURNAL TRADING</button>
      </div>

      {/* ── PROGRESS TAB ── */}
      {tab === 'progress' && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <Podium items={progress} valueKey="selesai" valueFmt={(v) => `${v}/${totalVideos}`} />
          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.mono, fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border2}` }}>
                  {['RANK', 'NAMA', 'TIER', 'PROGRESS', 'MATERI SELESAI'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left' as const, color: C.dim, fontWeight: 600, fontSize: 10, letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progress.map((m, i) => {
                  const isMe = m.id === memberId;
                  const pct  = Math.min(100, Math.round(m.selesai / (totalVideos || 1) * 100));
                  const col  = i < 3 ? MEDAL_COLORS[i] : C.muted;
                  return (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}`, background: isMe ? 'var(--mr-tint-gold)' : 'transparent' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <RankImg rank={i + 1} size={i < 3 ? 36 : 28} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: isMe ? '#2a2000' : '#161616', border: `2px solid ${isMe ? G.gold : col + '55'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: isMe ? G.gold : col, flexShrink: 0 }}>
                            {m.nama?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: isMe ? G.gold : C.text }}>{m.nama}</div>
                            {isMe && <div style={{ fontFamily: C.mono, fontSize: 9, color: G.gold, marginTop: 2 }}>● KAMU</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: C.mono, fontSize: 10, color: tierColor(m.tier), background: `${tierColor(m.tier)}15`, padding: '2px 8px', borderRadius: 4 }}>{m.tier}</span>
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: 140 }}>
                        <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isMe ? G.gold : col, borderRadius: 3, transition: 'width 0.8s' }}/>
                        </div>
                        <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, marginTop: 4 }}>{pct}%</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: C.mono, fontWeight: 700, color: isMe ? G.gold : col, fontSize: 14 }}>
                        {m.selesai}<span style={{ color: '#333', fontWeight: 400, fontSize: 11 }}>/{totalVideos}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <MyRankBar rank={myProgressRank} m={progress[myProgressRank]} valueLabel={`${progress[myProgressRank]?.selesai}/${totalVideos} materi selesai`} />
        </div>
      )}

      {/* ── JURNAL TAB ── */}
      {tab === 'jurnal' && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {jurnal.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' as const }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📓</div>
              <div style={{ color: C.muted, fontFamily: C.mono, fontSize: 12, marginBottom: 8 }}>Belum ada member yang mengisi jurnal</div>
            </div>
          ) : (
            <>
              <Podium items={jurnal} valueKey="gainPct" valueFmt={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.mono, fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border2}` }}>
                      {['RANK', 'NAMA', 'TIER', 'TRADES', 'WIN RATE', 'TOTAL PNL', 'EQUITY GAIN', ''].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left' as const, color: C.dim, fontWeight: 600, fontSize: 10, letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jurnal.map((m, i) => {
                      const isMe     = m.id === memberId;
                      const col      = i < 3 ? MEDAL_COLORS[i] : C.muted;
                      const isProfit = m.totalPnl >= 0;
                      return (
                        <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}`, background: isMe ? '#0c1a2e' : 'transparent' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <RankImg rank={i + 1} size={i < 3 ? 36 : 28} />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: isMe ? '#1d4ed8' : '#161616', border: `2px solid ${isMe ? '#3b82f6' : col + '55'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: isMe ? '#93c5fd' : col, flexShrink: 0 }}>
                                {m.nama?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: isMe ? '#93c5fd' : C.text }}>{m.nama}</div>
                                {isMe && <div style={{ fontFamily: C.mono, fontSize: 9, color: '#3b82f6', marginTop: 2 }}>● KAMU</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontFamily: C.mono, fontSize: 10, color: tierColor(m.tier), background: `${tierColor(m.tier)}15`, padding: '2px 8px', borderRadius: 4 }}>{m.tier}</span>
                          </td>
                          <td style={{ padding: '12px 16px', color: C.text }}>{m.trades}</td>
                          <td style={{ padding: '12px 16px', color: m.winRate >= 50 ? C.up : C.down, fontWeight: 700 }}>{m.winRate.toFixed(1)}%</td>
                          <td style={{ padding: '12px 16px', color: isProfit ? C.up : C.down, fontWeight: 700 }}>
                            {isProfit ? '+' : ''}${m.totalPnl.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: isProfit ? C.up : C.down, fontSize: 14 }}>
                            {isProfit ? '+' : ''}{m.gainPct.toFixed(2)}%
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {onViewJurnal && (
                              <button onClick={() => onViewJurnal(m)}
                                style={{ background: '#0c1a2e', border: '1px solid #1d4ed844', color: '#60a5fa', fontFamily: C.mono, fontSize: 10, padding: '4px 12px', borderRadius: 5, cursor: 'pointer' }}>
                                LIHAT
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {myJurnalRank >= 10 && (() => {
                const me = jurnal[myJurnalRank];
                return (
                  <div style={{ margin: '0 16px 16px', padding: '12px 16px', background: '#0c1a2e', border: '1px solid #3b82f622', borderRadius: 10 }}>
                    <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 9, textAlign: 'center' as const, marginBottom: 8 }}>· · · POSISIMU · · ·</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: '#3b82f6', minWidth: 36 }}>#{myJurnalRank + 1}</div>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1d4ed8', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#93c5fd' }}>{me.nama?.[0]?.toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#93c5fd' }}>{me.nama}</div>
                        <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginTop: 2 }}>{me.gainPct >= 0 ? '+' : ''}{me.gainPct.toFixed(1)}% gain · {me.trades} trade</div>
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, color: me.gainPct >= 0 ? C.up : C.down }}>{me.gainPct >= 0 ? '+' : ''}{me.gainPct.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
