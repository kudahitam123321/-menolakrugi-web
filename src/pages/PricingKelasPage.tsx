// pages/PricingKelasPage.tsx — Halaman pricing kelas membership + kurikulum
// URL: /pricing-kelas (anchor #kurikulum untuk section kurikulum)

import React from 'react';
import { Check } from 'lucide-react';
import { usePricing } from '../hooks';

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

// ── BASIC CLASS ───────────────────────────────────────────────────────────
const BASIC_MODULES = [
  {
    mod: 'B1', title: 'Valid Market Structure',
    items: ['Valid Pullback', 'Valid High & Low', 'BOS (Break of Structure)', 'CHoCH (Change of Character)', 'Inducement Dasar'],
  },
  {
    mod: 'B2', title: 'Liquidity',
    items: ['Imbalance', 'EQH & EQL', 'Liquidity Pool', 'Cara Market Mengambil Likuiditas'],
  },
  {
    mod: 'B3', title: 'Point of Interest (POI)',
    items: ['Order Flow', 'Order Block', 'High Probability POI', 'Cara Memilih POI Valid'],
  },
  {
    mod: 'B4', title: 'Simple SMC',
    items: ['Penyatuan Structure + Liquidity + POI', 'Simple Entry Model', 'Basic Market Narrative'],
  },
  {
    mod: 'BONUS', title: 'Bonus Basic Tips',
    items: ['Tips membaca market lebih sederhana', 'Cara menghindari entry FOMO', 'Kesalahan umum trader SMC', 'Cara membangun bias harian'],
    bonus: true,
  },
];

// ── ADVANCED CLASS ─────────────────────────────────────────────────────────
const ADVANCED_MODULES = [
  {
    mod: 'A1', title: 'Internal Structure',
    items: ['Internal BOS', 'Internal CHoCH', 'Internal Liquidity', 'Refinement Structure'],
  },
  {
    mod: 'A2', title: 'Top Down Analysis',
    items: ['HTF to LTF Narrative', 'HTF Bias', 'Multi Timeframe Mapping'],
  },
  {
    mod: 'A3', title: 'Konfirmasi Entry',
    items: ['SCOB', 'Mchoch', 'Flip'],
  },
  {
    mod: 'A4', title: 'IFC',
    items: ['Institutional Funding Candle'],
  },
  {
    mod: 'A5', title: 'Liquidity Optional',
    items: ['PDH-PDL', 'Session'],
  },
  {
    mod: 'A6', title: 'Trading Plan',
    items: ['Risk Management', 'Position Management', 'Session Planning', 'Consistency Framework'],
  },
  {
    mod: 'A7', title: 'Simple Trading Plan',
    items: ['Template Trading Plan', 'Daily Execution Workflow', 'Journaling & Review'],
  },
  {
    mod: 'A8', title: 'Prop Firm Preparation',
    items: ['Cara Lolos Challenge', 'Risk Control untuk Propfirm', 'Konsistensi Target Harian', 'Rules & Psychology'],
  },
  {
    mod: 'A9', title: 'Advanced Tips & Deep Discussion',
    items: ['Case Study', 'Real Market Breakdown', 'Advanced Narrative', 'Psychology & Consistency'],
  },
];

function useInView(threshold = 0.15) {
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);
  const ref = React.useCallback((el: HTMLDivElement | null) => setNode(el), []);
  React.useEffect(() => {
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold, rootMargin: '0px 0px 300px 0px' });
    obs.observe(node);
    return () => obs.disconnect();
  }, [node, threshold]);
  return { ref, inView };
}

function useFadeUp(delay = 0) {
  const { ref, inView } = useInView(0.12);
  const animStyle: React.CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  };
  return { ref, animStyle };
}

function Curriculum() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);
  const [activeBasic, setActiveBasic] = React.useState<number|null>(null);
  const [activeAdv, setActiveAdv]     = React.useState<number|null>(null);
  const { ref: refHdr, animStyle: hdrStyle } = useFadeUp();

  function ModCard({ mod, idx, isAdv }: { mod: any; idx: number; isAdv?: boolean }) {
    const isOpen = isAdv ? activeAdv === idx : activeBasic === idx;
    const toggle = () => isAdv ? setActiveAdv(isOpen ? null : idx) : setActiveBasic(isOpen ? null : idx);
    const isBonusCard = mod.bonus;
    const accent = isBonusCard ? '#7c3aed' : LP.primary;
    return (
      <div style={{ borderBottom: `1px solid ${LP.border}`, overflow: 'hidden' }}>
        <button onClick={toggle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: isOpen ? LP.primaryTint : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as const, transition: 'background .2s' }}>
          <span style={{ fontFamily: LP.mono, fontSize: 10, fontWeight: 700, color: accent, background: `${accent}14`, padding: '2px 8px', flexShrink: 0, minWidth: 52, textAlign: 'center' as const, borderRadius: 4 }}>
            {mod.mod}
          </span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: isOpen ? accent : LP.text }}>
            {mod.title}
          </span>
        </button>
        {isOpen && (
          <div style={{ padding: '4px 20px 16px 60px', background: LP.bg }}>
            {mod.items.map((item: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', fontSize: 13, color: LP.muted }}>
                <span style={{ color: accent, flexShrink: 0, marginTop: 1 }}>▸</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section id="kurikulum" style={{ background: LP.surface, borderBottom: `1px solid ${LP.border}` }}>
      <div ref={refHdr} style={{ ...hdrStyle, padding: isMobile ? '40px 20px 24px' : '56px 40px 32px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, letterSpacing: 0.8, marginBottom: 8 }}>// KURIKULUM</div>
        <h2 style={{ fontSize: isMobile ? 24 : 40, fontWeight: 800, margin: 0, letterSpacing: -1, color: LP.text }}>Apa yang kamu pelajari</h2>
        <p style={{ color: LP.muted, fontSize: 15, marginTop: 10, maxWidth: 560 }}>
          Dua jalur belajar: fondasi yang solid di Basic, eksekusi yang tajam di Advanced.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', maxWidth: 1200, margin: '0 auto', border: `1px solid ${LP.border}`, borderBottom: 'none' }}>
        <div style={{ borderRight: isMobile ? 'none' : `1px solid ${LP.border}`, borderBottom: isMobile ? `1px solid ${LP.border}` : 'none' }}>
          <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${LP.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: LP.primary, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.primary, letterSpacing: 1, fontWeight: 700 }}>BASIC CLASS</div>
              <div style={{ fontSize: 13, color: LP.muted, marginTop: 2 }}>Smart Money Concept Foundation</div>
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>{BASIC_MODULES.length} modul</span>
          </div>
          {BASIC_MODULES.map((mod, i) => <ModCard key={i} mod={mod} idx={i} isAdv={false} />)}
        </div>

        <div>
          <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${LP.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: LP.mono, fontSize: 10, color: '#7c3aed', letterSpacing: 1, fontWeight: 700 }}>ADVANCED CLASS</div>
              <div style={{ fontSize: 13, color: LP.muted, marginTop: 2 }}>Market Narrative & Execution</div>
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>{ADVANCED_MODULES.length} modul</span>
          </div>
          {ADVANCED_MODULES.map((mod, i) => <ModCard key={i} mod={mod} idx={i} isAdv={true} />)}
        </div>
      </div>
    </section>
  );
}

const FEATURE_ROWS: { label: string; included: Record<string, boolean> }[] = [
  { label: 'Materi SMC Basic Modul', included: { trial: true, bronze: true, gold: true, platinum: true } },
  { label: 'Private Discord', included: { trial: true, bronze: true, gold: true, platinum: true } },
  { label: 'Mentor Outlook', included: { trial: true, bronze: true, gold: true, platinum: true } },
  { label: 'Live Diskusi Via Discord', included: { trial: true, bronze: true, gold: true, platinum: true } },
  { label: 'Materi SMC Advanced Modul', included: { trial: false, bronze: false, gold: true, platinum: true } },
  { label: 'Koreksi Jurnal Trading', included: { trial: false, bronze: false, gold: true, platinum: true } },
  { label: 'Claim 1 on 1 Live dengan Mentor (Seminggu Sekali)', included: { trial: false, bronze: false, gold: true, platinum: true } },
  { label: 'Claim 1 on 1 Live Lebih dari Seminggu Sekali', included: { trial: false, bronze: false, gold: false, platinum: true } },
  { label: 'Gratis Akses Indikator SMC 3 Bulan', included: { trial: false, bronze: false, gold: false, platinum: true } },
];

function TierPricing() {
  const { tiers, loading } = usePricing();
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);
  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' as const, color: LP.muted, fontFamily: LP.mono, fontSize: 13 }}>Memuat...</div>
    );
  }

  return (
    <section style={{ background: LP.bg, padding: isMobile ? '48px 20px 32px' : '72px 40px 48px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 32 }}>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, letterSpacing: 0.8 }}>// PILIH KELAS</div>
          <h1 style={{ fontSize: isMobile ? 26 : 42, letterSpacing: -1, lineHeight: 1.15, margin: '14px 0 12px', fontWeight: 800, color: LP.text }}>
            Kelas mana yang cocok buat kamu?
          </h1>
          <p style={{ color: LP.muted, fontSize: isMobile ? 14 : 16, lineHeight: 1.6, margin: '0 auto', maxWidth: 560 }}>
            Mulai dari Trial buat coba dulu, atau langsung ambil Gold/Platinum buat mentoring intensif.
          </p>
        </div>

        {isMobile ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {tiers.map(tier => (
              <div key={tier.id} style={{
                borderRadius: LP.radius, padding: '24px 20px',
                background: tier.is_featured ? LP.text : LP.surface,
                border: tier.is_featured ? 'none' : `1px solid ${LP.border}`,
                boxShadow: tier.is_featured ? LP.shadowMd : LP.shadowSm,
                position: 'relative' as const,
              }}>
                {tier.badge && (
                  <div style={{ display: 'inline-block', background: LP.primary, color: '#fff', padding: '4px 12px', fontSize: 10, letterSpacing: 0.6, fontWeight: 700, borderRadius: 20, marginBottom: 12 }}>
                    {tier.is_featured ? 'POPULER' : tier.badge.toUpperCase()}
                  </div>
                )}
                <div style={{ fontFamily: LP.mono, fontSize: 11, letterSpacing: 1, fontWeight: 700, color: tier.is_featured ? 'rgba(255,255,255,0.8)' : LP.muted }}>{tier.tag.toUpperCase()}</div>
                <div style={{ fontWeight: 700, fontSize: 18, margin: '4px 0 12px', color: tier.is_featured ? '#fff' : LP.text }}>{tier.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: LP.mono, fontSize: 14, color: tier.is_featured ? '#fff' : LP.primary }}>Rp</span>
                  <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: tier.is_featured ? '#fff' : LP.text }}>{fmt(tier.price)}</span>
                </div>
                <div style={{ fontFamily: LP.mono, fontSize: 11, marginBottom: 16, color: tier.is_featured ? 'rgba(255,255,255,0.7)' : LP.muted }}>{tier.period}</div>
                <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
                  {FEATURE_ROWS.map(row => (
                    <div key={row.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: tier.is_featured ? 'rgba(255,255,255,0.85)' : LP.muted }}>
                      {row.included[tier.id] ? (
                        <Check size={14} color={LP.primary} style={{ flexShrink: 0, marginTop: 1 }} />
                      ) : (
                        <span style={{ flexShrink: 0, width: 14, textAlign: 'center' as const, color: tier.is_featured ? 'rgba(255,255,255,0.35)' : LP.border, fontFamily: LP.mono }}>–</span>
                      )}
                      <span>{row.label}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { window.location.href = `/signup?tier=${tier.id}`; }}
                  style={{
                    fontFamily: LP.sans, padding: '13px 0', fontSize: 13, fontWeight: 700, width: '100%', cursor: 'pointer', borderRadius: 8,
                    background: tier.is_featured ? LP.primary : 'transparent',
                    color: tier.is_featured ? '#fff' : LP.primary,
                    border: tier.is_featured ? 'none' : `1px solid ${LP.primary}`,
                  }}>
                  Pilih {tier.tag} →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 12px' }}></th>
                {tiers.map(tier => (
                  <th key={tier.id} style={{
                    padding: '24px 16px', textAlign: 'center' as const, verticalAlign: 'top' as const,
                    background: tier.is_featured ? LP.text : 'transparent',
                    borderRadius: tier.is_featured ? `${LP.radius}px ${LP.radius}px 0 0` : 0,
                  }}>
                    {tier.badge && (
                      <div style={{ display: 'inline-block', background: LP.primary, color: '#fff', padding: '4px 12px', fontSize: 10, letterSpacing: 0.6, fontWeight: 700, borderRadius: 20, marginBottom: 10 }}>
                        {tier.is_featured ? 'POPULER' : tier.badge.toUpperCase()}
                      </div>
                    )}
                    <div style={{ fontFamily: LP.mono, fontSize: 11, letterSpacing: 1, fontWeight: 700, color: tier.is_featured ? '#fff' : LP.muted }}>{tier.tag.toUpperCase()}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginTop: 10 }}>
                      <span style={{ fontFamily: LP.mono, fontSize: 16, color: tier.is_featured ? '#fff' : LP.primary }}>Rp</span>
                      <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color: tier.is_featured ? '#fff' : LP.text }}>{fmt(tier.price)}</span>
                    </div>
                    <div style={{ fontFamily: LP.mono, fontSize: 11, marginTop: 4, color: tier.is_featured ? 'rgba(255,255,255,0.7)' : LP.muted }}>{tier.period}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map(row => (
                <tr key={row.label}>
                  <td style={{ padding: '14px 12px', fontWeight: 600, fontSize: 13, color: LP.text, borderBottom: `1px solid ${LP.border}` }}>{row.label}</td>
                  {tiers.map(tier => (
                    <td key={tier.id} style={{
                      padding: '14px 16px', textAlign: 'center' as const,
                      background: tier.is_featured ? LP.text : 'transparent',
                      borderBottom: tier.is_featured ? '1px solid rgba(255,255,255,0.12)' : `1px solid ${LP.border}`,
                    }}>
                      {row.included[tier.id] ? (
                        <Check size={16} color={LP.primary} style={{ margin: '0 auto', display: 'block' }} />
                      ) : (
                        <span style={{ color: tier.is_featured ? 'rgba(255,255,255,0.35)' : LP.border, fontFamily: LP.mono }}>–</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td style={{ padding: '20px 12px' }}></td>
                {tiers.map(tier => (
                  <td key={tier.id} style={{
                    padding: '20px 16px', textAlign: 'center' as const,
                    background: tier.is_featured ? LP.text : 'transparent',
                    borderRadius: tier.is_featured ? `0 0 ${LP.radius}px ${LP.radius}px` : 0,
                  }}>
                    <button
                      onClick={() => { window.location.href = `/signup?tier=${tier.id}`; }}
                      style={{
                        fontFamily: LP.sans, padding: '12px 20px', fontSize: 13, fontWeight: 700, width: '100%', cursor: 'pointer', borderRadius: 8,
                        background: tier.is_featured ? LP.primary : 'transparent',
                        color: tier.is_featured ? '#fff' : LP.primary,
                        border: tier.is_featured ? 'none' : `1px solid ${LP.primary}`,
                      }}>
                      Pilih {tier.tag} →
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default function PricingKelasPage() {
  return (
    <div className="mr-light-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ borderBottom: `1px solid ${LP.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: LP.text, fontWeight: 800, letterSpacing: 0.3, fontSize: 14 }}>
          <img src="/logo.png" alt="MR" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          MENOLAK RUGI
        </a>
      </div>
      <TierPricing />
      <Curriculum />
    </div>
  );
}
