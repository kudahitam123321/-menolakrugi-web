// pages/BayarAkunPage.tsx — Halaman kredensial akun setelah submit form /bayar
// URL: /bayar/akun?order=<uuid>

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { WA_NUMBER } from '../constants';

const C = {
  bg:      'var(--mr-bg)',
  panel:   'var(--mr-panel)',
  text:    'var(--mr-text)',
  border:  'var(--mr-border)',
  border2: 'var(--mr-border2)',
  dim:     'var(--mr-dim)',
  dimmer:  'var(--mr-dimmer)',
};
const G = { gold: 'var(--mr-gold)', up: 'var(--mr-up)', down: 'var(--mr-down)' };

interface OrderRow {
  id: string;
  member_id: string | null;
  nama_member: string;
  email_member: string;
  plan_type: string;
  diskon_applied: number | null;
  catatan: string | null;
}
interface MemberRow {
  nama: string;
  password: string;
}

export default function BayarAkunPage() {
  const orderId = new URLSearchParams(window.location.search).get('order');

  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [order, setOrder]       = useState<OrderRow | null>(null);
  const [member, setMember]     = useState<MemberRow | null>(null);
  const [copied, setCopied]     = useState<'nama' | 'password' | ''>('');

  useEffect(() => {
    async function load() {
      if (!orderId) { setNotFound(true); setLoading(false); return; }

      const { data: o } = await supabase
        .from('orders')
        .select('id, member_id, nama_member, email_member, plan_type, diskon_applied, catatan')
        .eq('id', orderId)
        .single();
      if (!o || !o.member_id) { setNotFound(true); setLoading(false); return; }

      const { data: m } = await supabase
        .from('members')
        .select('nama, password')
        .eq('id', o.member_id)
        .single();
      if (!m) { setNotFound(true); setLoading(false); return; }

      setOrder(o as OrderRow);
      setMember(m as MemberRow);
      setLoading(false);
    }
    load();
  }, [orderId]);

  function copy(field: 'nama' | 'password', value: string) {
    navigator.clipboard?.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  }

  function konfirmasiWA() {
    if (!order) return;
    const msg = [
      `Halo Admin, saya sudah isi data pembelian Indikator SMC.`,
      ``,
      `*Nama:* ${order.nama_member}`,
      `*Order ID:* ${order.id}`,
      `*Plan:* ${order.plan_type}`,
      `*Catatan:* ${order.catatan || '-'}`,
      ``,
      `Mohon konfirmasi pembayaran saya dan aktifkan akun member saya ya. Terima kasih!`,
    ].join('\n');
    const waUrl = `https://wa.me/62${WA_NUMBER.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontFamily: '"Geist Mono",monospace', fontSize: 13 }}>
      Memuat...
    </div>
  );

  if (notFound || !order || !member) return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"Geist",system-ui,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, textAlign: 'center' as const }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Data pesanan tidak ditemukan</div>
        <div style={{ color: C.dim, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          Link ini mungkin salah atau sudah tidak berlaku. Silakan ulangi dari halaman pembayaran.
        </div>
        <button onClick={() => window.location.href = '/bayar'}
          style={{ fontFamily: '"Geist Mono",monospace', background: G.gold, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
          ← KEMBALI KE /BAYAR
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"Geist",system-ui,sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '14px 24px' }}>
        <span style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 11, letterSpacing: 0.8 }}>// AKUN MEMBER</span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>Akun Kamu Sudah Dibuat!</div>
        </div>

        {/* Kartu kredensial */}
        <div style={{ background: G.gold + '0d', border: `1px solid ${G.gold}33`, borderRadius: 10, padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 14 }}>// KREDENSIAL LOGIN</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 10, color: C.dim, marginBottom: 4 }}>USERNAME (NAMA LENGKAP)</div>
            <div onClick={() => copy('nama', member.nama)} title="Klik untuk salin"
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>
              {member.nama}
              <span style={{ fontFamily: '"Geist Mono",monospace', fontSize: 10, color: copied === 'nama' ? G.up : C.dim }}>{copied === 'nama' ? '✓ disalin' : '⎘ salin'}</span>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 10, color: C.dim, marginBottom: 4 }}>PASSWORD</div>
            <div onClick={() => copy('password', member.password)} title="Klik untuk salin"
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: '"Geist Mono",monospace', fontSize: 20, fontWeight: 700, letterSpacing: 1.5, color: G.gold, cursor: 'pointer' }}>
              {member.password}
              <span style={{ fontFamily: '"Geist Mono",monospace', fontSize: 10, color: copied === 'password' ? G.up : C.dim }}>{copied === 'password' ? '✓ disalin' : '⎘ salin'}</span>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 10, color: C.dim, marginBottom: 4 }}>TIER</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>SMC Trial</div>
          </div>
        </div>

        {/* Warning */}
        <div style={{ background: '#3a2800', border: '1px solid #5a4000', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#d4a853', lineHeight: 1.6, marginBottom: 24 }}>
          ⚠ Simpan username & password ini baik-baik. Login baru bisa dipakai setelah admin memverifikasi pembayaran kamu (biasanya dalam beberapa saat setelah konfirmasi WhatsApp).
        </div>

        {/* Ringkasan order */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 24, fontSize: 12, color: C.dim, display: 'grid', gap: 6 }}>
          <div>Order ID: <span style={{ color: C.text, fontFamily: '"Geist Mono",monospace' }}>{order.id}</span></div>
          <div>Plan: <span style={{ color: C.text }}>{order.plan_type}</span></div>
          <div>Email: <span style={{ color: C.text }}>{order.email_member}</span></div>
        </div>

        <button onClick={konfirmasiWA}
          style={{ width: '100%', fontFamily: '"Geist Mono",monospace', padding: '15px 0', background: G.gold, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, letterSpacing: 0.8, borderRadius: 8, marginBottom: 14 }}>
          KONFIRMASI VIA WHATSAPP →
        </button>

        <div style={{ textAlign: 'center' as const }}>
          <a href="/login" style={{ fontFamily: '"Geist Mono",monospace', fontSize: 12, color: C.dim, textDecoration: 'underline' }}>Ke Halaman Login →</a>
        </div>
      </div>
    </div>
  );
}
