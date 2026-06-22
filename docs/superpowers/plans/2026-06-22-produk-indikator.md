# Produk Indikator TradingView — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah halaman produk indikator TradingView — admin kelola katalog & pesanan di AdminPage, member beli via modal + redirect WA dan pantau status pesanan di DashboardPage.

**Architecture:** Tab `produk` baru ditambah ke `AdminPage.tsx` (sub-tab katalog + pesanan) dan ke `DashboardPage.tsx` (katalog grid + pesanan saya). Semua data dari Supabase tabel `products` dan `orders` (sudah dimigrasikan). Tidak ada file baru — mengikuti pola monolitik yang ada.

**Tech Stack:** React + TypeScript, Supabase (PostgreSQL + Storage bucket `materi`), inline styles dengan pattern C/G, lucide-react icons.

## Global Constraints

- Konten dalam Bahasa Indonesia
- AdminPage.tsx: gunakan pola `#0d0d0d` panel, `#1f1f1f` border, `#16a34a` aksen, `fontFamily:'monospace'`
- DashboardPage.tsx: gunakan konstanta `C` dan `G` yang sudah ada di file
- Storage bucket: `materi`, prefix file gambar: `produk_`
- Tier normalization: `'SMC Trial'→'trial'`, `'SMC Bronze'→'bronze'`, `'SMC Gold Mentorship'→'gold'`, `'SMC Platinum 1 on 1'→'platinum'`
- WA redirect: `https://wa.me/6281242224939`
- Tabel `products` dan `orders` sudah ada di Supabase (migration sudah dijalankan)
- Validasi dengan menjalankan dev server (`npm run dev`) — tidak ada test suite

---

## File Structure

| File | Perubahan |
|---|---|
| `src/pages/AdminPage.tsx` | Tambah state vars produk+orders, CRUD functions, tab `produk` UI (sub-tab katalog + pesanan) |
| `src/pages/member/DashboardPage.tsx` | Tambah `produk` ke SIDEBAR, state vars, load data, real-time subscription, tab UI |
| `CLAUDE.md` | Update daftar tabel, tab sidebar member |

---

## Task 1: Admin — State, CRUD Functions, dan Tab Produk

**Files:**
- Modify: `src/pages/AdminPage.tsx`

### Step 1.1 — Tambah `'produk'` ke union type tab

- [ ] Di baris 1222, ubah union type tab:

```ts
// SEBELUM (baris 1222):
const [tab, setTab] = useState<'member' | 'video' | 'materi' | 'advance' | 'admins' | 'settings' | 'announce' | 'broker' | 'ulasan' | 'claim' | 'jadwal' | 'proprules' | 'rating' | 'referral' | 'progress' | 'jurnal'>((initialTab as any) || 'member');

// SESUDAH:
const [tab, setTab] = useState<'member' | 'video' | 'materi' | 'advance' | 'admins' | 'settings' | 'announce' | 'broker' | 'ulasan' | 'claim' | 'jadwal' | 'proprules' | 'rating' | 'referral' | 'progress' | 'jurnal' | 'produk'>((initialTab as any) || 'member');
```

### Step 1.2 — Tambah state variables produk & pesanan

- [ ] Tambahkan setelah blok broker states (setelah baris `const [editBLogoUrl, setEditBLogoUrl] = useState('');` ≈ baris 1260):

```ts
  // Produk states
  const [products, setProducts]               = useState<any[]>([]);
  const [prodSubTab, setProdSubTab]           = useState<'katalog'|'pesanan'>('katalog');
  const [pNama, setPNama]                     = useState('');
  const [pDesc, setPDesc]                     = useState('');
  const [pHargaAsli, setPHargaAsli]           = useState('');
  const [pDiskon, setPDiskon]                 = useState('');
  const [pHargaDiskon, setPHargaDiskon]       = useState('');
  const [pStatus, setPStatus]                 = useState<'tersedia'|'preorder'>('tersedia');
  const [pTanggalRilis, setPTanggalRilis]     = useState('');
  const [pTierAccess, setPTierAccess]         = useState<string[]>(['trial','bronze','gold','platinum']);
  const [pUrutan, setPUrutan]                 = useState('');
  const [pAktif, setPAktif]                   = useState(true);
  const [pGambarFile, setPGambarFile]         = useState<File|null>(null);
  const [pGambarPreview, setPGambarPreview]   = useState('');
  const [editProdukId, setEditProdukId]       = useState<string|null>(null);
  const [editPNama, setEditPNama]             = useState('');
  const [editPDesc, setEditPDesc]             = useState('');
  const [editPHargaAsli, setEditPHargaAsli]   = useState('');
  const [editPDiskon, setEditPDiskon]         = useState('');
  const [editPHargaDiskon, setEditPHargaDiskon] = useState('');
  const [editPStatus, setEditPStatus]         = useState<'tersedia'|'preorder'>('tersedia');
  const [editPTanggalRilis, setEditPTanggalRilis] = useState('');
  const [editPTierAccess, setEditPTierAccess] = useState<string[]>(['trial','bronze','gold','platinum']);
  const [editPUrutan, setEditPUrutan]         = useState('');
  const [editPAktif, setEditPAktif]           = useState(true);
  const [editPGambarFile, setEditPGambarFile] = useState<File|null>(null);
  const [editPGambarPreview, setEditPGambarPreview] = useState('');
  const [editPGambarUrl, setEditPGambarUrl]   = useState('');
  // Orders states
  const [prodOrders, setProdOrders]           = useState<any[]>([]);
  const [orderFilter, setOrderFilter]         = useState<'all'|'pending'|'dibayar'|'aktif'>('all');
  const [orderSearch, setOrderSearch]         = useState('');
  const [orderCatatanMap, setOrderCatatanMap] = useState<Record<string,string>>({});
```

### Step 1.3 — Tambah load produk & pesanan ke `loadData()`

- [ ] Di dalam fungsi `loadData()` (sekitar baris 1363–1399), tambahkan dua baris query di bawah query broker (`const { data: br } = ...`):

```ts
    const { data: prods } = await supabase.from('products').select('*').order('urutan', { ascending: true });
    const { data: ords }  = await supabase.from('orders').select('*, products(nama)').order('created_at', { ascending: false });
```

Dan di bagian setter (setelah `if (br) setBrokers(br);`), tambahkan:

```ts
    if (prods) setProducts(prods);
    if (ords)  setProdOrders(ords);
```

### Step 1.4 — Tambah CRUD functions produk

- [ ] Tambahkan setelah fungsi `saveEditBroker()` (≈ setelah baris 1450):

```ts
  // ── Produk CRUD ─────────────────────────────────────────────────────────────
  async function uploadProdukGambar(file: File): Promise<string|null> {
    const ext = file.name.split('.').pop();
    const fileName = `produk_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('materi').upload(fileName, file, { upsert: true, cacheControl: '3600' });
    if (error) { notify('Gagal upload gambar: ' + error.message, 'err'); return null; }
    const { data } = supabase.storage.from('materi').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function addProduk() {
    if (!pNama || !pDesc || !pHargaAsli) { notify('Nama, deskripsi, dan harga asli wajib diisi.', 'err'); return; }
    if (pStatus === 'preorder' && !pTanggalRilis) { notify('Tanggal rilis wajib diisi untuk pre-order.', 'err'); return; }
    setLoading(true);
    let gambarUrl: string|null = null;
    if (pGambarFile) { gambarUrl = await uploadProdukGambar(pGambarFile); if (!gambarUrl) { setLoading(false); return; } }
    const { error } = await supabase.from('products').insert({
      nama: pNama, deskripsi: pDesc,
      harga_asli: parseInt(pHargaAsli) || 0,
      diskon: pDiskon ? parseInt(pDiskon) : null,
      harga_diskon: pHargaDiskon ? parseInt(pHargaDiskon) : null,
      gambar_url: gambarUrl,
      status: pStatus,
      tanggal_rilis: pStatus === 'preorder' ? pTanggalRilis : null,
      tier_access: pTierAccess,
      urutan: parseInt(pUrutan) || 0,
      aktif: pAktif,
    });
    if (error) notify('Error: ' + error.message, 'err');
    else {
      notify('Produk berhasil ditambahkan!');
      setPNama(''); setPDesc(''); setPHargaAsli(''); setPDiskon(''); setPHargaDiskon('');
      setPStatus('tersedia'); setPTanggalRilis(''); setPTierAccess(['trial','bronze','gold','platinum']);
      setPUrutan(''); setPAktif(true); setPGambarFile(null); setPGambarPreview('');
      loadData();
    }
    setLoading(false);
  }

  async function deleteProduk(id: string) {
    if (!confirm('Hapus produk ini?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadData();
  }

  function startEditProduk(p: any) {
    setEditProdukId(p.id); setEditPNama(p.nama); setEditPDesc(p.deskripsi || '');
    setEditPHargaAsli(String(p.harga_asli)); setEditPDiskon(p.diskon ? String(p.diskon) : '');
    setEditPHargaDiskon(p.harga_diskon ? String(p.harga_diskon) : '');
    setEditPStatus(p.status || 'tersedia'); setEditPTanggalRilis(p.tanggal_rilis || '');
    setEditPTierAccess(p.tier_access || ['trial','bronze','gold','platinum']);
    setEditPUrutan(String(p.urutan || 0)); setEditPAktif(p.aktif !== false);
    setEditPGambarUrl(p.gambar_url || ''); setEditPGambarPreview(p.gambar_url || ''); setEditPGambarFile(null);
  }

  async function saveEditProduk() {
    if (!editProdukId || !editPNama || !editPDesc || !editPHargaAsli) { notify('Nama, deskripsi, dan harga asli wajib diisi.', 'err'); return; }
    if (editPStatus === 'preorder' && !editPTanggalRilis) { notify('Tanggal rilis wajib diisi untuk pre-order.', 'err'); return; }
    setLoading(true);
    let gambarUrl = editPGambarUrl;
    if (editPGambarFile) {
      const uploaded = await uploadProdukGambar(editPGambarFile);
      if (!uploaded) { setLoading(false); return; }
      gambarUrl = uploaded;
    }
    const { error } = await supabase.from('products').update({
      nama: editPNama, deskripsi: editPDesc,
      harga_asli: parseInt(editPHargaAsli) || 0,
      diskon: editPDiskon ? parseInt(editPDiskon) : null,
      harga_diskon: editPHargaDiskon ? parseInt(editPHargaDiskon) : null,
      gambar_url: gambarUrl || null,
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

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase.from('orders').update({
      status: newStatus,
      catatan: orderCatatanMap[orderId] ?? null,
    }).eq('id', orderId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Status pesanan diperbarui!'); loadData(); }
  }
```

### Step 1.5 — Tambah UI tab produk (katalog + pesanan)

- [ ] Tambahkan blok berikut setelah penutup `{tab === 'broker' && (...)}` (cari `{/* ── TAB BROKER ──*/}` lalu sisipkan setelahnya):

```tsx
        {/* ── TAB PRODUK ── */}
        {tab === 'produk' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Sub-tab toggle */}
            <div style={{display:'flex',gap:2,borderBottom:'1px solid #1f1f1f',paddingBottom:0,marginBottom:4}}>
              {(['katalog','pesanan'] as const).map(st=>(
                <button key={st} onClick={()=>setProdSubTab(st)}
                  style={{fontFamily:'monospace',fontSize:11,fontWeight:700,letterSpacing:0.8,padding:'8px 20px',border:'none',cursor:'pointer',borderBottom:prodSubTab===st?'2px solid #16a34a':'2px solid transparent',background:'transparent',color:prodSubTab===st?'#16a34a':'#555'}}>
                  {st==='katalog'?'📦 KATALOG PRODUK':'🧾 PESANAN MASUK'}
                </button>
              ))}
            </div>

            {/* ── Sub-tab katalog ── */}
            {prodSubTab==='katalog' && (
              <>
                {/* Form tambah */}
                <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
                  <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:16}}>// TAMBAH PRODUK INDIKATOR</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                    <input value={pNama} onChange={e=>setPNama(e.target.value)} placeholder="Nama Produk"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <input type="number" value={pHargaAsli} onChange={e=>setPHargaAsli(e.target.value)} placeholder="Harga Asli (IDR)"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <input type="number" value={pDiskon} onChange={e=>{
                      setPDiskon(e.target.value);
                      if (pHargaAsli && e.target.value) setPHargaDiskon(String(Math.round(parseInt(pHargaAsli)*(1-parseInt(e.target.value)/100))));
                    }} placeholder="Diskon % (opsional)"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <input type="number" value={pHargaDiskon} onChange={e=>setPHargaDiskon(e.target.value)} placeholder="Harga Diskon (auto-hitung)"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <input type="number" value={pUrutan} onChange={e=>setPUrutan(e.target.value)} placeholder="Urutan tampil"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <div style={{display:'flex',gap:8}}>
                      <select value={pStatus} onChange={e=>{setPStatus(e.target.value as any);if(e.target.value==='tersedia')setPTanggalRilis('');}}
                        style={{flex:1,background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',cursor:'pointer'}}>
                        <option value="tersedia">✅ Tersedia</option>
                        <option value="preorder">⏳ Pre-order</option>
                      </select>
                      {pStatus==='preorder' && (
                        <input type="date" value={pTanggalRilis} onChange={e=>setPTanggalRilis(e.target.value)}
                          style={{flex:1,background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                          onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                      )}
                    </div>
                  </div>
                  <textarea value={pDesc} onChange={e=>setPDesc(e.target.value)} placeholder="Deskripsi produk" rows={3}
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:10}}
                    onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                  {/* Tier access */}
                  <div style={{marginBottom:10}}>
                    <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:6}}>// TIER YANG BISA ORDER</div>
                    <div style={{display:'flex',gap:14,flexWrap:'wrap' as const}}>
                      {(['trial','bronze','gold','platinum'] as const).map(t=>(
                        <label key={t} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontFamily:'monospace',fontSize:11,color:pTierAccess.includes(t)?'#e7e5e4':'#555'}}>
                          <input type="checkbox" checked={pTierAccess.includes(t)} onChange={e=>{
                            if(e.target.checked) setPTierAccess(prev=>[...prev,t]);
                            else setPTierAccess(prev=>prev.filter(x=>x!==t));
                          }} style={{accentColor:'#16a34a'}}/>{t.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Gambar upload */}
                  <div style={{marginBottom:10}}>
                    <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:6}}>// GAMBAR PRODUK (opsional)</div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      {pGambarPreview && <img src={pGambarPreview} alt="preview" style={{width:60,height:60,objectFit:'cover',borderRadius:8,border:'1px solid #2a2a2a',background:'#111'}}/>}
                      <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:'#111',border:'1px solid #2a2a2a',padding:'8px 14px',fontFamily:'monospace',fontSize:11,color:'#aaa'}}>
                        {pGambarFile ? pGambarFile.name : '📁 Pilih gambar (PNG/JPG)'}
                        <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;setPGambarFile(f);setPGambarPreview(URL.createObjectURL(f));}}/>
                      </label>
                      {pGambarPreview && <button onClick={()=>{setPGambarFile(null);setPGambarPreview('');}} style={{background:'transparent',border:'none',color:'#ef4444',cursor:'pointer',fontSize:12}}>✕ hapus</button>}
                    </div>
                  </div>
                  {/* Toggle aktif */}
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                    <span style={{fontFamily:'monospace',fontSize:10,color:'#555'}}>STATUS:</span>
                    <button onClick={()=>setPAktif(p=>!p)}
                      style={{fontFamily:'monospace',fontSize:10,fontWeight:700,padding:'4px 14px',border:`1px solid ${pAktif?'#16a34a':'#2a2a2a'}`,background:pAktif?'#0a1a0e':'transparent',color:pAktif?'#16a34a':'#555',cursor:'pointer'}}>
                      {pAktif?'✅ AKTIF':'⛔ NON-AKTIF'}
                    </button>
                  </div>
                  <button onClick={addProduk} disabled={loading}
                    style={{background:loading?'#1a1a1a':'#16a34a',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer',letterSpacing:0.5}}>
                    {loading?'MENYIMPAN...':'+ TAMBAH PRODUK'}
                  </button>
                </div>

                {/* Daftar produk */}
                <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
                  <div style={{padding:'12px 20px',borderBottom:'1px solid #1a1a1a'}}>
                    <span style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1}}>// DAFTAR PRODUK ({products.length})</span>
                  </div>
                  {!products.length && <div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— BELUM ADA PRODUK —</div>}
                  {products.map(p=>(
                    <div key={p.id} style={{borderBottom:'1px solid #111'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',gap:12}}>
                        <div style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:12}}>
                          {p.gambar_url
                            ? <img src={p.gambar_url} alt={p.nama} style={{width:44,height:44,objectFit:'cover',borderRadius:6,border:'1px solid #2a2a2a',flexShrink:0}}/>
                            : <div style={{width:44,height:44,borderRadius:6,background:'#1a1a1a',border:'1px solid #2a2a2a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>📊</div>
                          }
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap' as const}}>
                              <span style={{fontFamily:'monospace',fontSize:9,fontWeight:700,color:p.status==='preorder'?'#eab308':'#16a34a',background:p.status==='preorder'?'#1a150033':'#0a1a0e',border:`1px solid ${p.status==='preorder'?'#eab30833':'#16a34a33'}`,padding:'2px 7px'}}>
                                {p.status==='preorder'?`⏳ PRE-ORDER${p.tanggal_rilis?' · '+new Date(p.tanggal_rilis).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):''}` : '✅ TERSEDIA'}
                              </span>
                              <span style={{fontWeight:700,fontSize:14}}>{p.nama}</span>
                              {!p.aktif && <span style={{fontFamily:'monospace',fontSize:9,color:'#555',border:'1px solid #2a2a2a',padding:'2px 6px'}}>NON-AKTIF</span>}
                            </div>
                            <div style={{color:'#666',fontSize:12,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{p.deskripsi}</div>
                            <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap' as const}}>
                              {p.diskon ? (
                                <>
                                  <span style={{fontFamily:'monospace',fontSize:11,color:'#555',textDecoration:'line-through'}}>Rp{Number(p.harga_asli).toLocaleString('id-ID')}</span>
                                  <span style={{fontFamily:'monospace',fontSize:12,fontWeight:700,color:'#ef4444'}}>Rp{Number(p.harga_diskon??p.harga_asli).toLocaleString('id-ID')}</span>
                                  <span style={{fontFamily:'monospace',fontSize:9,color:'#ef4444',border:'1px solid #ef444433',padding:'1px 6px'}}>-{p.diskon}%</span>
                                </>
                              ) : (
                                <span style={{fontFamily:'monospace',fontSize:12,fontWeight:700,color:'#e7e5e4'}}>Rp{Number(p.harga_asli).toLocaleString('id-ID')}</span>
                              )}
                              <span style={{fontFamily:'monospace',fontSize:10,color:'#444'}}>Tier: {(p.tier_access||[]).join(', ')}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          <button onClick={()=>editProdukId===p.id?setEditProdukId(null):startEditProduk(p)}
                            style={{background:'transparent',border:'1px solid #2a2a2a',color:'#666',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>EDIT</button>
                          <button onClick={()=>deleteProduk(p.id)}
                            style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>HAPUS</button>
                        </div>
                      </div>
                      {/* Inline edit form */}
                      {editProdukId===p.id && (
                        <div style={{padding:'16px 20px',background:'#111',borderTop:'1px solid #1a1a1a'}}>
                          <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:10,marginBottom:10}}>// EDIT PRODUK</div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                            {[
                              {v:editPNama,s:setEditPNama,ph:'Nama Produk'},
                              {v:editPHargaAsli,s:setEditPHargaAsli,ph:'Harga Asli (IDR)',type:'number'},
                              {v:editPDiskon,s:(v:string)=>{setEditPDiskon(v);if(editPHargaAsli&&v)setEditPHargaDiskon(String(Math.round(parseInt(editPHargaAsli)*(1-parseInt(v)/100))));},ph:'Diskon %',type:'number'},
                              {v:editPHargaDiskon,s:setEditPHargaDiskon,ph:'Harga Diskon',type:'number'},
                              {v:editPUrutan,s:setEditPUrutan,ph:'Urutan',type:'number'},
                            ].map((f,i)=>(
                              <input key={i} type={f.type||'text'} value={f.v} onChange={e=>(f.s as any)(e.target.value)} placeholder={f.ph}
                                style={{background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none'}}
                                onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                            ))}
                            <div style={{display:'flex',gap:6}}>
                              <select value={editPStatus} onChange={e=>{setEditPStatus(e.target.value as any);if(e.target.value==='tersedia')setEditPTanggalRilis('');}}
                                style={{flex:1,background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',cursor:'pointer'}}>
                                <option value="tersedia">✅ Tersedia</option>
                                <option value="preorder">⏳ Pre-order</option>
                              </select>
                              {editPStatus==='preorder' && (
                                <input type="date" value={editPTanggalRilis} onChange={e=>setEditPTanggalRilis(e.target.value)}
                                  style={{flex:1,background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none'}}
                                  onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                              )}
                            </div>
                          </div>
                          <textarea value={editPDesc} onChange={e=>setEditPDesc(e.target.value)} placeholder="Deskripsi" rows={2}
                            style={{width:'100%',background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:8}}
                            onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                          <div style={{marginBottom:8}}>
                            <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:4}}>// TIER YANG BISA ORDER</div>
                            <div style={{display:'flex',gap:10,flexWrap:'wrap' as const}}>
                              {(['trial','bronze','gold','platinum'] as const).map(t=>(
                                <label key={t} style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer',fontFamily:'monospace',fontSize:11,color:editPTierAccess.includes(t)?'#e7e5e4':'#555'}}>
                                  <input type="checkbox" checked={editPTierAccess.includes(t)} onChange={e=>{
                                    if(e.target.checked) setEditPTierAccess(prev=>[...prev,t]);
                                    else setEditPTierAccess(prev=>prev.filter(x=>x!==t));
                                  }} style={{accentColor:'#16a34a'}}/>{t.toUpperCase()}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div style={{marginBottom:8}}>
                            <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:4}}>// GAMBAR</div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              {editPGambarPreview && <img src={editPGambarPreview} alt="preview" style={{width:44,height:44,objectFit:'cover',borderRadius:6,border:'1px solid #2a2a2a'}}/>}
                              <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',background:'#0d0d0d',border:'1px solid #2a2a2a',padding:'6px 12px',fontFamily:'monospace',fontSize:10,color:'#aaa'}}>
                                {editPGambarFile?editPGambarFile.name:'📁 Ganti gambar'}
                                <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(!f)return;setEditPGambarFile(f);setEditPGambarPreview(URL.createObjectURL(f));}}/>
                              </label>
                              {editPGambarPreview && <button onClick={()=>{setEditPGambarFile(null);setEditPGambarPreview('');setEditPGambarUrl('');}} style={{background:'transparent',border:'none',color:'#ef4444',cursor:'pointer',fontSize:11}}>✕ hapus</button>}
                            </div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                            <button onClick={()=>setEditPAktif(v=>!v)}
                              style={{fontFamily:'monospace',fontSize:10,fontWeight:700,padding:'4px 14px',border:`1px solid ${editPAktif?'#16a34a':'#2a2a2a'}`,background:editPAktif?'#0a1a0e':'transparent',color:editPAktif?'#16a34a':'#555',cursor:'pointer'}}>
                              {editPAktif?'✅ AKTIF':'⛔ NON-AKTIF'}
                            </button>
                          </div>
                          <div style={{display:'flex',gap:8}}>
                            <button onClick={saveEditProduk} disabled={loading}
                              style={{background:loading?'#1a1a1a':'#16a34a',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'8px 16px',border:'none',cursor:loading?'not-allowed':'pointer'}}>
                              {loading?'MENYIMPAN...':'SIMPAN'}
                            </button>
                            <button onClick={()=>setEditProdukId(null)}
                              style={{background:'transparent',border:'1px solid #2a2a2a',color:'#666',fontFamily:'monospace',fontSize:11,padding:'8px 16px',cursor:'pointer'}}>BATAL</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Sub-tab pesanan ── */}
            {prodSubTab==='pesanan' && (
              <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
                <div style={{padding:'12px 20px',borderBottom:'1px solid #1a1a1a',display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' as const}}>
                  <span style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1}}>// PESANAN MASUK ({prodOrders.length})</span>
                  <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
                    {(['all','pending','dibayar','aktif'] as const).map(f=>(
                      <button key={f} onClick={()=>setOrderFilter(f)}
                        style={{fontFamily:'monospace',fontSize:10,fontWeight:700,padding:'4px 10px',border:`1px solid ${orderFilter===f?'#16a34a':'#2a2a2a'}`,background:orderFilter===f?'#0a1a0e':'transparent',color:orderFilter===f?'#16a34a':'#555',cursor:'pointer'}}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <input value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="🔍 Cari nama member..."
                    style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'6px 12px',fontSize:12,fontFamily:'monospace',outline:'none',width:180}}
                    onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                </div>
                {(()=>{
                  const filtered = prodOrders
                    .filter(o=>orderFilter==='all'||o.status===orderFilter)
                    .filter(o=>!orderSearch||o.nama_member?.toLowerCase().includes(orderSearch.toLowerCase()));
                  if (!filtered.length) return <div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— BELUM ADA PESANAN —</div>;
                  return filtered.map(o=>{
                    const sc = o.status==='aktif'?'#16a34a':o.status==='dibayar'?'#3b82f6':'#eab308';
                    return (
                      <div key={o.id} style={{borderBottom:'1px solid #111',padding:'14px 20px',display:'flex',gap:16,alignItems:'flex-start',flexWrap:'wrap' as const}}>
                        <div style={{flex:1,minWidth:180}}>
                          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap' as const}}>
                            <span style={{fontFamily:'monospace',fontSize:9,color:sc,border:`1px solid ${sc}44`,padding:'2px 8px',fontWeight:700}}>{o.status.toUpperCase()}</span>
                            <span style={{fontWeight:700,fontSize:13}}>{o.nama_member}</span>
                            <span style={{fontFamily:'monospace',fontSize:10,color:'#555'}}>· {o.tier_member}</span>
                          </div>
                          <div style={{fontFamily:'monospace',fontSize:11,color:'#888',marginBottom:2}}>📦 {(o as any).products?.nama||'—'}</div>
                          <div style={{fontFamily:'monospace',fontSize:10,color:'#444'}}>{new Date(o.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
                          {o.catatan&&<div style={{fontFamily:'monospace',fontSize:10,color:'#666',marginTop:4,fontStyle:'italic'}}>Catatan: {o.catatan}</div>}
                        </div>
                        <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                          <textarea value={orderCatatanMap[o.id]??o.catatan??''} onChange={e=>setOrderCatatanMap(prev=>({...prev,[o.id]:e.target.value}))} placeholder="Catatan (opsional)" rows={1}
                            style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'6px 10px',fontSize:11,fontFamily:'monospace',outline:'none',resize:'none',width:140}}/>
                          <select value={o.status} onChange={e=>updateOrderStatus(o.id, e.target.value)}
                            style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'6px 10px',fontSize:11,fontFamily:'monospace',outline:'none',cursor:'pointer'}}>
                            <option value="pending">Pending</option>
                            <option value="dibayar">Dibayar</option>
                            <option value="aktif">Aktif</option>
                          </select>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}
```

### Step 1.6 — Verifikasi admin side

- [ ] Jalankan `npm run dev`
- [ ] Buka `/admin`, masuk sebagai admin
- [ ] Klik tab **Produk** di sidebar (harus muncul, delegasi ke AdminPage)
- [ ] Cek sub-tab katalog: form tambah muncul, list kosong dengan teks "BELUM ADA PRODUK"
- [ ] Tambah satu produk test: isi nama, harga, pilih status "tersedia", klik tambah — pastikan `notify` muncul dan produk tampil di list
- [ ] Test edit produk: klik EDIT, ubah nama, simpan — pastikan update
- [ ] Tambah produk kedua dengan status "pre-order": date picker tanggal rilis harus muncul
- [ ] Pindah ke sub-tab "Pesanan Masuk": tampil tabel kosong

- [ ] Commit:

```bash
git add src/pages/AdminPage.tsx
git commit -m "feat: tambah tab produk indikator di admin panel (katalog + pesanan)"
```

---

## Task 2: Member — Tab Produk di DashboardPage

**Files:**
- Modify: `src/pages/member/DashboardPage.tsx`

### Step 2.1 — Tambah `produk` ke SIDEBAR

- [ ] Di array `SIDEBAR` (baris 21–42), tambahkan item `produk` setelah `tools`:

```ts
  { id: 'tools',   label: 'Broker',         icon: '🏦' },
  { id: 'produk',  label: 'Produk',         icon: '🛍️' },  // ← tambah ini
  { id: 'sep1',    label: 'TOOLS & PROGRESS', icon: '', separator: true },
```

### Step 2.2 — Tambah state variables produk di DashboardPage

- [ ] Tambahkan setelah state variables broker yang ada (cari `const [brokers, setBrokers]`):

```ts
  const [products, setProducts]         = useState<any[]>([]);
  const [myOrders, setMyOrders]         = useState<any[]>([]);
  const [prodView, setProdView]         = useState<'katalog'|'pesanan'>('katalog');
  const [orderModal, setOrderModal]     = useState<any|null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
```

### Step 2.3 — Load produk & pesanan di `loadData(m)`

- [ ] Di dalam fungsi `loadData(m)` (baris ≈ 494), tambahkan dua query ke dalam array `Promise.all` yang sudah ada. Cari baris:
  ```ts
  const [vidRes, fileRes, annRes, progRes, brokerRes, schedRes, notifRes, advRes, rulesRes] = await Promise.all([
  ```
  Dan tambahkan dua query baru di akhir array:
  ```ts
  const [vidRes, fileRes, annRes, progRes, brokerRes, schedRes, notifRes, advRes, rulesRes, prodRes, ordersRes] = await Promise.all([
    // ... semua query yang sudah ada ...,
    supabase.from('products').select('*').eq('aktif', true).order('urutan', { ascending: true }),
    supabase.from('orders').select('*, products(nama,harga_asli,harga_diskon)').eq('member_id', m.id).order('created_at', { ascending: false }),
  ]);
  ```
  Lalu tambahkan setter-nya di bawah:
  ```ts
  if (prodRes.data)   setProducts(prodRes.data);
  if (ordersRes.data) setMyOrders(ordersRes.data);
  ```

### Step 2.4 — Tambah real-time subscription untuk orders

- [ ] Di dalam `useEffect` yang berisi channel `member-updates-${member.id}` (baris ≈ 407), tambahkan satu `.on()` baru sebelum `.subscribe()`:

```ts
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `member_id=eq.${member.id}` },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'dibayar') addMemberToast('💰 Pembayaran produk kamu DIKONFIRMASI oleh admin!', 'success');
          else if (newStatus === 'aktif') addMemberToast('✅ Produk kamu sekarang AKTIF! Cek tab Produk → Pesanan Saya.', 'success');
          supabase.from('orders').select('*, products(nama,harga_asli,harga_diskon)').eq('member_id', member.id).order('created_at', { ascending: false })
            .then(({ data }) => { if (data) setMyOrders(data); });
        }
      )
```

### Step 2.5 — Tambah helper `normalizeTier` dan fungsi `buatOrder`

- [ ] Tambahkan setelah fungsi `addMemberToast` (baris ≈ 403):

```ts
  function normalizeTier(tier: string): string {
    const t = (tier || '').toLowerCase();
    if (t.includes('platinum')) return 'platinum';
    if (t.includes('gold'))     return 'gold';
    if (t.includes('bronze'))   return 'bronze';
    return 'trial';
  }

  async function buatOrder(produk: any) {
    if (!member) return;
    setOrderLoading(true);
    const harga = produk.harga_diskon ?? produk.harga_asli;
    const { data, error } = await supabase.from('orders').insert({
      product_id:   produk.id,
      member_id:    member.id,
      nama_member:  member.nama,
      email_member: (member as any).email || '',
      tier_member:  member.tier,
      status:       'pending',
    }).select().single();
    setOrderLoading(false);
    if (error) { addMemberToast('Gagal membuat order: ' + error.message, 'error'); return; }
    setMyOrders(prev => [{ ...data, products: produk }, ...prev]);
    setOrderModal(null);
    const tipe = produk.status === 'preorder' ? 'pre-order' : 'membeli';
    const pesan = encodeURIComponent(`Halo, saya ${member.nama} ingin ${tipe} produk *${produk.nama}* seharga Rp${harga.toLocaleString('id-ID')}.\nOrder ID: ${data.id}`);
    window.open(`https://wa.me/6281242224939?text=${pesan}`, '_blank');
  }
```

### Step 2.6 — Tambah UI tab produk

- [ ] Tambahkan blok berikut setelah penutup `{active === '1on1' && (...)}` (cari baris `{active === '1on1' && (() => {`):

```tsx
          {active === 'produk' && (
            <div className="mr-content-pad" style={{ padding: 24 }}>
              {/* Header + toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>// TOKO PRODUK</div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Produk Indikator</h2>
                  <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Indikator TradingView eksklusif dari Menolak Rugi.</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['katalog','pesanan'] as const).map(v => (
                    <button key={v} onClick={() => setProdView(v)}
                      style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, padding: '7px 18px', border: `1px solid ${prodView === v ? G.gold : C.border}`, background: prodView === v ? 'var(--mr-tint-gold)' : 'transparent', color: prodView === v ? G.gold : C.muted, cursor: 'pointer', borderRadius: 8 }}>
                      {v === 'katalog' ? '📦 Katalog' : '🧾 Pesanan Saya'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Katalog ── */}
              {prodView === 'katalog' && (
                <>
                  {!products.length && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>
                      Belum ada produk tersedia saat ini.
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                    {products.map(p => {
                      const tierMember = normalizeTier(member?.tier || '');
                      const bisaOrder  = (p.tier_access || []).includes(tierMember);
                      const harga      = p.harga_diskon ?? p.harga_asli;
                      const tglRilis   = p.tanggal_rilis ? new Date(p.tanggal_rilis).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
                      return (
                        <div key={p.id} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                          {/* Gambar */}
                          <div style={{ height: 160, background: C.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {p.gambar_url
                              ? <img src={p.gambar_url} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                              : <span style={{ fontSize: 48 }}>📊</span>
                            }
                          </div>
                          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
                            {/* Badge status */}
                            <div>
                              {p.status === 'preorder'
                                ? <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: '#eab308', background: '#1a150033', border: '1px solid #eab30844', padding: '3px 10px', borderRadius: 6 }}>
                                    ⏳ PRE-ORDER{tglRilis ? ` · Rilis ${tglRilis}` : ''}
                                  </span>
                                : <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: C.up, background: 'var(--mr-tint-up)', border: '1px solid var(--mr-up-dim)', padding: '3px 10px', borderRadius: 6 }}>
                                    ✅ TERSEDIA
                                  </span>
                              }
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{p.nama}</div>
                            <div style={{ color: C.dim, fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.deskripsi}</div>
                            {/* Harga */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {p.diskon ? (
                                <>
                                  <span style={{ fontFamily: C.mono, fontSize: 12, color: C.muted, textDecoration: 'line-through' }}>Rp{Number(p.harga_asli).toLocaleString('id-ID')}</span>
                                  <span style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700, color: C.down }}>Rp{Number(harga).toLocaleString('id-ID')}</span>
                                  <span style={{ fontFamily: C.mono, fontSize: 10, color: C.down, border: `1px solid ${C.down}44`, padding: '2px 7px', borderRadius: 4 }}>-{p.diskon}%</span>
                                </>
                              ) : (
                                <span style={{ fontFamily: C.mono, fontSize: 16, fontWeight: 700, color: C.text }}>Rp{Number(p.harga_asli).toLocaleString('id-ID')}</span>
                              )}
                            </div>
                            {/* Tombol */}
                            <div style={{ marginTop: 'auto' }}>
                              {!bisaOrder ? (
                                <button disabled style={{ width: '100%', padding: '10px', fontFamily: C.mono, fontSize: 12, fontWeight: 700, background: C.sidebar, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'not-allowed' }}>
                                  🔒 Upgrade Tier untuk Order
                                </button>
                              ) : (
                                <button onClick={() => setOrderModal(p)}
                                  style={{ width: '100%', padding: '10px', fontFamily: C.mono, fontSize: 12, fontWeight: 700, background: p.status === 'preorder' ? 'var(--mr-tint-gold)' : G.gold, color: p.status === 'preorder' ? G.gold : '#000', border: `1px solid ${p.status === 'preorder' ? G.gold : 'transparent'}`, borderRadius: 8, cursor: 'pointer' }}>
                                  {p.status === 'preorder' ? '⏳ Pre-order Sekarang' : '🛒 Beli Sekarang'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Pesanan Saya ── */}
              {prodView === 'pesanan' && (
                <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  {!myOrders.length
                    ? <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted, fontFamily: C.mono, fontSize: 13 }}>Belum ada pesanan.</div>
                    : myOrders.map(o => {
                        const sc = o.status === 'aktif' ? C.up : o.status === 'dibayar' ? '#3b82f6' : '#eab308';
                        const label = o.status === 'aktif' ? 'Aktif' : o.status === 'dibayar' ? 'Dibayar' : 'Pending';
                        return (
                          <div key={o.id} style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 160 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{(o as any).products?.nama || '—'}</div>
                              <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted }}>
                                {new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                              {o.catatan && <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, marginTop: 4 }}>💬 {o.catatan}</div>}
                            </div>
                            <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: sc, border: `1px solid ${sc}44`, padding: '4px 12px', borderRadius: 20, flexShrink: 0 }}>
                              {label}
                            </span>
                          </div>
                        );
                      })
                  }
                </div>
              )}

              {/* ── Modal order konfirmasi ── */}
              {orderModal && (
                <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                  onClick={e => { if (e.target === e.currentTarget) setOrderModal(null); }}>
                  <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, maxWidth: 400, width: '100%' }}>
                    <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 12 }}>// KONFIRMASI ORDER</div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{orderModal.nama}</div>
                    <div style={{ color: C.dim, fontSize: 13, marginBottom: 16 }}>{orderModal.deskripsi}</div>
                    {orderModal.status === 'preorder' && orderModal.tanggal_rilis && (
                      <div style={{ background: '#1a150033', border: '1px solid #eab30833', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: C.mono, fontSize: 12, color: '#eab308' }}>
                        ⏳ Produk tersedia pada: {new Date(orderModal.tanggal_rilis).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                    <div style={{ fontFamily: C.mono, fontSize: 20, fontWeight: 700, color: G.gold, marginBottom: 20 }}>
                      Rp{Number(orderModal.harga_diskon ?? orderModal.harga_asli).toLocaleString('id-ID')}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => buatOrder(orderModal)} disabled={orderLoading}
                        style={{ flex: 1, padding: '12px', fontFamily: C.mono, fontSize: 13, fontWeight: 700, background: G.gold, color: '#000', border: 'none', borderRadius: 10, cursor: orderLoading ? 'not-allowed' : 'pointer', opacity: orderLoading ? 0.6 : 1 }}>
                        {orderLoading ? 'Memproses...' : orderModal.status === 'preorder' ? '⏳ Pre-order & Chat WA' : '✅ Order & Chat WA'}
                      </button>
                      <button onClick={() => setOrderModal(null)}
                        style={{ padding: '12px 20px', fontFamily: C.mono, fontSize: 13, background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer' }}>
                        Batal
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
```

### Step 2.7 — Verifikasi member side

- [ ] Pastikan dev server masih berjalan (`npm run dev`)
- [ ] Login sebagai member, buka dashboard
- [ ] Tab **Produk** (🛍️) harus muncul di sidebar
- [ ] Klik tab Produk: katalog muncul dengan produk yang sudah ditambahkan admin
- [ ] Klik "Beli Sekarang" pada produk tersedia: modal konfirmasi muncul
- [ ] Klik konfirmasi: order masuk ke tabel `orders` (cek di Supabase), WA terbuka di tab baru dengan pesan pre-fill
- [ ] Pindah ke "Pesanan Saya": order yang baru dibuat tampil dengan status "Pending"
- [ ] Di admin (sub-tab pesanan), ubah status order ke "Dibayar" — member harus menerima toast real-time

- [ ] Commit:

```bash
git add src/pages/member/DashboardPage.tsx
git commit -m "feat: tambah tab produk di member dashboard (katalog, order, pesanan saya)"
```

---

## Task 3: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] Di bagian "Key tables", tambahkan `products`, `orders` ke daftar tabel
- [ ] Di bagian "Member Dashboard Tabs", tambahkan `produk` (🛍️ Produk) setelah `tools`
- [ ] Di bagian "Key Files / SQL migrations", tambahkan baris:
  ```
  | `supabase-products-migration.sql` | Schema tabel `products` dan `orders` untuk fitur produk indikator |
  ```

- [ ] Commit:

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md — tambah fitur produk indikator"
```

---

## Checklist Akhir

- [ ] Admin bisa tambah, edit, hapus produk — tersedia dan pre-order dengan tanggal rilis
- [ ] Admin bisa lihat pesanan masuk, filter status, update status + catatan
- [ ] Member melihat katalog produk (hanya `aktif = true`)
- [ ] Tier check benar: tombol locked jika tier tidak ada di `tier_access`
- [ ] Klik beli → modal → konfirmasi → order tersimpan di DB → WA terbuka dengan pesan pre-fill
- [ ] Pesanan Saya menampilkan riwayat dengan status badge
- [ ] Real-time toast muncul saat admin update status order
- [ ] `npm run typecheck` lulus tanpa error baru
