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
assert.equal(L.fmtTanggalRilis(new Date('2026-12-01T00:00:00+07:00')), '1 Desember 2026');
assert.equal(L.fmtTanggalRilis(null), 'segera');

// berhakKlaimV5
const batas = new Date('2026-11-20T00:00:00+07:00');
const ok = (plan_type, status, activated_at, product_id) => ({ plan_type, status, activated_at, product_id, created_at: '2026-01-01' });
assert.notEqual(L.berhakKlaimV5([ok('lifetime', 'aktif', '2026-05-01', 'v4')], 'v5', batas), null, 'lifetime v4');
assert.equal(L.berhakKlaimV5([ok('bulanan', 'aktif', '2026-11-01T10:00:00+07:00', 'v4')], 'v5', batas), null, 'bulanan masih aktif saat rilis tetap tidak bisa (hanya Lifetime)');
assert.equal(L.berhakKlaimV5([ok('tahunan', 'aktif', '2026-03-01T10:00:00+07:00', 'v4')], 'v5', batas), null, 'tahunan aktif tidak bisa (hanya Lifetime)');
assert.equal(L.berhakKlaimV5([ok('bulanan', 'aktif', '2026-10-01T10:00:00+07:00', 'v4')], 'v5', batas), null, 'bulanan JT 1 Nov');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'aktif', '2026-11-21T10:00:00+07:00', 'v4')], 'v5', batas), null, 'beli setelah rilis');
assert.notEqual(L.berhakKlaimV5([ok('lifetime', 'aktif', null, 'v4')], 'v5', batas), null, 'lifetime lama tanpa activated_at → pakai created_at');
assert.equal(L.berhakKlaimV5([{ ...ok('lifetime', 'aktif', null, 'v4'), created_at: '2026-11-21T10:00:00+07:00' }], 'v5', batas), null, 'tanpa activated_at, dibuat setelah rilis');
assert.equal(L.berhakKlaimV5([ok('bulanan', 'aktif', null, 'v4')], 'v5', batas), null, 'bulanan lama tanpa activated_at sudah lewat jatuh tempo');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'aktif', '2026-05-01', 'v4'), ok('bulanan', 'aktif', '2026-11-25', 'v5')], 'v5', batas), null, 'sudah punya v5');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'pending', '2026-05-01', 'v4')], 'v5', batas), null, 'pending');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'aktif', '2026-05-01', 'v4')], null, batas), null, 'tanpa v5');
assert.equal(L.berhakKlaimV5([ok('lifetime', 'aktif', '2026-05-01', 'v4')], 'v5', null), null, 'tanpa batas');
assert.equal(L.berhakKlaimV5([ok('tahunan', 'aktif', '2026-03-01T10:00:00+07:00', 'v4'), ok('lifetime', 'aktif', '2026-05-01', 'v4')], 'v5', batas).plan_type, 'lifetime', 'yang lolos hanya order Lifetime');

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

// promoRilis (banner "v5 sudah rilis, diskon X% s/d tgl")
const v5p = { ...promo, id: 'v5', nama: 'SMC by MenolakRugi v5', tanggal_rilis: '2026-11-20' };
const v4p = { ...pr([200000, null, 2000000, null, 3000000, null]), id: 'v4', nama: 'SMC by MenolakRugi v4.2', tanggal_rilis: null };
assert.deepEqual(L.promoRilis([v5p, v4p], new Date('2026-11-21T10:00:00+07:00')), { nama: 'SMC by MenolakRugi v5', diskon: 50, hingga: '1 Desember 2026' }, 'promo rilis');
assert.equal(L.promoRilis([v5p, v4p], new Date('2026-12-02T10:00:00+07:00')), null, 'promo rilis selesai');
assert.equal(L.promoRilis([v4p], new Date('2026-11-21T10:00:00+07:00')), null, 'tanpa produk rilis');

// Event promo (Black Friday)
const WIB = (s) => new Date(s + '+07:00');
const ev = { aktif: true, nama: 'Black Friday', judul: null, subjudul: null, mulai: '2026-11-27T00:00:00+07:00', selesai: '2026-11-30T23:59:59+07:00', diskon: { v5: { lifetime: 60 }, v4: { bulanan: 20 } }, bonus: null, unggulan: null };
const v5e = { id: 'v5', nama: 'SMC by MenolakRugi v5', harga_lifetime: 3000000, diskon_lifetime: 50, diskon_hingga: '2026-12-01' };
const v4e = { id: 'v4', nama: 'SMC by MenolakRugi v4.2', harga_bulanan: 200000, harga_tahunan: 2000000, harga_lifetime: 3000000 };
assert.equal(L.eventBerjalan(ev, WIB('2026-11-26T23:59:00')), false, 'event belum mulai');
assert.equal(L.eventBerjalan(ev, WIB('2026-11-27T00:00:00')), true, 'event mulai');
assert.equal(L.eventBerjalan(ev, WIB('2026-11-30T23:59:00')), true, 'event menit terakhir');
assert.equal(L.eventBerjalan(ev, WIB('2026-12-01T00:00:00')), false, 'event selesai');
assert.equal(L.eventBerjalan({ ...ev, aktif: false }, WIB('2026-11-28T10:00:00')), false, 'event nonaktif');
assert.equal(L.eventBerjalan(null, WIB('2026-11-28T10:00:00')), false, 'tanpa event');
assert.equal(L.paketDariProduk(v5e, WIB('2026-11-28T10:00:00'), ev)[0].diskon, 60, 'v5 ikut event');
assert.equal(L.paketDariProduk(v5e, WIB('2026-12-01T10:00:00'), ev)[0].diskon, 50, 'setelah event kembali promo rilis');
assert.equal(L.paketDariProduk(v5e, WIB('2026-11-26T10:00:00'), ev)[0].diskon, 50, 'sebelum event promo rilis');
const p4 = L.paketDariProduk(v4e, WIB('2026-11-28T10:00:00'), ev);
assert.deepEqual(p4.map((x) => x.diskon), [20, 0, 0], 'v4 hanya bulanan didiskon event');
assert.equal(L.labelPromo(v5e, WIB('2026-11-28T10:00:00'), ev), 'BLACK FRIDAY -60% · S/D 30 NOVEMBER 2026', 'label event');
assert.equal(L.labelPromo(v5e, WIB('2026-12-01T10:00:00'), ev), 'PROMO -50% · S/D 1 DESEMBER 2026', 'label setelah event');
assert.equal(L.labelPromo(v4e, WIB('2026-11-28T10:00:00'), ev), 'BLACK FRIDAY -20% · S/D 30 NOVEMBER 2026', 'label event v4');
assert.equal(L.diskonMaksEvent({ ...ev, diskon: { a: { bulanan: 20 }, b: { lifetime: 60 } } }), 60, 'diskon maks event');
assert.equal(L.diskonMaksEvent(null), 0, 'diskon maks tanpa event');

// Perbaikan review
assert.equal(L.paketDariProduk(v5e, WIB('2026-11-28T10:00:00'), { ...ev, diskon: { v5: { lifetime: 40 } } })[0].diskon, 50, 'event lebih kecil tidak menaikkan harga');
assert.equal(L.labelPromo(v5e, WIB('2026-11-28T10:00:00'), { ...ev, diskon: { v5: { bulanan: 20 } } }), 'PROMO -50% · S/D 1 DESEMBER 2026', 'label event hanya dari paket berdiskon event');
assert.equal(L.diskonMaksEvent(ev, [v4e]), 20, 'diskon maks hanya produk aktif');
assert.equal(L.diskonMaksEvent({ ...ev, diskon: { v4: { tahunan: 30 } } }, [{ ...v4e, harga_tahunan: null }]), 0, 'paket tanpa harga tidak dihitung');
assert.equal(L.diskonEfektif(60, 10), 60, 'kode lebih kecil dari event');
assert.equal(L.diskonEfektif(20, 30), 30, 'kode lebih besar');
assert.equal(L.diskonEfektif(0, null), 0, 'tanpa diskon');

// Event terjadwal / tampil (banner & menu sebelum event mulai)
assert.equal(L.eventTerjadwal(ev, WIB('2026-11-24T10:00:00')), true, 'terjadwal sebelum mulai');
assert.equal(L.eventTerjadwal(ev, WIB('2026-11-28T10:00:00')), false, 'bukan terjadwal saat berjalan');
assert.equal(L.eventTerjadwal({ ...ev, aktif: false }, WIB('2026-11-24T10:00:00')), false, 'nonaktif tidak terjadwal');
assert.equal(L.eventTampil(ev, WIB('2026-11-24T10:00:00')), true, 'tampil sebelum mulai');
assert.equal(L.eventTampil(ev, WIB('2026-11-28T10:00:00')), true, 'tampil saat berjalan');
assert.equal(L.eventTampil(ev, WIB('2026-12-01T00:00:00')), false, 'tidak tampil setelah selesai');
assert.equal(L.eventTampil(null), false, 'tanpa event');

// Diskon khusus member kelas (Black Friday): disimpan di ev.diskon._kelas
for (const t of ['SMC Gold Mentorship', 'SMC Bronze', 'gold', 'platinum', 'SMC Platinum 1-on-1', 'SMC Silver']) assert.equal(L.memberKelasBerbayar(t), true, 'kelas ' + t);
for (const t of ['SMC Trial', 'trial', 'Indikator Lifetime', 'Indikator Bulanan', '', null]) assert.equal(L.memberKelasBerbayar(t), false, 'bukan kelas ' + t);
assert.equal(L.punyaIndikator([{ status: 'aktif', plan_type: 'bulanan' }]), true, 'punya indikator aktif');
assert.equal(L.punyaIndikator([{ status: 'pending', plan_type: 'lifetime' }]), false, 'pending tidak dihitung');
assert.equal(L.punyaIndikator([]), false, 'tanpa pesanan');
const evK = { ...ev, diskon: { ...ev.diskon, _kelas: { lifetime: 70 } } };
assert.equal(L.paketDariProduk(v5e, WIB('2026-11-28T10:00:00'), evK, { kelas: true })[0].diskon, 70, 'member kelas v5 lifetime 70');
assert.equal(L.paketDariProduk(v5e, WIB('2026-11-28T10:00:00'), evK)[0].diskon, 60, 'bukan member kelas tetap 60');
assert.deepEqual(L.paketDariProduk(v4e, WIB('2026-11-28T10:00:00'), evK, { kelas: true }).map((x) => x.diskon), [20, 0, 70], 'kelas hanya lifetime');
assert.equal(L.paketDariProduk(v5e, WIB('2026-12-01T10:00:00'), evK, { kelas: true })[0].diskon, 50, 'setelah event kelas hilang');
assert.equal(L.labelPromo(v5e, WIB('2026-11-28T10:00:00'), evK, { kelas: true }), 'KHUSUS MEMBER KELAS -70% · S/D 30 NOVEMBER 2026', 'label kelas');
assert.equal(L.diskonMaksEvent(evK, [v5e, v4e]), 60, 'diskon kelas tidak ikut hitungan umum');

// Diskon event kelas (ev.diskon._tier = { bronze: 50, ... }, % dari harga normal/coret)
const tGold = { id: 'gold', price: 1000000, original_price: 1500000 };
const tTrial = { id: 'trial', price: 99000, original_price: null };
const evT = { ...ev, diskon: { ...ev.diskon, _tier: { bronze: 50, gold: 50, platinum: 40 } } };
assert.deepEqual(L.hargaKelasEvent(tGold, evT, WIB('2026-11-28T10:00:00')), { normal: 1500000, harga: 750000, diskon: 50 }, 'gold -50% dari harga normal');
assert.equal(L.hargaKelasEvent(tGold, evT, WIB('2026-12-01T10:00:00')), null, 'setelah event harga biasa');
assert.equal(L.hargaKelasEvent(tTrial, evT, WIB('2026-11-28T10:00:00')), null, 'trial tanpa diskon event');
assert.equal(L.hargaKelasEvent(tGold, { ...evT, diskon: { _tier: { gold: 20 } } }, WIB('2026-11-28T10:00:00')), null, 'event tidak lebih murah dari harga jual → abaikan');
assert.equal(L.hargaKelasEvent({ id: 'gold', price: 1000000 }, evT, WIB('2026-11-28T10:00:00')).harga, 500000, 'tanpa harga coret pakai price');
assert.equal(L.hargaKelasEvent(tGold, null), null, 'tanpa event');
assert.equal(L.diskonMaksKelas(evT), 50, 'maks diskon kelas');
assert.equal(L.diskonMaksKelas(ev), 0, 'tanpa diskon kelas');

// Tier pricing dengan harga event (dipakai pricing kelas, signup, payment)
const tg = L.tierDenganEvent({ ...tGold, badge: 'Paling Direkomendasikan' }, evT, WIB('2026-11-28T10:00:00'));
assert.equal(tg.price, 750000, 'harga event jadi price'); assert.equal(tg.original_price, 1500000, 'harga normal jadi coret');
assert.equal(tg.badge, 'Black Friday -50%', 'badge event'); assert.equal(tg.promo_diskon, 50, 'promo_diskon');
assert.deepEqual(L.tierDenganEvent(tTrial, evT, WIB('2026-11-28T10:00:00')), tTrial, 'trial tidak berubah');
assert.deepEqual(L.tierDenganEvent(tGold, evT, WIB('2026-12-01T10:00:00')), tGold, 'setelah event tidak berubah');

console.log('OK — status pre-order');
