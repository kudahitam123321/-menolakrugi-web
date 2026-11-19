// pages/PricingIndikatorPage.tsx — Halaman pricing Indikator SMC
// URL: /pricing-indikator
// Dipindah dari komponen ProductPreview ("Preview Platform") di LandingPage.tsx

import React from 'react';
import { useLandingPreview, useBacktestConfig, useProdukIndikator, useProdukDijual } from '../hooks';
import { fmtTanggalRilis, sisaWaktu, paketDariProduk, akhirDiskon, type PaketProduk, type ProdukJual } from '../lib/indikatorV5';
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

function paketDariConfig(config: LandingPreviewConfig): PaketProduk[] {
  return [
    { nama: config.plan1_nama, harga_asli: config.plan1_harga_asli, diskon: config.plan1_diskon, key: 'bulanan' },
    { nama: config.plan2_nama, harga_asli: config.plan2_harga_asli, diskon: config.plan2_diskon, key: 'tahunan' },
    { nama: config.plan3_nama, harga_asli: config.plan3_harga_asli, diskon: config.plan3_diskon, key: 'lifetime' },
  ];
}

function ProductPreview({ paket, preorder, produkId, judul, badge, promo, intro = true }: {
  paket: PaketProduk[]; preorder: boolean; produkId?: string; judul?: string; badge?: string; promo?: string; intro?: boolean;
}) {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const plans = paket.map((p) => ({ ...p, featured: p.key === 'tahunan' }));
  const kolom = Math.min(Math.max(plans.length, 1), 3);

  return (
    <section style={{ background: LP.bg, padding: preorder || !intro ? (isMobile ? '8px 20px 40px' : '8px 40px 56px') : (isMobile ? '48px 20px' : '72px 40px') }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {judul && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, marginBottom: 24, paddingTop: 8, borderTop: `1px solid ${LP.border}` }}>
            <h2 style={{ fontSize: isMobile ? 20 : 26, letterSpacing: -0.5, fontWeight: 800, color: LP.text, margin: '16px 0 0' }}>{judul}</h2>
            {badge && (
              <span style={{ marginTop: 16, background: LP.primary, color: '#fff', padding: '4px 10px', fontSize: 10, letterSpacing: 0.8, fontWeight: 700, borderRadius: 20, fontFamily: LP.mono }}>{badge}</span>
            )}
            {promo && (
              <span style={{ marginTop: 16, background: '#FEF3C7', color: '#92400e', border: '1px solid #FDE68A', padding: '3px 10px', fontSize: 10, letterSpacing: 0.8, fontWeight: 700, borderRadius: 20, fontFamily: LP.mono }}>{promo}</span>
            )}
          </div>
        )}
        {!intro ? null : preorder ? (
          <div style={{ textAlign: 'center' as const, marginBottom: 28, fontFamily: LP.mono, color: LP.primary, fontSize: 11, letterSpacing: 1 }}>// PRE-ORDER · HARGA EARLY-BIRD</div>
        ) : (
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
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${kolom}, 1fr)`, gap: 16 }}>
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
                {(plan.featured || (preorder && plan.diskon > 0)) && (
                  <div style={{ position: 'absolute', top: -12, left: 20, display: 'flex', gap: 6 }}>
                    {plan.featured && (
                      <span style={{ background: LP.primary, color: '#fff', padding: '4px 12px', fontSize: 10, letterSpacing: 0.6, fontWeight: 700, borderRadius: 20 }}>PALING POPULER</span>
                    )}
                    {preorder && plan.diskon > 0 && (
                      <span style={{ background: '#FEF3C7', color: '#92400e', border: '1px solid #FDE68A', padding: '3px 10px', fontSize: 10, letterSpacing: 0.6, fontWeight: 700, borderRadius: 20 }}>EARLY-BIRD -{plan.diskon}%</span>
                    )}
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, marginTop: (plan.featured || (preorder && plan.diskon > 0)) ? 8 : 0, color: LP.text }}>{plan.nama}</div>
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
                {preorder && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', fontSize: 13, color: LP.muted, lineHeight: 1.9 }}>
                    {['v4.2 langsung hari ini', 'v5 otomatis saat rilis', ...(plan.key !== 'bulanan' ? ['Discord private Menolak Rugi'] : [])].map((t) => (
                      <li key={t}><span style={{ color: LP.primary, fontWeight: 700 }}>✓</span> {t}</li>
                    ))}
                  </ul>
                )}
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => { window.location.href = produkId ? `/bayar?produk=${produkId}&plan=${plan.key}` : `/bayar?plan=${plan.key}`; }}
                  style={{
                    marginTop: 24, fontFamily: LP.sans, padding: '13px 0', fontSize: 13, fontWeight: 700, width: '100%', cursor: 'pointer', borderRadius: 8,
                    background: plan.featured ? LP.primary : 'transparent',
                    color: plan.featured ? '#fff' : LP.primary,
                    border: plan.featured ? 'none' : `1px solid ${LP.primary}`,
                  }}>
                  {preorder ? 'Pre-order' : 'Pilih'} {plan.nama} →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const LANGKAH_PEMBELIAN = [
  { judul: 'Pilih Plan Indikator', desc: 'Pilih paket Bulanan, Tahunan, atau Lifetime sesuai kebutuhanmu.' },
  { judul: 'Isi Data Diri & Bayar', desc: 'Isi nama, email, nomor WhatsApp, lalu pilih metode pembayaran dan transfer sesuai nominal yang tertera.' },
  { judul: 'Konfirmasi via WhatsApp', desc: 'Setelah submit, kirim bukti transfer ke admin lewat tombol konfirmasi WhatsApp yang muncul.' },
  { judul: 'Verifikasi Admin', desc: 'Admin memeriksa dan memverifikasi pembayaranmu.' },
  { judul: 'Terima Link Indikator', desc: 'Admin mengirim link indikator ke WhatsApp kamu setelah pembayaran terverifikasi.' },
  { judul: 'Pasang & Mulai Pakai', desc: 'Buka link di TradingView, lalu tambahkan indikator ke chart XAUUSD M5.' },
];

function LangkahPembelian({ preorder }: { preorder: boolean }) {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  return (
    <section style={{ background: LP.surface, borderTop: `1px solid ${LP.border}`, padding: isMobile ? '48px 20px' : '72px 40px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 32 }}>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, letterSpacing: 0.8 }}>// CARA PEMBELIAN</div>
          <h3 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, margin: '10px 0 0', color: LP.text }}>Gampang, Cuma 6 Langkah</h3>
        </div>
        <div>
          {LANGKAH_PEMBELIAN.map((step, i) => (
            <div key={step.judul} style={{ display: 'flex', gap: 16, position: 'relative' as const, paddingBottom: i < LANGKAH_PEMBELIAN.length - 1 ? 24 : 0 }}>
              {i < LANGKAH_PEMBELIAN.length - 1 && (
                <div style={{ position: 'absolute', left: 15, top: 34, bottom: 0, width: 2, background: LP.border }} />
              )}
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: LP.primaryTint, color: LP.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0, zIndex: 1, fontFamily: LP.mono }}>
                {i + 1}
              </div>
              <div style={{ paddingBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: LP.text, marginBottom: 4 }}>{step.judul}</div>
                <div style={{ color: LP.muted, fontSize: 13, lineHeight: 1.6 }}>
                  {step.desc}
                  {i === 4 && preorder && (
                    <>{' '}<b style={{ color: LP.text }}>Pre-order: link v4.2 dikirim sekarang, link v5 dikirim saat rilis.</b></>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RiwayatDataCard() {
  const { config } = useBacktestConfig();
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  if (!config) return null;

  return (
    <section style={{ background: LP.bg, padding: isMobile ? '0 20px 48px' : '0 40px 72px' }}>
      <div style={{
        maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' as const : 'row' as const,
        alignItems: isMobile ? 'flex-start' : 'center', gap: 18, borderRadius: LP.radius, padding: '20px 22px',
        background: 'linear-gradient(90deg,#0B1220,#13203a)', color: '#fff', boxShadow: LP.shadowMd,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(74,222,128,.15)', color: '#4ade80', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Riwayat Data Jelas</div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, lineHeight: 1.5 }}>
            Setiap parameter dikunci dari riset backtest XAUUSD M5 — lihat sendiri daftar trade, win rate, dan hasilnya.
          </div>
        </div>
        <a href="/backtest-indikator" style={{
          background: '#4ade80', color: '#052e16', fontWeight: 700, fontSize: 14, padding: '12px 18px', borderRadius: 10,
          textDecoration: 'none', whiteSpace: 'nowrap' as const, alignSelf: isMobile ? 'stretch' : 'auto', textAlign: 'center' as const,
        }}>
          Lihat Data Backtest →
        </a>
      </div>
    </section>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return isMobile;
}

const ORANYE = '#d97706';

function StripPemilikLama({ tanggalRilis }: { tanggalRilis: Date | null }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ padding: isMobile ? '20px 20px 0' : '24px 40px 0' }}>
      <div style={{
        maxWidth: 900, margin: '0 auto', padding: '14px 18px', borderRadius: 14, fontSize: 14, lineHeight: 1.5, color: LP.text,
        background: 'linear-gradient(90deg,rgba(22,163,74,.10),rgba(22,163,74,.04))', border: '1px solid rgba(22,163,74,.35)',
      }}>
        ✅ <b style={{ color: 'var(--lp-primary-hover)' }}>Sudah pakai v4.2 &amp; masih aktif?</b> Kamu otomatis dapat v5 <b style={{ color: 'var(--lp-primary-hover)' }}>gratis</b> saat rilis {fmtTanggalRilis(tanggalRilis)} — tidak perlu beli lagi.
      </div>
    </div>
  );
}

function HitungMundur({ tanggalRilis }: { tanggalRilis: Date | null }) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const sisa = tanggalRilis ? sisaWaktu(tanggalRilis, now) : null;
  if (!sisa) {
    return <div style={{ marginTop: 18, fontFamily: LP.mono, fontSize: 13, fontWeight: 700, color: ORANYE }}>Segera rilis</div>;
  }
  const kotak: [number, string][] = [[sisa.hari, 'HARI'], [sisa.jam, 'JAM'], [sisa.menit, 'MENIT'], [sisa.detik, 'DETIK']];
  return (
    <>
      <div style={{ display: 'inline-flex', gap: 8, marginTop: 18 }}>
        {kotak.map(([v, l]) => (
          <div key={l} style={{ background: LP.text, color: '#fff', borderRadius: 10, padding: '8px 10px', minWidth: 58, textAlign: 'center' as const }}>
            <b data-cd={l} style={{ display: 'block', fontSize: 20, letterSpacing: -0.5 }}>{String(v).padStart(2, '0')}</b>
            <span style={{ fontFamily: LP.mono, fontSize: 9, opacity: 0.7 }}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 8 }}>
        Harga early-bird berakhir saat rilis · {fmtTanggalRilis(tanggalRilis)}
      </div>
    </>
  );
}

function HeroV5({ preorder, tanggalRilis }: { preorder: boolean; tanggalRilis: Date | null }) {
  const isMobile = useIsMobile();
  return (
    <section style={{ textAlign: 'center' as const, padding: isMobile ? '36px 20px 8px' : '48px 40px 12px' }}>
      <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 11, letterSpacing: 1 }}>
        // SMC BY MENOLAKRUGI · VERSI 5{preorder && <> · <span style={{ color: ORANYE }}>COMING SOON</span></>}
      </div>
      <h1 style={{ fontSize: isMobile ? 26 : 40, letterSpacing: -1, lineHeight: 1.15, margin: '12px auto 0', fontWeight: 800, color: LP.text, maxWidth: 760 }}>
        Bukan cuma baca struktur — langsung tahu kapan entry.
      </h1>
      {preorder && (
        <>
          <p style={{ color: LP.muted, fontSize: isMobile ? 14 : 16, lineHeight: 1.6, margin: '12px auto 0', maxWidth: 560 }}>
            Pre-order sekarang dengan harga early-bird. <b style={{ color: LP.text }}>Langsung dapat v4.2 hari ini</b>, lalu otomatis upgrade ke v5 saat rilis.
          </p>
          <HitungMundur tanggalRilis={tanggalRilis} />
        </>
      )}
    </section>
  );
}

const IKON = {
  setup: <path d="M3 17l6-6 4 4 8-8M14 7h7v7" />,
  label: <><path d="M20 12l-8 8-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  lot: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h8" /></>,
  alarm: <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></>,
};
const FITUR_V5: { ikon: keyof typeof IKON; judul: string; desc: React.ReactNode }[] = [
  { ikon: 'setup', judul: '3 Setup Otomatis', desc: 'Follow Trend, Counter Trend, dan SCOB POI — entry, SL & TP langsung tergambar di chart.' },
  { ikon: 'label', judul: 'Label Order Siap Pasang', desc: <><span style={{ fontFamily: LP.mono, fontSize: 11, color: LP.text }}>📌 SELL LIMIT · SL · TP 3R</span> lengkap jam WITA, otomatis ✅ Terisi / ✖ Batal.</> },
  { ikon: 'lot', judul: 'Kalkulator Lot Otomatis', desc: 'Isi saldo, leverage & risk % — lot muncul di label dan alarm, ada peringatan margin.' },
  { ikon: 'alarm', judul: 'Alarm Lengkap ke HP', desc: 'Saat limit dipasang, terisi, digeser, atau dibatalkan — lengkap dengan alasannya.' },
];

function FiturV5() {
  const isMobile = useIsMobile();
  return (
    <section style={{ padding: isMobile ? '24px 20px 20px' : '28px 40px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {FITUR_V5.map((f) => (
          <div key={f.judul} style={{ border: `1px solid ${LP.border}`, borderRadius: 14, padding: 18, background: LP.surface, boxShadow: LP.shadowSm }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: LP.primaryTint, color: LP.primary, display: 'grid', placeItems: 'center', marginBottom: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{IKON[f.ikon]}</svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: LP.text, marginBottom: 6 }}>{f.judul}</div>
            <div style={{ fontSize: 12, color: LP.muted, lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 900, margin: '12px auto 0', fontFamily: LP.mono, fontSize: 11, color: LP.muted, textAlign: 'center' as const }}>
        Dioptimalkan untuk XAUUSD timeframe M5.
      </div>
    </section>
  );
}

// Perbandingan indikator lama vs v5 — tampil di antara blok v5 dan blok v4.2.
const PERBANDINGAN: { fitur: string; lama: string | boolean; baru: string | boolean }[] = [
  { fitur: 'Pair & timeframe', lama: 'Bebas pair & timeframe', baru: 'Khusus XAUUSD M5' },
  { fitur: 'Cara pakai', lama: 'Manual — top-down analysis sendiri, lalu tentukan entry', baru: 'Sederhana — tinggal ikuti label entry yang muncul' },
  { fitur: 'Market structure (VH/VL, BOS/CHoCH) + Fibonacci', lama: true, baru: true },
  { fitur: 'Internal structure (IS01 / IS02)', lama: true, baru: false },
  { fitur: 'POI Order Block & FVG di chart', lama: true, baru: false },
  { fitur: 'Zona entry Fibonacci + kotak TP/SL', lama: true, baru: true },
  { fitur: '3 setup otomatis (Follow Trend, Counter Trend, SCOB POI)', lama: false, baru: true },
  { fitur: 'Label order siap pasang (LIMIT · SL · TP, jam WITA)', lama: false, baru: true },
  { fitur: 'Kalkulator lot otomatis', lama: false, baru: true },
  { fitur: 'Alarm ke HP (limit dipasang, terisi, digeser, batal)', lama: false, baru: true },
  { fitur: 'Data backtest bisa dilihat', lama: false, baru: true },
  { fitur: 'Cocok untuk', lama: 'Yang mau belajar membaca SMC & analisa sendiri', baru: 'Yang mau eksekusi disiplin tanpa analisa panjang' },
];

function TabelPerbandingan({ namaLama, namaBaru }: { namaLama: string; namaBaru: string }) {
  const isMobile = useIsMobile();
  const sel = (v: string | boolean, baru: boolean) =>
    typeof v === 'string'
      ? <span style={{ color: baru ? LP.text : LP.muted, fontWeight: baru ? 600 : 400 }}>{v}</span>
      : v
        ? <span style={{ color: LP.primary, fontWeight: 800, fontSize: 16 }}>✓</span>
        : <span style={{ color: LP.border, fontWeight: 700 }}>—</span>;
  const kolom = isMobile ? 'minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr)';
  return (
    <section style={{ background: LP.bg, padding: isMobile ? '8px 20px 40px' : '8px 40px 56px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 20 }}>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, letterSpacing: 0.8 }}>// PERBANDINGAN</div>
          <h2 style={{ fontSize: isMobile ? 22 : 30, letterSpacing: -0.8, fontWeight: 800, color: LP.text, margin: '10px 0 0' }}>Pilih yang Cocok Buatmu</h2>
        </div>
        <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: LP.radius, overflow: 'hidden', boxShadow: LP.shadowSm, fontSize: isMobile ? 12 : 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: kolom, background: LP.bg, borderBottom: `1px solid ${LP.border}` }}>
            <div style={{ padding: isMobile ? '12px 10px' : '14px 18px' }} />
            <div style={{ padding: isMobile ? '12px 10px' : '14px 18px', fontWeight: 700, color: LP.muted, textAlign: 'center' as const }}>{namaLama}</div>
            <div style={{ padding: isMobile ? '12px 10px' : '14px 18px', fontWeight: 800, color: LP.primary, textAlign: 'center' as const, background: LP.primaryTint }}>{namaBaru}</div>
          </div>
          {PERBANDINGAN.map((r, i) => (
            <div key={r.fitur} style={{ display: 'grid', gridTemplateColumns: kolom, borderTop: i ? `1px solid ${LP.border}` : 'none', alignItems: 'stretch' }}>
              <div style={{ padding: isMobile ? '11px 10px' : '13px 18px', color: LP.text, fontWeight: 600, lineHeight: 1.4 }}>{r.fitur}</div>
              <div style={{ padding: isMobile ? '11px 10px' : '13px 18px', textAlign: 'center' as const, lineHeight: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{sel(r.lama, false)}</div>
              <div style={{ padding: isMobile ? '11px 10px' : '13px 18px', textAlign: 'center' as const, lineHeight: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(22,163,74,.05)' }}>{sel(r.baru, true)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** "PROMO -50% · S/D 1 DESEMBER 2026" selama diskon produk berbatas waktu masih berlaku. */
function labelPromo(p: ProdukJual): string | undefined {
  const akhir = akhirDiskon(p);
  const maks = Math.max(0, ...paketDariProduk(p).map((x) => x.diskon));
  if (!akhir || maks <= 0) return undefined;
  return `PROMO -${maks}% · S/D ${fmtTanggalRilis(new Date(p.diskon_hingga + 'T00:00:00+07:00')).toUpperCase()}`;
}

/** 'SMC by MenolakRugi v4.2' → 'v4.2'; tanpa nomor versi → nama apa adanya. */
function versiDari(nama: string): string {
  return nama.match(/v\d+(\.\d+)*/i)?.[0] ?? nama;
}

/** Produk dengan tanggal_rilis terbaru = produk terbaru (dapat badge TERBARU). */
function terbaruDari(produk: ProdukJual[]): string | null {
  const ber = produk.filter((p) => p.tanggal_rilis).sort((a, b) => (b.tanggal_rilis! > a.tanggal_rilis! ? 1 : -1));
  return ber[0]?.id ?? null;
}

export default function PricingIndikatorPage() {
  const { preview } = useLandingPreview();
  const { preorder, tanggalRilis } = useProdukIndikator();
  const { produk: dijual } = useProdukDijual();
  const terbaru = terbaruDari(dijual);
  const blokProduk = dijual.filter((p) => paketDariProduk(p).length > 0);

  return (
    <div className="mr-light-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ borderBottom: `1px solid ${LP.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: LP.text, fontWeight: 800, letterSpacing: 0.3, fontSize: 14 }}>
          <img src="/logo.png" alt="MR" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          MENOLAK RUGI
        </a>
      </div>
      {preview ? (
        preorder ? (
          <>
            <StripPemilikLama tanggalRilis={tanggalRilis} />
            <HeroV5 preorder tanggalRilis={tanggalRilis} />
            <FiturV5 />
            <RiwayatDataCard />
            <ProductPreview paket={paketDariConfig(preview)} preorder />
            <LangkahPembelian preorder />
          </>
        ) : (
          blokProduk.length > 0 ? (
          <>
            <HeroV5 preorder={false} tanggalRilis={null} />
            {blokProduk.map((p) => (
              <React.Fragment key={p.id}>
                <ProductPreview paket={paketDariProduk(p)} preorder={false} produkId={p.id} judul={p.nama}
                  badge={p.id === terbaru ? 'TERBARU' : undefined} promo={labelPromo(p)} intro={false} />
                {(p.id === terbaru || (!terbaru && p === blokProduk[0])) && <>
                  <FiturV5 />
                  <RiwayatDataCard />
                  {blokProduk.length > 1 && (
                    <TabelPerbandingan namaLama={versiDari(blokProduk.find((x) => x.id !== p.id)!.nama)} namaBaru={versiDari(p.nama)} />
                  )}
                </>}
              </React.Fragment>
            ))}
            <LangkahPembelian preorder={false} />
          </>
          ) : (
          <>
            <ProductPreview paket={paketDariConfig(preview)} preorder={false} />
            <FiturV5 />
            <RiwayatDataCard />
            <LangkahPembelian preorder={false} />
          </>
          )
        )
      ) : (
        <div style={{ padding: 60, textAlign: 'center' as const, color: LP.muted, fontFamily: LP.mono, fontSize: 13 }}>Memuat...</div>
      )}
    </div>
  );
}
