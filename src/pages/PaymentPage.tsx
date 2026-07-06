// pages/PaymentPage.tsx — Halaman pembayaran (baca order asli dari Supabase)
// URL: /payment?order=<uuid>

import React, { useEffect, useState } from 'react';

import { MR } from '../lib/theme';
import { MRLogo, Ticker } from '../components/mr';
import { usePricing } from '../hooks';
import { supabase } from '../lib/supabase';

interface OrderRow {
  id: string;
  member_id: string | null;
  nama_member: string;
  email_member: string | null;
  tier_member: string;
  status: string;
}
interface PaymentMethodRow {
  id: string;
  jenis: 'bank' | 'qris';
  nama_bank: string;
  nomor_rekening: string | null;
  nama_rekening: string | null;
  qris_image_url: string | null;
  catatan: string | null;
}

export default function PaymentPage() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const orderId = new URLSearchParams(window.location.search).get('order');
  const { tiers } = usePricing();

  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [order, setOrder]       = useState<OrderRow | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRow[]>([]);
  const [selectedPm, setSelectedPm] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!orderId) { setNotFound(true); setLoading(false); return; }

      const [{ data: o }, { data: pm }] = await Promise.all([
        supabase.from('orders').select('id, member_id, nama_member, email_member, tier_member, status').eq('id', orderId).single(),
        supabase.from('payment_methods').select('*').neq('aktif', false).order('urutan', { ascending: true }),
      ]);
      if (!o) { setNotFound(true); setLoading(false); return; }

      setOrder(o as OrderRow);
      setPaymentMethods((pm || []) as PaymentMethodRow[]);
      setLoading(false);
    }
    load();
  }, [orderId]);

  const tier = order ? tiers.find(t => t.id === order.tier_member) : undefined;
  const fmt  = (n: number) => new Intl.NumberFormat('id-ID').format(n);
  const selected = paymentMethods.find(pm => pm.id === selectedPm);

  function copyAccNo(nomor: string) {
    navigator.clipboard.writeText(nomor.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function konfirmasiWA() {
    if (!order) return;
    if (selected) {
      const metodeInfo = selected.jenis === 'qris'
        ? `QRIS (${selected.nama_bank})`
        : `Bank: ${selected.nama_bank} | Rek: ${selected.nomor_rekening || ''}`;
      await supabase.from('orders').update({ catatan: metodeInfo }).eq('id', order.id);
    }
    const waMsg = encodeURIComponent(
      `Halo admin, saya sudah transfer untuk ${tier?.name ?? order.tier_member} atas nama ${order.nama_member}. Order: #${order.id}. Berikut bukti transfernya.`
    );
    window.open(`https://wa.me/6281242224939?text=${waMsg}`, '_blank');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: MR.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MR.dim, fontFamily: MR.mono, fontSize: 13 }}>
      Memuat...
    </div>
  );

  if (notFound || !order) return (
    <div style={{ minHeight: '100vh', background: MR.bg, color: MR.text, fontFamily: MR.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, textAlign: 'center' as const }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Data pesanan tidak ditemukan</div>
        <div style={{ color: MR.dim, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          Link ini mungkin salah atau sudah tidak berlaku. Silakan ulangi dari halaman signup.
        </div>
        <button onClick={() => window.location.href = '/signup'}
          style={{ fontFamily: MR.mono, background: MR.gold, color: '#000', border: 'none', padding: '12px 24px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
          ← KEMBALI KE /SIGNUP
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: MR.sans, color: MR.text, background: MR.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <Ticker />

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${MR.border}`, padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => window.history.back()} style={{ fontFamily: MR.mono, fontSize: 12, color: MR.dim, background: 'none', border: 'none', cursor: 'pointer', marginRight: 4 }}>← KEMBALI</button>
          <MRLogo size={26} />
          <span style={{ fontWeight: 800, letterSpacing: -0.3 }}>MENOLAK RUGI</span>
          <span style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 11, marginLeft: 12, paddingLeft: 12, borderLeft: `1px solid ${MR.border}` }}>PEMBAYARAN</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 440px', gap: 0, padding: isMobile ? '16px' : '40px' }}>
        {/* Left — pilih metode bayar */}
        <div style={{ paddingRight: isMobile ? 0 : 40 }}>
          <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.6, marginBottom: 8 }}>// ORDER #{order.id}</div>
          <h2 style={{ fontSize: isMobile ? 24 : 38, fontWeight: 700, letterSpacing: -1, margin: '0 0 10px' }}>Pilih Metode Pembayaran</h2>
          <p style={{ color: MR.dim, fontSize: 14, lineHeight: 1.55, marginBottom: 28, maxWidth: 480 }}>
            Pilih salah satu metode di bawah, transfer sesuai nominal, lalu konfirmasi via WhatsApp dengan bukti transfer.
          </p>

          {paymentMethods.length === 0 && (
            <div style={{ color: MR.dim, fontSize: 13, padding: '16px 0' }}>Belum ada metode pembayaran aktif.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {paymentMethods.map(pm => {
              const isSelected = selectedPm === pm.id;
              return (
                <button key={pm.id} onClick={() => setSelectedPm(pm.id)}
                  style={{ textAlign: 'left' as const, border: `1.5px solid ${isSelected ? MR.gold : MR.border}`, background: isSelected ? '#0e0c04' : MR.panel, padding: '16px 20px', cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{pm.nama_bank}</div>
                  {pm.jenis === 'qris' ? (
                    isSelected && pm.qris_image_url ? (
                      <img src={pm.qris_image_url} alt={`QRIS ${pm.nama_bank}`} style={{ width: '100%', maxWidth: 320, height: 320, objectFit: 'contain', background: '#fff', borderRadius: 6, marginTop: 4 }} />
                    ) : (
                      <div style={{ fontFamily: MR.mono, fontSize: 11, color: MR.dim }}>Klik untuk lihat QR code</div>
                    )
                  ) : (
                    <>
                      <div style={{ fontFamily: MR.mono, fontSize: 18, fontWeight: 700, letterSpacing: 1.5, color: isSelected ? MR.gold : MR.text }}>{pm.nomor_rekening}</div>
                      <div style={{ fontFamily: MR.mono, fontSize: 11, color: MR.dim }}>a.n. {pm.nama_rekening}</div>
                    </>
                  )}
                  {pm.catatan && <div style={{ fontSize: 11, color: MR.dimmer }}>{pm.catatan}</div>}
                </button>
              );
            })}
          </div>

          {selected && selected.jenis === 'bank' && selected.nomor_rekening && (
            <button onClick={() => copyAccNo(selected.nomor_rekening!)} style={{ marginTop: 12, fontFamily: MR.mono, border: `1px solid ${MR.border}`, background: copied ? MR.up : 'transparent', color: copied ? '#000' : MR.text, padding: '8px 14px', fontSize: 11, letterSpacing: 0.6, cursor: 'pointer' }}>
              {copied ? 'TERSALIN ✓' : 'SALIN NOMOR REKENING ▸'}
            </button>
          )}
        </div>

        {/* Right — ringkasan pesanan */}
        <div style={{ border: `1px solid ${MR.gold}`, background: '#0a0800', padding: isMobile ? 20 : 28, display: 'flex', flexDirection: 'column' as const, gap: 20, alignSelf: 'start', position: isMobile ? 'static' as const : 'sticky' as const, top: 20, marginTop: isMobile ? 20 : 0 }}>
          <div style={{ fontFamily: MR.mono, display: 'flex', justifyContent: 'space-between', color: MR.dim, fontSize: 11 }}>
            <span>◉ RINGKASAN PESANAN</span>
            <span style={{ color: MR.gold }}>#{order.id.slice(0, 8)}</span>
          </div>

          <div>
            <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 6 }}>KELAS DIPILIH</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{tier?.name ?? order.tier_member}</div>
          </div>

          <div style={{ borderTop: `1px solid ${MR.border}`, paddingTop: 16, display: 'grid', gap: 10, fontSize: 13, fontFamily: MR.mono }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontSize: 18 }}>
              <span>TOTAL TRANSFER</span>
              <span style={{ color: MR.gold, fontWeight: 700 }}>Rp {fmt(tier?.price ?? 0)}</span>
            </div>
          </div>

          <button onClick={konfirmasiWA} disabled={!selectedPm}
            style={{ width: '100%', fontFamily: MR.mono, background: selectedPm ? MR.gold : MR.border, color: selectedPm ? '#181000' : MR.dim, padding: '16px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, border: 'none', cursor: selectedPm ? 'pointer' : 'not-allowed' }}>
            KONFIRMASI VIA WHATSAPP ▸
          </button>
          <div style={{ fontFamily: MR.mono, fontSize: 10, color: MR.dimmer, textAlign: 'center' as const, lineHeight: 1.5 }}>
            Akses dibuka admin setelah verifikasi pembayaran.
          </div>
        </div>
      </div>
    </div>
  );
}
