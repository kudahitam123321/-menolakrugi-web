// pages/CompetitionPage.tsx — Halaman Kompetisi Member
import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CompetitionCountdown from '../components/competition/CompetitionCountdown';
import LeaderboardTable, { LeaderboardEntry } from '../components/competition/LeaderboardTable';
import MyStatsModal from '../components/competition/MyStatsModal';
import CompetitionPodium from '../components/competition/CompetitionPodium';

const C = {
  bg: 'var(--mr-bg)', sidebar: 'var(--mr-sidebar)', panel: 'var(--mr-panel)',
  border: 'var(--mr-border)', border2: 'var(--mr-border2)',
  dim: 'var(--mr-dim)', dimmer: 'var(--mr-dimmer)', muted: 'var(--mr-muted)',
  text: 'var(--mr-text)', up: 'var(--mr-up)', down: 'var(--mr-down)',
  gold: 'var(--mr-gold)', mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};
const GOLD_COLOR = '#F5A623';

interface Competition {
  id: string;
  title: string;
  platform_tag: string;
  status: string;
  starts_at: string;
  ends_at: string;
  entry_type: string;
  prize_pool: string | null;
  more_info: string | null;
  trading_rules: string[] | null;
  organizer: string;
  is_active: boolean;
}

const DEFAULT_EQUITY = 10000; // fallback jika member belum set equity_awal

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function Modal({ title, content, onClose }: { title: string; content: string; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: C.sidebar, border: `1px solid ${C.border2}`, borderRadius: 14, padding: 28, maxWidth: 480, width: '100%' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>// {title.toUpperCase()}</div>
        <div style={{ color: C.text, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }}>{content}</div>
        <button onClick={onClose} style={{ marginTop: 20, fontFamily: C.mono, fontSize: 11, color: C.dim, background: 'transparent', border: `1px solid ${C.border}`, padding: '7px 18px', cursor: 'pointer', borderRadius: 6 }}>
          × Tutup
        </button>
      </div>
    </div>
  );
}


export default function CompetitionPage({ embedded = false, onGoToJurnal }: { embedded?: boolean; onGoToJurnal?: () => void }) {
  const [comp, setComp]       = useState<Competition | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [modal, setModal]       = useState<{ title: string; content: string } | null>(null);
  const [showMyStats, setShowMyStats]   = useState(false);
  const [viewEntry, setViewEntry]       = useState<{ memberId: string; nama: string; rank: number } | null>(null);
  const [infoOpen, setInfoOpen]         = useState(false);
  const [rulesOpen, setRulesOpen]       = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const compRef = useRef<Competition | null>(null); // ref agar bisa diakses dari subscription callback

  // Session — disimpan di mr_member (atau sessionStorage jika tidak centang "ingat saya")
  const raw = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member');
  const session = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;
  const memberId: string | null = session?.id ?? null;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // ── Fetch leaderboard (bisa dipanggil ulang saat ada perubahan realtime) ──
  const fetchLeaderboard = useCallback(async (c: Competition) => {
    try {
      const startDate = new Date(c.starts_at).toISOString().split('T')[0];
      const endDate   = new Date(c.ends_at).toISOString().split('T')[0];
      const [{ data: journals }, { data: members }, { data: settings }] = await Promise.all([
        supabase.from('trading_journals').select('member_id,hasil,pnl')
          .gte('tanggal', startDate)
          .lte('tanggal', endDate),
        supabase.from('members').select('id,nama'),
        supabase.from('journal_settings').select('member_id,equity_awal'),
      ]);

      if (!journals || !members) return;

      const memberMap: Record<string, string> = {};
      members.forEach((m: any) => { memberMap[m.id] = m.nama || 'Anon'; });

      const equityMap: Record<string, number> = {};
      (settings || []).forEach((s: any) => { equityMap[s.member_id] = s.equity_awal || DEFAULT_EQUITY; });

      const agg: Record<string, { tp: number; total: number; pnl: number }> = {};
      journals.forEach((j: any) => {
        const mid = j.member_id;
        if (!agg[mid]) agg[mid] = { tp: 0, total: 0, pnl: 0 };
        agg[mid].total++;
        agg[mid].pnl += (j.pnl ?? 0);
        if (j.hasil === 'Take Profit' || j.hasil === 'SL Profit') agg[mid].tp++;
      });

      const result: LeaderboardEntry[] = Object.entries(agg)
        .map(([mid, d]) => {
          const equity = equityMap[mid] || DEFAULT_EQUITY;
          const gain   = (d.pnl / equity) * 100; // rank berdasarkan equity gain %
          return {
            memberId: mid,
            nama: memberMap[mid] || 'Anon',
            trades: d.total,
            winRatio: d.total > 0 ? (d.tp / d.total) * 100 : 0,
            profit: d.pnl,
            gain,
          };
        })
        .sort((a, b) => b.gain - a.gain);

      setEntries(result);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('fetchLeaderboard error:', e);
    }
  }, []);

  // ── Initial load ──
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: compData } = await supabase
          .from('competitions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!compData) { setLoading(false); return; }
        const c = compData as Competition;
        compRef.current = c;
        setComp(c);
        await fetchLeaderboard(c);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [fetchLeaderboard]);

  // ── Realtime subscription — re-fetch leaderboard saat jurnal berubah ──
  useEffect(() => {
    const channel = supabase
      .channel('competition-leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trading_journals' },
        () => {
          if (compRef.current) fetchLeaderboard(compRef.current);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 13 }}>Memuat kompetisi...</div>
      </div>
    );
  }

  if (!comp) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' as const, gap: 16 }}>
        <div style={{ fontSize: 48 }}>🏆</div>
        <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 14 }}>Belum ada kompetisi aktif saat ini.</div>
        <div style={{ fontFamily: C.mono, color: C.dimmer, fontSize: 11 }}>Admin akan mengumumkan kompetisi berikutnya segera.</div>
      </div>
    );
  }

  const isOngoing   = comp.status === 'ongoing' && new Date(comp.ends_at) > new Date();
  const top10       = entries.slice(0, 10);   // leaderboard hanya tampilkan top 10
  const top3        = entries.slice(0, 3);
  const participants = entries.length;
  const myRankIdx   = memberId ? entries.findIndex(e => e.memberId === memberId) : -1;
  const myRank      = myRankIdx >= 0 ? myRankIdx + 1 : null;
  const myEntry     = myRankIdx >= 0 ? entries[myRankIdx] : null;



  return (
    <div style={{ minHeight: embedded ? undefined : '100vh', background: embedded ? 'transparent' : C.bg, fontFamily: C.sans }}>
      {/* Topbar — hanya tampil di standalone mode */}
      {!embedded && (
        <div style={{ background: C.sidebar, borderBottom: `1px solid ${C.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.location.href = '/member'}
            style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontFamily: C.mono, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Dashboard
          </button>
          <span style={{ color: C.border2 }}>|</span>
          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, letterSpacing: 0.5 }}>COMPETITION</span>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px' : '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 24 }}>

          {/* ── Konten Utama ── */}
          <div>
            {/* Header Card */}
            <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 16, padding: isMobile ? '20px 16px' : '28px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
              {/* Glow */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: `radial-gradient(ellipse,${GOLD_COLOR}0f 0%,transparent 70%)`, pointerEvents: 'none' }} />

              {/* Baris badge */}
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 14, alignItems: 'center' }}>
                {/* Platform tag */}
                <span style={{ fontFamily: C.mono, fontSize: 10, color: '#60a5fa', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', padding: '3px 9px', borderRadius: 20, letterSpacing: 0.5 }}>
                  ⚡ {comp.platform_tag}
                </span>
                {/* Status */}
                <span style={{ fontFamily: C.mono, fontSize: 10, color: isOngoing ? C.up : C.dim, background: isOngoing ? 'rgba(22,163,74,0.12)' : 'rgba(100,100,100,0.12)', border: `1px solid ${isOngoing ? 'rgba(22,163,74,0.3)' : C.border2}`, padding: '3px 9px', borderRadius: 20 }}>
                  {isOngoing ? '● Ongoing' : '● Ended'}
                </span>
              </div>

              {/* Judul */}
              <h1 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, letterSpacing: -1, margin: '0 0 16px', lineHeight: 1.15, color: C.text }}>
                {comp.title}
              </h1>

              {/* Timer + tombol */}
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 16, alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, letterSpacing: 1, marginBottom: 8 }}>
                    {isOngoing ? 'BERAKHIR DALAM' : 'KOMPETISI BERAKHIR'}
                  </div>
                  <CompetitionCountdown endsAtIso={comp.ends_at} compact={isMobile} />
                </div>

                {/* Podium top 3 */}
                {top3.length > 0 && !isMobile && (
                  <CompetitionPodium top3={top3} currentMemberId={memberId} />
                )}
              </div>

              {/* Tombol Prize & More Info (dikonfigurasi admin) */}
              <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' as const }}>
                {comp.prize_pool && (
                  <button onClick={() => setModal({ title: 'Prize Pool', content: comp.prize_pool! })}
                    style={{ fontFamily: C.mono, fontSize: 11, color: GOLD_COLOR, background: `${GOLD_COLOR}18`, border: `1px solid ${GOLD_COLOR}44`, padding: '7px 14px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🏆 Show Prizepool
                  </button>
                )}
                {comp.more_info && (
                  <button onClick={() => setModal({ title: 'More Info', content: comp.more_info! })}
                    style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, background: 'transparent', border: `1px solid ${C.border2}`, padding: '7px 14px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ℹ More Info
                  </button>
                )}
              </div>
            </div>

            {/* Podium mobile */}
            {top3.length > 0 && isMobile && (
              <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 16px', marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, letterSpacing: 1, marginBottom: 16 }}>// TOP 3</div>
                <CompetitionPodium top3={top3} currentMemberId={memberId} isMobile />
              </div>
            )}

            {/* Mobile: Compact rank strip sebelum leaderboard */}
            {isMobile && (
              <div style={{ background: C.sidebar, border: `1px solid ${myRank ? 'rgba(22,163,74,0.35)' : C.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 900, letterSpacing: -1, color: myRank ? C.text : C.border2, lineHeight: 1 }}>
                    {myRank ? `#${myRank}` : '?'}
                  </div>
                  <div>
                    <div style={{ fontFamily: C.mono, fontSize: 9, color: myRank ? C.up : C.dim, fontWeight: 700, letterSpacing: 0.5 }}>
                      {myRank ? 'PERINGKAT KAMU' : 'BELUM ADA JURNAL'}
                    </div>
                    {myEntry && (
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: myEntry.gain >= 0 ? '#16a34a' : '#ef4444', marginTop: 2 }}>
                        {myEntry.gain >= 0 ? '+' : ''}{myEntry.gain.toFixed(2)}% gain
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowMyStats(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: myRank ? 'rgba(22,163,74,0.10)' : C.panel, border: `1px solid ${myRank ? 'rgba(22,163,74,0.3)' : C.border2}`, color: myRank ? '#16a34a' : C.muted, fontFamily: C.mono, fontWeight: 700, fontSize: 11, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                  <BarChart2 size={13} />
                  My Stats
                </button>
              </div>
            )}

            {/* Leaderboard */}
            <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' as const }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, letterSpacing: 1 }}>// LEADERBOARD</div>
                  {isOngoing && (
                    <span style={{ fontFamily: C.mono, fontSize: 8, color: C.up, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 7px', borderRadius: 10, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: C.up, animation: 'mr-blink 1.2s ease-in-out infinite' }} />
                      LIVE
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {lastUpdated && (
                    <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dimmer }}>
                      Update: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  )}
                  <div style={{ fontFamily: C.mono, fontSize: 10, color: C.dim }}>{participants} peserta</div>
                </div>
              </div>
              <LeaderboardTable
                entries={top10}
                currentMemberId={memberId}
                isMobile={isMobile}
                onViewStats={(e, rank) => setViewEntry({ memberId: e.memberId, nama: e.nama, rank })}
              />
              {myRank !== null && myRank > 10 && (
                <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: 11, color: C.dim, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Posisi kamu: <strong style={{ color: C.text }}>#{myRank}</strong> dari {participants} peserta</span>
                  <span style={{ color: C.dimmer }}>tidak ditampilkan di top 10</span>
                </div>
              )}
            </div>

            {/* Info: leaderboard otomatis */}
            <div style={{ marginTop: 12, fontFamily: C.mono, fontSize: 10, color: C.dimmer, lineHeight: 1.6 }}>
              * Leaderboard diperbarui otomatis berdasarkan data jurnal trading kamu. Tidak perlu daftar manual.
            </div>
          </div>

          {/* ── Sidebar Kanan ── */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {/* Info kompetisi — collapsible di mobile */}
            <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <button
                onClick={() => isMobile && setInfoOpen(o => !o)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'none', border: 'none', cursor: isMobile ? 'pointer' : 'default', textAlign: 'left' as const }}
              >
                <span style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, letterSpacing: 1 }}>// INFO KOMPETISI</span>
                {isMobile && (infoOpen ? <ChevronUp size={14} color={C.dim} /> : <ChevronDown size={14} color={C.dim} />)}
              </button>
              {(!isMobile || infoOpen) && (
                <div style={{ padding: '0 20px 16px' }}>
                  {[
                    { label: 'Mulai',         value: fmtDate(comp.starts_at) },
                    { label: 'Berakhir',      value: fmtDate(comp.ends_at) },
                    { label: 'Entry',         value: comp.entry_type },
                    { label: 'Peserta',       value: `${participants} member` },
                    { label: 'Penyelenggara', value: comp.organizer },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: C.mono, fontSize: 10, color: C.dim, flexShrink: 0 }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: C.text, textAlign: 'right' as const, fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trading Rules — collapsible di mobile */}
            {comp.trading_rules && comp.trading_rules.length > 0 && (
              <div style={{ background: C.sidebar, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                <button
                  onClick={() => isMobile && setRulesOpen(o => !o)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'none', border: 'none', cursor: isMobile ? 'pointer' : 'default', textAlign: 'left' as const }}
                >
                  <span style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, letterSpacing: 1 }}>// TRADING RULES</span>
                  {isMobile && (rulesOpen ? <ChevronUp size={14} color={C.dim} /> : <ChevronDown size={14} color={C.dim} />)}
                </button>
                {(!isMobile || rulesOpen) && (
                  <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column' as const, gap: 9 }}>
                    {comp.trading_rules.map((rule, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                        <span style={{ color: C.up, flexShrink: 0, marginTop: 1 }}>✓</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Current Rank box — hanya desktop (mobile sudah ada compact strip di atas leaderboard) */}
            {!isMobile && <div style={{ background: C.sidebar, border: `1px solid ${myRank ? 'rgba(22,163,74,0.35)' : C.border}`, borderRadius: 14, padding: '20px 20px', position: 'relative', overflow: 'hidden' }}>
              {myRank && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#16a34a,transparent)' }} />}
              <div style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, letterSpacing: 1, marginBottom: 14 }}>// CURRENT RANK</div>

              {myRank ? (
                /* Sudah ada di leaderboard */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ fontFamily: C.mono, fontSize: 38, fontWeight: 900, letterSpacing: -2, color: C.text, lineHeight: 1 }}>
                      #{myRank}
                    </div>
                    <div>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: C.up, fontWeight: 700 }}>POSISI KAMU</div>
                      <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>dari {participants} peserta</div>
                    </div>
                  </div>
                  {myEntry && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
                      <div style={{ fontFamily: C.mono, fontSize: 11, color: myEntry.gain >= 0 ? '#16a34a' : '#ef4444', background: myEntry.gain >= 0 ? 'rgba(22,163,74,0.10)' : 'rgba(239,68,68,0.10)', border: `1px solid ${myEntry.gain >= 0 ? 'rgba(22,163,74,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: '3px 10px', borderRadius: 20 }}>
                        {myEntry.gain >= 0 ? '+' : ''}{myEntry.gain.toFixed(2)}% gain
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, background: C.panel, border: `1px solid ${C.border}`, padding: '3px 10px', borderRadius: 20 }}>
                        {myEntry.trades} trades
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Login tapi belum ada jurnal */
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: C.mono, fontSize: 38, fontWeight: 900, letterSpacing: -2, color: C.border2, lineHeight: 1, marginBottom: 10 }}>?</div>
                  <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>
                    Belum ada di leaderboard. Isi jurnal trading untuk masuk.
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowMyStats(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: myRank ? 'rgba(22,163,74,0.10)' : C.panel, border: `1px solid ${myRank ? 'rgba(22,163,74,0.3)' : C.border2}`, color: myRank ? '#16a34a' : C.muted, fontFamily: C.mono, fontWeight: 700, fontSize: 12, padding: '10px', borderRadius: 8, cursor: 'pointer' }}
              >
                <BarChart2 size={14} />
                My Stats
              </button>
            </div>}

            {/* Cara ikut */}
            <div style={{ background: 'linear-gradient(135deg,var(--mr-tint-green3),var(--mr-bg))', border: `1px solid var(--mr-tint-green-b)`, borderRadius: 14, padding: '20px 20px' }}>
              <div style={{ fontFamily: C.mono, color: C.up, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// CARA IKUT KOMPETISI</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>
                Kamu <strong>otomatis masuk</strong> leaderboard saat mengisi jurnal trading selama periode kompetisi.
                <br /><br />
                Tidak perlu daftar manual. Semakin konsisten journaling, semakin tinggi peluang kamu.
              </div>
              <button
                onClick={() => onGoToJurnal ? onGoToJurnal() : window.location.href = '/member'}
                style={{ marginTop: 14, width: '100%', background: C.up, color: '#fff', fontFamily: C.mono, fontWeight: 700, fontSize: 12, padding: '11px', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                BUKA JURNAL ▸
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal info */}
      {modal && <Modal title={modal.title} content={modal.content} onClose={() => setModal(null)} />}

      {/* My Stats Modal — untuk member yang login */}
      {comp && (
        <MyStatsModal
          isOpen={showMyStats}
          onClose={() => setShowMyStats(false)}
          memberId={memberId ?? ''}
          memberName={session?.nama ?? 'Member'}
          memberRank={myRank}
          competition={comp}
        />
      )}

      {/* Trader Stats Modal — untuk trader yang diklik di leaderboard */}
      {comp && viewEntry && (
        <MyStatsModal
          isOpen={!!viewEntry}
          onClose={() => setViewEntry(null)}
          memberId={viewEntry.memberId}
          memberName={viewEntry.nama}
          memberRank={viewEntry.rank}
          competition={comp}
        />
      )}
    </div>
  );
}
