# Role Discord Otomatis untuk Pembeli Indikator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Members with an active indicator-product order (`orders.plan_type` = `bulanan`/`tahunan`/`lifetime`, `status = 'aktif'`, not past its jatuh-tempo date) automatically get the matching Discord role; the role is automatically revoked when that's no longer true — including silent expiry with no admin/member action.

**Architecture:** This plan spans **two separate git repositories**:
- **Bot repo** (`kudahitam123321/menolakrugi-bot`), working directory for this plan's Task 1: `C:/Users/ikhsa/AppData/Local/Temp/claude/d--bolt-menolak-rugi-final-project/1590968f-98cb-4092-a49e-58e3a8c0205a/scratchpad/menolakrugi-bot` — a local clone kept in sync with GitHub `main` (Railway auto-deploys from GitHub `main`, not from this local clone directly — pushing to GitHub is what ships it).
- **Website repo** (this project), working directory for Task 2: `d:/bolt/menolak-rugi/final-project`.

All new logic lives in the bot (`index.js`, plain Node.js/ESM, no TypeScript, no test framework). The website only gains one new fire-and-forget fetch call in an existing function.

**Tech Stack:** Node.js + Express + discord.js + `@supabase/supabase-js` (bot); React + TypeScript (website). Bot verification is `node --check index.js` (syntax only — no live Discord/Supabase credentials available to a sandboxed implementer) plus careful manual trace-through; actual live verification (real Discord role changes, real Supabase data) happens after deploy, done by the controller directly (Task 3), not a subagent.

## Global Constraints

- Role IDs (exact, verbatim): `bulanan` → `1523561374838689792`, `tahunan` → `1524314446133072084`, `lifetime` → `1519657058608218293`.
- Eligibility signal: `orders.plan_type IN ('bulanan','tahunan','lifetime')` identifies an indicator-product order (class-enrollment orders from `SignupPage.tsx` never set `plan_type`). Applies to any member with such an order, regardless of `members.tier`.
- "Aktif" = the member's most-recent (by `created_at`) indicator order has `status = 'aktif'` AND is not past jatuh tempo (computed from `activated_at` + 1 month for `bulanan`, + 1 year for `tahunan`; `lifetime` never expires).
- A member holds at most 1 of the 3 indicator roles at a time — switching plans removes the old one and adds the new one in the same operation.
- Do not touch the existing `ROLES`, `FUNDED_ROLES`, `setMemberRoles()`, `/discord/sync`, or `/discord/nickname` — this is an independent role system living alongside them.
- Full spec: `docs/superpowers/specs/2026-07-07-discord-role-indikator-design.md`.

---

### Task 1: Bot — indicator role sync logic, endpoint, OAuth-connect hook, and daily periodic check

**Files:**
- Modify: `index.js` (in the bot repo working directory given above)

**Interfaces:**
- Produces: `INDICATOR_ROLES: Record<'bulanan'|'tahunan'|'lifetime', string>`, `jatuhTempoLewat(activatedAt: string|null, planType: string): boolean`, `async function syncIndicatorRole(memberId: string): Promise<{success: boolean, error?: string, role_assigned?: string|null}>` — all module-level, used within this same task's new endpoint, the extended `/discord/callback`, and the new periodic check.
- Consumes (pre-existing in this file, do not redefine): `supabase` (client, line 62), `client` (discord.js Client), `GUILD_ID`, `BOT_TOKEN`, `CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI`, the existing `app` (Express instance).

- [ ] **Step 1: Add `INDICATOR_ROLES` map and `jatuhTempoLewat` helper**

In `index.js`, find the `FUNDED_ROLES` block (around line 33-41):

```js
// Funded Role IDs
const FUNDED_ROLES = {
  'P1':    '1450143559704510534',
  'P2':    '1450143702193405952',
  'Master':'1450143778407977144',
  'MPAID': '1432673955596210206',
  'Ap':    '1295584121778868314',
  'DA':    '',
};
```

Add immediately after it (before the `// Tier emoji prefix` comment that follows):

```js
// Indicator subscription role IDs — independent from ROLES/FUNDED_ROLES above
const INDICATOR_ROLES = {
  bulanan:  '1523561374838689792',
  tahunan:  '1524314446133072084',
  lifetime: '1519657058608218293',
};

function jatuhTempoLewat(activatedAt, planType) {
  if (planType === 'lifetime') return false;
  if (!activatedAt) return true;
  const d = new Date(activatedAt);
  if (planType === 'bulanan') d.setMonth(d.getMonth() + 1);
  else if (planType === 'tahunan') d.setFullYear(d.getFullYear() + 1);
  else return true;
  return d < new Date();
}
```

- [ ] **Step 2: Add `syncIndicatorRole` function**

Find the end of the existing `setMemberRoles` function (around line 358-363):

```js
    return { success: true };
  } catch (err) {
    console.error('Error set roles:', err.message);
    return { success: false, error: err.message };
  }
}
```

Add immediately after its closing `}` (before the blank line and next comment/function):

```js

async function syncIndicatorRole(memberId) {
  try {
    const { data: member } = await supabase.from('members').select('id, discord_id').eq('id', memberId).single();
    if (!member || !member.discord_id) return { success: false, error: 'Member not found or Discord not connected' };

    const { data: orders } = await supabase
      .from('orders')
      .select('plan_type, status, activated_at')
      .eq('member_id', memberId)
      .in('plan_type', ['bulanan', 'tahunan', 'lifetime'])
      .order('created_at', { ascending: false })
      .limit(1);

    const latest = orders && orders[0];
    const shouldHaveRole = !!latest && latest.status === 'aktif' && !jatuhTempoLewat(latest.activated_at, latest.plan_type);
    const targetRoleId = shouldHaveRole ? INDICATOR_ROLES[latest.plan_type] : null;

    const guild = await client.guilds.fetch(GUILD_ID);
    const guildMember = await guild.members.fetch(member.discord_id);

    const currentIndicatorRoles = guildMember.roles.cache
      .filter(r => Object.values(INDICATOR_ROLES).includes(r.id))
      .map(r => r.id);
    const toRemove = currentIndicatorRoles.filter(id => id !== targetRoleId);
    if (toRemove.length > 0) await guildMember.roles.remove(toRemove);
    if (targetRoleId && !currentIndicatorRoles.includes(targetRoleId)) await guildMember.roles.add(targetRoleId);

    return { success: true, role_assigned: targetRoleId };
  } catch (err) {
    console.error('Error sync indicator role:', err.message);
    return { success: false, error: err.message };
  }
}
```

- [ ] **Step 3: Extend `/discord/callback` to also sync the indicator role on first connect**

Find (around line 412-413, inside `app.get('/discord/callback', ...)`):

```js
    const result = await setMemberRoles(discordUser.id, member.tier, member.is_advance, member.funded_status);
    await setMemberNickname(discordUser.id, member.nama, member.tier, member.funded_status);
```

Replace with:

```js
    const result = await setMemberRoles(discordUser.id, member.tier, member.is_advance, member.funded_status);
    await setMemberNickname(discordUser.id, member.nama, member.tier, member.funded_status);
    await syncIndicatorRole(member_id);
```

- [ ] **Step 4: Add the `POST /discord/sync-indicator` endpoint**

Find the existing `/discord/sync` endpoint (around line 426-433):

```js
app.post('/discord/sync', async (req, res) => {
  const { member_id } = req.body;
  const { data: member } = await supabase.from('members').select('*').eq('id', member_id).single();
  if (!member || !member.discord_id) return res.status(404).json({ error: 'Member not found or Discord not connected' });
  const result = await setMemberRoles(member.discord_id, member.tier, member.is_advance, member.funded_status);
  await setMemberNickname(member.discord_id, member.nama, member.tier, member.funded_status);
  res.json(result);
});
```

Add immediately after it (before `app.post('/discord/nickname', ...)`):

```js

app.post('/discord/sync-indicator', async (req, res) => {
  const { member_id } = req.body;
  if (!member_id) return res.status(400).json({ error: 'member_id wajib' });
  const result = await syncIndicatorRole(member_id);
  res.json(result);
});
```

- [ ] **Step 5: Add the 24-hour periodic check**

Find the existing session-scheduler block's end (around line 597-600):

```js
setInterval(async () => {
  const time = getWITATime();
  if (SESSION_MESSAGES[time] && lastSent !== time) {
    lastSent = time;
    await sendSessionMessage(SESSION_MESSAGES[time].msg);
    console.log(`Session message sent: ${time}`);
  }
}, 60 * 1000);

console.log('Session scheduler aktif (WITA/UTC+8)');
// ─────────────────────────────────────────────────────────────────────
```

Add immediately after it (still before the `const PORT = ...` / `app.listen(...)` lines at the very end of the file):

```js

// ── Indicator Role Daily Sync ───────────────────────────────────────
setInterval(async () => {
  try {
    const { data: orderRows } = await supabase
      .from('orders')
      .select('member_id')
      .in('plan_type', ['bulanan', 'tahunan', 'lifetime']);
    const memberIds = [...new Set((orderRows || []).map(r => r.member_id).filter(Boolean))];
    if (memberIds.length === 0) return;

    const { data: memberRows } = await supabase
      .from('members')
      .select('id')
      .in('id', memberIds)
      .not('discord_id', 'is', null);

    for (const m of memberRows || []) {
      await syncIndicatorRole(m.id);
    }
    console.log(`Indicator role sync berkala selesai: ${(memberRows || []).length} member dicek`);
  } catch (err) {
    console.error('Indicator role sync berkala error:', err.message);
  }
}, 24 * 60 * 60 * 1000);

console.log('Indicator role sync berkala aktif (tiap 24 jam)');
// ─────────────────────────────────────────────────────────────────────
```

- [ ] **Step 6: Syntax check**

Run: `node --check index.js`
Expected: no output, exit code 0 (Node's `--check` only validates syntax, it does not execute the file — no live credentials needed).

- [ ] **Step 7: Manual trace-through (no live credentials available — read the code, don't guess)**

Re-read the full diff and confirm by hand:
1. `INDICATOR_ROLES` has exactly 3 keys (`bulanan`, `tahunan`, `lifetime`) mapping to the 3 exact role ID strings from Global Constraints — no typos, no swapped IDs.
2. `jatuhTempoLewat('2026-01-01T00:00:00Z', 'bulanan')` — trace by hand: Feb 1 2026 < "now" (whatever now is when you run this trace, almost certainly true) → returns `true` (expired). `jatuhTempoLewat(<today's date>, 'bulanan')` → one month from today, not yet passed → returns `false`. `jatuhTempoLewat(null, 'lifetime')` → `lifetime` branch returns `false` first, before the `!activatedAt` check — confirm the `if (planType === 'lifetime') return false;` line genuinely comes first in your edit.
3. `syncIndicatorRole` never throws unhandled — the whole body is inside try/catch, matching `setMemberRoles`'s existing convention.
4. The `/discord/callback` edit added exactly one new line (`await syncIndicatorRole(member_id);`) and did not alter the two lines above it.
5. The periodic-check block ends up **after** the session-scheduler block and **before** `const PORT = ...` — if it landed after `app.listen(...)`, that's still functionally fine in Node (the interval registers regardless of code order relative to `listen`), but move it before `app.listen` anyway to match this plan's placement and the file's existing top-to-bottom convention of "setup code, then listen at the very end."

Write down any discrepancy you find between this plan's exact code and what actually exists in the file before your edit (e.g., if line numbers were already off because the plan was written against a slightly earlier version) — note it in your report; it is not necessarily a blocker if the surrounding code matches by content even if line numbers drifted.

- [ ] **Step 8: Commit**

```bash
git add index.js
git commit -m "feat: sinkronisasi role Discord otomatis untuk pembeli indikator (bulanan/tahunan/lifetime)"
```

Do NOT push — the controller pushes after review (pushing triggers Railway auto-deploy from GitHub, which the controller will do deliberately after both tasks are reviewed).

---

### Task 2: Website — call the new bot endpoint when admin changes order status

**Files:**
- Modify: `src/pages/AdminPage.tsx` (in the website repo, `d:/bolt/menolak-rugi/final-project`)

**Interfaces:**
- Consumes: the bot's `POST /discord/sync-indicator` endpoint from Task 1, reached via the existing Cloudflare Pages Function proxy at `/api/mrbot/sync-indicator` (no proxy changes needed — `functions/api/mrbot/[[path]].js` already forwards any `/api/mrbot/*` path to `${BOT_URL}/discord/*`). Also consumes the existing `prodOrders` state (`useState<any[]>([])`, already populated via `supabase.from('orders').select('*, products(nama)')...`, so each row already carries `member_id` and `plan_type`).

- [ ] **Step 1: Extend `updateOrderStatus`**

Find (around line 1736-1745):

```ts
  async function updateOrderStatus(orderId: string, newStatus: string) {
    const payload: { status: string; catatan: string | null; activated_at?: string } = {
      status: newStatus,
      catatan: orderCatatanMap[orderId] ?? null,
    };
    if (newStatus === 'aktif') payload.activated_at = new Date().toISOString();
    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Status pesanan diperbarui!'); loadData(); }
  }
```

Replace with:

```ts
  async function updateOrderStatus(orderId: string, newStatus: string) {
    const payload: { status: string; catatan: string | null; activated_at?: string } = {
      status: newStatus,
      catatan: orderCatatanMap[orderId] ?? null,
    };
    if (newStatus === 'aktif') payload.activated_at = new Date().toISOString();
    const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
    if (error) notify('Error: ' + error.message, 'err');
    else {
      notify('Status pesanan diperbarui!');
      const order = prodOrders.find(o => o.id === orderId);
      if (order?.plan_type && order?.member_id) {
        try {
          await fetch('/api/mrbot/sync-indicator', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: order.member_id }),
          });
        } catch {}
      }
      loadData();
    }
  }
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no new errors relative to the pre-existing baseline (this repo has known pre-existing errors unrelated to `AdminPage.tsx`; confirm none of the new lines introduce any — `prodOrders` is `any[]`, so `order?.plan_type`/`order?.member_id` type-check fine regardless).

- [ ] **Step 3: Manual trace-through**

Confirm by reading: the new `try { await fetch(...) } catch {}` block matches the exact fire-and-forget style already used at line ~2034 (`approveRequest`'s call to `/api/mrbot/sync`) — same header, same body shape (`{ member_id }`), same silent-catch. Confirm `order?.plan_type` guards against calling the endpoint for non-indicator (class-enrollment) orders, consistent with the spec's eligibility signal.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: panggil sinkronisasi role Discord indikator saat admin ubah status pesanan"
```

---

### Task 3: Deploy and live verification (controller-performed — requires real Discord/Supabase credentials a subagent does not have)

This task is not dispatched to a subagent. The controller (or a human with access to the live bot, Discord server, and Supabase project) performs it directly after Tasks 1 and 2 are both reviewed clean.

- [ ] **Step 1: Push the bot repo and confirm Railway redeploys**

```bash
git push origin main
```
(from the bot repo working directory). Watch Railway's dashboard for a successful new deployment with no crash, matching the pattern already established earlier this session for this exact bot.

- [ ] **Step 2: Push the website repo**

```bash
git push origin main
```
(from `d:/bolt/menolak-rugi/final-project`). Cloudflare Pages auto-deploys.

- [ ] **Step 3: Live smoke test**

Using a real test member (or a member the user designates) with an `orders` row where `plan_type` is one of `bulanan`/`tahunan`/`lifetime`:
1. In the admin panel's Pesanan Masuk, change that order's status to Aktif. Confirm (via Discord) that the member's Discord account receives the matching role within a few seconds.
2. Change the status away from Aktif (e.g. back to Pending). Confirm the role is removed.
3. If feasible, set `activated_at` on a test `bulanan` order to a date more than a month in the past directly in Supabase, wait for (or manually trigger by restarting the bot process, which runs the interval once 24h later — or temporarily reduce the interval locally to confirm the logic path, then revert) the periodic check, and confirm the role gets removed even though `status` is still `'aktif'` in the database.

Report the outcome to the user; if anything doesn't behave as expected, treat it as a bug against this plan's Task 1 logic and fix there, re-running Steps 1-3 of this task after the fix ships.
