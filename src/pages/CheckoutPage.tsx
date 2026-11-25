// pages/CheckoutPage.tsx — Upgrade kelas untuk member yang sudah login (/checkout, /checkout?aktifkan=1).
// Dibuka dari tombol "NAIK TIER", "AKTIFKAN LAGI", dan "UPGRADE KE GOLD" di dashboard member.
// Harga dari usePricingEvent (ikut event promo seperti Black Friday); member bayar selisih dengan harga jual
// kelas lamanya (lib/upgradeKelas). Pilih kelas → order atas akun yang sudah ada → /payment?order=<id>.
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePricingEvent } from '../hooks';
import { hargaUpgrade, kodeUpgrade, tierIdDari } from '../lib/upgradeKelas';

const LP = {
  bg: 'var(--lp-bg)', surface: 'var(--lp-surface)', text: 'var(--lp-text)', muted: 'var(--lp-muted)', border: 'var(--lp-border)',
  primary: 'var(--lp-primary)', sans: '"Geist",system-ui,sans-serif', mono: '"Geist Mono",monospace',
};
const rp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');

interface MemberRow { id: string; nama: string; tier: string | null }

export default function CheckoutPage() {
  const aktifkan = new URLSearchParams(window.location.search).get('aktifkan') === '1';
  const { tiers, tiersAsli, event, loading: loadingHarga } = usePricingEvent();
  const [member, setMember] = useState<MemberRow | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [proses, setProses] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let sesi: { id?: string } | null = null;
    try { const raw = localStorage.getItem('mr_session'); sesi = raw ? JSON.parse(raw) : null; } catch { sesi = null; }
    if (!sesi?.id) { window.location.href = '/login'; return; }
    supabase.from('members').select('id, nama, tier').eq('id', sesi.id).single().then(({ data }) => {
      if (!data) { window.location.href = '/login'; return; }
      setMember(data as MemberRow);
      setLoadingMember(false);
    });
  }, []);

  const dariId = tierIdDari(member?.tier);
  const dariAsli = tiersAsli.find((t) => t.id === dariId) || null;
  const dariUrutan = dariAsli?.sort_order ?? 0;
  // Kelas di atas tier sekarang; tier yang sama hanya untuk "Aktifkan lagi" (mis. Trial bulanan habis).
  const pilihan = tiers.filter((t) => t.sort_order > dariUrutan || (aktifkan && t.id === dariId));

  async function pilih(tujuanId: string) {
    if (!member) return;
    setProses(tujuanId); setError('');
    const { data, error: err } = await supabase.from('orders').insert({
      product_id: null,
      member_id: member.id,
      nama_member: member.nama,
      email_member: '',
      tier_member: tujuanId,
      status: 'pending',
      kode_diskon: kodeUpgrade(dariId),
    }).select('id').single();
    if (err || !data) { setError('Gagal membuat pesanan: ' + (err?.message || 'coba lagi')); setProses(null); return; }
    window.location.href = `/payment?order=${data.id}`;
  }

  const loading = loadingHarga || loadingMember;
  return (
    <div className="mr-light-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ borderBottom: `1px solid ${LP.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: LP.surface }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: LP.text, fontWeight: 800, letterSpacing: 0.3, fontSize: 14 }}>
          <img src="/logo.png" alt="MR" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          MENOLAK RUGI
        </a>
        <a href="/member" style={{ fontSize: 13, color: LP.muted, textDecoration: 'none' }}>← Kembali ke dashboard</a>
      </div>

      {loading ? (
        <div style={{ padding: 80, textAlign: 'center' as const, color: LP.muted, fontFamily: LP.mono, fontSize: 13 }}>Memuat…</div>
      ) : (
        <section style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 16px 72px' }}>
          <div style={{ textAlign: 'center' as const, marginBottom: 28 }}>
            <div style={{ fontFamily: LP.mono, fontSize: 11, letterSpacing: 1, color: LP.muted }}>// {aktifkan ? 'AKTIFKAN LAGI' : 'UPGRADE KELAS'}</div>
            <h1 style={{ fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 800, letterSpacing: -1, margin: '12px 0 8px' }}>
              {aktifkan ? 'Aktifkan kembali kelasmu' : 'Naik ke kelas berikutnya'}
            </h1>
            <div style={{ color: LP.muted, fontSize: 15 }}>
              Halo {member?.nama}, kelas kamu sekarang: <b style={{ color: LP.text }}>{member?.tier || '-'}</b>
            </div>
            {dariAsli && dariAsli.id !== 'trial' && !aktifkan && (
              <div style={{ color: LP.muted, fontSize: 13, marginTop: 6 }}>Kamu cukup bayar selisihnya: harga kelas baru dikurangi {rp(dariAsli.price)} yang sudah kamu bayar untuk {dariAsli.tag}.</div>
            )}
          </div>

          {event && tiers.some((t) => t.promo_diskon) && (
            <a href="/black-friday" style={{ display: 'block', background: '#020617', color: '#fff', borderRadius: 12, padding: '12px 18px', marginBottom: 24, textDecoration: 'none', textAlign: 'center' as const, fontSize: 14, fontWeight: 600 }}>
              🖤 {event.nama}: harga kelas sedang diskon. Harga di bawah sudah termasuk diskonnya.
            </a>
          )}

          {pilihan.length === 0 ? (
            <div style={{ textAlign: 'center' as const, color: LP.muted, fontSize: 15, padding: 40, border: `1px solid ${LP.border}`, borderRadius: 16, background: LP.surface }}>
              Kamu sudah di kelas tertinggi. Ada pertanyaan? Hubungi admin lewat WhatsApp.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {pilihan.map((t) => {
                const { harga, potongan } = hargaUpgrade(t, dariAsli);
                const coret = t.original_price && t.original_price > t.price ? t.original_price : null;
                return (
                  <div key={t.id} data-upgrade-card={t.id} style={{ background: LP.surface, border: t.is_featured ? '2px solid #16a34a' : `1px solid ${LP.border}`, borderRadius: 16, padding: '24px 22px', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' as const }}>
                    {t.promo_diskon && <div style={{ alignSelf: 'flex-start', background: '#020617', color: '#fff', fontFamily: LP.mono, fontSize: 10, fontWeight: 700, letterSpacing: 0.6, padding: '4px 10px', borderRadius: 20, marginBottom: 10 }}>🖤 {t.badge?.toUpperCase()}</div>}
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: LP.muted, marginTop: 4, lineHeight: 1.5 }}>{t.pitch}</div>
                    <div style={{ marginTop: 16, fontFamily: LP.mono, fontSize: 13, color: LP.muted, display: 'grid', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Harga {t.tag}</span><span>{coret && <s style={{ marginRight: 6 }}>{rp(coret)}</s>}{rp(t.price)}</span></div>
                      {potongan > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}><span>Potongan kelas {dariAsli?.tag}</span><span>− {rp(potongan)}</span></div>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1px solid ${LP.border}`, marginTop: 10, paddingTop: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Kamu bayar</span>
                      <span style={{ fontFamily: LP.mono, fontSize: 24, fontWeight: 800 }}>{rp(harga)}</span>
                    </div>
                    <div style={{ display: 'grid', gap: 6, margin: '14px 0 0' }}>
                      {t.perks.slice(0, 4).map((p) => (
                        <div key={p} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: LP.muted }}><Check size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />{p}</div>
                      ))}
                    </div>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => pilih(t.id)} disabled={!!proses || harga <= 0}
                      style={{ marginTop: 18, background: t.is_featured ? '#16a34a' : LP.text, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 10, border: 'none', cursor: proses ? 'wait' : 'pointer', opacity: proses && proses !== t.id ? 0.5 : 1, fontFamily: LP.sans }}>
                      {proses === t.id ? 'Membuat pesanan…' : harga <= 0 ? 'Hubungi admin' : t.id === dariId ? `Aktifkan ${t.tag} →` : `Upgrade ke ${t.tag} →`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {error && <div style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' as const, marginTop: 16 }}>{error}</div>}
          <div style={{ fontSize: 12, color: LP.muted, textAlign: 'center' as const, marginTop: 18 }}>
            Setelah memilih, kamu lanjut ke halaman pembayaran. Kelas naik setelah admin memverifikasi pembayaranmu.
          </div>
        </section>
      )}
    </div>
  );
}
