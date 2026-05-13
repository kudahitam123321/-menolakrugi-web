import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminPage from '../AdminPage';

const G = { gold: '#eab308', gold2: '#ca9e00' };
const C = { bg: '#090909', sidebar: '#0c0c0c', panel: '#111', border: '#1e1e1e', border2: '#2a2a2a', dim: '#666', text: '#e7e5e4', muted: '#aaa', up: '#22ab94', down: '#ef4444', mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif' };

const SIDEBAR_SECTIONS = [
  { h: null, items: [{ id: 'dashboard', label: 'Dashboard', icon: '⊞' }] },
  { h: 'USER MANAGEMENT', items: [
    { id: 'member',   label: 'Member',           icon: '👥' },
    { id: 'progress', label: 'Progres Belajar',  icon: '📊' },
    { id: 'advance',  label: 'Request Advance',  icon: '⬆' },
    { id: 'admin',   label: 'Admin',           icon: '🛡' },
  ]},
  { h: 'CONTENT', items: [
    { id: 'video', label: 'Video & Materi', icon: '▶' },
  ]},
  { h: 'PARTNERSHIP', items: [
    { id: 'klaim',  label: 'Klaim Partnership', icon: '🤝' },
    { id: 'broker', label: 'Broker',            icon: '🏦' },
  ]},
  { h: 'COMMUNICATION', items: [
    { id: 'pengumuman', label: 'Pengumuman',      icon: '📢' },
    { id: 'broadcast',  label: 'Pesan Broadcast', icon: '📡' },
  ]},
  { h: 'SYSTEM', items: [
    { id: 'pengaturan', label: 'Pengaturan',   icon: '⚙' },
    { id: 'log',        label: 'Log Activity', icon: '📋' },
  ]},
];

function getTabId(sidebarId: string): string {
  const map: Record<string,string> = {
    member:'member', progress:'progress', advance:'advance', admin:'admins',
    video:'video', klaim:'claim', broker:'broker',
    pengumuman:'announce', broadcast:'announce',
    pengaturan:'settings', log:'settings',
  };
  return map[sidebarId] || sidebarId;
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

export default function AdminPanel() {
  const [active, setActive] = useState('dashboard');
  const [dash, setDash] = useState({
    total:0, active:0, pending:0, advance:0, neverLogin:0,
    totalVideos:0, totalFiles:0, totalBrokers:0, totalClaims:0, totalUlasan:0, totalAnnounce:0,
    tierDist: [] as any[],
    completedMembers:0, partialMembers:0, notStarted:0, completionPct:0,
    totalFunded:0, fundedBreakdown:{} as Record<string,number>,
  });
  const [recentClaims, setRecentClaims] = useState<any[]>([]);
  const [topMembers, setTopMembers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const GROWTH_DATA = [12,18,14,22,19,28,24,35,30,42,38,50,45,55,48,62,58,72,65,80,74,90,85,100,95,110,105,120,115,130];

  const adminData = (() => { try { return JSON.parse(localStorage.getItem('mr_admin')||'{}'); } catch { return {}; } })();

  useEffect(() => {
    const admin = localStorage.getItem('mr_admin');
    if (!admin) { window.location.href = '/login'; return; }
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [
      { count: total },
      { count: active5m },
      { count: neverLogin },
      { count: pending },
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
    ] = await Promise.all([
      supabase.from('members').select('*',{count:'exact',head:true}),
      supabase.from('members').select('*',{count:'exact',head:true}).gte('last_seen', new Date(Date.now()-5*60*1000).toISOString()),
      supabase.from('members').select('*',{count:'exact',head:true}).is('last_seen',null),
      supabase.from('partnership_claims').select('*',{count:'exact',head:true}).eq('status','pending'),
      supabase.from('members').select('*',{count:'exact',head:true}).in('tier',['SMC Gold Mentorship','SMC Platinum 1-on-1']),
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
    ]);

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

    // Funded breakdown
    const fundedBreakdown: Record<string,number> = {};
    (fundedData||[]).forEach((m:any) => {
      if (m.funded_status) fundedBreakdown[m.funded_status] = (fundedBreakdown[m.funded_status]||0)+1;
    });
    const totalFunded = Object.values(fundedBreakdown).reduce((s,v)=>s+v, 0);

    setDash({
      total: total||0, active: active5m||0, pending: pending||0,
      advance: advance||0, neverLogin: neverLogin||0,
      totalVideos: videos||0, totalFiles: files||0, totalBrokers: brokers||0,
      totalClaims: claims||0, totalUlasan: ulasan||0, totalAnnounce: 0,
      tierDist, completedMembers, partialMembers, notStarted, completionPct,
      totalFunded, fundedBreakdown,
    });
    setRecentClaims(recentClaimsData||[]);
    setTopMembers(topMembersData||[]);
    setRecentActivity([
      { icon:'🤝', text:'Klaim partnership masuk', time:'2 mnt lalu' },
      { icon:'⬆', text:'Request advance dari member', time:'15 mnt lalu' },
      { icon:'✅', text:'Member baru bergabung', time:'1 jam lalu' },
      { icon:'📢', text:'Pengumuman baru diterbitkan', time:'2 jam lalu' },
      { icon:'❌', text:'Klaim ditolak — data tidak valid', time:'3 jam lalu' },
    ]);
  }

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.sidebar, height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 36, height: 36 }}><img src='/logo.png' alt='MR' style={{ width: '100%', height: '100%', objectFit: 'contain' }}/></div>
          <span style={{ fontWeight: 800, fontSize: 14 }}>MENOLAK RUGI</span>
          <span style={{ fontFamily: C.mono, color: G.gold, fontSize: 11, border: '1px solid #3a2e00', padding: '2px 8px', borderRadius: 4 }}>ADMIN PANEL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => window.location.href = '/'} style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, background: 'none', border: `1px solid ${C.border2}`, padding: '5px 12px', cursor: 'pointer', borderRadius: 5 }}>↗ Kembali ke Website</button>
          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: 18, cursor: 'pointer' }}>🔔</span>
            {dash.pending > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: C.down, borderRadius: '50%', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontWeight: 700, color: '#fff' }}>{dash.pending}</span>}
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
        <aside style={{ width: 220, background: C.sidebar, borderRight: `1px solid ${C.border}`, flexShrink: 0, overflowY: 'auto' }}>
          {SIDEBAR_SECTIONS.map((section, si) => (
            <div key={si} style={{ padding: section.h ? '16px 0 0' : '8px 0 0' }}>
              {section.h && <div style={{ fontFamily: C.mono, color: '#333', fontSize: 9, letterSpacing: 1.5, padding: '0 16px', marginBottom: 4 }}>{section.h}</div>}
              {section.items.map(item => {
                const isA = active === item.id;
                return (
                  <button key={item.id} onClick={() => setActive(item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 16px', border: 'none', background: isA ? '#1a1500' : 'transparent', borderLeft: isA ? `3px solid ${G.gold}` : '3px solid transparent', color: isA ? G.gold : C.dim, cursor: 'pointer', fontSize: 13, textAlign: 'left' as const }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ padding: '16px' }}>
            <button onClick={() => { localStorage.removeItem('mr_admin'); localStorage.removeItem('mr_member'); window.location.href = '/login'; }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 0', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13 }}>
              <span>⏻</span> Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {active !== 'dashboard' ? (
            <AdminPage key={getTabId(active)} embedded={true} initialTab={getTabId(active)} />
          ) : (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Dashboard</h1>
                  <p style={{ color: C.dim, fontSize: 13, margin: 0 }}>Selamat datang kembali, {adminData.username||'Admin'} 👋</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, background: C.panel, border: `1px solid ${C.border}`, padding: '8px 14px', borderRadius: 6 }}>
                    📅 {new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}
                  </div>
                  <button onClick={loadDashboard} style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, background: C.panel, border: `1px solid ${C.border}`, padding: '8px 14px', cursor: 'pointer', borderRadius: 6 }}>↻ Refresh</button>
                </div>
              </div>

              {/* 5 Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
                {[
                  { l:'TOTAL MEMBER',   v:dash.total,      sub:'+18 dari bulan lalu',       c:C.text,    icon:'👥', up:true  },
                  { l:'ACTIVE MEMBER',  v:dash.active,     sub:`${Math.round(dash.active/Math.max(dash.total,1)*100)}% dari total`, c:C.up,     icon:'✅', up:true  },
                  { l:'PENDING CLAIM',  v:dash.pending,    sub:'Menunggu verifikasi',        c:G.gold,    icon:'⏳', up:true  },
                  { l:'ADVANCE MEMBER', v:dash.advance,    sub:`${Math.round(dash.advance/Math.max(dash.total,1)*100)}% dari total`, c:'#a855f7', icon:'⬆', up:true  },
                  { l:'NON ACTIVE',     v:dash.neverLogin, sub:'Belum pernah login',         c:C.down,    icon:'⚠', up:false },
                ].map((s,i)=>(
                  <div key={i} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <div style={{ fontFamily:C.mono, color:C.dim, fontSize:10, letterSpacing:0.5 }}>{s.l}</div>
                      <span style={{ fontSize:20, opacity:0.5 }}>{s.icon}</span>
                    </div>
                    <div style={{ fontSize:32, fontWeight:700, letterSpacing:-1, color:s.c }}>{s.v.toLocaleString()}</div>
                    <div style={{ fontFamily:C.mono, fontSize:10, color:s.up?C.up:C.down, marginTop:8, display:'flex', alignItems:'center', gap:4 }}>
                      <span>{s.up?'▲':'▼'}</span> {s.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2 — 3 columns */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>

                {/* Distribusi Membership */}
                <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>DISTRIBUSI MEMBERSHIP</div>
                    <button onClick={()=>setActive('member')} style={{ fontFamily:C.mono, fontSize:10, color:G.gold, background:'none', border:'none', cursor:'pointer' }}>Detail</button>
                  </div>
                  <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                    <DonutSmall segments={dash.tierDist} size={90}/>
                    <div style={{ flex:1, overflow:'hidden' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'3px 6px', fontFamily:C.mono, fontSize:10 }}>
                        <span style={{color:'#333'}}>TIER</span>
                        <span style={{color:'#333',textAlign:'right' as const}}>JML</span>
                        <span style={{color:'#333',textAlign:'right' as const}}>%</span>
                        {dash.tierDist.map((t:any)=>(
                          <React.Fragment key={t.label}>
                            <div style={{display:'flex',alignItems:'center',gap:5}}>
                              <div style={{width:6,height:6,borderRadius:'50%',background:t.color,flexShrink:0}}/>
                              <span style={{color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{t.label}</span>
                            </div>
                            <span style={{color:C.text,textAlign:'right' as const,fontWeight:600}}>{t.value}</span>
                            <span style={{color:C.dim,textAlign:'right' as const}}>{Math.round(t.value/Math.max(dash.total,1)*100)}%</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Penyelesaian Materi */}
                <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>PENYELESAIAN MATERI</div>
                    <button onClick={()=>setActive('progress')} style={{ fontFamily:C.mono, fontSize:10, color:G.gold, background:'none', border:'none', cursor:'pointer' }}>Detail</button>
                  </div>
                  {/* Completion rate donut-style */}
                  <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16, padding:'14px', background:'#0a0a0a', borderRadius:8 }}>
                    <div style={{ position:'relative', width:64, height:64, flexShrink:0 }}>
                      <svg viewBox="0 0 64 64" width="64" height="64">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#1a1a1a" strokeWidth="8"/>
                        <circle cx="32" cy="32" r="26" fill="none" stroke={C.up} strokeWidth="8"
                          strokeDasharray={`${2*Math.PI*26}`}
                          strokeDashoffset={`${2*Math.PI*26*(1-dash.completionPct/100)}`}
                          strokeLinecap="round" transform="rotate(-90 32 32)"/>
                      </svg>
                      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:C.mono, fontSize:12, fontWeight:700, color:C.up }}>{dash.completionPct}%</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:C.mono, color:C.muted, fontSize:10, marginBottom:4 }}>TINGKAT PENYELESAIAN</div>
                      <div style={{ fontSize:18, fontWeight:700, color:C.up }}>{dash.completedMembers} member selesai</div>
                      <div style={{ fontFamily:C.mono, fontSize:10, color:'#444', marginTop:2 }}>dari {dash.total} total member</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
                    {[
                      { l:'Selesai semua materi', v:dash.completedMembers, c:C.up, pct: dash.total ? Math.round(dash.completedMembers/dash.total*100) : 0 },
                      { l:'Sedang belajar',       v:dash.partialMembers,   c:G.gold, pct: dash.total ? Math.round(dash.partialMembers/dash.total*100) : 0 },
                      { l:'Belum mulai',          v:dash.notStarted,       c:'#ef4444', pct: dash.total ? Math.round(dash.notStarted/dash.total*100) : 0 },
                    ].map((row,i)=>(
                      <div key={i}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                          <span style={{color:C.muted}}>{row.l}</span>
                          <span style={{fontFamily:C.mono, color:row.c, fontWeight:700}}>{row.v} <span style={{color:'#444',fontWeight:400}}>({row.pct}%)</span></span>
                        </div>
                        <div style={{height:5,background:C.border,borderRadius:3}}>
                          <div style={{height:'100%',width:`${row.pct}%`,background:row.c,borderRadius:3,transition:'width 0.5s'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, paddingTop:12, marginTop:8, borderTop:`1px solid ${C.border}` }}>
                    {[
                      {l:'Total Video',  v:dash.totalVideos,  c:'#3b82f6'},
                      {l:'Total File',   v:dash.totalFiles,   c:'#a855f7'},
                      {l:'Total Broker', v:dash.totalBrokers, c:G.gold},
                      {l:'Total Ulasan', v:dash.totalUlasan,  c:C.up},
                    ].map((s,i)=>(
                      <div key={i} style={{background:'#0a0a0a',border:`1px solid ${C.border}`,padding:'10px 12px',borderRadius:6}}>
                        <div style={{fontFamily:C.mono,color:'#444',fontSize:9,marginBottom:4}}>{s.l}</div>
                        <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ringkasan Sistem */}
                <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px' }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>RINGKASAN SISTEM</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      {l:'Total Video',   v:dash.totalVideos,  icon:'▶' },
                      {l:'File Materi',   v:dash.totalFiles,   icon:'📄'},
                      {l:'Total Broker',  v:dash.totalBrokers, icon:'🏦'},
                      {l:'Partnership',   v:dash.totalClaims,  icon:'🤝'},
                      {l:'Pending Claim', v:dash.pending,      icon:'⏳'},
                      {l:'Total Ulasan',  v:dash.totalUlasan,  icon:'⭐'},
                    ].map((s,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'10px',background:'#0a0a0a',borderRadius:6}}>
                        <span style={{fontSize:18}}>{s.icon}</span>
                        <div>
                          <div style={{fontFamily:C.mono,color:'#444',fontSize:9}}>{s.l}</div>
                          <div style={{fontWeight:700,fontSize:18}}>{s.v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Funded Stats Card */}
              <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px', marginTop:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>STATUS TRADING MEMBER</div>
                  <div style={{ fontFamily:C.mono, fontSize:11, color:G.gold }}>TOTAL FUNDED: {dash.totalFunded}</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
                  {([
                    {k:'DA',    label:'Demo Account',  color:'#3b82f6'},
                    {k:'P1',    label:'Phase 1',        color:'#a855f7'},
                    {k:'P2',    label:'Phase 2',        color:'#f59e0b'},
                    {k:'Master',label:'Master',         color:'#22ab94'},
                    {k:'MPAID', label:'Sudah Payout',   color:'#eab308'},
                    {k:'Ap',    label:'Akun Pribadi',   color:'#ec4899'},
                  ] as {k:string;label:string;color:string}[]).map(s=>(
                    <div key={s.k} style={{ background:'#0a0a0a', border:`1px solid ${(dash.fundedBreakdown[s.k]||0)>0?s.color+'44':C.border}`, borderRadius:8, padding:'12px 10px', textAlign:'center' as const }}>
                      <div style={{ fontFamily:C.mono, fontWeight:700, fontSize:20, color:(dash.fundedBreakdown[s.k]||0)>0?s.color:'#333' }}>{dash.fundedBreakdown[s.k]||0}</div>
                      <div style={{ fontFamily:C.mono, fontSize:10, color:(dash.fundedBreakdown[s.k]||0)>0?s.color:'#444', marginTop:4 }}>{s.k}</div>
                      <div style={{ fontSize:10, color:'#555', marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 3 — Klaim + Aktivitas */}
              <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16 }}>
                {/* Klaim terbaru */}
                <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>KLAIM PARTNERSHIP TERBARU</div>
                    <button onClick={()=>setActive('klaim')} style={{ fontFamily:C.mono, fontSize:10, color:G.gold, background:'none', border:'none', cursor:'pointer' }}>Lihat Semua</button>
                  </div>
                  <div style={{ fontFamily:C.mono, display:'grid', gridTemplateColumns:'20px 1fr 60px 80px 70px', gap:'4px 8px', fontSize:10, color:'#333', paddingBottom:8, borderBottom:`1px solid ${C.border}`, marginBottom:6 }}>
                    {['#','NAMA','BROKER','TANGGAL','STATUS'].map(h=><span key={h}>{h}</span>)}
                  </div>
                  {recentClaims.length===0 && <div style={{fontFamily:C.mono,color:'#333',fontSize:12,padding:'12px 0'}}>Belum ada klaim.</div>}
                  {recentClaims.map((c:any,i:number)=>(
                    <div key={c.id} style={{ fontFamily:C.mono, display:'grid', gridTemplateColumns:'20px 1fr 60px 80px 70px', gap:'4px 8px', alignItems:'center', padding:'7px 0', borderBottom:`1px solid ${C.border}`, fontSize:11 }}>
                      <span style={{color:'#444'}}>{i+1}</span>
                      <span style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{c.nama}</span>
                      <span style={{color:C.dim}}>{c.broker}</span>
                      <span style={{color:'#444',fontSize:10}}>{new Date(c.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span>
                      <span style={{fontWeight:700,fontSize:10,color:c.status==='approved'||c.status==='disetujui'?C.up:c.status==='pending'?G.gold:C.down}}>
                        {c.status==='approved'||c.status==='disetujui'?'✓ OK':c.status==='pending'?'⏳ PENDING':'✕'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Aktivitas */}
                <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px' }}>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>AKTIVITAS TERBARU</div>
                  <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
                    {recentActivity.map((a:any,i:number)=>(
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px', background:'#0a0a0a', borderRadius:7 }}>
                        <span style={{fontSize:16,flexShrink:0}}>{a.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,color:C.muted,lineHeight:1.4}}>{a.text}</div>
                          <div style={{fontFamily:C.mono,fontSize:10,color:'#444',marginTop:3}}>{a.time}</div>
                        </div>
                        <div style={{width:6,height:6,borderRadius:'50%',background:i<2?C.up:'#333',flexShrink:0,marginTop:5}}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 4 — Top Members + Growth Chart */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:16 }}>
                {/* Member Aktif */}
                <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>MEMBER PALING AKTIF</div>
                    <button onClick={()=>setActive('member')} style={{ fontFamily:C.mono, fontSize:10, color:G.gold, background:'none', border:'none', cursor:'pointer' }}>Lihat Semua</button>
                  </div>
                  <div style={{ fontFamily:C.mono, display:'grid', gridTemplateColumns:'20px 1fr 70px', gap:'4px 8px', fontSize:10, color:'#333', paddingBottom:8, borderBottom:`1px solid ${C.border}`, marginBottom:6 }}>
                    <span>#</span><span>NAMA</span><span style={{textAlign:'right' as const}}>LAST SEEN</span>
                  </div>
                  {topMembers.slice(0,5).map((m:any,i:number)=>{
                    const COLORS=['#eab308','#22ab94','#a855f7','#3b82f6','#ef4444'];
                    const diffMin=m.last_seen?Math.floor((Date.now()-new Date(m.last_seen).getTime())/60000):null;
                    const diffH=diffMin!==null?Math.floor(diffMin/60):null;
                    const diffD=diffH!==null?Math.floor(diffH/24):null;
                    const ago=!m.last_seen?'—':diffMin!==null&&diffMin<60?`${diffMin}m`:diffH!==null&&diffH<24?`${diffH}j`:`${diffD}h`;
                    return (
                      <div key={m.id} style={{ display:'grid', gridTemplateColumns:'20px 1fr 70px', gap:'4px 8px', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${C.border}`, fontSize:12 }}>
                        <span style={{fontFamily:C.mono,color:'#444',fontSize:10}}>{i+1}</span>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:28,height:28,borderRadius:'50%',background:COLORS[i],display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:11,color:'#000',flexShrink:0}}>
                            {(m.nama||'?')[0].toUpperCase()}
                          </div>
                          <div style={{minWidth:0}}>
                            <div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,fontSize:12}}>{m.nama}</div>
                            <div style={{fontFamily:C.mono,color:'#555',fontSize:9}}>{m.tier?.split(' ').slice(-1)[0]||''}</div>
                          </div>
                        </div>
                        <div style={{fontFamily:C.mono,color:i===0?C.up:'#555',fontSize:10,textAlign:'right' as const}}>{i===0?'🟢 ':''}{ago}</div>
                      </div>
                    );
                  })}
                  {topMembers.length===0 && <div style={{fontFamily:C.mono,color:'#333',fontSize:12,padding:'12px 0'}}>Tidak ada data.</div>}
                </div>

                {/* Grafik */}
                <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>GRAFIK PERTUMBUHAN MEMBER</div>
                    <div style={{ fontFamily:C.mono, fontSize:11, color:C.dim, background:'#0a0a0a', border:`1px solid ${C.border}`, padding:'4px 10px', borderRadius:5 }}>30 Hari Terakhir</div>
                  </div>
                  <MiniChart data={GROWTH_DATA} color={G.gold} height={130}/>
                  <div style={{ display:'flex', justifyContent:'space-between', fontFamily:C.mono, fontSize:10, color:'#444', marginTop:6 }}>
                    <span>28 Apr</span><span>6 Mei</span><span>14 Mei</span><span>22 Mei</span><span>26 Mei</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
