// lib/backtest.ts — Pembaca export Strategy Tester TradingView.
// Port langsung dari fungsi btToTrades / btReadCsv / btLoadFile di dashboard
// "PTMR Backtest" (D:\backtest\BACKTEST FIX.html), supaya data yang diunggah admin
// berformat persis sama dengan yang dipahami public/backtest-indikator.html.
import * as XLSX from 'xlsx';

export interface BtTrade {
  trade: number; side: 'BUY' | 'SELL'; entry_time: string; exit_time: string;
  entry_price: number | ''; exit_price: number | ''; qty: number | '';
  pnl_usd: number; cum_pnl_usd: number; bars: number | ''; result: 'Win' | 'Loss';
  entry_hour: number; weekday: string; weekday_no: number; month: string;
}
export interface BtSetting { setting: string; value: string }
export interface BtData { trades: BtTrade[]; settings: BtSetting[] }

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** = btToTrades: tabel (baris pertama header) → satu baris per trade. */
export function tradesDariTabel(table: unknown[][]): BtTrade[] {
  const head = (table[0] || []).map((h) => String(h ?? '').trim());
  const find = (re: RegExp, not?: RegExp) => head.findIndex((h) => re.test(h) && !(not && not.test(h)));
  const col = {
    trade: find(/^trade/i), type: find(/^type$/i), time: find(/date/i), price: find(/^price/i),
    qty: find(/^(size \(qty\)|contracts|quantity|size)/i), pnl: find(/^(net )?p&?n?l|^profit/i, /%|cumulative/i),
    bars: find(/bars/i),
  };
  if (col.trade < 0 || col.type < 0 || col.time < 0 || col.pnl < 0) throw new Error('missing columns');
  const toTime = (v: unknown) => {
    if (typeof v === 'number') return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 16).replace('T', ' ');
    return String(v ?? '').trim().replace('T', ' ').slice(0, 16);
  };
  const byTrade = new Map<number, { entry?: unknown[]; exit?: unknown[]; long?: boolean }>();
  for (const r of table.slice(1)) {
    const id = Number(r[col.trade]);
    const type = String(r[col.type] ?? '');
    if (!Number.isFinite(id) || !type) continue;
    const g = byTrade.get(id) || {};
    if (/^entry/i.test(type)) g.entry = r; else if (/^exit/i.test(type)) g.exit = r;
    g.long = /long/i.test(type);
    byTrade.set(id, g);
  }
  let cum = 0;
  const out: BtTrade[] = [];
  for (const id of [...byTrade.keys()].sort((a, b) => a - b)) {
    const g = byTrade.get(id)!;
    if (!g.entry || !g.exit) continue;
    const pnl = Number(String(g.exit[col.pnl] ?? g.entry[col.pnl]).replace(/[^0-9.\-]/g, ''));
    if (!Number.isFinite(pnl)) continue;
    cum += pnl;
    const et = toTime(g.entry[col.time]);
    const d = new Date(et.replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) continue;
    const wd = d.getUTCDay();
    out.push({
      trade: id, side: g.long ? 'BUY' : 'SELL', entry_time: et, exit_time: toTime(g.exit[col.time]),
      entry_price: col.price >= 0 ? Number(g.entry[col.price]) : '', exit_price: col.price >= 0 ? Number(g.exit[col.price]) : '',
      qty: col.qty >= 0 ? Number(g.entry[col.qty]) : '', pnl_usd: Math.round(pnl * 100) / 100,
      cum_pnl_usd: Math.round(cum * 100) / 100, bars: col.bars >= 0 ? Number(g.exit[col.bars]) : '',
      result: pnl > 0 ? 'Win' : 'Loss', entry_hour: d.getUTCHours(), weekday: HARI[wd], weekday_no: wd === 0 ? 7 : wd,
      month: et.slice(0, 7),
    });
  }
  if (!out.length) throw new Error('no trades');
  return out;
}

function denganModalAwal(settings: BtSetting[]): BtSetting[] {
  if (settings.some((r) => r.setting === 'Initial capital')) return settings;
  return [{ setting: 'Initial capital', value: '10000' }, ...settings];
}

/** = cabang .xlsx btLoadFile. */
export function bacaWorkbook(wb: XLSX.WorkBook): BtData {
  const names = wb.SheetNames;
  const tName = names.find((n) => /trades$/i.test(n) && !/analysis/i.test(n)) || names.find((n) => /trade/i.test(n));
  const pName = names.find((n) => /propert/i.test(n));
  const rows = (n?: string) => (n ? XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1, raw: true }) : []);
  const settings = rows(pName).slice(1)
    .filter((r) => r[0] != null && r[1] != null)
    .map((r) => ({ setting: String(r[0]), value: String(r[1]) }));
  return { trades: tradesDariTabel(rows(tName)), settings: denganModalAwal(settings) };
}

/** = btReadCsv + cabang .csv btLoadFile. */
export function bacaCsv(text: string): BtData {
  const rows: string[][] = [];
  let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return { trades: tradesDariTabel(rows.filter((r) => r.some((c) => c !== ''))), settings: denganModalAwal([]) };
}

/** Risk per trade yang dipakai saat backtest (bukan "Risk per Trade (%)" kalkulator lot). */
export function riskAsliDefault(settings: BtSetting[]): number {
  const s = settings.find((r) => /^risk follow trend/i.test(r.setting));
  const v = s ? Number(s.value) : NaN;
  return Number.isFinite(v) && v > 0 ? v : 0.5;
}

/** Angka singkat untuk pratinjau admin. */
export function ringkasCek(d: BtData): { total: number; net: number; menang: number } {
  return {
    total: d.trades.length,
    net: Math.round(d.trades.reduce((s, t) => s + t.pnl_usd, 0) * 100) / 100,
    menang: d.trades.filter((t) => t.result === 'Win').length,
  };
}
