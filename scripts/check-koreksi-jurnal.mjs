// Cek logika koreksi/evaluasi jurnal baru (src/lib/koreksiJurnal.ts).
// Pakai: node scripts/check-koreksi-jurnal.mjs
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const out = join('node_modules', '.cache', 'bt-check', `koreksi-${Date.now()}.mjs`);
execSync(`npx esbuild src/lib/koreksiJurnal.ts --bundle --format=esm --platform=node --log-level=error --outfile="${out}"`, { stdio: 'inherit' });
const L = await import(pathToFileURL(resolve(out)).href);

const seen = Date.parse('2026-11-20T00:00:00Z');
const lama = '2026-11-19T10:00:00Z', baru = '2026-11-21T10:00:00Z';

// isKoreksiBaru
assert.equal(L.isKoreksiBaru(baru, seen), true, 'sesudah terakhir dilihat = baru');
assert.equal(L.isKoreksiBaru(lama, seen), false, 'sebelum terakhir dilihat = lama');
assert.equal(L.isKoreksiBaru(null, seen), false, 'tanpa waktu bukan baru');
assert.equal(L.isKoreksiBaru(baru, 0), true, 'belum pernah dilihat → semua baru');

// hitungKoreksiBaru: koreksi per trade + evaluasi keseluruhan
const entries = [
  { admin_note: 'SL di likuiditas', admin_note_at: baru },
  { admin_note: 'Mantap', admin_note_at: lama },
  { admin_note: '   ', admin_note_at: baru },      // catatan kosong tidak dihitung
  { admin_note: null, admin_note_at: null },
];
assert.equal(L.hitungKoreksiBaru(entries, null, seen), 1, 'hanya koreksi terisi & baru');
assert.equal(L.hitungKoreksiBaru(entries, { catatan: 'Evaluasi', updated_at: baru }, seen), 2, 'evaluasi baru ikut dihitung');
assert.equal(L.hitungKoreksiBaru(entries, { catatan: 'Evaluasi', updated_at: lama }, seen), 1, 'evaluasi lama tidak');
assert.equal(L.hitungKoreksiBaru(entries, { catatan: '', updated_at: baru }, seen), 1, 'evaluasi kosong tidak');
assert.equal(L.hitungKoreksiBaru([], null, 0), 0, 'kosong');

// bacaSeen / tandaiDilihat dengan storage tiruan
const mem = new Map();
const st = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
assert.equal(L.bacaSeen('m1', st), 0, 'belum pernah dilihat = 0');
L.tandaiDilihat('m1', 12345, st);
assert.equal(L.bacaSeen('m1', st), 12345, 'tersimpan per member');
assert.equal(L.bacaSeen('m2', st), 0, 'member lain terpisah');
const rusak = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
assert.equal(L.bacaSeen('m1', rusak), 0, 'storage error → 0');
assert.doesNotThrow(() => L.tandaiDilihat('m1', 1, rusak), 'storage error tidak melempar');

console.log('OK check-koreksi-jurnal');
