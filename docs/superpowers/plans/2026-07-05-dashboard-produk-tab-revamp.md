# Dashboard Produk Tab Revamp (Fase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle tab `produk` (Toko Produk Indikator) di `src/pages/member/DashboardPage.tsx` dari tema dark-terminal ke tema terang, melanjutkan Fase 1 (shell + tab `dashboard`) dan Fase 2 (`kelas`/`materi`/`news`).

**Architecture:** Satu file (`src/pages/member/DashboardPage.tsx`) sudah berisi seluruh dashboard member sebagai sidebar-driven SPA-within-SPA. Tab `produk` adalah satu blok `{active === 'produk' && (...)}` berisi 4 sub-bagian (header+toggle, grid katalog, list pesanan, 2-step modal order) yang di-restyle bertahap lewat 4 task, mengikuti pola persis Fase 1/2: reuse token `LP` yang sudah ada, ganti emoji jadi ikon `lucide-react`, tanpa menyentuh Supabase queries/handlers kecuali menambah 1 state UI baru untuk toggle paket harga per-card.

**Tech Stack:** React + TypeScript, inline styles, `lucide-react`, Supabase JS client (tidak diubah), tidak ada test suite (verifikasi lewat `npm run typecheck` delta + `npm run build`).

## Global Constraints

- Spec sumber: `docs/superpowers/specs/2026-07-05-dashboard-produk-tab-revamp-design.md` — baca dulu sebelum eksekusi task manapun.
- **CRITICAL — dua file berbagi nama "DashboardPage":** `src/pages/DashboardPage.tsx` adalah file legacy, DI LUAR SCOPE, dengan ~50 error tidak terkait. File yang disentuh plan ini HANYA `src/pages/member/DashboardPage.tsx` — selalu grep/rujuk PATH LENGKAP, jangan pernah string bare `DashboardPage`.
- Reuse token `LP` yang sudah ada di baris ~24-40 file ini (`LP.bg`, `LP.surface`, `LP.text`, `LP.muted`, `LP.border`, `LP.primary`, `LP.primaryTint`, `LP.danger`, `LP.mono`, `LP.shadowMd`) — TIDAK ADA token baru yang ditambahkan.
- **Tidak menyentuh logic/data Supabase**: `products`, `myOrders`, `orderModal`, `pendingOrder`, `paymentMethods`, `kodeDiskon`/`kodeDiskonData`/`kodeErr`/`kodeLoading`, fungsi `normalizeTier`, `cekKodeDiskon`, `closeOrderModal`, `buatOrder`, `konfirmasiKePembayaranWA` — dipertahankan persis, tidak ada perubahan logic bisnis.
- **Satu state UI baru diperbolehkan** (dan wajib ditambahkan di Task 2): `selectedPlanByProduct` — `Record<string,string>` di level komponen, murni untuk toggle paket harga per-card di grid katalog. Lihat Task 2 untuk detail persis.
- Tidak ada emoji sebagai ikon struktural/fungsional — semua diganti `lucide-react` sesuai tabel pemetaan di spec §3.
- Tidak ada dependency npm baru.
- Tidak ada test suite di repo ini. Verifikasi = `npm run typecheck` (delta di FULL PATH `src/pages/member/DashboardPage.tsx`, dibandingkan baseline di bawah) + `npm run build` harus sukses.
- 13 tab lain (`jurnal`, `trading-plan`, `komunitas`, `tools`, `funded`, `1on1`, `peringkat`, `competition`, `sertifikat`, `ulasan`, `referral`, `pengaturan`, `bantuan`) dan blok mati `active === 'live'` — TIDAK disentuh sama sekali.
- Warna brand eksternal dipertahankan apa adanya (bukan token `LP`): hijau WhatsApp `#25D366`, status `Dibayar` biru `#3b82f6`, status `Pending` kuning `#eab308`, warna pre-order `#eab308`/`#1a150022`/`#eab30833`.

### Baseline (catat sebelum Task 1, jangan diturunkan ulang)

Baseline `src/pages/member/DashboardPage.tsx` typecheck errors sebelum Task 1 dimulai — HARUS persis 8, semua `TS6133` unused-declaration, pre-existing, tidak terkait plan ini:
```
'Spark' is declared but its value is never read.
'GaugeChart' is declared but its value is never read.
'Ring' is declared but its value is never read.
'MarketOverviewWidget' is declared but its value is never read.
'leaderboard' is declared but its value is never read.
'up' is declared but its value is never read.
'lastVideos' is declared but its value is never read.
'ni' is declared but its value is never read.
```

Sebelum mulai Task 1, jalankan `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"` dan konfirmasi persis 8 baris di atas muncul (line number boleh beda dari daftar ini karena sudah bergeser oleh Fase 1/2, tapi nama identifier dan jumlahnya harus sama). Kalau tidak cocok, STOP dan laporkan — jangan lanjut ke Task 1.

**Tren error yang diharapkan** (5 ikon baru ditambahkan di Task 1: `Package`, `Receipt`, `BarChart3`, `Ticket`, `MessageSquare` — `Package`/`Receipt` langsung terpakai di Task 1 sendiri):
- Setelah Task 1: 8 → **11** (8 baseline + 3 ikon baru yang belum terpakai: `BarChart3`, `Ticket`, `MessageSquare`)
- Setelah Task 2: 11 → **10** (`BarChart3` terpakai di grid katalog)
- Setelah Task 3: 10 → **8** (`Ticket` + `MessageSquare` terpakai di tab Pesanan Saya — kembali ke baseline)
- Setelah Task 4: 8 → **8** (tidak berubah — modal tidak menambah import baru)

Kalau delta di task manapun tidak cocok persis dengan tren ini, itu regresi — jangan lanjut ke task berikutnya sebelum diperbaiki.

---

### Task 1: Import ikon baru + header & toggle Katalog/Pesanan Saya + empty state katalog

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (import block ~baris 9-15; header+toggle tab `produk` ~baris 2483-2500; empty state katalog ~baris 2505-2509 — nomor baris ini dihitung dari state SEBELUM Task 1, cari lewat teks unik di bawah, bukan lewat nomor baris karena akan bergeser)

**Interfaces:**
- Consumes: tidak ada (task pertama fase ini)
- Produces: import `Package`, `Receipt`, `BarChart3`, `Ticket`, `MessageSquare` dari `lucide-react` tersedia untuk Task 2 & 3. Wrapper tab `produk` sudah dapat `background: LP.bg, minHeight: '100%'` (dipakai sebagai referensi visual oleh task-task berikutnya, tidak perlu diulang).

- [ ] **Step 1: Cari dan ganti blok import `lucide-react`**

Cari teks persis ini (baris ~9-15):

```tsx
import {
  Search, LayoutGrid, PlayCircle, BookOpen, LineChart, NotebookPen, ClipboardList,
  MessageCircle, Landmark, ShoppingBag, Rocket, Trophy, Medal, Award, Target, Star,
  Link2, Settings, HelpCircle, LogOut, Bell, CheckCircle2, XCircle, Info, Megaphone,
  Lock, FlaskConical, CircleDot, DollarSign, Briefcase,
  Paperclip, Check, Clock, Play, Circle, RotateCcw, FileText, Presentation, FileSpreadsheet, File, Download,
} from 'lucide-react';
```

Ganti dengan:

```tsx
import {
  Search, LayoutGrid, PlayCircle, BookOpen, LineChart, NotebookPen, ClipboardList,
  MessageCircle, Landmark, ShoppingBag, Rocket, Trophy, Medal, Award, Target, Star,
  Link2, Settings, HelpCircle, LogOut, Bell, CheckCircle2, XCircle, Info, Megaphone,
  Lock, FlaskConical, CircleDot, DollarSign, Briefcase,
  Paperclip, Check, Clock, Play, Circle, RotateCcw, FileText, Presentation, FileSpreadsheet, File, Download,
  Package, Receipt, BarChart3, Ticket, MessageSquare,
} from 'lucide-react';
```

- [ ] **Step 2: Cari dan ganti header + toggle Katalog/Pesanan Saya**

Cari teks persis ini (di dalam blok `{active === 'produk' && (...)}`):

```tsx
          {active === 'produk' && (
            <div className="mr-content-pad" style={{ padding: 24 }}>
              {/* Header + toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
                <div>
                  <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// TOKO PRODUK</div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Produk Indikator</h2>
                  <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Indikator TradingView eksklusif dari Menolak Rugi.</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['katalog','pesanan'] as const).map(v => (
                    <button key={v} onClick={() => setProdView(v)}
                      style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, padding: '7px 18px', border: `1px solid ${prodView === v ? G.gold : C.border}`, background: prodView === v ? 'var(--mr-tint-gold)' : 'transparent', color: prodView === v ? G.gold : C.muted, cursor: 'pointer', borderRadius: 8 }}>
                      {v === 'katalog' ? '📦 Katalog' : '🧾 Pesanan Saya'}
                    </button>
                  ))}
                </div>
              </div>
```

Ganti dengan:

```tsx
          {active === 'produk' && (
            <div className="mr-content-pad" style={{ padding: 24, background: LP.bg, minHeight: '100%' }}>
              {/* Header + toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
                <div>
                  <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>TOKO PRODUK</div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: LP.text }}>Produk Indikator</h2>
                  <p style={{ color: LP.muted, fontSize: 13, margin: 0 }}>Indikator TradingView eksklusif dari Menolak Rugi.</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['katalog','pesanan'] as const).map(v => (
                    <button key={v} onClick={() => setProdView(v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: LP.mono, fontSize: 11, fontWeight: 700, padding: '7px 18px', border: `1px solid ${prodView === v ? LP.primary : LP.border}`, background: prodView === v ? LP.primaryTint : 'transparent', color: prodView === v ? LP.primary : LP.muted, cursor: 'pointer', borderRadius: 8 }}>
                      {v === 'katalog' ? <Package size={13}/> : <Receipt size={13}/>}
                      {v === 'katalog' ? 'Katalog' : 'Pesanan Saya'}
                    </button>
                  ))}
                </div>
              </div>
```

- [ ] **Step 3: Cari dan ganti empty state katalog**

Cari teks persis ini:

```tsx
                  {!products.length && (
                    <div style={{ textAlign: 'center' as const, padding: '60px 20px', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>
                      Belum ada produk tersedia saat ini.
                    </div>
                  )}
```

Ganti dengan:

```tsx
                  {!products.length && (
                    <div style={{ textAlign: 'center' as const, padding: '60px 20px', color: LP.muted, fontFamily: LP.mono, fontSize: 13 }}>
                      Belum ada produk tersedia saat ini.
                    </div>
                  )}
```

- [ ] **Step 4: Verifikasi typecheck**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: 11 baris — 8 baseline (`Spark`, `GaugeChart`, `Ring`, `MarketOverviewWidget`, `leaderboard`, `up`, `lastVideos`, `ni`) + 3 baru (`BarChart3`, `Ticket`, `MessageSquare` — semua `TS6133` karena belum terpakai). `Package` dan `Receipt` TIDAK boleh muncul di daftar unused (sudah terpakai di Step 2).

- [ ] **Step 5: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle header dan toggle tab Produk ke tema terang"
```

---

### Task 2: Grid katalog produk (card, badge, toggle paket harga, CTA)

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (state declarations ~baris 366-378; grid katalog ~baris 2510-2596 dari state sebelum Task 1 — cari lewat teks unik)

**Interfaces:**
- Consumes: `LP` token object, ikon `Package`/`Receipt`/`BarChart3`/`Ticket`/`MessageSquare`/`Clock`/`CheckCircle2`/`Lock`/`BookOpen`/`Download` dari Task 1 (sudah diimpor). Fungsi `normalizeTier`, `extractYtId` (tidak diubah).
- Produces: state baru `selectedPlanByProduct: Record<string,string>` dan setter `setSelectedPlanByProduct` — dipakai HANYA di dalam blok ini, tidak dikonsumsi task lain.

- [ ] **Step 1: Tambah state baru `selectedPlanByProduct`**

Cari teks persis ini (baris ~378, deklarasi state tab produk):

```tsx
  const [rekCopied, setRekCopied]       = useState('');
```

Ganti dengan:

```tsx
  const [rekCopied, setRekCopied]       = useState('');
  const [selectedPlanByProduct, setSelectedPlanByProduct] = useState<Record<string,string>>({});
```

- [ ] **Step 2: Cari dan ganti grid katalog + card produk**

Cari teks persis ini (mulai dari komentar `{/* ── Katalog ── */}` sampai penutup `</div>` grid, TIDAK termasuk komentar `{/* ── Pesanan Saya ── */}` di bawahnya):

```tsx
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 24 }}>
                    {products.map(p => {
                      const tierMember = normalizeTier(member?.tier || '');
                      const bisaOrder  = (p.tier_access || []).includes(tierMember);
                      const tglRilis   = p.tanggal_rilis ? new Date(p.tanggal_rilis).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
                      const plans = ([
                        { plan: 'bulanan'  as const, label: 'Bulanan',  h: p.harga_bulanan,  d: p.diskon_bulanan  },
                        { plan: 'tahunan'  as const, label: 'Tahunan',  h: p.harga_tahunan,  d: p.diskon_tahunan  },
                        { plan: 'lifetime' as const, label: 'Lifetime', h: p.harga_lifetime, d: p.diskon_lifetime },
                      ]).filter(r => r.h);
                      return (
                        <div key={p.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
                          <div style={{ aspectRatio: '16/9', background: C.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' as const }}>
                            {!p.gambar_url && extractYtId(p.video_url)
                              ? <iframe
                                  src={`https://www.youtube.com/embed/${extractYtId(p.video_url)}?autoplay=1&mute=1&rel=0&modestbranding=1&controls=1`}
                                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                  allow="autoplay; encrypted-media; picture-in-picture"
                                  allowFullScreen
                                  title={p.nama}
                                />
                              : p.gambar_url
                                ? <img src={p.gambar_url} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }}/>
                                : <span style={{ fontSize: 48 }}>📊</span>
                            }
                          </div>
                          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column' as const, flex: 1, gap: 12 }}>
                            <div>
                              {p.status === 'preorder'
                                ? <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#eab308', background: '#1a150022', border: '1px solid #eab30844', padding: '4px 12px', borderRadius: 6 }}>
                                    ⏳ PRE-ORDER{tglRilis ? ` · Rilis ${tglRilis}` : ''}
                                  </span>
                                : <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: C.up, background: 'var(--mr-tint-up,#0a1a0e)', border: `1px solid ${C.up}33` }}>
                                    ✅ TERSEDIA
                                  </span>
                              }
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 19 }}>{p.nama}</div>
                            <div style={{ color: C.dim, fontSize: 14, lineHeight: 1.55, display: '-webkit-box' as any, WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{p.deskripsi}</div>
                            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6, marginTop: 4 }}>
                              {plans.map(row => {
                                const finalH = row.d ? Math.round(row.h * (1 - row.d / 100)) : row.h;
                                return (
                                  <div key={row.plan} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, gap: 8 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
                                      <span style={{ fontFamily: C.mono, fontSize: 10, color: C.dim }}>{row.label}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {row.d && <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textDecoration: 'line-through' }}>Rp{Number(row.h).toLocaleString('id-ID')}</span>}
                                        <span style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: row.d ? C.down : C.text }}>Rp{Number(finalH).toLocaleString('id-ID')}</span>
                                        {row.d && <span style={{ fontFamily: C.mono, fontSize: 9, color: C.down, border: `1px solid ${C.down}44`, padding: '1px 5px', borderRadius: 4 }}>-{row.d}%</span>}
                                      </div>
                                    </div>
                                    {bisaOrder && (
                                      <button onClick={() => { setKodeDiskon(''); setKodeDiskonData(null); setKodeErr(''); setOrderModal({ ...p, _selectedPlan: row.plan, _selectedLabel: row.label, _selectedHarga: finalH, _hargaBase: row.h }); }}
                                        style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, padding: '6px 14px', background: G.gold, color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                                        Pilih
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                              {!bisaOrder && (
                                <button disabled style={{ width: '100%', padding: '10px', fontFamily: C.mono, fontSize: 12, fontWeight: 700, background: C.sidebar, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'not-allowed', marginTop: 4 }}>
                                  🔒 Upgrade Tier untuk Order
                                </button>
                              )}
                            </div>
                            {p.panduan_url && (
                              <button onClick={async () => {
                                try {
                                  const res = await fetch(p.panduan_url);
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url; a.download = p.panduan_name || 'panduan.pdf'; a.click();
                                  setTimeout(() => URL.revokeObjectURL(url), 10000);
                                } catch { window.open(p.panduan_url, '_blank'); }
                              }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 8, padding: '10px', fontFamily: C.mono, fontSize: 12, fontWeight: 700, background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b55', borderRadius: 8, cursor: 'pointer' }}>
                                📘 ↓ Download Panduan
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
```

> **Catatan:** kalau string di atas tidak match 100% karena spasi/newline berbeda dari file aktual, cari berdasarkan penanda unik `gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))'` sebagai titik awal dan komentar `{/* ── Pesanan Saya ── */}` sebagai titik akhir (tidak termasuk), lalu ganti seluruh isi di antaranya.

Ganti dengan:

```tsx
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 24 }}>
                    {products.map(p => {
                      const tierMember = normalizeTier(member?.tier || '');
                      const bisaOrder  = (p.tier_access || []).includes(tierMember);
                      const tglRilis   = p.tanggal_rilis ? new Date(p.tanggal_rilis).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
                      const plans = ([
                        { plan: 'bulanan'  as const, label: 'Bulanan',  h: p.harga_bulanan,  d: p.diskon_bulanan  },
                        { plan: 'tahunan'  as const, label: 'Tahunan',  h: p.harga_tahunan,  d: p.diskon_tahunan  },
                        { plan: 'lifetime' as const, label: 'Lifetime', h: p.harga_lifetime, d: p.diskon_lifetime },
                      ]).filter(r => r.h);
                      const activePlanKey = selectedPlanByProduct[p.id] ?? plans[0]?.plan;
                      const activePlan    = plans.find(r => r.plan === activePlanKey) ?? plans[0];
                      const finalH        = activePlan ? (activePlan.d ? Math.round(activePlan.h * (1 - activePlan.d / 100)) : activePlan.h) : 0;
                      return (
                        <div key={p.id} style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
                          <div style={{ aspectRatio: '16/9', background: LP.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' as const }}>
                            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, display: 'flex', alignItems: 'center', gap: 5, fontFamily: LP.mono, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: p.status === 'preorder' ? LP.text : LP.surface, color: p.status === 'preorder' ? LP.surface : LP.text }}>
                              {p.status === 'preorder' ? <Clock size={11}/> : <CheckCircle2 size={11}/>}
                              {p.status === 'preorder' ? `PRE-ORDER${tglRilis ? ` · ${tglRilis}` : ''}` : 'TERSEDIA'}
                            </div>
                            {!p.gambar_url && extractYtId(p.video_url)
                              ? <iframe
                                  src={`https://www.youtube.com/embed/${extractYtId(p.video_url)}?autoplay=1&mute=1&rel=0&modestbranding=1&controls=1`}
                                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                  allow="autoplay; encrypted-media; picture-in-picture"
                                  allowFullScreen
                                  title={p.nama}
                                />
                              : p.gambar_url
                                ? <img src={p.gambar_url} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' as const, transition: 'transform 0.3s' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}/>
                                : <BarChart3 size={48} color={LP.muted}/>
                            }
                          </div>
                          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column' as const, flex: 1, gap: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 19, color: LP.text }}>{p.nama}</div>
                            <div style={{ color: LP.muted, fontSize: 14, lineHeight: 1.55, display: '-webkit-box' as any, WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{p.deskripsi}</div>

                            {plans.length > 1 && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                                {plans.map(row => (
                                  <button key={row.plan} onClick={() => setSelectedPlanByProduct(prev => ({ ...prev, [p.id]: row.plan }))}
                                    style={{ fontFamily: LP.mono, fontSize: 10, fontWeight: 700, padding: '5px 12px', border: `1px solid ${activePlanKey === row.plan ? LP.primary : LP.border}`, background: activePlanKey === row.plan ? LP.primaryTint : 'transparent', color: activePlanKey === row.plan ? LP.primary : LP.muted, cursor: 'pointer', borderRadius: 20 }}>
                                    {row.label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {activePlan && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {activePlan.d ? <span style={{ fontFamily: LP.mono, fontSize: 12, color: LP.muted, textDecoration: 'line-through' }}>Rp{Number(activePlan.h).toLocaleString('id-ID')}</span> : null}
                                <span style={{ fontFamily: LP.mono, fontSize: 20, fontWeight: 700, color: LP.text }}>Rp{Number(finalH).toLocaleString('id-ID')}</span>
                                {activePlan.d ? <span style={{ fontFamily: LP.mono, fontSize: 10, color: LP.danger, border: `1px solid ${LP.danger}44`, padding: '2px 6px', borderRadius: 4 }}>-{activePlan.d}%</span> : null}
                              </div>
                            )}

                            {bisaOrder ? (
                              <button onClick={() => { if (!activePlan) return; setKodeDiskon(''); setKodeDiskonData(null); setKodeErr(''); setOrderModal({ ...p, _selectedPlan: activePlan.plan, _selectedLabel: activePlan.label, _selectedHarga: finalH, _hargaBase: activePlan.h }); }}
                                disabled={!activePlan}
                                style={{ width: '100%', padding: '11px', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, background: LP.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: activePlan ? 'pointer' : 'not-allowed', opacity: activePlan ? 1 : 0.5 }}>
                                Pilih Paket
                              </button>
                            ) : (
                              <button disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, background: LP.bg, color: LP.muted, border: `1px solid ${LP.border}`, borderRadius: 8, cursor: 'not-allowed' }}>
                                <Lock size={13}/> Upgrade Tier untuk Order
                              </button>
                            )}

                            {p.panduan_url && (
                              <button onClick={async () => {
                                try {
                                  const res = await fetch(p.panduan_url);
                                  const blob = await res.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url; a.download = p.panduan_name || 'panduan.pdf'; a.click();
                                  setTimeout(() => URL.revokeObjectURL(url), 10000);
                                } catch { window.open(p.panduan_url, '_blank'); }
                              }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b55', borderRadius: 8, cursor: 'pointer' }}>
                                <BookOpen size={13}/> <Download size={13}/> Download Panduan
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
```

**Catatan implementasi penting:**
- `activePlan` bisa `undefined` hanya kalau `plans` kosong (produk tanpa harga sama sekali di 3 kolom) — kasus tepi yang jarang terjadi di data nyata. Tombol "Pilih Paket" sengaja di-`disabled` saat itu (`disabled={!activePlan}`) supaya tidak crash memanggil `activePlan.plan` pada `undefined` — ini adalah pengaman baru yang TIDAK ada di kode asli (kode asli hanya me-render list kosong tanpa tombol sama sekali dalam kasus ini), tapi tidak mengubah perilaku untuk kasus normal (produk dengan ≥1 harga terisi).
- Logic pemanggilan `setOrderModal(...)` HARUS identik strukturnya dengan kode asli (`{ ...p, _selectedPlan, _selectedLabel, _selectedHarga, _hargaBase }`), hanya sumber ke-4 field itu berubah dari `row` (baris di `.map()`) jadi `activePlan` (state toggle).

- [ ] **Step 3: Verifikasi typecheck**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: 10 baris — 8 baseline + 2 (`Ticket`, `MessageSquare` — `BarChart3` sudah terpakai, tidak lagi muncul).

- [ ] **Step 4: Verifikasi manual logic tidak berubah**

Baca ulang diff dan pastikan: (a) `plans` array computation persis sama, (b) `bisaOrder`/`tglRilis` computation persis sama, (c) `buatOrder`/Supabase TIDAK dipanggil di step ini sama sekali (hanya dipanggil nanti lewat modal di Task 4), (d) `setOrderModal` payload shape (`_selectedPlan`, `_selectedLabel`, `_selectedHarga`, `_hargaBase`) persis sama key-name-nya dengan kode asli.

- [ ] **Step 5: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle grid katalog produk ke tema terang dengan toggle paket harga"
```

---

### Task 3: Tab Pesanan Saya (order list)

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (blok `{prodView === 'pesanan' && (...)}`, ~baris 2600-2627 dari state sebelum Task 1)

**Interfaces:**
- Consumes: `LP` token object, ikon `Ticket`, `MessageSquare` dari Task 1.
- Produces: tidak ada yang dikonsumsi task lain.

- [ ] **Step 1: Cari dan ganti blok Pesanan Saya**

Cari teks persis ini:

```tsx
              {/* ── Pesanan Saya ── */}
              {prodView === 'pesanan' && (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  {!myOrders.length
                    ? <div style={{ textAlign: 'center' as const, padding: '60px 20px', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Belum ada pesanan.</div>
                    : myOrders.map(o => {
                        const sc = o.status === 'aktif' ? C.up : o.status === 'dibayar' ? '#3b82f6' : '#eab308';
                        const label = o.status === 'aktif' ? 'Aktif' : o.status === 'dibayar' ? 'Dibayar' : 'Pending';
                        return (
                          <div key={o.id} style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const }}>
                            <div style={{ flex: 1, minWidth: 160 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{(o as any).products?.nama || '—'}</div>
                              {o.plan_type && <span style={{ display: 'inline-block', fontFamily: C.mono, fontSize: 10, color: G.gold, border: `1px solid ${G.gold}44`, padding: '2px 8px', borderRadius: 4, marginBottom: 4 }}>{o.plan_type.toUpperCase()}</span>}
                              <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>
                                {new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              {o.kode_diskon && <div style={{ fontFamily: C.mono, fontSize: 10, color: '#16a34a', marginTop: 2 }}>🎟️ {o.kode_diskon} (-{o.diskon_applied}%)</div>}
                              {o.catatan && <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginTop: 4 }}>💬 {o.catatan}</div>}
                            </div>
                            <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: sc, border: `1px solid ${sc}44`, padding: '4px 12px', borderRadius: 20, flexShrink: 0 }}>
                              {label}
                            </span>
                          </div>
                        );
                      })
                  }
                </div>
              )}
```

Ganti dengan:

```tsx
              {/* ── Pesanan Saya ── */}
              {prodView === 'pesanan' && (
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  {!myOrders.length
                    ? <div style={{ textAlign: 'center' as const, padding: '60px 20px', color: LP.muted, fontFamily: LP.mono, fontSize: 13 }}>Belum ada pesanan.</div>
                    : myOrders.map(o => {
                        const sc = o.status === 'aktif' ? LP.primary : o.status === 'dibayar' ? '#3b82f6' : '#eab308';
                        const label = o.status === 'aktif' ? 'Aktif' : o.status === 'dibayar' ? 'Dibayar' : 'Pending';
                        return (
                          <div key={o.id} style={{ borderBottom: `1px solid ${LP.border}`, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const }}>
                            <div style={{ flex: 1, minWidth: 160 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: LP.text }}>{(o as any).products?.nama || '—'}</div>
                              {o.plan_type && <span style={{ display: 'inline-block', fontFamily: LP.mono, fontSize: 10, color: LP.primary, border: `1px solid ${LP.primary}44`, padding: '2px 8px', borderRadius: 4, marginBottom: 4 }}>{o.plan_type.toUpperCase()}</span>}
                              <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>
                                {new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              {o.kode_diskon && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, fontSize: 10, color: '#16a34a', marginTop: 2 }}><Ticket size={11}/> {o.kode_diskon} (-{o.diskon_applied}%)</div>}
                              {o.catatan && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 4 }}><MessageSquare size={11}/> {o.catatan}</div>}
                            </div>
                            <span style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: sc, border: `1px solid ${sc}44`, padding: '4px 12px', borderRadius: 20, flexShrink: 0 }}>
                              {label}
                            </span>
                          </div>
                        );
                      })
                  }
                </div>
              )}
```

- [ ] **Step 2: Verifikasi typecheck**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: 8 baris — kembali ke baseline persis (`Ticket`/`MessageSquare` sekarang terpakai).

- [ ] **Step 3: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle tab Pesanan Saya ke tema terang"
```

---

### Task 4: Modal order (2 langkah) + perluas conditional `<main>` + bersih-bersih akhir

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (modal Step 1 ~baris 2630-2690; modal Step 2 ~baris 2692-2773; conditional `<main>` ~baris 1317, semua dari state sebelum Task 1)

**Interfaces:**
- Consumes: `LP` token object, ikon `Clock`, `CheckCircle2`, `XCircle`, `Ticket`, `Check`, `ClipboardList` dari Task 1/import awal. Tidak ada ikon baru di task ini.
- Produces: tidak ada (task terakhir fase ini).

- [ ] **Step 1: Cari dan ganti Modal Step 1 (Konfirmasi Order)**

Cari teks persis ini:

```tsx
              {/* ── Modal konfirmasi order ── */}
              {/* ── Step 1: Konfirmasi Order ── */}
              {orderModal && modalStep === 'konfirmasi' && (()=>{
                const hargaBase  = orderModal._hargaBase;
                const finalHarga = kodeDiskonData
                  ? Math.round(hargaBase * (1 - kodeDiskonData.diskon / 100))
                  : orderModal._selectedHarga;
                const kodeAktif = !!kodeDiskonData;
                return (
                  <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) closeOrderModal(); }}>
                    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, maxWidth: 420, width: '100%' }}>
                      <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// KONFIRMASI ORDER · LANGKAH 1/2</div>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{orderModal.nama}</div>
                      <div style={{ color: C.dim, fontSize: 13, marginBottom: 16 }}>{orderModal.deskripsi}</div>
                      {orderModal.status === 'preorder' && orderModal.tanggal_rilis && (
                        <div style={{ background: '#1a150022', border: '1px solid #eab30833', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontFamily: C.mono, fontSize: 12, color: '#eab308' }}>
                          ⏳ Pre-order · Tersedia: {new Date(orderModal.tanggal_rilis).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                      <div style={{ background: C.bg, border: `1px solid ${kodeAktif ? G.gold : C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>Paket</div>
                            <div style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, color: C.text }}>{orderModal._selectedLabel}</div>
                          </div>
                          <div style={{ textAlign: 'right' as const }}>
                            {kodeAktif && <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, textDecoration: 'line-through' }}>Rp{Number(orderModal._selectedHarga).toLocaleString('id-ID')}</div>}
                            <div style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700, color: G.gold }}>Rp{Number(finalHarga).toLocaleString('id-ID')}</div>
                            {kodeAktif && <div style={{ fontFamily: C.mono, fontSize: 10, color: '#16a34a' }}>Hemat {kodeDiskonData.diskon}% dengan kode</div>}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginBottom: 6 }}>Punya kode diskon? (opsional)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input value={kodeDiskon} onChange={e=>{ setKodeDiskon(e.target.value.toUpperCase()); setKodeDiskonData(null); setKodeErr(''); }}
                            onKeyDown={e=>{ if(e.key==='Enter') cekKodeDiskon(); }}
                            placeholder="MASUKKAN KODE"
                            style={{ flex: 1, background: C.bg, border: `1px solid ${kodeDiskonData ? '#16a34a' : kodeErr ? '#ef4444' : C.border}`, color: C.text, padding: '9px 14px', fontSize: 13, fontFamily: C.mono, outline: 'none', borderRadius: 8, letterSpacing: 1 }}/>
                          <button onClick={cekKodeDiskon} disabled={kodeLoading || !kodeDiskon.trim()}
                            style={{ padding: '9px 16px', fontFamily: C.mono, fontSize: 12, fontWeight: 700, background: 'transparent', color: G.gold, border: `1px solid ${G.gold}`, borderRadius: 8, cursor: kodeLoading || !kodeDiskon.trim() ? 'not-allowed' : 'pointer', opacity: !kodeDiskon.trim() ? 0.4 : 1, whiteSpace: 'nowrap' as const }}>
                            {kodeLoading ? '...' : 'Terapkan'}
                          </button>
                        </div>
                        {kodeDiskonData && <div style={{ fontFamily: C.mono, fontSize: 11, color: '#16a34a', marginTop: 6 }}>✅ Kode valid — diskon {kodeDiskonData.diskon}% diterapkan</div>}
                        {kodeErr && <div style={{ fontFamily: C.mono, fontSize: 11, color: '#ef4444', marginTop: 6 }}>❌ {kodeErr}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => buatOrder(orderModal, orderModal._selectedPlan, kodeDiskonData)} disabled={orderLoading}
                          style={{ flex: 1, padding: '12px', fontFamily: C.mono, fontSize: 13, fontWeight: 700, background: G.gold, color: '#000', border: 'none', borderRadius: 10, cursor: orderLoading ? 'not-allowed' : 'pointer', opacity: orderLoading ? 0.6 : 1 }}>
                          {orderLoading ? 'Memproses...' : 'Lanjutkan ke Pembayaran →'}
                        </button>
                        <button onClick={closeOrderModal}
                          style={{ padding: '12px 20px', fontFamily: C.mono, fontSize: 13, background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer' }}>
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
```

Ganti dengan:

```tsx
              {/* ── Modal konfirmasi order ── */}
              {/* ── Step 1: Konfirmasi Order ── */}
              {orderModal && modalStep === 'konfirmasi' && (()=>{
                const hargaBase  = orderModal._hargaBase;
                const finalHarga = kodeDiskonData
                  ? Math.round(hargaBase * (1 - kodeDiskonData.diskon / 100))
                  : orderModal._selectedHarga;
                const kodeAktif = !!kodeDiskonData;
                return (
                  <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) closeOrderModal(); }}>
                    <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: LP.shadowMd }}>
                      <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>KONFIRMASI ORDER · LANGKAH 1/2</div>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: LP.text }}>{orderModal.nama}</div>
                      <div style={{ color: LP.muted, fontSize: 13, marginBottom: 16 }}>{orderModal.deskripsi}</div>
                      {orderModal.status === 'preorder' && orderModal.tanggal_rilis && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a150022', border: '1px solid #eab30833', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontFamily: LP.mono, fontSize: 12, color: '#eab308' }}>
                          <Clock size={13}/> Pre-order · Tersedia: {new Date(orderModal.tanggal_rilis).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                      <div style={{ background: LP.bg, border: `1px solid ${kodeAktif ? LP.primary : LP.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted }}>Paket</div>
                            <div style={{ fontFamily: LP.mono, fontSize: 14, fontWeight: 700, color: LP.text }}>{orderModal._selectedLabel}</div>
                          </div>
                          <div style={{ textAlign: 'right' as const }}>
                            {kodeAktif && <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, textDecoration: 'line-through' }}>Rp{Number(orderModal._selectedHarga).toLocaleString('id-ID')}</div>}
                            <div style={{ fontFamily: LP.mono, fontSize: 22, fontWeight: 700, color: LP.primary }}>Rp{Number(finalHarga).toLocaleString('id-ID')}</div>
                            {kodeAktif && <div style={{ fontFamily: LP.mono, fontSize: 10, color: '#16a34a' }}>Hemat {kodeDiskonData.diskon}% dengan kode</div>}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, marginBottom: 6 }}>Punya kode diskon? (opsional)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input value={kodeDiskon} onChange={e=>{ setKodeDiskon(e.target.value.toUpperCase()); setKodeDiskonData(null); setKodeErr(''); }}
                            onKeyDown={e=>{ if(e.key==='Enter') cekKodeDiskon(); }}
                            placeholder="MASUKKAN KODE"
                            style={{ flex: 1, background: LP.bg, border: `1px solid ${kodeDiskonData ? '#16a34a' : kodeErr ? '#ef4444' : LP.border}`, color: LP.text, padding: '9px 14px', fontSize: 13, fontFamily: LP.mono, outline: 'none', borderRadius: 8, letterSpacing: 1 }}/>
                          <button onClick={cekKodeDiskon} disabled={kodeLoading || !kodeDiskon.trim()}
                            style={{ padding: '9px 16px', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, background: 'transparent', color: LP.primary, border: `1px solid ${LP.primary}`, borderRadius: 8, cursor: kodeLoading || !kodeDiskon.trim() ? 'not-allowed' : 'pointer', opacity: !kodeDiskon.trim() ? 0.4 : 1, whiteSpace: 'nowrap' as const }}>
                            {kodeLoading ? '...' : 'Terapkan'}
                          </button>
                        </div>
                        {kodeDiskonData && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, fontSize: 11, color: '#16a34a', marginTop: 6 }}><CheckCircle2 size={12}/> Kode valid — diskon {kodeDiskonData.diskon}% diterapkan</div>}
                        {kodeErr && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, fontSize: 11, color: '#ef4444', marginTop: 6 }}><XCircle size={12}/> {kodeErr}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => buatOrder(orderModal, orderModal._selectedPlan, kodeDiskonData)} disabled={orderLoading}
                          style={{ flex: 1, padding: '12px', fontFamily: LP.mono, fontSize: 13, fontWeight: 700, background: LP.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: orderLoading ? 'not-allowed' : 'pointer', opacity: orderLoading ? 0.6 : 1 }}>
                          {orderLoading ? 'Memproses...' : 'Lanjutkan ke Pembayaran →'}
                        </button>
                        <button onClick={closeOrderModal}
                          style={{ padding: '12px 20px', fontFamily: LP.mono, fontSize: 13, background: 'transparent', color: LP.muted, border: `1px solid ${LP.border}`, borderRadius: 10, cursor: 'pointer' }}>
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
```

- [ ] **Step 2: Cari dan ganti Modal Step 2 (Detail Pembayaran)**

Cari teks persis ini:

```tsx
              {/* ── Step 2: Detail Pembayaran ── */}
              {pendingOrder && modalStep === 'pembayaran' && (
                <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, maxWidth: 440, width: '100%' }}>
                    <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// DETAIL PEMBAYARAN · LANGKAH 2/2</div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Transfer ke Rekening Berikut</div>

                    {/* Ringkasan order */}
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>Produk</div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{pendingOrder.products?.nama}</div>
                        </div>
                        <div style={{ textAlign: 'right' as const }}>
                          <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>Paket {pendingOrder._labelPlan}</div>
                          <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700, color: G.gold }}>Rp{Number(pendingOrder._harga).toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                      {pendingOrder._appliedCode && (
                        <div style={{ fontFamily: C.mono, fontSize: 10, color: '#16a34a', borderTop: `1px solid ${C.border}`, paddingTop: 6, marginTop: 6 }}>
                          🎟️ Kode {pendingOrder._appliedCode.kode} (-{pendingOrder._appliedCode.diskon}%) diterapkan
                        </div>
                      )}
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, marginTop: 4 }}>Order ID: {pendingOrder.id}</div>
                    </div>

                    {/* Metode pembayaran */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginBottom: 10 }}>// PILIH METODE PEMBAYARAN</div>
                      {!paymentMethods.length ? (
                        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', fontFamily: C.mono, fontSize: 12, color: C.muted }}>
                          Info rekening belum dikonfigurasi. Hubungi admin.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                          {paymentMethods.map(pm => (
                            <div key={pm.id} style={{ background: '#0a1a0e', border: '1px solid #16a34a33', borderRadius: 10, padding: '14px 16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: C.text }}>{pm.nama_bank}</span>
                                {pm.jenis !== 'qris' && <span style={{ fontFamily: C.mono, fontSize: 12, color: C.muted }}>a.n. {pm.nama_rekening}</span>}
                              </div>
                              {pm.jenis === 'qris' ? (
                                <img src={pm.qris_image_url} alt={`QRIS ${pm.nama_bank}`}
                                  style={{ width: '100%', maxWidth: 280, height: 280, objectFit: 'contain', background: '#fff', borderRadius: 8, border: `1px solid ${C.border}` }} />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontFamily: C.mono, fontSize: 17, fontWeight: 700, letterSpacing: 2, color: C.text }}>{pm.nomor_rekening}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(pm.nomor_rekening); setRekCopied(pm.id); setTimeout(() => setRekCopied(''), 2000); }}
                                    style={{ fontFamily: C.mono, fontSize: 11, padding: '4px 12px', background: rekCopied === pm.id ? '#16a34a' : 'transparent', color: rekCopied === pm.id ? '#000' : '#16a34a', border: '1px solid #16a34a', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}>
                                    {rekCopied === pm.id ? '✓ Disalin' : 'Salin'}
                                  </button>
                                </div>
                              )}
                              {pm.catatan && (
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #16a34a22', fontFamily: C.mono, fontSize: 10, color: C.dim, lineHeight: 1.6 }}>
                                  📋 {pm.catatan}
                                </div>
                              )}
                            </div>
                          ))}
                          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>Nominal yang ditransfer</span>
                            <span style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700, color: G.gold }}>Rp{Number(pendingOrder._harga).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                      <button onClick={konfirmasiKePembayaranWA}
                        style={{ width: '100%', padding: '13px', fontFamily: C.mono, fontSize: 13, fontWeight: 700, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
                        ✅ Konfirmasi Pembayaran ke WA Admin
                      </button>
                      <button onClick={closeOrderModal}
                        style={{ width: '100%', padding: '11px', fontFamily: C.mono, fontSize: 12, background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer' }}>
                        Tutup (pembayaran bisa dikonfirmasi nanti)
                      </button>
                    </div>
                  </div>
                </div>
              )}
```

Ganti dengan:

```tsx
              {/* ── Step 2: Detail Pembayaran ── */}
              {pendingOrder && modalStep === 'pembayaran' && (
                <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 16, padding: 28, maxWidth: 440, width: '100%', boxShadow: LP.shadowMd }}>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>DETAIL PEMBAYARAN · LANGKAH 2/2</div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, color: LP.text }}>Transfer ke Rekening Berikut</div>

                    {/* Ringkasan order */}
                    <div style={{ background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>Produk</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: LP.text }}>{pendingOrder.products?.nama}</div>
                        </div>
                        <div style={{ textAlign: 'right' as const }}>
                          <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>Paket {pendingOrder._labelPlan}</div>
                          <div style={{ fontFamily: LP.mono, fontSize: 20, fontWeight: 700, color: LP.primary }}>Rp{Number(pendingOrder._harga).toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                      {pendingOrder._appliedCode && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, fontSize: 10, color: '#16a34a', borderTop: `1px solid ${LP.border}`, paddingTop: 6, marginTop: 6 }}>
                          <Ticket size={11}/> Kode {pendingOrder._appliedCode.kode} (-{pendingOrder._appliedCode.diskon}%) diterapkan
                        </div>
                      )}
                      <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 4 }}>Order ID: {pendingOrder.id}</div>
                    </div>

                    {/* Metode pembayaran */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, marginBottom: 10 }}>PILIH METODE PEMBAYARAN</div>
                      {!paymentMethods.length ? (
                        <div style={{ background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 10, padding: '14px 16px', fontFamily: LP.mono, fontSize: 12, color: LP.muted }}>
                          Info rekening belum dikonfigurasi. Hubungi admin.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                          {paymentMethods.map(pm => (
                            <div key={pm.id} style={{ background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 10, padding: '14px 16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontFamily: LP.mono, fontSize: 13, fontWeight: 700, color: LP.text }}>{pm.nama_bank}</span>
                                {pm.jenis !== 'qris' && <span style={{ fontFamily: LP.mono, fontSize: 12, color: LP.muted }}>a.n. {pm.nama_rekening}</span>}
                              </div>
                              {pm.jenis === 'qris' ? (
                                <img src={pm.qris_image_url} alt={`QRIS ${pm.nama_bank}`}
                                  style={{ width: '100%', maxWidth: 280, height: 280, objectFit: 'contain', background: '#fff', borderRadius: 8, border: `1px solid ${LP.border}` }} />
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontFamily: LP.mono, fontSize: 17, fontWeight: 700, letterSpacing: 2, color: LP.text }}>{pm.nomor_rekening}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(pm.nomor_rekening); setRekCopied(pm.id); setTimeout(() => setRekCopied(''), 2000); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, fontSize: 11, padding: '4px 12px', background: rekCopied === pm.id ? LP.primary : 'transparent', color: rekCopied === pm.id ? '#fff' : LP.primary, border: `1px solid ${LP.primary}`, borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}>
                                    {rekCopied === pm.id ? <Check size={12}/> : null} {rekCopied === pm.id ? 'Disalin' : 'Salin'}
                                  </button>
                                </div>
                              )}
                              {pm.catatan && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${LP.border}`, fontFamily: LP.mono, fontSize: 10, color: LP.muted, lineHeight: 1.6 }}>
                                  <ClipboardList size={12}/> {pm.catatan}
                                </div>
                              )}
                            </div>
                          ))}
                          <div style={{ background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>Nominal yang ditransfer</span>
                            <span style={{ fontFamily: LP.mono, fontSize: 16, fontWeight: 700, color: LP.primary }}>Rp{Number(pendingOrder._harga).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                      <button onClick={konfirmasiKePembayaranWA}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '13px', fontFamily: LP.mono, fontSize: 13, fontWeight: 700, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
                        <CheckCircle2 size={14}/> Konfirmasi Pembayaran ke WA Admin
                      </button>
                      <button onClick={closeOrderModal}
                        style={{ width: '100%', padding: '11px', fontFamily: LP.mono, fontSize: 12, background: 'transparent', color: LP.muted, border: `1px solid ${LP.border}`, borderRadius: 10, cursor: 'pointer' }}>
                        Tutup (pembayaran bisa dikonfirmasi nanti)
                      </button>
                    </div>
                  </div>
                </div>
              )}
```

> **Catatan penyimpangan kecil dari spec §2f:** spec menyebut card metode pembayaran pakai `LP.surface`/`LP.border`; di atas dipakai `LP.bg`/`LP.border` supaya tetap ada hierarki visual "kotak di dalam kotak" terhadap card modal luar yang sudah `LP.surface` (pola yang sama dipakai box "Ringkasan order" tepat di atasnya). Ini penyempurnaan kecil, bukan penyimpangan tujuan spec (spec-nya sendiri intinya "hilangkan kotak hijau gelap hardcode").

- [ ] **Step 3: Cari dan ganti conditional `<main>`**

Cari teks persis ini:

```tsx
        <main className='mr-main' style={{ flex: 1, overflowY: 'auto', minWidth: 0, background: ['dashboard','kelas','materi','news'].includes(active) ? LP.bg : C.bg, color: ['dashboard','kelas','materi','news'].includes(active) ? LP.text : C.text }}>
```

Ganti dengan:

```tsx
        <main className='mr-main' style={{ flex: 1, overflowY: 'auto', minWidth: 0, background: ['dashboard','kelas','materi','news','produk'].includes(active) ? LP.bg : C.bg, color: ['dashboard','kelas','materi','news','produk'].includes(active) ? LP.text : C.text }}>
```

- [ ] **Step 4: Sapuan bersih-bersih akhir**

Grep seluruh rentang blok `active === 'produk'` (dari header sampai penutup Modal Step 2) untuk token dark-theme atau emoji yang tersisa:

```bash
grep -n "C\.\(bg\|panel\|border\|dim\|muted\|text\|up\|down\|sidebar\)\|G\.gold\|var(--mr-" src/pages/member/DashboardPage.tsx | awk -F: '$1 >= 2483 && $1 <= 2790'
```

(Sesuaikan rentang baris kalau sudah bergeser dari Task 1-3 — cari batas awal `{active === 'produk' &&` dan batas akhir penutup Modal Step 2 dengan Grep sebelum menjalankan filter di atas.) Kalau ada temuan di dalam rentang tab `produk`, perbaiki jadi token `LP` yang sesuai. Kalau temuan itu ternyata di luar rentang tab `produk` (misal di tab lain), JANGAN disentuh — di luar scope.

Grep juga untuk emoji tersisa di rentang yang sama (📦, 🧾, ✅, ⏳, ❌, 🔒, 📘, 📊, 🎟️, 💬, 📋, ✓, ↓) — pastikan tidak ada lagi kecuali kalau memang sengaja dipertahankan (tidak ada kasus itu di tab ini).

- [ ] **Step 5: Verifikasi typecheck & build**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: 8 baris, identik dengan baseline di awal plan ini (tidak berubah dari Task 3).

Run: `npm run build`
Expected: build sukses tanpa error (warning ukuran chunk yang sudah ada sebelumnya boleh tetap muncul, itu bukan regresi dari plan ini).

- [ ] **Step 6: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle modal order dan perluas tema terang ke tab Produk (fase 3 selesai)"
```

---

## Self-Review Notes (dicatat penulis plan, bukan untuk dieksekusi ulang)

- **Cakupan spec:** §2a (card katalog) → Task 2; §2b (empty state) → Task 1; §2c (toggle header) → Task 1; §2d (Pesanan Saya) → Task 3; §2e/§2f (modal step 1/2) → Task 4; §3 (pemetaan ikon) → tersebar di Task 1-4 sesuai konteksnya; `<main>` conditional → Task 4. Semua bagian spec punya task yang mengimplementasikannya.
- **Konsistensi state baru:** `selectedPlanByProduct`/`setSelectedPlanByProduct` (Task 2) hanya dideklarasikan dan dipakai di Task 2 sendiri — tidak direferensikan task lain, jadi tidak ada risiko nama tidak konsisten lintas task.
- **Konsistensi tipe:** `plans[].plan` bertipe union `'bulanan'|'tahunan'|'lifetime'` (dari kode asli, tidak diubah); `activePlanKey`/`selectedPlanByProduct` bertipe `string` biasa (bukan union) supaya cocok dengan `Record<string,string>` — perbandingan `activePlanKey === row.plan` tetap valid karena TypeScript membandingkan string literal dengan string secara struktural, tidak akan error type-check.
