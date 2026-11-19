// Cek logika tahap pre-order indikator v5 (src/lib/indikatorV5.ts).
// Pakai: node scripts/check-indikator-v5.mjs
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const out = join('node_modules', '.cache', 'bt-check', `v5-${Date.now()}.mjs`);
execSync(`npx esbuild src/lib/indikatorV5.ts --bundle --format=esm --platform=node --log-level=error --outfile="${out}"`, { stdio: 'inherit' });
const L = await import(pathToFileURL(resolve(out)).href);

const rilis = new Date('2026-12-01T00:00:00+07:00');
const now = new Date('2026-11-15T12:00:00+07:00');
const o = (plan_type, status, activated_at, created_at = '2026-01-01') => ({ plan_type, status, activated_at, created_at });

// statusPreorder
assert.equal(L.statusPreorder([o('lifetime', 'aktif', null)], rilis, now), 'aman', 'lifetime');
assert.equal(L.statusPreorder([o('bulanan', 'aktif', '2026-11-20T10:00:00+07:00')], rilis, now), 'aman', 'JT 20 Des');
assert.equal(L.statusPreorder([o('bulanan', 'aktif', '2026-10-20T10:00:00+07:00')], rilis, now), 'perpanjang', 'JT 20 Nov');
assert.equal(L.statusPreorder([o('bulanan', 'aktif', '2026-09-01T10:00:00+07:00')], rilis, now), 'habis', 'JT 1 Okt');
assert.equal(L.statusPreorder([o('bulanan', 'aktif', null)], rilis, now), 'tidak-diketahui', 'tanpa activated_at');
assert.equal(L.statusPreorder([o('lifetime', 'pending', null)], rilis, now), 'tidak-ada', 'hanya pending');
assert.equal(L.statusPreorder([], rilis, now), 'tidak-ada', 'kosong');
assert.equal(L.statusPreorder([o(null, 'aktif', '2026-11-01')], rilis, now), 'tidak-ada', 'produk non-indikator');
assert.equal(L.statusPreorder([o('bulanan', 'aktif', '2026-10-20T10:00:00+07:00')], null, now), 'aman', 'tanpa tanggal rilis');
assert.equal(L.statusPreorder([o('bulanan', 'dibayar', '2026-09-01T10:00:00+07:00')], rilis, now), 'habis', 'dibayar lama');

// pilihOrderIndikator
const campur = [
  o('lifetime', 'pending', null, '2026-11-10'),
  o('bulanan', 'aktif', '2026-10-20T10:00:00+07:00', '2026-10-20'),
  o('tahunan', 'aktif', '2026-03-01T10:00:00+07:00', '2026-03-01'),
];
assert.equal(L.pilihOrderIndikator(campur).plan_type, 'tahunan', 'pilih JT terjauh');
assert.equal(L.statusPreorder(campur, rilis, now), 'aman', 'campuran aman');
assert.equal(L.pilihOrderIndikator([o('lifetime', 'aktif', null), o('tahunan', 'aktif', '2026-11-01')]).plan_type, 'lifetime', 'lifetime menang');
assert.equal(L.pilihOrderIndikator([o(null, 'aktif', '2026-11-01')]), null, 'non-indikator diabaikan');

// hitungJatuhTempo = versi DashboardPage
assert.equal(L.hitungJatuhTempo('2026-10-20T10:00:00+07:00', 'bulanan').getMonth(), 10);
assert.equal(L.hitungJatuhTempo(null, 'bulanan'), null);
assert.equal(L.hitungJatuhTempo('2026-10-20', 'lifetime'), null);

// sisaWaktu
assert.deepEqual(L.sisaWaktu(rilis, now), { hari: 15, jam: 12, menit: 0, detik: 0 });
assert.equal(L.sisaWaktu(rilis, new Date('2026-12-02T00:00:00+07:00')), null);

// fmtTanggalRilis
assert.equal(L.fmtTanggalRilis(new Date('2026-12-01T00:00:00')), '1 Desember 2026');
assert.equal(L.fmtTanggalRilis(null), 'segera');

// berhakKlaimV5
const batas = new Date('2026-11-20T00:00:00+07:00');
const ok = (plan_type, status, activated_at, product_id) => ({ plan_type, status, activated_at, product_id, created_at: '2026-01-01' });
assert.notEqual(L.berhakKlaimV5([ok('lifetime', 'aktif', '2026-05-01', 'v4')], 'v5', batas), null, 'lifetime v4');
assert.notEqual(L.berhakKlaimV5([ok('bulanan', 'aktif', '2026-11-01T10:00:00+07:00', 'v4')], 'v5', batas), null, 'bulanan JT 1 Des');
assert.equal(L.berhakKlaimV5([ok('bulanan', 'aktif', '2026-10-01T10:00:00+07:00', 'v4')], 'v5', batas), null, 'bulanan JT 1 Nov');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'aktif', '2026-11-21T10:00:00+07:00', 'v4')], 'v5', batas), null, 'beli setelah rilis');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'aktif', null, 'v4')], 'v5', batas), null, 'tanpa activated_at');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'aktif', '2026-05-01', 'v4'), ok('bulanan', 'aktif', '2026-11-25', 'v5')], 'v5', batas), null, 'sudah punya v5');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'pending', '2026-05-01', 'v4')], 'v5', batas), null, 'pending');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'aktif', '2026-05-01', 'v4')], null, batas), null, 'tanpa v5');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'aktif', '2026-05-01', 'v4')], 'v5', null), null, 'tanpa batas');
assert.equal(L.berhakKlaimV5([ok('tahunan', 'aktif', '2026-03-01T10:00:00+07:00', 'v4'), ok('bulanan', 'aktif', '2026-11-01T10:00:00+07:00', 'v4')], 'v5', batas).plan_type, 'tahunan', 'pilih terkuat');

// paketDariProduk
const pr = (h) => ({ id: 'p', nama: 'P', harga_bulanan: h[0], diskon_bulanan: h[1], harga_tahunan: h[2], diskon_tahunan: h[3], harga_lifetime: h[4], diskon_lifetime: h[5] });
assert.deepEqual(L.paketDariProduk(pr([200000, 10, 2000000, null, 3000000, 0])), [
  { key: 'bulanan', nama: 'Bulanan', harga_asli: 200000, diskon: 10 },
  { key: 'tahunan', nama: 'Tahunan', harga_asli: 2000000, diskon: 0 },
  { key: 'lifetime', nama: 'Lifetime', harga_asli: 3000000, diskon: 0 },
], 'tiga paket');
assert.deepEqual(L.paketDariProduk(pr([null, null, 0, null, 5000000, 20])).map((x) => x.key), ['lifetime'], 'hanya lifetime');

// diskon_hingga: diskon berlaku sampai akhir hari itu (WIB), lalu hilang
const promo = { ...pr([300000, 50, 3000000, 50, 5000000, 50]), diskon_hingga: '2026-12-01' };
assert.equal(L.paketDariProduk(promo, new Date('2026-12-01T23:00:00+07:00'))[0].diskon, 50, 'masih promo 1 Des malam');
assert.equal(L.paketDariProduk(promo, new Date('2026-12-02T00:00:01+07:00'))[0].diskon, 0, 'promo selesai 2 Des');
assert.equal(L.paketDariProduk(pr([300000, 50, null, null, null, null]), new Date('2030-01-01'))[0].diskon, 50, 'tanpa batas = tetap');

// labelPromo & terbaruDari (badge di halaman harga dan katalog dashboard)
assert.equal(L.labelPromo(promo, new Date('2026-11-20T10:00:00+07:00')), 'PROMO -50% · S/D 1 DESEMBER 2026', 'label promo');
assert.equal(L.labelPromo(promo, new Date('2026-12-02T10:00:00+07:00')), undefined, 'promo lewat');
assert.equal(L.labelPromo(pr([300000, 50, null, null, null, null])), undefined, 'diskon tanpa batas bukan promo');
assert.equal(L.terbaruDari([{ id: 'a', nama: 'a', tanggal_rilis: null }, { id: 'b', nama: 'b', tanggal_rilis: '2026-11-20' }, { id: 'c', nama: 'c', tanggal_rilis: '2025-01-01' }]), 'b', 'terbaru');
assert.equal(L.terbaruDari([{ id: 'a', nama: 'a', tanggal_rilis: null }]), null, 'tanpa tanggal');

console.log('OK — status pre-order');
