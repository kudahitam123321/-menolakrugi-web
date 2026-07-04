// pages/LandingPage.tsx — Landing Page Menolak Rugi (Direction A · Terminal)
// Data: member count + funded count + testimonials dari Supabase.
// Pricing dari DB (dengan fallback hardcode jika tabel belum ada).

import React, { useState } from 'react';
import { Menu, X, Star, ChevronDown, MessageCircle, Send, Music2, Youtube, Phone } from 'lucide-react';

import { MR } from '../lib/theme';
import { MRLogo, CandleChart, CANDLE_GRID_STYLE } from '../components/mr';
import { useLandingStats, useApprovedTestimonials, usePricing, useLandingPreview } from '../hooks';
import type { LandingPreviewConfig } from '../hooks';
import type { PricingTier, Testimonial } from '../types/mr.types';
import { supabase } from '../lib/supabase';

// ─── Landing v2 design tokens ──────────────────────────────────────────────────

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

// ─── Static data ──────────────────────────────────────────────────────────────

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

const CURRICULUM = [...BASIC_MODULES, ...ADVANCED_MODULES];

const FAQ = [
  { q: 'Apa itu SMC dan kenapa beda dari indikator biasa?', a: 'Smart Money Concept membaca jejak likuiditas dan order pelaku institusi — bukan lagi soal indikator lagging. Kamu belajar struktur market, BOS, order block, dan inducement supaya entry punya konteks, bukan tebak-tebakan.' },
  { q: 'Saya pemula total, bisa ikut?', a: 'Bisa. Mulai dari Trial atau Bronze: materi fondasi (struktur, candle, baca chart) disusun untuk yang belum pernah trading sebelumnya. Begitu nyaman, upgrade ke Gold buat masuk mentoring.' },
  { q: 'Berapa lama sampai bisa konsisten profit?', a: 'Tidak ada janji minggu-1 langsung profit. Rata-rata member butuh 2–6 bulan untuk konsisten — tergantung disiplin journaling dan jam terbang chart. Sistem kami fokus mengganti kebiasaan, bukan jual mimpi.' },
  { q: 'Apakah ada garansi uang kembali?', a: 'Trial bisa berhenti kapan saja. Untuk Bronze ke atas tidak ada refund, karena akses materi langsung terbuka selamanya — tapi kamu bisa upgrade ke tier lebih tinggi dengan kredit harga yang sudah dibayar.' },
  { q: 'Mentor-nya siapa, dan latar belakangnya apa?', a: 'Mentor utama adalah trader SMC dengan funded account aktif di beberapa prop firm. Setiap minggu mentor share setup live, bukan cuma teori — dan resultnya bisa kamu lihat di channel Mentor Result.' },
  { q: 'Saya kerja kantoran, kapan sesi live-nya?', a: 'Sesi live disusun di sore/malam WIB (Senin & Kamis 20.00–22.00) dan ada rekaman semua sesi yang bisa diakses kapanpun.' },
];



// ─── Sub-components ───────────────────────────────────────────────────────────

function NavBar() {
  const [active, setActive]       = React.useState('KELAS');
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [menuOpen, setMenuOpen]   = React.useState(false);
  const [scrolled, setScrolled]   = React.useState(false);

  React.useEffect(() => {
    const member = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member');
    if (member) { try { JSON.parse(member); setIsLoggedIn(true); } catch {} }
  }, []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NAV_ITEMS = [
    { l: 'Kelas',       key: 'KELAS',       href: '#kelas' },
    { l: 'Kurikulum',   key: 'KURIKULUM',   href: '#kurikulum' },
    { l: 'Komunitas',   key: 'KOMUNITAS',   href: '/komunitas' },
    { l: 'Partnership', key: 'PARTNERSHIP', href: '/partnership' },
    { l: 'Kalender',    key: 'KALENDER',    href: '/calendar' },
  ];

  return (
    <>
    <nav className='mr-nav-topbar' style={{
      background: scrolled ? 'rgba(255,255,255,0.85)' : LP.surface,
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${LP.border}`,
      transition: 'background 0.2s, box-shadow 0.2s',
      boxShadow: scrolled ? LP.shadowSm : 'none',
    }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, flexShrink: 0 }}>
          <img src="/logo.png" alt="MR" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontWeight: 800, letterSpacing: 0.3, fontSize: 14, color: LP.text }}>MENOLAK RUGI</span>
          <span style={{ color: LP.muted, fontSize: 9, marginTop: 2, fontFamily: LP.mono, letterSpacing: 1 }}>SMC EDUCATION</span>
        </div>
      </a>

      <div className='mr-nav-links' style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.key;
          return (
            <a key={item.key} href={item.href} onClick={() => setActive(item.key)}
              style={{ padding: '8px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
                color: isActive ? LP.primary : LP.muted, background: isActive ? LP.primaryTint : 'transparent', transition: 'all .15s' }}>
              {item.l}
            </a>
          );
        })}
      </div>

      <div className='mr-nav-links' style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {isLoggedIn ? (
          <button onClick={() => window.location.href = '/member'}
            style={{ fontFamily: LP.sans, fontSize: 13, fontWeight: 600, color: '#fff', padding: '9px 18px', border: 'none', background: LP.primary, cursor: 'pointer', borderRadius: 8 }}>
            Dashboard
          </button>
        ) : (
          <>
          <button onClick={() => window.location.href = '/login'}
            style={{ fontFamily: LP.sans, fontSize: 13, fontWeight: 500, color: LP.text, padding: '9px 16px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            Masuk
          </button>
          <button onClick={() => window.location.href = '/signup'}
            style={{ fontFamily: LP.sans, fontSize: 13, fontWeight: 600, color: '#fff', padding: '9px 18px', border: 'none', background: LP.primary, cursor: 'pointer', borderRadius: 8 }}>
            Mulai Sekarang
          </button>
          </>
        )}
      </div>

      <div className='mr-mobile-nav-right' style={{ display: 'none', alignItems: 'center', gap: 8 }}>
        <button onClick={() => window.location.href = isLoggedIn ? '/member' : '/signup'}
          style={{ fontFamily: LP.sans, fontSize: 13, fontWeight: 600, color: '#fff', padding: '9px 14px', border: 'none', background: LP.primary, cursor: 'pointer', borderRadius: 8, whiteSpace: 'nowrap' as const }}>
          {isLoggedIn ? 'Dashboard' : 'Mulai'}
        </button>
        <button onClick={() => setMenuOpen(o => !o)} aria-label="Buka menu"
          style={{ width: 38, height: 38, background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Menu size={18} color={LP.text} />
        </button>
      </div>
    </nav>

    {menuOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column' as const }}>
        <div style={{ flex: 1, background: 'rgba(15,23,42,0.4)' }} onClick={() => setMenuOpen(false)}/>
        <div style={{ background: LP.surface, borderTop: `1px solid ${LP.border}`, padding: '20px 24px 32px', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, letterSpacing: 1 }}>MENU</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Tutup menu" style={{ background: 'none', border: 'none', color: LP.muted, cursor: 'pointer', padding: 4, display: 'flex' }}>
              <X size={22} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 20 }}>
            {NAV_ITEMS.map(item => (
              <a key={item.key} href={item.href} onClick={() => setMenuOpen(false)}
                style={{ padding: '14px 16px', background: LP.bg, borderRadius: 10, textDecoration: 'none', color: LP.text, fontSize: 15, fontWeight: 600, border: `1px solid ${LP.border}` }}>
                {item.l}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {!isLoggedIn && (
              <button onClick={() => window.location.href = '/login'}
                style={{ width: '100%', fontFamily: LP.sans, fontSize: 14, fontWeight: 600, color: LP.text, padding: '14px', background: LP.bg, border: `1px solid ${LP.border}`, cursor: 'pointer', borderRadius: 10 }}>
                Masuk
              </button>
            )}
            <button onClick={() => window.location.href = isLoggedIn ? '/member' : '/signup'}
              style={{ width: '100%', fontFamily: LP.sans, fontSize: 14, fontWeight: 700, color: '#fff', padding: '14px', background: LP.primary, border: 'none', cursor: 'pointer', borderRadius: 10 }}>
              {isLoggedIn ? 'Buka Dashboard →' : 'Mulai Sekarang →'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}


function useInView(threshold = 0.15) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function useCounter(target: number, duration = 1400) {
  const [val, setVal] = React.useState(0);
  const started = React.useRef(false);
  React.useEffect(() => {
    if (!target || started.current) return;
    started.current = true;
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target]);
  return val;
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

function Hero() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);

  return (
    <section id="kelas" style={{ padding: isMobile ? '48px 20px 32px' : '72px 40px 56px', background: LP.bg }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr', gap: isMobile ? 32 : 48, alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <div>
          <div className='mr-anim-badge' style={{ fontFamily: LP.mono, display: 'inline-flex', gap: 8, alignItems: 'center', padding: '6px 12px', borderRadius: 20, border: `1px solid ${LP.border}`, background: LP.surface, color: LP.muted, fontSize: 11, letterSpacing: 0.6, marginBottom: 24 }}>
            <span className="mr-blink" style={{ color: LP.primary }}>●</span>
            LIVE · SMART MONEY CONCEPT EDUCATION
          </div>
          <h1 className='mr-hero-h1' style={{ fontSize: isMobile ? 34 : 60, lineHeight: 1.08, letterSpacing: -1.5, margin: '0 0 24px', fontWeight: 800, color: LP.text } as React.CSSProperties}>
            <span className='mr-anim-h1-1' style={{ display:'block' }}>Berhenti trading tanpa arah.</span>
            <span className='mr-anim-h1-2' style={{ display:'block', color: LP.primary }}>Mulai pahami market structure.</span>
          </h1>
          <p className='mr-anim-desc' style={{ fontSize: isMobile ? 15 : 18, color: LP.muted, lineHeight: 1.65, maxWidth: 520, margin: '0 0 32px' }}>
            Smart Money Concept yang kami gunakan langsung di funded account. Belajar membaca arah market lewat struktur yang jelas — dari trend, BOS, CHoCH, sampai validasi entry. Bukan sekadar entry karena feeling.
          </p>
          <div className='mr-anim-cta' style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            <button onClick={() => window.location.href = '/signup'}
              style={{ fontFamily: LP.sans, background: LP.primary, color: '#fff', fontWeight: 700, padding: '15px 28px', fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: LP.shadowMd }}>
              Pilih Kelas →
            </button>
            <button onClick={() => document.getElementById('kurikulum')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontFamily: LP.sans, border: `1px solid ${LP.border}`, padding: '15px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10, background: LP.surface, color: LP.text, cursor: 'pointer' }}>
              Lihat Kurikulum
            </button>
          </div>
        </div>

        {!isMobile && (
          <div className='mr-anim-desc' style={{ borderRadius: LP.radius, border: `1px solid ${LP.border}`, background: LP.surface, boxShadow: LP.shadowMd, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 6, padding: '12px 16px', borderBottom: `1px solid ${LP.border}` }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <div style={{ padding: 16 }}>
              <CandleChart width={480} height={280} density={22} showBOS />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatsBar({ memberCount, fundedCount, newThisMonth }: { memberCount: number; fundedCount: number; newThisMonth: number }) {
  const { ref, inView } = useInView(0.2);
  const cMember  = useCounter(inView ? memberCount : 0, 1600);
  const cFunded  = useCounter(inView ? fundedCount  : 0, 1200);
  const cMonthly = useCounter(inView ? newThisMonth : 0, 1000);
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);

  const STATS = [
    { k: 'MEMBER AKTIF', v: cMember.toString(),  d: `+${cMonthly} bulan ini`, positive: true },
    { k: 'FUNDED LULUS', v: cFunded.toString(),  d: '+5 bulan ini',           positive: true },
    { k: 'RATING KELAS', v: '4.9',               d: '/ 5.0',                  positive: null },
    { k: 'AKSES MATERI', v: '∞',                 d: 'Lifetime access',       positive: null },
  ];

  return (
    <section ref={ref} style={{ background: LP.bg, padding: isMobile ? '24px 20px 40px' : '0 40px 64px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 16, maxWidth: 1200, margin: '0 auto' }}>
        {STATS.map((s, i) => (
          <div key={i} className={`mr-anim-stat-${i}`} style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: LP.radiusSm, padding: isMobile ? '18px 16px' : '24px 22px', boxShadow: LP.shadowSm }}>
            <div style={{ fontWeight: 800, fontSize: isMobile ? 30 : 40, letterSpacing: -1.5, lineHeight: 1, marginBottom: 8, color: s.positive ? LP.primary : LP.text }}>{s.v}</div>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>{s.k}</div>
            <div style={{ fontFamily: LP.mono, fontSize: 10, color: s.positive === true ? LP.primary : LP.muted }}>{s.positive ? '▲ ' : ''}{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DiscordCTA() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);
  const { ref: refDc, animStyle: dcStyle } = useFadeUp();
  return (
    <section style={{ borderBottom: `1px solid ${MR.border}`, background: 'linear-gradient(180deg,var(--mr-bg) 0%,var(--mr-tint-green3) 50%,var(--mr-bg) 100%)', padding: isMobile ? '56px 20px' : '96px 40px', textAlign: 'center' as const, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse,rgba(22,163,74,0.06) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div ref={refDc} style={{ ...dcStyle, position: 'relative', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ fontFamily: MR.mono, color: MR.gold, fontSize: 11, letterSpacing: 1.5, marginBottom: 20 }}>// KOMUNITAS</div>
        <h2 style={{ fontSize: isMobile ? 32 : 56, fontWeight: 700, letterSpacing: isMobile ? -1 : -2, lineHeight: 1.05, margin: '0 0 20px' }}>
          Belajar lebih cepat<br/>
          <span style={{ color: MR.gold }}>di dalam komunitas.</span>
        </h2>
        <p style={{ color: MR.dim, fontSize: isMobile ? 14 : 16, lineHeight: 1.65, maxWidth: 460, margin: '0 auto 40px' }}>
          Bergabung dengan ribuan trader Indonesia. Share setup, diskusi market live, dan tumbuh bersama member yang serius setiap hari.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: 24 }}>
          <a href="https://discord.gg/d2Tpf6sGMr" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ fontFamily: MR.mono, background: '#5865F2', color: '#fff', fontWeight: 700, padding: isMobile ? '14px 22px' : '16px 30px', fontSize: 13, letterSpacing: 0.4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              GABUNG DISCORD
            </button>
          </a>
          <a href="https://t.me/+_azyX2h9oFhmNjNl" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ fontFamily: MR.mono, background: 'transparent', color: MR.text, fontWeight: 600, padding: isMobile ? '14px 22px' : '16px 30px', fontSize: 13, letterSpacing: 0.4, border: `1px solid ${MR.borderHot}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.367l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.983.192z"/></svg>
              TELEGRAM CHANNEL
            </button>
          </a>
        </div>
        <div style={{ fontFamily: MR.mono, fontSize: 11, color: MR.dimmer }}>
          Gratis · Aktif setiap hari · 500+ member online
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);
  const { ref, animStyle } = useFadeUp();
  return (
    <section ref={ref} className='mr-stats-row' style={{ ...animStyle, padding: '32px 40px', borderBottom: `1px solid ${MR.border}`, display: 'flex', justifyContent: 'space-between', gap: 32, alignItems: 'center' }}>
      <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.8, flexShrink: 0 }}>// MANIFESTO</div>
      <div style={{ fontSize: isMobile ? 16 : 22, lineHeight: 1.5, letterSpacing: -0.25, maxWidth: 1080 }}>
        Pasar bukan bergerak secara random. Setiap pergerakan membentuk <span style={{ color: MR.up }}>struktur</span>, dan struktur selalu memberi petunjuk arah berikutnya. Kami ngajarin cara membaca <em style={{ fontStyle: 'normal', color: MR.gold }}>market structure</em> dengan benar — memahami kapan trend berlanjut, kapan melemah, dan kapan market mulai <span style={{ color: MR.down }}>berubah arah</span>.
      </div>
    </section>
  );
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
    const accent = isAdv ? MR.gold : MR.up;
    const isBonusCard = mod.bonus;
    return (
      <div style={{ borderBottom: `1px solid ${MR.border}`, overflow: 'hidden' }}>
        <button onClick={toggle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: isOpen ? (isAdv ? 'var(--mr-tint-gold)' : 'var(--mr-tint-green3)') : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as const, transition: 'background .2s' }}>
          <span style={{ fontFamily: MR.mono, fontSize: 10, fontWeight: 700, color: isBonusCard ? '#a855f7' : accent, background: isBonusCard ? 'var(--mr-tint-purple)' : (isAdv ? 'var(--mr-tint-gold)' : 'var(--mr-tint-green3)'), border: `1px solid ${isBonusCard ? '#3a1a5a' : (isAdv ? 'var(--mr-tint-gold-b)' : 'var(--mr-tint-green-b)')}`, padding: '2px 8px', flexShrink: 0, minWidth: 52, textAlign: 'center' as const }}>
            {mod.mod}
          </span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: isOpen ? (isBonusCard ? '#c084fc' : accent) : MR.text }}>
            {mod.title}
          </span>
          <span style={{ fontFamily: MR.mono, fontSize: 12, color: MR.dim, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</span>
        </button>
        {isOpen && (
          <div style={{ padding: '4px 20px 14px 60px', background: isAdv ? 'var(--mr-tint-gold)' : 'var(--mr-tint-green)' }}>
            {mod.items.map((item: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', fontSize: 13, color: MR.dim }}>
                <span style={{ color: isBonusCard ? '#a855f7' : accent, flexShrink: 0, marginTop: 1 }}>▸</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section id="kurikulum" style={{ borderBottom: `1px solid ${MR.border}` }}>
      {/* Header */}
      <div ref={refHdr} style={{ ...hdrStyle, padding: '48px 40px 32px', borderBottom: `1px solid ${MR.border}` }}>
        <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.8, marginBottom: 8 }}>// KURIKULUM</div>
        <h2 style={{ fontSize: isMobile ? 22 : 36, fontWeight: 700, margin: 0, letterSpacing: isMobile ? -0.5 : -1 }}>
          Apa yang kamu pelajari
        </h2>
        <p style={{ color: MR.dim, fontSize: 15, marginTop: 10, maxWidth: 560 }}>
          Dua jalur belajar: fondasi yang solid di Basic, eksekusi yang tajam di Advanced.
        </p>
      </div>

      {/* Two-column layout */}
      <div className='mr-curriculum-grid' style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>

        {/* BASIC */}
        <div style={{ borderRight: `1px solid ${MR.border}` }}>
          <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${MR.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: MR.up, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: MR.mono, fontSize: 10, color: MR.up, letterSpacing: 1, fontWeight: 700 }}>BASIC CLASS</div>
              <div style={{ fontSize: 13, color: MR.dim, marginTop: 2 }}>Smart Money Concept Foundation</div>
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: MR.mono, fontSize: 11, color: MR.dim }}>{BASIC_MODULES.length} modul</span>
          </div>
          {BASIC_MODULES.map((mod, i) => (
            <ModCard key={i} mod={mod} idx={i} isAdv={false} />
          ))}
        </div>

        {/* ADVANCED */}
        <div>
          <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${MR.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: MR.gold, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: MR.mono, fontSize: 10, color: MR.gold, letterSpacing: 1, fontWeight: 700 }}>ADVANCED CLASS</div>
              <div style={{ fontSize: 13, color: MR.dim, marginTop: 2 }}>Market Narrative & Execution</div>
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: MR.mono, fontSize: 11, color: MR.dim }}>{ADVANCED_MODULES.length} modul</span>
          </div>
          {ADVANCED_MODULES.map((mod, i) => (
            <ModCard key={i} mod={mod} idx={i} isAdv={true} />
          ))}
        </div>

      </div>
    </section>
  );
}


function GallerySlider() {
  const [images, setImages] = React.useState<{url: string; caption?: string}[]>([]);
  const [cur, setCur] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const { ref: refGalHdr, animStyle: galHdrStyle } = useFadeUp();

  React.useEffect(() => {
    supabase.from('landing_gallery').select('url,caption,urutan').eq('active', true).order('urutan').then(({ data }) => {
      if (data && data.length > 0) setImages(data);
    });
  }, []);

  React.useEffect(() => {
    if (paused || images.length <= 1) return;
    const t = setInterval(() => setCur(c => (c + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [paused, images.length]);

  if (images.length === 0) return null;

  const prev = () => setCur(c => (c - 1 + images.length) % images.length);
  const next = () => setCur(c => (c + 1) % images.length);

  return (
    <section style={{ borderBottom: `1px solid ${MR.border}`, background: 'var(--mr-bg)' }}>
      <div ref={refGalHdr} style={{ ...galHdrStyle, padding: isMobile ? '32px 20px 20px' : '48px 40px 28px' }}>
        <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.8, marginBottom: 8 }}>// GALERI</div>
        <h2 style={{ fontSize: isMobile ? 22 : 34, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Hasil Nyata Member Kami</h2>
      </div>

      <div
        style={{ position: 'relative', userSelect: 'none' as const }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Slider track */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            transition: 'transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)',
            transform: `translateX(-${cur * 100}%)`,
            willChange: 'transform',
          }}>
            {images.map((img, i) => (
              <div key={i} style={{ flexShrink: 0, width: '100%', position: 'relative' }}>
                <img
                  src={img.url}
                  alt={img.caption || `galeri-${i + 1}`}
                  style={{ width: '100%', height: isMobile ? 280 : 520, objectFit: 'contain', display: 'block', background: 'var(--mr-bg)' }}
                />
                {img.caption && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(0,0,0,0.72))', padding: '32px 28px 18px', color: '#e7e5e4', fontSize: 14, lineHeight: 1.5 }}>
                    {img.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Arrows */}
        {images.length > 1 && <>
          <button onClick={prev}
            style={{ position: 'absolute', left: isMobile ? 8 : 20, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(6,6,6,0.88)', border: '1px solid var(--mr-border2)', color: 'var(--mr-text)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', zIndex: 2, transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = MR.gold}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#3a3a3a'}
          >‹</button>
          <button onClick={next}
            style={{ position: 'absolute', right: isMobile ? 8 : 20, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(6,6,6,0.88)', border: '1px solid var(--mr-border2)', color: 'var(--mr-text)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', zIndex: 2, transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = MR.gold}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#3a3a3a'}
          >›</button>
        </>}

        {/* Counter badge */}
        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 16, right: 20, fontFamily: MR.mono, fontSize: 10, color: 'var(--mr-muted)', background: 'rgba(0,0,0,0.6)', padding: '3px 9px', borderRadius: 12, backdropFilter: 'blur(4px)' }}>
            {cur + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {images.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '18px 0 28px' }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => setCur(i)}
              style={{ width: cur === i ? 28 : 7, height: 7, borderRadius: 4, background: cur === i ? MR.gold : 'var(--mr-border2)', border: 'none', cursor: 'pointer', transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)', padding: 0 }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);
  const { ref: refTmHdr, animStyle: tmHdrStyle } = useFadeUp();
  const [cur, setCur] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const total = testimonials.length;
  const perView = isMobile ? 1 : 3;
  const maxIdx = Math.max(0, total - perView);
  const avgRating = total ? (testimonials.reduce((a: number, t: any) => a + (t.bintang||t.rating||5), 0) / total).toFixed(1) : '5.0';
  const ACCENT = ['#eab308','#22ab94','#a855f7','#3b82f6','#ec4899','#f59e0b','#06b6d4','#10b981','#f97316','#8b5cf6','#e11d48','#0ea5e9','#84cc16','#d946ef','#fb923c'];

  React.useEffect(() => {
    if (paused || total <= perView) return;
    const t = setInterval(() => setCur(c => c >= maxIdx ? 0 : c + 1), 3500);
    return () => clearInterval(t);
  }, [paused, total, perView, maxIdx]);

  return (
    <section style={{ padding: isMobile ? '48px 0' : '72px 0', background: 'linear-gradient(180deg,var(--mr-bg) 0%,var(--mr-dark) 50%,var(--mr-bg) 100%)', borderBottom: '1px solid var(--mr-border)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translateX(-50%)', width:800, height:300, background:'radial-gradient(ellipse,rgba(234,179,8,0.03) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

      {/* Header */}
      <div ref={refTmHdr} style={{ ...tmHdrStyle, textAlign:'center' as const, marginBottom: isMobile ? 32 : 48, padding:'0 24px', position:'relative', zIndex:1 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(234,179,8,0.08)', border:'1px solid rgba(234,179,8,0.2)', padding:'5px 16px', borderRadius:20, marginBottom:16 }}>
          <span style={{ color:MR.gold, fontSize:11 }}>★</span>
          <span style={{ fontFamily:MR.mono, color:MR.gold, fontSize:10, letterSpacing:1.5 }}>APA KATA MEMBER KAMI</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 28 : 44, fontWeight:800, letterSpacing:-1.5, margin:'0 0 12px', lineHeight:1.1 }}>
          Bukan sekadar klaim.<br/>
          <span style={{ color:MR.gold }}>Bukti nyata dari member.</span>
        </h2>
        <div style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'center' }}>
          <div style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(s=><span key={s} style={{ color:MR.gold, fontSize:16 }}>★</span>)}</div>
          <span style={{ fontFamily:MR.mono, fontWeight:700, color:MR.gold, fontSize:15 }}>{avgRating}</span>
          <span style={{ color:'var(--mr-dim)', fontSize:13 }}>· {total} ulasan</span>
        </div>
      </div>

      {/* Slider */}
      <div style={{ position:'relative', zIndex:1 }} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
        <div style={{ overflow:'hidden', padding: isMobile ? '12px 24px' : '12px 60px' }}>
          <div style={{ display:'flex', gap:16, transition:'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)', transform:`translateX(calc(-${cur} * ${isMobile?'calc(100% + 16px)':'calc(33.333% + 5.5px)'}))`, willChange:'transform' }}>
            {testimonials.map((t: any, i: number) => {
              const accent = ACCENT[i % ACCENT.length];
              const stars = t.bintang || t.rating || 5;
              const isActive = i >= cur && i < cur + perView;
              return (
                <div key={t.id} style={{ flexShrink:0, width: isMobile ? '100%' : 'calc(33.333% - 11px)', background:'linear-gradient(150deg,var(--mr-panel),var(--mr-sidebar))', border:`1px solid ${isActive ? accent+'44' : 'var(--mr-border)'}`, borderRadius:20, padding:'28px 24px', display:'flex', flexDirection:'column' as const, gap:18, position:'relative', overflow:'hidden', transition:'border-color 0.5s,box-shadow 0.5s', boxShadow: isActive ? `0 8px 40px ${accent}0f` : 'none', minHeight:300 }}>
                  <div style={{ position:'absolute', top:0, left:24, right:24, height:2, background:`linear-gradient(90deg,transparent,${accent},transparent)`, opacity:isActive?1:0.2, transition:'opacity 0.5s' }}/>
                  <div style={{ position:'absolute', bottom:-15, right:12, fontSize:140, color:accent, opacity:0.04, fontFamily:'Georgia,serif', lineHeight:1, pointerEvents:'none', userSelect:'none' as const }}>"</div>
                  <div style={{ display:'flex', gap:3 }}>
                    {[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:13, color:stars>=s?MR.gold:'var(--mr-border2)' }}>★</span>)}
                  </div>
                  <p style={{ fontSize:13.5, lineHeight:1.8, color:'var(--mr-dim)', margin:0, flex:1, fontStyle:'italic', display:'-webkit-box', WebkitLineClamp:6, WebkitBoxOrient:'vertical' as const, overflow:'hidden' }}>
                    "{t.ulasan || t.teks || t.content || ''}"
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:12, paddingTop:16, borderTop:'1px solid var(--mr-border)' }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:`${accent}18`, border:`1px solid ${accent}55`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:15, color:accent, flexShrink:0, fontFamily:MR.mono }}>
                      {(t.nama||t.nama_akun||'?')[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const, color:'var(--mr-text)' }}>{t.nama||t.nama_akun}</div>
                      <div style={{ fontFamily:MR.mono, fontSize:9, color:accent, marginTop:3, letterSpacing:0.5 }}>
                        {(t.kelas||t.tier||'Member').replace('SMC ','').replace(' Mentorship','').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {total > perView && <>
          <button onClick={()=>setCur(c=>Math.max(0,c-1))} disabled={cur===0}
            style={{ position:'absolute', left: isMobile?4:12, top:'50%', transform:'translateY(-50%)', width:44, height:44, borderRadius:'50%', background:'rgba(8,8,8,0.85)', border:`1px solid ${cur===0?'var(--mr-border)':'var(--mr-border2)'}`, color:cur===0?'var(--mr-border2)':'var(--mr-text)', fontSize:22, cursor:cur===0?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(12px)', zIndex:2, transition:'all 0.2s', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>‹</button>
          <button onClick={()=>setCur(c=>Math.min(maxIdx,c+1))} disabled={cur>=maxIdx}
            style={{ position:'absolute', right: isMobile?4:12, top:'50%', transform:'translateY(-50%)', width:44, height:44, borderRadius:'50%', background:'rgba(8,8,8,0.85)', border:`1px solid ${cur>=maxIdx?'var(--mr-border)':'var(--mr-border2)'}`, color:cur>=maxIdx?'var(--mr-border2)':'var(--mr-text)', fontSize:22, cursor:cur>=maxIdx?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(12px)', zIndex:2, transition:'all 0.2s', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>›</button>
        </>}
      </div>

      {total > perView && (
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:28 }}>
          {Array.from({length:maxIdx+1}).map((_,i)=>(
            <button key={i} onClick={()=>setCur(i)}
              style={{ width:cur===i?28:7, height:7, borderRadius:4, background:cur===i?MR.gold:'var(--mr-border2)', border:'none', cursor:'pointer', transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)', padding:0 }}/>
          ))}
        </div>
      )}
    </section>
  );
}


function ProductPreview({ config }: { config: LandingPreviewConfig }) {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const videoId = config.yt_url
    ? (config.yt_url.match(/(?:youtu\.be\/|[?&]v=)([^&?/\s]+)/)?.[1] ?? null)
    : null;

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

        {videoId && (
          <div style={{ borderRadius: LP.radius, overflow: 'hidden', border: `1px solid ${LP.border}`, boxShadow: LP.shadowMd, marginBottom: 40, position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          </div>
        )}

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

const TIER_ACCENT_COLOR: Record<string, string> = {
  neutral:  '#16a34a',
  bronze:   '#c2740b',
  gold:     '#b8860b',
  platinum: '#7c3aed',
};

function Pricing({ tiers }: { tiers: PricingTier[] }) {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);

  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  return (
    <section id="kelas" style={{ background: LP.surface, padding: isMobile ? '48px 20px' : '72px 40px', borderTop: `1px solid ${LP.border}`, borderBottom: `1px solid ${LP.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, letterSpacing: 0.8 }}>// PILIH TIER</div>
          <h2 style={{ fontSize: isMobile ? 26 : 44, letterSpacing: -1, lineHeight: 1.1, margin: '14px 0 8px', fontWeight: 800, color: LP.text }}>Pilih tier kamu.</h2>
          <p style={{ color: LP.muted, fontSize: 14, maxWidth: 480 }}>Trial bulanan untuk yang baru kenal. Bronze ke atas — sekali bayar, akses seumur hidup.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${tiers.length + 1}, 1fr)`, gap: 16 }}>
          {tiers.map((p) => {
            const accent = TIER_ACCENT_COLOR[p.accent] ?? TIER_ACCENT_COLOR.neutral;
            return (
              <div key={p.id} style={{
                background: LP.bg, borderRadius: LP.radius, padding: '24px 20px',
                border: p.is_featured ? `2px solid ${accent}` : `1px solid ${LP.border}`,
                boxShadow: p.is_featured ? LP.shadowMd : LP.shadowSm,
                display: 'flex', flexDirection: 'column' as const, position: 'relative',
              }}>
                {p.badge && (
                  <div style={{ position: 'absolute', top: -12, left: 20, background: accent, color: '#fff', padding: '4px 12px', fontSize: 10, letterSpacing: 0.6, fontWeight: 700, borderRadius: 20 }}>
                    {p.badge.toUpperCase()}
                  </div>
                )}
                <div style={{ fontFamily: LP.mono, color: accent, fontSize: 10, letterSpacing: 1, marginBottom: 10, marginTop: p.badge ? 8 : 0 }}>{p.tag.toUpperCase()}</div>
                <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 6, color: LP.text }}>{p.name}</div>
                <div style={{ color: LP.muted, fontSize: 12, marginBottom: 18, lineHeight: 1.5 }}>{p.pitch}</div>
                <div style={{ marginBottom: 4 }}>
                  {p.original_price && <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginBottom: 2 }}><s>Rp {fmt(p.original_price)}</s></div>}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: LP.mono, color: accent, fontSize: 13 }}>Rp</span>
                    <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: LP.text }}>{fmt(p.price)}</span>
                  </div>
                  <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginTop: 4 }}>{p.period}</div>
                </div>
                {p.note && <div style={{ fontFamily: LP.mono, color: accent, fontSize: 10, marginTop: 6 }}>{p.note}</div>}
                <div style={{ height: 14 }} />
                <div style={{ borderTop: `1px solid ${LP.border}`, paddingTop: 14, marginBottom: 16, flex: 1 }}>
                  {p.perks.map((perk, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '5px 0', color: LP.muted, lineHeight: 1.45 }}>
                      <span style={{ color: accent, flexShrink: 0 }}>✓</span>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => window.location.href = `/signup?tier=${p.id}`}
                  style={{ fontFamily: LP.sans, padding: '12px 0', fontSize: 13, fontWeight: 700, borderRadius: 8, background: p.is_featured ? accent : 'transparent', color: p.is_featured ? '#fff' : accent, border: `1px solid ${accent}`, cursor: 'pointer' }}>
                  {p.is_featured ? `Ambil ${p.tag} →` : `Pilih ${p.tag} →`}
                </button>
              </div>
            );
          })}

          <div style={{ background: LP.bg, borderRadius: LP.radius, padding: '24px 20px', border: `1px dashed ${LP.border}`, display: 'flex', flexDirection: 'column' as const }}>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>PARTNERSHIP</div>
            <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 6, color: LP.text }}>Program Afiliasi</div>
            <div style={{ color: LP.muted, fontSize: 12, marginBottom: 18, lineHeight: 1.5 }}>Rekomendasikan platform kami dan dapatkan komisi dari setiap member baru yang bergabung.</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: LP.text, marginBottom: 4 }}>Gratis</div>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginBottom: 14 }}>tanpa modal · komisi per referral</div>
            <div style={{ borderTop: `1px solid ${LP.border}`, paddingTop: 14, marginBottom: 16, flex: 1 }}>
              {['Komisi dari setiap referral berhasil', 'Dashboard tracking link & komisi', 'Tidak perlu jadi member aktif', 'Payout setiap bulan', 'Materi promosi tersedia'].map((perk, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, fontSize: 12, padding: '5px 0', color: LP.muted, lineHeight: 1.45 }}>
                  <span style={{ color: LP.primary, flexShrink: 0 }}>✓</span>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
            <button onClick={() => window.location.href = '/partnership'}
              style={{ fontFamily: LP.sans, padding: '12px 0', fontSize: 13, fontWeight: 700, borderRadius: 8, background: 'transparent', color: LP.primary, border: `1px solid ${LP.primary}`, cursor: 'pointer' }}>
              Gabung Partnership →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BuktiHasil() {
  const [entries, setEntries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const [
          { data: members },
          { data: journals },
          { data: settings },
        ] = await Promise.all([
          supabase.from('members').select('id,nama,tier'),
          supabase.from('trading_journals').select('member_id,hasil,pnl'),
          supabase.from('journal_settings').select('member_id,equity_awal'),
        ]);

        if (!journals || journals.length === 0) { setLoading(false); return; }

        const memberMap: Record<string, { nama: string; tier: string }> = {};
        (members || []).forEach((m: any) => {
          memberMap[m.id] = { nama: m.nama || 'Anon', tier: m.tier || 'trial' };
        });

        const eqMap: Record<string, number> = {};
        (settings || []).forEach((s: any) => { eqMap[s.member_id] = s.equity_awal || 10000; });

        const agg: Record<string, { tp: number; sl: number; total: number; pnl: number }> = {};
        journals.forEach((j: any) => {
          const mid = j.member_id;
          if (!mid) return;
          if (!agg[mid]) agg[mid] = { tp: 0, sl: 0, total: 0, pnl: 0 };
          agg[mid].total++;
          agg[mid].pnl += (j.pnl || 0);
          if (j.hasil === 'Take Profit') agg[mid].tp++;
          if (j.hasil === 'Stop Loss')   agg[mid].sl++;
        });

        const sorted = Object.entries(agg)
          .map(([id, e]) => {
            const ea  = eqMap[id] || 10000;
            const m   = memberMap[id] || { nama: 'Anon', tier: 'trial' };
            const winRate = (e.tp + e.sl) > 0 ? (e.tp / (e.tp + e.sl)) * 100 : 0;
            const gainPct = (e.pnl / ea) * 100;
            return { ...e, ...m, winRate, gainPct };
          })
          .sort((a, b) => b.gainPct - a.gainPct)
          .slice(0, 3);

        setEntries(sorted);
      } catch (e) {
        console.error('[BuktiHasil] error:', e);
      }
      setLoading(false);
    })();
  }, []);

  const { ref: refLb, animStyle: lbStyle } = useFadeUp();
  const { ref: refFeat, animStyle: featStyle } = useFadeUp(150);

  const FEATURES = [
    { title: 'Mentor Review',       desc: 'Review setup & journaling langsung oleh mentor aktif.' },
    { title: 'Live Session',        desc: 'Live market, Q&A, dan pembahasan real time.' },
    { title: 'Active Community',    desc: 'Komunitas trader aktif saling support & sharing.' },
    { title: 'Trade Journal',       desc: 'Bangun kebiasaan journaling & evaluasi setiap trade.' },
    { title: 'Execution Focus',     desc: 'Disiplin eksekusi & risk management yang kuat.' },
    { title: 'Funding Journey',     desc: 'Bimbingan menuju akun funded & payout konsisten.' },
  ];

  if (loading || entries.length === 0) return null;

  return (
    <section style={{ padding: isMobile ? '48px 20px' : '72px 40px', background: LP.surface, borderTop: `1px solid ${LP.border}`, borderBottom: `1px solid ${LP.border}` }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div ref={refLb} style={{ ...lbStyle, marginBottom: 40 }}>
          <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 11, letterSpacing: 1.5, marginBottom: 10 }}>// BUKTI HASIL</div>
          <h2 style={{ fontSize: isMobile ? 26 : 40, fontWeight: 800, letterSpacing: -1, margin: '0 0 12px', color: LP.text }}>Bukan klaim kosong.</h2>
          <p style={{ color: LP.muted, fontSize: isMobile ? 14 : 16, lineHeight: 1.6, maxWidth: 520, margin: '0 0 28px' }}>
            Top performer dari member yang aktif journaling setiap hari — win rate & equity gain riil, bukan testimoni tempelan.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {entries.map((e, i) => {
              const wr = Math.round(e.winRate);
              const gainPct: number = e.gainPct;
              const tierKey = (e.tier || 'trial').toLowerCase().replace('smc ', '').replace(' mentorship', '').replace(' 1 on 1', '');
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '32px 1fr auto auto' : '40px 1fr auto auto', gap: '0 16px', alignItems: 'center', padding: isMobile ? '14px 16px' : '18px 22px', background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: LP.radiusSm, boxShadow: i === 0 ? LP.shadowMd : LP.shadowSm }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: LP.primaryTint, color: LP.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, fontFamily: LP.mono }}>{i + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16, color: LP.text }}>{e.nama.split(' ')[0]}</div>
                    <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, letterSpacing: 0.5, marginTop: 2 }}>{tierKey.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontFamily: LP.mono, fontSize: isMobile ? 16 : 20, fontWeight: 700, color: LP.text }}>{wr}%</div>
                    <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted }}>WIN RATE</div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontFamily: LP.mono, fontSize: isMobile ? 16 : 20, fontWeight: 700, color: gainPct >= 0 ? LP.primary : LP.danger }}>{gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%</div>
                    <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted }}>EQUITY GAIN</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div ref={refFeat} style={{ ...featStyle, borderTop: `1px solid ${LP.border}`, paddingTop: 32 }}>
          <h3 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, margin: '0 0 20px', color: LP.text }}>Bukan cuma belajar — kamu masuk environment trader aktif.</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: LP.radiusSm, padding: '20px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: LP.text, marginBottom: 6 }}>{f.title}</div>
                <div style={{ color: LP.muted, fontSize: 13, lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}


function FaqSection() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);
  const [open, setOpen] = useState(0);
  const { ref: refFaq, animStyle: faqStyle } = useFadeUp();
  return (
    <section ref={refFaq} style={{ ...faqStyle, padding: isMobile ? '36px 16px' : '64px 40px', borderBottom: `1px solid ${MR.border}`, display: isMobile ? 'block' : 'grid', gridTemplateColumns: '360px 1fr', gap: 40 }}>
      <div>
        <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.8 }}>// HELP DESK</div>
        <h2 style={{ fontSize: isMobile ? 24 : 44, letterSpacing: isMobile ? -0.5 : -1.2, lineHeight: 1.1, margin: '16px 0 20px', fontWeight: 700 }}>Pertanyaan yang paling sering muncul.</h2>
        <p style={{ color: MR.dim, fontSize: 14, lineHeight: 1.55 }}>Masih ada yang ngeganjel? Ping admin di Telegram, balasannya rata-rata di bawah 2 jam.</p>
        <a href="https://t.me/+_azyX2h9oFhmNjNl" target="_blank" rel="noreferrer">
          <button style={{ fontFamily: MR.mono, marginTop: 18, padding: '12px 16px', border: `1px solid ${MR.borderHot}`, fontSize: 12, letterSpacing: 0.4, background: 'transparent', color: MR.text, cursor: 'pointer' }}>TANYA ADMIN ▸</button>
        </a>
      </div>
      <div style={{ borderTop: `1px solid ${MR.border}` }}>
        {FAQ.map((f, i) => {
          const isOpen = i === open;
          return (
            <div key={i} style={{ borderBottom: `1px solid ${MR.border}` }}>
              <button onClick={() => setOpen(isOpen ? -1 : i)} style={{ width: '100%', textAlign: 'left', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24, background: 'none', border: 'none', color: MR.text, cursor: 'pointer' }}>
                <span style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 12 }}>Q.{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 19, fontWeight: 500, letterSpacing: -0.2 }}>{f.q}</span>
                </span>
                <span style={{ fontFamily: MR.mono, color: isOpen ? MR.gold : MR.dim, fontSize: 20, flexShrink: 0 }}>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <div style={{ paddingBottom: 22, paddingLeft: 50, paddingRight: 50, color: MR.dim, fontSize: 15, lineHeight: 1.65 }}>{f.a}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CTA() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);
  const { ref: refCta, animStyle: ctaStyle } = useFadeUp();

  return (
    <section className='mr-section-pad' style={{ padding: '80px 40px', borderBottom: `1px solid ${MR.border}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4, ...CANDLE_GRID_STYLE }} />
      <div ref={refCta} style={{ ...ctaStyle, position: 'relative', maxWidth: 980 }}>
        <div style={{ fontFamily: MR.mono, color: MR.gold, fontSize: 11, letterSpacing: 0.8 }}>// FINAL CALL</div>
        <h2 style={{ fontSize: isMobile ? 36 : 86, letterSpacing: isMobile ? -1 : -3, lineHeight: isMobile ? 1.1 : 0.95, margin: '20px 0 28px', fontWeight: 700 }}>
          Pasar buka senin pagi.<br />
          <span style={{ color: MR.dim }}>Kamu udah siap, atau </span><span style={{ color: MR.down }}>masih nebak?</span>
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => window.location.href = '/signup?tier=gold'} className="mr-btn-shimmer" style={{ fontFamily: MR.mono, background: MR.gold, color: '#181000', padding: '18px 26px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, border: 'none', cursor: 'pointer' }}>MULAI DENGAN GOLD ▸</button>
          <button onClick={() => window.location.href = '/signup?tier=trial'} style={{ fontFamily: MR.mono, border: `1px solid ${MR.borderHot}`, padding: '18px 26px', fontSize: 13, letterSpacing: 0.4, background: 'transparent', color: MR.text, cursor: 'pointer' }}>COBA TRIAL · Rp 99K</button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);
  const SOCIALS = [
    { label: 'Discord',  href: 'https://discord.gg/d2Tpf6sGMr',  icon: '💬' },
    { label: 'Telegram', href: 'https://t.me/+_azyX2h9oFhmNjNl', icon: '📢' },
    { label: 'TikTok',   href: 'https://www.tiktok.com/@menolakrugi',   icon: '🎵' },
    { label: 'YouTube',  href: 'https://youtube.com/@menolakrugi',  icon: '▶' },
    { label: 'WhatsApp', href: 'https://wa.me/6281242224939',  icon: '📱' },
  ];
  return (
    <footer style={{ padding: '48px 40px 32px', background: MR.dark }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1.4fr repeat(3, 1fr)', gap: isMobile ? 16 : 32, marginBottom: 36 }}>
        <div>
          <MRLogo size={36} />
          <div style={{ fontWeight: 800, marginTop: 12, letterSpacing: -0.4 }}>MENOLAK RUGI</div>
          <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, marginTop: 6, letterSpacing: 0.6 }}>SMC EDUCATION · EST. 2023</div>
          <p style={{ color: MR.dim, fontSize: 13, marginTop: 14, maxWidth: 280, lineHeight: 1.55 }}>Belajar Smart Money Concept tanpa ribet — sampai konsisten, bukan sampai materi habis.</p>
          {/* Social icons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' as const }}>
            {SOCIALS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MR.mono, fontSize: 10, color: MR.dim, textDecoration: 'none', padding: '5px 10px', border: `1px solid ${MR.border}`, letterSpacing: 0.5, transition: 'color .15s, border-color .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = MR.gold; (e.currentTarget as HTMLElement).style.borderColor = MR.gold; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = MR.dim; (e.currentTarget as HTMLElement).style.borderColor = MR.border; }}>
                <span>{s.icon}</span>{s.label.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
        {[
          { h: 'KELAS',   links: [
            { l: 'Trial',    href: '/signup?tier=trial' },
            { l: 'Bronze',   href: '/signup?tier=bronze' },
            { l: 'Gold',     href: '/signup?tier=gold' },
            { l: 'Platinum', href: '/signup?tier=platinum' },
          ]},
          { h: 'BELAJAR', links: [
            { l: 'Kurikulum',    href: '/#kurikulum' },
            { l: 'Komunitas',    href: 'https://discord.gg/d2Tpf6sGMr' },
            { l: 'Kalender',     href: '/calendar' },
            { l: 'Partnership',  href: '/partnership' },
          ]},
          { h: 'BANTUAN', links: [
            { l: 'FAQ',               href: '/#faq' },
            { l: 'Kontak Admin (WA)', href: 'https://wa.me/6281242224939' },
            { l: 'Telegram Channel',  href: 'https://t.me/+_azyX2h9oFhmNjNl' },
            { l: 'YouTube',           href: 'https://youtube.com/@menolakrugi' },
          ]},
        ].map(c => (
          <div key={c.h}>
            <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 12 }}>// {c.h}</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {(c.links as any[]).map((item: any) => (
                <a key={item.l} href={item.href} target={item.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                  style={{ fontSize: 14, color: '#bfbfbf', cursor: 'pointer', textDecoration: 'none', transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = MR.gold}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#bfbfbf'}>
                  {item.l}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: MR.mono, display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: `1px solid ${MR.border}`, color: MR.dimmer, fontSize: 11, letterSpacing: 0.4, flexWrap: 'wrap' as const, gap: 8 }}>
        <span>© 2026 Menolak Rugi · All rights reserved</span>
        <span>Trading mengandung risiko. Past performance ≠ future result.</span>
        <span>WA: 6281242224939</span>
      </div>
    </footer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { stats }        = useLandingStats();
  const { testimonials } = useApprovedTestimonials(12);
  const { tiers }        = usePricing();
  const { preview }      = useLandingPreview();

  return (
    <div className="mr-landing-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
      <style>{`
        .mr-nav-links { display: flex; }
        .mr-section-pad { padding: 80px 40px; }
        .mr-curriculum-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 767px) {
          .mr-nav-links { display: none !important; }
          .mr-nav-topbar { padding: 10px 16px !important; }
          .mr-mobile-nav-right { display: flex !important; }
          .mr-hero-h1 { font-size: 38px !important; letter-spacing: -1.5px !important; line-height: 1.08 !important; }
          .mr-section-pad { padding: 40px 16px !important; }
          .mr-curriculum-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes mr-fadeup {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mr-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .mr-anim-badge { animation: mr-fadein  0.4s ease both; }
        .mr-anim-h1-1  { animation: mr-fadeup  0.6s ease 0.12s both; }
        .mr-anim-h1-2  { animation: mr-fadeup  0.6s ease 0.24s both; }
        .mr-anim-h1-3  { animation: mr-fadeup  0.6s ease 0.36s both; }
        .mr-anim-h1-4  { animation: mr-fadeup  0.6s ease 0.48s both; }
        .mr-anim-desc  { animation: mr-fadeup  0.6s ease 0.58s both; }
        .mr-anim-cta   { animation: mr-fadeup  0.6s ease 0.68s both; }
        .mr-anim-stat-0 { animation: mr-fadeup 0.5s ease 0s   both; }
        .mr-anim-stat-1 { animation: mr-fadeup 0.5s ease 0.1s both; }
        .mr-anim-stat-2 { animation: mr-fadeup 0.5s ease 0.2s both; }
        .mr-anim-stat-3 { animation: mr-fadeup 0.5s ease 0.3s both; }
        @keyframes mr-blink { 0%,49%{opacity:1}50%,100%{opacity:0} }
        .mr-blink { animation: mr-blink 1s steps(1) infinite; }
        @keyframes mr-ticker { 0%{transform:translateX(0)}100%{transform:translateX(-33.333%)} }
        @keyframes mr-shimmer-sweep { 0%{left:-80%} 60%,100%{left:150%} }
        .mr-btn-shimmer { position: relative !important; overflow: hidden !important; }
        .mr-btn-shimmer::after { content:''; position:absolute; top:0; left:-80%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent); animation:mr-shimmer-sweep 3s ease-in-out infinite; pointer-events:none; }
        @keyframes mr-card-glow { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.2)} 50%{box-shadow:0 0 32px 8px rgba(22,163,74,0.05)} }
        @media (min-width:768px) { .mr-pricing-card{transition:transform 0.25s ease,box-shadow 0.25s ease !important} .mr-pricing-card:hover{transform:translateY(-8px) !important;box-shadow:0 20px 56px rgba(0,0,0,0.5) !important} }
      `}</style>

      <NavBar />

      {/* 3 — Hero */}
      <Hero />

      {/* 4 — Stats bar */}
      <StatsBar
        memberCount={stats?.memberCount ?? 0}
        fundedCount={stats?.fundedCount ?? 0}
        newThisMonth={stats?.newMembersThisMonth ?? 0}
      />

      <BuktiHasil />

      {/* 4.5 — Preview Platform */}
      {preview && <ProductPreview config={preview} />}

      {/* 5 — Tier / Pricing */}
      {tiers.length > 0 && <Pricing tiers={tiers} />}

      {/* 6 — Kurikulum */}
      <Curriculum />

      {/* 7 — Galeri hasil nyata */}
      <GallerySlider />


      {/* 9 — Testimonial */}
      {testimonials.length > 0 && <Testimonials testimonials={testimonials} />}

      {/* 10 — Discord CTA */}
      <DiscordCTA />

      {/* 11 — FAQ */}
      <FaqSection />

      {/* 12 — Footer */}
      <Footer />
    </div>
  );
}
