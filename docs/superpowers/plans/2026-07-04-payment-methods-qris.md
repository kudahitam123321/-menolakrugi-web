# Metode Pembayaran QRIS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admin add a QRIS payment method (uploaded QR image) alongside existing bank-transfer methods, and have it render correctly on both checkout surfaces that read `payment_methods`.

**Architecture:** Add a `jenis` discriminator (`'bank' | 'qris'`) and nullable `qris_image_url` column to the existing `payment_methods` table. Admin CRUD (`AdminPage.tsx`) branches its form/validation/list rendering on `jenis`. The two consumer pages (`BayarPage.tsx`, `member/DashboardPage.tsx`) already query the whole `payment_methods` table — add a conditional render branch for `jenis === 'qris'` in each.

**Tech Stack:** React + TypeScript, Supabase (Postgres + Storage bucket `materi`), no test framework — validate via `npm run typecheck`, `npm run lint`, and manual dev-server verification.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-04-payment-methods-qris-design.md`
- RLS policies on `payment_methods` stay `using (true)` / `with check (true)` — this app has no Supabase Auth, `auth.uid()` is always null (see `CLAUDE.md` RLS gotcha). Do not add `auth.uid()`-based policies.
- QRIS image uploads go to the existing `materi` Storage bucket with filename prefix `qris_` (same pattern as `brokerlogo_*`, `produk_*`).
- Follow existing inline-style conventions in each file exactly (no Tailwind, no new abstractions, local `C`/`G` or hex-literal style constants already used in that file).
- There is no automated test suite in this repo. "Testable deliverable" for each task below means: `npm run typecheck` passes, and the described manual check in the running dev server (`npm run dev`) behaves as stated.

---

### Task 1: Database migration — `jenis` + `qris_image_url` columns

**Files:**
- Create: `supabase-payment-methods-qris-migration.sql`

**Interfaces:**
- Produces: `payment_methods.jenis` (`text`, not null, default `'bank'`, check `in ('bank','qris')`), `payment_methods.qris_image_url` (`text`, nullable). All later tasks read/write these two columns.

- [ ] **Step 1: Write the migration file**

```sql
-- Adds QRIS payment method support to payment_methods.
-- Run once in the Supabase SQL editor.

alter table payment_methods
  add column if not exists jenis text not null default 'bank' check (jenis in ('bank', 'qris')),
  add column if not exists qris_image_url text;
```

- [ ] **Step 2: Run it in the Supabase SQL editor**

This project has no CLI-driven migration runner (see `CLAUDE.md` — all `supabase-*.sql` files are run manually). Open the Supabase project's SQL editor, paste the contents of `supabase-payment-methods-qris-migration.sql`, and run it.

Expected: statement succeeds; `select column_name from information_schema.columns where table_name = 'payment_methods';` now lists `jenis` and `qris_image_url`.

- [ ] **Step 3: Commit**

```bash
git add supabase-payment-methods-qris-migration.sql
git commit -m "feat: add jenis and qris_image_url columns to payment_methods"
```

---

### Task 2: Admin — QRIS support in "tambah metode pembayaran" form

**Files:**
- Modify: `src/pages/AdminPage.tsx:1233-1247` (state block), `src/pages/AdminPage.tsx:1755-1766` (`addPaymentMethod`), `src/pages/AdminPage.tsx:3606-3638` (add-form JSX)

**Interfaces:**
- Consumes: `supabase` client (`src/lib/supabase.ts`), existing `notify(msg, type)` helper, existing `loadData()` refresh function — all already in scope in this file.
- Produces: `pmJenis` (`'bank'|'qris'`) state, `pmQrisFile` (`File|null`), `pmQrisPreview` (`string`), `uploadQrisImage(file: File): Promise<string|null>` function. Task 3's edit form reuses `uploadQrisImage` and follows the same `jenis` state shape (`editPmJenis`).

- [ ] **Step 1: Add new state variables**

In `src/pages/AdminPage.tsx`, right after the existing payment-method state block (the line `const [pmMsg, setPmMsg] = useState('');` at line 1240), add:

```ts
  const [pmJenis, setPmJenis]                 = useState<'bank'|'qris'>('bank');
  const [pmQrisFile, setPmQrisFile]           = useState<File|null>(null);
  const [pmQrisPreview, setPmQrisPreview]     = useState('');
```

- [ ] **Step 2: Add `uploadQrisImage` helper**

Directly above `async function addPaymentMethod() {` (line 1755), add:

```ts
  async function uploadQrisImage(file: File): Promise<string|null> {
    const ext = file.name.split('.').pop();
    const fileName = `qris_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('materi').upload(fileName, file, { upsert: true, cacheControl: '3600' });
    if (error) { notify('Gagal upload gambar QRIS: ' + error.message, 'err'); return null; }
    const { data } = supabase.storage.from('materi').getPublicUrl(fileName);
    return data.publicUrl;
  }

```

- [ ] **Step 3: Branch `addPaymentMethod` validation & insert on `jenis`**

Replace the existing `addPaymentMethod` function (`src/pages/AdminPage.tsx:1755-1766`):

```ts
  async function addPaymentMethod() {
    if (!pmNamaBank) { setPmMsg('Nama/label metode pembayaran wajib diisi.'); return; }
    if (pmJenis === 'bank' && (!pmNomorRek || !pmNamaRek)) { setPmMsg('Nomor rekening dan atas nama wajib diisi.'); return; }
    if (pmJenis === 'qris' && !pmQrisFile) { setPmMsg('Upload gambar QRIS wajib diisi.'); return; }
    let qrisImageUrl: string|null = null;
    if (pmJenis === 'qris') {
      qrisImageUrl = await uploadQrisImage(pmQrisFile!);
      if (!qrisImageUrl) return;
    }
    const { error } = await supabase.from('payment_methods').insert({
      nama_bank: pmNamaBank,
      nomor_rekening: pmJenis === 'bank' ? pmNomorRek : null,
      nama_rekening: pmJenis === 'bank' ? pmNamaRek : null,
      catatan: pmCatatan || null, urutan: parseInt(pmUrutan) || 0, aktif: pmAktif,
      jenis: pmJenis, qris_image_url: qrisImageUrl,
    });
    if (error) { setPmMsg('Error: ' + error.message); return; }
    setPmMsg('✅ Metode pembayaran ditambahkan!');
    setTimeout(() => setPmMsg(''), 3000);
    setPmNamaBank(''); setPmNomorRek(''); setPmNamaRek(''); setPmCatatan(''); setPmUrutan(''); setPmAktif(true);
    setPmJenis('bank'); setPmQrisFile(null); setPmQrisPreview('');
    loadData();
  }
```

- [ ] **Step 4: Add the jenis toggle + conditional fields to the add-form JSX**

In `src/pages/AdminPage.tsx`, the add-form currently renders a 2-column grid of 4 text fields (`NAMA BANK`, `NOMOR REKENING / ID`, `ATAS NAMA`, `URUTAN TAMPIL`) at lines 3609-3623. Replace that block:

```tsx
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  {(['bank','qris'] as const).map(j=>(
                    <button key={j} onClick={()=>setPmJenis(j)}
                      style={{fontFamily:'"Geist Mono",monospace',fontSize:11,fontWeight:700,padding:'6px 16px',border:`1px solid ${pmJenis===j?'#16a34a':'#1e1e1e'}`,background:pmJenis===j?'#0a1a0e':'transparent',color:pmJenis===j?'#16a34a':'#555',cursor:'pointer',borderRadius:6}}>
                      {j==='bank'?'TRANSFER BANK':'QRIS'}
                    </button>
                  ))}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  {([
                    {label:'NAMA BANK / LABEL',v:pmNamaBank,s:setPmNamaBank,ph: pmJenis==='qris' ? 'QRIS / QRIS Dana / QRIS Merchant ...' : 'BCA / Mandiri / BRI ...'},
                    ...(pmJenis==='bank' ? [
                      {label:'NOMOR REKENING / ID',v:pmNomorRek,s:setPmNomorRek,ph:'Nomor rekening'},
                      {label:'ATAS NAMA',v:pmNamaRek,s:setPmNamaRek,ph:'Nama pemilik rekening'},
                    ] : []),
                    {label:'URUTAN TAMPIL',v:pmUrutan,s:setPmUrutan,ph:'0',type:'number'},
                  ] as {label:string;v:string;s:(x:string)=>void;ph:string;type?:string}[]).map(f=>(
                    <div key={f.label}>
                      <div style={{fontFamily:'"Geist Mono",monospace',fontSize:9,color:'#555',marginBottom:5}}>{f.label}</div>
                      <input type={f.type||'text'} value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}
                        style={{width:'100%',background:'#0a0a0a',border:'1px solid #1e1e1e',color:'#e7e5e4',padding:'9px 12px',fontFamily:'"Geist Mono",monospace',fontSize:12,outline:'none',boxSizing:'border-box' as const}}
                        onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#1e1e1e'}/>
                    </div>
                  ))}
                </div>
                {pmJenis==='qris' && (
                  <div style={{marginBottom:10}}>
                    <div style={{fontFamily:'"Geist Mono",monospace',fontSize:9,color:'#555',marginBottom:5}}>GAMBAR QRIS</div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      {pmQrisPreview && <img src={pmQrisPreview} alt="preview" style={{width:60,height:60,objectFit:'contain',borderRadius:8,border:'1px solid #2a2a2a',background:'#fff'}}/>}
                      <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:'#0a0a0a',border:'1px solid #1e1e1e',padding:'8px 14px',fontFamily:'"Geist Mono",monospace',fontSize:11,color:'#aaa'}}>
                        {pmQrisFile ? pmQrisFile.name : '📁 Pilih gambar QR (PNG/JPG)'}
                        <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;setPmQrisFile(f);setPmQrisPreview(URL.createObjectURL(f));}}/>
                      </label>
                      {pmQrisPreview && <button onClick={()=>{setPmQrisFile(null);setPmQrisPreview('');}} style={{background:'transparent',border:'none',color:'#ef4444',cursor:'pointer',fontSize:12}}>✕ hapus</button>}
                    </div>
                  </div>
                )}
```

- [ ] **Step 5: Verify with typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, log in as admin, go to Pengaturan tab → Metode Pembayaran.
- Click "QRIS" toggle → confirm Nomor Rekening / Atas Nama fields disappear and a file-upload row appears.
- Try submitting with no image → expect message "Upload gambar QRIS wajib diisi."
- Pick an image file, submit → expect success message, and a new row appears in "DAFTAR METODE PEMBAYARAN" (list rendering of QRIS specifics is Task 3, so it may look like a bank row minus the number for now — that's expected at this point).
- Click "TRANSFER BANK" toggle → confirm the original 4-field bank form still works exactly as before (regression check).

- [ ] **Step 7: Commit**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: let admin add QRIS payment method with image upload"
```

---

### Task 3: Admin — QRIS support in list view + edit form

**Files:**
- Modify: `src/pages/AdminPage.tsx:1241-1247` (edit state block), `src/pages/AdminPage.tsx:1779-1794` (`startEditPm`, `saveEditPm`), `src/pages/AdminPage.tsx:3646-3701` (list + edit-form JSX)

**Interfaces:**
- Consumes: `uploadQrisImage` from Task 2, `pmJenis`-shaped toggle pattern from Task 2.
- Produces: `editPmJenis` (`'bank'|'qris'`), `editPmQrisFile` (`File|null`), `editPmQrisPreview` (`string`), `editPmQrisUrl` (`string`) state — no later task consumes these directly, but they must match the naming convention (`editP*` mirrors `pm*`/`editPm*`) already used for `editPGambarFile`/`editPGambarPreview`/`editPGambarUrl` in the products section.

- [ ] **Step 1: Add edit-form state variables**

Right after `const [editPmAktif, setEditPmAktif] = useState(true);` (line 1246... now shifted by Task 2's additions, but still the last line of the edit-state block), add:

```ts
  const [editPmJenis, setEditPmJenis]         = useState<'bank'|'qris'>('bank');
  const [editPmQrisFile, setEditPmQrisFile]   = useState<File|null>(null);
  const [editPmQrisPreview, setEditPmQrisPreview] = useState('');
  const [editPmQrisUrl, setEditPmQrisUrl]     = useState('');
```

- [ ] **Step 2: Update `startEditPm` to populate the new fields**

Replace the existing function:

```ts
  function startEditPm(pm: any) {
    setEditPmId(pm.id); setEditPmNamaBank(pm.nama_bank); setEditPmNomorRek(pm.nomor_rekening||'');
    setEditPmNamaRek(pm.nama_rekening||''); setEditPmCatatan(pm.catatan||'');
    setEditPmUrutan(String(pm.urutan||0)); setEditPmAktif(pm.aktif !== false);
    setEditPmJenis(pm.jenis === 'qris' ? 'qris' : 'bank');
    setEditPmQrisUrl(pm.qris_image_url||''); setEditPmQrisPreview(pm.qris_image_url||''); setEditPmQrisFile(null);
  }
```

- [ ] **Step 3: Branch `saveEditPm` validation & update on `jenis`**

Replace the existing function:

```ts
  async function saveEditPm() {
    if (!editPmId || !editPmNamaBank) { setPmMsg('Nama/label metode pembayaran wajib diisi.'); return; }
    if (editPmJenis === 'bank' && (!editPmNomorRek || !editPmNamaRek)) { setPmMsg('Nomor rekening dan atas nama wajib diisi.'); return; }
    let qrisImageUrl = editPmQrisUrl;
    if (editPmJenis === 'qris') {
      if (editPmQrisFile) {
        const uploaded = await uploadQrisImage(editPmQrisFile);
        if (!uploaded) return;
        qrisImageUrl = uploaded;
      }
      if (!qrisImageUrl) { setPmMsg('Upload gambar QRIS wajib diisi.'); return; }
    }
    const { error } = await supabase.from('payment_methods').update({
      nama_bank: editPmNamaBank,
      nomor_rekening: editPmJenis === 'bank' ? editPmNomorRek : null,
      nama_rekening: editPmJenis === 'bank' ? editPmNamaRek : null,
      catatan: editPmCatatan || null, urutan: parseInt(editPmUrutan) || 0, aktif: editPmAktif,
      jenis: editPmJenis, qris_image_url: editPmJenis === 'qris' ? qrisImageUrl : null,
    }).eq('id', editPmId);
    if (error) { setPmMsg('Error: ' + error.message); return; }
    setPmMsg('✅ Berhasil diupdate!'); setTimeout(() => setPmMsg(''), 3000);
    setEditPmId(null); loadData();
  }
```

- [ ] **Step 4: Show a QRIS thumbnail + badge in the list row**

In the list-row JSX (`src/pages/AdminPage.tsx`, inside `{paymentMethods.map(pm=>( ... ))}`), the row currently always renders `pm.nomor_rekening` and `a.n. {pm.nama_rekening}` (lines 3650-3656). Replace that inner block:

```tsx
                        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap' as const}}>
                          <span style={{fontWeight:700,fontSize:14,color:'#e7e5e4'}}>{pm.nama_bank}</span>
                          {pm.jenis === 'qris' ? (
                            <span style={{fontFamily:'"Geist Mono",monospace',fontSize:9,color:'#16a34a',border:'1px solid #16a34a55',padding:'1px 6px',borderRadius:4}}>QRIS</span>
                          ) : (
                            <span style={{fontFamily:'"Geist Mono",monospace',fontSize:13,letterSpacing:1,color:'#e7e5e4'}}>{pm.nomor_rekening}</span>
                          )}
                          {!pm.aktif && <span style={{fontFamily:'"Geist Mono",monospace',fontSize:9,color:'#555',border:'1px solid #2a2a2a',padding:'1px 6px'}}>NON-AKTIF</span>}
                        </div>
                        {pm.jenis === 'qris' ? (
                          pm.qris_image_url && <img src={pm.qris_image_url} alt="QRIS" style={{width:48,height:48,objectFit:'contain',borderRadius:6,border:'1px solid #2a2a2a',background:'#fff',marginBottom:2}}/>
                        ) : (
                          <div style={{fontFamily:'"Geist Mono",monospace',fontSize:11,color:'#777',marginBottom:2}}>a.n. {pm.nama_rekening}</div>
                        )}
```

- [ ] **Step 5: Add jenis toggle + conditional fields to the edit-form JSX**

The edit form currently renders a 2-column grid of 4 text fields (`NAMA BANK`, `NOMOR REKENING`, `ATAS NAMA`, `URUTAN`) at lines 3671-3685. Replace that block:

```tsx
                        <div style={{display:'flex',gap:8,marginBottom:8}}>
                          {(['bank','qris'] as const).map(j=>(
                            <button key={j} onClick={()=>setEditPmJenis(j)}
                              style={{fontFamily:'"Geist Mono",monospace',fontSize:10,fontWeight:700,padding:'4px 12px',border:`1px solid ${editPmJenis===j?'#16a34a':'#2a2a2a'}`,background:editPmJenis===j?'#0a1a0e':'transparent',color:editPmJenis===j?'#16a34a':'#555',cursor:'pointer',borderRadius:4}}>
                              {j==='bank'?'TRANSFER BANK':'QRIS'}
                            </button>
                          ))}
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                          {([
                            {label:'NAMA BANK / LABEL',v:editPmNamaBank,s:setEditPmNamaBank,ph:'Nama bank / label'},
                            ...(editPmJenis==='bank' ? [
                              {label:'NOMOR REKENING',v:editPmNomorRek,s:setEditPmNomorRek,ph:'Nomor rekening'},
                              {label:'ATAS NAMA',v:editPmNamaRek,s:setEditPmNamaRek,ph:'Nama pemilik'},
                            ] : []),
                            {label:'URUTAN',v:editPmUrutan,s:setEditPmUrutan,ph:'0',type:'number'},
                          ] as {label:string;v:string;s:(x:string)=>void;ph:string;type?:string}[]).map(f=>(
                            <div key={f.label}>
                              <div style={{fontFamily:'"Geist Mono",monospace',fontSize:9,color:'#444',marginBottom:4}}>{f.label}</div>
                              <input type={f.type||'text'} value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}
                                style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 10px',fontFamily:'"Geist Mono",monospace',fontSize:11,outline:'none',boxSizing:'border-box' as const}}
                                onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                            </div>
                          ))}
                        </div>
                        {editPmJenis==='qris' && (
                          <div style={{marginBottom:8}}>
                            <div style={{fontFamily:'"Geist Mono",monospace',fontSize:9,color:'#444',marginBottom:4}}>GAMBAR QRIS</div>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              {editPmQrisPreview && <img src={editPmQrisPreview} alt="preview" style={{width:44,height:44,objectFit:'contain',borderRadius:6,border:'1px solid #2a2a2a',background:'#fff'}}/>}
                              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:'#111',border:'1px solid #2a2a2a',padding:'7px 12px',fontFamily:'"Geist Mono",monospace',fontSize:11,color:'#aaa'}}>
                                {editPmQrisFile?editPmQrisFile.name:'📁 Ganti gambar QR'}
                                <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;setEditPmQrisFile(f);setEditPmQrisPreview(URL.createObjectURL(f));}}/>
                              </label>
                            </div>
                          </div>
                        )}
```

- [ ] **Step 6: Verify with typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, go to admin Pengaturan tab.
- Confirm the QRIS row created in Task 2 now shows the "QRIS" badge and the QR thumbnail in the list (no account number shown).
- Click EDIT on that row → confirm the edit form opens with the QRIS toggle selected, existing image shown as preview, and Nomor Rekening/Atas Nama fields hidden.
- Change the label text only (leave image untouched) and save → confirm it updates without requiring a re-upload.
- Click EDIT on an existing bank-transfer row → confirm it still opens with "TRANSFER BANK" selected and all fields populated as before (regression check).

- [ ] **Step 8: Commit**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: show and edit QRIS payment methods in admin list"
```

---

### Task 4: BayarPage — render QRIS payment option

**Files:**
- Modify: `src/pages/BayarPage.tsx:82-111` (`handleSubmit` catatan/WA message), `src/pages/BayarPage.tsx:174-227` (selection list + selected-method panel)

**Interfaces:**
- Consumes: `payment_methods` rows now shaped `{ ..., jenis: 'bank'|'qris', qris_image_url: string|null }` (from Task 1/2/3).

- [ ] **Step 1: Fix the order `catatan` and WhatsApp message construction**

Replace lines 82-111 of `src/pages/BayarPage.tsx`:

```tsx
    const pm = paymentMethods.find(p => p.id === metodePm);
    const metodeInfo = pm?.jenis === 'qris'
      ? `QRIS (${pm.nama_bank})`
      : `Bank: ${pm?.nama_bank || metodePm} | Rek: ${pm?.nomor_rekening || ''}`;

    // Simpan ke DB dulu supaya masuk di dashboard admin
    const { error } = await supabase.from('orders').insert({
      member_id:      'guest',
      tier_member:    'visitor',
      nama_member:    nama.trim(),
      email_member:   email.trim(),
      catatan:        `WA: ${noHp.trim()} | ${metodeInfo}`,
      plan_type:      plan.key,
      diskon_applied: plan.diskon || null,
      status:         'pending',
    });
    if (error) { setErrMsg('Gagal menyimpan pesanan: ' + error.message); return; }

    // Lalu buka WA admin
    const metodeLine = pm
      ? (pm.jenis === 'qris'
          ? `*Metode:* QRIS (${pm.nama_bank}) — scan QR yang dikirim admin`
          : `*Transfer ke:* ${pm.nama_bank} — ${pm.nomor_rekening} a.n. ${pm.nama_rekening}`)
      : '';
    const msg = [
      `Halo Admin, saya ingin membeli Indikator SMC.`,
      ``,
      `*Nama:* ${nama.trim()}`,
      `*Email:* ${email.trim()}`,
      `*No. WA:* ${noHp.trim()}`,
      `*Plan:* ${plan.nama} — Rp ${fmt(hargaDiskon)}`,
      metodeLine,
      ``,
      `Mohon konfirmasi pesanan saya. Terima kasih!`,
    ].filter(Boolean).join('\n');

    const waUrl = `https://wa.me/62${WA_NUMBER.replace(/^0/, '')}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }
```

- [ ] **Step 2: Render the QRIS image in the selectable option card**

In the `paymentMethods.map(pm => { ... })` block (`src/pages/BayarPage.tsx:174-210`), the "Info" div currently always renders `pm.nomor_rekening` and `a.n. {pm.nama_rekening}` (lines 197-203). Replace that inner div:

```tsx
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{pm.nama_bank}</div>
                    {pm.jenis === 'qris' ? (
                      <>
                        <img src={pm.qris_image_url} alt={`QRIS ${pm.nama_bank}`}
                          style={{ width: '100%', maxWidth: 280, height: 280, objectFit: 'contain', background: '#fff', borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 6 }} />
                        {pm.catatan && <div style={{ fontSize: 11, color: C.dimmer, marginTop: 4 }}>{pm.catatan}</div>}
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 18, fontWeight: 700, letterSpacing: 1.5, color: selected ? G.gold : C.text, marginBottom: 4 }}>
                          {pm.nomor_rekening}
                        </div>
                        <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 11, color: C.dim }}>a.n. {pm.nama_rekening}</div>
                        {pm.catatan && <div style={{ fontSize: 11, color: C.dimmer, marginTop: 4 }}>{pm.catatan}</div>}
                      </>
                    )}
                  </div>
```

- [ ] **Step 3: Render the selected-method detail panel for QRIS**

Replace the "Nomor rekening terpilih" block (`src/pages/BayarPage.tsx:214-227`):

```tsx
          {selectedPm && (
            <div style={{ marginTop: 14, background: G.gold + '0d', border: `1px solid ${G.gold}33`, borderRadius: 8, padding: '14px 18px' }}>
              {selectedPm.jenis === 'qris' ? (
                <>
                  <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>SCAN QRIS BERIKUT</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{selectedPm.nama_bank}</div>
                  <img src={selectedPm.qris_image_url} alt={`QRIS ${selectedPm.nama_bank}`}
                    style={{ width: '100%', maxWidth: 280, height: 280, objectFit: 'contain', background: '#fff', borderRadius: 8, border: `1px solid ${C.border}` }} />
                </>
              ) : (
                <>
                  <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>TRANSFER KE</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{selectedPm.nama_bank}</div>
                  <div
                    onClick={() => navigator.clipboard?.writeText(selectedPm.nomor_rekening)}
                    title="Klik untuk salin"
                    style={{ fontFamily: '"Geist Mono",monospace', fontSize: 22, fontWeight: 700, letterSpacing: 2, color: G.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {selectedPm.nomor_rekening}
                    <span style={{ fontSize: 12, color: C.dim }}>⎘</span>
                  </div>
                  <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 11, color: C.dim, marginTop: 4 }}>a.n. {selectedPm.nama_rekening}</div>
                </>
              )}
            </div>
          )}
```

- [ ] **Step 4: Verify with typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, visit `/bayar?plan=bulanan` (requires `landing_preview_config` to be configured; if the summary shows "Plan tidak ditemukan" that's pre-existing and unrelated to this change — payment methods still render below it).
- Confirm the QRIS entry created earlier shows its full-size QR image directly in the option card, no account number/copy button.
- Select it → confirm the "SCAN QRIS BERIKUT" panel appears below showing the same image.
- Select a bank-transfer entry → confirm the original "TRANSFER KE" panel with copyable number still works (regression check).
- Submit the form with the QRIS method selected → confirm no error, and check in Admin → produk → orders that the new order's `catatan` reads `... | QRIS (<label>)` (not `Bank: ... | Rek: `).

- [ ] **Step 6: Commit**

```bash
git add src/pages/BayarPage.tsx
git commit -m "feat: render QRIS payment option on visitor payment page"
```

---

### Task 5: Member DashboardPage — render QRIS in produk checkout modal

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx:2653-2672`

**Interfaces:**
- Consumes: same `payment_methods` shape as Task 4.

- [ ] **Step 1: Render QRIS cards in the checkout modal's payment-method list**

Replace the `paymentMethods.map(pm => ( ... ))` block at `src/pages/member/DashboardPage.tsx:2653-2672`:

```tsx
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
```

- [ ] **Step 2: Verify with typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, log in as a member, go to `produk` tab, start an order on any indicator product to reach step 2 ("Detail Pembayaran").
- Confirm the QRIS entry renders its full-size QR image with no "Salin" button and no "a.n." line.
- Confirm existing bank-transfer entries still show the number + working "Salin" copy button (regression check).
- Confirm `catatan` (if set on the QRIS entry) still renders below the image.

- [ ] **Step 4: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: render QRIS payment option in member product checkout"
```

---

## Self-Review Notes

- **Spec coverage:** Section 1 (DB) → Task 1. Section 2 (Admin UI, form/validation/list/edit) → Tasks 2–3. Section 3 (`BayarPage.tsx`, `DashboardPage.tsx` rendering + catatan/WA fix) → Tasks 4–5. Out-of-scope items (auto QR generation, auto payment verification, removing bank flow) are untouched by all tasks.
- **Type consistency:** `jenis: 'bank'|'qris'` and `qris_image_url: string|null` are the only new fields threaded through Tasks 2–5; naming (`pmJenis`/`editPmJenis`, `pmQrisFile`/`editPmQrisFile`, etc.) mirrors the existing `pGambar*`/`editPGambar*` convention already in the file.
- **No placeholders:** every step above contains full, pasteable code; no "TBD" or "add validation here" left unresolved.
