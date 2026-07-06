# Tabel Perbandingan Fitur `/pricing-kelas` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti komponen `TierPricing` di `src/pages/PricingKelasPage.tsx` dari grid 4 kartu perks bebas menjadi tabel perbandingan fitur (baris fitur bersama + kolom "Populer" menonjol), sesuai referensi visual yang diberikan user.

**Architecture:** Satu komponen React di-rewrite di tempat, di dalam file yang sudah ada. Desktop pakai elemen `<table>` semantik; mobile tetap pola kartu-bertumpuk yang sudah ada di halaman ini, tapi isinya diganti jadi checklist 8 fitur yang sama dengan desktop (bukan `tier.perks` bebas seperti sekarang).

**Tech Stack:** React + TypeScript, inline styles, token lokal `LP`, `lucide-react` untuk ikon centang. Tidak ada dependency baru, tidak ada perubahan Supabase.

## Global Constraints

- Spec sumber: `docs/superpowers/specs/2026-07-06-pricing-kelas-comparison-table-design.md` — baca dulu sebelum eksekusi.
- **Hanya `src/pages/PricingKelasPage.tsx` yang disentuh.** Tidak ada file lain yang berubah.
- Tidak ada test suite di proyek ini. Verifikasi = `npm run typecheck` (delta) + `npm run dev` manual + `npm run build`.
- 8 baris fitur dan pemetaan centangnya **persis** seperti tabel di spec (§ Keputusan Kunci) — jangan menambah/mengurangi baris atau mengubah pemetaan tanpa alasan baru.
- Satu warna aksen (`LP.primary`) untuk badge "Populer", ikon centang, dan tombol CTA kolom populer — tidak menambah warna baru (oranye/biru) dari referensi asli.
- Kolom "Populer" ditentukan dari `tier.is_featured === true` (bukan posisi index tetap).
- Data tier (`tiers: PricingTier[]`, `usePricing()`) dan link tombol (`/signup?tier=<id>`) tidak berubah dari perilaku sekarang.

### Baseline (catat sebelum Task 1)

```bash
npm run typecheck 2>&1 | grep "PricingKelasPage"
```
Harus tidak ada output (0 error) — file ini sudah bersih sebelum task ini, harus tetap bersih sesudahnya.

---

### Task 1: Ganti `TierPricing` jadi tabel perbandingan fitur

**Files:**
- Modify: `src/pages/PricingKelasPage.tsx`

**Interfaces:**
- Consumes: `usePricing()` dari `../hooks` (tidak berubah, sudah di-import), tipe `PricingTier` (tidak di-import eksplisit di file ini — dipakai implisit lewat `tiers`).
- Produces: tidak ada yang dikonsumsi task lain (halaman berdiri sendiri).

- [ ] **Step 1: Tambah import `Check` dari `lucide-react`**

Cari baris paling atas file:
```tsx
import React from 'react';
import { usePricing } from '../hooks';
```
Ganti jadi:
```tsx
import React from 'react';
import { Check } from 'lucide-react';
import { usePricing } from '../hooks';
```

- [ ] **Step 2: Ganti seluruh isi fungsi `TierPricing`**

Cari seluruh fungsi (dari `function TierPricing() {` sampai closing brace `}` tepat sebelum `export default function PricingKelasPage() {`) dan ganti total isinya dengan:

```tsx
const FEATURE_ROWS: { label: string; included: Record<string, boolean> }[] = [
  { label: 'Materi Dasar SMC (struktur, candle, baca chart)', included: { trial: true, bronze: true, gold: true, platinum: true } },
  { label: 'Materi SMC Lengkap (BOS, IDM, Order Block, Daily Bias)', included: { trial: false, bronze: true, gold: true, platinum: true } },
  { label: 'Live Session Q&A Mingguan', included: { trial: false, bronze: true, gold: true, platinum: true } },
  { label: 'Live Mentoring 2×/Minggu', included: { trial: false, bronze: false, gold: true, platinum: true } },
  { label: 'Evaluasi Trading Mingguan', included: { trial: false, bronze: false, gold: true, platinum: true } },
  { label: 'Channel Funded Trader (Prop Firm)', included: { trial: false, bronze: false, gold: true, platinum: true } },
  { label: 'Sesi 1-on-1 Privat dengan Mentor', included: { trial: false, bronze: false, gold: false, platinum: true } },
  { label: 'Kurikulum Personal', included: { trial: false, bronze: false, gold: false, platinum: true } },
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
```

- [ ] **Step 3: Verifikasi typecheck**

```bash
npm run typecheck 2>&1 | grep "PricingKelasPage"
```
Expected: tidak ada output (0 error), sama seperti baseline.

- [ ] **Step 4: Verifikasi manual — desktop**

`npm run dev` → buka `/pricing-kelas` di lebar desktop (>767px). Cek:
- Tabel 4 kolom tampil (Trial, Bronze, Gold, Platinum), kolom **Gold** gelap menonjol dengan badge "POPULER".
- 8 baris fitur tampil dengan ikon centang hijau atau tanda "–" sesuai tabel di spec (baris 1 semua centang, baris 7-8 cuma Platinum yang centang, dst).
- Klik tombol "Pilih Gold →" di kolom gelap dan "Pilih Trial →" di kolom biasa → keduanya redirect ke `/signup?tier=gold` dan `/signup?tier=trial`.

- [ ] **Step 5: Verifikasi manual — mobile**

Resize browser ke lebar mobile (<767px) atau pakai devtools responsive mode, reload `/pricing-kelas`. Cek:
- Tampilan berubah jadi kartu bertumpuk vertikal, satu kartu per tier.
- Kartu Gold tetap gelap menonjol dengan badge "POPULER".
- Tiap kartu menampilkan ke-8 baris fitur (bukan lagi list perks bebas yang lama) dengan ikon centang/dash yang sama seperti desktop.

- [ ] **Step 6: Build check**

```bash
npm run build
```
Expected: build sukses tanpa error.

- [ ] **Step 7: Commit**

```bash
git add src/pages/PricingKelasPage.tsx
git commit -m "feat: ganti kartu pricing /pricing-kelas jadi tabel perbandingan fitur"
```
