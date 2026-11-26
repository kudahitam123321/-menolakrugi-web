// Koreksi & evaluasi jurnal dari admin: hitung yang belum dilihat member.
// Spec: docs/superpowers/specs/2026-11-26-evaluasi-jurnal-notifikasi-design.md

type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void };

export interface KoreksiEntry { admin_note?: string | null; admin_note_at?: string | null }
export interface JournalReview { catatan?: string | null; updated_at?: string | null; oleh?: string | null }

const kunci = (memberId: string) => `mr_koreksi_seen_${memberId}`;
const lokal = (): Store | null => (typeof localStorage === 'undefined' ? null : localStorage);

/** Waktu (ms) member terakhir membuka tab Jurnal; 0 kalau belum pernah / storage tidak bisa dibaca. */
export function bacaSeen(memberId: string, store: Store | null = lokal()): number {
  try { return Number(store?.getItem(kunci(memberId))) || 0; } catch { return 0; }
}

export function tandaiDilihat(memberId: string, now: number = Date.now(), store: Store | null = lokal()): void {
  try { store?.setItem(kunci(memberId), String(now)); } catch { /* storage diblokir — abaikan */ }
}

export function isKoreksiBaru(at: string | null | undefined, seen: number): boolean {
  if (!at) return false;
  const t = Date.parse(at);
  return Number.isFinite(t) && t > seen;
}

/** Jumlah koreksi per trade + evaluasi keseluruhan yang terisi dan lebih baru dari `seen`. */
export function hitungKoreksiBaru(entries: KoreksiEntry[], review: JournalReview | null, seen: number): number {
  const perTrade = entries.filter(e => (e.admin_note || '').trim() && isKoreksiBaru(e.admin_note_at, seen)).length;
  const evaluasi = review && (review.catatan || '').trim() && isKoreksiBaru(review.updated_at, seen) ? 1 : 0;
  return perTrade + evaluasi;
}
