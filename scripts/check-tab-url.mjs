// Cek simpan/baca tab aktif dashboard & admin di URL hash (src/lib/tabUrl.ts).
// Pakai: node scripts/check-tab-url.mjs
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const out = join('node_modules', '.cache', 'bt-check', `taburl-${Date.now()}.mjs`);
execSync(`npx esbuild src/lib/tabUrl.ts --bundle --format=esm --platform=node --log-level=error --outfile="${out}"`, { stdio: 'inherit' });
const L = await import(pathToFileURL(resolve(out)).href);

const valid = ['dashboard', 'jurnal', 'trading-plan', '1on1'];
assert.equal(L.tabDariHash('#jurnal', valid), 'jurnal', 'hash tab valid');
assert.equal(L.tabDariHash('#1on1', valid), '1on1', 'id berangka');
assert.equal(L.tabDariHash('jurnal', valid), 'jurnal', 'tanpa #');
assert.equal(L.tabDariHash('#tidak-ada', valid), null, 'tab tak dikenal → null');
assert.equal(L.tabDariHash('#logout', valid), null, 'logout bukan tab');
assert.equal(L.tabDariHash('', valid), null, 'hash kosong');
assert.equal(L.tabDariHash('#klaim-v5', valid), null, 'anchor lain diabaikan');

assert.equal(L.urlUntukTab('/member', '', 'jurnal', 'dashboard'), '/member#jurnal', 'tab disimpan di hash');
assert.equal(L.urlUntukTab('/member', '?x=1', 'jurnal', 'dashboard'), '/member?x=1#jurnal', 'query dipertahankan');
assert.equal(L.urlUntukTab('/member', '', 'dashboard', 'dashboard'), '/member', 'tab default tanpa hash');

console.log('OK check-tab-url');
