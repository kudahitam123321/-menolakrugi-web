// pages/PartnershipPage.tsx — Multi-step Partnership Flow
import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const G  = { gold: '#eab308', gold2: '#ca9e00', goldDim: 'var(--mr-tint-gold-b)', goldGlow: 'rgba(234,179,8,0.25)' };
const C  = { bg: 'var(--mr-bg)', panel: 'var(--mr-panel)', panel2: 'var(--mr-border)', border: 'var(--mr-border)', border2: 'var(--mr-border2)', dim: 'var(--mr-dim)', dimmer: 'var(--mr-dimmer)', text: 'var(--mr-text)', muted: 'var(--mr-muted)', up: '#22ab94', mono: '"Geist Mono", monospace', sans: '"Geist", system-ui, sans-serif' };

const BROKERS = [
  { id: 'HFM', name: 'Broker HFM', url: 'https://www.hfm.com/?refid=30528271', code: '30528271', logo: 'HFM', logoColor: '#e63329', logoBg: '#1a0a09', perks: ['Teregulasi & Terpercaya', 'Spread Kompetitif', 'Eksekusi Cepat'] },
  { id: 'EXNESS', name: 'Broker EXNESS', url: 'https://one.exnesstrack.org/a/a7tps7wodw', code: 'a7tps7wodw', logo: 'ex\nness', logoColor: '#00c278', logoBg: '#081a12', perks: ['Teregulasi & Terpercaya', 'Spread Rendah', 'Withdraw Cepat'] },
];

function NavBar({ showBack = false, backTo = '/partnership' }: { showBack?: boolean; backTo?: string }) {
  return (
    <div className='pp-nav' style={{ borderBottom: `1px solid ${C.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#050505', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {showBack && (
          <button onClick={() => window.location.href = backTo} style={{ color: C.dim, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: C.mono, padding: '6px 10px', borderRadius: 6, marginRight: 4 }}>← Kembali</button>
        )}
        <div onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 34, height: 34, background: G.gold, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#000' }}>MR</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>MENOLAK RUGI</div>
            <div style={{ overflowX: 'hidden', fontFamily: C.mono, color: C.dim, fontSize: 9, letterSpacing: 1 }}>SMC TERMINAL · V3.0</div>
      <style>{`
        @media(max-width:767px){
          .pp-nav{padding:14px 16px!important}
          .pp-nav-title{display:none!important}
          .pp-main{padding:16px!important}
          .pp-card{padding:24px 18px!important}
          .pp-grid3{grid-template-columns:1fr!important}
          .pp-stats3{grid-template-columns:repeat(3,1fr)!important;gap:6px!important}
          .pp-stats3 > div{padding:10px 8px!important}
          .pp-confirm-grid3{grid-template-columns:1fr!important}
          .pp-broker-actions{flex-direction:column!important}
          .pp-next-btn{font-size:14px!important;padding:14px!important}
        }
      `}</style>          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => window.location.href = '/login'} style={{ fontFamily: C.mono, fontSize: 11, color: C.dim, padding: '8px 14px', border: `1px solid ${C.border2}`, background: 'transparent', cursor: 'pointer', borderRadius: 6 }}>LOG IN</button>
        <button onClick={() => window.location.href = '/signup'} style={{ fontFamily: C.mono, fontSize: 11, color: '#000', padding: '8px 14px', background: `linear-gradient(135deg,${G.gold},${G.gold2})`, border: 'none', cursor: 'pointer', borderRadius: 6, fontWeight: 700 }}>BUKA AKUN ›</button>
      </div>
    </div>
  );
}

function Wrap({ children, showBack = false, backTo = '/partnership' }: { children: React.ReactNode; showBack?: boolean; backTo?: string }) {
  return (
    <div style={{ overflowX: 'hidden', fontFamily: C.sans, background: C.bg, minHeight: '100vh', color: C.text, WebkitFontSmoothing: 'antialiased' }}>
      <NavBar showBack={showBack} backTo={backTo} />
      {children}
    </div>
  );
}

// ── STEP 1: Intro ─────────────────────────────────────────────────────────────
function StepIntro() {
  return (
    <Wrap>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '56px 24px' }}>
        <div className='pp-card' style={{ background: 'linear-gradient(135deg,var(--mr-tint-gold),var(--mr-bg))', border: `1px solid ${G.goldDim}`, borderRadius: 20, padding: '40px 36px', boxShadow: `0 0 60px ${G.goldGlow}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.1 }}>
            <svg viewBox="0 0 180 200" width="180" height="200">
              {[20,50,80,110,140].map((x, i) => { const h=[70,110,60,130,90][i]; const up=i%2===0; return <g key={x}><line x1={x} x2={x} y1={200-h-15} y2={190} stroke={up?'#22ab94':'#ef4444'} strokeWidth="2.5"/><rect x={x-10} y={200-h} width="20" height={h*0.6} fill={up?'#22ab94':'#ef4444'}/></g>; })}
            </svg>
          </div>
          <div style={{ width: 64, height: 64, background: 'var(--mr-tint-gold)', border: `1px solid ${G.goldDim}`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 0 24px ${G.goldGlow}` }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={G.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, margin: '0 0 14px' }}>Join Gratis<br />via <span style={{ color: G.gold }}>Partnership</span></h1>
          <p style={{ color: C.dim, fontSize: 15, lineHeight: 1.65, marginBottom: 28 }}>Dapatkan akses kelas <span style={{ color: G.gold, fontWeight: 600 }}>GRATIS</span> cukup dengan mendaftar melalui broker partner kami. Tidak ada biaya tersembunyi.</p>
          <div className='pp-stats3' style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
            {[{ icon: '🏦', l: 'Daftar melalui broker partner kami' }, { icon: '📋', l: 'Isi form konfirmasi' }, { icon: '🔓', l: 'Akses langsung diaktifkan' }].map((s, i) => (
              <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.up} strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div><div style={{ fontWeight: 700, color: C.up, fontSize: 14 }}>100% Gratis</div><div style={{ fontSize: 12, color: C.dim }}>Akses kelas premium tanpa biaya apa pun.</div></div>
          </div>
          <button onClick={() => window.location.href = '/partnership/broker'} style={{ width: '100%', background: `linear-gradient(135deg,${G.gold},${G.gold2})`, color: '#000', fontWeight: 700, padding: '16px', fontSize: 16, border: 'none', cursor: 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: `0 0 30px ${G.goldGlow}` }}>
            → Join Now
          </button>
        </div>
      </div>
    </Wrap>
  );
}

// ── STEP 2: Pilih Broker ──────────────────────────────────────────────────────
function StepBroker() {
  const [clicked, setClicked] = useState<string | null>(null);
  return (
    <Wrap showBack backTo="/partnership">
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px' }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, margin: '0 0 8px' }}>Pilih Broker Partner</h2>
        <p style={{ color: C.dim, fontSize: 15, marginBottom: 32 }}>Daftar melalui salah satu broker partner resmi kami untuk mendapatkan akses <span style={{ color: G.gold }}>GRATIS</span> ke kelas.</p>
        <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
          {BROKERS.map(b => (
            <div key={b.id} style={{ background: C.panel, border: `1px solid ${clicked === b.id ? G.gold : C.border}`, borderRadius: 14, padding: '24px', boxShadow: clicked === b.id ? `0 0 20px ${G.goldGlow}` : 'none', transition: 'all .2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, background: b.logoBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border2}`, flexShrink: 0 }}>
                  <span style={{ fontWeight: 900, fontSize: 13, color: b.logoColor, fontFamily: C.mono, textAlign: 'center', lineHeight: 1.2, whiteSpace: 'pre' as 'pre' }}>{b.logo}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{b.name}</div>
                  <div style={{ display: 'grid', gap: 3, marginTop: 6 }}>
                    {b.perks.map(p => <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.up} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>{p}</div>)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ overflowX: 'hidden', fontFamily: C.mono, fontSize: 11, color: C.dim, marginBottom: 4 }}>Kode Referral</div>
                  <div style={{ overflowX: 'hidden', fontFamily: C.mono, fontSize: 14, color: G.gold, fontWeight: 700 }}>{b.code}</div>
                </div>
              </div>
              <button onClick={() => { setClicked(b.id); window.open(b.url, '_blank'); }} style={{ width: '100%', background: `linear-gradient(135deg,${G.gold},${G.gold2})`, color: '#000', fontWeight: 700, padding: '13px', fontSize: 14, border: 'none', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Daftar via {b.name.replace('Broker ', '')}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>
            </div>
          ))}
        </div>
        <div style={{ background: '#0d0c00', border: `1px solid #2a2200`, borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
          <div className='pp-broker-actions' style={{ display: 'flex', gap: 10 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.gold} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div><div style={{ fontWeight: 700, color: G.gold, fontSize: 13, marginBottom: 3 }}>Penting</div><div style={{ color: C.dim, fontSize: 13, lineHeight: 1.6 }}>Gunakan link pendaftaran di atas agar akses kamu dapat diverifikasi dan diaktifkan.</div></div>
          </div>
        </div>
        {clicked
          ? <button onClick={() => window.location.href = '/partnership/confirm'} style={{ width: '100%', background: C.bg, color: C.text, fontWeight: 700, padding: '14px', fontSize: 15, border: `2px solid ${G.gold}`, cursor: 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 0 20px ${G.goldGlow}` }}>Saya Sudah Daftar, Lanjutkan →</button>
          : <div style={{ textAlign: 'center', color: C.dimmer, fontSize: 13, fontFamily: C.mono }}>Klik salah satu broker di atas untuk mendaftar dulu</div>
        }
      </div>
    </Wrap>
  );
}

// ── STEP 3+4: Confirm & Success ───────────────────────────────────────────────
function StepConfirm() {
  const [form, setForm] = useState({ nama: '', email: '', whatsapp: '', broker: '', nomorAkun: '' });
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: C.panel2, border: `1px solid ${C.border}`, color: C.text, padding: '12px 14px', fontSize: 14, outline: 'none', fontFamily: C.sans, borderRadius: 8 };

  async function handleSubmit() {
    if (!form.nama || !form.email || !form.whatsapp || !form.broker || !form.nomorAkun) { setError('Semua field wajib diisi.'); return; }
    setLoad(true); setError('');
    try {
      let screenshotUrl: string | null = null;
      if (file) {
        const ext = file.name.split('.').pop();
        const p = `partnership/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('uploads').upload(p, file, { upsert: true });
        if (!upErr) { const { data } = supabase.storage.from('uploads').getPublicUrl(p); screenshotUrl = data.publicUrl; }
      }
      const { error: dbErr } = await supabase.from('partnership_claims').insert({
        nama_lengkap: form.nama,
        broker: form.broker,
        status: 'pending',
        email: form.email,
        whatsapp: form.whatsapp,
        nomor_akun: form.nomorAkun,
        screenshot_url: screenshotUrl,
        catatan: `No. Akun: ${form.nomorAkun} | WA: ${form.whatsapp} | Email: ${form.email}`,
      });
      if (dbErr) throw new Error(dbErr.message || JSON.stringify(dbErr));
      const msg = encodeURIComponent(`🔔 Klaim Partnership Baru!\n\nNama: ${form.nama}\nBroker: ${form.broker}\nNo. Akun: ${form.nomorAkun}\nWA: ${form.whatsapp}\nEmail: ${form.email}`);
      window.open(`https://wa.me/6281242224939?text=${msg}`, '_blank');
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as any)?.message || 'Terjadi kesalahan. Coba lagi.';
      setError(msg);
    }
    finally { setLoad(false); }
  }

  if (success) return (
    <Wrap>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: '#0f1a0f', border: `2px solid ${C.up}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 30px rgba(34,171,148,0.3)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.up} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 700, margin: '0 0 12px' }}>Data Berhasil Dikirim!</h2>
        <p style={{ color: C.dim, fontSize: 15, lineHeight: 1.65, marginBottom: 36 }}>Terima kasih, data pendaftaran kamu telah kami terima.<br />Tim kami akan memverifikasi akun kamu.</p>
        <div className='pp-stats3' style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 36 }}>
          {[{ icon: '✅', t: 'Verifikasi Data', d: 'Tim kami akan mengecek data dan bukti pendaftaran.' }, { icon: '⏱', t: 'Proses Cepat', d: 'Maksimal 1×24 jam setelah data diterima.' }, { icon: '🔓', t: 'Akses Dikirim', d: 'Akses kelas akan dikirim melalui WhatsApp kamu.' }].map(s => (
            <div key={s.t} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 5 }}>{s.t}</div>
              <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.45 }}>{s.d}</div>
            </div>
          ))}
        </div>
        <button onClick={() => window.location.href = '/'} style={{ width: '100%', background: `linear-gradient(135deg,${G.gold},${G.gold2})`, color: '#000', fontWeight: 700, padding: '14px', fontSize: 15, border: 'none', cursor: 'pointer', borderRadius: 10 }}>Kembali ke Beranda</button>
      </div>
    </Wrap>
  );

  return (
    <Wrap showBack backTo="/partnership/broker">
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--mr-tint-gold)', border: `1px solid ${G.goldDim}`, borderRadius: 6, padding: '5px 12px', marginBottom: 20 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={G.gold} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span style={{ fontFamily: C.mono, fontSize: 10, color: G.gold, letterSpacing: 1.5 }}>LANGKAH 3 DARI 3</span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.8, margin: '0 0 8px' }}>Konfirmasi Pendaftaran</h2>
          <p style={{ color: C.dim, fontSize: 14, marginBottom: 28 }}>Lengkapi form di bawah ini untuk verifikasi akun kamu. Akses akan diaktifkan setelah kami verifikasi.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {[
              { l: 'Nama Lengkap', k: 'nama' as const, ph: 'Masukkan nama lengkap' },
              { l: 'Email', k: 'email' as const, ph: 'email@contoh.com' },
              { l: 'Nomor WhatsApp', k: 'whatsapp' as const, ph: '08xxxxxxxxxx' },
            ].map(f => (
              <div key={f.k}>
                <label style={{ fontSize: 13, color: C.text, fontWeight: 500, display: 'block', marginBottom: 6 }}>{f.l} <span style={{ color: G.gold }}>*</span></label>
                <input value={form[f.k]} onChange={e => set(f.k)(e.target.value)} placeholder={f.ph} style={inp} onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 13, color: C.text, fontWeight: 500, display: 'block', marginBottom: 6 }}>Broker yang Digunakan <span style={{ color: G.gold }}>*</span></label>
              <select value={form.broker} onChange={e => set('broker')(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer', color: form.broker ? C.text : C.dim } as React.CSSProperties} onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border}>
                <option value="">-- Pilih Broker --</option>
                <option value="HFM">HFM (Kode: 30528271)</option>
                <option value="EXNESS">EXNESS (Kode: a7tps7wodw)</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: C.text, fontWeight: 500, display: 'block', marginBottom: 6 }}>Nomor Akun Broker <span style={{ color: G.gold }}>*</span></label>
            <input value={form.nomorAkun} onChange={e => set('nomorAkun')(e.target.value)} placeholder="Nomor akun dari dashboard broker kamu" style={inp} onFocus={e => e.target.style.borderColor = G.gold} onBlur={e => e.target.style.borderColor = C.border} />
            <div style={{ fontSize: 11, color: C.dimmer, marginTop: 5 }}>Cek di dashboard broker setelah berhasil daftar</div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: C.text, fontWeight: 500, display: 'block', marginBottom: 6 }}>Screenshot Bukti Pendaftaran <span style={{ color: C.dim, fontWeight: 400 }}>(Opsional, tapi mempercepat verifikasi)</span></label>
            <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${file ? G.gold : C.border2}`, borderRadius: 10, padding: '28px', textAlign: 'center', cursor: 'pointer', background: file ? '#0e0c00' : C.panel2 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={file ? G.gold : C.dim} strokeWidth="1.5" style={{ marginBottom: 8 }}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
              <div style={{ color: file ? G.gold : C.text, fontSize: 14 }}>{file ? file.name : 'Klik untuk upload gambar (JPG, PNG, dll)'}</div>
              <div style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>{file ? `${(file.size/1024/1024).toFixed(2)} MB` : 'Maks. 5MB'}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 14 }}>⚠ {error}</div>}
          <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', background: loading ? C.border2 : `linear-gradient(135deg,${G.gold},${G.gold2})`, color: '#000', fontWeight: 700, padding: '16px', fontSize: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: loading ? 'none' : `0 0 24px ${G.goldGlow}` }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {loading ? 'Mengirim...' : 'Kirim & Klaim Akses Gratis'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 14, color: C.dimmer, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Akses akan diteruskan ke WhatsApp admin untuk verifikasi (1×24 jam).
          </div>
        </div>
      </div>
    </Wrap>
  );
}

export default function PartnershipPage({ step }: { step: 'intro' | 'broker' | 'confirm' }) {
  if (step === 'broker')  return <StepBroker />;
  if (step === 'confirm') return <StepConfirm />;
  return <StepIntro />;
}
