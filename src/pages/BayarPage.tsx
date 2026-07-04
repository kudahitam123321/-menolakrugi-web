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

function generateMemberPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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
  const [errMsg, setErrMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        supabase.from('payment_methods').select('*').neq('aktif', false).order('urutan', { ascending: true }),
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
    if (!metodePm) { setErrMsg('Pilih metode pembayaran terlebih dahulu.'); return; }
    if (!plan) { setErrMsg('Plan tidak valid.'); return; }

    setSubmitting(true);

    const pm = paymentMethods.find(p => p.id === metodePm);
    const metodeInfo = pm?.jenis === 'qris'
      ? `QRIS (${pm.nama_bank})`
      : `Bank: ${pm?.nama_bank || metodePm} | Rek: ${pm?.nomor_rekening || ''}`;

    // Cek nama sudah terdaftar sebagai member atau belum
    const { data: existing } = await supabase
      .from('members').select('id').ilike('nama', nama.trim()).single();
    if (existing) {
      setErrMsg('Nama sudah terdaftar. Silakan login atau hubungi admin jika ini akun kamu.');
      setSubmitting(false);
      return;
    }

    // Buat akun member baru (belum aktif — nunggu verifikasi admin)
    const memberPassword = generateMemberPassword();
    const { data: newMember, error: memberErr } = await supabase.from('members').insert({
      nama:      nama.trim(),
      tier:      'SMC Trial',
      password:  memberPassword,
      role:      'member',
      is_active: false,
      is_advance: false,
    }).select('id').single();
    if (memberErr || !newMember) {
      setErrMsg('Gagal membuat akun: ' + (memberErr?.message || 'unknown error'));
      setSubmitting(false);
      return;
    }

    // Simpan order, dikaitkan ke member baru
    const { data: newOrder, error } = await supabase.from('orders').insert({
      member_id:      newMember.id,
      tier_member:    'SMC Trial',
      nama_member:    nama.trim(),
      email_member:   email.trim(),
      catatan:        `WA: ${noHp.trim()} | ${metodeInfo}`,
      plan_type:      plan.key,
      diskon_applied: plan.diskon || null,
      status:         'pending',
    }).select('id').single();
    if (error || !newOrder) {
      setErrMsg('Gagal menyimpan pesanan: ' + (error?.message || 'unknown error'));
      setSubmitting(false);
      return;
    }

    window.location.href = `/bayar/akun?order=${newOrder.id}`;
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontFamily: '"Geist Mono",monospace', fontSize: 13 }}>
      Memuat...
    </div>
  );

  const selectedPm = paymentMethods.find(pm => pm.id === metodePm);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"Geist",system-ui,sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* Topbar */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/')}
          style={{ background: 'none', border: `1px solid ${C.border2}`, color: C.dim, padding: '7px 16px', cursor: 'pointer', fontFamily: '"Geist Mono",monospace', fontSize: 11, borderRadius: 4, letterSpacing: 0.4 }}>
          ← Kembali
        </button>
        <span style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 11, letterSpacing: 0.8 }}>// PEMBAYARAN INDIKATOR</span>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: isMobile ? '28px 16px 48px' : '48px 24px 64px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 40, alignItems: 'start' }}>

        {/* ── Kolom kiri: ringkasan + metode ── */}
        <div>

          {/* Ringkasan order */}
          <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 1.2, marginBottom: 14 }}>// RINGKASAN PESANAN</div>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '22px 24px', marginBottom: 28 }}>
            {plan ? (
              <>
                <div style={{ fontFamily: '"Geist Mono",monospace', color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>INDIKATOR SMC · {plan.nama.toUpperCase()}</div>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, letterSpacing: -0.5 }}>Plan {plan.nama}</div>
                {plan.diskon > 0 && (
                  <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 12, color: C.dimmer, marginBottom: 6 }}>
                    <s>Rp {fmt(plan.harga_asli)}</s>
                    <span style={{ marginLeft: 8, color: G.up, background: G.up + '15', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>-{plan.diskon}%</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: plan.diskon > 0 ? 8 : 0 }}>
                  <span style={{ fontFamily: '"Geist Mono",monospace', color: G.gold, fontSize: 15 }}>Rp</span>
                  <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -2, lineHeight: 1, color: C.text }}>{fmt(hargaDiskon)}</span>
                </div>
                {plan.diskon > 0 && (
                  <div style={{ fontFamily: '"Geist Mono",monospace', color: G.up, fontSize: 11 }}>
                    Hemat Rp {fmt(hemat)}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: C.dim, fontSize: 13 }}>Plan tidak ditemukan.</div>
            )}
          </div>

          {/* Metode pembayaran */}
          <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 1.2, marginBottom: 14 }}>// PILIH METODE PEMBAYARAN</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {paymentMethods.length === 0 && (
              <div style={{ color: C.dim, fontSize: 13, padding: '16px 0' }}>Belum ada metode pembayaran aktif.</div>
            )}
            {paymentMethods.map(pm => {
              const selected = metodePm === pm.id;
              return (
                <button key={pm.id} onClick={() => setMetodePm(pm.id)}
                  style={{
                    background:  selected ? G.gold + '12' : C.panel,
                    border:      `1.5px solid ${selected ? G.gold : C.border}`,
                    borderRadius: 10,
                    color:       C.text,
                    padding:     '16px 20px',
                    cursor:      'pointer',
                    textAlign:   'left' as const,
                    display:     'flex',
                    alignItems:  'center',
                    gap:         16,
                    transition:  'border-color 0.15s, background 0.15s',
                    position:    'relative' as const,
                  }}>
                  {/* Radio dot */}
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? G.gold : C.border2}`, background: selected ? G.gold : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{pm.nama_bank}</div>
                    {pm.jenis === 'qris' ? (
                      <>
                        <img src={pm.qris_image_url} alt={`QRIS ${pm.nama_bank}`}
                          style={{ width: '100%', maxWidth: 280, height: 280, objectFit: 'contain', background: '#fff', borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 6 }} />
                        {pm.catatan && <div style={{ fontSize: 11, color: C.dimmer, marginTop: 4 }}>{pm.catatan}</div>}
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 18, fontWeight: 700, letterSpacing: 1.5, color: selected ? G.gold : C.text, marginBottom: 4 }}>
                          {pm.nomor_rekening}
                        </div>
                        <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 11, color: C.dim }}>a.n. {pm.nama_rekening}</div>
                        {pm.catatan && <div style={{ fontSize: 11, color: C.dimmer, marginTop: 4 }}>{pm.catatan}</div>}
                      </>
                    )}
                  </div>
                  {selected && (
                    <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 9, color: G.gold, background: G.gold + '18', padding: '3px 8px', borderRadius: 4, letterSpacing: 0.6 }}>DIPILIH</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Nomor rekening terpilih — copyable */}
          {selectedPm && (
            <div style={{ marginTop: 14, background: G.gold + '0d', border: `1px solid ${G.gold}33`, borderRadius: 8, padding: '14px 18px' }}>
              {selectedPm.jenis === 'qris' ? (
                <>
                  <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>SCAN QRIS BERIKUT</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{selectedPm.nama_bank}</div>
                  <img src={selectedPm.qris_image_url} alt={`QRIS ${selectedPm.nama_bank}`}
                    style={{ width: '100%', maxWidth: 280, height: 280, objectFit: 'contain', background: '#fff', borderRadius: 8, border: `1px solid ${C.border}` }} />
                </>
              ) : (
                <>
                  <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>TRANSFER KE</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{selectedPm.nama_bank}</div>
                  <div
                    onClick={() => navigator.clipboard?.writeText(selectedPm.nomor_rekening)}
                    title="Klik untuk salin"
                    style={{ fontFamily: '"Geist Mono",monospace', fontSize: 22, fontWeight: 700, letterSpacing: 2, color: G.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {selectedPm.nomor_rekening}
                    <span style={{ fontSize: 12, color: C.dim }}>⎘</span>
                  </div>
                  <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 11, color: C.dim, marginTop: 4 }}>a.n. {selectedPm.nama_rekening}</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Kolom kanan: form ── */}
        <div>
          <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 1.2, marginBottom: 14 }}>// DATA PEMESAN</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            {([
              { label: 'Nama Lengkap', value: nama,  set: setNama,  type: 'text',  placeholder: 'Nama lengkap kamu' },
              { label: 'Email',        value: email, set: setEmail, type: 'email', placeholder: 'email@kamu.com' },
              { label: 'No. WhatsApp', value: noHp,  set: setNoHp,  type: 'tel',   placeholder: '08xxxxxxxxxx' },
            ] as { label: string; value: string; set: (v: string) => void; type: string; placeholder: string }[]).map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dim, fontSize: 10, letterSpacing: 0.6, marginBottom: 6 }}>{f.label.toUpperCase()}</div>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  style={{ width: '100%', boxSizing: 'border-box' as const, background: C.panel, border: `1.5px solid ${C.border}`, color: C.text, padding: '12px 16px', fontSize: 14, fontFamily: '"Geist",system-ui,sans-serif', outline: 'none', borderRadius: 8, transition: 'border-color 0.15s' }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = G.gold}
                  onBlur={e  => (e.target as HTMLInputElement).style.borderColor = C.border}
                />
              </div>
            ))}

            {/* Info bayar */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', fontSize: 13, color: C.dim, lineHeight: 1.6 }}>
              Setelah mengisi form ini, kamu akan dapat akun member. Transfer sesuai nominal, lalu konfirmasi ke admin dari halaman berikutnya.
            </div>

            {errMsg && (
              <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 11, color: G.down, padding: '10px 14px', border: `1px solid ${G.down}44`, background: G.down + '0d', borderRadius: 6 }}>
                {errMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 4,
                fontFamily: '"Geist Mono",monospace',
                padding: '15px 0',
                background: G.gold,
                color: '#fff',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 0.8,
                borderRadius: 8,
              }}>
              {submitting ? 'MEMPROSES...' : 'LANJUTKAN & KONFIRMASI PEMBAYARAN →'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
