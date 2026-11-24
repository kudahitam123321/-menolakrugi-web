import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useProdukIndikator, usePromoEvent } from '../hooks';
import { fmtTanggalRilis, paketDariProduk, type ProdukJual } from '../lib/indikatorV5';

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

function tierFromPlan(planKey: string): string {
  if (planKey === 'bulanan')  return 'Indikator Bulanan';
  if (planKey === 'tahunan')  return 'Indikator Tahunan';
  if (planKey === 'lifetime') return 'Indikator Lifetime';
  return 'Indikator Bulanan';
}

function generateMemberPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function BayarPage() {
  const produkGlobal = useProdukIndikator();
  const { event: promoEvent } = usePromoEvent();
  const params  = new URLSearchParams(window.location.search);
  const planKey = params.get('plan') || 'bulanan';
  const produkParam = params.get('produk');
  const [produkDipilih, setProdukDipilih] = useState<ProdukJual | null>(null);

  const [config,         setConfig]         = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [productId,      setProductId]      = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);

  const [nama,       setNama]       = useState('');
  const [email,      setEmail]      = useState('');
  const [noHp,       setNoHp]       = useState('');
  const [metodePm,   setMetodePm]   = useState<string>('');
  const [errMsg, setErrMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [kodeDiskon, setKodeDiskon]         = useState('');
  const [kodeDiskonData, setKodeDiskonData] = useState<any | null>(null);
  const [kodeErr, setKodeErr]               = useState('');
  const [kodeLoading, setKodeLoading]       = useState(false);

  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  useEffect(() => {
    async function load() {
      const [{ data: cfg }, { data: pm }, { data: prod }, { data: dipilih }] = await Promise.all([
        supabase.from('landing_preview_config').select('*').eq('id', 1).single(),
        supabase.from('payment_methods').select('*').neq('aktif', false).order('urutan', { ascending: true }),
        supabase.from('products').select('id').eq('aktif', true).order('urutan', { ascending: true }).limit(1),
        produkParam
          ? supabase.from('products').select('*').eq('id', produkParam).eq('aktif', true).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (cfg) setConfig(cfg);
      if (pm)  setPaymentMethods(pm);
      // ?produk= dari halaman pricing (dua produk); tidak dikenal/nonaktif → perilaku lama.
      if (dipilih) { setProdukDipilih(dipilih as ProdukJual); setProductId((dipilih as ProdukJual).id); }
      else if (prod && prod[0]) setProductId(prod[0].id);
      setLoading(false);
    }
    load();
  }, []);

  const plan: PlanInfo | null = produkDipilih
    ? (paketDariProduk(produkDipilih, new Date(), promoEvent).find((x) => x.key === planKey) ?? null)
    : getPlanFromConfig(config, planKey);
  const preorder = produkDipilih ? produkDipilih.status === 'preorder' : produkGlobal.preorder;
  const tanggalRilis = produkDipilih
    ? (produkDipilih.tanggal_rilis ? new Date(produkDipilih.tanggal_rilis + 'T00:00:00+07:00') : null)
    : produkGlobal.tanggalRilis;
  const fmt  = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  const diskonAktif = Math.max(kodeDiskonData ? kodeDiskonData.diskon : 0, plan?.diskon || 0);
  const hargaDiskon = plan
    ? (diskonAktif > 0 ? Math.round(plan.harga_asli * (1 - diskonAktif / 100)) : plan.harga_asli)
    : 0;
  const hemat = plan ? plan.harga_asli - hargaDiskon : 0;

  async function cekKodeDiskon() {
    if (!kodeDiskon.trim()) return;
    setKodeLoading(true); setKodeErr(''); setKodeDiskonData(null);
    const { data, error } = await supabase.from('discount_codes')
      .select('*').eq('kode', kodeDiskon.toUpperCase().trim()).eq('aktif', true).single();
    setKodeLoading(false);
    if (error || !data) { setKodeErr('Kode tidak valid atau sudah tidak aktif.'); return; }
    if (data.berlaku_hingga && new Date(data.berlaku_hingga) < new Date()) { setKodeErr('Kode sudah kadaluarsa.'); return; }
    if (data.max_penggunaan && data.terpakai >= data.max_penggunaan) { setKodeErr('Kode sudah mencapai batas penggunaan.'); return; }
    setKodeDiskonData(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg('');
    if (!nama.trim() || !email.trim() || !noHp.trim()) { setErrMsg('Semua field wajib diisi.'); return; }
    if (!metodePm) { setErrMsg('Pilih metode pembayaran terlebih dahulu.'); return; }
    if (!plan) { setErrMsg('Plan tidak valid.'); return; }

    setSubmitting(true);

    // Validasi ulang kode diskon (bisa saja kadaluarsa/kuota habis sejak "Terapkan" diklik)
    let appliedKode = kodeDiskonData;
    if (appliedKode) {
      const { data: freshKode } = await supabase.from('discount_codes')
        .select('*').eq('id', appliedKode.id).eq('aktif', true).single();
      const stillValid = !!freshKode
        && !(freshKode.berlaku_hingga && new Date(freshKode.berlaku_hingga) < new Date())
        && !(freshKode.max_penggunaan && freshKode.terpakai >= freshKode.max_penggunaan);
      if (!stillValid) {
        setErrMsg('Kode diskon sudah tidak berlaku lagi. Hapus kode dan coba lagi.');
        setKodeDiskonData(null);
        setSubmitting(false);
        return;
      }
      appliedKode = freshKode;
    }
    const effectiveDiskon = Math.max(appliedKode ? appliedKode.diskon : 0, plan.diskon || 0);

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
      tier:      tierFromPlan(plan.key),
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
      product_id:     productId,
      tier_member:    tierFromPlan(plan.key),
      nama_member:    nama.trim(),
      email_member:   email.trim(),
      no_hp:          noHp.trim(),
      catatan:        `WA: ${noHp.trim()} | ${metodeInfo}`,
      plan_type:      plan.key,
      kode_diskon:    appliedKode?.kode || null,
      diskon_applied: effectiveDiskon || null,
      status:         'pending',
    }).select('id').single();
    if (error || !newOrder) {
      setErrMsg('Gagal menyimpan pesanan: ' + (error?.message || 'unknown error'));
      setSubmitting(false);
      return;
    }
    if (appliedKode) {
      // Update bersyarat (compare-and-swap sederhana): hanya berhasil kalau
      // terpakai belum berubah sejak kita baca ulang di atas. Mengurangi risiko
      // dua submit bersamaan menaikkan angka yang sama. Bukan jaminan atomik
      // penuh (itu perlu RPC Postgres) — cukup untuk mengurangi overcounting
      // tanpa menambah migrasi skema baru.
      await supabase.from('discount_codes')
        .update({ terpakai: appliedKode.terpakai + 1 })
        .eq('id', appliedKode.id)
        .eq('terpakai', appliedKode.terpakai);
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

      <div style={{ maxWidth: 880, margin: '0 auto', padding: isMobile ? '28px 16px 48px' : '48px 24px 64px', display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: isMobile ? 24 : 40, alignItems: 'start' }}>

        {/* ── Kolom kiri: ringkasan + metode ── */}
        <div>

          {/* Ringkasan order */}
          <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 1.2, marginBottom: 14 }}>// RINGKASAN PESANAN</div>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '22px 24px', marginBottom: 28 }}>
            {plan ? (
              <>
                {preorder && (
                  <div style={{ display: 'inline-block', fontFamily: '"Geist Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: '#d97706', border: '1px solid #d9770666', background: '#d977061a', padding: '3px 9px', borderRadius: 4, marginBottom: 10 }}>
                    PRE-ORDER · RILIS {fmtTanggalRilis(tanggalRilis).toUpperCase()}
                  </div>
                )}
                <div style={{ fontFamily: '"Geist Mono",monospace', color: G.gold, fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>{(produkDipilih?.nama || 'INDIKATOR SMC').toUpperCase()} · {plan.nama.toUpperCase()}</div>
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, letterSpacing: -0.5 }}>Plan {plan.nama}</div>
                {diskonAktif > 0 && (
                  <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 12, color: C.dimmer, marginBottom: 6 }}>
                    <s>Rp {fmt(plan.harga_asli)}</s>
                    <span style={{ marginLeft: 8, color: G.up, background: G.up + '15', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>-{diskonAktif}%</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: diskonAktif > 0 ? 8 : 0 }}>
                  <span style={{ fontFamily: '"Geist Mono",monospace', color: G.gold, fontSize: 15 }}>Rp</span>
                  <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -2, lineHeight: 1, color: C.text }}>{fmt(hargaDiskon)}</span>
                </div>
                {diskonAktif > 0 && (
                  <div style={{ fontFamily: '"Geist Mono",monospace', color: G.up, fontSize: 11 }}>
                    Hemat Rp {fmt(hemat)}
                  </div>
                )}
                {preorder && (
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 10, lineHeight: 1.5 }}>
                    Link v4.2 dikirim setelah verifikasi, link v5 saat rilis.
                  </div>
                )}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dim, fontSize: 10, letterSpacing: 0.6, marginBottom: 8 }}>PUNYA KODE KUPON? (OPSIONAL)</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={kodeDiskon}
                      onChange={e => { setKodeDiskon(e.target.value.toUpperCase()); setKodeDiskonData(null); setKodeErr(''); }}
                      onKeyDown={e => { if (e.key === 'Enter') cekKodeDiskon(); }}
                      placeholder="MASUKKAN KODE"
                      style={{ flex: 1, minWidth: 0, background: C.bg, border: `1.5px solid ${kodeDiskonData ? G.up : kodeErr ? G.down : C.border}`, color: C.text, padding: '10px 14px', fontSize: 13, fontFamily: '"Geist Mono",monospace', outline: 'none', borderRadius: 8, letterSpacing: 1 }} />
                    <button
                      onClick={cekKodeDiskon}
                      disabled={kodeLoading || !kodeDiskon.trim()}
                      style={{ padding: '10px 18px', fontFamily: '"Geist Mono",monospace', fontSize: 12, fontWeight: 700, background: 'transparent', color: G.gold, border: `1px solid ${G.gold}`, borderRadius: 8, cursor: kodeLoading || !kodeDiskon.trim() ? 'not-allowed' : 'pointer', opacity: !kodeDiskon.trim() ? 0.4 : 1, whiteSpace: 'nowrap' as const }}>
                      {kodeLoading ? '...' : 'Terapkan'}
                    </button>
                  </div>
                  {kodeDiskonData && (
                    <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 11, color: G.up, marginTop: 6 }}>
                      ✓ Kode valid — diskon {kodeDiskonData.diskon}% diterapkan
                    </div>
                  )}
                  {kodeErr && (
                    <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 11, color: G.down, marginTop: 6 }}>
                      {kodeErr}
                    </div>
                  )}
                </div>
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{pm.nama_bank}</div>
                    {pm.jenis === 'qris' ? (
                      <>
                        {!selected && <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 11, color: C.dim }}>Klik untuk lihat QR code</div>}
                        {pm.catatan && <div style={{ fontSize: 11, color: C.dimmer, marginTop: 4 }}>{pm.catatan}</div>}
                      </>
                    ) : (
                      <>
                        <div style={{ fontFamily: '"Geist Mono",monospace', fontSize: 18, fontWeight: 700, letterSpacing: 1.5, color: selected ? G.gold : C.text, marginBottom: 4, overflowWrap: 'anywhere' as const }}>
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
                    style={{ width: '100%', maxWidth: 320, height: 320, objectFit: 'contain', background: '#fff', borderRadius: 8, border: `1px solid ${C.border}` }} />
                </>
              ) : (
                <>
                  <div style={{ fontFamily: '"Geist Mono",monospace', color: C.dimmer, fontSize: 10, letterSpacing: 0.8, marginBottom: 8 }}>TRANSFER KE</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{selectedPm.nama_bank}</div>
                  <div
                    onClick={() => navigator.clipboard?.writeText(selectedPm.nomor_rekening)}
                    title="Klik untuk salin"
                    style={{ fontFamily: '"Geist Mono",monospace', fontSize: 22, fontWeight: 700, letterSpacing: 2, color: G.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ minWidth: 0, overflowWrap: 'anywhere' as const }}>{selectedPm.nomor_rekening}</span>
                    <span style={{ fontSize: 12, color: C.dim, flexShrink: 0 }}>⎘</span>
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
