// lib/upgradeKelas.ts — Upgrade kelas member lama (/checkout → /payment).
// Member membayar selisih: harga kelas tujuan (sudah termasuk harga event, mis. Black Friday) dikurangi
// harga jual biasa kelas lamanya. Trial (langganan bulanan) tidak memberi potongan.
// Order upgrade ditandai lewat orders.kode_diskon = "UPGRADE:<id kelas lama>" (tanpa migrasi), supaya
// /payment menghitung selisih yang sama dan admin bisa menaikkan tier otomatis saat order diaktifkan.

/** Nilai members.tier ("SMC Gold Mentorship", "gold", "smc silver", …) → id pricing_tiers, atau null bila bukan kelas. */
export function tierIdDari(tier: string | null | undefined): string | null {
  const t = (tier || '').toLowerCase();
  if (!t || t.includes('indikator')) return null;
  if (t.includes('platinum')) return 'platinum';
  if (t.includes('gold')) return 'gold';
  if (t.includes('bronze') || t.includes('silver')) return 'bronze';
  if (t.includes('trial')) return 'trial';
  return null;
}

/** Harga upgrade = max(0, harga kelas tujuan − harga jual biasa kelas lama). Tier sama atau Trial = bayar penuh. */
export function hargaUpgrade(
  tujuan: { id: string; price: number },
  dari: { id: string; price: number } | null,
): { harga: number; potongan: number } {
  const potongan = dari && dari.id !== 'trial' && dari.id !== tujuan.id ? dari.price : 0;
  return { harga: Math.max(0, tujuan.price - potongan), potongan };
}

export function kodeUpgrade(dari: string | null): string {
  return `UPGRADE:${dari || '-'}`;
}

export function bacaKodeUpgrade(kode: string | null | undefined): { dari: string | null } | null {
  if (!kode || !kode.startsWith('UPGRADE:')) return null;
  const dari = kode.slice('UPGRADE:'.length);
  return { dari: dari && dari !== '-' ? dari : null };
}
