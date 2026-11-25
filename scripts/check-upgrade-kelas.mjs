// Cek logika harga upgrade kelas (src/lib/upgradeKelas.ts).
// Pakai: node scripts/check-upgrade-kelas.mjs
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const out = join('node_modules', '.cache', 'bt-check', `upgrade-${Date.now()}.mjs`);
execSync(`npx esbuild src/lib/upgradeKelas.ts --bundle --format=esm --platform=node --log-level=error --outfile="${out}"`, { stdio: 'inherit' });
const L = await import(pathToFileURL(resolve(out)).href);

// tierIdDari: nilai members.tier → id pricing_tiers
for (const [t, id] of [['SMC Gold Mentorship', 'gold'], ['gold', 'gold'], ['SMC Bronze', 'bronze'], ['smc silver', 'bronze'],
  ['SMC Platinum 1-on-1', 'platinum'], ['SMC Trial', 'trial'], ['trial', 'trial']]) assert.equal(L.tierIdDari(t), id, t);
for (const t of ['Indikator Lifetime', '', null, undefined]) assert.equal(L.tierIdDari(t), null, 'bukan kelas: ' + t);

// hargaUpgrade: harga kelas tujuan (sudah termasuk harga event) − harga jual biasa kelas lama
assert.deepEqual(L.hargaUpgrade({ id: 'gold', price: 750000 }, { id: 'bronze', price: 500000 }), { harga: 250000, potongan: 500000 }, 'bronze→gold BF');
assert.deepEqual(L.hargaUpgrade({ id: 'platinum', price: 3000000 }, { id: 'gold', price: 1000000 }), { harga: 2000000, potongan: 1000000 }, 'gold→platinum BF');
assert.deepEqual(L.hargaUpgrade({ id: 'gold', price: 750000 }, { id: 'trial', price: 99000 }), { harga: 750000, potongan: 0 }, 'trial tanpa potongan');
assert.deepEqual(L.hargaUpgrade({ id: 'trial', price: 99000 }, { id: 'trial', price: 99000 }), { harga: 99000, potongan: 0 }, 'perpanjang tier sama bayar penuh');
assert.deepEqual(L.hargaUpgrade({ id: 'gold', price: 750000 }, null), { harga: 750000, potongan: 0 }, 'tanpa kelas lama');
assert.deepEqual(L.hargaUpgrade({ id: 'gold', price: 400000 }, { id: 'bronze', price: 500000 }), { harga: 0, potongan: 500000 }, 'tidak pernah negatif');

// penanda order upgrade di orders.kode_diskon
assert.equal(L.kodeUpgrade('bronze'), 'UPGRADE:bronze', 'kode upgrade');
assert.equal(L.kodeUpgrade(null), 'UPGRADE:-', 'kode upgrade tanpa kelas lama');
assert.deepEqual(L.bacaKodeUpgrade('UPGRADE:bronze'), { dari: 'bronze' }, 'baca kode');
assert.deepEqual(L.bacaKodeUpgrade('UPGRADE:-'), { dari: null }, 'baca kode tanpa kelas lama');
assert.equal(L.bacaKodeUpgrade('BF50'), null, 'kode diskon biasa bukan upgrade');
assert.equal(L.bacaKodeUpgrade(null), null, 'kosong');

console.log('OK — upgrade kelas');
