// pages/LandingPage.tsx — Landing Page Menolak Rugi (Direction A · Terminal)
// Data: member count + funded count + testimonials dari Supabase.
// Pricing dari DB (dengan fallback hardcode jika tabel belum ada).

import React, { useState } from 'react';
import { Menu, X, Star, ChevronDown, MessageCircle, Send, Music2, Youtube, Phone } from 'lucide-react';

import { MRLogo, CandleChart } from '../components/mr';
import { useApprovedTestimonials, useLandingPreview } from '../hooks';
import type { LandingPreviewConfig } from '../hooks';
import type { Testimonial } from '../types/mr.types';
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

function Hero() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);

  return (
    <section id="kelas" style={{ background: LP.bg }}>
      <div style={{ padding: isMobile ? '48px 20px 40px' : '72px 40px 56px' }}>
        <div style={{ maxWidth: isMobile ? 720 : 1080, margin: '0 auto', textAlign: 'center' as const }}>
          <div className='mr-anim-badge' style={{ fontFamily: LP.mono, display: 'inline-flex', gap: 8, alignItems: 'center', padding: '6px 12px', borderRadius: 20, border: `1px solid ${LP.border}`, background: LP.surface, color: LP.muted, fontSize: 11, letterSpacing: 0.6, marginBottom: 24 }}>
            <span className="mr-blink" style={{ color: LP.primary }}>●</span>
            LIVE · SMART MONEY CONCEPT EDUCATION
          </div>
          <h1 className='mr-hero-h1' style={{ fontSize: isMobile ? 34 : 56, lineHeight: 1.1, letterSpacing: -1.5, margin: '0 0 24px', fontWeight: 800, color: LP.text, whiteSpace: isMobile ? 'normal' : 'nowrap' } as React.CSSProperties}>
            <span className='mr-anim-h1-1' style={{ display: 'block' }}>Berhenti trading tanpa arah.</span>
            <span className='mr-anim-h1-2' style={{ display: 'inline-block', position: 'relative' }}>
              <span aria-hidden="true" style={{ position: 'absolute', inset: '-10px -20px', background: `linear-gradient(90deg, ${LP.primary}, #22c55e, ${LP.primary})`, filter: 'blur(28px)', opacity: 0.35, zIndex: 0 }} />
              <span style={{ position: 'relative', color: LP.primary }}>Mulai pahami market structure.</span>
            </span>
          </h1>
          <p className='mr-anim-desc' style={{ fontSize: isMobile ? 15 : 18, color: LP.muted, lineHeight: 1.65, maxWidth: 520, margin: '0 auto 32px' }}>
            Smart Money Concept yang kami gunakan langsung di funded account. Belajar membaca arah market lewat struktur yang jelas — dari trend, BOS, CHoCH, sampai validasi entry. Bukan sekadar entry karena feeling.
          </p>
          <div className='mr-anim-cta' style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
            <button onClick={() => window.location.href = '/signup'}
              style={{ fontFamily: LP.sans, background: LP.primary, color: '#fff', fontWeight: 700, padding: '15px 28px', fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: LP.shadowMd }}>
              Pilih Kelas →
            </button>
            <button onClick={() => document.getElementById('kurikulum')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontFamily: LP.sans, border: `1px solid ${LP.border}`, padding: '15px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10, background: LP.surface, color: LP.text, cursor: 'pointer' }}>
              Lihat Kurikulum
            </button>
          </div>
          <p style={{ fontFamily: LP.mono, fontSize: 12, color: LP.muted, marginTop: 24 }}>
            Akses langsung setelah verifikasi pembayaran · Upgrade atau berhenti kapan saja
          </p>
        </div>
      </div>
    </section>
  );
}

function HeroPreview({ videoId }: { videoId: string | null }) {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);

  return (
    <section className='mr-anim-desc' style={{ position: 'relative', background: LP.bg, paddingBottom: isMobile ? 40 : 64, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: '0 0 40% 0', background: LP.bg }} />
      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: isMobile ? '0 16px' : '0 40px' }}>
        <div style={{ borderRadius: LP.radius, border: `1px solid ${LP.border}`, background: LP.surface, boxShadow: '0 30px 80px rgba(15,23,42,0.14)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 6, padding: '14px 18px', borderBottom: `1px solid ${LP.border}` }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
          </div>
          {videoId ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{ padding: isMobile ? 16 : 28 }}>
              <CandleChart width={1040} height={isMobile ? 220 : 360} density={isMobile ? 26 : 40} showBOS />
            </div>
          )}
        </div>
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
          <ChevronDown size={16} color={isOpen ? accent : LP.muted} style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
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

      <div className='mr-curriculum-grid' style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', maxWidth: 1200, margin: '0 auto', border: `1px solid ${LP.border}`, borderBottom: 'none' }}>
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


function Komunitas() {
  const [images, setImages] = React.useState<{ url: string; caption?: string }[]>([]);
  const [cur, setCur] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);

  const { ref: refHdr, animStyle: hdrStyle } = useFadeUp();

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

  return (
    <section style={{ background: LP.bg, padding: isMobile ? '48px 20px' : '72px 40px' }}>
      <div ref={refHdr} style={{ ...hdrStyle, maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 11, letterSpacing: 1.5, marginBottom: 10 }}>// KOMUNITAS</div>
        <h2 style={{ fontSize: isMobile ? 26 : 40, fontWeight: 800, letterSpacing: -1, margin: '0 0 12px', color: LP.text }}>
          Belajar lebih cepat di dalam komunitas.
        </h2>
        <p style={{ color: LP.muted, fontSize: isMobile ? 14 : 16, lineHeight: 1.6, maxWidth: 520, margin: '0 0 32px' }}>
          Bergabung dengan ribuan trader Indonesia. Share setup, diskusi market live, dan tumbuh bersama member yang serius setiap hari.
        </p>

        {images.length > 0 && (
          <div style={{ position: 'relative', borderRadius: LP.radius, overflow: 'hidden', border: `1px solid ${LP.border}`, boxShadow: LP.shadowMd, marginBottom: 32, userSelect: 'none' as const }}
            onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', transition: 'transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)', transform: `translateX(-${cur * 100}%)` }}>
                {images.map((img, i) => (
                  <div key={i} style={{ flexShrink: 0, width: '100%', position: 'relative' }}>
                    <img src={img.url} alt={img.caption || `galeri-${i + 1}`} style={{ width: '100%', height: isMobile ? 220 : 400, objectFit: 'contain', display: 'block', background: '#0f172a' }} />
                    {img.caption && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(15,23,42,0.75))', padding: '28px 20px 14px', color: '#fff', fontSize: 13, lineHeight: 1.5 }}>
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, position: 'absolute', bottom: 12, left: 0, right: 0 }}>
                {images.map((_, i) => (
                  <button key={i} onClick={() => setCur(i)} aria-label={`Slide ${i + 1}`}
                    style={{ width: cur === i ? 22 : 6, height: 6, borderRadius: 4, background: cur === i ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
          <a href="https://discord.gg/d2Tpf6sGMr" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ fontFamily: LP.sans, background: '#5865F2', color: '#fff', fontWeight: 700, padding: '14px 24px', fontSize: 13, borderRadius: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageCircle size={18} />
              Gabung Discord
            </button>
          </a>
          <a href="https://t.me/+_azyX2h9oFhmNjNl" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{ fontFamily: LP.sans, background: LP.surface, color: LP.text, fontWeight: 600, padding: '14px 24px', fontSize: 13, borderRadius: 10, border: `1px solid ${LP.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Send size={18} />
              Telegram Channel
            </button>
          </a>
        </div>
        <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 16 }}>
          Gratis · Aktif setiap hari · 500+ member online
        </div>
      </div>
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
  const avgRating = total ? (testimonials.reduce((a: number, t: any) => a + (t.bintang || t.rating || 5), 0) / total).toFixed(1) : '5.0';

  React.useEffect(() => {
    if (paused || total <= perView) return;
    const t = setInterval(() => setCur(c => c >= maxIdx ? 0 : c + 1), 3500);
    return () => clearInterval(t);
  }, [paused, total, perView, maxIdx]);

  return (
    <section style={{ padding: isMobile ? '48px 0' : '72px 0', background: LP.surface, borderTop: `1px solid ${LP.border}`, borderBottom: `1px solid ${LP.border}` }}>
      <div ref={refTmHdr} style={{ ...tmHdrStyle, textAlign: 'center' as const, marginBottom: isMobile ? 28 : 40, padding: '0 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: LP.primaryTint, padding: '5px 16px', borderRadius: 20, marginBottom: 16 }}>
          <Star size={13} fill={LP.primary} color={LP.primary} />
          <span style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1.5 }}>APA KATA MEMBER KAMI</span>
        </div>
        <h2 style={{ fontSize: isMobile ? 26 : 40, fontWeight: 800, letterSpacing: -1, margin: '0 0 12px', color: LP.text }}>
          Bukan sekadar klaim. Bukti nyata dari member.
        </h2>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(s => <Star key={s} size={16} fill={LP.primary} color={LP.primary} />)}</div>
          <span style={{ fontFamily: LP.mono, fontWeight: 700, color: LP.primary, fontSize: 15 }}>{avgRating}</span>
          <span style={{ color: LP.muted, fontSize: 13 }}>· {total} ulasan</span>
        </div>
      </div>

      <div style={{ position: 'relative' }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div style={{ overflow: 'hidden', padding: isMobile ? '12px 24px' : '12px 60px' }}>
          <div style={{ display: 'flex', gap: 16, transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)', transform: `translateX(calc(-${cur} * ${isMobile ? 'calc(100% + 16px)' : 'calc(33.333% + 5.5px)'}))` }}>
            {testimonials.map((t: any) => {
              const stars = t.bintang || t.rating || 5;
              return (
                <div key={t.id} style={{ flexShrink: 0, width: isMobile ? '100%' : 'calc(33.333% - 11px)', background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: LP.radius, padding: '24px 22px', display: 'flex', flexDirection: 'column' as const, gap: 16, minHeight: 260, boxShadow: LP.shadowSm }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={stars >= s ? LP.primary : 'none'} color={stars >= s ? LP.primary : LP.border} />)}
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.75, color: LP.text, margin: 0, flex: 1, display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                    "{t.ulasan || t.teks || t.content || ''}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: `1px solid ${LP.border}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: LP.primaryTint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: LP.primary, flexShrink: 0 }}>
                      {(t.nama || t.nama_akun || '?')[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: LP.text }}>{t.nama || t.nama_akun}</div>
                      <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.primary, marginTop: 3, letterSpacing: 0.5 }}>
                        {(t.kelas || t.tier || 'Member').replace('SMC ', '').replace(' Mentorship', '').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {total > perView && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
            {Array.from({ length: maxIdx + 1 }).map((_, i) => (
              <button key={i} onClick={() => setCur(i)}
                style={{ width: cur === i ? 22 : 6, height: 6, borderRadius: 4, background: cur === i ? LP.primary : LP.border, border: 'none', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
        )}
      </div>
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
    <section ref={refFaq} style={{ ...faqStyle, padding: isMobile ? '40px 20px' : '64px 40px', background: LP.bg, display: isMobile ? 'block' : 'grid', gridTemplateColumns: '340px 1fr', gap: 40, maxWidth: 1200, margin: '0 auto' }}>
      <div>
        <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, letterSpacing: 0.8 }}>// HELP DESK</div>
        <h2 style={{ fontSize: isMobile ? 22 : 36, letterSpacing: -0.8, lineHeight: 1.15, margin: '14px 0 16px', fontWeight: 800, color: LP.text }}>Pertanyaan yang paling sering muncul.</h2>
        <p style={{ color: LP.muted, fontSize: 14, lineHeight: 1.55 }}>Masih ada yang ngeganjel? Ping admin di Telegram, balasannya rata-rata di bawah 2 jam.</p>
        <a href="https://t.me/+_azyX2h9oFhmNjNl" target="_blank" rel="noreferrer">
          <button style={{ fontFamily: LP.sans, marginTop: 16, padding: '11px 18px', border: `1px solid ${LP.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, background: LP.surface, color: LP.text, cursor: 'pointer' }}>Tanya Admin →</button>
        </a>
      </div>
      <div style={{ borderTop: `1px solid ${LP.border}` }}>
        {FAQ.map((f, i) => {
          const isOpen = i === open;
          return (
            <div key={i} style={{ borderBottom: `1px solid ${LP.border}` }}>
              <button onClick={() => setOpen(isOpen ? -1 : i)} style={{ width: '100%', textAlign: 'left' as const, padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, background: 'none', border: 'none', color: LP.text, cursor: 'pointer' }}>
                <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>{f.q}</span>
                <ChevronDown size={18} color={isOpen ? LP.primary : LP.muted} style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
              </button>
              {isOpen && <div style={{ paddingBottom: 20, color: LP.muted, fontSize: 14, lineHeight: 1.65 }}>{f.a}</div>}
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
    <section style={{ padding: isMobile ? '56px 20px' : '96px 40px', background: LP.primary, textAlign: 'center' as const }}>
      <div ref={refCta} style={{ ...ctaStyle, maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ fontSize: isMobile ? 30 : 52, letterSpacing: -1.5, lineHeight: 1.1, margin: '0 0 24px', fontWeight: 800, color: '#fff' }}>
          Pasar buka Senin pagi. Kamu udah siap, atau masih nebak?
        </h2>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
          <button onClick={() => window.location.href = '/signup?tier=gold'}
            style={{ fontFamily: LP.sans, background: '#fff', color: LP.primary, padding: '16px 28px', fontSize: 14, fontWeight: 700, borderRadius: 10, border: 'none', cursor: 'pointer' }}>
            Mulai dengan Gold →
          </button>
          <button onClick={() => window.location.href = '/signup?tier=trial'}
            style={{ fontFamily: LP.sans, border: '1px solid rgba(255,255,255,0.4)', padding: '16px 28px', fontSize: 14, fontWeight: 600, borderRadius: 10, background: 'transparent', color: '#fff', cursor: 'pointer' }}>
            Coba Trial · Rp 99K
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);
  const SOCIALS = [
    { label: 'Discord',  href: 'https://discord.gg/d2Tpf6sGMr',           Icon: MessageCircle },
    { label: 'Telegram', href: 'https://t.me/+_azyX2h9oFhmNjNl',          Icon: Send },
    { label: 'TikTok',   href: 'https://www.tiktok.com/@menolakrugi',     Icon: Music2 },
    { label: 'YouTube',  href: 'https://youtube.com/@menolakrugi',        Icon: Youtube },
    { label: 'WhatsApp', href: 'https://wa.me/6281242224939',             Icon: Phone },
  ];
  return (
    <footer style={{ padding: isMobile ? '40px 20px 24px' : '56px 40px 32px', background: LP.surface, borderTop: `1px solid ${LP.border}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1.4fr repeat(3, 1fr)', gap: isMobile ? 24 : 32, marginBottom: 36 }}>
        <div>
          <MRLogo size={36} />
          <div style={{ fontWeight: 800, marginTop: 12, letterSpacing: -0.4, color: LP.text }}>MENOLAK RUGI</div>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, marginTop: 6, letterSpacing: 0.6 }}>SMC EDUCATION · EST. 2023</div>
          <p style={{ color: LP.muted, fontSize: 13, marginTop: 14, maxWidth: 280, lineHeight: 1.55 }}>Belajar Smart Money Concept tanpa ribet — sampai konsisten, bukan sampai materi habis.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' as const }}>
            {SOCIALS.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: `1px solid ${LP.border}`, color: LP.muted, transition: 'color .15s, border-color .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = LP.primary as string; (e.currentTarget as HTMLElement).style.borderColor = LP.primary as string; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = LP.muted as string; (e.currentTarget as HTMLElement).style.borderColor = LP.border as string; }}>
                <s.Icon size={16} />
              </a>
            ))}
          </div>
        </div>
        {[
          { h: 'KELAS', links: [
            { l: 'Trial',    href: '/signup?tier=trial' },
            { l: 'Bronze',   href: '/signup?tier=bronze' },
            { l: 'Gold',     href: '/signup?tier=gold' },
            { l: 'Platinum', href: '/signup?tier=platinum' },
          ]},
          { h: 'BELAJAR', links: [
            { l: 'Kurikulum',   href: '/#kurikulum' },
            { l: 'Komunitas',   href: 'https://discord.gg/d2Tpf6sGMr' },
            { l: 'Kalender',    href: '/calendar' },
            { l: 'Partnership', href: '/partnership' },
          ]},
          { h: 'BANTUAN', links: [
            { l: 'FAQ',               href: '/#faq' },
            { l: 'Kontak Admin (WA)', href: 'https://wa.me/6281242224939' },
            { l: 'Telegram Channel',  href: 'https://t.me/+_azyX2h9oFhmNjNl' },
            { l: 'YouTube',           href: 'https://youtube.com/@menolakrugi' },
          ]},
        ].map(c => (
          <div key={c.h}>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, letterSpacing: 0.8, marginBottom: 12 }}>{c.h}</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {c.links.map(item => (
                <a key={item.l} href={item.href} target={item.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                  style={{ fontSize: 14, color: LP.muted, textDecoration: 'none', transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = LP.primary as string}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = LP.muted as string}>
                  {item.l}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: LP.mono, display: 'flex', justifyContent: 'space-between', paddingTop: 20, borderTop: `1px solid ${LP.border}`, color: LP.muted, fontSize: 11, flexWrap: 'wrap' as const, gap: 8 }}>
        <span>© 2026 Menolak Rugi · All rights reserved</span>
        <span>Trading mengandung risiko. Past performance ≠ future result.</span>
        <span>WA: 6281242224939</span>
      </div>
    </footer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { testimonials } = useApprovedTestimonials(12);
  const { preview }      = useLandingPreview();

  const heroVideoId = preview?.yt_url
    ? (preview.yt_url.match(/(?:youtu\.be\/|[?&]v=)([^&?/\s]+)/)?.[1] ?? null)
    : null;

  return (
    <div className="mr-landing-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
      <style>{`
        .mr-nav-links { display: flex; }
        .mr-curriculum-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 767px) {
          .mr-nav-links { display: none !important; }
          .mr-nav-topbar { padding: 10px 16px !important; }
          .mr-mobile-nav-right { display: flex !important; }
          .mr-hero-h1 { font-size: 38px !important; letter-spacing: -1.5px !important; line-height: 1.08 !important; }
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
        .mr-anim-desc  { animation: mr-fadeup  0.6s ease 0.58s both; }
        .mr-anim-cta   { animation: mr-fadeup  0.6s ease 0.68s both; }
        @keyframes mr-blink { 0%,49%{opacity:1}50%,100%{opacity:0} }
        .mr-blink { animation: mr-blink 1s steps(1) infinite; }
      `}</style>

      <NavBar />

      {/* 3 — Hero */}
      <Hero />

      {/* 4.2 — Hero preview (video/chart) */}
      <HeroPreview videoId={heroVideoId} />

      {/* 4.5 — Preview Platform */}
      {preview && <ProductPreview config={preview} />}

      <BuktiHasil />

      {/* 6 — Kurikulum */}
      <Curriculum />

      {/* 7 — Komunitas */}
      <Komunitas />

      {/* 9 — Testimonial */}
      {testimonials.length > 0 && <Testimonials testimonials={testimonials} />}

      {/* 11 — FAQ */}
      <FaqSection />

      {/* 12 — CTA */}
      <CTA />

      {/* 13 — Footer */}
      <Footer />
    </div>
  );
}
