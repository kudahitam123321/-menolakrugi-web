// components/IndikatorPerbandingan.tsx — Kartu data backtest dan tabel perbandingan indikator lama vs v5.
// Dipakai di /pricing-indikator dan tab Produk dashboard (embedded = tanpa padding/latar halaman).
import React from 'react';
import { useBacktestConfig } from '../hooks';

const LP = {
  bg: 'var(--lp-bg)', surface: 'var(--lp-surface)', text: 'var(--lp-text)', muted: 'var(--lp-muted)', border: 'var(--lp-border)',
  primary: 'var(--lp-primary)', primaryTint: 'var(--lp-primary-tint)',
  mono: '"Geist Mono",monospace',
  radius: 16, shadowSm: '0 1px 3px rgba(0,0,0,0.06)', shadowMd: '0 8px 24px rgba(0,0,0,0.08)',
};

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return isMobile;
}

/** 'SMC by MenolakRugi v4.2' → 'v4.2'; tanpa nomor versi → nama apa adanya. */
export function versiDari(nama: string): string {
  return nama.match(/v\d+(\.\d+)*/i)?.[0] ?? nama;
}

/** Kartu "Data Backtest Indikator v5" + tombol ke /backtest-indikator; tampil selama backtest_config.tampil = true. */
export function RiwayatDataCard({ embedded = false }: { embedded?: boolean }) {
  const { config } = useBacktestConfig();
  const isMobile = useIsMobile();
  if (!config) return null;

  return (
    <section style={embedded ? {} : { background: LP.bg, padding: isMobile ? '0 20px 48px' : '0 40px 72px' }}>
      <div style={{
        maxWidth: embedded ? 'none' : 900, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' as const : 'row' as const,
        alignItems: isMobile ? 'flex-start' : 'center', gap: 18, borderRadius: LP.radius, padding: '20px 22px',
        background: 'linear-gradient(90deg,#0B1220,#13203a)', color: '#fff', boxShadow: LP.shadowMd,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(74,222,128,.15)', color: '#4ade80', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Data Backtest Indikator v5</span>
            <span style={{ background: '#4ade80', color: '#052e16', fontSize: 10, fontWeight: 700, letterSpacing: 0.6, padding: '2px 8px', borderRadius: 20, fontFamily: LP.mono }}>KHUSUS v5</span>
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, lineHeight: 1.5 }}>
            Hasil riset backtest <b style={{ color: '#E2E8F0' }}>SMC by MenolakRugi v5</b> di XAUUSD M5 — semua parameter v5 dikunci dari data ini. Lihat sendiri daftar trade, win rate, dan hasilnya.
          </div>
        </div>
        <a href="/backtest-indikator" target={embedded ? '_blank' : undefined} rel="noopener" style={{
          background: '#4ade80', color: '#052e16', fontWeight: 700, fontSize: 14, padding: '12px 18px', borderRadius: 10,
          textDecoration: 'none', whiteSpace: 'nowrap' as const, alignSelf: isMobile ? 'stretch' : 'auto', textAlign: 'center' as const,
        }}>
          Lihat Data Backtest v5 →
        </a>
      </div>
    </section>
  );
}

// Perbandingan indikator lama vs v5 — tampil di antara blok v5 dan blok v4.2.
const PERBANDINGAN: { fitur: string; lama: string | boolean; baru: string | boolean }[] = [
  { fitur: 'Pair & timeframe', lama: 'Bebas pair & timeframe', baru: 'Khusus XAUUSD M5' },
  { fitur: 'Cara pakai', lama: 'Manual — top-down analysis sendiri, lalu tentukan entry', baru: 'Sederhana — tinggal ikuti label entry yang muncul' },
  { fitur: 'Market structure (VH/VL, BOS/CHoCH) + Fibonacci', lama: true, baru: true },
  { fitur: 'Internal structure (IS01 / IS02)', lama: true, baru: false },
  { fitur: 'POI Order Block & FVG di chart', lama: true, baru: false },
  { fitur: 'Zona entry Fibonacci + kotak TP/SL', lama: true, baru: true },
  { fitur: '3 setup otomatis (Follow Trend, Counter Trend, SCOB POI)', lama: false, baru: true },
  { fitur: 'Label order siap pasang (LIMIT · SL · TP, jam WITA)', lama: false, baru: true },
  { fitur: 'Kalkulator lot otomatis', lama: false, baru: true },
  { fitur: 'Alarm ke HP (limit dipasang, terisi, digeser, batal)', lama: false, baru: true },
  { fitur: 'Data backtest bisa dilihat', lama: false, baru: true },
  { fitur: 'Cocok untuk', lama: 'Yang mau belajar membaca SMC & analisa sendiri', baru: 'Yang mau eksekusi disiplin tanpa analisa panjang' },
];

export function TabelPerbandingan({ namaLama, namaBaru, embedded = false }: { namaLama: string; namaBaru: string; embedded?: boolean }) {
  const isMobile = useIsMobile();
  const sel = (v: string | boolean, baru: boolean) =>
    typeof v === 'string'
      ? <span style={{ color: baru ? LP.text : LP.muted, fontWeight: baru ? 600 : 400 }}>{v}</span>
      : v
        ? <span style={{ color: LP.primary, fontWeight: 800, fontSize: 16 }}>✓</span>
        : <span style={{ color: LP.border, fontWeight: 700 }}>—</span>;
  const kolom = isMobile ? 'minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr)';
  return (
    <section style={embedded ? {} : { background: LP.bg, padding: isMobile ? '8px 20px 40px' : '8px 40px 56px' }}>
      <div style={{ maxWidth: embedded ? 'none' : 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 20 }}>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, letterSpacing: 0.8 }}>// PERBANDINGAN</div>
          <h2 style={{ fontSize: isMobile ? 22 : 30, letterSpacing: -0.8, fontWeight: 800, color: LP.text, margin: '10px 0 0' }}>Pilih yang Cocok Buatmu</h2>
        </div>
        <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: LP.radius, overflow: 'hidden', boxShadow: LP.shadowSm, fontSize: isMobile ? 12 : 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: kolom, background: LP.bg, borderBottom: `1px solid ${LP.border}` }}>
            <div style={{ padding: isMobile ? '12px 10px' : '14px 18px' }} />
            <div style={{ padding: isMobile ? '12px 10px' : '14px 18px', fontWeight: 700, color: LP.muted, textAlign: 'center' as const }}>{namaLama}</div>
            <div style={{ padding: isMobile ? '12px 10px' : '14px 18px', fontWeight: 800, color: LP.primary, textAlign: 'center' as const, background: LP.primaryTint }}>{namaBaru}</div>
          </div>
          {PERBANDINGAN.map((r, i) => (
            <div key={r.fitur} style={{ display: 'grid', gridTemplateColumns: kolom, borderTop: i ? `1px solid ${LP.border}` : 'none', alignItems: 'stretch' }}>
              <div style={{ padding: isMobile ? '11px 10px' : '13px 18px', color: LP.text, fontWeight: 600, lineHeight: 1.4 }}>{r.fitur}</div>
              <div style={{ padding: isMobile ? '11px 10px' : '13px 18px', textAlign: 'center' as const, lineHeight: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{sel(r.lama, false)}</div>
              <div style={{ padding: isMobile ? '11px 10px' : '13px 18px', textAlign: 'center' as const, lineHeight: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(22,163,74,.05)' }}>{sel(r.baru, true)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
