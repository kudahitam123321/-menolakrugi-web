import React, { useEffect, useRef, useState } from 'react';

interface Props {
  endsAtIso: string;
  compact?: boolean; // ukuran lebih kecil untuk mobile
}

interface TimeLeft {
  days: number; hours: number; minutes: number; seconds: number; expired: boolean;
}

function calc(endsAtMs: number): TimeLeft {
  const diff = endsAtMs - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: false,
  };
}

export default function CompetitionCountdown({ endsAtIso, compact = false }: Props) {
  // simpan ms sekali — tidak berubah selama prop ISO-nya sama
  const endsAtMs = useRef(new Date(endsAtIso).getTime());
  useEffect(() => { endsAtMs.current = new Date(endsAtIso).getTime(); }, [endsAtIso]);

  const [t, setT] = useState<TimeLeft>(() => calc(endsAtMs.current));

  useEffect(() => {
    // update setiap detik
    const id = setInterval(() => setT(calc(endsAtMs.current)), 1000);
    return () => clearInterval(id);
  }, []); // tidak perlu dependency — mengacu ref yang selalu fresh

  if (t.expired) {
    return (
      <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 13, color: 'var(--mr-dim)', padding: '10px 0' }}>
        Kompetisi Telah Berakhir
      </div>
    );
  }

  const boxes = [
    { v: t.days,    label: 'HARI'  },
    { v: t.hours,   label: 'JAM'   },
    { v: t.minutes, label: 'MENIT' },
    { v: t.seconds, label: 'DETIK' },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      {boxes.map((b, i) => (
        <React.Fragment key={b.label}>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{
              background: 'var(--mr-panel)',
              border: '1px solid var(--mr-border2)',
              borderRadius: 8,
              padding: compact ? '7px 10px' : '10px 14px',
              minWidth: compact ? 40 : 52,
              fontFamily: '"Geist Mono",monospace',
              fontSize: compact ? 20 : 26,
              fontWeight: 700,
              letterSpacing: -1,
              color: 'var(--mr-text)',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'center' as const,
            }}>
              {String(b.v).padStart(2, '0')}
            </div>
            <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 9, color: 'var(--mr-dim)', marginTop: 4, letterSpacing: 1 }}>
              {b.label}
            </div>
          </div>
          {i < boxes.length - 1 && (
            <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 20, color: 'var(--mr-dim)', marginBottom: 18, lineHeight: 1 }}>:</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
