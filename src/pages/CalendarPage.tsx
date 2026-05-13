import { useEffect, useRef, memo } from 'react';

const C = {
  bg: '#080808', border: '#1a1a1a', border2: '#222', gold: '#eab308',
  text: '#e7e5e4', dim: '#555', muted: '#888', up: '#22ab94', down: '#ef4444',
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};

// ── Widget persis dari TradingView ────────────────────────
const TradingViewWidget = memo(function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = `{
      "colorTheme": "dark",
      "isTransparent": false,
      "locale": "id",
      "countryFilter": "us,eu,gb",
      "importanceFilter": "0,1",
      "width": "100%",
      "height": "100%"
    }`;
    container.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ width: '100%', height: '100%' }}>
      <div className="tradingview-widget-container__widget" style={{ width: '100%', height: 'calc(100% - 24px)' }} />
      <div className="tradingview-widget-copyright" style={{ fontFamily: C.mono, fontSize: 10, color: C.dim, padding: '4px 0', textAlign: 'right' as const }}>
        <a href="https://id.tradingview.com/economic-calendar/" rel="noopener nofollow" target="_blank" style={{ color: C.dim, textDecoration: 'none' }}>
          Track all markets on TradingView
        </a>
      </div>
    </div>
  );
});

// ── Halaman Kalender ──────────────────────────────────────
export default function CalendarPage() {
  return (
    <div style={{ fontFamily: C.sans, background: C.bg, minHeight: '100vh', color: C.text }}>

      {/* Navbar */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, background: '#060606', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: C.gold, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#000' }}>MR</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text, letterSpacing: 0.5 }}>MENOLAK RUGI</div>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, letterSpacing: 1 }}>SMC EDUCATION</div>
            </div>
          </a>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { l: 'KELAS',       href: '/#kelas' },
              { l: 'KURIKULUM',   href: '/#kurikulum' },
              { l: 'KOMUNITAS',   href: '/https://discord.gg/d2Tpf6sGMr' },
              { l: 'PARTNERSHIP', href: '/partnership' },
              { l: 'KALENDER',    href: '/calendar', active: true },
            ].map((item: any) => (
              <a key={item.l} href={item.href}
                style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, padding: '6px 14px', color: item.active ? '#000' : C.dim, textDecoration: 'none', background: item.active ? C.gold : 'transparent', transition: 'color .15s' }}>
                {item.l}
              </a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.location.href = '/login'}
            style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, padding: '7px 16px', background: 'transparent', border: `1px solid ${C.border2}`, color: C.dim, cursor: 'pointer' }}>
            LOG IN
          </button>
          <button onClick={() => window.location.href = '/signup'}
            style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, padding: '7px 16px', background: C.gold, border: 'none', color: '#000', cursor: 'pointer' }}>
            BUKA AKUN ▸
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, letterSpacing: 1.5, marginBottom: 6 }}>// ECONOMIC CALENDAR</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Kalender Ekonomi</h1>
            <p style={{ color: C.dim, fontSize: 13, margin: '6px 0 0', fontFamily: C.mono }}>
              Pantau rilis data penting — NFP, CPI, FOMC, dan lainnya.
            </p>
          </div>
          <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, textAlign: 'right' as const }}>
            <div style={{ color: C.gold, marginBottom: 2 }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase()}
            </div>
            <div>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, alignItems: 'center', fontFamily: C.mono, fontSize: 11 }}>
          <span style={{ color: '#444' }}>FILTER AKTIF:</span>
          <span style={{ color: C.down }}>● HIGH IMPACT</span>
          <span style={{ color: C.gold }}>● MEDIUM IMPACT</span>
          <span style={{ marginLeft: 'auto', color: '#444' }}>Negara: US · EU · GB</span>
        </div>

        {/* Widget box */}
        <div style={{ background: '#050505', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {/* Terminal header */}
          <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: C.mono, color: C.gold, fontSize: 11, letterSpacing: 1 }}>// EVENTS · REALTIME</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.up, display: 'inline-block' }} />
            </div>
            <span style={{ fontFamily: C.mono, color: '#333', fontSize: 10 }}>TRADINGVIEW DATA FEED</span>
          </div>
          {/* Widget */}
          <div style={{ height: 680 }}>
            <TradingViewWidget />
          </div>
        </div>

        {/* Tips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 20 }}>
          {[
            { icon: '🔴', title: 'HIGH IMPACT', desc: 'NFP, CPI, FOMC Rate Decision — volatilitas tinggi. Hindari open posisi 15 menit sebelum rilis.' },
            { icon: '🟡', title: 'MEDIUM IMPACT', desc: 'GDP, Retail Sales, PMI — dampak sedang. Perhatikan struktur setelah data keluar.' },
            { icon: '📐', title: 'SMC APPROACH', desc: 'Tunggu market bereaksi dulu. Baca struktur setelah rilis, bukan tebak arah sebelumnya.' },
          ].map((tip, i) => (
            <div key={i} style={{ background: '#0a0a0a', border: `1px solid ${C.border}`, padding: '16px 18px' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{tip.icon}</div>
              <div style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>{tip.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{tip.desc}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 40, paddingTop: 18, display: 'flex', justifyContent: 'space-between', fontFamily: C.mono, fontSize: 10, color: '#333' }}>
          <span>© 2024 Menolak Rugi · SMC Education</span>
          <span>Data kalender disediakan oleh TradingView</span>
        </div>
      </div>
    </div>
  );
}
