import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminPage from '../AdminPage';

const G = { gold: '#eab308', gold2: '#ca9e00', cyan: '#00d4ff', cyanDim: '#00d4ff22' };
const C = { bg: '#08080c', sidebar: '#0c0c12', panel: '#111118', border: '#1e1e2e', border2: '#2a2a3a', dim: '#aaaaaa', text: '#ffffff', muted: '#cccccc', up: '#22d4a0', down: '#ff5577', mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif' };

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
    { id: 'proprules', label: 'Prop Firm Rules', icon: '📋' },
    { id: 'rating',    label: 'Rating Video',    icon: '⭐' },
    { id: 'referral',  label: 'Referral',        icon: '🔗' },
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
    video:'video', klaim:'claim', broker:'broker', proprules:'proprules', rating:'rating', referral:'referral',
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
  const [fundedModal, setFundedModal] = useState<{status:string;color:string;label:string}|null>(null);
  const [fundedMembers, setFundedMembers] = useState<any[]>([]);
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
      { data: fundedMembersData },
    ] = await Promise.all([
      supabase.from('members').select('*',{count:'exact',head:true}),
      supabase.from('members').select('*',{count:'exact',head:true}).gte('last_seen', new Date(Date.now()-24*60*60*1000).toISOString()),
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
      supabase.from('members').select('id,nama,tier,funded_status,discord_username').not('funded_status','is',null).order('funded_status'),
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
    if (fundedMembersData) setFundedMembers(fundedMembersData);
    setRecentClaims(recentClaimsData||[]);
    setTopMembers(topMembersData||[]);
    // Build leaderboard data
    const { data: progLbData } = await supabase.from('member_progress').select('member_id,status');
    const { data: membLbData } = await supabase.from('members').select('id,nama,tier');
    let memberProgress: any[] = [];
    if (progLbData && membLbData) {
      const counts: Record<string,number> = {};
      progLbData.forEach((p:any) => { if(p.status==='selesai') counts[p.member_id]=(counts[p.member_id]||0)+1; });
      memberProgress = membLbData.map((m:any) => ({...m,selesai:counts[m.id]||0})).sort((a:any,b:any)=>b.selesai-a.selesai);
    }

    // Update dash with memberProgress
    setDash(prev => ({ ...prev, memberProgress, totalVideos: videos||0 }));

    setRecentActivity([
      { icon:'🤝', text:'Klaim partnership masuk', time:'2 mnt lalu' },
      { icon:'⬆', text:'Request advance dari member', time:'15 mnt lalu' },
      { icon:'✅', text:'Member baru bergabung', time:'1 jam lalu' },
      { icon:'📢', text:'Pengumuman baru diterbitkan', time:'2 jam lalu' },
      { icon:'❌', text:'Klaim ditolak — data tidak valid', time:'3 jam lalu' },
    ]);
  }

  return (
    <>
    <style>{`
      /* ── FUTURISTIC ADMIN THEME ── */
      /* Force readable text */
      body { color: #e8e6ff !important; }
      input, textarea, select { color: #e8e6ff !important; }
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
        background: #0b0b10 !important;
        border: 1px solid #161622 !important;
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
      .ap-sidebar-item:hover { background: rgba(120,120,180,0.08) !important; color: #c0c0e0 !important; }
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
        box-shadow: 0 1px 0 #eab30818, 0 4px 24px rgba(0,0,0,0.6) !important;
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
    <div style={{ fontFamily: C.sans, background: 'linear-gradient(180deg,#050508 0%,#030305 100%)', minHeight: '100vh', color: C.text, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div className='ap-topbar ap-topbar-glow' style={{ borderBottom: '1px solid #1e1e2e', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0c0c14', height: 56, flexShrink: 0, position:'sticky' as const, top:0, zIndex:40 }}>
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
        <aside className='ap-sidebar' style={{ width: 220, background: '#0a0a10', borderRight: '1px solid #1e1e2e', flexShrink: 0, overflowY: 'auto' }}>
          {SIDEBAR_SECTIONS.map((section, si) => (
            <div key={si} style={{ padding: section.h ? '16px 0 0' : '8px 0 0' }}>
              {section.h && <div style={{ fontFamily: C.mono, color: '#999999', fontSize: 9, letterSpacing: 1.5, padding: '10px 16px 4px', marginBottom: 2, textTransform: 'uppercase' as const }}>{section.h}</div>}
              {section.items.map(item => {
                const isA = active === item.id;
                return (
                  <button key={item.id} onClick={() => setActive(item.id)}
                    className={`ap-sidebar-item${isA ? ' ap-active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 16px', border: 'none', borderLeft: isA ? `2px solid ${G.gold}` : '2px solid transparent', background: isA ? 'linear-gradient(90deg,rgba(234,179,8,0.12),transparent)' : 'transparent', color: isA ? G.gold : '#cccccc', cursor: 'pointer', fontSize: 12, fontFamily: C.mono, textAlign: 'left' as const, letterSpacing: 0.3 }}>
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
        <main style={{ flex: 1, overflowY: 'auto', background: '#08080c' }}>
          {active !== 'dashboard' ? (
            <AdminPage key={getTabId(active)} embedded={true} initialTab={getTabId(active)} />
          ) : (
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontFamily:C.mono, color:G.gold, fontSize:9, letterSpacing:2.5, marginBottom:8, opacity:0.7 }}>// ADMIN CONTROL CENTER</div>
                  <h1 style={{ fontSize:28, fontWeight:800, margin:0, marginBottom:4, letterSpacing:-1, background:'linear-gradient(90deg,#e2e0ff,#9999bb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Dashboard</h1>
                  <p style={{ color:'#aaaaaa', fontSize:12, margin:0, fontFamily:C.mono }}>Selamat datang, <span style={{color:G.gold}}>{adminData.username||'Admin'}</span></p>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ fontFamily:C.mono, fontSize:10, color:'#aaaaaa', background:'#0a0a12', border:'1px solid #16162a', padding:'8px 14px', borderRadius:8 }}>
                    📅 {new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}
                  </div>
                  <button onClick={loadDashboard} style={{ fontFamily:C.mono, fontSize:10, color:G.gold, background:'#0a0a00', border:'1px solid #2a2000', padding:'8px 14px', cursor:'pointer', borderRadius:8, transition:'all 0.2s' }}>↻ Refresh</button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className='ap-grid5' style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
                {([
                  { l:'TOTAL MEMBER',   v:dash.total,      sub:'+18 bulan ini',    c:'#00d4ff', icon:'⬡', bg:'#00d4ff' },
                  { l:'ACTIVE MEMBER',  v:dash.active,     sub:`${Math.round(dash.active/Math.max(dash.total,1)*100)}% dari total`, c:C.up,     icon:'◈', bg:C.up },
                  { l:'PENDING CLAIM',  v:dash.pending,    sub:'Menunggu verif',   c:G.gold,    icon:'◎', bg:G.gold },
                  { l:'ADVANCE MEMBER', v:dash.advance,    sub:`${Math.round(dash.advance/Math.max(dash.total,1)*100)}% dari total`, c:'#a855f7', icon:'⬆', bg:'#a855f7' },
                  { l:'NON ACTIVE',     v:dash.neverLogin, sub:'Belum pernah login', c:C.down,  icon:'◇', bg:C.down },
                ] as any[]).map((s,i)=>(
                  <div key={i} style={{ background:`linear-gradient(145deg,#0b0b14,#080810)`, border:`1px solid #1a1a2a`, borderRadius:14, padding:'20px 16px', position:'relative', overflow:'hidden', cursor:'default', transition:'transform 0.2s,box-shadow 0.2s' }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 12px 32px ${s.bg}18`; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='none'; }}>
                    {/* glow orb */}
                    <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle,${s.bg}22,transparent 70%)`, pointerEvents:'none' }}/>
                    <div style={{ fontFamily:C.mono, color:'#aaaaaa', fontSize:9, letterSpacing:1.5, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span>{s.l}</span>
                      <span style={{ color:s.c, fontSize:16, opacity:0.5 }}>{s.icon}</span>
                    </div>
                    <div style={{ fontSize:36, fontWeight:800, letterSpacing:-2, color:s.c, fontFamily:C.mono, lineHeight:1 }}>{s.v.toLocaleString()}</div>
                    <div style={{ fontFamily:C.mono, fontSize:9, color:'#aaaaaa', marginTop:10, padding:'3px 7px', background:`${s.bg}11`, border:`1px solid ${s.bg}22`, borderRadius:4, display:'inline-block' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Row 2 — 3 columns */}
              <div className='ap-grid3col' style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>

                {/* Distribusi Membership */}
                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#eab30844,transparent)' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:C.mono, color:G.gold, fontSize:9, letterSpacing:2 }}>// DISTRIBUSI TIER</div>
                    <button onClick={()=>setActive('member')} style={{ fontFamily:C.mono, fontSize:9, color:'#aaaaaa', background:'#0f0f18', border:'1px solid #1a1a2a', padding:'3px 9px', cursor:'pointer', borderRadius:4 }}>DETAIL ›</button>
                  </div>
                  <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                    <DonutSmall segments={dash.tierDist} size={90}/>
                    <div style={{ flex:1, overflow:'hidden' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'4px 8px', fontFamily:C.mono, fontSize:10 }}>
                        <span style={{color:'#5555888'}}>TIER</span>
                        <span style={{color:'#5555888',textAlign:'right' as const}}>JML</span>
                        <span style={{color:'#5555888',textAlign:'right' as const}}>%</span>
                        {dash.tierDist.map((t:any)=>(
                          <React.Fragment key={t.label}>
                            <div style={{display:'flex',alignItems:'center',gap:5}}>
                              <div style={{width:5,height:5,borderRadius:'50%',background:t.color,flexShrink:0,boxShadow:`0 0 6px ${t.color}`}}/>
                              <span style={{color:'#cccccc',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,fontSize:10}}>{t.label}</span>
                            </div>
                            <span style={{color:C.text,textAlign:'right' as const,fontWeight:700,fontSize:12}}>{t.value}</span>
                            <span style={{color:'#aaaaaa',textAlign:'right' as const,fontSize:10}}>{Math.round(t.value/Math.max(dash.total,1)*100)}%</span>
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
                    <button onClick={()=>setActive('progress')} style={{ fontFamily:C.mono, fontSize:9, color:'#aaaaaa', background:'#0f0f18', border:'1px solid #1a1a2a', padding:'3px 9px', cursor:'pointer', borderRadius:4 }}>DETAIL ›</button>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16, padding:'12px', background:'#070710', borderRadius:10, border:'1px solid #111120' }}>
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
                      <div style={{ fontFamily:C.mono, color:'#aaaaaa', fontSize:9, marginBottom:3 }}>TINGKAT PENYELESAIAN</div>
                      <div style={{ fontSize:16, fontWeight:700, color:C.up }}>{dash.completedMembers} selesai</div>
                      <div style={{ fontFamily:C.mono, fontSize:9, color:'#5555888' }}>dari {dash.total} total</div>
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
                        <span style={{color:'#aaaaaa'}}>{row.l}</span>
                        <span style={{color:row.c}}>{row.v} <span style={{color:'#aaaaaa'}}>({pct}%)</span></span>
                      </div>
                      <div style={{height:3,background:'#111120',borderRadius:2}}>
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
                      <div key={i} style={{background:'#070710',border:`1px solid ${s.c}22`,padding:'12px',borderRadius:10,position:'relative',overflow:'hidden'}}>
                        <div style={{position:'absolute',top:-10,right:-10,width:40,height:40,borderRadius:'50%',background:`radial-gradient(circle,${s.c}22,transparent 70%)`}}/>
                        <div style={{fontFamily:C.mono,color:'#5555888',fontSize:9,marginBottom:6}}>{s.l}</div>
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
                  <div style={{ fontFamily:C.mono, fontSize:10, color:G.gold, background:'#1a1500', border:'1px solid #3a2e00', padding:'4px 12px', borderRadius:6 }}>TOTAL FUNDED: {dash.totalFunded}</div>
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
                      style={{ background:`linear-gradient(145deg,${s.color}0a,#060610)`, border:`1px solid ${count>0?s.color+'44':'#111120'}`, borderRadius:12, padding:'16px 12px', textAlign:'center' as const, cursor:count>0?'pointer':'default', transition:'all 0.2s', position:'relative', overflow:'hidden' }}
                      onMouseEnter={e=>{if(count>0){(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 12px 28px ${s.color}22`;}}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none';}}>
                      <div style={{ position:'absolute',top:-20,right:-20,width:60,height:60,borderRadius:'50%',background:`radial-gradient(circle,${s.color}18,transparent 70%)`,pointerEvents:'none' }}/>
                      <div style={{ fontFamily:C.mono, fontWeight:800, fontSize:28, color:count>0?s.color:'#1a1a2a', letterSpacing:-1, lineHeight:1 }}>{count}</div>
                      <div style={{ fontFamily:C.mono, fontSize:10, color:count>0?s.color+'99':'#1a1a2a', marginTop:6, fontWeight:600 }}>{s.k}</div>
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
                  <div style={{ background:'#0a0a12', border:`1px solid ${fundedModal.color}44`, borderRadius:16, padding:28, width:'100%', maxWidth:500, maxHeight:'80vh', overflowY:'auto' as const, boxShadow:`0 0 60px ${fundedModal.color}22` }}
                    onClick={e=>e.stopPropagation()}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${fundedModal.color},transparent)`, borderRadius:'16px 16px 0 0' }}/>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                      <div>
                        <div style={{ fontFamily:C.mono, color:fundedModal.color, fontSize:9, letterSpacing:2, marginBottom:6 }}>{fundedModal.k} — {fundedModal.label.toUpperCase()}</div>
                        <div style={{ fontSize:20, fontWeight:800, fontFamily:C.mono, color:fundedModal.color }}>
                          {fundedMembers.filter(m=>m.funded_status===fundedModal.k).length} <span style={{color:'#aaaaaa',fontSize:14,fontWeight:400}}>member</span>
                        </div>
                      </div>
                      <button onClick={()=>setFundedModal(null)} style={{ background:'#111120', border:'1px solid #22223a', color:'#cccccc', fontSize:18, cursor:'pointer', width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column' as const, gap:8 }}>
                      {fundedMembers.filter(m=>m.funded_status===fundedModal.k).map((m:any)=>(
                        <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'#070710', border:`1px solid ${fundedModal.color}22`, borderRadius:10 }}>
                          <div style={{ width:38, height:38, background:`${fundedModal.color}18`, border:`1px solid ${fundedModal.color}44`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:fundedModal.color, flexShrink:0, fontFamily:C.mono, boxShadow:`0 0 12px ${fundedModal.color}22` }}>
                            {m.nama?.[0]?.toUpperCase()||'?'}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:13 }}>{m.nama}</div>
                            <div style={{ fontFamily:C.mono, fontSize:9, color:'#aaaaaa', marginTop:2 }}>{m.tier?.replace('SMC ','')}</div>
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

              {/* Row 3 — Klaim + Aktivitas */}
              <div className='ap-grid15' style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:12 }}>
                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#3b82f644,transparent)' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:C.mono, color:'#3b82f6', fontSize:9, letterSpacing:2 }}>// KLAIM PARTNERSHIP TERBARU</div>
                    <button onClick={()=>setActive('klaim')} style={{ fontFamily:C.mono, fontSize:9, color:'#aaaaaa', background:'#0f0f18', border:'1px solid #1a1a2a', padding:'3px 9px', cursor:'pointer', borderRadius:4 }}>LIHAT SEMUA ›</button>
                  </div>
                  <div style={{ fontFamily:C.mono, display:'grid', gridTemplateColumns:'20px 1fr 60px 80px 70px', gap:'4px 8px', fontSize:9, color:'#5555888', paddingBottom:8, borderBottom:'1px solid #111120', marginBottom:6 }}>
                    {['#','NAMA','BROKER','TANGGAL','STATUS'].map(h=><span key={h}>{h}</span>)}
                  </div>
                  {recentClaims.length===0 && <div style={{fontFamily:C.mono,color:'#5555888',fontSize:11,padding:'12px 0'}}>Belum ada klaim.</div>}
                  {recentClaims.map((cl:any,i:number)=>(
                    <div key={cl.id} style={{ fontFamily:C.mono, display:'grid', gridTemplateColumns:'20px 1fr 60px 80px 70px', gap:'4px 8px', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #0d0d18', fontSize:11 }}>
                      <span style={{color:'#5555888'}}>{i+1}</span>
                      <span style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{cl.nama}</span>
                      <span style={{color:'#aaaaaa'}}>{cl.broker}</span>
                      <span style={{color:'#aaaaaa',fontSize:10}}>{new Date(cl.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span>
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
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px', background:'#070710', borderRadius:8, border:'1px solid #0f0f18' }}>
                        <span style={{fontSize:14,flexShrink:0}}>{a.icon}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,color:'#aaaaaa',lineHeight:1.4}}>{a.text}</div>
                          <div style={{fontFamily:C.mono,fontSize:9,color:'#5555888',marginTop:3}}>{a.time}</div>
                        </div>
                        <div style={{width:5,height:5,borderRadius:'50%',background:i<2?C.up:'#1a1a2a',flexShrink:0,marginTop:5,boxShadow:i<2?`0 0 6px ${C.up}`:''}}/>
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
                    <button onClick={()=>setActive('member')} style={{ fontFamily:C.mono, fontSize:9, color:'#aaaaaa', background:'#0f0f18', border:'1px solid #1a1a2a', padding:'3px 9px', cursor:'pointer', borderRadius:4 }}>LIHAT ›</button>
                  </div>
                  {topMembers.slice(0,5).map((m:any,i:number)=>{
                    const COLORS=['#eab308','#00e5a0','#a855f7','#3b82f6','#ec4899'];
                    const diffMin=m.last_seen?Math.floor((Date.now()-new Date(m.last_seen).getTime())/60000):null;
                    const diffH=diffMin!==null?Math.floor(diffMin/60):null;
                    const diffD=diffH!==null?Math.floor(diffH/24):null;
                    const ago=!m.last_seen?'—':diffMin!==null&&diffMin<60?`${diffMin}m`:diffH!==null&&diffH<24?`${diffH}j`:`${diffD}h`;
                    return (
                      <div key={m.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 0', borderBottom:'1px solid #0d0d18' }}>
                        <span style={{fontFamily:C.mono,color:'#5555888',fontSize:9,width:16}}>{i+1}</span>
                        <div style={{width:32,height:32,borderRadius:'50%',background:`${COLORS[i]}22`,border:`1px solid ${COLORS[i]}44`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:12,color:COLORS[i],flexShrink:0,boxShadow:`0 0 8px ${COLORS[i]}22`}}>
                          {(m.nama||'?')[0].toUpperCase()}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const,fontSize:12}}>{m.nama}</div>
                          <div style={{fontFamily:C.mono,color:'#aaaaaa',fontSize:9}}>{m.tier?.split(' ').slice(-1)[0]||''}</div>
                        </div>
                        <div style={{fontFamily:C.mono,color:i===0?C.up:'#333344',fontSize:10}}>{i===0?'🟢 ':''}{ago}</div>
                      </div>
                    );
                  })}
                  {topMembers.length===0 && <div style={{fontFamily:C.mono,color:'#5555888',fontSize:11,padding:'12px 0'}}>Tidak ada data.</div>}
                </div>

                <div style={{ background:'linear-gradient(145deg,#0b0b14,#080810)', border:'1px solid #1a1a2a', borderRadius:14, padding:'20px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#eab30866,transparent)' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontFamily:C.mono, color:G.gold, fontSize:9, letterSpacing:2 }}>// GRAFIK PERTUMBUHAN MEMBER</div>
                    <div style={{ fontFamily:C.mono, fontSize:9, color:'#aaaaaa', background:'#0a0a12', border:'1px solid #1a1a2a', padding:'3px 9px', borderRadius:4 }}>30 HARI TERAKHIR</div>
                  </div>
                  <MiniChart data={GROWTH_DATA} color={G.gold} height={130}/>
                  <div style={{ display:'flex', justifyContent:'space-between', fontFamily:C.mono, fontSize:9, color:'#5555888', marginTop:8 }}>
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
