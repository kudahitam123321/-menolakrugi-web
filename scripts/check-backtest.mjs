// Cek port pembaca export TradingView (src/lib/backtest.ts).
// Pakai: node scripts/check-backtest.mjs "<SMC PTMR v5.xlsx>" "<BACKTEST FIX.html>"
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const [xlsxPath, htmlPath] = process.argv.slice(2);
if (!xlsxPath || !htmlPath) { console.error('Pakai: node scripts/check-backtest.mjs <xlsx> <html>'); process.exit(2); }

// Bundle di dalam proyek (node_modules/.cache) supaya import 'xlsx' (external) tetap ketemu.
const out = join('node_modules', '.cache', 'bt-check', `backtest-${Date.now()}.mjs`);
execSync(`npx esbuild src/lib/backtest.ts --bundle --format=esm --platform=node --external:xlsx --log-level=error --outfile="${out}"`, { stdio: 'inherit' });
const lib = await import(pathToFileURL(resolve(out)).href);

const near = (a, b, eps = 0.01, msg = '') => assert.ok(Math.abs(a - b) <= eps, `${msg} ${a} ≠ ${b}`);

// 1. Port identik dengan fungsi asli di dashboard user
const html = readFileSync(htmlPath, 'utf8');
const m = html.match(/window\.btToTrades = (\(table\) => \{[\s\S]*?\n\});\n/);
assert.ok(m, 'btToTrades asli tidak ditemukan di HTML');
const asli = new Function(`return ${m[1]}`)();

const wb = XLSX.readFile(xlsxPath);
const table = XLSX.utils.sheet_to_json(wb.Sheets['Trades'], { header: 1, raw: true });
assert.deepStrictEqual(lib.tradesDariTabel(table), asli(table), 'port tradesDariTabel beda dengan btToTrades asli');

// 2. Angka TradingView
const d = lib.bacaWorkbook(wb);
assert.equal(d.trades.length, 303, 'jumlah trade');
// PnL per trade di export dibulatkan ke sen; total resmi TradingView (14944.44) dari angka tak dibulatkan → drift ±0.15.
near(d.trades.reduce((s, t) => s + t.pnl_usd, 0), 14944.44, 0.2, 'net profit');
assert.equal(d.trades.filter((t) => t.result === 'Win').length, 128, 'trade menang');
near(d.trades.at(-1).cum_pnl_usd, 14944.44, 0.2, 'cum pnl akhir');
assert.ok(d.settings.some((s) => s.setting === 'Initial capital' && s.value === '10000'), 'Initial capital');
assert.ok(d.settings.some((s) => s.setting === 'Symbol' && s.value === 'FOREXCOM:XAUUSD'), 'Symbol');
assert.equal(lib.riskAsliDefault(d.settings), 0.5, 'risk asli');
const r = lib.ringkasCek(d);
assert.equal(r.total, 303); near(r.net, 14944.44, 0.2); assert.equal(r.menang, 128);

// 3. Kolom wajib hilang → error
assert.throws(() => lib.tradesDariTabel([['Trade number', 'Type', 'Date and time'], [1, 'Entry long', '2025-08-01 03:35']]), /missing columns/);

// 4. Workbook tanpa Properties → Initial capital 10000 ditambahkan
const wb2 = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb2, wb.Sheets['Trades'], 'List of trades');
const d2 = lib.bacaWorkbook(wb2);
assert.equal(d2.trades.length, 303);
assert.deepStrictEqual(d2.settings, [{ setting: 'Initial capital', value: '10000' }]);
assert.equal(lib.riskAsliDefault(d2.settings), 0.5);

// 5. CSV List of Trades
const csv = XLSX.utils.sheet_to_csv(wb.Sheets['Trades']);
assert.equal(lib.bacaCsv(csv).trades.length, 303, 'csv');

console.log(`OK — port identik, ${d.trades.length} trade, net ${r.net.toFixed(2)}`);
