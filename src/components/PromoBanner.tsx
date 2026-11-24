import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useProdukIndikator, useProdukDijual, usePromoEvent } from '../hooks';
import { diskonMaksEvent, eventBerjalan, fmtTanggalRilis, promoRilis } from '../lib/indikatorV5';

interface KodeBanner { kode: string; diskon: number; teks: string | null }

export default function PromoBanner() {
  const [kode, setKode] = useState<KodeBanner | null>(null);
  const { preorder, tanggalRilis } = useProdukIndikator();
  const { produk: dijual } = useProdukDijual();
  const rilis = promoRilis(dijual);
  const { event } = usePromoEvent();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('discount_codes')
        .select('*')
        .eq('aktif', true)
        .eq('tampil_banner', true)
        .order('created_at', { ascending: false })
        .limit(1);
      const dc = data?.[0];
      if (!dc) return;
      const expired = dc.berlaku_hingga && new Date(dc.berlaku_hingga) < new Date();
      const habis = dc.max_penggunaan && dc.terpakai >= dc.max_penggunaan;
      if (expired || habis) return;
      setKode({ kode: dc.kode, diskon: dc.diskon, teks: dc.banner_teks || null });
    }
    load();
  }, []);

  const gaya = {
    display: 'block', background: 'var(--mr-gold)', color: '#fff', textAlign: 'center' as const, padding: '10px 16px',
    fontSize: 13, fontWeight: 600, fontFamily: '"Geist",system-ui,sans-serif', lineHeight: 1.4, textDecoration: 'none',
  };
  const pil = (k: KodeBanner) => (
    <b style={{ background: '#fff', color: 'var(--mr-gold)', padding: '1px 8px', borderRadius: 6, letterSpacing: 0.6, fontFamily: '"Geist Mono",monospace' }}>{k.kode}</b>
  );

  // Event promo (mis. Black Friday) sedang berjalan: banner event menang dari semua banner lain.
  if (eventBerjalan(event)) {
    return (
      <a href="/promo" data-banner="event" style={{ ...gaya, background: '#020617' }}>
        🖤 {event!.nama} — diskon hingga{' '}
        <b style={{ background: '#4ade80', color: '#052e16', padding: '1px 8px', borderRadius: 6, fontFamily: '"Geist Mono",monospace' }}>{diskonMaksEvent(event)}%</b>
        {' '}· berakhir {fmtTanggalRilis(new Date(event!.selesai))}. Lihat promo →
      </a>
    );
  }

  // Selama indikator v5 pre-order: pengumuman v5, plus kode diskon yang sedang dipasang di banner (kalau ada).
  if (preorder) {
    return (
      <a href="/pricing-indikator" style={gaya}>
        ⏳ SMC Indikator v5 rilis {fmtTanggalRilis(tanggalRilis)} —{' '}
        {kode ? <>pre-order pakai kode {pil(kode)} hemat {kode.diskon}%</> : <u style={{ textUnderlineOffset: 3 }}>pre-order harga early-bird</u>}
        {' '}sekarang, langsung dapat v4.2 →
      </a>
    );
  }

  // Setelah rilis, selama promo produk terbaru berlaku: info rilis + diskon.
  if (rilis) {
    return (
      <a href="/pricing-indikator" style={gaya}>
        🚀 {rilis.nama.replace(/^SMC by MenolakRugi/i, 'SMC Indikator')} sudah rilis — diskon{' '}
        <b style={{ background: '#fff', color: 'var(--mr-gold)', padding: '1px 8px', borderRadius: 6, fontFamily: '"Geist Mono",monospace' }}>{rilis.diskon}%</b>
        {' '}sampai {rilis.hingga}. Lihat harganya →
      </a>
    );
  }

  if (!kode) return null;

  return (
    <div style={gaya}>
      {kode.teks || <>Pakai kode {pil(kode)} hemat {kode.diskon}%</>}
    </div>
  );
}
