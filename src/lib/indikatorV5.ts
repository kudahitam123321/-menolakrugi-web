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
  return d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'segera';
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
    if (!o.activated_at || new Date(o.activated_at).getTime() >= batas.getTime()) return false;
    if (o.plan_type === 'lifetime') return true;
    const jt = hitungJatuhTempo(o.activated_at, o.plan_type);
    return !!jt && jt.getTime() >= batas.getTime();
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
}

export type KeyPaket = 'bulanan' | 'tahunan' | 'lifetime';
export interface PaketProduk { key: KeyPaket; nama: string; harga_asli: number; diskon: number }

/** Paket yang dijual dari satu baris products; paket tanpa harga (null/0) dibuang. */
export function paketDariProduk(p: ProdukJual): PaketProduk[] {
  const semua: PaketProduk[] = [
    { key: 'bulanan', nama: 'Bulanan', harga_asli: p.harga_bulanan || 0, diskon: p.diskon_bulanan || 0 },
    { key: 'tahunan', nama: 'Tahunan', harga_asli: p.harga_tahunan || 0, diskon: p.diskon_tahunan || 0 },
    { key: 'lifetime', nama: 'Lifetime', harga_asli: p.harga_lifetime || 0, diskon: p.diskon_lifetime || 0 },
  ];
  return semua.filter((x) => x.harga_asli > 0);
}
