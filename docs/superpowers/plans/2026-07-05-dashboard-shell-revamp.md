# Dashboard Shell Revamp (Fase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the member dashboard's shell (topbar, desktop sidebar, mobile sidebar overlay) and its `dashboard` (home) tab from dark-terminal to the same light/minimal style already shipped on the landing page, per `docs/superpowers/specs/2026-07-05-dashboard-shell-revamp-design.md`.

**Architecture:** Reuse the `--lp-*` CSS tokens introduced for the landing page by renaming their scope class from `.mr-landing-v2` to the page-agnostic `.mr-light-v2`, then apply that class to `DashboardPage`'s root wrapper. `DashboardPage.tsx` gets its own local `LP` token object (same values, same pattern as `LandingPage.tsx` — each large file in this codebase defines its own local color consts, never imports them cross-file). The 17 tabs other than `dashboard` are untouched and keep rendering with the existing dark `C`/`G` tokens (`var(--mr-*)`), which keep resolving to dark values since `.mr-light-v2` only adds new `--lp-*` variables — it does not override `--mr-*`.

**Tech Stack:** React + TypeScript, inline styles, `lucide-react` for icons (already a dependency), Geist/Geist Mono fonts (already loaded).

## Global Constraints

- Dashboard is locked to the new light style **only for the shell (topbar/sidebar) and the `dashboard` tab**. The other 17 tabs (`kelas`, `materi`, `news`, `jurnal`, `trading-plan`, `komunitas`, `tools`, `produk`, `funded`, `peringkat`, `competition`, `sertifikat`, `1on1`, `ulasan`, `referral`, `pengaturan`, `bantuan`) are NOT touched in this plan — they keep rendering dark via the existing `C`/`G` consts already defined at the top of `DashboardPage.tsx`.
- The dark/light theme-toggle button in the topbar is removed entirely (no toggle on this page, same as the landing page).
- No emoji used as structural/functional icons in the shell or the `dashboard` tab — use `lucide-react` icons instead. Purely expressive emoji embedded in sentence text (e.g. "🎉" in "Kamu ada di Top 3!") are left as-is — this is not a structural icon.
- No new npm dependencies.
- Do not modify: `App.tsx` routing, any Supabase query/hook, the loading-skeleton early return (`if (!member) return (...)` — stays dark, out of scope), `JurnalPage.tsx`, `LeaderboardPage.tsx`, `MemberTradingPlan.tsx`, `CompetitionPage.tsx` (separate components, untouched).
- `src/components/LanjutkanBelajar.tsx` — a small component rendered ONLY inside the `dashboard` tab we're restyling — **is in scope** (added by this plan; the design spec did not call it out explicitly, but leaving it dark would create a visibly broken dark card floating inside an otherwise light tab). It gets the same `LP`-token treatment as the rest of the tab.
- No test suite exists in this project (confirmed in `CLAUDE.md`). Every task substitutes the TDD cycle with: (1) `npm run typecheck` scoped-diff check against the recorded baseline (see below), and (2) a real visual check — start `npm run dev`, and if a browser/screenshot tool is available use it for a real check; otherwise do a careful line-by-line self-review of the diff against this task's code.
- Follow existing per-component patterns: this file's copy-pasted `isMobile`/local-state patterns are not to be refactored into shared hooks — match the file's existing style.

**Baseline note:** run `npm run typecheck 2>&1 | grep DashboardPage` before Task 1 and record the count — this repo's typecheck is not clean at baseline (confirmed during the landing page revamp: unrelated pre-existing errors exist across many files including this one, e.g. unused `Spark`/`GaugeChart`/`leaderboard`/`up`/`lastVideos`/`ni`). Only new error/warning categories introduced by this plan's own diffs are regressions; pre-existing ones are not this plan's concern.

---

## Task 1: Foundation — token rename, `LP` object, icon imports, `SIDEBAR` migration, search state

**Files:**
- Modify: `src/index.css` (rename CSS scope class)
- Modify: `src/pages/LandingPage.tsx` (update the one class reference)
- Modify: `src/pages/member/DashboardPage.tsx` (imports, `LP` const, `SIDEBAR` array, search state + filter helper, root wrapper class)

**Interfaces:**
- Produces: `.mr-light-v2` CSS scope (renamed from `.mr-landing-v2`) — consumed by both `LandingPage.tsx` and `DashboardPage.tsx` root wrappers.
- Produces: `LP` token object in `DashboardPage.tsx` — same shape as `LandingPage.tsx`'s `LP`, consumed by Tasks 2–7.
- Produces: `SIDEBAR` array items now carry an `Icon` field (a `lucide-react` component reference) instead of `icon` (an emoji string) — consumed by Tasks 3–4.
- Produces: `filterSidebar(items, query)` helper function — consumed by Tasks 3–4.
- Produces: `sidebarQuery`/`setSidebarQuery` state — consumed by Tasks 3–4.

- [ ] **Step 1: Rename the CSS scope class in `src/index.css`**

Find the block added during the landing page revamp:

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

Rename the selector only (values unchanged):

```css
.mr-light-v2 {
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

- [ ] **Step 2: Update the class reference in `src/pages/LandingPage.tsx`**

Find the root wrapper's opening tag in the `LandingPage()` export (near the bottom of the file):

```tsx
    <div className="mr-landing-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
```

Change only the class name:

```tsx
    <div className="mr-light-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased', overflowX: 'hidden' }}>
```

Search the whole file for any other `mr-landing-v2` occurrence (there should be exactly one) and confirm none remain.

- [ ] **Step 3: Add `lucide-react` imports to `DashboardPage.tsx`**

At the top of `src/pages/member/DashboardPage.tsx`, after the existing imports (currently ending at `import { trackVideoWatch } from '../../hooks/useWatchHistory';`), add:

```tsx
import {
  Search, LayoutGrid, PlayCircle, BookOpen, LineChart, NotebookPen, ClipboardList,
  MessageCircle, Landmark, ShoppingBag, Rocket, Trophy, Medal, Award, Target, Star,
  Link2, Settings, HelpCircle, LogOut, Bell, CheckCircle2, XCircle, Info, Megaphone,
  Lock, FlaskConical, CircleDot, DollarSign, Briefcase,
} from 'lucide-react';
```

- [ ] **Step 4: Add the `LP` token object**

Directly after the existing `const C = { ... };` block (right before `const DISCORD = ...`), add:

```ts
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

- [ ] **Step 5: Migrate the `SIDEBAR` array from emoji `icon` to `Icon` components**

Replace the entire existing `SIDEBAR` array:

```ts
const SIDEBAR = [
  { id: 'dashboard',  label: 'Dashboard',      icon: '⊞' },
  { id: 'kelas',      label: 'Kelas Saya',     icon: '▶' },
  { id: 'materi',     label: 'Materi',         icon: '📚' },
  { id: 'news',       label: 'Chart',          icon: '📈' },
  { id: 'jurnal',       label: 'Jurnal Trading', icon: '📓' },
  { id: 'trading-plan', label: 'Trading Plan',  icon: '📋' },
  { id: 'komunitas',  label: 'Komunitas',      icon: '💬' },
  { id: 'tools',      label: 'Broker',         icon: '🏦' },
  { id: 'produk',     label: 'Produk',         icon: '🛍️' },
  { id: 'sep1',       label: 'TOOLS & PROGRESS', icon: '', separator: true },
  { id: 'funded',     label: 'Status Trading', icon: '🚀' },
  { id: 'peringkat',  label: 'Peringkat',      icon: '🏆' },
  { id: 'competition', label: 'Kompetisi',     icon: '🥇' },
  { id: 'sertifikat', label: 'Sertifikat',     icon: '🎖' },
  { id: '1on1',       label: '1-on-1 Mentoring', icon: '🎯' },
  { id: 'ulasan',     label: 'Tulis Ulasan',   icon: '⭐' },
  { id: 'referral',   label: 'Referral',       icon: '🔗' },
  { id: 'sep2',       label: 'ACCOUNT',        icon: '', separator: true },
  { id: 'pengaturan', label: 'Pengaturan',     icon: '⚙' },
  { id: 'bantuan',    label: 'Bantuan',        icon: '❓' },
  { id: 'logout',     label: 'Logout',         icon: '⏻' },
];
```

with:

```ts
const SIDEBAR = [
  { id: 'dashboard',    label: 'Dashboard',       Icon: LayoutGrid },
  { id: 'kelas',        label: 'Kelas Saya',      Icon: PlayCircle },
  { id: 'materi',       label: 'Materi',          Icon: BookOpen },
  { id: 'news',         label: 'Chart',           Icon: LineChart },
  { id: 'jurnal',       label: 'Jurnal Trading',  Icon: NotebookPen },
  { id: 'trading-plan', label: 'Trading Plan',    Icon: ClipboardList },
  { id: 'komunitas',    label: 'Komunitas',       Icon: MessageCircle },
  { id: 'tools',        label: 'Broker',          Icon: Landmark },
  { id: 'produk',       label: 'Produk',          Icon: ShoppingBag },
  { id: 'sep1',         label: 'TOOLS & PROGRESS', separator: true },
  { id: 'funded',       label: 'Status Trading',  Icon: Rocket },
  { id: 'peringkat',    label: 'Peringkat',       Icon: Trophy },
  { id: 'competition',  label: 'Kompetisi',       Icon: Medal },
  { id: 'sertifikat',   label: 'Sertifikat',      Icon: Award },
  { id: '1on1',         label: '1-on-1 Mentoring', Icon: Target },
  { id: 'ulasan',       label: 'Tulis Ulasan',    Icon: Star },
  { id: 'referral',     label: 'Referral',        Icon: Link2 },
  { id: 'sep2',         label: 'ACCOUNT',         separator: true },
  { id: 'pengaturan',   label: 'Pengaturan',      Icon: Settings },
  { id: 'bantuan',      label: 'Bantuan',         Icon: HelpCircle },
  { id: 'logout',       label: 'Logout',          Icon: LogOut },
];

function filterSidebar(items: typeof SIDEBAR, query: string) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  const out: typeof SIDEBAR = [];
  let pendingSeparator: typeof SIDEBAR[number] | null = null;
  for (const item of items) {
    if ((item as any).separator) { pendingSeparator = item; continue; }
    if (!item.label.toLowerCase().includes(q)) continue;
    if (pendingSeparator) { out.push(pendingSeparator); pendingSeparator = null; }
    out.push(item);
  }
  return out;
}
```

(Tasks 3–4 render `item.Icon` guarded behind the existing `(item as any).separator` early-return, so accessing it via `(item as any).Icon` — matching this file's existing loose-typing convention for optional `SIDEBAR` fields like `(item as any).badge`/`(item as any).href` — is safe and consistent.)

- [ ] **Step 6: Add sidebar-search state and its reset effect**

Find the existing state declarations:

```ts
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
```

Just before that line, add:

```ts
  const [sidebarQuery, setSidebarQuery] = useState('');
```

Then, directly after the existing `const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);` line, add:

```ts
  React.useEffect(() => {
    if (sidebarCollapsed || !mobileMenuOpen) setSidebarQuery('');
  }, [sidebarCollapsed, mobileMenuOpen]);
```

- [ ] **Step 7: Apply `.mr-light-v2` to the root wrapper**

Find the main render's root wrapper (NOT the `if (!member) return (...)` loading-skeleton branch above it — that one stays untouched):

```tsx
  return (
    <div style={{ fontFamily: C.sans, background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
```

Change to:

```tsx
  return (
    <div className="mr-light-v2" style={{ fontFamily: LP.sans, background: LP.bg, minHeight: '100vh', color: LP.text, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
```

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck 2>&1 | grep DashboardPage`
Expected: only pre-existing baseline errors recorded before Task 1 (plus possibly new "X is declared but never used" for `icon`-string-shaped code you haven't updated yet — Tasks 2–4 resolve those). No `TS2304`/`TS2339` (undefined name / property) errors — if you see one, a `SIDEBAR` consumer elsewhere in the file still expects the old `icon: string` shape and needs Task 2/3/4 to land before this compiles cleanly; that's expected until this whole plan is done, not a Task 1 regression.

- [ ] **Step 9: Commit**

```bash
git add src/index.css src/pages/LandingPage.tsx src/pages/member/DashboardPage.tsx
git commit -m "feat: siapkan token LP, ikon lucide, dan search state untuk dashboard terang"
```

---

## Task 2: Topbar

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (topbar block, roughly lines 1033-1134 before this plan's edits — locate by the `{/* ── Topbar ── */}` comment)

**Interfaces:**
- Consumes: `LP` tokens, `Bell`/`CheckCircle2`/`XCircle`/`Info` icons (Task 1).
- Produces: no new interfaces — this is a self-contained JSX region.

- [ ] **Step 1: Remove the theme-toggle button**

Delete this block entirely (it currently sits between the "ADVANCE" badge and the avatar+name group, right after the bell-notification `(() => { ... })()` IIFE closes):

```tsx
          <button onClick={() => { const h = document.documentElement; const n = h.getAttribute('data-theme') === 'light' ? 'dark' : 'light'; h.setAttribute('data-theme', n); localStorage.setItem('mr_theme', n); }}
            title="Toggle tema" style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 7, width: 30, height: 30, cursor: 'pointer', color: C.dim, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="mr-theme-icon-dark">🌙</span>
            <span className="mr-theme-icon-light">☀️</span>
          </button>
```

- [ ] **Step 2: Restyle the topbar container, hamburger, logo/brand**

Replace:

```tsx
      <div className='mr-topbar' style={{ borderBottom: `1px solid ${C.border}`, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, background: C.sidebar, flexShrink: 0, position: 'sticky' as const, top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Hamburger / collapse toggle */}
          <button onClick={() => isMobile ? setMobileMenuOpen(o => !o) : toggleSidebar()}
            style={{ width: 36, height: 36, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
            {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: i === 1 ? 12 : 16, height: 1.5, background: C.dim, borderRadius: 2, transition: 'width 0.2s' }}/>)}
          </button>
          <div style={{ width: 32, height: 32, flexShrink: 0 }}><img src='/logo.png' alt='MR' style={{ width: '100%', height: '100%', objectFit: 'contain' }}/></div>
          <div className='mr-topbar-brand'>
            <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.3 }}>MENOLAK RUGI</div>
            <div style={{ fontFamily: C.mono, fontSize: 8, color: C.dim, letterSpacing: 1 }}>ELITE TRADING ENVIRONMENT</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
          {!isMobile && <div style={{ fontFamily: C.mono, fontSize: 10, color: C.dim }}>{member.tier.replace('SMC ', '').toUpperCase()}</div>}
          {member.is_advance && <span style={{ fontFamily: C.mono, fontSize: 8, background: 'var(--mr-tint-gold)', border: "1px solid var(--mr-tint-gold-b)", color: G.gold, padding: '2px 6px', borderRadius: 4 }}>ADVANCE</span>}
```

with:

```tsx
      <div className='mr-topbar' style={{ borderBottom: `1px solid ${LP.border}`, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, background: LP.surface, flexShrink: 0, position: 'sticky' as const, top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Hamburger / collapse toggle */}
          <button onClick={() => isMobile ? setMobileMenuOpen(o => !o) : toggleSidebar()}
            style={{ width: 36, height: 36, background: 'transparent', border: `1px solid ${LP.border}`, borderRadius: 7, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
            {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: i === 1 ? 12 : 16, height: 1.5, background: LP.muted, borderRadius: 2, transition: 'width 0.2s' }}/>)}
          </button>
          <div style={{ width: 32, height: 32, flexShrink: 0 }}><img src='/logo.png' alt='MR' style={{ width: '100%', height: '100%', objectFit: 'contain' }}/></div>
          <div className='mr-topbar-brand'>
            <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.3, color: LP.text }}>MENOLAK RUGI</div>
            <div style={{ fontFamily: LP.mono, fontSize: 8, color: LP.muted, letterSpacing: 1 }}>ELITE TRADING ENVIRONMENT</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
          {!isMobile && <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted }}>{member.tier.replace('SMC ', '').toUpperCase()}</div>}
          {member.is_advance && <span style={{ fontFamily: LP.mono, fontSize: 8, background: LP.primaryTint, border: `1px solid ${LP.primary}33`, color: LP.primary, padding: '2px 6px', borderRadius: 4 }}>ADVANCE</span>}
```

- [ ] **Step 3: Restyle the bell button and unread badge**

Replace:

```tsx
                <button onClick={() => {
                    const opening = !showMemberNotif;
                    setShowMemberNotif(opening);
                    if (opening && member.id) {
                      const now = new Date().toISOString();
                      localStorage.setItem(`mr_notif_seen_${member.id}`, now);
                      setNotifLastSeen(now);
                    }
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 18 }}>🔔</span>
                  {totalUnread > 0 && (
                    <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, background: C.down, borderRadius: 8, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontWeight: 700, color: '#fff', padding: '0 3px' }}>
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </button>
```

with:

```tsx
                <button onClick={() => {
                    const opening = !showMemberNotif;
                    setShowMemberNotif(opening);
                    if (opening && member.id) {
                      const now = new Date().toISOString();
                      localStorage.setItem(`mr_notif_seen_${member.id}`, now);
                      setNotifLastSeen(now);
                    }
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={18} color={LP.muted} />
                  {totalUnread > 0 && (
                    <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, background: LP.danger, borderRadius: 8, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: LP.mono, fontWeight: 700, color: '#fff', padding: '0 3px' }}>
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </button>
```

- [ ] **Step 4: Restyle the notification dropdown panel**

Replace:

```tsx
                {showMemberNotif && (
                  <>
                    <div onClick={() => setShowMemberNotif(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }}/>
                    <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 300, background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 50, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontFamily: C.mono, fontSize: 10, color: G.gold, letterSpacing: 1.5 }}>// NOTIFIKASI</span>
                        <button onClick={() => setShowMemberNotif(false)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 18, padding: '0 2px', lineHeight: 1 }}>×</button>
                      </div>
                      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                        {notifications.filter((n:any) => !dismissedNotifs.has(n.id)).map((n:any) => (
                          <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                              {n.type === 'approve' ? '✅' : n.type === 'reject' ? '❌' : 'ℹ️'}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, color: n.type === 'approve' ? C.up : n.type === 'reject' ? C.down : C.text }}>
                                {n.type === 'approve' ? 'Advance Disetujui 🎉' : n.type === 'reject' ? 'Advance Ditolak' : 'Info'}
                              </div>
                              <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.4 }}>{n.message}</div>
                              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, marginTop: 3 }}>{new Date(n.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</div>
                            </div>
                            <button onClick={() => setDismissedNotifs(s => { const ns = new Set(s); ns.add(n.id); return ns; })}
                              style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: '0 2px', alignSelf: 'flex-start' }}>×</button>
                          </div>
                        ))}
                        {announcements.map((a:any) => (
                          <div key={a.id || a.created_at} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📢</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {a.judul && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{a.judul}</div>}
                              <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.4 }}>{a.content || a.message || ''}</div>
                              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, marginTop: 3 }}>{new Date(a.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</div>
                            </div>
                          </div>
                        ))}
                        {notifications.filter((n:any) => !dismissedNotifs.has(n.id)).length === 0 && announcements.length === 0 && (
                          <div style={{ padding: '28px 16px', textAlign: 'center' as const, fontFamily: C.mono, color: C.dim, fontSize: 12 }}>
                            ✅ Tidak ada notifikasi
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
```

with:

```tsx
                {showMemberNotif && (
                  <>
                    <div onClick={() => setShowMemberNotif(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }}/>
                    <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 300, background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, boxShadow: LP.shadowMd, zIndex: 50, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${LP.border}` }}>
                        <span style={{ fontFamily: LP.mono, fontSize: 10, color: LP.primary, letterSpacing: 1.5 }}>NOTIFIKASI</span>
                        <button onClick={() => setShowMemberNotif(false)} style={{ background: 'none', border: 'none', color: LP.muted, cursor: 'pointer', fontSize: 18, padding: '0 2px', lineHeight: 1 }}>×</button>
                      </div>
                      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                        {notifications.filter((n:any) => !dismissedNotifs.has(n.id)).map((n:any) => (
                          <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${LP.border}` }}>
                            <span style={{ flexShrink: 0, marginTop: 1 }}>
                              {n.type === 'approve' ? <CheckCircle2 size={16} color={LP.primary} /> : n.type === 'reject' ? <XCircle size={16} color={LP.danger} /> : <Info size={16} color={LP.muted} />}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, color: n.type === 'approve' ? LP.primary : n.type === 'reject' ? LP.danger : LP.text }}>
                                {n.type === 'approve' ? 'Advance Disetujui 🎉' : n.type === 'reject' ? 'Advance Ditolak' : 'Info'}
                              </div>
                              <div style={{ fontSize: 11, color: LP.muted, lineHeight: 1.4 }}>{n.message}</div>
                              <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 3 }}>{new Date(n.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</div>
                            </div>
                            <button onClick={() => setDismissedNotifs(s => { const ns = new Set(s); ns.add(n.id); return ns; })}
                              style={{ background: 'none', border: 'none', color: LP.muted, cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: '0 2px', alignSelf: 'flex-start' }}>×</button>
                          </div>
                        ))}
                        {announcements.map((a:any) => (
                          <div key={a.id || a.created_at} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${LP.border}` }}>
                            <span style={{ flexShrink: 0, marginTop: 1 }}><Megaphone size={16} color={LP.muted} /></span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {a.judul && <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, color: LP.text }}>{a.judul}</div>}
                              <div style={{ fontSize: 11, color: LP.muted, lineHeight: 1.4 }}>{a.content || a.message || ''}</div>
                              <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 3 }}>{new Date(a.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</div>
                            </div>
                          </div>
                        ))}
                        {notifications.filter((n:any) => !dismissedNotifs.has(n.id)).length === 0 && announcements.length === 0 && (
                          <div style={{ padding: '28px 16px', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, fontFamily: LP.mono, color: LP.muted, fontSize: 12 }}>
                            <CheckCircle2 size={20} color={LP.muted} />
                            Tidak ada notifikasi
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
```

- [ ] **Step 5: Restyle the avatar/name group and "Web ↗" link**

Replace:

```tsx
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, background: `linear-gradient(135deg,${G.gold},${G.gold2})`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#000' }}>
              {member.nama[0].toUpperCase()}
            </div>
            {!isMobile && <span style={{ fontSize: 13, fontWeight: 600 }}>{member.nama}</span>}
          </div>
```

(this sits right after the block deleted in Step 1) with:

```tsx
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, background: `linear-gradient(135deg,${LP.primary},${LP.primaryHover})`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#fff' }}>
              {member.nama[0].toUpperCase()}
            </div>
            {!isMobile && <span style={{ fontSize: 13, fontWeight: 600, color: LP.text }}>{member.nama}</span>}
          </div>
```

Then replace:

```tsx
          {!isMobile && <button onClick={() => window.location.href = '/'} style={{ fontFamily: C.mono, fontSize: 10, color: C.dim, background: 'none', border: `1px solid ${C.border2}`, padding: '4px 10px', cursor: 'pointer', borderRadius: 5 }}>Web ↗</button>}
```

with:

```tsx
          {!isMobile && <button onClick={() => window.location.href = '/'} style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, background: 'none', border: `1px solid ${LP.border}`, padding: '4px 10px', cursor: 'pointer', borderRadius: 5 }}>Web ↗</button>}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck 2>&1 | grep DashboardPage`
Expected: no new errors beyond Task 1's baseline.

- [ ] **Step 7: Visual check**

Reload the member dashboard (log in as a member, or use whatever dev-session shortcut this project has). Confirm: topbar is white/light, no dark 🌙/☀️ toggle button, bell is a lucide outline icon (not emoji), clicking it opens a light dropdown with lucide status icons, avatar gradient is green.

- [ ] **Step 8: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle topbar dashboard member ke tema terang"
```

---

## Task 3: Sidebar desktop

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (desktop `<aside>` block, `{/* ── Desktop Sidebar ── */}`)

**Interfaces:**
- Consumes: `LP` tokens, `SIDEBAR`/`filterSidebar`/`sidebarQuery`/`setSidebarQuery` (Task 1), `Search` icon (Task 1).
- Produces: no new interfaces.

- [ ] **Step 1: Restyle the `<aside>` container and add the search box**

Replace:

```tsx
        <aside className='mr-sidebar' style={{ width: sidebarCollapsed ? 58 : 200, background: C.sidebar, borderRight: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', transition: 'width 0.2s ease', overflow: 'hidden' }}>
          <div style={{ flex: 1, paddingTop: 10 }}>
            {SIDEBAR.map(item => {
```

with:

```tsx
        <aside className='mr-sidebar' style={{ width: sidebarCollapsed ? 58 : 200, background: LP.surface, borderRight: `1px solid ${LP.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', transition: 'width 0.2s ease', overflow: 'hidden' }}>
          <div style={{ flex: 1, paddingTop: 10 }}>
            {!sidebarCollapsed && (
              <div style={{ padding: '0 12px 12px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color={LP.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={sidebarQuery}
                    onChange={e => setSidebarQuery(e.target.value)}
                    placeholder="Cari menu..."
                    style={{ width: '100%', boxSizing: 'border-box' as const, background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 8, padding: '8px 10px 8px 30px', fontSize: 12, fontFamily: LP.sans, color: LP.text, outline: 'none' }}
                  />
                </div>
              </div>
            )}
            {filterSidebar(SIDEBAR, sidebarQuery).map(item => {
```

- [ ] **Step 2: Restyle the separator and nav-item rendering**

Replace:

```tsx
              if ((item as any).separator) {
                return !sidebarCollapsed ? (
                  <div key={item.id} style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: '#1e1e1e' }}/>
                    <span style={{ fontFamily: C.mono, fontSize: 8, color: '#333', letterSpacing: 2, whiteSpace: 'nowrap' as const }}>{item.label}</span>
                    <div style={{ flex: 1, height: 1, background: '#1e1e1e' }}/>
                  </div>
                ) : <div key={item.id} style={{ margin: '8px 0', borderTop: '1px solid var(--mr-border)' }}/>;
              }
              const isA = active === item.id;
              return (
                <button key={item.id}
                  onClick={() => {
                    if ((item as any).href) { window.open((item as any).href, '_blank'); }
                    else if (item.id === 'logout') { logout(); }
                    else { setActive(item.id); }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: sidebarCollapsed ? '11px 0' : '10px 18px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', border: 'none', background: isA ? 'var(--mr-tint-gold)' : 'transparent', borderLeft: isA ? `3px solid ${G.gold}` : '3px solid transparent', color: isA ? G.gold : C.dim, cursor: 'pointer', fontSize: 13, textAlign: 'left' as const, transition: 'padding 0.2s' }}>
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                  {!sidebarCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' as const }}>{item.label}</span>}
                  {!sidebarCollapsed && (item as any).badge && <span style={{ fontFamily: C.mono, fontSize: 8, background: C.down, color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{(item as any).badge}</span>}
                </button>
              );
            })}
          </div>
```

with:

```tsx
              if ((item as any).separator) {
                return !sidebarCollapsed ? (
                  <div key={item.id} style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: LP.border }}/>
                    <span style={{ fontFamily: LP.mono, fontSize: 8, color: LP.muted, letterSpacing: 2, whiteSpace: 'nowrap' as const }}>{item.label}</span>
                    <div style={{ flex: 1, height: 1, background: LP.border }}/>
                  </div>
                ) : <div key={item.id} style={{ margin: '8px 0', borderTop: `1px solid ${LP.border}` }}/>;
              }
              const isA = active === item.id;
              const ItemIcon = (item as any).Icon;
              return (
                <button key={item.id}
                  onClick={() => {
                    if ((item as any).href) { window.open((item as any).href, '_blank'); }
                    else if (item.id === 'logout') { logout(); }
                    else { setActive(item.id); }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: sidebarCollapsed ? '11px 0' : '10px 18px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', border: 'none', background: isA ? LP.primaryTint : 'transparent', borderLeft: isA ? `3px solid ${LP.primary}` : '3px solid transparent', color: isA ? LP.primary : LP.muted, cursor: 'pointer', fontSize: 13, textAlign: 'left' as const, transition: 'padding 0.2s' }}>
                  <ItemIcon size={17} style={{ flexShrink: 0 }} />
                  {!sidebarCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap' as const }}>{item.label}</span>}
                  {!sidebarCollapsed && (item as any).badge && <span style={{ fontFamily: LP.mono, fontSize: 8, background: LP.danger, color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{(item as any).badge}</span>}
                </button>
              );
            })}
          </div>
```

- [ ] **Step 3: Restyle the membership card**

Replace:

```tsx
          {!sidebarCollapsed && <div style={{ margin: '0 12px 12px', background: '#0d0c00', border: `1px solid #2a2200`, borderRadius: 10, padding: '14px' }}>
            <div style={{ fontFamily: C.mono, color: '#555', fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>AKSES MEMBERSHIP</div>
            <div style={{ fontWeight: 700, color: G.gold, fontSize: 13 }}>{member.tier}</div>
            <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 10, marginTop: 2 }}>{member.is_advance ? '(Advance)' : '(Basic)'}</div>
            <div style={{ fontFamily: C.mono, color: '#555', fontSize: 10, marginTop: 8 }}>Aktif sampai</div>
            {isTrial && expiryDate ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: isExpired ? C.down : daysLeft! <= 7 ? '#f97316' : C.text }}>
                  {expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {!isExpired && (
                  <div style={{ fontFamily: C.mono, fontSize: 9, color: daysLeft! <= 7 ? '#f97316' : '#555', marginTop: 2 }}>
                    {daysLeft} hari lagi
                  </div>
                )}
                {isExpired && (
                  <div style={{ fontFamily: C.mono, fontSize: 9, color: C.down, marginTop: 2 }}>AKSES BERAKHIR</div>
                )}
                <a href="/checkout" style={{ display: 'block', marginTop: 10, fontFamily: C.mono, fontSize: 10, fontWeight: 700,
                  color: '#000', background: isExpired ? C.down : G.gold,
                  padding: '6px 0', textAlign: 'center' as const, textDecoration: 'none', borderRadius: 5 }}>
                  {isExpired ? 'AKTIFKAN LAGI' : 'NAIK TIER ▸'}
                </a>
              </>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>Seumur Hidup</div>
            )}
          </div>}
```

with:

```tsx
          {!sidebarCollapsed && <div style={{ margin: '0 12px 12px', background: LP.primaryTint, border: `1px solid ${LP.primary}33`, borderRadius: 10, padding: '14px' }}>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1, marginBottom: 6 }}>AKSES MEMBERSHIP</div>
            <div style={{ fontWeight: 700, color: LP.primary, fontSize: 13 }}>{member.tier}</div>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginTop: 2 }}>{member.is_advance ? '(Advance)' : '(Basic)'}</div>
            <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 10, marginTop: 8 }}>Aktif sampai</div>
            {isTrial && expiryDate ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: isExpired ? LP.danger : daysLeft! <= 7 ? '#f97316' : LP.text }}>
                  {expiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {!isExpired && (
                  <div style={{ fontFamily: LP.mono, fontSize: 9, color: daysLeft! <= 7 ? '#f97316' : LP.muted, marginTop: 2 }}>
                    {daysLeft} hari lagi
                  </div>
                )}
                {isExpired && (
                  <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.danger, marginTop: 2 }}>AKSES BERAKHIR</div>
                )}
                <a href="/checkout" style={{ display: 'block', marginTop: 10, fontFamily: LP.mono, fontSize: 10, fontWeight: 700,
                  color: '#fff', background: isExpired ? LP.danger : LP.primary,
                  padding: '6px 0', textAlign: 'center' as const, textDecoration: 'none', borderRadius: 5 }}>
                  {isExpired ? 'AKTIFKAN LAGI' : 'NAIK TIER ▸'}
                </a>
              </>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: LP.text }}>Seumur Hidup</div>
            )}
          </div>}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck 2>&1 | grep DashboardPage`
Expected: no new errors beyond baseline.

- [ ] **Step 5: Visual check**

Reload. Confirm: desktop sidebar is white, search box works (typing "jur" leaves only "Jurnal Trading" visible, its neighbors and any now-empty group's separator disappear; clearing the box restores everything), active tab has a green left border + green tint background, membership card is a light green-tinted box.

- [ ] **Step 6: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle sidebar desktop dashboard ke tema terang + search fungsional"
```

---

## Task 4: Sidebar mobile overlay

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (`{/* ── Mobile Overlay ── */}` block)

**Interfaces:**
- Consumes: same as Task 3.
- Produces: none new.

- [ ] **Step 1: Restyle the overlay container and header row, add the search box**

Replace:

```tsx
      {isMobile && mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileMenuOpen(false)}/>
          <div style={{ width: 240, background: C.sidebar, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{member.nama}</span>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 20, padding: '0 4px' }}>×</button>
            </div>
            <div style={{ flex: 1, paddingTop: 8 }}>
              {SIDEBAR.map(item => {
```

with:

```tsx
      {isMobile && mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(15,23,42,0.4)' }} onClick={() => setMobileMenuOpen(false)}/>
          <div style={{ width: 240, background: LP.surface, borderLeft: `1px solid ${LP.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${LP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: LP.text }}>{member.nama}</span>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: LP.muted, cursor: 'pointer', fontSize: 20, padding: '0 4px' }}>×</button>
            </div>
            <div style={{ padding: '10px 16px 0' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color={LP.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={sidebarQuery}
                  onChange={e => setSidebarQuery(e.target.value)}
                  placeholder="Cari menu..."
                  style={{ width: '100%', boxSizing: 'border-box' as const, background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 8, padding: '8px 10px 8px 30px', fontSize: 12, fontFamily: LP.sans, color: LP.text, outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, paddingTop: 8 }}>
              {filterSidebar(SIDEBAR, sidebarQuery).map(item => {
```

- [ ] **Step 2: Restyle the separator and nav-item rendering**

Replace:

```tsx
                if ((item as any).separator) {
                  return (
                    <div key={item.id} style={{ padding: '14px 20px 5px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 1, background: C.border }}/>
                      <span style={{ fontFamily: C.mono, fontSize: 8, color: C.dim, letterSpacing: 2, whiteSpace: 'nowrap' as const }}>{item.label}</span>
                      <div style={{ flex: 1, height: 1, background: C.border }}/>
                    </div>
                  );
                }
                const isA = active === item.id;
                return (
                  <button key={item.id}
                    onClick={() => {
                      if ((item as any).href) { window.open((item as any).href, '_blank'); }
                      else if (item.id === 'logout') { logout(); }
                      else { setActive(item.id); setMobileMenuOpen(false); }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 20px', border: 'none', background: isA ? 'var(--mr-tint-gold)' : 'transparent', borderLeft: isA ? `3px solid ${G.gold}` : '3px solid transparent', color: isA ? G.gold : C.dim, cursor: 'pointer', fontSize: 14, textAlign: 'left' as const }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {(item as any).badge && <span style={{ fontFamily: C.mono, fontSize: 8, background: C.down, color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{(item as any).badge}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ margin: '0 12px 12px', background: '#0d0c00', border: `1px solid #2a2200`, borderRadius: 10, padding: '12px' }}>
              <div style={{ fontFamily: C.mono, color: '#555', fontSize: 9, marginBottom: 4 }}>AKSES MEMBERSHIP</div>
              <div style={{ fontWeight: 700, color: G.gold, fontSize: 12 }}>{member.tier}</div>
              {isTrial && expiryDate && (
                <div style={{ fontFamily: C.mono, fontSize: 10, color: daysLeft! <= 7 ? '#f97316' : C.dim, marginTop: 4 }}>{daysLeft} hari lagi</div>
              )}
            </div>

          </div>
        </div>
      )}
```

with:

```tsx
                if ((item as any).separator) {
                  return (
                    <div key={item.id} style={{ padding: '14px 20px 5px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 1, background: LP.border }}/>
                      <span style={{ fontFamily: LP.mono, fontSize: 8, color: LP.muted, letterSpacing: 2, whiteSpace: 'nowrap' as const }}>{item.label}</span>
                      <div style={{ flex: 1, height: 1, background: LP.border }}/>
                    </div>
                  );
                }
                const isA = active === item.id;
                const ItemIcon = (item as any).Icon;
                return (
                  <button key={item.id}
                    onClick={() => {
                      if ((item as any).href) { window.open((item as any).href, '_blank'); }
                      else if (item.id === 'logout') { logout(); }
                      else { setActive(item.id); setMobileMenuOpen(false); }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 20px', border: 'none', background: isA ? LP.primaryTint : 'transparent', borderLeft: isA ? `3px solid ${LP.primary}` : '3px solid transparent', color: isA ? LP.primary : LP.muted, cursor: 'pointer', fontSize: 14, textAlign: 'left' as const }}>
                    <ItemIcon size={18} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {(item as any).badge && <span style={{ fontFamily: LP.mono, fontSize: 8, background: LP.danger, color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{(item as any).badge}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ margin: '0 12px 12px', background: LP.primaryTint, border: `1px solid ${LP.primary}33`, borderRadius: 10, padding: '12px' }}>
              <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, marginBottom: 4 }}>AKSES MEMBERSHIP</div>
              <div style={{ fontWeight: 700, color: LP.primary, fontSize: 12 }}>{member.tier}</div>
              {isTrial && expiryDate && (
                <div style={{ fontFamily: LP.mono, fontSize: 10, color: daysLeft! <= 7 ? '#f97316' : LP.muted, marginTop: 4 }}>{daysLeft} hari lagi</div>
              )}
            </div>

          </div>
        </div>
      )}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck 2>&1 | grep DashboardPage`
Expected: no new errors beyond baseline.

- [ ] **Step 4: Visual check**

Resize the browser to mobile width, open the hamburger menu. Confirm: overlay panel is light, search box present and functional, nav items/membership card match the desktop styling.

- [ ] **Step 5: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle sidebar mobile overlay dashboard ke tema terang"
```

---

## Task 5: Dashboard tab — welcome header, progress, status row, banners

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (`{active === 'dashboard' && (...)}` block, from the top through the broker-recommendation banner — up to but not including `<LanjutkanBelajar .../>`)

**Interfaces:**
- Consumes: `LP` tokens, `Lock`/`MessageCircle`/`Rocket`/`Landmark` icons (Task 1). Same data/state as before (`member`, `progressPct`, `completedVideos`, `totalVideos`, `videos`, `progress`, `brokers`, `setActive`) — none of it changes shape.
- Produces: none new.

- [ ] **Step 1: Restyle the welcome header + stat pills**

Replace:

```tsx
              {/* ── Top bar: Welcome + quick stats ── */}
              <div className='mr-welcome-anim' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ fontFamily: C.mono, color: '#444', fontSize: 9, letterSpacing: 1.5, marginBottom: 3 }}>SELAMAT DATANG KEMBALI</div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, margin: 0, color: C.text }}>{member.nama}</h1>
                </div>
                {/* Inline stats pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  <div style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: G.gold, background: 'var(--mr-tint-gold)', border: '1px solid var(--mr-gold-a27)', padding: '6px 14px', borderRadius: 20 }}>
                    {progressPct}% selesai
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 11, color: C.up, background: '#0a1a1044', border: '1px solid #22ab9422', padding: '6px 14px', borderRadius: 20 }}>
                    {completedVideos}/{totalVideos} video
                  </div>
                  {member.is_advance && (
                    <div style={{ fontFamily: C.mono, fontSize: 11, color: '#a855f7', background: 'var(--mr-tint-purple)', border: '1px solid #a855f722', padding: '6px 14px', borderRadius: 20 }}>
                      ADVANCE
                    </div>
                  )}
                </div>
              </div>
```

with:

```tsx
              {/* ── Top bar: Welcome + quick stats ── */}
              <div className='mr-welcome-anim' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1.5, marginBottom: 3 }}>SELAMAT DATANG KEMBALI</div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, margin: 0, color: LP.text }}>{member.nama}</h1>
                </div>
                {/* Inline stats pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  <div style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: LP.primary, background: LP.primaryTint, border: `1px solid ${LP.primary}44`, padding: '6px 14px', borderRadius: 20 }}>
                    {progressPct}% selesai
                  </div>
                  <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.primary, background: LP.primaryTint, border: `1px solid ${LP.primary}44`, padding: '6px 14px', borderRadius: 20 }}>
                    {completedVideos}/{totalVideos} video
                  </div>
                  {member.is_advance && (
                    <div style={{ fontFamily: LP.mono, fontSize: 11, color: '#7c3aed', background: '#7c3aed14', border: '1px solid #7c3aed33', padding: '6px 14px', borderRadius: 20 }}>
                      ADVANCE
                    </div>
                  )}
                </div>
              </div>
```

- [ ] **Step 2: Restyle the progress-belajar compact bars**

Replace:

```tsx
                return (
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
                    <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 9, letterSpacing: 1.5, flexShrink: 0 }}>// PROGRESS</div>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '6px 12px', minWidth: 0 }}>
                      {catBars.map(cat => cat && (
                        <div key={cat.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontFamily: C.mono, fontSize: 8, color: cat.isLocked ? '#444' : cat.color, fontWeight: 700 }}>
                              {cat.isLocked ? '🔒 ' : ''}{cat.label.toUpperCase()}
                            </span>
                            <span style={{ fontFamily: C.mono, fontSize: 8, color: cat.isLocked ? '#333' : C.dim }}>
                              {cat.isLocked ? 'Advance' : `${cat.done}/${cat.vids.length}`}
                            </span>
                          </div>
                          <div style={{ height: 5, background: C.border2, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.isLocked ? '#222' : cat.color, borderRadius: 3, transition: 'width 0.8s ease' }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: G.gold, flexShrink: 0 }}>{progressPct}%</div>
                  </div>
                );
```

with:

```tsx
                return (
                  <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 9, letterSpacing: 1.5, flexShrink: 0 }}>PROGRESS</div>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '6px 12px', minWidth: 0 }}>
                      {catBars.map(cat => cat && (
                        <div key={cat.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: LP.mono, fontSize: 8, color: cat.isLocked ? LP.muted : cat.color, fontWeight: 700 }}>
                              {cat.isLocked && <Lock size={9} />}{cat.label.toUpperCase()}
                            </span>
                            <span style={{ fontFamily: LP.mono, fontSize: 8, color: LP.muted }}>
                              {cat.isLocked ? 'Advance' : `${cat.done}/${cat.vids.length}`}
                            </span>
                          </div>
                          <div style={{ height: 5, background: LP.border, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.isLocked ? LP.muted : cat.color, borderRadius: 3, transition: 'width 0.8s ease' }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: LP.primary, flexShrink: 0 }}>{progressPct}%</div>
                  </div>
                );
```

- [ ] **Step 3: Restyle the status row (Status Trading + Akses Kelas)**

Replace:

```tsx
              {/* ── Status row ── 2-col ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {/* Status Trading */}
                <div style={{ background: C.panel, border: `1px solid ${member.funded_status ? 'var(--mr-gold-a27)' : C.border}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => setActive('funded')}>
                  <div style={{ fontFamily: C.mono, color: '#444', fontSize: 9, letterSpacing: 1, marginBottom: 5 }}>STATUS TRADING</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: member.funded_status ? G.gold : '#333', letterSpacing: -0.3 }}>
                    {member.funded_status
                      ? (member.funded_status==='DA'?'📊 Demo':member.funded_status==='P1'?'🟣 Phase 1':member.funded_status==='P2'?'🟡 Phase 2':member.funded_status==='Master'?'🏆 Master':member.funded_status==='MPAID'?'💰 Sudah Payout':'💼 '+member.funded_status)
                      : '— Belum diset'}
                  </div>
                  {!member.funded_status && <div style={{ fontFamily: C.mono, fontSize: 9, color: '#f97316', marginTop: 4 }}>Klik untuk set →</div>}
                </div>
                {/* Akses Kelas */}
                <div style={{ background: C.panel, border: `1px solid ${isExpired ? C.down+'44' : C.border}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontFamily: C.mono, color: '#444', fontSize: 9, letterSpacing: 1, marginBottom: 5 }}>AKSES KELAS</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: isExpired ? C.down : C.up }}>
                    {isExpired ? 'BERAKHIR' : 'AKTIF'}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 9, color: '#555', marginTop: 4 }}>
                    {isTrial && expiryDate
                      ? isExpired
                        ? `Berakhir ${expiryDate.toLocaleDateString('id-ID',{day:'numeric',month:'short'})}`
                        : `${daysLeft} hari lagi`
                      : 'Seumur Hidup'}
                  </div>
                </div>
              </div>
```

with:

```tsx
              {/* ── Status row ── 2-col ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {/* Status Trading */}
                <div style={{ background: LP.surface, border: `1px solid ${member.funded_status ? LP.primary + '44' : LP.border}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}
                  onClick={() => setActive('funded')}>
                  <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1, marginBottom: 5 }}>STATUS TRADING</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 16, color: member.funded_status ? LP.primary : LP.muted, letterSpacing: -0.3 }}>
                    {member.funded_status ? (
                      <>
                        {member.funded_status === 'DA' ? <FlaskConical size={16} /> : member.funded_status === 'P1' ? <CircleDot size={16} color="#a855f7" /> : member.funded_status === 'P2' ? <CircleDot size={16} color="#eab308" /> : member.funded_status === 'Master' ? <Trophy size={16} /> : member.funded_status === 'MPAID' ? <DollarSign size={16} /> : <Briefcase size={16} />}
                        {member.funded_status==='DA'?'Demo':member.funded_status==='P1'?'Phase 1':member.funded_status==='P2'?'Phase 2':member.funded_status==='Master'?'Master':member.funded_status==='MPAID'?'Sudah Payout':member.funded_status}
                      </>
                    ) : '— Belum diset'}
                  </div>
                  {!member.funded_status && <div style={{ fontFamily: LP.mono, fontSize: 9, color: '#f97316', marginTop: 4 }}>Klik untuk set →</div>}
                </div>
                {/* Akses Kelas */}
                <div style={{ background: LP.surface, border: `1px solid ${isExpired ? LP.danger + '44' : LP.border}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1, marginBottom: 5 }}>AKSES KELAS</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: isExpired ? LP.danger : LP.primary }}>
                    {isExpired ? 'BERAKHIR' : 'AKTIF'}
                  </div>
                  <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 4 }}>
                    {isTrial && expiryDate
                      ? isExpired
                        ? `Berakhir ${expiryDate.toLocaleDateString('id-ID',{day:'numeric',month:'short'})}`
                        : `${daysLeft} hari lagi`
                      : 'Seumur Hidup'}
                  </div>
                </div>
              </div>
```

- [ ] **Step 4: Restyle the action banners (Discord/status)**

Replace:

```tsx
              {/* ── Action banners (compact) ── */}
              {(!member.discord_username || !member.funded_status) && (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {!member.discord_username && (
                    <button onClick={() => setActive('pengaturan')}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#080d1a', border: '1px solid #1e2a4a44', borderRadius: 8, cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}>
                      <span style={{ fontSize: 14 }}>💬</span>
                      <span style={{ fontSize: 12, color: '#5a6a9a', flex: 1 }}>Hubungkan akun Discord untuk akses server & notifikasi live</span>
                      <span style={{ fontFamily: C.mono, fontSize: 9, color: '#5865F2', border: '1px solid #5865F222', padding: '3px 8px', borderRadius: 4, flexShrink: 0 }}>HUBUNGKAN ▸</span>
                    </button>
                  )}
                  {!member.funded_status && (
                    <button onClick={() => setActive('funded')}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#0a0c00', border: '1px solid #2a2e0044', borderRadius: 8, cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}>
                      <span style={{ fontSize: 14 }}>🚀</span>
                      <span style={{ fontSize: 12, color: '#666', flex: 1 }}>Set status trading kamu — Demo, Phase, Funded, dll</span>
                      <span style={{ fontFamily: C.mono, fontSize: 9, color: G.gold, border: '1px solid var(--mr-tint-gold-b)', padding: '3px 8px', borderRadius: 4, flexShrink: 0 }}>SET STATUS ▸</span>
                    </button>
                  )}
                </div>
              )}

              {/* ── Banner broker rekomendasi ── */}
              {brokers.length > 0 && (
                <div className="mr-broker-banner" style={{ background: 'linear-gradient(135deg,var(--mr-tint-gold),var(--mr-bg))', border: `1px solid var(--mr-tint-gold-b)`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="mr-broker-icon" style={{ fontSize: 24, flexShrink: 0 }}>🏦</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                      Cek broker rekomendasi kami
                    </div>
                  </div>
                  <button
                    onClick={() => setActive('tools')}
                    className="mr-btn-shimmer"
                    style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#000', background: G.gold, border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0 }}
                  >
                    Cek Broker ›
                  </button>
                </div>
              )}
```

with:

```tsx
              {/* ── Action banners (compact) ── */}
              {(!member.discord_username || !member.funded_status) && (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {!member.discord_username && (
                    <button onClick={() => setActive('pengaturan')}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#5865F20d', border: '1px solid #5865F233', borderRadius: 8, cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}>
                      <MessageCircle size={16} color="#5865F2" />
                      <span style={{ fontSize: 12, color: LP.text, flex: 1 }}>Hubungkan akun Discord untuk akses server & notifikasi live</span>
                      <span style={{ fontFamily: LP.mono, fontSize: 9, color: '#5865F2', border: '1px solid #5865F244', padding: '3px 8px', borderRadius: 4, flexShrink: 0 }}>HUBUNGKAN ▸</span>
                    </button>
                  )}
                  {!member.funded_status && (
                    <button onClick={() => setActive('funded')}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: LP.primaryTint, border: `1px solid ${LP.primary}33`, borderRadius: 8, cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}>
                      <Rocket size={16} color={LP.primary} />
                      <span style={{ fontSize: 12, color: LP.text, flex: 1 }}>Set status trading kamu — Demo, Phase, Funded, dll</span>
                      <span style={{ fontFamily: LP.mono, fontSize: 9, color: LP.primary, border: `1px solid ${LP.primary}44`, padding: '3px 8px', borderRadius: 4, flexShrink: 0 }}>SET STATUS ▸</span>
                    </button>
                  )}
                </div>
              )}

              {/* ── Banner broker rekomendasi ── */}
              {brokers.length > 0 && (
                <div className="mr-broker-banner" style={{ background: `linear-gradient(135deg,${LP.primaryTint},${LP.bg})`, border: `1px solid ${LP.primary}33`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="mr-broker-icon" style={{ flexShrink: 0 }}><Landmark size={22} color={LP.primary} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: LP.text }}>
                      Cek broker rekomendasi kami
                    </div>
                  </div>
                  <button
                    onClick={() => setActive('tools')}
                    style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: '#fff', background: LP.primary, border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0 }}
                  >
                    Cek Broker ›
                  </button>
                </div>
              )}
```

(Note: the `className="mr-btn-shimmer"` on the broker-banner button is dropped — that shimmer animation class was defined only in `LandingPage.tsx`'s `<style>` block, which this file does not include; keeping the class name here would silently do nothing, so removing it avoids dead markup. If in doubt, grep this file for `mr-btn-shimmer` — it should have zero matches after this change.)

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck 2>&1 | grep DashboardPage`
Expected: no new errors beyond baseline.

- [ ] **Step 6: Visual check**

Log in as a member whose `funded_status`/`discord_username` are unset (to see the action banners) and one where they are set (to see the status pill icons). Confirm light backgrounds throughout, lucide icons render (no emoji), progress bars still animate and show the lock icon for locked categories if the member isn't Advance.

- [ ] **Step 7: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle header, progress, status row, dan banner tab Dashboard ke tema terang"
```

---

## Task 6: `LanjutkanBelajar` component + "My Trading Stats" widget

**Files:**
- Modify: `src/components/LanjutkanBelajar.tsx` (entire file — its local `C` token values)
- Modify: `src/pages/member/DashboardPage.tsx` ("My Trading Stats" block, both the populated and empty-state branches)

**Interfaces:**
- Consumes: `LP` tokens (in `DashboardPage.tsx`); `LanjutkanBelajar.tsx` keeps its own local `C` object (doesn't import cross-file, matching this codebase's convention) but changes its values to point at the same `--lp-*` variables.
- Produces: none new. `LanjutkanBelajar`'s prop signature (`{ memberId, memberTier }`) is untouched — do not change its call site in `DashboardPage.tsx`.

- [ ] **Step 1: Point `LanjutkanBelajar.tsx`'s local `C` object at `--lp-*` instead of `--mr-*`**

Replace:

```tsx
const C = {
  panel: 'var(--mr-panel)',
  border: 'var(--mr-border)',
  border2: 'var(--mr-border2)',
  text: 'var(--mr-text)',
  dim: 'var(--mr-muted)',
  dimmer: 'var(--mr-dim)',
  gold: 'var(--mr-gold)',
  mono: '"Geist Mono", monospace',
};
```

with:

```tsx
const C = {
  panel: 'var(--lp-surface)',
  border: 'var(--lp-border)',
  border2: 'var(--lp-border)',
  text: 'var(--lp-text)',
  dim: 'var(--lp-muted)',
  dimmer: 'var(--lp-muted)',
  gold: 'var(--lp-primary)',
  mono: '"Geist Mono", monospace',
};
```

(This works because `DashboardPage`'s root wrapper now carries the `.mr-light-v2` class — Task 1, Step 7 — and `LanjutkanBelajar` is always rendered somewhere inside that wrapper, so the `--lp-*` custom properties are in scope by CSS inheritance. No other line in `LanjutkanBelajar.tsx` needs to change — it already references everything through this `C` object.)

- [ ] **Step 2: Fix the video-thumbnail play button and "VIDEO" placeholder contrast**

The play-button circle and placeholder text currently hardcode colors that assumed a dark thumbnail background. Replace:

```tsx
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dimmer, fontFamily: C.mono }}>
                  VIDEO
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 38, height: 38, borderRadius: 999, background: C.gold, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  ▶
                </span>
              </div>
```

with:

```tsx
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontFamily: C.mono }}>
                  VIDEO
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 38, height: 38, borderRadius: 999, background: C.gold, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                  ▶
                </span>
              </div>
```

(The thumbnail's own background stays `#070707` — that div only shows when there's no `thumbnailUrl`, and a dark placeholder box with light gray "VIDEO" text plus a solid green circular play button reads fine regardless of the surrounding page theme, so it does not need further changes.)

- [ ] **Step 3: Typecheck `LanjutkanBelajar.tsx`**

Run: `npm run typecheck 2>&1 | grep LanjutkanBelajar`
Expected: no errors (this file had none before).

- [ ] **Step 4: Restyle "My Trading Stats" in `DashboardPage.tsx` — populated branch**

Replace:

```tsx
              {/* ── My Trading Stats ── */}
              {myJurnalStats ? (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap' as const, gap: 8 }}>
                    <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1 }}>// MY TRADING STATS</div>
                    <button onClick={() => setActive('jurnal')} style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, background: 'none', border: `1px solid ${C.border2}`, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>Lihat Jurnal ›</button>
                  </div>
                  {/* Equity gain banner */}
                  <div style={{ marginBottom: 12, padding: '10px 14px', background: myJurnalStats.totalGain >= 0 ? 'var(--mr-tint-green)' : 'rgba(239,68,68,0.08)', border: `1px solid ${myJurnalStats.totalGain >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, letterSpacing: 0.8, marginBottom: 2 }}>TOTAL EQUITY GAIN</div>
                      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color: myJurnalStats.totalGain >= 0 ? C.up : C.down, fontFamily: C.mono }}>
                        {myJurnalStats.totalGain >= 0 ? '+' : ''}{myJurnalStats.totalGain.toFixed(2)}%
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, marginBottom: 2 }}>TOTAL PNL</div>
                      <div style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700, color: myJurnalStats.totalPnl >= 0 ? C.up : C.down }}>
                        {myJurnalStats.totalPnl >= 0 ? '+' : ''}${myJurnalStats.totalPnl.toFixed(0)}
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, marginTop: 2 }}>dari ${myJurnalStats.equityAwal.toLocaleString()}</div>
                    </div>
                  </div>
                  {/* Stat grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
                    {[
                      { label: 'TOTAL TRADE', value: myJurnalStats.totalTrades, color: C.text, mono: true },
                      { label: 'WIN RATE', value: `${myJurnalStats.winRate.toFixed(0)}%`, color: myJurnalStats.winRate >= 50 ? C.up : C.down, mono: true },
                      { label: 'WIN', value: myJurnalStats.wins, color: C.up, mono: true },
                      { label: 'LOSS', value: myJurnalStats.losses, color: C.down, mono: true },
                      { label: 'BEST TRADE', value: `$${myJurnalStats.bestTrade >= 0 ? '+' : ''}${myJurnalStats.bestTrade.toFixed(0)}`, color: C.up, mono: true },
                      { label: 'WORST TRADE', value: `$${myJurnalStats.worstTrade.toFixed(0)}`, color: C.down, mono: true },
                      { label: 'TOP PAIR', value: myJurnalStats.mostTradedPair, color: C.text, mono: false },
                    ].map(s => (
                      <div key={s.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontFamily: C.mono, fontSize: 8, color: '#555', letterSpacing: 0.8, marginBottom: 5 }}>{s.label}</div>
                        <div style={{ fontFamily: s.mono ? C.mono : C.sans, fontSize: s.label === 'TOP PAIR' ? 12 : 15, fontWeight: 700, color: s.color, letterSpacing: -0.3 }}>{String(s.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>📓</span>
                  <div>
                    <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 9, letterSpacing: 1, marginBottom: 3 }}>// MY TRADING STATS</div>
                    <div style={{ fontSize: 12, color: C.dim }}>Belum ada data jurnal. Mulai isi jurnal trading untuk lihat statistikmu.</div>
                  </div>
                  <button onClick={() => setActive('jurnal')} style={{ marginLeft: 'auto', fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: '#000', background: G.gold, border: 'none', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
                    Buka Jurnal ›
                  </button>
                </div>
              )}
```

with:

```tsx
              {/* ── My Trading Stats ── */}
              {myJurnalStats ? (
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap' as const, gap: 8 }}>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1 }}>MY TRADING STATS</div>
                    <button onClick={() => setActive('jurnal')} style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, background: 'none', border: `1px solid ${LP.border}`, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>Lihat Jurnal ›</button>
                  </div>
                  {/* Equity gain banner */}
                  <div style={{ marginBottom: 12, padding: '10px 14px', background: myJurnalStats.totalGain >= 0 ? LP.primaryTint : `${LP.danger}14`, border: `1px solid ${myJurnalStats.totalGain >= 0 ? LP.primary + '44' : LP.danger + '44'}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, letterSpacing: 0.8, marginBottom: 2 }}>TOTAL EQUITY GAIN</div>
                      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color: myJurnalStats.totalGain >= 0 ? LP.primary : LP.danger, fontFamily: LP.mono }}>
                        {myJurnalStats.totalGain >= 0 ? '+' : ''}{myJurnalStats.totalGain.toFixed(2)}%
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginBottom: 2 }}>TOTAL PNL</div>
                      <div style={{ fontFamily: LP.mono, fontSize: 16, fontWeight: 700, color: myJurnalStats.totalPnl >= 0 ? LP.primary : LP.danger }}>
                        {myJurnalStats.totalPnl >= 0 ? '+' : ''}${myJurnalStats.totalPnl.toFixed(0)}
                      </div>
                      <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 2 }}>dari ${myJurnalStats.equityAwal.toLocaleString()}</div>
                    </div>
                  </div>
                  {/* Stat grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
                    {[
                      { label: 'TOTAL TRADE', value: myJurnalStats.totalTrades, color: LP.text, mono: true },
                      { label: 'WIN RATE', value: `${myJurnalStats.winRate.toFixed(0)}%`, color: myJurnalStats.winRate >= 50 ? LP.primary : LP.danger, mono: true },
                      { label: 'WIN', value: myJurnalStats.wins, color: LP.primary, mono: true },
                      { label: 'LOSS', value: myJurnalStats.losses, color: LP.danger, mono: true },
                      { label: 'BEST TRADE', value: `$${myJurnalStats.bestTrade >= 0 ? '+' : ''}${myJurnalStats.bestTrade.toFixed(0)}`, color: LP.primary, mono: true },
                      { label: 'WORST TRADE', value: `$${myJurnalStats.worstTrade.toFixed(0)}`, color: LP.danger, mono: true },
                      { label: 'TOP PAIR', value: myJurnalStats.mostTradedPair, color: LP.text, mono: false },
                    ].map(s => (
                      <div key={s.label} style={{ background: LP.bg, border: `1px solid ${LP.border}`, borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontFamily: LP.mono, fontSize: 8, color: LP.muted, letterSpacing: 0.8, marginBottom: 5 }}>{s.label}</div>
                        <div style={{ fontFamily: s.mono ? LP.mono : LP.sans, fontSize: s.label === 'TOP PAIR' ? 12 : 15, fontWeight: 700, color: s.color, letterSpacing: -0.3 }}>{String(s.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <NotebookPen size={22} color={LP.primary} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 9, letterSpacing: 1, marginBottom: 3 }}>MY TRADING STATS</div>
                    <div style={{ fontSize: 12, color: LP.muted }}>Belum ada data jurnal. Mulai isi jurnal trading untuk lihat statistikmu.</div>
                  </div>
                  <button onClick={() => setActive('jurnal')} style={{ marginLeft: 'auto', fontFamily: LP.mono, fontSize: 10, fontWeight: 700, color: '#fff', background: LP.primary, border: 'none', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
                    Buka Jurnal ›
                  </button>
                </div>
              )}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck 2>&1 | grep -E "DashboardPage|LanjutkanBelajar"`
Expected: no new errors beyond baseline.

- [ ] **Step 6: Visual check**

Confirm the "Lanjutkan Belajar"/"Mulai Belajar" video-card row (below the broker banner) now uses light cards, and "My Trading Stats" (whichever branch applies to your test member) reads clearly on a white/light card.

- [ ] **Step 7: Commit**

```bash
git add src/components/LanjutkanBelajar.tsx src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle LanjutkanBelajar dan My Trading Stats ke tema terang"
```

---

## Task 7: Dashboard tab — Top 3 Jurnal Trading + Pengumuman panel

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (final two widgets in the `dashboard` tab)

**Interfaces:**
- Consumes: `LP` tokens, `CheckCircle2`/`Megaphone` icons (Task 1).
- Produces: none new.

- [ ] **Step 1: Restyle "Top 3 Jurnal Trading"**

Replace:

```tsx
              {/* ── Top 3 Jurnal Trading ── */}
              {jurnalLeaderboard.length > 0 && (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1 }}>// TOP 3 JURNAL TRADING</div>
                    <button onClick={() => setActive('peringkat')} style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, background: 'none', border: `1px solid ${C.border2}`, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>Lihat Semua ›</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {jurnalLeaderboard.slice(0, 3).map((m: any, i: number) => {
                      const rankImgs = ['/rank_1.png', '/rank_2.png', '/rank_3.png'];
                      const isMe = m.id === member.id;
                      const borderColor = i === 0 ? 'var(--mr-tint-gold-b)' : C.border;
                      const bgColor = i === 0 ? 'var(--mr-tint-gold)' : i === 1 ? 'var(--mr-tint-green)' : C.panel;
                      return (
                        <div key={m.id} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '12px', textAlign: 'center' as const, position: 'relative' }}>
                          {isMe && <div style={{ position: 'absolute', top: 4, right: 6, fontFamily: C.mono, fontSize: 7, color: G.gold, fontWeight: 700 }}>KAMU</div>}
                          <img src={rankImgs[i]} alt={`rank-${i+1}`} style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 4 }}/>
                          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{m.nama}</div>
                          <div style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 800, color: m.gainPct >= 0 ? C.up : C.down }}>
                            {m.gainPct >= 0 ? '+' : ''}{m.gainPct.toFixed(1)}%
                          </div>
                          <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, marginTop: 2 }}>{m.trades} trade</div>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const myRank = jurnalLeaderboard.findIndex((m: any) => m.id === member.id);
                    return myRank > 2 ? (
                      <div style={{ marginTop: 10, padding: '8px 12px', borderTop: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: 10, color: C.dim, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Posisimu saat ini</span>
                        <span style={{ color: G.gold, fontWeight: 700 }}>#{myRank + 1} dari {jurnalLeaderboard.length} trader</span>
                      </div>
                    ) : myRank >= 0 ? (
                      <div style={{ marginTop: 10, padding: '8px 12px', borderTop: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: 10, color: C.up, textAlign: 'center' as const }}>
                        🎉 Kamu ada di Top 3!
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
```

with:

```tsx
              {/* ── Top 3 Jurnal Trading ── */}
              {jurnalLeaderboard.length > 0 && (
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1 }}>TOP 3 JURNAL TRADING</div>
                    <button onClick={() => setActive('peringkat')} style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, background: 'none', border: `1px solid ${LP.border}`, padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>Lihat Semua ›</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {jurnalLeaderboard.slice(0, 3).map((m: any, i: number) => {
                      const rankImgs = ['/rank_1.png', '/rank_2.png', '/rank_3.png'];
                      const isMe = m.id === member.id;
                      const borderColor = i === 0 ? LP.primary + '44' : LP.border;
                      const bgColor = i === 0 ? LP.primaryTint : i === 1 ? `${LP.primary}0d` : LP.surface;
                      return (
                        <div key={m.id} style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '12px', textAlign: 'center' as const, position: 'relative' }}>
                          {isMe && <div style={{ position: 'absolute', top: 4, right: 6, fontFamily: LP.mono, fontSize: 7, color: LP.primary, fontWeight: 700 }}>KAMU</div>}
                          <img src={rankImgs[i]} alt={`rank-${i+1}`} style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 4 }}/>
                          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: LP.text }}>{m.nama}</div>
                          <div style={{ fontFamily: LP.mono, fontSize: 16, fontWeight: 800, color: m.gainPct >= 0 ? LP.primary : LP.danger }}>
                            {m.gainPct >= 0 ? '+' : ''}{m.gainPct.toFixed(1)}%
                          </div>
                          <div style={{ fontFamily: LP.mono, fontSize: 9, color: LP.muted, marginTop: 2 }}>{m.trades} trade</div>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const myRank = jurnalLeaderboard.findIndex((m: any) => m.id === member.id);
                    return myRank > 2 ? (
                      <div style={{ marginTop: 10, padding: '8px 12px', borderTop: `1px solid ${LP.border}`, fontFamily: LP.mono, fontSize: 10, color: LP.muted, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Posisimu saat ini</span>
                        <span style={{ color: LP.primary, fontWeight: 700 }}>#{myRank + 1} dari {jurnalLeaderboard.length} trader</span>
                      </div>
                    ) : myRank >= 0 ? (
                      <div style={{ marginTop: 10, padding: '8px 12px', borderTop: `1px solid ${LP.border}`, fontFamily: LP.mono, fontSize: 10, color: LP.primary, textAlign: 'center' as const }}>
                        🎉 Kamu ada di Top 3!
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
```

- [ ] **Step 2: Restyle the Pengumuman panel**

Replace:

```tsx
              {/* Pengumuman */}
              <div>
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Pengumuman Terbaru</div>
                  {/* Discord status - compact */}
                  {member.discord_username && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--mr-tint-green)', border: `1px solid var(--mr-up-a20)`, borderRadius: 7, marginBottom: 12 }}>
                      <span style={{ fontSize: 14 }}>✅</span>
                      <div style={{ fontSize: 12, color: C.up, fontFamily: C.mono }}>Discord: @{member.discord_username}</div>
                    </div>
                  )}
                  {/* Notifikasi personal (approve/reject advance) */}
                  {notifications.filter((n:any) => !dismissedNotifs.has(n.id)).map((n: any, ni: number) => (
                    <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 8, marginBottom: 8,
                      background: n.type === 'approve' ? 'var(--mr-tint-green)' : n.type === 'reject' ? '#1a0a0a' : '#0a0e1a',
                      border: `1px solid ${n.type === 'approve' ? C.up + '44' : n.type === 'reject' ? C.down + '44' : '#1e2a4a'}` }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>
                        {n.type === 'approve' ? '✅' : n.type === 'reject' ? '❌' : 'ℹ️'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3,
                          color: n.type === 'approve' ? C.up : n.type === 'reject' ? C.down : '#93a8f0' }}>
                          {n.type === 'approve' ? 'Request Advanced Disetujui 🎉' : n.type === 'reject' ? 'Request Advanced Ditolak' : 'Informasi'}
                        </div>
                        <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6 }}>{n.message}</div>
                        <div style={{ fontFamily: C.mono, fontSize: 10, color: '#444', marginTop: 4 }}>
                          {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Pengumuman global */}
                  {announcements.length === 0 && notifications.length === 0 ? (
                    <div style={{ fontFamily: C.mono, color: C.dim, fontSize: 12, padding: '12px 0' }}>Belum ada pengumuman.</div>
                  ) : announcements.map((a: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>📢</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {a.judul && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{a.judul}</div>}
                        <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>{a.content || a.message || ''}</div>
                        <div style={{ fontFamily: C.mono, fontSize: 10, color: '#444', marginTop: 4 }}>
                          {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
```

with:

```tsx
              {/* Pengumuman */}
              <div>
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: LP.text }}>Pengumuman Terbaru</div>
                  {/* Discord status - compact */}
                  {member.discord_username && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: LP.primaryTint, border: `1px solid ${LP.primary}33`, borderRadius: 7, marginBottom: 12 }}>
                      <CheckCircle2 size={14} color={LP.primary} />
                      <div style={{ fontSize: 12, color: LP.primary, fontFamily: LP.mono }}>Discord: @{member.discord_username}</div>
                    </div>
                  )}
                  {/* Notifikasi personal (approve/reject advance) */}
                  {notifications.filter((n:any) => !dismissedNotifs.has(n.id)).map((n: any, ni: number) => (
                    <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 8, marginBottom: 8,
                      background: n.type === 'approve' ? LP.primaryTint : n.type === 'reject' ? `${LP.danger}0d` : `${LP.primary}0d`,
                      border: `1px solid ${n.type === 'approve' ? LP.primary + '44' : n.type === 'reject' ? LP.danger + '44' : LP.primary + '33'}` }}>
                      <span style={{ flexShrink: 0 }}>
                        {n.type === 'approve' ? <CheckCircle2 size={18} color={LP.primary} /> : n.type === 'reject' ? <XCircle size={18} color={LP.danger} /> : <Info size={18} color={LP.primary} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3,
                          color: n.type === 'approve' ? LP.primary : n.type === 'reject' ? LP.danger : LP.text }}>
                          {n.type === 'approve' ? 'Request Advanced Disetujui 🎉' : n.type === 'reject' ? 'Request Advanced Ditolak' : 'Informasi'}
                        </div>
                        <div style={{ fontSize: 12, color: LP.muted, lineHeight: 1.6 }}>{n.message}</div>
                        <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, marginTop: 4 }}>
                          {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Pengumuman global */}
                  {announcements.length === 0 && notifications.length === 0 ? (
                    <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 12, padding: '12px 0' }}>Belum ada pengumuman.</div>
                  ) : announcements.map((a: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${LP.border}` }}>
                      <span style={{ flexShrink: 0 }}><Megaphone size={18} color={LP.muted} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {a.judul && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: LP.text }}>{a.judul}</div>}
                        <div style={{ fontSize: 12, color: LP.muted, lineHeight: 1.5 }}>{a.content || a.message || ''}</div>
                        <div style={{ fontFamily: LP.mono, fontSize: 10, color: LP.muted, marginTop: 4 }}>
                          {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck 2>&1 | grep DashboardPage`
Expected: no new errors beyond baseline.

- [ ] **Step 4: Visual check**

Confirm the Top-3 leaderboard cards and the "Pengumuman Terbaru" panel (including the Discord-connected pill, any approve/reject notifications, and any global announcements) render on light cards with lucide status icons.

- [ ] **Step 5: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: restyle Top 3 Jurnal Trading dan panel Pengumuman ke tema terang"
```

---

## Task 8: Final cleanup and full QA pass

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (sweep for anything missed)

**Interfaces:**
- Consumes: everything produced by Tasks 1–7.
- Produces: the finished Phase 1 shell + `dashboard` tab.

- [ ] **Step 1: Grep the `dashboard`-tab region for leftover dark tokens**

The `dashboard` tab block runs from the `{active === 'dashboard' && (` line through its matching closing `)}` (right before `{/* ══ KELAS SAYA ══ */}`). Within that region only (not the rest of the file — the other 17 tabs legitimately keep `C.`/`G.`/`var(--mr-` and must not be touched), search for any remaining `C\.` , `G\.`, or `var(--mr-` reference. Every match inside this region that Tasks 5–7 didn't already convert is a gap — convert it to the equivalent `LP.*` token using the same mappings established in this plan (`C.panel`→`LP.surface`, `C.border`/`C.border2`→`LP.border`, `C.text`→`LP.text`, `C.dim`/`C.dimmer`→`LP.muted`, `C.up`/`G.gold`→`LP.primary`, `C.down`→`LP.danger`, `C.bg`→`LP.bg`, `C.mono`→`LP.mono`, `C.sans`→`LP.sans`).

- [ ] **Step 2: Grep the shell (topbar + both sidebars) for the same leftovers**

Same check, scoped to the topbar block, the desktop `<aside>` block, and the mobile overlay block. Convert anything Tasks 2–4 missed.

- [ ] **Step 3: Confirm no emoji remain as structural icons**

Search the `dashboard` tab and shell regions for emoji characters. Any that remain should only be the explicitly-allowed expressive ones inside sentence text: "🎉" (in "Advance Disetujui 🎉" and "Kamu ada di Top 3!"). Everything else should already be a `lucide-react` icon per Tasks 1–7 — if you find a leftover, replace it with the closest icon already imported in Task 1, or add a new one to that same `lucide-react` import line if none fits.

- [ ] **Step 4: Full typecheck + lint**

Run: `npm run typecheck 2>&1 | grep -E "DashboardPage|LanjutkanBelajar"`
Expected: identical to (or fewer than) the baseline recorded before Task 1 — no new categories.

Run: `npm run lint 2>&1 | grep -E "DashboardPage|LanjutkanBelajar"`
Expected: same comparison — no new categories versus a baseline lint run you take right now (run `npm run lint 2>&1 | grep -E "DashboardPage|LanjutkanBelajar"` once before making any further changes in this task to have something to diff against, since this file wasn't part of the earlier landing-page baseline recording).

- [ ] **Step 5: Full visual QA pass**

With `npm run dev` running, log in as a member and walk the shell + `dashboard` tab at 375px, 768px, and 1440px widths:
- No horizontal scrollbar at any width.
- Topbar, both sidebars, and every widget in the `dashboard` tab use the light palette — no leftover dark panel anywhere in this scope.
- Clicking through to any of the other 17 tabs (e.g. `kelas`, `jurnal`) shows them still dark-terminal, as expected for this phase — confirm the shell (still light) and the tab content (still dark) coexist without visual glitches (e.g. no broken borders where light sidebar meets dark tab content).
- Sidebar search: type a partial label, confirm filtering works on both desktop and mobile; collapse/expand the desktop sidebar and confirm the query resets; open/close the mobile overlay and confirm the same.
- Bell dropdown opens/closes correctly and displays lucide icons.

- [ ] **Step 6: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "chore: bersihkan sisa token gelap di shell dan tab Dashboard (fase 1 selesai)"
```

---

## Self-Review Notes

- **Spec coverage:** every item in the spec's §2 (index.css rename, LandingPage.tsx reference update, root wrapper, topbar, sidebar desktop, sidebar mobile, dashboard tab widgets) maps to a task above. The spec's §1 "LanjutkanBelajar out of explicit spec scope" gap is corrected in Task 6, with the deviation documented in this plan's Global Constraints.
- **Type consistency:** `LP` token names match `LandingPage.tsx`'s exactly (`bg`, `surface`, `text`, `muted`, `border`, `primary`, `primaryHover`, `primaryTint`, `danger`, `sans`, `mono`, `radius`, `radiusSm`, `shadowSm`, `shadowMd`). `SIDEBAR`'s `Icon` field name and `filterSidebar()`'s signature are introduced once in Task 1 and used identically in Tasks 3–4.
- **No placeholders:** every step shows the exact before/after code.
