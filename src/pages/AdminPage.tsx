import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Users, Video, ArrowLeft, Eye, EyeOff, Upload, RefreshCw, ChevronUp, ChevronDown, CheckCircle, XCircle, KeyRound, Shield } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

const TIERS = ['SMC Trial', 'SMC Bronze', 'SMC Gold Mentorship', 'SMC Platinum 1 on 1'];
const RANK_IMGS: Record<string, string> = {
  '1': '/rank_1.png', '2': '/rank_2.png', '3': '/rank_3.png',
  '4-10': '/rank_4-10.png', '11-20': '/rank_11-20.png', '21+': '/rank_21-sampai_seterusnya.png',
};
function RankImg({ rank, size = 28 }: { rank: number; size?: number }) {
  const src = rank === 1 ? RANK_IMGS['1'] : rank === 2 ? RANK_IMGS['2'] : rank === 3 ? RANK_IMGS['3'] : rank <= 10 ? RANK_IMGS['4-10'] : rank <= 20 ? RANK_IMGS['11-20'] : RANK_IMGS['21+'];
  return <img src={src} alt={`rank-${rank}`} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />;
}

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
    { id:'intro',         label:'Intro',         color:'#16a34a' },
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
    const newUrutan = parseInt(editUrutan) || 0;
    const updates: any = { judul: editJudul, deskripsi: editDesc, kategori: editKat, urutan: newUrutan };
    if (!editIsFile) updates.youtube_url = editUrl;
    await supabase.from(table).update(updates).eq('id', editId);
    setEditId(null);

    // Hitung halaman target berdasarkan urutan baru dan filter aktif saat ini
    // agar item tidak "hilang" setelah urutan diubah
    const base2 = editIsFile
      ? (videos || []).filter((v: any) =>  v.kategori?.startsWith('file-'))
      : (videos || []).filter((v: any) => !v.kategori?.startsWith('file-'));
    const filtered2 = base2.filter((v: any) =>
      filterKat === 'all' || v.kategori === filterKat
    );
    // Simulasikan posisi item setelah urutan baru (sort by urutan)
    const sorted2 = [...filtered2.map((v: any) =>
      v.id === editId ? { ...v, urutan: newUrutan } : v
    )].sort((a: any, b: any) => a.urutan - b.urutan);
    const newIdx = sorted2.findIndex((v: any) => v.id === editId);
    if (newIdx >= 0) setPage(Math.floor(newIdx / PER_PAGE) + 1);

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
  const btn = (active?: boolean, color = '#16a34a'): React.CSSProperties => ({
    fontFamily:'monospace', fontSize:11, fontWeight:700, padding:'6px 14px',
    border:`1px solid ${active?color:'#2a2a2a'}`,
    background: active ? (color==='#16a34a'?'#0a1a0e':color==='#3b82f6'?'#0a0f1a':'#0a1a0a') : 'transparent',
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
          style={{background:'#16a34a', color:'#fff', fontFamily:'monospace', fontSize:12, fontWeight:700, padding:'10px 18px', border:'none', cursor:'pointer'}}>
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
                  onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <input value={vUrl} onChange={e=>setVUrl(e.target.value)} placeholder="URL YouTube" style={inp}
                  onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <input value={vUrutan} onChange={e=>setVUrutan(e.target.value)} placeholder="Urutan" type="number" style={inp}/>
              </div>
              <textarea value={vDesc} onChange={e=>setVDesc(e.target.value)} placeholder="Deskripsi (opsional)" rows={2}
                style={{...inp, resize:'vertical' as const, width:'100%', boxSizing:'border-box' as const}}/>
              <div style={{background:'#111', border:'1px dashed #3a2a00', padding:'10px 12px'}}>
                <div style={{fontFamily:'monospace', color:'#16a34a', fontSize:10, marginBottom:6}}>COMING SOON IMAGE</div>
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
          { l:'COMING SOON',  v:vidItems.filter((v:any)=>!v.youtube_url).length, c:'#16a34a', sub:'Belum publish' },
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
            style={{fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'9px 20px',border:'none',background:'transparent',color:subTab===t.id?'#16a34a':'#555',cursor:'pointer',borderBottom:subTab===t.id?'2px solid #16a34a':'2px solid transparent'}}>
            {t.l} <span style={{fontSize:10,color:'#444',marginLeft:4}}>({t.id==='video'?vidItems.length:fileItems.length})</span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' as const}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="🔍 Cari judul materi..."
          style={{flex:'1 1 200px',...inp}}
          onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
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
                  {!v.youtube_url&&!isFile && <span style={{fontFamily:'monospace',fontSize:9,background:'#0a1a0e',color:'#16a34a',padding:'1px 5px'}}>COMING SOON</span>}
                </div>
                <span style={{fontFamily:'monospace',fontSize:10,color:catColor(v.kategori)}}>{catLabel(v.kategori)}</span>
                <span style={{fontFamily:'monospace',color:'#555',fontSize:11}}>{v.urutan}</span>
                <div style={{display:'flex',gap:4}}>
                  <button onClick={()=>isEditing?setEditId(null):startEdit(v,isFile)}
                    style={{background:isEditing?'#0a1a0e':'transparent',border:`1px solid ${isEditing?'#16a34a':'#2a2a2a'}`,color:isEditing?'#16a34a':'#aaa',fontSize:12,padding:'4px 8px',cursor:'pointer'}}>
                    {isEditing?'✕':'✏'}
                  </button>
                  <button onClick={()=>isFile?deleteFile(v.id,v.file_url):deleteVideo(v.id,v.coming_soon_image_url)}
                    style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontSize:12,padding:'4px 8px',cursor:'pointer'}}>✕</button>
                </div>
              </div>
              {/* Inline edit form */}
              {isEditing && (
                <div style={{padding:'16px 20px',background:'#0a0a0a',borderBottom:'1px solid #1a1a1a'}}>
                  <div style={{fontFamily:'monospace',color:isFile?'#3b82f6':'#16a34a',fontSize:10,marginBottom:10}}>
                    // EDIT {isFile?'FILE':'VIDEO'}: {v.judul}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:8,marginBottom:8}}>
                    <input value={editJudul} onChange={e=>setEditJudul(e.target.value)} placeholder="Judul"
                      style={inp} onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    {!isFile && (
                      <input value={editUrl} onChange={e=>setEditUrl(e.target.value)} placeholder="URL YouTube"
                        style={inp} onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
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
                      style={{background:isFile?'#3b82f6':'#16a34a',color:isFile?'#fff':'#000',fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'7px 16px',border:'none',cursor:'pointer'}}>
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
                style={{background:page===p?'#16a34a':'transparent',border:`1px solid ${page===p?'#16a34a':'#2a2a2a'}`,color:page===p?'#000':'#666',padding:'4px 10px',cursor:'pointer',fontFamily:'monospace',fontSize:11,fontWeight:page===p?700:400}}>{p}</button>
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
  const [toggling, setToggling]     = useState<string|null>(null);

  const uniqueTiers = Array.from(new Set(members.map((m:any) => m.tier).filter(Boolean))).sort() as string[];

  const basicMembers   = members.filter((m:any) => !m.is_advance);
  const advanceMembers = members.filter((m:any) => m.is_advance);

  useEffect(() => {
    Promise.all([
      supabase.from('member_progress').select('member_id,status'),
      supabase.from('videos').select('id',{count:'exact',head:true})
    ]).then(([{data:progData},{count:vidCount}]) => {
      if (progData && vidCount) {
        const counts: Record<string,number> = {};
        progData.forEach((p:any) => { if(p.status==='selesai') counts[p.member_id]=(counts[p.member_id]||0)+1; });
        const map: Record<string,number> = {};
        Object.entries(counts).forEach(([mid,n]) => { map[mid]=Math.round((n as number)/vidCount*100); });
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
    // Clear session_token agar member fetch ulang data tier terbaru saat login berikutnya
    updates.session_token = null;
    await supabase.from('members').update(updates).eq('id', id);
    setEditId(null); loadData();
  }

  async function toggleActive(id: string, current: boolean) {
    setToggling(id);
    await supabase.from('members').update({ is_active: !current }).eq('id', id);
    setToggling(null); loadData();
  }

  async function toggleAdvance(id: string, current: boolean) {
    setToggling(id + '_adv');
    await supabase.from('members').update({ is_advance: !current }).eq('id', id);
    setToggling(null); loadData();
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
          { l:'ADVANCE',        v:advanceMembers.length, c:'#16a34a' },
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
                border:`1px solid ${f.active ? (f.id==='advance'?'#16a34a':f.id==='basic'?'#22ab94':'#666') : '#2a2a2a'}`,
                background:f.active ? (f.id==='advance'?'#0a1a0e':f.id==='basic'?'#0a1a14':'#181818') : 'transparent',
                color:f.active ? (f.id==='advance'?'#16a34a':f.id==='basic'?'#22ab94':'#e7e5e4') : '#555',
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
          onFocus={e=>e.target.style.borderColor='#16a34a'}
          onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>

        <span style={{fontFamily:'monospace',color:'#444',fontSize:10}}>{filtered.length}/{members.length}</span>
      </div>

      {/* Table */}
      <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
        <div style={{display:'grid',gridTemplateColumns:'28px 1fr 150px 78px 78px 90px 110px 80px 100px 44px',gap:8,padding:'8px 20px',borderBottom:'1px solid #1a1a1a',fontFamily:'monospace',color:'#888',fontSize:10,letterSpacing:0.5}}>
          <span>#</span><span>NAMA</span><span>TIER</span><span>LEVEL</span><span>AKUN</span><span>DISCORD</span><span>LAST LOGIN</span><span>PROGRESS</span><span>AKSI</span><span>🗑</span>
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
            const isActive=m.is_active!==false; // default true jika null/undefined
            const isBusy=toggling===m.id||toggling===m.id+'_adv';
            return (
              <React.Fragment key={m.id}>
                <div style={{display:'grid',gridTemplateColumns:'28px 1fr 150px 78px 78px 90px 110px 80px 100px 44px',gap:8,padding:'10px 20px',borderBottom:isEditing?'none':'1px solid #111',alignItems:'center',fontSize:12,background:isEditing?'#0a0a0a':!isActive?'#140808':'transparent',opacity:!isActive?0.7:1}}>
                  <span style={{fontFamily:'monospace',color:'#666',fontSize:10}}>{i+1}</span>
                  <span style={{fontWeight:600,fontSize:13,color:!isActive?'#666':'#e7e5e4'}}>{m.nama}</span>
                  <span style={{fontFamily:'monospace',color:'#b0b0b0',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{m.tier}</span>
                  {/* is_advance badge — klik untuk toggle */}
                  <button onClick={()=>toggleAdvance(m.id, !!m.is_advance)} disabled={isBusy}
                    title={m.is_advance?'Klik untuk jadikan Basic':'Klik untuk jadikan Advance'}
                    style={{fontFamily:'monospace',fontSize:10,fontWeight:700,cursor:'pointer',
                      color:m.is_advance?'#16a34a':'#22ab94',
                      background:m.is_advance?'#0a1a0e':'#0a1a14',
                      border:`1px solid ${m.is_advance?'#1a3a22':'#0f2a1f'}`,
                      padding:'3px 6px',textAlign:'center' as const,transition:'all 0.15s'}}>
                    {m.is_advance?'ADVANCE':'BASIC'}
                  </button>
                  {/* is_active badge — klik untuk toggle */}
                  <button onClick={()=>toggleActive(m.id, isActive)} disabled={isBusy}
                    title={isActive?'Klik untuk nonaktifkan akun':'Klik untuk aktifkan akun'}
                    style={{fontFamily:'monospace',fontSize:10,fontWeight:700,cursor:'pointer',
                      color:isActive?'#22c55e':'#ef4444',
                      background:isActive?'#0a160a':'#160a0a',
                      border:`1px solid ${isActive?'#1a3a1a':'#3a1a1a'}`,
                      padding:'3px 6px',textAlign:'center' as const,transition:'all 0.15s'}}>
                    {isActive?'AKTIF':'NONAKTIF'}
                  </button>
                  <span style={{fontFamily:'monospace',color:m.discord_username?'#22ab94':'#555',fontSize:11}}>{m.discord_username||'—'}</span>
                  <span style={{fontFamily:'monospace',color:isOnline?'#22ab94':'#888',fontSize:11}}>{ago}</span>
                  <div>
                    {pct>0?(
                      <>
                        <div style={{height:5,background:'#1a1a1a',borderRadius:2,marginBottom:2}}>
                          <div style={{height:'100%',width:`${pct}%`,background:pct>=80?'#22ab94':pct>=40?'#16a34a':'#555',borderRadius:2}}/>
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
                      style={{background:isEditing?'#0a1a0e':'transparent',border:`1px solid ${isEditing?'#16a34a':'#2a2a2a'}`,color:isEditing?'#16a34a':'#666',fontSize:11,padding:'3px 7px',cursor:'pointer'}}>✏</button>
                  </div>
                  {/* ── DELETE MEMBER ── */}
                  <button onClick={async()=>{
                    if(!confirm(`Hapus member "${m.nama}"? Semua data jurnal akan ikut terhapus.`))return;
                    await supabase.from('trading_journals').delete().eq('member_id',m.id);
                    await supabase.from('journal_settings').delete().eq('member_id',m.id);
                    await supabase.from('members').delete().eq('id',m.id);
                    loadData();
                  }} style={{background:'#1a0808',border:'1px solid #7f1d1d',color:'#ef4444',fontSize:11,padding:'3px 7px',cursor:'pointer',fontWeight:700}}>
                    🗑
                  </button>
                </div>
                {showPass===m.id&&(
                  <div style={{padding:'6px 20px 6px 76px',background:'#0a0a0a',borderBottom:'1px solid #111',fontFamily:'monospace',fontSize:11}}>
                    <span style={{color:'#555'}}>PASSWORD: </span>
                    <span style={{color:'#16a34a',letterSpacing:1}}>{m.password||'—'}</span>
                  </div>
                )}
                {isEditing&&(
                  <div style={{padding:'14px 20px',background:'#0a0a0a',borderBottom:'1px solid #111'}}>
                    <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:10,marginBottom:8}}>// EDIT: {m.nama}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
                      <input value={editNama} onChange={e=>setEditNama(e.target.value)} placeholder="Nama" style={inp}
                        onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                      <select value={editTier} onChange={e=>setEditTier(e.target.value)} style={{...inp,cursor:'pointer'}}>
                        {uniqueTiers.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                      <input value={editPass} onChange={e=>setEditPass(e.target.value)} placeholder="Password baru (kosong=tidak ganti)" style={inp}
                        onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>saveEdit(m.id)} style={{background:'#16a34a',color:'#fff',fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'6px 14px',border:'none',cursor:'pointer'}}>SIMPAN</button>
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




function normalizeHasilAdmin(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (['tp', 'take profit', 'takeprofit'].includes(v)) return 'Take Profit';
  if (['sl', 'stop loss', 'stop lose', 'stoploss', 'stoplose'].includes(v)) return 'Stop Loss';
  if (['sl profit', 'slprofit', 'sl-profit'].includes(v)) return 'SL Profit';
  if (['be', 'bep', 'break even', 'breakeven'].includes(v)) return 'Break Even';
  if (['miss entry', 'missentry'].includes(v)) return 'Miss Entry';
  if (['no entry', 'noentry'].includes(v)) return 'No Entry';
  if (v === 'running') return 'Running';
  return raw.trim();
}

// ─── PeringkatAdminTab component ─────────────────────────────────────────────
function JurnalAdminTab({ members }: { members: any[] }) {
  const [tab, setTab]               = useState<'jurnal'|'progress'>('jurnal');
  const [jurnalStats, setJurnalStats]   = useState<any[]>([]);
  const [progressStats, setProgressStats] = useState<any[]>([]);
  const [totalVideos, setTotalVideos]   = useState(0);
  const [loadingJ, setLoadingJ]         = useState(false);
  const [selectedMember, setSelectedMember] = useState<string|null>(null);
  const [memberEntries, setMemberEntries]   = useState<any[]>([]);
  const [settings, setSettings]             = useState<any>({});
  const [editNoteId, setEditNoteId]         = useState<string|null>(null);
  const [noteText, setNoteText]             = useState('');
  const [noteSaving, setNoteSaving]         = useState(false);
  const [manageMemberId, setManageMemberId] = useState('');
  const [importing, setImporting]           = useState(false);
  const [importMsg, setImportMsg]           = useState('');
  const [deletingAll, setDeletingAll]       = useState(false);
  const importAddRef     = useRef<HTMLInputElement>(null);
  const importReplaceRef = useRef<HTMLInputElement>(null);

  const C = {
    panel:'#111', border:'#1e1e1e', border2:'#2a2a2a',
    dim:'#555', muted:'#888', text:'#e7e5e4',
    up:'#22c55e', down:'#ef4444', warn:'#f59e0b',
    mono:'"Geist Mono",monospace',
  };
  const G = '#16a34a';

  useEffect(() => { fetchAll(); }, [members]);

  async function fetchAll() {
    if (!members.length) return;
    setLoadingJ(true);
    try {
      // ── Jurnal stats ──────────────────────────────────────────────────────
      const [{ data: allEntries }, { data: allSettings }] = await Promise.all([
        supabase.from('trading_journals').select('member_id,hasil,pnl,rr,tanggal'),
        supabase.from('journal_settings').select('member_id,equity_awal'),
      ]);
      const settingsMap: Record<string,number> = {};
      (allSettings||[]).forEach((s:any) => { settingsMap[s.member_id] = s.equity_awal||10000; });
      const memberMap: Record<string,any> = {};
      members.forEach(m => { memberMap[m.id] = { id:m.id, nama:m.nama, tier:m.tier, equity_awal:settingsMap[m.id]||10000, total:0, tp:0, sl:0, totalPnl:0, rrSum:0, rrCount:0 }; });
      (allEntries||[]).forEach((e:any) => {
        const m = memberMap[e.member_id]; if(!m) return;
        m.total++;
        if(e.hasil==='Take Profit'){m.tp++;m.rrSum+=(e.rr||0);m.rrCount++;}
        if(e.hasil==='Stop Loss') m.sl++;
        m.totalPnl+=(e.pnl||0);
      });
      setJurnalStats(Object.values(memberMap).filter((m:any)=>m.total>0).map((m:any)=>({
        ...m,
        winRate: (m.tp+m.sl)>0?(m.tp/(m.tp+m.sl))*100:0,
        avgRR: m.rrCount?m.rrSum/m.rrCount:0,
        equityGain: m.totalPnl,
        equityGainPct: m.equity_awal?(m.totalPnl/m.equity_awal)*100:0,
      })).sort((a:any,b:any)=>b.equityGainPct-a.equityGainPct));

      // ── Progress stats ────────────────────────────────────────────────────
      const [{ data: vids }, { data: progs }] = await Promise.all([
        supabase.from('videos').select('id'),
        supabase.from('member_progress').select('member_id,status'),
      ]);
      setTotalVideos(vids?.length||0);
      const counts: Record<string,number> = {};
      (progs||[]).forEach((p:any) => { if(p.status==='selesai') counts[p.member_id]=(counts[p.member_id]||0)+1; });
      setProgressStats(members.map(m=>({...m, selesai:counts[m.id]||0})).sort((a:any,b:any)=>b.selesai-a.selesai));
    } catch(_) {}
    setLoadingJ(false);
  }

  async function viewDetail(memberId: string) {
    setSelectedMember(memberId);
    const [{ data: entries }, { data: sett }] = await Promise.all([
      supabase.from('trading_journals').select('*').eq('member_id', memberId).order('tanggal', { ascending: false }),
      supabase.from('journal_settings').select('*').eq('member_id', memberId).single(),
    ]);
    setMemberEntries(entries||[]);
    setSettings(sett||{ equity_awal:10000 });
  }

  async function saveNote(entryId: string) {
    setNoteSaving(true);
    await supabase.from('trading_journals').update({
      admin_note: noteText,
      admin_note_by: 'Admin',
      admin_note_at: new Date().toISOString(),
    }).eq('id', entryId);
    // Update local state
    setMemberEntries(prev => prev.map(e => e.id === entryId
      ? { ...e, admin_note: noteText, admin_note_by: 'Admin', admin_note_at: new Date().toISOString() }
      : e
    ));
    setEditNoteId(null);
    setNoteText('');
    setNoteSaving(false);
  }

  async function handleAdminExport(memberId: string) {
    const m = members.find((x:any) => x.id === memberId);
    const { data } = await supabase.from('trading_journals').select('*').eq('member_id', memberId).order('tanggal', { ascending: true });
    if (!data || data.length === 0) { alert('Tidak ada data jurnal untuk diekspor.'); return; }
    const headers = ['TANGGAL','PAIR','TIMEFRAME','SETUP','BIAS','DIRECTION','SESI','HASIL','RR','PNL ($)','POI','FIBO','EMOSI','ALASAN','CHART 1','CHART 2','CHART 3','KETERANGAN'];
    const rows = data.map((e:any) => [
      e.tanggal, e.pair, e.timeframe, e.setup, e.bias||'', e.direction||'', e.sesi||'', e.hasil||'',
      e.rr??'', e.pnl??'', e.poi||'', e.fibo||'', e.emosi||'', e.alasan||'',
      e.chart1_url||'', e.chart2_url||'', e.chart3_url||'', e.keterangan||'',
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'JOURNAL');
    XLSX.writeFile(wb, `Jurnal_${m?.nama || memberId}_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  async function handleAdminImport(file: File, memberId: string, mode: 'add'|'replace') {
    setImporting(true); setImportMsg('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const wsName = wb.SheetNames.includes('JOURNAL') ? 'JOURNAL' : wb.SheetNames[0];
      const rawAll: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[wsName], { header: 1, defval: '' });
      if (rawAll.length === 0) throw new Error('Sheet kosong.');
      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(5, rawAll.length); i++) {
        if (rawAll[i].some((c:any) => String(c).trim() === 'TANGGAL')) { headerRowIdx = i; break; }
      }
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wsName], { defval: '', range: headerRowIdx });
      if (rows.length === 0) throw new Error('Tidak ada data.');
      const payloads = rows.filter(r => r['TANGGAL'] && r['PAIR']).map(r => {
        const tgl = r['TANGGAL'] instanceof Date ? r['TANGGAL'].toISOString().split('T')[0] : String(r['TANGGAL']).trim();
        return {
          member_id: memberId,
          tanggal: tgl,
          pair:       String(r['PAIR']        || 'XAUUSD').trim(),
          timeframe:  String(r['TIMEFRAME']   || 'H1').trim(),
          setup:      String(r['SETUP']       || 'Follow Trend BIAS').trim(),
          bias:       String(r['BIAS']        || 'H1').trim(),
          direction:  String(r['DIRECTION']   || 'Buy').trim(),
          sesi:       String(r['SESI']        || 'London').trim(),
          hasil:      normalizeHasilAdmin(String(r['HASIL'] || 'Take Profit')),
          rr:         parseFloat(r['RR'])          || null,
          pnl:        parseFloat(r['PNL ($)'])     || null,
          poi:        String(r['POI']         || '').trim(),
          fibo:       String(r['FIBO']        || 'FIBO Entry').trim(),
          emosi:      String(r['EMOSI']       || 'Tenang').trim(),
          alasan:     String(r['ALASAN']      || '').trim(),
          chart1_url: String(r['CHART 1']     || '').trim(),
          chart2_url: String(r['CHART 2']     || '').trim(),
          chart3_url: String(r['CHART 3']     || '').trim(),
          keterangan: String(r['KETERANGAN']  || '').trim(),
        };
      });
      if (payloads.length === 0) throw new Error('Tidak ada baris data valid.');
      if (mode === 'replace') {
        const { error: delErr } = await supabase.from('trading_journals').delete().eq('member_id', memberId);
        if (delErr) throw new Error('Gagal hapus data lama: ' + delErr.message);
      }
      const { error } = await supabase.from('trading_journals').insert(payloads);
      if (error) throw error;
      setImportMsg(`✅ ${mode === 'replace' ? 'Ganti' : 'Tambah'} ${payloads.length} trade berhasil!`);
      if (selectedMember === memberId) await viewDetail(memberId);
      await fetchAll();
    } catch (err:any) {
      setImportMsg('❌ ' + (err.message || 'Gagal import'));
    }
    setImporting(false);
  }

  async function handleDeleteAll(memberId: string) {
    const m = members.find((x:any) => x.id === memberId);
    if (!confirm(`Hapus SEMUA data jurnal milik "${m?.nama || 'member ini'}"?\nTindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingAll(true);
    try {
      const { error } = await supabase.from('trading_journals').delete().eq('member_id', memberId);
      if (error) throw error;
      if (selectedMember === memberId) setMemberEntries([]);
      setImportMsg(`✅ Semua jurnal "${m?.nama}" dihapus.`);
      await fetchAll();
    } catch (err:any) {
      setImportMsg('❌ Gagal hapus: ' + err.message);
    }
    setDeletingAll(false);
  }

  const selectedData = selectedMember ? jurnalStats.find(s=>s.id===selectedMember) : null;
  const tierColor = (tier:string) => {
    if(tier?.includes('Platinum')) return '#a855f7';
    if(tier?.includes('Gold'))     return '#f59e0b';
    if(tier?.includes('Silver'))   return '#94a3b8';
    if(tier?.includes('Trial'))    return '#22ab94';
    return '#888';
  };
  const tabBtn = (t:string,label:string): React.CSSProperties => ({
    fontFamily:C.mono, fontSize:11, letterSpacing:1, padding:'7px 18px',
    borderRadius:5, cursor:'pointer', border:'none',
    background:tab===t?G:'transparent', color:tab===t?'#fff':C.muted, transition:'all .15s',
  });

  if(loadingJ) return <div style={{color:C.muted,fontFamily:C.mono,fontSize:12,padding:40,textAlign:'center'}}>Memuat data...</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:C.mono,color:G,fontSize:11,letterSpacing:2,marginBottom:4}}>// PERINGKAT MEMBER</div>
          <div style={{fontSize:18,fontWeight:700}}>Peringkat Member</div>
        </div>
        <button onClick={fetchAll} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,fontFamily:C.mono,fontSize:11,padding:'6px 14px',cursor:'pointer'}}>↻ REFRESH</button>
      </div>

      {/* Tab */}
      {!selectedMember && (
        <div style={{display:'flex',gap:4,background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:4,width:'fit-content'}}>
          <button style={tabBtn('jurnal','📓 JURNAL TRADING')} onClick={()=>setTab('jurnal')}>📓 JURNAL TRADING</button>
          <button style={tabBtn('progress','📚 PROGRESS BELAJAR')} onClick={()=>setTab('progress')}>📚 PROGRESS BELAJAR</button>
        </div>
      )}

      {/* ── JURNAL TAB ── */}
      {tab==='jurnal' && !selectedMember && (
        <>
        {/* Management panel */}
        <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px 20px',display:'flex',flexDirection:'column' as const,gap:10}}>
          <div style={{fontFamily:C.mono,color:G,fontSize:10,letterSpacing:1}}>// KELOLA JURNAL MEMBER</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap' as const,alignItems:'center'}}>
            <select value={manageMemberId} onChange={e=>{ setManageMemberId(e.target.value); setImportMsg(''); }}
              style={{fontFamily:C.mono,fontSize:11,padding:'6px 10px',background:'#0a0a0a',border:`1px solid ${C.border2}`,color:manageMemberId?C.text:C.muted,borderRadius:5,cursor:'pointer',minWidth:200}}>
              <option value="">— Pilih Member —</option>
              {members.map((m:any)=><option key={m.id} value={m.id}>{m.nama} ({m.tier})</option>)}
            </select>
            {manageMemberId && (
              <>
                <button onClick={()=>handleAdminExport(manageMemberId)}
                  style={{fontFamily:C.mono,fontSize:10,fontWeight:700,padding:'6px 14px',background:'#0c1a2e',border:'1px solid #1d4ed8',color:'#60a5fa',borderRadius:5,cursor:'pointer'}}>
                  📥 Export Excel
                </button>
                <label style={{cursor:importing?'not-allowed':'pointer'}}>
                  <input ref={importAddRef} type="file" accept=".xlsx,.xls" style={{display:'none'}}
                    disabled={importing}
                    onChange={async e=>{ const f=e.target.files?.[0]; if(f){await handleAdminImport(f,manageMemberId,'add');} e.target.value=''; }}/>
                  <span style={{fontFamily:C.mono,fontSize:10,fontWeight:700,padding:'6px 14px',background:importing?'#1a1a1a':'#0a1a0e',border:`1px solid ${importing?C.border:G}`,color:importing?C.muted:G,borderRadius:5,cursor:importing?'not-allowed':'pointer',display:'inline-block'}}>
                    {importing?'⏳ Mengimport...':'📁 Import Tambah'}
                  </span>
                </label>
                <label style={{cursor:importing?'not-allowed':'pointer'}}>
                  <input ref={importReplaceRef} type="file" accept=".xlsx,.xls" style={{display:'none'}}
                    disabled={importing}
                    onChange={async e=>{ const f=e.target.files?.[0]; if(f){await handleAdminImport(f,manageMemberId,'replace');} e.target.value=''; }}/>
                  <span style={{fontFamily:C.mono,fontSize:10,fontWeight:700,padding:'6px 14px',background:importing?'#1a1a1a':'#1a0808',border:`1px solid ${importing?C.border:C.down}`,color:importing?C.muted:C.down,borderRadius:5,cursor:importing?'not-allowed':'pointer',display:'inline-block'}}>
                    {importing?'⏳ Mengimport...':'🔄 Import Ganti Semua'}
                  </span>
                </label>
                <button onClick={()=>handleDeleteAll(manageMemberId)} disabled={deletingAll}
                  style={{fontFamily:C.mono,fontSize:10,fontWeight:700,padding:'6px 14px',background:'#1a0808',border:`1px solid ${C.down}`,color:C.down,borderRadius:5,cursor:deletingAll?'not-allowed':'pointer',opacity:deletingAll?0.6:1}}>
                  {deletingAll?'⏳ Menghapus...':'🗑 Hapus Semua Jurnal'}
                </button>
              </>
            )}
          </div>
          {importMsg && (
            <div style={{fontFamily:C.mono,fontSize:11,color:importMsg.startsWith('✅')?G:C.down,padding:'6px 10px',borderRadius:5,background:importMsg.startsWith('✅')?'#0a1a0e':'#1a0808',border:`1px solid ${importMsg.startsWith('✅')?G:C.down}33`}}>
              {importMsg}
            </div>
          )}
        </div>

        <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
          {/* Podium top 3 */}
          {jurnalStats.length>=1 && (
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'20px 16px 0',background:'linear-gradient(180deg,#0a0a0a,#111)'}}>
              {[1,0,2].map(rankIdx=>{
                const m=jurnalStats[rankIdx]; if(!m) return null;
                const COLS=['#f59e0b','#94a3b8','#cd7c2f'];
                const HEIGHTS=[100,70,55];
                const col=COLS[rankIdx]; const h=HEIGHTS[rankIdx];
                return(
                  <div key={m.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
                    <div style={{height:130,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',gap:5,paddingBottom:6,width:'100%'}}>
                      <RankImg rank={rankIdx+1} size={rankIdx===0?44:36} />
                      <div style={{width:rankIdx===0?52:42,height:rankIdx===0?52:42,borderRadius:'50%',background:'#1a1a1a',border:`2px solid ${col}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:rankIdx===0?20:16,color:col}}>
                        {m.nama?.[0]?.toUpperCase()}
                      </div>
                      <div style={{fontWeight:700,fontSize:11,color:C.text,textAlign:'center' as const,maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{m.nama}</div>
                      <div style={{fontFamily:C.mono,fontSize:11,fontWeight:700,color:m.equityGain>=0?C.up:C.down}}>{m.equityGain>=0?'+':''}{m.equityGainPct.toFixed(1)}%</div>
                    </div>
                    <div style={{width:'100%',height:h,background:`linear-gradient(180deg,${col}55,${col}22)`,border:`1px solid ${col}66`,borderBottom:'none',borderRadius:'8px 8px 0 0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span style={{fontFamily:C.mono,fontWeight:900,fontSize:rankIdx===0?18:14,color:col}}>#{rankIdx+1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {jurnalStats.length===0 && <div style={{padding:'40px 20px',textAlign:'center' as const,color:C.muted,fontFamily:C.mono,fontSize:12}}>Belum ada member yang mengisi jurnal. Gunakan panel Kelola Jurnal di atas untuk import data.</div>}
          {/* Table */}
          {jurnalStats.length>0 && (
            <div style={{padding:16,overflowX:'auto'}}>
              <div style={{fontFamily:C.mono,color:G,fontSize:10,letterSpacing:1,marginBottom:10}}>// PERINGKAT JURNAL ({jurnalStats.length} member)</div>
              <table style={{width:'100%',borderCollapse:'collapse',fontFamily:C.mono,fontSize:11}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border2}`}}>
                    {['#','NAMA','TIER','TRADE','WIN RATE','AVG RR','EQUITY GAIN','% GAIN',''].map(h=>(
                      <th key={h} style={{padding:'7px 10px',textAlign:'left' as const,color:'#888',fontWeight:600,whiteSpace:'nowrap' as const}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jurnalStats.map((m:any,i:number)=>(
                    <tr key={m.id} style={{borderBottom:`1px solid ${C.border}`}}
                      onMouseEnter={ev=>(ev.currentTarget.style.background='#161616')}
                      onMouseLeave={ev=>(ev.currentTarget.style.background='transparent')}>
                      <td style={{padding:'8px 10px'}}><RankImg rank={i+1} size={i<3?28:22} /></td>
                      <td style={{padding:'8px 10px',fontWeight:600,color:C.text}}>{m.nama}</td>
                      <td style={{padding:'8px 10px',color:tierColor(m.tier),fontSize:10}}>{m.tier}</td>
                      <td style={{padding:'8px 10px'}}>{m.total}</td>
                      <td style={{padding:'8px 10px',color:m.winRate>=50?C.up:C.down}}>{m.winRate.toFixed(1)}%</td>
                      <td style={{padding:'8px 10px',color:C.warn}}>{m.avgRR?m.avgRR.toFixed(2):'—'}</td>
                      <td style={{padding:'8px 10px',color:m.equityGain>=0?C.up:C.down,fontWeight:700}}>{m.equityGain>=0?'+':''}${m.equityGain.toFixed(2)}</td>
                      <td style={{padding:'8px 10px',color:m.equityGainPct>=0?C.up:C.down,fontWeight:700}}>{m.equityGainPct>=0?'+':''}{m.equityGainPct.toFixed(1)}%</td>
                      <td style={{padding:'8px 10px'}}>
                        <button onClick={()=>viewDetail(m.id)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'3px 10px',fontSize:10,cursor:'pointer',fontFamily:C.mono}}>DETAIL</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
      )}

      {/* ── PROGRESS TAB ── */}
      {tab==='progress' && !selectedMember && (
        <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden'}}>
          {progressStats.filter((m:any)=>m.selesai>0).length>=1 && (
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'20px 16px 0',background:'linear-gradient(180deg,#0a0a0a,#111)'}}>
              {[1,0,2].map(rankIdx=>{
                const ranked=progressStats.filter((m:any)=>m.selesai>0);
                const m=ranked[rankIdx]; if(!m) return null;
                const COLS=['#f59e0b','#94a3b8','#cd7c2f'];
                const HEIGHTS=[100,70,55];
                const col=COLS[rankIdx]; const h=HEIGHTS[rankIdx];
                const pct=totalVideos?Math.round(m.selesai/totalVideos*100):0;
                return(
                  <div key={m.id} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
                    <div style={{height:130,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',gap:5,paddingBottom:6,width:'100%'}}>
                      <RankImg rank={rankIdx+1} size={rankIdx===0?44:36} />
                      <div style={{width:rankIdx===0?52:42,height:rankIdx===0?52:42,borderRadius:'50%',background:'#1a1a1a',border:`2px solid ${col}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:rankIdx===0?20:16,color:col}}>
                        {m.nama?.[0]?.toUpperCase()}
                      </div>
                      <div style={{fontWeight:700,fontSize:11,color:C.text,textAlign:'center' as const,maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{m.nama}</div>
                      <div style={{fontFamily:C.mono,fontSize:11,fontWeight:700,color:col}}>{m.selesai}/{totalVideos} ({pct}%)</div>
                    </div>
                    <div style={{width:'100%',height:h,background:`linear-gradient(180deg,${col}55,${col}22)`,border:`1px solid ${col}66`,borderBottom:'none',borderRadius:'8px 8px 0 0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <span style={{fontFamily:C.mono,fontWeight:900,fontSize:rankIdx===0?18:14,color:col}}>#{rankIdx+1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{padding:16,overflowX:'auto'}}>
            <div style={{fontFamily:C.mono,color:G,fontSize:10,letterSpacing:1,marginBottom:10}}>// PERINGKAT PROGRESS ({progressStats.filter((m:any)=>m.selesai>0).length} member aktif)</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:C.mono,fontSize:11}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${C.border2}`}}>
                  {['#','NAMA','TIER','MATERI SELESAI','PROGRESS',''].map(h=>(
                    <th key={h} style={{padding:'7px 10px',textAlign:'left' as const,color:'#888',fontWeight:600}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progressStats.map((m:any,i:number)=>{
                  const pct=totalVideos?Math.min(100,Math.round(m.selesai/totalVideos*100)):0;
                  const col=i<3?['#f59e0b','#94a3b8','#cd7c2f'][i]:C.muted;
                  return(
                    <tr key={m.id} style={{borderBottom:`1px solid ${C.border}`}}
                      onMouseEnter={ev=>(ev.currentTarget.style.background='#161616')}
                      onMouseLeave={ev=>(ev.currentTarget.style.background='transparent')}>
                      <td style={{padding:'8px 10px'}}><RankImg rank={i+1} size={i<3?28:22} /></td>
                      <td style={{padding:'8px 10px',fontWeight:600,color:C.text}}>{m.nama}</td>
                      <td style={{padding:'8px 10px',color:tierColor(m.tier),fontSize:10}}>{m.tier}</td>
                      <td style={{padding:'8px 10px',fontFamily:C.mono,color:col,fontWeight:700}}>{m.selesai}<span style={{color:'#333',fontWeight:400}}>/{totalVideos}</span></td>
                      <td style={{padding:'8px 10px',minWidth:150}}>
                        <div style={{height:6,background:'#1a1a1a',borderRadius:3}}>
                          <div style={{height:'100%',width:`${pct}%`,background:i<3?col:G,borderRadius:3,transition:'width 0.8s'}}/>
                        </div>
                        <div style={{fontFamily:C.mono,fontSize:9,color:C.dim,marginTop:3}}>{pct}%</div>
                      </td>
                      <td style={{padding:'8px 10px'}}></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DETAIL JURNAL MEMBER ── */}
      {selectedMember && selectedData && (
        <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,padding:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12,flexWrap:'wrap' as const}}>
            <button onClick={()=>setSelectedMember(null)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 12px',cursor:'pointer',fontFamily:C.mono,fontSize:11}}>← KEMBALI</button>
            <div>
              <div style={{fontWeight:700,fontSize:16}}>{selectedData.nama}</div>
              <div style={{fontFamily:C.mono,fontSize:10,color:tierColor(selectedData.tier)}}>{selectedData.tier}</div>
            </div>
            <div style={{marginLeft:'auto',textAlign:'right' as const}}>
              <div style={{fontFamily:C.mono,fontSize:20,fontWeight:700,color:selectedData.equityGain>=0?C.up:C.down}}>
                {selectedData.equityGain>=0?'+':''}{selectedData.equityGainPct.toFixed(1)}%
              </div>
              <div style={{fontFamily:C.mono,fontSize:10,color:C.muted}}>equity gain</div>
            </div>
          </div>
          {/* Action bar */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:16,padding:'10px 12px',background:'#0a0a0a',borderRadius:8,border:`1px solid ${C.border}`}}>
            <button onClick={()=>handleAdminExport(selectedData.id)}
              style={{fontFamily:C.mono,fontSize:10,fontWeight:700,padding:'5px 12px',background:'#0c1a2e',border:'1px solid #1d4ed8',color:'#60a5fa',borderRadius:5,cursor:'pointer'}}>
              📥 Export Excel
            </button>
            <label style={{cursor:importing?'not-allowed':'pointer'}}>
              <input type="file" accept=".xlsx,.xls" style={{display:'none'}} disabled={importing}
                onChange={async e=>{ const f=e.target.files?.[0]; if(f){await handleAdminImport(f,selectedData.id,'add');} e.target.value=''; }}/>
              <span style={{fontFamily:C.mono,fontSize:10,fontWeight:700,padding:'5px 12px',background:importing?'#1a1a1a':'#0a1a0e',border:`1px solid ${importing?C.border:G}`,color:importing?C.muted:G,borderRadius:5,cursor:importing?'not-allowed':'pointer',display:'inline-block'}}>
                {importing?'⏳ Mengimport...':'📁 Import Tambah'}
              </span>
            </label>
            <label style={{cursor:importing?'not-allowed':'pointer'}}>
              <input type="file" accept=".xlsx,.xls" style={{display:'none'}} disabled={importing}
                onChange={async e=>{ const f=e.target.files?.[0]; if(f){await handleAdminImport(f,selectedData.id,'replace');} e.target.value=''; }}/>
              <span style={{fontFamily:C.mono,fontSize:10,fontWeight:700,padding:'5px 12px',background:importing?'#1a1a1a':'#1a0808',border:`1px solid ${importing?C.border:C.down}`,color:importing?C.muted:C.down,borderRadius:5,cursor:importing?'not-allowed':'pointer',display:'inline-block'}}>
                {importing?'⏳ Mengimport...':'🔄 Import Ganti Semua'}
              </span>
            </label>
            <button onClick={()=>handleDeleteAll(selectedData.id)} disabled={deletingAll}
              style={{fontFamily:C.mono,fontSize:10,fontWeight:700,padding:'5px 12px',background:'#1a0808',border:`1px solid ${C.down}`,color:C.down,borderRadius:5,cursor:deletingAll?'not-allowed':'pointer',opacity:deletingAll?0.6:1}}>
              {deletingAll?'⏳ Menghapus...':'🗑 Hapus Semua Jurnal'}
            </button>
            {importMsg && (
              <span style={{fontFamily:C.mono,fontSize:10,color:importMsg.startsWith('✅')?G:C.down,alignSelf:'center',marginLeft:4}}>
                {importMsg}
              </span>
            )}
          </div>

          {/* Stat cards */}
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}>
            {[
              {l:'TOTAL TRADE',v:String(selectedData.total)},
              {l:'WIN RATE',v:selectedData.winRate.toFixed(1)+'%',c:selectedData.winRate>=50?C.up:C.down},
              {l:'TOTAL PNL',v:(selectedData.equityGain>=0?'+':'')+'$'+selectedData.equityGain.toFixed(2),c:selectedData.equityGain>=0?C.up:C.down},
              {l:'EQUITY GAIN',v:(selectedData.equityGainPct>=0?'+':'')+selectedData.equityGainPct.toFixed(1)+'%',c:selectedData.equityGainPct>=0?C.up:C.down},
              {l:'AVG RR',v:selectedData.avgRR?selectedData.avgRR.toFixed(2):'—',c:C.warn},
              {l:'TP / SL',v:`${selectedData.tp} / ${selectedData.sl}`},
            ].map(s=>(
              <div key={s.l} style={{background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 16px',minWidth:110}}>
                <div style={{fontFamily:C.mono,color:C.dim,fontSize:10,marginBottom:5}}>{s.l}</div>
                <div style={{fontFamily:C.mono,fontSize:18,fontWeight:700,color:(s as any).c||C.text}}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Equity Curve */}
          {memberEntries.length>=2&&(()=>{
            const sorted=[...memberEntries].sort((a:any,b:any)=>new Date(a.tanggal).getTime()-new Date(b.tanggal).getTime());
            const eqAwal=settings.equity_awal||10000;
            let eq=eqAwal;
            const pts=sorted.map((e:any,i:number)=>{eq+=(e.pnl??0);return{i,eq,pnl:e.pnl??0,label:e.tanggal?.slice(5)||''};});
            const W=600,H=120,PL=52,PT=10,PB=24,PR=10;
            const iW=W-PL-PR,iH=H-PT-PB;
            const vals=pts.map((p:any)=>p.eq);
            const minV=Math.min(eqAwal,...vals),maxV=Math.max(eqAwal,...vals);
            const rng=maxV-minV||1;
            const toX=(i:number)=>PL+(i/(pts.length-1))*iW;
            const toY=(v:number)=>PT+iH-((v-minV)/rng)*iH;
            const poly=pts.map((p:any,i:number)=>`${toX(i).toFixed(1)},${toY(p.eq).toFixed(1)}`).join(' ');
            const fill=`${PL},${PT+iH} ${poly} ${PL+iW},${PT+iH}`;
            const lastEq=pts[pts.length-1].eq;
            const lc=lastEq>=eqAwal?C.up:C.down;
            const byLine=toY(eqAwal);
            return(
              <div style={{background:'#0a0a0a',border:`1px solid ${C.border}`,borderRadius:8,padding:'14px 16px',marginBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontFamily:C.mono,color:G,fontSize:10,letterSpacing:1}}>// EQUITY CURVE</div>
                  <div style={{fontFamily:C.mono,fontSize:11,color:lc,fontWeight:700}}>${Math.round(eqAwal).toLocaleString()} → ${Math.round(lastEq).toLocaleString()} <span style={{opacity:0.7}}>({lastEq>=eqAwal?'+':''}{((lastEq-eqAwal)/eqAwal*100).toFixed(1)}%)</span></div>
                </div>
                <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{display:'block'}}>
                  <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lc} stopOpacity="0.2"/><stop offset="100%" stopColor={lc} stopOpacity="0"/></linearGradient></defs>
                  <line x1={PL} y1={byLine} x2={PL+iW} y2={byLine} stroke="#2a2a2a" strokeWidth="1" strokeDasharray="3,3"/>
                  <polygon points={fill} fill="url(#ag)"/>
                  <polyline points={poly} fill="none" stroke={lc} strokeWidth="2" strokeLinejoin="round"/>
                  {pts.map((p:any,i:number)=>(<circle key={i} cx={toX(i)} cy={toY(p.eq)} r={i===pts.length-1?4:2} fill={p.pnl>=0?C.up:C.down} stroke="#0a0a0a" strokeWidth="1"/>))}
                  {[0,Math.floor(pts.length/2),pts.length-1].filter((v,i,a)=>a.indexOf(v)===i).map(i=>(<text key={i} x={toX(i)} y={H-4} textAnchor="middle" fill="#555" fontSize="8" fontFamily='"Geist Mono",monospace'>{pts[i].label}</text>))}
                  <text x={PL-4} y={toY(maxV)+4} textAnchor="end" fill="#444" fontSize="8" fontFamily='"Geist Mono",monospace'>${Math.round(maxV)}</text>
                  <text x={PL-4} y={toY(minV)+4} textAnchor="end" fill="#444" fontSize="8" fontFamily='"Geist Mono",monospace'>${Math.round(minV)}</text>
                </svg>
              </div>
            );
          })()}

          {/* Trade list dengan chart links */}
          <div style={{fontFamily:C.mono,color:G,fontSize:10,letterSpacing:1,marginBottom:10}}>// RIWAYAT TRADE ({memberEntries.length})</div>
          {memberEntries.length===0?(
            <div style={{color:C.muted,fontFamily:C.mono,fontSize:11}}>Belum ada data.</div>
          ):(
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontFamily:C.mono,fontSize:11}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border2}`}}>
                    {['TGL','PAIR','TF','SETUP','BIAS','HASIL','RR','PNL ($)','EMOSI','ALASAN','CHART','KOREKSI ADMIN'].map(h=>(
                      <th key={h} style={{padding:'6px 10px',textAlign:'left' as const,color:'#888',fontSize:10}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {memberEntries.map((e:any)=>(
                    <tr key={e.id} style={{borderBottom:`1px solid ${C.border}`}}
                      onMouseEnter={ev=>(ev.currentTarget.style.background='#161616')}
                      onMouseLeave={ev=>(ev.currentTarget.style.background='transparent')}>
                      <td style={{padding:'6px 10px',whiteSpace:'nowrap' as const}}>{e.tanggal}</td>
                      <td style={{padding:'6px 10px',color:G,fontWeight:700}}>{e.pair}</td>
                      <td style={{padding:'6px 10px',color:C.muted}}>{e.timeframe}</td>
                      <td style={{padding:'6px 10px',fontSize:10}}>{e.setup}</td>
                      <td style={{padding:'6px 10px',color:'#60a5fa',fontSize:10}}>{e.bias||'—'}</td>
                      <td style={{padding:'6px 10px',color:e.hasil==='Take Profit'?C.up:e.hasil==='Stop Loss'?C.down:C.warn,fontWeight:600}}>{e.hasil}</td>
                      <td style={{padding:'6px 10px',color:C.warn}}>{e.rr??'—'}</td>
                      <td style={{padding:'6px 10px',color:(e.pnl||0)>=0?C.up:C.down,fontWeight:600}}>{e.pnl!=null?((e.pnl>=0?'+':'')+e.pnl.toFixed(2)):'—'}</td>
                      <td style={{padding:'6px 10px',color:C.muted}}>{e.emosi||'—'}</td>
                      <td style={{padding:'6px 10px',color:C.muted,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,cursor:'pointer'}} title={e.alasan}>{e.alasan||'—'}</td>
                      <td style={{padding:'6px 10px'}}>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          {[e.chart1_url,e.chart2_url,e.chart3_url].filter(Boolean).map((url:string,ci:number)=>(
                            <a key={ci} href={url} target="_blank" rel="noopener noreferrer"
                              style={{fontFamily:C.mono,fontSize:9,color:'#3b82f6',background:'#0c1a2e',border:'1px solid #1d4ed8',padding:'3px 8px',borderRadius:3,textDecoration:'none',whiteSpace:'nowrap' as const,display:'flex',alignItems:'center',gap:4}}>
                              📷 Chart {ci+1}
                            </a>
                          ))}
                          {![e.chart1_url,e.chart2_url,e.chart3_url].some(Boolean)&&(
                            <span style={{color:C.dim,fontSize:10}}>—</span>
                          )}
                        </div>
                      </td>
                      {/* Admin Note */}
                      <td style={{padding:'6px 10px',minWidth:260}}>
                        {editNoteId===e.id ? (
                          <div style={{display:'flex',flexDirection:'column',gap:6}}>
                            <textarea value={noteText} onChange={ev=>setNoteText(ev.target.value)}
                              rows={3} placeholder="Tulis koreksi/catatan untuk member..."
                              style={{width:'100%',background:'#0a1a0e',border:'1px solid #16a34a44',color:C.text,padding:'6px 8px',fontSize:10,fontFamily:C.mono,resize:'vertical',outline:'none',borderRadius:4,boxSizing:'border-box' as const}}/>
                            <div style={{display:'flex',gap:6}}>
                              <button onClick={()=>saveNote(e.id)} disabled={noteSaving}
                                style={{background:'#052e16',border:'1px solid #16a34a',color:'#16a34a',fontFamily:C.mono,fontSize:9,padding:'3px 10px',borderRadius:4,cursor:noteSaving?'not-allowed':'pointer',opacity:noteSaving?0.6:1}}>
                                {noteSaving?'MENYIMPAN...':'💾 SIMPAN'}
                              </button>
                              <button onClick={()=>{setEditNoteId(null);setNoteText('');}}
                                style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,fontFamily:C.mono,fontSize:9,padding:'3px 10px',borderRadius:4,cursor:'pointer'}}>
                                BATAL
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {e.admin_note ? (
                              <div style={{background:'#0a1a0e',border:'1px solid #16a34a33',borderRadius:6,padding:'6px 10px',marginBottom:6}}>
                                <div style={{fontFamily:C.mono,fontSize:8,color:'#16a34a',letterSpacing:1,marginBottom:4}}>📝 KOREKSI ADMIN</div>
                                <div style={{fontSize:11,color:C.text,lineHeight:1.5}}>{e.admin_note}</div>
                                {e.admin_note_at && <div style={{fontFamily:C.mono,fontSize:8,color:C.dim,marginTop:4}}>{new Date(e.admin_note_at).toLocaleDateString('id-ID')}</div>}
                              </div>
                            ) : null}
                            <button onClick={()=>{setEditNoteId(e.id);setNoteText(e.admin_note||'');}}
                              style={{background:'transparent',border:`1px solid ${e.admin_note?'#16a34a44':C.border2}`,color:e.admin_note?'#16a34a':C.muted,fontFamily:C.mono,fontSize:9,padding:'3px 10px',borderRadius:4,cursor:'pointer',whiteSpace:'nowrap' as const}}>
                              {e.admin_note?'✏ EDIT KOREKSI':'+ BERI KOREKSI'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function extractYtId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function SettingsTab({ oldPass, setOldPass, newPass, setNewPass, confirmPass, setConfirmPass, passErr, passMsg, handleGantiPassword }: {
  oldPass: string; setOldPass: (v: string) => void;
  newPass: string; setNewPass: (v: string) => void;
  confirmPass: string; setConfirmPass: (v: string) => void;
  passErr: string; passMsg: string;
  handleGantiPassword: () => void;
}) {
  const S = { panel:'#111', border:'#1e1e1e', muted:'#888', text:'#e7e5e4', mono:'"Geist Mono",monospace', up:'#22c55e', down:'#ef4444' };
  const inputStyle: React.CSSProperties = { width:'100%', background:'#0a0a0a', border:`1px solid ${S.border}`, color:S.text, padding:'10px 14px', borderRadius:8, fontFamily:S.mono, fontSize:13, outline:'none', boxSizing:'border-box' };
  return (
    <div style={{ maxWidth:480, margin:'0 auto', padding:'32px 16px' }}>
      <div style={{ fontFamily:S.mono, color:'#16a34a', fontSize:10, letterSpacing:2, marginBottom:8 }}>// PENGATURAN AKUN</div>
      <h2 style={{ fontSize:20, fontWeight:700, color:S.text, marginBottom:24 }}>Ganti Password</h2>
      <div style={{ background:S.panel, border:`1px solid ${S.border}`, borderRadius:12, padding:24, display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ fontFamily:S.mono, fontSize:10, color:S.muted, display:'block', marginBottom:6 }}>PASSWORD LAMA</label>
          <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Password saat ini" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontFamily:S.mono, fontSize:10, color:S.muted, display:'block', marginBottom:6 }}>PASSWORD BARU</label>
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Minimal 6 karakter" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontFamily:S.mono, fontSize:10, color:S.muted, display:'block', marginBottom:6 }}>KONFIRMASI PASSWORD BARU</label>
          <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Ulangi password baru" style={inputStyle} />
        </div>
        {passErr && <div style={{ fontFamily:S.mono, fontSize:12, color:S.down, background:'#1a0808', border:`1px solid ${S.down}33`, borderRadius:6, padding:'8px 12px' }}>{passErr}</div>}
        {passMsg && <div style={{ fontFamily:S.mono, fontSize:12, color:S.up, background:'#081a0a', border:`1px solid ${S.up}33`, borderRadius:6, padding:'8px 12px' }}>{passMsg}</div>}
        <button onClick={handleGantiPassword} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'11px 0', fontFamily:S.mono, fontSize:13, fontWeight:700, cursor:'pointer', marginTop:4 }}>
          Simpan Password
        </button>
      </div>
    </div>
  );
}

export default function AdminPage({ initialTab, embedded }: { initialTab?: string; embedded?: boolean } = {}) {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [tab, setTab] = useState<'member' | 'video' | 'materi' | 'advance' | 'admins' | 'settings' | 'announce' | 'broker' | 'ulasan' | 'claim' | 'jadwal' | 'proprules' | 'rating' | 'referral' | 'progress' | 'jurnal' | 'produk'>((initialTab as any) || 'member');
  const [ulasanList, setUlasanList] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [claimActionLoading, setClaimActionLoading] = useState<string | null>(null);
  const [liveSchedules, setLiveSchedules]     = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods]   = useState<any[]>([]);
  const [pmNamaBank, setPmNamaBank]           = useState('');
  const [pmNomorRek, setPmNomorRek]           = useState('');
  const [pmNamaRek, setPmNamaRek]             = useState('');
  const [pmCatatan, setPmCatatan]             = useState('');
  const [pmUrutan, setPmUrutan]               = useState('');
  const [pmAktif, setPmAktif]                 = useState(true);
  const [pmMsg, setPmMsg]                     = useState('');
  const [editPmId, setEditPmId]               = useState<string|null>(null);
  const [editPmNamaBank, setEditPmNamaBank]   = useState('');
  const [editPmNomorRek, setEditPmNomorRek]   = useState('');
  const [editPmNamaRek, setEditPmNamaRek]     = useState('');
  const [editPmCatatan, setEditPmCatatan]     = useState('');
  const [editPmUrutan, setEditPmUrutan]       = useState('');
  const [editPmAktif, setEditPmAktif]         = useState(true);
  const [videoRatingStats, setVideoRatingStats] = useState<any[]>([]);
  const [adminReferrals, setAdminReferrals]     = useState<any[]>([]);
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
  const [bJenis, setBJenis] = useState<'broker'|'propfirm'>('broker');
  const [editBrokerId, setEditBrokerId] = useState<string | null>(null);
  const [editBNama, setEditBNama] = useState('');
  const [editBLink, setEditBLink] = useState('');
  const [editBDiskon, setEditBDiskon] = useState('');
  const [editBDesc, setEditBDesc] = useState('');
  const [editBUrutan, setEditBUrutan] = useState('');
  const [editBJenis, setEditBJenis] = useState<'broker'|'propfirm'>('broker');
  const [bLogoFile, setBLogoFile]   = useState<File|null>(null);
  const [bLogoPreview, setBLogoPreview] = useState('');
  const [editBLogoFile, setEditBLogoFile] = useState<File|null>(null);
  const [editBLogoPreview, setEditBLogoPreview] = useState('');
  const [editBLogoUrl, setEditBLogoUrl] = useState('');
  // Produk states
  const [products, setProducts]               = useState<any[]>([]);
  const [prodSubTab, setProdSubTab]           = useState<'katalog'|'kode-diskon'|'pesanan'>('katalog');
  const [discountCodes, setDiscountCodes]     = useState<any[]>([]);
  const [dcKode, setDcKode]                   = useState('');
  const [dcDiskon, setDcDiskon]               = useState('');
  const [dcAktif, setDcAktif]                 = useState(true);
  const [dcMaxPenggunaan, setDcMaxPenggunaan] = useState('');
  const [dcBerlakuHingga, setDcBerlakuHingga] = useState('');
  const [pNama, setPNama]                     = useState('');
  const [pDesc, setPDesc]                     = useState('');
  const [pHargaBulanan, setPHargaBulanan]     = useState('');
  const [pDiskonBulanan, setPDiskonBulanan]   = useState('');
  const [pHargaTahunan, setPHargaTahunan]     = useState('');
  const [pDiskonTahunan, setPDiskonTahunan]   = useState('');
  const [pHargaLifetime, setPHargaLifetime]   = useState('');
  const [pDiskonLifetime, setPDiskonLifetime] = useState('');
  const [pStatus, setPStatus]                 = useState<'tersedia'|'preorder'>('tersedia');
  const [pTanggalRilis, setPTanggalRilis]     = useState('');
  const [pTierAccess, setPTierAccess]         = useState<string[]>(['trial','bronze','gold','platinum']);
  const [pUrutan, setPUrutan]                 = useState('');
  const [pAktif, setPAktif]                   = useState(true);
  const [pGambarFile, setPGambarFile]         = useState<File|null>(null);
  const [pGambarPreview, setPGambarPreview]   = useState('');
  const [pVideoUrl, setPVideoUrl]             = useState('');
  const [editProdukId, setEditProdukId]       = useState<string|null>(null);
  const [editPNama, setEditPNama]             = useState('');
  const [editPDesc, setEditPDesc]             = useState('');
  const [editPHargaBulanan, setEditPHargaBulanan]     = useState('');
  const [editPDiskonBulanan, setEditPDiskonBulanan]   = useState('');
  const [editPHargaTahunan, setEditPHargaTahunan]     = useState('');
  const [editPDiskonTahunan, setEditPDiskonTahunan]   = useState('');
  const [editPHargaLifetime, setEditPHargaLifetime]   = useState('');
  const [editPDiskonLifetime, setEditPDiskonLifetime] = useState('');
  const [editPStatus, setEditPStatus]         = useState<'tersedia'|'preorder'>('tersedia');
  const [editPTanggalRilis, setEditPTanggalRilis] = useState('');
  const [editPTierAccess, setEditPTierAccess] = useState<string[]>(['trial','bronze','gold','platinum']);
  const [editPUrutan, setEditPUrutan]         = useState('');
  const [editPAktif, setEditPAktif]           = useState(true);
  const [editPGambarFile, setEditPGambarFile] = useState<File|null>(null);
  const [editPGambarPreview, setEditPGambarPreview] = useState('');
  const [editPGambarUrl, setEditPGambarUrl]   = useState('');
  const [editPVideoUrl, setEditPVideoUrl]     = useState('');
  // Orders states
  const [prodOrders, setProdOrders]           = useState<any[]>([]);
  const [orderFilter, setOrderFilter]         = useState<'all'|'pending'|'dibayar'|'aktif'>('all');
  const [orderSearch, setOrderSearch]         = useState('');
  const [orderCatatanMap, setOrderCatatanMap] = useState<Record<string,string>>({});
  const [announceChannel, setAnnounceChannel] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');
  const [announceSending, setAnnounceSending] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [requests, setRequests] = useState<AdvanceRequest[]>([]);
  const [progress, setProgress] = useState<Record<string,number>>({});
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
    const { data: prods } = await supabase.from('products').select('*').order('urutan', { ascending: true });
    const { data: ords }  = await supabase.from('orders').select('*, products(nama)').order('created_at', { ascending: false });
    const { data: dcodes } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
    try {
      const { data: pm } = await supabase.from('payment_methods').select('*').order('urutan', { ascending: true });
      if (pm) setPaymentMethods(pm);
    } catch(_e) {}
    const { data: js } = await supabase.from('live_schedules').select('*').order('urutan', { ascending: true });
    if (js) setLiveSchedules(js);
    // Video ratings
    try {
      const { data: ratD } = await supabase.from('video_ratings').select('video_id,rating');
      if (ratD) {
        const stats: Record<string,{judul:string,sum:number,count:number,total:number}> = {};
        ratD.forEach((r:any) => {
          if (!stats[r.video_id]) stats[r.video_id] = { judul:r.video_id, sum:0, count:0, total:0 };
          stats[r.video_id].sum += r.rating; stats[r.video_id].count++;
          stats[r.video_id].total = Math.round(stats[r.video_id].sum/stats[r.video_id].count*10)/10;
        });
        setVideoRatingStats(Object.values(stats).sort((a:any,b:any)=>b.total-a.total));
      }
    } catch(_e) {}
    // Referrals
    try {
      const { data: refD } = await supabase.from('referrals').select('*,referrer:members!referrals_referrer_id_fkey(nama,tier)').order('created_at',{ascending:false});
      if (refD) setAdminReferrals(refD);
    } catch(_e) {}
    // Prop firm rules
    try {
      const { data: prData } = await supabase.from('prop_firm_rules').select('id,judul,deskripsi,link,file_url,created_at').order('created_at', { ascending: false });
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
    if (prods)  setProducts(prods);
    if (ords)   setProdOrders(ords);
    if (dcodes) setDiscountCodes(dcodes);
    if (ul) setUlasanList(ul);
    if (cl) setClaims(cl);
    // Progress per member (persentase)
    try {
      const [{ data: progData }, { count: vidCount }] = await Promise.all([
        supabase.from('member_progress').select('member_id,status'),
        supabase.from('videos').select('id', { count: 'exact', head: true }),
      ]);
      if (progData && vidCount) {
        const counts: Record<string,number> = {};
        progData.forEach((p:any) => { if (p.status === 'selesai') counts[p.member_id] = (counts[p.member_id] || 0) + 1; });
        const map: Record<string,number> = {};
        Object.entries(counts).forEach(([mid, n]) => { map[mid] = Math.round((n as number) / vidCount * 100); });
        setProgress(map);
      }
    } catch(_) {}
  }

  // Broker CRUD
  async function uploadBrokerLogo(file: File): Promise<string|null> {
    const ext = file.name.split('.').pop();
    const fileName = `brokerlogo_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('materi').upload(fileName, file, { upsert: true, cacheControl: '3600' });
    if (error) { notify('Gagal upload logo: ' + error.message, 'err'); return null; }
    const { data } = supabase.storage.from('materi').getPublicUrl(fileName);
    return data.publicUrl;
  }
  async function addBroker() {
    if (!bNama || !bLink) { notify('Nama dan link wajib diisi.', 'err'); return; }
    setLoading(true);
    let logoUrl: string|null = null;
    if (bLogoFile) { logoUrl = await uploadBrokerLogo(bLogoFile); if (!logoUrl) { setLoading(false); return; } }
    const { error } = await supabase.from('brokers').insert({ nama: bNama, link: bLink, diskon: bDiskon || null, deskripsi: bDesc || null, urutan: parseInt(bUrutan) || 0, jenis: bJenis, logo_url: logoUrl });
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Berhasil ditambahkan!'); setBNama(''); setBLink(''); setBDiskon(''); setBDesc(''); setBUrutan(''); setBJenis('broker'); setBLogoFile(null); setBLogoPreview(''); loadData(); }
    setLoading(false);
  }
  async function deleteBroker(id: string) {
    if (!confirm('Hapus item ini?')) return;
    await supabase.from('brokers').delete().eq('id', id);
    loadData();
  }
  function startEditBroker(b: any) {
    setEditBrokerId(b.id); setEditBNama(b.nama); setEditBLink(b.link);
    setEditBDiskon(b.diskon || ''); setEditBDesc(b.deskripsi || ''); setEditBUrutan(String(b.urutan || 0));
    setEditBJenis(b.jenis === 'propfirm' ? 'propfirm' : 'broker');
    setEditBLogoUrl(b.logo_url || ''); setEditBLogoPreview(b.logo_url || ''); setEditBLogoFile(null);
  }
  async function saveEditBroker() {
    if (!editBrokerId || !editBNama || !editBLink) { notify('Nama dan link wajib diisi.', 'err'); return; }
    setLoading(true);
    let logoUrl = editBLogoUrl;
    if (editBLogoFile) { const uploaded = await uploadBrokerLogo(editBLogoFile); if (!uploaded) { setLoading(false); return; } logoUrl = uploaded; }
    const { error } = await supabase.from('brokers').update({ nama: editBNama, link: editBLink, diskon: editBDiskon || null, deskripsi: editBDesc || null, urutan: parseInt(editBUrutan) || 0, jenis: editBJenis, logo_url: logoUrl || null }).eq('id', editBrokerId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Berhasil diupdate!'); setEditBrokerId(null); setEditBLogoFile(null); setEditBLogoPreview(''); setEditBLogoUrl(''); loadData(); }
    setLoading(false);
  }

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
    if (!pNama || !pDesc) { notify('Nama dan deskripsi wajib diisi.', 'err'); return; }
    if (!pHargaBulanan && !pHargaTahunan && !pHargaLifetime) { notify('Minimal satu harga (Bulanan/Tahunan/Lifetime) harus diisi.', 'err'); return; }
    if (pStatus === 'preorder' && !pTanggalRilis) { notify('Tanggal rilis wajib diisi untuk pre-order.', 'err'); return; }
    setLoading(true);
    let gambarUrl: string|null = null;
    if (pGambarFile) { gambarUrl = await uploadProdukGambar(pGambarFile); if (!gambarUrl) { setLoading(false); return; } }
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
    setEditPHargaBulanan(p.harga_bulanan ? String(p.harga_bulanan) : '');
    setEditPDiskonBulanan(p.diskon_bulanan ? String(p.diskon_bulanan) : '');
    setEditPHargaTahunan(p.harga_tahunan ? String(p.harga_tahunan) : '');
    setEditPDiskonTahunan(p.diskon_tahunan ? String(p.diskon_tahunan) : '');
    setEditPHargaLifetime(p.harga_lifetime ? String(p.harga_lifetime) : '');
    setEditPDiskonLifetime(p.diskon_lifetime ? String(p.diskon_lifetime) : '');
    setEditPStatus(p.status || 'tersedia'); setEditPTanggalRilis(p.tanggal_rilis || '');
    setEditPTierAccess(p.tier_access || ['trial','bronze','gold','platinum']);
    setEditPUrutan(String(p.urutan || 0)); setEditPAktif(p.aktif !== false);
    setEditPGambarUrl(p.gambar_url || ''); setEditPGambarPreview(p.gambar_url || ''); setEditPGambarFile(null);
    setEditPVideoUrl(p.video_url || '');
  }

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

  async function addDiscountCode() {
    if (!dcKode.trim() || !dcDiskon) { notify('Kode dan besaran diskon wajib diisi.', 'err'); return; }
    const d = parseInt(dcDiskon);
    if (d < 1 || d > 100) { notify('Diskon harus antara 1–100%.', 'err'); return; }
    const { error } = await supabase.from('discount_codes').insert({
      kode: dcKode.toUpperCase().trim(),
      diskon: d,
      aktif: dcAktif,
      max_penggunaan: dcMaxPenggunaan ? parseInt(dcMaxPenggunaan) : null,
      berlaku_hingga: dcBerlakuHingga || null,
    });
    if (error) notify(error.message.includes('unique') ? 'Kode sudah terdaftar.' : 'Error: ' + error.message, 'err');
    else { notify('Kode diskon berhasil ditambahkan!'); setDcKode(''); setDcDiskon(''); setDcAktif(true); setDcMaxPenggunaan(''); setDcBerlakuHingga(''); loadData(); }
  }

  async function deleteDiscountCode(id: string) {
    if (!confirm('Hapus kode diskon ini?')) return;
    await supabase.from('discount_codes').delete().eq('id', id);
    loadData();
  }

  async function toggleDiscountCode(id: string, aktif: boolean) {
    await supabase.from('discount_codes').update({ aktif: !aktif }).eq('id', id);
    loadData();
  }

  async function addPaymentMethod() {
    if (!pmNamaBank || !pmNomorRek || !pmNamaRek) { setPmMsg('Nama bank, nomor rekening, dan atas nama wajib diisi.'); return; }
    const { error } = await supabase.from('payment_methods').insert({
      nama_bank: pmNamaBank, nomor_rekening: pmNomorRek, nama_rekening: pmNamaRek,
      catatan: pmCatatan || null, urutan: parseInt(pmUrutan) || 0, aktif: pmAktif,
    });
    if (error) { setPmMsg('Error: ' + error.message); return; }
    setPmMsg('✅ Metode pembayaran ditambahkan!');
    setTimeout(() => setPmMsg(''), 3000);
    setPmNamaBank(''); setPmNomorRek(''); setPmNamaRek(''); setPmCatatan(''); setPmUrutan(''); setPmAktif(true);
    loadData();
  }

  async function deletePaymentMethod(id: string) {
    if (!confirm('Hapus metode pembayaran ini?')) return;
    await supabase.from('payment_methods').delete().eq('id', id);
    loadData();
  }

  async function togglePaymentMethod(id: string, aktif: boolean) {
    await supabase.from('payment_methods').update({ aktif: !aktif }).eq('id', id);
    loadData();
  }

  function startEditPm(pm: any) {
    setEditPmId(pm.id); setEditPmNamaBank(pm.nama_bank); setEditPmNomorRek(pm.nomor_rekening);
    setEditPmNamaRek(pm.nama_rekening); setEditPmCatatan(pm.catatan||'');
    setEditPmUrutan(String(pm.urutan||0)); setEditPmAktif(pm.aktif !== false);
  }

  async function saveEditPm() {
    if (!editPmId || !editPmNamaBank || !editPmNomorRek || !editPmNamaRek) { setPmMsg('Semua field wajib diisi.'); return; }
    const { error } = await supabase.from('payment_methods').update({
      nama_bank: editPmNamaBank, nomor_rekening: editPmNomorRek, nama_rekening: editPmNamaRek,
      catatan: editPmCatatan || null, urutan: parseInt(editPmUrutan) || 0, aktif: editPmAktif,
    }).eq('id', editPmId);
    if (error) { setPmMsg('Error: ' + error.message); return; }
    setPmMsg('✅ Berhasil diupdate!'); setTimeout(() => setPmMsg(''), 3000);
    setEditPmId(null); loadData();
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
            { id: 'jurnal',  label: 'JURNAL MEMBER', count: null },
            ...(isSuperAdmin ? [{ id: 'admins', label: 'ADMIN', count: admins.length }] : []),
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              style={{fontFamily:'monospace',fontSize:11,fontWeight:700,letterSpacing:0.8,padding:'10px 18px',border:'none',cursor:'pointer',whiteSpace:'nowrap' as const,borderBottom: tab===t.id ? '2px solid #16a34a' : '2px solid transparent',background:'transparent',color: tab===t.id ? '#16a34a' : '#555',display:'flex',alignItems:'center',gap:6,transition:'color .15s'}}>
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
                    { l:'PERNAH LOGIN',    v:sudahLogin.length, c:'#16a34a', sub:`dari ${members.length} total` },
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
                  <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:12}}>// TAMBAH MEMBER BARU</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
                    <input type="text" value={mNama} onChange={e=>setMNama(e.target.value)} placeholder="Nama member"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <select value={mTier} onChange={e=>setMTier(e.target.value)}
                      style={{background:'#111',border:'1px solid #2a2a2a',color:mTier?'#e7e5e4':'#555',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',appearance:'none' as const,cursor:'pointer'}}>
                      <option value="">Pilih Tier</option>
                      {['SMC Trial','SMC Bronze','SMC Silver','SMC Gold Mentorship','SMC Platinum 1-on-1'].map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    <div style={{position:'relative' as const}}>
                      <input type={showMPass?'text':'password'} value={mPassword} onChange={e=>setMPassword(e.target.value)} placeholder="Password"
                        style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 44px 10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                        onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                      <button onClick={()=>setShowMPass(p=>!p)} style={{position:'absolute' as const,right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:14}}>{showMPass?'🙈':'👁'}</button>
                    </div>
                  </div>
                  <button onClick={addMember} disabled={loading}
                    style={{background:loading?'#1a1a1a':'#16a34a',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer',letterSpacing:0.5}}>
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
              <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:12}}>// DISCORD · BULK CONGRATS</div>
              <p style={{color:'#555',fontSize:12,fontFamily:'monospace',marginBottom:12,lineHeight:1.6}}>
                Channel ID Discord untuk kirim ucapan selamat saat member di-approve.
              </p>
              <div style={{display:'flex',gap:10}}>
                <input type="text" value={congratsChannelId} onChange={e=>setCongratsChannelId(e.target.value.trim())}
                  placeholder="Paste Channel ID Discord..."
                  style={{flex:1,background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',minWidth:200}}
                  onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <button onClick={sendBulkCongrats} disabled={sendingBulk||!congratsChannelId}
                  style={{background:sendingBulk||!congratsChannelId?'#1a1a1a':'#16a34a',color:sendingBulk||!congratsChannelId?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 18px',border:'none',cursor:sendingBulk||!congratsChannelId?'not-allowed':'pointer',letterSpacing:0.5,whiteSpace:'nowrap' as const}}>
                  {sendingBulk?'MENGIRIM...':'▸ KIRIM BULK ADVANCED'}
                </button>
              </div>
            </div>

            {/* Pending */}
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #1f1f1f'}}>
                <span style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1}}>// REQUEST MENUNGGU</span>
                <span style={{fontFamily:'monospace',background:'#0a1a0e',border:'1px solid #1a3a22',color:'#16a34a',fontSize:11,padding:'3px 10px',fontWeight:700}}>{pendingRequests.length} PENDING</span>
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
                        <span style={{fontFamily:'monospace',fontSize:10,background:'#0a1a0e',border:'1px solid #1a3a22',color:'#16a34a',padding:'2px 8px'}}>{req.member_tier}</span>
                      </div>
                      <div style={{fontFamily:'monospace',color:'#444',fontSize:11}}>{new Date(req.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
                      {req.alasan_tolak&&req.alasan_tolak.startsWith('Jurnal')&&(
                        <div style={{background:'#111',border:'1px solid #1a1a1a',padding:'12px',marginTop:8}}>
                          <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:10,marginBottom:8}}>// LINK JURNAL</div>
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
              <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:16}}>// KIRIM PENGUMUMAN KE DISCORD</div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'monospace',color:'#444',fontSize:10,letterSpacing:0.5,marginBottom:6}}>CHANNEL ID</div>
                <input type="text" value={announceChannel} onChange={e=>setAnnounceChannel(e.target.value.trim())} placeholder="Paste Channel ID Discord..."
                  style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                  onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <div style={{fontFamily:'monospace',color:'#333',fontSize:10,marginTop:4}}>Klik kanan channel Discord → Copy Channel ID (butuh Developer Mode aktif)</div>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:'monospace',color:'#444',fontSize:10,letterSpacing:0.5,marginBottom:6}}>PESAN PENGUMUMAN</div>
                <textarea value={announceMsg} onChange={e=>setAnnounceMsg(e.target.value)} rows={10}
                  placeholder={`Tulis pengumuman...\n\nSupport markdown Discord:\n# Heading\n**bold**\n_italic_\n> quote`}
                  style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const}}
                  onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <div style={{fontFamily:'monospace',color:'#333',fontSize:10,marginTop:4}}>{announceMsg.length} karakter</div>
              </div>
              {announceMsg && (
                <div style={{background:'#111',border:'1px solid #2a2a2a',padding:'14px',marginBottom:12}}>
                  <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:8}}>// PREVIEW</div>
                  <pre style={{color:'#aaa',fontSize:12,fontFamily:'monospace',whiteSpace:'pre-wrap' as const,margin:0}}>{announceMsg}</pre>
                </div>
              )}
              <button onClick={sendAnnounce} disabled={announceSending||!announceChannel||!announceMsg.trim()}
                style={{background:announceSending||!announceChannel||!announceMsg.trim()?'#1a1a1a':'#16a34a',color:announceSending||!announceChannel||!announceMsg.trim()?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'12px',border:'none',cursor:'pointer',letterSpacing:0.5,width:'100%'}}>
                {announceSending?'MENGIRIM...':'▸ KIRIM KE DISCORD'}
              </button>
            </div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'16px 20px'}}>
              <div style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1,marginBottom:10}}>// CARA AKTIFKAN DEVELOPER MODE</div>
              {['Buka Discord → Settings (ikon gear)','Klik Advanced','Aktifkan Developer Mode','Klik kanan channel → Copy Channel ID','Paste ID di kolom di atas'].map((step,i)=>(
                <div key={i} style={{display:'flex',gap:10,marginBottom:6,alignItems:'baseline'}}>
                  <span style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,flexShrink:0}}>{i+1}.</span>
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
              <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:16}}>// TAMBAH BROKER / PROP FIRM</div>
              {/* Jenis toggle */}
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                {(['broker','propfirm'] as const).map(j=>(
                  <button key={j} onClick={()=>setBJenis(j)}
                    style={{fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'6px 18px',border:`1px solid ${bJenis===j?'#16a34a':'#2a2a2a'}`,background:bJenis===j?'#0a1a0e':'transparent',color:bJenis===j?'#16a34a':'#555',cursor:'pointer'}}>
                    {j==='broker'?'🏦 BROKER':'🏢 PROP FIRM'}
                  </button>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                {[
                  {v:bNama,s:setBNama,ph:bJenis==='broker'?'Nama Broker':'Nama Prop Firm'},
                  {v:bLink,s:setBLink,ph:'Link Daftar (URL)'},
                  {v:bDiskon,s:setBDiskon,ph:bJenis==='broker'?'Diskon/Bonus (opsional)':'Challenge Fee (opsional)'},
                  {v:bUrutan,s:setBUrutan,ph:'Urutan tampil',type:'number'},
                ].map((f,i)=>(
                  <input key={i} type={f.type||'text'} value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}
                    style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                    onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                ))}
              </div>
              <textarea value={bDesc} onChange={e=>setBDesc(e.target.value)} placeholder="Deskripsi singkat" rows={2}
                style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:10}}
                onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
              {/* Logo upload */}
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:6}}>// LOGO (opsional)</div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  {bLogoPreview && <img src={bLogoPreview} alt="logo preview" style={{width:44,height:44,objectFit:'contain',borderRadius:8,border:'1px solid #2a2a2a',background:'#111'}}/>}
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:'#111',border:'1px solid #2a2a2a',padding:'8px 14px',fontFamily:'monospace',fontSize:11,color:'#aaa'}}>
                    {bLogoFile ? bLogoFile.name : '📁 Pilih file logo (PNG/JPG/SVG)'}
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                      const f = e.target.files?.[0]; if(!f) return;
                      setBLogoFile(f); setBLogoPreview(URL.createObjectURL(f));
                    }}/>
                  </label>
                  {bLogoPreview && <button onClick={()=>{setBLogoFile(null);setBLogoPreview('');}} style={{background:'transparent',border:'none',color:'#ef4444',cursor:'pointer',fontSize:12}}>✕ hapus</button>}
                </div>
              </div>
              <button onClick={addBroker} disabled={loading}
                style={{background:loading?'#1a1a1a':'#16a34a',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer',letterSpacing:0.5}}>
                {loading?'MENYIMPAN...':`+ TAMBAH ${bJenis==='broker'?'BROKER':'PROP FIRM'}`}
              </button>
            </div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{padding:'12px 20px',borderBottom:'1px solid #1a1a1a',display:'flex',gap:16,alignItems:'center'}}>
                <span style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1}}>// DAFTAR ({brokers.length})</span>
                <span style={{fontFamily:'monospace',fontSize:10,color:'#22ab94'}}>🏦 Broker: {brokers.filter(b=>b.jenis!=='propfirm').length}</span>
                <span style={{fontFamily:'monospace',fontSize:10,color:'#a855f7'}}>🏢 Prop Firm: {brokers.filter(b=>b.jenis==='propfirm').length}</span>
              </div>
              {!brokers.length && <div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— BELUM ADA DATA —</div>}
              {brokers.map(b=>{
                const isProp = b.jenis === 'propfirm';
                const accentColor = isProp ? '#a855f7' : '#22ab94';
                return (
                <div key={b.id} style={{borderBottom:'1px solid #111'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',gap:12}}>
                    <div style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:12}}>
                      {b.logo_url
                        ? <img src={b.logo_url} alt={b.nama} style={{width:36,height:36,objectFit:'contain',borderRadius:6,border:'1px solid #2a2a2a',background:'#111',flexShrink:0}}/>
                        : <div style={{width:36,height:36,borderRadius:6,background:'#1a1a1a',border:'1px solid #2a2a2a',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:accentColor,flexShrink:0}}>{b.nama?.[0]?.toUpperCase()}</div>
                      }
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontFamily:'monospace',fontSize:9,fontWeight:700,color:accentColor,background:`${accentColor}11`,border:`1px solid ${accentColor}33`,padding:'2px 7px'}}>{isProp?'PROP FIRM':'BROKER'}</span>
                          <span style={{fontWeight:700,fontSize:14}}>{b.nama}</span>
                          {b.diskon&&<span style={{fontFamily:'monospace',fontSize:10,background:'#0a1a0a',border:'1px solid #22ab94',color:'#22ab94',padding:'1px 6px'}}>{b.diskon}</span>}
                        </div>
                        {b.deskripsi&&<div style={{color:'#666',fontSize:12,marginBottom:2}}>{b.deskripsi}</div>}
                        <div style={{fontFamily:'monospace',color:'#22ab94',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{b.link}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button onClick={()=>editBrokerId===b.id?setEditBrokerId(null):startEditBroker(b)} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#666',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>EDIT</button>
                      <button onClick={()=>deleteBroker(b.id)} style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>HAPUS</button>
                    </div>
                  </div>
                  {editBrokerId===b.id&&(
                    <div style={{padding:'16px 20px',background:'#111',borderTop:'1px solid #1a1a1a'}}>
                      <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:10,marginBottom:10}}>// EDIT</div>
                      <div style={{display:'flex',gap:8,marginBottom:10}}>
                        {(['broker','propfirm'] as const).map(j=>(
                          <button key={j} onClick={()=>setEditBJenis(j)}
                            style={{fontFamily:'monospace',fontSize:10,fontWeight:700,padding:'5px 14px',border:`1px solid ${editBJenis===j?'#16a34a':'#2a2a2a'}`,background:editBJenis===j?'#0a1a0e':'transparent',color:editBJenis===j?'#16a34a':'#555',cursor:'pointer'}}>
                            {j==='broker'?'🏦 BROKER':'🏢 PROP FIRM'}
                          </button>
                        ))}
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                        {[
                          {v:editBNama,s:setEditBNama,ph:'Nama'},
                          {v:editBLink,s:setEditBLink,ph:'Link'},
                          {v:editBDiskon,s:setEditBDiskon,ph:'Diskon'},
                          {v:editBUrutan,s:setEditBUrutan,ph:'Urutan',type:'number'},
                        ].map((f,i)=>(
                          <input key={i} type={f.type||'text'} value={f.v} onChange={e=>f.s(e.target.value)} placeholder={f.ph}
                            style={{background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 12px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                            onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                        ))}
                      </div>
                      <textarea value={editBDesc} onChange={e=>setEditBDesc(e.target.value)} placeholder="Deskripsi" rows={2}
                        style={{width:'100%',background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 12px',fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:8}}/>
                      {/* Logo upload edit */}
                      <div style={{marginBottom:8}}>
                        <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:6}}>// LOGO</div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          {editBLogoPreview && <img src={editBLogoPreview} alt="logo" style={{width:40,height:40,objectFit:'contain',borderRadius:6,border:'1px solid #2a2a2a',background:'#0d0d0d'}}/>}
                          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',background:'#0d0d0d',border:'1px solid #2a2a2a',padding:'6px 12px',fontFamily:'monospace',fontSize:10,color:'#aaa'}}>
                            {editBLogoFile ? editBLogoFile.name : (editBLogoUrl ? 'Ganti logo...' : '📁 Upload logo')}
                            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                              const f = e.target.files?.[0]; if(!f) return;
                              setEditBLogoFile(f); setEditBLogoPreview(URL.createObjectURL(f));
                            }}/>
                          </label>
                          {editBLogoPreview && <button onClick={()=>{setEditBLogoFile(null);setEditBLogoPreview('');setEditBLogoUrl('');}} style={{background:'transparent',border:'none',color:'#ef4444',cursor:'pointer',fontSize:11}}>✕ hapus</button>}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>saveEditBroker()} style={{background:'#16a34a',color:'#fff',fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'7px 16px',border:'none',cursor:'pointer'}}>SIMPAN</button>
                        <button onClick={()=>setEditBrokerId(null)} style={{background:'transparent',color:'#666',fontFamily:'monospace',fontSize:11,padding:'7px 12px',border:'1px solid #2a2a2a',cursor:'pointer'}}>BATAL</button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB ULASAN ── */}
        {tab === 'ulasan' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #1f1f1f'}}>
                <span style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1}}>// ULASAN MENUNGGU</span>
                <span style={{fontFamily:'monospace',background:'#0a1a0e',border:'1px solid #1a3a22',color:'#16a34a',fontSize:11,padding:'3px 10px',fontWeight:700}}>{ulasanList.filter(u=>u.status==='pending').length} PENDING</span>
              </div>
              {ulasanList.filter(u=>u.status==='pending').length===0?(
                <div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— TIDAK ADA ULASAN PENDING —</div>
              ):ulasanList.filter(u=>u.status==='pending').map(u=>(
                <div key={u.id} style={{padding:'20px',borderBottom:'1px solid #1a1a1a'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap' as const,marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{u.nama}</div>
                      <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,marginBottom:4}}>{u.kelas}</div>
                      <div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{color:s<=u.rating?'#16a34a':'#333',fontSize:14}}>★</span>)}</div>
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
                <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:4}}>// KLAIM PARTNERSHIP</div>
                <div style={{color:'#666',fontSize:13}}>Verifikasi pendaftaran broker dari calon member gratis.</div>
              </div>
            </div>
            {/* Filter */}
            <div style={{display:'flex',gap:6}}>
              {(['all','pending','approved','rejected'] as const).map(s=>(
                <button key={s} onClick={()=>setClaimFilter(s)}
                  style={{fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'7px 14px',border:`1px solid ${claimFilter===s?'#16a34a':'#2a2a2a'}`,background:claimFilter===s?'#0a1a0e':'transparent',color:claimFilter===s?'#16a34a':'#555',cursor:'pointer',letterSpacing:0.5}}>
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
                        <span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,padding:'4px 12px',border:`1px solid ${claim.status==='pending'?'#1a3a22':claim.status==='approved'?'#0f2a1f':'#3a1a1a'}`,color:claim.status==='pending'?'#16a34a':claim.status==='approved'?'#22ab94':'#ef4444',background:claim.status==='pending'?'#0a1a0e':claim.status==='approved'?'#0a1a14':'#1a0f0f',whiteSpace:'nowrap' as const}}>
                          {claim.status==='pending'?'⏳ PENDING':claim.status==='approved'?'✓ DISETUJUI':'✕ DITOLAK'}
                        </span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
                        {[
                          {l:'BROKER',v:claim.broker,c:'#16a34a'},
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
              <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:14}}>// TAMBAH ADMIN BARU</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <input type="text" value={aUsername} onChange={e=>setAUsername(e.target.value)} placeholder="Username admin"
                  style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                  onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                <div style={{position:'relative' as const}}>
                  <input type={showAPass?'text':'password'} value={aPassword} onChange={e=>setAPassword(e.target.value)} placeholder="Password"
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 80px 10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                    onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                  <div style={{position:'absolute' as const,right:8,top:'50%',transform:'translateY(-50%)',display:'flex',gap:4}}>
                    <button onClick={()=>setShowAPass(p=>!p)} style={{background:'none',border:'none',cursor:'pointer',color:'#555',fontSize:13}}>{showAPass?'🙈':'👁'}</button>
                    <button onClick={()=>setAPassword(generatePassword())} style={{background:'none',border:'none',cursor:'pointer',color:'#16a34a',fontSize:10,fontFamily:'monospace'}}>GEN</button>
                  </div>
                </div>
              </div>
              <button onClick={addAdmin} disabled={loading}
                style={{background:loading?'#1a1a1a':'#16a34a',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer',letterSpacing:0.5}}>
                {loading?'MENYIMPAN...':'+ TAMBAH ADMIN'}
              </button>
            </div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
              <div style={{padding:'12px 20px',borderBottom:'1px solid #1a1a1a'}}><span style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1}}>// DAFTAR ADMIN ({admins.length})</span></div>
              {admins.map(a=>(
                <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #111'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:36,height:36,background:'#0a1a0e',border:'1px solid #1a3a22',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:14,color:'#16a34a',fontFamily:'monospace'}}>
                      {a.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13}}>@{a.username}</div>
                      <span style={{fontFamily:'monospace',fontSize:10,color:a.role==='superadmin'?'#16a34a':'#22ab94',background:a.role==='superadmin'?'#0a1a0e':'#0a1a14',border:`1px solid ${a.role==='superadmin'?'#1a3a22':'#0f2a1f'}`,padding:'1px 7px'}}>
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
                { id:'all',          label:'SEMUA',        color:'#16a34a' },
                { id:'intro',        label:'INTRO',        color:'#16a34a' },
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
              { id:'intro',         label:'INTRO',         color:'#16a34a' },
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
                              {!ytId && <div style={{position:'absolute' as const,top:8,left:8,fontFamily:'monospace',fontSize:9,background:'#0a1a0e',border:'1px solid #1a3a22',color:'#16a34a',padding:'2px 6px'}}>COMING SOON</div>}
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


        {/* ── TAB PRODUK ── */}
        {tab === 'produk' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Sub-tab toggle */}
            <div style={{display:'flex',gap:2,borderBottom:'1px solid #1f1f1f',paddingBottom:0,marginBottom:4}}>
              {([
                {id:'katalog',      label:'📦 KATALOG PRODUK'},
                {id:'kode-diskon',  label:'🎟️ KODE DISKON'},
                {id:'pesanan',      label:'🧾 PESANAN MASUK'},
              ] as {id:'katalog'|'kode-diskon'|'pesanan';label:string}[]).map(st=>(
                <button key={st.id} onClick={()=>setProdSubTab(st.id)}
                  style={{fontFamily:'monospace',fontSize:11,fontWeight:700,letterSpacing:0.8,padding:'8px 20px',border:'none',cursor:'pointer',borderBottom:prodSubTab===st.id?'2px solid #16a34a':'2px solid transparent',background:'transparent',color:prodSubTab===st.id?'#16a34a':'#555'}}>
                  {st.label}
                </button>
              ))}
            </div>

            {/* ── Sub-tab katalog ── */}
            {prodSubTab==='katalog' && (
              <>
                <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
                  <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:16}}>// TAMBAH PRODUK INDIKATOR</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                    <input value={pNama} onChange={e=>setPNama(e.target.value)} placeholder="Nama Produk"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <input type="number" value={pUrutan} onChange={e=>setPUrutan(e.target.value)} placeholder="Urutan tampil"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <div style={{display:'flex',gap:8,gridColumn:'1/-1'}}>
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
                  <textarea value={pDesc} onChange={e=>setPDesc(e.target.value)} placeholder="Deskripsi produk" rows={3}
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:10}}
                    onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
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
                  <div style={{marginBottom:10}}>
                    <div style={{fontFamily:'monospace',color:'#555',fontSize:10,marginBottom:6}}>// LINK VIDEO YOUTUBE (opsional)</div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <input value={pVideoUrl} onChange={e=>setPVideoUrl(e.target.value)} placeholder="https://youtu.be/... atau https://youtube.com/watch?v=..."
                        style={{flex:1,background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 14px',fontSize:12,fontFamily:'monospace',outline:'none'}}
                        onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                      {extractYtId(pVideoUrl) && (
                        <img src={`https://img.youtube.com/vi/${extractYtId(pVideoUrl)}/mqdefault.jpg`} alt="yt preview"
                          style={{width:80,height:45,objectFit:'cover',borderRadius:4,border:'1px solid #2a2a2a',flexShrink:0}}/>
                      )}
                    </div>
                  </div>
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
                            : p.video_url && extractYtId(p.video_url)
                              ? <img src={`https://img.youtube.com/vi/${extractYtId(p.video_url)}/mqdefault.jpg`} alt={p.nama} style={{width:44,height:44,objectFit:'cover',borderRadius:6,border:'1px solid #2a2a2a',flexShrink:0}}/>
                              : <div style={{width:44,height:44,borderRadius:6,background:'#1a1a1a',border:'1px solid #2a2a2a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>📊</div>
                          }
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap' as const}}>
                              <span style={{fontFamily:'monospace',fontSize:9,fontWeight:700,color:p.status==='preorder'?'#eab308':'#16a34a',background:p.status==='preorder'?'#1a150033':'#0a1a0e',border:`1px solid ${p.status==='preorder'?'#eab30833':'#16a34a33'}`,padding:'2px 7px'}}>
                                {p.status==='preorder'?`⏳ PRE-ORDER${p.tanggal_rilis?' · '+new Date(p.tanggal_rilis).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):''}` : '✅ TERSEDIA'}
                              </span>
                              <span style={{fontWeight:700,fontSize:14}}>{p.nama}</span>
                              {p.video_url && <span style={{fontFamily:'monospace',fontSize:9,color:'#f59e0b',border:'1px solid #f59e0b33',background:'#1a130033',padding:'2px 6px'}}>▶ VIDEO</span>}
                              {!p.aktif && <span style={{fontFamily:'monospace',fontSize:9,color:'#555',border:'1px solid #2a2a2a',padding:'2px 6px'}}>NON-AKTIF</span>}
                            </div>
                            <div style={{color:'#666',fontSize:12,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{p.deskripsi}</div>
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
                          </div>
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          <button onClick={()=>editProdukId===p.id?setEditProdukId(null):startEditProduk(p)}
                            style={{background:'transparent',border:'1px solid #2a2a2a',color:'#666',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>EDIT</button>
                          <button onClick={()=>deleteProduk(p.id)}
                            style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>HAPUS</button>
                        </div>
                      </div>
                      {editProdukId===p.id && (
                        <div style={{padding:'16px 20px',background:'#111',borderTop:'1px solid #1a1a1a'}}>
                          <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:10,marginBottom:10}}>// EDIT PRODUK</div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                            {[
                              {v:editPNama,s:setEditPNama,ph:'Nama Produk'},
                              {v:editPUrutan,s:setEditPUrutan,ph:'Urutan',type:'number'},
                            ].map((f,i)=>(
                              <input key={i} type={f.type||'text'} value={f.v} onChange={e=>(f.s as any)(e.target.value)} placeholder={f.ph}
                                style={{background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none'}}
                                onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                            ))}
                            <div style={{display:'flex',gap:6,gridColumn:'1/-1'}}>
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
                          <div style={{marginBottom:8}}>
                            <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:4}}>// LINK VIDEO YOUTUBE (opsional)</div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <input value={editPVideoUrl} onChange={e=>setEditPVideoUrl(e.target.value)} placeholder="https://youtu.be/..."
                                style={{flex:1,background:'#0d0d0d',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'7px 12px',fontSize:11,fontFamily:'monospace',outline:'none'}}
                                onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                              {extractYtId(editPVideoUrl) && (
                                <img src={`https://img.youtube.com/vi/${extractYtId(editPVideoUrl)}/mqdefault.jpg`} alt="yt preview"
                                  style={{width:64,height:36,objectFit:'cover',borderRadius:4,border:'1px solid #2a2a2a',flexShrink:0}}/>
                              )}
                              {editPVideoUrl && <button onClick={()=>setEditPVideoUrl('')} style={{background:'transparent',border:'none',color:'#ef4444',cursor:'pointer',fontSize:11}}>✕</button>}
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

            {/* ── Sub-tab kode diskon ── */}
            {prodSubTab==='kode-diskon' && (
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
                  <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:16}}>// BUAT KODE DISKON</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                    <input value={dcKode} onChange={e=>setDcKode(e.target.value.toUpperCase())} placeholder="KODE (huruf kapital)"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',letterSpacing:1}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <input type="number" value={dcDiskon} onChange={e=>setDcDiskon(e.target.value)} placeholder="Diskon % (1–100)"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <input type="number" value={dcMaxPenggunaan} onChange={e=>setDcMaxPenggunaan(e.target.value)} placeholder="Maks. penggunaan (opsional)"
                      style={{background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    <div>
                      <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:5}}>BERLAKU HINGGA (opsional)</div>
                      <input type="date" value={dcBerlakuHingga} onChange={e=>setDcBerlakuHingga(e.target.value)}
                        style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'10px 14px',fontSize:13,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                        onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                    <button onClick={()=>setDcAktif(v=>!v)}
                      style={{fontFamily:'monospace',fontSize:10,fontWeight:700,padding:'5px 16px',border:`1px solid ${dcAktif?'#16a34a':'#2a2a2a'}`,background:dcAktif?'#0a1a0e':'transparent',color:dcAktif?'#16a34a':'#555',cursor:'pointer'}}>
                      {dcAktif?'✅ AKTIF':'⛔ NON-AKTIF'}
                    </button>
                    <span style={{fontFamily:'monospace',fontSize:10,color:'#333'}}>Status kode saat dibuat</span>
                  </div>
                  <button onClick={addDiscountCode} disabled={loading}
                    style={{background:loading?'#1a1a1a':'#16a34a',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer'}}>
                    + BUAT KODE DISKON
                  </button>
                </div>

                <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f'}}>
                  <div style={{padding:'12px 20px',borderBottom:'1px solid #1a1a1a'}}>
                    <span style={{fontFamily:'monospace',color:'#555',fontSize:11,letterSpacing:1}}>// DAFTAR KODE DISKON ({discountCodes.length})</span>
                  </div>
                  {!discountCodes.length && <div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#333',fontSize:13}}>— BELUM ADA KODE DISKON —</div>}
                  {discountCodes.map(dc=>{
                    const expired = dc.berlaku_hingga && new Date(dc.berlaku_hingga) < new Date();
                    const habis   = dc.max_penggunaan && dc.terpakai >= dc.max_penggunaan;
                    const sc = (!dc.aktif||expired||habis) ? '#555' : '#16a34a';
                    return (
                      <div key={dc.id} style={{borderBottom:'1px solid #111',padding:'14px 20px',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap' as const}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap' as const}}>
                            <span style={{fontFamily:'monospace',fontSize:15,fontWeight:700,letterSpacing:1,color:'#e7e5e4'}}>{dc.kode}</span>
                            <span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:'#ef4444',border:'1px solid #ef444433',padding:'2px 8px'}}>-{dc.diskon}%</span>
                            <span style={{fontFamily:'monospace',fontSize:9,color:sc,border:`1px solid ${sc}44`,padding:'2px 7px'}}>
                              {!dc.aktif?'NON-AKTIF':expired?'KADALUARSA':habis?'HABIS':'AKTIF'}
                            </span>
                          </div>
                          <div style={{display:'flex',gap:14,flexWrap:'wrap' as const}}>
                            <span style={{fontFamily:'monospace',fontSize:10,color:'#666'}}>Terpakai: <span style={{color:'#aaa'}}>{dc.terpakai}{dc.max_penggunaan?`/${dc.max_penggunaan}`:''}</span></span>
                            {dc.berlaku_hingga && <span style={{fontFamily:'monospace',fontSize:10,color:'#666'}}>Berlaku hingga: <span style={{color:expired?'#ef4444':'#aaa'}}>{new Date(dc.berlaku_hingga).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</span></span>}
                          </div>
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          <button onClick={()=>toggleDiscountCode(dc.id, dc.aktif)}
                            style={{background:'transparent',border:`1px solid ${dc.aktif?'#2a2a2a':'#16a34a'}`,color:dc.aktif?'#666':'#16a34a',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>
                            {dc.aktif?'NONAKTIFKAN':'AKTIFKAN'}
                          </button>
                          <button onClick={()=>deleteDiscountCode(dc.id)}
                            style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'monospace',fontSize:10,padding:'5px 12px',cursor:'pointer'}}>HAPUS</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                          <div style={{fontFamily:'monospace',fontSize:11,color:'#888',marginBottom:2}}>📦 {(o as any).products?.nama||'—'}{o.plan_type ? <span style={{marginLeft:6,color:'#16a34a',fontSize:9,border:'1px solid #16a34a33',padding:'1px 6px'}}>{o.plan_type.toUpperCase()}</span> : ''}{o.kode_diskon ? <span style={{marginLeft:6,color:'#eab308',fontSize:9,border:'1px solid #eab30833',padding:'1px 6px'}}>🎟️ {o.kode_diskon} -{o.diskon_applied}%</span> : ''}</div>
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

        {/* ── TAB JADWAL LIVE ── */}
        {tab === 'jadwal' && (
          <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:700}}>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'20px 24px'}}>
              <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1,marginBottom:16}}>// TAMBAH JADWAL LIVE</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <div>
                  <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:5}}>HARI / TANGGAL</div>
                  <input value={jadwalHari} onChange={e=>setJadwalHari(e.target.value)} placeholder="cth: Senin / 26 Mei 2025"
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                    onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                </div>
                <div>
                  <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:5}}>JAM</div>
                  <input value={jadwalJam} onChange={e=>setJadwalJam(e.target.value)} placeholder="cth: 20.00 – 22.00 WIB"
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                    onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:5}}>NAMA SESI</div>
                <input value={jadwalSesi} onChange={e=>setJadwalSesi(e.target.value)} placeholder="cth: Live Trading + Market Analysis"
                  style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                  onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 80px',gap:10,marginBottom:12}}>
                <div>
                  <div style={{fontFamily:'monospace',color:'#444',fontSize:10,marginBottom:5}}>LINK GABUNG (opsional)</div>
                  <input value={jadwalLink} onChange={e=>setJadwalLink(e.target.value)} placeholder="https://discord.gg/... atau YouTube"
                    style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'9px 12px',fontSize:12,fontFamily:'monospace',outline:'none',boxSizing:'border-box' as const}}
                    onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#2a2a2a'}/>
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
                style={{background:loading?'#1a1a1a':'#16a34a',color:loading?'#444':'#000',fontFamily:'monospace',fontSize:12,fontWeight:700,padding:'10px 20px',border:'none',cursor:loading?'not-allowed':'pointer'}}>
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
                      <span style={{fontFamily:'monospace',color:'#16a34a',fontSize:12,fontWeight:700}}>{s.hari}</span>
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
            <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1}}>// PROP FIRM RULES</div>

            {/* Form tambah */}
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',borderRadius:8,padding:'18px'}}>
              <div style={{fontFamily:'monospace',color:'#666',fontSize:10,marginBottom:12,letterSpacing:0.5}}>TAMBAH PROP FIRM RULE BARU</div>
              <div style={{display:'flex',flexDirection:'column' as const,gap:8}}>
                <input value={newRuleName} onChange={e=>setNewRuleName(e.target.value)} placeholder="Judul (contoh: FTMO Challenge Rules, FundingPips Phase 1, dll)"
                  style={{background:'#111',border:'1px solid #2a2a2a',color:'#fff',padding:'10px 14px',fontFamily:'monospace',fontSize:12,borderRadius:6,outline:'none',width:'100%',boxSizing:'border-box' as const}}/>
                <input value={newRuleType} onChange={e=>setNewRuleType(e.target.value)} placeholder="Link (opsional — contoh: https://ftmo.com/rules)"
                  style={{background:'#111',border:'1px solid #2a2a2a',color:'#fff',padding:'10px 14px',fontFamily:'monospace',fontSize:12,borderRadius:6,outline:'none',width:'100%',boxSizing:'border-box' as const}}/>
                <textarea value={newRuleContent} onChange={e=>setNewRuleContent(e.target.value)} rows={7}
                  placeholder="Isi rules / penjelasan lengkap. Tulis bebas, contoh: Max Daily Loss: 5% | Max Total Loss: 10% | Profit Target: 10% | Min Trading Days: 4 | Leverage: 1:100"
                  style={{background:'#111',border:'1px solid #2a2a2a',color:'#fff',padding:'10px 14px',fontFamily:'monospace',fontSize:12,borderRadius:6,outline:'none',resize:'vertical' as const,width:'100%',boxSizing:'border-box' as const,lineHeight:1.6}}/>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',background:'#111',border:'1px solid #2a2a2a',borderRadius:6,cursor:'pointer'}} onClick={()=>document.getElementById('pfrFileInput')?.click()}>
                  <span style={{fontSize:16}}>📎</span>
                  <span style={{fontFamily:'monospace',fontSize:11,color:'#666'}}>Upload file PDF/gambar (opsional)</span>
                  <input id="pfrFileInput" type="file" accept=".pdf,.png,.jpg,.jpeg" style={{display:'none'}} onChange={async(e)=>{
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const ext = file.name.split('.').pop();
                    const path = `prop-rules/${Date.now()}.${ext}`;
                    const {error} = await supabase.storage.from('files').upload(path, file);
                    if (error) { notify('Gagal upload: '+error.message); return; }
                    const {data: urlData} = supabase.storage.from('files').getPublicUrl(path);
                    setNewRuleContent(prev => prev + (prev ? '\n\n' : '') + '[FILE] '+urlData.publicUrl);
                    notify('File berhasil diupload, URL ditambahkan ke deskripsi');
                  }}/>
                </div>
                <button onClick={async()=>{
                  if(!newRuleName.trim()){notify('Judul wajib diisi');return;}
                  try{
                    const {error}=await supabase.from('prop_firm_rules').insert({
                      judul: newRuleName.trim(),
                      link: newRuleType.trim()||null,
                      deskripsi: newRuleContent.trim()||null,
                    });
                    if(error)throw error;
                    notify('Rule berhasil ditambahkan!');
                    setNewRuleName('');setNewRuleType('');setNewRuleContent('');
                    loadData();
                  }catch(e:any){notify('Error: '+(e.message||JSON.stringify(e)));}
                }} style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:'#fff',background:'#16a34a',padding:'10px 20px',border:'none',cursor:'pointer',borderRadius:6,alignSelf:'flex-start' as const}}>
                  + TAMBAH RULE
                </button>
              </div>
            </div>

            {/* Daftar rules */}
            {propRules.length===0 ? (
              <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#444',fontSize:12,borderRadius:8}}>
                Belum ada prop firm rules. Tambahkan di atas.
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column' as const,gap:10}}>
                {propRules.map((r:any)=>(
                  <div key={r.id} style={{background:'#0d0d0d',border:'1px solid #1f1f1f',borderRadius:8,padding:'16px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10,gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{r.judul}</div>
                        {r.link&&<a href={r.link} target="_blank" rel="noopener noreferrer" style={{fontFamily:'monospace',fontSize:10,color:'#3b82f6',textDecoration:'none'}}>🔗 {r.link}</a>}
                      </div>
                      <button onClick={async()=>{if(!confirm('Hapus rule ini?'))return;await supabase.from('prop_firm_rules').delete().eq('id',r.id);loadData();}}
                        style={{fontFamily:'monospace',fontSize:9,color:'#ef4444',background:'#1a0a0a',border:'1px solid #ef444433',padding:'4px 10px',cursor:'pointer',borderRadius:4,flexShrink:0}}>HAPUS</button>
                    </div>
                    <div style={{fontFamily:'monospace',fontSize:12,color:'#888',whiteSpace:'pre-wrap' as const,lineHeight:1.7,borderTop:'1px solid #1a1a1a',paddingTop:10}}>
                      {r.deskripsi}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB RATING VIDEO ── */}
        {tab === 'rating' && (
          <div style={{display:'flex',flexDirection:'column',gap:12,maxWidth:720}}>
            <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1}}>// RATING VIDEO DARI MEMBER (Bintang 1-5)</div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',borderRadius:8,overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 100px 80px 80px',gap:'4px 10px',fontFamily:'monospace',fontSize:9,color:'#666',padding:'10px 16px',borderBottom:'1px solid #1a1a1a',letterSpacing:0.5}}>
                {['VIDEO','RATING','VOTER','SKOR'].map(h=><span key={h}>{h}</span>)}
              </div>
              {videoRatingStats.length===0 && <div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#444',fontSize:12}}>Belum ada rating. Pastikan tabel video_ratings sudah dibuat.</div>}
              {videoRatingStats.map((v:any,i:number)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 100px 80px 80px',gap:'4px 10px',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #111'}}>
                  <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{v.judul}</div>
                  <div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:12,color:v.total>=s?'#16a34a':'#333'}}>★</span>)}</div>
                  <span style={{fontFamily:'monospace',color:'#888',fontSize:11}}>{v.count} org</span>
                  <span style={{fontFamily:'monospace',fontWeight:700,fontSize:12,color:v.total>=4?'#22ab94':v.total>=3?'#16a34a':'#ef4444'}}>{v.total}/5</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB REFERRAL ── */}
        {tab === 'referral' && (
          <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:760}}>
            <div style={{fontFamily:'monospace',color:'#22ab94',fontSize:11,letterSpacing:1}}>// PROGRAM REFERRAL</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[
                {l:'Total', v:adminReferrals.length, c:'#e7e5e4'},
                {l:'Pending', v:adminReferrals.filter((r:any)=>r.status==='pending').length, c:'#16a34a'},
                {l:'Terverif', v:adminReferrals.filter((r:any)=>r.status!=='pending').length, c:'#22ab94'},
              ].map((s:any,i:number)=>(
                <div key={i} style={{background:'#0d0d0d',border:'1px solid #1f1f1f',borderRadius:8,padding:'14px 16px',textAlign:'center' as const}}>
                  <div style={{fontFamily:'monospace',color:'#444',fontSize:9,marginBottom:6}}>{s.l}</div>
                  <div style={{fontFamily:'monospace',fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            {adminReferrals.length===0 ? (
              <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#444',fontSize:12,borderRadius:8}}>Belum ada referral.</div>
            ) : (
              <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',borderRadius:8,overflow:'hidden'}}>
                <div style={{display:'grid',gridTemplateColumns:'1.2fr 1.2fr 90px 90px 110px',gap:'4px 10px',fontFamily:'monospace',fontSize:9,color:'#555',padding:'10px 18px',borderBottom:'1px solid #111'}}>
                  {['REFERRER','MEMBER BARU','TANGGAL','STATUS','AKSI'].map(h=><span key={h}>{h}</span>)}
                </div>
                {adminReferrals.map((r:any)=>(
                  <div key={r.id} style={{display:'grid',gridTemplateColumns:'1.2fr 1.2fr 90px 90px 110px',gap:'4px 10px',alignItems:'center',padding:'12px 18px',borderBottom:'1px solid #0d0d0d'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700}}>{r.referrer?.nama||r.referrer_id?.slice(0,8)||'—'}</div>
                      <div style={{fontFamily:'monospace',color:'#444',fontSize:9}}>{r.referrer?.tier?.replace('SMC ','')}</div>
                    </div>
                    <span style={{fontSize:12,color:'#888'}}>{r.referred_name||'—'}</span>
                    <span style={{fontFamily:'monospace',color:'#555',fontSize:10}}>{new Date(r.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span>
                    <span style={{fontFamily:'monospace',fontSize:10,fontWeight:700,color:r.status==='rewarded'?'#16a34a':r.status==='verified'?'#22ab94':'#666'}}>
                      {r.status==='rewarded'?'💰':r.status==='verified'?'✓':'⏳'} {r.status}
                    </span>
                    <div style={{display:'flex',gap:4}}>
                      {r.status==='pending'&&<button onClick={async()=>{await supabase.from('referrals').update({status:'verified'}).eq('id',r.id);notify('Terverifikasi ✅');loadData();}} style={{fontFamily:'monospace',fontSize:9,fontWeight:700,color:'#22ab94',background:'#0a1a14',border:'1px solid #22ab9444',padding:'4px 8px',cursor:'pointer',borderRadius:4}}>VERIF</button>}
                      {r.status==='verified'&&<button onClick={async()=>{await supabase.from('referrals').update({status:'rewarded'}).eq('id',r.id);notify('Reward diberikan 💰');loadData();}} style={{fontFamily:'monospace',fontSize:9,fontWeight:700,color:'#16a34a',background:'#0a1a0e',border:'1px solid #1a3a22',padding:'4px 8px',cursor:'pointer',borderRadius:4}}>REWARD</button>}
                      {r.status==='rewarded'&&<span style={{fontFamily:'monospace',fontSize:9,color:'#333'}}>selesai</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{background:'#0a0c00',border:'1px solid #1a3020',borderRadius:8,padding:'14px 18px'}}>
              <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:10,marginBottom:6}}>// CARA KERJA</div>
              <div style={{fontSize:12,color:'#666',lineHeight:1.7}}>1. Member dapat link: <span style={{color:'#22ab94',fontFamily:'monospace'}}>menolakrugi.pages.dev/signup?ref=KODE</span><br/>2. Member baru daftar → otomatis tercatat PENDING<br/>3. Admin VERIFIKASI setelah member baru aktif & bayar<br/>4. Admin BERI REWARD ke referrer (manual)</div>
            </div>
          </div>
        )}

        {/* ── TAB PROGRES BELAJAR ── */}
        {tab === 'progress' && (
          <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:800}}>
            <div style={{fontFamily:'monospace',color:'#16a34a',fontSize:11,letterSpacing:1}}>// PROGRES BELAJAR MEMBER</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {[
                {l:'Selesai Semua', v:members.filter((m:any)=>(progress[m.id]||0)>=100).length, c:'#22ab94'},
                {l:'Di atas 50%',   v:members.filter((m:any)=>{const p=progress[m.id]||0;return p>=50&&p<100;}).length, c:'#16a34a'},
                {l:'Di bawah 50%',  v:members.filter((m:any)=>{const p=progress[m.id]||0;return p>0&&p<50;}).length, c:'#f59e0b'},
                {l:'Belum Mulai',   v:members.filter((m:any)=>!(progress[m.id])).length, c:'#ef4444'},
              ].map((s:any,i:number)=>(
                <div key={i} style={{background:'#0d0d0d',border:`1px solid ${s.c}33`,borderRadius:8,padding:'12px',textAlign:'center' as const}}>
                  <div style={{fontFamily:'monospace',color:s.c,fontSize:22,fontWeight:700}}>{s.v}</div>
                  <div style={{fontFamily:'monospace',color:'#555',fontSize:9,marginTop:4}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#0d0d0d',border:'1px solid #1f1f1f',borderRadius:8,overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'32px 1fr 80px 140px 60px',gap:'4px 12px',fontFamily:'monospace',fontSize:9,color:'#555',padding:'10px 16px',borderBottom:'1px solid #1a1a1a',letterSpacing:0.5}}>
                <span>#</span><span>NAMA</span><span>TIER</span><span>PROGRESS</span><span>PCT</span>
              </div>
              {members.sort((a:any,b:any)=>(progress[b.id]||0)-(progress[a.id]||0)).slice(0,60).map((m:any,i:number)=>{
                const pct = progress[m.id]||0;
                return (
                <div key={m.id} style={{display:'grid',gridTemplateColumns:'32px 1fr 80px 140px 60px',gap:'4px 12px',alignItems:'center',padding:'10px 16px',borderBottom:'1px solid #0d0d0d'}}>
                  <span style={{fontFamily:'monospace',color:'#444',fontSize:10}}>{i+1}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:600}}>{m.nama}</div>
                    {m.is_advance&&<span style={{fontFamily:'monospace',fontSize:8,color:'#a855f7',border:'1px solid #a855f744',padding:'1px 5px',borderRadius:3}}>ADV</span>}
                  </div>
                  <span style={{fontFamily:'monospace',fontSize:10,color:'#666'}}>{m.tier?.replace('SMC ','').slice(0,8)}</span>
                  <div style={{height:5,background:'#111',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:pct+'%',background:pct>=100?'#22ab94':pct>=50?'#16a34a':'#f59e0b',borderRadius:3,transition:'width 0.5s ease'}}/>
                  </div>
                  <span style={{fontFamily:'monospace',fontSize:11,fontWeight:700,color:pct>=100?'#22ab94':pct>=50?'#16a34a':pct>0?'#f59e0b':'#333'}}>{pct}%</span>
                </div>
              );})}
              {members.length===0&&<div style={{padding:'32px',textAlign:'center' as const,fontFamily:'monospace',color:'#444',fontSize:12}}>Tidak ada data.</div>}
            </div>
          </div>
        )}

        {/* ── TAB PENGATURAN ── */}
        {tab === 'settings' && (
          <>
            <SettingsTab
              oldPass={oldPass} setOldPass={setOldPass}
              newPass={newPass} setNewPass={setNewPass}
              confirmPass={confirmPass} setConfirmPass={setConfirmPass}
              passErr={passErr} passMsg={passMsg}
              handleGantiPassword={handleGantiPassword}
            />
            <div style={{maxWidth:600,margin:'0 auto',padding:'0 16px 40px'}}>
              <div style={{fontFamily:'"Geist Mono",monospace',color:'#16a34a',fontSize:10,letterSpacing:2,marginBottom:8}}>// METODE PEMBAYARAN PRODUK</div>
              <h2 style={{fontSize:18,fontWeight:700,color:'#e7e5e4',marginBottom:20}}>Rekening Transfer Member</h2>

              {/* Form tambah */}
              <div style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:12,padding:20,marginBottom:20}}>
                <div style={{fontFamily:'"Geist Mono",monospace',color:'#555',fontSize:10,letterSpacing:1,marginBottom:14}}>+ TAMBAH METODE PEMBAYARAN</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  {([
                    {label:'NAMA BANK',v:pmNamaBank,s:setPmNamaBank,ph:'BCA / Mandiri / BRI / QRIS ...'},
                    {label:'NOMOR REKENING / ID',v:pmNomorRek,s:setPmNomorRek,ph:'Nomor rekening atau nomor QRIS'},
                    {label:'ATAS NAMA',v:pmNamaRek,s:setPmNamaRek,ph:'Nama pemilik rekening'},
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
                <textarea value={pmCatatan} onChange={e=>setPmCatatan(e.target.value)} rows={2} placeholder="Catatan / instruksi transfer (opsional)"
                  style={{width:'100%',background:'#0a0a0a',border:'1px solid #1e1e1e',color:'#e7e5e4',padding:'9px 12px',fontFamily:'"Geist Mono",monospace',fontSize:12,outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:10}}
                  onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#1e1e1e'}/>
                <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
                  <button onClick={()=>setPmAktif(v=>!v)}
                    style={{fontFamily:'"Geist Mono",monospace',fontSize:10,fontWeight:700,padding:'5px 14px',border:`1px solid ${pmAktif?'#16a34a':'#1e1e1e'}`,background:pmAktif?'#0a1a0e':'transparent',color:pmAktif?'#16a34a':'#555',cursor:'pointer',borderRadius:6}}>
                    {pmAktif?'✅ AKTIF':'⛔ NON-AKTIF'}
                  </button>
                </div>
                {pmMsg && <div style={{fontFamily:'"Geist Mono",monospace',fontSize:11,color:pmMsg.startsWith('✅')?'#22c55e':'#ef4444',marginBottom:10}}>{pmMsg}</div>}
                <button onClick={addPaymentMethod}
                  style={{background:'#16a34a',color:'#000',border:'none',padding:'10px 20px',fontFamily:'"Geist Mono",monospace',fontSize:12,fontWeight:700,cursor:'pointer',borderRadius:6}}>
                  + TAMBAH REKENING
                </button>
              </div>

              {/* Daftar metode */}
              <div style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'12px 18px',borderBottom:'1px solid #1e1e1e'}}>
                  <span style={{fontFamily:'"Geist Mono",monospace',color:'#555',fontSize:11,letterSpacing:1}}>// DAFTAR METODE PEMBAYARAN ({paymentMethods.length})</span>
                </div>
                {!paymentMethods.length && <div style={{padding:'28px',textAlign:'center' as const,fontFamily:'"Geist Mono",monospace',color:'#333',fontSize:12}}>— BELUM ADA METODE PEMBAYARAN —</div>}
                {paymentMethods.map(pm=>(
                  <div key={pm.id} style={{borderBottom:'1px solid #0d0d0d'}}>
                    <div style={{padding:'14px 18px',display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap' as const}}>
                          <span style={{fontWeight:700,fontSize:14,color:'#e7e5e4'}}>{pm.nama_bank}</span>
                          <span style={{fontFamily:'"Geist Mono",monospace',fontSize:13,letterSpacing:1,color:'#e7e5e4'}}>{pm.nomor_rekening}</span>
                          {!pm.aktif && <span style={{fontFamily:'"Geist Mono",monospace',fontSize:9,color:'#555',border:'1px solid #2a2a2a',padding:'1px 6px'}}>NON-AKTIF</span>}
                        </div>
                        <div style={{fontFamily:'"Geist Mono",monospace',fontSize:11,color:'#777',marginBottom:2}}>a.n. {pm.nama_rekening}</div>
                        {pm.catatan && <div style={{fontFamily:'"Geist Mono",monospace',fontSize:10,color:'#555',fontStyle:'italic'}}>{pm.catatan}</div>}
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button onClick={()=>editPmId===pm.id?setEditPmId(null):startEditPm(pm)}
                          style={{background:'transparent',border:'1px solid #2a2a2a',color:'#666',fontFamily:'"Geist Mono",monospace',fontSize:10,padding:'4px 10px',cursor:'pointer',borderRadius:4}}>EDIT</button>
                        <button onClick={()=>togglePaymentMethod(pm.id,pm.aktif)}
                          style={{background:'transparent',border:`1px solid ${pm.aktif?'#2a2a2a':'#16a34a'}`,color:pm.aktif?'#555':'#16a34a',fontFamily:'"Geist Mono",monospace',fontSize:10,padding:'4px 10px',cursor:'pointer',borderRadius:4}}>
                          {pm.aktif?'NONAKTIF':'AKTIFKAN'}
                        </button>
                        <button onClick={()=>deletePaymentMethod(pm.id)}
                          style={{background:'#1a0f0f',border:'1px solid #ef4444',color:'#ef4444',fontFamily:'"Geist Mono",monospace',fontSize:10,padding:'4px 10px',cursor:'pointer',borderRadius:4}}>HAPUS</button>
                      </div>
                    </div>
                    {editPmId===pm.id && (
                      <div style={{padding:'14px 18px',background:'#0d0d0d',borderTop:'1px solid #1a1a1a'}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                          {([
                            {label:'NAMA BANK',v:editPmNamaBank,s:setEditPmNamaBank,ph:'Nama bank'},
                            {label:'NOMOR REKENING',v:editPmNomorRek,s:setEditPmNomorRek,ph:'Nomor rekening'},
                            {label:'ATAS NAMA',v:editPmNamaRek,s:setEditPmNamaRek,ph:'Nama pemilik'},
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
                        <textarea value={editPmCatatan} onChange={e=>setEditPmCatatan(e.target.value)} rows={2} placeholder="Catatan (opsional)"
                          style={{width:'100%',background:'#111',border:'1px solid #2a2a2a',color:'#e7e5e4',padding:'8px 10px',fontFamily:'"Geist Mono",monospace',fontSize:11,outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const,marginBottom:8}}/>
                        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
                          <button onClick={()=>setEditPmAktif(v=>!v)}
                            style={{fontFamily:'"Geist Mono",monospace',fontSize:10,fontWeight:700,padding:'4px 12px',border:`1px solid ${editPmAktif?'#16a34a':'#2a2a2a'}`,background:editPmAktif?'#0a1a0e':'transparent',color:editPmAktif?'#16a34a':'#555',cursor:'pointer',borderRadius:4}}>
                            {editPmAktif?'✅ AKTIF':'⛔ NON-AKTIF'}
                          </button>
                        </div>
                        <div style={{display:'flex',gap:8}}>
                          <button onClick={saveEditPm} style={{background:'#16a34a',color:'#000',border:'none',padding:'8px 16px',fontFamily:'"Geist Mono",monospace',fontSize:11,fontWeight:700,cursor:'pointer',borderRadius:4}}>SIMPAN</button>
                          <button onClick={()=>setEditPmId(null)} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'8px 14px',fontFamily:'"Geist Mono",monospace',fontSize:11,cursor:'pointer',borderRadius:4}}>BATAL</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB JURNAL MEMBER ── */}
        {tab === 'jurnal' && (
          <JurnalAdminTab members={members} />
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
