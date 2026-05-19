import React, { useState, useEffect, useRef, memo } from 'react';
import { supabase } from '../../lib/supabase';
import LanjutkanBelajar from '../../components/LanjutkanBelajar';
import { trackVideoWatch } from '../../hooks/useWatchHistory';

const G = { gold: '#eab308', gold2: '#ca9e00' };
const C = {
  bg: '#090909', sidebar: '#0d0d0d', panel: '#111', border: '#1e1e1e',
  border2: '#2a2a2a', dim: '#555', muted: '#888', text: '#e7e5e4',
  up: '#22ab94', down: '#ef4444', mono: '"Geist Mono",monospace',
  sans: '"Geist",system-ui,sans-serif',
};
const DISCORD  = 'https://discord.gg/d2Tpf6sGMr';
const TELEGRAM = 'https://t.me/+_azyX2h9oFhmNjNl';
const WA_ADMIN = 'https://wa.me/6281242224939';

const SIDEBAR = [
  { id: 'dashboard',   label: 'Dashboard',    icon: '⊞' },
  { id: 'kelas',       label: 'Kelas Saya',   icon: '▶' },
  { id: 'materi',      label: 'Materi',       icon: '📚' },
  { id: 'live',        label: 'Live Trading', icon: '📡', badge: 'LIVE' },
  { id: 'news',        label: 'Chart',        icon: '📈' },
  { id: 'komunitas',   label: 'Komunitas',    icon: '💬' },
  { id: 'tools',       label: 'Broker',       icon: '🏦' },
  { id: 'pengaturan',  label: 'Pengaturan',   icon: '⚙' },
  { id: 'bantuan',     label: 'Bantuan',      icon: '❓' },
  { id: 'funded',      label: 'Status Trading', icon: '🚀' },
  { id: 'sertifikat',  label: 'Sertifikat',     icon: '🏆' },
  { id: 'ulasan',      label: 'Tulis Ulasan',   icon: '⭐' },
  { id: 'logout',      label: 'Logout',         icon: '⏻' },
];

// ── Mini sparkline ──────────────────────────────────────────────────────────
function Spark({ up }: { up: boolean }) {
  const pts = up ? '0,18 10,14 20,15 30,10 40,12 50,7 60,8 70,3'
                 : '0,3 10,7 20,5 30,12 40,8 50,14 60,10 70,16';
  return <svg viewBox="0 0 70 20" width="60" height="20"><polyline points={pts} fill="none" stroke={up ? C.up : C.down} strokeWidth="1.5"/></svg>;
}

// ── Progress ring ───────────────────────────────────────────────────────────
function Ring({ pct, size = 48, color = G.gold }: { pct: number; size?: number; color?: string }) {
  const r = (size - 6) / 2; const c2 = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a1a" strokeWidth="5"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={c2} strokeDashoffset={c2-(pct/100)*c2} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="central"
        fontSize={size/4.5} fontFamily={C.mono} fontWeight="700" fill={color}>{pct}%</text>
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
              style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${C.border2}`, color: C.text, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, outline: 'none', borderRadius: 5, boxSizing: 'border-box' as const }}
              onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border2}/>
          </div>
        ))}
        <div>
          <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>PAIR</div>
          <select value={pair} onChange={e => setPair(e.target.value)}
            style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${C.border2}`, color: C.text, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, outline: 'none', borderRadius: 5, cursor: 'pointer' }}>
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

// ── Certificate Canvas Component ──────────────────────────────
function CertificateCanvas({ nama, tier, tanggal }: { nama: string; tier: string; tanggal: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 900, H = 636;
    canvas.width = W; canvas.height = H;
    canvas.id = 'mr-cert-canvas';

    // Background
    ctx.fillStyle = '#0a0800';
    ctx.fillRect(0, 0, W, H);

    // Gold border outer
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, W - 24, H - 24);

    // Gold border inner
    ctx.strokeStyle = '#3a2e00';
    ctx.lineWidth = 1;
    ctx.strokeRect(22, 22, W - 44, H - 44);

    // Top decorative line
    ctx.fillStyle = '#eab308';
    ctx.fillRect(40, 40, W - 80, 2);
    ctx.fillRect(40, H - 42, W - 80, 2);

    // Brand
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 13px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MENOLAK RUGI · ELITE TRADING ENVIRONMENT', W / 2, 80);

    // Certificate title
    ctx.fillStyle = '#e7e5e4';
    ctx.font = 'bold 36px "Geist", system-ui, sans-serif';
    ctx.fillText('SERTIFIKAT', W / 2, 148);

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 22px "Geist", system-ui, sans-serif';
    ctx.fillText('NAIK KELAS ADVANCED', W / 2, 186);

    // Divider
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(W / 2 - 120, 206, 240, 1);

    // "Diberikan kepada"
    ctx.fillStyle = '#666';
    ctx.font = '14px "Geist", system-ui, sans-serif';
    ctx.fillText('Diberikan kepada', W / 2, 240);

    // Member name
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 42px "Geist", system-ui, sans-serif';
    ctx.fillText(nama, W / 2, 300);

    // Tier
    ctx.fillStyle = '#888';
    ctx.font = '15px "Geist Mono", monospace';
    ctx.fillText(tier.toUpperCase(), W / 2, 330);

    // Description
    ctx.fillStyle = '#666';
    ctx.font = '14px "Geist", system-ui, sans-serif';
    ctx.fillText('Telah menyelesaikan materi Basic dan berhasil naik ke kelas', W / 2, 375);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 14px "Geist", system-ui, sans-serif';
    ctx.fillText('Advanced — Smart Money Concept (SMC) Trading Education', W / 2, 398);

    // Date + signature line
    ctx.fillStyle = '#444';
    ctx.fillRect(100, 476, 200, 1);
    ctx.fillRect(W - 300, 476, 200, 1);

    ctx.fillStyle = '#555';
    ctx.font = '12px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(tanggal, 200, 500);
    ctx.fillText('Mentor — Menolak Rugi', W - 200, 500);

    ctx.fillStyle = '#333';
    ctx.font = '11px "Geist Mono", monospace';
    ctx.fillText('TANGGAL DITERBITKAN', 200, 518);
    ctx.fillText('IKHSAN · FOUNDER', W - 200, 518);

    // Footer
    ctx.fillStyle = '#2a2200';
    ctx.fillRect(40, H - 68, W - 80, 24);
    ctx.fillStyle = '#eab308';
    ctx.font = '10px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('menolakrugi.pages.dev  ·  SMART MONEY CONCEPT EDUCATION  ·  VALID & VERIFIED', W / 2, H - 51);

    // Corner ornaments
    const corners = [[44, 44], [W - 44, 44], [44, H - 44], [W - 44, H - 44]];
    corners.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308';
      ctx.fill();
    });

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
  const [active, setActive]           = useState('dashboard');
  const [videos, setVideos]           = useState<any[]>([]);
  const [files, setFiles]             = useState<any[]>([]);
  const [progress, setProgress]       = useState<Record<string, string>>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [brokers, setBrokers]         = useState<any[]>([]);
  const [propRules, setPropRules]       = useState<any[]>([]);
  const [oldPass, setOldPass]         = useState('');
  const [newPass, setNewPass]         = useState('');
  const [confPass, setConfPass]       = useState('');
  const [passMsg, setPassMsg]         = useState('');
  const [passErr, setPassErr]         = useState('');
  const [discordId, setDiscordId]     = useState('');
  const [settingMsg, setSettingMsg]   = useState('');
  const [liveSchedules, setLiveSchedules] = useState<any[]>([]);
  const [notifications, setNotifications]   = useState<any[]>([]);
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('mr_sidebar_collapsed') === '1';
  });
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);
  const [isMobile, setIsMobile]                 = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
    } catch { window.location.href = '/login'; }
  }, []);

  async function loadData(m: Member) {
    const [vidRes, fileRes, annRes, progRes, brokerRes, schedRes, notifRes, advRes, rulesRes] = await Promise.all([
      supabase.from('videos').select('*').order('urutan', { ascending: true }),
      supabase.from('files').select('*').order('urutan', { ascending: true }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('member_progress').select('video_id, status').eq('member_id', m.id),
      supabase.from('brokers').select('*').order('urutan', { ascending: true }),
      supabase.from('prop_firm_rules').select('*').order('created_at', { ascending: false }),
      supabase.from('live_schedules').select('*').order('urutan', { ascending: true }),
      supabase.from('member_notifications').select('*').eq('member_id', m.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('advance_requests').select('*').eq('member_id', m.id).order('created_at', { ascending: false }).limit(1),
    ]);
    if (vidRes.data)   setVideos(vidRes.data);
    if (fileRes.data)  setFiles(fileRes.data);
    if (annRes.data)   setAnnouncements(annRes.data);
    if (brokerRes.data) setBrokers(brokerRes.data);
    if (rulesRes.data) setPropRules(rulesRes.data);
    if (schedRes.data)  setLiveSchedules(schedRes.data);
    if (notifRes.data)  setNotifications(notifRes.data);
    if (advRes.data && advRes.data.length > 0) setAdvanceReq(advRes.data[0]);
    if (progRes.data) {
      const map: Record<string, string> = {};
      progRes.data.forEach((p: any) => { map[p.video_id] = p.status; });
      setProgress(map);
    }
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

  async function handleUpdateStatus(newStatus: string | null) {
    if (!member) return;
    setStatusSaving(true); setStatusMsg('');
    try {
      const res = await fetch('https://menolakrugi-bot-production.up.railway.app/discord/update-trading-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: member.id, funded_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedStatus(newStatus);
        setMember({ ...member, funded_status: newStatus });
        const stored = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member') || '{}';
        const updated = JSON.stringify({ ...JSON.parse(stored), funded_status: newStatus });
        if (localStorage.getItem('mr_member')) localStorage.setItem('mr_member', updated);
        else sessionStorage.setItem('mr_member', updated);
        setStatusMsg(data.message || 'Status berhasil disimpan!');
      } else {
        setStatusMsg('Gagal: ' + (data.error || 'Unknown error'));
      }
    } catch { setStatusMsg('Tidak bisa terhubung ke server.'); }
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

  function logout() {
    localStorage.removeItem('mr_member');
    sessionStorage.removeItem('mr_member');
    window.location.href = '/login';
  }

  if (!member) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontFamily: C.mono, fontSize: 13 }}>
      Loading...
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
    background: '#0a0a0a', border: `1px solid ${C.border2}`, color: C.text,
    padding: '9px 14px', fontSize: 13, fontFamily: C.mono, outline: 'none',
    borderRadius: 6, width: '100%', boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <style>{`
        .mr-sidebar { width: 200px; flex-shrink: 0; }
        .mr-main { flex: 1; overflow-y: auto; min-width: 0; }
        .mr-bottom-nav { display: none; }
        .mr-bottom-spacer { display: none; }
        .mr-topbar-brand { display: flex; }
        .mr-content-pad { padding: 24px; }
        .mr-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        .mr-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
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
      <div className='mr-topbar' style={{ borderBottom: `1px solid ${C.border}`, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, background: C.sidebar, flexShrink: 0, position: 'sticky' as const, top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Hamburger / collapse toggle */}
          <button onClick={() => isMobile ? setMobileMenuOpen(o => !o) : toggleSidebar()}
            style={{ width: 36, height: 36, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
            {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: i === 1 ? 12 : 16, height: 1.5, background: C.dim, borderRadius: 2, transition: 'width 0.2s' }}/>)}
          </button>
          <div style={{ width: 32, height: 32, flexShrink: 0 }}><img src='/logo.png' alt='MR' style={{ width: '100%', height: '100%', objectFit: 'contain' }}/></div>
          <div className='mr-topbar-brand'>
            <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.3 }}>MENOLAK RUGI</div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.dim, letterSpacing: 1 }}>ELITE TRADING ENVIRONMENT</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
          {!isMobile && <div style={{ fontFamily: C.mono, fontSize: 10, color: C.dim }}>{member.tier.replace('SMC ', '').toUpperCase()}</div>}
          {member.is_advance && <span style={{ fontFamily: C.mono, fontSize: 8, background: '#1a1500', border: `1px solid #3a2e00`, color: G.gold, padding: '2px 6px', borderRadius: 4 }}>ADVANCE</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, background: `linear-gradient(135deg,${G.gold},${G.gold2})`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#000' }}>
              {member.nama[0].toUpperCase()}
            </div>
            {!isMobile && <span style={{ fontSize: 13, fontWeight: 600 }}>{member.nama}</span>}
          </div>
          {!isMobile && <button onClick={() => window.location.href = '/'} style={{ fontFamily: C.mono, fontSize: 10, color: C.dim, background: 'none', border: `1px solid ${C.border2}`, padding: '4px 10px', cursor: 'pointer', borderRadius: 5 }}>Web ↗</button>}
        </div>
      </div>

      {/* ── Mobile Overlay ── */}
      {isMobile && mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileMenuOpen(false)}/>
          <div style={{ width: 240, background: C.sidebar, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{member.nama}</span>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 20, padding: '0 4px' }}>×</button>
            </div>
            <div style={{ flex: 1, paddingTop: 8 }}>
              {SIDEBAR.map(item => {
                const isA = active === item.id;
                return (
                  <button key={item.id}
                    onClick={() => {
                      if ((item as any).href) { window.open((item as any).href, '_blank'); }
                      else if (item.id === 'logout') { logout(); }
                      else { setActive(item.id); setMobileMenuOpen(false); }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 20px', border: 'none', background: isA ? '#1a1500' : 'transparent', borderLeft: isA ? `3px solid ${G.gold}` : '3px solid transparent', color: isA ? G.gold : C.dim, cursor: 'pointer', fontSize: 14, textAlign: 'left' as const }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {(item as any).badge && <span style={{ fontFamily: C.mono, fontSize: 8, background: C.down, color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{(item as any).badge}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ margin: '0 12px 12px', background: '#0d0c00', border: `1px solid #2a2200`, borderRadius: 10, padding: '12px' }}>
              <div style={{ fontFamily: C.mono, color: '#555', fontSize: 9, marginBottom: 4 }}>AKSES MEMBERSHIP</div>
              <div style={{ fontWeight: 700, color: G.gold, fontSize: 12 }}>{member.tier}</div>
              {isTrial && expiryDate && (
                <div style={{ fontFamily: C.mono, fontSize: 10, color: daysLeft! <= 7 ? '#f97316' : C.dim, marginTop: 4 }}>{daysLeft} hari lagi</div>
              )}
            </div>

          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Desktop Sidebar ── */}
        <aside className='mr-sidebar' style={{ width: sidebarCollapsed ? 58 : 200, background: C.sidebar, borderRight: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', transition: 'width 0.2s ease', overflow: 'hidden' }}>
          <div style={{ flex: 1, paddingTop: 10 }}>
            {SIDEBAR.map(item => {
              const isA = active === item.id;
              return (
                <button key={item.id}
                  onClick={() => {
                    if ((item as any).href) { window.open((item as any).href, '_blank'); }
                    else if (item.id === 'logout') { logout(); }
                    else { setActive(item.id); }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: sidebarCollapsed ? '11px 0' : '10px 18px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', border: 'none', background: isA ? '#1a1500' : 'transparent', borderLeft: isA ? `3px solid ${G.gold}` : '3px solid transparent', color: isA ? G.gold : C.dim, cursor: 'pointer', fontSize: 13, textAlign: 'left' as const, transition: 'padding 0.2s' }}>
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                  {!sidebarCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' as const }}>{item.label}</span>}
                  {!sidebarCollapsed && (item as any).badge && <span style={{ fontFamily: C.mono, fontSize: 8, background: C.down, color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{(item as any).badge}</span>}
                </button>
              );
            })}
          </div>

          {/* Membership card - only when expanded */}
          {!sidebarCollapsed && <div style={{ margin: '0 12px 12px', background: '#0d0c00', border: `1px solid #2a2200`, borderRadius: 10, padding: '14px' }}>
            <div style={{ fontFamily: C.mono, color: '#555', fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>AKSES MEMBERSHIP</div>
            <div style={{ fontWeight: 700, color: G.gold, fontSize: 13 }}>{member.tier}</div>
            <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginTop: 2 }}>{member.is_advance ? '(Advance)' : '(Basic)'}</div>
            <div style={{ fontFamily: C.mono, color: '#555', fontSize: 10, marginTop: 8 }}>Aktif sampai</div>
            {isTrial && expiryDate ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: isExpired ? C.down : daysLeft! <= 7 ? '#f97316' : C.text }}>
                  {expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {!isExpired && (
                  <div style={{ fontFamily: C.mono, fontSize: 9, color: daysLeft! <= 7 ? '#f97316' : '#555', marginTop: 2 }}>
                    {daysLeft} hari lagi
                  </div>
                )}
                {isExpired && (
                  <div style={{ fontFamily: C.mono, fontSize: 9, color: C.down, marginTop: 2 }}>AKSES BERAKHIR</div>
                )}
                <a href="/checkout" style={{ display: 'block', marginTop: 10, fontFamily: C.mono, fontSize: 10, fontWeight: 700,
                  color: '#000', background: isExpired ? C.down : G.gold,
                  padding: '6px 0', textAlign: 'center' as const, textDecoration: 'none', borderRadius: 5 }}>
                  {isExpired ? 'AKTIFKAN LAGI' : 'NAIK TIER ▸'}
                </a>
              </>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>Seumur Hidup</div>
            )}
          </div>}


        </aside>

        {/* ── Main Content ── */}
        <main className='mr-main' style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>

          {/* ══ DASHBOARD ══ */}
          {active === 'dashboard' && (
            <div className='mr-content-pad' style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
              {/* Welcome */}
              <div className='mr-welcome-pad mr-welcome-anim' style={{ background: 'linear-gradient(135deg,#0f0c00,#0a0a0a)', border: `1px solid #2a2200`, borderRadius: 14, padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', opacity: 0.07 }}>
                  <svg viewBox="0 0 400 160" width="100%" height="100%">
                    <polyline points="0,120 40,100 80,110 120,70 160,90 200,50 240,80 280,40 320,60 360,30 400,50" fill="none" stroke={G.gold} strokeWidth="2.5"/>
                  </svg>
                </div>
                <div style={{ fontFamily: C.mono, color: '#555', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>SELAMAT DATANG KEMBALI,</div>
                <h1 className='mr-welcome-h1' style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, margin: '0 0 8px' }}>{member.nama}</h1>
                <p style={{ color: C.dim, fontSize: 14, margin: 0 }}>Terus belajar dan kuasai market dengan konsep SMC.</p>
              </div>

              {/* KPI cards */}
              <div className='mr-grid-4' style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                {[
                  { l: 'PROGRESS BELAJAR', v: `${progressPct}%`,          sub: `${completedVideos} video selesai`, color: G.gold, ring: progressPct },
                  { l: 'MATERI SELESAI',   v: `${completedVideos} / ${totalVideos}`, sub: 'Video',          color: C.up },
                  { l: 'AKSES KELAS',      v: 'AKTIF',                     sub: member.tier,              color: C.up },
                  { l: 'FILE MATERI',      v: `${files.length}`,           sub: 'File tersedia',          color: C.text },
                ].map((k, i) => (
                  <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 16px' }}>
                    <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 0.8, marginBottom: 10 }}>{k.l}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: k.color, letterSpacing: -0.5 }}>{k.v}</div>
                      {k.ring !== undefined && <Ring pct={k.ring} size={44}/>}
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 10, color: '#555', marginTop: 8 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* ── Status Member Row ── */}
              <div className='mr-grid-3 mr-status-anim' style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>

                {/* Status Trading */}
                <div className='mr-status-card' style={{ background: C.panel, border: `1px solid ${member.funded_status ? '#3a2e00' : C.border}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer' }}
                  onClick={() => setActive('funded')}>
                  <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>STATUS TRADING</div>
                  {member.funded_status ? (
                    <>
                      <div style={{ fontSize: 22, fontWeight: 700, color: G.gold, letterSpacing: -0.5 }}>
                        {member.funded_status === 'DA' ? '📊' : member.funded_status === 'P1' ? '🟣' : member.funded_status === 'P2' ? '🟡' : member.funded_status === 'Master' ? '🏆' : member.funded_status === 'MPAID' ? '💰' : '💼'} {member.funded_status}
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: G.gold, marginTop: 6 }}>
                        {member.funded_status === 'DA' ? 'Demo Account' : member.funded_status === 'P1' ? 'Phase 1' : member.funded_status === 'P2' ? 'Phase 2' : member.funded_status === 'Master' ? 'Master — Lolos P2' : member.funded_status === 'MPAID' ? 'Sudah Payout' : 'Akun Pribadi'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#444' }}>Belum diset</div>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: '#f97316', marginTop: 6 }}>Klik untuk set status →</div>
                    </>
                  )}
                </div>

                {/* Akses Kelas */}
                <div style={{ background: C.panel, border: `1px solid ${isExpired ? C.down + '44' : daysLeft !== null && daysLeft <= 7 ? '#f9731644' : C.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>AKSES KELAS</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: isExpired ? C.down : daysLeft !== null && daysLeft <= 7 ? '#f97316' : C.up, letterSpacing: -0.5 }}>
                    {isExpired ? 'BERAKHIR' : 'AKTIF'}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 10, color: isExpired ? C.down : C.dim, marginTop: 6 }}>
                    {isTrial && expiryDate
                      ? isExpired
                        ? `Berakhir ${expiryDate.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}`
                        : `Hingga ${expiryDate.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})} · ${daysLeft} hari lagi`
                      : member.tier + ' · Seumur Hidup'}
                  </div>
                  {isTrial && (
                    <a href="/checkout" style={{ display: 'inline-block', marginTop: 8, fontFamily: C.mono, fontSize: 9, fontWeight: 700, color: '#000', background: isExpired ? C.down : G.gold, padding: '4px 10px', textDecoration: 'none', borderRadius: 4 }}>
                      {isExpired ? 'AKTIFKAN LAGI' : 'NAIK TIER ▸'}
                    </a>
                  )}
                </div>

                {/* Level Kelas */}
                <div style={{ background: C.panel, border: `1px solid ${member.is_advance ? '#3a2e00' : C.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>LEVEL KELAS</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: member.is_advance ? G.gold : C.up, letterSpacing: -0.5 }}>
                    {member.is_advance ? 'ADVANCE' : 'BASIC'}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 10, color: C.dim, marginTop: 6 }}>
                    {member.is_advance ? 'Akses semua materi Advanced' : 'Akses materi Basic'}
                  </div>
                  {!member.is_advance && (
                    <button onClick={() => setActive('kelas')}
                      style={{ marginTop: 8, fontFamily: C.mono, fontSize: 9, fontWeight: 700, color: '#a855f7', background: '#0f0a1a', border: '1px solid #4a2a8a', padding: '4px 10px', cursor: 'pointer', borderRadius: 4 }}>
                      REQUEST ADVANCE →
                    </button>
                  )}
                </div>
              </div>

              {/* ── Action Banners (hanya tampil jika belum selesai) ── */}
              {(!member.discord_username || !member.funded_status) && (
                <div className='mr-banner-anim' style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>

                  {/* Discord banner */}
                  {!member.discord_username && (
                    <button onClick={() => setActive('pengaturan')}
                      className='mr-action-banner' style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#080d1a', border: '1px solid #1e2a4a', borderRadius: 10, cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}>
                      <div style={{ width: 38, height: 38, background: '#1e2a4a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>💬</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#93a8f0', marginBottom: 2 }}>Hubungkan Akun Discord Kamu</div>
                        <div style={{ fontSize: 12, color: '#3d4a6a', lineHeight: 1.5 }}>Wajib untuk akses server, notifikasi live, dan verifikasi membership. Klik untuk menghubungkan →</div>
                      </div>
                      <span style={{ fontFamily: C.mono, fontSize: 10, color: '#5865F2', border: '1px solid #1e2a4a', padding: '4px 10px', borderRadius: 5, flexShrink: 0 }}>HUBUNGKAN ▸</span>
                    </button>
                  )}

                  {/* Trading status banner */}
                  {!member.funded_status && (
                    <button onClick={() => setActive('funded')}
                      className='mr-action-banner' style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#0a0c00', border: '1px solid #2a2e00', borderRadius: 10, cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}>
                      <div style={{ width: 38, height: 38, background: '#1a1e00', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🚀</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: G.gold, marginBottom: 2 }}>Set Status Trading Kamu</div>
                        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>Beritahu komunitas apakah kamu sedang Demo, Phase 1, Phase 2, atau sudah Funded. Klik untuk set →</div>
                      </div>
                      <span style={{ fontFamily: C.mono, fontSize: 10, color: G.gold, border: '1px solid #3a2e00', padding: '4px 10px', borderRadius: 5, flexShrink: 0 }}>SET STATUS ▸</span>
                    </button>
                  )}
                </div>
              )}

              <LanjutkanBelajar
                key={watchRefreshKey}
                memberId={member.id}
                memberTier={member.tier}
              />

              {/* Pengumuman + Market Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
                {/* Pengumuman */}
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Pengumuman Terbaru</div>
                  {/* Discord status - compact */}
                  {member.discord_username && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0a1a0a', border: `1px solid ${C.up}33`, borderRadius: 7, marginBottom: 12 }}>
                      <span style={{ fontSize: 14 }}>✅</span>
                      <div style={{ fontSize: 12, color: C.up, fontFamily: C.mono }}>Discord: @{member.discord_username}</div>
                    </div>
                  )}
                  {/* Notifikasi personal (approve/reject advance) */}
                  {notifications.filter((n:any) => !dismissedNotifs.has(n.id)).map((n: any, ni: number) => (
                    <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 8, marginBottom: 8,
                      background: n.type === 'approve' ? '#0a1a0a' : n.type === 'reject' ? '#1a0a0a' : '#0a0e1a',
                      border: `1px solid ${n.type === 'approve' ? C.up + '44' : n.type === 'reject' ? C.down + '44' : '#1e2a4a'}` }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>
                        {n.type === 'approve' ? '✅' : n.type === 'reject' ? '❌' : 'ℹ️'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3,
                          color: n.type === 'approve' ? C.up : n.type === 'reject' ? C.down : '#93a8f0' }}>
                          {n.type === 'approve' ? 'Request Advanced Disetujui 🎉' : n.type === 'reject' ? 'Request Advanced Ditolak' : 'Informasi'}
                        </div>
                        <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>{n.message}</div>
                        <div style={{ fontFamily: C.mono, fontSize: 10, color: '#444', marginTop: 4 }}>
                          {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Pengumuman global */}
                  {announcements.length === 0 && notifications.length === 0 ? (
                    <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 12, padding: '12px 0' }}>Belum ada pengumuman.</div>
                  ) : announcements.map((a: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>📢</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {a.judul && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.judul}</div>}
                        <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>{a.content || a.message || ''}</div>
                        <div style={{ fontFamily: C.mono, fontSize: 10, color: '#444', marginTop: 4 }}>
                          {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Market Overview - TradingView */}
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Market Overview</div>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: C.dim }}>REALTIME</span>
                  </div>
                  <div style={{ height: 420 }}>
                    <MarketOverviewWidget/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ KELAS SAYA ══ */}
          {active === 'kelas' && (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// KELAS SAYA</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Kurikulum Saya</h2>
              </div>
              {/* Request Advanced Modal */}
              {showAdvModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <div className='mr-modal mr-modal-anim' style={{ background: '#0d0d0d', border: `1px solid ${C.border2}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 480 }}>
                    <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// REQUEST NAIK KELAS ADVANCED</div>
                    <h3 className='mr-modal-title' style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Ajukan Naik Kelas</h3>
                    <p style={{ color: C.dim, fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
                      Lampirkan minimal 1 jurnal trading (link atau file) sebagai syarat naik kelas Advanced. Admin akan mereview dan memberikan keputusan.
                    </p>
                    {([
                      { l: 'Jurnal 1', v: jurnal1, s: setJurnal1, idx: 0 },
                      { l: 'Jurnal 2', v: jurnal2, s: setJurnal2, idx: 1 },
                      { l: 'Jurnal 3', v: jurnal3, s: setJurnal3, idx: 2 },
                    ] as {l:string;v:string;s:(v:string)=>void;idx:number}[]).map((f) => (
                      <div key={f.idx} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: C.mono, color: C.dim, fontSize: 10 }}>{f.l.toUpperCase()}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {(['link','file'] as const).map(mode => (
                              <button key={mode} onClick={() => {
                                const nm = [...jurnalMode]; nm[f.idx] = mode; setJurnalMode(nm);
                              }} style={{ fontFamily: C.mono, fontSize: 9, padding: '2px 8px', cursor: 'pointer',
                                background: jurnalMode[f.idx]===mode ? G.gold : 'transparent',
                                color: jurnalMode[f.idx]===mode ? '#000' : C.dim,
                                border: `1px solid ${jurnalMode[f.idx]===mode ? G.gold : C.border2}`, borderRadius: 3 }}>
                                {mode === 'link' ? '🔗 LINK' : '📎 FILE'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {jurnalMode[f.idx] === 'link' ? (
                          <input value={f.v} onChange={e => f.s(e.target.value)} placeholder="https://..."
                            style={{ width: '100%', background: '#111', border: `1px solid ${C.border2}`, color: C.text, padding: '9px 14px', fontSize: 13, fontFamily: C.mono, outline: 'none', borderRadius: 6, boxSizing: 'border-box' as const }}
                            onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border2}/>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <label style={{ flex: 1, display: 'block', background: '#111', border: `1px dashed ${C.border2}`, borderRadius: 6, padding: '9px 14px', cursor: 'pointer', fontSize: 12, color: jurnalFiles[f.idx] ? C.up : C.dim, fontFamily: C.mono }}>
                              {jurnalFiles[f.idx] ? `✓ ${jurnalFiles[f.idx]!.name}` : 'Klik untuk pilih file (PDF/gambar)'}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                                onChange={e => { const nf = [...jurnalFiles]; nf[f.idx] = e.target.files?.[0]||null; setJurnalFiles(nf); }}/>
                            </label>
                            {jurnalFiles[f.idx] && (
                              <button onClick={() => { const nf=[...jurnalFiles]; nf[f.idx]=null; setJurnalFiles(nf); }}
                                style={{ background: 'none', border: 'none', color: C.down, cursor: 'pointer', fontSize: 16 }}>×</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {advMsg && <div style={{ fontFamily: C.mono, color: C.down, fontSize: 12, marginBottom: 10 }}>{advMsg}</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button onClick={submitAdvanceRequest} disabled={advSubmitting}
                        style={{ flex: 1, background: advSubmitting ? '#1a1a1a' : G.gold, color: '#000', fontFamily: C.mono, fontSize: 12, fontWeight: 700, padding: '11px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                        {advSubmitting ? 'MENGIRIM...' : '▸ KIRIM REQUEST'}
                      </button>
                      <button onClick={() => { setShowAdvModal(false); setAdvMsg(''); }}
                        style={{ padding: '11px 18px', background: 'none', border: `1px solid ${C.border2}`, color: C.dim, fontFamily: C.mono, fontSize: 12, cursor: 'pointer', borderRadius: 6 }}>
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
                  const colors: Record<string,string> = { intro:'#eab308', basic:'#22ab94', 'tips-basic':'#22ab94', advanced:'#a855f7', 'tips-advanced':'#a855f7' };
                  const color = locked ? '#444' : (colors[kat] || G.gold);
                  return (
                    <div key={kat} style={{ background: C.panel, border: `1px solid ${locked ? '#2a2a2a' : C.border}`, borderRadius: 12, opacity: locked ? 0.85 : 1 }}>
                      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {locked && <span style={{ fontSize: 14 }}>🔒</span>}
                          <span style={{ fontFamily: C.mono, color, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{kat.replace('-',' ').toUpperCase()}</span>
                        </div>
                        <span style={{ fontFamily: C.mono, color: C.dim, fontSize: 10 }}>{locked ? 'Butuh Advanced' : `${done}/${vids.length} · ${pct}%`}</span>
                      </div>
                      <div style={{ height: 3, background: C.border }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color }}/>
                      </div>
                      {locked ? (
                        <div style={{ padding: '20px 18px', textAlign: 'center' as const }}>
                          <p style={{ color: C.dim, fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
                            Kelas ini hanya untuk member <strong style={{ color: '#a855f7' }}>Advanced</strong>.<br/>
                            Ajukan naik kelas dengan melampirkan 3 jurnal trading.
                          </p>
                          {advanceReq?.status === 'pending' ? (
                            <div style={{ fontFamily: C.mono, fontSize: 11, color: G.gold, background: '#1a1500', border: `1px solid #3a2e00`, padding: '8px 14px', borderRadius: 6 }}>
                              ⏳ REQUEST SEDANG DIREVIEW ADMIN
                            </div>
                          ) : advanceReq?.status === 'ditolak' ? (
                            <div>
                              <div style={{ fontFamily: C.mono, fontSize: 11, color: C.down, background: '#1a0a0a', border: `1px solid #3a1010`, padding: '8px 14px', borderRadius: 6, marginBottom: 10 }}>
                                ❌ REQUEST DITOLAK — {advanceReq.alasan_tolak?.split('\n')[0] || 'Lihat notifikasi'}
                              </div>
                              <button onClick={() => setShowAdvModal(true)}
                                style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#a855f7', background: '#0f0a1a', border: `1px solid #4a2a8a`, padding: '8px 20px', cursor: 'pointer', borderRadius: 6 }}>
                                AJUKAN ULANG ▸
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setShowAdvModal(true)}
                              style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: '#000', background: '#a855f7', padding: '10px 24px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                              REQUEST NAIK KELAS ▸
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
                              <div key={v.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#0d0d0d'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                {/* Status icon */}
                                <div style={{ width: 30, height: 30, background: s==='selesai'?'#0a1a14':s==='mulai'?'#1a1500':'#0a0a0a', border: `1px solid ${s==='selesai'?C.up:s==='mulai'?G.gold:C.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginTop: 2 }}>
                                  {s==='selesai'?'✓':s==='mulai'?'▶':'○'}
                                </div>
                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: s==='selesai'?C.dim:C.text, marginBottom: v.deskripsi ? 4 : 0, lineHeight: 1.4 }}>{v.judul}</div>
                                  {v.deskripsi && (
                                    <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{v.deskripsi}</div>
                                  )}
                                  {/* Actions row */}
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const }}>
                                    {v.coming_soon_img && !hasVideo && (
                                      <span style={{ fontFamily: C.mono, fontSize: 9, color: '#555', border: `1px solid ${C.border}`, padding: '2px 7px', borderRadius: 3 }}>SEGERA</span>
                                    )}
                                    {isComingSoon && !v.coming_soon_img && (
                                      <span style={{ fontFamily: C.mono, fontSize: 9, color: '#555', border: `1px solid ${C.border}`, padding: '2px 7px', borderRadius: 3 }}>SEGERA</span>
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
                                          style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: '#000', background: G.gold, textDecoration: 'none', padding: '4px 10px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                          ▶ TONTON
                                        </a>
                                        {s !== 'selesai' ? (
                                          <button onClick={async () => {
                                            await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'selesai' }, { onConflict: 'member_id,video_id' });
                                            await trackVideoWatch(member!.id, v.id);
                                            setWatchRefreshKey(k => k + 1);
                                            loadData(member!);
                                          }} style={{ fontFamily: C.mono, fontSize: 10, color: C.up, background: '#0a1a14', border: `1px solid ${C.up}44`, padding: '4px 10px', cursor: 'pointer', borderRadius: 4 }}>
                                            ✓ SELESAI
                                          </button>
                                        ) : (
                                          <button onClick={async () => {
                                            await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'mulai' }, { onConflict: 'member_id,video_id' });
                                            loadData(member!);
                                          }} style={{ fontFamily: C.mono, fontSize: 10, color: '#555', background: 'transparent', border: `1px solid ${C.border}`, padding: '4px 10px', cursor: 'pointer', borderRadius: 4 }}>
                                            ↩ RESET
                                          </button>
                                        )}
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
          {active === 'materi' && (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// MATERI</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>File Materi</h2>
                <p style={{ color: C.dim, fontSize: 13, margin: '6px 0 0' }}>Download atau baca materi pendukung pembelajaran.</p>
              </div>
              {['file-basic','file-advanced'].map(kat => {
                const items = files.filter((f: any) => f.kategori === kat);
                if (!items.length) return null;
                return (
                  <div key={kat} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 14 }}>
                    <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: C.mono, color: kat==='file-basic'?C.up:'#a855f7', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                        {kat === 'file-basic' ? '// FILE BASIC' : '// FILE ADVANCED'}
                      </span>
                    </div>
                    {items.sort((a:any,b:any) => a.urutan-b.urutan).map((f: any) => (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 22 }}>📄</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{f.judul}</div>
                            <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 11, marginTop: 2 }}>{f.file_type || 'PDF'}</div>
                          </div>
                        </div>
                        {f.file_url && (
                          <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                            style={{ fontFamily: C.mono, fontSize: 11, color: kat==='file-basic'?C.up:'#a855f7', border: `1px solid`, borderColor: kat==='file-basic'?C.up:'#a855f7', padding: '6px 14px', textDecoration: 'none' }}>
                            ↗ BUKA
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
              {files.length === 0 && (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center' as const, fontFamily: C.mono, color: C.dim, fontSize: 13 }}>
                  — Belum ada file materi —
                </div>
              )}
            </div>
          )}

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
                          style={{ fontFamily: C.mono, fontSize: 10, color: G.gold, textDecoration: 'none', border: `1px solid #3a2e00`, padding: '2px 8px' }}>
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
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// MARKET NEWS</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Market Overview & News</h2>
              </div>
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1 }}>// ADVANCED CHART · REALTIME</span>
                  <span style={{ fontFamily: C.mono, color: C.dim, fontSize: 10 }}>POWERED BY TRADINGVIEW</span>
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
              <div style={{ background: 'linear-gradient(135deg,#0d0c00,#0a0a0a)', border: `1px solid #2a2200`, borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 14 }}>// LOT SIZE CALCULATOR</div>
                <LotCalculator/>
              </div>

              {/* Broker Rekomendasi — card grid */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// BROKER & PROP FIRM REKOMENDASI</div>
                {brokers.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {brokers.map((b: any) => (
                      <div key={b.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column' as const, gap: 8, transition: 'border-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#3a2e00'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                        {/* Icon + Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, background: '#1a1500', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: G.gold, flexShrink: 0, border: `1px solid #3a2e00` }}>
                            {b.nama?.[0]?.toUpperCase()}
                          </div>
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
                    ))}
                  </div>
                ) : (
                  <div style={{ color: C.dim, fontSize: 13, padding: '20px', background: C.panel, borderRadius: 12, textAlign: 'center' as const }}>
                    Belum ada rekomendasi broker.
                  </div>
                )}
              </div>

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
                              style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: '#a855f7', textDecoration: 'none', border: '1px solid #4a2a8a', padding: '5px 12px', borderRadius: 6, background: '#0f0a1a' }}>
                              BUKA LINK ▸
                            </a>
                          )}
                          {r.file_url && (
                            <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: C.up, textDecoration: 'none', border: `1px solid ${C.up}44`, padding: '5px 12px', borderRadius: 6, background: '#0a1410' }}>
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
                    {passMsg && <div style={{ background: '#0a1a0a', border: `1px solid ${C.up}`, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, color: C.up, borderRadius: 5 }}>{passMsg}</div>}
                    <button onClick={handleChangePassword} style={{ background: G.gold, color: '#000', fontFamily: C.mono, fontSize: 12, fontWeight: 700, padding: '10px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                      SIMPAN PASSWORD
                    </button>
                  </div>
                </div>

                {/* Link Discord */}
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ fontFamily: C.mono, color: '#5865F2', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>// DISCORD USERNAME</div>
                  <p style={{ color: C.dim, fontSize: 13, marginBottom: 14 }}>Hubungkan akun Discord kamu agar admin bisa verifikasi membership.</p>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>USERNAME DISCORD</div>
                    <input value={discordId || member.discord_username || ''} onChange={e => setDiscordId(e.target.value)}
                      placeholder="contoh: username#1234 atau @username" style={inp}
                      onFocus={e => e.target.style.borderColor = '#5865F2'} onBlur={e => e.target.style.borderColor = C.border2}/>
                  </div>
                  {settingMsg && <div style={{ fontFamily: C.mono, color: C.up, fontSize: 12, marginBottom: 8 }}>{settingMsg}</div>}
                  <button onClick={handleSaveDiscord} style={{ background: '#5865F2', color: '#fff', fontFamily: C.mono, fontSize: 12, fontWeight: 700, padding: '9px 18px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                    SIMPAN DISCORD
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
                <div style={{ fontFamily: C.mono, fontSize: 12, color: statusMsg.includes('Gagal') || statusMsg.includes('Tidak') ? C.down : C.up, marginBottom: 12, padding: '8px 14px', background: '#0a0a0a', borderRadius: 6 }}>
                  {statusMsg}
                </div>
              )}
              <button onClick={() => handleUpdateStatus(selectedStatus)} disabled={statusSaving}
                style={{ background: statusSaving ? '#1a1a1a' : G.gold, color: statusSaving ? '#444' : '#000', fontFamily: C.mono, fontSize: 13, fontWeight: 700, padding: '12px 28px', border: 'none', cursor: statusSaving ? 'not-allowed' : 'pointer', borderRadius: 8 }}>
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
          {active === 'sertifikat' && (() => {
            const isAdvanced = member.is_advance;
            const certDate = advanceReq?.updated_at
              ? new Date(advanceReq.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

            function downloadCertificate() {
              const canvas = document.getElementById('mr-cert-canvas') as HTMLCanvasElement;
              if (!canvas) return;
              const link = document.createElement('a');
              link.download = `Sertifikat_Advanced_${member.nama.replace(/\s+/g,'_')}.png`;
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
                    <div style={{ background: '#0a0a0a', border: `1px solid #2a2a2a`, borderRadius: 14, padding: 24, marginBottom: 20, overflow: 'auto' }}>
                      <CertificateCanvas
                        nama={member.nama}
                        tier={member.tier}
                        tanggal={certDate}
                      />
                    </div>
                    <button onClick={downloadCertificate}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: '#000', background: G.gold, padding: '13px 28px', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
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
                const payload = {
                  member_id: member!.id,
                  nama:    testiNama || member!.nama,
                  ulasan:  testiTeks.trim(),
                  bintang: testiBintang,
                  kelas:   member!.tier,
                  status:  myTestimonial ? myTestimonial.status : 'pending',
                };
                if (myTestimonial) {
                  await supabase.from('testimonials').update({...payload, status:'pending'}).eq('id', myTestimonial.id);
                  setMyTestimonial((p: any) => ({...p, ...payload, status:'pending'}));
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
              <div className='mr-content-pad' style={{ padding: 24 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// ULASAN</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Tulis Ulasanmu</h2>
                <p style={{ color: C.dim, fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
                  Bagikan pengalamanmu belajar di Menolak Rugi. Ulasan yang disetujui admin akan tampil di halaman utama.
                </p>

                {myTestimonial && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:C.panel, border:`1px solid ${STATUS_COLOR[myTestimonial.status]||C.border}44`, borderRadius:10, marginBottom:20 }}>
                    <span style={{ fontFamily:C.mono, fontSize:12, color:STATUS_COLOR[myTestimonial.status]||C.dim, fontWeight:700 }}>
                      {STATUS_LABEL[myTestimonial.status] || myTestimonial.status}
                    </span>
                  </div>
                )}

                {/* Bintang */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>BINTANG</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setTestiBintang(s)}
                        style={{ background:'none', border:'none', cursor:'pointer', fontSize:32, color:testiBintang>=s?G.gold:'#333', transition:'all 0.15s', transform:testiBintang>=s?'scale(1.1)':'scale(1)', padding:0, lineHeight:1 }}>★</button>
                    ))}
                    <span style={{ fontFamily:C.mono, color:G.gold, fontSize:14, fontWeight:700, marginLeft:8 }}>
                      {['','Kurang','Cukup','Bagus','Sangat Bagus','Luar Biasa!'][testiBintang]}
                    </span>
                  </div>
                </div>

                {/* Nama tampil */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily:C.mono, color:C.dim, fontSize:10, letterSpacing:1, marginBottom:8 }}>NAMA TAMPIL</div>
                  <input value={testiNama} onChange={e => setTestiNama(e.target.value)} placeholder={member!.nama}
                    style={{ width:'100%', maxWidth:360, background:C.panel, border:`1px solid ${C.border}`, color:C.text, padding:'11px 14px', fontSize:13, borderRadius:8, outline:'none', boxSizing:'border-box' as const }}
                    onFocus={e=>e.target.style.borderColor=G.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>

                {/* Teks ulasan */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily:C.mono, color:C.dim, fontSize:10, letterSpacing:1, marginBottom:8 }}>ULASANMU *</div>
                  <textarea value={testiTeks} onChange={e => setTestiTeks(e.target.value)} rows={5}
                    placeholder="Ceritakan pengalamanmu. Apa yang paling berkesan? Bagaimana perkembangan tradingmu setelah belajar di sini?"
                    style={{ width:'100%', background:C.panel, border:`1px solid ${C.border}`, color:C.text, padding:'11px 14px', fontSize:13, borderRadius:8, outline:'none', resize:'vertical' as const, boxSizing:'border-box' as const }}
                    onFocus={e=>e.target.style.borderColor=G.gold} onBlur={e=>e.target.style.borderColor=C.border}/>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:C.dim, marginTop:4 }}>{testiTeks.length} karakter</div>
                </div>

                {testiMsg && (
                  <div style={{ fontFamily:C.mono, fontSize:12, color:testiMsg.includes('Gagal')?C.down:C.up, marginBottom:16, padding:'10px 14px', background:C.panel, borderRadius:8 }}>
                    {testiMsg}
                  </div>
                )}

                <button onClick={submitTesti} disabled={testiSaving||!testiTeks.trim()}
                  style={{ fontFamily:C.mono, fontSize:12, fontWeight:700, color:'#000', background:testiSaving||!testiTeks.trim()?'#555':G.gold, padding:'12px 28px', border:'none', cursor:testiSaving?'not-allowed':'pointer', borderRadius:8 }}>
                  {testiSaving ? 'MENGIRIM...' : myTestimonial ? '↻ PERBARUI ULASAN' : '✓ KIRIM ULASAN'}
                </button>
              </div>
            );
          })()}

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

      {/* ── Mobile Bottom Nav ── */}
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
