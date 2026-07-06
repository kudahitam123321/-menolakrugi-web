# Halaman Pricing Terpisah + Perbaikan Order Signup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pisahkan pricing kelas & indikator dari landing page jadi 2 halaman berdiri sendiri (`/pricing-kelas`, `/pricing-indikator`), dan perbaiki `/signup` → `/payment` supaya order member baru tercatat nyata di Supabase dengan metode pembayaran asli — bukan lagi data statis/acak.

**Architecture:** React + TypeScript, tanpa routing library (path dicek manual di `getPage()`/`App.tsx`). 2 file halaman baru mengikuti pola file flat yang sudah ada di `src/pages/`, masing-masing mendefinisikan token `LP` lokal sendiri (tidak ada shared import token lintas file — konvensi codebase). `SignupPage.tsx`/`PaymentPage.tsx` tetap pakai `MR` dari `src/lib/theme.ts` (pola lama yang sudah ada di kedua file itu, tidak diubah ke `LP`).

**Tech Stack:** React + TypeScript, Supabase JS client, inline styles, `lucide-react`. Tidak ada test suite — verifikasi lewat `npm run typecheck`, `npm run build`, dan `npm run dev` manual di browser.

## Global Constraints

- Spec sumber: `docs/superpowers/specs/2026-07-06-pricing-signup-order-revamp-design.md` — baca dulu sebelum eksekusi task manapun.
- **Di luar scope, JANGAN disentuh**: `src/pages/CheckoutPage.tsx`, route `/checkout`, jalur upgrade tier member (link `/checkout` di `src/pages/DashboardPage.tsx` & `src/pages/member/DashboardPage.tsx`), `src/pages/BayarPage.tsx`, `src/pages/BayarAkunPage.tsx`, tab Produk di `src/pages/member/DashboardPage.tsx`.
- Tidak ada migrasi/perubahan skema Supabase — tabel `orders` sudah punya semua kolom yang dibutuhkan (`product_id` nullable, `member_id`, `nama_member`, `email_member` nullable, `tier_member`, `status`, `catatan` nullable).
- Tidak ada dependency npm baru.
- Tidak ada perubahan ke `CLAUDE.md` sebagai bagian dari plan ini (update dokumentasi dilakukan terpisah setelah implementasi kelar).
- Verifikasi tiap task: `npm run typecheck` (bandingkan delta di file yang disentuh terhadap baseline di bawah) — TIDAK ADA task yang boleh menambah error baru selain yang secara eksplisit disebutkan sebagai "diharapkan" di task itu sendiri.

### Baseline (catat sebelum Task 1, jangan diturunkan ulang)

Jalankan dan catat sebelum mulai:
```bash
npm run typecheck 2>&1 | grep -E "LandingPage|SignupPage|PaymentPage|App.tsx"
```

Harus persis cocok dengan ini (semua pre-existing, TIDAK diperbaiki oleh plan ini kecuali disebutkan eksplisit di task tertentu):
```
src/App.tsx(1,1): error TS6133: 'Navbar' is declared but its value is never read.
src/App.tsx(2,1): error TS6133: 'Hero' is declared but its value is never read.
src/App.tsx(3,1): error TS6133: 'Courses' is declared but its value is never read.
src/App.tsx(4,1): error TS6133: 'Partnership' is declared but its value is never read.
src/App.tsx(5,1): error TS6133: 'Testimonials' is declared but its value is never read.
src/App.tsx(6,1): error TS6133: 'FAQ' is declared but its value is never read.
src/App.tsx(7,1): error TS6133: 'Social' is declared but its value is never read.
src/App.tsx(8,1): error TS6133: 'AboutUs' is declared but its value is never read.
src/App.tsx(9,1): error TS6133: 'Footer' is declared but its value is never read.
src/App.tsx(13,1): error TS6133: 'MemberPage' is declared but its value is never read.
src/App.tsx(14,1): error TS6133: 'AdminPage' is declared but its value is never read.
src/App.tsx(20,1): error TS6133: 'NewPaymentPage' is declared but its value is never read.
src/pages/SignupPage.tsx(7,14): error TS6133: 'TIER_ACCENT' is declared but its value is never read.
src/pages/SignupPage.tsx(126,16): error TS6133: 'setStep' is declared but its value is never read.
```
`LandingPage.tsx` dan `PaymentPage.tsx` punya **0 error** saat ini.

**Tren error yang diharapkan per task:**
- Task 4 (SignupPage.tsx) menghapus state `step`/`setStep` seluruhnya → error `'setStep' is declared but its value is never read` di baris 126 **hilang** (turun jadi cuma 1 error tersisa: `TIER_ACCENT`, pre-existing, tidak diperbaiki plan ini).
- Task lain: 0 delta di file yang disentuh (App.tsx tetap 12 error yang sama, LandingPage.tsx & PaymentPage.tsx tetap 0, file baru `PricingKelasPage.tsx`/`PricingIndikatorPage.tsx` harus 0 error sejak dibuat).

Kalau delta di task manapun tidak cocok dengan yang diharapkan, itu regresi — jangan lanjut ke task berikutnya sebelum diperbaiki.

---

### Task 1: Halaman `/pricing-indikator` (pindahan `ProductPreview`)

**Files:**
- Create: `src/pages/PricingIndikatorPage.tsx`
- Modify: `src/App.tsx` (tambah import + routing)

**Interfaces:**
- Consumes: hook `useLandingPreview()` dan tipe `LandingPreviewConfig` dari `src/hooks/index.ts` (sudah ada, tidak diubah).
- Produces: route `/pricing-indikator` yang bisa diakses langsung via URL, dipakai Task 3 (tombol hero `LandingPage.tsx`) dan Task 2 tidak bergantung pada task ini.

- [ ] **Step 1: Buat file `src/pages/PricingIndikatorPage.tsx`**

Isi persis (komponen `ProductPreview` di bawah adalah copy 1:1 dari `src/pages/LandingPage.tsx` baris 579-659, tanpa perubahan logic/style):

```tsx
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
```

- [ ] **Step 2: Tambah routing di `src/App.tsx`**

Cari blok import di bagian "Halaman baru (Direction A · Terminal)" (sekitar baris 17-29), tambah 1 baris setelah `import BayarAkunPage from './pages/BayarAkunPage';`:

```tsx
import PricingIndikatorPage from './pages/PricingIndikatorPage';
```

Cari fungsi `getPage()`, tambah 1 baris setelah `if (path === '/bayar/akun') return 'bayar-akun';`:

```tsx
  if (path === '/pricing-indikator')      return 'pricing-indikator';
```

Cari bagian render "Halaman baru", tambah 1 baris setelah `if (page === 'bayar-akun') return <BayarAkunPage />;`:

```tsx
  if (page === 'pricing-indikator') return <PricingIndikatorPage />;
```

- [ ] **Step 3: Verifikasi typecheck**

```bash
npm run typecheck 2>&1 | grep -E "PricingIndikatorPage|App.tsx"
```
Expected: `PricingIndikatorPage.tsx` 0 error baru; `App.tsx` masih persis 12 error baseline (tidak bertambah).

- [ ] **Step 4: Verifikasi manual**

Jalankan `npm run dev`, buka `http://localhost:5173/pricing-indikator` langsung di browser. Pastikan: 3 kartu paket (Bulanan/Tahunan/Lifetime) tampil dengan harga dari `landing_preview_config`, tombol "Pilih ... →" mengarah ke `/bayar?plan=bulanan` dst. (cek atribut link / klik salah satu dan pastikan mendarat di `/bayar`).

- [ ] **Step 5: Commit**

```bash
git add src/pages/PricingIndikatorPage.tsx src/App.tsx
git commit -m "feat: tambah halaman /pricing-indikator (pindahan dari ProductPreview landing page)"
```

---

### Task 2: Halaman `/pricing-kelas` (kartu pricing tier baru + pindahan `Curriculum`)

**Files:**
- Create: `src/pages/PricingKelasPage.tsx`
- Modify: `src/App.tsx` (tambah import + routing)

**Interfaces:**
- Consumes: hook `usePricing()` dari `src/hooks/index.ts` (sudah ada, mengembalikan `{ tiers: PricingTier[], loading: boolean }`, tiers sudah difilter `active=true` dan diurutkan `sort_order` oleh hook itu sendiri — tidak perlu filter/sort ulang di halaman ini). Tipe `PricingTier` dari `src/types/mr.types.ts`.
- Produces: route `/pricing-kelas` (dengan anchor `id="kurikulum"` di dalamnya) yang dipakai Task 3 (tombol hero & nav `LandingPage.tsx`).

- [ ] **Step 1: Buat file `src/pages/PricingKelasPage.tsx`**

`Curriculum`, `ModCard`, `BASIC_MODULES`, `ADVANCED_MODULES`, `useInView`, `useFadeUp` di bawah adalah copy 1:1 dari `src/pages/LandingPage.tsx` (baris 36-99 untuk kedua const modul, baris 243-264 untuk kedua hook, baris 341-416 untuk `Curriculum`/`ModCard`) — tanpa perubahan logic/style. `TierPricing` adalah komponen baru (lihat Koreksi Penting di spec — tidak ada kartu pricing tier yang sudah ada untuk dipindah).

```tsx
// pages/PricingKelasPage.tsx — Halaman pricing kelas membership + kurikulum
// URL: /pricing-kelas (anchor #kurikulum untuk section kurikulum)

import React from 'react';
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

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
          {tiers.map(tier => (
            <div key={tier.id} style={{
              borderRadius: LP.radius, padding: '26px 22px', background: LP.surface,
              border: tier.is_featured ? `2px solid ${LP.primary}` : `1px solid ${LP.border}`,
              boxShadow: tier.is_featured ? LP.shadowMd : LP.shadowSm,
              display: 'flex', flexDirection: 'column' as const, position: 'relative' as const,
            }}>
              {tier.badge && (
                <div style={{ position: 'absolute', top: -12, left: 20, background: tier.is_featured ? LP.primary : LP.text, color: '#fff', padding: '4px 12px', fontSize: 10, letterSpacing: 0.6, fontWeight: 700, borderRadius: 20, whiteSpace: 'nowrap' as const }}>
                  {tier.badge.toUpperCase()}
                </div>
              )}
              <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, letterSpacing: 1, marginTop: tier.badge ? 8 : 0 }}>{tier.tag.toUpperCase()}</div>
              <div style={{ fontWeight: 700, fontSize: 18, margin: '4px 0 14px', color: LP.text }}>{tier.name}</div>
              <p style={{ color: LP.muted, fontSize: 13, lineHeight: 1.5, marginBottom: 16, minHeight: 40 }}>{tier.pitch}</p>
              <div style={{ marginBottom: 4 }}>
                {tier.original_price && (
                  <div style={{ fontFamily: LP.mono, fontSize: 12, color: LP.muted, marginBottom: 4 }}><s>Rp {fmt(tier.original_price)}</s></div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 14 }}>Rp</span>
                  <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: LP.text }}>{fmt(tier.price)}</span>
                </div>
                <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, marginTop: 4 }}>{tier.period}</div>
              </div>
              <div style={{ flex: 1, marginTop: 12, display: 'grid', gap: 8 }}>
                {tier.perks.slice(0, 5).map(perk => (
                  <div key={perk} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: LP.muted, lineHeight: 1.45 }}>
                    <span style={{ color: LP.primary, flexShrink: 0, fontFamily: LP.mono }}>▸</span>
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { window.location.href = `/signup?tier=${tier.id}`; }}
                style={{
                  marginTop: 20, fontFamily: LP.sans, padding: '13px 0', fontSize: 13, fontWeight: 700, width: '100%', cursor: 'pointer', borderRadius: 8,
                  background: tier.is_featured ? LP.primary : 'transparent',
                  color: tier.is_featured ? '#fff' : LP.primary,
                  border: tier.is_featured ? 'none' : `1px solid ${LP.primary}`,
                }}>
                Pilih {tier.tag} →
              </button>
            </div>
          ))}
        </div>
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
```

- [ ] **Step 2: Tambah routing di `src/App.tsx`**

Tambah import setelah `import PricingIndikatorPage from './pages/PricingIndikatorPage';` (dari Task 1):

```tsx
import PricingKelasPage from './pages/PricingKelasPage';
```

Tambah di `getPage()` setelah baris `/pricing-indikator`:

```tsx
  if (path === '/pricing-kelas')          return 'pricing-kelas';
```

Tambah di render setelah baris `pricing-indikator`:

```tsx
  if (page === 'pricing-kelas')     return <PricingKelasPage />;
```

- [ ] **Step 3: Verifikasi typecheck**

```bash
npm run typecheck 2>&1 | grep -E "PricingKelasPage|App.tsx"
```
Expected: `PricingKelasPage.tsx` 0 error; `App.tsx` masih 12 error baseline.

- [ ] **Step 4: Verifikasi manual**

`npm run dev` → buka `/pricing-kelas`. Pastikan 4 kartu tier (Trial/Bronze/Gold/Platinum) tampil dengan harga dari `pricing_tiers`, tombol "Pilih ... →" mengarah ke `/signup?tier=<id>` yang benar, dan di bawahnya section Kurikulum (accordion Basic/Advanced) berfungsi (klik modul → expand/collapse), lalu cek `/pricing-kelas#kurikulum` scroll otomatis ke section itu.

- [ ] **Step 5: Commit**

```bash
git add src/pages/PricingKelasPage.tsx src/App.tsx
git commit -m "feat: tambah halaman /pricing-kelas (kartu pricing tier baru + pindahan kurikulum)"
```

---

### Task 3: Update `LandingPage.tsx` — hero, nav, footer, hapus section yang sudah dipindah

**Files:**
- Modify: `src/pages/LandingPage.tsx`

**Interfaces:**
- Consumes: route `/pricing-kelas` (Task 2) dan `/pricing-indikator` (Task 1) — harus sudah ada sebelum task ini dikerjakan.
- Produces: tidak ada yang dikonsumsi task lain.

- [ ] **Step 1: Hapus definisi fungsi `Curriculum` dan kedua const modul**

Cari dan hapus seluruh blok berikut (baris ~36-99, termasuk 2 komentar section-nya):

```tsx
// ── BASIC CLASS ───────────────────────────────────────────────────────────
const BASIC_MODULES = [
```
...sampai...
```tsx
const ADVANCED_MODULES = [
```
...sampai penutup array-nya (baris yang diakhiri `];` sebelum `const FAQ = [`). Pastikan `const FAQ = [...]` yang menyusul TIDAK ikut terhapus.

Lalu cari dan hapus seluruh fungsi `Curriculum` (baris ~341-416, dari `function Curriculum() {` sampai closing brace `}` sebelum `function Komunitas() {`).

- [ ] **Step 2: Hapus definisi fungsi `ProductPreview`**

Cari dan hapus seluruh fungsi (baris ~579-659, dari `function ProductPreview({ config }: { config: LandingPreviewConfig }) {` sampai closing brace `}` sebelum `function BuktiHasil() {`).

Setelah ini, import `type { LandingPreviewConfig } from '../hooks';` di baris 10 jadi tidak terpakai — hapus baris import itu juga:

```tsx
import type { LandingPreviewConfig } from '../hooks';
```

- [ ] **Step 3: Update `NAV_ITEMS` di komponen `NavBar`**

Cari:
```tsx
  const NAV_ITEMS = [
    { l: 'Kelas',       key: 'KELAS',       href: '#kelas' },
    { l: 'Kurikulum',   key: 'KURIKULUM',   href: '#kurikulum' },
```
Ganti jadi:
```tsx
  const NAV_ITEMS = [
    { l: 'Kelas',       key: 'KELAS',       href: '/pricing-kelas' },
    { l: 'Kurikulum',   key: 'KURIKULUM',   href: '/pricing-kelas#kurikulum' },
```

- [ ] **Step 4: Update section Hero — hapus `id="kelas"`, ganti 2 tombol**

Cari:
```tsx
  return (
    <section id="kelas" style={{ background: LP.bg }}>
```
Ganti jadi:
```tsx
  return (
    <section style={{ background: LP.bg }}>
```

Cari blok 2 tombol:
```tsx
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
```
Ganti jadi:
```tsx
          <div className='mr-anim-cta' style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
            <button onClick={() => window.location.href = '/pricing-kelas'}
              style={{ fontFamily: LP.sans, background: LP.primary, color: '#fff', fontWeight: 700, padding: '15px 28px', fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: LP.shadowMd }}>
              Beli Kelas →
            </button>
            <button onClick={() => window.location.href = '/pricing-indikator'}
              style={{ fontFamily: LP.sans, border: `1px solid ${LP.border}`, padding: '15px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10, background: LP.surface, color: LP.text, cursor: 'pointer' }}>
              Beli Indikator →
            </button>
          </div>
```

- [ ] **Step 5: Hapus call site `<Curriculum />` dan `<ProductPreview />` dari render utama**

Cari di `export default function LandingPage()`:
```tsx
      {/* 4.5 — Preview Platform */}
      {preview && <ProductPreview config={preview} />}

      <BuktiHasil />

      {/* 6 — Kurikulum */}
      <Curriculum />

      {/* 7 — Komunitas */}
```
Ganti jadi (hapus 2 blok, `preview` dari `useLandingPreview()` di baris atasnya TETAP dipertahankan karena masih dipakai `heroVideoId`):
```tsx
      <BuktiHasil />

      {/* 7 — Komunitas */}
```

- [ ] **Step 6: Update link footer Kurikulum**

Cari:
```tsx
          { h: 'BELAJAR', links: [
            { l: 'Kurikulum',   href: '/#kurikulum' },
```
Ganti jadi:
```tsx
          { h: 'BELAJAR', links: [
            { l: 'Kurikulum',   href: '/pricing-kelas#kurikulum' },
```

- [ ] **Step 7: Verifikasi typecheck**

```bash
npm run typecheck 2>&1 | grep "LandingPage.tsx"
```
Expected: 0 error (tidak ada output).

- [ ] **Step 8: Verifikasi manual**

`npm run dev` → buka `/`. Cek: tombol hero "Beli Kelas →" ke `/pricing-kelas`, "Beli Indikator →" ke `/pricing-indikator`; nav bar "Kelas" & "Kurikulum" ke tujuan yang benar; scroll ke footer, klik "Kurikulum" → mendarat di `/pricing-kelas` dan langsung scroll ke section Kurikulum; pastikan section "Preview Platform" dan grid kurikulum sudah tidak muncul lagi di halaman utama.

- [ ] **Step 9: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "refactor: pindahkan section kelas/kurikulum/indikator landing page ke halaman pricing terpisah"
```

---

### Task 4: `SignupPage.tsx` — field Email, hapus preview metode bayar dummy, insert order asli

**Files:**
- Modify: `src/pages/SignupPage.tsx`

**Interfaces:**
- Consumes: `supabase` client (`src/lib/supabase.ts`), `usePricing()` (tidak berubah).
- Produces: redirect ke `/payment?order=<uuid>` — kontrak untuk Task 5: `orders` row dengan `id`, `member_id` (mengarah ke row baru di `members`), `nama_member`, `email_member`, `tier_member`, `status: 'pending'`.

- [ ] **Step 1: Tambah field Email ke state form**

Cari:
```tsx
  const [form, setForm] = useState({ nama: '', password: '' });
```
Ganti jadi:
```tsx
  const [form, setForm] = useState({ nama: '', email: '', password: '' });
```

- [ ] **Step 2: Hapus `PAY_METHODS` const dan state `method`**

Cari dan hapus:
```tsx
const PAY_METHODS = [
  { id: 'qris',    l: 'QRIS',        s: 'Semua bank / e-wallet' },
  { id: 'va',      l: 'VIRTUAL ACC', s: 'BCA · BNI · Mandiri'  },
  { id: 'ewallet', l: 'E-WALLET',    s: 'GoPay · OVO · DANA'   },
  { id: 'card',    l: 'KARTU',       s: 'Visa · Master · JCB'  },
];
```

Cari dan hapus baris:
```tsx
  const [method, setMethod]   = useState('qris');
```

- [ ] **Step 3: Hapus stepper 3-step, ganti label statis**

Cari:
```tsx
const STEPS = ['AKUN', 'PEMBAYARAN', 'KONFIRMASI'];
```
Hapus baris ini seluruhnya (const tidak dipakai lagi).

Cari:
```tsx
  const [step, setStep]       = useState(1);
```
Hapus baris ini seluruhnya.

Cari blok step indicator:
```tsx
      {/* Step indicator */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${MR.border}`, background: MR.dark }}>
        {STEPS.map((s, i) => {
          const idx = i + 1;
          const active = idx === step;
          const done   = idx < step;
          return (
            <div key={s} style={{ flex: 1, padding: isMobile ? '10px 12px' : '14px 24px', borderRight: i < 2 ? `1px solid ${MR.border}` : 0, display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, color: active ? MR.text : MR.dim, background: active ? MR.panel : 'transparent', fontFamily: MR.mono }}>
              <span style={{ width: 22, height: 22, border: `1px solid ${active ? MR.gold : MR.borderHot}`, color: active ? MR.gold : done ? MR.up : MR.dim, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                {done ? '✓' : idx}
              </span>
              <span style={{ fontSize: isMobile ? 10 : 12, letterSpacing: 0.6 }}>{s}</span>
            </div>
          );
        })}
      </div>
```
Ganti jadi:
```tsx
      {/* Step indicator */}
      <div style={{ padding: isMobile ? '10px 16px' : '12px 40px', borderBottom: `1px solid ${MR.border}`, background: MR.dark, fontFamily: MR.mono, fontSize: 11, color: MR.dim, letterSpacing: 0.6 }}>
        LANGKAH 1 DARI 2 · AKUN & PILIH KELAS
      </div>
```

- [ ] **Step 4: Hapus blok preview metode bayar dummy**

Cari dan hapus seluruh blok:
```tsx
          {/* Payment method preview */}
          <div style={{ marginTop: 40, borderTop: `1px dashed ${MR.borderHot}`, paddingTop: 28 }}>
            <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.6, marginBottom: 12 }}>// METODE PEMBAYARAN — STEP 2</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
              {PAY_METHODS.map(m => {
                const active = method === m.id;
                return (
                  <button key={m.id} onClick={() => setMethod(m.id)} style={{ textAlign: 'left', border: `1px solid ${active ? MR.gold : MR.border}`, background: active ? '#0e0c04' : MR.panel, padding: 14, cursor: 'pointer', width: '100%' }}>
                    <div style={{ fontFamily: MR.mono, fontSize: 12, color: active ? MR.gold : MR.text, letterSpacing: 0.6 }}>{m.l}</div>
                    <div style={{ fontSize: 11, color: MR.dim, marginTop: 4 }}>{m.s}</div>
                  </button>
                );
              })}
            </div>
          </div>
```

- [ ] **Step 5: Tambah input Email ke form**

Cari:
```tsx
            <AInput label="NAMA LENGKAP" value={form.nama}     onChange={set('nama')}     placeholder="Nama sesuai KTP" />
            <AInput label="PASSWORD"     value={form.password}  onChange={set('password')} type="password" placeholder="Min. 8 karakter" />
```
Ganti jadi:
```tsx
            <AInput label="NAMA LENGKAP" value={form.nama}     onChange={set('nama')}     placeholder="Nama sesuai KTP" />
            <AInput label="EMAIL"        value={form.email}    onChange={set('email')}    type="email" placeholder="email@kamu.com" />
            <AInput label="PASSWORD"     value={form.password}  onChange={set('password')} type="password" placeholder="Min. 8 karakter" />
```

- [ ] **Step 6: Validasi Email wajib diisi**

Cari:
```tsx
  async function handleSubmit() {
    if (!form.nama || !form.password || !tier) {
      setError('Nama, password, dan tier wajib diisi.');
      return;
    }
```
Ganti jadi:
```tsx
  async function handleSubmit() {
    if (!form.nama || !form.email || !form.password || !tier) {
      setError('Nama, email, password, dan tier wajib diisi.');
      return;
    }
```

- [ ] **Step 7: Isi `email` saat insert `members`, insert `orders` setelahnya, ubah redirect**

Cari:
```tsx
      // Insert member baru
      const { data: newMember, error: memberErr } = await supabase.from('members').insert({
        nama:          form.nama.trim(),
        tier:          tier,
        password:      form.password,
        role:          'member',
        is_active:     false,
        referral_code: newRefCode,
        referred_by:   referrerId,
      }).select('id').single();
      if (memberErr) throw memberErr;

      // Catat referral jika ada referrer
      if (referrerId && newMember) {
        await supabase.from('referrals').insert({
          referrer_id:        referrerId,
          referred_name:      form.nama.trim(),
          referred_member_id: newMember.id,
          status:             'pending',
        });
      }

      // Redirect ke payment
      window.location.href = `/payment?tier=${tier}&name=${encodeURIComponent(form.nama)}&method=${method}`;
```
Ganti jadi:
```tsx
      // Insert member baru
      const { data: newMember, error: memberErr } = await supabase.from('members').insert({
        nama:          form.nama.trim(),
        email:         form.email.trim(),
        tier:          tier,
        password:      form.password,
        role:          'member',
        is_active:     false,
        referral_code: newRefCode,
        referred_by:   referrerId,
      }).select('id').single();
      if (memberErr) throw memberErr;

      // Catat referral jika ada referrer
      if (referrerId && newMember) {
        await supabase.from('referrals').insert({
          referrer_id:        referrerId,
          referred_name:      form.nama.trim(),
          referred_member_id: newMember.id,
          status:             'pending',
        });
      }

      // Catat order pembelian tier
      const { data: newOrder, error: orderErr } = await supabase.from('orders').insert({
        product_id:   null,
        member_id:    newMember.id,
        nama_member:  form.nama.trim(),
        email_member: form.email.trim(),
        tier_member:  tier,
        status:       'pending',
      }).select('id').single();
      if (orderErr || !newOrder) throw new Error('Gagal membuat order: ' + (orderErr?.message ?? 'unknown error'));

      // Redirect ke payment
      window.location.href = `/payment?order=${newOrder.id}`;
```

- [ ] **Step 8: Verifikasi typecheck**

```bash
npm run typecheck 2>&1 | grep "SignupPage.tsx"
```
Expected: **1 error tersisa** (turun dari 2 baseline — `setStep` hilang karena state-nya sudah dihapus):
```
src/pages/SignupPage.tsx(7,14): error TS6133: 'TIER_ACCENT' is declared but its value is never read.
```

- [ ] **Step 9: Verifikasi manual**

`npm run dev` → buka `/signup?tier=gold`. Isi Nama, Email, Password, centang setuju, submit. Cek di Supabase dashboard (atau tab Member/tab produk Admin Panel): row baru muncul di `members` (dengan `email` terisi) **dan** di `orders` (`tier_member: 'gold'`, `status: 'pending'`, `email_member` terisi). Cek redirect URL jadi `/payment?order=<uuid>` (halaman `/payment` boleh tampil apa adanya dulu — belum diperbaiki, itu Task 5).

- [ ] **Step 10: Commit**

```bash
git add src/pages/SignupPage.tsx
git commit -m "feat: tambah field email, catat order asli, dan hapus stepper/preview metode bayar dummy di signup"
```

---

### Task 5: `PaymentPage.tsx` — baca order & metode pembayaran asli dari Supabase

**Files:**
- Modify: `src/pages/PaymentPage.tsx`

**Interfaces:**
- Consumes: query param `?order=<uuid>` (diproduksi Task 4). Tabel `orders` (kolom `id`, `member_id`, `nama_member`, `email_member`, `tier_member`, `status`), `members` (kolom `nama`), `pricing_tiers` (via `usePricing()`, cari by `id === tier_member`), `payment_methods` (kolom `id`, `jenis`, `nama_bank`, `nomor_rekening`, `nama_rekening`, `qris_image_url`, `catatan`, `aktif`, `urutan` — pola query identik `BayarPage.tsx`).
- Produces: tidak ada yang dikonsumsi task lain (halaman terminal).

- [ ] **Step 1: Ganti seluruh isi `PaymentPage.tsx`**

Isi baru (menggantikan seluruh file — pola fetch `payment_methods` & render kartu metode bayar diadaptasi persis dari `src/pages/BayarPage.tsx`, pola konfirmasi WA diadaptasi dari `src/pages/BayarAkunPage.tsx`):

```tsx
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
  jenis: 'transfer' | 'qris';
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
                    pm.qris_image_url && <img src={pm.qris_image_url} alt={`QRIS ${pm.nama_bank}`} style={{ width: '100%', maxWidth: 240, height: 240, objectFit: 'contain', background: '#fff', borderRadius: 6 }} />
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

          {selected && selected.jenis === 'transfer' && selected.nomor_rekening && (
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
```

- [ ] **Step 2: Verifikasi typecheck**

```bash
npm run typecheck 2>&1 | grep "PaymentPage.tsx"
```
Expected: 0 error.

- [ ] **Step 3: Verifikasi manual end-to-end**

`npm run dev` → ulangi alur Task 4 (`/signup?tier=gold` → isi form → submit). Pastikan mendarat di `/payment?order=<uuid>` dan menampilkan: nama tier & harga yang benar dari `pricing_tiers`, daftar metode pembayaran nyata dari `payment_methods` (kalau tabel kosong, cek pesan "Belum ada metode pembayaran aktif." muncul, bukan crash). Pilih salah satu metode, klik "KONFIRMASI VIA WHATSAPP" → cek tab WA terbuka dengan pesan berisi order id asli, dan cek row `orders` di Supabase terupdate kolom `catatan`-nya.

Lalu coba akses `/payment?order=id-acak-yang-tidak-ada` → pastikan tampil state "Data pesanan tidak ditemukan" dengan tombol kembali ke `/signup`, bukan blank page/crash.

- [ ] **Step 4: Build check**

```bash
npm run build
```
Expected: build sukses tanpa error.

- [ ] **Step 5: Commit**

```bash
git add src/pages/PaymentPage.tsx
git commit -m "feat: rombak PaymentPage supaya baca order & metode pembayaran asli dari Supabase"
```
