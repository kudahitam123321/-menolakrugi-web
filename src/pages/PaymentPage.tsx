// pages/PaymentPage.tsx — Halaman pembayaran transfer bank (Direction A · Terminal)
// URL: /payment?tier=gold&name=Adi+Pramana&method=qris

import React, { useEffect, useState } from 'react';

import { MR } from '../lib/theme';
import { MRLogo, Ticker } from '../components/mr';
import { usePricing } from '../hooks';

// ─── Config rekening — GANTI sesuai data asli ────────────────────────────────
const BANK_INFO = {
  bank:       'BRI',
  accountNo:  '5166 0102 1807 533',
  accountName:'MUHAMAD FAUZAN AMIN',
  code:       'BRI · 002',
} as const;

const WHATSAPP_ADMIN = '6281242224939';

// ─── Countdown timer ─────────────────────────────────────────────────────────

function useCountdown(minutes = 30) {
  const [secs, setSecs] = useState(minutes * 60);
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `T-${mm}:${ss}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const params = new URLSearchParams(window.location.search);
  const { tiers }        = usePricing();
  const countdown        = useCountdown(30);

  const tierId   = params.get('tier') ?? 'gold';
  const userName = params.get('name') ?? '';

  const tier = tiers.find(t => t.id === tierId) ?? tiers.find(t => t.id === 'gold');
  const fmt  = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const [copied, setCopied] = useState(false);
  function copyAccNo() {
    navigator.clipboard.writeText(BANK_INFO.accountNo.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const orderNo = `MR-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const waMsg = encodeURIComponent(
    `Halo admin, saya sudah transfer untuk ${tier?.name ?? ''} atas nama ${userName}. Order: #${orderNo}. Berikut bukti transfernya.`
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
        {!isMobile && <div style={{ fontFamily: MR.mono, fontSize: 11, color: MR.dim }}>STEP 02 / 03 · TRANSFER</div>}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 440px', gap: 0, padding: isMobile ? '16px' : '40px' }}>
        {/* Left — detail transfer */}
        <div style={{ paddingRight: isMobile ? 0 : 40 }}>
          <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.6, marginBottom: 8 }}>// ORDER #{orderNo}</div>
          <h2 style={{ fontSize: isMobile ? 24 : 38, fontWeight: 700, letterSpacing: -1, margin: '0 0 10px' }}>Detail Pembayaran</h2>
          <p style={{ color: MR.dim, fontSize: 14, lineHeight: 1.55, marginBottom: 28, maxWidth: 480 }}>
            Transfer tepat sesuai nominal di bawah, lalu konfirmasi via WhatsApp dengan bukti transfer. Akses dibuka maks 10 menit setelah verifikasi.
          </p>

          {/* Bank info */}
          <div style={{ border: `1px solid ${MR.border}`, background: MR.panel, marginBottom: 16 }}>
            <div style={{ fontFamily: MR.mono, display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${MR.border}`, fontSize: 11, color: MR.dim, background: MR.darker }}>
              <span>◉ TRANSFER KE REKENING</span>
              <span style={{ color: MR.text }}>BANK · {BANK_INFO.bank}</span>
            </div>
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>NO. REKENING</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: isMobile ? 18 : 28, fontWeight: 700, letterSpacing: isMobile ? 1 : 2, fontFamily: MR.mono }}>{BANK_INFO.accountNo}</span>
                <button onClick={copyAccNo} style={{ fontFamily: MR.mono, border: `1px solid ${MR.border}`, background: copied ? MR.up : 'transparent', color: copied ? '#000' : MR.text, padding: '8px 14px', fontSize: 11, letterSpacing: 0.6, cursor: 'pointer' }}>
                  {copied ? 'TERSALIN ✓' : 'SALIN ▸'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
                <div>
                  <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8 }}>ATAS NAMA</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{BANK_INFO.accountName}</div>
                </div>
                <div>
                  <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8 }}>BANK</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{BANK_INFO.code}</div>
                </div>
              </div>
            </div>
            <div style={{ margin: '0 20px 16px', padding: '12px', background: '#1a0f00', border: `1px solid #3a2800`, fontSize: 12, color: '#d4a853', fontFamily: MR.mono, lineHeight: 1.55 }}>
              ⚠ Transfer tepat sampai 3 digit terakhir nominal. Sertakan bukti transfer waktu konfirmasi ke WhatsApp.
            </div>
          </div>

          {/* Personal data */}
          <div style={{ border: `1px solid ${MR.border}`, background: MR.panel }}>
            <div style={{ fontFamily: MR.mono, padding: '10px 16px', borderBottom: `1px solid ${MR.border}`, fontSize: 11, color: MR.dim, background: MR.darker }}>◉ DATA KAMU</div>
            <div style={{ padding: '20px', display: 'grid', gap: 16 }}>
              {[
                { l: 'NAMA LENGKAP',      v: userName || '—'    },
                { l: 'PAKET DIPILIH',     v: tier?.name ?? '—'  },
              ].map(f => (
                <div key={f.l}>
                  <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 6 }}>{f.l}</div>
                  <div style={{ border: `1px solid ${MR.borderHot}`, padding: '12px 14px', fontSize: 14, color: MR.text, background: MR.panel }}>{f.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — order summary + status */}
        <div style={{ border: `1px solid ${MR.gold}`, background: '#0a0800', padding: isMobile ? 20 : 28, display: 'flex', flexDirection: 'column', gap: 20, alignSelf: 'start', position: isMobile ? 'static' : 'sticky' as const, top: 20, marginTop: isMobile ? 20 : 0 }}>
          <div style={{ fontFamily: MR.mono, display: 'flex', justifyContent: 'space-between', color: MR.dim, fontSize: 11 }}>
            <span>◉ RINGKASAN PESANAN</span>
            <span style={{ color: MR.gold }}>#{orderNo}</span>
          </div>

          <div>
            <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 6 }}>KELAS DIPILIH</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{tier?.name ?? '—'}</div>
            <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, marginTop: 4 }}>AKSES SEUMUR HIDUP · GRUP MENTORING</div>
          </div>

          <div style={{ borderTop: `1px solid ${MR.border}`, paddingTop: 16, display: 'grid', gap: 10, fontSize: 13, fontFamily: MR.mono }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: MR.dim }}>
              <span>Harga kelas</span>
              <span>Rp {fmt(tier?.original_price ?? tier?.price ?? 0)}</span>
            </div>
            {tier?.original_price && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: MR.up }}>
                <span>Diskon early-bird</span>
                <span>− Rp {fmt(tier.original_price - tier.price)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: MR.dim }}>
              <span>Biaya admin</span><span>Rp 0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${MR.border}`, fontSize: 18 }}>
              <span>TOTAL TRANSFER</span>
              <span style={{ color: MR.gold, fontWeight: 700 }}>Rp {fmt(tier?.price ?? 0)}</span>
            </div>
            <div style={{ color: MR.dimmer, fontSize: 10 }}>3 digit unik akan ditambah otomatis di akhir nominal.</div>
          </div>

          <div style={{ borderTop: `1px solid ${MR.border}`, paddingTop: 16, fontFamily: MR.mono }}>
            <div style={{ color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 12 }}>// STATUS PEMBAYARAN</div>
            {[
              { l: 'PESANAN DIBUAT',     done: true,  active: false, t: new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
              { l: 'MENUNGGU TRANSFER',  done: false,  active: true,  t: countdown },
              { l: 'VERIFIKASI ADMIN',   done: false, active: false, t: '—' },
              { l: 'AKSES MEMBER AKTIF', done: false, active: false, t: '—' },
            ].map(s => (
              <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: s.done ? MR.up : s.active ? MR.text : MR.dimmer, padding: '4px 0' }}>
                <span>{s.done ? '✓' : s.active ? '●' : '○'} {s.l}</span>
                <span style={{ color: s.active ? MR.down : 'inherit' }}>{s.t}</span>
              </div>
            ))}
          </div>

          <a href={`https://wa.me/${WHATSAPP_ADMIN}?text=${waMsg}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', fontFamily: MR.mono, background: MR.gold, color: '#181000', padding: '16px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, border: 'none', cursor: 'pointer' }}>
              KONFIRMASI VIA WHATSAPP ▸
            </button>
          </a>
          <div style={{ fontFamily: MR.mono, fontSize: 10, color: MR.dimmer, textAlign: 'center', lineHeight: 1.5 }}>
            Diarahkan ke WhatsApp Admin. Lampirkan bukti transfer.
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
            <div style={{ flex: 1, height: 1, background: MR.border }} />
            <span style={{ fontFamily: MR.mono, fontSize: 10, color: MR.dim }}>SETELAH DIVERIFIKASI ADMIN</span>
            <div style={{ flex: 1, height: 1, background: MR.border }} />
          </div>

          <button onClick={() => window.location.href = '/login'}
            style={{ width: '100%', fontFamily: MR.mono, background: 'transparent', border: `1px solid ${MR.up}`, color: MR.up, padding: '14px', fontSize: 12, fontWeight: 700, letterSpacing: 0.4, cursor: 'pointer' }}>
            MASUK KE AKUN MEMBER ▸
          </button>
          <div style={{ fontFamily: MR.mono, fontSize: 10, color: MR.dimmer, textAlign: 'center' as const, lineHeight: 1.5 }}>
            Akses dibuka admin dalam 10 menit setelah konfirmasi diterima.
          </div>
        </div>
      </div>
    </div>
  );
}
