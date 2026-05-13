// components/mr/index.tsx — Shared atomic components untuk Direction A (Terminal)
// Import dari sini di semua halaman: import { MRLogo, Ticker, CandleChart, StatusBar } from '../components/mr'

import React, { useEffect, useMemo, useState } from 'react';
import { MR } from '../../lib/theme';
import type { TickerPair } from '../../types/mr.types';

// ─── Data default ticker ──────────────────────────────────────────────────────

const DEFAULT_PAIRS: TickerPair[] = [
  { symbol: 'EURUSD',  price: '1.1248',   change: '+0.18%', up: true  },
  { symbol: 'GBPUSD',  price: '1.3284',   change: '+0.22%', up: true  },
  { symbol: 'USDJPY',  price: '145.62',   change: '-0.31%', up: false },
  { symbol: 'XAUUSD',  price: '3,328.40', change: '+0.54%', up: true  },
  { symbol: 'GBPJPY',  price: '193.74',   change: '-0.09%', up: false },
  { symbol: 'AUDUSD',  price: '0.6441',   change: '+0.11%', up: true  },
  { symbol: 'BTCUSD',  price: '103,240',  change: '+1.24%', up: true  },
  { symbol: 'USDCAD',  price: '1.3921',   change: '+0.08%', up: true  },
  { symbol: 'NAS100',  price: '21,318',   change: '+0.67%', up: true  },
  { symbol: 'USDIDR',  price: '16,420',   change: '-0.14%', up: false },
  { symbol: 'XAGUSD',  price: '32.84',    change: '+0.38%', up: true  },
  { symbol: 'US30',    price: '42,156',   change: '+0.29%', up: true  },
];


// ─── TradingView Ticker Tape ──────────────────────────────────────────────────

export function TVTickerTape() {
  return (
    <div>
      {/* @ts-ignore */}
      <tv-ticker-tape
        symbols="FOREXCOM:XAUUSD,FOREXCOM:NAS100,FOREXCOM:US30,FOREXCOM:GBPUSD,FOREXCOM:EURUSD,BINANCE:BTCUSDT,FX_IDC:USDIDR"
        item-size="compact"
        theme="dark"
      />
    </div>
  );
}

// ─── MRLogo ──────────────────────────────────────────────────────────────────

interface MRLogoProps { size?: number; }

export function MRLogo({ size = 32 }: MRLogoProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-label="Menolak Rugi">
      <path d="M8 36 L8 12 L4 16 M8 12 L12 16" stroke="#14b8a6" strokeWidth="2.5" fill="none" strokeLinecap="square" />
      <text x="6" y="34" fontFamily="Geist, sans-serif" fontWeight="900" fontSize="18" fill="#14b8a6">M</text>
      <text x="24" y="34" fontFamily="Geist, sans-serif" fontWeight="900" fontSize="18" fill="#ef4444">R</text>
      <path d="M40 12 L40 36 L36 32 M40 36 L44 32" stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinecap="square" />
    </svg>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────

interface TickerProps { pairs?: TickerPair[]; }

export function Ticker({ pairs = DEFAULT_PAIRS }: TickerProps) {
  const items = [...pairs, ...pairs, ...pairs]; // triple for seamless loop
  return (
    <div style={{ borderBottom: `1px solid ${MR.border}`, background: '#050505', overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          padding: '8px 0',
          whiteSpace: 'nowrap',
          fontFamily: MR.mono,
          fontSize: 11,
          animation: 'mr-ticker 90s linear infinite',
        }}
      >
        <style>{`
          @keyframes mr-ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
          @keyframes mr-blink  { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
          .mr-blink { animation: mr-blink 1s steps(1) infinite; }
        `}</style>
        {items.map((t, i) => (
          <div key={i} style={{ display: 'inline-flex', gap: 8, padding: '0 22px', alignItems: 'center', borderRight: `1px solid ${MR.border}` }}>
            <span style={{ color: MR.dim, letterSpacing: 0.5 }}>{t.symbol}</span>
            <span style={{ color: MR.text }}>{t.price}</span>
            <span style={{ color: t.up ? MR.up : MR.down }}>{t.up ? '▲' : '▼'} {t.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── StatusBar ────────────────────────────────────────────────────────────────

export function StatusBar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, '0');
  const utc = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 40px', background: '#040404', color: MR.dim, fontSize: 10, borderBottom: `1px solid ${MR.border}`, letterSpacing: 0.6, fontFamily: MR.mono }}>
      <span><span className="mr-blink" style={{ color: MR.up }}>●</span> LIVE · MENTOR ONLINE</span>
      <span style={{ color: MR.text, letterSpacing: 1.5 }}>✦ MENOLAK RUGI · SMC EDUCATION ✦</span>
      <span>{utc}</span>
    </div>
  );
}

// ─── CandleChart ──────────────────────────────────────────────────────────────

interface CandleChartProps {
  width?: number;
  height?: number;
  density?: number;
  showBOS?: boolean;
}

export function CandleChart({ width = 480, height = 240, density = 24, showBOS = true }: CandleChartProps) {
  const candles = useMemo(() => {
    const out: { open: number; close: number; high: number; low: number }[] = [];
    let price = 50;
    for (let i = 0; i < density; i++) {
      const seed = Math.sin(i * 7.31 + density) * 10000;
      const r = (s: number) => s - Math.floor(s);
      const drift = (r(seed) - 0.5) * 8;
      const open = price;
      const close = price + drift;
      const high = Math.max(open, close) + r(seed * 1.3) * 4;
      const low  = Math.min(open, close) - r(seed * 2.1) * 4;
      out.push({ open, close, high, low });
      price = close;
    }
    return out;
  }, [density]);

  const minV  = Math.min(...candles.map(c => c.low));
  const maxV  = Math.max(...candles.map(c => c.high));
  const range = maxV - minV;
  const pad   = 12;
  const cw    = (width - pad * 2) / density;
  const y     = (v: number) => pad + (1 - (v - minV) / range) * (height - pad * 2);
  const bosY  = y(candles[Math.floor(density * 0.55)]?.high ?? 50);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: 'block' }}>
      <defs>
        <pattern id="cg" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#cg)" />
      {candles.map((c, i) => {
        const up    = c.close >= c.open;
        const color = up ? '#10b981' : '#ef4444';
        const x     = pad + i * cw + cw * 0.5;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1" />
            <rect
              x={x - cw * 0.32}
              y={y(Math.max(c.open, c.close))}
              width={cw * 0.64}
              height={Math.max(1, Math.abs(y(c.open) - y(c.close)))}
              fill={color}
            />
          </g>
        );
      })}
      {showBOS && (
        <g>
          <line x1={pad} x2={width - pad} y1={bosY} y2={bosY} stroke="#eab308" strokeDasharray="4 4" strokeWidth="1" opacity="0.7" />
          <text x={width - pad - 4} y={bosY - 6} textAnchor="end" fill="#eab308" fontFamily="Geist Mono" fontSize="10">BOS</text>
        </g>
      )}
    </svg>
  );
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

interface TierBadgeProps { tier: string; size?: 'sm' | 'md'; }

const TIER_COLOR: Record<string, string> = {
  trial:          '#737373',
  bronze:         '#c89a6a',
  'smc silver':   '#a0aec0',
  gold:           '#eab308',
  platinum:       '#b9c4d9',
};

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const color = TIER_COLOR[tier.toLowerCase()] ?? '#737373';
  const fs = size === 'sm' ? 10 : 12;
  return (
    <span style={{
      fontFamily: MR.mono,
      fontSize: fs,
      color,
      border: `1px solid ${color}`,
      padding: '2px 7px',
      letterSpacing: 0.5,
      borderRadius: 2,
      whiteSpace: 'nowrap',
    }}>
      {tier.toUpperCase()}
    </span>
  );
}

// ─── Candle-grid background helper ───────────────────────────────────────────

export const CANDLE_GRID_STYLE: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
  `,
  backgroundSize: '32px 32px',
};
