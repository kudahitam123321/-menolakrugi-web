# Produk Gratis (Link) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin can mark a product as free (`is_gratis`) with a plain link instead of Bulanan/Tahunan/Lifetime pricing. Members see a "GRATIS" badge and a "Klaim Gratis" button in the katalog (no plan selection, no tier gating); after claiming, the button becomes "Buka Link →" immediately in the same card, and the claim is recorded as an instantly-active order (`status: 'aktif'`, `plan_type: 'gratis'`) visible in "Pesanan Saya" and admin's "Pesanan Masuk".

**Architecture:** Two new nullable columns on `products` (`is_gratis`, `link_gratis`). No new tables — free-product claims reuse the existing `orders` table with a new `plan_type` value (`'gratis'`) that 3 existing "jatuh tempo" display sites need a small branch added for (mirroring their existing `'lifetime'` branch). `AdminPage.tsx`'s add/edit product forms get a toggle that swaps the pricing block for a single link field. `member/DashboardPage.tsx`'s katalog card gets a ternary branch for `p.is_gratis` that replaces the plan-selector/price/order-button section only — the shared image header, product name, description, and "Download Panduan" button sections are untouched.

**Tech Stack:** React + TypeScript, Supabase. No test framework — verification is `npm run typecheck` + manual dev-server/browser check (per `CLAUDE.md`).

## Global Constraints

- New columns: `products.is_gratis boolean default false`, `products.link_gratis text` (nullable).
- Free-product orders: `plan_type: 'gratis'`, `status: 'aktif'` (set immediately on claim, no pending/dibayar step), `activated_at` set to claim time.
- Free products have no tier gating (no `bisaOrder` check) and no plan selection — a single claim action, available to any logged-in member regardless of `members.tier`.
- One claim per member per product — the "Klaim Gratis" vs "Buka Link →" button state is derived from whether `myOrders` already contains a row with matching `product_id`, not from a separate flag.
- The 3 existing `if (order.plan_type === 'lifetime') return <...Seumur Hidup...>` branches (dashboard home card, Pesanan Saya list, admin Pesanan Masuk row) each get `|| order.plan_type === 'gratis'` added, with the displayed text changed for the gratis case (see Task 3 for exact wording).
- Full spec: `docs/superpowers/specs/2026-07-09-produk-gratis-design.md`.

---

### Task 1: Migration file

**Files:**
- Create: `supabase-produk-gratis-migration.sql`

- [ ] **Step 1: Write the migration**

```sql
alter table products add column if not exists is_gratis boolean default false;
alter table products add column if not exists link_gratis text;
```

- [ ] **Step 2: Commit**

```bash
git add supabase-produk-gratis-migration.sql
git commit -m "feat: migrasi kolom is_gratis dan link_gratis untuk produk gratis"
```

---

### Task 2: `AdminPage.tsx` — add/edit product forms, list badge, Pesanan Masuk display

**Files:**
- Modify: `src/pages/AdminPage.tsx`

**Interfaces:**
- Consumes: Task 1's migration must be run against Supabase before this is functionally usable (not required for the code itself to compile/typecheck, since `products`/`orders` queries in this file are untyped `any`).
- Produces: `pIsGratis`/`setPIsGratis`, `pLinkGratis`/`setPLinkGratis`, `editPIsGratis`/`setEditPIsGratis`, `editPLinkGratis`/`setEditPLinkGratis` state — local to this file only, not consumed elsewhere.

- [ ] **Step 1: Add state for the "Tambah Produk" form**

Find (around line 1319-1321):

```ts
  const [pNama, setPNama]                     = useState('');
  const [pDesc, setPDesc]                     = useState('');
  const [pHargaBulanan, setPHargaBulanan]     = useState('');
```

Replace with:

```ts
  const [pNama, setPNama]                     = useState('');
  const [pDesc, setPDesc]                     = useState('');
  const [pIsGratis, setPIsGratis]             = useState(false);
  const [pLinkGratis, setPLinkGratis]         = useState('');
  const [pHargaBulanan, setPHargaBulanan]     = useState('');
```

- [ ] **Step 2: Add state for the "Edit Produk" form**

Find (around line 1338-1340):

```ts
  const [editProdukId, setEditProdukId]       = useState<string|null>(null);
  const [editPNama, setEditPNama]             = useState('');
  const [editPDesc, setEditPDesc]             = useState('');
  const [editPHargaBulanan, setEditPHargaBulanan]     = useState('');
```

Replace with:

```ts
  const [editProdukId, setEditProdukId]       = useState<string|null>(null);
  const [editPNama, setEditPNama]             = useState('');
  const [editPDesc, setEditPDesc]             = useState('');
  const [editPIsGratis, setEditPIsGratis]     = useState(false);
  const [editPLinkGratis, setEditPLinkGratis] = useState('');
  const [editPHargaBulanan, setEditPHargaBulanan]     = useState('');
```

- [ ] **Step 3: Update `addProduk()` validation and insert payload**

Find (around line 1627-1653):

```ts
  async function addProduk() {
    if (!pNama || !pDesc) { notify('Nama dan deskripsi wajib diisi.', 'err'); return; }
    if (!pHargaBulanan && !pHargaTahunan && !pHargaLifetime) { notify('Minimal satu harga (Bulanan/Tahunan/Lifetime) harus diisi.', 'err'); return; }
    if (pStatus === 'preorder' && !pTanggalRilis) { notify('Tanggal rilis wajib diisi untuk pre-order.', 'err'); return; }
    setLoading(true);
    let gambarUrl: string|null = null;
    if (pGambarFile) { gambarUrl = await uploadProdukGambar(pGambarFile); if (!gambarUrl) { setLoading(false); return; } }
    let panduanUrl: string|null = null;
    if (pPanduanFile) { panduanUrl = await uploadProdukPanduan(pPanduanFile); if (!panduanUrl) { setLoading(false); return; } }
    const { error } = await supabase.from('products').insert({
      nama: pNama, deskripsi: pDesc,
      harga_bulanan:   pHargaBulanan  ? parseInt(pHargaBulanan)  : null,
      diskon_bulanan:  pDiskonBulanan ? parseInt(pDiskonBulanan) : null,
      harga_tahunan:   pHargaTahunan  ? parseInt(pHargaTahunan)  : null,
      diskon_tahunan:  pDiskonTahunan ? parseInt(pDiskonTahunan) : null,
      harga_lifetime:  pHargaLifetime ? parseInt(pHargaLifetime) : null,
      diskon_lifetime: pDiskonLifetime? parseInt(pDiskonLifetime): null,
      gambar_url: gambarUrl,
      video_url: pVideoUrl.trim() || null,
      panduan_url: panduanUrl,
      panduan_name: pPanduanFile?.name || null,
      status: pStatus,
      tanggal_rilis: pStatus === 'preorder' ? pTanggalRilis : null,
      tier_access: pTierAccess,
      urutan: parseInt(pUrutan) || 0,
      aktif: pAktif,
    });
    if (error) notify('Error: ' + error.message, 'err');
    else {
      notify('Produk berhasil ditambahkan!');
      setPNama(''); setPDesc('');
      setPHargaBulanan(''); setPDiskonBulanan('');
      setPHargaTahunan(''); setPDiskonTahunan('');
      setPHargaLifetime(''); setPDiskonLifetime('');
      setPStatus('tersedia'); setPTanggalRilis(''); setPTierAccess(['trial','bronze','gold','platinum']);
      setPUrutan(''); setPAktif(true); setPGambarFile(null); setPGambarPreview(''); setPVideoUrl('');
      setPPanduanFile(null); if (pPanduanRef.current) pPanduanRef.current.value = '';
      loadData();
    }
    setLoading(false);
  }
```

Replace with:

```ts
  async function addProduk() {
    if (!pNama || !pDesc) { notify('Nama dan deskripsi wajib diisi.', 'err'); return; }
    if (pIsGratis) {
      if (!pLinkGratis.trim()) { notify('Link produk wajib diisi untuk produk gratis.', 'err'); return; }
    } else if (!pHargaBulanan && !pHargaTahunan && !pHargaLifetime) {
      notify('Minimal satu harga (Bulanan/Tahunan/Lifetime) harus diisi.', 'err'); return;
    }
    if (pStatus === 'preorder' && !pTanggalRilis) { notify('Tanggal rilis wajib diisi untuk pre-order.', 'err'); return; }
    setLoading(true);
    let gambarUrl: string|null = null;
    if (pGambarFile) { gambarUrl = await uploadProdukGambar(pGambarFile); if (!gambarUrl) { setLoading(false); return; } }
    let panduanUrl: string|null = null;
    if (pPanduanFile) { panduanUrl = await uploadProdukPanduan(pPanduanFile); if (!panduanUrl) { setLoading(false); return; } }
    const { error } = await supabase.from('products').insert({
      nama: pNama, deskripsi: pDesc,
      is_gratis: pIsGratis,
      link_gratis: pIsGratis ? pLinkGratis.trim() : null,
      harga_bulanan:   pIsGratis || !pHargaBulanan  ? null : parseInt(pHargaBulanan),
      diskon_bulanan:  pIsGratis || !pDiskonBulanan ? null : parseInt(pDiskonBulanan),
      harga_tahunan:   pIsGratis || !pHargaTahunan  ? null : parseInt(pHargaTahunan),
      diskon_tahunan:  pIsGratis || !pDiskonTahunan ? null : parseInt(pDiskonTahunan),
      harga_lifetime:  pIsGratis || !pHargaLifetime ? null : parseInt(pHargaLifetime),
      diskon_lifetime: pIsGratis || !pDiskonLifetime? null : parseInt(pDiskonLifetime),
      gambar_url: gambarUrl,
      video_url: pVideoUrl.trim() || null,
      panduan_url: panduanUrl,
      panduan_name: pPanduanFile?.name || null,
      status: pStatus,
      tanggal_rilis: pStatus === 'preorder' ? pTanggalRilis : null,
      tier_access: pTierAccess,
      urutan: parseInt(pUrutan) || 0,
      aktif: pAktif,
    });
    if (error) notify('Error: ' + error.message, 'err');
    else {
      notify('Produk berhasil ditambahkan!');
      setPNama(''); setPDesc(''); setPIsGratis(false); setPLinkGratis('');
      setPHargaBulanan(''); setPDiskonBulanan('');
      setPHargaTahunan(''); setPDiskonTahunan('');
      setPHargaLifetime(''); setPDiskonLifetime('');
      setPStatus('tersedia'); setPTanggalRilis(''); setPTierAccess(['trial','bronze','gold','platinum']);
      setPUrutan(''); setPAktif(true); setPGambarFile(null); setPGambarPreview(''); setPVideoUrl('');
      setPPanduanFile(null); if (pPanduanRef.current) pPanduanRef.current.value = '';
      loadData();
    }
    setLoading(false);
  }
```

- [ ] **Step 4: Update `startEditProduk()` to hydrate the new fields**

Find (around line 1675-1690):

```ts
  function startEditProduk(p: any) {
    setEditProdukId(p.id); setEditPNama(p.nama); setEditPDesc(p.deskripsi || '');
    setEditPHargaBulanan(p.harga_bulanan ? String(p.harga_bulanan) : '');
```

Replace with:

```ts
  function startEditProduk(p: any) {
    setEditProdukId(p.id); setEditPNama(p.nama); setEditPDesc(p.deskripsi || '');
    setEditPIsGratis(!!p.is_gratis); setEditPLinkGratis(p.link_gratis || '');
    setEditPHargaBulanan(p.harga_bulanan ? String(p.harga_bulanan) : '');
```

- [ ] **Step 5: Update `saveEditProduk()` validation and update payload**

Find (around line 1692-1730):

```ts
  async function saveEditProduk() {
    if (!editProdukId || !editPNama || !editPDesc) { notify('Nama dan deskripsi wajib diisi.', 'err'); return; }
    if (!editPHargaBulanan && !editPHargaTahunan && !editPHargaLifetime) { notify('Minimal satu harga harus diisi.', 'err'); return; }
    if (editPStatus === 'preorder' && !editPTanggalRilis) { notify('Tanggal rilis wajib diisi untuk pre-order.', 'err'); return; }
    setLoading(true);
    let gambarUrl = editPGambarUrl;
    if (editPGambarFile) {
      const uploaded = await uploadProdukGambar(editPGambarFile);
      if (!uploaded) { setLoading(false); return; }
      gambarUrl = uploaded;
    }
    let panduanUrl = editPPanduanUrl;
    let panduanName: string|null = null;
    if (editPPanduanFile) {
      const uploaded = await uploadProdukPanduan(editPPanduanFile);
      if (!uploaded) { setLoading(false); return; }
      panduanUrl = uploaded; panduanName = editPPanduanFile.name;
    } else if (editPPanduanUrl) {
      // preserve existing name from products (fetched separately not tracked here — just keep url)
      panduanName = null;
    }
    const { error } = await supabase.from('products').update({
      nama: editPNama, deskripsi: editPDesc,
      harga_bulanan:   editPHargaBulanan  ? parseInt(editPHargaBulanan)  : null,
      diskon_bulanan:  editPDiskonBulanan ? parseInt(editPDiskonBulanan) : null,
      harga_tahunan:   editPHargaTahunan  ? parseInt(editPHargaTahunan)  : null,
      diskon_tahunan:  editPDiskonTahunan ? parseInt(editPDiskonTahunan) : null,
      harga_lifetime:  editPHargaLifetime ? parseInt(editPHargaLifetime) : null,
      diskon_lifetime: editPDiskonLifetime? parseInt(editPDiskonLifetime): null,
      gambar_url: gambarUrl || null,
      video_url: editPVideoUrl.trim() || null,
      panduan_url: panduanUrl || null,
      panduan_name: editPPanduanFile ? panduanName : undefined,
      status: editPStatus,
      tanggal_rilis: editPStatus === 'preorder' ? editPTanggalRilis : null,
      tier_access: editPTierAccess,
      urutan: parseInt(editPUrutan) || 0,
      aktif: editPAktif,
    }).eq('id', editProdukId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Produk berhasil diupdate!'); setEditProdukId(null); loadData(); }
    setLoading(false);
  }
```

Replace with:

```ts
  async function saveEditProduk() {
    if (!editProdukId || !editPNama || !editPDesc) { notify('Nama dan deskripsi wajib diisi.', 'err'); return; }
    if (editPIsGratis) {
      if (!editPLinkGratis.trim()) { notify('Link produk wajib diisi untuk produk gratis.', 'err'); return; }
    } else if (!editPHargaBulanan && !editPHargaTahunan && !editPHargaLifetime) {
      notify('Minimal satu harga harus diisi.', 'err'); return;
    }
    if (editPStatus === 'preorder' && !editPTanggalRilis) { notify('Tanggal rilis wajib diisi untuk pre-order.', 'err'); return; }
    setLoading(true);
    let gambarUrl = editPGambarUrl;
    if (editPGambarFile) {
      const uploaded = await uploadProdukGambar(editPGambarFile);
      if (!uploaded) { setLoading(false); return; }
      gambarUrl = uploaded;
    }
    let panduanUrl = editPPanduanUrl;
    let panduanName: string|null = null;
    if (editPPanduanFile) {
      const uploaded = await uploadProdukPanduan(editPPanduanFile);
      if (!uploaded) { setLoading(false); return; }
      panduanUrl = uploaded; panduanName = editPPanduanFile.name;
    } else if (editPPanduanUrl) {
      // preserve existing name from products (fetched separately not tracked here — just keep url)
      panduanName = null;
    }
    const { error } = await supabase.from('products').update({
      nama: editPNama, deskripsi: editPDesc,
      is_gratis: editPIsGratis,
      link_gratis: editPIsGratis ? editPLinkGratis.trim() : null,
      harga_bulanan:   editPIsGratis || !editPHargaBulanan  ? null : parseInt(editPHargaBulanan),
      diskon_bulanan:  editPIsGratis || !editPDiskonBulanan ? null : parseInt(editPDiskonBulanan),
      harga_tahunan:   editPIsGratis || !editPHargaTahunan  ? null : parseInt(editPHargaTahunan),
      diskon_tahunan:  editPIsGratis || !editPDiskonTahunan ? null : parseInt(editPDiskonTahunan),
      harga_lifetime:  editPIsGratis || !editPHargaLifetime ? null : parseInt(editPHargaLifetime),
      diskon_lifetime: editPIsGratis || !editPDiskonLifetime? null : parseInt(editPDiskonLifetime),
      gambar_url: gambarUrl || null,
      video_url: editPVideoUrl.trim() || null,
      panduan_url: panduanUrl || null,
      panduan_name: editPPanduanFile ? panduanName : undefined,
      status: editPStatus,
      tanggal_rilis: editPStatus === 'preorder' ? editPTanggalRilis : null,
      tier_access: editPTierAccess,
      urutan: parseInt(editPUrutan) || 0,
      aktif: editPAktif,
    }).eq('id', editProdukId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Produk berhasil diupdate!'); setEditProdukId(null); loadData(); }
    setLoading(false);
  }
```

- [ ] **Step 6: Add the toggle + link field to the "Tambah Produk" form, hide pricing when checked**

Find (around line 2946-2969):

```tsx
                  <div style={{marginBottom:10,background:'#0a0a0a',border:'1px solid #1a1a1a',padding:'14px 16px'}}>
                    <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:10}}>// HARGA PAKET LANGGANAN <span style={{color:'#333'}}>(isi minimal satu)</span></div>
                    {([
                      {label:'BULANAN', h:pHargaBulanan,  setH:setPHargaBulanan,  d:pDiskonBulanan,  setD:setPDiskonBulanan},
                      {label:'TAHUNAN', h:pHargaTahunan,  setH:setPHargaTahunan,  d:pDiskonTahunan,  setD:setPDiskonTahunan},
                      {label:'LIFETIME',h:pHargaLifetime, setH:setPHargaLifetime, d:pDiskonLifetime, setD:setPDiskonLifetime},
                    ] as {label:string;h:string;setH:(v:string)=>void;d:string;setD:(v:string)=>void}[]).map(row=>{
                      const finalH = row.h && row.d ? Math.round(parseInt(row.h)*(1-parseInt(row.d)/100)) : (row.h ? parseInt(row.h) : null);
                      return (
                        <div key={row.label} style={{display:'grid',gridTemplateColumns:'72px 1fr 1fr 120px',gap:8,alignItems:'center',marginBottom:8}}>
                          <span style={{fontFamily:'monospace',fontSize:10,fontWeight:700,color:'#16a34a',letterSpacing:0.5}}>{row.label}</span>
                          <input type="number" value={row.h} onChange={e=>row.setH(e.target.value)} placeholder="Harga (IDR)"
                            style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none'}}
                            onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                          <input type="number" value={row.d} onChange={e=>row.setD(e.target.value)} placeholder="Diskon %"
                            style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none'}}
                            onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                          <span style={{fontFamily:'monospace',fontSize:11,color:row.d&&row.h?'#ef4444':'#333',textAlign:'right' as const}}>
                            {finalH ? `→ Rp${finalH.toLocaleString('id-ID')}` : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
```

Replace with:

```tsx
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontFamily:'monospace',fontSize:11,color:pIsGratis?'#16a34a':'#888',marginBottom:10}}>
                    <input type="checkbox" checked={pIsGratis} onChange={e=>setPIsGratis(e.target.checked)} style={{accentColor:'#16a34a'}}/>
                    Produk Gratis?
                  </label>
                  {pIsGratis ? (
                    <div style={{marginBottom:10,background:'#0a0a0a',border:'1px solid #1a1a1a',padding:'14px 16px'}}>
                      <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:10}}>// LINK PRODUK</div>
                      <input value={pLinkGratis} onChange={e=>setPLinkGratis(e.target.value)} placeholder="https://..."
                        style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                        onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    </div>
                  ) : (
                    <div style={{marginBottom:10,background:'#0a0a0a',border:'1px solid #1a1a1a',padding:'14px 16px'}}>
                      <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:10}}>// HARGA PAKET LANGGANAN <span style={{color:'#333'}}>(isi minimal satu)</span></div>
                      {([
                        {label:'BULANAN', h:pHargaBulanan,  setH:setPHargaBulanan,  d:pDiskonBulanan,  setD:setPDiskonBulanan},
                        {label:'TAHUNAN', h:pHargaTahunan,  setH:setPHargaTahunan,  d:pDiskonTahunan,  setD:setPDiskonTahunan},
                        {label:'LIFETIME',h:pHargaLifetime, setH:setPHargaLifetime, d:pDiskonLifetime, setD:setPDiskonLifetime},
                      ] as {label:string;h:string;setH:(v:string)=>void;d:string;setD:(v:string)=>void}[]).map(row=>{
                        const finalH = row.h && row.d ? Math.round(parseInt(row.h)*(1-parseInt(row.d)/100)) : (row.h ? parseInt(row.h) : null);
                        return (
                          <div key={row.label} style={{display:'grid',gridTemplateColumns:'72px 1fr 1fr 120px',gap:8,alignItems:'center',marginBottom:8}}>
                            <span style={{fontFamily:'monospace',fontSize:10,fontWeight:700,color:'#16a34a',letterSpacing:0.5}}>{row.label}</span>
                            <input type="number" value={row.h} onChange={e=>row.setH(e.target.value)} placeholder="Harga (IDR)"
                              style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none'}}
                              onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                            <input type="number" value={row.d} onChange={e=>row.setD(e.target.value)} placeholder="Diskon %"
                              style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none'}}
                              onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                            <span style={{fontFamily:'monospace',fontSize:11,color:row.d&&row.h?'#ef4444':'#333',textAlign:'right' as const}}>
                              {finalH ? `→ Rp${finalH.toLocaleString('id-ID')}` : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
```

- [ ] **Step 7: Add the same toggle + link field to the "Edit Produk" form**

Find (around line 3112-3135):

```tsx
                          <div style={{marginBottom:8,background:'#0a0a0a',border:'1px solid #1a1a1a',padding:'10px 12px'}}>
                            <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:8}}>// HARGA PAKET LANGGANAN</div>
                            {([
                              {label:'BULANAN', h:editPHargaBulanan,  setH:setEditPHargaBulanan,  d:editPDiskonBulanan,  setD:setEditPDiskonBulanan},
                              {label:'TAHUNAN', h:editPHargaTahunan,  setH:setEditPHargaTahunan,  d:editPDiskonTahunan,  setD:setEditPDiskonTahunan},
                              {label:'LIFETIME',h:editPHargaLifetime, setH:setEditPHargaLifetime, d:editPDiskonLifetime, setD:setEditPDiskonLifetime},
                            ] as {label:string;h:string;setH:(v:string)=>void;d:string;setD:(v:string)=>void}[]).map(row=>{
                              const finalH = row.h && row.d ? Math.round(parseInt(row.h)*(1-parseInt(row.d)/100)) : (row.h ? parseInt(row.h) : null);
                              return (
                                <div key={row.label} style={{display:'grid',gridTemplateColumns:'68px 1fr 1fr 100px',gap:6,alignItems:'center',marginBottom:6}}>
                                  <span style={{fontFamily:'monospace',fontSize:9,fontWeight:700,color:'#16a34a'}}>{row.label}</span>
                                  <input type="number" value={row.h} onChange={e=>row.setH(e.target.value)} placeholder="Harga (IDR)"
                                    style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'7px 10px',fontSize:11,fontFamily:'monospace',outline:'none'}}
                                    onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                                  <input type="number" value={row.d} onChange={e=>row.setD(e.target.value)} placeholder="Diskon %"
                                    style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'7px 10px',fontSize:11,fontFamily:'monospace',outline:'none'}}
                                    onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                                  <span style={{fontFamily:'monospace',fontSize:10,color:row.d&&row.h?'#ef4444':'#333',textAlign:'right' as const}}>
                                    {finalH ? `→ Rp${finalH.toLocaleString('id-ID')}` : '—'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
```

Replace with:

```tsx
                          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontFamily:'monospace',fontSize:10,color:editPIsGratis?'#16a34a':'#888',marginBottom:8}}>
                            <input type="checkbox" checked={editPIsGratis} onChange={e=>setEditPIsGratis(e.target.checked)} style={{accentColor:'#16a34a'}}/>
                            Produk Gratis?
                          </label>
                          {editPIsGratis ? (
                            <div style={{marginBottom:8,background:'#0a0a0a',border:'1px solid #1a1a1a',padding:'10px 12px'}}>
                              <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:8}}>// LINK PRODUK</div>
                              <input value={editPLinkGratis} onChange={e=>setEditPLinkGratis(e.target.value)} placeholder="https://..."
                                style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'7px 10px',fontSize:11,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                                onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                            </div>
                          ) : (
                            <div style={{marginBottom:8,background:'#0a0a0a',border:'1px solid #1a1a1a',padding:'10px 12px'}}>
                              <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:8}}>// HARGA PAKET LANGGANAN</div>
                              {([
                                {label:'BULANAN', h:editPHargaBulanan,  setH:setEditPHargaBulanan,  d:editPDiskonBulanan,  setD:setEditPDiskonBulanan},
                                {label:'TAHUNAN', h:editPHargaTahunan,  setH:setEditPHargaTahunan,  d:editPDiskonTahunan,  setD:setEditPDiskonTahunan},
                                {label:'LIFETIME',h:editPHargaLifetime, setH:setEditPHargaLifetime, d:editPDiskonLifetime, setD:setEditPDiskonLifetime},
                              ] as {label:string;h:string;setH:(v:string)=>void;d:string;setD:(v:string)=>void}[]).map(row=>{
                                const finalH = row.h && row.d ? Math.round(parseInt(row.h)*(1-parseInt(row.d)/100)) : (row.h ? parseInt(row.h) : null);
                                return (
                                  <div key={row.label} style={{display:'grid',gridTemplateColumns:'68px 1fr 1fr 100px',gap:6,alignItems:'center',marginBottom:6}}>
                                    <span style={{fontFamily:'monospace',fontSize:9,fontWeight:700,color:'#16a34a'}}>{row.label}</span>
                                    <input type="number" value={row.h} onChange={e=>row.setH(e.target.value)} placeholder="Harga (IDR)"
                                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'7px 10px',fontSize:11,fontFamily:'monospace',outline:'none'}}
                                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                                    <input type="number" value={row.d} onChange={e=>row.setD(e.target.value)} placeholder="Diskon %"
                                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'7px 10px',fontSize:11,fontFamily:'monospace',outline:'none'}}
                                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                                    <span style={{fontFamily:'monospace',fontSize:10,color:row.d&&row.h?'#ef4444':'#333',textAlign:'right' as const}}>
                                      {finalH ? `→ Rp${finalH.toLocaleString('id-ID')}` : '—'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
```

- [ ] **Step 8: Show a "GRATIS" badge in the existing product list instead of price badges**

Find (around line 3057-3074):

```tsx
                            <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' as const}}>
                              {([
                                {key:'bulanan', h:p.harga_bulanan, d:p.diskon_bulanan},
                                {key:'tahunan', h:p.harga_tahunan, d:p.diskon_tahunan},
                                {key:'lifetime',h:p.harga_lifetime,d:p.diskon_lifetime},
                              ]).filter(r=>r.h).map(r=>{
                                const fh = r.d ? Math.round(r.h*(1-r.d/100)) : r.h;
                                return (
                                  <span key={r.key} style={{fontFamily:'monospace',fontSize:10,display:'flex',gap:4,alignItems:'center'}}>
                                    <span style={{color:'#555',fontSize:9}}>{r.key.toUpperCase()}</span>
                                    {r.d && <span style={{color:'#444',textDecoration:'line-through',fontSize:9}}>Rp{Number(r.h).toLocaleString('id-ID')}</span>}
                                    <span style={{fontWeight:700,color:r.d?'#ef4444':'#e7e5e4'}}>Rp{Number(fh).toLocaleString('id-ID')}</span>
                                    {r.d && <span style={{color:'#ef4444',fontSize:8,border:'1px solid #ef444433',padding:'0 4px'}}>-{r.d}%</span>}
                                  </span>
                                );
                              })}
                              <span style={{fontFamily:'monospace',fontSize:10,color:'#444'}}>Tier: {(p.tier_access||[]).join(', ')}</span>
                            </div>
```

Replace with:

```tsx
                            <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' as const}}>
                              {p.is_gratis ? (
                                <span style={{fontFamily:'monospace',fontSize:10,fontWeight:700,color:'#fff',background:'#16a34a',padding:'2px 8px',borderRadius:4}}>GRATIS</span>
                              ) : (
                                <>
                                  {([
                                    {key:'bulanan', h:p.harga_bulanan, d:p.diskon_bulanan},
                                    {key:'tahunan', h:p.harga_tahunan, d:p.diskon_tahunan},
                                    {key:'lifetime',h:p.harga_lifetime,d:p.diskon_lifetime},
                                  ]).filter(r=>r.h).map(r=>{
                                    const fh = r.d ? Math.round(r.h*(1-r.d/100)) : r.h;
                                    return (
                                      <span key={r.key} style={{fontFamily:'monospace',fontSize:10,display:'flex',gap:4,alignItems:'center'}}>
                                        <span style={{color:'#555',fontSize:9}}>{r.key.toUpperCase()}</span>
                                        {r.d && <span style={{color:'#444',textDecoration:'line-through',fontSize:9}}>Rp{Number(r.h).toLocaleString('id-ID')}</span>}
                                        <span style={{fontWeight:700,color:r.d?'#ef4444':'#e7e5e4'}}>Rp{Number(fh).toLocaleString('id-ID')}</span>
                                        {r.d && <span style={{color:'#ef4444',fontSize:8,border:'1px solid #ef444433',padding:'0 4px'}}>-{r.d}%</span>}
                                      </span>
                                    );
                                  })}
                                  <span style={{fontFamily:'monospace',fontSize:10,color:'#444'}}>Tier: {(p.tier_access||[]).join(', ')}</span>
                                </>
                              )}
                            </div>
```

- [ ] **Step 9: Add the `'gratis'` branch to the Pesanan Masuk jatuh-tempo display**

Find (around line 3324):

```tsx
                            if (o.plan_type === 'lifetime') return <div style={{fontFamily:'monospace',fontSize:10,color:'#444',marginTop:2}}>Jatuh tempo: Seumur Hidup</div>;
```

Replace with:

```tsx
                            if (o.plan_type === 'lifetime') return <div style={{fontFamily:'monospace',fontSize:10,color:'#444',marginTop:2}}>Jatuh tempo: Seumur Hidup</div>;
                            if (o.plan_type === 'gratis') return <div style={{fontFamily:'monospace',fontSize:10,color:'#444',marginTop:2}}>Akses Permanen (Gratis)</div>;
```

- [ ] **Step 10: Typecheck**

Run: `npm run typecheck`
Expected: no new errors relative to the pre-existing baseline (35 pre-existing errors in `AdminPage.tsx`, confirmed via `git stash` comparison earlier this session — none of your new identifiers, `pIsGratis`/`editPIsGratis`/etc., should appear in the error list).

- [ ] **Step 11: Manual verification via dev server**

Run: `npm run dev`. Log into `/admin/panel`, go to Produk → Katalog. In "Tambah Produk Baru", check "Produk Gratis?" and confirm the pricing block is replaced by a single "Link Produk" field; try submitting without filling it in and confirm the validation message appears. Fill in a link and a name/description, submit, and confirm the new product appears in the list below with a green "GRATIS" badge instead of price badges. Click "EDIT" on it and confirm the checkbox is pre-checked and the link field is pre-filled with what you entered.

- [ ] **Step 12: Commit**

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: admin bisa tambah/edit produk gratis (link) di katalog indikator"
```

---

### Task 3: `member/DashboardPage.tsx` — katalog card, claim function, jatuh-tempo displays

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx`

**Interfaces:**
- Consumes: Task 2's `products.is_gratis`/`products.link_gratis` columns (read-only here), `myOrders` (existing state), `member` (existing state), `supabase` (existing import), `addMemberToast(msg, type)` (existing function).
- Produces: `claimProdukGratis(produk: any): Promise<void>` — used only within this file's katalog card.

- [ ] **Step 1: Add `claimProdukGratis` function**

Find the end of `buatOrder` (around line 506-532, ends with):

```ts
    setMyOrders(prev => [{ ...data, products: produk }, ...prev]);
    setPendingOrder({ ...data, products: produk, _harga: harga, _labelPlan: labelPlan, _appliedCode: appliedCode });
    setSelectedPm('');
    setModalStep('pembayaran');
  }
```

Add immediately after this function's closing `}`:

```ts

  async function claimProdukGratis(produk: any) {
    if (!member) return;
    const { data, error } = await supabase.from('orders').insert({
      product_id:   produk.id,
      member_id:    member.id,
      nama_member:  member.nama,
      tier_member:  member.tier,
      status:       'aktif',
      activated_at: new Date().toISOString(),
      plan_type:    'gratis',
    }).select().single();
    if (error) { addMemberToast('Gagal klaim produk: ' + error.message, 'error'); return; }
    setMyOrders(prev => [{ ...data, products: produk }, ...prev]);
    addMemberToast(`✅ Berhasil klaim ${produk.nama}!`, 'success');
  }
```

- [ ] **Step 2: Branch the katalog card's plan/price/order section on `p.is_gratis`**

Find (around line 2714-2746, inside `products.map(p => { ... })`, right after the product description `<div>`):

```tsx
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
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {activePlan.d ? <span style={{ fontFamily: LP.mono, fontSize: 12, color: LP.muted, textDecoration: 'line-through' }}>Rp{Number(activePlan.h).toLocaleString('id-ID')}</span> : null}
                                  <span style={{ fontFamily: LP.mono, fontSize: 20, fontWeight: 700, color: LP.text }}>Rp{Number(finalH).toLocaleString('id-ID')}</span>
                                  {activePlan.d ? <span style={{ fontFamily: LP.mono, fontSize: 10, color: LP.danger, border: `1px solid ${LP.danger}44`, padding: '2px 6px', borderRadius: 4 }}>-{activePlan.d}%</span> : null}
                                </div>
                                <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 2 }}>≈ ${(finalH / KURS_USD).toFixed(2)}</div>
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
```

Replace with:

```tsx
                            {p.is_gratis ? (
                              <>
                                <span style={{ display: 'inline-block', fontFamily: LP.mono, fontSize: 11, fontWeight: 700, color: '#fff', background: '#16a34a', padding: '4px 12px', borderRadius: 20, width: 'fit-content' }}>
                                  GRATIS
                                </span>
                                {myOrders.some(o => o.product_id === p.id) ? (
                                  <button onClick={() => window.open(p.link_gratis, '_blank')}
                                    style={{ width: '100%', padding: '11px', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, background: LP.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                                    Buka Link →
                                  </button>
                                ) : (
                                  <button onClick={() => claimProdukGratis(p)}
                                    style={{ width: '100%', padding: '11px', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, background: LP.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                                    Klaim Gratis
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
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
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      {activePlan.d ? <span style={{ fontFamily: LP.mono, fontSize: 12, color: LP.muted, textDecoration: 'line-through' }}>Rp{Number(activePlan.h).toLocaleString('id-ID')}</span> : null}
                                      <span style={{ fontFamily: LP.mono, fontSize: 20, fontWeight: 700, color: LP.text }}>Rp{Number(finalH).toLocaleString('id-ID')}</span>
                                      {activePlan.d ? <span style={{ fontFamily: LP.mono, fontSize: 10, color: LP.danger, border: `1px solid ${LP.danger}44`, padding: '2px 6px', borderRadius: 4 }}>-{activePlan.d}%</span> : null}
                                    </div>
                                    <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 2 }}>≈ ${(finalH / KURS_USD).toFixed(2)}</div>
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
                              </>
                            )}
```

- [ ] **Step 3: Add the `'gratis'` branch to the dashboard-home Status Pesanan card**

Find (around line 1427):

```tsx
                            if (order.plan_type === 'lifetime') return (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>
                                <Clock size={12} /> Berlaku Seumur Hidup
                              </span>
                            );
```

Replace with:

```tsx
                            if (order.plan_type === 'lifetime') return (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>
                                <Clock size={12} /> Berlaku Seumur Hidup
                              </span>
                            );
                            if (order.plan_type === 'gratis') return (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: LP.mono, fontSize: 11, color: LP.muted }}>
                                <Clock size={12} /> Akses Permanen (Gratis)
                              </span>
                            );
```

- [ ] **Step 4: Add the `'gratis'` branch to the "Pesanan Saya" list**

Find (around line 2793):

```tsx
                                if (o.plan_type === 'lifetime') return <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 2 }}>Jatuh tempo: Seumur Hidup</div>;
```

Replace with:

```tsx
                                if (o.plan_type === 'lifetime') return <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 2 }}>Jatuh tempo: Seumur Hidup</div>;
                                if (o.plan_type === 'gratis') return <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 2 }}>Akses Permanen (Gratis)</div>;
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no new errors relative to the pre-existing baseline (8 pre-existing unused-var warnings already documented earlier in this session for this file).

- [ ] **Step 6: Manual verification via dev server**

Run: `npm run dev`. Log in as any member. Go to Produk → Katalog, find the free product created in Task 2's verification. Confirm it shows a "GRATIS" badge (no plan pills, no price) and a "Klaim Gratis" button regardless of your tier. Click it, confirm a success toast appears and the button immediately changes to "Buka Link →" without a page reload. Click "Buka Link →" and confirm it opens the link in a new tab. Reload the page and confirm the button still shows "Buka Link →" (persisted). Check "Pesanan Saya" and confirm the claim appears there with "Akses Permanen (Gratis)" instead of a jatuh-tempo date.

- [ ] **Step 7: Commit**

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: member bisa klaim produk gratis langsung dari katalog"
```

---

### Task 4: Final whole-branch review

- [ ] **Step 1: Review the full diff against the spec**

Run: `git diff main -- src/pages/AdminPage.tsx src/pages/member/DashboardPage.tsx supabase-produk-gratis-migration.sql`

Confirm every point in `docs/superpowers/specs/2026-07-09-produk-gratis-design.md` is reflected: migration, admin toggle+link field in both add/edit forms with correct validation swap, admin list GRATIS badge, admin Pesanan Masuk 'gratis' branch, member katalog is_gratis branch (no tier gating, no plan selector), claim/already-claimed button states, dashboard-home and Pesanan Saya 'gratis' branches.

- [ ] **Step 2: Full typecheck**

Run: `npm run typecheck`
Expected: exit code 0 relative to the pre-existing baseline (no new errors from either task).

- [ ] **Step 3: Remind the user to run the migration**

Before this branch is pushed to `main` (auto-deploys via Cloudflare Pages), confirm with the user that `supabase-produk-gratis-migration.sql` has been run against the live Supabase project — otherwise every "Tambah Produk"/"Edit Produk" save with the gratis toggle checked, and every member's "Klaim Gratis" click, will fail with a column-not-found error.

- [ ] **Step 4: End-to-end smoke test via dev server**

With `npm run dev` running: as admin, add a free product with a real link. As a member (any tier, including one whose tier would normally be locked out of ordering paid products), confirm the free product's "Klaim Gratis" button is available and works, and "Buka Link →" opens the correct URL afterward.
