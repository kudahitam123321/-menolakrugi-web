// pages/LandingPage.tsx — Landing Page Menolak Rugi (Direction A · Terminal)
// Data: member count + funded count + testimonials dari Supabase.
// Pricing dari DB (dengan fallback hardcode jika tabel belum ada).

import React, { useState } from 'react';

import { MR, TIER_ACCENT } from '../lib/theme';
import { MRLogo, Ticker, StatusBar, TVTickerTape, CandleChart, CANDLE_GRID_STYLE } from '../components/mr';
import { useLandingStats, useApprovedTestimonials, usePricing } from '../hooks';
import type { PricingTier, Testimonial } from '../types/mr.types';
import TradingViewWidget from '../components/mr/TradingViewWidget';

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
  const [active, setActive] = React.useState('KELAS');
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia('(max-width: 767px)').matches);
  React.useEffect(() => { const mq = window.matchMedia('(max-width: 767px)'); const h = (e: MediaQueryListEvent) => setIsMobile(e.matches); mq.addEventListener('change',h); return ()=>mq.removeEventListener('change',h); }, []);

  React.useEffect(() => {
    const member = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member');
    if (member) { try { JSON.parse(member); setIsLoggedIn(true); } catch {} }
  }, []);

  const NAV_ITEMS = [
    {
      l: 'KELAS', href: '#kelas',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    },
    {
      l: 'KURIKULUM', href: '#kurikulum',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    },
    {
      l: 'KOMUNITAS', href: '/komunitas',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      l: 'PARTNERSHIP', href: '/partnership',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
    },
    {
      l: 'KALENDER', href: '/calendar',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
  ];

  return (
    <nav style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #060606 100%)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', borderBottom: '1px solid #1a1a1a' }}>
      {/* Glow top */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300, height: 1, background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.6), transparent)' }} />

      {/* Logo */}
      <div className='mr-nav-links' style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* MR Logo custom */}
        <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
          <img src="/logo.png" alt="Menolak Rugi" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontWeight: 800, letterSpacing: 1, fontSize: 15, color: '#e7e5e4' }}>MENOLAK RUGI</span>
          <span style={{ color: '#555', fontSize: 10, marginTop: 3, fontFamily: MR.mono, letterSpacing: 1 }}>SMC TERMINAL · V3.0</span>
          <span style={{ color: '#eab30860', fontSize: 9, marginTop: 2, fontFamily: MR.mono, letterSpacing: 1.5 }}>ELITE TRADING ENVIRONMENT</span>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#0d0d0d', border: '1px solid #222', borderRadius: 12, padding: '6px', gap: 2, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.l;
          return (
            <a
              key={item.l}
              href={item.href}
              onClick={() => setActive(item.l)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 24px', borderRadius: 9, textDecoration: 'none',
                color: isActive ? MR.gold : '#666',
                background: isActive ? 'linear-gradient(180deg, #1a1500 0%, #0f0c00 100%)' : 'transparent',
                border: isActive ? '1px solid #3a2e00' : '1px solid transparent',
                boxShadow: isActive ? '0 0 20px rgba(234,179,8,0.15), inset 0 1px 0 rgba(234,179,8,0.1)' : 'none',
                transition: 'all .2s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = '#999';
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = '#666';
              }}
            >
              {/* Gold underline glow for active */}
              {isActive && (
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 40, height: 2, background: 'linear-gradient(90deg, transparent, #eab308, transparent)', borderRadius: 2 }} />
              )}
              <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              <span style={{ fontFamily: MR.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{item.l}</span>
            </a>
          );
        })}
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {isLoggedIn ? (
          <button
            onClick={() => window.location.href = '/member'}
            style={{ fontFamily: MR.mono, fontSize: 12, color: '#22ab94', padding: '10px 18px', border: '1px solid #0f2a1f', background: '#0a1a14', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, letterSpacing: 0.6, fontWeight: 700 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#22ab94'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#0f2a1f'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            DASHBOARD ›
          </button>
        ) : (
          <button
            onClick={() => window.location.href = '/login'}
            style={{ fontFamily: MR.mono, fontSize: 12, color: '#888', padding: '10px 18px', border: '1px solid #2a2a2a', background: '#0d0d0d', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, letterSpacing: 0.6, fontWeight: 600 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#444'; (e.currentTarget as HTMLButtonElement).style.color = '#bbb'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            LOG IN
          </button>
        )}
        <button
          onClick={() => window.location.href = '/signup'}
          style={{ fontFamily: MR.mono, fontSize: 12, padding: '10px 20px', background: 'linear-gradient(135deg, #eab308, #ca9e00)', color: '#000', fontWeight: 700, letterSpacing: 0.6, border: 'none', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 0 20px rgba(234,179,8,0.3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(234,179,8,0.5)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(234,179,8,0.3)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          BUKA AKUN ›
        </button>
      </div>

      {/* Glow bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 200, height: 1, background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.3), transparent)' }} />
    </nav>
  );
}

function Hero({ memberCount, fundedCount, newThisMonth }: { memberCount: number; fundedCount: number; newThisMonth: number }) {
  
  return (
    <section id="kelas" style={{ position: 'relative', padding: '64px 40px 48px', borderBottom: `1px solid ${MR.border}` }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5, ...CANDLE_GRID_STYLE }} />
      <div className='mr-hero-grid' style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'stretch' }}>
        {/* Left */}
        <div>
          <div style={{ fontFamily: MR.mono, display: 'inline-flex', gap: 8, alignItems: 'center', padding: '6px 10px', border: `1px solid ${MR.border}`, color: MR.dim, fontSize: 11, letterSpacing: 0.6 }}>
            <span className="mr-blink" style={{ color: MR.up }}>●</span>
            {memberCount}+ MEMBER · FUNDED CASES TIAP MINGGU
          </div>
          <h1 className='mr-hero-h1' style={{ fontSize: 84, lineHeight: 0.96, letterSpacing: -3, margin: '26px 0 24px', fontWeight: 700 } as React.CSSProperties}>
            <span>Berhenti trading</span><br />
            <span style={{ color: MR.dim }}>tanpa arah.</span><br />
            <span>Mulai pahami</span><br />
            <span style={{ color: MR.up }}>market structure.</span>
          </h1>
          <p style={{ fontSize: 17, color: MR.dim, lineHeight: 1.55, maxWidth: 520, marginBottom: 36 }}>
            Smart Money Concept yang kami gunakan langsung di funded account. Belajar membaca arah market lewat struktur yang jelas — dari trend, BOS, CHoCH, sampai validasi entry. Bukan sekadar entry karena feeling.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
            <button onClick={() => window.location.href = '/signup'} style={{ fontFamily: MR.mono, background: MR.gold, color: '#181000', fontWeight: 700, padding: '16px 22px', letterSpacing: 0.4, fontSize: 13, border: 'none', cursor: 'pointer' }}>PILIH KELAS ▸</button>
            <button onClick={() => document.getElementById('kurikulum')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontFamily: MR.mono, border: `1px solid ${MR.borderHot}`, padding: '16px 22px', letterSpacing: 0.4, fontSize: 13, background: 'transparent', color: MR.text, cursor: 'pointer' }}>LIHAT KURIKULUM</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${MR.border}` }}>
            {[
              { k: 'MEMBER AKTIF',  v: memberCount.toString(),   d: `+${newThisMonth} 30D`, up: true  },
              { k: 'FUNDED LULUS',  v: fundedCount.toString(),   d: '+5 30D',               up: true  },
              { k: 'RATING KELAS',  v: '4.9',                    d: '/ 5.0',                up: null  },
              { k: 'AKSES MATERI',  v: '∞',                      d: 'LIFETIME',             up: null  },
            ].map((s, i) => (
              <div key={i} style={{ borderRight: i < 3 ? `1px solid ${MR.border}` : 0, padding: '18px 14px 14px 0' }}>
                <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8 }}>{s.k}</div>
                <div style={{ fontWeight: 700, fontSize: 32, marginTop: 6, letterSpacing: -1 }}>{s.v}</div>
                <div style={{ fontFamily: MR.mono, fontSize: 10, color: s.up === true ? MR.up : MR.dim, marginTop: 2 }}>{s.up ? '▲ ' : ''}{s.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — TradingView Live Chart */}
        <div style={{ height: 580 }}>
          <TradingViewWidget />
        </div>

      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className='mr-stats-row' style={{ padding: '32px 40px', borderBottom: `1px solid ${MR.border}`, display: 'flex', justifyContent: 'space-between', gap: 32, alignItems: 'center' }}>
      <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.8, flexShrink: 0 }}>// MANIFESTO</div>
      <div style={{ fontSize: 22, lineHeight: 1.35, letterSpacing: -0.5, maxWidth: 1080 }}>
        Pasar bukan bergerak secara random. Setiap pergerakan membentuk <span style={{ color: MR.up }}>struktur</span>, dan struktur selalu memberi petunjuk arah berikutnya. Kami ngajarin cara membaca <em style={{ fontStyle: 'normal', color: MR.gold }}>market structure</em> dengan benar — memahami kapan trend berlanjut, kapan melemah, dan kapan market mulai <span style={{ color: MR.down }}>berubah arah</span>.
      </div>
    </section>
  );
}

function Curriculum() {
  const [activeBasic, setActiveBasic] = React.useState<number|null>(null);
  const [activeAdv, setActiveAdv]     = React.useState<number|null>(null);

  function ModCard({ mod, idx, isAdv }: { mod: any; idx: number; isAdv?: boolean }) {
    const isOpen = isAdv ? activeAdv === idx : activeBasic === idx;
    const toggle = () => isAdv ? setActiveAdv(isOpen ? null : idx) : setActiveBasic(isOpen ? null : idx);
    const accent = isAdv ? MR.gold : MR.up;
    const isBonusCard = mod.bonus;
    return (
      <div style={{ borderBottom: `1px solid ${MR.border}`, overflow: 'hidden' }}>
        <button onClick={toggle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: isOpen ? (isAdv ? '#0f0c00' : '#051210') : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as const, transition: 'background .2s' }}>
          <span style={{ fontFamily: MR.mono, fontSize: 10, fontWeight: 700, color: isBonusCard ? '#a855f7' : accent, background: isBonusCard ? '#120a1a' : (isAdv ? '#1a1500' : '#051a14'), border: `1px solid ${isBonusCard ? '#3a1a5a' : (isAdv ? '#3a2e00' : '#0f3a2a')}`, padding: '2px 8px', flexShrink: 0, minWidth: 52, textAlign: 'center' as const }}>
            {mod.mod}
          </span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: isOpen ? (isBonusCard ? '#c084fc' : accent) : MR.text }}>
            {mod.title}
          </span>
          <span style={{ fontFamily: MR.mono, fontSize: 12, color: MR.dim, transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</span>
        </button>
        {isOpen && (
          <div style={{ padding: '4px 20px 14px 60px', background: isAdv ? '#0a0800' : '#040e0c' }}>
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
      <div style={{ padding: '48px 40px 32px', borderBottom: `1px solid ${MR.border}` }}>
        <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.8, marginBottom: 8 }}>// KURIKULUM</div>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: -1 }}>
          Apa yang kamu pelajari
        </h2>
        <p style={{ color: MR.dim, fontSize: 15, marginTop: 10, maxWidth: 560 }}>
          Dua jalur belajar: fondasi yang solid di Basic, eksekusi yang tajam di Advanced.
        </p>
      </div>

      {/* Two-column layout */}
      <div className='mr-curriculum-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

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


function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const now = new Date();
  return (
    <section style={{ padding: '56px 40px', borderBottom: `1px solid ${MR.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.8 }}>// TRADE JOURNAL · MEMBER WINS</div>
          <h2 style={{ fontSize: 52, letterSpacing: -1.5, lineHeight: 1, margin: '16px 0 0', fontWeight: 700 }}>Bukti, bukan promo.</h2>
        </div>
        <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 12, textAlign: 'right' }}>
          DATA TERAKHIR · {now.getDate()} MEI {now.getFullYear()}<br />
          <span style={{ color: MR.gold }}>★ 4.9</span> · MEMBER AKTIF
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {testimonials.map((t, i) => (
          <div key={t.id} style={{ border: `1px solid ${MR.border}`, background: MR.panel, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: MR.mono, display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${MR.border}`, fontSize: 11, color: MR.dim, background: MR.darker }}>
              <span># TRADE-{String(241 - i).padStart(4, '0')}</span>
              {t.pl_result && <span style={{ color: MR.up }}>{t.pl_result}{t.duration ? ` · ${t.duration}` : ''}</span>}
            </div>
            <div style={{ padding: 18, flex: 1 }}>
              <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0, color: MR.muted }}>"{t.content}"</p>
            </div>
            <div style={{ borderTop: `1px solid ${MR.border}`, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.member_name}</div>
                {t.member_role && <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 10, marginTop: 2 }}>{t.member_role}</div>}
              </div>
              <div style={{ width: 56, height: 24, background: MR.darker, border: `1px solid ${MR.border}`, padding: 2 }}>
                <svg viewBox="0 0 56 20" width="100%" height="100%">
                  <polyline points="0,16 8,14 16,15 24,10 32,12 40,7 48,8 56,3" fill="none" stroke={MR.up} strokeWidth="1.2" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing({ tiers }: { tiers: PricingTier[] }) {
  
  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  return (
    <section id="kelas" style={{ borderBottom: `1px solid ${MR.border}` }}>
      <div style={{ padding: '56px 40px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.8 }}>// ORDER TICKETS</div>
          <h2 style={{ fontSize: 52, letterSpacing: -1.5, lineHeight: 1, margin: '16px 0 0', fontWeight: 700 }}>Pilih tier kamu.</h2>
        </div>
        <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 12, maxWidth: 360, textAlign: 'right', lineHeight: 1.55 }}>
          Trial bulanan untuk yang baru kenal. Bronze ke atas — sekali bayar, akses seumur hidup. Mau upgrade nanti? Harga yang sudah dibayar jadi kredit.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tiers.length}, 1fr)`, borderTop: `1px solid ${MR.border}` }}>
        {tiers.map((p, i) => {
          const a = TIER_ACCENT[p.accent] ?? TIER_ACCENT['neutral'] ?? { bg: MR.panel, border: MR.border, label: MR.dim };
          return (
            <div key={p.id} style={{ background: a.bg, borderRight: i < tiers.length - 1 ? `1px solid ${MR.border}` : 0, padding: '26px 22px', display: 'flex', flexDirection: 'column', position: 'relative', borderTop: p.is_featured ? `3px solid ${MR.gold}` : 'none', marginTop: p.is_featured ? -3 : 0 }}>
              {p.badge && (
                <div style={{ fontFamily: MR.mono, position: 'absolute', top: p.is_featured ? -3 : 0, right: 0, background: p.is_featured ? MR.gold : MR.darker, color: p.is_featured ? '#181000' : a.label, padding: '5px 9px', fontSize: 10, letterSpacing: 0.6, fontWeight: 700 }}>
                  {p.badge.toUpperCase()}
                </div>
              )}
              <div style={{ fontFamily: MR.mono, color: a.label, fontSize: 11, letterSpacing: 0.6 }}>// {p.tag.toUpperCase()}</div>
              <div style={{ fontWeight: 700, fontSize: 24, letterSpacing: -0.5, margin: '10px 0 4px' }}>{p.name}</div>
              <div style={{ color: MR.dim, fontSize: 13, marginBottom: 22, lineHeight: 1.4 }}>{p.pitch}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 13 }}>Rp</span>
                <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>{fmt(p.price)}</span>
              </div>
              <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, marginBottom: 4 }}>
                {p.original_price && <s style={{ color: MR.dimmer, marginRight: 6 }}>Rp {fmt(p.original_price)}</s>}
                {p.period}
              </div>
              {p.note && <div style={{ fontFamily: MR.mono, color: a.label, fontSize: 10, marginBottom: 18, opacity: 0.85 }}>{p.note}</div>}
              {!p.note && <div style={{ height: 14 }} />}
              <div style={{ borderTop: `1px solid ${MR.border}`, paddingTop: 18, marginBottom: 18, flex: 1 }}>
                {p.perks.map((perk, j) => (
                  <div key={j} style={{ display: 'flex', gap: 10, fontSize: 13, padding: '6px 0', color: MR.muted, lineHeight: 1.4 }}>
                    <span style={{ color: a.label, flexShrink: 0, fontFamily: MR.mono }}>▸</span>
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => window.location.href = `/signup?tier=${p.id}`} style={{ fontFamily: MR.mono, padding: '14px 0', letterSpacing: 0.4, fontSize: 12, fontWeight: 700, background: p.is_featured ? MR.gold : 'transparent', color: p.is_featured ? '#181000' : MR.text, border: p.is_featured ? 'none' : `1px solid ${MR.borderHot}`, cursor: 'pointer' }}>
                {p.is_featured ? `AMBIL ${p.tag.toUpperCase()} ▸` : `PILIH ${p.tag.toUpperCase()} ▸`}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Mentor() {
  const FEATURES = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22ab94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Mentor Review',
      desc: 'Review setup & journaling langsung oleh mentor aktif.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22ab94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      ),
      title: 'Live Session',
      desc: 'Live market, Q&A, dan pembahasan real time.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22ab94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Active Community',
      desc: 'Komunitas trader aktif saling support & sharing.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22ab94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
      title: 'Trade Journal',
      desc: 'Bangun kebiasaan journaling & evaluasi setiap trade.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22ab94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
        </svg>
      ),
      title: 'Execution Focus',
      desc: 'Disiplin eksekusi & risk management yang kuat.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22ab94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
        </svg>
      ),
      title: 'Funding Journey',
      desc: 'Bimbingan menuju akun funded & payout konsisten.',
    },
  ];

  return (
    <section style={{ padding: '80px 40px', borderBottom: `1px solid ${MR.border}`, background: '#080808' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 64, alignItems: 'center' }}>

        {/* Kiri */}
        <div>
          <div style={{ fontFamily: MR.mono, color: '#22ab94', fontSize: 11, letterSpacing: 1.5, marginBottom: 24 }}>
            // INSIDEMENOLAKRUGI
          </div>
          <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05, margin: '0 0 20px' }}>
            Bukan cuma belajar.<br />
            Kamu masuk environment<br />
            trader aktif.
          </h2>
          <p style={{ color: MR.dim, fontSize: 16, lineHeight: 1.65, marginBottom: 40, maxWidth: 380 }}>
            Dapatkan bimbingan, system, dan komunitas aktif yang bantu kamu berkembang lebih cepat & konsisten di market.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <button
              onClick={() => window.location.href = '/signup?tier=gold'}
              style={{ fontFamily: MR.mono, background: '#22ab94', color: '#000', fontWeight: 700, padding: '16px 28px', fontSize: 13, letterSpacing: 0.6, border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              GABUNG SEKARANG ▸
            </button>
            <button
              onClick={() => window.location.href = '/signup?tier=trial'}
              style={{ fontFamily: MR.mono, background: 'transparent', color: MR.text, padding: '16px 28px', fontSize: 13, letterSpacing: 0.6, border: `1px solid ${MR.borderHot}`, cursor: 'pointer', textAlign: 'left' }}
            >
              COBA TRIAL DULU · Rp 99K/BULAN
            </button>
            <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 11, lineHeight: 1.6, marginTop: 4 }}>
              Akses langsung setelah verifikasi pembayaran.<br />
              Upgrade atau berhenti kapan saja.
            </div>
          </div>
        </div>

        {/* Kanan — feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: '#111', border: `1px solid ${MR.border}`, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: -0.2 }}>{f.title}</div>
              <div style={{ color: MR.dim, fontSize: 13, lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}


function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section style={{ padding: '64px 40px', borderBottom: `1px solid ${MR.border}`, display: 'grid', gridTemplateColumns: '360px 1fr', gap: 40 }}>
      <div>
        <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.8 }}>// HELP DESK</div>
        <h2 style={{ fontSize: 44, letterSpacing: -1.2, lineHeight: 1.02, margin: '16px 0 20px', fontWeight: 700 }}>Pertanyaan yang paling sering muncul.</h2>
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
  
  return (
    <section style={{ padding: '80px 40px', borderBottom: `1px solid ${MR.border}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4, ...CANDLE_GRID_STYLE }} />
      <div style={{ position: 'relative', maxWidth: 980 }}>
        <div style={{ fontFamily: MR.mono, color: MR.gold, fontSize: 11, letterSpacing: 0.8 }}>// FINAL CALL</div>
        <h2 style={{ fontSize: 86, letterSpacing: -3, lineHeight: 0.95, margin: '20px 0 28px', fontWeight: 700 }}>
          Pasar buka senin pagi.<br />
          <span style={{ color: MR.dim }}>Kamu udah siap, atau </span><span style={{ color: MR.down }}>masih nebak?</span>
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => window.location.href = '/signup?tier=gold'} style={{ fontFamily: MR.mono, background: MR.gold, color: '#181000', padding: '18px 26px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, border: 'none', cursor: 'pointer' }}>MULAI DENGAN GOLD ▸</button>
          <button onClick={() => window.location.href = '/signup?tier=trial'} style={{ fontFamily: MR.mono, border: `1px solid ${MR.borderHot}`, padding: '18px 26px', fontSize: 13, letterSpacing: 0.4, background: 'transparent', color: MR.text, cursor: 'pointer' }}>COBA TRIAL · Rp 99K</button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const SOCIALS = [
    { label: 'Discord',  href: 'https://discord.gg/d2Tpf6sGMr',  icon: '💬' },
    { label: 'Telegram', href: 'https://t.me/+_azyX2h9oFhmNjNl', icon: '📢' },
    { label: 'TikTok',   href: 'https://www.tiktok.com/@menolakrugi',   icon: '🎵' },
    { label: 'YouTube',  href: 'https://youtube.com/@menolakrugi',  icon: '▶' },
    { label: 'WhatsApp', href: 'https://wa.me/6281242224939',  icon: '📱' },
  ];
  return (
    <footer style={{ padding: '48px 40px 32px', background: MR.dark }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(3, 1fr)', gap: 32, marginBottom: 36 }}>
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
  const { testimonials } = useApprovedTestimonials(6);
  const { tiers }        = usePricing();

  return (
    <div style={{ fontFamily: MR.sans, color: MR.text, background: MR.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 767px) {
          .mr-nav-links { display: none !important; }
          .mr-hero-grid { grid-template-columns: 1fr !important; }
          .mr-hero-text h1 { font-size: 40px !important; letter-spacing: -1px !important; }
          .mr-hero-text p { font-size: 15px !important; }
          .mr-hero-section { padding: 48px 16px 40px !important; }
          .mr-hero-widget { display: none !important; }
          .mr-stats-row { flex-wrap: wrap; gap: 16px !important; padding: 20px 16px !important; }
          .mr-curriculum-grid { grid-template-columns: 1fr !important; }
          .mr-pricing-grid { grid-template-columns: 1fr !important; }
          .mr-section { padding: 40px 16px !important; }
          .mr-section-lg { padding: 48px 16px !important; }
          .mr-topbar { padding: 0 16px !important; }
          .mr-cta-btns { flex-direction: column !important; }
          .mr-login-btn span { display: none !important; }
          .mr-hero-h1 { font-size: 40px !important; letter-spacing: -1px !important; line-height: 1.1 !important; }
        }
      `}</style>
      <TVTickerTape />
      <StatusBar />
      <NavBar />
      <Hero
        memberCount={stats?.memberCount ?? 0}
        fundedCount={stats?.fundedCount ?? 0}
        newThisMonth={stats?.newMembersThisMonth ?? 0}
      />
      <Manifesto />
      <Curriculum />
      {testimonials.length > 0 && <Testimonials testimonials={testimonials} />}
      <Mentor />
      {tiers.length > 0 && <Pricing tiers={tiers} />}
      <FaqSection />
      <CTA />
      <Footer />
    </div>
  );
}
