import { supabase } from '../lib/supabase';

type DbVideo = {
  id: string;
  judul: string | null;
  deskripsi?: string | null;
  youtube_url?: string | null;
  kategori?: string | null;
  tier_akses?: string[] | null;
  level?: string | null;
  urutan?: number | null;
  created_at?: string | null;
};

export type LanjutkanVideo = {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string | null;
  thumbnailUrl: string | null;
  category: string;
  tierAccess: string[];
  level: string | null;
  order: number;
};

export type WatchedVideo = {
  video_id: string;
  watched_at: string;
  video: LanjutkanVideo;
};

const VIDEO_SELECT = 'id, judul, deskripsi, youtube_url, kategori, tier_akses, level, urutan, created_at';

function getYoutubeId(url?: string | null) {
  if (!url) return null;
  return url.match(/(?:youtu\.be\/|v=|embed\/)([^&?/\s]+)/)?.[1] ?? null;
}

function normalizeVideo(row: DbVideo): LanjutkanVideo {
  const youtubeId = getYoutubeId(row.youtube_url);

  return {
    id: row.id,
    title: row.judul ?? 'Tanpa judul',
    description: row.deskripsi ?? null,
    youtubeUrl: row.youtube_url ?? null,
    thumbnailUrl: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null,
    category: row.kategori ?? 'materi',
    tierAccess: row.tier_akses ?? [],
    level: row.level ?? null,
    order: row.urutan ?? 0,
  };
}

export async function trackVideoWatch(memberId: string, videoId: string) {
  if (!memberId || !videoId) return;

  const { error } = await supabase
    .from('watch_history')
    .upsert(
      {
        member_id: memberId,
        video_id: videoId,
        watched_at: new Date().toISOString(),
      },
      { onConflict: 'member_id,video_id' }
    );

  if (error) {
    console.error('[WatchHistory] Gagal menyimpan history:', error.message);
  }
}

export async function fetchLastWatched(memberId: string, limit = 4): Promise<WatchedVideo[]> {
  if (!memberId) return [];

  const { data: history, error: historyError } = await supabase
    .from('watch_history')
    .select('video_id, watched_at')
    .eq('member_id', memberId)
    .order('watched_at', { ascending: false })
    .limit(limit);

  if (historyError) {
    console.error('[WatchHistory] Gagal mengambil history:', historyError.message);
    return [];
  }

  const videoIds = (history ?? []).map((item) => item.video_id).filter(Boolean);
  if (videoIds.length === 0) return [];

  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select(VIDEO_SELECT)
    .in('id', videoIds);

  if (videosError) {
    console.error('[WatchHistory] Gagal mengambil detail video:', videosError.message);
    return [];
  }

  const videoById = new Map((videos ?? []).map((video: DbVideo) => [video.id, normalizeVideo(video)]));

  return (history ?? [])
    .map((item) => {
      const video = videoById.get(item.video_id);
      if (!video) return null;

      return {
        video_id: item.video_id,
        watched_at: item.watched_at,
        video,
      };
    })
    .filter(Boolean) as WatchedVideo[];
}

export async function fetchLatestVideos(memberTier: string, limit = 4): Promise<LanjutkanVideo[]> {
  const tier = memberTier || 'SMC Trial';

  const filtered = await supabase
    .from('videos')
    .select(VIDEO_SELECT)
    .contains('tier_akses', [tier])
    .order('urutan', { ascending: true })
    .limit(limit);

  if (!filtered.error && filtered.data && filtered.data.length > 0) {
    return filtered.data.map((row: DbVideo) => normalizeVideo(row));
  }

  const fallback = await supabase
    .from('videos')
    .select(VIDEO_SELECT)
    .order('urutan', { ascending: true })
    .limit(limit);

  if (fallback.error) {
    console.error('[WatchHistory] Gagal mengambil video fallback:', fallback.error.message);
    return [];
  }

  return (fallback.data ?? []).map((row: DbVideo) => normalizeVideo(row));
}

