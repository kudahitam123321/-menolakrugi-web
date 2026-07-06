# Tanggal Jatuh Tempo Order Produk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan tanggal jatuh tempo otomatis (dihitung dari `activated_at` + 1 bulan/tahun sesuai `plan_type`) untuk order produk indikator, ditampilkan di Admin Panel dan di dashboard member.

**Architecture:** Kolom baru `orders.activated_at` (timestamptz) diisi otomatis saat admin mengubah status order jadi `'aktif'`. Jatuh tempo dihitung murni di frontend lewat fungsi pure `hitungJatuhTempo` yang didefinisikan lokal (duplikat) di 2 file — tidak disimpan sebagai kolom terpisah.

**Tech Stack:** React + TypeScript, Supabase JS client, inline styles. Tidak ada dependency baru.

## Global Constraints

- Spec sumber: `docs/superpowers/specs/2026-07-06-order-jatuh-tempo-design.md` — baca dulu sebelum eksekusi.
- Tidak ada test suite di proyek ini. Verifikasi = `npm run typecheck` (delta) + migrasi SQL manual di Supabase + `npm run dev` manual + `npm run build`.
- **Aturan `hitungJatuhTempo` harus identik persis di kedua file** (didefinisikan 2x, bukan di-share/import lintas file — konsisten dengan konvensi codebase ini):
  ```ts
  function hitungJatuhTempo(activatedAt: string | null, planType: string | null): Date | null {
    if (!activatedAt || !planType || planType === 'lifetime') return null;
    const d = new Date(activatedAt);
    if (planType === 'bulanan') { d.setMonth(d.getMonth() + 1); return d; }
    if (planType === 'tahunan') { d.setFullYear(d.getFullYear() + 1); return d; }
    return null;
  }
  ```
- Tidak ada auto-perubahan `status` order saat jatuh tempo lewat — cuma tampilan, bukan logic bisnis baru.
- Tidak ada perubahan ke order membership tier (`/signup`→`/payment`) — di luar scope, jangan disentuh.
- `activated_at` cuma di-set saat `updateOrderStatus` dipanggil dengan `newStatus === 'aktif'` — kalau status di-set ke nilai lain, `activated_at` yang sudah ada TIDAK boleh ter-reset/terhapus.

### Baseline (catat sebelum Task 1, jangan diturunkan ulang)

```bash
npm run typecheck 2>&1 | grep -E "AdminPage.tsx|member/DashboardPage.tsx"
```

Harus persis cocok dengan ini (semua pre-existing, TIDAK diperbaiki oleh plan ini):

```
src/pages/AdminPage.tsx(2,1): error TS6192: All imports in import declaration are unused.
src/pages/AdminPage.tsx(6,7): error TS6133: 'TIERS' is declared but its value is never read.
src/pages/AdminPage.tsx(30,198): error TS6133: 'vLevel' is declared but its value is never read.
src/pages/AdminPage.tsx(30,230): error TS6133: 'csFile' is declared but its value is never read.
src/pages/AdminPage.tsx(785,28): error TS6133: 'label' is declared but its value is never read.
src/pages/AdminPage.tsx(1387,10): error TS6133: 'uploadProgress' is declared but its value is never read.
src/pages/AdminPage.tsx(1403,10): error TS6133: 'revealPass' is declared but its value is never read.
src/pages/AdminPage.tsx(1403,22): error TS6133: 'setRevealPass' is declared but its value is never read.
src/pages/AdminPage.tsx(1415,10): error TS6133: 'filterTier' is declared but its value is never read.
src/pages/AdminPage.tsx(1415,22): error TS6133: 'setFilterTier' is declared but its value is never read.
src/pages/AdminPage.tsx(1416,10): error TS6133: 'filterKelas' is declared but its value is never read.
src/pages/AdminPage.tsx(1416,23): error TS6133: 'setFilterKelas' is declared but its value is never read.
src/pages/AdminPage.tsx(1417,10): error TS6133: 'filterSearch' is declared but its value is never read.
src/pages/AdminPage.tsx(1417,24): error TS6133: 'setFilterSearch' is declared but its value is never read.
src/pages/AdminPage.tsx(1434,9): error TS6133: 'editCsUploadRef' is declared but its value is never read.
src/pages/AdminPage.tsx(1845,18): error TS6133: 'handleClaimAction' is declared but its value is never read.
src/pages/AdminPage.tsx(1886,18): error TS6133: 'toggleActive' is declared but its value is never read.
src/pages/AdminPage.tsx(1891,18): error TS6133: 'deleteMember' is declared but its value is never read.
src/pages/AdminPage.tsx(1897,12): error TS6133: 'startEditMember' is declared but its value is never read.
src/pages/AdminPage.tsx(1905,18): error TS6133: 'saveEditMember' is declared but its value is never read.
src/pages/AdminPage.tsx(1925,18): error TS6133: 'handleImport' is declared but its value is never read.
src/pages/AdminPage.tsx(1948,12): error TS6133: 'exportCSV' is declared but its value is never read.
src/pages/AdminPage.tsx(1993,18): error TS6133: 'moveVideo' is declared but its value is never read.
src/pages/AdminPage.tsx(2119,12): error TS6133: 'startEditVideo' is declared but its value is never read.
src/pages/AdminPage.tsx(2127,18): error TS6133: 'saveEditVideo' is declared but its value is never read.
src/pages/AdminPage.tsx(2155,12): error TS6133: 'startEditFile' is declared but its value is never read.
src/pages/AdminPage.tsx(2161,18): error TS6133: 'saveEditFile' is declared but its value is never read.
src/pages/AdminPage.tsx(2786,10): error TS2367: This comparison appears to be unintentional because the types '"member" | "broker" | "video" | "ulasan" | "rating" | "progress" | "settings" | "advance" | "jurnal" | "materi" | "admins" | "announce" | "claim" | "jadwal" | "proprules" | "referral" | "produk"' and '"materi_OLD_REMOVED"' have no overlap.
src/pages/AdminPage.tsx(2790,21): error TS6133: 'cats' is declared but its value is never read.
src/pages/AdminPage.tsx(2814,50): error TS2339: Property 'kategori' does not exist on type 'VideoItem'.
src/pages/AdminPage.tsx(2829,95): error TS2339: Property 'file_type' does not exist on type 'VideoItem'.
src/pages/AdminPage.tsx(2851,44): error TS2339: Property 'coming_soon_image_url' does not exist on type 'VideoItem'.
src/pages/AdminPage.tsx(2851,81): error TS2339: Property 'coming_soon_image_url' does not exist on type 'VideoItem'.
src/pages/AdminPage.tsx(2852,45): error TS2339: Property 'coming_soon_image_url' does not exist on type 'VideoItem'.
src/pages/member/DashboardPage.tsx(91,10): error TS6133: 'Spark' is declared but its value is never read.
src/pages/member/DashboardPage.tsx(98,10): error TS6133: 'GaugeChart' is declared but its value is never read.
src/pages/member/DashboardPage.tsx(119,10): error TS6133: 'Ring' is declared but its value is never read.
src/pages/member/DashboardPage.tsx(135,7): error TS6133: 'MarketOverviewWidget' is declared but its value is never read.
src/pages/member/DashboardPage.tsx(405,10): error TS6133: 'leaderboard' is declared but its value is never read.
src/pages/member/DashboardPage.tsx(868,23): error TS6133: 'up' is declared but its value is never read.
src/pages/member/DashboardPage.tsx(977,9): error TS6133: 'lastVideos' is declared but its value is never read.
src/pages/member/DashboardPage.tsx(1576,93): error TS6133: 'ni' is declared but its value is never read.
```

Kalau delta di task manapun tidak cocok (baik bertambah maupun berkurang selain yang eksplisit diharapkan), itu regresi — jangan lanjut sebelum diperbaiki.

---

### Task 1: Migrasi kolom + `AdminPage.tsx` (set `activated_at` + tampilkan jatuh tempo di Pesanan Masuk)

**Files:**
- Create: `supabase-orders-activated-at-migration.sql`
- Modify: `src/pages/AdminPage.tsx`

**Interfaces:**
- Consumes: tidak ada dari task lain.
- Produces: fungsi `hitungJatuhTempo(activatedAt: string | null, planType: string | null): Date | null` (didefinisikan module-level di `AdminPage.tsx`) — Task 2 mendefinisikan ulang fungsi identik di file lain, tidak meng-import dari sini. Kolom `orders.activated_at` yang mulai terisi lewat task ini dikonsumsi tampilannya oleh Task 2.

- [ ] **Step 1: Buat file migrasi**

```sql
-- Tambah kolom activated_at ke orders — dipakai untuk menghitung tanggal
-- jatuh tempo produk bulanan/tahunan (activated_at + 1 bulan/tahun).
-- Diisi otomatis oleh AdminPage.tsx saat admin ubah status order jadi 'aktif'.
-- Jalankan di Supabase Dashboard → SQL Editor.

alter table orders add column if not exists activated_at timestamptz;
```

- [ ] **Step 2: Jalankan migrasi di Supabase**

Buka Supabase Dashboard → SQL Editor project ini, tempel isi `supabase-orders-activated-at-migration.sql`, jalankan. Verifikasi: buka Table Editor → tabel `orders` → pastikan kolom `activated_at` (tipe `timestamptz`, nullable) sudah muncul.

- [ ] **Step 3: Tambah fungsi `hitungJatuhTempo` di `AdminPage.tsx`**

Cari (baris 11-14):
```tsx
function RankImg({ rank, size = 28 }: { rank: number; size?: number }) {
  const src = rank === 1 ? RANK_IMGS['1'] : rank === 2 ? RANK_IMGS['2'] : rank === 3 ? RANK_IMGS['3'] : rank <= 10 ? RANK_IMGS['4-10'] : rank <= 20 ? RANK_IMGS['11-20'] : RANK_IMGS['21+'];
  return <img src={src} alt={`rank-${rank}`} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />;
}
```
Tambahkan tepat setelahnya (sebelum `interface Admin`):
```tsx

function hitungJatuhTempo(activatedAt: string | null, planType: string | null): Date | null {
  if (!activatedAt || !planType || planType === 'lifetime') return null;
  const d = new Date(activatedAt);
  if (planType === 'bulanan') { d.setMonth(d.getMonth() + 1); return d; }
  if (planType === 'tahunan') { d.setFullYear(d.getFullYear() + 1); return d; }
  return null;
}
```

- [ ] **Step 4: Update `updateOrderStatus` supaya set `activated_at`**

Cari (baris 1727-1734):
```tsx
  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase.from('orders').update({
      status: newStatus,
      catatan: orderCatatanMap[orderId] ?? null,
    }).eq('id', orderId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Status pesanan diperbarui!'); loadData(); }
  }
```
Ganti jadi:
```tsx
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

- [ ] **Step 5: Tambah baris jatuh tempo di render "Pesanan Masuk"**

Cari (baris 3290-3292):
```tsx
                          <div style={{fontFamily:'monospace',fontSize:11,color:'#888',marginBottom:2}}>📦 {(o as any).products?.nama||'—'}{o.plan_type ? <span style={{marginLeft:6,color:'#16a34a',fontSize:9,border:'1px solid #16a34a33',padding:'1px 6px'}}>{o.plan_type.toUpperCase()}</span> : ''}{o.kode_diskon ? <span style={{marginLeft:6,color:'#eab308',fontSize:9,border:'1px solid #eab30833',padding:'1px 6px'}}>🎟️ {o.kode_diskon} -{o.diskon_applied}%</span> : ''}</div>
                          <div style={{fontFamily:'monospace',fontSize:10,color:'#444'}}>{new Date(o.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
                          {o.catatan&&<div style={{fontFamily:'monospace',fontSize:10,color:'#666',marginTop:4,fontStyle:'italic'}}>Catatan: {o.catatan}</div>}
```
Ganti jadi:
```tsx
                          <div style={{fontFamily:'monospace',fontSize:11,color:'#888',marginBottom:2}}>📦 {(o as any).products?.nama||'—'}{o.plan_type ? <span style={{marginLeft:6,color:'#16a34a',fontSize:9,border:'1px solid #16a34a33',padding:'1px 6px'}}>{o.plan_type.toUpperCase()}</span> : ''}{o.kode_diskon ? <span style={{marginLeft:6,color:'#eab308',fontSize:9,border:'1px solid #eab30833',padding:'1px 6px'}}>🎟️ {o.kode_diskon} -{o.diskon_applied}%</span> : ''}</div>
                          <div style={{fontFamily:'monospace',fontSize:10,color:'#444'}}>{new Date(o.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
                          {(() => {
                            if (o.plan_type === 'lifetime') return <div style={{fontFamily:'monospace',fontSize:10,color:'#444',marginTop:2}}>Jatuh tempo: Seumur Hidup</div>;
                            const jt = hitungJatuhTempo(o.activated_at, o.plan_type);
                            if (!jt) return <div style={{fontFamily:'monospace',fontSize:10,color:'#444',marginTop:2}}>Jatuh tempo: —</div>;
                            const lewat = jt < new Date();
                            return <div style={{fontFamily:'monospace',fontSize:10,color:lewat?'#ef4444':'#444',marginTop:2}}>Jatuh tempo: {jt.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>;
                          })()}
                          {o.catatan&&<div style={{fontFamily:'monospace',fontSize:10,color:'#666',marginTop:4,fontStyle:'italic'}}>Catatan: {o.catatan}</div>}
```

- [ ] **Step 6: Verifikasi typecheck**

```bash
npm run typecheck 2>&1 | grep "AdminPage.tsx"
```
Expected: persis sama dengan baseline (32 error yang sama, tidak ada tambahan/pengurangan).

- [ ] **Step 7: Verifikasi manual**

`npm run dev` → login sebagai admin → Admin Panel tab Produk → section Pesanan Masuk. Cari/buat 1 order dengan `plan_type = 'bulanan'` berstatus `pending` → ubah dropdown status ke "Aktif" → cek baris "Jatuh tempo: [hari ini + 1 bulan]" muncul berwarna abu-abu normal (bukan merah, karena belum lewat). Cek juga order dengan `plan_type = 'lifetime'` menampilkan "Jatuh tempo: Seumur Hidup", dan order yang belum pernah di-set Aktif menampilkan "Jatuh tempo: —".

- [ ] **Step 8: Commit**

```bash
git add supabase-orders-activated-at-migration.sql src/pages/AdminPage.tsx
git commit -m "feat: tambah kolom activated_at dan tampilkan jatuh tempo order di Pesanan Masuk"
```

---

### Task 2: `member/DashboardPage.tsx` — tampilkan jatuh tempo di "Pesanan Saya"

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx`

**Interfaces:**
- Consumes: kolom `orders.activated_at` (sudah ada dari Task 1's migrasi — task ini butuh Task 1 sudah dijalankan supaya ada data nyata untuk verifikasi, tapi secara kode tidak bergantung langsung).
- Produces: tidak ada yang dikonsumsi task lain.

- [ ] **Step 1: Tambah fungsi `hitungJatuhTempo` (definisi identik, lokal ke file ini)**

Cari (baris 46-50):
```tsx
function extractYtId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
```
Tambahkan tepat setelahnya:
```tsx
function hitungJatuhTempo(activatedAt: string | null, planType: string | null): Date | null {
  if (!activatedAt || !planType || planType === 'lifetime') return null;
  const d = new Date(activatedAt);
  if (planType === 'bulanan') { d.setMonth(d.getMonth() + 1); return d; }
  if (planType === 'tahunan') { d.setFullYear(d.getFullYear() + 1); return d; }
  return null;
}
```

- [ ] **Step 2: Tambah baris jatuh tempo di render "Pesanan Saya"**

Cari (baris 2617-2624):
```tsx
                            <div style={{ flex: 1, minWidth: 160 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: LP.text }}>{(o as any).products?.nama || '—'}</div>
                              {o.plan_type && <span style={{ display: 'inline-block', fontFamily: LP.mono, fontSize: 10, color: LP.primary, border: `1px solid ${LP.primary}44`, padding: '2px 8px', borderRadius: 4, marginBottom: 4 }}>{o.plan_type.toUpperCase()}</span>}
                              <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>
                                {new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              {o.kode_diskon && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, fontSize: 10, color: '#16a34a', marginTop: 2 }}><Ticket size={11}/> {o.kode_diskon} (-{o.diskon_applied}%)</div>}
                              {o.catatan && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 4 }}><MessageSquare size={11}/> {o.catatan}</div>}
                            </div>
```
Ganti jadi:
```tsx
                            <div style={{ flex: 1, minWidth: 160 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: LP.text }}>{(o as any).products?.nama || '—'}</div>
                              {o.plan_type && <span style={{ display: 'inline-block', fontFamily: LP.mono, fontSize: 10, color: LP.primary, border: `1px solid ${LP.primary}44`, padding: '2px 8px', borderRadius: 4, marginBottom: 4 }}>{o.plan_type.toUpperCase()}</span>}
                              <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>
                                {new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              {(() => {
                                if (o.plan_type === 'lifetime') return <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 2 }}>Jatuh tempo: Seumur Hidup</div>;
                                const jt = hitungJatuhTempo(o.activated_at, o.plan_type);
                                if (!jt) return <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 2 }}>Jatuh tempo: —</div>;
                                const lewat = jt < new Date();
                                return <div style={{ fontFamily: LP.mono, fontSize: 11, color: lewat ? LP.danger : LP.muted, marginTop: 2 }}>Jatuh tempo: {jt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>;
                              })()}
                              {o.kode_diskon && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, fontSize: 10, color: '#16a34a', marginTop: 2 }}><Ticket size={11}/> {o.kode_diskon} (-{o.diskon_applied}%)</div>}
                              {o.catatan && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 4 }}><MessageSquare size={11}/> {o.catatan}</div>}
                            </div>
```

- [ ] **Step 3: Verifikasi typecheck**

```bash
npm run typecheck 2>&1 | grep "member/DashboardPage.tsx"
```
Expected: persis sama dengan baseline (8 error yang sama).

- [ ] **Step 4: Verifikasi manual**

`npm run dev` → login sebagai member yang order-nya baru saja di-set "Aktif" di Task 1 → tab Produk → Pesanan Saya. Cek baris "Jatuh tempo: [tanggal yang sama seperti di admin]" muncul, warnanya `LP.muted` (belum lewat). Untuk memverifikasi warna "lewat" (`LP.danger`/merah): sementara ubah `d.setMonth(d.getMonth() + 1)` jadi `d.setMonth(d.getMonth() - 1)` di devtools/local edit, reload, cek warna berubah merah, lalu kembalikan ke kode semula sebelum commit — atau cukup percaya logic ternary-nya benar berdasarkan review kode (`jt < new Date()`), tidak wajib direkayasa manual kalau sudah yakin dari pembacaan kode.

- [ ] **Step 5: Build check**

```bash
npm run build
```
Expected: build sukses tanpa error.

- [ ] **Step 6: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: tampilkan jatuh tempo order di tab Pesanan Saya member"
```
