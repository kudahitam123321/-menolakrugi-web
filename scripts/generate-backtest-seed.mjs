// Buat supabase-backtest-seed.sql dari export Strategy Tester TradingView.
// Pakai: node scripts/generate-backtest-seed.mjs "<file.xlsx>"
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const src = process.argv[2];
if (!src) { console.error('Pakai: node scripts/generate-backtest-seed.mjs <file.xlsx>'); process.exit(2); }

const out = join('node_modules', '.cache', 'bt-check', `backtest-${Date.now()}.mjs`);
execSync(`npx esbuild src/lib/backtest.ts --bundle --format=esm --platform=node --external:xlsx --log-level=error --outfile="${out}"`, { stdio: 'inherit' });
const lib = await import(pathToFileURL(resolve(out)).href);
const XLSX = (await import('xlsx')).default;

const data = lib.bacaWorkbook(XLSX.read(readFileSync(src)));
const risk = lib.riskAsliDefault(data.settings);
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const sql = `-- Data awal backtest: ${basename(src)} (${data.trades.length} trade)
-- Jalankan SETELAH supabase-backtest-config-migration.sql, di Supabase SQL Editor.
insert into backtest_config (id, judul, data, risk_asli, tampil, sumber_file, updated_at)
values (1, 'PTMR Backtest', ${q(JSON.stringify(data))}::jsonb, ${risk}, true, ${q(basename(src))}, now())
on conflict (id) do update set
  judul = excluded.judul, data = excluded.data, risk_asli = excluded.risk_asli,
  tampil = excluded.tampil, sumber_file = excluded.sumber_file, updated_at = excluded.updated_at;
`;
writeFileSync('supabase-backtest-seed.sql', sql);
console.log(`${data.trades.length} trade ditulis ke supabase-backtest-seed.sql (risk asli ${risk}%)`);
