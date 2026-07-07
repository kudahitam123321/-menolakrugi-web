# Dashboard Berbeda untuk Member Indikator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Members whose tier is one of the 3 indicator tiers (`Indikator Bulanan`/`Tahunan`/`Lifetime`) see a locked upsell card instead of class-only tab content, and a simplified home ("Dashboard") tab showing their indicator order status instead of class-progress widgets. Real class members (including ones who also bought an indicator via the in-dashboard `produk` tab) are completely unaffected.

**Architecture:** Single-file change (`src/pages/member/DashboardPage.tsx`), no new files. One derived boolean (`isIndikatorMember`), one shared inline-IIFE "locked" block covering 12 tab IDs, and one inline-IIFE branch replacing the `dashboard` tab's content when `isIndikatorMember` is true. Matches the file's existing convention of `(() => { ... })()` IIFEs inside JSX (already used for the `materi`, `sertifikat`, `ulasan` tabs) — no new shared component needed since each new block has exactly one call site.

**Tech Stack:** React + TypeScript, no test framework in this repo (verification is `npm run typecheck` + manual/static trace, per `CLAUDE.md`).

## Global Constraints

- Tab `1on1` is NOT touched — it already gates out any tier not in `['gold', 'platinum', 'SMC Gold Mentorship', 'SMC Platinum 1-on-1', 'SMC Platinum 1 on 1']`, which already excludes indicator tiers.
- `SIDEBAR` array itself is NOT filtered/modified — all 18 items stay visible for every tier.
- Do not touch `src/pages/DashboardPage.tsx` or `src/pages/MemberPage.tsx` (legacy, unrouted from `App.tsx`).
- Full spec: `docs/superpowers/specs/2026-07-07-dashboard-indikator-member-design.md`.
- Depends on the already-merged indicator-tier feature: `normalizeTier()` at `src/pages/member/DashboardPage.tsx` already returns `'indikator'` for the 3 new tier strings (confirmed present at the time this plan was written).

---

### Task 1: Lock 12 class-only tabs for indicator-tier members

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (add helper near line 983, edit 12 tab conditions, add 1 shared block)

**Interfaces:**
- Produces: `isIndikatorMember: boolean` — a component-scope `const`, consumed by this task's own shared block and by Task 2's dashboard-home branch (Task 2 must not redeclare it).

- [ ] **Step 1: Add the `isIndikatorMember` helper**

In `src/pages/member/DashboardPage.tsx`, find this block (around line 976-983):

```ts
  const isTrial   = member.tier === 'SMC Trial';
  const expiryDate = isTrial && member.created_at
    ? new Date(new Date(member.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const isExpired  = expiryDate ? expiryDate < new Date() : false;
  const daysLeft   = expiryDate
    ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
```

Add immediately after the closing `: null;` of `daysLeft` (still inside the same component body, before the next section of code):

```ts
  const isIndikatorMember = normalizeTier(member.tier) === 'indikator';
```

- [ ] **Step 2: Gate the 12 class-only tab conditions**

Each of these 12 lines exists exactly once in the file (verified via `grep -n` before writing this plan). For each, find the exact line and add `!isIndikatorMember` to its condition as shown. Do not change indentation, do not change anything else on the line.

1. Find: `          {active === 'kelas' && (`
   Replace: `          {active === 'kelas' && !isIndikatorMember && (`

2. Find: `          {active === 'materi' && (() => {`
   Replace: `          {active === 'materi' && !isIndikatorMember && (() => {`

3. Find: `          {active === 'tools' && (`
   Replace: `          {active === 'tools' && !isIndikatorMember && (`

4. Find: `          {active === 'funded' && (`
   Replace: `          {active === 'funded' && !isIndikatorMember && (`

5. Find: `        {active === 'peringkat' && member && (`
   Replace: `        {active === 'peringkat' && member && !isIndikatorMember && (`

6. Find: `        {active === 'jurnal' && member && (`
   Replace: `        {active === 'jurnal' && member && !isIndikatorMember && (`

7. Find: `        {active === 'trading-plan' && (`
   Replace: `        {active === 'trading-plan' && !isIndikatorMember && (`

8. Find: `        {active === 'competition' && (`
   Replace: `        {active === 'competition' && !isIndikatorMember && (`

9. Find: `        {active === 'sertifikat' && (() => {`
   Replace: `        {active === 'sertifikat' && !isIndikatorMember && (() => {`

10. Find: `          {active === 'komunitas' && (`
    Replace: `          {active === 'komunitas' && !isIndikatorMember && (`

11. Find: `          {active === 'ulasan' && (() => {`
    Replace: `          {active === 'ulasan' && !isIndikatorMember && (() => {`

12. Find: `          {active === 'referral' && (`
    Replace: `          {active === 'referral' && !isIndikatorMember && (`

Before editing each, use the Read tool at the approximate line number (they were, before this task's edits: kelas≈1627, materi≈1835, tools≈1979, funded≈2160, peringkat≈2257, jurnal≈2264, trading-plan≈2268, competition≈2272, sertifikat≈2277, komunitas≈2801, ulasan≈2836, referral≈2899) to confirm you have the right block before replacing — line numbers will drift slightly after Step 1's insertion and after each subsequent edit in this same step.

- [ ] **Step 3: Add the shared locked-tab block**

Place this new block immediately before the `{active === 'kelas' && !isIndikatorMember && (` line (i.e., right after the comment `{/* ══ KELAS SAYA ══ */}` that precedes it, or immediately before that comment — either position is fine as long as it's a sibling JSX expression at the same level as the other `{active === ...}` blocks):

```tsx
          {isIndikatorMember && ['kelas','materi','jurnal','trading-plan','komunitas','tools','funded','peringkat','competition','sertifikat','ulasan','referral'].includes(active) && (() => {
            const label = SIDEBAR.find(s => s.id === active)?.label || 'Fitur ini';
            return (
              <div className='mr-content-pad' style={{ padding: 24 }}>
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, padding: '48px 24px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: LP.text }}>Fitur Khusus Member Kelas</div>
                  <div style={{ color: LP.muted, fontSize: 14, marginBottom: 24, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
                    {label} hanya tersedia untuk member kelas SMC (Trial, Bronze, Gold, atau Platinum).
                  </div>
                  <a href="/pricing-kelas" style={{ display: 'inline-block', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, color: '#fff', background: LP.primary, padding: '11px 28px', textDecoration: 'none', borderRadius: 8 }}>
                    GABUNG KELAS →
                  </a>
                </div>
              </div>
            );
          })()}

```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no new errors (compare against the pre-existing error list — this repo has known pre-existing errors in `CurriculumPage.tsx`, `LeaderboardPage.tsx`, `MemberTradingPlan.tsx`, `SignupPage.tsx`, `TradingViewWidget.tsx`, and unused-var warnings in `DashboardPage.tsx` itself; none of your edits should add to or change that list).

- [ ] **Step 5: Manual verification via dev server**

Run: `npm run dev`. Log in as (or set `localStorage.mr_member` to) a member with `tier: 'Indikator Bulanan'`. Click each of the 12 sidebar items (Kelas Saya, Materi, Jurnal Trading, Trading Plan, Komunitas, Broker, Status Trading, Peringkat, Kompetisi, Sertifikat, Tulis Ulasan, Referral) and confirm each shows the 🔒 "Fitur Khusus Member Kelas" card with that tab's own label substituted in, and a working "GABUNG KELAS →" link to `/pricing-kelas`. Then click `1on1` and confirm it still shows its own pre-existing "Fitur Eksklusif Gold & Platinum" lock (unchanged). Then log in as a member with a real class tier (e.g. `'SMC Gold Mentorship'`) and confirm all 12 tabs render their normal content (regression check — nothing should be locked for them).

- [ ] **Step 6: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: kunci 12 tab kelas untuk member tier indikator dengan kartu ajakan gabung kelas"
```

---

### Task 2: Simplified "Dashboard" home tab for indicator-tier members

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx` (wrap the `dashboard` tab's content in a ternary, add the indicator-tier branch)

**Interfaces:**
- Consumes: `isIndikatorMember` (from Task 1, must already exist in the file when this task starts), `myOrders` (existing state, array of order rows each with `.products.nama`, `.plan_type`, `.status`, `.activated_at`, sorted newest-first), `hitungJatuhTempo(activatedAt, planType)` (existing module-level function, already used identically at `member/DashboardPage.tsx` in the `produk` tab's "Pesanan Saya" section), `handleConnectDiscordOAuth()` (existing component function), `setActive` (existing state setter for the active sidebar tab).

- [ ] **Step 1: Locate and confirm the dashboard tab's exact boundaries**

Read `src/pages/member/DashboardPage.tsx` around line 1332-1340 and confirm you see:

```tsx
          {active === 'dashboard' && (
            <div className='mr-content-pad' style={{ padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* ── Top bar: Welcome + quick stats ── */}
```

Then read around line 1619-1626 (line numbers will have shifted by however many lines Task 1 added — search for this exact text instead of trusting the line number) and confirm you see the block's closing:

```tsx
                </div>

              </div>

            </div>
          )}

          {/* ══ KELAS SAYA ══ */}
```

This closing block is **not touched by this task** — see the note after Step 2 for why.

- [ ] **Step 2: Insert the ternary opening**

Replace:

```tsx
          {active === 'dashboard' && (
            <div className='mr-content-pad' style={{ padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
```

With:

```tsx
          {active === 'dashboard' && (
            isIndikatorMember ? (() => {
              const order = myOrders[0];
              const statusColor = (s: string) => s === 'aktif' ? LP.primary : s === 'dibayar' ? '#3b82f6' : '#eab308';
              const statusLabel = (s: string) => s === 'aktif' ? 'Aktif' : s === 'dibayar' ? 'Dibayar' : 'Pending';
              return (
                <div className='mr-content-pad' style={{ padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontFamily: LP.mono, color: LP.muted, fontSize: 9, letterSpacing: 1.5, marginBottom: 3 }}>SELAMAT DATANG KEMBALI</div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, margin: 0, color: LP.text }}>{member.nama}</h1>
                  </div>

                  <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>STATUS PESANAN</div>
                    {!order ? (
                      <div style={{ color: LP.muted, fontFamily: LP.mono, fontSize: 13 }}>Belum ada pesanan.</div>
                    ) : (
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const }}>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: LP.text }}>{(order as any).products?.nama || '—'}</div>
                          {order.plan_type && <span style={{ display: 'inline-block', fontFamily: LP.mono, fontSize: 10, color: LP.primary, border: `1px solid ${LP.primary}44`, padding: '2px 8px', borderRadius: 4, marginBottom: 4 }}>{order.plan_type.toUpperCase()}</span>}
                          {(() => {
                            if (order.plan_type === 'lifetime') return <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 4 }}>Jatuh tempo: Seumur Hidup</div>;
                            const jt = hitungJatuhTempo(order.activated_at, order.plan_type);
                            if (!jt) return <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 4 }}>Jatuh tempo: —</div>;
                            const lewat = jt < new Date();
                            return <div style={{ fontFamily: LP.mono, fontSize: 11, color: lewat ? LP.danger : LP.muted, marginTop: 4 }}>Jatuh tempo: {jt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>;
                          })()}
                        </div>
                        <span style={{ fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: statusColor(order.status), border: `1px solid ${statusColor(order.status)}44`, padding: '4px 12px', borderRadius: 20, flexShrink: 0 }}>
                          {statusLabel(order.status)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
                    <button onClick={() => setActive('produk')} style={{ fontFamily: LP.mono, fontSize: 12, fontWeight: 700, color: '#fff', background: LP.primary, border: 'none', padding: '11px 24px', borderRadius: 8, cursor: 'pointer' }}>
                      Beli/Perpanjang Indikator →
                    </button>
                    {member.discord_username ? (
                      <div style={{ display: 'flex', alignItems: 'center', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                        ✓ Terhubung sebagai @{member.discord_username}
                      </div>
                    ) : (
                      <button onClick={handleConnectDiscordOAuth} style={{ fontFamily: LP.mono, fontSize: 12, fontWeight: 700, color: '#fff', background: '#5865F2', border: 'none', padding: '11px 24px', borderRadius: 8, cursor: 'pointer' }}>
                        Hubungkan via Discord OAuth
                      </button>
                    )}
                  </div>
                </div>
              );
            })() :
            <div className='mr-content-pad' style={{ padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
```

Note: no other edit is needed to close this out. The full expression inside `{active === 'dashboard' && ( ... )}` is now `isIndikatorMember ? (() => {...})() : <div className='mr-content-pad'>...</div>` — a single ternary. Its else-branch is the pre-existing, completely untouched `<div className='mr-content-pad'>...</div>` block (unchanged from line ~1333 through its original closing `</div>` at what was line ~1623), and the pre-existing `)}` that already closes `{active === 'dashboard' && ( ... )}` closes the ternary too — a ternary expression needs no extra wrapping parens of its own. Do not add any closing paren to the original closing block (`</div>` / `</div>` / `</div>` / `)}` before `{/* ══ KELAS SAYA ══ */}`) — leave it byte-for-byte as it was before this task.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no new errors (same pre-existing-error baseline as Task 1's Step 4). Pay particular attention to any parenthesis/JSX-balance errors here specifically — this task's edit is the riskiest part of the plan (a stray or missing paren in Step 2's replacement text), so a typecheck failure here most likely means Step 2 was applied with a typo relative to the exact text given above.

- [ ] **Step 4: Manual verification via dev server**

Run: `npm run dev`. Log in as a member with `tier: 'Indikator Bulanan'` (or Tahunan/Lifetime) who has at least one row in `orders`. Open the `dashboard` tab and confirm: welcome header shows their name (no progress pills), a "STATUS PESANAN" card shows their most recent order's product name, plan badge, jatuh tempo (or "Seumur Hidup" for lifetime), and colored status badge, a "Beli/Perpanjang Indikator →" button that switches to the `produk` tab when clicked, and either a green "✓ Terhubung sebagai @username" line (if `discord_username` is set) or a "Hubungkan via Discord OAuth" button (if not) — clicking it should behave identically to the existing button in the Pengaturan tab. Then log in as a real class-tier member and confirm the `dashboard` tab looks completely unchanged (regression check).

- [ ] **Step 5: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: tampilkan dashboard ringkas (status pesanan + hubungkan discord) untuk member tier indikator"
```

---

### Task 3: Final whole-branch review

- [ ] **Step 1: Review the full diff against the spec**

Run: `git diff main -- src/pages/member/DashboardPage.tsx` (or the appropriate base commit if `main` has moved since Task 1/2 started).

Confirm every point in `docs/superpowers/specs/2026-07-07-dashboard-indikator-member-design.md` is reflected: `isIndikatorMember` helper, all 12 tabs gated, `1on1` untouched, shared locked block present and correctly worded, dashboard-home branch present with order card + 2 buttons.

- [ ] **Step 2: Full typecheck**

Run: `npm run typecheck`
Expected: exit code 0 relative to the pre-existing error baseline (no new errors from either task).

- [ ] **Step 3: End-to-end smoke test via dev server**

With `npm run dev` running: log in as an indicator-tier member and click through all 18 sidebar items once, confirming no tab crashes or renders blank/broken. Then log in as a real class-tier member and click through all 18 sidebar items once, confirming identical behavior to before this branch (nothing regressed).
