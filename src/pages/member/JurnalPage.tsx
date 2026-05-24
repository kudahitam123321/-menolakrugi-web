import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

// ── Constants ────────────────────────────────────────────────────────────────
const C = {
  bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', border: 'var(--mr-border)', border2: 'var(--mr-border2)',
  dim: 'var(--mr-dim)', muted: 'var(--mr-muted)', text: 'var(--mr-text)',
  up: 'var(--mr-up)', down: 'var(--mr-down)', warn: '#f59e0b',
  mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};
const G = { gold: 'var(--mr-gold)', gold2: 'var(--mr-gold2)' };

const PAIRS    = ['XAUUSD','XAGUSD','GBPUSD','EURUSD','USDJPY','USDCHF','AUDUSD','NZDUSD','USDCAD','GBPJPY','EURJPY','NAS100','US30','SP500'];
const TFS      = ['M1','M5','M15','M30','H1','H4','D1','W1'];
const SETUPS   = ['Follow Trend BIAS','Counter Trend BIAS'];
const BIASES   = ['D1','H1','M15'];
const DIRS     = ['Buy','Sell'];
const SESIS    = ['Asia','London','New York','00-05'];
const HASILS   = ['Take Profit','Stop Loss','SL Profit','Break Even','Miss Entry','No Entry','Running'];
const FIBOS    = ['FIBO Entry','FIBO Deep','Tanpa FIBO'];
const EMOSIS   = ['Tenang','Overconfident','Fear','Greedy','Balas Dendam'];

const HASIL_COLOR: Record<string, string> = {
  'Take Profit': '#22c55e', 'Stop Loss': '#ef4444', 'SL Profit': '#f59e0b',
  'Break Even': '#888', 'Miss Entry': '#a78bfa', 'No Entry': '#60a5fa', 'Running': '#34d399',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface JurnalEntry {
  id: string;
  member_id: string;
  tanggal: string;
  pair: string;
  timeframe: string;
  setup: string;
  direction: string;
  sesi: string;
  hasil: string;
  rr: number | null;
  pnl: number | null;
  equity: number | null;
  bias: string;
  poi: string;
  fibo: string;
  emosi: string;
  alasan: string;
  chart1_url: string;
  chart2_url: string;
  chart3_url: string;
  keterangan: string;
  created_at: string;
}

interface JurnalSettings {
  equity_awal: number;
  daily_target: number;
  max_daily_loss: number;
  monthly_target: number;
}

const EMPTY_FORM = {
  tanggal: new Date().toISOString().split('T')[0],
  pair: 'XAUUSD', timeframe: 'H1', setup: 'Follow Trend BIAS',
  bias: 'H1', direction: 'Buy', sesi: 'London', hasil: 'Take Profit',
  rr: '', pnl: '', poi: '', fibo: 'FIBO Entry',
  emosi: 'Tenang', alasan: '', chart1_url: '', chart2_url: '',
  chart3_url: '', keterangan: '',
};

// ── Helper ───────────────────────────────────────────────────────────────────
function fmt(n: number | null | undefined, prefix = '', dec = 2) {
  if (n == null || isNaN(n)) return '—';
  const s = Math.abs(n).toFixed(dec);
  return (n < 0 ? '-' : '+') + prefix + s;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 120 }}>
      <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700, color: color || C.text, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontFamily: C.mono, color: C.muted, fontSize: 10, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Input Field ───────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0a0a0a', border: `1px solid ${C.border2}`,
  color: C.text, padding: '7px 10px', fontSize: 12, fontFamily: C.mono,
  outline: 'none', borderRadius: 5, boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

// ── Main Component ────────────────────────────────────────────────────────────
// ── Equity Curve Chart ───────────────────────────────────────────────────────
function EquityChart({ dataPoints, equityAwal }: { dataPoints: { label: string; equity: number; pnl: number }[]; equityAwal: number }) {
  const W = 800; const H = 200; const PAD = { top: 16, right: 16, bottom: 32, left: 64 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (dataPoints.length < 2) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: '#555', fontFamily: '"Geist Mono",monospace', fontSize: 11 }}>
      Butuh minimal 2 trade untuk menampilkan grafik
    </div>
  );

  const values  = dataPoints.map(d => d.equity);
  const minVal  = Math.min(equityAwal, ...values);
  const maxVal  = Math.max(equityAwal, ...values);
  const range   = maxVal - minVal || 1;
  const padded  = range * 0.1;
  const yMin    = minVal - padded;
  const yMax    = maxVal + padded;
  const yRange  = yMax - yMin;

  const toX = (i: number) => PAD.left + (i / (dataPoints.length - 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - ((v - yMin) / yRange) * innerH;

  // Build polyline points
  const pts = dataPoints.map((d, i) => `${toX(i).toFixed(1)},${toY(d.equity).toFixed(1)}`).join(' ');
  const fillPts = `${PAD.left},${(PAD.top + innerH).toFixed(1)} ${pts} ${(PAD.left + innerW).toFixed(1)},${(PAD.top + innerH).toFixed(1)}`;

  // Baseline (equity awal) Y
  const baselineY = toY(equityAwal);
  const endEquity = dataPoints[dataPoints.length - 1].equity;
  const isProfit  = endEquity >= equityAwal;
  const lineColor = isProfit ? '#22c55e' : '#ef4444';

  // Y axis ticks
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + (yRange / tickCount) * i);

  // X axis labels — show max 6 evenly spaced
  const labelIdxs = dataPoints.length <= 6
    ? dataPoints.map((_, i) => i)
    : [0, ...Array.from({ length: 4 }, (_, i) => Math.round((i + 1) * (dataPoints.length - 1) / 5)), dataPoints.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.02"/>
        </linearGradient>
        <clipPath id="eqClip">
          <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH}/>
        </clipPath>
      </defs>

      {/* Grid lines */}
      {yTicks.map((tick, i) => {
        const y = toY(tick);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="#1e1e1e" strokeWidth="1"/>
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="#555" fontSize="9" fontFamily='"Geist Mono",monospace'>
              ${Math.round(tick).toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Baseline (equity awal) */}
      <line x1={PAD.left} y1={baselineY} x2={PAD.left + innerW} y2={baselineY}
        stroke="#2a2a2a" strokeWidth="1.5" strokeDasharray="4,4"/>
      <text x={PAD.left - 6} y={baselineY - 4} textAnchor="end" fill="#444" fontSize="8" fontFamily='"Geist Mono",monospace'>
        AWAL
      </text>

      {/* Area fill */}
      <polygon points={fillPts} fill="url(#eqGrad)" clipPath="url(#eqClip)"/>

      {/* Line */}
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" clipPath="url(#eqClip)"/>

      {/* Data points */}
      {dataPoints.map((d, i) => {
        const x = toX(i); const y = toY(d.equity);
        const isLast = i === dataPoints.length - 1;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={isLast ? 5 : 3}
              fill={d.pnl >= 0 ? '#22c55e' : '#ef4444'}
              stroke="#090909" strokeWidth="1.5"/>
            {isLast && (
              <text x={x + 8} y={y + 4} fill={lineColor} fontSize="10" fontFamily='"Geist Mono",monospace' fontWeight="700">
                ${Math.round(d.equity).toLocaleString()}
              </text>
            )}
          </g>
        );
      })}

      {/* X labels */}
      {labelIdxs.map(i => (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill="#555" fontSize="8" fontFamily='"Geist Mono",monospace'>
          {dataPoints[i].label}
        </text>
      ))}

      {/* Border */}
      <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} fill="none" stroke="#1e1e1e" strokeWidth="1"/>
    </svg>
  );
}

export default function JurnalPage({ memberId }: { memberId: string }) {
  const [entries, setEntries]       = useState<JurnalEntry[]>([]);
  const [settings, setSettings]     = useState<JurnalSettings>({ equity_awal: 10000, daily_target: 200, max_daily_loss: 100, monthly_target: 3000 });
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [tab, setTab]               = useState<'input'|'tabel'|'statistik'|'pengaturan'>('tabel');
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editId, setEditId]         = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg]       = useState('');
  const [filterPair, setFilterPair] = useState('');
  const [filterHasil, setFilterHasil] = useState('');
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: jData }, { data: sData }] = await Promise.all([
        supabase.from('trading_journals').select('*').eq('member_id', memberId).order('tanggal', { ascending: false }),
        supabase.from('journal_settings').select('*').eq('member_id', memberId).single(),
      ]);
      if (jData) setEntries(jData);
      if (sData) setSettings(sData);
    } catch (_) {}
    setLoading(false);
  }, [memberId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Compute equity per row ──────────────────────────────────────────────────
  const entriesWithEquity = useCallback((): (JurnalEntry & { computedEquity: number })[] => {
    const sorted = [...entries].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime() || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let eq = settings.equity_awal;
    return sorted.map(e => {
      eq += (e.pnl ?? 0);
      return { ...e, computedEquity: eq };
    }).reverse();
  }, [entries, settings.equity_awal]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useCallback(() => {
    const valid = entries.filter(e => !['Miss Entry','No Entry','Running'].includes(e.hasil));
    const tp    = valid.filter(e => e.hasil === 'Take Profit');
    const sl    = valid.filter(e => e.hasil === 'Stop Loss');
    const totalPnl    = entries.reduce((s, e) => s + (e.pnl ?? 0), 0);
    const winRate     = (tp.length + sl.length) > 0 ? (tp.length / (tp.length + sl.length)) * 100 : 0;
    const avgRR       = tp.length ? tp.reduce((s, e) => s + (e.rr ?? 0), 0) / tp.length : 0;
    const grossProfit = tp.reduce((s, e) => s + (e.pnl ?? 0), 0);
    const grossLoss   = Math.abs(sl.reduce((s, e) => s + (e.pnl ?? 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const equityAkhir  = settings.equity_awal + totalPnl;

    // Best trade / worst trade
    const pnls = entries.map(e => e.pnl ?? 0);
    const bestTrade  = pnls.length ? Math.max(...pnls) : 0;
    const worstTrade = pnls.length ? Math.min(...pnls) : 0;

    // Best day profit (group by tanggal, sum PNL per day, pick highest)
    const dayMap: Record<string, number> = {};
    entries.forEach(e => { dayMap[e.tanggal] = (dayMap[e.tanggal] ?? 0) + (e.pnl ?? 0); });
    const dayPnls     = Object.values(dayMap);
    const bestDayPnl  = dayPnls.length ? Math.max(...dayPnls) : 0;

    // Consistency score: (Best Day PNL / Total PNL) × 100 — lower = more consistent
    // Range: 0–100 ideal < 30 = consistent
    const consistencyScore = totalPnl > 0 ? (bestDayPnl / totalPnl) * 100 : 0;

    // Win streak / lose streak
    const sorted = [...entries].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    let winStreak = 0, loseStreak = 0, curWin = 0, curLose = 0;
    sorted.forEach(e => {
      if (e.hasil === 'Take Profit' || e.hasil === 'SL Profit') {
        curWin++; curLose = 0;
        if (curWin > winStreak) winStreak = curWin;
      } else if (e.hasil === 'Stop Loss') {
        curLose++; curWin = 0;
        if (curLose > loseStreak) loseStreak = curLose;
      }
    });

    return { totalPnl, winRate, avgRR, profitFactor, equityAkhir,
      total: entries.length, tp: tp.length, sl: sl.length,
      bestTrade, worstTrade, bestDayPnl, consistencyScore, winStreak, loseStreak };
  }, [entries, settings.equity_awal]);

  // ── Pair performance ────────────────────────────────────────────────────────
  const pairStats = useCallback(() => {
    const map: Record<string, { trades: number; tp: number; pnl: number; rrSum: number; rrCount: number }> = {};
    entries.forEach(e => {
      if (!map[e.pair]) map[e.pair] = { trades: 0, tp: 0, pnl: 0, rrSum: 0, rrCount: 0 };
      map[e.pair].trades++;
      if (e.hasil === 'Take Profit') { map[e.pair].tp++; map[e.pair].rrSum += (e.rr ?? 0); map[e.pair].rrCount++; }
      map[e.pair].pnl += (e.pnl ?? 0);
    });
    return Object.entries(map).sort((a, b) => b[1].trades - a[1].trades);
  }, [entries]);

  // ── Monthly stats ────────────────────────────────────────────────────────────
  const monthlyStats = useCallback(() => {
    const map: Record<string, { trade: number; tp: number; sl: number; pnl: number; rrSum: number; rrCount: number; best: number; worst: number }> = {};
    entries.forEach(e => {
      const key = e.tanggal.slice(0, 7); // YYYY-MM
      if (!map[key]) map[key] = { trade: 0, tp: 0, sl: 0, pnl: 0, rrSum: 0, rrCount: 0, best: -Infinity, worst: Infinity };
      map[key].trade++;
      if (e.hasil === 'Take Profit') { map[key].tp++; map[key].rrSum += (e.rr ?? 0); map[key].rrCount++; }
      if (e.hasil === 'Stop Loss') map[key].sl++;
      map[key].pnl += (e.pnl ?? 0);
      if ((e.pnl ?? 0) > map[key].best) map[key].best = e.pnl ?? 0;
      if ((e.pnl ?? 0) < map[key].worst) map[key].worst = e.pnl ?? 0;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  // ── Save entry ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const payload = {
        member_id: memberId,
        tanggal: form.tanggal, pair: form.pair, timeframe: form.timeframe,
        setup: form.setup, bias: form.bias, direction: form.direction, sesi: form.sesi,
        hasil: form.hasil, rr: form.rr ? parseFloat(form.rr) : null,
        pnl: form.pnl ? parseFloat(form.pnl) : null,
        poi: form.poi, fibo: form.fibo, emosi: form.emosi,
        alasan: form.alasan, chart1_url: form.chart1_url,
        chart2_url: form.chart2_url, chart3_url: form.chart3_url,
        keterangan: form.keterangan,
      };
      if (editId) {
        const { error } = await supabase.from('trading_journals').update(payload).eq('id', editId);
        if (error) throw error;
        setMsg('✅ Trade berhasil diupdate!');
      } else {
        const { error } = await supabase.from('trading_journals').insert(payload);
        if (error) throw error;
        setMsg('✅ Trade berhasil disimpan!');
      }
      setForm(EMPTY_FORM); setEditId(null);
      await fetchAll();
      setTimeout(() => setTab('tabel'), 800);
    } catch (e: any) {
      setMsg('❌ Gagal simpan: ' + e.message);
    }
    setSaving(false);
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    await supabase.from('trading_journals').delete().eq('id', id);
    setDeleteId(null);
    await fetchAll();
  };

  // ── Delete All ───────────────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await supabase.from('trading_journals').delete().eq('member_id', memberId);
      setShowDeleteAll(false);
      await fetchAll();
    } catch (_) {}
    setDeletingAll(false);
  };

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const handleEdit = (e: JurnalEntry) => {
    setForm({
      tanggal: e.tanggal, pair: e.pair, timeframe: e.timeframe, setup: e.setup,
      bias: (e as any).bias ?? 'H1', direction: e.direction, sesi: e.sesi, hasil: e.hasil,
      rr: e.rr?.toString() ?? '', pnl: e.pnl?.toString() ?? '',
      poi: e.poi, fibo: e.fibo, emosi: e.emosi, alasan: e.alasan,
      chart1_url: e.chart1_url, chart2_url: e.chart2_url,
      chart3_url: e.chart3_url, keterangan: e.keterangan,
    });
    setEditId(e.id); setTab('input');
  };

  // ── Save settings ────────────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    setSettingsSaving(true); setSettingsMsg('');
    try {
      const { error } = await supabase.from('journal_settings').upsert({ member_id: memberId, ...settings });
      if (error) throw error;
      setSettingsMsg('✅ Pengaturan tersimpan!');
    } catch (e: any) {
      setSettingsMsg('❌ Gagal: ' + e.message);
    }
    setSettingsSaving(false);
    setTimeout(() => setSettingsMsg(''), 3000);
  };

  // ── Download Excel ────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const wb = XLSX.utils.book_new();

    // Sheet PENGATURAN
    const pengRows = [
      ['⚙️  PENGATURAN AKUN — Sesuaikan sebelum mengisi data','','',''],
      ['MODUL','PARAMETER','NILAI','KETERANGAN'],
      ['JOURNAL','Equity Awal Journal ($)', settings.equity_awal,'Saldo awal akun journal'],
      ['JOURNAL','Daily Target ($)', settings.daily_target,'Target profit harian'],
      ['JOURNAL','Max Daily Loss ($)', settings.max_daily_loss,'Batas kerugian harian'],
      ['JOURNAL','Monthly Target ($)', settings.monthly_target,'Target profit bulanan'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pengRows), 'PENGATURAN');

    // Sheet JOURNAL
    const ewq = entriesWithEquity();
    const jHeader = ['NO','TANGGAL','PAIR','TIMEFRAME','SETUP','DIRECTION','SESI','HASIL','RR','PNL ($)','EQUITY ($)','POI','FIBO','EMOSI','ALASAN','CHART 1','CHART 2','CHART 3','KETERANGAN'];
    const jRows = ewq.map((e, i) => [
      i + 1, e.tanggal, e.pair, e.timeframe, e.setup, e.direction, e.sesi,
      e.hasil, e.rr ?? '', e.pnl ?? '', e.computedEquity.toFixed(2),
      e.poi, e.fibo, e.emosi, e.alasan, e.chart1_url, e.chart2_url, e.chart3_url, e.keterangan,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([
      ['📈  PTMR TRADING JOURNAL — Menolak Rugi'],
      jHeader,
      ...jRows,
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'JOURNAL');

    // Sheet STATISTIK
    const s = stats();
    const statRows = [
      ['📊 STATISTIK JURNAL TRADING — MENOLAK RUGI'],
      [''],
      ['Total Trade', s.total],
      ['Total PNL ($)', s.totalPnl.toFixed(2)],
      ['Win Rate (%)', s.winRate.toFixed(1)],
      ['Avg RR (TP only)', s.avgRR.toFixed(2)],
      ['Profit Factor', isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : '∞'],
      ['Equity Awal ($)', settings.equity_awal],
      ['Equity Akhir ($)', s.equityAkhir.toFixed(2)],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statRows), 'STATISTIK');

    XLSX.writeFile(wb, `Jurnal_Trading_MenolakRugi_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // ── Import Excel ──────────────────────────────────────────────────────────────
  const [importing, setImporting]   = useState(false);
  const [importMsg, setImportMsg]   = useState('');
  const [showImport, setShowImport] = useState(false);

  function normalizeHasil(raw: string): string {
    const v = raw.trim().toLowerCase();
    if (['tp', 'take profit', 'takeprofit'].includes(v)) return 'Take Profit';
    if (['sl', 'stop loss', 'stop lose', 'stoploss', 'stoplose'].includes(v)) return 'Stop Loss';
    if (['sl profit', 'slprofit', 'sl-profit'].includes(v)) return 'SL Profit';
    if (['be', 'bep', 'break even', 'breakeven'].includes(v)) return 'Break Even';
    if (['miss entry', 'missentry'].includes(v)) return 'Miss Entry';
    if (['no entry', 'noentry'].includes(v)) return 'No Entry';
    if (v === 'running') return 'Running';
    // Fallback: return original trimmed value
    return raw.trim();
  }

  const REQUIRED_COLS = ['TANGGAL','PAIR','TIMEFRAME','SETUP','DIRECTION','SESI','HASIL','RR','PNL ($)'];

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportMsg('');
    try {
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: 'array', cellDates: true });
      // Try sheet named JOURNAL first, else first sheet
      const wsName = wb.SheetNames.includes('JOURNAL') ? 'JOURNAL' : wb.SheetNames[0];
      const ws   = wb.Sheets[wsName];

      // ── Auto-detect header row ──────────────────────────────────────────────
      // Some templates have a title row before the real header.
      // Scan up to 5 rows to find the one containing 'TANGGAL'.
      const rawAll: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (rawAll.length === 0) throw new Error('Sheet kosong atau tidak terbaca.');

      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(5, rawAll.length); i++) {
        if (rawAll[i].some((cell: any) => String(cell).trim() === 'TANGGAL')) {
          headerRowIdx = i;
          break;
        }
      }

      // Re-read using detected header row index
      const rows: any[] = XLSX.utils.sheet_to_json(ws, {
        defval: '',
        range: headerRowIdx, // 0-based: skip title rows
      });

      if (rows.length === 0) throw new Error('Sheet kosong atau tidak terbaca.');

      // Validate columns
      const cols = Object.keys(rows[0]);
      const missing = REQUIRED_COLS.filter(c => !cols.includes(c));
      if (missing.length) throw new Error(`Kolom tidak sesuai. Kolom yang hilang: ${missing.join(', ')}`);

      // Build payloads
      const payloads = rows
        .filter(r => r['TANGGAL'] && r['PAIR'])
        .map(r => {
          // Handle date: could be Date object or string
          let tgl = '';
          if (r['TANGGAL'] instanceof Date) {
            tgl = r['TANGGAL'].toISOString().split('T')[0];
          } else {
            tgl = String(r['TANGGAL']).trim();
          }
          return {
            member_id:   memberId,
            tanggal:     tgl,
            pair:        String(r['PAIR']        || 'XAUUSD').trim(),
            timeframe:   String(r['TIMEFRAME']   || 'H1').trim(),
            setup:       String(r['SETUP']       || 'Follow Trend BIAS').trim(),
            bias:        String(r['BIAS']        || 'H1').trim(),
            direction:   String(r['DIRECTION']   || 'Buy').trim(),
            sesi:        String(r['SESI']        || 'London').trim(),
            hasil:       normalizeHasil(String(r['HASIL'] || 'Take Profit')),
            rr:          parseFloat(r['RR'])          || null,
            pnl:         parseFloat(r['PNL ($)'])     || null,
            poi:         String(r['POI']         || '').trim(),
            fibo:        String(r['FIBO']        || 'FIBO Entry').trim(),
            emosi:       String(r['EMOSI']       || 'Tenang').trim(),
            alasan:      String(r['ALASAN']      || '').trim(),
            chart1_url:  String(r['CHART 1']     || '').trim(),
            chart2_url:  String(r['CHART 2']     || '').trim(),
            chart3_url:  String(r['CHART 3']     || '').trim(),
            keterangan:  String(r['KETERANGAN']  || '').trim(),
          };
        });

      if (payloads.length === 0) throw new Error('Tidak ada baris data yang valid.');

      const { error } = await supabase.from('trading_journals').insert(payloads);
      if (error) throw error;
      setImportMsg(`✅ Berhasil import ${payloads.length} trade!`);
      setShowImport(false);
      await fetchAll();
    } catch (err: any) {
      setImportMsg('❌ ' + (err.message || 'Gagal import'));
    }
    setImporting(false);
    e.target.value = '';
  };

  // ── Filtered entries ──────────────────────────────────────────────────────────
  const filtered = entriesWithEquity().filter(e =>
    (!filterPair || e.pair === filterPair) &&
    (!filterHasil || e.hasil === filterHasil)
  );

  const s = stats();
  const monthlyData = monthlyStats();
  const pairData    = pairStats();

  const tabStyle = (t: string): React.CSSProperties => ({
    fontFamily: C.mono, fontSize: 11, letterSpacing: 1, padding: '8px 16px',
    borderRadius: 5, cursor: 'pointer', border: 'none',
    background: tab === t ? G.gold : 'transparent',
    color: tab === t ? '#fff' : C.muted,
    transition: 'all .2s',
  });

  if (loading) return (
    <div style={{ color: C.muted, fontFamily: C.mono, fontSize: 12, padding: 40, textAlign: 'center' }}>
      Memuat jurnal...
    </div>
  );

  return (
    <div style={{ fontFamily: C.sans, color: C.text, padding: '0 0 40px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>// TRADING JOURNAL</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Jurnal Trading SMC</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowImport(v => !v)}
            style={{ fontFamily: C.mono, fontSize: 11, background: '#0c1a2e', border: `1px solid #3b82f6`, color: '#60a5fa', padding: '8px 18px', borderRadius: 6, cursor: 'pointer', letterSpacing: 1 }}>
            📤 IMPORT EXCEL
          </button>
          <button onClick={handleDownload}
            style={{ fontFamily: C.mono, fontSize: 11, background: '#052e16', border: `1px solid ${G.gold}`, color: G.gold, padding: '8px 18px', borderRadius: 6, cursor: 'pointer', letterSpacing: 1 }}>
            📥 DOWNLOAD EXCEL
          </button>
          <button onClick={() => setShowDeleteAll(true)}
            style={{ fontFamily: C.mono, fontSize: 11, background: '#1c0a0a', border: '1px solid #7f1d1d', color: '#ef4444', padding: '8px 18px', borderRadius: 6, cursor: 'pointer', letterSpacing: 1 }}>
            🗑️ HAPUS SEMUA
          </button>
        </div>
      </div>

      {/* ── Import Panel ── */}
      {showImport && (
        <div style={{ background: '#0c1a2e', border: '1px solid #1d4ed8', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: C.mono, color: '#60a5fa', fontSize: 11, letterSpacing: 1, marginBottom: 12 }}>// IMPORT DATA DARI EXCEL</div>
          {/* Warning format */}
          <div style={{ background: '#1c1200', border: '1px solid #78350f', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ fontFamily: C.mono, color: C.warn, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>⚠️ FORMAT WAJIB SESUAI — Kolom yang diperlukan:</div>
            <div style={{ fontFamily: C.mono, color: '#d97706', fontSize: 10, lineHeight: 1.8 }}>
              <span style={{ color: '#ef4444' }}>*Wajib: </span>
              TANGGAL · PAIR · TIMEFRAME · SETUP · DIRECTION · SESI · HASIL · RR · PNL ($)<br/>
              <span style={{ color: C.muted }}>Opsional: </span>
              BIAS · POI · FIBO · EMOSI · ALASAN · CHART 1 · CHART 2 · CHART 3 · KETERANGAN
            </div>
            <div style={{ fontFamily: C.mono, color: C.muted, fontSize: 10, marginTop: 8 }}>
              📌 Gunakan sheet bernama <span style={{ color: '#60a5fa' }}>JOURNAL</span> atau sheet pertama dalam file.<br/>
              📌 Format tanggal: <span style={{ color: '#60a5fa' }}>YYYY-MM-DD</span> (contoh: 2025-01-15)<br/>
              📌 PNL negatif untuk loss (contoh: -50), positif untuk profit (contoh: 150)<br/>
              📌 Download template via tombol <span style={{ color: G.gold }}>DOWNLOAD EXCEL</span> di atas sebagai referensi format.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ cursor: importing ? 'not-allowed' : 'pointer' }}>
              <input type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={importing}
                style={{ display: 'none' }} />
              <span style={{ fontFamily: C.mono, fontSize: 12, background: importing ? '#1a1a1a' : '#1d4ed8', color: '#fff', padding: '9px 22px', borderRadius: 6, letterSpacing: 1, opacity: importing ? 0.6 : 1, display: 'inline-block' }}>
                {importing ? 'MENGIMPORT...' : '📁 PILIH FILE EXCEL'}
              </span>
            </label>
            {importMsg && (
              <span style={{ fontFamily: C.mono, fontSize: 11, color: importMsg.startsWith('✅') ? C.up : C.down }}>
                {importMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Stat bar row 1 ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <StatCard label="TOTAL TRADE" value={String(s.total)} />
        <StatCard label="TOTAL PNL" value={fmt(s.totalPnl, '$')} color={s.totalPnl >= 0 ? C.up : C.down} />
        <StatCard label="WIN RATE" value={s.total ? s.winRate.toFixed(1) + '%' : '—'} color={s.winRate >= 50 ? C.up : C.down} />
        <StatCard label="AVG RR (TP)" value={s.avgRR ? s.avgRR.toFixed(2) : '—'} color={C.warn} />
        <StatCard label="EQUITY AKHIR" value={'$' + s.equityAkhir.toFixed(0)} color={s.equityAkhir >= settings.equity_awal ? C.up : C.down} sub={'Awal: $' + settings.equity_awal.toLocaleString()} />
        <StatCard label="PROFIT FACTOR" value={isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : s.profitFactor > 0 ? '∞' : '—'} color={s.profitFactor >= 1 ? C.up : C.down} />
      </div>
      {/* ── Stat bar row 2 ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatCard label="PROFIT TERBESAR" value={s.total ? fmt(s.bestTrade, '$') : '—'} color={C.up} sub="Trade terbaik" />
        <StatCard label="LOSS TERBESAR" value={s.total ? fmt(s.worstTrade, '$') : '—'} color={C.down} sub="Trade terburuk" />
        <StatCard label="WIN STREAK" value={s.total ? String(s.winStreak) : '—'} color={C.up} sub="Consecutive TP" />
        <StatCard label="LOSE STREAK" value={s.total ? String(s.loseStreak) : '—'} color={C.down} sub="Consecutive SL" />
        <StatCard
          label="CONSISTENCY SCORE"
          value={s.totalPnl > 0 ? s.consistencyScore.toFixed(1) + '%' : '—'}
          color={s.consistencyScore > 0 && s.consistencyScore < 30 ? C.up : s.consistencyScore >= 30 && s.consistencyScore < 50 ? C.warn : C.down}
          sub={s.consistencyScore < 30 ? '✅ Konsisten' : s.consistencyScore < 50 ? '⚠️ Cukup' : '❌ Tidak konsisten'}
        />
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {(['input','tabel','statistik','pengaturan'] as const).map(t => (
          <button key={t} style={tabStyle(t)} onClick={() => { setTab(t); if (t === 'input' && !editId) setForm(EMPTY_FORM); }}>
            {t === 'input' ? (editId ? '✏️ EDIT' : '➕ INPUT') : t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: INPUT */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'input' && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 20 }}>
            {editId ? '// EDIT TRADE' : '// TAMBAH TRADE BARU'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>

            <Field label="TANGGAL">
              <input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="PAIR">
              <select value={form.pair} onChange={e => setForm(f => ({ ...f, pair: e.target.value }))} style={selectStyle}>
                {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="TIMEFRAME">
              <select value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))} style={selectStyle}>
                {TFS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="SETUP">
              <select value={form.setup} onChange={e => setForm(f => ({ ...f, setup: e.target.value }))} style={selectStyle}>
                {SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="BIAS">
              <select value={form.bias} onChange={e => setForm(f => ({ ...f, bias: e.target.value }))} style={{ ...selectStyle, color: '#60a5fa' }}>
                {BIASES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="DIRECTION">
              <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))} style={selectStyle}>
                {DIRS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="SESI">
              <select value={form.sesi} onChange={e => setForm(f => ({ ...f, sesi: e.target.value }))} style={selectStyle}>
                {SESIS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="HASIL">
              <select value={form.hasil} onChange={e => setForm(f => ({ ...f, hasil: e.target.value }))} style={{ ...selectStyle, color: HASIL_COLOR[form.hasil] ?? C.text }}>
                {HASILS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </Field>
            <Field label="RR RATIO">
              <input type="number" step="0.1" min="0" placeholder="1.5" value={form.rr} onChange={e => setForm(f => ({ ...f, rr: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="PNL ($)">
              <input type="number" step="0.01" placeholder="+100 atau -50" value={form.pnl} onChange={e => setForm(f => ({ ...f, pnl: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="POI">
              <input type="text" placeholder="OB H4 / FVG M15..." value={form.poi} onChange={e => setForm(f => ({ ...f, poi: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="FIBO">
              <select value={form.fibo} onChange={e => setForm(f => ({ ...f, fibo: e.target.value }))} style={selectStyle}>
                {FIBOS.map(fi => <option key={fi} value={fi}>{fi}</option>)}
              </select>
            </Field>
            <Field label="EMOSI">
              <select value={form.emosi} onChange={e => setForm(f => ({ ...f, emosi: e.target.value }))} style={selectStyle}>
                {EMOSIS.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ marginTop: 14 }}>
            <Field label="ALASAN ENTRY">
              <textarea value={form.alasan} onChange={e => setForm(f => ({ ...f, alasan: e.target.value }))}
                placeholder="Jelaskan setup, konfirmasi, dll..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
            <Field label="CHART 1 (URL)">
              <input type="url" placeholder="https://..." value={form.chart1_url} onChange={e => setForm(f => ({ ...f, chart1_url: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="CHART 2 (URL)">
              <input type="url" placeholder="https://..." value={form.chart2_url} onChange={e => setForm(f => ({ ...f, chart2_url: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="CHART 3 (URL)">
              <input type="url" placeholder="https://..." value={form.chart3_url} onChange={e => setForm(f => ({ ...f, chart3_url: e.target.value }))} style={inputStyle} />
            </Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <Field label="KETERANGAN">
              <textarea value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                placeholder="Catatan tambahan..." rows={2}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ fontFamily: C.mono, fontSize: 12, background: G.gold, border: 'none', color: '#fff', padding: '10px 28px', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, letterSpacing: 1 }}>
              {saving ? 'MENYIMPAN...' : editId ? '💾 UPDATE' : '💾 SIMPAN'}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm(EMPTY_FORM); setTab('tabel'); }}
                style={{ fontFamily: C.mono, fontSize: 12, background: 'transparent', border: `1px solid ${C.border2}`, color: C.muted, padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>
                BATAL
              </button>
            )}
            {msg && <span style={{ fontFamily: C.mono, fontSize: 11, color: msg.startsWith('✅') ? C.up : C.down }}>{msg}</span>}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: TABEL */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'tabel' && (
        <div>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <select value={filterPair} onChange={e => setFilterPair(e.target.value)}
              style={{ ...selectStyle, width: 'auto', background: C.panel, border: `1px solid ${C.border2}` }}>
              <option value="">Semua Pair</option>
              {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterHasil} onChange={e => setFilterHasil(e.target.value)}
              style={{ ...selectStyle, width: 'auto', background: C.panel, border: `1px solid ${C.border2}` }}>
              <option value="">Semua Hasil</option>
              {HASILS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span style={{ fontFamily: C.mono, color: C.muted, fontSize: 11, alignSelf: 'center' }}>
              {filtered.length} trade
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, fontFamily: C.mono, fontSize: 12 }}>
              Belum ada data jurnal.<br/>
              <span style={{ color: G.gold, cursor: 'pointer' }} onClick={() => setTab('input')}>+ Tambah trade pertama</span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.mono, fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border2}` }}>
                    {['NO','TGL','PAIR','TF','SETUP','DIR','SESI','HASIL','RR','PNL ($)','EQUITY ($)','EMOSI','KOREKSI',''].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: C.dim, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background .15s' }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = '#161616')}
                      onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '8px 10px', color: C.muted }}>{filtered.length - i}</td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{e.tanggal}</td>
                      <td style={{ padding: '8px 10px', color: G.gold, fontWeight: 700 }}>{e.pair}</td>
                      <td style={{ padding: '8px 10px', color: C.muted }}>{e.timeframe}</td>
                      <td style={{ padding: '8px 10px' }}>{e.setup}</td>
                      <td style={{ padding: '8px 10px', color: e.direction === 'Buy' ? C.up : C.down, fontWeight: 700 }}>{e.direction}</td>
                      <td style={{ padding: '8px 10px', color: C.muted }}>{e.sesi}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ color: HASIL_COLOR[e.hasil] ?? C.text, fontWeight: 600 }}>{e.hasil}</span>
                      </td>
                      <td style={{ padding: '8px 10px', color: C.warn }}>{e.rr ?? '—'}</td>
                      <td style={{ padding: '8px 10px', color: (e.pnl ?? 0) >= 0 ? C.up : C.down, fontWeight: 600 }}>
                        {e.pnl != null ? (e.pnl >= 0 ? '+' : '') + e.pnl.toFixed(2) : '—'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>${e.computedEquity.toFixed(0)}</td>
                      <td style={{ padding: '8px 10px', color: C.muted }}>{e.emosi}</td>
                      {/* Admin note */}
                      <td style={{ padding: '8px 10px', minWidth: 200 }}>
                        {(e as any).admin_note ? (
                          <div style={{ background: '#0a1a0e', border: '1px solid #16a34a44', borderRadius: 6, padding: '6px 10px' }}>
                            <div style={{ fontFamily: C.mono, fontSize: 8, color: G.gold, letterSpacing: 1, marginBottom: 3 }}>📝 KOREKSI MENTOR</div>
                            <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{(e as any).admin_note}</div>
                            {(e as any).admin_note_at && <div style={{ fontFamily: C.mono, fontSize: 8, color: C.muted, marginTop: 3 }}>{new Date((e as any).admin_note_at).toLocaleDateString('id-ID')}</div>}
                          </div>
                        ) : <span style={{ color: C.dim, fontSize: 10 }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <button onClick={() => handleEdit(e)}
                          style={{ background: 'transparent', border: `1px solid ${C.border2}`, color: C.muted, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10, marginRight: 4 }}>
                          Edit
                        </button>
                        <button onClick={() => setDeleteId(e.id)}
                          style={{ background: 'transparent', border: `1px solid #7f1d1d`, color: '#ef4444', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: STATISTIK */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'statistik' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Equity Curve ── */}
          {(() => {
            const sorted = [...entries].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime() || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            let eq = settings.equity_awal;
            const dataPoints = sorted.map(e => {
              eq += (e.pnl ?? 0);
              // Format label: DD/MM
              const d = new Date(e.tanggal);
              const label = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
              return { label, equity: eq, pnl: e.pnl ?? 0 };
            });
            const lastEq = dataPoints.length ? dataPoints[dataPoints.length - 1].equity : settings.equity_awal;
            const gain = lastEq - settings.equity_awal;
            return (
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1 }}>// EQUITY CURVE</div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontFamily: C.mono, fontSize: 11 }}>
                      <span style={{ color: C.dim }}>Awal: </span>
                      <span style={{ color: C.text }}>${settings.equity_awal.toLocaleString()}</span>
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 11 }}>
                      <span style={{ color: C.dim }}>Akhir: </span>
                      <span style={{ color: lastEq >= settings.equity_awal ? C.up : C.down, fontWeight: 700 }}>
                        ${lastEq.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: gain >= 0 ? C.up : C.down }}>
                      {gain >= 0 ? '+' : ''}{gain.toFixed(2)} ({gain >= 0 ? '+' : ''}{settings.equity_awal ? (gain / settings.equity_awal * 100).toFixed(1) : 0}%)
                    </div>
                  </div>
                </div>
                <EquityChart dataPoints={dataPoints} equityAwal={settings.equity_awal} />
              </div>
            );
          })()}

          {/* Breakdown hasil */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>// BREAKDOWN HASIL</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {HASILS.map(h => {
                const count = entries.filter(e => e.hasil === h).length;
                const pct = entries.length ? ((count / entries.length) * 100).toFixed(1) : '0';
                const pnl = entries.filter(e => e.hasil === h).reduce((s, e) => s + (e.pnl ?? 0), 0);
                return (
                  <div key={h} style={{ background: '#0a0a0a', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ color: HASIL_COLOR[h], fontSize: 10, fontFamily: C.mono, marginBottom: 4 }}>{h}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: C.mono }}>{count}</div>
                    <div style={{ color: C.muted, fontSize: 10, fontFamily: C.mono }}>{pct}% · {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pair performance */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>// PAIR PERFORMANCE</div>
            {pairData.length === 0 ? <div style={{ color: C.muted, fontFamily: C.mono, fontSize: 11 }}>Belum ada data.</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.mono, fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border2}` }}>
                    {['PAIR','TRADES','WIN RATE','TOTAL PNL ($)','AVG RR'].map(h => (
                      <th key={h} style={{ padding: '6px 12px', textAlign: 'left', color: C.dim }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pairData.map(([pair, d]) => {
                    const wr = d.trades ? ((d.tp / d.trades) * 100).toFixed(1) : '0';
                    const avgRR = d.rrCount ? (d.rrSum / d.rrCount).toFixed(2) : '—';
                    return (
                      <tr key={pair} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '7px 12px', color: G.gold, fontWeight: 700 }}>{pair}</td>
                        <td style={{ padding: '7px 12px' }}>{d.trades}</td>
                        <td style={{ padding: '7px 12px', color: parseFloat(wr) >= 50 ? C.up : C.down }}>{wr}%</td>
                        <td style={{ padding: '7px 12px', color: d.pnl >= 0 ? C.up : C.down, fontWeight: 600 }}>{d.pnl >= 0 ? '+' : ''}${d.pnl.toFixed(2)}</td>
                        <td style={{ padding: '7px 12px', color: C.warn }}>{avgRR}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Monthly performance */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>// MONTHLY PERFORMANCE</div>
            {monthlyData.length === 0 ? <div style={{ color: C.muted, fontFamily: C.mono, fontSize: 11 }}>Belum ada data.</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.mono, fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border2}` }}>
                      {['BULAN','TRADE','TP','SL','WIN RATE','TOTAL PNL ($)','AVG RR','BEST ($)','WORST ($)'].map(h => (
                        <th key={h} style={{ padding: '6px 12px', textAlign: 'left', color: C.dim, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map(([month, d]) => {
                      const wr = d.trade ? ((d.tp / d.trade) * 100).toFixed(1) : '0';
                      const avgRR = d.rrCount ? (d.rrSum / d.rrCount).toFixed(2) : '—';
                      const [yr, mo] = month.split('-');
                      const label = new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
                      return (
                        <tr key={month} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>{label}</td>
                          <td style={{ padding: '7px 12px' }}>{d.trade}</td>
                          <td style={{ padding: '7px 12px', color: C.up }}>{d.tp}</td>
                          <td style={{ padding: '7px 12px', color: C.down }}>{d.sl}</td>
                          <td style={{ padding: '7px 12px', color: parseFloat(wr) >= 50 ? C.up : C.down }}>{wr}%</td>
                          <td style={{ padding: '7px 12px', color: d.pnl >= 0 ? C.up : C.down, fontWeight: 600 }}>{d.pnl >= 0 ? '+' : ''}${d.pnl.toFixed(2)}</td>
                          <td style={{ padding: '7px 12px', color: C.warn }}>{avgRR}</td>
                          <td style={{ padding: '7px 12px', color: C.up }}>{d.best !== -Infinity ? '+$' + d.best.toFixed(2) : '—'}</td>
                          <td style={{ padding: '7px 12px', color: C.down }}>{d.worst !== Infinity ? '$' + d.worst.toFixed(2) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sesi + Emosi */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { title: 'SESI PERFORMANCE', items: SESIS },
              { title: 'EMOSI', items: EMOSIS },
            ].map(({ title, items }) => (
              <div key={title} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 14 }}>// {title}</div>
                {items.map(item => {
                  const key = title.includes('SESI') ? 'sesi' : 'emosi';
                  const count = entries.filter(e => e[key as keyof JurnalEntry] === item).length;
                  const pct = entries.length ? (count / entries.length) * 100 : 0;
                  return (
                    <div key={item} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C.mono, fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: C.muted }}>{item}</span>
                        <span style={{ color: C.text }}>{count} trade</span>
                      </div>
                      <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                        <div style={{ height: '100%', width: pct + '%', background: G.gold, borderRadius: 2, transition: 'width .5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB: PENGATURAN */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'pengaturan' && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, maxWidth: 480 }}>
          <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 20 }}>// PENGATURAN AKUN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'equity_awal',    label: 'EQUITY AWAL JOURNAL ($)', desc: 'Saldo awal — dasar perhitungan equity' },
              { key: 'daily_target',   label: 'DAILY TARGET ($)',         desc: 'Target profit harian' },
              { key: 'max_daily_loss', label: 'MAX DAILY LOSS ($)',       desc: 'Batas kerugian harian' },
              { key: 'monthly_target', label: 'MONTHLY TARGET ($)',       desc: 'Target profit bulanan' },
            ].map(({ key, label, desc }) => (
              <div key={key}>
                <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 5 }}>{label}</div>
                <input type="number" min="0" step="100" value={(settings as any)[key]}
                  onChange={e => setSettings(s => ({ ...s, [key]: parseFloat(e.target.value) || 0 }))}
                  style={inputStyle} />
                <div style={{ fontFamily: C.mono, color: '#333', fontSize: 10, marginTop: 4 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button onClick={handleSaveSettings} disabled={settingsSaving}
              style={{ fontFamily: C.mono, fontSize: 12, background: G.gold, border: 'none', color: '#fff', padding: '10px 28px', borderRadius: 6, cursor: settingsSaving ? 'not-allowed' : 'pointer', opacity: settingsSaving ? 0.7 : 1, letterSpacing: 1 }}>
              {settingsSaving ? 'MENYIMPAN...' : '💾 SIMPAN'}
            </button>
            {settingsMsg && <span style={{ fontFamily: C.mono, fontSize: 11, color: settingsMsg.startsWith('✅') ? C.up : C.down }}>{settingsMsg}</span>}
          </div>
        </div>
      )}

      {/* ── Delete All confirm modal ── */}
      {showDeleteAll && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#111', border: '1px solid #7f1d1d', borderRadius: 12, padding: 32, maxWidth: 400, width: '90%' }}>
            <div style={{ fontFamily: C.mono, color: C.down, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>⚠️ HAPUS SEMUA DATA JURNAL?</div>
            <div style={{ fontFamily: C.sans, color: C.muted, fontSize: 13, marginBottom: 8, lineHeight: 1.6 }}>
              Semua <span style={{ color: C.text, fontWeight: 700 }}>{entries.length} data trade</span> akan dihapus secara permanen dan tidak bisa dikembalikan.
            </div>
            <div style={{ fontFamily: C.mono, color: '#7f1d1d', fontSize: 11, background: '#1c0a0a', border: '1px solid #450a0a', borderRadius: 6, padding: '8px 12px', marginBottom: 22 }}>
              ❌ Tindakan ini tidak dapat dibatalkan!
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleDeleteAll} disabled={deletingAll}
                style={{ fontFamily: C.mono, fontSize: 12, background: deletingAll ? '#450a0a' : '#7f1d1d', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 6, cursor: deletingAll ? 'not-allowed' : 'pointer', opacity: deletingAll ? 0.7 : 1, letterSpacing: 1 }}>
                {deletingAll ? 'MENGHAPUS...' : '🗑️ YA, HAPUS SEMUA'}
              </button>
              <button onClick={() => setShowDeleteAll(false)} disabled={deletingAll}
                style={{ fontFamily: C.mono, fontSize: 12, background: 'transparent', border: `1px solid ${C.border2}`, color: C.muted, padding: '10px 20px', borderRadius: 6, cursor: 'pointer' }}>
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#111', border: `1px solid ${C.border2}`, borderRadius: 12, padding: 28, maxWidth: 360, width: '90%' }}>
            <div style={{ fontFamily: C.mono, color: C.down, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>⚠️ Hapus Trade?</div>
            <div style={{ fontFamily: C.sans, color: C.muted, fontSize: 13, marginBottom: 20 }}>Data trade ini akan dihapus permanen dan tidak bisa dikembalikan.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleDelete(deleteId)}
                style={{ fontFamily: C.mono, fontSize: 12, background: '#7f1d1d', border: 'none', color: '#fff', padding: '9px 20px', borderRadius: 6, cursor: 'pointer' }}>
                HAPUS
              </button>
              <button onClick={() => setDeleteId(null)}
                style={{ fontFamily: C.mono, fontSize: 12, background: 'transparent', border: `1px solid ${C.border2}`, color: C.muted, padding: '9px 20px', borderRadius: 6, cursor: 'pointer' }}>
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
