// pages/member/CurriculumPage.tsx — Halaman kurikulum / daftar video (Direction A)

import React, { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';
import { trackVideoWatch } from '../../hooks/useWatchHistory';
import { MR } from '../../lib/theme';
import { Ticker } from '../../components/mr';
import type { Member, Video } from '../../types/mr.types';

type Filter = 'semua' | 'belum' | 'progres' | 'selesai';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(secs?: number) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Simulasi progress (ganti dengan data real dari tabel user_video_progress)
function getProgress(videoId: string): number {
  const seed = videoId.charCodeAt(0) % 3;
  return [0, 42, 100][seed] ?? 0;
}

// ─── Video card ───────────────────────────────────────────────────────────────

function VideoCard({ video, idx }: { video: Video; idx: number }) {
  const prog = getProgress(video.id);
  const statusLabel = prog === 100 ? 'SELESAI' : prog > 0 ? `LANJUT · ${prog}%` : 'MULAI';
  const statusColor = prog === 100 ? MR.up : prog > 0 ? MR.gold : MR.dim;

  return (
    <div style={{ border: `1px solid ${MR.border}`, background: MR.panel, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'border-color .15s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = MR.gold)}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = MR.border)}>
      {/* Thumbnail / candle preview */}
      <div style={{ position: 'relative', background: MR.darker, height: 160, overflow: 'hidden' }}>
        {video.thumbnail_url
          ? <img src={video.thumbnail_url} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              {/* Mini candle art */}
              <svg viewBox="0 0 120 60" width="120" height="60">
                {[8, 16, 12, 20, 14, 22, 10, 18, 24, 16].map((h, i) => {
                  const x = 6 + i * 11;
                  const up = i % 3 !== 1;
                  return (
                    <g key={i}>
                      <line x1={x + 4} x2={x + 4} y1={30 - h} y2={30 + h * 0.3} stroke={up ? '#10b981' : '#ef4444'} strokeWidth="0.8" />
                      <rect x={x} y={up ? 30 - h + 4 : 30 - 4} width="8" height={h - 4} fill={up ? '#10b981' : '#ef4444'} />
                    </g>
                  );
                })}
                <line x1={0} x2={120} y1={38} y2={30} stroke="#eab308" strokeDasharray="3 2" strokeWidth="0.8" opacity="0.6" />
              </svg>
            </div>
          )
        }
        <div style={{ position: 'absolute', top: 8, right: 8, fontFamily: MR.mono, fontSize: 10, color: MR.dim, background: 'rgba(0,0,0,.7)', padding: '3px 6px' }}>
          XAUUSD · {fmtDuration(video.duration_seconds)}
        </div>
        {prog === 100 && (
          <div style={{ position: 'absolute', top: 8, left: 8, fontFamily: MR.mono, fontSize: 10, color: MR.up, background: 'rgba(0,0,0,.7)', padding: '3px 6px' }}>✓ SELESAI</div>
        )}
        {/* Play button */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <a
            href={video.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              const stored = localStorage.getItem('mr_member');
              if (!stored) return;

              const member = JSON.parse(stored);

              trackVideoWatch(member.id, video.id);
            }}
            style={{
              width: 44,
              height: 44,
              background: MR.gold,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              textDecoration: 'none',
              color: '#000'
            }}
          >
            ▶
          </a>
        </div>
        {/* Progress bar */}
        {prog > 0 && prog < 100 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: MR.border }}>
            <div style={{ width: `${prog}%`, height: '100%', background: MR.gold }} />
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px', flex: 1 }}>
        <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.6, marginBottom: 6 }}>
          {video.category.toUpperCase()} · {String(idx + 1).padStart(2, '0')}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.3, marginBottom: 6 }}>{video.title}</div>
        {video.description && (
          <div style={{ fontSize: 12, color: MR.dim, lineHeight: 1.5 }}>{video.description}</div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${MR.border}`, padding: '10px 16px', fontFamily: MR.mono, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
        <span style={{ color: statusColor }}>{statusLabel}</span>
        <span style={{ color: MR.dimmer }}>▸</span>
      </div>
    </div>
  );
}

// ─── Category sidebar ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'intro',    label: 'Intro',          icon: '□' },
  { id: 'basic',    label: 'Basic',          icon: '■' },
  { id: 'tips_basic', label: 'Tips Basic',   icon: '+' },
  { id: 'advanced', label: 'Advanced',       icon: '◆' },
  { id: 'tips_advanced', label: 'Tips Advanced', icon: '+' },
  { id: 'file_basic', label: 'File Basic',    icon: '▣' },
  { id: 'file_advanced', label: 'File Advanced', icon: '▣' },
  { id: 'status_trading', label: 'Status Trading', icon: '▲' },
  { id: 'komunitas', label: 'Komunitas',     icon: '○' },
  { id: 'funded_broker', label: 'Funded Broker', icon: 'B' },
  { id: 'ulasan',   label: 'Tulis Ulasan',  icon: '★' },
  { id: 'sertifikat', label: 'Sertifikat', icon: '✓' },
  { id: 'password', label: 'Password',     icon: '⊠' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CurriculumPage() {
  const [member,   setMember]   = useState<Member | null>(null);
  const [videos,   setVideos]   = useState<Video[]>([]);
  const [category, setCategory] = useState('basic');
  const [filter,   setFilter]   = useState<Filter>('semua');
  const [loading,  setLoading]  = useState(true);

  async function markProgress(videoId: string, status: 'mulai' | 'selesai') {
    const stored = localStorage.getItem('mr_member');
    if (!stored) return;
    const m = JSON.parse(stored);
    await supabase.from('member_progress').upsert({
      member_id: m.id, video_id: videoId, status,
      ...(status === 'selesai' ? { completed_at: new Date().toISOString() } : {}),
      watched_at: new Date().toISOString(),
    }, { onConflict: 'member_id,video_id' });
    setProgress(prev => ({ ...prev, [videoId]: status }));
  }

  useEffect(() => {
    const stored = localStorage.getItem('mr_member');
    if (!stored) { window.location.href = '/login'; return; }
    try {
      const m = JSON.parse(stored) as Member;
      setMember(m);
      // Load progress
      supabase.from('member_progress')
        .select('video_id, status')
        .eq('member_id', m.id)
        .then(({ data }) => {
          if (data) {
            const map: Record<string,string> = {};
            data.forEach((p: any) => { map[p.video_id] = p.status; });
            setProgress(map);
          }
        }).catch(() => {});
    } catch {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    if (!member) return;
    setLoading(true);
    supabase
      .from('videos')
      .select('*')
      .eq('category', category)
      .contains('tier_access', [member.tier])
      .order('sort_order')
      .then(({ data }) => {
        setVideos((data ?? []) as Video[]);
        setLoading(false);
      });
  }, [category, member]);

  const currentCat  = CATEGORIES.find(c => c.id === category);
  const filtVideos  = videos; // TODO: filter by progress when user_video_progress table exists

  const totalDuration = videos.reduce((acc, v) => acc + (v.duration_seconds ?? 0), 0);
  const lastUpdate    = videos.reduce((acc, v) => v.created_at > acc ? v.created_at : acc, '');

  return (
    <div style={{ fontFamily: MR.sans, color: MR.text, background: MR.bg, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Ticker />

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${MR.border}`, padding: '12px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: MR.bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 800, letterSpacing: -0.3, fontSize: 14 }}>MENOLAK RUGI</span>
          <span style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, marginLeft: 8, paddingLeft: 10, borderLeft: `1px solid ${MR.border}` }}>
            RUANG MEMBER · {member?.tier.toUpperCase()}
          </span>
        </div>
        {member && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontFamily: MR.mono, fontSize: 11, color: MR.dim }}>{member.nama.split(' ')[0]} · @{member.discord_username ?? 'discord'}</span>
            <span style={{ fontFamily: MR.mono, fontSize: 10, border: `1px solid ${MR.gold}`, color: MR.gold, padding: '3px 8px' }}>{member.tier.toUpperCase()}</span>
            <div style={{ width: 28, height: 28, background: MR.gold, color: '#181000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
              {member.nama.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Category sidebar */}
        <aside style={{ background: '#040404', borderRight: `1px solid ${MR.border}`, padding: '20px 0', overflowY: 'auto' }}>
          <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, padding: '0 16px', marginBottom: 12 }}>// MENU MEMBER</div>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 16px', background: cat.id === category ? MR.panel : 'transparent', borderLeft: cat.id === category ? `2px solid ${MR.gold}` : '2px solid transparent', border: 'none', color: cat.id === category ? MR.text : MR.dim, cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>
              <span style={{ fontFamily: MR.mono, fontSize: 11, color: cat.id === category ? MR.gold : MR.dimmer, width: 14 }}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}

          {/* Progress overall */}
          <div style={{ margin: '16px 16px 0', padding: '14px', border: `1px solid ${MR.border}`, background: MR.panel }}>
            <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.6, marginBottom: 6 }}>// PROGRES OVERALL</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: MR.gold }}>52%</div>
            <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 10, marginTop: 4 }}>04 / 08 MODUL · STREAK 12 HARI</div>
          </div>
        </aside>

        {/* Main — video grid */}
        <main style={{ overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ padding: '28px 28px 16px', borderBottom: `1px solid ${MR.border}` }}>
            <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.6, marginBottom: 6 }}>// MODUL · {category.toUpperCase()}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, margin: 0 }}>
                {currentCat?.label} <span style={{ color: MR.dim }}>— Materi dasar SMC.</span>
              </h1>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['semua', 'belum', 'progres', 'selesai'] as Filter[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: MR.mono, fontSize: 11, padding: '7px 14px', border: `1px solid ${f === filter ? MR.gold : MR.border}`, color: f === filter ? MR.gold : MR.dim, background: f === filter ? '#0e0c04' : 'transparent', cursor: 'pointer', letterSpacing: 0.4 }}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 11, marginTop: 8 }}>
              {videos.length} VIDEO · {fmtDuration(totalDuration)} · UPDATE TERAKHIR {lastUpdate ? new Date(lastUpdate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }).toUpperCase() : '—'}
            </div>
          </div>

          {/* Grid */}
          <div style={{ padding: 24 }}>
            {loading && (
              <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 12, textAlign: 'center', paddingTop: 48 }}>MEMUAT VIDEO...</div>
            )}
            {!loading && filtVideos.length === 0 && (
              <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 12, textAlign: 'center', paddingTop: 48 }}>Belum ada video di kategori ini.</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {filtVideos.map((v, i) => (
                <VideoCard key={v.id} video={v} idx={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
