// pages/PromoPage.tsx — Halaman event promo (/promo, /black-friday).
// Data: promo_event (id=1) + produk aktif. Harga lewat paketDariProduk(p, now, event) supaya sama
// persis dengan /pricing-indikator, /bayar, dan katalog dashboard.
import { useEffect, useState } from 'react';
import { usePromoEvent, useProdukDijual } from '../hooks';
import { diskonMaksEvent, eventBerjalan, fmtTanggalRilis, paketDariProduk, sisaWaktu, terbaruDari, type KeyPaket } from '../lib/indikatorV5';
import { RiwayatDataCard, TabelPerbandingan, versiDari } from '../components/IndikatorPerbandingan';

const LP = {
  bg: 'var(--lp-bg)', surface: 'var(--lp-surface)', text: 'var(--lp-text)', muted: 'var(--lp-muted)', border: 'var(--lp-border)',
  primary: 'var(--lp-primary)', sans: '"Geist",system-ui,sans-serif', mono: '"Geist Mono",monospace',
};
const rp = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');
const PAKET_NAMA: Record<KeyPaket, string> = { bulanan: 'Bulanan', tahunan: 'Tahunan', lifetime: 'Lifetime' };

const FAQ = [
  { q: 'Bagaimana cara membeli selama promo?', a: 'Klik "Beli sekarang" pada paket yang dipilih, isi form, lalu bayar lewat transfer bank atau QRIS. Kirim bukti bayar ke WhatsApp admin, akun dan indikator langsung kami aktifkan.' },
  { q: 'Kapan akun saya aktif?', a: 'Setelah bukti pembayaran kami terima dan cocok. Biasanya di hari yang sama.' },
  { q: 'Apa beda v4.2 dan v5?', a: 'v4.2 bebas pair & timeframe, tapi analisa top-down masih manual. v5 khusus XAUUSD M5: tinggal ikuti label entry yang muncul, lengkap dengan SL, TP, lot, dan alarm ke HP. Lihat tabel perbandingan di atas.' },
  { q: 'Saya sudah punya indikator lama, apakah bisa ikut?', a: 'Bisa. Harga promo berlaku untuk semua pembeli. Pemilik indikator sebelum v5 rilis juga bisa klaim v5 gratis dari dashboard (menu Produk) bila memenuhi syarat.' },
  { q: 'Setelah promo selesai harga jadi berapa?', a: 'Harga kembali ke harga normal di halaman Pricing Indikator. Harga promo hanya berlaku untuk pembayaran selama periode event.' },
];

function useDetik() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return now;
}

function Hitung({ target, now }: { target: Date; now: Date }) {
  const s = sisaWaktu(target, now) || { hari: 0, jam: 0, menit: 0, detik: 0 };
  const kotak = (n: number, l: string) => (
    <div key={l} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, padding: '10px 0', width: 64, textAlign: 'center' as const }}>
      <div style={{ fontFamily: LP.mono, fontSize: 26, fontWeight: 700, color: '#fff' }}>{String(n).padStart(2, '0')}</div>
      <div style={{ fontFamily: LP.mono, fontSize: 9, letterSpacing: 1, color: '#94A3B8' }}>{l}</div>
    </div>
  );
  return <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>{[kotak(s.hari, 'HARI'), kotak(s.jam, 'JAM'), kotak(s.menit, 'MNT'), kotak(s.detik, 'DTK')]}</div>;
}

export default function PromoPage() {
  const { event: ev, loading } = usePromoEvent();
  // Baris tanpa tanggal mulai/selesai dianggap belum ada event.
  const event = ev && ev.mulai && ev.selesai ? ev : null;
  const { produk, loading: loadingProduk } = useProdukDijual();
  const now = useDetik();

  const mulai = event?.mulai ? new Date(event.mulai) : null;
  const selesai = event?.selesai ? new Date(event.selesai) : null;
  const berjalan = eventBerjalan(event, now);
  const belum = !!(event && mulai && now < mulai);
  const nama = event?.judul || event?.nama || 'Promo';
  const maks = diskonMaksEvent(event, produk);

  // Kartu: setiap produk × paket yang mendapat diskon event; unggulan di depan.
  const kartu = event ? produk.flatMap((p) =>
    paketDariProduk(p, berjalan ? now : new Date(event.mulai), event)
      .filter((k) => Number(event.diskon?.[p.id]?.[k.key]) > 0)
      .map((k) => ({ p, k, unggulan: event.unggulan?.product_id === p.id && event.unggulan?.plan === k.key })),
  ).sort((a, b) => Number(b.unggulan) - Number(a.unggulan)) : [];

  const baru = produk.find((x) => x.id === terbaruDari(produk));
  const lama = produk.find((x) => x.id !== baru?.id);

  const hero = (judul: string, sub: string, target: Date | null, label: string) => (
    <section style={{ background: 'radial-gradient(ellipse at top, #1e293b 0%, #020617 70%)', color: '#fff', padding: '64px 20px 72px', textAlign: 'center' as const }}>
      <div style={{ fontFamily: LP.mono, fontSize: 11, letterSpacing: 2, color: '#4ade80', marginBottom: 14 }}>MENOLAK RUGI · EVENT</div>
      <h1 style={{ fontSize: 'clamp(36px, 7vw, 64px)', fontWeight: 800, margin: 0, letterSpacing: -1 }}>{judul}</h1>
      <div style={{ fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 700, marginTop: 12, color: '#E2E8F0' }}>{sub}</div>
      {event?.bonus && <div style={{ fontSize: 15, marginTop: 8, color: '#4ade80', fontWeight: 600 }}>+ {event.bonus}</div>}
      {target && <>
        <div style={{ fontSize: 13, color: '#94A3B8', margin: '26px 0 10px' }}>{label}</div>
        <Hitung target={target} now={now} />
      </>}
    </section>
  );

  const kosong = (judul: string, teks: string) => (
    <section style={{ maxWidth: 560, margin: '0 auto', padding: '48px 20px 72px', textAlign: 'center' as const }}>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{judul}</div>
      <div style={{ color: LP.muted, fontSize: 14, marginBottom: 20 }}>{teks}</div>
      <a href="/pricing-indikator" style={{ display: 'inline-block', background: LP.primary, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 20px', borderRadius: 10, textDecoration: 'none' }}>Lihat Harga Indikator →</a>
    </section>
  );

  let isi: JSX.Element;
  if (loading || loadingProduk) isi = <div style={{ padding: 80, textAlign: 'center' as const, color: LP.muted, fontFamily: LP.mono, fontSize: 13 }}>Memuat…</div>;
  else if (!event) isi = <>{hero('Promo', 'Belum ada promo yang berjalan', null, '')}{kosong('Belum ada promo saat ini', 'Pantau terus, promo berikutnya akan diumumkan di sini.')}</>;
  else if (selesai && now > selesai) isi = <>{hero(nama, 'Promo sudah berakhir', null, '')}{kosong('Promo sudah berakhir', 'Terima kasih! Harga indikator sekarang kembali normal.')}</>;
  else isi = (
    <>
      {hero(nama, event.subjudul || `Diskon hingga ${maks}%`, belum ? mulai : selesai, belum ? `Dimulai ${fmtTanggalRilis(mulai)} · dalam` : 'Penawaran berakhir dalam')}
      <section style={{ maxWidth: 1080, margin: '-40px auto 0', padding: '0 16px 56px', position: 'relative' as const }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {kartu.map(({ p, k, unggulan }) => {
            const harga = k.harga_asli * (1 - k.diskon / 100);
            return (
              <div key={p.id + k.key} data-promo-card={unggulan ? 'unggulan' : 'biasa'} style={{ background: LP.surface, border: unggulan ? '2px solid #16a34a' : `1px solid ${LP.border}`, borderRadius: 16, padding: '24px 22px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', position: 'relative' as const, display: 'flex', flexDirection: 'column' as const }}>
                {unggulan && <div style={{ position: 'absolute' as const, top: -12, left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: '#fff', fontFamily: LP.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap' as const }}>PENAWARAN TERBAIK</div>}
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.nama}</div>
                <div style={{ fontFamily: LP.mono, fontSize: 11, color: LP.muted, marginTop: 2 }}>{PAKET_NAMA[k.key]}</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: '#dc2626', margin: '14px 0 4px', letterSpacing: -1 }}>−{k.diskon}%</div>
                <div style={{ fontFamily: LP.mono, fontSize: 13, color: LP.muted, textDecoration: 'line-through' }}>{rp(k.harga_asli)}</div>
                <div style={{ fontFamily: LP.mono, fontSize: 26, fontWeight: 700 }}>{rp(harga)}</div>
                <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>Hemat {rp(k.harga_asli - harga)}</div>
                {event.bonus && <div style={{ fontSize: 12, color: LP.muted, marginTop: 8 }}>🎁 {event.bonus}</div>}
                <div style={{ flex: 1 }} />
                {belum
                  ? <div style={{ marginTop: 18, textAlign: 'center' as const, padding: '12px', borderRadius: 10, border: `1px solid ${LP.border}`, color: LP.muted, fontWeight: 700, fontSize: 13 }}>Segera hadir</div>
                  : <a href={`/bayar?produk=${p.id}&plan=${k.key}`} style={{ marginTop: 18, display: 'block', textAlign: 'center' as const, background: unggulan ? '#16a34a' : LP.text, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px', borderRadius: 10, textDecoration: 'none' }}>Beli sekarang →</a>}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: LP.muted, textAlign: 'center' as const, marginTop: 14 }}>
          Berlaku {fmtTanggalRilis(mulai)} – {fmtTanggalRilis(selesai)} (WIB). Harga promo berlaku untuk pembayaran selama periode event.
        </div>
      </section>
      <RiwayatDataCard />
      {baru && lama && <TabelPerbandingan namaLama={versiDari(lama.nama)} namaBaru={versiDari(baru.nama)} />}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '8px 16px 72px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center' as const, margin: '0 0 20px' }}>Pertanyaan yang sering diajukan</h2>
        {FAQ.map((f) => (
          <details key={f.q} style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
            <summary style={{ fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{f.q}</summary>
            <div style={{ fontSize: 14, color: LP.muted, lineHeight: 1.6, marginTop: 10 }}>{f.a}</div>
          </details>
        ))}
      </section>
    </>
  );

  return (
    <div className="mr-light-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ borderBottom: `1px solid ${LP.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, background: LP.surface }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: LP.text, fontWeight: 800, letterSpacing: 0.3, fontSize: 14 }}>
          <img src="/logo.png" alt="MR" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          MENOLAK RUGI
        </a>
      </div>
      {isi}
    </div>
  );
}
