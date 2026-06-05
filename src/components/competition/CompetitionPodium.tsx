import { LeaderboardEntry } from './LeaderboardTable';

interface Props {
  top3: LeaderboardEntry[];
  currentMemberId: string | null;
  isMobile?: boolean;
}

// Konfigurasi per rank
const RANK_CFG = {
  1: {
    avatarSize: 80,
    iconSize:   40,
    border:     '3px solid #F5A623',
    shadow:     '0 0 24px rgba(245,166,35,0.45)',
    badgeColor: '#F5A623',
    badgeImg:   '/rank_1.png',
    badgeSize:  44,
    elevated:   true,
    rankColor:  '#F5A623',
    gainSize:   15,
    nameSize:   15,
  },
  2: {
    avatarSize: 64,
    iconSize:   32,
    border:     '3px solid #C0C0C0',
    shadow:     '0 0 16px rgba(192,192,192,0.3)',
    badgeColor: '#C0C0C0',
    badgeImg:   '/rank_2.png',
    badgeSize:  36,
    elevated:   false,
    rankColor:  '#C0C0C0',
    gainSize:   13,
    nameSize:   13,
  },
  3: {
    avatarSize: 64,
    iconSize:   32,
    border:     '3px solid #A0A0A0',
    shadow:     '0 0 16px rgba(160,160,160,0.25)',
    badgeColor: '#A0A0A0',
    badgeImg:   '/rank_3.png',
    badgeSize:  36,
    elevated:   false,
    rankColor:  '#A0A0A0',
    gainSize:   13,
    nameSize:   13,
  },
} as const;

function PodiumSlot({
  entry,
  rank,
  isMe,
  isMobile,
}: {
  entry: LeaderboardEntry | null;
  rank: 1 | 2 | 3;
  isMe: boolean;
  isMobile: boolean;
}) {
  const cfg  = RANK_CFG[rank];
  const size = isMobile ? Math.round(cfg.avatarSize * 0.82) : cfg.avatarSize;
  const nama = entry ? entry.nama.split(' ')[0] : '---';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', gap: 6,
      marginBottom: cfg.elevated ? (isMobile ? 28 : 36) : 0,
      minWidth: isMobile ? 72 : 90,
    }}>
      {/* Logo peringkat sebagai gambar utama */}
      <img
        src={cfg.badgeImg}
        alt={`rank-${rank}`}
        style={{
          width:  size,
          height: size,
          objectFit: 'contain',
          opacity: entry ? 1 : 0.25,
          filter: entry ? `drop-shadow(0 0 10px ${cfg.badgeColor}88)` : 'none',
        }}
      />

      {/* KAMU badge */}
      {isMe && (
        <span style={{
          fontFamily: '"Geist Mono",monospace',
          fontSize: 8, fontWeight: 800, letterSpacing: 1,
          color: cfg.rankColor,
          background: `${cfg.rankColor}22`,
          border: `1px solid ${cfg.rankColor}66`,
          padding: '2px 7px', borderRadius: 10,
        }}>
          KAMU
        </span>
      )}

      {/* Nama */}
      <div style={{
        fontWeight: 700, fontSize: isMobile ? cfg.nameSize - 1 : cfg.nameSize,
        color: 'var(--mr-text)', textAlign: 'center' as const,
        maxWidth: isMobile ? 70 : 88,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
      }}>
        {nama}
      </div>

      {/* Nomor peringkat */}
      <span style={{
        fontFamily: '"Geist Mono",monospace',
        fontSize: 11, fontWeight: 700, color: cfg.rankColor,
      }}>
        #{rank}
      </span>
    </div>
  );
}

export default function CompetitionPodium({ top3, currentMemberId, isMobile = false }: Props) {
  // Selalu 3 slot, isi null jika kurang dari 3
  const slots: (LeaderboardEntry | null)[] = [
    top3[1] ?? null,  // kiri  → rank 2
    top3[0] ?? null,  // tengah → rank 1
    top3[2] ?? null,  // kanan  → rank 3
  ];
  const ranks: (1 | 2 | 3)[] = [2, 1, 3];

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      gap: isMobile ? 8 : 16,
    }}>
      {slots.map((entry, i) => (
        <PodiumSlot
          key={ranks[i]}
          entry={entry}
          rank={ranks[i]}
          isMe={!!entry && entry.memberId === currentMemberId}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}
