// pages/SignupPage.tsx — Halaman signup / checkout Menolak Rugi (Direction A)
// URL: /signup?tier=gold  (tier optional, default ke gold)

import React, { useState } from 'react';

import { supabase } from '../lib/supabase';
import { MR, TIER_ACCENT } from '../lib/theme';
import { MRLogo, Ticker } from '../components/mr';
import { usePricing } from '../hooks';
import type { PricingTier } from '../types/mr.types';

const STEPS = ['AKUN', 'PEMBAYARAN', 'KONFIRMASI'];
const PAY_METHODS = [
  { id: 'qris',    l: 'QRIS',        s: 'Semua bank / e-wallet' },
  { id: 'va',      l: 'VIRTUAL ACC', s: 'BCA · BNI · Mandiri'  },
  { id: 'ewallet', l: 'E-WALLET',    s: 'GoPay · OVO · DANA'   },
  { id: 'card',    l: 'KARTU',       s: 'Visa · Master · JCB'  },
];

// ─── Input atom ──────────────────────────────────────────────────────────────

function AInput({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', border: `1px solid ${MR.borderHot}`, background: MR.panel, padding: '14px', fontSize: 14, color: MR.text, fontFamily: MR.sans, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => (e.target.style.borderColor = MR.gold)}
        onBlur={e => (e.target.style.borderColor = MR.borderHot)}
      />
    </div>
  );
}

// ─── Tier selector (right panel) ─────────────────────────────────────────────

function TierSelector({ tiers, selected, onSelect }: { tiers: PricingTier[]; selected: string; onSelect: (id: string) => void }) {
  const sel = tiers.find(p => p.id === selected) ?? tiers[0];
  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  return (
    <div style={{ background: MR.dark, padding: 32, overflow: 'auto', borderLeft: `1px solid ${MR.border}` }}>
      <div style={{ fontFamily: MR.mono, display: 'flex', justifyContent: 'space-between', color: MR.dim, fontSize: 11, letterSpacing: 0.6, marginBottom: 18 }}>
        <span>// ORDER TICKET</span>
        <span>#MR-{Date.now().toString().slice(-9, -3)}</span>
      </div>

      <div style={{ display: 'grid', gap: 8, marginBottom: 22 }}>
        {tiers.map(p => {
          const active = p.id === selected;
          return (
            <button key={p.id} onClick={() => onSelect(p.id)} style={{ textAlign: 'left', border: `1px solid ${active ? MR.gold : MR.border}`, background: active ? '#0e0c04' : MR.panel, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
              <div>
                <div style={{ fontFamily: MR.mono, fontSize: 11, color: active ? MR.gold : MR.dim, letterSpacing: 0.6 }}>{p.tag.toUpperCase()}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, color: MR.text }}>{p.name}</div>
              </div>
              <div style={{ fontFamily: MR.mono, fontSize: 14, color: active ? MR.text : MR.dim }}>Rp {fmt(p.price)}</div>
            </button>
          );
        })}
      </div>

      {sel && (
        <>
          <div style={{ borderTop: `1px solid ${MR.border}`, paddingTop: 18 }}>
            <div style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 14 }}>// YANG KAMU DAPAT</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {sel.perks.slice(0, 6).map(p => (
                <div key={p} style={{ display: 'flex', gap: 10, fontSize: 13, color: MR.muted, lineHeight: 1.45 }}>
                  <span style={{ color: MR.gold, flexShrink: 0, fontFamily: MR.mono }}>▸</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${MR.border}`, fontSize: 13, display: 'grid', gap: 8, fontFamily: MR.mono }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: MR.dim }}>
              <span>Subtotal</span>
              <span>Rp {fmt(sel.original_price ?? sel.price)}</span>
            </div>
            {sel.original_price && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: MR.up }}>
                <span>Diskon ({sel.badge?.toLowerCase()})</span>
                <span>− Rp {fmt(sel.original_price - sel.price)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: MR.dim }}>
              <span>Biaya admin</span><span>Rp 0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTop: `1px solid ${MR.border}`, fontSize: 18 }}>
              <span style={{ color: MR.text }}>TOTAL</span>
              <span style={{ color: MR.gold, fontWeight: 700 }}>Rp {fmt(sel.price)}</span>
            </div>
            {sel.note && <div style={{ color: MR.dimmer, fontSize: 10, marginTop: 6 }}>{sel.note}</div>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {

  const params = new URLSearchParams(window.location.search);
  const { tiers, loading }   = usePricing();

  const [step, setStep]       = useState(1);
  const [tier, setTier]       = useState(params.get('tier') ?? 'gold');
  const [method, setMethod]   = useState('qris');
  const [agree, setAgree]     = useState(false);
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({ nama: '', password: '' });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    if (!form.nama || !form.password || !tier) {
      setError('Nama, password, dan tier wajib diisi.');
      return;
    }
    if (!agree) { setError('Centang persetujuan dulu ya.'); return; }
    setSub(true); setError('');
    try {
      // Cek apakah nama sudah terdaftar
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .ilike('nama', form.nama.trim())
        .single();
      
      if (existing) throw new Error('Nama sudah terdaftar. Gunakan nama lain atau login.');

      // Insert member baru ke database
      const { error: memberErr } = await supabase.from('members').insert({
        nama:      form.nama.trim(),
        tier:      tier,
        password:  form.password,
        role:      'member',
        is_active: false,  // aktif setelah verifikasi pembayaran
      });
      if (memberErr) throw memberErr;

      // Redirect ke payment
      window.location.href = `/payment?tier=${tier}&name=${encodeURIComponent(form.nama)}&method=${method}`;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setSub(false);
    }
  }

  return (
    <div style={{ fontFamily: MR.sans, color: MR.text, background: MR.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Ticker />

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${MR.border}`, padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <MRLogo size={28} />
          <span style={{ fontWeight: 800, letterSpacing: -0.3 }}>MENOLAK RUGI</span>
          <span style={{ fontFamily: MR.mono, color: MR.dimmer, fontSize: 11, marginLeft: 12, paddingLeft: 12, borderLeft: `1px solid ${MR.border}` }}>CHECKOUT</span>
        </div>
        <div style={{ fontFamily: MR.mono, fontSize: 11, color: MR.dim }}>SSL · 256-BIT · AMAN</div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${MR.border}`, background: MR.dark }}>
        {STEPS.map((s, i) => {
          const idx = i + 1;
          const active = idx === step;
          const done   = idx < step;
          return (
            <div key={s} style={{ flex: 1, padding: '14px 24px', borderRight: i < 2 ? `1px solid ${MR.border}` : 0, display: 'flex', alignItems: 'center', gap: 12, color: active ? MR.text : MR.dim, background: active ? MR.panel : 'transparent', fontFamily: MR.mono }}>
              <span style={{ width: 22, height: 22, border: `1px solid ${active ? MR.gold : MR.borderHot}`, color: active ? MR.gold : done ? MR.up : MR.dim, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                {done ? '✓' : idx}
              </span>
              <span style={{ fontSize: 12, letterSpacing: 0.6 }}>{s}</span>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 460px', minHeight: 0 }}>
        {/* Form */}
        <div style={{ padding: '40px 56px', borderRight: `1px solid ${MR.border}`, overflow: 'auto' }}>
          <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.6 }}>// LANGKAH {step}/3</div>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1, margin: '10px 0 6px' }}>Daftar akun kamu.</h2>
          <p style={{ color: MR.dim, fontSize: 14, lineHeight: 1.55, marginBottom: 28 }}>Email dipakai untuk akses materi & login ke dashboard. Nomor WhatsApp untuk invite ke channel komunitas.</p>

          <div style={{ display: 'grid', gap: 20, maxWidth: 560 }}>
            <AInput label="NAMA LENGKAP" value={form.nama}     onChange={set('nama')}     placeholder="Nama sesuai KTP" />
            <AInput label="PASSWORD"     value={form.password}  onChange={set('password')} type="password" placeholder="Min. 8 karakter" />

            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: MR.dim, cursor: 'pointer' }}>
              <button onClick={() => setAgree(a => !a)} style={{ width: 16, height: 16, border: `1px solid ${MR.borderHot}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: MR.gold, fontSize: 11, marginTop: 2, background: agree ? '#0e0c04' : 'transparent', flexShrink: 0, cursor: 'pointer' }}>
                {agree ? '✓' : ''}
              </button>
              <span>Saya udah baca <u>Syarat & Ketentuan</u> dan paham <u>Disclaimer Risiko</u>. Trading bukan jaminan profit.</span>
            </label>

            {error && <div style={{ color: MR.down, fontSize: 13, fontFamily: MR.mono }}>⚠ {error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={handleSubmit} disabled={submitting} style={{ fontFamily: MR.mono, background: MR.gold, color: '#181000', padding: '16px 22px', fontSize: 13, fontWeight: 700, letterSpacing: 0.4, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'MEMPROSES...' : 'LANJUT KE PEMBAYARAN ▸'}
              </button>
              <button onClick={() => window.location.href = '/login'} style={{ fontFamily: MR.mono, padding: '16px 22px', fontSize: 13, color: MR.dim, letterSpacing: 0.4, background: 'none', border: 'none', cursor: 'pointer' }}>Sudah punya akun? Login</button>
            </div>
          </div>

          {/* Payment method preview */}
          <div style={{ marginTop: 40, borderTop: `1px dashed ${MR.borderHot}`, paddingTop: 28 }}>
            <div style={{ fontFamily: MR.mono, color: MR.dim, fontSize: 11, letterSpacing: 0.6, marginBottom: 12 }}>// METODE PEMBAYARAN — STEP 2</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {PAY_METHODS.map(m => {
                const active = method === m.id;
                return (
                  <button key={m.id} onClick={() => setMethod(m.id)} style={{ textAlign: 'left', border: `1px solid ${active ? MR.gold : MR.border}`, background: active ? '#0e0c04' : MR.panel, padding: 14, cursor: 'pointer', width: '100%' }}>
                    <div style={{ fontFamily: MR.mono, fontSize: 12, color: active ? MR.gold : MR.text, letterSpacing: 0.6 }}>{m.l}</div>
                    <div style={{ fontSize: 11, color: MR.dim, marginTop: 4 }}>{m.s}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order summary */}
        {!loading && (
          <TierSelector tiers={tiers} selected={tier} onSelect={setTier} />
        )}
      </div>
    </div>
  );
}
