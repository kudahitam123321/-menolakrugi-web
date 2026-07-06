// pages/PricingIndikatorPage.tsx — Halaman pricing Indikator SMC
// URL: /pricing-indikator
// Dipindah dari komponen ProductPreview ("Preview Platform") di LandingPage.tsx

import React from 'react';
import { useLandingPreview } from '../hooks';
import type { LandingPreviewConfig } from '../hooks';

const LP = {
  bg:            'var(--lp-bg)',
  surface:       'var(--lp-surface)',
  text:          'var(--lp-text)',
  muted:         'var(--lp-muted)',
  border:        'var(--lp-border)',
  primary:       'var(--lp-primary)',
  primaryHover:  'var(--lp-primary-hover)',
  primaryTint:   'var(--lp-primary-tint)',
  danger:        'var(--lp-danger)',
  sans: '"Geist",system-ui,sans-serif',
  mono: '"Geist Mono",monospace',
  radius:   16,
  radiusSm: 10,
  shadowSm: '0 1px 3px rgba(0,0,0,0.06)',
  shadowMd: '0 8px 24px rgba(0,0,0,0.08)',
};

const KURS_USD = 18000; // Rp per 1 USD — dipakai buat estimasi harga USD di kartu pricing

function ProductPreview({ config }: { config: LandingPreviewConfig }) {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const plans = [
    { nama: config.plan1_nama, harga_asli: config.plan1_harga_asli, diskon: config.plan1_diskon, key: 'bulanan',  featured: false },
    { nama: config.plan2_nama, harga_asli: config.plan2_harga_asli, diskon: config.plan2_diskon, key: 'tahunan',  featured: true },
    { nama: config.plan3_nama, harga_asli: config.plan3_harga_asli, diskon: config.plan3_diskon, key: 'lifetime', featured: false },
  ];

  return (
    <section style={{ background: LP.bg, padding: isMobile ? '48px 20px' : '72px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 32 }}>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, letterSpacing: 0.8 }}>// PREVIEW PLATFORM</div>
          <h2 style={{ fontSize: isMobile ? 24 : 40, letterSpacing: -1, lineHeight: 1.15, margin: '14px 0 12px', fontWeight: 800, color: LP.text }}>
            Belum Paham SMC? Tidak Masalah.
          </h2>
          <p style={{ color: LP.muted, fontSize: isMobile ? 14 : 16, lineHeight: 1.6, margin: '0 auto', maxWidth: 560 }}>
            Indikator ini membantu Anda membaca struktur market dengan lebih mudah.{' '}
            <span style={{ color: LP.primary, fontWeight: 600 }}>Benefit untuk langganan tahunan dan lifetime: akses ke Discord private Menolak Rugi.</span>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {plans.map((plan) => {
            const hargaDiskon = plan.diskon > 0 ? Math.round(plan.harga_asli * (1 - plan.diskon / 100)) : plan.harga_asli;
            const hemat = plan.harga_asli - hargaDiskon;
            return (
              <div key={plan.key} style={{
                borderRadius: LP.radius, padding: '26px 22px', background: LP.surface,
                border: plan.featured ? `2px solid ${LP.primary}` : `1px solid ${LP.border}`,
                boxShadow: plan.featured ? LP.shadowMd : LP.shadowSm,
                display: 'flex', flexDirection: 'column' as const, position: 'relative',
              }}>
                {plan.featured && (
                  <div style={{ position: 'absolute', top: -12, left: 20, background: LP.primary, color: '#fff', padding: '4px 12px', fontSize: 10, letterSpacing: 0.6, fontWeight: 700, borderRadius: 20 }}>
                    PALING POPULER
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, marginTop: plan.featured ? 8 : 0, color: LP.text }}>{plan.nama}</div>
                <div style={{ marginBottom: 4 }}>
                  {plan.diskon > 0 && (
                    <div style={{ fontFamily: LP.mono, fontSize: 12, color: LP.muted, marginBottom: 4 }}><s>Rp {fmt(plan.harga_asli)}</s></div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 14 }}>Rp</span>
                    <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: LP.text }}>{fmt(hargaDiskon)}</span>
                  </div>
                  <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 2 }}>≈ ${(hargaDiskon / KURS_USD).toFixed(2)}</div>
                  {plan.diskon > 0 && (
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 11, marginTop: 6, background: LP.primaryTint, display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>
                      Hemat {plan.diskon}% · Rp {fmt(hemat)}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => { window.location.href = `/bayar?plan=${plan.key}`; }}
                  style={{
                    marginTop: 24, fontFamily: LP.sans, padding: '13px 0', fontSize: 13, fontWeight: 700, width: '100%', cursor: 'pointer', borderRadius: 8,
                    background: plan.featured ? LP.primary : 'transparent',
                    color: plan.featured ? '#fff' : LP.primary,
                    border: plan.featured ? 'none' : `1px solid ${LP.primary}`,
                  }}>
                  Pilih {plan.nama} →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function PricingIndikatorPage() {
  const { preview } = useLandingPreview();

  return (
    <div className="mr-light-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ borderBottom: `1px solid ${LP.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: LP.text, fontWeight: 800, letterSpacing: 0.3, fontSize: 14 }}>
          <img src="/logo.png" alt="MR" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          MENOLAK RUGI
        </a>
      </div>
      {preview ? (
        <ProductPreview config={preview} />
      ) : (
        <div style={{ padding: 60, textAlign: 'center' as const, color: LP.muted, fontFamily: LP.mono, fontSize: 13 }}>Memuat...</div>
      )}
    </div>
  );
}
