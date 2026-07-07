// pages/LoginPage.tsx — Custom auth (nama + tier + password, no email)
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CANDLE_GRID_STYLE } from '../components/mr';

type View = 'member' | 'admin' | 'forgot';
const TIERS = ['SMC Trial','SMC Bronze','SMC Silver','SMC Gold Mentorship','SMC Platinum 1-on-1','Indikator Bulanan','Indikator Tahunan','Indikator Lifetime'];

function Field({ label, type='text', value, onChange, placeholder, icon }: {
  label:string; type?:string; value:string; onChange:(v:string)=>void; placeholder?:string; icon?:React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const isPass = type==='password';
  return (
    <div>
      <label style={{display:'block',fontSize:13,color:'var(--mr-muted)',marginBottom:8,fontWeight:500}}>{label}</label>
      <div style={{position:'relative'}}>
        {icon&&<span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#555'}}>{icon}</span>}
        <input type={isPass&&show?'text':type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={{width:'100%',background:'var(--mr-dark)',border:'1px solid var(--mr-border2)',color:'var(--mr-text)',padding:`13px 14px 13px ${icon?'40px':'14px'}`,fontSize:14,outline:'none',boxSizing:'border-box' as const,fontFamily:'inherit',borderRadius:8}}
          onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='var(--mr-border2)'}/>
        {isPass&&<button onClick={()=>setShow(s=>!s)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:16}}>{show?'🙈':'👁'}</button>}
      </div>
    </div>
  );
}

function MemberForm({ onForgot }: { onForgot:()=>void }) {
  const [nama, setNama]   = useState('');
  const [tier, setTier]   = useState('');
  const [pass, setPass]   = useState('');
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);
  const [remember, setRemember] = useState(true);

  async function handleLogin() {
    if (!nama||!tier||!pass) { setError('Semua field wajib diisi.'); return; }
    setLoad(true); setError('');
    try {
      const { data, error: rpcErr } = await supabase.rpc('login_member', {
        p_nama: nama.trim(), p_tier: tier, p_password: pass,
      });
      if (rpcErr) throw rpcErr;
      if (!data) throw new Error('Nama, tier, atau password salah.');

      // Cek status aktif akun (via direct query jika RPC tidak kembalikan is_active)
      if (data.is_active === false) throw new Error('Akun Anda telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.');
      if (data.id && data.is_active === undefined) {
        const { data: statusRow } = await supabase.from('members').select('is_active').eq('id', data.id).single();
        if (statusRow?.is_active === false) throw new Error('Akun Anda telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.');
      }

      // Catat waktu login terakhir
      if (data.id) {
        await supabase.from('members').update({ last_seen: new Date().toISOString() }).eq('id', data.id);
      }

      // Simpan session - localStorage jika ingat, sessionStorage jika tidak
      if (remember) {
        localStorage.setItem('mr_member', JSON.stringify(data));
        sessionStorage.removeItem('mr_member');
      } else {
        sessionStorage.setItem('mr_member', JSON.stringify(data));
        localStorage.removeItem('mr_member');
      }
      window.location.href = '/member';
    } catch(e:unknown) {
      setError(e instanceof Error ? e.message : 'Login gagal.');
    } finally { setLoad(false); }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <Field label="Nama Lengkap" value={nama} onChange={setNama} placeholder="Sesuai data pendaftaran"
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}/>
      <div>
        <label style={{display:'block',fontSize:13,color:'var(--mr-muted)',marginBottom:8,fontWeight:500}}>Tier Kelas</label>
        <select value={tier} onChange={e=>setTier(e.target.value)} style={{width:'100%',background:'var(--mr-dark)',border:'1px solid var(--mr-border2)',color:tier?'var(--mr-text)':'var(--mr-dim)',padding:'13px 14px',fontSize:14,outline:'none',fontFamily:'inherit',borderRadius:8,appearance:'none' as const,cursor:'pointer',boxSizing:'border-box' as const}}
          onFocus={e=>e.target.style.borderColor='#eab308'} onBlur={e=>e.target.style.borderColor='var(--mr-border2)'}>
          <option value="">Pilih tier kelas kamu</option>
          {TIERS.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <Field label="Password" type="password" value={pass} onChange={setPass} placeholder="Password akun member"/>
      {/* Ingat Saya */}
      <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',userSelect:'none' as const}}>
        <div onClick={()=>setRemember(r=>!r)} style={{width:20,height:20,borderRadius:5,border:`2px solid ${remember?'#eab308':'var(--mr-border2)'}`,background:remember?'#eab308':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'all 0.15s'}}>
          {remember&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
        <span style={{fontSize:13,color:remember?'var(--mr-text)':'var(--mr-dim)'}}>Ingat saya di perangkat ini</span>
      </label>
      {error&&<div style={{color:'#ef4444',fontSize:13,fontFamily:'"Geist Mono",monospace'}}>⚠ {error}</div>}
      <button onClick={handleLogin} disabled={loading} style={{background:'#eab308',color:'#000',fontWeight:700,padding:'16px',fontSize:14,border:'none',cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:4,borderRadius:10}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        {loading?'MEMPROSES...':'Masuk ke Trading Room'}
      </button>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
        <button onClick={onForgot} style={{color:'#eab308',background:'none',border:'none',cursor:'pointer',textDecoration:'underline',fontSize:13}}>Lupa Password?</button>
        <a href="https://wa.me/6281242224939" target="_blank" rel="noreferrer" style={{color:'var(--mr-dim)',textDecoration:'none',fontSize:13}}>Hubungi Admin</a>
      </div>
      <div style={{textAlign:'center',color:'#444',fontSize:12,fontFamily:'"Geist Mono",monospace',paddingTop:8,borderTop:'1px solid #1a1a1a'}}>
        🔒 Secure Login · Your data is protected
      </div>
    </div>
  );
}

function AdminForm() {
  const [nama, setNama]   = useState('');
  const [pass, setPass]   = useState('');
  const [error, setError] = useState('');
  const [loading, setLoad] = useState(false);
  const [remember, setRemember] = useState(true);

  async function handleLogin() {
    if (!nama||!pass) { setError('Semua field wajib diisi.'); return; }
    setLoad(true); setError('');
    try {
      // Admin login — query ke tabel admins
      const { data, error: rpcErr } = await supabase.rpc('login_admin', {
        p_username: nama.trim(),
        p_password: pass,
      });
      if (rpcErr) throw rpcErr;
      if (!data) throw new Error('Username atau password salah.');
      localStorage.setItem('mr_admin', JSON.stringify(data));
      window.location.href = '/admin';
    } catch(e:unknown) {
      setError(e instanceof Error ? e.message : 'Login gagal.');
    } finally { setLoad(false); }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <Field label="Username" value={nama} onChange={setNama} placeholder="fauzan"
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}/>
      <Field label="Password" type="password" value={pass} onChange={setPass} placeholder="Password admin"/>
      {/* Ingat Saya */}
      <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',userSelect:'none' as const}}>
        <div onClick={()=>setRemember(r=>!r)} style={{width:20,height:20,borderRadius:5,border:`2px solid ${remember?'#eab308':'var(--mr-border2)'}`,background:remember?'#eab308':'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'all 0.15s'}}>
          {remember&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
        <span style={{fontSize:13,color:remember?'var(--mr-text)':'var(--mr-dim)'}}>Ingat saya di perangkat ini</span>
      </label>
      {error&&<div style={{color:'#ef4444',fontSize:13,fontFamily:'"Geist Mono",monospace'}}>⚠ {error}</div>}
      <button onClick={handleLogin} disabled={loading} style={{background:'#ef4444',color:'#fff',fontWeight:700,padding:'16px',fontSize:14,border:'none',cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:4,borderRadius:10}}>
        {loading?'MEMPROSES...':'Masuk ke Control Center'}
      </button>
    </div>
  );
}

function ForgotForm({ onBack }: { onBack:()=>void }) {
  const [nama, setNama] = useState('');
  const [tier, setTier] = useState('');
  const [sent, setSent] = useState(false);

  function handleReset() {
    if (!nama||!tier) return;
    const msg = encodeURIComponent(`Halo admin, saya ${nama} (${tier}) ingin reset password akun Menolak Rugi saya.`);
    window.open(`https://wa.me/6281242224939?text=${msg}`, '_blank');
    setSent(true);
  }

  if (sent) return (
    <div style={{textAlign:'center',padding:'20px 0'}}>
      <div style={{fontSize:40,marginBottom:16}}>✅</div>
      <div style={{fontWeight:700,fontSize:18,marginBottom:8}}>WhatsApp Terbuka!</div>
      <div style={{color:'var(--mr-dim)',fontSize:14,lineHeight:1.6,marginBottom:24}}>Kirim pesan ke admin untuk proses reset password.</div>
      <button onClick={onBack} style={{color:'#eab308',background:'none',border:'none',cursor:'pointer',fontSize:14}}>← Kembali ke Login</button>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <Field label="Nama Lengkap" value={nama} onChange={setNama} placeholder="Sesuai data pendaftaran"
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}/>
      <div>
        <label style={{display:'block',fontSize:13,color:'var(--mr-muted)',marginBottom:8,fontWeight:500}}>Tier Kelas</label>
        <select value={tier} onChange={e=>setTier(e.target.value)} style={{width:'100%',background:'var(--mr-border)',border:'1px solid #2a2a2a',color:tier?'var(--mr-text)':'var(--mr-dim)',padding:'13px 14px',fontSize:14,outline:'none',fontFamily:'inherit',borderRadius:8,appearance:'none' as const,boxSizing:'border-box' as const}}>
          <option value="">Pilih tier kelas kamu</option>
          {TIERS.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <button onClick={handleReset} style={{background:'var(--mr-dark)',color:'var(--mr-text)',fontWeight:700,padding:'16px',fontSize:14,border:'1px solid var(--mr-border2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:4,borderRadius:10}}>
        Reset Password via WhatsApp
      </button>
      <button onClick={onBack} style={{color:'var(--mr-dim)',background:'none',border:'none',cursor:'pointer',fontSize:13,textAlign:'center' as const}}>← Kembali ke Login</button>
    </div>
  );
}

export default function LoginPage() {
  const [view, setView] = useState<View>('member');

  // Auto-redirect jika sudah login
  React.useEffect(() => {
    const stored = localStorage.getItem('mr_member') || sessionStorage.getItem('mr_member');
    if (stored) { try { JSON.parse(stored); window.location.href = '/member'; } catch {} }
    const admin = localStorage.getItem('mr_admin');
    if (admin) { try { JSON.parse(admin); window.location.href = '/admin'; } catch {} }
  }, []);
  return (
    <div className='mr-lp-outer' style={{fontFamily:'"Geist",system-ui,sans-serif',background:'var(--mr-bg)',minHeight:'100vh',color:'var(--mr-text)',WebkitFontSmoothing:'antialiased',overflowX:'hidden',display:'grid',gridTemplateColumns:'1fr 520px'}}>
      <style>{`
        .mr-lp-outer { display: grid; grid-template-columns: 1fr 520px; min-height: 100vh; }
        .mr-lp-left { display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; padding: 48px 56px; }
        .mr-lp-right { display: flex; align-items: center; justify-content: center; padding: 48px 40px; background: var(--mr-sidebar); border-left: 1px solid var(--mr-border); }
        .mr-lp-form { width: 100%; max-width: 400px; }
        @media (max-width: 767px) {
          .mr-lp-outer { display: flex !important; flex-direction: column; min-height: 100vh; }
          .mr-lp-left { display: none !important; }
          .mr-lp-right { padding: 40px 20px !important; border-left: none !important; flex: 1; min-height: 100vh; align-items: flex-start !important; padding-top: 60px !important; }
          .mr-lp-form { max-width: 100% !important; }
          .mr-lp-tabs { gap: 6px !important; }
          .mr-lp-field input { font-size: 16px !important; }
        }
      `}</style>
      {/* Kiri */}
      <div className='mr-lp-left' style={{position:'relative',padding:'48px 56px',display:'flex',flexDirection:'column',justifyContent:'space-between',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,opacity:0.3,...CANDLE_GRID_STYLE}}/>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 30% 60%, rgba(234,179,8,0.06) 0%, transparent 60%)'}}/>
        <div style={{position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:64}}>
            <div style={{width:44,height:44}}><img src='/logo.png' alt='MR' style={{width:'100%',height:'100%',objectFit:'contain'}}/></div>
            <div>
              <div style={{fontWeight:800,letterSpacing:1,fontSize:14}}>MENOLAK RUGI</div>
              <div style={{fontFamily:'"Geist Mono",monospace',color:'#555',fontSize:10,letterSpacing:1.5}}>PRIVATE TRADING ENVIRONMENT</div>
            </div>
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,fontFamily:'"Geist Mono",monospace',fontSize:10,color:'#555'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              SECURE ACCESS
            </div>
          </div>
          <div style={{fontFamily:'"Geist Mono",monospace',color:'#eab308',fontSize:11,letterSpacing:2,marginBottom:20}}>//  ACCESS GATEWAY</div>
          <h1 style={{fontSize:56,fontWeight:700,letterSpacing:-2,lineHeight:1.05,margin:'0 0 20px'}}>Access<br/><span style={{color:'#eab308'}}>Trading Room</span></h1>
          <p style={{color:'var(--mr-dim)',fontSize:16,lineHeight:1.65,maxWidth:380,marginBottom:48}}>Masuk ke dashboard mentorship & trading environment eksklusif Menolak Rugi.</p>
          <div style={{width:48,height:2,background:'#eab308'}}/>
        </div>
        <div style={{position:'relative'}}>
          <div style={{border:'1px solid #1a1a1a',background:'var(--mr-sidebar)',padding:'20px 24px',maxWidth:360}}>
            <div style={{fontSize:28,color:'#eab308',fontFamily:'serif',lineHeight:1,marginBottom:12}}>"</div>
            <div style={{fontSize:16,fontStyle:'italic',color:'#ccc',lineHeight:1.6}}>Disiplin hari ini, freedom di masa depan.</div>
            <div style={{fontFamily:'"Geist Mono",monospace',color:'#eab308',fontSize:11,marginTop:14}}>— Menolak Rugi</div>
          </div>
          <div style={{fontFamily:'"Geist Mono",monospace',color:'var(--mr-dim)',fontSize:11,marginTop:32}}>© 2026 MENOLAK RUGI. All rights reserved.</div>
        </div>
      </div>

      {/* Kanan */}
      <div className='mr-lp-right' style={{background:'var(--mr-sidebar)',borderLeft:'1px solid #1a1a1a',display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 40px'}}>
        <div className='mr-lp-form' style={{width:'100%',maxWidth:400}}>
          {view==='forgot' ? (
            <>
              <div style={{textAlign:'center',marginBottom:36}}>
                <div style={{width:64,height:64,background:'var(--mr-border)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:28}}>🔑</div>
                <h2 style={{fontSize:28,fontWeight:700,margin:'0 0 8px'}}>Recover Access</h2>
                <p style={{color:'var(--mr-dim)',fontSize:14,margin:0}}>Verifikasi data membership untuk reset password.</p>
              </div>
              <ForgotForm onBack={()=>setView('member')}/>
            </>
          ) : (
            <>
              <div style={{textAlign:'center',marginBottom:28}}>
                <div style={{width:64,height:64,background:'var(--mr-border)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:28}}>
                  {view==='admin'?'🛡':'🔒'}
                </div>
                <h2 style={{fontSize:26,fontWeight:700,margin:'0 0 6px'}}>Welcome Back</h2>
                <p style={{color:'var(--mr-dim)',fontSize:14,margin:0}}>{view==='admin'?'Login sebagai administrator.':'Gunakan akun membership kamu untuk masuk.'}</p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:28,background:'var(--mr-panel)',padding:4,borderRadius:8}}>
                <button onClick={()=>setView('member')} style={{padding:'10px',fontWeight:600,fontSize:14,border:'none',borderRadius:6,background:view==='member'?'#eab308':'transparent',color:view==='member'?'#000':'var(--mr-dim)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Member
                </button>
                <button onClick={()=>setView('admin')} style={{padding:'10px',fontWeight:600,fontSize:14,border:'none',borderRadius:6,background:view==='admin'?'#ef4444':'transparent',color:view==='admin'?'#fff':'var(--mr-dim)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Admin
                </button>
              </div>
              {view==='member'&&<MemberForm onForgot={()=>setView('forgot')}/>}
              {view==='admin'&&<AdminForm/>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
