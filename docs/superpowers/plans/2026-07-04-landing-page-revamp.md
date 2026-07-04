# Landing Page Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `src/pages/LandingPage.tsx` from the current dark-terminal visual style to a terang/minimalis (Swiss Modernism / clean SaaS) style, per `docs/superpowers/specs/2026-07-04-landing-page-revamp-design.md`.

**Architecture:** One file (`LandingPage.tsx`) keeps its existing convention — every section is a local function component, no new files. A new isolated CSS token scope (`.mr-landing-v2`) is added to `src/index.css` so the rest of the app (dashboard, login, admin — all still dark-terminal) is untouched. All Supabase data hooks/queries are reused unmodified; only rendering changes.

**Tech Stack:** React + TypeScript, inline styles (no CSS-in-JS lib), Tailwind utility classes not used on this page (matches existing convention), `lucide-react` for icons (already a dependency), Geist/Geist Mono fonts (already loaded).

## Global Constraints

- Landing page is locked to the new light style — no dark/light toggle on this page (toggle button removed from `NavBar`; global theme toggle elsewhere in the app is untouched).
- New color tokens (`--lp-*`) live in a `.mr-landing-v2` scope in `src/index.css` — never modify `:root` or `[data-theme="light"]` (those are shared with the rest of the app).
- No emoji used as structural/functional icons anywhere on this page — use `lucide-react` icons instead. Decorative Unicode bullets already used for non-icon purposes are fine to keep only where explicitly noted.
- No new npm dependencies.
- Do not modify: `App.tsx` routing, any Supabase query/hook (`useLandingStats`, `useApprovedTestimonials`, `usePricing`, `useLandingPreview`, the leaderboard aggregation logic), or any other page file.
- **No test suite exists in this project** (confirmed in `CLAUDE.md`: "There is no test suite. Validate changes by running the dev server."). Every task below substitutes the TDD test-cycle with: (1) `npm run typecheck` must stay clean, and (2) a scripted manual visual check against the running dev server (already up at `http://localhost:5174/` in this session — if it's not running, start with `npm run dev`).
- Follow existing per-component patterns already in this file: local `isMobile` state via `matchMedia('(max-width: 767px)')` (copy-pasted per component, not extracted — this is the established convention, don't refactor it), `useFadeUp`/`useInView`/`useCounter` hooks (defined once near the top of the file, unchanged, reused by every section).

---

## Task 1: Design Tokens + NavBar + Root Wrapper

**Files:**
- Modify: `src/index.css` (add new block)
- Modify: `src/pages/LandingPage.tsx` (imports, add `LP` const, rewrite `NavBar()`, update root wrapper + top of `LandingPage()` export)

**Interfaces:**
- Produces: `LP` token object (module-level const in `LandingPage.tsx`) — consumed by every subsequent task. Shape:
  ```ts
  const LP = {
    bg: string, surface: string, text: string, muted: string, border: string,
    primary: string, primaryHover: string, primaryTint: string, danger: string,
    sans: string, mono: string, radius: number, radiusSm: number,
    shadowSm: string, shadowMd: string,
  };
  ```
- Produces: `.mr-landing-v2` CSS class — must be applied to the outermost `<div>` returned by `LandingPage()` for `var(--lp-*)` to resolve in any child.

- [ ] **Step 1: Add the new CSS token block to `src/index.css`**

Add this block anywhere after the existing `[data-theme="light"] { ... }` block (do not edit that block):

```css
.mr-landing-v2 {
  --lp-bg:            #FAFAFA;
  --lp-surface:       #FFFFFF;
  --lp-text:          #0F172A;
  --lp-muted:         #64748B;
  --lp-border:        #E5E7EB;
  --lp-primary:       #16a34a;
  --lp-primary-hover: #15803d;
  --lp-primary-tint:  rgba(22,163,74,0.08);
  --lp-danger:        #ef4444;
}
```

- [ ] **Step 2: Update imports in `src/pages/LandingPage.tsx`**

Replace the import block (current lines 5-12):

```ts
import React, { useState } from 'react';

import { MR, TIER_ACCENT } from '../lib/theme';
import { MRLogo, Ticker, StatusBar, TVTickerTape, CandleChart, CANDLE_GRID_STYLE } from '../components/mr';
import { useLandingStats, useApprovedTestimonials, usePricing, useLandingPreview } from '../hooks';
import type { LandingPreviewConfig } from '../hooks';
import type { PricingTier, Testimonial } from '../types/mr.types';
import { supabase } from '../lib/supabase';
```

with:

```ts
import React, { useState } from 'react';
import { Menu, X, Star, ChevronDown, MessageCircle, Send, Music2, Youtube, Phone } from 'lucide-react';

import { MR } from '../lib/theme';
import { MRLogo, CandleChart } from '../components/mr';
import { useLandingStats, useApprovedTestimonials, usePricing, useLandingPreview } from '../hooks';
import type { LandingPreviewConfig } from '../hooks';
import type { PricingTier, Testimonial } from '../types/mr.types';
import { supabase } from '../lib/supabase';
```

(`MR` stays for now — later sections not yet migrated in this task still reference it. `TIER_ACCENT`, `Ticker`, `StatusBar`, `TVTickerTape`, `CANDLE_GRID_STYLE` were unused or are being dropped from render — removed here to avoid unused-import lint errors as soon as their last usage disappears in later tasks. If `npm run lint` flags `MR` as unused before all tasks are done, ignore it until Task 12, which removes it for good.)

- [ ] **Step 3: Add the `LP` token object**

Add directly after the imports, before the `BASIC_MODULES` constant:

```ts
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
```

- [ ] **Step 4: Rewrite `NavBar()`**

Replace the entire existing `NavBar()` function (from `function NavBar() {` through its closing `}`, currently spanning roughly lines 96-241) with:

```tsx
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
```

- [ ] **Step 5: Apply `.mr-landing-v2` to the root wrapper and drop `Ticker`/`StatusBar`**

In the `LandingPage()` export at the bottom of the file, change the opening `<div>`:

```tsx
<div className="mr-landing-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
```

and remove these two lines (they render the always-dark ticker tape and session clock, which have no light variant and don't fit the new style):

```tsx
      {/* 1 — Ticker pair (chrome paling atas) */}
      <Ticker />

      {/* 2 — Navbar */}
      <StatusBar />
```

leaving `<NavBar />` as the first rendered element.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no new errors introduced by this task (pre-existing unused-import warnings for `MR` are fine at this stage — later tasks resolve them).

- [ ] **Step 7: Visual check**

With the dev server running at `http://localhost:5174/`, reload the page and confirm:
- The top ticker tape and clock strip are gone — `NavBar` is the first thing at the top of the page.
- `NavBar` background is white/light, sticky, no theme-toggle button, no emoji icons in the nav links.
- Scrolling down slightly makes the nav bar get a blurred semi-transparent background + subtle shadow.
- Everything **below** the nav (Hero downward) is still the old dark styling — this is expected and gets fixed in later tasks.
- Resize to a narrow (mobile) viewport: nav links collapse, hamburger button appears, tapping it opens a bottom sheet menu with the same links + Masuk/Mulai buttons.

- [ ] **Step 8: Commit**

```bash
git add src/index.css src/pages/LandingPage.tsx
git commit -m "feat: tambah design token landing v2 dan restyle NavBar terang"
```

---

## Task 2: Hero

**Files:**
- Modify: `src/pages/LandingPage.tsx` (rewrite `Hero()`)

**Interfaces:**
- Consumes: `LP` tokens (Task 1), `CandleChart` component (unchanged import), `useState`/`React.useEffect` isMobile pattern (unchanged).
- Produces: no props, no external consumers — `Hero()` is called with no arguments from `LandingPage()`.

- [ ] **Step 1: Rewrite `Hero()`**

Replace the entire existing `Hero()` function with:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean (no new errors).

- [ ] **Step 3: Visual check**

Reload `http://localhost:5174/`. Confirm:
- Hero background is now light, headline is large & bold dark text with the second line in green.
- Desktop (wide window): a white card with a 3-dot "browser toolbar" strip and a candlestick chart sits to the right of the headline.
- Mobile width (<768px): the chart card is hidden, headline shrinks to ~34px, layout is single column.
- Both CTA buttons work (Pilih Kelas → `/signup`, Lihat Kurikulum scrolls down to the Kurikulum section — still styled old/dark for now, that's expected until Task 7).

- [ ] **Step 4: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: restyle Hero landing page ke tema terang"
```

---

## Task 3: StatsBar

**Files:**
- Modify: `src/pages/LandingPage.tsx` (rewrite `StatsBar()`)

**Interfaces:**
- Consumes: `LP` tokens, `useInView`/`useCounter` hooks (unchanged).
- Produces: same prop signature as before — `{ memberCount: number; fundedCount: number; newThisMonth: number }` — called from `LandingPage()` exactly as it is today; do not change the call site in this task.

- [ ] **Step 1: Rewrite `StatsBar()`**

Replace the entire existing `StatsBar()` function with:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Visual check**

Reload the page, scroll to the stats row right below Hero. Confirm: 4 light cards with soft shadow, numbers count up from 0 when the section scrolls into view, green color on "MEMBER AKTIF"/"FUNDED LULUS" values, 2-column grid on mobile width.

- [ ] **Step 4: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: restyle StatsBar landing page ke tema terang"
```

---

## Task 4: Bukti Hasil (merge LandingLeaderboard + Mentor)

**Files:**
- Modify: `src/pages/LandingPage.tsx` (delete `LandingLeaderboard()` and `Mentor()`, add `BuktiHasil()`)

**Interfaces:**
- Consumes: `LP` tokens, `supabase` client (unchanged query shape), `useFadeUp` hook.
- Produces: `BuktiHasil()` — no props, called from `LandingPage()` in place of the old (dead-code, never-rendered) `LandingLeaderboard`/`Mentor`.

Context: `LandingLeaderboard()` and `Mentor()` currently exist in the file but are **not called anywhere** in the `LandingPage()` export — they're dead code. This task revives their content as a single new "Bukti Hasil" section: a top-3 leaderboard (reusing the exact same data-fetch/aggregation logic, trimmed to top 3 only) plus the mentor value-prop feature grid underneath.

**Deviation from the spec's literal wording:** the design spec describes this section as including "foto, funded proof, quote" for the mentor. The codebase has no mentor photo asset, no funded-account screenshot, and no stored quote text anywhere (`Mentor()`'s actual content is a headline + a 6-item feature grid, nothing else) — inventing a photo/quote would mean fabricating content not backed by any data source, which this plan avoids. Task 4 instead carries over `Mentor()`'s real existing content (headline + all 6 feature titles/descriptions, restyled) verbatim, so no copy is lost and nothing is fabricated.

- [ ] **Step 1: Delete `LandingLeaderboard()` and `Mentor()`**

Delete both entire function bodies (`function LandingLeaderboard() { ... }` and `function Mentor() { ... }`).

- [ ] **Step 2: Add `BuktiHasil()` in their place**

```tsx
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
```

(Note: the original `Mentor()` inline SVG icon set is dropped in favor of plain text cards — kept the exact same 6 titles/descriptions so no copy is lost, per the flat/minimal spec direction that avoids decorative icon-per-card unless it adds real information.)

- [ ] **Step 3: Wire it into the render** (temporary — final placement happens in Task 12, but add the call now so it's visible during this task's QA)

In `LandingPage()`, find the current gap between `<StatsBar ... />` and `{preview && <ProductPreview ... />}` and insert:

```tsx
      <BuktiHasil />
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: clean (this also resolves the "unused `useState`-adjacent" concerns — no action needed if clean).

- [ ] **Step 5: Visual check**

Reload the page. If there is trading-journal data in the dev Supabase instance, confirm a "Bukat Hasil" section appears right after the stats cards, showing up to 3 ranked rows (numbered badge, name, tier, win rate, equity gain) followed by a 3-column feature grid. If there's no journal data at all, the section renders nothing (`return null`) — that's correct, matches prior behavior of the dead `LandingLeaderboard`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: hidupkan & gabung LandingLeaderboard+Mentor jadi section Bukti Hasil"
```

---

## Task 5: ProductPreview

**Files:**
- Modify: `src/pages/LandingPage.tsx` (rewrite `ProductPreview()`)

**Interfaces:**
- Consumes: `LP` tokens. Prop signature unchanged: `{ config: LandingPreviewConfig }`.
- Produces: same as before, called as `{preview && <ProductPreview config={preview} />}` — call site untouched in this task.

- [ ] **Step 1: Rewrite `ProductPreview()`**

Replace the entire existing function with:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Visual check**

Reload. Confirm the preview section shows a light card with the embedded YouTube preview (if `landing_preview_config` has a `yt_url` set in the dev database) and 3 light plan cards, the middle one outlined green with a "PALING POPULER" pill. If the config row has no `yt_url`, the video block is simply absent (unchanged conditional logic) — that's correct.

- [ ] **Step 4: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: restyle ProductPreview landing page ke tema terang"
```

---

## Task 6: Pricing

**Files:**
- Modify: `src/pages/LandingPage.tsx` (rewrite `Pricing()`, replace the `TIER_STYLE` const above it)

**Interfaces:**
- Consumes: `LP` tokens. Prop signature unchanged: `{ tiers: PricingTier[] }`.
- Produces: same as before, called as `{tiers.length > 0 && <Pricing tiers={tiers} />}` — call site untouched in this task.

- [ ] **Step 1: Replace the `TIER_STYLE` const**

Replace:

```ts
const TIER_STYLE: Record<string, { bg: string; accent: string; border: string }> = {
  neutral:  { bg: 'linear-gradient(160deg,#061310 0%,var(--mr-bg) 100%)', accent: '#22c55e', border: '#22c55e28' },
  bronze:   { bg: 'linear-gradient(160deg,#120700 0%,var(--mr-bg) 100%)', accent: '#f97316', border: '#f9731628' },
  gold:     { bg: 'linear-gradient(160deg,#140e00 0%,var(--mr-bg) 100%)', accent: '#eab308', border: '#eab30828' },
  platinum: { bg: 'linear-gradient(160deg,#0e0820 0%,var(--mr-bg) 100%)', accent: '#a855f7', border: '#a855f728' },
};
```

with:

```ts
const TIER_ACCENT_COLOR: Record<string, string> = {
  neutral:  '#16a34a',
  bronze:   '#c2740b',
  gold:     '#b8860b',
  platinum: '#7c3aed',
};
```

- [ ] **Step 2: Rewrite `Pricing()`**

```tsx
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
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Visual check**

Reload. Confirm pricing cards render light with rounded corners, the featured tier has a green outline + "PALING POPULER"/badge pill, checkmarks (✓) instead of the old ▸ arrows, and the Partnership card (dashed border) renders as the last column.

- [ ] **Step 5: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: restyle Pricing landing page ke tema terang"
```

---

## Task 7: Curriculum

**Files:**
- Modify: `src/pages/LandingPage.tsx` (rewrite `Curriculum()`)

**Interfaces:**
- Consumes: `LP` tokens, existing `BASIC_MODULES`/`ADVANCED_MODULES` constants (unchanged), `useFadeUp` hook.
- Produces: no props, called from `LandingPage()` unchanged.

- [ ] **Step 1: Rewrite `Curriculum()`**

Replace the entire existing function (keep the same accordion mechanic — `activeBasic`/`activeAdv` state — just restyle colors):

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Visual check**

Reload, scroll to Kurikulum. Confirm two light columns (Basic left, Advanced right — stacked on mobile), each module row expands/collapses on click with a chevron icon rotating, expanded background light green tint.

- [ ] **Step 4: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: restyle Curriculum landing page ke tema terang"
```

---

## Task 8: Komunitas (merge GallerySlider + DiscordCTA)

**Files:**
- Modify: `src/pages/LandingPage.tsx` (delete `GallerySlider()` and `DiscordCTA()`, add `Komunitas()`)

**Interfaces:**
- Consumes: `LP` tokens, `supabase` client (same `landing_gallery` query), `useFadeUp` hook.
- Produces: `Komunitas()` — no props.

- [ ] **Step 1: Delete `GallerySlider()` and `DiscordCTA()`**

Delete both entire function bodies.

- [ ] **Step 2: Add `Komunitas()` in their place**

```tsx
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

  const prev = () => setCur(c => (c - 1 + images.length) % images.length);
  const next = () => setCur(c => (c + 1) % images.length);

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
                    <img src={img.url} alt={img.caption || `galeri-${i + 1}`} style={{ width: '100%', height: isMobile ? 220 : 400, objectFit: 'cover', display: 'block' }} />
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
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Visual check**

Reload. Confirm one "Komunitas" section renders with a light-background header, an image carousel (if `landing_gallery` has active rows in the dev database — otherwise the carousel block is simply absent, correct per the `images.length > 0` guard) and two solid-color CTA buttons (Discord blurple, Telegram outline) with lucide icons instead of the previous inline SVGs/emoji.

- [ ] **Step 5: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: gabung GallerySlider+DiscordCTA jadi section Komunitas terang"
```

---

## Task 9: Testimonials

**Files:**
- Modify: `src/pages/LandingPage.tsx` (rewrite `Testimonials()`)

**Interfaces:**
- Consumes: `LP` tokens, `useFadeUp` hook, `Star` icon from `lucide-react` (imported in Task 1).
- Produces: same prop signature as before — `{ testimonials: Testimonial[] }` — call site unchanged.

- [ ] **Step 1: Rewrite `Testimonials()`**

```tsx
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
```

(The previous left/right arrow buttons are dropped in favor of dot navigation only + hover-to-pause, matching the flatter minimal-chrome direction; dots remain fully clickable so navigation isn't lost.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Visual check**

Reload, scroll to testimonials. Confirm light cards with filled green star ratings, a rotating carousel of 3-at-a-time cards on desktop / 1 on mobile, clickable dot indicators below.

- [ ] **Step 4: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: restyle Testimonials landing page ke tema terang"
```

---

## Task 10: FaqSection

**Files:**
- Modify: `src/pages/LandingPage.tsx` (rewrite `FaqSection()`)

**Interfaces:**
- Consumes: `LP` tokens, existing `FAQ` constant (unchanged), `useFadeUp` hook, `ChevronDown` icon.
- Produces: no props, called from `LandingPage()` unchanged.

- [ ] **Step 1: Rewrite `FaqSection()`**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Visual check**

Reload, scroll to FAQ. Confirm light background, chevron rotates on open/close, only one item open at a time (existing `open` state behavior unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: restyle FaqSection landing page ke tema terang"
```

---

## Task 11: CTA (revive) + Footer

**Files:**
- Modify: `src/pages/LandingPage.tsx` (rewrite `CTA()`, rewrite `Footer()`)

**Interfaces:**
- Consumes: `LP` tokens, `useFadeUp` hook, `MRLogo` component, lucide icons `MessageCircle`, `Send`, `Music2`, `Youtube`, `Phone` (imported Task 1).
- Produces: `CTA()` and `Footer()`, no props, both called from `LandingPage()`.

`CTA()` currently exists but is dead code (never rendered) — this task revives it as the closing banner before the footer.

- [ ] **Step 1: Rewrite `CTA()`**

```tsx
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
```

- [ ] **Step 2: Rewrite `Footer()`**

```tsx
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
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Visual check**

Reload and scroll to the very bottom. Confirm a solid green CTA banner sits above the footer, and the footer is light with icon (not emoji) social links, 4-column layout collapsing to 2 on mobile.

- [ ] **Step 5: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: hidupkan CTA penutup dan restyle Footer ke tema terang"
```

---

## Task 12: Final Wiring, Cleanup & Full QA Pass

**Files:**
- Modify: `src/pages/LandingPage.tsx` (delete `Manifesto()`, fix final render order in `LandingPage()`, remove unused imports/consts, trim unused keyframes)

**Interfaces:**
- Consumes: everything produced by Tasks 1–11.
- Produces: the final `LandingPage` default export — no other file consumes this page directly except `src/App.tsx`'s existing `<LandingPage />` render for `/`, which is not touched.

- [ ] **Step 1: Delete `Manifesto()`**

Delete the entire `function Manifesto() { ... }` body — it's superseded by the new Hero copy per the spec.

- [ ] **Step 2: Set the final render order in `LandingPage()`**

Replace the body of the `return (...)` in `LandingPage()` with:

```tsx
    <div className="mr-landing-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
      <style>{`
        .mr-nav-links { display: flex; }
        .mr-curriculum-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 767px) {
          .mr-nav-links { display: none !important; }
          .mr-nav-topbar { padding: 10px 16px !important; }
          .mr-mobile-nav-right { display: flex !important; }
          .mr-hero-h1 { font-size: 34px !important; letter-spacing: -1px !important; }
          .mr-curriculum-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes mr-fadeup { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mr-fadein { from { opacity: 0; } to { opacity: 1; } }
        .mr-anim-badge { animation: mr-fadein  0.4s ease both; }
        .mr-anim-h1-1  { animation: mr-fadeup  0.6s ease 0.12s both; }
        .mr-anim-h1-2  { animation: mr-fadeup  0.6s ease 0.24s both; }
        .mr-anim-desc  { animation: mr-fadeup  0.6s ease 0.36s both; }
        .mr-anim-cta   { animation: mr-fadeup  0.6s ease 0.48s both; }
        .mr-anim-stat-0 { animation: mr-fadeup 0.5s ease 0s   both; }
        .mr-anim-stat-1 { animation: mr-fadeup 0.5s ease 0.1s both; }
        .mr-anim-stat-2 { animation: mr-fadeup 0.5s ease 0.2s both; }
        .mr-anim-stat-3 { animation: mr-fadeup 0.5s ease 0.3s both; }
        @keyframes mr-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        .mr-blink { animation: mr-blink 1s steps(1) infinite; }
      `}</style>

      <NavBar />
      <Hero />
      <StatsBar
        memberCount={stats?.memberCount ?? 0}
        fundedCount={stats?.fundedCount ?? 0}
        newThisMonth={stats?.newMembersThisMonth ?? 0}
      />
      <BuktiHasil />
      {preview && <ProductPreview config={preview} />}
      {tiers.length > 0 && <Pricing tiers={tiers} />}
      <Curriculum />
      <Komunitas />
      {testimonials.length > 0 && <Testimonials testimonials={testimonials} />}
      <FaqSection />
      <CTA />
      <Footer />
    </div>
```

(Dropped keyframes/classes that no longer have any consumer after the restyle: `mr-ticker`, `mr-shimmer-sweep`/`.mr-btn-shimmer`, `mr-card-glow`, `.mr-section-pad`, `.mr-pricing-card` hover-transform rule, and the now-unused per-line-of-headline `mr-anim-h1-3`/`mr-anim-h1-4` classes since the new Hero headline is 2 lines, not 4.)

- [ ] **Step 3: Remove the now-unused `MR` import**

Confirm no function in the file still references `MR.` (search the file for `MR\.` — Task 1 already removed `TIER_ACCENT`, `Ticker`, `StatusBar`, `TVTickerTape`, `CANDLE_GRID_STYLE`). If clean, change:

```ts
import { MR } from '../lib/theme';
```

to fully removing that line.

- [ ] **Step 4: Full typecheck + lint**

Run: `npm run typecheck`
Expected: 0 errors.

Run: `npm run lint`
Expected: 0 errors (warnings about pre-existing patterns elsewhere in the codebase, unrelated to this file, are out of scope).

- [ ] **Step 5: Full visual QA pass**

With the dev server at `http://localhost:5174/`, walk the entire page top to bottom at three widths — 375px (mobile), 768px (tablet), 1440px (desktop) — using the browser's responsive device toolbar. For each width confirm:
- No horizontal scrollbar appears anywhere.
- Every section uses the light palette (white/`#FAFAFA` backgrounds, dark text, green accents) — no leftover dark-terminal panel is visible anywhere on the page.
- No emoji renders anywhere except inside a `console.log`/comment (none should be visible in the rendered UI).
- All CTA buttons navigate correctly: `/signup`, `/login`, `/member` (only when a `mr_member` value exists in storage), `/bayar?plan=...`, `/partnership`, `/calendar`, `/komunitas`, and the in-page anchors `#kurikulum`/`#kelas`.
- Section order matches: NavBar → Hero → Stats → Bukti Hasil (or absent if no journal data) → Product Preview (or absent if no `yt_url`) → Pricing → Curriculum → Komunitas → Testimonials (or absent if none approved) → FAQ → CTA → Footer.

- [ ] **Step 6: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: finalisasi urutan render, hapus Manifesto & kode mati landing page"
```

---

## Self-Review Notes

- **Spec coverage:** every row of the spec's section-mapping table (NavBar, Hero, Stats, Bukti Hasil, Preview Produk, Pricing, Kurikulum, Komunitas, Testimoni, FAQ, CTA penutup, Footer, Manifesto removal, Ticker/StatusBar removal, token isolation, icon replacement) maps to exactly one task above.
- **Type consistency:** `LP` token names (`bg`, `surface`, `text`, `muted`, `border`, `primary`, `primaryHover`, `primaryTint`, `danger`, `sans`, `mono`, `radius`, `radiusSm`, `shadowSm`, `shadowMd`) are defined once in Task 1 and referenced identically (no renames) in every later task's code.
- **No placeholders:** every step contains complete, directly-usable TSX/CSS — none of the "implement later" patterns.
