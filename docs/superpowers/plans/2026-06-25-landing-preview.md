# Landing Preview + Payment Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah section preview YouTube + kartu harga IDR di landing page, form config di admin, dan payment page baru untuk visitor.

**Architecture:** Singleton tabel `landing_preview_config` (sudah di-migrate). Hook `useLandingPreview` fetch data-nya. `ProductPreview` render section di antara StatsBar dan Pricing. Admin edit lewat sub-tab baru di tab `produk`. Visitor checkout lewat `/bayar?plan=...` → insert ke tabel `orders` yang sudah ada.

**Tech Stack:** React + TypeScript, Supabase (raw query), inline styles dengan pola `C`/`G` vars, lucide-react icons.

## Global Constraints

- Tidak ada test runner. Verifikasi manual: `npm run dev` lalu buka browser.
- Semua file baru/edit di dalam `src/` — jangan edit root-level `App.tsx` atau `theme.ts`.
- Inline style pattern: pakai `const C = { ... }` / `const G = { ... }` lokal per file besar. Jangan import `MR` di AdminPage atau BayarPage.
- RLS semua tabel: `using (true)` / `with check (true)` — sudah di-setup di migration.
- `orders` insert butuh `member_id text not null` dan `tier_member text not null` — gunakan `'guest'` dan `'visitor'` untuk order dari BayarPage.
- `logActivity` ada di `AdminPanel.tsx`, bukan `AdminPage.tsx` — jangan import/panggil dari AdminPage, cukup pakai `notify()`.

---

## File Map

| File | Aksi |
|---|---|
| `src/hooks/index.ts` | Tambah interface `LandingPreviewConfig` + export `useLandingPreview()` |
| `src/pages/LandingPage.tsx` | Import hook, tambah fungsi `ProductPreview`, render di antara StatsBar dan Pricing |
| `src/pages/AdminPage.tsx` | Tambah state LP, fetch di loadData, sub-tab `preview`, form UI |
| `src/pages/BayarPage.tsx` | Buat baru — payment page visitor |
| `src/App.tsx` | Tambah route `/bayar` |

---

## Task 1: `useLandingPreview` hook

**Files:**
- Modify: `src/hooks/index.ts` (tambah di bagian akhir file)

**Interfaces:**
- Produces: `export interface LandingPreviewConfig { ... }`, `export function useLandingPreview(): { preview: LandingPreviewConfig | null }`

- [ ] **Step 1: Tambah interface dan hook ke `src/hooks/index.ts`**

Buka file, scroll ke baris paling akhir, tambahkan:

```ts
// ─── Landing Preview Config ───────────────────────────────────────────────────

export interface LandingPreviewConfig {
  yt_url: string | null;
  plan1_nama: string;
  plan1_harga_asli: number;
  plan1_diskon: number;
  plan2_nama: string;
  plan2_harga_asli: number;
  plan2_diskon: number;
  plan3_nama: string;
  plan3_harga_asli: number;
  plan3_diskon: number;
}

export function useLandingPreview() {
  const [preview, setPreview] = useState<LandingPreviewConfig | null>(null);

  useEffect(() => {
    supabase
      .from('landing_preview_config')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => { if (data) setPreview(data as LandingPreviewConfig); });
  }, []);

  return { preview };
}
```

- [ ] **Step 2: Verifikasi dev server tidak error**

```bash
npm run dev
```

Buka browser, pastikan landing page masih muncul normal (belum ada perubahan visual, hook belum dipanggil di mana-mana).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/index.ts
git commit -m "feat: tambah useLandingPreview hook dan LandingPreviewConfig interface"
```

---

## Task 2: `ProductPreview` section di LandingPage

**Files:**
- Modify: `src/pages/LandingPage.tsx`

**Interfaces:**
- Consumes: `useLandingPreview` dari `'../hooks'`, `LandingPreviewConfig` dari `'../hooks'`
- Produces: section `<ProductPreview>` yang render di antara `<StatsBar>` dan `<Pricing>`

- [ ] **Step 1: Tambah import `useLandingPreview` dan `LandingPreviewConfig`**

Di `src/pages/LandingPage.tsx`, baris 9 (baris import hooks), ubah dari:

```ts
import { useLandingStats, useApprovedTestimonials, usePricing } from '../hooks';
```

Menjadi:

```ts
import { useLandingStats, useApprovedTestimonials, usePricing, useLandingPreview } from '../hooks';
import type { LandingPreviewConfig } from '../hooks';
```

- [ ] **Step 2: Tambah fungsi `ProductPreview` sebelum fungsi `Pricing`**

Cari baris `const TIER_STYLE` (sekitar baris 865), sisipkan fungsi ini **sebelumnya**:

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
    { nama: config.plan1_nama, harga_asli: config.plan1_harga_asli, diskon: config.plan1_diskon, key: 'bulanan', featured: false },
    { nama: config.plan2_nama, harga_asli: config.plan2_harga_asli, diskon: config.plan2_diskon, key: 'tahunan', featured: true },
    { nama: config.plan3_nama, harga_asli: config.plan3_harga_asli, diskon: config.plan3_diskon, key: 'lifetime', featured: false },
  ];

  return (
    <section style={{ background: 'var(--mr-bg)', borderTop: `1px solid ${MR.border}` }}>
      <div style={{ padding: isMobile ? '40px 20px 24px' : '56px 40px 28px' }}>
        <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.8 }}>// PREVIEW PLATFORM</div>
        <h2 style={{ fontSize: isMobile ? 28 : 48, letterSpacing: isMobile ? -0.5 : -1.5, lineHeight: 1.1, margin: '16px 0 0', fontWeight: 700 }}>
          Lihat cara kerjanya.
        </h2>
      </div>

      {videoId && (
        <div style={{ padding: isMobile ? '0 20px 32px' : '0 40px 40px' }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', width: '100%', maxWidth: 860, margin: '0 auto' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', borderTop: `1px solid ${MR.border}` }}>
        {plans.map((plan) => {
          const hargaDiskon = plan.diskon > 0 ? Math.round(plan.harga_asli * (1 - plan.diskon / 100)) : plan.harga_asli;
          const hemat = plan.harga_asli - hargaDiskon;
          return (
            <div key={plan.key} style={{
              padding: '26px 22px',
              borderRight: `1px solid ${MR.border}`,
              borderTop: plan.featured ? `2px solid ${MR.gold}` : 'none',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column' as const,
            }}>
              {plan.featured && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center' as const }}>
                  <span style={{ fontFamily: MR.mono, fontSize: 9, background: MR.gold, color: '#fff', padding: '3px 10px', letterSpacing: 0.8, fontWeight: 700 }}>
                    PALING POPULER
                  </span>
                </div>
              )}
              <div style={{ fontFamily: MR.mono, color: plan.featured ? MR.gold : MR.dim, fontSize: 10, letterSpacing: 1.2, marginBottom: 12 }}>
                // {plan.nama.toUpperCase()}
              </div>
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>{plan.nama}</div>
              <div>
                {plan.diskon > 0 && (
                  <div style={{ fontFamily: MR.mono, fontSize: 11, color: MR.dimmer, marginBottom: 2 }}>
                    <s>Rp {fmt(plan.harga_asli)}</s>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: MR.mono, color: MR.gold, fontSize: 13 }}>Rp</span>
                  <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1 }}>{fmt(hargaDiskon)}</span>
                </div>
                {plan.diskon > 0 && (
                  <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 10, marginTop: 4 }}>
                    Hemat Rp {fmt(hemat)} ({plan.diskon}%)
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => { window.location.href = `/bayar?plan=${plan.key}`; }}
                onMouseEnter={e => { if (!plan.featured) (e.currentTarget as HTMLElement).style.background = MR.gold + '18'; }}
                onMouseLeave={e => { if (!plan.featured) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                style={{
                  marginTop: 24, fontFamily: MR.mono, padding: '13px 0', letterSpacing: 0.5,
                  fontSize: 11, fontWeight: 700, width: '100%', cursor: 'pointer',
                  background: plan.featured ? MR.gold : 'transparent',
                  color: plan.featured ? '#fff' : MR.gold,
                  border: `1px solid ${plan.featured ? MR.gold : MR.border}`,
                }}>
                PILIH {plan.nama.toUpperCase()} ▸
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Panggil hook dan render section di `LandingPage`**

Di fungsi `LandingPage` (sekitar baris 1225), tambah hook call:

```ts
export default function LandingPage() {
  const { stats }        = useLandingStats();
  const { testimonials } = useApprovedTestimonials(12);
  const { tiers }        = usePricing();
  const { preview }      = useLandingPreview();   // ← tambah ini
```

Lalu di JSX, cari komentar `{/* 5 — Tier / Pricing */}` (sekitar baris 1290), sisipkan section preview **sebelumnya**:

```tsx
      {/* 4.5 — Preview Platform */}
      {preview && <ProductPreview config={preview} />}

      {/* 5 — Tier / Pricing */}
      {tiers.length > 0 && <Pricing tiers={tiers} />}
```

- [ ] **Step 4: Verifikasi di browser**

```bash
npm run dev
```

Buka `http://localhost:5173`. Karena admin belum isi data, section tidak muncul (preview = null). Untuk test visual sementara, di browser console:
```js
// insert test row langsung dari Supabase dashboard atau jalankan SQL:
-- UPDATE landing_preview_config SET yt_url='https://youtu.be/mMf9_Q7nLiI', plan1_nama='Bulanan', plan1_harga_asli=299000, plan1_diskon=20, plan2_nama='Tahunan', plan2_harga_asli=999000, plan2_diskon=20, plan3_nama='Lifetime', plan3_harga_asli=2500000, plan3_diskon=20 WHERE id=1;
```

Setelah data ada, refresh → section muncul dengan video dan 3 kartu harga.

- [ ] **Step 5: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat: tambah ProductPreview section di landing page (video YT + kartu harga IDR)"
```

---

## Task 3: Admin UI — sub-tab Preview Landing di AdminPage

**Files:**
- Modify: `src/pages/AdminPage.tsx`

**Interfaces:**
- Consumes: `supabase` dari `'../lib/supabase'` (sudah diimport)

- [ ] **Step 1: Tambah state variables untuk form LP**

Di `AdminPage`, cari blok state yang ada di sekitar baris 1283 (dekat `const [prodSubTab`). Tambahkan baris-baris berikut **setelah** state `prodSubTab`:

```ts
  // ── Landing Preview Config state ─────────────────────────────────────────
  const [lpYtUrl,    setLpYtUrl]    = useState('');
  const [lp1Nama,    setLp1Nama]    = useState('Bulanan');
  const [lp1Harga,   setLp1Harga]   = useState('');
  const [lp1Diskon,  setLp1Diskon]  = useState('0');
  const [lp2Nama,    setLp2Nama]    = useState('Tahunan');
  const [lp2Harga,   setLp2Harga]   = useState('');
  const [lp2Diskon,  setLp2Diskon]  = useState('0');
  const [lp3Nama,    setLp3Nama]    = useState('Lifetime');
  const [lp3Harga,   setLp3Harga]   = useState('');
  const [lp3Diskon,  setLp3Diskon]  = useState('0');
  const [lpSaving,   setLpSaving]   = useState(false);
```

- [ ] **Step 2: Update tipe `prodSubTab`**

Cari baris 1284:
```ts
const [prodSubTab, setProdSubTab] = useState<'katalog'|'kode-diskon'|'pesanan'>('katalog');
```
Ubah menjadi:
```ts
const [prodSubTab, setProdSubTab] = useState<'katalog'|'kode-diskon'|'pesanan'|'preview'>('katalog');
```

- [ ] **Step 3: Fetch data LP di `loadData()`**

Di dalam fungsi `loadData()` (cari `if (prods) setProducts`), tambahkan setelah baris itu:

```ts
    try {
      const { data: lpData } = await supabase
        .from('landing_preview_config')
        .select('*')
        .eq('id', 1)
        .single();
      if (lpData) {
        setLpYtUrl(lpData.yt_url || '');
        setLp1Nama(lpData.plan1_nama || 'Bulanan');
        setLp1Harga(String(lpData.plan1_harga_asli || ''));
        setLp1Diskon(String(lpData.plan1_diskon ?? 0));
        setLp2Nama(lpData.plan2_nama || 'Tahunan');
        setLp2Harga(String(lpData.plan2_harga_asli || ''));
        setLp2Diskon(String(lpData.plan2_diskon ?? 0));
        setLp3Nama(lpData.plan3_nama || 'Lifetime');
        setLp3Harga(String(lpData.plan3_harga_asli || ''));
        setLp3Diskon(String(lpData.plan3_diskon ?? 0));
      }
    } catch (_e) {}
```

- [ ] **Step 4: Tambah fungsi `saveLandingPreview`**

Tambahkan fungsi ini di dalam `AdminPage` component, setelah fungsi `notify`:

```ts
  async function saveLandingPreview() {
    setLpSaving(true);
    const { error } = await supabase.from('landing_preview_config').upsert({
      id: 1,
      yt_url:           lpYtUrl.trim() || null,
      plan1_nama:       lp1Nama,
      plan1_harga_asli: parseInt(lp1Harga) || 0,
      plan1_diskon:     Math.min(100, Math.max(0, parseInt(lp1Diskon) || 0)),
      plan2_nama:       lp2Nama,
      plan2_harga_asli: parseInt(lp2Harga) || 0,
      plan2_diskon:     Math.min(100, Math.max(0, parseInt(lp2Diskon) || 0)),
      plan3_nama:       lp3Nama,
      plan3_harga_asli: parseInt(lp3Harga) || 0,
      plan3_diskon:     Math.min(100, Math.max(0, parseInt(lp3Diskon) || 0)),
      updated_at:       new Date().toISOString(),
    });
    setLpSaving(false);
    if (error) { notify('Gagal simpan: ' + error.message, 'err'); return; }
    notify('Preview landing tersimpan!');
  }
```

- [ ] **Step 5: Tambah sub-tab button "Preview Landing"**

Cari array sub-tab di JSX (sekitar baris 2786):
```ts
{([
  {id:'katalog',      label:'📦 KATALOG PRODUK'},
  {id:'kode-diskon',  label:'🎟️ KODE DISKON'},
  {id:'pesanan',      label:'🧾 PESANAN MASUK'},
] as {id:'katalog'|'kode-diskon'|'pesanan';label:string}[]).map(st=>(
```
Ubah menjadi:
```ts
{([
  {id:'katalog',      label:'📦 KATALOG PRODUK'},
  {id:'kode-diskon',  label:'🎟️ KODE DISKON'},
  {id:'pesanan',      label:'🧾 PESANAN MASUK'},
  {id:'preview',      label:'🎬 PREVIEW LANDING'},
] as {id:'katalog'|'kode-diskon'|'pesanan'|'preview';label:string}[]).map(st=>(
```

- [ ] **Step 6: Tambah UI form sub-tab preview**

Setelah blok `{prodSubTab==='pesanan' && ( ... )}` (cari penutup `)}` terakhir sebelum penutup `</div>` tab produk), tambahkan:

```tsx
            {prodSubTab === 'preview' && (
              <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
                <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:20}}>// KONFIGURASI PREVIEW LANDING PAGE</div>

                {/* YouTube URL */}
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:6}}>LINK YOUTUBE PREVIEW</div>
                  <input
                    value={lpYtUrl}
                    onChange={e => setLpYtUrl(e.target.value)}
                    placeholder="https://youtu.be/xxxxxx"
                    style={{width:'100%',boxSizing:'border-box' as const,background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                    onFocus={e=>e.target.style.borderColor='#16a34a'}
                    onBlur={e=>e.target.style.borderColor='#2a2a2a'}
                  />
                </div>

                {/* 3 Plan columns */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
                  {([
                    {label:'PLAN 1', nama:lp1Nama, setNama:setLp1Nama, harga:lp1Harga, setHarga:setLp1Harga, diskon:lp1Diskon, setDiskon:setLp1Diskon},
                    {label:'PLAN 2', nama:lp2Nama, setNama:setLp2Nama, harga:lp2Harga, setHarga:setLp2Harga, diskon:lp2Diskon, setDiskon:setLp2Diskon},
                    {label:'PLAN 3', nama:lp3Nama, setNama:setLp3Nama, harga:lp3Harga, setHarga:setLp3Harga, diskon:lp3Diskon, setDiskon:setLp3Diskon},
                  ] as {label:string;nama:string;setNama:(v:string)=>void;harga:string;setHarga:(v:string)=>void;diskon:string;setDiskon:(v:string)=>void}[]).map((col,i) => {
                    const h = parseInt(col.harga) || 0;
                    const d = parseInt(col.diskon) || 0;
                    const finalH = h && d ? Math.round(h * (1 - d / 100)) : h;
                    return (
                      <div key={i} style={{background:'#0a0a0a',border:'1px solid #1a1a1a',padding:'14px'}}>
                        <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:9,letterSpacing:0.8,marginBottom:10}}>{col.label}</div>
                        <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:4}}>Nama Plan</div>
                        <input value={col.nama} onChange={e=>col.setNama(e.target.value)}
                          style={{width:'100%',boxSizing:'border-box' as const,background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 10px',fontSize:12,fontFamily:'monospace',outline:'none',marginBottom:8}}
                          onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                        <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:4}}>Harga Asli (Rp)</div>
                        <input type="number" value={col.harga} onChange={e=>col.setHarga(e.target.value)}
                          style={{width:'100%',boxSizing:'border-box' as const,background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 10px',fontSize:12,fontFamily:'monospace',outline:'none',marginBottom:8}}
                          onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                        <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:4}}>Diskon (%)</div>
                        <input type="number" min="0" max="100" value={col.diskon} onChange={e=>col.setDiskon(e.target.value)}
                          style={{width:'100%',boxSizing:'border-box' as const,background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 10px',fontSize:12,fontFamily:'monospace',outline:'none',marginBottom:10}}
                          onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                        {h > 0 && (
                          <div style={{fontFamily:'monospace',fontSize:10,color:'#22c55e'}}>
                            → Rp {new Intl.NumberFormat('id-ID').format(finalH)}
                            {d > 0 && <span style={{color:'#555'}}> (hemat {d}%)</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button onClick={saveLandingPreview} disabled={lpSaving}
                  style={{fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'11px 28px',background:'#16a34a',color:'#fff',border:'none',cursor:'pointer',letterSpacing:0.5,opacity:lpSaving?0.6:1}}>
                  {lpSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            )}
```

- [ ] **Step 7: Verifikasi di browser**

```bash
npm run dev
```

Login sebagai admin → buka `/admin/panel` → tab Produk → klik "🎬 PREVIEW LANDING". Isi form, klik simpan, buka landing page di tab lain → section preview muncul dengan data baru.

- [ ] **Step 8: Commit**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: tambah sub-tab Preview Landing di admin panel produk"
```

---

## Task 4: BayarPage + route

**Files:**
- Create: `src/pages/BayarPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `supabase` dari `'../lib/supabase'`
- URL param: `?plan=bulanan|tahunan|lifetime`
- Insert ke `orders`: `{ member_id:'guest', tier_member:'visitor', nama_member, email_member, catatan, plan_type, diskon_applied, status:'pending' }`

- [ ] **Step 1: Buat `src/pages/BayarPage.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const C = {
  bg:      'var(--mr-bg)',
  panel:   'var(--mr-panel)',
  text:    'var(--mr-text)',
  border:  'var(--mr-border)',
  border2: 'var(--mr-border2)',
  dim:     'var(--mr-dim)',
  dimmer:  'var(--mr-dimmer)',
  muted:   'var(--mr-muted)',
  sidebar: 'var(--mr-sidebar)',
};
const G = { gold: 'var(--mr-gold)', up: 'var(--mr-up)', down: 'var(--mr-down)' };

interface PlanInfo {
  nama: string;
  harga_asli: number;
  diskon: number;
  key: string;
}

function getPlanFromConfig(config: any, planKey: string): PlanInfo | null {
  if (!config) return null;
  if (planKey === 'bulanan')  return { nama: config.plan1_nama, harga_asli: config.plan1_harga_asli, diskon: config.plan1_diskon, key: 'bulanan' };
  if (planKey === 'tahunan')  return { nama: config.plan2_nama, harga_asli: config.plan2_harga_asli, diskon: config.plan2_diskon, key: 'tahunan' };
  if (planKey === 'lifetime') return { nama: config.plan3_nama, harga_asli: config.plan3_harga_asli, diskon: config.plan3_diskon, key: 'lifetime' };
  return null;
}

export default function BayarPage() {
  const params  = new URLSearchParams(window.location.search);
  const planKey = params.get('plan') || 'bulanan';

  const [config,         setConfig]         = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);

  const [nama,       setNama]       = useState('');
  const [email,      setEmail]      = useState('');
  const [noHp,       setNoHp]       = useState('');
  const [metodePm,   setMetodePm]   = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [errMsg,     setErrMsg]     = useState('');

  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    async function load() {
      const [{ data: cfg }, { data: pm }] = await Promise.all([
        supabase.from('landing_preview_config').select('*').eq('id', 1).single(),
        supabase.from('payment_methods').select('*').eq('aktif', true).order('urutan', { ascending: true }),
      ]);
      if (cfg) setConfig(cfg);
      if (pm)  setPaymentMethods(pm);
      setLoading(false);
    }
    load();
  }, []);

  const plan = getPlanFromConfig(config, planKey);
  const fmt  = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const hargaDiskon = plan
    ? (plan.diskon > 0 ? Math.round(plan.harga_asli * (1 - plan.diskon / 100)) : plan.harga_asli)
    : 0;
  const hemat = plan ? plan.harga_asli - hargaDiskon : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg('');
    if (!nama.trim() || !email.trim() || !noHp.trim()) { setErrMsg('Semua field wajib diisi.'); return; }
    if (!metodePm) { setErrMsg('Pilih metode pembayaran.'); return; }
    if (!plan) { setErrMsg('Plan tidak valid.'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('orders').insert({
      member_id:      'guest',
      tier_member:    'visitor',
      nama_member:    nama.trim(),
      email_member:   email.trim(),
      catatan:        `WA: ${noHp.trim()} | Metode: ${metodePm}`,
      plan_type:      plan.key,
      diskon_applied: plan.diskon || null,
      status:         'pending',
    });
    setSubmitting(false);
    if (error) { setErrMsg('Gagal membuat order: ' + error.message); return; }
    setDone(true);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontFamily: 'monospace' }}>
      Memuat...
    </div>
  );

  if (done) return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"Geist",system-ui,sans-serif', WebkitFontSmoothing: 'antialiased', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: 'center' as const }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Pesanan Diterima!</h2>
        <p style={{ color: C.dim, lineHeight: 1.6, marginBottom: 24 }}>
          Admin akan menghubungi kamu dalam 1×24 jam untuk konfirmasi pembayaran. Cek WhatsApp kamu ya.
        </p>
        <button onClick={() => window.location.href = '/'}
          style={{ fontFamily: 'monospace', padding: '12px 28px', background: G.gold, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>
          KEMBALI KE BERANDA
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"Geist",system-ui,sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => window.history.back()}
          style={{ background: 'none', border: `1px solid ${C.border2}`, color: C.dim, padding: '7px 14px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11 }}>
          ← Kembali
        </button>
        <span style={{ fontFamily: 'monospace', color: C.dimmer, fontSize: 11, letterSpacing: 0.6 }}>// CHECKOUT</span>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '32px 20px' : '48px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32 }}>

        {/* Ringkasan Pesanan */}
        <div>
          <div style={{ fontFamily: 'monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 12 }}>// RINGKASAN PESANAN</div>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: '20px 22px', marginBottom: 20 }}>
            {plan ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Plan {plan.nama}</div>
                {plan.diskon > 0 && (
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: C.dimmer, marginBottom: 4 }}>
                    <s>Rp {fmt(plan.harga_asli)}</s>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', color: G.gold, fontSize: 12 }}>Rp</span>
                  <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>{fmt(hargaDiskon)}</span>
                </div>
                {plan.diskon > 0 && (
                  <div style={{ fontFamily: 'monospace', color: G.up, fontSize: 11 }}>
                    Hemat Rp {fmt(hemat)} ({plan.diskon}%)
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: C.dim, fontSize: 13 }}>Plan tidak ditemukan.</div>
            )}
          </div>

          {/* Metode Pembayaran */}
          <div style={{ fontFamily: 'monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 12 }}>// METODE PEMBAYARAN</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {paymentMethods.length === 0 && (
              <div style={{ color: C.dim, fontSize: 12 }}>Belum ada metode pembayaran aktif.</div>
            )}
            {paymentMethods.map(pm => (
              <button key={pm.id} onClick={() => setMetodePm(pm.id)}
                style={{
                  background: metodePm === pm.id ? G.gold + '18' : C.panel,
                  border: `1px solid ${metodePm === pm.id ? G.gold : C.border}`,
                  color: C.text,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 2,
                }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{pm.nama_bank}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.dim }}>{pm.nomor_rek} · a.n. {pm.nama_rek}</span>
                {pm.catatan && <span style={{ fontSize: 11, color: C.dimmer }}>{pm.catatan}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Form Data Pemesan */}
        <div>
          <div style={{ fontFamily: 'monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 12 }}>// DATA PEMESAN</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[
              { label: 'Nama Lengkap', value: nama, set: setNama, type: 'text',  placeholder: 'Nama kamu' },
              { label: 'Email',        value: email, set: setEmail, type: 'email', placeholder: 'email@kamu.com' },
              { label: 'No. WhatsApp', value: noHp,  set: setNoHp,  type: 'tel',   placeholder: '08xxxxxxxxxx' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: 'monospace', color: C.dim, fontSize: 10, marginBottom: 5 }}>{f.label.toUpperCase()}</div>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  style={{ width: '100%', boxSizing: 'border-box' as const, background: C.panel, border: `1px solid ${C.border}`, color: C.text, padding: '11px 14px', fontSize: 13, fontFamily: '"Geist",system-ui,sans-serif', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = G.gold}
                  onBlur={e  => e.target.style.borderColor = C.border}
                />
              </div>
            ))}

            {errMsg && (
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: G.down, padding: '8px 12px', border: `1px solid ${G.down}33`, background: G.down + '0d' }}>
                {errMsg}
              </div>
            )}

            <button type="submit" disabled={submitting || !plan}
              style={{ marginTop: 8, fontFamily: 'monospace', padding: '14px 0', background: G.gold, color: '#fff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'MEMPROSES...' : `BAYAR SEKARANG — Rp ${fmt(hargaDiskon)}`}
            </button>

            <p style={{ fontFamily: 'monospace', fontSize: 10, color: C.dimmer, lineHeight: 1.5, margin: 0 }}>
              Admin akan menghubungi kamu via WhatsApp setelah pesanan masuk untuk instruksi pembayaran.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tambah route `/bayar` di `src/App.tsx`**

Tambah import:
```ts
import BayarPage from './pages/BayarPage';
```

Di fungsi `getPage()`, tambahkan sebelum blok member area:
```ts
  if (path === '/bayar')                 return 'bayar';
```

Di fungsi `App()`, tambahkan setelah baris `if (page === 'signup')`:
```ts
  if (page === 'bayar')              return <BayarPage />;
```

- [ ] **Step 3: Verifikasi di browser**

```bash
npm run dev
```

1. Buka `http://localhost:5173/bayar?plan=tahunan` → halaman checkout muncul
2. Isi semua field, pilih metode bayar, klik "BAYAR SEKARANG" → muncul layar konfirmasi
3. Cek Supabase Table Editor → tabel `orders` → row baru dengan `plan_type='tahunan'`, `member_id='guest'`, `status='pending'`
4. Cek admin panel tab Produk → Pesanan Masuk → order muncul di list

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/BayarPage.tsx src/App.tsx
git commit -m "feat: BayarPage payment page baru untuk visitor landing page"
```

---

## Selesai

Setelah 4 task selesai:
- Admin isi config di `/admin/panel` → tab Produk → sub-tab "🎬 PREVIEW LANDING"
- Landing page `https://menolakrugi.com` tampil section video + 3 kartu harga antara StatsBar dan Pricing tier
- Visitor klik kartu → `/bayar?plan=...` → isi data → order masuk ke admin

Order dari BayarPage bisa dilihat admin di tab Produk → Pesanan Masuk (filter `member_id = 'guest'` untuk bedain dari order member).
