// components/IndikatorV5Info.tsx — Kotak info "v5 rilis …" di dashboard selama tahap pre-order.
// Isi menyesuaikan status langganan indikator member (lihat statusPreorder di lib/indikatorV5).
import { useProdukIndikator } from '../hooks';
import { fmtTanggalRilis, sisaWaktu, statusPreorder, type OrderIndikator } from '../lib/indikatorV5';

const LP = {
  surface: 'var(--lp-surface)', text: 'var(--lp-text)', muted: 'var(--lp-muted)', border: 'var(--lp-border)',
  primary: 'var(--lp-primary)', primaryTint: 'var(--lp-primary-tint)',
  sans: '"Geist",system-ui,sans-serif', mono: '"Geist Mono",monospace',
};
const WA_ADMIN = 'https://wa.me/6281242224939';

export default function IndikatorV5Info({ orders, onBeli }: { orders: OrderIndikator[]; onBeli: () => void }) {
  const { preorder, tanggalRilis } = useProdukIndikator();
  if (!preorder) return null;
  const status = statusPreorder(orders, tanggalRilis, new Date());
  if (status === 'tidak-ada') return null;

  const tgl = fmtTanggalRilis(tanggalRilis);
  const sisa = tanggalRilis ? sisaWaktu(tanggalRilis, new Date()) : null;
  const tombol = (label: string, onClick: () => void) => (
    <button onClick={onClick} style={{ marginLeft: 'auto', fontFamily: LP.sans, fontSize: 13, fontWeight: 700, color: '#fff', background: LP.primary, border: 'none', padding: '9px 14px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
      {label}
    </button>
  );

  const isi: Record<Exclude<typeof status, 'tidak-ada'>, { judul: string; teks: string; aksi: JSX.Element | null }> = {
    aman: {
      judul: `v5 rilis ${tgl} — gratis untukmu`,
      teks: 'Langgananmu aktif sampai rilis. Tombol klaim muncul di sini saat rilis.',
      aksi: sisa ? (
        <span style={{ marginLeft: 'auto', fontFamily: LP.mono, fontSize: 10, fontWeight: 700, color: '#92400e', background: '#FEF3C7', padding: '4px 9px', borderRadius: 20, whiteSpace: 'nowrap' as const }}>
          {sisa.hari} hari lagi
        </span>
      ) : null,
    },
    perpanjang: {
      judul: `v5 rilis ${tgl}`,
      teks: `Perpanjang sebelum ${tgl} supaya tetap aktif & dapat v5 gratis.`,
      aksi: tombol('Perpanjang →', onBeli),
    },
    habis: {
      judul: 'Pre-order v5 harga early-bird',
      teks: 'Langsung aktif lagi dengan v4.2, otomatis v5 saat rilis.',
      aksi: tombol('Pre-order →', onBeli),
    },
    'tidak-diketahui': {
      judul: `v5 rilis ${tgl}`,
      teks: 'Hubungi admin untuk cek kelayakan upgrade gratis.',
      aksi: tombol('Chat Admin →', () => window.open(WA_ADMIN, '_blank')),
    },
  };
  const k = isi[status];

  return (
    <div data-v5-status={status} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' as const, background: LP.surface, border: '1px solid rgba(22,163,74,.35)', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', fontFamily: LP.sans }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: LP.primaryTint, display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>🎁</div>
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: LP.text }}>{k.judul}</div>
        <div style={{ fontSize: 12, color: LP.muted, marginTop: 2, lineHeight: 1.5 }}>{k.teks}</div>
      </div>
      {k.aksi}
    </div>
  );
}
