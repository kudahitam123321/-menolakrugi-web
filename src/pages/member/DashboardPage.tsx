import React, { useState, useEffect, useRef, memo } from 'react';
import { supabase } from '../../lib/supabase';
import LanjutkanBelajar from '../../components/LanjutkanBelajar';
import JurnalPage from './JurnalPage';
import LeaderboardPage from './LeaderboardPage';
import MemberTradingPlan from './MemberTradingPlan';
import CompetitionPage from '../CompetitionPage';
import { trackVideoWatch } from '../../hooks/useWatchHistory';
import {
  Search, LayoutGrid, PlayCircle, BookOpen, LineChart, NotebookPen, ClipboardList,
  MessageCircle, Landmark, ShoppingBag, Rocket, Trophy, Medal, Award, Target, Star,
  Link2, Settings, HelpCircle, LogOut, Bell, CheckCircle2, XCircle, Info, Megaphone,
  Lock, FlaskConical, CircleDot, DollarSign, Briefcase,
  Paperclip, Check, Clock, Play, Circle, RotateCcw, FileText, Presentation, FileSpreadsheet, File, Download,
} from 'lucide-react';

const G = { gold: 'var(--mr-gold)', gold2: 'var(--mr-gold2)' };
const C = {
  bg: 'var(--mr-bg)', sidebar: 'var(--mr-sidebar)', panel: 'var(--mr-panel)', border: 'var(--mr-border)',
  border2: 'var(--mr-border2)', dim: 'var(--mr-dim)', muted: 'var(--mr-muted)', text: 'var(--mr-text)',
  up: 'var(--mr-up)', down: 'var(--mr-down)', mono: '"Geist Mono",monospace',
  sans: '"Geist",system-ui,sans-serif',
};
const LP = {
  bg:            'var(--lp-bg)',
  surface:       'var(--lp-surface)',
  text:          'var(--lp-text)',
  muted:         'var(--lp-muted)',
  border:        'var(--lp-border)',
  primary:       'var(--lp-primary)',
  primaryHover:  'var(--lp-primary-hover)',
  primaryTint:   'var(--lp-primary-tint)',
  danger:        'var(--lp-danger)',
  sans: '"Geist",system-ui,sans-serif',
  mono: '"Geist Mono",monospace',
  radius:   16,
  radiusSm: 10,
  shadowSm: '0 1px 3px rgba(0,0,0,0.06)',
  shadowMd: '0 8px 24px rgba(0,0,0,0.08)',
};
const DISCORD  = 'https://discord.gg/d2Tpf6sGMr';
const TELEGRAM = 'https://t.me/+_azyX2h9oFhmNjNl';
const WA_ADMIN = 'https://wa.me/6281242224939';
function extractYtId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

const SIDEBAR = [
  { id: 'dashboard',    label: 'Dashboard',       Icon: LayoutGrid },
  { id: 'kelas',        label: 'Kelas Saya',      Icon: PlayCircle },
  { id: 'materi',       label: 'Materi',          Icon: BookOpen },
  { id: 'news',         label: 'Chart',           Icon: LineChart },
  { id: 'jurnal',       label: 'Jurnal Trading',  Icon: NotebookPen },
  { id: 'trading-plan', label: 'Trading Plan',    Icon: ClipboardList },
  { id: 'komunitas',    label: 'Komunitas',       Icon: MessageCircle },
  { id: 'tools',        label: 'Broker',          Icon: Landmark },
  { id: 'produk',       label: 'Produk',          Icon: ShoppingBag },
  { id: 'sep1',         label: 'TOOLS & PROGRESS', separator: true },
  { id: 'funded',       label: 'Status Trading',  Icon: Rocket },
  { id: 'peringkat',    label: 'Peringkat',       Icon: Trophy },
  { id: 'competition',  label: 'Kompetisi',       Icon: Medal },
  { id: 'sertifikat',   label: 'Sertifikat',      Icon: Award },
  { id: '1on1',         label: '1-on-1 Mentoring', Icon: Target },
  { id: 'ulasan',       label: 'Tulis Ulasan',    Icon: Star },
  { id: 'referral',     label: 'Referral',        Icon: Link2 },
  { id: 'sep2',         label: 'ACCOUNT',         separator: true },
  { id: 'pengaturan',   label: 'Pengaturan',      Icon: Settings },
  { id: 'bantuan',      label: 'Bantuan',         Icon: HelpCircle },
  { id: 'logout',       label: 'Logout',          Icon: LogOut },
];

function filterSidebar(items: typeof SIDEBAR, query: string) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  const out: typeof SIDEBAR = [];
  let pendingSeparator: typeof SIDEBAR[number] | null = null;
  for (const item of items) {
    if ((item as any).separator) { pendingSeparator = item; continue; }
    if (!item.label.toLowerCase().includes(q)) continue;
    if (pendingSeparator) { out.push(pendingSeparator); pendingSeparator = null; }
    out.push(item);
  }
  return out;
}

// ── Mini sparkline ──────────────────────────────────────────────────────────
function Spark({ up }: { up: boolean }) {
  const pts = up ? '0,18 10,14 20,15 30,10 40,12 50,7 60,8 70,3'
                 : '0,3 10,7 20,5 30,12 40,8 50,14 60,10 70,16';
  return <svg viewBox="0 0 70 20" width="60" height="20"><polyline points={pts} fill="none" stroke={up ? C.up : C.down} strokeWidth="1.5"/></svg>;
}

// ── Semicircle gauge ────────────────────────────────────────────────────────
function GaugeChart({ pct, color, locked = false }: { pct: number; color: string; locked?: boolean }) {
  const cx = 40, cy = 46, r = 32;
  const circ = Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <svg width="80" height="52" viewBox="0 0 80 52" style={{ overflow: 'visible' }}>
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke="var(--mr-border2)" strokeWidth="5.5" strokeLinecap="round"/>
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke={locked ? '#2a2a2a' : color} strokeWidth="5.5" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.9s ease' }}/>
      <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="middle"
        fontSize="14" fontWeight="800" fontFamily='"Geist Mono",monospace' fill={locked ? '#333' : color}>
        {locked ? '—' : `${pct}%`}
      </text>
    </svg>
  );
}

// ── Progress ring ───────────────────────────────────────────────────────────
function Ring({ pct, size = 48, color = G.gold }: { pct: number; size?: number; color?: string }) {
  const r = (size - 6) / 2; const c2 = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--mr-border2)" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={c2} strokeDashoffset={c2-(pct/100)*c2} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="central"
        fontSize={size/4.5} fontFamily='"Geist Mono",monospace' fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
}


// ── TradingView Market Overview (Dashboard) ─────────────────────────────────
const MarketOverviewWidget = memo(function MarketOverviewWidget() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark', dateRange: '12M', locale: 'id',
      isTransparent: true, showFloatingTooltip: false,
      plotLineColorGrowing: 'rgba(234,179,8,1)',
      plotLineColorFalling: 'rgba(234,179,8,1)',
      gridLineColor: 'rgba(240,243,250,0)',
      scaleFontColor: '#888',
      belowLineFillColorGrowing: 'rgba(234,179,8,0.08)',
      belowLineFillColorFalling: 'rgba(234,179,8,0.08)',
      belowLineFillColorGrowingBottom: 'rgba(234,179,8,0)',
      belowLineFillColorFallingBottom: 'rgba(234,179,8,0)',
      symbolActiveColor: 'rgba(234,179,8,0.1)',
      backgroundColor: '#111111',
      width: '100%', height: '100%',
      showSymbolLogo: true, showChart: true,
      tabs: [
        { title: 'Forex', originalTitle: 'Forex', symbols: [
          { s: 'FX:EURUSD', d: 'EUR/USD' }, { s: 'FX:GBPUSD', d: 'GBP/USD' },
          { s: 'FX:USDJPY', d: 'USD/JPY' }, { s: 'FX:USDCHF', d: 'USD/CHF' },
          { s: 'FX:AUDUSD', d: 'AUD/USD' }, { s: 'FX:USDCAD', d: 'USD/CAD' },
        ]},
        { title: 'Indices', originalTitle: 'Indices', symbols: [
          { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' }, { s: 'FOREXCOM:NAS100', d: 'Nasdaq' },
          { s: 'FOREXCOM:US30', d: 'Dow Jones' }, { s: 'INDEX:DEU40', d: 'DAX' },
        ]},
        { title: 'Commodity', originalTitle: 'Futures', symbols: [
          { s: 'FOREXCOM:XAUUSD', d: 'Gold' }, { s: 'FOREXCOM:XAGUSD', d: 'Silver' },
          { s: 'FOREXCOM:USOIL', d: 'Crude Oil' },
        ]},
        { title: 'Crypto', symbols: [
          { s: 'BINANCE:BTCUSDT', d: 'Bitcoin' }, { s: 'BINANCE:ETHUSDT', d: 'Ethereum' },
          { s: 'BINANCE:SOLUSDT', d: 'Solana' }, { s: 'BINANCE:XRPUSDT', d: 'XRP' },
        ]},
      ],
    });
    ref.current.innerHTML = '<div class="tradingview-widget-container__widget" style="width:100%;height:100%"></div>';
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ''; };
  }, []);
  return <div className="tradingview-widget-container" ref={ref} style={{ width: '100%', height: '100%' }} />;
});

// ── TradingView Advanced Chart ──────────────────────────────────────────────
const AdvancedChartWidget = memo(function AdvancedChartWidget() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = `{
      "allow_symbol_change": true,
      "calendar": false,
      "details": false,
      "hide_side_toolbar": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "hide_volume": false,
      "hotlist": false,
      "interval": "15",
      "locale": "id",
      "save_image": true,
      "style": "1",
      "symbol": "FOREXCOM:XAUUSD",
      "theme": "dark",
      "timezone": "Etc/UTC",
      "backgroundColor": "#0F0F0F",
      "gridColor": "rgba(242, 242, 242, 0)",
      "watchlist": [],
      "withdateranges": true,
      "compareSymbols": [],
      "studies": [],
      "autosize": true
    }`;
    ref.current.innerHTML = '<div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>';
    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ''; };
  }, []);
  return (
    <div className="tradingview-widget-container" ref={ref} style={{ height: '100%', width: '100%' }}>
      <div className="tradingview-widget-copyright">
        <a href="https://id.tradingview.com/symbols/XAUUSD/?exchange=FOREXCOM" rel="noopener nofollow" target="_blank"
          style={{ fontFamily: 'monospace', fontSize: 10, color: '#555', textDecoration: 'none' }}>
          Track all markets on TradingView
        </a>
      </div>


      <div className='mr-bottom-spacer'/>

    </div>
  );
});

// ── Lot Size Calculator ────────────────────────────────────────────────────
function LotCalculator() {
  const [balance, setBalance] = useState('10000');
  const [risk, setRisk]       = useState('1');
  const [sl, setSl]           = useState('20');
  const [pair, setPair]       = useState('XAUUSD');
  const PAIRS: Record<string, number> = { XAUUSD: 100, EURUSD: 10, GBPUSD: 10, USDJPY: 0.09, XAGUSD: 50 };
  const pipVal   = PAIRS[pair] || 10;
  const riskAmt  = parseFloat(balance) * (parseFloat(risk) / 100);
  const lotSize  = riskAmt / (parseFloat(sl) * pipVal);
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>// LOT SIZE CALCULATOR</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[
          { l: 'BALANCE ($)', v: balance, s: setBalance, ph: '10000' },
          { l: 'RISK (%)',    v: risk,    s: setRisk,    ph: '1' },
          { l: 'STOP LOSS (pips)', v: sl, s: setSl, ph: '20' },
        ].map(f => (
          <div key={f.l}>
            <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>{f.l}</div>
            <input value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.ph}
              style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, outline: 'none', borderRadius: 5, boxSizing: 'border-box' as const }}
              onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border2}/>
          </div>
        ))}
        <div>
          <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>PAIR</div>
          <select value={pair} onChange={e => setPair(e.target.value)}
            style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, outline: 'none', borderRadius: 5, cursor: 'pointer' }}>
            {Object.keys(PAIRS).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div style={{ background: '#0a0c00', border: `1px solid #2a2200`, borderRadius: 8, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>LOT SIZE</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: G.gold, letterSpacing: -1 }}>{isNaN(lotSize) ? '—' : lotSize.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>RISK AMOUNT</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.up, letterSpacing: -1 }}>${isNaN(riskAmt) ? '—' : riskAmt.toFixed(0)}</div>
        </div>
      </div>
      <div style={{ fontFamily: C.mono, color: '#333', fontSize: 10, marginTop: 10, lineHeight: 1.5 }}>
        Formula: Lot = (Balance × Risk%) ÷ (SL pips × Pip Value)<br/>
        Pip value {pair}: ${pipVal}/lot/pip
      </div>


      <div className='mr-bottom-spacer'/>

    </div>
  );
}

// ── Halaman utama ──────────────────────────────────────────────────────────
interface Member { id: string; nama: string; tier: string; is_advance: boolean; discord_username?: string; created_at?: string; funded_status?: string | null; discord_id?: string; }

// ── Certificate Canvas Component — Premium Gold Design ──────────────
// ── Certificate Canvas Component ──────────────────────────────────────
function CertificateCanvas({ nama, tier, tanggal }: { nama: string; tier: string; tanggal: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 600, H = 848;
    canvas.width = W; canvas.height = H;
    canvas.id = 'mr-cert-canvas';

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/certificate-template.png';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, W, H);
      // Nama
      const nameLen = nama.length;
      const nameFontSize = nameLen > 24 ? 26 : nameLen > 16 ? 32 : 38;
      ctx.font = `bold ${nameFontSize}px Georgia, serif`;
      ctx.fillStyle = '#1a5c2e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nama, 300, 400);
      // Tanggal
      ctx.font = 'bold 17px Georgia, serif';
      ctx.fillStyle = '#2d4a2d';
      ctx.textAlign = 'left';
      ctx.fillText(tanggal, 92, 703);
      // Tier
      ctx.font = '13px Georgia, serif';
      ctx.fillStyle = '#1a5c2e';
      ctx.textAlign = 'left';
      ctx.fillText(tier, 92, 738);
    };
    img.onerror = () => {
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1a5c2e';
      ctx.font = 'bold 32px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('SERTIFIKAT', W/2, H/2 - 60);
      ctx.font = 'bold 28px Georgia, serif';
      ctx.fillText(nama, W/2, H/2);
      ctx.font = '18px Georgia, serif';
      ctx.fillStyle = '#555';
      ctx.fillText(tanggal, W/2, H/2 + 50);
    };
  }, [nama, tier, tanggal]);

  return (
    <canvas
      ref={canvasRef}
      style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', borderRadius: 8 }}
    />
  );
}

export default function DashboardPage() {
  const [member, setMember]           = useState<Member | null>(null);
  const [active, setActive]           = useState(() => window.location.pathname === '/trading-plan' ? 'trading-plan' : 'dashboard');
  const [videos, setVideos]           = useState<any[]>([]);
  const [files, setFiles]             = useState<any[]>([]);
  const [progress, setProgress]       = useState<Record<string, string>>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [brokers, setBrokers]         = useState<any[]>([]);
  const [propRules, setPropRules]       = useState<any[]>([]);
  const [products, setProducts]         = useState<any[]>([]);
  const [myOrders, setMyOrders]         = useState<any[]>([]);
  const [prodView, setProdView]         = useState<'katalog'|'pesanan'>('katalog');
  const [orderModal, setOrderModal]     = useState<any|null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [kodeDiskon, setKodeDiskon]     = useState('');
  const [kodeDiskonData, setKodeDiskonData] = useState<any|null>(null);
  const [kodeErr, setKodeErr]           = useState('');
  const [kodeLoading, setKodeLoading]   = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [modalStep, setModalStep]       = useState<'konfirmasi'|'pembayaran'>('konfirmasi');
  const [pendingOrder, setPendingOrder] = useState<any|null>(null);
  const [rekCopied, setRekCopied]       = useState('');
  const [oldPass, setOldPass]         = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confPass, setConfPass]       = useState('');
  const [passMsg, setPassMsg]         = useState('');
  const [passErr, setPassErr]         = useState('');
  const [discordId, setDiscordId]     = useState('');
  const [settingMsg, setSettingMsg]   = useState('');
  const [liveSchedules, setLiveSchedules] = useState<any[]>([]);
  const [notifications, setNotifications]   = useState<any[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(new Set());
  const [showMemberNotif, setShowMemberNotif] = useState(false);
  const [notifLastSeen, setNotifLastSeen]     = useState('1970-01-01T00:00:00Z');
  const [advanceReq, setAdvanceReq]         = useState<any | null>(null);
  const [showAdvModal, setShowAdvModal]     = useState(false);
  const [jurnal1, setJurnal1]               = useState('');
  const [jurnal2, setJurnal2]               = useState('');
  const [jurnal3, setJurnal3]               = useState('');
  const [advSubmitting, setAdvSubmitting]   = useState(false);
  const [advMsg, setAdvMsg]                 = useState('');
  const [jurnalFiles, setJurnalFiles]       = useState<(File|null)[]>([null,null,null]);
  const [jurnalMode, setJurnalMode]         = useState<('link'|'file')[]>(['link','link','link']);
  const [statusSaving, setStatusSaving]     = useState(false);
  const [watchRefreshKey, setWatchRefreshKey] = useState(0);
  const [leaderboard, setLeaderboard]          = useState<any[]>([]);
  const [jurnalLeaderboard, setJurnalLeaderboard] = useState<any[]>([]);
  const [myJurnalStats, setMyJurnalStats] = useState<{
    totalTrades: number; wins: number; losses: number; winRate: number;
    totalPnl: number; bestTrade: number; worstTrade: number;
    mostTradedPair: string; equityAwal: number; totalGain: number;
  } | null>(null);
  const [viewJurnalMember, setViewJurnalMember]   = useState<any|null>(null);
  const [viewJurnalEntries, setViewJurnalEntries] = useState<any[]>([]);
  const [viewJurnalLoading, setViewJurnalLoading] = useState(false);
  const [oneOnOneRequests, setOneOnOneRequests]   = useState<any[]>([]);
  const [oonDiscord, setOonDiscord]               = useState('');
  const [oonTopic, setOonTopic]                   = useState('');
  const [oonSubmitting, setOonSubmitting]         = useState(false);
  const [oonMsg, setOonMsg]                       = useState('');

  // View another member's jurnal
  const viewMemberJurnal = async (memberData: any) => {
    setViewJurnalMember(memberData);
    setViewJurnalLoading(true);
    setViewJurnalEntries([]);
    try {
      const [{ data: entries }, { data: sett }] = await Promise.all([
        supabase.from('trading_journals').select('*').eq('member_id', memberData.id).order('tanggal', { ascending: false }),
        supabase.from('journal_settings').select('equity_awal').eq('member_id', memberData.id).single(),
      ]);
      setViewJurnalEntries(entries || []);
      setViewJurnalMember({ ...memberData, equityAwal: sett?.equity_awal || memberData.equityAwal || 10000 });
    } catch(_) {}
    setViewJurnalLoading(false);
  };
  const [videoRatings, setVideoRatings]         = useState<Record<string,number>>({});
  const [referralCode, setReferralCode]         = useState('');
  const [referrals, setReferrals]               = useState<any[]>([]);
  const [referralCopied, setReferralCopied]     = useState(false);
  const [myTestimonial, setMyTestimonial]       = useState<any>(null);
  const [testiNama, setTestiNama]               = useState('');
  const [testiBintang, setTestiBintang]         = useState(5);
  const [testiTeks, setTestiTeks]               = useState('');
  const [testiSaving, setTestiSaving]           = useState(false);
  const [testiMsg, setTestiMsg]                 = useState('');
  const [sidebarQuery, setSidebarQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('mr_sidebar_collapsed') === '1';
  });
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);
  React.useEffect(() => {
    if (sidebarCollapsed || !mobileMenuOpen) setSidebarQuery('');
  }, [sidebarCollapsed, mobileMenuOpen]);
  const [isMobile, setIsMobile]                 = useState(() => window.innerWidth < 768);
  const [memberToasts, setMemberToasts]         = useState<{id:string;msg:string;type:'success'|'error'|'info'}[]>([]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function addMemberToast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = Date.now().toString() + Math.random();
    setMemberToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setMemberToasts(prev => prev.filter(t => t.id !== id)), 7000);
  }

  function normalizeTier(tier: string): string {
    const t = (tier || '').toLowerCase();
    if (t.includes('platinum')) return 'platinum';
    if (t.includes('gold'))     return 'gold';
    if (t.includes('bronze'))   return 'bronze';
    return 'trial';
  }

  async function cekKodeDiskon() {
    if (!kodeDiskon.trim()) return;
    setKodeLoading(true); setKodeErr(''); setKodeDiskonData(null);
    const { data, error } = await supabase.from('discount_codes')
      .select('*').eq('kode', kodeDiskon.toUpperCase().trim()).eq('aktif', true).single();
    setKodeLoading(false);
    if (error || !data) { setKodeErr('Kode tidak valid atau sudah tidak aktif.'); return; }
    if (data.berlaku_hingga && new Date(data.berlaku_hingga) < new Date()) { setKodeErr('Kode sudah kadaluarsa.'); return; }
    if (data.max_penggunaan && data.terpakai >= data.max_penggunaan) { setKodeErr('Kode sudah mencapai batas penggunaan.'); return; }
    setKodeDiskonData(data);
  }

  function closeOrderModal() {
    setOrderModal(null);
    setModalStep('konfirmasi');
    setPendingOrder(null);
    setRekCopied('');
    setKodeDiskon(''); setKodeDiskonData(null); setKodeErr('');
  }

  async function buatOrder(produk: any, planType: 'bulanan'|'tahunan'|'lifetime', appliedCode: any|null) {
    if (!member) return;
    setOrderLoading(true);
    const hargaBase = produk[`harga_${planType}`];
    const diskonPct = appliedCode ? appliedCode.diskon : (produk[`diskon_${planType}`] || 0);
    const harga     = diskonPct ? Math.round(hargaBase * (1 - diskonPct / 100)) : hargaBase;
    const labelPlan = planType.charAt(0).toUpperCase() + planType.slice(1);
    const { data, error } = await supabase.from('orders').insert({
      product_id:     produk.id,
      member_id:      member.id,
      nama_member:    member.nama,
      email_member:   (member as any).email || '',
      tier_member:    member.tier,
      status:         'pending',
      plan_type:      planType,
      kode_diskon:    appliedCode?.kode || null,
      diskon_applied: diskonPct || null,
    }).select().single();
    setOrderLoading(false);
    if (error) { addMemberToast('Gagal membuat order: ' + error.message, 'error'); return; }
    if (appliedCode) {
      await supabase.from('discount_codes').update({ terpakai: appliedCode.terpakai + 1 }).eq('id', appliedCode.id);
    }
    setMyOrders(prev => [{ ...data, products: produk }, ...prev]);
    setPendingOrder({ ...data, products: produk, _harga: harga, _labelPlan: labelPlan, _appliedCode: appliedCode });
    setModalStep('pembayaran');
  }

  function konfirmasiKePembayaranWA() {
    if (!member || !pendingOrder) return;
    const prod = pendingOrder.products;
    const tipe = prod?.status === 'preorder' ? 'pre-order' : 'membeli';
    const kodeInfo = pendingOrder._appliedCode ? ` | Kode: ${pendingOrder._appliedCode.kode} (-${pendingOrder._appliedCode.diskon}%)` : '';
    const pesan = encodeURIComponent(
      `Halo Admin, saya ${member.nama} ingin konfirmasi ${tipe} produk *${prod?.nama}* (Paket: ${pendingOrder._labelPlan}${kodeInfo}) seharga Rp${Number(pendingOrder._harga).toLocaleString('id-ID')}.\n\nOrder ID: ${pendingOrder.id}\n\nMohon konfirmasi pembayaran. Terima kasih.`
    );
    window.open(`https://wa.me/6281242224939?text=${pesan}`, '_blank');
  }

  useEffect(() => {
    if (!member) return;
    const channel = supabase.channel(`member-updates-${member.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'advance_requests', filter: `member_id=eq.${member.id}` },
        (payload: any) => {
          if (payload.old?.status === 'pending' && payload.new?.status !== 'pending') {
            if (payload.new.status === 'approved') {
              addMemberToast('🎉 Request naik kelas kamu DISETUJUI! Refresh halaman untuk akses kelas Advanced.', 'success');
            } else {
              const reason = payload.new.alasan_tolak?.split('\n')[0];
              addMemberToast(`❌ Request naik kelas ditolak${reason ? `: ${reason}` : '.'}`, 'error');
            }
            loadData(member);
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'oneonone_requests', filter: `member_id=eq.${member.id}` },
        (payload: any) => {
          if (payload.old?.status === 'pending' && payload.new?.status !== 'pending') {
            if (payload.new.status === 'approved') {
              const sched = payload.new.scheduled_at
                ? new Date(payload.new.scheduled_at).toLocaleString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })
                : '';
              addMemberToast(`🎯 Sesi 1-on-1 kamu DISETUJUI!${sched ? ` Jadwal: ${sched}` : ' Cek menu 1-on-1.'}`, 'success');
            } else {
              const reason = payload.new.rejection_reason;
              addMemberToast(`❌ Request 1-on-1 ditolak${reason ? `: ${reason}` : '.'}`, 'error');
            }
            supabase.from('oneonone_requests').select('*').eq('member_id', member.id).order('created_at', { ascending: false })
              .then(({ data }) => { if (data) setOneOnOneRequests(data); });
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'testimonials', filter: `member_id=eq.${member.id}` },
        (payload: any) => {
          const oldS = payload.old?.status; const newS = payload.new?.status;
          if (oldS === 'pending' && newS !== 'pending') {
            if (newS === 'disetujui') {
              addMemberToast('✅ Ulasan kamu DISETUJUI dan sekarang tampil di landing page!', 'success');
            } else {
              addMemberToast('❌ Ulasan kamu ditolak oleh admin.', 'error');
            }
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'videos' },
        (payload: any) => {
          const judul = payload.new?.judul || 'Video baru';
          addMemberToast(`📹 Video materi baru tersedia: "${judul}"`, 'info');
          loadData(member);
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'files' },
        (payload: any) => {
          const judul = payload.new?.judul || 'File baru';
          addMemberToast(`📄 File materi baru tersedia: "${judul}"`, 'info');
          loadData(member);
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload: any) => {
          const judul = payload.new?.judul || 'Pengumuman';
          const content = payload.new?.content || '';
          addMemberToast(`📢 ${judul}: ${content.slice(0, 80)}${content.length > 80 ? '...' : ''}`, 'info');
          supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5)
            .then(({ data }) => { if (data) setAnnouncements(data); });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `member_id=eq.${member.id}` },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'dibayar') addMemberToast('💰 Pembayaran produk kamu DIKONFIRMASI oleh admin!', 'success');
          else if (newStatus === 'aktif') addMemberToast('✅ Produk kamu sekarang AKTIF! Cek tab Produk → Pesanan Saya.', 'success');
          supabase.from('orders').select('*, products(nama,harga_asli,harga_diskon)').eq('member_id', member.id).order('created_at', { ascending: false })
            .then(({ data }) => { if (data) setMyOrders(data); });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [member?.id]);

  function toggleSidebar() {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('mr_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  }
  const [statusMsg, setStatusMsg]           = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string|null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member');
    if (!stored) { window.location.href = '/login'; return; }
    try {
      const m = JSON.parse(stored) as Member;
      setMember(m);
      setSelectedStatus(m.funded_status || null);
      loadData(m);
      // Update last_seen saat masuk dashboard
      if (m.id) supabase.from('members').update({ last_seen: new Date().toISOString() }).eq('id', m.id);
    } catch { window.location.href = '/login'; }
  }, []);

  // Ping last_seen setiap 2 menit agar status "online" akurat
  useEffect(() => {
    const stored = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member');
    if (!stored) return;
    let m: any;
    try { m = JSON.parse(stored); } catch { return; }
    if (!m?.id) return;
    const interval = setInterval(() => {
      supabase.from('members').update({ last_seen: new Date().toISOString() }).eq('id', m.id);
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadData(m: Member) {
    const [vidRes, fileRes, annRes, progRes, brokerRes, schedRes, notifRes, advRes, rulesRes, prodRes, ordersRes] = await Promise.all([
      supabase.from('videos').select('*').order('urutan', { ascending: true }),
      supabase.from('files').select('*').order('urutan', { ascending: true }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('member_progress').select('video_id, status').eq('member_id', m.id),
      supabase.from('brokers').select('*').order('urutan', { ascending: true }),
      supabase.from('prop_firm_rules').select('*').order('created_at', { ascending: false }),
      supabase.from('live_schedules').select('*').order('urutan', { ascending: true }),
      supabase.from('member_notifications').select('*').eq('member_id', m.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('advance_requests').select('*').eq('member_id', m.id).order('created_at', { ascending: false }).limit(1),
      supabase.from('products').select('*').eq('aktif', true).order('urutan', { ascending: true }),
      supabase.from('orders').select('*, products(nama,harga_asli,harga_diskon)').eq('member_id', m.id).order('created_at', { ascending: false }),
    ]);
    if (vidRes.data)   setVideos(vidRes.data);
    if (fileRes.data)  setFiles(fileRes.data);
    if (annRes.data)   setAnnouncements(annRes.data);
    if (brokerRes.data) setBrokers(brokerRes.data);
    if (rulesRes.data) setPropRules(rulesRes.data);
    if (prodRes.data)  setProducts(prodRes.data);
    if (ordersRes.data) setMyOrders(ordersRes.data);
    try {
      const { data: pm } = await supabase.from('payment_methods').select('*').eq('aktif', true).order('urutan', { ascending: true });
      if (pm) setPaymentMethods(pm);
    } catch(_e) {}

    // Leaderboard
    const { data: progAll } = await supabase.from('member_progress').select('member_id,status');
    const { data: membAll } = await supabase.from('members').select('id,nama,tier,is_advance');
    if (progAll && membAll) {
      const counts: Record<string,number> = {};
      progAll.forEach((p:any) => { if(p.status==='selesai') counts[p.member_id]=(counts[p.member_id]||0)+1; });
      setLeaderboard(membAll.map((mb:any) => ({...mb,selesai:counts[mb.id]||0})).sort((a:any,b:any)=>b.selesai-a.selesai));
    }
    // Jurnal Leaderboard
    try {
      const [{ data: jEntries }, { data: jSettings }] = await Promise.all([
        supabase.from('trading_journals').select('member_id,pnl,hasil'),
        supabase.from('journal_settings').select('member_id,equity_awal'),
      ]);
      const { data: membJ } = await supabase.from('members').select('id,nama,tier');
      if (jEntries && membJ) {
        const eqMap: Record<string,number> = {};
        (jSettings||[]).forEach((s:any) => { eqMap[s.member_id] = s.equity_awal||10000; });
        const pnlMap: Record<string,number> = {};
        const cntMap: Record<string,number> = {};
        jEntries.forEach((e:any) => {
          pnlMap[e.member_id]=(pnlMap[e.member_id]||0)+(e.pnl||0);
          cntMap[e.member_id]=(cntMap[e.member_id]||0)+1;
        });
        setJurnalLeaderboard(membJ.filter((m:any)=>cntMap[m.id]).map((m:any)=>({
          ...m, totalPnl:pnlMap[m.id]||0, trades:cntMap[m.id]||0,
          equityAwal:eqMap[m.id]||10000,
          gainPct:((pnlMap[m.id]||0)/(eqMap[m.id]||10000))*100,
        })).sort((a:any,b:any)=>b.gainPct-a.gainPct));
      }
    } catch(_e) {}
    // My personal jurnal stats
    try {
      const [{ data: myJurnals }, { data: mySettings }] = await Promise.all([
        supabase.from('trading_journals').select('pair,hasil,pnl').eq('member_id', m.id),
        supabase.from('journal_settings').select('equity_awal').eq('member_id', m.id).single(),
      ]);
      if (myJurnals && myJurnals.length > 0) {
        const equityAwal = mySettings?.equity_awal || 10000;
        let totalPnl = 0; let wins = 0; let losses = 0;
        let bestTrade = -Infinity; let worstTrade = Infinity;
        const pairCount: Record<string, number> = {};
        myJurnals.forEach((j: any) => {
          const pnl = j.pnl ?? 0;
          totalPnl += pnl;
          if (pnl > bestTrade) bestTrade = pnl;
          if (pnl < worstTrade) worstTrade = pnl;
          if (j.hasil === 'Take Profit' || j.hasil === 'SL Profit') wins++;
          else if (j.hasil === 'Stop Loss') losses++;
          pairCount[j.pair || 'N/A'] = (pairCount[j.pair || 'N/A'] || 0) + 1;
        });
        const total = myJurnals.length;
        const mostTradedPair = Object.entries(pairCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
        setMyJurnalStats({
          totalTrades: total, wins, losses,
          winRate: total > 0 ? (wins / total) * 100 : 0,
          totalPnl, bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
          worstTrade: worstTrade === Infinity ? 0 : worstTrade,
          mostTradedPair, equityAwal,
          totalGain: equityAwal !== 0 ? (totalPnl / equityAwal) * 100 : 0,
        });
      } else {
        setMyJurnalStats(null);
      }
    } catch(_e) {}
    // Video ratings
    if (m.id) {
      const { data: ratData } = await supabase.from('video_ratings').select('video_id,rating').eq('member_id', m.id);
      if (ratData) { const map: Record<string,number> = {}; ratData.forEach((r:any)=>{ map[r.video_id]=r.rating; }); setVideoRatings(map); }
    }
    // Referral
    const code = (m as any).referral_code || (m.nama?.toLowerCase().replace(/\s+/g,'') + m.id?.slice(-4));
    setReferralCode(code);
    const { data: refData } = await supabase.from('referrals').select('*').eq('referrer_id', m.id).order('created_at',{ascending:false});
    if (refData) setReferrals(refData);
    // My testimonial
    try {
      const { data: _testi } = await supabase.from('testimonials').select('id,nama,ulasan,bintang,kelas,status').eq('member_id', m.id).maybeSingle();
      if (_testi) { setMyTestimonial(_testi); setTestiNama(_testi.nama||m.nama); setTestiBintang(_testi.bintang||5); setTestiTeks(_testi.ulasan||''); }
      else { setTestiNama(m.nama); }
    } catch(_e) {}
    if (schedRes.data)  setLiveSchedules(schedRes.data);
    if (notifRes.data)  setNotifications(notifRes.data);
    if (advRes.data && advRes.data.length > 0) setAdvanceReq(advRes.data[0]);
    const savedSeen = localStorage.getItem(`mr_notif_seen_${m.id}`);
    if (savedSeen) setNotifLastSeen(savedSeen);
    if (progRes.data) {
      const map: Record<string, string> = {};
      progRes.data.forEach((p: any) => { map[p.video_id] = p.status; });
      setProgress(map);
    }
    // 1-on-1 requests
    const { data: oonData } = await supabase.from('oneonone_requests').select('*').eq('member_id', m.id).order('created_at', { ascending: false });
    if (oonData) setOneOnOneRequests(oonData);
  }

  async function handleChangePassword() {
    setPassErr(''); setPassMsg('');
    if (!oldPass || !newPass || !confPass) { setPassErr('Semua field wajib diisi.'); return; }
    if (newPass !== confPass) { setPassErr('Password baru tidak cocok.'); return; }
    if (newPass.length < 6)  { setPassErr('Password minimal 6 karakter.'); return; }
    if (!member) return;
    const { data } = await supabase.from('members').select('password').eq('id', member.id).single();
    if (!data || data.password !== oldPass) { setPassErr('Password lama salah.'); return; }
    await supabase.from('members').update({ password: newPass }).eq('id', member.id);
    setPassMsg('Password berhasil diubah!');
    setOldPass(''); setNewPass(''); setConfPass('');
  }

  async function handleSaveDiscord() {
    if (!member || !discordId.trim()) return;
    await supabase.from('members').update({ discord_username: discordId.trim() }).eq('id', member.id);
    setMember({ ...member, discord_username: discordId.trim() });
    const raw = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member') || '{}';
    const stored = JSON.parse(raw);
    const updated = JSON.stringify({ ...stored, discord_username: discordId.trim() });
    if (localStorage.getItem('mr_member')) localStorage.setItem('mr_member', updated);
    else sessionStorage.setItem('mr_member', updated);
    setSettingMsg('Tersimpan!');
    setTimeout(() => setSettingMsg(''), 2000);
  }

  function handleConnectDiscordOAuth() {
    const CLIENT_ID = '1497825707173347409';
    const REDIRECT_URI = encodeURIComponent('https://menolakrugi.pages.dev/discord-callback');
    const SCOPE = encodeURIComponent('identify guilds.join');
    window.location.href = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}`;
  }

  async function rateVideo(videoId: string, star: number) {
    if (!member) return;
    await supabase.from('video_ratings').upsert({ member_id: member.id, video_id: videoId, rating: star }, { onConflict: 'member_id,video_id' });
    setVideoRatings(prev => ({ ...prev, [videoId]: star }));
  }

  async function handleUpdateStatus(newStatus: string | null) {
    if (!member) return;
    setStatusSaving(true); setStatusMsg('');
    try {
      // Simpan ke Supabase langsung (selalu jalan)
      const { error: dbErr } = await supabase.from('members').update({ funded_status: newStatus }).eq('id', member.id);
      if (dbErr) { setStatusMsg('Gagal menyimpan: ' + dbErr.message); setStatusSaving(false); return; }

      // Update state & session lokal
      setSelectedStatus(newStatus);
      setMember({ ...member, funded_status: newStatus });
      const stored = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member') || '{}';
      const updated = JSON.stringify({ ...JSON.parse(stored), funded_status: newStatus });
      if (localStorage.getItem('mr_member')) localStorage.setItem('mr_member', updated);
      else sessionStorage.setItem('mr_member', updated);
      setStatusMsg('Status berhasil disimpan!');

      // Coba update Discord nickname via bot (opsional, tidak gagalkan proses)
      try {
        const res = await fetch('/api/discord/update-trading-status', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: member.id, funded_status: newStatus }),
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        if (data.success && data.message) setStatusMsg(data.message);
      } catch { /* bot offline — status DB sudah tersimpan */ }
    } catch { setStatusMsg('Tidak bisa menyimpan status.'); }
    setStatusSaving(false);
  }

  async function submitAdvanceRequest() {
    if (!member) return;
    // Validate: minimal 1 jurnal harus diisi
    const links = [jurnal1, jurnal2, jurnal3];
    const hasAtLeastOne = links.some((l, i) =>
      (jurnalMode[i] === 'link' && l.trim()) ||
      (jurnalMode[i] === 'file' && jurnalFiles[i])
    );
    if (!hasAtLeastOne) { setAdvMsg('Minimal 1 jurnal wajib dilampirkan.'); return; }
    setAdvSubmitting(true);
    // Upload files to Supabase Storage if any
    const jurnalValues: string[] = [];
    for (let i = 0; i < 3; i++) {
      if (jurnalMode[i] === 'file' && jurnalFiles[i]) {
        const file = jurnalFiles[i]!;
        const path = `advance-journals/${member.id}/${Date.now()}-jurnal${i+1}-${file.name}`;
        const { data: up, error: upErr } = await supabase.storage.from('journals').upload(path, file, { upsert: true });
        if (upErr) { setAdvMsg(`Gagal upload file jurnal ${i+1}: ${upErr.message}`); setAdvSubmitting(false); return; }
        const { data: url } = supabase.storage.from('journals').getPublicUrl(path);
        jurnalValues.push(`[FILE] ${url.publicUrl}`);
      } else {
        jurnalValues.push(links[i].trim());
      }
    }
    const alasan = `Jurnal 1: ${jurnalValues[0]}\nJurnal 2: ${jurnalValues[1]}\nJurnal 3: ${jurnalValues[2]}`;
    // Cek apakah sudah ada request
    const { data: existing } = await supabase
      .from('advance_requests')
      .select('id')
      .eq('member_id', member.id)
      .maybeSingle();

    let reqError;
    if (existing?.id) {
      // Update request yang ada
      const { error } = await supabase.from('advance_requests')
        .update({ member_nama: member.nama, member_tier: member.tier, status: 'pending', alasan_tolak: alasan, created_at: new Date().toISOString() })
        .eq('id', existing.id);
      reqError = error;
    } else {
      // Insert baru
      const { error } = await supabase.from('advance_requests')
        .insert({ member_id: member.id, member_nama: member.nama, member_tier: member.tier, status: 'pending', alasan_tolak: alasan, created_at: new Date().toISOString() });
      reqError = error;
    }
    const error = reqError;
    if (error) { setAdvMsg('Gagal mengirim: ' + error.message); }
    else {
      setAdvMsg(''); setShowAdvModal(false);
      setJurnal1(''); setJurnal2(''); setJurnal3('');
      setJurnalFiles([null,null,null]); setJurnalMode(['link','link','link']);
      loadData(member);
    }
    setAdvSubmitting(false);
  }

  async function submitOneOnOne() {
    if (!member) return;
    if (!oonDiscord.trim()) { setOonMsg('Nickname Discord wajib diisi.'); return; }
    if (!oonTopic.trim())   { setOonMsg('Topik yang ingin dibahas wajib diisi.'); return; }
    setOonSubmitting(true); setOonMsg('');
    const { error } = await supabase.from('oneonone_requests').insert({
      member_id: member.id,
      member_name: member.nama,
      member_tier: member.tier,
      discord_nickname: oonDiscord.trim(),
      topic: oonTopic.trim(),
    });
    if (error) { setOonMsg('Gagal mengirim: ' + error.message); setOonSubmitting(false); return; }
    const { data } = await supabase.from('oneonone_requests').select('*').eq('member_id', member.id).order('created_at', { ascending: false });
    if (data) setOneOnOneRequests(data);
    setOonDiscord(''); setOonTopic('');
    setOonMsg('Request berhasil dikirim! Admin akan menghubungi kamu segera melalui Discord.');
    setOonSubmitting(false);
  }

  function logout() {
    localStorage.removeItem('mr_member');
    sessionStorage.removeItem('mr_member');
    window.location.href = '/login';
  }

  if (!member) return (
    <div style={{ fontFamily: C.sans, background: C.bg, color: C.text, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height:56, background:C.sidebar, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', padding:'0 20px', gap:14, flexShrink:0 }}>
        <div className='mr-skeleton' style={{ width:32, height:32, borderRadius:8 }}/>
        <div className='mr-skeleton' style={{ width:120, height:14 }}/>
        <div style={{ flex:1 }}/>
        <div className='mr-skeleton' style={{ width:80, height:28, borderRadius:6 }}/>
      </div>
      <div style={{ display:'flex', flex:1 }}>
        <div style={{ width:200, background:C.sidebar, borderRight:`1px solid ${C.border}`, padding:'20px 12px', flexShrink:0, display:'flex', flexDirection:'column' as const, gap:8 }}>
          {[80,60,70,60,65,55,70,60].map((w,i)=><div key={i} className='mr-skeleton' style={{ width:`${w}%`, height:32, borderRadius:8 }}/>)}
        </div>
        <div style={{ flex:1, padding:24, display:'flex', flexDirection:'column' as const, gap:20 }}>
          <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:14, padding:28 }}>
            <div className='mr-skeleton mr-skeleton-text' style={{ width:160 }}/>
            <div className='mr-skeleton mr-skeleton-title' style={{ width:240 }}/>
            <div className='mr-skeleton mr-skeleton-text' style={{ width:'60%' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[0,1,2,3].map(i=><div key={i} className='mr-skeleton mr-skeleton-card'/>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[0,1].map(i=><div key={i} className='mr-skeleton mr-skeleton-thumb'/>)}
          </div>
        </div>
      </div>
    </div>
  );

  const completedVideos = Object.values(progress).filter(s => s === 'selesai').length;
  const totalVideos     = videos.length;
  const progressPct     = totalVideos > 0 ? Math.round(completedVideos / totalVideos * 100) : 0;
  // Trial expiry
  const isTrial   = member.tier?.toLowerCase().includes('trial');
  const expiryDate = isTrial && member.created_at
    ? new Date(new Date(member.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const isExpired  = expiryDate ? expiryDate < new Date() : false;
  const daysLeft   = expiryDate
    ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const inProgressVideos = videos.filter(v => progress[v.id] === 'mulai');
  const lastVideos       = inProgressVideos.length > 0 ? inProgressVideos.slice(0, 4)
                         : videos.slice(0, 4);

  const inp: React.CSSProperties = {
    background: C.bg, border: `1px solid ${C.border2}`, color: C.text,
    padding: '9px 14px', fontSize: 13, fontFamily: C.mono, outline: 'none',
    borderRadius: 6, width: '100%', boxSizing: 'border-box' as const,
  };

  return (
    <div className="mr-light-v2" style={{ fontFamily: LP.sans, background: LP.bg, minHeight: '100vh', color: LP.text, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <style>{`
        .mr-sidebar { width: 200px; flex-shrink: 0; }
        .mr-main { flex: 1; overflow-y: auto; min-width: 0; }
        .mr-bottom-nav { display: none; }
        .mr-bottom-spacer { display: none; }
        .mr-topbar-brand { display: flex; }
        .mr-content-pad { padding: 24px; }
        .mr-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        .mr-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        .mr-prog-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
        .mr-grid-announce { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .mr-kelas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .mr-funded-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        .mr-welcome-h1 { font-size: 32px; }
        .mr-video-actions { display: flex; }

        @media (max-width: 767px) {
          .mr-sidebar { display: none !important; }
          .mr-bottom-nav { display: flex !important; position: fixed; bottom: 0; left: 0; right: 0; height: 60px; z-index: 50; }
          .mr-bottom-spacer { display: block !important; height: 60px; }
          .mr-topbar-brand { display: none !important; }
          .mr-topbar { padding: 0 12px !important; }
          .mr-content-pad { padding: 14px !important; }
          .mr-grid-4 { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .mr-grid-3 { grid-template-columns: 1fr !important; gap: 10px !important; }
          .mr-prog-grid { grid-template-columns: repeat(2,1fr) !important; gap: 8px !important; }
          .mr-grid-announce { grid-template-columns: 1fr !important; gap: 12px !important; }
          .mr-kelas-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
          .mr-funded-grid { grid-template-columns: repeat(2,1fr) !important; gap: 8px !important; }
          .mr-welcome-h1 { font-size: 22px !important; }
          .mr-welcome-desc { font-size: 13px !important; }
          .mr-welcome-pad { padding: 18px 16px !important; }
          .mr-chart-hide { display: none !important; }
          .mr-video-actions { flex-wrap: wrap; gap: 4px !important; }
          .mr-modal { padding: 20px 16px !important; }
          .mr-modal-title { font-size: 18px !important; }
          .mr-status-banner { flex-direction: column !important; gap: 10px !important; }
          .mr-action-banner { padding: 12px !important; }
          .mr-action-banner-text { font-size: 11px !important; }
        }

        /* ── Dashboard Animations ── */
        @keyframes mr-kpi-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mr-ring-fill {
          from { stroke-dashoffset: var(--ring-full); }
          to   { stroke-dashoffset: var(--ring-offset); }
        }
        @keyframes mr-welcome-in {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .mr-kpi-0 { animation: mr-kpi-in 0.5s ease 0.1s both; }
        .mr-kpi-1 { animation: mr-kpi-in 0.5s ease 0.2s both; }
        .mr-kpi-2 { animation: mr-kpi-in 0.5s ease 0.3s both; }
        .mr-kpi-3 { animation: mr-kpi-in 0.5s ease 0.4s both; }
        .mr-welcome-anim { animation: mr-welcome-in 0.6s ease 0.05s both; }
        .mr-status-anim { animation: mr-kpi-in 0.5s ease 0.5s both; }
        .mr-banner-anim { animation: mr-kpi-in 0.5s ease 0.7s both; }
        @keyframes mr-shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        .mr-skeleton { background:linear-gradient(90deg,var(--mr-panel) 25%,var(--mr-border) 50%,var(--mr-panel) 75%); background-size:800px 100%; animation:mr-shimmer 1.4s infinite; border-radius:6px; }
        .mr-skeleton-text  { height:14px; margin-bottom:8px; }
        .mr-skeleton-title { height:24px; margin-bottom:12px; }
        .mr-skeleton-card  { height:90px; border-radius:12px; }
        .mr-skeleton-thumb { height:120px; border-radius:10px; }

        @keyframes mr-modal-in {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes mr-slideup-notify {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mr-progress-fill {
          from { width: 0%; }
          to   { width: var(--prog-w); }
        }
        @keyframes mr-sidebar-bg {
          from { background-size: 0% 100%; }
          to   { background-size: 100% 100%; }
        }
        .mr-modal-anim { animation: mr-modal-in 0.25s ease both; }
        .mr-notify-anim { animation: mr-slideup-notify 0.35s ease both; }
        .mr-sidebar-item:hover { background: linear-gradient(90deg,#1a1500,transparent) !important; transition: background 0.2s !important; }
        .mr-sidebar-item.active-item { background: linear-gradient(90deg,#1a1500,transparent) !important; border-left: 3px solid #eab308 !important; }
      `}</style>

      {/* ── Topbar ── */}
      <div className='mr-topbar' style={{ borderBottom: `1px solid ${LP.border}`, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, background: LP.surface, flexShrink: 0, position: 'sticky' as const, top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Hamburger / collapse toggle */}
          <button onClick={() => isMobile ? setMobileMenuOpen(o => !o) : toggleSidebar()}
            style={{ width: 36, height: 36, background: 'transparent', border: `1px solid ${LP.border}`, borderRadius: 7, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
            {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: i === 1 ? 12 : 16, height: 1.5, background: LP.muted, borderRadius: 2, transition: 'width 0.2s' }}/>)}
          </button>
          <div style={{ width: 32, height: 32, flexShrink: 0 }}><img src='/logo.png' alt='MR' style={{ width: '100%', height: '100%', objectFit: 'contain' }}/></div>
          <div className='mr-topbar-brand'>
            <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.3, color: LP.text }}>MENOLAK RUGI</div>
            <div style={{ fontFamily: LP.mono, fontSize: 8, color: LP.muted, letterSpacing: 1 }}>ELITE TRADING ENVIRONMENT</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
          {!isMobile && <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted }}>{member.tier.replace('SMC ', '').toUpperCase()}</div>}
          {member.is_advance && <span style={{ fontFamily: LP.mono, fontSize: 8, background: LP.primaryTint, border: `1px solid ${LP.primary}33`, color: LP.primary, padding: '2px 6px', borderRadius: 4 }}>ADVANCE</span>}
          {/* ── Bell notification ── */}
          {(() => {
            const unreadP = notifications.filter((n:any) => !dismissedNotifs.has(n.id)).length;
            const unreadA = announcements.filter((a:any) => a.created_at > notifLastSeen).length;
            const totalUnread = unreadP + unreadA;
            return (
              <div style={{ position: 'relative' }}>
                <button onClick={() => {
                    const opening = !showMemberNotif;
                    setShowMemberNotif(opening);
                    if (opening && member.id) {
                      const now = new Date().toISOString();
                      localStorage.setItem(`mr_notif_seen_${member.id}`, now);
                      setNotifLastSeen(now);
                    }
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={18} color={LP.muted} />
                  {totalUnread > 0 && (
                    <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, background: LP.danger, borderRadius: 8, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: LP.mono, fontWeight: 700, color: '#fff', padding: '0 3px' }}>
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </button>
                {showMemberNotif && (
                  <>
                    <div onClick={() => setShowMemberNotif(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }}/>
                    <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 300, background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, boxShadow: LP.shadowMd, zIndex: 50, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${LP.border}` }}>
                        <span style={{ fontFamily: LP.mono, fontSize: 10, color: LP.primary, letterSpacing: 1.5 }}>NOTIFIKASI</span>
                        <button onClick={() => setShowMemberNotif(false)} style={{ background: 'none', border: 'none', color: LP.muted, cursor: 'pointer', fontSize: 18, padding: '0 2px', lineHeight: 1 }}>×</button>
                      </div>
                      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                        {notifications.filter((n:any) => !dismissedNotifs.has(n.id)).map((n:any) => (
                          <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${LP.border}` }}>
                            <span style={{ flexShrink: 0, marginTop: 1 }}>
                              {n.type === 'approve' ? <CheckCircle2 size={16} color={LP.primary} /> : n.type === 'reject' ? <XCircle size={16} color={LP.danger} /> : <Info size={16} color={LP.muted} />}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, color: n.type === 'approve' ? LP.primary : n.type === 'reject' ? LP.danger : LP.text }}>
                                {n.type === 'approve' ? 'Advance Disetujui 🎉' : n.type === 'reject' ? 'Advance Ditolak' : 'Info'}
                              </div>
                              <div style={{ fontSize: 11, color: LP.muted, lineHeight: 1.4 }}>{n.message}</div>
                              <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 3 }}>{new Date(n.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</div>
                            </div>
                            <button onClick={() => setDismissedNotifs(s => { const ns = new Set(s); ns.add(n.id); return ns; })}
                              style={{ background: 'none', border: 'none', color: LP.muted, cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: '0 2px', alignSelf: 'flex-start' }}>×</button>
                          </div>
                        ))}
                        {announcements.map((a:any) => (
                          <div key={a.id || a.created_at} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${LP.border}` }}>
                            <span style={{ flexShrink: 0, marginTop: 1 }}><Megaphone size={16} color={LP.muted} /></span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {a.judul && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, color: LP.text }}>{a.judul}</div>}
                              <div style={{ fontSize: 11, color: LP.muted, lineHeight: 1.4 }}>{a.content || a.message || ''}</div>
                              <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 3 }}>{new Date(a.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</div>
                            </div>
                          </div>
                        ))}
                        {notifications.filter((n:any) => !dismissedNotifs.has(n.id)).length === 0 && announcements.length === 0 && (
                          <div style={{ padding: '28px 16px', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, fontFamily: LP.mono, color: LP.muted, fontSize: 12 }}>
                            <CheckCircle2 size={20} color={LP.muted} />
                            Tidak ada notifikasi
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, background: `linear-gradient(135deg,${LP.primary},${LP.primaryHover})`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#fff' }}>
              {member.nama[0].toUpperCase()}
            </div>
            {!isMobile && <span style={{ fontSize: 13, fontWeight: 600, color: LP.text }}>{member.nama}</span>}
          </div>
          {!isMobile && <button onClick={() => window.location.href = '/'} style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, background: 'none', border: `1px solid ${LP.border}`, padding: '4px 10px', cursor: 'pointer', borderRadius: 5 }}>Web ↗</button>}
        </div>
      </div>

      {/* ── Mobile Overlay ── */}
      {isMobile && mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(15,23,42,0.4)' }} onClick={() => setMobileMenuOpen(false)}/>
          <div style={{ width: 240, background: LP.surface, borderLeft: `1px solid ${LP.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${LP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: LP.text }}>{member.nama}</span>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: LP.muted, cursor: 'pointer', fontSize: 20, padding: '0 4px' }}>×</button>
            </div>
            <div style={{ padding: '10px 16px 0' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color={LP.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={sidebarQuery}
                  onChange={e => setSidebarQuery(e.target.value)}
                  placeholder="Cari menu..."
                  style={{ width: '100%', boxSizing: 'border-box' as const, background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 8, padding: '8px 10px 8px 30px', fontSize: 12, fontFamily: LP.sans, color: LP.text, outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, paddingTop: 8 }}>
              {filterSidebar(SIDEBAR, sidebarQuery).map(item => {
                if ((item as any).separator) {
                  return (
                    <div key={item.id} style={{ padding: '14px 20px 5px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 1, background: LP.border }}/>
                      <span style={{ fontFamily: LP.mono, fontSize: 8, color: LP.muted, letterSpacing: 2, whiteSpace: 'nowrap' as const }}>{item.label}</span>
                      <div style={{ flex: 1, height: 1, background: LP.border }}/>
                    </div>
                  );
                }
                const isA = active === item.id;
                const ItemIcon = (item as any).Icon;
                return (
                  <button key={item.id}
                    onClick={() => {
                      if ((item as any).href) { window.open((item as any).href, '_blank'); }
                      else if (item.id === 'logout') { logout(); }
                      else { setActive(item.id); setMobileMenuOpen(false); }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 20px', border: 'none', background: isA ? LP.primaryTint : 'transparent', borderLeft: isA ? `3px solid ${LP.primary}` : '3px solid transparent', color: isA ? LP.primary : LP.muted, cursor: 'pointer', fontSize: 14, textAlign: 'left' as const }}>
                    <ItemIcon size={18} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {(item as any).badge && <span style={{ fontFamily: LP.mono, fontSize: 8, background: LP.danger, color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{(item as any).badge}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ margin: '0 12px 12px', background: LP.primaryTint, border: `1px solid ${LP.primary}33`, borderRadius: 10, padding: '12px' }}>
              <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, marginBottom: 4 }}>AKSES MEMBERSHIP</div>
              <div style={{ fontWeight: 700, color: LP.primary, fontSize: 12 }}>{member.tier}</div>
              {isTrial && expiryDate && (
                <div style={{ fontFamily: LP.mono, fontSize: 10, color: daysLeft! <= 7 ? '#f97316' : LP.muted, marginTop: 4 }}>{daysLeft} hari lagi</div>
              )}
            </div>

          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Desktop Sidebar ── */}
        <aside className='mr-sidebar' style={{ width: sidebarCollapsed ? 58 : 200, background: LP.surface, borderRight: `1px solid ${LP.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', transition: 'width 0.2s ease', overflow: 'hidden' }}>
          <div style={{ flex: 1, paddingTop: 10 }}>
            {!sidebarCollapsed && (
              <div style={{ padding: '0 12px 12px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color={LP.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={sidebarQuery}
                    onChange={e => setSidebarQuery(e.target.value)}
                    placeholder="Cari menu..."
                    style={{ width: '100%', boxSizing: 'border-box' as const, background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 8, padding: '8px 10px 8px 30px', fontSize: 12, fontFamily: LP.sans, color: LP.text, outline: 'none' }}
                  />
                </div>
              </div>
            )}
            {filterSidebar(SIDEBAR, sidebarQuery).map(item => {
              if ((item as any).separator) {
                return !sidebarCollapsed ? (
                  <div key={item.id} style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: LP.border }}/>
                    <span style={{ fontFamily: LP.mono, fontSize: 8, color: LP.muted, letterSpacing: 2, whiteSpace: 'nowrap' as const }}>{item.label}</span>
                    <div style={{ flex: 1, height: 1, background: LP.border }}/>
                  </div>
                ) : <div key={item.id} style={{ margin: '8px 0', borderTop: `1px solid ${LP.border}` }}/>;
              }
              const isA = active === item.id;
              const ItemIcon = (item as any).Icon;
              return (
                <button key={item.id}
                  onClick={() => {
                    if ((item as any).href) { window.open((item as any).href, '_blank'); }
                    else if (item.id === 'logout') { logout(); }
                    else { setActive(item.id); }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: sidebarCollapsed ? '11px 0' : '10px 18px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', border: 'none', background: isA ? LP.primaryTint : 'transparent', borderLeft: isA ? `3px solid ${LP.primary}` : '3px solid transparent', color: isA ? LP.primary : LP.muted, cursor: 'pointer', fontSize: 13, textAlign: 'left' as const, transition: 'padding 0.2s' }}>
                  <ItemIcon size={17} style={{ flexShrink: 0 }} />
                  {!sidebarCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' as const }}>{item.label}</span>}
                  {!sidebarCollapsed && (item as any).badge && <span style={{ fontFamily: LP.mono, fontSize: 8, background: LP.danger, color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{(item as any).badge}</span>}
                </button>
              );
            })}
          </div>

          {/* Membership card - only when expanded */}
          {!sidebarCollapsed && <div style={{ margin: '0 12px 12px', background: LP.primaryTint, border: `1px solid ${LP.primary}33`, borderRadius: 10, padding: '14px' }}>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>AKSES MEMBERSHIP</div>
            <div style={{ fontWeight: 700, color: LP.primary, fontSize: 13 }}>{member.tier}</div>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginTop: 2 }}>{member.is_advance ? '(Advance)' : '(Basic)'}</div>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginTop: 8 }}>Aktif sampai</div>
            {isTrial && expiryDate ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: isExpired ? LP.danger : daysLeft! <= 7 ? '#f97316' : LP.text }}>
                  {expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {!isExpired && (
                  <div style={{ fontFamily: LP.mono, fontSize: 9, color: daysLeft! <= 7 ? '#f97316' : LP.muted, marginTop: 2 }}>
                    {daysLeft} hari lagi
                  </div>
                )}
                {isExpired && (
                  <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.danger, marginTop: 2 }}>AKSES BERAKHIR</div>
                )}
                <a href="/checkout" style={{ display: 'block', marginTop: 10, fontFamily: LP.mono, fontSize: 10, fontWeight: 700,
                  color: '#fff', background: isExpired ? LP.danger : LP.primary,
                  padding: '6px 0', textAlign: 'center' as const, textDecoration: 'none', borderRadius: 5 }}>
                  {isExpired ? 'AKTIFKAN LAGI' : 'NAIK TIER ▸'}
                </a>
              </>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: LP.text }}>Seumur Hidup</div>
            )}
          </div>}


        </aside>

        {/* ── Main Content ── */}
        <main className='mr-main' style={{ flex: 1, overflowY: 'auto', minWidth: 0, background: ['dashboard','kelas','materi','news'].includes(active) ? LP.bg : C.bg, color: ['dashboard','kelas','materi','news'].includes(active) ? LP.text : C.text }}>

          {/* ══ DASHBOARD ══ */}
          {active === 'dashboard' && (
            <div className='mr-content-pad' style={{ padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* ── Top bar: Welcome + quick stats ── */}
              <div className='mr-welcome-anim' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1.5, marginBottom: 3 }}>SELAMAT DATANG KEMBALI</div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, margin: 0, color: LP.text }}>{member.nama}</h1>
                </div>
                {/* Inline stats pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  <div style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: LP.primary, background: LP.primaryTint, border: `1px solid ${LP.primary}44`, padding: '6px 14px', borderRadius: 20 }}>
                    {progressPct}% selesai
                  </div>
                  <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.primary, background: LP.primaryTint, border: `1px solid ${LP.primary}44`, padding: '6px 14px', borderRadius: 20 }}>
                    {completedVideos}/{totalVideos} video
                  </div>
                  {member.is_advance && (
                    <div style={{ fontFamily: LP.mono, fontSize: 11, color: '#7c3aed', background: '#7c3aed14', border: '1px solid #7c3aed33', padding: '6px 14px', borderRadius: 20 }}>
                      ADVANCE
                    </div>
                  )}
                </div>
              </div>

              {/* ── Progress belajar — compact bars ── */}
              {(() => {
                const progCats = [
                  { key: 'basic',         label: 'Basic',      color: '#22c55e' },
                  { key: 'advanced',      label: 'Advanced',   color: '#a855f7' },
                  { key: 'tips-basic',    label: 'Tips Basic', color: '#0ea5e9' },
                  { key: 'tips-advanced', label: 'Tips Adv.',  color: '#ec4899' },
                ];
                const catBars = progCats.map(cat => {
                  const vids = videos.filter((v: any) => v.kategori === cat.key);
                  if (!vids.length) return null;
                  const isLocked = (cat.key === 'advanced' || cat.key === 'tips-advanced') && !member.is_advance;
                  const done = isLocked ? 0 : vids.filter((v: any) => progress[v.id] === 'selesai').length;
                  const pct = isLocked ? 0 : Math.round(done / vids.length * 100);
                  return { ...cat, vids, done, pct, isLocked };
                }).filter(Boolean);
                if (!catBars.length) return null;
                return (
                  <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 9, letterSpacing: 1.5, flexShrink: 0 }}>PROGRESS</div>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '6px 12px', minWidth: 0 }}>
                      {catBars.map(cat => cat && (
                        <div key={cat.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: LP.mono, fontSize: 8, color: cat.isLocked ? LP.muted : cat.color, fontWeight: 700 }}>
                              {cat.isLocked && <Lock size={9} />}{cat.label.toUpperCase()}
                            </span>
                            <span style={{ fontFamily: LP.mono, fontSize: 8, color: LP.muted }}>
                              {cat.isLocked ? 'Advance' : `${cat.done}/${cat.vids.length}`}
                            </span>
                          </div>
                          <div style={{ height: 5, background: LP.border, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.isLocked ? LP.muted : cat.color, borderRadius: 3, transition: 'width 0.8s ease' }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: LP.primary, flexShrink: 0 }}>{progressPct}%</div>
                  </div>
                );
              })()}

              {/* ── Status row ── 2-col ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {/* Status Trading */}
                <div style={{ background: LP.surface, border: `1px solid ${member.funded_status ? LP.primary + '44' : LP.border}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => setActive('funded')}>
                  <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1, marginBottom: 5 }}>STATUS TRADING</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 16, color: member.funded_status ? LP.primary : LP.muted, letterSpacing: -0.3 }}>
                    {member.funded_status ? (
                      <>
                        {member.funded_status === 'DA' ? <FlaskConical size={16} /> : member.funded_status === 'P1' ? <CircleDot size={16} color="#a855f7" /> : member.funded_status === 'P2' ? <CircleDot size={16} color="#eab308" /> : member.funded_status === 'Master' ? <Trophy size={16} /> : member.funded_status === 'MPAID' ? <DollarSign size={16} /> : <Briefcase size={16} />}
                        {member.funded_status==='DA'?'Demo':member.funded_status==='P1'?'Phase 1':member.funded_status==='P2'?'Phase 2':member.funded_status==='Master'?'Master':member.funded_status==='MPAID'?'Sudah Payout':member.funded_status}
                      </>
                    ) : '— Belum diset'}
                  </div>
                  {!member.funded_status && <div style={{ fontFamily: LP.mono, fontSize: 9, color: '#f97316', marginTop: 4 }}>Klik untuk set →</div>}
                </div>
                {/* Akses Kelas */}
                <div style={{ background: LP.surface, border: `1px solid ${isExpired ? LP.danger + '44' : LP.border}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1, marginBottom: 5 }}>AKSES KELAS</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: isExpired ? LP.danger : LP.primary }}>
                    {isExpired ? 'BERAKHIR' : 'AKTIF'}
                  </div>
                  <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 4 }}>
                    {isTrial && expiryDate
                      ? isExpired
                        ? `Berakhir ${expiryDate.toLocaleDateString('id-ID',{day:'numeric',month:'short'})}`
                        : `${daysLeft} hari lagi`
                      : 'Seumur Hidup'}
                  </div>
                </div>
              </div>

              {/* ── Action banners (compact) ── */}
              {(!member.discord_username || !member.funded_status) && (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {!member.discord_username && (
                    <button onClick={() => setActive('pengaturan')}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#5865F20d', border: '1px solid #5865F233', borderRadius: 8, cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}>
                      <MessageCircle size={16} color="#5865F2" />
                      <span style={{ fontSize: 12, color: LP.text, flex: 1 }}>Hubungkan akun Discord untuk akses server & notifikasi live</span>
                      <span style={{ fontFamily: LP.mono, fontSize: 9, color: '#5865F2', border: '1px solid #5865F244', padding: '3px 8px', borderRadius: 4, flexShrink: 0 }}>HUBUNGKAN ▸</span>
                    </button>
                  )}
                  {!member.funded_status && (
                    <button onClick={() => setActive('funded')}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: LP.primaryTint, border: `1px solid ${LP.primary}33`, borderRadius: 8, cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}>
                      <Rocket size={16} color={LP.primary} />
                      <span style={{ fontSize: 12, color: LP.text, flex: 1 }}>Set status trading kamu — Demo, Phase, Funded, dll</span>
                      <span style={{ fontFamily: LP.mono, fontSize: 9, color: LP.primary, border: `1px solid ${LP.primary}44`, padding: '3px 8px', borderRadius: 4, flexShrink: 0 }}>SET STATUS ▸</span>
                    </button>
                  )}
                </div>
              )}

              {/* ── Banner broker rekomendasi ── */}
              {brokers.length > 0 && (
                <div className="mr-broker-banner" style={{ background: `linear-gradient(135deg,${LP.primaryTint},${LP.bg})`, border: `1px solid ${LP.primary}33`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="mr-broker-icon" style={{ flexShrink: 0 }}><Landmark size={22} color={LP.primary} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: LP.text }}>
                      Cek broker rekomendasi kami
                    </div>
                  </div>
                  <button
                    onClick={() => setActive('tools')}
                    style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: '#fff', background: LP.primary, border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0 }}
                  >
                    Cek Broker ›
                  </button>
                </div>
              )}

              <LanjutkanBelajar
                key={watchRefreshKey}
                memberId={member.id}
                memberTier={member.tier}
              />

              {/* ── My Trading Stats ── */}
              {myJurnalStats ? (
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap' as const, gap: 8 }}>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1 }}>MY TRADING STATS</div>
                    <button onClick={() => setActive('jurnal')} style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, background: 'none', border: `1px solid ${LP.border}`, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>Lihat Jurnal ›</button>
                  </div>
                  {/* Equity gain banner */}
                  <div style={{ marginBottom: 12, padding: '10px 14px', background: myJurnalStats.totalGain >= 0 ? LP.primaryTint : `${LP.danger}14`, border: `1px solid ${myJurnalStats.totalGain >= 0 ? LP.primary + '44' : LP.danger + '44'}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, letterSpacing: 0.8, marginBottom: 2 }}>TOTAL EQUITY GAIN</div>
                      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color: myJurnalStats.totalGain >= 0 ? LP.primary : LP.danger, fontFamily: LP.mono }}>
                        {myJurnalStats.totalGain >= 0 ? '+' : ''}{myJurnalStats.totalGain.toFixed(2)}%
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginBottom: 2 }}>TOTAL PNL</div>
                      <div style={{ fontFamily: LP.mono, fontSize: 16, fontWeight: 700, color: myJurnalStats.totalPnl >= 0 ? LP.primary : LP.danger }}>
                        {myJurnalStats.totalPnl >= 0 ? '+' : ''}${myJurnalStats.totalPnl.toFixed(0)}
                      </div>
                      <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 2 }}>dari ${myJurnalStats.equityAwal.toLocaleString()}</div>
                    </div>
                  </div>
                  {/* Stat grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
                    {[
                      { label: 'TOTAL TRADE', value: myJurnalStats.totalTrades, color: LP.text, mono: true },
                      { label: 'WIN RATE', value: `${myJurnalStats.winRate.toFixed(0)}%`, color: myJurnalStats.winRate >= 50 ? LP.primary : LP.danger, mono: true },
                      { label: 'WIN', value: myJurnalStats.wins, color: LP.primary, mono: true },
                      { label: 'LOSS', value: myJurnalStats.losses, color: LP.danger, mono: true },
                      { label: 'BEST TRADE', value: `$${myJurnalStats.bestTrade >= 0 ? '+' : ''}${myJurnalStats.bestTrade.toFixed(0)}`, color: LP.primary, mono: true },
                      { label: 'WORST TRADE', value: `$${myJurnalStats.worstTrade.toFixed(0)}`, color: LP.danger, mono: true },
                      { label: 'TOP PAIR', value: myJurnalStats.mostTradedPair, color: LP.text, mono: false },
                    ].map(s => (
                      <div key={s.label} style={{ background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontFamily: LP.mono, fontSize: 8, color: LP.muted, letterSpacing: 0.8, marginBottom: 5 }}>{s.label}</div>
                        <div style={{ fontFamily: s.mono ? LP.mono : LP.sans, fontSize: s.label === 'TOP PAIR' ? 12 : 15, fontWeight: 700, color: s.color, letterSpacing: -0.3 }}>{String(s.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <NotebookPen size={22} color={LP.primary} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 9, letterSpacing: 1, marginBottom: 3 }}>MY TRADING STATS</div>
                    <div style={{ fontSize: 12, color: LP.muted }}>Belum ada data jurnal. Mulai isi jurnal trading untuk lihat statistikmu.</div>
                  </div>
                  <button onClick={() => setActive('jurnal')} style={{ marginLeft: 'auto', fontFamily: LP.mono, fontSize: 10, fontWeight: 700, color: '#fff', background: LP.primary, border: 'none', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
                    Buka Jurnal ›
                  </button>
                </div>
              )}

              {/* ── Top 3 Jurnal Trading ── */}
              {jurnalLeaderboard.length > 0 && (
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1 }}>TOP 3 JURNAL TRADING</div>
                    <button onClick={() => setActive('peringkat')} style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, background: 'none', border: `1px solid ${LP.border}`, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>Lihat Semua ›</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {jurnalLeaderboard.slice(0, 3).map((m: any, i: number) => {
                      const rankImgs = ['/rank_1.png', '/rank_2.png', '/rank_3.png'];
                      const isMe = m.id === member.id;
                      const borderColor = i === 0 ? LP.primary + '44' : LP.border;
                      const bgColor = i === 0 ? LP.primaryTint : i === 1 ? `${LP.primary}0d` : LP.surface;
                      return (
                        <div key={m.id} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '12px', textAlign: 'center' as const, position: 'relative' }}>
                          {isMe && <div style={{ position: 'absolute', top: 4, right: 6, fontFamily: LP.mono, fontSize: 7, color: LP.primary, fontWeight: 700 }}>KAMU</div>}
                          <img src={rankImgs[i]} alt={`rank-${i+1}`} style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 4 }}/>
                          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: LP.text }}>{m.nama}</div>
                          <div style={{ fontFamily: LP.mono, fontSize: 16, fontWeight: 800, color: m.gainPct >= 0 ? LP.primary : LP.danger }}>
                            {m.gainPct >= 0 ? '+' : ''}{m.gainPct.toFixed(1)}%
                          </div>
                          <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 2 }}>{m.trades} trade</div>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const myRank = jurnalLeaderboard.findIndex((m: any) => m.id === member.id);
                    return myRank > 2 ? (
                      <div style={{ marginTop: 10, padding: '8px 12px', borderTop: `1px solid ${LP.border}`, fontFamily: LP.mono, fontSize: 10, color: LP.muted, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Posisimu saat ini</span>
                        <span style={{ color: LP.primary, fontWeight: 700 }}>#{myRank + 1} dari {jurnalLeaderboard.length} trader</span>
                      </div>
                    ) : myRank >= 0 ? (
                      <div style={{ marginTop: 10, padding: '8px 12px', borderTop: `1px solid ${LP.border}`, fontFamily: LP.mono, fontSize: 10, color: LP.primary, textAlign: 'center' as const }}>
                        🎉 Kamu ada di Top 3!
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Pengumuman */}
              <div>
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: LP.text }}>Pengumuman Terbaru</div>
                  {/* Discord status - compact */}
                  {member.discord_username && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: LP.primaryTint, border: `1px solid ${LP.primary}33`, borderRadius: 7, marginBottom: 12 }}>
                      <CheckCircle2 size={14} color={LP.primary} />
                      <div style={{ fontSize: 12, color: LP.primary, fontFamily: LP.mono }}>Discord: @{member.discord_username}</div>
                    </div>
                  )}
                  {/* Notifikasi personal (approve/reject advance) */}
                  {notifications.filter((n:any) => !dismissedNotifs.has(n.id)).map((n: any, ni: number) => (
                    <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 8, marginBottom: 8,
                      background: n.type === 'approve' ? LP.primaryTint : n.type === 'reject' ? `${LP.danger}0d` : `${LP.primary}0d`,
                      border: `1px solid ${n.type === 'approve' ? LP.primary + '44' : n.type === 'reject' ? LP.danger + '44' : LP.primary + '33'}` }}>
                      <span style={{ flexShrink: 0 }}>
                        {n.type === 'approve' ? <CheckCircle2 size={18} color={LP.primary} /> : n.type === 'reject' ? <XCircle size={18} color={LP.danger} /> : <Info size={18} color={LP.primary} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3,
                          color: n.type === 'approve' ? LP.primary : n.type === 'reject' ? LP.danger : LP.text }}>
                          {n.type === 'approve' ? 'Request Advanced Disetujui 🎉' : n.type === 'reject' ? 'Request Advanced Ditolak' : 'Informasi'}
                        </div>
                        <div style={{ fontSize: 12, color: LP.muted, lineHeight: 1.6 }}>{n.message}</div>
                        <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, marginTop: 4 }}>
                          {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Pengumuman global */}
                  {announcements.length === 0 && notifications.length === 0 ? (
                    <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 12, padding: '12px 0' }}>Belum ada pengumuman.</div>
                  ) : announcements.map((a: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${LP.border}` }}>
                      <span style={{ flexShrink: 0 }}><Megaphone size={18} color={LP.muted} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {a.judul && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: LP.text }}>{a.judul}</div>}
                        <div style={{ fontSize: 12, color: LP.muted, lineHeight: 1.5 }}>{a.content || a.message || ''}</div>
                        <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, marginTop: 4 }}>
                          {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* ══ KELAS SAYA ══ */}
          {active === 'kelas' && (
            <div style={{ padding: 24, background: LP.bg, minHeight: '100%' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>KELAS SAYA</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: LP.text }}>Kurikulum Saya</h2>
              </div>
              {/* Request Advanced Modal */}
              {showAdvModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <div className='mr-modal mr-modal-anim' style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, boxShadow: LP.shadowMd }}>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>REQUEST NAIK KELAS ADVANCED</div>
                    <h3 className='mr-modal-title' style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: LP.text }}>Ajukan Naik Kelas</h3>
                    <p style={{ color: LP.muted, fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
                      Lampirkan minimal 1 jurnal trading (link atau file) sebagai syarat naik kelas Advanced. Admin akan mereview dan memberikan keputusan.
                    </p>
                    {([
                      { l: 'Jurnal 1', v: jurnal1, s: setJurnal1, idx: 0 },
                      { l: 'Jurnal 2', v: jurnal2, s: setJurnal2, idx: 1 },
                      { l: 'Jurnal 3', v: jurnal3, s: setJurnal3, idx: 2 },
                    ] as {l:string;v:string;s:(v:string)=>void;idx:number}[]).map((f) => (
                      <div key={f.idx} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10 }}>{f.l.toUpperCase()}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {(['link','file'] as const).map(mode => (
                              <button key={mode} onClick={() => {
                                const nm = [...jurnalMode]; nm[f.idx] = mode; setJurnalMode(nm);
                              }} style={{ fontFamily: LP.mono, fontSize: 9, padding: '3px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: jurnalMode[f.idx]===mode ? LP.primary : 'transparent',
                                color: jurnalMode[f.idx]===mode ? '#fff' : LP.muted,
                                border: `1px solid ${jurnalMode[f.idx]===mode ? LP.primary : LP.border}`, borderRadius: 4 }}>
                                {mode === 'link' ? <Link2 size={11} /> : <Paperclip size={11} />}
                                {mode.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                        {jurnalMode[f.idx] === 'link' ? (
                          <input value={f.v} onChange={e => f.s(e.target.value)} placeholder="https://..."
                            style={{ width: '100%', background: LP.bg, border: `1px solid ${LP.border}`, color: LP.text, padding: '9px 14px', fontSize: 13, fontFamily: LP.mono, outline: 'none', borderRadius: 6, boxSizing: 'border-box' as const }}
                            onFocus={e => e.target.style.borderColor = LP.primary} onBlur={e => e.target.style.borderColor = LP.border}/>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: LP.bg, border: `1px dashed ${LP.border}`, borderRadius: 6, padding: '9px 14px', cursor: 'pointer', fontSize: 12, color: jurnalFiles[f.idx] ? LP.primary : LP.muted, fontFamily: LP.mono }}>
                              {jurnalFiles[f.idx] && <Check size={13} />}
                              {jurnalFiles[f.idx] ? jurnalFiles[f.idx]!.name : 'Klik untuk pilih file (PDF/gambar)'}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                                onChange={e => { const nf = [...jurnalFiles]; nf[f.idx] = e.target.files?.[0]||null; setJurnalFiles(nf); }}/>
                            </label>
                            {jurnalFiles[f.idx] && (
                              <button onClick={() => { const nf=[...jurnalFiles]; nf[f.idx]=null; setJurnalFiles(nf); }}
                                style={{ background: 'none', border: 'none', color: LP.danger, cursor: 'pointer', fontSize: 16 }}>×</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {advMsg && <div style={{ fontFamily: LP.mono, color: LP.danger, fontSize: 12, marginBottom: 10 }}>{advMsg}</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button onClick={submitAdvanceRequest} disabled={advSubmitting}
                        style={{ flex: 1, background: advSubmitting ? LP.border : LP.primary, color: '#fff', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, padding: '11px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                        {advSubmitting ? 'MENGIRIM...' : 'KIRIM REQUEST →'}
                      </button>
                      <button onClick={() => { setShowAdvModal(false); setAdvMsg(''); }}
                        style={{ padding: '11px 18px', background: 'none', border: `1px solid ${LP.border}`, color: LP.muted, fontFamily: LP.mono, fontSize: 12, cursor: 'pointer', borderRadius: 6 }}>
                        BATAL
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className='mr-kelas-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {['intro','basic','tips-basic','advanced','tips-advanced'].map(kat => {
                  const isAdvancedKat = kat === 'advanced' || kat === 'tips-advanced';
                  const locked = isAdvancedKat && !member.is_advance;
                  const vids = videos.filter(v => v.kategori === kat);
                  if (!vids.length) return null;
                  const done = vids.filter(v => progress[v.id] === 'selesai').length;
                  const pct  = locked ? 0 : Math.round(done / vids.length * 100);
                  const colors: Record<string,string> = { intro:'#eab308', basic:'#22ab94', 'tips-basic':'#22ab94', advanced:'#7c3aed', 'tips-advanced':'#7c3aed' };
                  const color = locked ? LP.muted : (colors[kat] || LP.primary);
                  return (
                    <div key={kat} style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, opacity: locked ? 0.85 : 1 }}>
                      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${LP.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {locked && <Lock size={13} color={LP.muted} />}
                          <span style={{ fontFamily: LP.mono, color, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{kat.replace('-',' ').toUpperCase()}</span>
                        </div>
                        <span style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10 }}>{locked ? 'Butuh Advanced' : `${done}/${vids.length} · ${pct}%`}</span>
                      </div>
                      <div style={{ height: 3, background: LP.border }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color }}/>
                      </div>
                      {locked ? (
                        <div style={{ padding: '20px 18px', textAlign: 'center' as const }}>
                          <p style={{ color: LP.muted, fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
                            Kelas ini hanya untuk member <strong style={{ color: '#7c3aed' }}>Advanced</strong>.<br/>
                            Ajukan naik kelas dengan melampirkan 3 jurnal trading.
                          </p>
                          {advanceReq?.status === 'pending' ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: LP.mono, fontSize: 11, color: LP.primary, background: LP.primaryTint, border: `1px solid ${LP.primary}44`, padding: '8px 14px', borderRadius: 6 }}>
                              <Clock size={13} />
                              REQUEST SEDANG DIREVIEW ADMIN
                            </div>
                          ) : advanceReq?.status === 'rejected' ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: LP.mono, fontSize: 11, color: LP.danger, background: `${LP.danger}0d`, border: `1px solid ${LP.danger}44`, padding: '8px 14px', borderRadius: 6, marginBottom: 10 }}>
                                <XCircle size={13} />
                                REQUEST DITOLAK — {advanceReq.alasan_tolak?.split('\n')[0] || 'Lihat notifikasi'}
                              </div>
                              <button onClick={() => setShowAdvModal(true)}
                                style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#7c3aed14', border: `1px solid #7c3aed44`, padding: '8px 20px', cursor: 'pointer', borderRadius: 6 }}>
                                AJUKAN ULANG →
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setShowAdvModal(true)}
                              style={{ fontFamily: LP.mono, fontSize: 12, fontWeight: 700, color: '#fff', background: '#7c3aed', padding: '10px 24px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                              REQUEST NAIK KELAS →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ overflowY: 'auto' as const }}>
                          {vids.sort((a,b) => a.urutan - b.urutan).map(v => {
                            const ytId = v.youtube_url?.match(/(?:youtu\.be\/|v=)([^&?/\s]+)/)?.[1];
                            const extUrl = v.youtube_url && !ytId ? v.youtube_url : null; // non-YouTube link
                            const hasVideo = ytId || extUrl;
                            const videoHref = ytId ? `https://youtube.com/watch?v=${ytId}` : extUrl;
                            const s = progress[v.id];
                            const isComingSoon = !v.youtube_url && !v.coming_soon_img;
                            return (
                              <div key={v.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${LP.border}`, transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = LP.bg}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                {/* Status icon */}
                                <div style={{ width: 30, height: 30, background: s==='selesai'?LP.primaryTint:s==='mulai'?'#f9731614':LP.bg, border: `1px solid ${s==='selesai'?LP.primary:s==='mulai'?'#f97316':LP.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                  {s==='selesai' ? <Check size={14} color={LP.primary} /> : s==='mulai' ? <Play size={12} color="#f97316" /> : <Circle size={10} color={LP.muted} />}
                                </div>
                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: s==='selesai'?LP.muted:LP.text, marginBottom: v.deskripsi ? 4 : 0, lineHeight: 1.4 }}>{v.judul}</div>
                                  {v.deskripsi && (
                                    <div style={{ fontSize: 11, color: LP.muted, lineHeight: 1.5, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{v.deskripsi}</div>
                                  )}
                                  {/* Actions row */}
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const }}>
                                    {v.coming_soon_img && !hasVideo && (
                                      <span style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, border: `1px solid ${LP.border}`, padding: '2px 7px', borderRadius: 3 }}>SEGERA</span>
                                    )}
                                    {isComingSoon && !v.coming_soon_img && (
                                      <span style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, border: `1px solid ${LP.border}`, padding: '2px 7px', borderRadius: 3 }}>SEGERA</span>
                                    )}
                                    {hasVideo && (
                                      <>
                                        <a href={videoHref!} target="_blank" rel="noopener noreferrer"
                                          onClick={async () => {
                                            if (s !== 'mulai' && s !== 'selesai') {
                                              await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'mulai' }, { onConflict: 'member_id,video_id' });
                                            }
                                            await trackVideoWatch(member!.id, v.id);
                                            setWatchRefreshKey(k => k + 1);
                                          }}
                                          style={{ fontFamily: LP.mono, fontSize: 10, fontWeight: 700, color: '#fff', background: LP.primary, textDecoration: 'none', padding: '4px 10px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                          <Play size={11} /> TONTON
                                        </a>
                                        {s !== 'selesai' ? (
                                          <button onClick={async () => {
                                            await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'selesai' }, { onConflict: 'member_id,video_id' });
                                            await trackVideoWatch(member!.id, v.id);
                                            setWatchRefreshKey(k => k + 1);
                                            loadData(member!);
                                          }} style={{ fontFamily: LP.mono, fontSize: 10, color: LP.primary, background: LP.primaryTint, border: `1px solid ${LP.primary}44`, padding: '4px 10px', cursor: 'pointer', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Check size={11} /> SELESAI
                                          </button>
                                        ) : (
                                          <button onClick={async () => {
                                            await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'mulai' }, { onConflict: 'member_id,video_id' });
                                            loadData(member!);
                                          }} style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, background: 'transparent', border: `1px solid ${LP.border}`, padding: '4px 10px', cursor: 'pointer', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <RotateCcw size={11} /> RESET
                                          </button>
                                        )}
                                        <div style={{ display:'flex', gap:1 }}>
                                          {[1,2,3,4,5].map(star=>(
                                            <button key={star} onClick={()=>rateVideo(v.id,star)} style={{ background:'none', border:'none', cursor:'pointer', padding:'1px', lineHeight:1, display: 'flex' }}>
                                              <Star size={13} fill={(videoRatings[v.id]||0)>=star ? LP.primary : 'none'} color={(videoRatings[v.id]||0)>=star ? LP.primary : LP.border} />
                                            </button>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ MATERI (File) ══ */}
          {active === 'materi' && (() => {
            async function downloadFile(url: string, name: string) {
              try {
                const res = await fetch(url);
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = name;
                a.click();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
              } catch { window.open(url, '_blank'); }
            }
            const CATS = [
              { id: 'file-basic',   label: 'FILE BASIC',    color: LP.primary },
              { id: 'file-advanced',label: 'FILE ADVANCED', color: '#7c3aed' },
            ];
            return (
            <div style={{ padding: 24, background: LP.bg, minHeight: '100%' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>MATERI</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: LP.text }}>File Materi</h2>
                <p style={{ color: LP.muted, fontSize: 13, margin: '6px 0 0' }}>Download materi dan panduan pendukung pembelajaran.</p>
              </div>
              {CATS.map(cat => {
                const items = files.filter((f: any) => f.kategori === cat.id).sort((a:any,b:any) => a.urutan - b.urutan);
                if (!items.length) return null;
                const isPanduan = cat.id === 'file-panduan';
                return (
                  <div key={cat.id} style={{ background: LP.surface, border: `1px solid ${isPanduan ? '#f59e0b44' : LP.border}`, borderRadius: 12, marginBottom: 14 }}>
                    <div style={{ padding: '12px 20px', borderBottom: `1px solid ${LP.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isPanduan && <BookOpen size={16} color="#f59e0b" />}
                      <span style={{ fontFamily: LP.mono, color: cat.color, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{cat.label}</span>
                      {isPanduan && <span style={{ fontFamily: LP.mono, fontSize: 10, color: '#f59e0b99' }}>— bisa di-download</span>}
                    </div>
                    {items.map((f: any) => {
                      const ext = (f.file_name || f.file_type || '').split('.').pop()?.toUpperCase() || 'FILE';
                      const FileIcon = ext === 'PDF' ? FileText : ext === 'DOCX' || ext === 'DOC' ? FileText : ext === 'PPTX' || ext === 'PPT' ? Presentation : ext === 'XLSX' || ext === 'XLS' ? FileSpreadsheet : File;
                      const fileIconColor = ext === 'PDF' ? '#ef4444' : ext === 'DOCX' || ext === 'DOC' ? '#3b82f6' : ext === 'PPTX' || ext === 'PPT' ? '#f97316' : ext === 'XLSX' || ext === 'XLS' ? LP.primary : LP.muted;
                      return (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${LP.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <FileIcon size={22} color={fileIconColor} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: LP.text }}>{f.judul}</div>
                              <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, marginTop: 2 }}>{f.file_name || ext}</div>
                            </div>
                          </div>
                          {f.file_url && (
                            <button onClick={() => downloadFile(f.file_url, f.file_name || f.judul)}
                              style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: cat.color, background: 'transparent', border: `1px solid ${cat.color}`, padding: '7px 16px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' as const, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Download size={13} /> Download
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {files.length === 0 && (
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: 40, textAlign: 'center' as const, fontFamily: LP.mono, color: LP.muted, fontSize: 13 }}>
                  — Belum ada file materi —
                </div>
              )}
            </div>
            );
          })()}

          {/* ══ LIVE TRADING ══ */}
          {active === 'live' && (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: C.down, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// LIVE TRADING</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Live Trading Session</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[
                  { icon: '📺', title: 'YouTube Live', sub: 'Subscribe & aktifkan notifikasi untuk tahu saat mentor mulai live', href: 'https://youtube.com/@menolakrugi', color: C.down, label: 'TONTON DI YOUTUBE' },
                  { icon: '💬', title: 'Discord Live', sub: 'Ikuti sesi live di channel #live-trading. Diskusi real-time dengan mentor & member', href: DISCORD, color: '#5865F2', label: 'GABUNG DISCORD' },
                  { icon: '📢', title: 'Telegram Channel', sub: 'Notifikasi jadwal live dan update market langsung ke HP kamu', href: TELEGRAM, color: '#229ED9', label: 'JOIN TELEGRAM' },
                  { icon: '📱', title: 'WhatsApp Admin', sub: 'Ada pertanyaan tentang jadwal atau konten live? Hubungi admin langsung', href: WA_ADMIN, color: '#25D366', label: 'HUBUNGI ADMIN' },
                ].map((item, i) => (
                  <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{item.title}</div>
                    <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{item.sub}</div>
                    <a href={item.href} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#000', background: item.color, padding: '9px 18px', textDecoration: 'none', letterSpacing: 0.5 }}>
                      {item.label} ▸
                    </a>
                  </div>
                ))}
              </div>
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// JADWAL LIVE</div>
                {liveSchedules.length === 0 ? (
                  <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 13, padding: '12px 0' }}>
                    Belum ada jadwal. Pantau Discord & Telegram untuk info terbaru.
                  </div>
                ) : liveSchedules.map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ flexShrink: 0, minWidth: 100 }}>
                      <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, fontWeight: 700 }}>{s.hari || s.judul}</div>
                      {s.jam && <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginTop: 2 }}>{s.jam}</div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{s.sesi || s.deskripsi}</div>
                      {s.link && (
                        <a href={s.link} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: C.mono, fontSize: 10, color: G.gold, textDecoration: 'none', border: "1px solid var(--mr-tint-gold-b)", padding: '2px 8px' }}>
                          ▸ GABUNG
                        </a>
                      )}
                    </div>
                    {s.is_active && (
                      <span style={{ fontFamily: C.mono, fontSize: 9, background: C.down, color: '#fff', padding: '2px 6px', borderRadius: 3, fontWeight: 700, flexShrink: 0 }}>LIVE</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ MARKET NEWS ══ */}
          {active === 'news' && (
            <div style={{ padding: 24, background: LP.bg, minHeight: '100%' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>MARKET NEWS</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: LP.text }}>Market Overview & News</h2>
              </div>
              <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: `1px solid ${LP.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 11, letterSpacing: 1 }}>ADVANCED CHART · REALTIME</span>
                  <span style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10 }}>POWERED BY TRADINGVIEW</span>
                </div>
                <div style={{ height: 680 }}>
                  <AdvancedChartWidget/>
                </div>
              </div>
            </div>
          )}

          {/* ══ TOOLS ══ */}
          {active === 'tools' && (
            <div className='mr-content-pad' style={{ padding: 24 }}>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// BROKER & PROP FIRM</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Broker & Prop Firm</h2>
                <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Rekomendasi broker terpercaya dan rules prop firm dari mentor.</p>
              </div>

              {/* Lot Size Calculator — full width, compact */}
              <div style={{ background: 'linear-gradient(135deg,var(--mr-tint-gold),var(--mr-bg))', border: `1px solid var(--mr-tint-gold-b)`, borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 14 }}>// LOT SIZE CALCULATOR</div>
                <LotCalculator/>
              </div>

              {/* Broker Rekomendasi — card grid */}
              {(() => {
                const brokerList = brokers.filter((b: any) => b.jenis !== 'propfirm');
                const propfirmList = brokers.filter((b: any) => b.jenis === 'propfirm');
                const BrokerCard = ({ b }: { b: any }) => (
                  <div key={b.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column' as const, gap: 8, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--mr-tint-gold-b)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {b.logo_url
                        ? <img src={b.logo_url} alt={b.nama} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--mr-tint-gold-b)', background: 'var(--mr-panel)', flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, background: 'var(--mr-tint-gold)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: G.gold, flexShrink: 0, border: "1px solid var(--mr-tint-gold-b)" }}>
                            {b.nama?.[0]?.toUpperCase()}
                          </div>
                      }
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{b.nama}</div>
                        {b.diskon && <div style={{ fontFamily: C.mono, color: C.up, fontSize: 10 }}>🎁 {b.diskon}</div>}
                      </div>
                    </div>
                    {b.deskripsi && <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.55, flex: 1 }}>{b.deskripsi}</div>}
                    {b.link && (
                      <a href={b.link} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'block', textAlign: 'center' as const, fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#000', background: G.gold, padding: '8px', borderRadius: 7, textDecoration: 'none', marginTop: 4 }}>
                        DAFTAR ▸
                      </a>
                    )}
                  </div>
                );
                return (
                  <>
                    {/* Broker section */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// BROKER REKOMENDASI</div>
                      {brokerList.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                          {brokerList.map((b: any) => <BrokerCard key={b.id} b={b} />)}
                        </div>
                      ) : (
                        <div style={{ color: C.dim, fontSize: 13, padding: '20px', background: C.panel, borderRadius: 12, textAlign: 'center' as const }}>
                          Belum ada rekomendasi broker.
                        </div>
                      )}
                    </div>
                    {/* Prop Firm Rekomendasi section */}
                    {propfirmList.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontFamily: C.mono, color: '#a855f7', fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// PROP FIRM REKOMENDASI</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                          {propfirmList.map((b: any) => <BrokerCard key={b.id} b={b} />)}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Prop Firm Rules */}
              {propRules.length > 0 && (
                <div>
                  <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// PROP FIRM RULES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {propRules.map((r: any) => (
                      <div key={r.id} style={{ background: C.panel, border: `1px solid #1e1440`, borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>📋</span>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{r.judul}</div>
                        </div>
                        {r.deskripsi && <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.55 }}>{r.deskripsi}</div>}
                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' as const, flexWrap: 'wrap' as const }}>
                          {r.link && (
                            <a href={r.link} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: '#a855f7', textDecoration: 'none', border: '1px solid #4a2a8a', padding: '5px 12px', borderRadius: 6, background: 'var(--mr-tint-purple)' }}>
                              BUKA LINK ▸
                            </a>
                          )}
                          {r.file_url && (
                            <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: C.up, textDecoration: 'none', border: `1px solid var(--mr-up-a27)`, padding: '5px 12px', borderRadius: 6, background: 'var(--mr-tint-green3)' }}>
                              ⬇ DOWNLOAD
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PENGATURAN ══ */}
          {active === 'pengaturan' && (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// PENGATURAN</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Pengaturan Akun</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
                {/* Info akun */}
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>// INFO AKUN</div>
                  {[
                    { l: 'NAMA', v: member.nama },
                    { l: 'TIER', v: member.tier },
                    { l: 'STATUS', v: member.is_advance ? 'Advance Member' : 'Basic Member' },
                    { l: 'DISCORD', v: member.discord_username || '— belum terhubung' },
                  ].map(f => (
                    <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                      <span style={{ fontFamily: C.mono, color: C.dim, fontSize: 11 }}>{f.l}</span>
                      <span style={{ fontWeight: 600 }}>{f.v}</span>
                    </div>
                  ))}
                </div>

                {/* Ubah password */}
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>// GANTI PASSWORD</div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                    {[
                      { l: 'Password Lama', v: oldPass, s: setOldPass },
                      { l: 'Password Baru', v: newPass, s: setNewPass },
                      { l: 'Konfirmasi Baru', v: confPass, s: setConfPass },
                    ].map(f => (
                      <div key={f.l}>
                        <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>{f.l.toUpperCase()}</div>
                        <input type="password" value={f.v} onChange={e => f.s(e.target.value)} style={inp}
                          onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border2}/>
                      </div>
                    ))}
                    {passErr && <div style={{ background: '#1a0f0f', border: `1px solid ${C.down}`, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, color: C.down, borderRadius: 5 }}>{passErr}</div>}
                    {passMsg && <div style={{ background: 'var(--mr-tint-green)', border: `1px solid ${C.up}`, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, color: C.up, borderRadius: 5 }}>{passMsg}</div>}
                    <button onClick={handleChangePassword} style={{ background: G.gold, color: '#000', fontFamily: C.mono, fontSize: 12, fontWeight: 700, padding: '10px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                      SIMPAN PASSWORD
                    </button>
                  </div>
                </div>

                {/* Link Discord */}
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontFamily: C.mono, color: '#5865F2', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>// DISCORD</div>
                  {member.discord_username ? (
                    <p style={{ color: C.up, fontSize: 13, marginBottom: 14 }}>✓ Terhubung sebagai <strong>@{member.discord_username}</strong></p>
                  ) : (
                    <p style={{ color: C.dim, fontSize: 13, marginBottom: 14 }}>Hubungkan akun Discord kamu via OAuth — role server otomatis diset sesuai tier membership.</p>
                  )}
                  <button onClick={handleConnectDiscordOAuth} style={{ background: '#5865F2', color: '#fff', fontFamily: C.mono, fontSize: 12, fontWeight: 700, padding: '9px 18px', border: 'none', cursor: 'pointer', borderRadius: 6, marginBottom: 16 }}>
                    {member.discord_username ? 'HUBUNGKAN ULANG (OAUTH)' : 'HUBUNGKAN VIA DISCORD OAUTH'}
                  </button>

                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                    <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>ATAU ISI USERNAME MANUAL (opsional, tanpa auto-role)</div>
                    <input value={discordId || member.discord_username || ''} onChange={e => setDiscordId(e.target.value)}
                      placeholder="contoh: username#1234 atau @username" style={inp}
                      onFocus={e => e.target.style.borderColor = '#5865F2'} onBlur={e => e.target.style.borderColor = C.border2}/>
                  </div>
                  {settingMsg && <div style={{ fontFamily: C.mono, color: C.up, fontSize: 12, margin: '8px 0' }}>{settingMsg}</div>}
                  <button onClick={handleSaveDiscord} style={{ marginTop: 10, background: 'transparent', color: '#5865F2', fontFamily: C.mono, fontSize: 12, fontWeight: 700, padding: '9px 18px', border: '1px solid #5865F2', cursor: 'pointer', borderRadius: 6 }}>
                    SIMPAN MANUAL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ STATUS TRADING ══ */}
          {active === 'funded' && (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// STATUS TRADING</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Status Trading Kamu</h2>
                <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Pilih status trading kamu. Nickname Discord otomatis diupdate sesuai status yang dipilih.</p>
              </div>

              {/* Current status banner */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 4 }}>STATUS SAAT INI</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: selectedStatus ? G.gold : C.dim }}>
                    {selectedStatus ? `${selectedStatus} — ${
                      selectedStatus === 'DA' ? 'Demo Account' :
                      selectedStatus === 'P1' ? 'Phase 1' :
                      selectedStatus === 'P2' ? 'Phase 2' :
                      selectedStatus === 'Master' ? 'Master' :
                      selectedStatus === 'MPAID' ? 'Sudah Payout' :
                      selectedStatus === 'Ap' ? 'Akun Pribadi' : selectedStatus
                    }` : 'Belum diset'}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginTop: 4 }}>
                    Nickname Discord: <span style={{ color: C.text }}>[{
                      member.tier === 'SMC Platinum 1 on 1' ? '💎' :
                      member.tier === 'SMC Gold Mentorship' ? '🥇' :
                      member.tier === 'SMC Silver' ? '🥈' :
                      member.tier === 'SMC Bronze' ? '🥉' : '🕒'
                    }]{member.nama.trim().split(/\s+/)[0]}_ᴾᵀᴹᴿ{
                      selectedStatus === 'DA' ? '·DA' :
                      selectedStatus === 'P1' ? '·P1' :
                      selectedStatus === 'P2' ? '·P2' :
                      selectedStatus === 'Master' ? '·MST' :
                      selectedStatus === 'MPAID' ? '·MPAID' :
                      selectedStatus === 'Ap' ? '·Ap' : ''
                    }</span>
                  </div>
                </div>
                {!member.discord_username && (
                  <div style={{ fontFamily: C.mono, fontSize: 11, color: '#f97316', background: '#1a0f00', border: '1px solid #3a2000', padding: '8px 12px', borderRadius: 6 }}>
                    ⚠ Discord belum<br/>terhubung
                  </div>
                )}
              </div>

              {/* Status grid */}
              <div className='mr-funded-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {([
                  { key: 'DA',     label: 'Demo Account',  desc: 'Sedang trading di akun demo',   color: '#3b82f6' },
                  { key: 'P1',     label: 'Phase 1',       desc: 'Challenge phase pertama',       color: '#a855f7' },
                  { key: 'P2',     label: 'Phase 2',       desc: 'Challenge phase kedua',         color: '#f59e0b' },
                  { key: 'Master', label: 'Master',        desc: 'Lolos phase 2',                 color: '#22ab94' },
                  { key: 'MPAID',  label: 'Sudah Payout',  desc: 'Berhasil withdrawal pertama',   color: '#eab308' },
                  { key: 'Ap',     label: 'Akun Pribadi',  desc: 'Trading dengan akun sendiri',   color: '#ec4899' },
                ] as {key:string;label:string;desc:string;color:string}[]).map(s => {
                  const isSelected = selectedStatus === s.key;
                  return (
                    <button key={s.key} onClick={() => setSelectedStatus(s.key)}
                      style={{ background: isSelected ? `${s.color}18` : C.panel,
                        border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? s.color : C.border}`,
                        borderRadius: 12, padding: '16px', textAlign: 'left' as const, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: isSelected ? s.color : C.text, marginBottom: 4 }}>{s.key}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? s.color : C.text, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.4 }}>{s.desc}</div>
                      {isSelected && <div style={{ fontFamily: C.mono, fontSize: 9, color: s.color, marginTop: 6 }}>● DIPILIH</div>}
                    </button>
                  );
                })}
              </div>

              {/* Clear button */}
              <button onClick={() => setSelectedStatus(null)}
                style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, background: 'transparent', border: `1px solid ${C.border}`, padding: '6px 14px', cursor: 'pointer', borderRadius: 6, marginBottom: 16 }}>
                × Hapus Status
              </button>

              {/* Save button */}
              {statusMsg && (
                <div style={{ fontFamily: C.mono, fontSize: 12, color: statusMsg.includes('Gagal') || statusMsg.includes('Tidak') ? C.down : C.up, marginBottom: 12, padding: '8px 14px', background: C.bg, borderRadius: 6 }}>
                  {statusMsg}
                </div>
              )}
              <button onClick={() => handleUpdateStatus(selectedStatus)} disabled={statusSaving}
                style={{ background: statusSaving ? 'var(--mr-border2)' : G.gold, color: statusSaving ? 'var(--mr-dim)' : '#000', fontFamily: C.mono, fontSize: 13, fontWeight: 700, padding: '12px 28px', border: 'none', cursor: statusSaving ? 'not-allowed' : 'pointer', borderRadius: 8 }}>
                {statusSaving ? 'MENYIMPAN...' : '▸ SIMPAN & UPDATE DISCORD'}
              </button>

              {!member.discord_username && (
                <p style={{ color: C.dim, fontSize: 12, marginTop: 12, fontFamily: C.mono }}>
                  ⚠ Discord belum terhubung — status tersimpan tapi nickname tidak berubah. Hubungkan di menu Pengaturan.
                </p>
              )}
            </div>
          )}

          {/* ══ SERTIFIKAT ══ */}
          {/* ══ PERINGKAT ══ */}
        {active === 'peringkat' && member && (
          <div style={{ padding: 24 }}>
            <LeaderboardPage memberId={member.id} onViewJurnal={viewMemberJurnal} />
          </div>
        )}

        {/* ══ JURNAL TRADING ══ */}
        {active === 'jurnal' && member && (
          <JurnalPage memberId={member.id} />
        )}

        {active === 'trading-plan' && (
          <MemberTradingPlan />
        )}

        {active === 'competition' && (
          <CompetitionPage embedded onGoToJurnal={() => setActive('jurnal')} />
        )}


        {active === 'sertifikat' && (() => {
            const isAdvanced = member.is_advance;
            const certDate = advanceReq?.updated_at
              ? new Date(advanceReq.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

            function downloadCertificate() {
              const canvas = document.getElementById('mr-cert-canvas') as HTMLCanvasElement;
              if (!canvas) return;
              const link = document.createElement('a');
              link.download = `Sertifikat_Advanced_${member?.nama.replace(/\s+/g,'_')}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
            }

            return (
              <div className='mr-content-pad' style={{ padding: 24 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// SERTIFIKAT</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Sertifikat Naik Kelas</h2>
                <p style={{ color: C.dim, fontSize: 13, margin: '0 0 24px' }}>
                  {isAdvanced ? 'Selamat! Kamu sudah naik kelas Advanced. Download sertifikat kamu di bawah.' : 'Sertifikat tersedia setelah kamu naik kelas Advanced.'}
                </p>

                {!isAdvanced ? (
                  /* Locked state */
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: '48px 24px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Belum Bisa Diakses</div>
                    <div style={{ color: C.dim, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                      Sertifikat ini hanya untuk member yang sudah naik kelas <strong style={{ color: '#a855f7' }}>Advanced</strong>.<br/>
                      Selesaikan materi Basic dan ajukan request naik kelas.
                    </div>
                    <button onClick={() => setActive('kelas')}
                      style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: '#000', background: '#a855f7', padding: '10px 24px', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
                      LIHAT KELAS SAYA →
                    </button>
                  </div>
                ) : (
                  /* Certificate */
                  <div>
                    {/* Canvas certificate */}
                    <div style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 14, padding: 24, marginBottom: 20, overflow: 'auto' }}>
                      <CertificateCanvas
                        nama={member.nama}
                        tier={member.tier}
                        tanggal={certDate}
                      />
                    </div>
                    <button onClick={downloadCertificate}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: '#fff', background: G.gold, padding: '13px 28px', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
                      ⬇ DOWNLOAD SERTIFIKAT (PNG)
                    </button>
                    <p style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginTop: 10 }}>
                      File PNG berkualitas tinggi, bisa dishare di sosial media.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ══ 1-ON-1 MENTORING ══ */}
          {active === '1on1' && (() => {
            const ELIGIBLE_TIERS = ['gold', 'platinum', 'SMC Gold Mentorship', 'SMC Platinum 1-on-1', 'SMC Platinum 1 on 1'];
            const isEligible = ELIGIBLE_TIERS.includes(member.tier);
            const hasPending = oneOnOneRequests.some(r => r.status === 'pending');

            const statusBadge = (s: string) => {
              const map: Record<string, { c: string; t: string; icon: string }> = {
                pending:  { c: G.gold,  t: 'MENUNGGU REVIEW',  icon: '⏳' },
                approved: { c: C.up,    t: 'DISETUJUI',        icon: '✓' },
                rejected: { c: C.down,  t: 'DITOLAK',          icon: '✕' },
              };
              const x = map[s] || { c: C.muted, t: s?.toUpperCase() || '—', icon: '?' };
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: C.mono, fontSize: 9, fontWeight: 700, color: x.c, background: `${x.c}18`, border: `1px solid ${x.c}33`, padding: '3px 10px', borderRadius: 4 }}>
                  {x.icon} {x.t}
                </span>
              );
            };

            if (!isEligible) {
              return (
                <div className='mr-content-pad' style={{ padding: 24 }}>
                  <div style={{ fontFamily: C.mono, color: '#eab308', fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// 1-ON-1 MENTORING</div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Sesi 1-on-1 dengan Mentor</h2>
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: '48px 24px', textAlign: 'center' as const, marginTop: 20 }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Fitur Eksklusif Gold & Platinum</div>
                    <div style={{ color: C.dim, fontSize: 14, marginBottom: 8, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
                      Sesi 1-on-1 tersedia untuk member <strong style={{ color: '#eab308' }}>SMC Gold Mentorship</strong> ke atas.<br/>
                      Kamu bisa berdiskusi langsung dengan mentor sesuai topik yang kamu tentukan.
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '10px 20px', display: 'inline-block', marginBottom: 24 }}>
                      Tier kamu saat ini: <span style={{ color: G.gold, fontWeight: 700 }}>{member.tier}</span>
                    </div>
                    <br/>
                    <a href="/checkout" style={{ display: 'inline-block', fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: '#000', background: '#eab308', padding: '11px 28px', textDecoration: 'none', borderRadius: 8 }}>
                      UPGRADE KE GOLD ▸
                    </a>
                  </div>
                </div>
              );
            }

            return (
              <div className='mr-content-pad' style={{ padding: 24 }}>
                <div style={{ fontFamily: C.mono, color: '#eab308', fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// 1-ON-1 MENTORING</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Sesi 1-on-1 dengan Mentor</h2>
                <p style={{ color: C.dim, fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
                  Ajukan request sesi 1-on-1 bersama mentor. Admin akan mereview dan menetapkan jadwal setelah disetujui.
                </p>

                {/* Form pengajuan */}
                <div style={{ background: C.panel, border: `1px solid ${hasPending ? '#eab30844' : C.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
                  <div style={{ fontFamily: C.mono, color: '#eab308', fontSize: 11, letterSpacing: 1, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>// AJUKAN REQUEST BARU</span>
                    {hasPending && <span style={{ fontSize: 10, color: G.gold, background: 'var(--mr-tint-gold)', padding: '3px 10px', borderRadius: 4, border: '1px solid var(--mr-tint-gold-b)' }}>⏳ Ada request pending</span>}
                  </div>

                  {hasPending ? (
                    <div style={{ fontFamily: C.mono, fontSize: 12, color: C.dim, padding: '16px 0' }}>
                      Kamu masih memiliki request yang sedang direview admin. Tunggu hasilnya sebelum mengajukan request baru.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                      {/* Syarat */}
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: C.dim, background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '10px 14px', lineHeight: 1.7 }}>
                        📋 <strong style={{ color: C.text }}>Syarat pengajuan:</strong> Minimal tier SMC Gold Mentorship · Isi nickname Discord dan topik yang ingin dibahas
                      </div>

                      <div>
                        <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 6 }}>NICKNAME DISCORD *</div>
                        <input
                          value={oonDiscord}
                          onChange={e => setOonDiscord(e.target.value)}
                          placeholder="contoh: username#1234 atau username"
                          style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '10px 12px', borderRadius: 7, fontFamily: C.mono, fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }}
                          onFocus={e => e.target.style.borderColor = '#eab308'}
                          onBlur={e => e.target.style.borderColor = C.border2}
                        />
                      </div>

                      <div>
                        <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 6 }}>TOPIK YANG INGIN DIBAHAS *</div>
                        <textarea
                          value={oonTopic}
                          onChange={e => setOonTopic(e.target.value)}
                          placeholder="Jelaskan topik atau pertanyaan yang ingin kamu diskusikan dengan mentor..."
                          rows={4}
                          style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '10px 12px', borderRadius: 7, fontFamily: C.mono, fontSize: 12, resize: 'vertical' as const, outline: 'none', boxSizing: 'border-box' as const, lineHeight: 1.6 }}
                          onFocus={e => e.target.style.borderColor = '#eab308'}
                          onBlur={e => e.target.style.borderColor = C.border2}
                        />
                      </div>

                      {oonMsg && (
                        <div style={{ fontFamily: C.mono, fontSize: 11, color: oonMsg.startsWith('Gagal') ? C.down : C.up, background: oonMsg.startsWith('Gagal') ? '#1a0a0a' : 'var(--mr-tint-green)', border: `1px solid ${oonMsg.startsWith('Gagal') ? C.down + '44' : C.up + '44'}`, padding: '10px 14px', borderRadius: 7 }}>
                          {oonMsg}
                        </div>
                      )}

                      <button
                        onClick={submitOneOnOne}
                        disabled={oonSubmitting}
                        style={{ background: oonSubmitting ? C.border2 : '#eab308', color: oonSubmitting ? C.dim : '#000', fontFamily: C.mono, fontSize: 12, fontWeight: 700, padding: '11px 24px', border: 'none', cursor: oonSubmitting ? 'not-allowed' : 'pointer', borderRadius: 8, alignSelf: 'flex-start' as const }}>
                        {oonSubmitting ? 'MENGIRIM...' : '▸ KIRIM REQUEST'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Riwayat request */}
                {oneOnOneRequests.length > 0 && (
                  <div>
                    <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// RIWAYAT REQUEST</div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                      {oneOnOneRequests.map(r => (
                        <div key={r.id} style={{ background: C.panel, border: `1px solid ${r.status === 'pending' ? '#eab30844' : r.status === 'approved' ? C.up + '33' : C.border}`, borderRadius: 12, padding: 18 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                            <div>
                              <div style={{ fontFamily: C.mono, fontSize: 10, color: C.dim, marginBottom: 4 }}>
                                {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Discord: <span style={{ color: '#a855f7' }}>@{r.discord_nickname}</span></div>
                              <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>{r.topic}</div>
                            </div>
                            {statusBadge(r.status)}
                          </div>

                          {r.status === 'approved' && r.scheduled_at && (
                            <div style={{ fontFamily: C.mono, fontSize: 11, color: C.up, background: 'var(--mr-tint-green)', border: `1px solid ${C.up}33`, padding: '10px 14px', borderRadius: 7, marginTop: 8 }}>
                              📅 Jadwal: <strong>{new Date(r.scheduled_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                              <div style={{ marginTop: 4, color: C.dim, fontSize: 10 }}>Siapkan pertanyaanmu. Admin akan menghubungi via Discord.</div>
                            </div>
                          )}

                          {r.status === 'rejected' && r.rejection_reason && (
                            <div style={{ fontFamily: C.mono, fontSize: 11, color: C.down, background: '#1a0a0a', border: `1px solid ${C.down}33`, padding: '10px 14px', borderRadius: 7, marginTop: 8 }}>
                              ❌ Alasan: {r.rejection_reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {oneOnOneRequests.length === 0 && !hasPending && (
                  <div style={{ fontFamily: C.mono, fontSize: 12, color: C.dim, padding: '16px 0', textAlign: 'center' as const }}>
                    Belum ada request. Isi form di atas untuk mengajukan sesi 1-on-1 pertamamu.
                  </div>
                )}
              </div>
            );
          })()}

          {/* ══ PRODUK ══ */}
          {active === 'produk' && (
            <div className="mr-content-pad" style={{ padding: 24 }}>
              {/* Header + toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
                <div>
                  <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// TOKO PRODUK</div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Produk Indikator</h2>
                  <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Indikator TradingView eksklusif dari Menolak Rugi.</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['katalog','pesanan'] as const).map(v => (
                    <button key={v} onClick={() => setProdView(v)}
                      style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, padding: '7px 18px', border: `1px solid ${prodView === v ? G.gold : C.border}`, background: prodView === v ? 'var(--mr-tint-gold)' : 'transparent', color: prodView === v ? G.gold : C.muted, cursor: 'pointer', borderRadius: 8 }}>
                      {v === 'katalog' ? '📦 Katalog' : '🧾 Pesanan Saya'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Katalog ── */}
              {prodView === 'katalog' && (
                <>
                  {!products.length && (
                    <div style={{ textAlign: 'center' as const, padding: '60px 20px', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>
                      Belum ada produk tersedia saat ini.
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 24 }}>
                    {products.map(p => {
                      const tierMember = normalizeTier(member?.tier || '');
                      const bisaOrder  = (p.tier_access || []).includes(tierMember);
                      const tglRilis   = p.tanggal_rilis ? new Date(p.tanggal_rilis).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
                      const plans = ([
                        { plan: 'bulanan'  as const, label: 'Bulanan',  h: p.harga_bulanan,  d: p.diskon_bulanan  },
                        { plan: 'tahunan'  as const, label: 'Tahunan',  h: p.harga_tahunan,  d: p.diskon_tahunan  },
                        { plan: 'lifetime' as const, label: 'Lifetime', h: p.harga_lifetime, d: p.diskon_lifetime },
                      ]).filter(r => r.h);
                      return (
                        <div key={p.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
                          <div style={{ aspectRatio: '16/9', background: C.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' as const }}>
                            {!p.gambar_url && extractYtId(p.video_url)
                              ? <iframe
                                  src={`https://www.youtube.com/embed/${extractYtId(p.video_url)}?autoplay=1&mute=1&rel=0&modestbranding=1&controls=1`}
                                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                  allow="autoplay; encrypted-media; picture-in-picture"
                                  allowFullScreen
                                  title={p.nama}
                                />
                              : p.gambar_url
                                ? <img src={p.gambar_url} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }}/>
                                : <span style={{ fontSize: 48 }}>📊</span>
                            }
                          </div>
                          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column' as const, flex: 1, gap: 12 }}>
                            <div>
                              {p.status === 'preorder'
                                ? <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#eab308', background: '#1a150022', border: '1px solid #eab30844', padding: '4px 12px', borderRadius: 6 }}>
                                    ⏳ PRE-ORDER{tglRilis ? ` · Rilis ${tglRilis}` : ''}
                                  </span>
                                : <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: C.up, background: 'var(--mr-tint-up,#0a1a0e)', border: `1px solid ${C.up}33`, padding: '4px 12px', borderRadius: 6 }}>
                                    ✅ TERSEDIA
                                  </span>
                              }
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 19 }}>{p.nama}</div>
                            <div style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, display: '-webkit-box' as any, WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{p.deskripsi}</div>
                            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, marginTop: 4 }}>
                              {plans.map(row => {
                                const finalH = row.d ? Math.round(row.h * (1 - row.d / 100)) : row.h;
                                return (
                                  <div key={row.plan} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, gap: 8 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
                                      <span style={{ fontFamily: C.mono, fontSize: 10, color: C.dim }}>{row.label}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {row.d && <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textDecoration: 'line-through' }}>Rp{Number(row.h).toLocaleString('id-ID')}</span>}
                                        <span style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: row.d ? C.down : C.text }}>Rp{Number(finalH).toLocaleString('id-ID')}</span>
                                        {row.d && <span style={{ fontFamily: C.mono, fontSize: 9, color: C.down, border: `1px solid ${C.down}44`, padding: '1px 5px', borderRadius: 4 }}>-{row.d}%</span>}
                                      </div>
                                    </div>
                                    {bisaOrder && (
                                      <button onClick={() => { setKodeDiskon(''); setKodeDiskonData(null); setKodeErr(''); setOrderModal({ ...p, _selectedPlan: row.plan, _selectedLabel: row.label, _selectedHarga: finalH, _hargaBase: row.h }); }}
                                        style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, padding: '6px 14px', background: G.gold, color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                                        Pilih
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                              {!bisaOrder && (
                                <button disabled style={{ width: '100%', padding: '10px', fontFamily: C.mono, fontSize: 12, fontWeight: 700, background: C.sidebar, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'not-allowed', marginTop: 4 }}>
                                  🔒 Upgrade Tier untuk Order
                                </button>
                              )}
                            </div>
                            {p.panduan_url && (
                              <button onClick={async () => {
                                try {
                                  const res = await fetch(p.panduan_url);
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url; a.download = p.panduan_name || 'panduan.pdf'; a.click();
                                  setTimeout(() => URL.revokeObjectURL(url), 10000);
                                } catch { window.open(p.panduan_url, '_blank'); }
                              }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 8, padding: '10px', fontFamily: C.mono, fontSize: 12, fontWeight: 700, background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b55', borderRadius: 8, cursor: 'pointer' }}>
                                📘 ↓ Download Panduan
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Pesanan Saya ── */}
              {prodView === 'pesanan' && (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  {!myOrders.length
                    ? <div style={{ textAlign: 'center' as const, padding: '60px 20px', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Belum ada pesanan.</div>
                    : myOrders.map(o => {
                        const sc = o.status === 'aktif' ? C.up : o.status === 'dibayar' ? '#3b82f6' : '#eab308';
                        const label = o.status === 'aktif' ? 'Aktif' : o.status === 'dibayar' ? 'Dibayar' : 'Pending';
                        return (
                          <div key={o.id} style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const }}>
                            <div style={{ flex: 1, minWidth: 160 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{(o as any).products?.nama || '—'}</div>
                              {o.plan_type && <span style={{ display: 'inline-block', fontFamily: C.mono, fontSize: 10, color: G.gold, border: `1px solid ${G.gold}44`, padding: '2px 8px', borderRadius: 4, marginBottom: 4 }}>{o.plan_type.toUpperCase()}</span>}
                              <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>
                                {new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              {o.kode_diskon && <div style={{ fontFamily: C.mono, fontSize: 10, color: '#16a34a', marginTop: 2 }}>🎟️ {o.kode_diskon} (-{o.diskon_applied}%)</div>}
                              {o.catatan && <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginTop: 4 }}>💬 {o.catatan}</div>}
                            </div>
                            <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: sc, border: `1px solid ${sc}44`, padding: '4px 12px', borderRadius: 20, flexShrink: 0 }}>
                              {label}
                            </span>
                          </div>
                        );
                      })
                  }
                </div>
              )}

              {/* ── Modal konfirmasi order ── */}
              {/* ── Step 1: Konfirmasi Order ── */}
              {orderModal && modalStep === 'konfirmasi' && (()=>{
                const hargaBase  = orderModal._hargaBase;
                const finalHarga = kodeDiskonData
                  ? Math.round(hargaBase * (1 - kodeDiskonData.diskon / 100))
                  : orderModal._selectedHarga;
                const kodeAktif = !!kodeDiskonData;
                return (
                  <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) closeOrderModal(); }}>
                    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, maxWidth: 420, width: '100%' }}>
                      <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// KONFIRMASI ORDER · LANGKAH 1/2</div>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{orderModal.nama}</div>
                      <div style={{ color: C.dim, fontSize: 13, marginBottom: 16 }}>{orderModal.deskripsi}</div>
                      {orderModal.status === 'preorder' && orderModal.tanggal_rilis && (
                        <div style={{ background: '#1a150022', border: '1px solid #eab30833', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontFamily: C.mono, fontSize: 12, color: '#eab308' }}>
                          ⏳ Pre-order · Tersedia: {new Date(orderModal.tanggal_rilis).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                      <div style={{ background: C.bg, border: `1px solid ${kodeAktif ? G.gold : C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>Paket</div>
                            <div style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, color: C.text }}>{orderModal._selectedLabel}</div>
                          </div>
                          <div style={{ textAlign: 'right' as const }}>
                            {kodeAktif && <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textDecoration: 'line-through' }}>Rp{Number(orderModal._selectedHarga).toLocaleString('id-ID')}</div>}
                            <div style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700, color: G.gold }}>Rp{Number(finalHarga).toLocaleString('id-ID')}</div>
                            {kodeAktif && <div style={{ fontFamily: C.mono, fontSize: 10, color: '#16a34a' }}>Hemat {kodeDiskonData.diskon}% dengan kode</div>}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginBottom: 6 }}>Punya kode diskon? (opsional)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input value={kodeDiskon} onChange={e=>{ setKodeDiskon(e.target.value.toUpperCase()); setKodeDiskonData(null); setKodeErr(''); }}
                            onKeyDown={e=>{ if(e.key==='Enter') cekKodeDiskon(); }}
                            placeholder="MASUKKAN KODE"
                            style={{ flex: 1, background: C.bg, border: `1px solid ${kodeDiskonData ? '#16a34a' : kodeErr ? '#ef4444' : C.border}`, color: C.text, padding: '9px 14px', fontSize: 13, fontFamily: C.mono, outline: 'none', borderRadius: 8, letterSpacing: 1 }}/>
                          <button onClick={cekKodeDiskon} disabled={kodeLoading || !kodeDiskon.trim()}
                            style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 12, fontWeight: 700, background: 'transparent', color: G.gold, border: `1px solid ${G.gold}`, borderRadius: 8, cursor: kodeLoading || !kodeDiskon.trim() ? 'not-allowed' : 'pointer', opacity: !kodeDiskon.trim() ? 0.4 : 1, whiteSpace: 'nowrap' as const }}>
                            {kodeLoading ? '...' : 'Terapkan'}
                          </button>
                        </div>
                        {kodeDiskonData && <div style={{ fontFamily: C.mono, fontSize: 11, color: '#16a34a', marginTop: 6 }}>✅ Kode valid — diskon {kodeDiskonData.diskon}% diterapkan</div>}
                        {kodeErr && <div style={{ fontFamily: C.mono, fontSize: 11, color: '#ef4444', marginTop: 6 }}>❌ {kodeErr}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => buatOrder(orderModal, orderModal._selectedPlan, kodeDiskonData)} disabled={orderLoading}
                          style={{ flex: 1, padding: '12px', fontFamily: C.mono, fontSize: 13, fontWeight: 700, background: G.gold, color: '#000', border: 'none', borderRadius: 10, cursor: orderLoading ? 'not-allowed' : 'pointer', opacity: orderLoading ? 0.6 : 1 }}>
                          {orderLoading ? 'Memproses...' : 'Lanjutkan ke Pembayaran →'}
                        </button>
                        <button onClick={closeOrderModal}
                          style={{ padding: '12px 20px', fontFamily: C.mono, fontSize: 13, background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer' }}>
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Step 2: Detail Pembayaran ── */}
              {pendingOrder && modalStep === 'pembayaran' && (
                <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, maxWidth: 440, width: '100%' }}>
                    <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// DETAIL PEMBAYARAN · LANGKAH 2/2</div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Transfer ke Rekening Berikut</div>

                    {/* Ringkasan order */}
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>Produk</div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{pendingOrder.products?.nama}</div>
                        </div>
                        <div style={{ textAlign: 'right' as const }}>
                          <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>Paket {pendingOrder._labelPlan}</div>
                          <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700, color: G.gold }}>Rp{Number(pendingOrder._harga).toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                      {pendingOrder._appliedCode && (
                        <div style={{ fontFamily: C.mono, fontSize: 10, color: '#16a34a', borderTop: `1px solid ${C.border}`, paddingTop: 6, marginTop: 6 }}>
                          🎟️ Kode {pendingOrder._appliedCode.kode} (-{pendingOrder._appliedCode.diskon}%) diterapkan
                        </div>
                      )}
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, marginTop: 4 }}>Order ID: {pendingOrder.id}</div>
                    </div>

                    {/* Metode pembayaran */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginBottom: 10 }}>// PILIH METODE PEMBAYARAN</div>
                      {!paymentMethods.length ? (
                        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', fontFamily: C.mono, fontSize: 12, color: C.muted }}>
                          Info rekening belum dikonfigurasi. Hubungi admin.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                          {paymentMethods.map(pm => (
                            <div key={pm.id} style={{ background: '#0a1a0e', border: '1px solid #16a34a33', borderRadius: 10, padding: '14px 16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: C.text }}>{pm.nama_bank}</span>
                                {pm.jenis !== 'qris' && <span style={{ fontFamily: C.mono, fontSize: 12, color: C.muted }}>a.n. {pm.nama_rekening}</span>}
                              </div>
                              {pm.jenis === 'qris' ? (
                                <img src={pm.qris_image_url} alt={`QRIS ${pm.nama_bank}`}
                                  style={{ width: '100%', maxWidth: 280, height: 280, objectFit: 'contain', background: '#fff', borderRadius: 8, border: `1px solid ${C.border}` }} />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontFamily: C.mono, fontSize: 17, fontWeight: 700, letterSpacing: 2, color: C.text }}>{pm.nomor_rekening}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(pm.nomor_rekening); setRekCopied(pm.id); setTimeout(() => setRekCopied(''), 2000); }}
                                    style={{ fontFamily: C.mono, fontSize: 11, padding: '4px 12px', background: rekCopied === pm.id ? '#16a34a' : 'transparent', color: rekCopied === pm.id ? '#000' : '#16a34a', border: '1px solid #16a34a', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}>
                                    {rekCopied === pm.id ? '✓ Disalin' : 'Salin'}
                                  </button>
                                </div>
                              )}
                              {pm.catatan && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #16a34a22', fontFamily: C.mono, fontSize: 10, color: C.dim, lineHeight: 1.6 }}>
                                  📋 {pm.catatan}
                                </div>
                              )}
                            </div>
                          ))}
                          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>Nominal yang ditransfer</span>
                            <span style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700, color: G.gold }}>Rp{Number(pendingOrder._harga).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                      <button onClick={konfirmasiKePembayaranWA}
                        style={{ width: '100%', padding: '13px', fontFamily: C.mono, fontSize: 13, fontWeight: 700, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
                        ✅ Konfirmasi Pembayaran ke WA Admin
                      </button>
                      <button onClick={closeOrderModal}
                        style={{ width: '100%', padding: '11px', fontFamily: C.mono, fontSize: 12, background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer' }}>
                        Tutup (pembayaran bisa dikonfirmasi nanti)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ KOMUNITAS ══ */}
          {active === 'komunitas' && (
            <div className='mr-content-pad' style={{ padding: 24 }}>
              <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// KOMUNITAS</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Komunitas Menolak Rugi</h2>
              <p style={{ color: C.dim, fontSize: 13, margin: '0 0 24px' }}>Ikuti semua platform kami untuk update market, edukasi, dan diskusi bersama member lain.</p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {([
                  { name: 'Discord', handle: 'Server Komunitas', desc: 'Diskusi market, tanya mentor, share setup, notif live trading.', href: 'https://discord.gg/d2Tpf6sGMr', color: '#5865F2', label: 'GABUNG SERVER', emoji: '💬' },
                  { name: 'Telegram', handle: '@menolakrugi', desc: 'Update cepat, pengumuman, dan info jadwal live.', href: 'https://t.me/+_azyX2h9oFhmNjNl', color: '#229ED9', label: 'JOIN CHANNEL', emoji: '📨' },
                  { name: 'TikTok', handle: '@menolakrugi', desc: 'Konten edukasi SMC, analisa harian, tips psikologi trading.', href: 'https://www.tiktok.com/@menolakrugi', color: '#ff0050', label: 'FOLLOW', emoji: '🎵' },
                  { name: 'YouTube', handle: '@menolakrugi', desc: 'Live session, replay analisa, video tutorial SMC lengkap.', href: 'https://youtube.com/@menolakrugi', color: '#FF0000', label: 'SUBSCRIBE', emoji: '▶️' },
                  { name: 'WhatsApp Admin', handle: '+62 812-4222-4939', desc: 'Hubungi admin untuk pertanyaan membership atau kendala akses.', href: 'https://wa.me/6281242224939', color: '#25D366', label: 'CHAT ADMIN', emoji: '📱' },
                ] as {name:string;handle:string;desc:string;href:string;color:string;label:string;emoji:string}[]).map(s => (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, textDecoration: 'none', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = s.color + '66'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                    <div style={{ width: 44, height: 44, background: s.color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                      {s.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 2 }}>{s.name}</div>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: s.color, marginBottom: 4 }}>{s.handle}</div>
                      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>{s.desc}</div>
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: s.color, border: `1px solid ${s.color}55`, padding: '5px 12px', borderRadius: 6, flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                      {s.label} ▸
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ══ ULASAN ══ */}
          {active === 'ulasan' && (() => {
            const STATUS_LABEL: Record<string,string> = { pending:'⏳ Menunggu review admin', disetujui:'✅ Ditampilkan di halaman utama', ditolak:'❌ Ditolak — silakan edit ulang' };
            const STATUS_COLOR: Record<string,string> = { pending:G.gold, disetujui:C.up, ditolak:C.down };
            async function submitTesti() {
              if (!testiTeks.trim()) { setTestiMsg('Tulis ulasan dulu ya.'); return; }
              setTestiSaving(true); setTestiMsg('');
              try {
                const payload = { member_id: member!.id, nama: testiNama||member!.nama, ulasan: testiTeks.trim(), bintang: testiBintang, kelas: member!.tier, status: 'pending' };
                if (myTestimonial) {
                  await supabase.from('testimonials').update({...payload}).eq('id', myTestimonial.id);
                  setMyTestimonial((p:any) => ({...p,...payload}));
                  setTestiMsg('Ulasan diperbarui! Menunggu persetujuan admin.');
                } else {
                  const { data: nd } = await supabase.from('testimonials').insert(payload).select().maybeSingle();
                  setMyTestimonial(nd);
                  setTestiMsg('Ulasan terkirim! Menunggu persetujuan admin.');
                }
              } catch(e) { setTestiMsg('Gagal mengirim. Coba lagi.'); }
              setTestiSaving(false);
            }
            return (
              <div className='mr-content-pad' style={{ padding:24 }}>
                <div style={{ fontFamily:C.mono, color:G.gold, fontSize:10, letterSpacing:1, marginBottom:6 }}>// ULASAN</div>
                <h2 style={{ fontSize:22, fontWeight:700, margin:'0 0 6px' }}>Tulis Ulasanmu</h2>
                <p style={{ color:C.dim, fontSize:13, margin:'0 0 24px', lineHeight:1.6 }}>Bagikan pengalamanmu. Ulasan yang disetujui akan tampil di halaman utama.</p>
                {myTestimonial && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:C.panel, border:`1px solid ${STATUS_COLOR[myTestimonial.status]||C.border}44`, borderRadius:10, marginBottom:20 }}>
                    <span style={{ fontFamily:C.mono, fontSize:12, color:STATUS_COLOR[myTestimonial.status]||C.dim, fontWeight:700 }}>{STATUS_LABEL[myTestimonial.status]||myTestimonial.status}</span>
                  </div>
                )}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontFamily:C.mono, color:C.dim, fontSize:10, letterSpacing:1, marginBottom:10 }}>BINTANG</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    {[1,2,3,4,5].map(s=>(
                      <button key={s} onClick={()=>setTestiBintang(s)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:32, color:testiBintang>=s?G.gold:'#333', transition:'all 0.15s', transform:testiBintang>=s?'scale(1.1)':'scale(1)', padding:0, lineHeight:1 }}>★</button>
                    ))}
                    <span style={{ fontFamily:C.mono, color:G.gold, fontSize:14, fontWeight:700, marginLeft:8 }}>{['','Kurang','Cukup','Bagus','Sangat Bagus','Luar Biasa!'][testiBintang]}</span>
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontFamily:C.mono, color:C.dim, fontSize:10, letterSpacing:1, marginBottom:8 }}>NAMA TAMPIL</div>
                  <input value={testiNama} onChange={e=>setTestiNama(e.target.value)} placeholder={member!.nama}
                    style={{ width:'100%', maxWidth:360, background:C.panel, border:`1px solid ${C.border}`, color:C.text, padding:'11px 14px', fontSize:13, borderRadius:8, outline:'none', boxSizing:'border-box' as const }}
                    onFocus={e=>e.target.style.borderColor=G.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontFamily:C.mono, color:C.dim, fontSize:10, letterSpacing:1, marginBottom:8 }}>ULASANMU *</div>
                  <textarea value={testiTeks} onChange={e=>setTestiTeks(e.target.value)} rows={5}
                    placeholder="Ceritakan pengalamanmu belajar di Menolak Rugi..."
                    style={{ width:'100%', background:C.panel, border:`1px solid ${C.border}`, color:C.text, padding:'11px 14px', fontSize:13, borderRadius:8, outline:'none', resize:'vertical' as const, boxSizing:'border-box' as const }}
                    onFocus={e=>e.target.style.borderColor=G.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:C.dim, marginTop:4 }}>{testiTeks.length} karakter</div>
                </div>
                {testiMsg && <div style={{ fontFamily:C.mono, fontSize:12, color:testiMsg.includes('Gagal')?C.down:C.up, marginBottom:16, padding:'10px 14px', background:C.panel, borderRadius:8 }}>{testiMsg}</div>}
                <button onClick={submitTesti} disabled={testiSaving||!testiTeks.trim()}
                  style={{ fontFamily:C.mono, fontSize:12, fontWeight:700, color:'#000', background:testiSaving||!testiTeks.trim()?'#555':G.gold, padding:'12px 28px', border:'none', cursor:testiSaving?'not-allowed':'pointer', borderRadius:8 }}>
                  {testiSaving?'MENGIRIM...':myTestimonial?'↻ PERBARUI ULASAN':'✓ KIRIM ULASAN'}
                </button>
              </div>
            );
          })()}

          {/* ══ REFERRAL ══ */}
          {active === 'referral' && (
            <div className='mr-content-pad' style={{ padding:24 }}>
              <div style={{ fontFamily:C.mono, color:C.up, fontSize:10, letterSpacing:1, marginBottom:6 }}>// REFERRAL</div>
              <h2 style={{ fontSize:22, fontWeight:700, margin:'0 0 6px' }}>Program Referral</h2>
              <p style={{ color:C.dim, fontSize:13, margin:'0 0 24px' }}>Ajak teman bergabung dan dapatkan reward.</p>
              <div style={{ background:'linear-gradient(135deg,var(--mr-tint-green2),var(--mr-bg))', border:`1px solid var(--mr-tint-green-b)`, borderRadius:14, padding:24, marginBottom:20 }}>
                <div style={{ fontFamily:C.mono, color:C.up, fontSize:10, letterSpacing:1, marginBottom:12 }}>// LINK REFERRAL KAMU</div>
                <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                  <div style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px', fontFamily:C.mono, fontSize:12, color:C.up, overflowX:'auto' as const, whiteSpace:'nowrap' as const }}>
                    menolakrugi.pages.dev/signup?ref={referralCode}
                  </div>
                  <button onClick={()=>{ navigator.clipboard.writeText(`https://menolakrugi.pages.dev/signup?ref=${referralCode}`); setReferralCopied(true); setTimeout(()=>setReferralCopied(false),2000); }}
                    style={{ fontFamily:C.mono, fontSize:11, fontWeight:700, color:'#000', background:referralCopied?C.up:G.gold, padding:'12px 18px', border:'none', cursor:'pointer', borderRadius:8, flexShrink:0, transition:'all 0.2s' }}>
                    {referralCopied?'✓ TERSALIN':'⎘ SALIN'}
                  </button>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <a href={`https://wa.me/?text=${encodeURIComponent('Hei! Belajar trading SMC bareng aku di Menolak Rugi: https://menolakrugi.pages.dev/signup?ref='+referralCode)}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily:C.mono, fontSize:10, color:'#25D366', border:'1px solid #25D36644', padding:'6px 12px', borderRadius:6, textDecoration:'none', background:'#25D36611' }}>Share WhatsApp ▸</a>
                  <a href={`https://t.me/share/url?url=${encodeURIComponent('https://menolakrugi.pages.dev/signup?ref='+referralCode)}&text=${encodeURIComponent('Belajar trading SMC di Menolak Rugi!')}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily:C.mono, fontSize:10, color:'#229ED9', border:'1px solid #229ED944', padding:'6px 12px', borderRadius:6, textDecoration:'none', background:'#229ED911' }}>Share Telegram ▸</a>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
                {[
                  { l:'Total Referral', v:referrals.length, c:C.text },
                  { l:'Terverifikasi', v:referrals.filter((r:any)=>r.status!=='pending').length, c:C.up },
                  { l:'Pending', v:referrals.filter((r:any)=>r.status==='pending').length, c:G.gold },
                ].map((s:any,i:number)=>(
                  <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:16, textAlign:'center' as const }}>
                    <div style={{ fontFamily:C.mono, color:C.dim, fontSize:10, marginBottom:6 }}>{s.l}</div>
                    <div style={{ fontFamily:C.mono, fontSize:22, fontWeight:700, color:s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
              {referrals.length===0 ? (
                <div style={{ textAlign:'center' as const, color:C.dim, padding:48, fontFamily:C.mono, fontSize:13 }}>Belum ada referral. Mulai share link kamu!</div>
              ) : (
                <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
                  <div style={{ fontFamily:C.mono, color:C.dim, fontSize:10, letterSpacing:1, padding:'14px 18px', borderBottom:`1px solid ${C.border}` }}>// DAFTAR REFERRAL</div>
                  {referrals.map((r:any)=>(
                    <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:13 }}>{r.referred_name||'Member Baru'}</div>
                        <div style={{ fontFamily:C.mono, fontSize:10, color:C.dim, marginTop:2 }}>{new Date(r.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
                      </div>
                      <div style={{ fontFamily:C.mono, fontSize:11, fontWeight:700, color:r.status==='rewarded'?G.gold:r.status==='verified'?C.up:C.dim, background:r.status==='rewarded'?'var(--mr-tint-gold)':r.status==='verified'?'var(--mr-tint-green2)':C.panel, border:`1px solid ${r.status==='rewarded'?'var(--mr-tint-gold-b)':r.status==='verified'?'var(--mr-tint-green-b)':C.border}`, padding:'3px 10px', borderRadius:6 }}>
                        {r.status==='rewarded'?'💰 REWARDED':r.status==='verified'?'✓ VERIFIED':'⏳ PENDING'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ BANTUAN ══ */}
          {active === 'bantuan' && (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// BANTUAN</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Bantuan & FAQ</h2>
              </div>
              {/* Kontak */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { icon: '📱', title: 'WhatsApp Admin', sub: 'Respon cepat di jam kerja (08.00–22.00 WIB)', href: WA_ADMIN, label: 'Chat WA', color: '#25D366' },
                  { icon: '💬', title: 'Discord Server', sub: 'Channel #support tersedia 24/7 oleh komunitas', href: DISCORD, label: 'Buka Discord', color: '#5865F2' },
                  { icon: '📢', title: 'Telegram Channel', sub: 'Update dan pengumuman penting via Telegram', href: TELEGRAM, label: 'Join Telegram', color: '#229ED9' },
                ].map((c, i) => (
                  <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, textAlign: 'center' as const }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{c.title}</div>
                    <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>{c.sub}</div>
                    <a href={c.href} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#000', background: c.color, padding: '8px 16px', textDecoration: 'none', borderRadius: 5 }}>
                      {c.label} ▸
                    </a>
                  </div>
                ))}
              </div>
              {/* FAQ */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>// FAQ</div>
                {[
                  { q: 'Bagaimana cara mengakses materi video?', a: 'Klik menu Kelas Saya di sidebar untuk melihat semua video berdasarkan kategori. Klik TONTON untuk membuka video di YouTube.' },
                  { q: 'Bagaimana cara menghubungkan akun Discord?', a: 'Masuk ke Pengaturan → isi username Discord kamu → klik Simpan Discord. Admin akan verifikasi dan berikan akses server.' },
                  { q: 'Kapan jadwal live trading?', a: 'Setiap Senin & Kamis pukul 20.00–22.00 WIB, dan Sabtu 10.00–12.00 WIB. Cek menu Live Trading untuk info lengkap.' },
                  { q: 'Bagaimana cara download file materi?', a: 'Masuk ke menu Materi di sidebar. File tersedia untuk di-download atau dibuka langsung sesuai tier membership kamu.' },
                  { q: 'Bagaimana cara upgrade membership?', a: 'Hubungi admin via WhatsApp atau Discord untuk informasi upgrade. Admin akan membantu proses pembayaran dan aktivasi.' },
                  { q: 'Apakah ada garansi uang kembali?', a: 'Tidak ada refund setelah akses materi dibuka. Pastikan kamu sudah yakin sebelum melakukan pembayaran.' },
                ].map((faq, i) => (
                  <div key={i} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: C.text }}>Q: {faq.q}</div>
                    <div style={{ color: C.dim, fontSize: 13, lineHeight: 1.6 }}>A: {faq.a}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Member Jurnal View Modal ── */}
      {viewJurnalMember && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'flex-end' }}
          onClick={(e)=>{ if(e.target===e.currentTarget) setViewJurnalMember(null); }}>
          <div style={{ width:'min(520px,95vw)', height:'100vh', background:C.sidebar, borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflowY:'auto' }}>
            <div style={{ padding:'20px 20px 16px', borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, background:C.sidebar, zIndex:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontFamily:'monospace', color:'#3b82f6', fontSize:10, letterSpacing:1.5 }}>// JURNAL TRADING</div>
                <button onClick={()=>setViewJurnalMember(null)} style={{ background:'transparent', border:`1px solid ${C.border2}`, color:C.muted, padding:'4px 10px', cursor:'pointer', borderRadius:5, fontFamily:'monospace', fontSize:11 }}>✕ TUTUP</button>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:10, background:'#1d4ed8', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:16, color:'#93c5fd', flexShrink:0 }}>
                  {viewJurnalMember.nama?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{viewJurnalMember.nama}</div>
                  <div style={{ fontFamily:'monospace', fontSize:10, color:'#3b82f6', marginTop:2 }}>{viewJurnalMember.tier}</div>
                </div>
                <div style={{ marginLeft:'auto', textAlign:'right' as const }}>
                  <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:700, color:viewJurnalMember.gainPct>=0?'#22c55e':'#ef4444' }}>
                    {viewJurnalMember.gainPct>=0?'+':''}{viewJurnalMember.gainPct?.toFixed(1)}%
                  </div>
                  <div style={{ fontFamily:'monospace', fontSize:10, color:'#555' }}>equity gain</div>
                </div>
              </div>
            </div>
            {viewJurnalLoading ? (
              <div style={{ padding:40, textAlign:'center' as const, color:'#555', fontFamily:'monospace', fontSize:12 }}>Memuat data...</div>
            ) : (
              <div style={{ padding:16 }}>
                {viewJurnalEntries.length===0 ? (
                  <div style={{ color:'#555', fontFamily:'monospace', fontSize:12, textAlign:'center' as const, padding:40 }}>Belum ada trade.</div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'monospace', fontSize:11 }}>
                      <thead>
                        <tr style={{ borderBottom:`1px solid ${C.border2}` }}>
                          {['TGL','PAIR','TF','HASIL','RR','PNL'].map((h:string)=>(
                            <th key={h} style={{ padding:'6px 10px', textAlign:'left' as const, color:'#555', fontWeight:600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {viewJurnalEntries.slice(0,30).map((e:any)=>(
                          <tr key={e.id} style={{ borderBottom:'1px solid var(--mr-border)' }}>
                            <td style={{ padding:'6px 10px', whiteSpace:'nowrap' as const }}>{e.tanggal}</td>
                            <td style={{ padding:'6px 10px', color:'#16a34a', fontWeight:700 }}>{e.pair}</td>
                            <td style={{ padding:'6px 10px', color:'#555' }}>{e.timeframe}</td>
                            <td style={{ padding:'6px 10px', color:e.hasil==='Take Profit'?'#22c55e':e.hasil==='Stop Loss'?'#ef4444':'#f59e0b', fontWeight:600 }}>{e.hasil}</td>
                            <td style={{ padding:'6px 10px', color:'#f59e0b' }}>{e.rr??'—'}</td>
                            <td style={{ padding:'6px 10px', color:(e.pnl||0)>=0?'#22c55e':'#ef4444', fontWeight:600 }}>{e.pnl!=null?((e.pnl>=0?'+':'')+e.pnl.toFixed(2)):'—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ── */}
      {/* ── Real-time toast notifications for member ── */}
      {memberToasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 200, display: 'flex', flexDirection: 'column' as const, gap: 8, pointerEvents: 'none', maxWidth: 'calc(100vw - 32px)' }}>
          {memberToasts.map(t => {
            const col = t.type === 'success' ? C.up : t.type === 'error' ? C.down : G.gold;
            return (
              <div key={t.id} style={{ background: C.sidebar, border: `1px solid ${col}44`, borderLeft: `3px solid ${col}`, borderRadius: 10, padding: '13px 18px', boxShadow: `0 8px 32px rgba(0,0,0,0.5)`, minWidth: 260, maxWidth: 340, pointerEvents: 'all' as const }}>
                <div style={{ fontFamily: C.mono, fontSize: 8, color: col, letterSpacing: 2, marginBottom: 6 }}>// UPDATE STATUS PENGAJUAN</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{t.msg}</div>
                  <button onClick={() => setMemberToasts(prev => prev.filter(x => x.id !== t.id))}
                    style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 18, padding: '0 2px', flexShrink: 0, lineHeight: 1, pointerEvents: 'all' as const }}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <nav className='mr-bottom-nav' style={{ background: C.sidebar, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 4px' }}>
        {[
          { id: 'dashboard', icon: '⊞', label: 'Home' },
          { id: 'kelas',     icon: '▶', label: 'Kelas' },
          { id: 'materi',    icon: '📁', label: 'Materi' },
          { id: 'funded',    icon: '🚀', label: 'Trading' },
          { id: 'menu',      icon: '☰',  label: 'Menu' },
        ].map(item => {
          const isA = item.id === 'menu' ? false : active === item.id;
          return (
            <button key={item.id}
              onClick={() => {
                if (item.id === 'menu') setMobileMenuOpen(true);
                else setActive(item.id);
              }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: isA ? G.gold : '#555', padding: '4px 0' }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontFamily: C.mono, fontSize: 9, fontWeight: isA ? 700 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className='mr-bottom-spacer'/>

    </div>
  );
}
