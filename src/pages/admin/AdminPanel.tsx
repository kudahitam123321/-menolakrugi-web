import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminPage from '../AdminPage';

const G = { gold: 'var(--mr-gold)', gold2: 'var(--mr-gold2)', cyan: '#00d4ff', cyanDim: 'rgba(0,212,255,0.13)' };
const C = { bg: 'var(--mr-bg)', sidebar: 'var(--mr-sidebar)', panel: 'var(--mr-panel)', border: 'var(--mr-border)', border2: 'var(--mr-border2)', dim: 'var(--mr-dim)', text: 'var(--mr-text)', muted: 'var(--mr-muted)', up: 'var(--mr-up)', down: 'var(--mr-down)', mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif' };
const RANK_IMGS: Record<string, string> = {
  '1': '/rank_1.png', '2': '/rank_2.png', '3': '/rank_3.png',
  '4-10': '/rank_4-10.png', '11+': '/11_sampai_seterusnya.png',
};
function RankImg({ rank, size = 28 }: { rank: number; size?: number }) {
  const src = rank === 1 ? RANK_IMGS['1'] : rank === 2 ? RANK_IMGS['2'] : rank === 3 ? RANK_IMGS['3'] : rank <= 10 ? RANK_IMGS['4-10'] : RANK_IMGS['11+'];
  return <img src={src} alt={`rank-${rank}`} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />;
}

const SIDEBAR_SECTIONS = [
  { h: null, items: [{ id: 'dashboard', label: 'Dashboard', icon: '⊞' }] },
  { h: 'USER MANAGEMENT', items: [
    { id: 'member',    label: 'Member',           icon: '👥' },
    { id: 'progress',  label: 'Progress Belajar', icon: '📊' },
    { id: 'jurnal',    label: 'Jurnal Member',    icon: '📓' },
    { id: 'approvals', label: 'Persetujuan',      icon: '✅' },
    { id: 'admin',     label: 'Admin',            icon: '🛡' },
  ]},
  { h: 'CONTENT & EDUCATION', items: [
    { id: 'video',  label: 'Video & Materi', icon: '▶' },
    { id: 'rating', label: 'Rating Video',   icon: '⭐' },
  ]},
  { h: 'PARTNERSHIP & MONETIZATION', items: [
    { id: 'broker',    label: 'Broker',         icon: '🏦' },
    { id: 'referral',  label: 'Referral',        icon: '🔗' },
    { id: 'proprules', label: 'Prop Firm Rules', icon: '📋' },
  ]},
  { h: 'COMMUNICATION', items: [
    { id: 'pengumuman', label: 'Pengumuman',      icon: '📢' },
    { id: 'broadcast',  label: 'Pesan Broadcast', icon: '📡' },
  ]},
  { h: 'SYSTEM', items: [
    { id: 'log',        label: 'Log Activity', icon: '📜' },
    { id: 'pengaturan', label: 'Pengaturan',   icon: '⚙' },
  ]},
];

function getTabId(sidebarId: string): string {
  const map: Record<string,string> = {
    member:'member', progress:'progress', admin:'admins',
    video:'video', broker:'broker', proprules:'proprules', rating:'rating', referral:'referral',
    pengumuman:'announce', broadcast:'announce',
    jurnal:'jurnal',
    pengaturan:'settings',
  };
  return map[sidebarId] || sidebarId;
}

async function logActivity(action: string, detail: string, adminName = 'admin') {
  try {
    await supabase.from('activity_log').insert({ action, detail, admin_name: adminName });
  } catch(_) {}
}

function MiniChart({ data, color = G.gold, height = 80 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data); const min = Math.min(...data);
  const w = 400; const h = height;
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h - ((v-min)/(max-min||1))*(h-8) - 4}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"/>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#chartGrad)"/>
    </svg>
  );
}

function DonutSmall({ segments, size = 100 }: { segments: any[]; size?: number }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  if (!total) return <div style={{width:size,height:size,borderRadius:'50%',background:C.border,flexShrink:0}}/>;
  let angle = -90;
  const r = (size-8)/2; const cx = size/2; const cy = size/2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{flexShrink:0}}>
      {segments.map((s, i) => {
        const sweep = (s.value/total)*360;
        const a1 = angle*Math.PI/180; const a2 = (angle+sweep)*Math.PI/180;
        const x1 = cx+r*Math.cos(a1); const y1 = cy+r*Math.sin(a1);
        const x2 = cx+r*Math.cos(a2); const y2 = cy+r*Math.sin(a2);
        const large = sweep > 180 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        angle += sweep;
        return <path key={i} d={d} fill={s.color} opacity="0.85"/>;
      })}
      <circle cx={cx} cy={cy} r={r*0.58} fill={C.sidebar}/>
      <text x={cx} y={cy-4} textAnchor="middle" fill={C.text} fontSize={size/8} fontFamily={C.mono} fontWeight="700">{total.toLocaleString()}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fill={C.dim} fontSize={size/12} fontFamily={C.mono}>Total</text>
    </svg>
  );
}

const TIER_COLORS: Record<string,string> = {
  'SMC Trial':'#22ab94','SMC Bronze':'#f97316','SMC Silver':'#94a3b8',
  'SMC Gold Mentorship':'#eab308','SMC Platinum 1-on-1':'#a855f7',
};

// ── APPROVALS TAB (Ulasan + Advance Request + Klaim Partnership) ──────────────
function ApprovalsTab({ adminName }: { adminName: string }) {
  const [subtab, setSubtab] = useState<'ulasan'|'advance'|'klaim'>('ulasan');
  const [ulasan,  setUlasan]  = useState<any[]>([]);
  const [advance, setAdvance] = useState<any[]>([]);
  const [klaim,   setKlaim]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: u }, { data: av }, { data: kl }] = await Promise.all([
        supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
        supabase.from('advance_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('partnership_claims').select('*').order('created_at', { ascending: false }),
      ]);
      setUlasan(u || []);
      setAdvance(av || []);
      setKlaim(kl || []);
      setLoading(false);
    })();
  }, []);

  const pendingU = ulasan.filter(x => x.status === 'pending').length;
  const pendingA = advance.filter(x => x.status === 'pending').length;
  const pendingK = klaim.filter(x => x.status === 'pending').length;

  const badge = (n: number) => n > 0 ? (
    <span style={{ marginLeft:6, background:C.down, color:'#fff', borderRadius:'50%', fontSize:9, fontWeight:800, fontFamily:C.mono, minWidth:16, height:16, display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>{n}</span>
  ) : null;

  const tabBtn = (id: 'ulasan'|'advance'|'klaim', label: string, pending: number) => (
    <button onClick={() => setSubtab(id)} style={{ fontFamily:C.mono, fontSize:11, padding:'7px 16px', borderRadius:6, border:`1px solid ${subtab===id?G.gold:'var(--mr-border)'}`, background:subtab===id?'var(--mr-tint-gold)':'transparent', color:subtab===id?G.gold:C.muted, cursor:'pointer', display:'flex', alignItems:'center' }}>
      {label}{badge(pending)}
    </button>
  );

  async function dbUpdate(table: string, id: string, data: Record<string,unknown>): Promise<boolean> {
    const { error } = await (supabase.from(table as any).update(data).eq('id', id) as any);
    if (error) { alert(`Gagal menyimpan: ${error.message}\n\nPastikan RLS policy UPDATE sudah ditambahkan di Supabase.`); return false; }
    return true;
  }

  async function approveUlasan(id: string) {
    if (!await dbUpdate('testimonials', id, { status: 'disetujui' })) return;
    setUlasan(l => l.map(x => x.id === id ? { ...x, status: 'disetujui' } : x));
    await logActivity('approve_ulasan', `Ulasan disetujui (id: ${id})`, adminName);
  }
  async function rejectUlasan(id: string) {
    if (!await dbUpdate('testimonials', id, { status: 'ditolak' })) return;
    setUlasan(l => l.map(x => x.id === id ? { ...x, status: 'ditolak' } : x));
    await logActivity('reject_ulasan', `Ulasan ditolak (id: ${id})`, adminName);
  }
  async function approveAdvance(id: string, memberId: string) {
    const [r1, r2] = await Promise.all([
      supabase.from('advance_requests').update({ status: 'approved' }).eq('id', id),
      supabase.from('members').update({ is_advance: true }).eq('id', memberId),
    ]);
    if (r1.error || r2.error) {
      alert(`Gagal menyimpan: ${(r1.error||r2.error)?.message}\n\nPastikan RLS policy UPDATE sudah ditambahkan di Supabase.`);
      return;
    }
    setAdvance(l => l.map(x => x.id === id ? { ...x, status: 'approved' } : x));
    await logActivity('approve_advance', `Request advance disetujui (id: ${id})`, adminName);
  }
  async function rejectAdvance(id: string, reason = '') {
    if (!await dbUpdate('advance_requests', id, { status: 'rejected', alasan_tolak: reason || 'Ditolak oleh admin' })) return;
    setAdvance(l => l.map(x => x.id === id ? { ...x, status: 'rejected' } : x));
    await logActivity('reject_advance', `Request advance ditolak (id: ${id})`, adminName);
  }
  async function approveKlaim(id: string) {
    if (!await dbUpdate('partnership_claims', id, { status: 'approved' })) return;
    setKlaim(l => l.map(x => x.id === id ? { ...x, status: 'approved' } : x));
    await logActivity('approve_klaim', `Klaim partnership disetujui (id: ${id})`, adminName);
  }
  async function rejectKlaim(id: string) {
    if (!await dbUpdate('partnership_claims', id, { status: 'rejected' })) return;
    setKlaim(l => l.map(x => x.id === id ? { ...x, status: 'rejected' } : x));
    await logActivity('reject_klaim', `Klaim partnership ditolak (id: ${id})`, adminName);
  }

  const statusBadge = (s: string) => {
    const map: Record<string,{c:string,t:string}> = {
      pending:{c:G.gold,t:'PENDING'}, approved:{c:C.up,t:'APPROVED'}, disetujui:{c:C.up,t:'DISETUJUI'},
      rejected:{c:C.down,t:'DITOLAK'}, ditolak:{c:C.down,t:'DITOLAK'},
    };
    const x = map[s] || {c:C.muted,t:s?.toUpperCase()||'—'};
    return <span style={{ fontFamily:C.mono, fontSize:9, fontWeight:700, color:x.c, background:`${x.c}18`, border:`1px solid ${x.c}33`, padding:'2px 8px', borderRadius:4 }}>{x.t}</span>;
  };

  if (loading) return <div style={{ padding:40, fontFamily:C.mono, color:C.muted, fontSize:12, textAlign:'center' as const }}>Memuat data...</div>;

  return (
    <div style={{ padding:24 }}>
      <div style={{ fontFamily:C.mono, color:G.gold, fontSize:10, letterSpacing:2, marginBottom:8 }}>// PERSETUJUAN</div>
      <h2 style={{ fontSize:20, fontWeight:700, marginBottom:20 }}>Persetujuan Terpadu</h2>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {tabBtn('ulasan','✍ Ulasan Member', pendingU)}
        {tabBtn('advance','⬆ Request Advance', pendingA)}
        {tabBtn('klaim','🤝 Klaim Partnership', pendingK)}
      </div>

      {/* ── ULASAN ── */}
      {subtab === 'ulasan' && (
        <div style={{ display:'flex', flexDirection:'column' as const, gap:10 }}>
          <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, marginBottom:4 }}>Pending: {pendingU} · Total: {ulasan.length}</div>
          {ulasan.map(u => (
            <div key={u.id} style={{ background:'var(--mr-panel)', border:`1px solid ${u.status==='pending'?G.gold+'44':'var(--mr-border)'}`, borderRadius:10, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{u.nama || u.member_name || '—'}</div>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>{u.kelas || u.tier || ''} · {new Date(u.created_at).toLocaleDateString('id-ID')}</div>
                </div>
                {statusBadge(u.status)}
              </div>
              <div style={{ color:'#ccccdd', fontSize:12, lineHeight:1.6, marginBottom:12 }}>"{u.ulasan || u.content || ''}"</div>
              {u.status === 'pending' && (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => approveUlasan(u.id)} style={{ background:'var(--mr-tint-green)', border:`1px solid ${C.up}`, color:C.up, fontFamily:C.mono, fontSize:11, padding:'6px 16px', borderRadius:6, cursor:'pointer', fontWeight:700 }}>✓ Setujui → Landing</button>
                  <button onClick={() => rejectUlasan(u.id)} style={{ background:'var(--mr-tint-red)', border:`1px solid ${C.down}`, color:C.down, fontFamily:C.mono, fontSize:11, padding:'6px 16px', borderRadius:6, cursor:'pointer' }}>✕ Tolak</button>
                </div>
              )}
              {u.status === 'disetujui' && (
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontFamily:C.mono, fontSize:10, color:C.up }}>✓ Tampil di landing page</span>
                  <button onClick={() => rejectUlasan(u.id)} style={{ background:'transparent', border:`1px solid #333`, color:C.muted, fontFamily:C.mono, fontSize:10, padding:'4px 10px', borderRadius:5, cursor:'pointer' }}>Batalkan</button>
                </div>
              )}
              {u.status === 'ditolak' && (
                <button onClick={() => approveUlasan(u.id)} style={{ background:'transparent', border:`1px solid var(--mr-up-a27)`, color:C.up, fontFamily:C.mono, fontSize:10, padding:'4px 10px', borderRadius:5, cursor:'pointer' }}>↩ Setujui ulang</button>
              )}
            </div>
          ))}
          {ulasan.length === 0 && <div style={{ fontFamily:C.mono, color:C.muted, fontSize:12, padding:'32px 0', textAlign:'center' as const }}>Belum ada ulasan masuk.</div>}
        </div>
      )}

      {/* ── ADVANCE ── */}
      {subtab === 'advance' && (
        <div style={{ display:'flex', flexDirection:'column' as const, gap:10 }}>
          <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, marginBottom:4 }}>Pending: {pendingA} · Total: {advance.length}</div>
          {advance.map(r => (
            <div key={r.id} style={{ background:'var(--mr-panel)', border:`1px solid ${r.status==='pending'?'#a855f744':'var(--mr-border)'}`, borderRadius:10, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{r.member_nama || '—'}</div>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>{r.member_tier} · {new Date(r.created_at).toLocaleDateString('id-ID')}</div>
                </div>
                {statusBadge(r.status)}
              </div>
              {r.alasan_tolak && <div style={{ fontFamily:C.mono, fontSize:11, color:C.down, marginBottom:8 }}>Alasan tolak: {r.alasan_tolak}</div>}
              {r.status === 'pending' && (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => approveAdvance(r.id, r.member_id)} style={{ background:'var(--mr-tint-green)', border:`1px solid ${C.up}`, color:C.up, fontFamily:C.mono, fontSize:11, padding:'6px 16px', borderRadius:6, cursor:'pointer', fontWeight:700 }}>✓ Setujui Advance</button>
                  <button onClick={() => rejectAdvance(r.id)} style={{ background:'var(--mr-tint-red)', border:`1px solid ${C.down}`, color:C.down, fontFamily:C.mono, fontSize:11, padding:'6px 16px', borderRadius:6, cursor:'pointer' }}>✕ Tolak</button>
                </div>
              )}
            </div>
          ))}
          {advance.length === 0 && <div style={{ fontFamily:C.mono, color:C.muted, fontSize:12, padding:'32px 0', textAlign:'center' as const }}>Belum ada request advance.</div>}
        </div>
      )}

      {/* ── KLAIM ── */}
      {subtab === 'klaim' && (
        <div style={{ display:'flex', flexDirection:'column' as const, gap:10 }}>
          <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted, marginBottom:4 }}>Pending: {pendingK} · Total: {klaim.length}</div>
          {klaim.map(cl => (
            <div key={cl.id} style={{ background:'var(--mr-panel)', border:`1px solid ${cl.status==='pending'?'#3b82f644':'var(--mr-border)'}`, borderRadius:10, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{cl.nama_lengkap || cl.nama || '—'}</div>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:C.muted }}>
                    Broker: <span style={{ color:'#aaaadd' }}>{cl.broker}</span> · {new Date(cl.created_at).toLocaleDateString('id-ID')}
                  </div>
                  {cl.catatan && (
                    <div style={{ fontFamily:C.mono, fontSize:11, color:'#aaaacc', marginTop:6, lineHeight:1.6 }}>
                      {cl.catatan.split(' | ').map((line: string, i: number) => (
                        <div key={i} style={{ color: i === 0 ? '#ccccee' : C.muted }}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
                {statusBadge(cl.status)}
              </div>
              {cl.status === 'pending' && (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => approveKlaim(cl.id)} style={{ background:'var(--mr-tint-green)', border:`1px solid ${C.up}`, color:C.up, fontFamily:C.mono, fontSize:11, padding:'6px 16px', borderRadius:6, cursor:'pointer', fontWeight:700 }}>✓ Setujui Klaim</button>
                  <button onClick={() => rejectKlaim(cl.id)} style={{ background:'var(--mr-tint-red)', border:`1px solid ${C.down}`, color:C.down, fontFamily:C.mono, fontSize:11, padding:'6px 16px', borderRadius:6, cursor:'pointer' }}>✕ Tolak</button>
                </div>
              )}
            </div>
          ))}
          {klaim.length === 0 && <div style={{ fontFamily:C.mono, color:C.muted, fontSize:12, padding:'32px 0', textAlign:'center' as const }}>Belum ada klaim partnership.</div>}
        </div>
      )}
    </div>
  );
}

// ── LOG ACTIVITY TAB ──────────────────────────────────────────────────────────
function LogActivityTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(200);
        setLogs(data || []);
      } catch(_) { setLogs([]); }
      setLoading(false);
    })();
  }, []);

  const ACTION_ICON: Record<string,string> = {
    approve_ulasan:'✅', reject_ulasan:'❌', approve_advance:'⬆', reject_advance:'✕',
    approve_klaim:'🤝', reject_klaim:'❌', add_member:'👤', delete_member:'🗑',
    edit_member:'✏️', add_video:'▶', delete_video:'🗑', login:'🔐', default:'📝',
  };

  const filtered = filter ? logs.filter(l => l.action?.includes(filter) || l.detail?.toLowerCase().includes(filter.toLowerCase()) || l.admin_name?.toLowerCase().includes(filter.toLowerCase())) : logs;

  return (
    <div style={{ padding:24 }}>
      <div style={{ fontFamily:C.mono, color:G.gold, fontSize:10, letterSpacing:2, marginBottom:8 }}>// LOG AKTIVITAS</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:20, fontWeight:700, margin:0 }}>Log Activity</h2>
        <button onClick={async () => { setLoading(true); const { data } = await supabase.from('activity_log').select('*').order('created_at',{ascending:false}).limit(200); setLogs(data||[]); setLoading(false); }} style={{ fontFamily:C.mono, fontSize:10, color:G.gold, background:'var(--mr-tint-dark)', border:`1px solid var(--mr-gold-a27)`, padding:'6px 14px', borderRadius:6, cursor:'pointer' }}>↻ Refresh</button>
      </div>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter log..." style={{ width:'100%', background:'var(--mr-bg)', border:'1px solid #1e1e1e', color:C.text, padding:'9px 14px', borderRadius:8, fontFamily:C.mono, fontSize:12, outline:'none', marginBottom:16, boxSizing:'border-box' as const }} />
      {loading ? (
        <div style={{ fontFamily:C.mono, color:C.muted, fontSize:12, padding:'40px 0', textAlign:'center' as const }}>Memuat log...</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontFamily:C.mono, color:C.muted, fontSize:12, padding:'40px 0', textAlign:'center' as const }}>
          {logs.length === 0 ? 'Belum ada log aktivitas. Tabel activity_log perlu dibuat di Supabase.' : 'Tidak ada log yang cocok.'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column' as const, gap:6 }}>
          {filtered.map((l, i) => (
            <div key={l.id || i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 14px', background:'var(--mr-panel)', border:'1px solid var(--mr-border)', borderRadius:8 }}>
              <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{ACTION_ICON[l.action] || ACTION_ICON.default}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:C.text, fontWeight:600 }}>{l.detail || l.action}</div>
                <div style={{ fontFamily:C.mono, fontSize:9, color:C.muted, marginTop:3, display:'flex', gap:12 }}>
                  <span>Admin: {l.admin_name || '—'}</span>
                  <span>{l.action}</span>
                  <span>{new Date(l.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [active, setActive] = useState('dashboard');
  const [fundedModal, setFundedModal] = useState<{status:string;color:string;label:string;k:string}|null>(null);
  const [fundedMembers, setFundedMembers] = useState<any[]>([]);
  const [dash, setDash] = useState({
    total:0, active:0, pending:0, advance:0, neverLogin:0, memberProgress:[] as any[], journalLb:[] as any[],
    totalVideos:0, totalFiles:0, totalBrokers:0, totalClaims:0, totalUlasan:0, totalAnnounce:0,
    tierDist: [] as any[],
    completedMembers:0, partialMembers:0, notStarted:0, completionPct:0,
    totalFunded:0, fundedBreakdown:{} as Record<string,number>,
  });
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [topMembers, setTopMembers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<{id:string;type:string;label:string;sub:string;tab:string;subtab?:string;time:string}[]>([]);
  const [notifJudul, setNotifJudul] = useState('');
  const [notifMsg, setNotifMsg]     = useState('');
  const [notifSending, setNotifSending] = useState(false);
  const [notifSent, setNotifSent]   = useState(false);

  const GROWTH_DATA = [12,18,14,22,19,28,24,35,30,42,38,50,45,55,48,62,58,72,65,80,74,90,85,100,95,110,105,120,115,130];

  const adminData = (() => { try { return JSON.parse(localStorage.getItem('mr_admin')||'{}'); } catch { return {}; } })();

  useEffect(() => {
    const admin = localStorage.getItem('mr_admin');
    if (!admin) { window.location.href = '/login'; return; }
    loadDashboard();
    loadNotifications();
  }, []);

  async function loadNotifications() {
    const [
      { data: klaimData },
      { data: advanceData },
      { data: ulasanData },
    ] = await Promise.all([
      supabase.from('partnership_claims').select('id,nama_lengkap,nama,broker,created_at').eq('status','pending').order('created_at',{ascending:false}).limit(10),
      supabase.from('advance_requests').select('id,member_nama,member_tier,created_at').eq('status','pending').order('created_at',{ascending:false}).limit(10),
      supabase.from('testimonials').select('id,nama,member_name,kelas,created_at').eq('status','pending').order('created_at',{ascending:false}).limit(10),
    ]);
    const fmt = (iso: string) => {
      const diff = Date.now() - new Date(iso).getTime();
      const m = Math.floor(diff/60000); const h = Math.floor(m/60); const d = Math.floor(h/24);
      return d > 0 ? `${d} hari lalu` : h > 0 ? `${h} jam lalu` : m > 0 ? `${m} menit lalu` : 'Baru saja';
    };
    const notifs: typeof notifications = [
      ...(klaimData||[]).map((x:any) => ({
        id: 'k_'+x.id, type:'klaim', label: x.nama_lengkap||x.nama||'Anonim',
        sub: `Klaim partnership · ${x.broker||'—'}`, tab:'approvals', subtab:'klaim', time: fmt(x.created_at),
      })),
      ...(advanceData||[]).map((x:any) => ({
        id: 'a_'+x.id, type:'advance', label: x.member_nama||'—',
        sub: `Request advance · ${x.member_tier||''}`, tab:'approvals', subtab:'advance', time: fmt(x.created_at),
      })),
      ...(ulasanData||[]).map((x:any) => ({
        id: 'u_'+x.id, type:'ulasan', label: x.nama||x.member_name||'—',
        sub: `Ulasan member · ${x.kelas||''}`, tab:'approvals', subtab:'ulasan', time: fmt(x.created_at),
      })),
    ].sort((a,b) => a.time.localeCompare(b.time));
    setNotifications(notifs);
  }

  async function loadDashboard() {
    const [
      { count: total },
      { count: active24h },
      { count: neverLogin },
      { count: pendingKlaim },
      { count: pendingAdvance },
      { count: pendingUlasan },
      { count: advance },
      { data: members },
      { count: videos },
      { count: files },
      { count: brokers },
      { count: claims },
      { count: ulasan },
      { data: recentClaimsData },
      { data: topMembersData },
      { data: progressData },
      { data: fundedData },
      { data: fundedMembersData },
      { data: recentActivityData },
      { data: jEntries },
      { data: jSettings },
      { data: membersForLb },
    ] = await Promise.all([
      supabase.from('members').select('*',{count:'exact',head:true}),
      supabase.from('members').select('*',{count:'exact',head:true}).gte('last_seen', new Date(Date.now()-24*60*60*1000).toISOString()),
      supabase.from('members').select('*',{count:'exact',head:true}).is('last_seen',null),
      supabase.from('partnership_claims').select('*',{count:'exact',head:true}).eq('status','pending'),
      supabase.from('advance_requests').select('*',{count:'exact',head:true}).eq('status','pending'),
      supabase.from('testimonials').select('*',{count:'exact',head:true}).eq('status','pending'),
      supabase.from('members').select('*',{count:'exact',head:true}).eq('is_advance',true),
      supabase.from('members').select('tier'),
      supabase.from('videos').select('*',{count:'exact',head:true}),
      supabase.from('files').select('*',{count:'exact',head:true}),
      supabase.from('brokers').select('*',{count:'exact',head:true}),
      supabase.from('partnership_claims').select('*',{count:'exact',head:true}),
      supabase.from('testimonials').select('*',{count:'exact',head:true}),
      supabase.from('partnership_claims').select('*').order('created_at',{ascending:false}).limit(5),
      supabase.from('members').select('id,nama,tier,last_seen').not('last_seen','is',null).order('last_seen',{ascending:false}).limit(5),
      supabase.from('member_progress').select('member_id,status'),
      supabase.from('members').select('funded_status').not('funded_status','is',null),
      supabase.from('members').select('id,nama,tier,funded_status,discord_username').not('funded_status','is',null).order('funded_status'),
      supabase.from('activity_log').select('*').order('created_at',{ascending:false}).limit(6),
      supabase.from('trading_journals').select('member_id,pnl,hasil'),
      supabase.from('journal_settings').select('member_id,equity_awal'),
      supabase.from('members').select('id,nama,tier'),
    ]);
    const pending = (pendingKlaim||0) + (pendingAdvance||0) + (pendingUlasan||0);

    // Tier distribution
    const tierCount: Record<string,number> = {};
    (members||[]).forEach((m:any) => { tierCount[m.tier] = (tierCount[m.tier]||0)+1; });
    const tierDist = Object.entries(tierCount).map(([label,value]) => ({
      label: label.replace('SMC ','').replace(' Mentorship','').replace(' 1-on-1',''),
      value, color: TIER_COLORS[label]||'#666'
    })).sort((a,b)=>b.value-a.value);

    // Completion stats
    const totalVids = videos || 0;
    const progByMember: Record<string, number> = {};
    (progressData||[]).forEach((p: any) => {
      if (p.status === 'selesai') progByMember[p.member_id] = (progByMember[p.member_id]||0) + 1;
    });
    const completedMembers = Object.values(progByMember).filter(v => totalVids > 0 && v >= totalVids).length;
    const partialMembers   = Object.values(progByMember).filter(v => totalVids > 0 && v > 0 && v < totalVids).length;
    const notStarted       = (total||0) - completedMembers - partialMembers;
    const completionPct    = total ? Math.round((completedMembers / (total||1)) * 100) : 0;

    // Journal leaderboard (sorted by gain %)
    const eqMap: Record<string,number> = {};
    (jSettings||[]).forEach((s:any) => { eqMap[s.member_id] = s.equity_awal || 10000; });
    const pnlMap: Record<string,number> = {};
    const cntMap: Record<string,number> = {};
    const tpMap:  Record<string,number> = {};
    const slMap:  Record<string,number> = {};
    (jEntries||[]).forEach((e:any) => {
      pnlMap[e.member_id] = (pnlMap[e.member_id]||0) + (e.pnl||0);
      cntMap[e.member_id] = (cntMap[e.member_id]||0) + 1;
      if (e.hasil === 'Take Profit') tpMap[e.member_id] = (tpMap[e.member_id]||0) + 1;
      if (e.hasil === 'Stop Loss')   slMap[e.member_id] = (slMap[e.member_id]||0) + 1;
    });
    const journalLb = (membersForLb||[])
      .filter((m:any) => cntMap[m.id])
      .map((m:any) => {
        const ea = eqMap[m.id] || 10000;
        return { id:m.id, nama:m.nama, tier:m.tier, totalPnl:pnlMap[m.id]||0, gainPct:((pnlMap[m.id]||0)/ea)*100, trades:cntMap[m.id]||0, tp:tpMap[m.id]||0, sl:slMap[m.id]||0 };
      })
      .sort((a:any,b:any) => b.gainPct - a.gainPct);

    // Funded breakdown
    const fundedBreakdown: Record<string,number> = {};
    (fundedData||[]).forEach((m:any) => {
      if (m.funded_status) fundedBreakdown[m.funded_status] = (fundedBreakdown[m.funded_status]||0)+1;
    });
    const totalFunded = Object.values(fundedBreakdown).reduce((s,v)=>s+v, 0);

    setDash({
      total: total||0, active: active24h||0, pending,
      advance: advance||0, neverLogin: neverLogin||0,
      memberProgress: (membersForLb||[]).map((m:any)=>({...m,selesai:progByMember[m.id]||0})).sort((a:any,b:any)=>b.selesai-a.selesai),
      journalLb,
      totalVideos: videos||0, totalFiles: files||0, totalBrokers: brokers||0,
      totalClaims: claims||0, totalUlasan: ulasan||0, totalAnnounce: 0,
      tierDist, completedMembers, partialMembers, notStarted, completionPct,
      totalFunded, fundedBreakdown,
    });
    if (fundedMembersData) setFundedMembers(fundedMembersData);
    setRecentClaims(recentClaimsData||[]);
    setTopMembers(topMembersData||[]);
    const ACTION_ICON: Record<string,string> = {
      approve_ulasan:'✅', reject_ulasan:'❌', approve_advance:'⬆', reject_advance:'✕',
      approve_klaim:'🤝', reject_klaim:'❌', add_member:'👤', delete_member:'🗑',
      edit_member:'✏️', add_video:'▶', delete_video:'🗑', login:'🔐',
    };
    setRecentActivity((recentActivityData||[]).map((l:any) => ({
      icon: ACTION_ICON[l.action] || '📝',
      text: l.detail || l.action,
      time: (() => {
        const diff = Date.now() - new Date(l.created_at).getTime();
        const m = Math.floor(diff/60000); const h = Math.floor(m/60); const d = Math.floor(h/24);
        return d>0?`${d}h lalu`:h>0?`${h}j lalu`:m>0?`${m}m lalu`:'Baru saja';
      })(),
    })));
  }

  return (
    <>
    <style>{`
      /* ── FUTURISTIC ADMIN THEME ── */
      @keyframes ap-scan {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
      }
      @keyframes ap-pulse-border {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
      @keyframes ap-glow-in {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes ap-number-tick {
        from { opacity: 0; transform: scale(0.8); }
        to   { opacity: 1; transform: scale(1); }
      }
      .ap-card {
        background: var(--mr-panel) !important;
        border: 1px solid var(--mr-border) !important;
        border-radius: 12px !important;
        position: relative;
        overflow: hidden;
        transition: border-color 0.2s, box-shadow 0.2s !important;
        animation: ap-glow-in 0.4s ease both;
      }
      .ap-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #eab30844, transparent);
      }
      .ap-card:hover {
        border-color: #eab30833 !important;
        box-shadow: 0 0 24px rgba(234,179,8,0.06) !important;
      }
      .ap-kpi-card {
        background: linear-gradient(135deg, #0d0d14, #090910) !important;
        border: 1px solid #1a1a2a !important;
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        transition: all 0.2s;
        animation: ap-glow-in 0.4s ease both;
      }
      .ap-kpi-card::after {
        content: '';
        position: absolute;
        top: 0; right: 0;
        width: 60px; height: 60px;
        background: radial-gradient(circle, var(--kpi-color, #eab308) 0%, transparent 70%);
        opacity: 0.06;
      }
      .ap-kpi-card:hover { transform: translateY(-2px); }
      .ap-sidebar-item {
        position: relative;
        transition: all 0.15s !important;
      }
      .ap-sidebar-item:hover { background: #0f0f18 !important; }
      .ap-sidebar-item.ap-active::after {
        content: '';
        position: absolute;
        right: 0; top: 20%; bottom: 20%;
        width: 2px;
        background: #eab308;
        border-radius: 2px;
      }
      .ap-stat-num { animation: ap-number-tick 0.5s ease both; }
      .ap-funded-btn {
        position: relative;
        overflow: hidden;
        transition: all 0.2s !important;
      }
      .ap-funded-btn:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important; }
      .ap-topbar-glow {
        box-shadow: 0 1px 0 var(--mr-gold-a20), 0 4px 24px rgba(0,0,0,0.4) !important;
      }

      @media(max-width:1023px){
        .ap-sidebar{display:none!important}
        .ap-topbar{padding:0 16px!important}
        .ap-topbar-title{display:none!important}
        .ap-content{padding:16px!important}
        .ap-grid5{grid-template-columns:repeat(2,1fr)!important}
        .ap-grid6{grid-template-columns:repeat(3,1fr)!important}
        .ap-grid3col{grid-template-columns:1fr!important}
        .ap-grid2col{grid-template-columns:1fr!important}
        .ap-grid15{grid-template-columns:1fr!important}
        .ap-grid16{grid-template-columns:1fr!important}
        .ap-table-header{display:none!important}
        .ap-overview-row{flex-direction:column!important;gap:12px!important}
        .ap-klaim-row{grid-template-columns:1fr 1fr!important}
      }
      @media(max-width:767px){
        .ap-grid5{grid-template-columns:1fr 1fr!important}
        .ap-grid6{grid-template-columns:repeat(2,1fr)!important}
        .ap-klaim-row{grid-template-columns:1fr!important}
      }
    `}</style>
    <div style={{ fontFamily: C.sans, background: 'var(--mr-bg)', minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div className='ap-topbar ap-topbar-glow' style={{ borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--mr-sidebar)', height: 56, flexShrink: 0, position:'sticky' as const, top:0, zIndex:40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 36, height: 36 }}><img src='/logo.png' alt='MR' style={{ width: '100%', height: '100%', objectFit: 'contain' }}/></div>
          <span style={{ fontWeight: 800, fontSize: 14 }}>MENOLAK RUGI</span>
          <span style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, border: '1px solid var(--mr-tint-gold-b)', padding: '2px 8px', borderRadius: 4 }}>ADMIN PANEL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => { const h = document.documentElement; const n = h.getAttribute('data-theme') === 'light' ? 'dark' : 'light'; h.setAttribute('data-theme', n); localStorage.setItem('mr_theme', n); }}
            title="Toggle tema" style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 7, width: 32, height: 32, cursor: 'pointer', color: C.dim, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="mr-theme-icon-dark">🌙</span>
            <span className="mr-theme-icon-light">☀️</span>
          </button>
          <button onClick={() => window.location.href = '/'} style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, background: 'none', border: `1px solid ${C.border2}`, padding: '5px 12px', cursor: 'pointer', borderRadius: 5 }}>↗ Kembali ke Website</button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowNotif(v => !v); if (!showNotif) loadNotifications(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18 }}>🔔</span>
              {notifications.length > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, background: C.down, borderRadius: 8, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontWeight: 700, color: '#fff', padding: '0 3px' }}>
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
            {showNotif && (
              <>
                {/* backdrop */}
                <div onClick={() => setShowNotif(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                {/* dropdown */}
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 320, background: 'var(--mr-panel)', border: `1px solid ${C.border2}`, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: G.gold, letterSpacing: 1.5 }}>// NOTIFIKASI PENDING</span>
                    {notifications.length > 0 && (
                      <span style={{ fontFamily: C.mono, fontSize: 9, background: 'var(--mr-down-a13)', color: C.down, border: `1px solid var(--mr-down-a27)`, padding: '2px 7px', borderRadius: 4 }}>{notifications.length} pending</span>
                    )}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '28px 16px', textAlign: 'center' as const, fontFamily: C.mono, color: C.dim, fontSize: 12 }}>
                        ✅ Tidak ada notifikasi pending
                      </div>
                    ) : notifications.map(n => {
                      const TYPE_COLOR: Record<string,string> = { klaim:'#3b82f6', advance:'#a855f7', ulasan:G.gold };
                      const TYPE_ICON:  Record<string,string> = { klaim:'🤝', advance:'⬆', ulasan:'✍' };
                      const col = TYPE_COLOR[n.type] || C.muted;
                      return (
                        <div key={n.id} onClick={() => { setActive(n.tab); setShowNotif(false); }}
                          style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--mr-panel)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: col+'18', border: `1px solid ${col}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                            {TYPE_ICON[n.type]}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{n.label}</div>
                            <div style={{ fontFamily: C.mono, fontSize: 10, color: col, marginTop: 2 }}>{n.sub}</div>
                            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, marginTop: 3 }}>{n.time}</div>
                          </div>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: col, flexShrink: 0, marginTop: 6, boxShadow: `0 0 6px ${col}` }} />
                        </div>
                      );
                    })}
                  </div>
                  {notifications.length > 0 && (
                    <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                      <button onClick={() => { setActive('approvals'); setShowNotif(false); }}
                        style={{ width: '100%', background: 'var(--mr-panel)', border: `1px solid ${C.border2}`, color: G.gold, fontFamily: C.mono, fontSize: 10, padding: '8px', borderRadius: 6, cursor: 'pointer', letterSpacing: 1 }}>
                        LIHAT SEMUA PERSETUJUAN →
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,${G.gold},${G.gold2})`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#000' }}>
              {(adminData.username||'A')[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{adminData.username||'Admin'}</span>
          </div>
          <button onClick={() => { localStorage.removeItem('mr_admin'); localStorage.removeItem('mr_member'); window.location.href = '/login'; }}
            style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside className='ap-sidebar' style={{ width: 220, background: 'var(--mr-sidebar)', borderRight: `1px solid ${C.border}`, flexShrink: 0, overflowY: 'auto' }}>
          {SIDEBAR_SECTIONS.map((section, si) => (
            <div key={si} style={{ padding: section.h ? '16px 0 0' : '8px 0 0' }}>
              {section.h && <div style={{ fontFamily: C.mono, color: '#666677', fontSize: 8, letterSpacing: 2, padding: '0 16px 2px', marginBottom: 4, borderBottom: '1px solid #111118', textTransform: 'uppercase' as const }}>// {section.h}</div>}
              {section.items.map(item => {
                const isA = active === item.id;
                return (
                  <button key={item.id} onClick={() => setActive(item.id)}
                    className={`ap-sidebar-item${isA ? ' ap-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 16px', border: 'none', borderLeft: isA ? `2px solid ${G.gold}` : '2px solid transparent', background: isA ? 'linear-gradient(90deg,#1a150022,transparent)' : 'transparent', color: isA ? G.gold : '#9999bb', cursor: 'pointer', fontSize: 12, fontFamily: isA ? C.mono : 'inherit', textAlign: 'left' as const, letterSpacing: isA ? 0.3 : 0 }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ padding: '16px' }}>
            <button onClick={() => { localStorage.removeItem('mr_admin'); localStorage.removeItem('mr_member'); window.location.href = '/login'; }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 0', background: 'none', border: 'none', color: '#aaaacc', cursor: 'pointer', fontSize: 13 }}>
              <span>⏻</span> Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'radial-gradient(ellipse at 20% 0%, #0a0a1400 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, #0a1a0a08 0%, transparent 50%)' }}>
          {active === 'approvals' ? (
            <ApprovalsTab adminName={adminData.username||'admin'} />
          ) : active === 'log' ? (
            <LogActivityTab />
          ) : active !== 'dashboard' ? (
            <AdminPage key={getTabId(active)} embedded={true} initialTab={getTabId(active)} />
          ) : (
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontFamily:C.mono, color:G.gold, fontSize:9, letterSpacing:2.5, marginBottom:8, opacity:0.7 }}>// ADMIN CONTROL CENTER</div>
                  <h1 style={{ fontSize:28, fontWeight:800, margin:0, marginBottom:4, letterSpacing:-1, background:'linear-gradient(90deg,#e2e0ff,#9999bb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Dashboard</h1>
                  <p style={{ color:'#9999bb', fontSize:12, margin:0, fontFamily:C.mono }}>Selamat datang, <span style={{color:G.gold}}>{adminData.username||'Admin'}</span></p>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:'#9999bb', background:'var(--mr-panel)', border:'1px solid #16162a', padding:'8px 14px', borderRadius:8 }}>
                    📅 {new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}
                  </div>
                  <button onClick={loadDashboard} style={{ fontFamily:C.mono, fontSize:10, color:G.gold, background:'var(--mr-tint-dark)', border:'1px solid #2a2000', padding:'8px 14px', cursor:'pointer', borderRadius:8, transition:'all 0.2s' }}>↻ Refresh</button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className='ap-grid5' style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
                {([
                  { l:'TOTAL MEMBER',   v:dash.total,      sub:'+18 bulan ini',    c:'#00d4ff', icon:'⬡', bg:'#00d4ff' },
                  { l:'ACTIVE MEMBER',  v:dash.active,     sub:`${Math.round(dash.active/Math.max(dash.total,1)*100)}% dari total`, c:C.up,     icon:'◈', bg:C.up },
                  { l:'PENDING CLAIM',  v:dash.pending,    sub:'Advance+Klaim+Ulasan', c:G.gold, icon:'◎', bg:G.gold, onClick:()=>setActive('approvals') },
                  { l:'ADVANCE MEMBER', v:dash.advance,    sub:`${Math.round(dash.advance/Math.max(dash.total,1)*100)}% dari total`, c:'#a855f7', icon:'⬆', bg:'#a855f7' },
                  { l:'NON ACTIVE',     v:dash.neverLogin, sub:'Belum pernah login', c:C.down,  icon:'◇', bg:C.down },
                ] as any[]).map((s,i)=>(
                  <div key={i} onClick={s.onClick} style={{ background:`linear-gradient(145deg,#0b0b14,#080810)`, border:`1px solid #1a1a2a`, borderRadius:14, padding:'20px 16px', position:'relative', overflow:'hidden', cursor:s.onClick?'pointer':'default', transition:'transform 0.2s,box-shadow 0.2s' }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 12px 32px ${s.bg}18`; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='none'; }}>
                    {/* glow orb */}
                    <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle,${s.bg}22,transparent 70%)`, pointerEvents:'none' }}/>
                    <div style={{ fontFamily:C.mono, color:'#8888bb', fontSize:9, letterSpacing:1.5, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span>{s.l}</span>
                      <span style={{ color:s.c, fontSize:16, opacity:0.5 }}>{s.icon}</span>
                    </div>
                    <div style={{ fontSize:36, fontWeight:800, letterSpacing:-2, color:s.c, fontFamily:C.mono, lineHeight:1 }}>{s.v.toLocaleString()}</div>
                    <div style={{ fontFamily:C.mono, fontSize:9, color:'#9999bb', marginTop:10, padding:'3px 7px', background:`${s.bg}11`, border:`1px solid ${s.bg}22`, borderRadius:4, display:'inline-block' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* ── Kirim Notifikasi ke Semua Member ── */}
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px' }}>
                <div style={{ fontFamily: C.mono, color: G.gold, fontSize: 9, letterSpacing: 2, marginBottom: 14 }}>// KIRIM NOTIFIKASI / PENGUMUMAN</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    <input value={notifJudul} onChange={e => setNotifJudul(e.target.value)} placeholder="Judul pengumuman..."
                      style={{ background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, outline: 'none', borderRadius: 7, width: '100%', boxSizing: 'border-box' as const }}
                      onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border2}/>
                    <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="Isi pesan / pengumuman untuk semua member..."
                      rows={2} style={{ background: C.bg, border: `1px solid ${C.border2}`, color: C.text, padding: '8px 12px', fontSize: 12, fontFamily: C.mono, outline: 'none', borderRadius: 7, width: '100%', resize: 'none' as const, boxSizing: 'border-box' as const }}
                      onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border2}/>
                  </div>
                  <button disabled={notifSending || !notifMsg.trim()} onClick={async () => {
                    if (!notifMsg.trim()) return;
                    setNotifSending(true);
                    const { error } = await (supabase.from('announcements' as any).insert({ judul: notifJudul.trim() || 'Pengumuman', content: notifMsg.trim(), type: 'info' }) as any);
                    setNotifSending(false);
                    if (!error) { setNotifJudul(''); setNotifMsg(''); setNotifSent(true); setTimeout(() => setNotifSent(false), 3000); await logActivity('kirim_notif', `Pengumuman: ${notifJudul || notifMsg.slice(0,40)}`, adminData.username); }
                    else { alert(`Gagal kirim: ${error.message}`); }
                  }}
                    style={{ background: notifSent ? C.up : G.gold, color: '#000', fontFamily: C.mono, fontSize: 11, fontWeight: 700, padding: '0 18px', border: 'none', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' as const, alignSelf: 'stretch', opacity: (notifSending || !notifMsg.trim()) ? 0.5 : 1 }}>
                    {notifSent ? '✅ TERKIRIM' : notifSending ? '...' : '📢 KIRIM'}
                  </button>
                </div>
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, marginTop: 8 }}>
                  Pengumuman akan tampil di notifikasi bell 🔔 semua member yang sudah login.
                </div>
              </div>

              {/* Row 2 — 3 columns */}
              <div className='ap-grid3col' style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>

                {/* Distribusi Membership */}
                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#eab30844,transparent)' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:C.mono, color:G.gold, fontSize:9, letterSpacing:2 }}>// DISTRIBUSI TIER</div>
                    <button onClick={()=>setActive('member')} style={{ fontFamily:C.mono, fontSize:9, color:'#9999bb', background:'var(--mr-panel)', border:'1px solid #1a1a2a', padding:'3px 9px', cursor:'pointer', borderRadius:4 }}>DETAIL ›</button>
                  </div>
                  <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                    <DonutSmall segments={dash.tierDist} size={90}/>
                    <div style={{ flex:1, overflow:'hidden' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'4px 8px', fontFamily:C.mono, fontSize:10 }}>
                        <span style={{color:'#666677'}}>TIER</span>
                        <span style={{color:'#666677',textAlign:'right' as const}}>JML</span>
                        <span style={{color:'#666677',textAlign:'right' as const}}>%</span>
                        {dash.tierDist.map((t:any)=>(
                          <React.Fragment key={t.label}>
                            <div style={{display:'flex',alignItems:'center',gap:5}}>
                              <div style={{width:5,height:5,borderRadius:'50%',background:t.color,flexShrink:0,boxShadow:`0 0 6px ${t.color}`}}/>
                              <span style={{color:'#555566',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,fontSize:10}}>{t.label}</span>
                            </div>
                            <span style={{color:C.text,textAlign:'right' as const,fontWeight:700,fontSize:12}}>{t.value}</span>
                            <span style={{color:'#9999bb',textAlign:'right' as const,fontSize:10}}>{Math.round(t.value/Math.max(dash.total,1)*100)}%</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Penyelesaian Materi */}
                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#00e5a044,transparent)' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:C.mono, color:C.up, fontSize:9, letterSpacing:2 }}>// PENYELESAIAN MATERI</div>
                    <button onClick={()=>setActive('progress')} style={{ fontFamily:C.mono, fontSize:9, color:'#9999bb', background:'var(--mr-panel)', border:'1px solid #1a1a2a', padding:'3px 9px', cursor:'pointer', borderRadius:4 }}>DETAIL ›</button>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16, padding:'12px', background:'var(--mr-bg)', borderRadius:10, border:'1px solid #111120' }}>
                    <div style={{ position:'relative', width:60, height:60, flexShrink:0 }}>
                      <svg viewBox="0 0 64 64" width="60" height="60">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#111120" strokeWidth="7"/>
                        <circle cx="32" cy="32" r="26" fill="none" stroke={C.up} strokeWidth="7"
                          strokeDasharray={`${2*Math.PI*26}`}
                          strokeDashoffset={`${2*Math.PI*26*(1-dash.completionPct/100)}`}
                          strokeLinecap="round" transform="rotate(-90 32 32)" style={{filter:`drop-shadow(0 0 4px ${C.up})`}}/>
                      </svg>
                      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:C.mono, fontSize:11, fontWeight:700, color:C.up }}>{dash.completionPct}%</div>
                    </div>
                    <div>
                      <div style={{ fontFamily:C.mono, color:'#9999bb', fontSize:9, marginBottom:3 }}>TINGKAT PENYELESAIAN</div>
                      <div style={{ fontSize:16, fontWeight:700, color:C.up }}>{dash.completedMembers} selesai</div>
                      <div style={{ fontFamily:C.mono, fontSize:9, color:'var(--mr-border2)' }}>dari {dash.total} total</div>
                    </div>
                  </div>
                  {[
                    { l:'Selesai', v:dash.completedMembers, c:C.up },
                    { l:'Belajar', v:dash.partialMembers,   c:G.gold },
                    { l:'Belum',   v:dash.notStarted,       c:C.down },
                  ].map((row,i)=>{
                    const pct = dash.total ? Math.round(row.v/dash.total*100) : 0;
                    return (
                    <div key={i} style={{marginBottom:8}}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:4, fontFamily:C.mono }}>
                        <span style={{color:'#aaaacc'}}>{row.l}</span>
                        <span style={{color:row.c}}>{row.v} <span style={{color:'#9999bb'}}>({pct}%)</span></span>
                      </div>
                      <div style={{height:3,background:'var(--mr-panel)',borderRadius:2}}>
                        <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${row.c},${row.c}88)`,borderRadius:2,boxShadow:`0 0 6px ${row.c}44`,transition:'width 0.8s ease'}}/>
                      </div>
                    </div>
                  )})}
                </div>

                {/* Ringkasan Sistem */}
                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#a855f744,transparent)' }}/>
                  <div style={{ fontFamily:C.mono, color:'#a855f7', fontSize:9, letterSpacing:2, marginBottom:16 }}>// RINGKASAN SISTEM</div>
                  <div className='ap-grid2col' style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {([
                      {l:'Total Video',   v:dash.totalVideos,  icon:'▶', c:'#3b82f6'},
                      {l:'File Materi',   v:dash.totalFiles,   icon:'📄', c:'#a855f7'},
                      {l:'Total Broker',  v:dash.totalBrokers, icon:'🏦', c:G.gold},
                      {l:'Partnership',   v:dash.totalClaims,  icon:'🤝', c:C.up},
                      {l:'Pending Claim', v:dash.pending,      icon:'⏳', c:C.down},
                      {l:'Total Ulasan',  v:dash.totalUlasan,  icon:'⭐', c:'#f59e0b'},
                    ] as any[]).map((s,i)=>(
                      <div key={i} style={{background:'var(--mr-bg)',border:`1px solid ${s.c}22`,padding:'12px',borderRadius:10,position:'relative',overflow:'hidden'}}>
                        <div style={{position:'absolute',top:-10,right:-10,width:40,height:40,borderRadius:'50%',background:`radial-gradient(circle,${s.c}22,transparent 70%)`}}/>
                        <div style={{fontFamily:C.mono,color:'var(--mr-border2)',fontSize:9,marginBottom:6}}>{s.l}</div>
                        <div style={{fontSize:24,fontWeight:800,color:s.c,fontFamily:C.mono,letterSpacing:-1}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Funded Stats */}
              <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#eab30866,transparent)' }}/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div style={{ fontFamily:C.mono, color:G.gold, fontSize:9, letterSpacing:2 }}>// STATUS TRADING MEMBER</div>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:G.gold, background:'var(--mr-tint-gold)', border:'1px solid #3a2e00', padding:'4px 12px', borderRadius:6 }}>TOTAL FUNDED: {dash.totalFunded}</div>
                </div>
                <div className='ap-grid6' style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
                  {([
                    {k:'DA',    label:'Demo Account', color:'#3b82f6'},
                    {k:'P1',    label:'Phase 1',       color:'#8b5cf6'},
                    {k:'P2',    label:'Phase 2',       color:'#f59e0b'},
                    {k:'Master',label:'Master',        color:'#00e5a0'},
                    {k:'MPAID', label:'Sudah Payout',  color:'#eab308'},
                    {k:'Ap',    label:'Akun Pribadi',  color:'#ec4899'},
                  ] as any[]).map(s=>{
                    const count = dash.fundedBreakdown[s.k]||0;
                    return (
                    <button key={s.k} onClick={()=>count>0&&setFundedModal(s)}
                      style={{ background:`linear-gradient(145deg,${s.color}0a,#060610)`, border:`1px solid ${count>0?s.color+'44':'var(--mr-panel)'}`, borderRadius:12, padding:'16px 12px', textAlign:'center' as const, cursor:count>0?'pointer':'default', transition:'all 0.2s', position:'relative', overflow:'hidden' }}
                      onMouseEnter={e=>{if(count>0){(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 12px 28px ${s.color}22`;}}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none';}}>
                      <div style={{ position:'absolute',top:-20,right:-20,width:60,height:60,borderRadius:'50%',background:`radial-gradient(circle,${s.color}18,transparent 70%)`,pointerEvents:'none' }}/>
                      <div style={{ fontFamily:C.mono, fontWeight:800, fontSize:28, color:count>0?s.color:'var(--mr-border)', letterSpacing:-1, lineHeight:1 }}>{count}</div>
                      <div style={{ fontFamily:C.mono, fontSize:10, color:count>0?s.color+'99':'var(--mr-border)', marginTop:6, fontWeight:600 }}>{s.k}</div>
                      <div style={{ fontSize:9, color:'#222233', marginTop:3 }}>{s.label}</div>
                      {count>0&&<div style={{ fontFamily:C.mono, fontSize:7, color:s.color+'66', marginTop:6, border:`1px solid ${s.color}33`, padding:'2px 6px', borderRadius:3, display:'inline-block' }}>KLIK ▸</div>}
                    </button>
                  )})}
                </div>
              </div>

              {/* Funded Modal */}
              {fundedModal && (
                <div style={{ position:'fixed', inset:0, background:'rgba(3,3,8,0.9)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:24, backdropFilter:'blur(4px)' }}
                  onClick={()=>setFundedModal(null)}>
                  <div style={{ background:'var(--mr-panel)', border:`1px solid ${fundedModal.color}44`, borderRadius:16, padding:28, width:'100%', maxWidth:500, maxHeight:'80vh', overflowY:'auto' as const, boxShadow:`0 0 60px ${fundedModal.color}22` }}
                    onClick={e=>e.stopPropagation()}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${fundedModal.color},transparent)`, borderRadius:'16px 16px 0 0' }}/>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                      <div>
                        <div style={{ fontFamily:C.mono, color:fundedModal.color, fontSize:9, letterSpacing:2, marginBottom:6 }}>{fundedModal.k} — {fundedModal.label.toUpperCase()}</div>
                        <div style={{ fontSize:20, fontWeight:800, fontFamily:C.mono, color:fundedModal.color }}>
                          {fundedMembers.filter(m=>m.funded_status===fundedModal.k).length} <span style={{color:'#9999bb',fontSize:14,fontWeight:400}}>member</span>
                        </div>
                      </div>
                      <button onClick={()=>setFundedModal(null)} style={{ background:'var(--mr-panel)', border:'1px solid var(--mr-border2)', color:'#555566', fontSize:18, cursor:'pointer', width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
                      {fundedMembers.filter(m=>m.funded_status===fundedModal.k).map((m:any)=>(
                        <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--mr-bg)', border:`1px solid ${fundedModal.color}22`, borderRadius:10 }}>
                          <div style={{ width:38, height:38, background:`${fundedModal.color}18`, border:`1px solid ${fundedModal.color}44`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:fundedModal.color, flexShrink:0, fontFamily:C.mono, boxShadow:`0 0 12px ${fundedModal.color}22` }}>
                            {m.nama?.[0]?.toUpperCase()||'?'}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:13 }}>{m.nama}</div>
                            <div style={{ fontFamily:C.mono, fontSize:9, color:'#9999bb', marginTop:2 }}>{m.tier?.replace('SMC ','')}</div>
                          </div>
                          {m.discord_username && (
                            <div style={{ fontFamily:C.mono, fontSize:10, color:C.up, background:'#00e5a011', border:'1px solid #00e5a022', padding:'2px 8px', borderRadius:4 }}>@{m.discord_username}</div>
                          )}
                          <div style={{ fontFamily:C.mono, fontSize:11, fontWeight:800, color:fundedModal.color, background:`${fundedModal.color}11`, border:`1px solid ${fundedModal.color}33`, padding:'4px 10px', borderRadius:6 }}>
                            {m.funded_status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}


              {/* Leaderboard Jurnal — Top 3 Podium */}
              {(dash.journalLb||[]).length > 0 && (() => {
                const top3 = (dash.journalLb||[]).slice(0,3);
                const ORDER = [1,0,2]; // left=rank2(silver), center=rank1(gold), right=rank3(bronze)
                const COLS = ['#eab308','#94a3b8','#cd7f32']; // indexed by rankIdx: 0=gold,1=silver,2=bronze
                const HEIGHTS = [100, 75, 55]; // indexed by rankIdx: rank1 tallest
                return (
                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#eab30844,transparent)' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:C.mono, color:G.gold, fontSize:9, letterSpacing:2 }}>// LEADERBOARD JURNAL</div>
                    <button onClick={()=>setActive('jurnal')} style={{ fontFamily:C.mono, fontSize:9, color:'#9999bb', background:'var(--mr-panel)', border:'1px solid #1a1a2a', padding:'3px 9px', cursor:'pointer', borderRadius:4 }}>LIHAT SEMUA ›</button>
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:0, paddingBottom:0 }}>
                    {ORDER.map(rankIdx => {
                      const m = top3[rankIdx]; if (!m) return null;
                      const col = COLS[rankIdx]; const h = HEIGHTS[rankIdx];
                      const gain = m.gainPct >= 0 ? `+${m.gainPct.toFixed(1)}%` : `${m.gainPct.toFixed(1)}%`;
                      const gainColor = m.gainPct >= 0 ? '#22c55e' : '#ef4444';
                      return (
                        <div key={m.id} style={{ flex:1, display:'flex', flexDirection:'column' as const, alignItems:'center' }}>
                          <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', gap:6, paddingBottom:8 }}>
                            <RankImg rank={rankIdx+1} size={rankIdx===0?44:36} />
                            <div style={{ width:rankIdx===0?50:42, height:rankIdx===0?50:42, borderRadius:'50%', background:'var(--mr-panel)', border:`2px solid ${col}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:rankIdx===0?18:14, color:col, boxShadow:`0 0 14px ${col}44` }}>
                              {m.nama?.[0]?.toUpperCase()||'?'}
                            </div>
                            <div style={{ fontWeight:700, fontSize:rankIdx===0?12:10, color:col, textAlign:'center' as const, maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{m.nama}</div>
                            <div style={{ fontFamily:C.mono, fontSize:10, color:gainColor, fontWeight:700 }}>{gain} <span style={{color:'#555',fontWeight:400}}>({m.trades} trade)</span></div>
                          </div>
                          <div style={{ width:'100%', height:h, background:`linear-gradient(180deg,${col}55,${col}22)`, border:`1px solid ${col}66`, borderBottom:'none', borderRadius:'8px 8px 0 0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ fontFamily:C.mono, fontWeight:900, fontSize:rankIdx===0?18:14, color:col }}>#{rankIdx+1}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );})()}

              {/* Row 3 — Klaim + Aktivitas */}
              <div className='ap-grid15' style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:12 }}>
                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#3b82f644,transparent)' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:C.mono, color:'#3b82f6', fontSize:9, letterSpacing:2 }}>// KLAIM PARTNERSHIP TERBARU</div>
                    <button onClick={()=>setActive('klaim')} style={{ fontFamily:C.mono, fontSize:9, color:'#9999bb', background:'var(--mr-panel)', border:'1px solid #1a1a2a', padding:'3px 9px', cursor:'pointer', borderRadius:4 }}>LIHAT SEMUA ›</button>
                  </div>
                  <div style={{ fontFamily:C.mono, display:'grid', gridTemplateColumns:'20px 1fr 60px 80px 70px', gap:'4px 8px', fontSize:9, color:'#666677', paddingBottom:8, borderBottom:'1px solid #111120', marginBottom:6 }}>
                    {['#','NAMA','BROKER','TANGGAL','STATUS'].map(h=><span key={h}>{h}</span>)}
                  </div>
                  {recentClaims.length===0 && <div style={{fontFamily:C.mono,color:'#7777aa',fontSize:11,padding:'12px 0'}}>Belum ada klaim.</div>}
                  {recentClaims.map((cl:any,i:number)=>(
                    <div key={cl.id} style={{ fontFamily:C.mono, display:'grid', gridTemplateColumns:'20px 1fr 60px 80px 70px', gap:'4px 8px', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #0d0d18', fontSize:11 }}>
                      <span style={{color:'#7777aa'}}>{i+1}</span>
                      <span style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{cl.nama_lengkap || cl.nama || '—'}</span>
                      <span style={{color:'#aaaacc'}}>{cl.broker}</span>
                      <span style={{color:'#9999bb',fontSize:10}}>{new Date(cl.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span>
                      <span style={{fontWeight:700,fontSize:10,color:cl.status==='approved'||cl.status==='disetujui'?C.up:cl.status==='pending'?G.gold:C.down}}>
                        {cl.status==='approved'||cl.status==='disetujui'?'✓ OK':cl.status==='pending'?'⏳':' ✕'}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#f59e0b44,transparent)' }}/>
                  <div style={{ fontFamily:C.mono, color:'#f59e0b', fontSize:9, letterSpacing:2, marginBottom:16 }}>// AKTIVITAS TERBARU</div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:6 }}>
                    {recentActivity.map((a:any,i:number)=>(
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px', background:'var(--mr-bg)', borderRadius:8, border:'1px solid #0f0f18' }}>
                        <span style={{fontSize:14,flexShrink:0}}>{a.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,color:'#ccccee',lineHeight:1.4}}>{a.text}</div>
                          <div style={{fontFamily:C.mono,fontSize:9,color:'#7777aa',marginTop:3}}>{a.time}</div>
                        </div>
                        <div style={{width:5,height:5,borderRadius:'50%',background:i<2?C.up:'var(--mr-border)',flexShrink:0,marginTop:5,boxShadow:i<2?`0 0 6px ${C.up}`:''}}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 4 — Top Members + Growth Chart */}
              <div className='ap-grid16' style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:12 }}>
                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#ec489944,transparent)' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:C.mono, color:'#ec4899', fontSize:9, letterSpacing:2 }}>// MEMBER PALING AKTIF</div>
                    <button onClick={()=>setActive('member')} style={{ fontFamily:C.mono, fontSize:9, color:'#9999bb', background:'var(--mr-panel)', border:'1px solid #1a1a2a', padding:'3px 9px', cursor:'pointer', borderRadius:4 }}>LIHAT ›</button>
                  </div>
                  {topMembers.slice(0,5).map((m:any,i:number)=>{
                    const COLORS=['#eab308','#00e5a0','#a855f7','#3b82f6','#ec4899'];
                    const diffMin=m.last_seen?Math.floor((Date.now()-new Date(m.last_seen).getTime())/60000):null;
                    const diffH=diffMin!==null?Math.floor(diffMin/60):null;
                    const diffD=diffH!==null?Math.floor(diffH/24):null;
                    const ago=!m.last_seen?'—':diffMin!==null&&diffMin<60?`${diffMin}m`:diffH!==null&&diffH<24?`${diffH}j`:`${diffD}h`;
                    return (
                      <div key={m.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 0', borderBottom:'1px solid #0d0d18' }}>
                        <span style={{fontFamily:C.mono,color:'#7777aa',fontSize:9,width:16}}>{i+1}</span>
                        <div style={{width:32,height:32,borderRadius:'50%',background:`${COLORS[i]}22`,border:`1px solid ${COLORS[i]}44`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:12,color:COLORS[i],flexShrink:0,boxShadow:`0 0 8px ${COLORS[i]}22`}}>
                          {(m.nama||'?')[0].toUpperCase()}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,fontSize:12}}>{m.nama}</div>
                          <div style={{fontFamily:C.mono,color:'#8888bb',fontSize:9}}>{m.tier?.split(' ').slice(-1)[0]||''}</div>
                        </div>
                        <div style={{fontFamily:C.mono,color:i===0?C.up:'#8888bb',fontSize:10}}>{i===0?'🟢 ':''}{ago}</div>
                      </div>
                    );
                  })}
                  {topMembers.length===0 && <div style={{fontFamily:C.mono,color:'#7777aa',fontSize:11,padding:'12px 0'}}>Tidak ada data.</div>}
                </div>

                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#eab30866,transparent)' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:C.mono, color:G.gold, fontSize:9, letterSpacing:2 }}>// GRAFIK PERTUMBUHAN MEMBER</div>
                    <div style={{ fontFamily:C.mono, fontSize:9, color:'#9999bb', background:'var(--mr-panel)', border:'1px solid #1a1a2a', padding:'3px 9px', borderRadius:4 }}>30 HARI TERAKHIR</div>
                  </div>
                  <MiniChart data={GROWTH_DATA} color={G.gold} height={130}/>
                  <div style={{ display:'flex', justifyContent:'space-between', fontFamily:C.mono, fontSize:9, color:'#666677', marginTop:8 }}>
                    <span>28 Apr</span><span>6 Mei</span><span>14 Mei</span><span>22 Mei</span><span>26 Mei</span>
                  </div>
                </div>
              </div>


            </div>
          )}
        </main>
      </div>
    </div>
    </>
  );
}
