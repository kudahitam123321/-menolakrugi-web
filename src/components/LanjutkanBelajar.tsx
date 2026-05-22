import { useEffect, useState } from 'react';
import {
  fetchLastWatched,
  fetchLatestVideos,
  trackVideoWatch,
  type LanjutkanVideo,
} from '../hooks/useWatchHistory';

const C = {
  panel: 'var(--mr-panel)',
  border: 'var(--mr-border)',
  border2: 'var(--mr-border2)',
  text: 'var(--mr-text)',
  dim: 'var(--mr-muted)',
  dimmer: 'var(--mr-dim)',
  gold: 'var(--mr-gold)',
  mono: '"Geist Mono", monospace',
};

type Props = {
  memberId: string;
  memberTier: string;
};

export default function LanjutkanBelajar({ memberId, memberTier }: Props) {
  const [videos, setVideos] = useState<LanjutkanVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!memberId) return;

      setLoading(true);
      const history = await fetchLastWatched(memberId, 4);

      if (cancelled) return;

      if (history.length > 0) {
        setHasHistory(true);
        setVideos(history.map((item) => item.video));
      } else {
        setHasHistory(false);
        setVideos(await fetchLatestVideos(memberTier, 4));
      }

      if (!cancelled) setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [memberId, memberTier]);

  async function openVideo(video: LanjutkanVideo) {
    await trackVideoWatch(memberId, video.id);
    if (video.youtubeUrl) {
      window.open(video.youtubeUrl, '_blank', 'noopener,noreferrer');
    }
  }

  if (loading) {
    return (
      <section style={{ marginTop: 18, marginBottom: 16 }}>
        <div style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>
          // MEMUAT LANJUTKAN BELAJAR
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: window.innerWidth < 768 ? 10 : 14 }}>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} style={{ height: window.innerWidth < 768 ? 130 : 160, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12 }} />
          ))}
        </div>
      </section>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section style={{ marginTop: 18, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, letterSpacing: 1, marginBottom: 5 }}>
            // {hasHistory ? 'LANJUTKAN BELAJAR' : 'MULAI BELAJAR'}
          </div>
          <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>
            {hasHistory ? 'Lanjutkan Belajar' : 'Mulai Belajar'}
          </h2>
        </div>
        <button
          onClick={() => {
            window.location.href = '/member';
          }}
          style={{
            fontFamily: C.mono,
            fontSize: 11,
            color: C.gold,
            background: 'transparent',
            border: `1px solid #3a2e00`,
            padding: '6px 12px',
            cursor: 'pointer',
            borderRadius: 6,
          }}
        >
          LIHAT SEMUA
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: window.innerWidth < 768 ? 10 : 14 }}>
        {videos.map((video) => (
          <button
            key={video.id}
            onClick={() => openVideo(video)}
            style={{
              display: 'block',
              textAlign: 'left',
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              overflow: 'hidden',
              padding: 0,
              cursor: video.youtubeUrl ? 'pointer' : 'default',
              color: C.text,
            }}
          >
            <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#070707' }}>
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dimmer, fontFamily: C.mono }}>
                  VIDEO
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 38, height: 38, borderRadius: 999, background: C.gold, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  ▶
                </span>
              </div>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontFamily: C.mono, color: C.dimmer, fontSize: 10, letterSpacing: 0.7, marginBottom: 6 }}>
                {video.category.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35, minHeight: 36 }}>
                {video.title}
              </div>
              <div style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, marginTop: 8 }}>
                {video.youtubeUrl ? 'TONTON' : 'SEGERA'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

