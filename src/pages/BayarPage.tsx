import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const C = {
  bg:      'var(--mr-bg)',
  panel:   'var(--mr-panel)',
  text:    'var(--mr-text)',
  border:  'var(--mr-border)',
  border2: 'var(--mr-border2)',
  dim:     'var(--mr-dim)',
  dimmer:  'var(--mr-dimmer)',
  sidebar: 'var(--mr-sidebar)',
};
const G = { gold: 'var(--mr-gold)', up: 'var(--mr-up)', down: 'var(--mr-down)' };

interface PlanInfo {
  nama: string;
  harga_asli: number;
  diskon: number;
  key: string;
}

function getPlanFromConfig(config: any, planKey: string): PlanInfo | null {
  if (!config) return null;
  if (planKey === 'bulanan')  return { nama: config.plan1_nama, harga_asli: config.plan1_harga_asli, diskon: config.plan1_diskon, key: 'bulanan' };
  if (planKey === 'tahunan')  return { nama: config.plan2_nama, harga_asli: config.plan2_harga_asli, diskon: config.plan2_diskon, key: 'tahunan' };
  if (planKey === 'lifetime') return { nama: config.plan3_nama, harga_asli: config.plan3_harga_asli, diskon: config.plan3_diskon, key: 'lifetime' };
  return null;
}

export default function BayarPage() {
  const params  = new URLSearchParams(window.location.search);
  const planKey = params.get('plan') || 'bulanan';

  const [config,         setConfig]         = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);

  const [nama,       setNama]       = useState('');
  const [email,      setEmail]      = useState('');
  const [noHp,       setNoHp]       = useState('');
  const [metodePm,   setMetodePm]   = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [errMsg,     setErrMsg]     = useState('');

  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    async function load() {
      const [{ data: cfg }, { data: pm }] = await Promise.all([
        supabase.from('landing_preview_config').select('*').eq('id', 1).single(),
        supabase.from('payment_methods').select('*').eq('aktif', true).order('urutan', { ascending: true }),
      ]);
      if (cfg) setConfig(cfg);
      if (pm)  setPaymentMethods(pm);
      setLoading(false);
    }
    load();
  }, []);

  const plan = getPlanFromConfig(config, planKey);
  const fmt  = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const hargaDiskon = plan
    ? (plan.diskon > 0 ? Math.round(plan.harga_asli * (1 - plan.diskon / 100)) : plan.harga_asli)
    : 0;
  const hemat = plan ? plan.harga_asli - hargaDiskon : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg('');
    if (!nama.trim() || !email.trim() || !noHp.trim()) { setErrMsg('Semua field wajib diisi.'); return; }
    if (!metodePm) { setErrMsg('Pilih metode pembayaran.'); return; }
    if (!plan) { setErrMsg('Plan tidak valid.'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('orders').insert({
      member_id:      'guest',
      tier_member:    'visitor',
      nama_member:    nama.trim(),
      email_member:   email.trim(),
      catatan:        `WA: ${noHp.trim()} | Metode: ${metodePm}`,
      plan_type:      plan.key,
      diskon_applied: plan.diskon || null,
      status:         'pending',
    });
    setSubmitting(false);
    if (error) { setErrMsg('Gagal membuat order: ' + error.message); return; }
    setDone(true);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontFamily: 'monospace' }}>
      Memuat...
    </div>
  );

  if (done) return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"Geist",system-ui,sans-serif', WebkitFontSmoothing: 'antialiased', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, textAlign: 'center' as const }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Pesanan Diterima!</h2>
        <p style={{ color: C.dim, lineHeight: 1.6, marginBottom: 24 }}>
          Admin akan menghubungi kamu dalam 1×24 jam untuk konfirmasi pembayaran. Cek WhatsApp kamu ya.
        </p>
        <button onClick={() => window.location.href = '/'}
          style={{ fontFamily: 'monospace', padding: '12px 28px', background: G.gold, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>
          KEMBALI KE BERANDA
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"Geist",system-ui,sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => window.history.back()}
          style={{ background: 'none', border: `1px solid ${C.border2}`, color: C.dim, padding: '7px 14px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11 }}>
          ← Kembali
        </button>
        <span style={{ fontFamily: 'monospace', color: C.dimmer, fontSize: 11, letterSpacing: 0.6 }}>// CHECKOUT</span>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '32px 20px' : '48px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32 }}>

        <div>
          <div style={{ fontFamily: 'monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 12 }}>// RINGKASAN PESANAN</div>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: '20px 22px', marginBottom: 20 }}>
            {plan ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Plan {plan.nama}</div>
                {plan.diskon > 0 && (
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: C.dimmer, marginBottom: 4 }}>
                    <s>Rp {fmt(plan.harga_asli)}</s>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', color: G.gold, fontSize: 12 }}>Rp</span>
                  <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>{fmt(hargaDiskon)}</span>
                </div>
                {plan.diskon > 0 && (
                  <div style={{ fontFamily: 'monospace', color: G.up, fontSize: 11 }}>
                    Hemat Rp {fmt(hemat)} ({plan.diskon}%)
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: C.dim, fontSize: 13 }}>Plan tidak ditemukan.</div>
            )}
          </div>

          <div style={{ fontFamily: 'monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 12 }}>// METODE PEMBAYARAN</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {paymentMethods.length === 0 && (
              <div style={{ color: C.dim, fontSize: 12 }}>Belum ada metode pembayaran aktif.</div>
            )}
            {paymentMethods.map(pm => (
              <button key={pm.id} onClick={() => setMetodePm(pm.id)}
                style={{
                  background: metodePm === pm.id ? G.gold + '18' : C.panel,
                  border: `1px solid ${metodePm === pm.id ? G.gold : C.border}`,
                  color: C.text,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 2,
                }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{pm.nama_bank}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.dim }}>{pm.nomor_rek} · a.n. {pm.nama_rek}</span>
                {pm.catatan && <span style={{ fontSize: 11, color: C.dimmer }}>{pm.catatan}</span>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 12 }}>// DATA PEMESAN</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {([
              { label: 'Nama Lengkap', value: nama,  set: setNama,  type: 'text',  placeholder: 'Nama kamu' },
              { label: 'Email',        value: email, set: setEmail, type: 'email', placeholder: 'email@kamu.com' },
              { label: 'No. WhatsApp', value: noHp,  set: setNoHp,  type: 'tel',   placeholder: '08xxxxxxxxxx' },
            ] as { label: string; value: string; set: (v: string) => void; type: string; placeholder: string }[]).map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: 'monospace', color: C.dim, fontSize: 10, marginBottom: 5 }}>{f.label.toUpperCase()}</div>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  style={{ width: '100%', boxSizing: 'border-box' as const, background: C.panel, border: `1px solid ${C.border}`, color: C.text, padding: '11px 14px', fontSize: 13, fontFamily: '"Geist",system-ui,sans-serif', outline: 'none' }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = G.gold}
                  onBlur={e  => (e.target as HTMLInputElement).style.borderColor = C.border}
                />
              </div>
            ))}

            {errMsg && (
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: G.down, padding: '8px 12px', border: `1px solid ${G.down}33`, background: G.down + '0d' }}>
                {errMsg}
              </div>
            )}

            <button type="submit" disabled={submitting || !plan}
              style={{ marginTop: 8, fontFamily: 'monospace', padding: '14px 0', background: G.gold, color: '#fff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'MEMPROSES...' : `BAYAR SEKARANG — Rp ${fmt(hargaDiskon)}`}
            </button>

            <p style={{ fontFamily: 'monospace', fontSize: 10, color: C.dimmer, lineHeight: 1.5, margin: 0 }}>
              Admin akan menghubungi kamu via WhatsApp setelah pesanan masuk untuk instruksi pembayaran.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
