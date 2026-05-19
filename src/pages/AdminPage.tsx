import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Users, Video, ArrowLeft, Eye, EyeOff, Upload, RefreshCw, ChevronUp, ChevronDown, CheckCircle, XCircle, KeyRound, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TIERS = ['SMC Trial', 'SMC Bronze', 'SMC Gold Mentorship', 'SMC Platinum 1 on 1'];

interface Admin { id: string; username: string; password: string; role: string; }
interface Member { id: string; nama: string; tier: string; password: string; is_active: boolean; is_advance: boolean; last_seen?: string; discord_id?: string; discord_username?: string; }
interface VideoItem { id: string; judul: string; deskripsi: string; youtube_url: string; tier_akses: string[]; level: string; urutan: number; }
interface AdvanceRequest { id: string; member_id: string; member_nama: string; member_tier: string; status: string; alasan_tolak: string | null; created_at: string; }

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}



// ─── VideoMateriTab component ─────────────────────────────────────────────────
// ─── VideoMateriTab component ─────────────────────────────────────────────────
function VideoMateriTab({ videos, loadData, addVideo, uploadFile, deleteVideo, deleteFile, loading, vJudul, setVJudul, vDesc, setVDesc, vUrl, setVUrl, vUrutan, setVUrutan, vKategori, setVKategori, vLevel, setVLevel, csUploadRef, csFile, setCsFile, fJudul, setFJudul, fUrutan, setFUrutan, fKategori, setFKategori, fileUploadRef, fFile, setFFile }: any) {
  const [subTab, setSubTab] = useState<'video'|'file'>('video');
  const [search, setSearch]           = useState('');
  const [filterKat, setFilterKat]     = useState('all');
  const [page, setPage]               = useState(1);
  const [showForm, setShowForm]       = useState(false);

  // Edit state - local
  const [editId, setEditId]           = useState<string|null>(null);
  const [editJudul, setEditJudul]     = useState('');
  const [editDesc, setEditDesc]       = useState('');
  const [editUrl, setEditUrl]         = useState('');
  const [editKat, setEditKat]         = useState('');
  const [editUrutan, setEditUrutan]   = useState('');
  const [editIsFile, setEditIsFile]   = useState(false);

  const PER_PAGE = 10;
  const CATS = [
    { id:'intro',         label:'Intro',         color:'#eab308' },
    { id:'basic',         label:'Basic',         color:'#22ab94' },
    { id:'tips-basic',    label:'Tips Basic',    color:'#22ab94' },
    { id:'advanced',      label:'Advanced',      color:'#a855f7' },
    { id:'tips-advanced', label:'Tips Adv',      color:'#a855f7' },
    { id:'file-basic',    label:'File Basic',    color:'#3b82f6' },
    { id:'file-advanced', label:'File Adv',      color:'#3b82f6' },
  ];
  const catColor = (id: string) => CATS.find(c=>c.id===id)?.color||'#666';
  const catLabel = (id: string) => CATS.find(c=>c.id===id)?.label||id;

  function startEdit(v: any, isFile: boolean) {
    setEditId(v.id);
    setEditJudul(v.judul||'');
    setEditDesc(v.deskripsi||'');
    setEditUrl(v.youtube_url||v.file_url||'');
    setEditKat(v.kategori||'');
    setEditUrutan(String(v.urutan||0));
    setEditIsFile(isFile);
  }

  async function saveEdit() {
    if (!editId || !editJudul) return;
    const table = editIsFile ? 'files' : 'videos';
    const updates: any = { judul: editJudul, deskripsi: editDesc, kategori: editKat, urutan: parseInt(editUrutan)||0 };
    if (!editIsFile) updates.youtube_url = editUrl;
    await supabase.from(table).update(updates).eq('id', editId);
    setEditId(null);
    loadData();
  }

  const allItems = videos || [];
  const vidItems  = allItems.filter((v: any) => !v.kategori?.startsWith('file-'));
  const fileItems = allItems.filter((v: any) =>  v.kategori?.startsWith('file-'));
  const base = subTab==='video' ? vidItems : fileItems;
  const filtered = base.filter((v: any) =>
    (filterKat==='all' || v.kategori===filterKat) &&
    (!search || v.judul?.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const inp: React.CSSProperties = { background:'#111', border:'1px solid #2a2a2a', color:'#e7e5e4', padding:'8px 12px', fontSize:12, fontFamily:'monospace', outline:'none' };
  const btn = (active?: boolean, color = '#eab308'): React.CSSProperties => ({
    fontFamily:'monospace', fontSize:11, fontWeight:700, padding:'6px 14px',
    border:`1px solid ${active?color:'#2a2a2a'}`,
    background: active ? (color==='#eab308'?'#1a1500':color==='#3b82f6'?'#0a0f1a':'#0a1a0a') : 'transparent',
    color: active ? color : '#555', cursor:'pointer'
  });

  return (
    <div style={{padding:20, display:'flex', flexDirection:'column', gap:16}}>
      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h2 style={{fontSize:20, fontWeight:700, margin:0}}>Video & Materi</h2>
          <p style={{color:'#666', fontSize:12, margin:'4px 0 0'}}>Kelola semua materi pembelajaran untuk member.</p>
        </div>
        <button onClick={()=>setShowForm(f=>!f)}
          style={{background:'#eab308', color:'#000', fontFamily:'monospace', fontSize:12, fontWeight:700, padding:'10px 18px', border:'none', cursor:'pointer'}}>
          {showForm ? '✕ TUTUP' : '+ TAMBAH MATERI'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{background:'#0d0d0d', border:'1px solid #2a2a2a', padding:'20px'}}>
          <div style={{display:'flex', gap:6, marginBottom:12}}>
            {(['video','file'] as const).map(t=>(
              <button key={t} onClick={()=>setSubTab(t)} style={btn(subTab===t)}>{t==='video'?'VIDEO':'FILE MATERI'}</button>
            ))}
          </div>
          {subTab==='video' ? (
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <div style={{display:'flex', gap:6, flexWrap:'wrap' as const}}>
                {[{id:'intro',l:'Intro'},{id:'basic',l:'Basic'},{id:'tips-basic',l:'Tips Basic'},{id:'advanced',l:'Advanced'},{id:'tips-advanced',l:'Tips Adv'}].map(k=>(
                  <button key={k.id} onClick={()=>{setVKategori(k.id);setVLevel(k.id.includes('adv')?'advanced':'basic');}} style={btn(vKategori===k.id)}>{k.l}</button>
                ))}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:8}}>
                <input value={vJudul} onChange={e=>setVJudul(e.target.value)} placeholder="Judul video" style={inp}
                  onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <input value={vUrl} onChange={e=>setVUrl(e.target.value)} placeholder="URL YouTube" style={inp}
                  onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <input value={vUrutan} onChange={e=>setVUrutan(e.target.value)} placeholder="Urutan" type="number" style={inp}/>
              </div>
              <textarea value={vDesc} onChange={e=>setVDesc(e.target.value)} placeholder="Deskripsi (opsional)" rows={2}
                style={{...inp, resize:'vertical' as const, width:'100%', boxSizing:'border-box' as const}}/>
              <div style={{background:'#111', border:'1px dashed #3a2a00', padding:'10px 12px'}}>
                <div style={{fontFamily:'monospace', color:'#eab308', fontSize:10, marginBottom:6}}>COMING SOON IMAGE</div>
                <input ref={csUploadRef} type="file" accept="image/*" onChange={e=>setCsFile(e.target.files?.[0]||null)} style={{fontSize:11,color:'#666',fontFamily:'monospace'}}/>
              </div>
              <button onClick={addVideo} disabled={loading} style={{...btn(true), alignSelf:'flex-start' as const}}>{loading?'MENYIMPAN...':'+ TAMBAH VIDEO'}</button>
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <div style={{display:'flex', gap:6}}>
                {[{id:'file-basic',l:'File Basic'},{id:'file-advanced',l:'File Advanced'}].map(k=>(
                  <button key={k.id} onClick={()=>setFKategori(k.id)} style={btn(fKategori===k.id,'#3b82f6')}>{k.l}</button>
                ))}
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 80px', gap:8}}>
                <input value={fJudul} onChange={e=>setFJudul(e.target.value)} placeholder="Judul file" style={inp}
                  onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <input value={fUrutan} onChange={e=>setFUrutan(e.target.value)} placeholder="Urutan" type="number" style={inp}/>
              </div>
              <input ref={fileUploadRef} type="file" onChange={e=>setFFile(e.target.files?.[0]||null)} style={{fontSize:12,color:'#666',fontFamily:'monospace'}}/>
              {fFile && <div style={{fontFamily:'monospace',color:'#3b82f6',fontSize:11}}>▸ {fFile.name}</div>}
              <button onClick={uploadFile} disabled={loading} style={{...btn(true,'#3b82f6'), alignSelf:'flex-start' as const}}>{loading?'MENGUPLOAD...':'↑ UPLOAD FILE'}</button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10}}>
        {[
          { l:'TOTAL VIDEO',  v:vidItems.length,  c:'#e7e5e4', sub:'Semua video' },
          { l:'TOTAL FILE',   v:fileItems.length, c:'#e7e5e4', sub:'Semua file' },
          { l:'TOTAL MATERI', v:allItems.length,  c:'#e7e5e4', sub:'Video+File' },
          { l:'TERPUBLISH',   v:vidItems.filter((v:any)=>v.youtube_url).length+fileItems.length, c:'#22ab94', sub:'Aktif' },
          { l:'COMING SOON',  v:vidItems.filter((v:any)=>!v.youtube_url).length, c:'#eab308', sub:'Belum publish' },
        ].map((s,i)=>(
          <div key={i} style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'14px 16px'}}>
            <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:28,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontFamily:'monospace',color:'#333',fontSize:10,marginTop:4}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Sub tabs */}
      <div style={{display:'flex', borderBottom:'1px solid #1f1f1f'}}>
        {[{id:'video',l:'Video'},{id:'file',l:'File Materi'}].map(t=>(
          <button key={t.id} onClick={()=>{setSubTab(t.id as any);setPage(1);setFilterKat('all');setEditId(null);}}
            style={{fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'9px 20px',border:'none',background:'transparent',color:subTab===t.id?'#eab308':'#555',cursor:'pointer',borderBottom:subTab===t.id?'2px solid #eab308':'2px solid transparent'}}>
            {t.l} <span style={{fontSize:10,color:'#444',marginLeft:4}}>({t.id==='video'?vidItems.length:fileItems.length})</span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' as const}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="🔍 Cari judul materi..."
          style={{flex:'1 1 200px',...inp}}
          onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
        <select value={filterKat} onChange={e=>{setFilterKat(e.target.value);setPage(1);}}
          style={{...inp, cursor:'pointer'}}>
          <option value="all">Semua Kategori</option>
          {CATS.filter(c=>subTab==='video'?!c.id.startsWith('file-'):c.id.startsWith('file-')).map(c=>(
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <button onClick={()=>{setSearch('');setFilterKat('all');setPage(1);}} style={btn()}>↺ Reset</button>
        <span style={{fontFamily:'monospace',color:'#444',fontSize:10,marginLeft:'auto'}}>{filtered.length}/{base.length} materi</span>
      </div>

      {/* Table */}
      <div style={{background:'#0d0d0d', border:'1px solid #1f1f1f'}}>
        <div style={{display:'grid',gridTemplateColumns:'32px 44px 1fr 130px 70px 80px',padding:'8px 16px',borderBottom:'1px solid #1a1a1a',fontFamily:'monospace',color:'#444',fontSize:10,letterSpacing:0.5}}>
          <span>#</span><span></span><span>JUDUL MATERI</span><span>KATEGORI</span><span>URUTAN</span><span>AKSI</span>
        </div>
        {paged.length===0 && (
          <div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— TIDAK ADA MATERI —</div>
        )}
        {paged.map((v: any, i: number) => {
          const isFile = v.kategori?.startsWith('file-');
          const ytId = v.youtube_url?.match(/(?:youtu\.be\/|v=)([^&?/\s]+)/)?.[1];
          const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/default.jpg` : null;
          const isEditing = editId === v.id;
          return (
            <React.Fragment key={v.id}>
              {/* Row */}
              <div style={{display:'grid',gridTemplateColumns:'32px 44px 1fr 130px 70px 80px',padding:'10px 16px',borderBottom: isEditing?'none':'1px solid #111',alignItems:'center',fontSize:12,background:isEditing?'#0a0a0a':'transparent'}}>
                <span style={{fontFamily:'monospace',color:'#333',fontSize:10}}>{(page-1)*PER_PAGE+i+1}</span>
                <div style={{width:38,height:28,background:'#111',overflow:'hidden'}}>
                  {thumb && <img src={thumb} alt="" style={{width:'100%',height:'100%',objectFit:'cover' as const}}/>}
                  {!thumb && <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#333'}}>{isFile?'📄':'▶'}</div>}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{v.judul}</div>
                  {v.deskripsi && <div style={{fontSize:11,color:'#555',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{v.deskripsi}</div>}
                  {!v.youtube_url&&!isFile && <span style={{fontFamily:'monospace',fontSize:9,background:'#1a1500',color:'#eab308',padding:'1px 5px'}}>COMING SOON</span>}
                </div>
                <span style={{fontFamily:'monospace',fontSize:10,color:catColor(v.kategori)}}>{catLabel(v.kategori)}</span>
                <span style={{fontFamily:'monospace',color:'#555',fontSize:11}}>{v.urutan}</span>
                <div style={{display:'flex',gap:4}}>
                  <button onClick={()=>isEditing?setEditId(null):startEdit(v,isFile)}
                    style={{background:isEditing?'#1a1500':'transparent',border:`1px solid ${isEditing?'#eab308':'#2a2a2a'}`,color:isEditing?'#eab308':'#aaa',fontSize:12,padding:'4px 8px',cursor:'pointer'}}>
                    {isEditing?'✕':'✏'}
                  </button>
                  <button onClick={()=>isFile?deleteFile(v.id,v.file_url):deleteVideo(v.id,v.coming_soon_image_url)}
                    style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontSize:12,padding:'4px 8px',cursor:'pointer'}}>✕</button>
                </div>
              </div>
              {/* Inline edit form */}
              {isEditing && (
                <div style={{padding:'16px 20px',background:'#0a0a0a',borderBottom:'1px solid #1a1a1a'}}>
                  <div style={{fontFamily:'monospace',color:isFile?'#3b82f6':'#eab308',fontSize:10,marginBottom:10}}>
                    // EDIT {isFile?'FILE':'VIDEO'}: {v.judul}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:8,marginBottom:8}}>
                    <input value={editJudul} onChange={e=>setEditJudul(e.target.value)} placeholder="Judul"
                      style={inp} onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    {!isFile && (
                      <input value={editUrl} onChange={e=>setEditUrl(e.target.value)} placeholder="URL YouTube"
                        style={inp} onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    )}
                    <input value={editUrutan} onChange={e=>setEditUrutan(e.target.value)} placeholder="Urutan" type="number" style={inp}/>
                  </div>
                  {!isFile && (
                    <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} placeholder="Deskripsi" rows={2}
                      style={{...inp,width:'100%',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:8}}/>
                  )}
                  <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:8}}>
                    {CATS.filter(c=>isFile?c.id.startsWith('file-'):!c.id.startsWith('file-')).map(k=>(
                      <button key={k.id} onClick={()=>setEditKat(k.id)}
                        style={btn(editKat===k.id, k.color)}>{k.label}</button>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={saveEdit} disabled={loading}
                      style={{background:isFile?'#3b82f6':'#eab308',color:isFile?'#fff':'#000',fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'7px 16px',border:'none',cursor:'pointer'}}>
                      SIMPAN
                    </button>
                    <button onClick={()=>setEditId(null)}
                      style={{background:'transparent',color:'#666',fontFamily:'monospace',fontSize:11,padding:'7px 12px',border:'1px solid #2a2a2a',cursor:'pointer'}}>
                      BATAL
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages>1 && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontFamily:'monospace',fontSize:11,color:'#555'}}>
          <span>Menampilkan {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} dari {filtered.length}</span>
          <div style={{display:'flex',gap:4}}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
              style={{background:'transparent',border:'1px solid #2a2a2a',color:page===1?'#333':'#666',padding:'4px 10px',cursor:'pointer',fontFamily:'monospace',fontSize:11}}>‹</button>
            {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)}
                style={{background:page===p?'#eab308':'transparent',border:`1px solid ${page===p?'#eab308':'#2a2a2a'}`,color:page===p?'#000':'#666',padding:'4px 10px',cursor:'pointer',fontFamily:'monospace',fontSize:11,fontWeight:page===p?700:400}}>{p}</button>
            ))}
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              style={{background:'transparent',border:'1px solid #2a2a2a',color:page===totalPages?'#333':'#666',padding:'4px 10px',cursor:'pointer',fontFamily:'monospace',fontSize:11}}>›</button>
          </div>
        </div>
      )}

      {/* Penempatan panel */}
      <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'16px'}}>
        <div style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1,marginBottom:12}}>// PENEMPATAN MATERI</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>
          {CATS.map(cat=>{
            const count = allItems.filter((v:any)=>v.kategori===cat.id).length;
            return (
              <div key={cat.id} style={{background:'#111',border:'1px solid #1a1a1a',padding:'10px',textAlign:'center' as const}}>
                <div style={{fontFamily:'monospace',color:cat.color,fontSize:10,marginBottom:4}}>{cat.label}</div>
                <div style={{fontWeight:700,fontSize:18,color:cat.color}}>{count}</div>
                <div style={{fontFamily:'monospace',color:'#333',fontSize:9,marginTop:2}}>{cat.id.startsWith('file-')?'File':'Materi'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



// ─── MemberTable component ────────────────────────────────────────────────────
function MemberTable({ members, loadData }: { members: any[]; loadData: () => void }) {
  const [search, setSearch]         = useState('');
  const [filterLevel, setLevel]     = useState<'all'|'basic'|'advance'>('all');
  const [filterTier, setTier]       = useState('all');
  const [showPass, setShowPass]     = useState<string|null>(null);
  const [editId, setEditId]         = useState<string|null>(null);
  const [editNama, setEditNama]     = useState('');
  const [editTier, setEditTier]     = useState('');
  const [editPass, setEditPass]     = useState('');
  const [progress, setProgress]     = useState<Record<string,number>>({});

  const uniqueTiers = Array.from(new Set(members.map((m:any) => m.tier).filter(Boolean))).sort() as string[];

  const basicMembers   = members.filter((m:any) => !m.is_advance);
  const advanceMembers = members.filter((m:any) => m.is_advance);

  useEffect(() => {
    supabase.from('member_progress_summary').select('member_id,progress_pct')
      .then(({ data }) => {
        if (data) {
          const map: Record<string,number> = {};
          data.forEach((d:any) => { map[d.member_id] = parseFloat(d.progress_pct)||0; });
          setProgress(map);
        }
      }).catch(()=>{});
  }, [members]);

  const filtered = members.filter((m:any) =>
    (filterLevel === 'all' || (filterLevel === 'basic' ? !m.is_advance : m.is_advance)) &&
    (filterTier === 'all' || m.tier === filterTier) &&
    (!search || m.nama?.toLowerCase().includes(search.toLowerCase()))
  );

  async function saveEdit(id: string) {
    const updates: any = {};
    if (editNama) updates.nama = editNama;
    if (editTier) updates.tier = editTier;
    if (editPass) updates.password = editPass;
    await supabase.from('members').update(updates).eq('id', id);
    setEditId(null); loadData();
  }

  const inp: React.CSSProperties = {
    background:'#111', border:'1px solid #2a2a2a', color:'#e7e5e4',
    padding:'8px 12px', fontSize:12, fontFamily:'monospace', outline:'none'
  };

  const tierCount = members.reduce((acc:any, m:any) => {
    acc[m.tier] = (acc[m.tier]||0) + 1; return acc;
  }, {} as Record<string,number>);

  const onlineCount = members.filter((m:any) => m.last_seen && (Date.now()-new Date(m.last_seen).getTime())<5*60*1000).length;

  return (
    <div style={{display:'flex',flexDirection:'column' as const,gap:14}}>

      {/* Stats row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {[
          { l:'TOTAL MEMBER',   v:members.length,        c:'#e7e5e4' },
          { l:'BASIC',          v:basicMembers.length,   c:'#22ab94' },
          { l:'ADVANCE',        v:advanceMembers.length, c:'#eab308' },
          { l:'ONLINE SEKARANG',v:onlineCount,           c:'#22ab94' },
        ].map((s,i)=>(
          <div key={i} style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'14px 16px'}}>
            <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'14px 16px',display:'flex',gap:8,flexWrap:'wrap' as const,alignItems:'center'}}>

        {/* Basic / Advance toggle */}
        <div style={{display:'flex',gap:4}}>
          {[
            { id:'all',     label:`SEMUA (${members.length})`,          active: filterLevel==='all'     },
            { id:'basic',   label:`BASIC (${basicMembers.length})`,     active: filterLevel==='basic'   },
            { id:'advance', label:`ADVANCE (${advanceMembers.length})`, active: filterLevel==='advance' },
          ].map(f=>(
            <button key={f.id} onClick={()=>setLevel(f.id as any)}
              style={{fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'6px 14px',
                border:`1px solid ${f.active ? (f.id==='advance'?'#eab308':f.id==='basic'?'#22ab94':'#666') : '#2a2a2a'}`,
                background:f.active ? (f.id==='advance'?'#1a1500':f.id==='basic'?'#0a1a14':'#181818') : 'transparent',
                color:f.active ? (f.id==='advance'?'#eab308':f.id==='basic'?'#22ab94':'#e7e5e4') : '#555',
                cursor:'pointer'}}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{width:1,height:22,background:'#2a2a2a'}}/>

        {/* Tier filter */}
        <select value={filterTier} onChange={e=>setTier(e.target.value)}
          style={{...inp,cursor:'pointer'}}>
          <option value="all">Semua Tier</option>
          {uniqueTiers.map(t=><option key={t} value={t}>{t} ({tierCount[t]||0})</option>)}
        </select>

        {/* Search */}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cari nama member..."
          style={{...inp,flex:'1 1 160px'}}
          onFocus={e=>e.target.style.borderColor='#eab308'}
          onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>

        <span style={{fontFamily:'monospace',color:'#444',fontSize:10}}>{filtered.length}/{members.length}</span>
      </div>

      {/* Table */}
      <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
        <div style={{display:'grid',gridTemplateColumns:'28px 1fr 170px 90px 90px 110px 90px 80px',gap:8,padding:'8px 20px',borderBottom:'1px solid #1a1a1a',fontFamily:'monospace',color:'#444',fontSize:10,letterSpacing:0.5}}>
          <span>#</span><span>NAMA</span><span>TIER</span><span>STATUS</span><span>DISCORD</span><span>LAST LOGIN</span><span>PROGRESS</span><span>AKSI</span>
        </div>
        <div style={{maxHeight:540,overflowY:'auto' as const}}>
          {filtered.length===0 && <div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— TIDAK ADA MEMBER —</div>}
          {filtered.map((m:any,i:number)=>{
            const isOnline=m.last_seen&&(Date.now()-new Date(m.last_seen).getTime())<5*60*1000;
            const diffMin=m.last_seen?Math.floor((Date.now()-new Date(m.last_seen).getTime())/60000):null;
            const diffH=diffMin!==null?Math.floor(diffMin/60):null;
            const diffD=diffH!==null?Math.floor(diffH/24):null;
            const ago=!m.last_seen?'—':isOnline?'🟢 Online':diffMin!==null&&diffMin<60?`${diffMin}m`:diffH!==null&&diffH<24?`${diffH}j`:`${diffD}h`;
            const pct=progress[m.id]||0;
            const isEditing=editId===m.id;
            return (
              <React.Fragment key={m.id}>
                <div style={{display:'grid',gridTemplateColumns:'28px 1fr 170px 90px 90px 110px 90px 80px',gap:8,padding:'10px 20px',borderBottom:isEditing?'none':'1px solid #111',alignItems:'center',fontSize:12,background:isEditing?'#0a0a0a':'transparent'}}>
                  <span style={{fontFamily:'monospace',color:'#333',fontSize:10}}>{i+1}</span>
                  <span style={{fontWeight:600,fontSize:13}}>{m.nama}</span>
                  <span style={{fontFamily:'monospace',color:'#666',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{m.tier}</span>
                  {/* is_advance badge */}
                  <span style={{fontFamily:'monospace',fontSize:10,fontWeight:700,
                    color:m.is_advance?'#eab308':'#22ab94',
                    background:m.is_advance?'#1a1500':'#0a1a14',
                    border:`1px solid ${m.is_advance?'#3a2e00':'#0f2a1f'}`,
                    padding:'2px 7px',textAlign:'center' as const}}>
                    {m.is_advance?'ADVANCE':'BASIC'}
                  </span>
                  <span style={{fontFamily:'monospace',color:m.discord_username?'#22ab94':'#333',fontSize:11}}>{m.discord_username||'—'}</span>
                  <span style={{fontFamily:'monospace',color:isOnline?'#22ab94':'#555',fontSize:11}}>{ago}</span>
                  <div>
                    {pct>0?(
                      <>
                        <div style={{height:5,background:'#1a1a1a',borderRadius:2,marginBottom:2}}>
                          <div style={{height:'100%',width:`${pct}%`,background:pct>=80?'#22ab94':pct>=40?'#eab308':'#555',borderRadius:2}}/>
                        </div>
                        <div style={{fontFamily:'monospace',fontSize:9,color:'#888'}}>{pct}%</div>
                      </>
                    ):<span style={{fontFamily:'monospace',color:'#333',fontSize:10}}>—</span>}
                  </div>
                  <div style={{display:'flex',gap:4}}>
                    <button onClick={()=>setShowPass(showPass===m.id?null:m.id)}
                      style={{background:'transparent',border:'1px solid #2a2a2a',color:'#666',fontSize:11,padding:'3px 7px',cursor:'pointer'}}>
                      {showPass===m.id?'🙈':'👁'}
                    </button>
                    <button onClick={()=>{setEditId(isEditing?null:m.id);setEditNama(m.nama);setEditTier(m.tier);setEditPass('');}}
                      style={{background:isEditing?'#1a1500':'transparent',border:`1px solid ${isEditing?'#eab308':'#2a2a2a'}`,color:isEditing?'#eab308':'#666',fontSize:11,padding:'3px 7px',cursor:'pointer'}}>✏</button>
                  </div>
                </div>
                {showPass===m.id&&(
                  <div style={{padding:'6px 20px 6px 76px',background:'#0a0a0a',borderBottom:'1px solid #111',fontFamily:'monospace',fontSize:11}}>
                    <span style={{color:'#555'}}>PASSWORD: </span>
                    <span style={{color:'#eab308',letterSpacing:1}}>{m.password||'—'}</span>
                  </div>
                )}
                {isEditing&&(
                  <div style={{padding:'14px 20px',background:'#0a0a0a',borderBottom:'1px solid #111'}}>
                    <div style={{fontFamily:'monospace',color:'#eab308',fontSize:10,marginBottom:8}}>// EDIT: {m.nama}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
                      <input value={editNama} onChange={e=>setEditNama(e.target.value)} placeholder="Nama" style={inp}
                        onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                      <select value={editTier} onChange={e=>setEditTier(e.target.value)} style={{...inp,cursor:'pointer'}}>
                        {uniqueTiers.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                      <input value={editPass} onChange={e=>setEditPass(e.target.value)} placeholder="Password baru (kosong=tidak ganti)" style={inp}
                        onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>saveEdit(m.id)} style={{background:'#eab308',color:'#000',fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'6px 14px',border:'none',cursor:'pointer'}}>SIMPAN</button>
                      <button onClick={()=>setEditId(null)} style={{background:'transparent',color:'#666',fontFamily:'monospace',fontSize:11,padding:'6px 12px',border:'1px solid #2a2a2a',cursor:'pointer'}}>BATAL</button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}




export default function AdminPage({ initialTab, embedded }: { initialTab?: string; embedded?: boolean } = {}) {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [tab, setTab] = useState<'member' | 'video' | 'materi' | 'advance' | 'admins' | 'settings' | 'announce' | 'broker' | 'ulasan' | 'claim' | 'jadwal' | 'proprules' | 'rating' | 'referral' | 'progress'>((initialTab as any) || 'member');
  const [ulasanList, setUlasanList] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [claimActionLoading, setClaimActionLoading] = useState<string | null>(null);
  const [liveSchedules, setLiveSchedules] = useState<any[]>([]);
  const [propRules, setPropRules]           = useState<any[]>([]);
  const [newRuleName, setNewRuleName]       = useState('');
  const [newRuleType, setNewRuleType]       = useState('challenge');
  const [newRuleContent, setNewRuleContent] = useState('');
  const [jadwalHari, setJadwalHari]   = useState('');
  const [jadwalJam, setJadwalJam]     = useState('');
  const [jadwalSesi, setJadwalSesi]   = useState('');
  const [jadwalLink, setJadwalLink]   = useState('');
  const [jadwalUrutan, setJadwalUrutan] = useState('');
  const [claimCatatanMap, setClaimCatatanMap] = useState<Record<string, string>>({});
  const [claimFilter, setClaimFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Broker states
  const [brokers, setBrokers] = useState<any[]>([]);
  const [bNama, setBNama] = useState('');
  const [bLink, setBLink] = useState('');
  const [bDiskon, setBDiskon] = useState('');
  const [bDesc, setBDesc] = useState('');
  const [bUrutan, setBUrutan] = useState('');
  const [editBrokerId, setEditBrokerId] = useState<string | null>(null);
  const [editBNama, setEditBNama] = useState('');
  const [editBLink, setEditBLink] = useState('');
  const [editBDiskon, setEditBDiskon] = useState('');
  const [editBDesc, setEditBDesc] = useState('');
  const [editBUrutan, setEditBUrutan] = useState('');
  const [announceChannel, setAnnounceChannel] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');
  const [announceSending, setAnnounceSending] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [requests, setRequests] = useState<AdvanceRequest[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const fileRef = useRef<HTMLInputElement>(null);

  // Member form
  const [mNama, setMNama] = useState('');
  const [mTier, setMTier] = useState('');
  const [mPassword, setMPassword] = useState('');
  const [showMPass, setShowMPass] = useState(false);

  // Video form
  const [vJudul, setVJudul] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vUrl, setVUrl] = useState('');
  const [vLevel, setVLevel] = useState<'basic' | 'advance'>('basic');
  const [vUrutan, setVUrutan] = useState('');
  const [vKategori, setVKategori] = useState('intro');

  // File upload state
  const [fJudul, setFJudul] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fKategori, setFKategori] = useState('file-basic');
  const [fUrutan, setFUrutan] = useState('');
  const [fFile, setFFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const [fileItems, setFileItems] = useState<{id: string; judul: string; file_name: string; file_url: string; kategori: string}[]>([]);

  // Admin form
  const [aUsername, setAUsername] = useState('');
  const [aPassword, setAPassword] = useState('');
  const [showAPass, setShowAPass] = useState(false);

  // Settings - ganti password sendiri
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  const [revealPass, setRevealPass] = useState<Record<string, boolean>>({});
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [alasanTolak, setAlasanTolak] = useState('');

  // Edit member states
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editMNama, setEditMNama] = useState('');
  const [editMTier, setEditMTier] = useState('');
  const [editMPassword, setEditMPassword] = useState('');
  const [editMAdvance, setEditMAdvance] = useState(false);

  // Filter member states
  const [filterTier, setFilterTier] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [editVideoId, setEditVideoId] = useState<string | null>(null);
  const [editVJudul, setEditVJudul] = useState('');
  const [editVDesc, setEditVDesc] = useState('');
  const [editVUrl, setEditVUrl] = useState('');
  const [editVKategori, setEditVKategori] = useState('');
  const [editVUrutan, setEditVUrutan] = useState('');
  const [editFileId, setEditFileId] = useState<string | null>(null);
  const [editFJudul, setEditFJudul] = useState('');
  const [editFDesc, setEditFDesc] = useState('');
  const [editFKategori, setEditFKategori] = useState('');
  const [editFUrutan, setEditFUrutan] = useState('');

  // Coming Soon image
  const [csFile, setCsFile] = useState<File | null>(null);
  const csUploadRef = useRef<HTMLInputElement>(null);
  const [editCsFile, setEditCsFile] = useState<File | null>(null);
  const editCsUploadRef = useRef<HTMLInputElement>(null);
  const [editCsExisting, setEditCsExisting] = useState<string>('');

  function notify(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  }

  useEffect(() => {
    const raw = localStorage.getItem('mr_admin');
    if (!raw) { window.location.href = '/login'; return; }
    const admin = JSON.parse(raw);
    setCurrentAdmin(admin);
    loadData();
  }, []);

  async function loadData() {
    const { data: m } = await supabase.from('members').select('*').order('created_at', { ascending: false });
    const { data: v } = await supabase.from('videos').select('*').order('urutan', { ascending: true });
    const { data: r } = await supabase.from('advance_requests').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('admins').select('*').order('created_at', { ascending: true });
    const { data: fi } = await supabase.from('files').select('*').order('urutan', { ascending: true });
    const { data: br } = await supabase.from('brokers').select('*').order('urutan', { ascending: true });
    const { data: js } = await supabase.from('live_schedules').select('*').order('urutan', { ascending: true });
    if (js) setLiveSchedules(js);
    // Prop firm rules
    try {
      const { data: prData } = await supabase.from('prop_firm_rules').select('*').order('created_at', { ascending: false });
      if (prData) setPropRules(prData);
    } catch(_e) { /* table may not exist */ }
    const { data: ul } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    const { data: cl } = await supabase.from('partnership_claims').select('*').order('created_at', { ascending: false });
    if (m) setMembers(m);
    if (v) setVideos(v);
    if (r) setRequests(r);
    if (a) setAdmins(a);
    if (fi) setFileItems(fi);
    if (br) setBrokers(br);
    if (ul) setUlasanList(ul);
    if (cl) setClaims(cl);
  }

  // Broker CRUD
  async function addBroker() {
    if (!bNama || !bLink) { notify('Nama dan link wajib diisi.', 'err'); return; }
    setLoading(true);
    const { error } = await supabase.from('brokers').insert({ nama: bNama, link: bLink, diskon: bDiskon || null, deskripsi: bDesc || null, urutan: parseInt(bUrutan) || 0 });
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Broker berhasil ditambahkan!'); setBNama(''); setBLink(''); setBDiskon(''); setBDesc(''); setBUrutan(''); loadData(); }
    setLoading(false);
  }
  async function deleteBroker(id: string) {
    if (!confirm('Hapus broker ini?')) return;
    await supabase.from('brokers').delete().eq('id', id);
    loadData();
  }
  function startEditBroker(b: any) {
    setEditBrokerId(b.id); setEditBNama(b.nama); setEditBLink(b.link);
    setEditBDiskon(b.diskon || ''); setEditBDesc(b.deskripsi || ''); setEditBUrutan(String(b.urutan || 0));
  }
  async function saveEditBroker() {
    if (!editBrokerId || !editBNama || !editBLink) { notify('Nama dan link wajib diisi.', 'err'); return; }
    setLoading(true);
    const { error } = await supabase.from('brokers').update({ nama: editBNama, link: editBLink, diskon: editBDiskon || null, deskripsi: editBDesc || null, urutan: parseInt(editBUrutan) || 0 }).eq('id', editBrokerId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Broker berhasil diupdate!'); setEditBrokerId(null); loadData(); }
    setLoading(false);
  }

  async function handleClaimAction(id: string, action: 'approved' | 'rejected') {
    setClaimActionLoading(id);
    const catatan = claimCatatanMap[id] || null;
    const { error } = await supabase
      .from('partnership_claims')
      .update({ status: action, catatan_admin: catatan, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      if (action === 'approved') {
        const claim = claims.find(c => c.id === id);
        if (claim) {
          await supabase.from('members').insert({
            nama: claim.nama_lengkap,
            tier: 'SMC Trial',
            password: generatePassword(),
            is_active: true,
            is_advance: false,
          });
        }
      }
      notify(action === 'approved' ? '✅ Klaim disetujui & member dibuat!' : '❌ Klaim ditolak.', action === 'approved' ? 'ok' : 'err');
      loadData();
    }
    setClaimActionLoading(null);
  }

  function handleLogout() {
    localStorage.removeItem('mr_admin');
    window.location.href = '/login';
  }

  // Member functions
  async function addMember() {
    if (!mNama || !mTier || !mPassword) { notify('Semua field wajib diisi.', 'err'); return; }
    setLoading(true);
    const { error } = await supabase.from('members').insert({ nama: mNama, tier: mTier, password: mPassword, is_active: true, is_advance: false });
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Member berhasil ditambahkan!'); setMNama(''); setMTier(''); setMPassword(''); loadData(); }
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('members').update({ is_active: !current, session_token: null }).eq('id', id);
    loadData();
  }

  async function deleteMember(id: string) {
    if (!confirm('Hapus member ini?')) return;
    await supabase.from('members').delete().eq('id', id);
    loadData();
  }

  function startEditMember(m: any) {
    setEditMemberId(m.id);
    setEditMNama(m.nama);
    setEditMTier(m.tier);
    setEditMPassword(m.password);
    setEditMAdvance(m.is_advance);
  }

  async function saveEditMember() {
    if (!editMemberId || !editMNama || !editMTier || !editMPassword) { notify('Semua field wajib diisi.', 'err'); return; }
    setLoading(true);
    const { error } = await supabase.from('members').update({
      nama: editMNama, tier: editMTier, password: editMPassword, is_advance: editMAdvance, session_token: null,
    }).eq('id', editMemberId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Member berhasil diupdate!'); setEditMemberId(null); loadData(); }
    setLoading(false);
  }

  function normalizeTier(raw: string) {
    const r = raw.toLowerCase();
    if (r.includes('platinum')) return 'SMC Platinum 1 on 1';
    if (r.includes('gold')) return 'SMC Gold Mentorship';
    if (r.includes('bronze') || r.includes('silver')) return 'SMC Bronze';
    if (r.includes('trial')) return 'SMC Trial';
    return 'SMC Gold Mentorship';
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const sep = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const namaIdx = headers.findIndex(h => h.includes('nama'));
    const tierIdx = headers.findIndex(h => h.includes('tier') || h.includes('class') || h.includes('kelas'));
    if (namaIdx === -1) { notify('Kolom Nama tidak ditemukan.', 'err'); setLoading(false); return; }
    const rows = lines.slice(1).map(l => {
      const cols = l.split(sep).map(c => c.trim().replace(/"/g, ''));
      return { nama: cols[namaIdx] || '', tier: tierIdx >= 0 ? normalizeTier(cols[tierIdx] || '') : 'SMC Gold Mentorship', password: generatePassword(), is_active: true, is_advance: false };
    }).filter(r => r.nama.length > 2);
    if (!rows.length) { notify('Tidak ada data valid.', 'err'); setLoading(false); return; }
    const { error } = await supabase.from('members').insert(rows);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify(`Berhasil import ${rows.length} member!`); loadData(); }
    setLoading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function exportCSV() {
    const rows = [['Nama', 'Tier', 'Password', 'Advance', 'Status']];
    members.forEach(m => rows.push([m.nama, m.tier, m.password, m.is_advance ? 'Ya' : 'Tidak', m.is_active ? 'Aktif' : 'Nonaktif']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'member-menolakrugi.csv'; a.click();
  }

  // Video functions
  async function addVideo() {
    if (!vJudul) { notify('Judul wajib diisi.', 'err'); return; }
    if (!vUrl && !csFile) { notify('Isi URL YouTube atau upload gambar Coming Soon.', 'err'); return; }
    setLoading(true);
    let csImgUrl = '';
    if (csFile) {
      const csFileName = Date.now() + '_cs_' + csFile.name.replace(/\s/g, '_');
      const { error: csErr } = await supabase.storage.from('materi').upload(csFileName, csFile, { upsert: false });
      if (csErr) { notify('Gagal upload gambar coming soon: ' + csErr.message, 'err'); setLoading(false); return; }
      const { data: csPublic } = supabase.storage.from('materi').getPublicUrl(csFileName);
      csImgUrl = csPublic.publicUrl;
    }
    const { error } = await supabase.from('videos').insert({
      judul: vJudul, deskripsi: vDesc, youtube_url: vUrl,
      tier_akses: vLevel === 'advance' ? ['SMC Silver'] : ['SMC Trial'],
      level: vLevel, kategori: vKategori, urutan: parseInt(vUrutan) || 0,
      coming_soon_img: csImgUrl || null,
    });
    if (error) notify('Error: ' + error.message, 'err');
    else {
      notify('Video berhasil ditambahkan!');
      setVJudul(''); setVDesc(''); setVUrl(''); setVLevel('basic'); setVKategori('intro'); setVUrutan('');
      setCsFile(null);
      if (csUploadRef.current) csUploadRef.current.value = '';
      loadData();
    }
    setLoading(false);
  }

  async function deleteVideo(id: string) {
    if (!confirm('Hapus video ini?')) return;
    await supabase.from('videos').delete().eq('id', id);
    loadData();
  }

  async function moveVideo(kategori: string, index: number, direction: 'up' | 'down') {
    const group = videos
      .filter(v => (v as any).kategori === kategori)
      .sort((a, b) => a.urutan - b.urutan);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= group.length) return;
    const a = group[index];
    const b = group[targetIndex];
    if (a.urutan === b.urutan) {
      await supabase.from('videos').update({ urutan: direction === 'up' ? b.urutan - 1 : b.urutan + 1 }).eq('id', a.id);
    } else {
      await supabase.from('videos').update({ urutan: b.urutan }).eq('id', a.id);
      await supabase.from('videos').update({ urutan: a.urutan }).eq('id', b.id);
    }
    loadData();
  }

  // Advance request functions
  const [congratsChannelId, setCongratsChannelId] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);

  async function approveRequest(req: AdvanceRequest) {
    await supabase.from('advance_requests').update({ status: 'disetujui', updated_at: new Date().toISOString() }).eq('id', req.id);
    await supabase.from('members').update({ is_advance: true }).eq('id', req.member_id);

    // Ambil discord_id member
    const { data: member } = await supabase.from('members').select('discord_id, discord_username').eq('id', req.member_id).single();

    // Auto sync Discord role
    try {
      await fetch('https://menolakrugi-bot-production.up.railway.app/discord/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: req.member_id }),
      });
    } catch {}

    // Kirim ucapan selamat ke Discord
    if (member?.discord_id && congratsChannelId) {
      try {
        const res = await fetch('https://menolakrugi-bot-production.up.railway.app/discord/congrats-advanced', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discord_id: member.discord_id, discord_username: member.discord_username, nama: req.member_nama, channel_id: congratsChannelId }),
        });
        const data = await res.json();
        if (data.success) notify(`${req.member_nama} di-approve! Ucapan selamat terkirim ke Discord ✅`);
        else notify(`${req.member_nama} di-approve! (Gagal kirim ucapan: ${data.error})`);
      } catch {
        notify(`${req.member_nama} di-approve! (Bot tidak terhubung)`);
      }
    } else if (!congratsChannelId) {
      notify(`${req.member_nama} di-approve! ⚠️ Isi Channel ID dulu agar ucapan terkirim otomatis.`);
    } else {
      notify(`${req.member_nama} di-approve! (Member belum hubungkan Discord)`);
    }

    loadData();
  }

  async function sendBulkCongrats() {
    if (!congratsChannelId) { notify('Isi Channel ID dulu!', 'err'); return; }
    if (!confirm('Kirim ucapan selamat ke SEMUA member advanced yang sudah hubungkan Discord?')) return;
    setSendingBulk(true);
    try {
      const res = await fetch('https://menolakrugi-bot-production.up.railway.app/discord/congrats-all-advanced', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: congratsChannelId }),
      });
      const data = await res.json();
      if (data.success) notify(`Ucapan selamat terkirim ke ${data.sent} dari ${data.total} member advanced ✅`);
      else notify('Gagal: ' + data.error, 'err');
    } catch { notify('Bot tidak terhubung.', 'err'); }
    setSendingBulk(false);
  }

  async function tolakRequest(req: AdvanceRequest) {
    if (!alasanTolak.trim()) { notify('Isi alasan penolakan dulu.', 'err'); return; }
    await supabase.from('advance_requests').update({ status: 'ditolak', alasan_tolak: alasanTolak, updated_at: new Date().toISOString() }).eq('id', req.id);
    notify(`Request ${req.member_nama} ditolak.`);
    setTolakId(null); setAlasanTolak(''); loadData();
  }

  // Admin management functions (superadmin only)
  async function addAdmin() {
    if (!aUsername || !aPassword) { notify('Username dan password wajib diisi.', 'err'); return; }
    setLoading(true);
    const { error } = await supabase.from('admins').insert({ username: aUsername.toLowerCase(), password: aPassword, role: 'admin' });
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Admin berhasil ditambahkan!'); setAUsername(''); setAPassword(''); loadData(); }
    setLoading(false);
  }

  async function deleteAdmin(id: string) {
    if (currentAdmin?.id === id) { notify('Tidak bisa hapus akun sendiri.', 'err'); return; }
    if (!confirm('Hapus admin ini?')) return;
    await supabase.from('admins').delete().eq('id', id);
    loadData();
  }

  // Ganti password sendiri (permanen ke database)
  async function handleGantiPassword() {
    setPassMsg(''); setPassErr('');
    if (!oldPass || !newPass || !confirmPass) { setPassErr('Semua field wajib diisi.'); return; }
    if (newPass.length < 6) { setPassErr('Password minimal 6 karakter.'); return; }
    if (newPass !== confirmPass) { setPassErr('Password baru tidak cocok.'); return; }
    const { data: admin } = await supabase.from('admins').select('password').eq('id', currentAdmin!.id).single();
    if (!admin || admin.password !== oldPass) { setPassErr('Password lama salah.'); return; }
    const { error } = await supabase.from('admins').update({ password: newPass }).eq('id', currentAdmin!.id);
    if (error) { setPassErr('Gagal menyimpan. Coba lagi.'); return; }
    setPassMsg('Password berhasil diubah secara permanen!');
    setOldPass(''); setNewPass(''); setConfirmPass('');
  }

  async function sendAnnounce() {
    if (!announceChannel || !announceMsg.trim()) { notify('Channel dan pesan wajib diisi.', 'err'); return; }
    setAnnounceSending(true);
    try {
      const res = await fetch('https://menolakrugi-bot-production.up.railway.app/discord/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: announceChannel, message: announceMsg }),
      });
      const data = await res.json();
      if (data.success) { notify('Pengumuman berhasil dikirim ke Discord! ✅'); setAnnounceMsg(''); }
      else notify('Gagal kirim: ' + data.error, 'err');
    } catch { notify('Tidak bisa terhubung ke bot.', 'err'); }
    setAnnounceSending(false);
  }

  function startEditVideo(v: any) {
    setEditVideoId(v.id); setEditVJudul(v.judul);
    setEditVDesc(v.deskripsi || ''); setEditVUrl(v.youtube_url || '');
    setEditVKategori(v.kategori || 'basic'); setEditVUrutan(String(v.urutan || 0));
    setEditCsExisting(v.coming_soon_img || '');
    setEditCsFile(null);
  }

  async function saveEditVideo() {
    if (!editVideoId || !editVJudul) { notify('Judul wajib diisi.', 'err'); return; }
    if (!editVUrl && !editCsExisting && !editCsFile) { notify('Isi URL YouTube atau pertahankan / upload gambar Coming Soon.', 'err'); return; }
    setLoading(true);
    let csImgUrl = editCsExisting;
    if (editCsFile) {
      const csFileName = Date.now() + '_cs_' + editCsFile.name.replace(/\s/g, '_');
      const { error: csErr } = await supabase.storage.from('materi').upload(csFileName, editCsFile, { upsert: false });
      if (csErr) { notify('Gagal upload gambar: ' + csErr.message, 'err'); setLoading(false); return; }
      const { data: csPublic } = supabase.storage.from('materi').getPublicUrl(csFileName);
      csImgUrl = csPublic.publicUrl;
    }
    const isAdv = editVKategori.includes('advanced');
    const { error } = await supabase.from('videos').update({
      judul: editVJudul, deskripsi: editVDesc, youtube_url: editVUrl,
      kategori: editVKategori, level: isAdv ? 'advance' : 'basic',
      urutan: parseInt(editVUrutan) || 0,
      coming_soon_img: csImgUrl || null,
    }).eq('id', editVideoId);
    if (error) notify('Error: ' + error.message, 'err');
    else {
      notify('Video berhasil diupdate!');
      setEditVideoId(null); setEditCsFile(null); setEditCsExisting('');
      loadData();
    }
    setLoading(false);
  }

  function startEditFile(f: any) {
    setEditFileId(f.id); setEditFJudul(f.judul);
    setEditFDesc(f.deskripsi || ''); setEditFKategori(f.kategori || 'file-basic');
    setEditFUrutan(String(f.urutan || 0));
  }

  async function saveEditFile() {
    if (!editFileId || !editFJudul) { notify('Judul wajib diisi.', 'err'); return; }
    setLoading(true);
    const { error } = await supabase.from('files').update({
      judul: editFJudul, deskripsi: editFDesc, kategori: editFKategori,
      level: editFKategori === 'file-advanced' ? 'advance' : 'basic',
      urutan: parseInt(editFUrutan) || 0,
    }).eq('id', editFileId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('File berhasil diupdate!'); setEditFileId(null); loadData(); }
    setLoading(false);
  }

  async function uploadFile() {
    if (!fJudul || !fFile) { notify('Judul dan file wajib diisi.', 'err'); return; }
    setLoading(true);
    setUploadProgress('Mengupload file...');
    const fileName = Date.now() + '_' + fFile.name.replace(/\s/g, '_');
    const { error: storageError } = await supabase.storage
      .from('materi').upload(fileName, fFile, { cacheControl: '3600', upsert: false });
    if (storageError) { notify('Gagal upload: ' + storageError.message, 'err'); setLoading(false); setUploadProgress(''); return; }
    const { data: urlData } = supabase.storage.from('materi').getPublicUrl(fileName);
    const isAdvanceFile = fKategori === 'file-advanced';
    const { error } = await supabase.from('files').insert({
      judul: fJudul, deskripsi: fDesc, file_url: urlData.publicUrl,
      file_name: fFile.name, file_type: fFile.type,
      kategori: fKategori, tier_akses: isAdvanceFile ? ['SMC Silver'] : ['SMC Trial'],
      level: isAdvanceFile ? 'advance' : 'basic', urutan: parseInt(fUrutan) || 0,
    });
    if (error) notify('Error simpan: ' + error.message, 'err');
    else { notify('File berhasil diupload!'); setFJudul(''); setFDesc(''); setFKategori('file-basic'); setFUrutan(''); setFFile(null); if (fileUploadRef.current) fileUploadRef.current.value = ''; loadData(); }
    setUploadProgress(''); setLoading(false);
  }

  async function deleteFile(id: string, fileUrl: string) {
    if (!confirm('Hapus file ini?')) return;
    const fileName = fileUrl.split('/').pop();
    if (fileName) await supabase.storage.from('materi').remove([fileName]);
    await supabase.from('files').delete().eq('id', id);
    loadData();
  }

  

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const isSuperAdmin = currentAdmin?.role === 'superadmin';


  const tabContent = (
    <div style={{background:'#090909',minHeight:'100%',color:'#e7e5e4',fontFamily:'"Geist",system-ui,sans-serif'}}>

        {/* ── TAB NAVIGATION ── only show when not embedded */}
        {!embedded && <div style={{display:'flex',gap:2,marginBottom:24,borderBottom:'1px solid #1f1f1f',paddingBottom:0,overflowX:'auto' as const}}>
          {[
            { id: 'member',  label: `MEMBER`,   count: members.length },
            { id: 'video',   label: 'VIDEO',    count: videos.length },
            { id: 'advance', label: 'REQ. ADVANCE', count: pendingRequests.length, warn: true },
            { id: 'announce',label: 'PENGUMUMAN', count: null },
            { id: 'broker',  label: 'BROKER',   count: brokers.length },
            { id: 'jadwal',  label: 'JADWAL LIVE', count: null },
            { id: 'ulasan',  label: 'ULASAN',   count: ulasanList.filter(u=>u.status==='pending').length, warn: true },
            { id: 'claim',   label: 'KLAIM PARTNER', count: claims.filter(c=>c.status==='pending').length, warn: true },
            { id: 'settings',label: 'PASSWORD', count: null },
            ...(isSuperAdmin ? [{ id: 'admins', label: 'ADMIN', count: admins.length }] : []),
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              style={{fontFamily:'monospace',fontSize:11,fontWeight:700,letterSpacing:0.8,padding:'10px 18px',border:'none',cursor:'pointer',whiteSpace:'nowrap' as const,borderBottom: tab===t.id ? '2px solid #eab308' : '2px solid transparent',background:'transparent',color: tab===t.id ? '#eab308' : '#555',display:'flex',alignItems:'center',gap:6,transition:'color .15s'}}>
              {t.label}
              {t.count !== null && t.count !== undefined && (
                <span style={{fontFamily:'monospace',fontSize:9,background: t.warn && t.count > 0 ? '#3a1a1a' : '#1a1a1a',color: t.warn && t.count > 0 ? '#ef4444' : '#555',border: `1px solid ${t.warn && t.count > 0 ? '#ef4444' : '#2a2a2a'}`,padding:'1px 6px',fontWeight:700}}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>}

        {/* ── TAB MEMBER ── */}
        {tab === 'member' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Stats */}
            {(() => {
              const sudahLogin = members.filter(m => m.last_seen);
              const belumLogin = members.filter(m => !m.last_seen);
              const online = members.filter(m => m.last_seen && (Date.now() - new Date(m.last_seen).getTime()) < 5*60*1000);
              return (
                <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                  {[
                    { l:'ONLINE SEKARANG', v:online.length, c:'#22ab94', sub:'dalam 5 menit terakhir' },
                    { l:'PERNAH LOGIN',    v:sudahLogin.length, c:'#eab308', sub:`dari ${members.length} total` },
                    { l:'BELUM LOGIN',     v:belumLogin.length, c:'#ef4444', sub:'member belum masuk' },
                  ].map(s => (
                    <div key={s.l} style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'18px 20px'}}>
                      <div style={{fontFamily:'monospace',color:'#444',fontSize:10,letterSpacing:0.8,marginBottom:8}}>{s.l}</div>
                      <div style={{fontSize:36,fontWeight:700,letterSpacing:-1,color:s.c}}>{s.v}</div>
                      <div style={{fontFamily:'monospace',color:'#333',fontSize:10,marginTop:6}}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Tambah Member */}
                <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
                  <div style={{fontFamily:'monospace',color:'#eab308',fontSize:11,letterSpacing:1,marginBottom:12}}>// TAMBAH MEMBER BARU</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
                    <input type="text" value={mNama} onChange={e=>setMNama(e.target.value)} placeholder="Nama member"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <select value={mTier} onChange={e=>setMTier(e.target.value)}
                      style={{background:'#111',border:'1px solid #2a2a2a',color:mTier?'#e7e5e4':'#555',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',appearance:'none' as const,cursor:'pointer'}}>
                      <option value="">Pilih Tier</option>
                      {['SMC Trial','SMC Bronze','SMC Silver','SMC Gold Mentorship','SMC Platinum 1-on-1'].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    <div style={{position:'relative' as const}}>
                      <input type={showMPass?'text':'password'} value={mPassword} onChange={e=>setMPassword(e.target.value)} placeholder="Password"
                        style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 44px 10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                        onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                      <button onClick={()=>setShowMPass(p=>!p)} style={{position:'absolute' as const,right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:14}}>{showMPass?'🙈':'👁'}</button>
                    </div>
                  </div>
                  <button onClick={addMember} disabled={loading}
                    style={{background:loading?'#1a1a1a':'#eab308',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer',letterSpacing:0.5}}>
                    {loading ? 'MENYIMPAN...' : '+ TAMBAH MEMBER'}
                  </button>
                </div>

                {/* Filter + Full Member Table */}
                <MemberTable members={members} loadData={loadData} />
                </>
              );
            })()}
          </div>
        )}

        {/* ── TAB VIDEO ── */}
        {tab === 'video' && (
          <VideoMateriTab
            videos={[...videos, ...fileItems.map((f:any)=>({...f, youtube_url: f.file_url, kategori: f.kategori||'file-basic'}))]}
            loadData={loadData}
            addVideo={addVideo}
            uploadFile={uploadFile}
            deleteVideo={deleteVideo}
            deleteFile={deleteFile}
            loading={loading}
            vJudul={vJudul} setVJudul={setVJudul}
            vDesc={vDesc} setVDesc={setVDesc}
            vUrl={vUrl} setVUrl={setVUrl}
            vUrutan={vUrutan} setVUrutan={setVUrutan}
            vKategori={vKategori} setVKategori={setVKategori}
            vLevel={vLevel} setVLevel={setVLevel}
            csUploadRef={csUploadRef} csFile={csFile} setCsFile={setCsFile}
            fJudul={fJudul} setFJudul={setFJudul}
            fUrutan={fUrutan} setFUrutan={setFUrutan}
            fKategori={fKategori} setFKategori={setFKategori}
            fileUploadRef={fileUploadRef} fFile={fFile} setFFile={setFFile}
          />
        )}

        {/* ── TAB ADVANCE ── ALREADY REDESIGNED ── */}
        {tab === 'advance' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Setting Channel Ucapan — Terminal style */}
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
              <div style={{fontFamily:'monospace',color:'#eab308',fontSize:11,letterSpacing:1,marginBottom:12}}>// DISCORD · BULK CONGRATS</div>
              <p style={{color:'#555',fontSize:12,fontFamily:'monospace',marginBottom:12,lineHeight:1.6}}>
                Channel ID Discord untuk kirim ucapan selamat saat member di-approve.
              </p>
              <div style={{display:'flex',gap:10}}>
                <input type="text" value={congratsChannelId} onChange={e=>setCongratsChannelId(e.target.value.trim())}
                  placeholder="Paste Channel ID Discord..."
                  style={{flex:1,background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',minWidth:200}}
                  onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <button onClick={sendBulkCongrats} disabled={sendingBulk||!congratsChannelId}
                  style={{background:sendingBulk||!congratsChannelId?'#1a1a1a':'#eab308',color:sendingBulk||!congratsChannelId?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 18px',border:'none',cursor:sendingBulk||!congratsChannelId?'not-allowed':'pointer',letterSpacing:0.5,whiteSpace:'nowrap' as const}}>
                  {sendingBulk?'MENGIRIM...':'▸ KIRIM BULK ADVANCED'}
                </button>
              </div>
            </div>

            {/* Pending */}
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #1f1f1f'}}>
                <span style={{fontFamily:'monospace',color:'#eab308',fontSize:11,letterSpacing:1}}>// REQUEST MENUNGGU</span>
                <span style={{fontFamily:'monospace',background:'#1a1500',border:'1px solid #3a2e00',color:'#eab308',fontSize:11,padding:'3px 10px',fontWeight:700}}>{pendingRequests.length} PENDING</span>
              </div>
              {pendingRequests.length===0 ? (
                <div style={{padding:'40px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— TIDAK ADA REQUEST —</div>
              ) : pendingRequests.map((req,i)=>(
                <div key={req.id} style={{padding:'20px',borderBottom:'1px solid #1a1a1a'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap' as const}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                        <span style={{fontFamily:'monospace',color:'#444',fontSize:11}}>#{String(i+1).padStart(3,'0')}</span>
                        <span style={{fontWeight:700,fontSize:15}}>{req.member_nama}</span>
                        <span style={{fontFamily:'monospace',fontSize:10,background:'#1a1500',border:'1px solid #3a2e00',color:'#eab308',padding:'2px 8px'}}>{req.member_tier}</span>
                      </div>
                      <div style={{fontFamily:'monospace',color:'#444',fontSize:11}}>{new Date(req.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
                      {req.alasan_tolak&&req.alasan_tolak.startsWith('Jurnal')&&(
                        <div style={{background:'#111',border:'1px solid #1a1a1a',padding:'12px',marginTop:8}}>
                          <div style={{fontFamily:'monospace',color:'#eab308',fontSize:10,marginBottom:8}}>// LINK JURNAL</div>
                          {req.alasan_tolak.split('\n').map((line:string,ji:number)=>{
                            const parts=line.split(': '); const label=parts[0]; const link=parts.slice(1).join(': ');
                            return link?(<div key={ji} style={{display:'flex',gap:8,marginBottom:4}}><span style={{fontFamily:'monospace',color:'#555',fontSize:10,minWidth:60,flexShrink:0}}>{label}</span><a href={link} target="_blank" rel="noopener noreferrer" style={{color:'#22ab94',fontSize:11,fontFamily:'monospace',wordBreak:'break-all' as const,textDecoration:'none'}}>{link.slice(0,70)}</a></div>):null;
                          })}
                        </div>
                      )}
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>approveRequest(req)} style={{background:'#0f1a0f',border:'1px solid #22ab94',color:'#22ab94',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'8px 16px',cursor:'pointer'}}>✓ APPROVE</button>
                      <button onClick={()=>setTolakId(req.id)} style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'8px 16px',cursor:'pointer'}}>✕ TOLAK</button>
                    </div>
                  </div>
                  {tolakId===req.id&&(
                    <div style={{marginTop:14,background:'#111',border:'1px solid #3a1a1a',padding:'16px'}}>
                      <div style={{fontFamily:'monospace',color:'#ef4444',fontSize:11,marginBottom:8}}>// ALASAN PENOLAKAN</div>
                      <textarea value={alasanTolak} onChange={e=>setAlasanTolak(e.target.value)} placeholder="Tulis alasan..." rows={3}
                        style={{width:'100%',background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 12px',fontSize:13,fontFamily:'monospace',resize:'vertical' as const,outline:'none',boxSizing:'border-box' as const}}/>
                      <div style={{display:'flex',gap:8,marginTop:10}}>
                        <button onClick={()=>tolakRequest(req)} style={{background:'#ef4444',color:'#fff',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'8px 16px',border:'none',cursor:'pointer'}}>KONFIRMASI TOLAK</button>
                        <button onClick={()=>{setTolakId(null);setAlasanTolak('');}} style={{background:'transparent',color:'#666',fontFamily:'monospace',fontSize:12,padding:'8px 16px',border:'1px solid #2a2a2a',cursor:'pointer'}}>BATAL</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Riwayat */}
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #1f1f1f'}}><span style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1}}>// RIWAYAT REQUEST</span></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 160px 100px 90px',gap:8,padding:'8px 20px',borderBottom:'1px solid #1a1a1a',fontFamily:'monospace',color:'#333',fontSize:10}}>
                <span>NAMA</span><span>TIER</span><span>TANGGAL</span><span>STATUS</span>
              </div>
              {requests.filter(r=>r.status!=='pending').map(req=>(
                <div key={req.id} style={{display:'grid',gridTemplateColumns:'1fr 160px 100px 90px',gap:8,padding:'10px 20px',borderBottom:'1px solid #111',alignItems:'center'}}>
                  <span style={{fontWeight:600,fontSize:13}}>{req.member_nama}</span>
                  <span style={{fontFamily:'monospace',color:'#555',fontSize:11}}>{req.member_tier}</span>
                  <span style={{fontFamily:'monospace',color:'#444',fontSize:11}}>{new Date(req.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span>
                  <span style={{fontFamily:'monospace',fontSize:10,fontWeight:700,color:req.status==='disetujui'?'#22ab94':'#ef4444'}}>{req.status==='disetujui'?'✓ OK':'✕ TOLAK'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB PENGUMUMAN ── */}
        {tab === 'announce' && (
          <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:680}}>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
              <div style={{fontFamily:'monospace',color:'#eab308',fontSize:11,letterSpacing:1,marginBottom:16}}>// KIRIM PENGUMUMAN KE DISCORD</div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'monospace',color:'#444',fontSize:10,letterSpacing:0.5,marginBottom:6}}>CHANNEL ID</div>
                <input type="text" value={announceChannel} onChange={e=>setAnnounceChannel(e.target.value.trim())} placeholder="Paste Channel ID Discord..."
                  style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                  onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <div style={{fontFamily:'monospace',color:'#333',fontSize:10,marginTop:4}}>Klik kanan channel Discord → Copy Channel ID (butuh Developer Mode aktif)</div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'monospace',color:'#444',fontSize:10,letterSpacing:0.5,marginBottom:6}}>PESAN PENGUMUMAN</div>
                <textarea value={announceMsg} onChange={e=>setAnnounceMsg(e.target.value)} rows={10}
                  placeholder={`Tulis pengumuman...\n\nSupport markdown Discord:\n# Heading\n**bold**\n_italic_\n> quote`}
                  style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const}}
                  onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <div style={{fontFamily:'monospace',color:'#333',fontSize:10,marginTop:4}}>{announceMsg.length} karakter</div>
              </div>
              {announceMsg && (
                <div style={{background:'#111',border:'1px solid #2a2a2a',padding:'14px',marginBottom:12}}>
                  <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:8}}>// PREVIEW</div>
                  <pre style={{color:'#aaa',fontSize:12,fontFamily:'monospace',whiteSpace:'pre-wrap' as const,margin:0}}>{announceMsg}</pre>
                </div>
              )}
              <button onClick={sendAnnounce} disabled={announceSending||!announceChannel||!announceMsg.trim()}
                style={{background:announceSending||!announceChannel||!announceMsg.trim()?'#1a1a1a':'#eab308',color:announceSending||!announceChannel||!announceMsg.trim()?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'12px',border:'none',cursor:'pointer',letterSpacing:0.5,width:'100%'}}>
                {announceSending?'MENGIRIM...':'▸ KIRIM KE DISCORD'}
              </button>
            </div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'16px 20px'}}>
              <div style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1,marginBottom:10}}>// CARA AKTIFKAN DEVELOPER MODE</div>
              {['Buka Discord → Settings (ikon gear)','Klik Advanced','Aktifkan Developer Mode','Klik kanan channel → Copy Channel ID','Paste ID di kolom di atas'].map((step,i)=>(
                <div key={i} style={{display:'flex',gap:10,marginBottom:6,alignItems:'baseline'}}>
                  <span style={{fontFamily:'monospace',color:'#eab308',fontSize:11,flexShrink:0}}>{i+1}.</span>
                  <span style={{fontSize:13,color:'#888'}}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB BROKER ── */}
        {tab === 'broker' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
              <div style={{fontFamily:'monospace',color:'#eab308',fontSize:11,letterSpacing:1,marginBottom:16}}>// TAMBAH PROP FIRM / BROKER</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                {[
                  {v:bNama,s:setBNama,ph:'Nama Broker/Prop Firm'},
                  {v:bLink,s:setBLink,ph:'Link Daftar (URL)'},
                  {v:bDiskon,s:setBDiskon,ph:'Diskon (opsional)'},
                  {v:bUrutan,s:setBUrutan,ph:'Urutan tampil',type:'number'},
                ].map((f,i)=>(
                  <input key={i} type={f.type||'text'} value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}
                    style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                    onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                ))}
              </div>
              <textarea value={bDesc} onChange={e=>setBDesc(e.target.value)} placeholder="Deskripsi singkat" rows={2}
                style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:10}}
                onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
              <button onClick={addBroker} disabled={loading}
                style={{background:loading?'#1a1a1a':'#eab308',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer',letterSpacing:0.5}}>
                {loading?'MENYIMPAN...':'+ TAMBAH BROKER'}
              </button>
            </div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{padding:'12px 20px',borderBottom:'1px solid #1a1a1a'}}><span style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1}}>// DAFTAR BROKER ({brokers.length})</span></div>
              {!brokers.length && <div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— BELUM ADA BROKER —</div>}
              {brokers.map(b=>(
                <div key={b.id} style={{borderBottom:'1px solid #111'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontWeight:700,fontSize:14}}>{b.nama}</span>
                        {b.diskon&&<span style={{fontFamily:'monospace',fontSize:10,background:'#0a1a0a',border:'1px solid #22ab94',color:'#22ab94',padding:'1px 6px'}}>{b.diskon}</span>}
                      </div>
                      {b.deskripsi&&<div style={{color:'#666',fontSize:12,marginBottom:2}}>{b.deskripsi}</div>}
                      <div style={{fontFamily:'monospace',color:'#22ab94',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{b.link}</div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button onClick={()=>editBrokerId===b.id?setEditBrokerId(null):startEditBroker(b)} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#666',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>EDIT</button>
                      <button onClick={()=>deleteBroker(b.id)} style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>HAPUS</button>
                    </div>
                  </div>
                  {editBrokerId===b.id&&(
                    <div style={{padding:'16px 20px',background:'#111',borderTop:'1px solid #1a1a1a'}}>
                      <div style={{fontFamily:'monospace',color:'#eab308',fontSize:10,marginBottom:10}}>// EDIT BROKER</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                        {[
                          {v:editBNama,s:setEditBNama,ph:'Nama'},
                          {v:editBLink,s:setEditBLink,ph:'Link'},
                          {v:editBDiskon,s:setEditBDiskon,ph:'Diskon'},
                          {v:editBUrutan,s:setEditBUrutan,ph:'Urutan',type:'number'},
                        ].map((f,i)=>(
                          <input key={i} type={f.type||'text'} value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}
                            style={{background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 12px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                            onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                        ))}
                      </div>
                      <textarea value={editBDesc} onChange={e=>setEditBDesc(e.target.value)} placeholder="Deskripsi" rows={2}
                        style={{width:'100%',background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 12px',fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:8}}/>
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>saveEditBroker(b.id)} style={{background:'#eab308',color:'#000',fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'7px 16px',border:'none',cursor:'pointer'}}>SIMPAN</button>
                        <button onClick={()=>setEditBrokerId(null)} style={{background:'transparent',color:'#666',fontFamily:'monospace',fontSize:11,padding:'7px 12px',border:'1px solid #2a2a2a',cursor:'pointer'}}>BATAL</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB ULASAN ── */}
        {tab === 'ulasan' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #1f1f1f'}}>
                <span style={{fontFamily:'monospace',color:'#eab308',fontSize:11,letterSpacing:1}}>// ULASAN MENUNGGU</span>
                <span style={{fontFamily:'monospace',background:'#1a1500',border:'1px solid #3a2e00',color:'#eab308',fontSize:11,padding:'3px 10px',fontWeight:700}}>{ulasanList.filter(u=>u.status==='pending').length} PENDING</span>
              </div>
              {ulasanList.filter(u=>u.status==='pending').length===0?(
                <div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— TIDAK ADA ULASAN PENDING —</div>
              ):ulasanList.filter(u=>u.status==='pending').map(u=>(
                <div key={u.id} style={{padding:'20px',borderBottom:'1px solid #1a1a1a'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap' as const,marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{u.nama}</div>
                      <div style={{fontFamily:'monospace',color:'#eab308',fontSize:11,marginBottom:4}}>{u.kelas}</div>
                      <div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:s<=u.rating?'#eab308':'#333',fontSize:14}}>★</span>)}</div>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={async()=>{await supabase.from('testimonials').update({status:'disetujui'}).eq('id',u.id);setUlasanList(l=>l.map(x=>x.id===u.id?{...x,status:'disetujui'}:x));}}
                        style={{background:'#0f1a0f',border:'1px solid #22ab94',color:'#22ab94',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'7px 14px',cursor:'pointer'}}>✓ SETUJUI</button>
                      <button onClick={async()=>{await supabase.from('testimonials').update({status:'ditolak'}).eq('id',u.id);setUlasanList(l=>l.map(x=>x.id===u.id?{...x,status:'ditolak'}:x));}}
                        style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'7px 14px',cursor:'pointer'}}>✕ TOLAK</button>
                    </div>
                  </div>
                  <div style={{background:'#111',border:'1px solid #1a1a1a',padding:'12px 16px',fontFamily:'monospace',fontSize:12,color:'#aaa',lineHeight:1.6}}>
                    "{u.ulasan}"
                  </div>
                  <div style={{fontFamily:'monospace',color:'#333',fontSize:10,marginTop:6}}>{new Date(u.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{padding:'12px 20px',borderBottom:'1px solid #1a1a1a'}}><span style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1}}>// RIWAYAT ULASAN</span></div>
              {ulasanList.filter(u=>u.status!=='pending').length===0?(
                <div style={{padding:'24px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— BELUM ADA RIWAYAT —</div>
              ):ulasanList.filter(u=>u.status!=='pending').map(u=>(
                <div key={u.id} style={{display:'flex',gap:12,padding:'14px 20px',borderBottom:'1px solid #111',alignItems:'flex-start'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap' as const}}>
                      <span style={{fontWeight:600,fontSize:13}}>{u.nama}</span>
                      <span style={{fontFamily:'monospace',fontSize:10,fontWeight:700,color:u.status==='disetujui'?'#22ab94':'#ef4444'}}>{u.status==='disetujui'?'✓ TAMPIL':'✕ DITOLAK'}</span>
                    </div>
                    <div style={{fontFamily:'monospace',color:'#444',fontSize:11,marginBottom:4}}>{u.kelas}</div>
                    <div style={{color:'#666',fontSize:12,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as const}}>"{u.ulasan}"</div>
                  </div>
                  <button onClick={async()=>{await supabase.from('testimonials').delete().eq('id',u.id);setUlasanList(l=>l.filter(x=>x.id!==u.id));}}
                    style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:10,padding:'5px 10px',cursor:'pointer',flexShrink:0}}>HAPUS</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB KLAIM PARTNERSHIP ── */}
        {tab === 'claim' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontFamily:'monospace',color:'#eab308',fontSize:11,letterSpacing:1,marginBottom:4}}>// KLAIM PARTNERSHIP</div>
                <div style={{color:'#666',fontSize:13}}>Verifikasi pendaftaran broker dari calon member gratis.</div>
              </div>
            </div>
            {/* Filter */}
            <div style={{display:'flex',gap:6}}>
              {(['all','pending','approved','rejected'] as const).map(s=>(
                <button key={s} onClick={()=>setClaimFilter(s)}
                  style={{fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'7px 14px',border:`1px solid ${claimFilter===s?'#eab308':'#2a2a2a'}`,background:claimFilter===s?'#1a1500':'transparent',color:claimFilter===s?'#eab308':'#555',cursor:'pointer',letterSpacing:0.5}}>
                  {s==='all'?'SEMUA':s==='pending'?'PENDING':s==='approved'?'DISETUJUI':'DITOLAK'}
                  <span style={{marginLeft:6,color:'#444',fontWeight:400}}>({claims.filter(c=>s==='all'||c.status===s).length})</span>
                </button>
              ))}
            </div>
            {claims.filter(c=>claimFilter==='all'||c.status===claimFilter).length===0?(
              <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'40px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— TIDAK ADA KLAIM —</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {claims.filter(c=>claimFilter==='all'||c.status===c.status).filter(c=>claimFilter==='all'||c.status===claimFilter).map(claim=>(
                  <div key={claim.id} style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
                    <div style={{padding:'16px 20px',borderBottom:'1px solid #1a1a1a'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:12}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{claim.nama}</div>
                          <div style={{fontFamily:'monospace',color:'#555',fontSize:12}}>📱 {claim.whatsapp}</div>
                        </div>
                        <span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'4px 12px',border:`1px solid ${claim.status==='pending'?'#3a2e00':claim.status==='approved'?'#0f2a1f':'#3a1a1a'}`,color:claim.status==='pending'?'#eab308':claim.status==='approved'?'#22ab94':'#ef4444',background:claim.status==='pending'?'#1a1500':claim.status==='approved'?'#0a1a14':'#1a0f0f',whiteSpace:'nowrap' as const}}>
                          {claim.status==='pending'?'⏳ PENDING':claim.status==='approved'?'✓ DISETUJUI':'✕ DITOLAK'}
                        </span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
                        {[
                          {l:'BROKER',v:claim.broker,c:'#eab308'},
                          {l:'NOMOR AKUN',v:claim.nomor_akun,c:'#e7e5e4'},
                          {l:'TANGGAL',v:new Date(claim.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'2-digit'}),c:'#666'},
                        ].map(f=>(
                          <div key={f.l} style={{background:'#111',border:'1px solid #1a1a1a',padding:'10px 14px'}}>
                            <div style={{fontFamily:'monospace',color:'#333',fontSize:10,marginBottom:4}}>{f.l}</div>
                            <div style={{fontFamily:'monospace',fontWeight:700,fontSize:13,color:f.c}}>{f.v}</div>
                          </div>
                        ))}
                      </div>
                      {claim.screenshot_url&&(
                        <a href={claim.screenshot_url} target="_blank" rel="noopener noreferrer"
                          style={{display:'inline-flex',alignItems:'center',gap:6,fontFamily:'monospace',fontSize:11,color:'#22ab94',textDecoration:'none',marginBottom:12}}>
                          ↗ Lihat Screenshot Bukti
                        </a>
                      )}
                      {claim.status==='pending'&&(
                        <div>
                          <textarea value={claimCatatanMap[claim.id]||''} onChange={e=>setClaimCatatanMap(m=>({...m,[claim.id]:e.target.value}))}
                            placeholder="Catatan (opsional)..." rows={2}
                            style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 12px',fontSize:12,fontFamily:'monospace',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:10}}/>
                          <div style={{display:'flex',gap:8}}>
                            <button onClick={async()=>{setClaimActionLoading(claim.id);await supabase.from('partnership_claims').update({status:'approved',catatan:claimCatatanMap[claim.id]||''}).eq('id',claim.id);setClaims(c=>c.map(x=>x.id===claim.id?{...x,status:'approved'}:x));setClaimActionLoading(null);}}
                              disabled={claimActionLoading===claim.id}
                              style={{background:'#0f1a0f',border:'1px solid #22ab94',color:'#22ab94',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'8px 16px',cursor:'pointer'}}>✓ SETUJUI</button>
                            <button onClick={async()=>{setClaimActionLoading(claim.id);await supabase.from('partnership_claims').update({status:'rejected',catatan:claimCatatanMap[claim.id]||''}).eq('id',claim.id);setClaims(c=>c.map(x=>x.id===claim.id?{...x,status:'rejected'}:x));setClaimActionLoading(null);}}
                              disabled={claimActionLoading===claim.id}
                              style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'8px 16px',cursor:'pointer'}}>✕ TOLAK</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB ADMIN (SUPERADMIN ONLY) ── */}
        {tab === 'admins' && isSuperAdmin && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
              <div style={{fontFamily:'monospace',color:'#eab308',fontSize:11,letterSpacing:1,marginBottom:14}}>// TAMBAH ADMIN BARU</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <input type="text" value={aUsername} onChange={e=>setAUsername(e.target.value)} placeholder="Username admin"
                  style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                  onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <div style={{position:'relative' as const}}>
                  <input type={showAPass?'text':'password'} value={aPassword} onChange={e=>setAPassword(e.target.value)} placeholder="Password"
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 80px 10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                    onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                  <div style={{position:'absolute' as const,right:8,top:'50%',transform:'translateY(-50%)',display:'flex',gap:4}}>
                    <button onClick={()=>setShowAPass(p=>!p)} style={{background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:13}}>{showAPass?'🙈':'👁'}</button>
                    <button onClick={()=>setAPassword(generatePassword())} style={{background:'none',border:'none',cursor:'pointer',color:'#eab308',fontSize:10,fontFamily:'monospace'}}>GEN</button>
                  </div>
                </div>
              </div>
              <button onClick={addAdmin} disabled={loading}
                style={{background:loading?'#1a1a1a':'#eab308',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer',letterSpacing:0.5}}>
                {loading?'MENYIMPAN...':'+ TAMBAH ADMIN'}
              </button>
            </div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{padding:'12px 20px',borderBottom:'1px solid #1a1a1a'}}><span style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1}}>// DAFTAR ADMIN ({admins.length})</span></div>
              {admins.map(a=>(
                <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #111'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:36,height:36,background:'#1a1500',border:'1px solid #3a2e00',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:14,color:'#eab308',fontFamily:'monospace'}}>
                      {a.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13}}>@{a.username}</div>
                      <span style={{fontFamily:'monospace',fontSize:10,color:a.role==='superadmin'?'#eab308':'#22ab94',background:a.role==='superadmin'?'#1a1500':'#0a1a14',border:`1px solid ${a.role==='superadmin'?'#3a2e00':'#0f2a1f'}`,padding:'1px 7px'}}>
                        {a.role==='superadmin'?'SUPERADMIN':'ADMIN'}
                      </span>
                    </div>
                  </div>
                  {a.role!=='superadmin'&&(
                    <button onClick={()=>deleteAdmin(a.id)} style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>HAPUS</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB MATERI - same as video tab ── */}
        {tab === 'materi' && (
          <VideoMateriTab
            videos={[...videos, ...fileItems.map((f:any)=>({...f, youtube_url: f.file_url, kategori: f.kategori||'file-basic'}))]}
            loadData={loadData}
            addVideo={addVideo}
            uploadFile={uploadFile}
            deleteVideo={deleteVideo}
            deleteFile={deleteFile}
            loading={loading}
            vJudul={vJudul} setVJudul={setVJudul}
            vDesc={vDesc} setVDesc={setVDesc}
            vUrl={vUrl} setVUrl={setVUrl}
            vUrutan={vUrutan} setVUrutan={setVUrutan}
            vKategori={vKategori} setVKategori={setVKategori}
            vLevel={vLevel} setVLevel={setVLevel}
            csUploadRef={csUploadRef} csFile={csFile} setCsFile={setCsFile}
            fJudul={fJudul} setFJudul={setFJudul}
            fUrutan={fUrutan} setFUrutan={setFUrutan}
            fKategori={fKategori} setFKategori={setFKategori}
            fileUploadRef={fileUploadRef} fFile={fFile} setFFile={setFFile}
          />
        )}
        {tab === 'materi_OLD_REMOVED' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Filter kategori */}
            {(() => {
              const cats = [
                { id:'all',          label:'SEMUA',        color:'#eab308' },
                { id:'intro',        label:'INTRO',        color:'#eab308' },
                { id:'basic',        label:'BASIC',        color:'#22ab94' },
                { id:'tips-basic',   label:'TIPS BASIC',   color:'#22ab94' },
                { id:'advanced',     label:'ADVANCED',     color:'#a855f7' },
                { id:'tips-advanced',label:'TIPS ADV',     color:'#a855f7' },
                { id:'file-basic',   label:'FILE BASIC',   color:'#3b82f6' },
                { id:'file-advanced',label:'FILE ADV',     color:'#3b82f6' },
              ];
              return null;
            })()}

            {/* All categories */}
            {[
              { id:'intro',         label:'INTRO',         color:'#eab308' },
              { id:'basic',         label:'BASIC',         color:'#22ab94' },
              { id:'tips-basic',    label:'TIPS BASIC',    color:'#22ab94' },
              { id:'advanced',      label:'ADVANCED',      color:'#a855f7' },
              { id:'tips-advanced', label:'TIPS ADVANCED', color:'#a855f7' },
              { id:'file-basic',    label:'FILE BASIC',    color:'#3b82f6' },
              { id:'file-advanced', label:'FILE ADVANCED', color:'#3b82f6' },
            ].map(cat => {
              const isFile = cat.id.startsWith('file-');
              const items = videos.filter(v => v.kategori === cat.id);
              if (!items.length) return null;
              return (
                <div key={cat.id} style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid #1a1a1a'}}>
                    <span style={{fontFamily:'monospace',color:cat.color,fontSize:11,letterSpacing:1}}>// {cat.label}</span>
                    <span style={{fontFamily:'monospace',color:'#444',fontSize:10}}>{items.length} item</span>
                  </div>
                  {isFile ? (
                    /* File list */
                    <div>
                      {items.sort((a,b)=>(a.urutan||0)-(b.urutan||0)).map(v=>(
                        <div key={v.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 20px',borderBottom:'1px solid #111',gap:12}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{v.judul}</div>
                            <div style={{fontFamily:'monospace',color:'#555',fontSize:11}}>{v.file_type||'file'}</div>
                          </div>
                          {v.youtube_url && (
                            <a href={v.youtube_url} target="_blank" rel="noopener noreferrer"
                              style={{fontFamily:'monospace',fontSize:11,color:'#3b82f6',textDecoration:'none',border:'1px solid #1a2a4a',padding:'5px 12px',background:'#0a0f1a'}}>
                              ↗ BUKA FILE
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Video grid */
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,padding:'16px'}}>
                      {items.sort((a,b)=>(a.urutan||0)-(b.urutan||0)).map(v=>{
                        const ytId = v.youtube_url?.match(/(?:youtu\.be\/|v=)([^&?/]+)/)?.[1];
                        const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                        return (
                          <div key={v.id} style={{background:'#111',border:'1px solid #1a1a1a',overflow:'hidden'}}>
                            {/* Thumbnail */}
                            <div style={{position:'relative' as const,paddingBottom:'56.25%',background:'#0a0a0a',overflow:'hidden'}}>
                              {thumb && <img src={thumb} alt={v.judul} style={{position:'absolute' as const,inset:0,width:'100%',height:'100%',objectFit:'cover' as const,opacity:0.8}}/>}
                              {!thumb && v.coming_soon_image_url && <img src={v.coming_soon_image_url} alt={v.judul} style={{position:'absolute' as const,inset:0,width:'100%',height:'100%',objectFit:'cover' as const,opacity:0.6}}/>}
                              {!thumb && !v.coming_soon_image_url && (
                                <div style={{position:'absolute' as const,inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',color:'#333',fontSize:11}}>NO PREVIEW</div>
                              )}
                              {ytId && (
                                <a href={`https://youtube.com/watch?v=${ytId}`} target="_blank" rel="noopener noreferrer"
                                  style={{position:'absolute' as const,inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.4)',textDecoration:'none'}}>
                                  <div style={{width:44,height:44,background:'rgba(234,179,8,.9)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>▶</div>
                                </a>
                              )}
                              {!ytId && <div style={{position:'absolute' as const,top:8,left:8,fontFamily:'monospace',fontSize:9,background:'#1a1500',border:'1px solid #3a2e00',color:'#eab308',padding:'2px 6px'}}>COMING SOON</div>}
                            </div>
                            <div style={{padding:'10px 12px'}}>
                              <div style={{fontFamily:'monospace',color:cat.color,fontSize:9,marginBottom:4}}>MOD.{String(v.urutan||0).padStart(2,'0')}</div>
                              <div style={{fontSize:13,fontWeight:600,lineHeight:1.3}}>{v.judul}</div>
                              {v.deskripsi && <div style={{fontSize:11,color:'#555',marginTop:4,lineHeight:1.4}}>{v.deskripsi}</div>}
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
        )}


        {/* ── TAB JADWAL LIVE ── */}
        {tab === 'jadwal' && (
          <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:700}}>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
              <div style={{fontFamily:'monospace',color:'#eab308',fontSize:11,letterSpacing:1,marginBottom:16}}>// TAMBAH JADWAL LIVE</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <div>
                  <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:5}}>HARI / TANGGAL</div>
                  <input value={jadwalHari} onChange={e=>setJadwalHari(e.target.value)} placeholder="cth: Senin / 26 Mei 2025"
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                    onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                </div>
                <div>
                  <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:5}}>JAM</div>
                  <input value={jadwalJam} onChange={e=>setJadwalJam(e.target.value)} placeholder="cth: 20.00 – 22.00 WIB"
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                    onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:5}}>NAMA SESI</div>
                <input value={jadwalSesi} onChange={e=>setJadwalSesi(e.target.value)} placeholder="cth: Live Trading + Market Analysis"
                  style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                  onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 80px',gap:10,marginBottom:12}}>
                <div>
                  <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:5}}>LINK GABUNG (opsional)</div>
                  <input value={jadwalLink} onChange={e=>setJadwalLink(e.target.value)} placeholder="https://discord.gg/... atau YouTube"
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                    onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                </div>
                <div>
                  <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:5}}>URUTAN</div>
                  <input value={jadwalUrutan} onChange={e=>setJadwalUrutan(e.target.value)} type="number" placeholder="1"
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}/>
                </div>
              </div>
              <button onClick={async()=>{
                if(!jadwalHari||!jadwalSesi){notify('Hari dan nama sesi wajib diisi.','err');return;}
                await supabase.from('live_schedules').insert({hari:jadwalHari,jam:jadwalJam,sesi:jadwalSesi,link:jadwalLink||null,urutan:parseInt(jadwalUrutan)||liveSchedules.length+1,is_active:false});
                notify('Jadwal berhasil ditambahkan!');
                setJadwalHari('');setJadwalJam('');setJadwalSesi('');setJadwalLink('');setJadwalUrutan('');
                loadData();
              }} disabled={loading}
                style={{background:loading?'#1a1a1a':'#eab308',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer'}}>
                {loading?'MENYIMPAN...':'+ TAMBAH JADWAL'}
              </button>
            </div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{padding:'12px 20px',borderBottom:'1px solid #1a1a1a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1}}>// JADWAL TERDAFTAR ({liveSchedules.length})</span>
                <span style={{fontFamily:'monospace',color:'#444',fontSize:10}}>Tampil langsung di halaman Live Trading member</span>
              </div>
              {liveSchedules.length===0&&<div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— Belum ada jadwal —</div>}
              {liveSchedules.map((s:any)=>(
                <div key={s.id} style={{padding:'14px 20px',borderBottom:'1px solid #111',display:'flex',alignItems:'flex-start',gap:16}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                      <span style={{fontFamily:'monospace',color:'#eab308',fontSize:12,fontWeight:700}}>{s.hari}</span>
                      {s.jam&&<span style={{fontFamily:'monospace',color:'#555',fontSize:11}}>{s.jam}</span>}
                      {s.is_active&&<span style={{fontFamily:'monospace',fontSize:9,background:'#ef4444',color:'#fff',padding:'2px 6px',borderRadius:3,fontWeight:700}}>● LIVE</span>}
                    </div>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:s.link?4:0}}>{s.sesi}</div>
                    {s.link&&<span style={{fontFamily:'monospace',fontSize:10,color:'#22ab94'}}>{s.link.slice(0,55)}</span>}
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    <button onClick={async()=>{await supabase.from('live_schedules').update({is_active:!s.is_active}).eq('id',s.id);setLiveSchedules(p=>p.map(x=>x.id===s.id?{...x,is_active:!s.is_active}:x));}}
                      style={{background:s.is_active?'#1a0f0f':'#0a1a0a',border:`1px solid ${s.is_active?'#ef4444':'#22ab94'}`,color:s.is_active?'#ef4444':'#22ab94',fontFamily:'monospace',fontSize:10,padding:'5px 10px',cursor:'pointer'}}>
                      {s.is_active?'STOP LIVE':'SET LIVE'}
                    </button>
                    <button onClick={async()=>{if(!confirm('Hapus?'))return;await supabase.from('live_schedules').delete().eq('id',s.id);setLiveSchedules(p=>p.filter(x=>x.id!==s.id));}}
                      style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:10,padding:'5px 10px',cursor:'pointer'}}>HAPUS</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB PROP FIRM RULES ── */}
        {tab === 'proprules' && (
          <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:800}}>
            <div style={{fontFamily:'monospace',color:'#eab308',fontSize:11,letterSpacing:1}}>// PROP FIRM RULES</div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',borderRadius:8,padding:'18px'}}>
              <div style={{fontFamily:'monospace',color:'#666',fontSize:10,marginBottom:12,letterSpacing:0.5}}>TAMBAH RULE BARU</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 120px',gap:8,marginBottom:8}}>
                <input value={newRuleName} onChange={e=>setNewRuleName(e.target.value)} placeholder="Nama prop firm (contoh: FTMO, MFF)"
                  style={{background:'#111',border:'1px solid #2a2a2a',color:'#fff',padding:'10px 14px',fontFamily:'monospace',fontSize:12,borderRadius:6,outline:'none'}}/>
                <select value={newRuleType} onChange={e=>setNewRuleType(e.target.value)}
                  style={{background:'#111',border:'1px solid #2a2a2a',color:'#fff',padding:'10px 14px',fontFamily:'monospace',fontSize:12,borderRadius:6,outline:'none'}}>
                  <option value="challenge">Challenge</option>
                  <option value="funded">Funded</option>
                  <option value="instant">Instant</option>
                </select>
              </div>
              <textarea value={newRuleContent} onChange={e=>setNewRuleContent(e.target.value)} rows={5}
                placeholder={'Rules (satu per baris):\nMax Daily Loss: 5%\nMax Total Loss: 10%\nProfit Target: 8%'}
                style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#fff',padding:'10px 14px',fontFamily:'monospace',fontSize:12,borderRadius:6,outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:8}}/>
              <button onClick={async()=>{
                if(!newRuleName||!newRuleContent){notify('Isi nama dan rules dulu');return;}
                try{
                  const rules=newRuleContent.trim().split('\n').filter(Boolean);
                  const {error}=await supabase.from('prop_firm_rules').insert({name:newRuleName,type:newRuleType,rules,is_active:true});
                  if(error)throw error;
                  notify('Rule berhasil ditambahkan ✅');
                  setNewRuleName('');setNewRuleContent('');loadData();
                }catch(e:any){notify('Error: '+e.message);}
              }} style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:'#000',background:'#eab308',padding:'10px 20px',border:'none',cursor:'pointer',borderRadius:6}}>
                + TAMBAH
              </button>
            </div>
            {propRules.length===0?(
              <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#444',fontSize:12,borderRadius:8}}>
                Belum ada prop firm rules.<br/><span style={{color:'#333',fontSize:10}}>Pastikan tabel prop_firm_rules sudah ada di Supabase.</span>
              </div>
            ):(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:12}}>
                {propRules.map((r:any)=>(
                  <div key={r.id} style={{background:'#0d0d0d',border:`1px solid ${r.is_active?'#2a2a1a':'#1f1f1f'}`,borderRadius:8,padding:'16px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14}}>{r.name}</div>
                        <div style={{fontFamily:'monospace',fontSize:10,color:r.type==='funded'?'#22ab94':r.type==='challenge'?'#eab308':'#a855f7',marginTop:3,textTransform:'uppercase' as const}}>{r.type}</div>
                      </div>
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={async()=>{await supabase.from('prop_firm_rules').update({is_active:!r.is_active}).eq('id',r.id);loadData();}}
                          style={{fontFamily:'monospace',fontSize:9,color:r.is_active?'#22ab94':'#555',background:r.is_active?'#0a1a14':'#111',border:`1px solid ${r.is_active?'#22ab9444':'#2a2a2a'}`,padding:'3px 8px',cursor:'pointer',borderRadius:4}}>
                          {r.is_active?'AKTIF':'NONAKTIF'}
                        </button>
                        <button onClick={async()=>{if(!confirm('Hapus?'))return;await supabase.from('prop_firm_rules').delete().eq('id',r.id);loadData();}}
                          style={{fontFamily:'monospace',fontSize:9,color:'#ef4444',background:'#1a0a0a',border:'1px solid #ef444444',padding:'3px 8px',cursor:'pointer',borderRadius:4}}>HAPUS</button>
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column' as const,gap:4}}>
                      {(Array.isArray(r.rules)?r.rules:typeof r.rules==='string'?JSON.parse(r.rules||'[]'):[]).map((rule:string,i:number)=>(
                        <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',fontSize:12,color:'#aaa'}}>
                          <span style={{color:'#eab308',fontFamily:'monospace',flexShrink:0}}>▸</span><span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB PENGATURAN ── */}
        {tab === 'settings' && (
          <SettingsTab
            oldPass={oldPass} setOldPass={setOldPass}
            newPass={newPass} setNewPass={setNewPass}
            confirmPass={confirmPass} setConfirmPass={setConfirmPass}
            passErr={passErr} passMsg={passMsg}
            handleGantiPassword={handleGantiPassword}
          />
        )}

    </div>
  );

  if (embedded) return tabContent;

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Navbar - only shown when not embedded */}
      <div className="bg-[#0a0f1e]/90 backdrop-blur-md border-b border-yellow-500/20 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-[#0a0f1e] font-bold text-sm">MR</span>
            </div>
            <div>
              <span className="text-white font-bold">Admin Panel</span>
              <span className="text-gray-500 text-xs ml-2">@{currentAdmin?.username}</span>
              {isSuperAdmin && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">Superadmin</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="text-gray-400 hover:text-white transition-colors">↻</button>
            <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Website</a>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 text-sm transition-colors">Keluar</button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-xl border text-sm ${msgType === 'err' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
            {msg}
          </div>
        )}
        {tabContent}
      </div>
    </div>
  );
}
