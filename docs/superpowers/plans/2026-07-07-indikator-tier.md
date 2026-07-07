# Tier Terpisah untuk Pembeli Indikator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give indicator-only buyers (from `/bayar`) their own tier values (`Indikator Bulanan`/`Tahunan`/`Lifetime`) instead of the colliding `'SMC Trial'` value shared with real class-Trial members, and fix the two places that currently treat any tier as class-Trial by loose substring match.

**Architecture:** Small, targeted edits to 3 existing files — no new files, no schema change (`members.tier` is a free-text column). `BayarPage.tsx` gets a tiny mapping helper; `member/DashboardPage.tsx` gets two exact-match/explicit-branch fixes; `AdminPage.tsx` gets a color branch and 3 new dropdown options. Data migration for pre-existing rows has already been run manually (see `supabase-indikator-tier-migration.sql`) — not part of this plan.

**Tech Stack:** React + TypeScript, no test framework in this repo (verification is `npm run typecheck` + manual dev-server check per `CLAUDE.md`).

## Global Constraints

- New tier literal values, exact strings: `Indikator Bulanan`, `Indikator Tahunan`, `Indikator Lifetime`.
- No schema/migration changes — `members.tier` and `orders.tier_member` are free-text columns already.
- Do not touch `src/pages/DashboardPage.tsx` (legacy, unrouted — confirmed via `grep` on `App.tsx`).
- Do not touch video (`videos.tier_access`) gating — confirmed unused/out of scope in the design spec.
- Full spec: `docs/superpowers/specs/2026-07-07-indikator-tier-design.md`.

---

### Task 1: Map purchase plan to tier in `BayarPage.tsx`

**Files:**
- Modify: `src/pages/BayarPage.tsx:16-34` (add helper after `getPlanFromConfig`)
- Modify: `src/pages/BayarPage.tsx:107` (members insert)
- Modify: `src/pages/BayarPage.tsx:122` (orders insert)

**Interfaces:**
- Produces: `tierFromPlan(planKey: string): string` — used only within this file.

- [ ] **Step 1: Add the mapping helper**

In `src/pages/BayarPage.tsx`, immediately after the existing `getPlanFromConfig` function (which ends at line 29 with `return null;\n}`), add:

```ts
function tierFromPlan(planKey: string): string {
  if (planKey === 'bulanan')  return 'Indikator Bulanan';
  if (planKey === 'tahunan')  return 'Indikator Tahunan';
  if (planKey === 'lifetime') return 'Indikator Lifetime';
  return 'Indikator Bulanan';
}
```

- [ ] **Step 2: Use it in the `members` insert**

Find this block (around line 105-112):

```ts
    const { data: newMember, error: memberErr } = await supabase.from('members').insert({
      nama:      nama.trim(),
      tier:      'SMC Trial',
      password:  memberPassword,
      role:      'member',
      is_active: false,
      is_advance: false,
    }).select('id').single();
```

Change the `tier:` line to:

```ts
      tier:      tierFromPlan(plan.key),
```

- [ ] **Step 3: Use it in the `orders` insert**

Find this block (around line 120-130):

```ts
    const { data: newOrder, error } = await supabase.from('orders').insert({
      member_id:      newMember.id,
      tier_member:    'SMC Trial',
      nama_member:    nama.trim(),
      email_member:   email.trim(),
      no_hp:          noHp.trim(),
      catatan:        `WA: ${noHp.trim()} | ${metodeInfo}`,
      plan_type:      plan.key,
      diskon_applied: plan.diskon || null,
      status:         'pending',
    }).select('id').single();
```

Change the `tier_member:` line to:

```ts
      tier_member:    tierFromPlan(plan.key),
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no new errors (exit code 0).

- [ ] **Step 5: Commit**

```bash
git add src/pages/BayarPage.tsx
git commit -m "feat: beri tier khusus (bukan SMC Trial) untuk pembeli indikator sesuai plan"
```

---

### Task 2: Fix `isTrial` and `normalizeTier()` collisions in `member/DashboardPage.tsx`

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx:477-483` (`normalizeTier`)
- Modify: `src/pages/member/DashboardPage.tsx:975` (`isTrial`)

**Interfaces:**
- Consumes: none (self-contained function edits).
- Produces: `normalizeTier(tier: string): string` now also returns `'indikator'` for indicator tiers — consumed at `src/pages/member/DashboardPage.tsx:2525` (`bisaOrder = (p.tier_access || []).includes(tierMember)`), which still works unchanged (an indicator-tier member simply won't match any class-tier `tier_access` array, so `bisaOrder` is `false` — correct, no further change needed there).

- [ ] **Step 1: Fix `normalizeTier()`**

Find (around line 477-483):

```ts
  function normalizeTier(tier: string): string {
    const t = (tier || '').toLowerCase();
    if (t.includes('platinum')) return 'platinum';
    if (t.includes('gold'))     return 'gold';
    if (t.includes('bronze'))   return 'bronze';
    return 'trial';
  }
```

Replace with:

```ts
  function normalizeTier(tier: string): string {
    const t = (tier || '').toLowerCase();
    if (t.includes('indikator')) return 'indikator';
    if (t.includes('platinum'))  return 'platinum';
    if (t.includes('gold'))      return 'gold';
    if (t.includes('bronze'))    return 'bronze';
    return 'trial';
  }
```

- [ ] **Step 2: Fix `isTrial`**

Find (around line 975):

```ts
  const isTrial   = member.tier?.toLowerCase().includes('trial');
```

Replace with:

```ts
  const isTrial   = member.tier === 'SMC Trial';
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no new errors (exit code 0).

- [ ] **Step 4: Manual verification via dev server**

Run: `npm run dev`

In the browser, log in as (or manually set `localStorage.mr_member` to) a member with `tier: 'Indikator Bulanan'` and open `/member`. Confirm:
- No "trial akan berakhir dalam X hari" banner appears anywhere on the dashboard.
- The `produk` tab still loads without errors (confirms `normalizeTier` change didn't break the existing `bisaOrder` check).

Then repeat with a member whose `tier` is the real `'SMC Trial'` and confirm the trial-expiry banner **still shows** for them (regression check — this member's own behavior must not change).

- [ ] **Step 5: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "fix: cegah tier indikator ikut ke-normalize/dianggap trial kelas"
```

---

### Task 3: Add indicator tiers to `AdminPage.tsx` (color + manual-add dropdown)

**Files:**
- Modify: `src/pages/AdminPage.tsx:786-792` (`tierColor`)
- Modify: `src/pages/AdminPage.tsx:2283` (Tambah Member dropdown)

- [ ] **Step 1: Add color branch**

Find (around line 786-792):

```ts
  const tierColor = (tier:string) => {
    if(tier?.includes('Platinum')) return '#a855f7';
    if(tier?.includes('Gold'))     return '#f59e0b';
    if(tier?.includes('Silver'))   return '#94a3b8';
    if(tier?.includes('Trial'))    return '#22ab94';
    return '#888';
  };
```

Replace with:

```ts
  const tierColor = (tier:string) => {
    if(tier?.includes('Indikator')) return '#3b82f6';
    if(tier?.includes('Platinum'))  return '#a855f7';
    if(tier?.includes('Gold'))      return '#f59e0b';
    if(tier?.includes('Silver'))    return '#94a3b8';
    if(tier?.includes('Trial'))     return '#22ab94';
    return '#888';
  };
```

- [ ] **Step 2: Add dropdown options**

Find (around line 2283):

```tsx
                      {['SMC Trial','SMC Bronze','SMC Silver','SMC Gold Mentorship','SMC Platinum 1-on-1'].map(t=><option key={t} value={t}>{t}</option>)}
```

Replace with:

```tsx
                      {['SMC Trial','SMC Bronze','SMC Silver','SMC Gold Mentorship','SMC Platinum 1-on-1','Indikator Bulanan','Indikator Tahunan','Indikator Lifetime'].map(t=><option key={t} value={t}>{t}</option>)}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no new errors (exit code 0).

- [ ] **Step 4: Manual verification via dev server**

With `npm run dev` still running, log into `/admin/panel` (admin session), go to the member management tab, and in "Tambah Member Baru" open the tier dropdown. Confirm all 8 options appear, including the 3 new `Indikator ...` ones. Do not actually submit the form (avoid creating test data) — closing/clearing the dropdown is enough to confirm rendering.

Separately, find or view a member whose tier is now one of the 3 new values (from the earlier-run data migration) in the member list, and confirm their tier badge renders in the new blue color (`#3b82f6`) instead of gray.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: tampilkan tier indikator di badge warna dan dropdown tambah member admin"
```

---

### Task 4: Final whole-branch review

- [ ] **Step 1: Review the full diff against the spec**

Run: `git diff main -- src/pages/BayarPage.tsx src/pages/member/DashboardPage.tsx src/pages/AdminPage.tsx`

Confirm every point in `docs/superpowers/specs/2026-07-07-indikator-tier-design.md` sections 1-3 is reflected in the diff (tier mapping in `BayarPage.tsx`, `isTrial`/`normalizeTier` fixes in `member/DashboardPage.tsx`, `tierColor`/dropdown in `AdminPage.tsx`).

- [ ] **Step 2: Full typecheck**

Run: `npm run typecheck`
Expected: exit code 0, no errors.

- [ ] **Step 3: End-to-end purchase smoke test via dev server**

With `npm run dev` running, go through `/bayar?plan=tahunan`, submit the form with test data, and verify in Supabase (or via the admin panel's Pesanan Masuk list) that the newly created member's `tier` is exactly `Indikator Tahunan` and the order's `tier_member` matches.
