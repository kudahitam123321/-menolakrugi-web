import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useProdukIndikator } from '../hooks';
import { fmtTanggalRilis } from '../lib/indikatorV5';

export default function PromoBanner() {
  const [teks, setTeks] = useState<string | null>(null);
  const { preorder, tanggalRilis } = useProdukIndikator();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('discount_codes')
        .select('*')
        .eq('aktif', true)
        .eq('tampil_banner', true)
        .order('created_at', { ascending: false })
        .limit(1);
      const dc = data?.[0];
      if (!dc || !dc.banner_teks) return;
      const expired = dc.berlaku_hingga && new Date(dc.berlaku_hingga) < new Date();
      const habis = dc.max_penggunaan && dc.terpakai >= dc.max_penggunaan;
      if (expired || habis) return;
      setTeks(dc.banner_teks);
    }
    load();
  }, []);

  // Selama indikator v5 pre-order, banner dipakai untuk pengumuman v5 (menggantikan promo kode diskon).
  if (preorder) {
    return (
      <a href="/pricing-indikator" style={{
        display: 'block', background: 'var(--mr-gold)', color: '#fff', textAlign: 'center' as const, padding: '10px 16px',
        fontSize: 13, fontWeight: 600, fontFamily: '"Geist",system-ui,sans-serif', lineHeight: 1.4, textDecoration: 'none',
      }}>
        ⏳ SMC Indikator v5 rilis {fmtTanggalRilis(tanggalRilis)} — <u style={{ textUnderlineOffset: 3 }}>pre-order harga early-bird</u> sekarang, langsung dapat v4.2 →
      </a>
    );
  }

  if (!teks) return null;

  return (
    <div style={{
      background: 'var(--mr-gold)',
      color: '#fff',
      textAlign: 'center' as const,
      padding: '10px 16px',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: '"Geist",system-ui,sans-serif',
      lineHeight: 1.4,
    }}>
      {teks}
    </div>
  );
}
