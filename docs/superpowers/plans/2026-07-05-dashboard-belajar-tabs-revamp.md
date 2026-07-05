# Dashboard Belajar Tabs Revamp (Fase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the member dashboard's `kelas` (Kelas Saya), `materi` (File Materi), and `news` (Chart) tabs from dark-terminal to the light theme already shipped for the shell and `dashboard` tab in Phase 1, per `docs/superpowers/specs/2026-07-05-dashboard-belajar-tabs-revamp-design.md`.

**Architecture:** Pure presentation restyle inside `src/pages/member/DashboardPage.tsx` — reuse the `LP` token object and `lucide-react` icon pattern already established in Phase 1. No new files, no data/logic changes. Each of the 3 tabs gets its own explicit light background so it renders correctly regardless of `<main>`'s shared background (which Phase 1 keyed off `active === 'dashboard'` only — this plan's last task extends that check).

**Tech Stack:** React + TypeScript, inline styles, `lucide-react` icons (already a dependency).

## Global Constraints

- Only `kelas`, `materi`, and `news` are restyled. The other 14 tabs (`jurnal`, `trading-plan`, `komunitas`, `tools`, `produk`, `funded`, `peringkat`, `competition`, `sertifikat`, `1on1`, `ulasan`, `referral`, `pengaturan`, `bantuan`) stay dark-terminal, untouched.
- The `active === 'live'` ("Live Trading") block is dead code — no `SIDEBAR` entry links to it, so it's unreachable from any navigation. Do not touch it, do not delete it, do not restyle it. It sits between `materi` and `news` in the file; skip over it when locating things by file position.
- `AdvancedChartWidget` (used inside `news`) is a separate component — do not open or modify it. Only the wrapper card/header around it is in scope.
- No emoji used as structural/functional icons in the 3 tabs — `lucide-react` icons instead.
- No new npm dependencies.
- Do not modify: `App.tsx` routing, any Supabase query/hook, any state variable's declaration or the functions that mutate it (`submitAdvanceRequest`, `rateVideo`, `loadData`, `downloadFile`, `trackVideoWatch`), `JurnalPage.tsx`/`LeaderboardPage.tsx`/`MemberTradingPlan.tsx`/`CompetitionPage.tsx`, the already-restyled shell and `dashboard` tab (Phase 1).
- No test suite exists in this project (confirmed in `CLAUDE.md`). Every task substitutes the TDD cycle with: (1) `npm run typecheck` scoped-diff check against the file's baseline, and (2) a real visual check if a browser/screenshot tool is available, otherwise a careful line-by-line self-review of the diff against this task's code.
- **CRITICAL — two files share "DashboardPage" in their name:** `src/pages/DashboardPage.tsx` is legacy and NOT in scope (never edit it, never grep the bare string `DashboardPage`). `src/pages/member/DashboardPage.tsx` is the file every task in this plan touches — always grep its full path.
- **Baseline:** before Task 1, `src/pages/member/DashboardPage.tsx` has exactly 8 pre-existing `TS6133` unused-declaration errors, unrelated to this plan (`Spark`, `GaugeChart`, `Ring`, `MarketOverviewWidget`, `leaderboard`, `up`, `lastVideos`, `ni`). This count must stay at 8 through every task in this plan (each task only adds icon imports it immediately consumes in the same commit, so no task should introduce a new temporary "unused" error the way Phase 1's Task 1 briefly did).

---

## Task 1: Kelas Saya — header + Request Advanced modal

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (lucide imports; the `kelas` tab's opening wrapper + header; the "Request Advanced" modal)

**Interfaces:**
- Consumes: `LP` token object (from Phase 1), the existing `showAdvModal`/`jurnal1`/`jurnal2`/`jurnal3`/`setJurnal1`/`setJurnal2`/`setJurnal3`/`jurnalMode`/`setJurnalMode`/`jurnalFiles`/`setJurnalFiles`/`advMsg`/`advSubmitting`/`submitAdvanceRequest`/`setShowAdvModal`/`setAdvMsg` state and functions (unchanged, just consumed).
- Produces: no new interfaces — this task adds icon imports that Task 2 also consumes (`Lock`, `Clock`, `XCircle` are already imported from Phase 1; this task's own new imports are `Paperclip` and `Check`, both consumed only within Task 1's own scope plus reused by Task 2 for `Check`).

- [ ] **Step 1: Add the new `lucide-react` icons needed by this task**

Find the existing `lucide-react` import (added in Phase 1):

```tsx
import {
  Search, LayoutGrid, PlayCircle, BookOpen, LineChart, NotebookPen, ClipboardList,
  MessageCircle, Landmark, ShoppingBag, Rocket, Trophy, Medal, Award, Target, Star,
  Link2, Settings, HelpCircle, LogOut, Bell, CheckCircle2, XCircle, Info, Megaphone,
  Lock, FlaskConical, CircleDot, DollarSign, Briefcase,
} from 'lucide-react';
```

Replace it with (adding `Paperclip`, `Check`, `Clock`, `Play`, `Circle`, `RotateCcw`, `FileText`, `Presentation`, `FileSpreadsheet`, `File`, `Download` — the full set needed across this plan's 4 tasks, added now so later tasks don't need to touch this import line again):

```tsx
import {
  Search, LayoutGrid, PlayCircle, BookOpen, LineChart, NotebookPen, ClipboardList,
  MessageCircle, Landmark, ShoppingBag, Rocket, Trophy, Medal, Award, Target, Star,
  Link2, Settings, HelpCircle, LogOut, Bell, CheckCircle2, XCircle, Info, Megaphone,
  Lock, FlaskConical, CircleDot, DollarSign, Briefcase,
  Paperclip, Check, Clock, Play, Circle, RotateCcw, FileText, Presentation, FileSpreadsheet, File, Download,
} from 'lucide-react';
```

(`Play`, `Circle`, `RotateCcw`, `FileText`, `Presentation`, `FileSpreadsheet`, `File`, `Download` won't be consumed until Tasks 2–3 — that's expected and temporary, exactly like Phase 1's Task 1. Report the typecheck delta honestly; don't worry if it goes up temporarily.)

- [ ] **Step 2: Restyle the `kelas` tab's wrapper + header**

Replace:

```tsx
          {active === 'kelas' && (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// KELAS SAYA</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Kurikulum Saya</h2>
              </div>
```

with:

```tsx
          {active === 'kelas' && (
            <div style={{ padding: 24, background: LP.bg, minHeight: '100%' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>KELAS SAYA</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: LP.text }}>Kurikulum Saya</h2>
              </div>
```

- [ ] **Step 3: Restyle the Request Advanced modal**

Replace:

```tsx
              {/* Request Advanced Modal */}
              {showAdvModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <div className='mr-modal mr-modal-anim' style={{ background: C.sidebar, border: `1px solid ${C.border2}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 480 }}>
                    <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// REQUEST NAIK KELAS ADVANCED</div>
                    <h3 className='mr-modal-title' style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Ajukan Naik Kelas</h3>
                    <p style={{ color: C.dim, fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
                      Lampirkan minimal 1 jurnal trading (link atau file) sebagai syarat naik kelas Advanced. Admin akan mereview dan memberikan keputusan.
                    </p>
                    {([
                      { l: 'Jurnal 1', v: jurnal1, s: setJurnal1, idx: 0 },
                      { l: 'Jurnal 2', v: jurnal2, s: setJurnal2, idx: 1 },
                      { l: 'Jurnal 3', v: jurnal3, s: setJurnal3, idx: 2 },
                    ] as {l:string;v:string;s:(v:string)=>void;idx:number}[]).map((f) => (
                      <div key={f.idx} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: C.mono, color: C.dim, fontSize: 10 }}>{f.l.toUpperCase()}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {(['link','file'] as const).map(mode => (
                              <button key={mode} onClick={() => {
                                const nm = [...jurnalMode]; nm[f.idx] = mode; setJurnalMode(nm);
                              }} style={{ fontFamily: C.mono, fontSize: 9, padding: '2px 8px', cursor: 'pointer',
                                background: jurnalMode[f.idx]===mode ? G.gold : 'transparent',
                                color: jurnalMode[f.idx]===mode ? '#000' : C.dim,
                                border: `1px solid ${jurnalMode[f.idx]===mode ? G.gold : C.border2}`, borderRadius: 3 }}>
                                {mode === 'link' ? '🔗 LINK' : '📎 FILE'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {jurnalMode[f.idx] === 'link' ? (
                          <input value={f.v} onChange={e => f.s(e.target.value)} placeholder="https://..."
                            style={{ width: '100%', background: C.panel, border: `1px solid ${C.border2}`, color: C.text, padding: '9px 14px', fontSize: 13, fontFamily: C.mono, outline: 'none', borderRadius: 6, boxSizing: 'border-box' as const }}
                            onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border2}/>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <label style={{ flex: 1, display: 'block', background: C.panel, border: `1px dashed ${C.border2}`, borderRadius: 6, padding: '9px 14px', cursor: 'pointer', fontSize: 12, color: jurnalFiles[f.idx] ? C.up : C.dim, fontFamily: C.mono }}>
                              {jurnalFiles[f.idx] ? `✓ ${jurnalFiles[f.idx]!.name}` : 'Klik untuk pilih file (PDF/gambar)'}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                                onChange={e => { const nf = [...jurnalFiles]; nf[f.idx] = e.target.files?.[0]||null; setJurnalFiles(nf); }}/>
                            </label>
                            {jurnalFiles[f.idx] && (
                              <button onClick={() => { const nf=[...jurnalFiles]; nf[f.idx]=null; setJurnalFiles(nf); }}
                                style={{ background: 'none', border: 'none', color: C.down, cursor: 'pointer', fontSize: 16 }}>×</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {advMsg && <div style={{ fontFamily: C.mono, color: C.down, fontSize: 12, marginBottom: 10 }}>{advMsg}</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button onClick={submitAdvanceRequest} disabled={advSubmitting}
                        style={{ flex: 1, background: advSubmitting ? 'var(--mr-border2)' : G.gold, color: '#000', fontFamily: C.mono, fontSize: 12, fontWeight: 700, padding: '11px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                        {advSubmitting ? 'MENGIRIM...' : '▸ KIRIM REQUEST'}
                      </button>
                      <button onClick={() => { setShowAdvModal(false); setAdvMsg(''); }}
                        style={{ padding: '11px 18px', background: 'none', border: `1px solid ${C.border2}`, color: C.dim, fontFamily: C.mono, fontSize: 12, cursor: 'pointer', borderRadius: 6 }}>
                        BATAL
                      </button>
                    </div>
                  </div>
                </div>
              )}
```

with:

```tsx
              {/* Request Advanced Modal */}
              {showAdvModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <div className='mr-modal mr-modal-anim' style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, boxShadow: LP.shadowMd }}>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>REQUEST NAIK KELAS ADVANCED</div>
                    <h3 className='mr-modal-title' style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: LP.text }}>Ajukan Naik Kelas</h3>
                    <p style={{ color: LP.muted, fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
                      Lampirkan minimal 1 jurnal trading (link atau file) sebagai syarat naik kelas Advanced. Admin akan mereview dan memberikan keputusan.
                    </p>
                    {([
                      { l: 'Jurnal 1', v: jurnal1, s: setJurnal1, idx: 0 },
                      { l: 'Jurnal 2', v: jurnal2, s: setJurnal2, idx: 1 },
                      { l: 'Jurnal 3', v: jurnal3, s: setJurnal3, idx: 2 },
                    ] as {l:string;v:string;s:(v:string)=>void;idx:number}[]).map((f) => (
                      <div key={f.idx} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10 }}>{f.l.toUpperCase()}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {(['link','file'] as const).map(mode => (
                              <button key={mode} onClick={() => {
                                const nm = [...jurnalMode]; nm[f.idx] = mode; setJurnalMode(nm);
                              }} style={{ fontFamily: LP.mono, fontSize: 9, padding: '3px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: jurnalMode[f.idx]===mode ? LP.primary : 'transparent',
                                color: jurnalMode[f.idx]===mode ? '#fff' : LP.muted,
                                border: `1px solid ${jurnalMode[f.idx]===mode ? LP.primary : LP.border}`, borderRadius: 4 }}>
                                {mode === 'link' ? <Link2 size={11} /> : <Paperclip size={11} />}
                                {mode.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                        {jurnalMode[f.idx] === 'link' ? (
                          <input value={f.v} onChange={e => f.s(e.target.value)} placeholder="https://..."
                            style={{ width: '100%', background: LP.bg, border: `1px solid ${LP.border}`, color: LP.text, padding: '9px 14px', fontSize: 13, fontFamily: LP.mono, outline: 'none', borderRadius: 6, boxSizing: 'border-box' as const }}
                            onFocus={e => e.target.style.borderColor = LP.primary} onBlur={e => e.target.style.borderColor = LP.border}/>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: LP.bg, border: `1px dashed ${LP.border}`, borderRadius: 6, padding: '9px 14px', cursor: 'pointer', fontSize: 12, color: jurnalFiles[f.idx] ? LP.primary : LP.muted, fontFamily: LP.mono }}>
                              {jurnalFiles[f.idx] && <Check size={13} />}
                              {jurnalFiles[f.idx] ? jurnalFiles[f.idx]!.name : 'Klik untuk pilih file (PDF/gambar)'}
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                                onChange={e => { const nf = [...jurnalFiles]; nf[f.idx] = e.target.files?.[0]||null; setJurnalFiles(nf); }}/>
                            </label>
                            {jurnalFiles[f.idx] && (
                              <button onClick={() => { const nf=[...jurnalFiles]; nf[f.idx]=null; setJurnalFiles(nf); }}
                                style={{ background: 'none', border: 'none', color: LP.danger, cursor: 'pointer', fontSize: 16 }}>×</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {advMsg && <div style={{ fontFamily: LP.mono, color: LP.danger, fontSize: 12, marginBottom: 10 }}>{advMsg}</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button onClick={submitAdvanceRequest} disabled={advSubmitting}
                        style={{ flex: 1, background: advSubmitting ? LP.border : LP.primary, color: '#fff', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, padding: '11px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                        {advSubmitting ? 'MENGIRIM...' : 'KIRIM REQUEST →'}
                      </button>
                      <button onClick={() => { setShowAdvModal(false); setAdvMsg(''); }}
                        style={{ padding: '11px 18px', background: 'none', border: `1px solid ${LP.border}`, color: LP.muted, fontFamily: LP.mono, fontSize: 12, cursor: 'pointer', borderRadius: 6 }}>
                        BATAL
                      </button>
                    </div>
                  </div>
                </div>
              )}
```

(The bare `×` close/remove-file button stays as plain text — this codebase's established convention throughout Phase 1 was to leave `×` characters as-is on close buttons, not convert them to a lucide `X` icon.)

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: baseline 8 errors, plus new temporary unused-import errors for `Play`, `Circle`, `RotateCcw`, `FileText`, `Presentation`, `FileSpreadsheet`, `File`, `Download` (8 icons not yet consumed — Tasks 2–3 consume them). `Paperclip` and `Check` should NOT appear as unused (this task consumes both). Report the exact count and confirm no `TS2304`/other unexpected categories.

- [ ] **Step 5: Visual check**

Reload the dashboard, click "Kelas Saya" in the sidebar. Confirm: light background, header text readable, and if you can trigger the "Request Naik Kelas" modal (visible when a locked Advanced category exists for a non-Advance member — this may require test data), confirm it renders as a light card with the link/file toggle buttons showing lucide icons.

- [ ] **Step 6: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle header dan modal Request Advanced tab Kelas Saya ke tema terang"
```

---

## Task 2: Kelas Saya — curriculum grid + video list

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (the category grid + per-video list inside the `kelas` tab)

**Interfaces:**
- Consumes: `LP` tokens, `Lock`/`Clock`/`XCircle`/`Check`/`Play`/`Circle`/`RotateCcw`/`Star` icons (all already imported by Task 1 or Phase 1).
- Produces: none new.

- [ ] **Step 1: Replace the curriculum grid + video list**

Replace the entire block starting at `<div className='mr-kelas-grid' ...>` through its matching closing `</div>` right before the tab's final `)}`:

```tsx
              <div className='mr-kelas-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {['intro','basic','tips-basic','advanced','tips-advanced'].map(kat => {
                  const isAdvancedKat = kat === 'advanced' || kat === 'tips-advanced';
                  const locked = isAdvancedKat && !member.is_advance;
                  const vids = videos.filter(v => v.kategori === kat);
                  if (!vids.length) return null;
                  const done = vids.filter(v => progress[v.id] === 'selesai').length;
                  const pct  = locked ? 0 : Math.round(done / vids.length * 100);
                  const colors: Record<string,string> = { intro:'#eab308', basic:'#22ab94', 'tips-basic':'#22ab94', advanced:'#a855f7', 'tips-advanced':'#a855f7' };
                  const color = locked ? '#444' : (colors[kat] || G.gold);
                  return (
                    <div key={kat} style={{ background: C.panel, border: `1px solid ${locked ? C.border2 : C.border}`, borderRadius: 12, opacity: locked ? 0.85 : 1 }}>
                      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {locked && <span style={{ fontSize: 14 }}>🔒</span>}
                          <span style={{ fontFamily: C.mono, color, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{kat.replace('-',' ').toUpperCase()}</span>
                        </div>
                        <span style={{ fontFamily: C.mono, color: C.dim, fontSize: 10 }}>{locked ? 'Butuh Advanced' : `${done}/${vids.length} · ${pct}%`}</span>
                      </div>
                      <div style={{ height: 3, background: C.border }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color }}/>
                      </div>
                      {locked ? (
                        <div style={{ padding: '20px 18px', textAlign: 'center' as const }}>
                          <p style={{ color: C.dim, fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
                            Kelas ini hanya untuk member <strong style={{ color: '#a855f7' }}>Advanced</strong>.<br/>
                            Ajukan naik kelas dengan melampirkan 3 jurnal trading.
                          </p>
                          {advanceReq?.status === 'pending' ? (
                            <div style={{ fontFamily: C.mono, fontSize: 11, color: G.gold, background: 'var(--mr-tint-gold)', border: "1px solid var(--mr-tint-gold-b)", padding: '8px 14px', borderRadius: 6 }}>
                              ⏳ REQUEST SEDANG DIREVIEW ADMIN
                            </div>
                          ) : advanceReq?.status === 'rejected' ? (
                            <div>
                              <div style={{ fontFamily: C.mono, fontSize: 11, color: C.down, background: '#1a0a0a', border: `1px solid #3a1010`, padding: '8px 14px', borderRadius: 6, marginBottom: 10 }}>
                                ❌ REQUEST DITOLAK — {advanceReq.alasan_tolak?.split('\n')[0] || 'Lihat notifikasi'}
                              </div>
                              <button onClick={() => setShowAdvModal(true)}
                                style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#a855f7', background: 'var(--mr-tint-purple)', border: `1px solid #4a2a8a`, padding: '8px 20px', cursor: 'pointer', borderRadius: 6 }}>
                                AJUKAN ULANG ▸
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setShowAdvModal(true)}
                              style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: '#000', background: '#a855f7', padding: '10px 24px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                              REQUEST NAIK KELAS ▸
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ overflowY: 'auto' as const }}>
                          {vids.sort((a,b) => a.urutan - b.urutan).map(v => {
                            const ytId = v.youtube_url?.match(/(?:youtu\.be\/|v=)([^&?/\s]+)/)?.[1];
                            const extUrl = v.youtube_url && !ytId ? v.youtube_url : null; // non-YouTube link
                            const hasVideo = ytId || extUrl;
                            const videoHref = ytId ? `https://youtube.com/watch?v=${ytId}` : extUrl;
                            const s = progress[v.id];
                            const isComingSoon = !v.youtube_url && !v.coming_soon_img;
                            return (
                              <div key={v.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.sidebar}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                {/* Status icon */}
                                <div style={{ width: 30, height: 30, background: s==='selesai'?'var(--mr-tint-green2)':s==='mulai'?'var(--mr-tint-gold)':C.bg, border: `1px solid ${s==='selesai'?C.up:s==='mulai'?G.gold:C.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginTop: 2 }}>
                                  {s==='selesai'?'✓':s==='mulai'?'▶':'○'}
                                </div>
                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: s==='selesai'?C.dim:C.text, marginBottom: v.deskripsi ? 4 : 0, lineHeight: 1.4 }}>{v.judul}</div>
                                  {v.deskripsi && (
                                    <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{v.deskripsi}</div>
                                  )}
                                  {/* Actions row */}
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const }}>
                                    {v.coming_soon_img && !hasVideo && (
                                      <span style={{ fontFamily: C.mono, fontSize: 9, color: '#555', border: `1px solid ${C.border}`, padding: '2px 7px', borderRadius: 3 }}>SEGERA</span>
                                    )}
                                    {isComingSoon && !v.coming_soon_img && (
                                      <span style={{ fontFamily: C.mono, fontSize: 9, color: '#555', border: `1px solid ${C.border}`, padding: '2px 7px', borderRadius: 3 }}>SEGERA</span>
                                    )}
                                    {hasVideo && (
                                      <>
                                        <a href={videoHref!} target="_blank" rel="noopener noreferrer"
                                          onClick={async () => {
                                            if (s !== 'mulai' && s !== 'selesai') {
                                              await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'mulai' }, { onConflict: 'member_id,video_id' });
                                            }
                                            await trackVideoWatch(member!.id, v.id);
                                            setWatchRefreshKey(k => k + 1);
                                          }}
                                          style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: '#000', background: G.gold, textDecoration: 'none', padding: '4px 10px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                          ▶ TONTON
                                        </a>
                                        {s !== 'selesai' ? (
                                          <button onClick={async () => {
                                            await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'selesai' }, { onConflict: 'member_id,video_id' });
                                            await trackVideoWatch(member!.id, v.id);
                                            setWatchRefreshKey(k => k + 1);
                                            loadData(member!);
                                          }} style={{ fontFamily: C.mono, fontSize: 10, color: C.up, background: 'var(--mr-tint-green2)', border: `1px solid var(--mr-up-a27)`, padding: '4px 10px', cursor: 'pointer', borderRadius: 4 }}>
                                            ✓ SELESAI
                                          </button>
                                        ) : (
                                          <button onClick={async () => {
                                            await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'mulai' }, { onConflict: 'member_id,video_id' });
                                            loadData(member!);
                                          }} style={{ fontFamily: C.mono, fontSize: 10, color: '#555', background: 'transparent', border: `1px solid ${C.border}`, padding: '4px 10px', cursor: 'pointer', borderRadius: 4 }}>
                                            ↩ RESET
                                          </button>
                                        )}
                                        <div style={{ display:'flex', gap:1 }}>
                                          {[1,2,3,4,5].map(star=>(
                                            <button key={star} onClick={()=>rateVideo(v.id,star)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:(videoRatings[v.id]||0)>=star?'#eab308':'#333', padding:'1px', lineHeight:1 }}>★</button>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
```

with:

```tsx
              <div className='mr-kelas-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {['intro','basic','tips-basic','advanced','tips-advanced'].map(kat => {
                  const isAdvancedKat = kat === 'advanced' || kat === 'tips-advanced';
                  const locked = isAdvancedKat && !member.is_advance;
                  const vids = videos.filter(v => v.kategori === kat);
                  if (!vids.length) return null;
                  const done = vids.filter(v => progress[v.id] === 'selesai').length;
                  const pct  = locked ? 0 : Math.round(done / vids.length * 100);
                  const colors: Record<string,string> = { intro:'#eab308', basic:'#22ab94', 'tips-basic':'#22ab94', advanced:'#7c3aed', 'tips-advanced':'#7c3aed' };
                  const color = locked ? LP.muted : (colors[kat] || LP.primary);
                  return (
                    <div key={kat} style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, opacity: locked ? 0.85 : 1 }}>
                      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${LP.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {locked && <Lock size={13} color={LP.muted} />}
                          <span style={{ fontFamily: LP.mono, color, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{kat.replace('-',' ').toUpperCase()}</span>
                        </div>
                        <span style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10 }}>{locked ? 'Butuh Advanced' : `${done}/${vids.length} · ${pct}%`}</span>
                      </div>
                      <div style={{ height: 3, background: LP.border }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color }}/>
                      </div>
                      {locked ? (
                        <div style={{ padding: '20px 18px', textAlign: 'center' as const }}>
                          <p style={{ color: LP.muted, fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
                            Kelas ini hanya untuk member <strong style={{ color: '#7c3aed' }}>Advanced</strong>.<br/>
                            Ajukan naik kelas dengan melampirkan 3 jurnal trading.
                          </p>
                          {advanceReq?.status === 'pending' ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: LP.mono, fontSize: 11, color: LP.primary, background: LP.primaryTint, border: `1px solid ${LP.primary}44`, padding: '8px 14px', borderRadius: 6 }}>
                              <Clock size={13} />
                              REQUEST SEDANG DIREVIEW ADMIN
                            </div>
                          ) : advanceReq?.status === 'rejected' ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: LP.mono, fontSize: 11, color: LP.danger, background: `${LP.danger}0d`, border: `1px solid ${LP.danger}44`, padding: '8px 14px', borderRadius: 6, marginBottom: 10 }}>
                                <XCircle size={13} />
                                REQUEST DITOLAK — {advanceReq.alasan_tolak?.split('\n')[0] || 'Lihat notifikasi'}
                              </div>
                              <button onClick={() => setShowAdvModal(true)}
                                style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#7c3aed14', border: `1px solid #7c3aed44`, padding: '8px 20px', cursor: 'pointer', borderRadius: 6 }}>
                                AJUKAN ULANG →
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setShowAdvModal(true)}
                              style={{ fontFamily: LP.mono, fontSize: 12, fontWeight: 700, color: '#fff', background: '#7c3aed', padding: '10px 24px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                              REQUEST NAIK KELAS →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ overflowY: 'auto' as const }}>
                          {vids.sort((a,b) => a.urutan - b.urutan).map(v => {
                            const ytId = v.youtube_url?.match(/(?:youtu\.be\/|v=)([^&?/\s]+)/)?.[1];
                            const extUrl = v.youtube_url && !ytId ? v.youtube_url : null; // non-YouTube link
                            const hasVideo = ytId || extUrl;
                            const videoHref = ytId ? `https://youtube.com/watch?v=${ytId}` : extUrl;
                            const s = progress[v.id];
                            const isComingSoon = !v.youtube_url && !v.coming_soon_img;
                            return (
                              <div key={v.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${LP.border}`, transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = LP.bg}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                {/* Status icon */}
                                <div style={{ width: 30, height: 30, background: s==='selesai'?LP.primaryTint:s==='mulai'?'#f9731614':LP.bg, border: `1px solid ${s==='selesai'?LP.primary:s==='mulai'?'#f97316':LP.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                  {s==='selesai' ? <Check size={14} color={LP.primary} /> : s==='mulai' ? <Play size={12} color="#f97316" /> : <Circle size={10} color={LP.muted} />}
                                </div>
                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: s==='selesai'?LP.muted:LP.text, marginBottom: v.deskripsi ? 4 : 0, lineHeight: 1.4 }}>{v.judul}</div>
                                  {v.deskripsi && (
                                    <div style={{ fontSize: 11, color: LP.muted, lineHeight: 1.5, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{v.deskripsi}</div>
                                  )}
                                  {/* Actions row */}
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const }}>
                                    {v.coming_soon_img && !hasVideo && (
                                      <span style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, border: `1px solid ${LP.border}`, padding: '2px 7px', borderRadius: 3 }}>SEGERA</span>
                                    )}
                                    {isComingSoon && !v.coming_soon_img && (
                                      <span style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, border: `1px solid ${LP.border}`, padding: '2px 7px', borderRadius: 3 }}>SEGERA</span>
                                    )}
                                    {hasVideo && (
                                      <>
                                        <a href={videoHref!} target="_blank" rel="noopener noreferrer"
                                          onClick={async () => {
                                            if (s !== 'mulai' && s !== 'selesai') {
                                              await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'mulai' }, { onConflict: 'member_id,video_id' });
                                            }
                                            await trackVideoWatch(member!.id, v.id);
                                            setWatchRefreshKey(k => k + 1);
                                          }}
                                          style={{ fontFamily: LP.mono, fontSize: 10, fontWeight: 700, color: '#fff', background: LP.primary, textDecoration: 'none', padding: '4px 10px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                          <Play size={11} /> TONTON
                                        </a>
                                        {s !== 'selesai' ? (
                                          <button onClick={async () => {
                                            await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'selesai' }, { onConflict: 'member_id,video_id' });
                                            await trackVideoWatch(member!.id, v.id);
                                            setWatchRefreshKey(k => k + 1);
                                            loadData(member!);
                                          }} style={{ fontFamily: LP.mono, fontSize: 10, color: LP.primary, background: LP.primaryTint, border: `1px solid ${LP.primary}44`, padding: '4px 10px', cursor: 'pointer', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Check size={11} /> SELESAI
                                          </button>
                                        ) : (
                                          <button onClick={async () => {
                                            await supabase.from('member_progress').upsert({ member_id: member!.id, video_id: v.id, status: 'mulai' }, { onConflict: 'member_id,video_id' });
                                            loadData(member!);
                                          }} style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, background: 'transparent', border: `1px solid ${LP.border}`, padding: '4px 10px', cursor: 'pointer', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <RotateCcw size={11} /> RESET
                                          </button>
                                        )}
                                        <div style={{ display:'flex', gap:1 }}>
                                          {[1,2,3,4,5].map(star=>(
                                            <button key={star} onClick={()=>rateVideo(v.id,star)} style={{ background:'none', border:'none', cursor:'pointer', padding:'1px', lineHeight:1, display: 'flex' }}>
                                              <Star size={13} fill={(videoRatings[v.id]||0)>=star ? LP.primary : 'none'} color={(videoRatings[v.id]||0)>=star ? LP.primary : LP.border} />
                                            </button>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
```

(Category accent colors `#eab308`/`#22ab94` are unchanged from before — they distinguish curriculum categories from each other, not tied to the dark/light theme, so they carry over as-is. `advanced`/`tips-advanced` change from `#a855f7` to `#7c3aed` to match the violet already established for "ADVANCE" elsewhere in this file since Phase 1. The video status circle now uses green for "selesai", orange `#f97316` for "mulai" (in-progress) — `#f97316` is the same warning/attention accent already used for trial-day-countdown in the sidebar membership card since Phase 1, reused here for visual consistency, not invented fresh.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: baseline 8, plus temporary unused-import errors only for `FileText`, `Presentation`, `FileSpreadsheet`, `File`, `Download` (Task 3 consumes these). `Play`/`Circle`/`RotateCcw` should no longer show as unused — this task consumes all three.

- [ ] **Step 3: Visual check**

Reload, open "Kelas Saya". Confirm: light category cards, progress bars, video rows with colored status circles (green check = done, orange play = in progress, gray outline circle = not started), Tonton/Selesai/Reset buttons with icons, and clickable star ratings that fill green up to the current rating.

- [ ] **Step 4: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle grid kurikulum dan daftar video tab Kelas Saya ke tema terang"
```

---

## Task 3: File Materi

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (the `materi` tab)

**Interfaces:**
- Consumes: `LP` tokens, `BookOpen` (already imported), `FileText`/`Presentation`/`FileSpreadsheet`/`File`/`Download` (imported by Task 1, unused until now).
- Produces: none new.

- [ ] **Step 1: Replace the entire `materi` tab**

Replace:

```tsx
          {active === 'materi' && (() => {
            async function downloadFile(url: string, name: string) {
              try {
                const res = await fetch(url);
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = name;
                a.click();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
              } catch { window.open(url, '_blank'); }
            }
            const CATS = [
              { id: 'file-basic',   label: '// FILE BASIC',    color: C.up },
              { id: 'file-advanced',label: '// FILE ADVANCED', color: '#a855f7' },
            ];
            return (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// MATERI</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>File Materi</h2>
                <p style={{ color: C.dim, fontSize: 13, margin: '6px 0 0' }}>Download materi dan panduan pendukung pembelajaran.</p>
              </div>
              {CATS.map(cat => {
                const items = files.filter((f: any) => f.kategori === cat.id).sort((a:any,b:any) => a.urutan - b.urutan);
                if (!items.length) return null;
                const isPanduan = cat.id === 'file-panduan';
                return (
                  <div key={cat.id} style={{ background: C.panel, border: `1px solid ${isPanduan ? '#f59e0b44' : C.border}`, borderRadius: 12, marginBottom: 14 }}>
                    <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isPanduan && <span style={{ fontSize: 16 }}>📘</span>}
                      <span style={{ fontFamily: C.mono, color: cat.color, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{cat.label}</span>
                      {isPanduan && <span style={{ fontFamily: C.mono, fontSize: 10, color: '#f59e0b99' }}>— bisa di-download</span>}
                    </div>
                    {items.map((f: any) => {
                      const ext = (f.file_name || f.file_type || '').split('.').pop()?.toUpperCase() || 'FILE';
                      const icon = ext === 'PDF' ? '📕' : ext === 'DOCX' || ext === 'DOC' ? '📝' : ext === 'PPTX' || ext === 'PPT' ? '📊' : ext === 'XLSX' || ext === 'XLS' ? '📗' : '📄';
                      return (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 22 }}>{icon}</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{f.judul}</div>
                              <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 11, marginTop: 2 }}>{f.file_name || ext}</div>
                            </div>
                          </div>
                          {f.file_url && (
                            <button onClick={() => downloadFile(f.file_url, f.file_name || f.judul)}
                              style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: cat.color, background: 'transparent', border: `1px solid ${cat.color}`, padding: '7px 16px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                              ↓ Download
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {files.length === 0 && (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center' as const, fontFamily: C.mono, color: C.dim, fontSize: 13 }}>
                  — Belum ada file materi —
                </div>
              )}
            </div>
            );
          })()}
```

with:

```tsx
          {active === 'materi' && (() => {
            async function downloadFile(url: string, name: string) {
              try {
                const res = await fetch(url);
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = name;
                a.click();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
              } catch { window.open(url, '_blank'); }
            }
            const CATS = [
              { id: 'file-basic',   label: 'FILE BASIC',    color: LP.primary },
              { id: 'file-advanced',label: 'FILE ADVANCED', color: '#7c3aed' },
            ];
            return (
            <div style={{ padding: 24, background: LP.bg, minHeight: '100%' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>MATERI</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: LP.text }}>File Materi</h2>
                <p style={{ color: LP.muted, fontSize: 13, margin: '6px 0 0' }}>Download materi dan panduan pendukung pembelajaran.</p>
              </div>
              {CATS.map(cat => {
                const items = files.filter((f: any) => f.kategori === cat.id).sort((a:any,b:any) => a.urutan - b.urutan);
                if (!items.length) return null;
                const isPanduan = cat.id === 'file-panduan';
                return (
                  <div key={cat.id} style={{ background: LP.surface, border: `1px solid ${isPanduan ? '#f59e0b44' : LP.border}`, borderRadius: 12, marginBottom: 14 }}>
                    <div style={{ padding: '12px 20px', borderBottom: `1px solid ${LP.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isPanduan && <BookOpen size={16} color="#f59e0b" />}
                      <span style={{ fontFamily: LP.mono, color: cat.color, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{cat.label}</span>
                      {isPanduan && <span style={{ fontFamily: LP.mono, fontSize: 10, color: '#f59e0b99' }}>— bisa di-download</span>}
                    </div>
                    {items.map((f: any) => {
                      const ext = (f.file_name || f.file_type || '').split('.').pop()?.toUpperCase() || 'FILE';
                      const FileIcon = ext === 'PDF' ? FileText : ext === 'DOCX' || ext === 'DOC' ? FileText : ext === 'PPTX' || ext === 'PPT' ? Presentation : ext === 'XLSX' || ext === 'XLS' ? FileSpreadsheet : File;
                      const fileIconColor = ext === 'PDF' ? '#ef4444' : ext === 'DOCX' || ext === 'DOC' ? '#3b82f6' : ext === 'PPTX' || ext === 'PPT' ? '#f97316' : ext === 'XLSX' || ext === 'XLS' ? LP.primary : LP.muted;
                      return (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${LP.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <FileIcon size={22} color={fileIconColor} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14, color: LP.text }}>{f.judul}</div>
                              <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 11, marginTop: 2 }}>{f.file_name || ext}</div>
                            </div>
                          </div>
                          {f.file_url && (
                            <button onClick={() => downloadFile(f.file_url, f.file_name || f.judul)}
                              style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: cat.color, background: 'transparent', border: `1px solid ${cat.color}`, padding: '7px 16px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' as const, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Download size={13} /> Download
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {files.length === 0 && (
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: 40, textAlign: 'center' as const, fontFamily: LP.mono, color: LP.muted, fontSize: 13 }}>
                  — Belum ada file materi —
                </div>
              )}
            </div>
            );
          })()}
```

(File-type icons now also carry distinguishing colors — PDF red, Word blue, PowerPoint orange, Excel green, generic muted gray — a small enhancement in the same spirit as common OS file-icon conventions, still purely presentational.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: baseline 8, plus only `Circle`... no — by this point `Circle`/`Play`/`RotateCcw` were consumed by Task 2. Only `Download` was newly consumed here; if `FileText`/`Presentation`/`FileSpreadsheet`/`File` were the last remaining temporarily-unused icons, they're now consumed too. Expected: exactly 8 (back to baseline, no icons left unused).

- [ ] **Step 3: Visual check**

Reload, open "Materi". Confirm: light cards per category, file rows with colored file-type icons, working Download buttons.

- [ ] **Step 4: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle tab File Materi ke tema terang"
```

---

## Task 4: Chart tab + `<main>` background fix + final cleanup

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (the `news` tab; the `<main>` element's conditional background/color)

**Interfaces:**
- Consumes: `LP` tokens.
- Produces: the finished Phase 2 state — `kelas`/`materi`/`news` all light, `<main>` correctly backgrounds all 4 light tabs (including `dashboard` from Phase 1) and all still-dark tabs.

- [ ] **Step 1: Restyle the `news` (Chart) tab**

Replace:

```tsx
          {active === 'news' && (
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// MARKET NEWS</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Market Overview & News</h2>
              </div>
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, letterSpacing: 1 }}>// ADVANCED CHART · REALTIME</span>
                  <span style={{ fontFamily: C.mono, color: C.dim, fontSize: 10 }}>POWERED BY TRADINGVIEW</span>
                </div>
                <div style={{ height: 680 }}>
                  <AdvancedChartWidget/>
                </div>
              </div>
            </div>
          )}
```

with:

```tsx
          {active === 'news' && (
            <div style={{ padding: 24, background: LP.bg, minHeight: '100%' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>MARKET NEWS</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: LP.text }}>Market Overview & News</h2>
              </div>
              <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: `1px solid ${LP.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 11, letterSpacing: 1 }}>ADVANCED CHART · REALTIME</span>
                  <span style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10 }}>POWERED BY TRADINGVIEW</span>
                </div>
                <div style={{ height: 680 }}>
                  <AdvancedChartWidget/>
                </div>
              </div>
            </div>
          )}
```

- [ ] **Step 2: Extend `<main>`'s light/dark background condition**

Phase 1's final review fix made `<main>` background/color conditional on `active === 'dashboard'` only. Now that 3 more tabs are light, extend that check. Find:

```tsx
        <main className='mr-main' style={{ flex: 1, overflowY: 'auto', minWidth: 0, background: active === 'dashboard' ? LP.bg : C.bg, color: active === 'dashboard' ? LP.text : C.text }}>
```

Replace with:

```tsx
        <main className='mr-main' style={{ flex: 1, overflowY: 'auto', minWidth: 0, background: ['dashboard','kelas','materi','news'].includes(active) ? LP.bg : C.bg, color: ['dashboard','kelas','materi','news'].includes(active) ? LP.text : C.text }}>
```

(Each of the 4 light tabs' own wrapper `<div>` already sets an explicit `background: LP.bg` too — Phase 1's `dashboard` tab wrapper and this plan's `kelas`/`materi`/`news` wrappers — so this `<main>` change is a defense-in-depth fix matching the architecture Phase 1's whole-branch review established, not the only thing making these tabs render correctly. But without it, any of the 4 light tabs would show a dark flash/edge from `<main>` if its own content is shorter than the viewport.)

- [ ] **Step 3: Sweep for leftover dark-token references**

Grep the `kelas`, `materi`, and `news` tab regions (from each tab's `{active === 'X' && (` through its matching closing `)}`) for any remaining `C\.`, `G\.`, or `var(--mr-` reference that Tasks 1–3 missed. Convert any found using the same mappings used throughout this plan and Phase 1 (`C.panel`→`LP.surface`, `C.border`/`C.border2`→`LP.border`, `C.text`→`LP.text`, `C.dim`/`C.dimmer`→`LP.muted`, `C.up`/`G.gold`→`LP.primary`, `C.down`→`LP.danger`, `C.bg`→`LP.bg`, `C.sidebar`→`LP.bg` (hover-background use case) or `LP.surface` (card use case, judge by context), `C.mono`→`LP.mono`, `C.sans`→`LP.sans`).

- [ ] **Step 4: Confirm no emoji remain as structural icons**

Search the same 3 tab regions for emoji characters. None should remain — every emoji in scope was mapped to a lucide icon in Tasks 1–3 (see the spec's icon table). If you find a leftover, replace it with the closest icon already imported (all icons this plan needs were added in Task 1's import line).

- [ ] **Step 5: Full typecheck + lint**

Run: `npm run typecheck 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: exactly 8 (the untouched pre-existing baseline).

Run: `npm run lint 2>&1 | grep "src/pages/member/DashboardPage.tsx"`
Expected: no new categories versus a baseline lint run taken now (this file's lint baseline wasn't recorded pre-Phase-2, so run it once before any further changes in this task to have something to diff against if you make additional fixes in Step 3–4).

- [ ] **Step 6: Full visual QA pass**

With `npm run dev` running, log in as a member and check at 375px, 768px, and 1440px widths:
- `dashboard`, `kelas`, `materi`, `news` all render light, no dark flash/edge at any viewport height (confirms the `<main>` fix from Step 2 works).
- Clicking any of the other 14 tabs (e.g. `jurnal`, `pengaturan`) still renders fully dark — shell (light) meets tab content (dark) with a clean seam, no white background showing through.
- `kelas`: category grid, locked-category state (if a non-Advance member has an Advanced category), video status icons/actions, star ratings.
- `materi`: file list with colored file-type icons, download works.
- `news`: chart widget still loads and renders (verifies `AdvancedChartWidget` wasn't accidentally touched).

- [ ] **Step 7: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle tab Chart, perbaiki background main, dan bersihkan sisa tab Belajar (fase 2 selesai)"
```

---

## Self-Review Notes

- **Spec coverage:** §2a (kelas), §2b (materi), §2c (news) each map to Tasks 1–2, 3, and 4 respectively. §1's "tab `live` not touched" and "`AdvancedChartWidget` not touched" constraints are stated in Global Constraints and Task 4's scope. §3's full icon table is covered across Tasks 1–3 (every emoji named in the table has a corresponding lucide replacement in some task's code).
- **Type consistency:** `LP` token names match Phase 1 exactly (no new names introduced). All new icon names (`Paperclip`, `Check`, `Clock`, `Play`, `Circle`, `RotateCcw`, `FileText`, `Presentation`, `FileSpreadsheet`, `File`, `Download`) are introduced once in Task 1's import line and referenced identically in later tasks.
- **No placeholders:** every step shows complete before/after code.
- **Architecture carried over correctly:** Task 4 explicitly extends the `<main>` conditional background fix from Phase 1's whole-branch review, rather than repeating that same class of bug for the 3 newly-lit tabs.
