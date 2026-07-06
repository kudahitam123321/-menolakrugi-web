# Dashboard Trading Tools Ringan Revamp (Fase 4a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle tab `tools` (Broker & Prop Firm), `funded` (Status Trading), dan `peringkat` (Peringkat/Leaderboard) di dashboard member dari tema dark-terminal ke tema terang, melanjutkan Fase 1-3.

**Architecture:** `tools` dan `funded` adalah blok inline di `src/pages/member/DashboardPage.tsx` (reuse `LP` token object yang sudah ada di file itu). `peringkat` seluruhnya ada di file terpisah `src/pages/member/LeaderboardPage.tsx`, yang belum punya token terang maupun import `lucide-react` sama sekali — file ini dapat `LP` object baru (shape sama persis) dan blok import lucide baru. 4 task: (1) tab `tools` + komponen `LotCalculator`, (2) tab `funded`, (3) seluruh `LeaderboardPage.tsx`, (4) perluas conditional `<main>` + cleanup sweep + QA akhir.

**Tech Stack:** React + TypeScript, inline styles, `lucide-react`, tidak ada test suite (verifikasi via `npm run typecheck` delta + `npm run build`).

## Global Constraints

- Spec sumber: `docs/superpowers/specs/2026-07-05-dashboard-trading-tools-ringan-revamp-design.md` — baca dulu sebelum eksekusi task manapun.
- **CRITICAL — dua file berbagi nama "DashboardPage":** `src/pages/DashboardPage.tsx` adalah file legacy, DI LUAR SCOPE. File yang disentuh plan ini adalah `src/pages/member/DashboardPage.tsx` DAN `src/pages/member/LeaderboardPage.tsx` — selalu grep/rujuk PATH LENGKAP.
- Reuse `LP` token object yang sudah ada di `src/pages/member/DashboardPage.tsx` (baris ~25-41: `LP.bg`, `LP.surface`, `LP.text`, `LP.muted`, `LP.border`, `LP.primary`, `LP.primaryTint`, `LP.danger`, `LP.mono`, `LP.sans`) — TIDAK ADA token baru. `LeaderboardPage.tsx` mendapat object `LP` BARU dengan shape/value PERSIS SAMA (konvensi codebase: file besar mendefinisikan token lokal sendiri, bukan import lintas file).
- **Tidak menyentuh logic/data Supabase**: query `brokers`/`propRules` (state ada di komponen induk, tidak ditampilkan di sini tapi jangan disentuh), `selectedStatus`/`statusMsg`/`statusSaving`/`handleUpdateStatus` di tab `funded`, `fetchData`/query Supabase di `LeaderboardPage.tsx`, semua computed value (`tierColor`, `myProgressRank`, dst) — dipertahankan persis.
- **CRITICAL — emoji string nickname Discord TIDAK BOLEH diubah**: baris berisi `` `[${...emoji...}]${member.nama...` `` di tab `funded` memakai emoji 💎🥇🥈🥉🕒 sebagai bagian dari DATA (nickname Discord asli member), bukan ikon dekoratif. Baris ini harus tetap identik — hanya warna teks di sekitarnya (elemen pembungkus) yang boleh berubah token, isi stringnya sendiri tidak boleh disentuh sama sekali.
- Tidak ada emoji sebagai ikon struktural/fungsional (kecuali pengecualian di atas). Tidak ada dependency npm baru.
- Warna semantik yang HARUS dipertahankan (bukan token `LP`): warna per-status grid Status Trading (`#3b82f6`/`#a855f7`/`#f59e0b`/`#22ab94`/`#eab308`/`#ec4899`), aksen ungu propfirm/platinum `#a855f7` (dipakai di tab `tools` dan di fungsi `tierColor` `LeaderboardPage.tsx`), warna medali `MEDAL_COLORS` (`#a78bfa`/`#f97316`/`#94a3b8`), aksen biru khusus sub-tab "Jurnal Trading" di `LeaderboardPage.tsx` (`#3b82f6`), warna oranye peringatan `#f97316`.
- Tidak ada test suite. Verifikasi = `npm run typecheck` (delta di FULL PATH masing-masing file) + `npm run build` harus sukses.
- 9 tab lain (`jurnal`, `trading-plan`, `komunitas`, `1on1`, `sertifikat`, `ulasan`, `referral`, `pengaturan`, `bantuan`) dan tab `competition` — TIDAK disentuh sama sekali.

### Baseline (catat sebelum Task 1, jangan diturunkan ulang)

`src/pages/member/DashboardPage.tsx` — HARUS persis 8 error, semua `TS6133`, pre-existing:
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

`src/pages/member/LeaderboardPage.tsx` — HARUS persis 4 error:
```
'MEDAL_ICONS' is declared but its value is never read.       (TS6133 — dead code, dihapus di Task 3)
'PODIUM_BG' is declared but its value is never read.          (TS6133 — dead code, dihapus di Task 3)
Property 'winRate' does not exist on type 'JurnalEntry'. (×2) (TS2339 — bug tipe pre-existing, TIDAK diperbaiki di fase ini)
```

Sebelum mulai Task 1, jalankan kedua perintah berikut dan konfirmasi cocok persis:
```bash
npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"
npm run typecheck 2>&1 | grep "src/pages/member/LeaderboardPage.tsx"
```

**Tren error yang diharapkan** (setiap task menambah ikon dan langsung memakainya di task yang sama — tidak ada ikon yang menganggur lintas task di fase ini):
- `DashboardPage.tsx`: Task 1 tambah `Gift` (dipakai langsung) → tetap 8. Task 2 tambah `AlertTriangle` (dipakai langsung, 2×) → tetap 8. Task 4 tidak menambah ikon → tetap 8.
- `LeaderboardPage.tsx`: Task 3 hapus `MEDAL_ICONS`+`PODIUM_BG` (−2) dan tambah `BookOpen`+`NotebookPen` (dipakai langsung, 0 baru) → turun ke **2** (hanya 2 error `winRate` pre-existing yang tersisa).

Kalau delta di task manapun tidak cocok, itu regresi — jangan lanjut ke task berikutnya sebelum diperbaiki.

---

### Task 1: Tab `tools` (Broker & Prop Firm) + komponen `LotCalculator`

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (import block ~baris 9-16; komponen `LotCalculator` ~baris 238-291; blok tab `tools` ~baris 1969-2073 — nomor baris dihitung dari state SEBELUM task ini, cari lewat teks unik, bukan nomor baris)

**Interfaces:**
- Consumes: `LP` token object (sudah ada). Tidak konsumsi apapun dari task lain di fase ini.
- Produces: import `Gift` dari `lucide-react` tersedia (walau hanya dipakai di task ini sendiri).

- [ ] **Step 1: Cari dan ganti blok import `lucide-react`**

Cari teks persis ini:

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

Ganti dengan:

```tsx
import {
  Search, LayoutGrid, PlayCircle, BookOpen, LineChart, NotebookPen, ClipboardList,
  MessageCircle, Landmark, ShoppingBag, Rocket, Trophy, Medal, Award, Target, Star,
  Link2, Settings, HelpCircle, LogOut, Bell, CheckCircle2, XCircle, Info, Megaphone,
  Lock, FlaskConical, CircleDot, DollarSign, Briefcase,
  Paperclip, Check, Clock, Play, Circle, RotateCcw, FileText, Presentation, FileSpreadsheet, File, Download,
  Package, Receipt, BarChart3, Ticket, MessageSquare,
  Gift,
} from 'lucide-react';
```

- [ ] **Step 2: Cari dan ganti komponen `LotCalculator`**

Cari teks persis ini:

```tsx
function LotCalculator() {
  const [balance, setBalance] = useState('10000');
  const [risk, setRisk]       = useState('1');
  const [sl, setSl]           = useState('20');
  const [pair, setPair]       = useState('XAUUSD');
  const PAIRS: Record<string, number> = { XAUUSD: 100, EURUSD: 10, GBPUSD: 10, USDJPY: 0.09, XAGUSD: 50 };
  const pipVal   = PAIRS[pair] || 10;
  const riskAmt  = parseFloat(balance) * (parseFloat(risk) / 100);
  const lotSize  = riskAmt / (parseFloat(sl) * pipVal);
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>// LOT SIZE CALCULATOR</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[
          { l: 'BALANCE ($)', v: balance, s: setBalance, ph: '10000' },
          { l: 'RISK (%)',    v: risk,    s: setRisk,    ph: '1' },
          { l: 'STOP LOSS (pips)', v: sl, s: setSl, ph: '20' },
        ].map(f => (
          <div key={f.l}>
            <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>{f.l}</div>
            <input value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.ph}
              style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, outline: 'none', borderRadius: 5, boxSizing: 'border-box' as const }}
              onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border2}/>
          </div>
        ))}
        <div>
          <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>PAIR</div>
          <select value={pair} onChange={e => setPair(e.target.value)}
            style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, outline: 'none', borderRadius: 5, cursor: 'pointer' }}>
            {Object.keys(PAIRS).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div style={{ background: '#0a0c00', border: `1px solid #2a2200`, borderRadius: 8, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>LOT SIZE</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: G.gold, letterSpacing: -1 }}>{isNaN(lotSize) ? '—' : lotSize.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 5 }}>RISK AMOUNT</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.up, letterSpacing: -1 }}>${isNaN(riskAmt) ? '—' : riskAmt.toFixed(0)}</div>
        </div>
      </div>
      <div style={{ fontFamily: C.mono, color: '#333', fontSize: 10, marginTop: 10, lineHeight: 1.5 }}>
        Formula: Lot = (Balance × Risk%) ÷ (SL pips × Pip Value)<br/>
        Pip value {pair}: ${pipVal}/lot/pip
      </div>


      <div className='mr-bottom-spacer'/>

    </div>
  );
}
```

Ganti dengan:

```tsx
function LotCalculator() {
  const [balance, setBalance] = useState('10000');
  const [risk, setRisk]       = useState('1');
  const [sl, setSl]           = useState('20');
  const [pair, setPair]       = useState('XAUUSD');
  const PAIRS: Record<string, number> = { XAUUSD: 100, EURUSD: 10, GBPUSD: 10, USDJPY: 0.09, XAGUSD: 50 };
  const pipVal   = PAIRS[pair] || 10;
  const riskAmt  = parseFloat(balance) * (parseFloat(risk) / 100);
  const lotSize  = riskAmt / (parseFloat(sl) * pipVal);
  return (
    <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 11, letterSpacing: 1, marginBottom: 16 }}>LOT SIZE CALCULATOR</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[
          { l: 'BALANCE ($)', v: balance, s: setBalance, ph: '10000' },
          { l: 'RISK (%)',    v: risk,    s: setRisk,    ph: '1' },
          { l: 'STOP LOSS (pips)', v: sl, s: setSl, ph: '20' },
        ].map(f => (
          <div key={f.l}>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginBottom: 5 }}>{f.l}</div>
            <input value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.ph}
              style={{ width: '100%', background: LP.bg, border: `1px solid ${LP.border}`, color: LP.text, padding: '8px 12px', fontSize: 12, fontFamily: LP.mono, outline: 'none', borderRadius: 5, boxSizing: 'border-box' as const }}
              onFocus={e => e.target.style.borderColor = LP.primary} onBlur={e => e.target.style.borderColor = LP.border}/>
          </div>
        ))}
        <div>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginBottom: 5 }}>PAIR</div>
          <select value={pair} onChange={e => setPair(e.target.value)}
            style={{ width: '100%', background: LP.bg, border: `1px solid ${LP.border}`, color: LP.text, padding: '8px 12px', fontSize: 12, fontFamily: LP.mono, outline: 'none', borderRadius: 5, cursor: 'pointer' }}>
            {Object.keys(PAIRS).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div style={{ background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 8, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginBottom: 5 }}>LOT SIZE</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: LP.primary, letterSpacing: -1 }}>{isNaN(lotSize) ? '—' : lotSize.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginBottom: 5 }}>RISK AMOUNT</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: LP.primary, letterSpacing: -1 }}>${isNaN(riskAmt) ? '—' : riskAmt.toFixed(0)}</div>
        </div>
      </div>
      <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginTop: 10, lineHeight: 1.5 }}>
        Formula: Lot = (Balance × Risk%) ÷ (SL pips × Pip Value)<br/>
        Pip value {pair}: ${pipVal}/lot/pip
      </div>


      <div className='mr-bottom-spacer'/>

    </div>
  );
}
```

- [ ] **Step 3: Cari dan ganti seluruh blok tab `tools`**

Cari teks persis ini:

```tsx
          {/* ══ TOOLS ══ */}
          {active === 'tools' && (
            <div className='mr-content-pad' style={{ padding: 24 }}>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// BROKER & PROP FIRM</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Broker & Prop Firm</h2>
                <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Rekomendasi broker terpercaya dan rules prop firm dari mentor.</p>
              </div>

              {/* Lot Size Calculator — full width, compact */}
              <div style={{ background: 'linear-gradient(135deg,var(--mr-tint-gold),var(--mr-bg))', border: `1px solid var(--mr-tint-gold-b)`, borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 14 }}>// LOT SIZE CALCULATOR</div>
                <LotCalculator/>
              </div>

              {/* Broker Rekomendasi — card grid */}
              {(() => {
                const brokerList = brokers.filter((b: any) => b.jenis !== 'propfirm');
                const propfirmList = brokers.filter((b: any) => b.jenis === 'propfirm');
                const BrokerCard = ({ b }: { b: any }) => (
                  <div key={b.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column' as const, gap: 8, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--mr-tint-gold-b)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {b.logo_url
                        ? <img src={b.logo_url} alt={b.nama} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--mr-tint-gold-b)', background: 'var(--mr-panel)', flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, background: 'var(--mr-tint-gold)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: G.gold, flexShrink: 0, border: "1px solid var(--mr-tint-gold-b)" }}>
                            {b.nama?.[0]?.toUpperCase()}
                          </div>
                      }
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{b.nama}</div>
                        {b.diskon && <div style={{ fontFamily: C.mono, color: C.up, fontSize: 10 }}>🎁 {b.diskon}</div>}
                      </div>
                    </div>
                    {b.deskripsi && <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.55, flex: 1 }}>{b.deskripsi}</div>}
                    {b.link && (
                      <a href={b.link} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'block', textAlign: 'center' as const, fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#000', background: G.gold, padding: '8px', borderRadius: 7, textDecoration: 'none', marginTop: 4 }}>
                        DAFTAR ▸
                      </a>
                    )}
                  </div>
                );
                return (
                  <>
                    {/* Broker section */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// BROKER REKOMENDASI</div>
                      {brokerList.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                          {brokerList.map((b: any) => <BrokerCard key={b.id} b={b} />)}
                        </div>
                      ) : (
                        <div style={{ color: C.dim, fontSize: 13, padding: '20px', background: C.panel, borderRadius: 12, textAlign: 'center' as const }}>
                          Belum ada rekomendasi broker.
                        </div>
                      )}
                    </div>
                    {/* Prop Firm Rekomendasi section */}
                    {propfirmList.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontFamily: C.mono, color: '#a855f7', fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// PROP FIRM REKOMENDASI</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                          {propfirmList.map((b: any) => <BrokerCard key={b.id} b={b} />)}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Prop Firm Rules */}
              {propRules.length > 0 && (
                <div>
                  <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// PROP FIRM RULES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {propRules.map((r: any) => (
                      <div key={r.id} style={{ background: C.panel, border: `1px solid #1e1440`, borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>📋</span>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{r.judul}</div>
                        </div>
                        {r.deskripsi && <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.55 }}>{r.deskripsi}</div>}
                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' as const, flexWrap: 'wrap' as const }}>
                          {r.link && (
                            <a href={r.link} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: '#a855f7', textDecoration: 'none', border: '1px solid #4a2a8a', padding: '5px 12px', borderRadius: 6, background: 'var(--mr-tint-purple)' }}>
                              BUKA LINK ▸
                            </a>
                          )}
                          {r.file_url && (
                            <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: C.up, textDecoration: 'none', border: `1px solid var(--mr-up-a27)`, padding: '5px 12px', borderRadius: 6, background: 'var(--mr-tint-green3)' }}>
                              ⬇ DOWNLOAD
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
```

Ganti dengan:

```tsx
          {/* ══ TOOLS ══ */}
          {active === 'tools' && (
            <div className='mr-content-pad' style={{ padding: 24, background: LP.bg, minHeight: '100%' }}>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>BROKER & PROP FIRM</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: LP.text }}>Broker & Prop Firm</h2>
                <p style={{ color: LP.muted, fontSize: 13, margin: 0 }}>Rekomendasi broker terpercaya dan rules prop firm dari mentor.</p>
              </div>

              {/* Lot Size Calculator — full width, compact */}
              <div style={{ background: LP.primaryTint, border: `1px solid ${LP.primary}33`, borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 14 }}>LOT SIZE CALCULATOR</div>
                <LotCalculator/>
              </div>

              {/* Broker Rekomendasi — card grid */}
              {(() => {
                const brokerList = brokers.filter((b: any) => b.jenis !== 'propfirm');
                const propfirmList = brokers.filter((b: any) => b.jenis === 'propfirm');
                const BrokerCard = ({ b }: { b: any }) => (
                  <div key={b.id} style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column' as const, gap: 8, transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${LP.primary}55`}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = LP.border}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {b.logo_url
                        ? <img src={b.logo_url} alt={b.nama} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 10, border: `1px solid ${LP.primary}33`, background: LP.surface, flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, background: LP.primaryTint, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: LP.primary, flexShrink: 0, border: `1px solid ${LP.primary}33` }}>
                            {b.nama?.[0]?.toUpperCase()}
                          </div>
                      }
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: LP.text }}>{b.nama}</div>
                        {b.diskon && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, color: LP.primary, fontSize: 10 }}><Gift size={11}/> {b.diskon}</div>}
                      </div>
                    </div>
                    {b.deskripsi && <div style={{ color: LP.muted, fontSize: 12, lineHeight: 1.55, flex: 1 }}>{b.deskripsi}</div>}
                    {b.link && (
                      <a href={b.link} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'block', textAlign: 'center' as const, fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: '#fff', background: LP.primary, padding: '8px', borderRadius: 7, textDecoration: 'none', marginTop: 4 }}>
                        DAFTAR ▸
                      </a>
                    )}
                  </div>
                );
                return (
                  <>
                    {/* Broker section */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>BROKER REKOMENDASI</div>
                      {brokerList.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                          {brokerList.map((b: any) => <BrokerCard key={b.id} b={b} />)}
                        </div>
                      ) : (
                        <div style={{ color: LP.muted, fontSize: 13, padding: '20px', background: LP.surface, borderRadius: 12, textAlign: 'center' as const }}>
                          Belum ada rekomendasi broker.
                        </div>
                      )}
                    </div>
                    {/* Prop Firm Rekomendasi section */}
                    {propfirmList.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontFamily: LP.mono, color: '#a855f7', fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>PROP FIRM REKOMENDASI</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                          {propfirmList.map((b: any) => <BrokerCard key={b.id} b={b} />)}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Prop Firm Rules */}
              {propRules.length > 0 && (
                <div>
                  <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>PROP FIRM RULES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {propRules.map((r: any) => (
                      <div key={r.id} style={{ background: LP.surface, border: `1px solid #a855f733`, borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ClipboardList size={20} color="#a855f7"/>
                          <div style={{ fontWeight: 700, fontSize: 14, color: LP.text }}>{r.judul}</div>
                        </div>
                        {r.deskripsi && <div style={{ color: LP.muted, fontSize: 12, lineHeight: 1.55 }}>{r.deskripsi}</div>}
                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' as const, flexWrap: 'wrap' as const }}>
                          {r.link && (
                            <a href={r.link} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: LP.mono, fontSize: 10, fontWeight: 700, color: '#a855f7', textDecoration: 'none', border: '1px solid #a855f755', padding: '5px 12px', borderRadius: 6, background: '#a855f711' }}>
                              BUKA LINK ▸
                            </a>
                          )}
                          {r.file_url && (
                            <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: LP.mono, fontSize: 10, fontWeight: 700, color: LP.primary, textDecoration: 'none', border: `1px solid ${LP.primary}33`, padding: '5px 12px', borderRadius: 6, background: LP.primaryTint }}>
                              <Download size={11}/> DOWNLOAD
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
```

- [ ] **Step 4: Verifikasi typecheck**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: 8 baris, identik dengan baseline (Gift langsung terpakai, tidak menganggur).

- [ ] **Step 5: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle tab Broker & Prop Firm dan Lot Size Calculator ke tema terang"
```

---

### Task 2: Tab `funded` (Status Trading)

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (import block; blok tab `funded` ~baris 2150-2243 dari state sebelum Task 1 — cari lewat teks unik)

**Interfaces:**
- Consumes: `LP` token object. Tidak konsumsi apapun dari Task 1.
- Produces: import `AlertTriangle` dari `lucide-react` (dipakai langsung di task ini).

- [ ] **Step 1: Cari dan ganti blok import `lucide-react`** (menambah 1 ikon ke hasil Task 1)

Cari teks persis ini (hasil dari Task 1):

```tsx
import {
  Search, LayoutGrid, PlayCircle, BookOpen, LineChart, NotebookPen, ClipboardList,
  MessageCircle, Landmark, ShoppingBag, Rocket, Trophy, Medal, Award, Target, Star,
  Link2, Settings, HelpCircle, LogOut, Bell, CheckCircle2, XCircle, Info, Megaphone,
  Lock, FlaskConical, CircleDot, DollarSign, Briefcase,
  Paperclip, Check, Clock, Play, Circle, RotateCcw, FileText, Presentation, FileSpreadsheet, File, Download,
  Package, Receipt, BarChart3, Ticket, MessageSquare,
  Gift,
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
  Gift, AlertTriangle,
} from 'lucide-react';
```

- [ ] **Step 2: Cari dan ganti seluruh blok tab `funded`**

Cari teks persis ini:

```tsx
          {active === 'funded' && (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// STATUS TRADING</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Status Trading Kamu</h2>
                <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Pilih status trading kamu. Nickname Discord otomatis diupdate sesuai status yang dipilih.</p>
              </div>

              {/* Current status banner */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginBottom: 4 }}>STATUS SAAT INI</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: selectedStatus ? G.gold : C.dim }}>
                    {selectedStatus ? `${selectedStatus} — ${
                      selectedStatus === 'DA' ? 'Demo Account' :
                      selectedStatus === 'P1' ? 'Phase 1' :
                      selectedStatus === 'P2' ? 'Phase 2' :
                      selectedStatus === 'Master' ? 'Master' :
                      selectedStatus === 'MPAID' ? 'Sudah Payout' :
                      selectedStatus === 'Ap' ? 'Akun Pribadi' : selectedStatus
                    }` : 'Belum diset'}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginTop: 4 }}>
                    Nickname Discord: <span style={{ color: C.text }}>[{
                      member.tier === 'SMC Platinum 1 on 1' ? '💎' :
                      member.tier === 'SMC Gold Mentorship' ? '🥇' :
                      member.tier === 'SMC Silver' ? '🥈' :
                      member.tier === 'SMC Bronze' ? '🥉' : '🕒'
                    }]{member.nama.trim().split(/\s+/)[0]}_ᴾᵀᴹᴿ{
                      selectedStatus === 'DA' ? '·DA' :
                      selectedStatus === 'P1' ? '·P1' :
                      selectedStatus === 'P2' ? '·P2' :
                      selectedStatus === 'Master' ? '·MST' :
                      selectedStatus === 'MPAID' ? '·MPAID' :
                      selectedStatus === 'Ap' ? '·Ap' : ''
                    }</span>
                  </div>
                </div>
                {!member.discord_username && (
                  <div style={{ fontFamily: C.mono, fontSize: 11, color: '#f97316', background: '#1a0f00', border: '1px solid #3a2000', padding: '8px 12px', borderRadius: 6 }}>
                    ⚠ Discord belum<br/>terhubung
                  </div>
                )}
              </div>

              {/* Status grid */}
              <div className='mr-funded-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {([
                  { key: 'DA',     label: 'Demo Account',  desc: 'Sedang trading di akun demo',   color: '#3b82f6' },
                  { key: 'P1',     label: 'Phase 1',       desc: 'Challenge phase pertama',       color: '#a855f7' },
                  { key: 'P2',     label: 'Phase 2',       desc: 'Challenge phase kedua',         color: '#f59e0b' },
                  { key: 'Master', label: 'Master',        desc: 'Lolos phase 2',                 color: '#22ab94' },
                  { key: 'MPAID',  label: 'Sudah Payout',  desc: 'Berhasil withdrawal pertama',   color: '#eab308' },
                  { key: 'Ap',     label: 'Akun Pribadi',  desc: 'Trading dengan akun sendiri',   color: '#ec4899' },
                ] as {key:string;label:string;desc:string;color:string}[]).map(s => {
                  const isSelected = selectedStatus === s.key;
                  return (
                    <button key={s.key} onClick={() => setSelectedStatus(s.key)}
                      style={{ background: isSelected ? `${s.color}18` : C.panel,
                        border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? s.color : C.border}`,
                        borderRadius: 12, padding: '16px', textAlign: 'left' as const, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, color: isSelected ? s.color : C.text, marginBottom: 4 }}>{s.key}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? s.color : C.text, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.4 }}>{s.desc}</div>
                      {isSelected && <div style={{ fontFamily: C.mono, fontSize: 9, color: s.color, marginTop: 6 }}>● DIPILIH</div>}
                    </button>
                  );
                })}
              </div>

              {/* Clear button */}
              <button onClick={() => setSelectedStatus(null)}
                style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, background: 'transparent', border: `1px solid ${C.border}`, padding: '6px 14px', cursor: 'pointer', borderRadius: 6, marginBottom: 16 }}>
                × Hapus Status
              </button>

              {/* Save button */}
              {statusMsg && (
                <div style={{ fontFamily: C.mono, fontSize: 12, color: statusMsg.includes('Gagal') || statusMsg.includes('Tidak') ? C.down : C.up, marginBottom: 12, padding: '8px 14px', background: C.bg, borderRadius: 6 }}>
                  {statusMsg}
                </div>
              )}
              <button onClick={() => handleUpdateStatus(selectedStatus)} disabled={statusSaving}
                style={{ background: statusSaving ? 'var(--mr-border2)' : G.gold, color: statusSaving ? 'var(--mr-dim)' : '#000', fontFamily: C.mono, fontSize: 13, fontWeight: 700, padding: '12px 28px', border: 'none', cursor: statusSaving ? 'not-allowed' : 'pointer', borderRadius: 8 }}>
                {statusSaving ? 'MENYIMPAN...' : '▸ SIMPAN & UPDATE DISCORD'}
              </button>

              {!member.discord_username && (
                <p style={{ color: C.dim, fontSize: 12, marginTop: 12, fontFamily: C.mono }}>
                  ⚠ Discord belum terhubung — status tersimpan tapi nickname tidak berubah. Hubungkan di menu Pengaturan.
                </p>
              )}
            </div>
          )}
```

Ganti dengan (**PERHATIAN**: baris nickname Discord — bagian `member.tier === 'SMC Platinum 1 on 1' ? '💎' : ...` — WAJIB disalin persis apa adanya, jangan ganti emoji-nya jadi ikon):

```tsx
          {active === 'funded' && (
            <div style={{ padding: 24, background: LP.bg, minHeight: '100%' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>STATUS TRADING</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: LP.text }}>Status Trading Kamu</h2>
                <p style={{ color: LP.muted, fontSize: 13, margin: 0 }}>Pilih status trading kamu. Nickname Discord otomatis diupdate sesuai status yang dipilih.</p>
              </div>

              {/* Current status banner */}
              <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginBottom: 4 }}>STATUS SAAT INI</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: selectedStatus ? LP.primary : LP.muted }}>
                    {selectedStatus ? `${selectedStatus} — ${
                      selectedStatus === 'DA' ? 'Demo Account' :
                      selectedStatus === 'P1' ? 'Phase 1' :
                      selectedStatus === 'P2' ? 'Phase 2' :
                      selectedStatus === 'Master' ? 'Master' :
                      selectedStatus === 'MPAID' ? 'Sudah Payout' :
                      selectedStatus === 'Ap' ? 'Akun Pribadi' : selectedStatus
                    }` : 'Belum diset'}
                  </div>
                  <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 4 }}>
                    Nickname Discord: <span style={{ color: LP.text }}>[{
                      member.tier === 'SMC Platinum 1 on 1' ? '💎' :
                      member.tier === 'SMC Gold Mentorship' ? '🥇' :
                      member.tier === 'SMC Silver' ? '🥈' :
                      member.tier === 'SMC Bronze' ? '🥉' : '🕒'
                    }]{member.nama.trim().split(/\s+/)[0]}_ᴾᵀᴹᴿ{
                      selectedStatus === 'DA' ? '·DA' :
                      selectedStatus === 'P1' ? '·P1' :
                      selectedStatus === 'P2' ? '·P2' :
                      selectedStatus === 'Master' ? '·MST' :
                      selectedStatus === 'MPAID' ? '·MPAID' :
                      selectedStatus === 'Ap' ? '·Ap' : ''
                    }</span>
                  </div>
                </div>
                {!member.discord_username && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: LP.mono, fontSize: 11, color: '#f97316', background: '#fff7ed', border: '1px solid #f9731633', padding: '8px 12px', borderRadius: 6 }}>
                    <AlertTriangle size={13}/> Discord belum<br/>terhubung
                  </div>
                )}
              </div>

              {/* Status grid */}
              <div className='mr-funded-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {([
                  { key: 'DA',     label: 'Demo Account',  desc: 'Sedang trading di akun demo',   color: '#3b82f6' },
                  { key: 'P1',     label: 'Phase 1',       desc: 'Challenge phase pertama',       color: '#a855f7' },
                  { key: 'P2',     label: 'Phase 2',       desc: 'Challenge phase kedua',         color: '#f59e0b' },
                  { key: 'Master', label: 'Master',        desc: 'Lolos phase 2',                 color: '#22ab94' },
                  { key: 'MPAID',  label: 'Sudah Payout',  desc: 'Berhasil withdrawal pertama',   color: '#eab308' },
                  { key: 'Ap',     label: 'Akun Pribadi',  desc: 'Trading dengan akun sendiri',   color: '#ec4899' },
                ] as {key:string;label:string;desc:string;color:string}[]).map(s => {
                  const isSelected = selectedStatus === s.key;
                  return (
                    <button key={s.key} onClick={() => setSelectedStatus(s.key)}
                      style={{ background: isSelected ? `${s.color}18` : LP.surface,
                        border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? s.color : LP.border}`,
                        borderRadius: 12, padding: '16px', textAlign: 'left' as const, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ fontFamily: LP.mono, fontSize: 13, fontWeight: 700, color: isSelected ? s.color : LP.text, marginBottom: 4 }}>{s.key}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? s.color : LP.text, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: LP.muted, lineHeight: 1.4 }}>{s.desc}</div>
                      {isSelected && <div style={{ fontFamily: LP.mono, fontSize: 9, color: s.color, marginTop: 6 }}>● DIPILIH</div>}
                    </button>
                  );
                })}
              </div>

              {/* Clear button */}
              <button onClick={() => setSelectedStatus(null)}
                style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, background: 'transparent', border: `1px solid ${LP.border}`, padding: '6px 14px', cursor: 'pointer', borderRadius: 6, marginBottom: 16 }}>
                × Hapus Status
              </button>

              {/* Save button */}
              {statusMsg && (
                <div style={{ fontFamily: LP.mono, fontSize: 12, color: statusMsg.includes('Gagal') || statusMsg.includes('Tidak') ? LP.danger : LP.primary, marginBottom: 12, padding: '8px 14px', background: LP.bg, borderRadius: 6 }}>
                  {statusMsg}
                </div>
              )}
              <button onClick={() => handleUpdateStatus(selectedStatus)} disabled={statusSaving}
                style={{ background: statusSaving ? LP.border : LP.primary, color: statusSaving ? LP.muted : '#fff', fontFamily: LP.mono, fontSize: 13, fontWeight: 700, padding: '12px 28px', border: 'none', cursor: statusSaving ? 'not-allowed' : 'pointer', borderRadius: 8 }}>
                {statusSaving ? 'MENYIMPAN...' : '▸ SIMPAN & UPDATE DISCORD'}
              </button>

              {!member.discord_username && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 6, color: LP.muted, fontSize: 12, marginTop: 12, fontFamily: LP.mono }}>
                  <AlertTriangle size={13}/> Discord belum terhubung — status tersimpan tapi nickname tidak berubah. Hubungkan di menu Pengaturan.
                </p>
              )}
            </div>
          )}
```

- [ ] **Step 3: Verifikasi manual — nickname Discord tidak berubah**

Baca ulang diff dan pastikan baris `member.tier === 'SMC Platinum 1 on 1' ? '💎' : ...` (dan 3 baris ternary lain di bawahnya sampai `: '🕒'`) BENAR-BENAR identik karakter-per-karakter dengan versi asli — tidak ada emoji yang diganti jadi komponen ikon di baris ini.

- [ ] **Step 4: Verifikasi typecheck**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: 8 baris, identik dengan baseline (`AlertTriangle` langsung terpakai 2×, tidak menganggur).

- [ ] **Step 5: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle tab Status Trading ke tema terang"
```

---

### Task 3: `LeaderboardPage.tsx` (tab Peringkat) — file penuh

**Files:**
- Modify: `src/pages/member/LeaderboardPage.tsx` (seluruh file, 378 baris — file ini kecil dan hampir semua baris tersentuh restyle, jadi lebih aman ditulis ulang utuh daripada banyak find/replace kecil yang saling tumpang tindih)

**Interfaces:**
- Consumes: tidak ada dari Task 1/2 (file terpisah, tidak saling impor).
- Produces: tidak ada yang dikonsumsi task lain. Komponen `LeaderboardPage` tetap diimpor dan dipakai persis sama oleh `DashboardPage.tsx` (`<LeaderboardPage memberId={member.id} onViewJurnal={viewMemberJurnal} />`, baris ~2249) — signature props (`memberId: string`, `onViewJurnal?: (m: any) => void`) TIDAK BOLEH berubah.

- [ ] **Step 1: Baca file saat ini untuk memastikan tidak ada perubahan lain sejak plan ini ditulis**

```bash
npm run typecheck 2>&1 | grep "src/pages/member/LeaderboardPage.tsx"
```

Expected: 4 baris persis seperti di baseline global constraints di atas. Kalau tidak cocok, STOP dan laporkan.

- [ ] **Step 2: Timpa seluruh isi file dengan versi berikut**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, NotebookPen } from 'lucide-react';

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

const MEDAL_COLORS = ['#a78bfa', '#f97316', '#94a3b8'];
const RANK_IMGS: Record<string, string> = {
  '1':    '/rank_1.png',
  '2':    '/rank_2.png',
  '3':    '/rank_3.png',
  '4-10': '/rank_4-10.png',
  '11-20':'/rank_11-20.png',
  '21+':  '/rank_21-sampai_seterusnya.png',
};
function RankImg({ rank, size = 32 }: { rank: number; size?: number }) {
  const src = rank === 1 ? RANK_IMGS['1']
            : rank === 2 ? RANK_IMGS['2']
            : rank === 3 ? RANK_IMGS['3']
            : rank <= 10 ? RANK_IMGS['4-10']
            : rank <= 20 ? RANK_IMGS['11-20']
            : RANK_IMGS['21+'];
  return <img src={src} alt={`rank-${rank}`} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />;
}

interface ProgressEntry { id: string; nama: string; tier: string; selesai: number; }
interface JurnalEntry   { id: string; nama: string; tier: string; totalPnl: number; gainPct: number; trades: number; tp: number; sl: number; equityAwal: number; }

export default function LeaderboardPage({ memberId, onViewJurnal }: { memberId: string; onViewJurnal?: (m: any) => void }) {
  const [tab, setTab]         = useState<'progress' | 'jurnal'>('progress');
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [jurnal, setJurnal]   = useState<JurnalEntry[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: vids }, { data: progs }, { data: members }] = await Promise.all([
        supabase.from('videos').select('id'),
        supabase.from('member_progress').select('member_id,status'),
        supabase.from('members').select('id,nama,tier'),
      ]);
      setTotalVideos(vids?.length || 0);
      if (progs && members) {
        const counts: Record<string, number> = {};
        progs.forEach((p: any) => { if (p.status === 'selesai') counts[p.member_id] = (counts[p.member_id] || 0) + 1; });
        const lb = members
          .map((m: any) => ({ ...m, selesai: counts[m.id] || 0 }))
          .filter((m: any) => m.selesai > 0)
          .sort((a: any, b: any) => b.selesai - a.selesai);
        setProgress(lb);
      }

      // Jurnal
      const [{ data: jEntries }, { data: jSettings }] = await Promise.all([
        supabase.from('trading_journals').select('member_id,pnl,hasil'),
        supabase.from('journal_settings').select('member_id,equity_awal'),
      ]);
      if (jEntries && members) {
        const eqMap: Record<string, number> = {};
        (jSettings || []).forEach((s: any) => { eqMap[s.member_id] = s.equity_awal || 10000; });
        const pnlMap: Record<string, number> = {};
        const cntMap: Record<string, number> = {};
        const tpMap:  Record<string, number> = {};
        const slMap:  Record<string, number> = {};
        jEntries.forEach((e: any) => {
          pnlMap[e.member_id] = (pnlMap[e.member_id] || 0) + (e.pnl || 0);
          cntMap[e.member_id] = (cntMap[e.member_id] || 0) + 1;
          if (e.hasil === 'Take Profit') tpMap[e.member_id] = (tpMap[e.member_id] || 0) + 1;
          if (e.hasil === 'Stop Loss')   slMap[e.member_id] = (slMap[e.member_id] || 0) + 1;
        });
        const jb = members
          .filter((m: any) => cntMap[m.id])
          .map((m: any) => {
            const ea = eqMap[m.id] || 10000;
            const tp = tpMap[m.id] || 0;
            const sl = slMap[m.id] || 0;
            return {
              id: m.id, nama: m.nama, tier: m.tier,
              totalPnl: pnlMap[m.id] || 0,
              gainPct: ((pnlMap[m.id] || 0) / ea) * 100,
              trades: cntMap[m.id] || 0,
              tp, sl,
              winRate: (tp + sl) > 0 ? (tp / (tp + sl)) * 100 : 0,
              equityAwal: ea,
            };
          })
          .sort((a: any, b: any) => b.gainPct - a.gainPct);
        setJurnal(jb);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const myProgressRank = progress.findIndex(m => m.id === memberId);
  const myJurnalRank   = jurnal.findIndex(m => m.id === memberId);

  const tierColor = (tier: string) => {
    if (tier?.toLowerCase().includes('platinum')) return '#a855f7';
    if (tier?.toLowerCase().includes('gold'))     return '#f59e0b';
    if (tier?.toLowerCase().includes('silver'))   return '#94a3b8';
    return '#16a34a';
  };

  const tabStyle = (t: string): React.CSSProperties => ({
    fontFamily: LP.mono, fontSize: 11, letterSpacing: 1, padding: '8px 20px',
    borderRadius: 6, cursor: 'pointer', border: 'none',
    background: tab === t ? LP.primary : 'transparent',
    color: tab === t ? '#fff' : LP.muted, transition: 'all .2s',
  });

  // ── Podium ─────────────────────────────────────────────────────────────────
  function Podium({ items, valueKey, valueFmt }: { items: any[]; valueKey: string; valueFmt: (v: any) => string }) {
    const top3 = items.slice(0, 3);
    if (top3.length === 0) return null;
    // Explicit podium heights per rank (not display order)
    // rankIdx 0 = 1st place, 1 = 2nd place, 2 = 3rd place
    const BLOCK_H: Record<number, number> = { 0: 120, 1: 72, 2: 50 };
    const ORDER = [1, 0, 2]; // display: left=silver, center=gold, right=bronze
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px 0 0', background: LP.bg }}>
        {ORDER.map(rankIdx => {
          const m = top3[rankIdx]; if (!m) return null;
          const isMe    = m.id === memberId;
          const col     = MEDAL_COLORS[rankIdx];
          const blockH  = BLOCK_H[rankIdx];
          return (
            <div key={m.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Info — fixed height container, content bottom-aligned */}
              <div style={{ height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5, paddingBottom: 8, width: '100%' }}>
                <RankImg rank={rankIdx + 1} size={rankIdx === 0 ? 52 : 40} />
                <div style={{ width: rankIdx === 0 ? 58 : 48, height: rankIdx === 0 ? 58 : 48, borderRadius: '50%', background: isMe ? `${col}33` : LP.surface, border: `${rankIdx === 0 ? 3 : 2}px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: rankIdx === 0 ? 22 : 18, color: col, boxShadow: rankIdx === 0 ? `0 0 20px ${col}55` : 'none', flexShrink: 0 }}>
                  {m.nama?.[0]?.toUpperCase()}
                </div>
                <div style={{ fontWeight: rankIdx === 0 ? 800 : 700, fontSize: rankIdx === 0 ? 13 : 11, color: isMe ? col : LP.text, textAlign: 'center' as const, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {m.nama}{isMe && <span style={{ color: LP.primary, fontSize: 8 }}> ✦</span>}
                </div>
                <div style={{ fontFamily: LP.mono, fontSize: rankIdx === 0 ? 13 : 10, fontWeight: 700, color: col }}>{valueFmt(m[valueKey])}</div>
              </div>
              {/* Podium block — explicit px height, flexShrink:0 prevents compression */}
              <div style={{ width: '100%', height: blockH, flexShrink: 0, background: `linear-gradient(180deg,${col}44,${col}22)`, border: `1px solid ${col}${rankIdx === 0 ? '88' : '55'}`, borderBottom: 'none', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: rankIdx === 0 ? `inset 0 0 20px ${col}22` : 'none' }}>
                <span style={{ fontFamily: LP.mono, fontWeight: 900, fontSize: rankIdx === 0 ? 20 : 15, color: col }}>#{rankIdx + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── My Rank Bar ────────────────────────────────────────────────────────────
  function MyRankBar({ rank, m, valueLabel }: { rank: number; m: any; valueLabel: string }) {
    if (rank === -1 || rank < 10) return null;
    return (
      <div style={{ margin: '0 16px 16px', padding: '12px 16px', background: LP.primaryTint, border: `1px solid ${LP.primary}33`, borderRadius: 10 }}>
        <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, textAlign: 'center' as const, marginBottom: 8 }}>· · · POSISIMU · · ·</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: LP.mono, fontSize: 13, fontWeight: 700, color: LP.primary, minWidth: 36 }}>#{rank + 1}</div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: LP.surface, border: `2px solid ${LP.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: LP.primary }}>{m.nama?.[0]?.toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: LP.primary }}>{m.nama}</div>
            <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, marginTop: 2 }}>{valueLabel}</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center' as const, color: LP.muted, fontFamily: LP.mono, fontSize: 12, background: LP.bg, minHeight: '100%' }}>
      Memuat data peringkat...
    </div>
  );

  return (
    <div style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>PERINGKAT</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: LP.text }}>Leaderboard Member</div>
        <div style={{ color: LP.muted, fontSize: 13 }}>Ranking progress belajar dan performa jurnal trading seluruh member.</div>
      </div>

      {/* My rank summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {myProgressRank !== -1 && (
          <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 10, padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <RankImg rank={myProgressRank + 1} size={36} />
            <div>
              <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1 }}>PERINGKAT PROGRESS</div>
              <div style={{ fontFamily: LP.mono, fontSize: 20, fontWeight: 700, color: myProgressRank < 3 ? MEDAL_COLORS[myProgressRank] : LP.primary }}>#{myProgressRank + 1}</div>
              <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted }}>{progress[myProgressRank]?.selesai}/{totalVideos} materi</div>
            </div>
          </div>
        )}
        {myJurnalRank !== -1 && (
          <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 10, padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <RankImg rank={myJurnalRank + 1} size={36} />
            <div>
              <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1 }}>PERINGKAT JURNAL</div>
              <div style={{ fontFamily: LP.mono, fontSize: 20, fontWeight: 700, color: myJurnalRank < 3 ? MEDAL_COLORS[myJurnalRank] : '#3b82f6' }}>#{myJurnalRank + 1}</div>
              <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted }}>{jurnal[myJurnalRank]?.gainPct >= 0 ? '+' : ''}{jurnal[myJurnalRank]?.gainPct.toFixed(1)}% gain</div>
            </div>
          </div>
        )}
        <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 10, padding: '12px 20px' }}>
          <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1 }}>TOTAL MEMBER</div>
          <div style={{ fontFamily: LP.mono, fontSize: 20, fontWeight: 700, color: LP.text }}>{progress.length + (progress.length === 0 ? 0 : 0)}</div>
          <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted }}>aktif belajar</div>
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 8, padding: 4, width: 'fit-content' }}>
        <button style={tabStyle('progress')} onClick={() => setTab('progress')}><BookOpen size={13} style={{ marginRight: 6, verticalAlign: 'text-bottom' }}/>PROGRESS BELAJAR</button>
        <button style={tabStyle('jurnal')}   onClick={() => setTab('jurnal')}><NotebookPen size={13} style={{ marginRight: 6, verticalAlign: 'text-bottom' }}/>JURNAL TRADING</button>
      </div>

      {/* ── PROGRESS TAB ── */}
      {tab === 'progress' && (
        <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <Podium items={progress} valueKey="selesai" valueFmt={(v) => `${v}/${totalVideos}`} />
          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: LP.mono, fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${LP.border}` }}>
                  {['RANK', 'NAMA', 'TIER', 'PROGRESS', 'MATERI SELESAI'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left' as const, color: LP.muted, fontWeight: 600, fontSize: 10, letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progress.map((m, i) => {
                  const isMe = m.id === memberId;
                  const pct  = Math.min(100, Math.round(m.selesai / (totalVideos || 1) * 100));
                  const col  = i < 3 ? MEDAL_COLORS[i] : LP.muted;
                  return (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${LP.border}`, background: isMe ? LP.primaryTint : 'transparent' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <RankImg rank={i + 1} size={i < 3 ? 36 : 28} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: isMe ? LP.primaryTint : LP.bg, border: `2px solid ${isMe ? LP.primary : col + '55'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: isMe ? LP.primary : col, flexShrink: 0 }}>
                            {m.nama?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: isMe ? LP.primary : LP.text }}>{m.nama}</div>
                            {isMe && <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.primary, marginTop: 2 }}>● KAMU</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: LP.mono, fontSize: 10, color: tierColor(m.tier), background: `${tierColor(m.tier)}15`, padding: '2px 8px', borderRadius: 4 }}>{m.tier}</span>
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: 140 }}>
                        <div style={{ height: 6, background: LP.border, borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isMe ? LP.primary : col, borderRadius: 3, transition: 'width 0.8s' }}/>
                        </div>
                        <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 4 }}>{pct}%</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: LP.mono, fontWeight: 700, color: isMe ? LP.primary : col, fontSize: 14 }}>
                        {m.selesai}<span style={{ color: LP.muted, fontWeight: 400, fontSize: 11 }}>/{totalVideos}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <MyRankBar rank={myProgressRank} m={progress[myProgressRank]} valueLabel={`${progress[myProgressRank]?.selesai}/${totalVideos} materi selesai`} />
        </div>
      )}

      {/* ── JURNAL TAB ── */}
      {tab === 'jurnal' && (
        <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {jurnal.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' as const }}>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><NotebookPen size={40} color={LP.muted}/></div>
              <div style={{ color: LP.muted, fontFamily: LP.mono, fontSize: 12, marginBottom: 8 }}>Belum ada member yang mengisi jurnal</div>
            </div>
          ) : (
            <>
              <Podium items={jurnal} valueKey="gainPct" valueFmt={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: LP.mono, fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LP.border}` }}>
                      {['RANK', 'NAMA', 'TIER', 'TRADES', 'WIN RATE', 'TOTAL PNL', 'EQUITY GAIN', ''].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left' as const, color: LP.muted, fontWeight: 600, fontSize: 10, letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jurnal.map((m, i) => {
                      const isMe     = m.id === memberId;
                      const col      = i < 3 ? MEDAL_COLORS[i] : LP.muted;
                      const isProfit = m.totalPnl >= 0;
                      return (
                        <tr key={m.id} style={{ borderBottom: `1px solid ${LP.border}`, background: isMe ? '#eff6ff' : 'transparent' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <RankImg rank={i + 1} size={i < 3 ? 36 : 28} />
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: isMe ? '#3b82f6' : LP.bg, border: `2px solid ${isMe ? '#3b82f6' : col + '55'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: isMe ? '#fff' : col, flexShrink: 0 }}>
                                {m.nama?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: isMe ? '#3b82f6' : LP.text }}>{m.nama}</div>
                                {isMe && <div style={{ fontFamily: LP.mono, fontSize: 9, color: '#3b82f6', marginTop: 2 }}>● KAMU</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontFamily: LP.mono, fontSize: 10, color: tierColor(m.tier), background: `${tierColor(m.tier)}15`, padding: '2px 8px', borderRadius: 4 }}>{m.tier}</span>
                          </td>
                          <td style={{ padding: '12px 16px', color: LP.text }}>{m.trades}</td>
                          <td style={{ padding: '12px 16px', color: m.winRate >= 50 ? LP.primary : LP.danger, fontWeight: 700 }}>{m.winRate.toFixed(1)}%</td>
                          <td style={{ padding: '12px 16px', color: isProfit ? LP.primary : LP.danger, fontWeight: 700 }}>
                            {isProfit ? '+' : ''}${m.totalPnl.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: isProfit ? LP.primary : LP.danger, fontSize: 14 }}>
                            {isProfit ? '+' : ''}{m.gainPct.toFixed(2)}%
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {onViewJurnal && (
                              <button onClick={() => onViewJurnal(m)}
                                style={{ background: '#eff6ff', border: '1px solid #3b82f633', color: '#3b82f6', fontFamily: LP.mono, fontSize: 10, padding: '4px 12px', borderRadius: 5, cursor: 'pointer' }}>
                                LIHAT
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {myJurnalRank >= 10 && (() => {
                const me = jurnal[myJurnalRank];
                return (
                  <div style={{ margin: '0 16px 16px', padding: '12px 16px', background: '#eff6ff', border: '1px solid #3b82f622', borderRadius: 10 }}>
                    <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, textAlign: 'center' as const, marginBottom: 8 }}>· · · POSISIMU · · ·</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontFamily: LP.mono, fontSize: 13, fontWeight: 700, color: '#3b82f6', minWidth: 36 }}>#{myJurnalRank + 1}</div>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#3b82f6', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>{me.nama?.[0]?.toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#3b82f6' }}>{me.nama}</div>
                        <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, marginTop: 2 }}>{me.gainPct >= 0 ? '+' : ''}{me.gainPct.toFixed(1)}% gain · {me.trades} trade</div>
                      </div>
                      <div style={{ fontFamily: LP.mono, fontSize: 14, fontWeight: 700, color: me.gainPct >= 0 ? LP.primary : LP.danger }}>{me.gainPct >= 0 ? '+' : ''}{me.gainPct.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

**Catatan implementasi penting:**
- File pengganti di atas TIDAK lagi mendeklarasikan `C`/`G` (dark tokens lama) — sudah tidak dipakai di manapun, sengaja dihapus supaya tidak jadi `TS6133` baru.
- `MEDAL_ICONS` dan `PODIUM_BG` sengaja tidak ada lagi di versi baru (dead code, lihat Global Constraints).
- Semua logic (`fetchData`, `tierColor`, computed rank, `Podium`, `MyRankBar`, `RankImg`) identik dengan versi asli — hanya token warna, ikon, dan penghapusan dead code yang berubah.
- Prop `memberId`/`onViewJurnal` dan signature komponen tidak berubah.

- [ ] **Step 3: Verifikasi typecheck**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/LeaderboardPage.tsx"`
Expected: 2 baris — hanya 2 error `TS2339 winRate` pre-existing (baris `MEDAL_ICONS`/`PODIUM_BG` sudah tidak ada lagi karena dihapus, `BookOpen`/`NotebookPen` langsung terpakai).

- [ ] **Step 4: Verifikasi manual logic tidak berubah**

Baca ulang diff dan pastikan: (a) urutan/isi query Supabase di `fetchData` persis sama, (b) computed value (`myProgressRank`, `myJurnalRank`, `tierColor`, sorting) persis sama, (c) props `memberId`/`onViewJurnal` dan cara dipakainya tidak berubah.

- [ ] **Step 5: Commit**

```bash
git add src/pages/member/LeaderboardPage.tsx
git commit -m "feat: restyle tab Peringkat (LeaderboardPage) ke tema terang"
```

---

### Task 4: Perluas conditional `<main>` + bersih-bersih akhir + QA

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (conditional `<main>` ~baris 1319 dari state sebelum Task 1)

**Interfaces:**
- Consumes: hasil Task 1-3 (tab `tools`/`funded` sudah `LP`, `LeaderboardPage.tsx` sudah `LP`).
- Produces: tidak ada (task terakhir fase ini).

- [ ] **Step 1: Cari dan ganti conditional `<main>`**

Cari teks persis ini:

```tsx
        <main className='mr-main' style={{ flex: 1, overflowY: 'auto', minWidth: 0, background: ['dashboard','kelas','materi','news','produk'].includes(active) ? LP.bg : C.bg, color: ['dashboard','kelas','materi','news','produk'].includes(active) ? LP.text : C.text }}>
```

Ganti dengan:

```tsx
        <main className='mr-main' style={{ flex: 1, overflowY: 'auto', minWidth: 0, background: ['dashboard','kelas','materi','news','produk','tools','funded','peringkat'].includes(active) ? LP.bg : C.bg, color: ['dashboard','kelas','materi','news','produk','tools','funded','peringkat'].includes(active) ? LP.text : C.text }}>
```

- [ ] **Step 2: Sapuan bersih-bersih akhir**

Grep rentang blok `active === 'tools'` dan `active === 'funded'` di `DashboardPage.tsx` (cari batas persis dengan Grep — jangan pakai nomor baris tetap karena sudah bergeser oleh Task 1-3) untuk token dark-theme atau emoji struktural yang tersisa:

```bash
grep -n "C\.\(bg\|panel\|border\|dim\|muted\|text\|up\|down\|sidebar\)\|G\.gold\|var(--mr-" src/pages/member/DashboardPage.tsx
```

Filter hasilnya secara manual ke rentang baris tab `tools` dan `funded` saja (cari batas awal `{active === 'tools' &&`/`{active === 'funded' &&` dan batas akhir penutup masing-masing blok). Kalau ada temuan DI DALAM rentang kedua tab ini, perbaiki jadi token `LP` yang sesuai. Kalau temuan itu di luar rentang (tab lain), JANGAN disentuh.

Lakukan hal yang sama untuk emoji struktural tersisa (🎁📋⬇⚠) di rentang kedua tab — **KECUALI** baris nickname Discord (💎🥇🥈🥉🕒) yang memang harus tetap ada.

Untuk `LeaderboardPage.tsx`, grep seluruh file (sudah ditulis ulang penuh di Task 3, seharusnya bersih):

```bash
grep -n "C\.\|G\.gold\|var(--mr-" src/pages/member/LeaderboardPage.tsx
```

Expected: tidak ada hasil (file ini sudah 100% pindah ke `LP`).

- [ ] **Step 3: Verifikasi typecheck & build**

Run:
```bash
npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"
npm run typecheck 2>&1 | grep "src/pages/member/LeaderboardPage.tsx"
```
Expected: 8 baris (DashboardPage.tsx, identik baseline) dan 2 baris (LeaderboardPage.tsx, hanya `winRate`).

Run: `npm run build`
Expected: build sukses tanpa error baru (warning ukuran chunk yang sudah ada sebelumnya boleh tetap muncul).

- [ ] **Step 4: Commit**

```bash
git add src/pages/member/DashboardPage.tsx src/pages/member/LeaderboardPage.tsx
git commit -m "feat: perluas tema terang ke tab Broker/Status Trading/Peringkat (fase 4a selesai)"
```

---

## Self-Review Notes (dicatat penulis plan, bukan untuk dieksekusi ulang)

- **Cakupan spec:** §2a (tools) → Task 1; §2b (funded) → Task 2; §2c (peringkat) → Task 3; `<main>` conditional + cleanup → Task 4. Semua bagian spec punya task yang mengimplementasikannya.
- **CRITICAL constraint terpenuhi:** Task 2 Step 3 secara eksplisit mewajibkan verifikasi manual bahwa baris emoji nickname Discord tidak berubah — ini konsekuensi langsung dari temuan brainstorming bahwa emoji tersebut adalah data, bukan ikon UI.
- **Konsistensi tipe:** Tidak ada state/type baru yang diperkenalkan tim manapun di fase ini (murni restyle presentasi + 1 penghapusan dead code) — tidak ada risiko ketidakcocokan nama/tipe lintas task karena Task 1-3 saling independen (file/blok berbeda), Task 4 hanya menyentuh satu baris conditional yang sudah ada.
- **Dead code cleanup (Task 3):** `MEDAL_ICONS`/`PODIUM_BG` dihapus karena dikonfirmasi tidak terpakai di manapun (grep sebelum plan ini ditulis) — bukan spekulasi.
