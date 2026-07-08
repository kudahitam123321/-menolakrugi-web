# Link Profil TradingView untuk Pembeli Indikator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Members can submit their TradingView profile link from two places in the member dashboard (indicator-tier home, and the `produk` tab's "Pesanan Saya"); admins see it read-only in the "Pesanan Masuk" list to register buyers into the invite-only Pine Script.

**Architecture:** One new nullable `members.tradingview_url` column. A small shared `TradingViewLinkBox` component in `member/DashboardPage.tsx` (two call sites, one shared piece of interactive state/logic — matches this file's existing convention of extracting a component only when there's real duplication to avoid, e.g. none of the other one-call-site blocks in this file were extracted). `AdminPage.tsx` reuses its already-loaded `members` state (`select('*')`) — no new query needed.

**Tech Stack:** React + TypeScript, Supabase. No test framework — verification is `npm run typecheck` + manual dev-server/browser check (per `CLAUDE.md`).

## Global Constraints

- Column: `members.tradingview_url` (text, nullable) — no format validation, plain text saved as-is.
- One link per member (not per order) — both member-facing locations read/write the same `members.tradingview_url` field.
- Admin display is read-only, in the existing "Pesanan Masuk" list only (not Member Management, not a separate view) — only for rows where `o.plan_type` is set (indicator orders).
- Full spec: `docs/superpowers/specs/2026-07-08-tradingview-link-design.md`.

---

### Task 1: Migration file + `member/DashboardPage.tsx` — shared component, state, and 2 call sites

**Files:**
- Create: `supabase-tradingview-url-migration.sql`
- Modify: `src/pages/member/DashboardPage.tsx`

**Interfaces:**
- Produces: `TradingViewLinkBox` (React function component, module-level in this file), consumed at both call sites in this same task. Also produces `member.tradingview_url?: string` on the file's local `Member` interface, consumed by Task 2 (`AdminPage.tsx` has its own separate local `Member` interface and does NOT import this one — Task 2 must add the field to its own interface independently).

- [ ] **Step 1: Create the migration file**

Write `supabase-tradingview-url-migration.sql` at the project root:

```sql
alter table members add column if not exists tradingview_url text;
```

- [ ] **Step 2: Add `tradingview_url` to the local `Member` interface**

Find (around line 304):

```ts
interface Member { id: string; nama: string; tier: string; is_advance: boolean; discord_username?: string; created_at?: string; funded_status?: string | null; discord_id?: string; }
```

Replace with:

```ts
interface Member { id: string; nama: string; tier: string; is_advance: boolean; discord_username?: string; created_at?: string; funded_status?: string | null; discord_id?: string; tradingview_url?: string; }
```

- [ ] **Step 3: Add the `TradingViewLinkBox` component and its save handler**

This step has two separate insertions in two different places in the file — do both.

**3a.** `saveTradingviewLink` needs `member`, `supabase`, `setMember` from the `DashboardPage` component's closure, so it must stay nested inside the component body (unlike `TradingViewLinkBox` below, which only takes props). Find the `handleConnectDiscordOAuth` function (around line 820-825):

```ts
  function handleConnectDiscordOAuth() {
    const CLIENT_ID = '1497825707173347409';
    const REDIRECT_URI = encodeURIComponent('https://menolakrugi.com/discord-callback');
    const SCOPE = encodeURIComponent('identify guilds.join');
    window.location.href = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}`;
  }
```

Add immediately after its closing `}` (still inside the `DashboardPage` component body):

```ts

  async function saveTradingviewLink() {
    if (!member || !tvLink.trim()) return;
    await supabase.from('members').update({ tradingview_url: tvLink.trim() }).eq('id', member.id);
    setMember({ ...member, tradingview_url: tvLink.trim() });
    setTvEditing(false);
  }
```

**3b.** `TradingViewLinkBox` is a plain presentational component that only takes props (no closure access needed), so it belongs at module scope, like `LockedClassFeature`. Place it near the top of the file, right after the `KURS_USD` constant (around line 46, immediately before `function extractYtId`):

```tsx
function TradingViewLinkBox({ member, tvLink, setTvLink, tvEditing, setTvEditing, onSave }: {
  member: { tradingview_url?: string };
  tvLink: string;
  setTvLink: (v: string) => void;
  tvEditing: boolean;
  setTvEditing: (v: boolean) => void;
  onSave: () => void;
}) {
  if (!tvEditing && member.tradingview_url) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
        <a href={member.tradingview_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: LP.mono, fontSize: 12, fontWeight: 700, color: '#16a34a', textDecoration: 'underline' }}>
          ✓ Terhubung: {member.tradingview_url}
        </a>
        <button onClick={() => { setTvLink(member.tradingview_url || ''); setTvEditing(true); }}
          style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, background: 'none', border: `1px solid ${LP.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
          Ubah
        </button>
      </div>
    );
  }
  if (tvEditing) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
        <input value={tvLink} onChange={e => setTvLink(e.target.value)} placeholder="https://www.tradingview.com/u/username/"
          style={{ flex: 1, minWidth: 220, fontFamily: LP.mono, fontSize: 12, padding: '10px 14px', border: `1px solid ${LP.border}`, borderRadius: 8, background: LP.bg, color: LP.text }} />
        <button onClick={onSave}
          style={{ fontFamily: LP.mono, fontSize: 12, fontWeight: 700, color: '#fff', background: LP.primary, border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>
          Simpan
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => setTvEditing(true)}
      style={{ fontFamily: LP.mono, fontSize: 12, fontWeight: 700, color: '#fff', background: '#1e40af', border: 'none', padding: '11px 24px', borderRadius: 8, cursor: 'pointer' }}>
      Hubungkan TradingView
    </button>
  );
}
```

- [ ] **Step 4: Add the `tvLink`/`tvEditing` state**

Find (around line 388-389):

```ts
  const [rekCopied, setRekCopied]       = useState('');
  const [selectedPm, setSelectedPm]     = useState('');
```

Replace with:

```ts
  const [rekCopied, setRekCopied]       = useState('');
  const [selectedPm, setSelectedPm]     = useState('');
  const [tvLink, setTvLink]             = useState('');
  const [tvEditing, setTvEditing]       = useState(false);
```

- [ ] **Step 5: Add the call site in the dashboard-home quick-action row**

Find (around line 1372-1385, inside the indicator-tier dashboard-home IIFE):

```tsx
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
```

Replace with:

```tsx
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
                    <TradingViewLinkBox member={member} tvLink={tvLink} setTvLink={setTvLink} tvEditing={tvEditing} setTvEditing={setTvEditing} onSave={saveTradingviewLink} />
                  </div>
```

- [ ] **Step 6: Add the box above "Pesanan Saya"**

Find (around line 2693-2696):

```tsx
              {/* ── Pesanan Saya ── */}
              {prodView === 'pesanan' && (
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  {!myOrders.length
```

Replace with:

```tsx
              {/* ── Pesanan Saya ── */}
              {prodView === 'pesanan' && (
                <>
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
                  <div style={{ fontFamily: LP.mono, color: LP.primary, fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>LINK PROFIL TRADINGVIEW</div>
                  <TradingViewLinkBox member={member} tvLink={tvLink} setTvLink={setTvLink} tvEditing={tvEditing} setTvEditing={setTvEditing} onSave={saveTradingviewLink} />
                </div>
                <div style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  {!myOrders.length
```

Then find the closing of this same block — the `{prodView === 'pesanan' && ( ... )}` block's own closing `)}` (search for the text immediately following the `myOrders.map(...)` block's end, which was already `)}` before this task; since Step 6 opened a `<>` fragment, the fragment must be closed with `</>` immediately before that pre-existing `)}`). Read the file around 30-40 lines after your Step 6 edit to find the exact original closing (it will look like a `</div>` for the `myOrders` list container, followed by `)}`) and insert `</>` between them:

Find (the pre-existing closing, unchanged content):

```tsx
                  }
                </div>
              )}
```

Replace with:

```tsx
                  }
                </div>
                </>
              )}
```

(This closing text — `}`, `</div>`, `)}` — may not be unique in the file by itself; use the Read tool to confirm you're editing the closing that immediately follows the `myOrders.map(o => { ... })` block from Step 6's edit, not some unrelated block elsewhere with similar-looking closing syntax.)

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: no new errors relative to the pre-existing baseline (this repo has known pre-existing errors unrelated to `member/DashboardPage.tsx`'s logic, plus existing unused-var warnings already in this file — confirm your changes don't add to that list).

- [ ] **Step 8: Manual verification via dev server**

Run: `npm run dev`. Log in as a member with `tier: 'Indikator Bulanan'`. On the Dashboard home tab, confirm a third button "Hubungkan TradingView" appears next to the Discord button; click it, type a link, click Simpan, confirm it switches to showing "✓ Terhubung: <link>" with an "Ubah" button. Reload the page and confirm the link persists (was actually saved to Supabase). Go to the `produk` tab → "Pesanan Saya" and confirm the same box appears above the order list, showing the same already-saved link (proving both locations read/write the same field). Log in as a real class-tier member, go to `produk` → "Pesanan Saya", and confirm the TradingView box also appears there (this is intentional — it's how class members who bought an indicator add-on submit their link, per the spec).

- [ ] **Step 9: Commit**

```bash
git add supabase-tradingview-url-migration.sql src/pages/member/DashboardPage.tsx
git commit -m "feat: member bisa hubungkan link profil TradingView dari dashboard home dan tab produk"
```

---

### Task 2: `AdminPage.tsx` — show the TradingView link in Pesanan Masuk

**Files:**
- Modify: `src/pages/AdminPage.tsx`

**Interfaces:**
- Consumes: the already-loaded `members` state (`const [members, setMembers] = useState<Member[]>([])`, populated via `select('*')` — no query change needed, the new column arrives automatically once Task 1's migration has been run against Supabase).

- [ ] **Step 1: Add `tradingview_url` to the local `Member` interface**

Find (around line 25):

```ts
interface Member { id: string; nama: string; tier: string; password: string; is_active: boolean; is_advance: boolean; last_seen?: string; discord_id?: string; discord_username?: string; }
```

Replace with:

```ts
interface Member { id: string; nama: string; tier: string; password: string; is_active: boolean; is_advance: boolean; last_seen?: string; discord_id?: string; discord_username?: string; tradingview_url?: string; }
```

- [ ] **Step 2: Show the link in each indicator order row**

Find (around line 3313-3314, inside the Pesanan Masuk row rendering):

```tsx
                          {o.email_member && <div style={{fontFamily:'monospace',fontSize:10,color:'#666',marginBottom:2}}>✉ {o.email_member}</div>}
                          {o.no_hp && <div style={{fontFamily:'monospace',fontSize:10,color:'#666',marginBottom:2}}>☎ {o.no_hp}</div>}
```

Replace with:

```tsx
                          {o.email_member && <div style={{fontFamily:'monospace',fontSize:10,color:'#666',marginBottom:2}}>✉ {o.email_member}</div>}
                          {o.no_hp && <div style={{fontFamily:'monospace',fontSize:10,color:'#666',marginBottom:2}}>☎ {o.no_hp}</div>}
                          {o.plan_type && (() => {
                            const m = members.find(mm => mm.id === o.member_id);
                            return m?.tradingview_url
                              ? <div style={{fontFamily:'monospace',fontSize:10,color:'#666',marginBottom:2}}>📈 <a href={m.tradingview_url} target="_blank" rel="noopener noreferrer" style={{color:'#3b82f6'}}>{m.tradingview_url}</a></div>
                              : <div style={{fontFamily:'monospace',fontSize:10,color:'#444',marginBottom:2}}>📈 TradingView: — belum diisi</div>;
                          })()}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no new errors relative to the pre-existing baseline.

- [ ] **Step 4: Manual verification via dev server**

With a member that has `tradingview_url` set (from Task 1's manual test) and at least one indicator order, log into `/admin/panel`, go to Produk → Pesanan Masuk, and confirm that member's order row shows the 📈 line with a clickable link. Find/create an indicator order for a member without a link set and confirm it shows "— belum diisi" instead. Confirm a class-enrollment order (no `plan_type`) shows neither line (the `{o.plan_type && (...)}` guard).

- [ ] **Step 5: Commit**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: tampilkan link TradingView member di Pesanan Masuk admin"
```

---

### Task 3: Final whole-branch review

- [ ] **Step 1: Review the full diff against the spec**

Run: `git diff main -- src/pages/member/DashboardPage.tsx src/pages/AdminPage.tsx supabase-tradingview-url-migration.sql`

Confirm every point in `docs/superpowers/specs/2026-07-08-tradingview-link-design.md` is reflected: migration file, both member-facing call sites reading/writing the same field, admin display guarded to indicator orders only, read-only in admin.

- [ ] **Step 2: Full typecheck**

Run: `npm run typecheck`
Expected: exit code 0 relative to the pre-existing baseline.

- [ ] **Step 3: Remind the user to run the migration**

Before this branch is pushed to `main` (which auto-deploys via Cloudflare Pages), confirm with the user that `supabase-tradingview-url-migration.sql` has been run against the live Supabase project — if the column doesn't exist yet, every save attempt will fail with a Supabase column-not-found error. This mirrors the exact same gotcha from the earlier `order jatuh tempo` feature's migration in this same project.
