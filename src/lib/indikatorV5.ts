// lib/indikatorV5.ts — Logika tahap pre-order indikator v5 (murni, tanpa React/Supabase).
// Spec: docs/superpowers/specs/2026-11-15-indikator-v5-preorder-upgrade-design.md

export interface OrderIndikator {
  status: string;
  plan_type: string | null;
  activated_at: string | null;
  created_at: string;
  product_id?: string | null;
}

/** Sama persis dengan hitungJatuhTempo di DashboardPage/AdminPage. */
export function hitungJatuhTempo(activatedAt: string | null, planType: string | null): Date | null {
  if (!activatedAt || !planType || planType === 'lifetime') return null;
  const d = new Date(activatedAt);
  if (planType === 'bulanan') { d.setMonth(d.getMonth() + 1); return d; }
  if (planType === 'tahunan') { d.setFullYear(d.getFullYear() + 1); return d; }
  return null;
}

const isIndikator = (o: OrderIndikator) => !!o.plan_type;

/** Order indikator aktif yang paling "kuat": lifetime dulu, lalu jatuh tempo terjauh. */
export function pilihOrderIndikator<T extends OrderIndikator>(orders: T[]): T | null {
  const aktif = orders.filter((o) => isIndikator(o) && o.status === 'aktif');
  if (!aktif.length) return null;
  const life = aktif.find((o) => o.plan_type === 'lifetime');
  if (life) return life;
  const jt = (o: T) => hitungJatuhTempo(o.activated_at, o.plan_type)?.getTime() ?? -Infinity;
  return aktif.reduce((a, b) => (jt(b) > jt(a) ? b : a));
}

export type StatusPreorder = 'aman' | 'perpanjang' | 'habis' | 'tidak-diketahui' | 'tidak-ada';

/**
 * aman            = lifetime aktif, atau jatuh tempo >= tanggal rilis (tanpa tanggal rilis: >= sekarang)
 * perpanjang      = masih aktif sekarang tapi habis sebelum rilis
 * tidak-diketahui = order aktif non-lifetime tanpa activated_at
 * habis           = pernah punya order indikator, semua sudah lewat jatuh tempo
 * tidak-ada       = tidak punya order indikator yang relevan
 */
export function statusPreorder(orders: OrderIndikator[], tanggalRilis: Date | null, now: Date): StatusPreorder {
  const ind = orders.filter(isIndikator);
  const aktif = ind.filter((o) => o.status === 'aktif');
  if (aktif.some((o) => o.plan_type === 'lifetime')) return 'aman';
  const batas = (tanggalRilis ?? now).getTime();
  const jts = aktif.map((o) => hitungJatuhTempo(o.activated_at, o.plan_type)).filter((d): d is Date => !!d);
  if (jts.some((d) => d.getTime() >= batas)) return 'aman';
  if (jts.some((d) => d.getTime() >= now.getTime())) return 'perpanjang';
  if (aktif.some((o) => !o.activated_at)) return 'tidak-diketahui';
  const pernah = ind.some((o) => {
    if (o.status !== 'aktif' && o.status !== 'dibayar') return false;
    const d = hitungJatuhTempo(o.activated_at, o.plan_type);
    return !!d && d.getTime() < now.getTime();
  });
  return pernah ? 'habis' : 'tidak-ada';
}

/** Sisa waktu ke target; null bila sudah lewat. */
export function sisaWaktu(target: Date, now: Date): { hari: number; jam: number; menit: number; detik: number } | null {
  let s = Math.floor((target.getTime() - now.getTime()) / 1000);
  if (s <= 0) return null;
  const hari = Math.floor(s / 86400); s -= hari * 86400;
  const jam = Math.floor(s / 3600); s -= jam * 3600;
  const menit = Math.floor(s / 60);
  return { hari, jam, menit, detik: s - menit * 60 };
}

/** '1 Desember 2026', atau 'segera' bila tanggal belum ada. */
export function fmtTanggalRilis(d: Date | null): string {
  return d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }) : 'segera';
}

/**
 * Klaim v5 gratis (spec 2026-11-20): order indikator aktif untuk produk selain v5,
 * aktif sebelum batas, dan lifetime atau jatuh tempo >= batas. Sudah punya v5 aktif → null.
 * Mengembalikan order dasar klaim (yang terkuat), atau null.
 */
export function berhakKlaimV5<T extends OrderIndikator>(orders: T[], v5Id: string | null, batas: Date | null): T | null {
  if (!v5Id || !batas) return null;
  const aktif = orders.filter((o) => isIndikator(o) && o.status === 'aktif');
  if (aktif.some((o) => o.product_id === v5Id)) return null;
  const layak = aktif.filter((o) => {
    // Pesanan lama (sebelum kolom activated_at ada) tidak punya activated_at → pakai created_at.
    const mulai = o.activated_at || o.created_at;
    if (!mulai || new Date(mulai).getTime() >= batas.getTime()) return false;
    // Klaim v5 gratis hanya untuk pemilik paket Lifetime (keputusan pemilik, 25/11/2026).
    return o.plan_type === 'lifetime';
  });
  return pilihOrderIndikator(layak);
}

export interface ProdukJual {
  id: string;
  nama: string;
  deskripsi?: string | null;
  status?: string | null;
  tanggal_rilis?: string | null;
  harga_bulanan?: number | null; diskon_bulanan?: number | null;
  harga_tahunan?: number | null; diskon_tahunan?: number | null;
  harga_lifetime?: number | null; diskon_lifetime?: number | null;
  /** Diskon paket berlaku sampai akhir tanggal ini (WIB); null = tanpa batas. */
  diskon_hingga?: string | null;
}

export type KeyPaket = 'bulanan' | 'tahunan' | 'lifetime';
export interface PaketProduk { key: KeyPaket; nama: string; harga_asli: number; diskon: number }

/** Akhir masa diskon (23:59:59 WIB pada diskon_hingga), atau null bila tanpa batas. */
export function akhirDiskon(p: ProdukJual): Date | null {
  return p.diskon_hingga ? new Date(p.diskon_hingga + 'T23:59:59+07:00') : null;
}

/** Event promo berbatas waktu (tabel promo_event, satu baris id=1), mis. Black Friday. */
export interface PromoEvent {
  aktif: boolean;
  nama: string;
  judul: string | null;
  subjudul: string | null;
  mulai: string;
  selesai: string;
  diskon: Record<string, Partial<Record<KeyPaket, number>>>;
  bonus: string | null;
  unggulan: { product_id: string; plan: KeyPaket } | null;
}

/** Event aktif dan sekarang di antara mulai dan selesai (inklusif). */
export function eventBerjalan(ev: PromoEvent | null | undefined, now: Date = new Date()): boolean {
  if (!ev || !ev.aktif || !ev.mulai || !ev.selesai) return false;
  const t = now.getTime();
  return t >= new Date(ev.mulai).getTime() && t <= new Date(ev.selesai).getTime();
}

/** Event aktif yang belum mulai (untuk banner/menu "mulai tgl X"). */
export function eventTerjadwal(ev: PromoEvent | null | undefined, now: Date = new Date()): boolean {
  return !!(ev && ev.aktif && ev.mulai && ev.selesai && now.getTime() < new Date(ev.mulai).getTime());
}

/** Event perlu ditampilkan (banner/menu): terjadwal atau sedang berjalan. */
export function eventTampil(ev: PromoEvent | null | undefined, now: Date = new Date()): boolean {
  return eventTerjadwal(ev, now) || eventBerjalan(ev, now);
}

/** Diskon terbesar di seluruh event (untuk "diskon hingga X%"). Dengan `produk`, hanya paket produk aktif yang
 *  punya harga yang dihitung, supaya angka di banner/hero sama dengan kartu yang benar-benar dijual. */
export function diskonMaksEvent(ev: PromoEvent | null | undefined, produk?: ProdukJual[]): number {
  if (!ev) return 0;
  if (produk) {
    return Math.max(0, ...produk.flatMap((p) => paketDariProduk(p, new Date(0))
      .map((k) => Number(ev.diskon?.[p.id]?.[k.key]) || 0)));
  }
  return Math.max(0, ...Object.values(ev.diskon || {}).flatMap((d) => Object.values(d || {}).map((x) => Number(x) || 0)));
}

/** Diskon event per kelas, disimpan di `ev.diskon._tier` = { bronze: 50, gold: 50, ... } (% dari harga normal/coret). */
function diskonTier(ev: PromoEvent | null | undefined): Record<string, number> {
  return ((ev?.diskon as Record<string, unknown> | undefined)?._tier as Record<string, number> | undefined) || {};
}

/** Harga kelas selama event berjalan, atau null bila tidak ada diskon event yang lebih murah dari harga jual. */
export function hargaKelasEvent(
  tier: { id: string; price: number; original_price?: number | null },
  ev: PromoEvent | null | undefined,
  now: Date = new Date(),
): { normal: number; harga: number; diskon: number } | null {
  if (!eventBerjalan(ev, now)) return null;
  const diskon = Number(diskonTier(ev)[tier.id]) || 0;
  if (diskon <= 0) return null;
  const normal = tier.original_price || tier.price;
  const harga = Math.round(normal * (1 - diskon / 100));
  return harga < tier.price ? { normal, harga, diskon } : null;
}

/** Tier kelas dengan harga event diterapkan: price = harga event, original_price = harga normal,
 *  badge = "{nama event} -X%", promo_diskon = X. Tanpa diskon event, tier dikembalikan apa adanya. */
export function tierDenganEvent<T extends { id: string; price: number; original_price?: number | null; badge?: string | null }>(
  tier: T, ev: PromoEvent | null | undefined, now: Date = new Date(),
): T & { promo_diskon?: number } {
  const h = hargaKelasEvent(tier, ev, now);
  if (!h) return tier;
  return { ...tier, price: h.harga, original_price: h.normal, badge: `${ev!.nama} -${h.diskon}%`, promo_diskon: h.diskon };
}

/** Diskon kelas terbesar di event (untuk "kelas diskon hingga X%"). */
export function diskonMaksKelas(ev: PromoEvent | null | undefined): number {
  return Math.max(0, ...Object.values(diskonTier(ev)).map((x) => Number(x) || 0));
}

/** Member kelas berbayar (Bronze/Silver/Gold/Platinum, termasuk "Gold Mentorship"); Trial & pembeli indikator tidak. */
export function memberKelasBerbayar(tier: string | null | undefined): boolean {
  const t = (tier || '').toLowerCase();
  if (!t || t.includes('indikator') || t.includes('trial')) return false;
  return /bronze|silver|gold|platinum/.test(t);
}

/** Pernah/masih punya indikator = ada pesanan indikator berstatus aktif. */
export function punyaIndikator(orders: { status: string; plan_type: string | null }[]): boolean {
  return orders.some((o) => !!o.plan_type && o.status === 'aktif');
}

/** Diskon yang ditagih: yang terbesar antara diskon paket (produk/event) dan kode diskon. Dipakai /bayar dan dashboard. */
export function diskonEfektif(diskonPaket: number | null | undefined, diskonKode: number | null | undefined): number {
  return Math.max(Number(diskonPaket) || 0, Number(diskonKode) || 0);
}

/** Paket yang dijual dari satu baris products; paket tanpa harga (null/0) dibuang. Diskon hilang setelah diskon_hingga.
 *  Selama event promo berjalan, diskon event (bila > 0) menggantikan diskon produk untuk paket itu. */
export function paketDariProduk(p: ProdukJual, now: Date = new Date(), ev?: PromoEvent | null, opt?: { kelas?: boolean }): PaketProduk[] {
  const akhir = akhirDiskon(p);
  const aktif = !akhir || now.getTime() <= akhir.getTime();
  const jalan = eventBerjalan(ev, now);
  const dEvent = jalan ? ev!.diskon?.[p.id] : undefined;
  // Diskon khusus member kelas berbayar yang belum punya indikator (ev.diskon._kelas), berlaku untuk semua produk.
  const dKelas = jalan && opt?.kelas ? ev!.diskon?._kelas : undefined;
  const d = (key: KeyPaket, x?: number | null) => {
    const biasa = aktif ? x || 0 : 0;
    // Event tidak pernah menaikkan harga: bila diskon event lebih kecil, diskon produk yang berlaku.
    return Math.max(Number(dEvent?.[key]) || 0, Number(dKelas?.[key]) || 0, biasa);
  };
  const semua: PaketProduk[] = [
    { key: 'bulanan', nama: 'Bulanan', harga_asli: p.harga_bulanan || 0, diskon: d('bulanan', p.diskon_bulanan) },
    { key: 'tahunan', nama: 'Tahunan', harga_asli: p.harga_tahunan || 0, diskon: d('tahunan', p.diskon_tahunan) },
    { key: 'lifetime', nama: 'Lifetime', harga_asli: p.harga_lifetime || 0, diskon: d('lifetime', p.diskon_lifetime) },
  ];
  return semua.filter((x) => x.harga_asli > 0);
}

/** "PROMO -50% · S/D 1 DESEMBER 2026" selama diskon produk berbatas waktu masih berlaku;
 *  "BLACK FRIDAY -60% · S/D 30 NOVEMBER 2026" selama event promo memberi diskon ke produk ini. */
export function labelPromo(p: ProdukJual, now: Date = new Date(), ev?: PromoEvent | null, opt?: { kelas?: boolean }): string | undefined {
  const dKelas = eventBerjalan(ev, now) && opt?.kelas ? ev!.diskon?._kelas : undefined;
  const paketKelas = dKelas ? paketDariProduk(p, now, ev, opt).filter((x) => Number(dKelas[x.key]) > 0 && x.diskon === Number(dKelas[x.key])) : [];
  if (paketKelas.length) {
    return `KHUSUS MEMBER KELAS -${Math.max(...paketKelas.map((x) => x.diskon))}% · S/D ${fmtTanggalRilis(new Date(ev!.selesai)).toUpperCase()}`;
  }
  const dEvent = eventBerjalan(ev, now) ? ev!.diskon?.[p.id] : undefined;
  const paketEvent = dEvent ? paketDariProduk(p, now, ev).filter((x) => Number(dEvent[x.key]) > 0) : [];
  if (paketEvent.length) {
    const maksE = Math.max(...paketEvent.map((x) => x.diskon));
    return `${ev!.nama.toUpperCase()} -${maksE}% · S/D ${fmtTanggalRilis(new Date(ev!.selesai)).toUpperCase()}`;
  }
  const akhir = akhirDiskon(p);
  const maks = Math.max(0, ...paketDariProduk(p, now).map((x) => x.diskon));
  if (!akhir || maks <= 0) return undefined;
  return `PROMO -${maks}% · S/D ${fmtTanggalRilis(new Date(p.diskon_hingga + 'T00:00:00+07:00')).toUpperCase()}`;
}

/** Produk dengan tanggal_rilis terbaru = produk terbaru (dapat badge TERBARU). */
export function terbaruDari(produk: ProdukJual[]): string | null {
  const ber = produk.filter((p) => p.tanggal_rilis).sort((a, b) => (b.tanggal_rilis! > a.tanggal_rilis! ? 1 : -1));
  return ber[0]?.id ?? null;
}

/** Produk terbaru yang sudah rilis dan sedang promo berbatas waktu → isi banner; selain itu null. */
export function promoRilis(produk: ProdukJual[], now: Date = new Date()): { nama: string; diskon: number; hingga: string } | null {
  const p = produk.find((x) => x.id === terbaruDari(produk));
  if (!p || p.status === 'preorder' || !p.diskon_hingga || !labelPromo(p, now)) return null;
  const diskon = Math.max(...paketDariProduk(p, now).map((x) => x.diskon));
  return { nama: p.nama, diskon, hingga: fmtTanggalRilis(new Date(p.diskon_hingga + 'T00:00:00+07:00')) };
}
