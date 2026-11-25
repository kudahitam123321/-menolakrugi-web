// pages/PanduanPage.tsx — Pusat Panduan (/panduan). Isi dari lib/panduan.ts.
// Tiap topik punya anchor (#login, #klaim-v5, …) supaya admin bisa kirim link langsung ke bagian tertentu.
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, GraduationCap, KeyRound, Lightbulb, Link2, LineChart, Search, Users, MessageCircle } from 'lucide-react';
import { GRUP, TOPIK, cariTopik, type BlokPanduan, type GrupPanduan } from '../lib/panduan';
import { WA_URL } from '../constants';

const LP = {
  bg: 'var(--lp-bg)', surface: 'var(--lp-surface)', text: 'var(--lp-text)', muted: 'var(--lp-muted)', border: 'var(--lp-border)',
  primary: 'var(--lp-primary)', sans: '"Geist",system-ui,sans-serif', mono: '"Geist Mono",monospace',
};
const IKON: Record<GrupPanduan, typeof KeyRound> = { akun: KeyRound, kelas: GraduationCap, indikator: LineChart, fitur: Users };

function useLebar() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 899px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)');
    const h = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', h); return () => mq.removeEventListener('change', h);
  }, []);
  return mobile;
}

function Blok({ b }: { b: BlokPanduan }) {
  const subjudul = (t?: string) => t && <div style={{ fontWeight: 700, fontSize: 14, margin: '18px 0 10px' }}>{t}</div>;
  if (b.jenis === 'teks') return <p style={{ fontSize: 14.5, lineHeight: 1.65, color: LP.muted, margin: '12px 0' }}>{b.isi}</p>;
  if (b.jenis === 'langkah') return (
    <div>
      {subjudul(b.judul)}
      <ol style={{ listStyle: 'none', padding: 0, margin: '10px 0', display: 'grid', gap: 10 }}>
        {b.isi.map((s, i) => (
          <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 12, background: '#16a34a', color: '#fff', fontFamily: LP.mono, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
            <span style={{ fontSize: 14.5, lineHeight: 1.6 }}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
  if (b.jenis === 'poin') return (
    <div>
      {subjudul(b.judul)}
      <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0', display: 'grid', gap: 8 }}>
        {b.isi.map((s, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14.5, lineHeight: 1.55 }}>
            <Check size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 3 }} />{s}
          </li>
        ))}
      </ul>
    </div>
  );
  if (b.jenis === 'tabel') return (
    <div style={{ overflowX: 'auto' as const, margin: '14px 0', border: `1px solid ${LP.border}`, borderRadius: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13.5, minWidth: 480 }}>
        <thead><tr>{b.kolom.map((k) => <th key={k} style={{ textAlign: 'left' as const, padding: '10px 12px', background: 'rgba(22,163,74,.07)', fontWeight: 700, borderBottom: `1px solid ${LP.border}` }}>{k}</th>)}</tr></thead>
        <tbody>{b.baris.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: '10px 12px', borderBottom: i < b.baris.length - 1 ? `1px solid ${LP.border}` : 'none', fontWeight: j === 0 ? 600 : 400, fontFamily: /Rp|→/.test(c) && j > 0 ? LP.mono : LP.sans, fontSize: /Rp/.test(c) ? 12.5 : 13.5 }}>{c}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
  const tips = b.jenis === 'tips';
  const Ikon = tips ? Lightbulb : AlertTriangle;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '14px 0', padding: '12px 14px', borderRadius: 10, background: tips ? '#ecfdf5' : '#fffbeb', border: `1px solid ${tips ? '#a7f3d0' : '#fde68a'}`, color: tips ? '#065f46' : '#78350f', fontSize: 13.5, lineHeight: 1.55 }}>
      <Ikon size={17} style={{ flexShrink: 0, marginTop: 1 }} />{b.isi}
    </div>
  );
}

export default function PanduanPage() {
  const mobile = useLebar();
  const [q, setQ] = useState('');
  const [aktif, setAktif] = useState<string>(TOPIK[0].id);
  const [disalin, setDisalin] = useState('');
  const hasil = useMemo(() => cariTopik(TOPIK, q), [q]);

  // Buka langsung ke #topik saat link dibagikan.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, []);

  // Sorot topik yang sedang dibaca di daftar isi.
  useEffect(() => {
    const io = new IntersectionObserver((es) => {
      const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (v) setAktif(v.target.id);
    }, { rootMargin: '-80px 0px -60% 0px' });
    hasil.forEach((t) => { const el = document.getElementById(t.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [hasil]);

  function salinLink(id: string) {
    const url = `${window.location.origin}/panduan#${id}`;
    try { navigator.clipboard.writeText(url); } catch { /* abaikan */ }
    setDisalin(id); setTimeout(() => setDisalin(''), 1800);
  }
  const ke = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="mr-light-v2" style={{ fontFamily: LP.sans, color: LP.text, background: LP.bg, minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ borderBottom: `1px solid ${LP.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: LP.surface, position: 'sticky' as const, top: 0, zIndex: 10 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: LP.text, fontWeight: 800, letterSpacing: 0.3, fontSize: 14 }}>
          <img src="/logo.png" alt="MR" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          MENOLAK RUGI
        </a>
        <a href="/login" style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#16a34a', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>Masuk</a>
      </div>

      <section style={{ background: 'radial-gradient(ellipse at top, #14532d 0%, #020617 75%)', color: '#fff', padding: mobile ? '44px 16px 40px' : '64px 20px 56px', textAlign: 'center' as const }}>
        <div style={{ fontFamily: LP.mono, fontSize: 11, letterSpacing: 2, color: '#4ade80', marginBottom: 12 }}>PUSAT PANDUAN</div>
        <h1 style={{ fontSize: mobile ? 30 : 44, fontWeight: 800, margin: 0, letterSpacing: -1 }}>Ada yang bisa kami bantu?</h1>
        <p style={{ color: '#cbd5e1', fontSize: 15, margin: '10px auto 24px', maxWidth: 520 }}>Panduan langkah demi langkah untuk member kelas dan pembeli indikator.</p>
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' as const }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute' as const, left: 16, top: '50%', transform: 'translateY(-50%)' }} />
          <input data-panduan-cari value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari: lupa password, upgrade, klaim v5…"
            style={{ width: '100%', boxSizing: 'border-box' as const, padding: '15px 16px 15px 46px', fontSize: 15, borderRadius: 12, border: 'none', outline: 'none', fontFamily: LP.sans, color: '#0f172a', boxShadow: '0 10px 30px rgba(0,0,0,.25)' }} />
        </div>
      </section>

      {!q && (
        <section style={{ maxWidth: 1120, margin: mobile ? '-22px auto 0' : '-28px auto 0', padding: '0 16px', position: 'relative' as const }}>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
            {GRUP.map((g) => {
              const Ikon = IKON[g.id];
              const pertama = TOPIK.find((t) => t.grup === g.id)!;
              return (
                <button key={g.id} onClick={() => ke(pertama.id)} style={{ textAlign: 'left' as const, background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 14, padding: mobile ? '14px' : '18px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,.06)', fontFamily: LP.sans, color: LP.text }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><Ikon size={18} color="#16a34a" /></div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{g.nama}</div>
                  <div style={{ fontSize: 12.5, color: LP.muted, marginTop: 2 }}>{g.ket}</div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: mobile ? '28px 16px 48px' : '40px 16px 64px', display: 'grid', gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : '240px minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
        {!mobile && (
          <nav style={{ position: 'sticky' as const, top: 80 }}>
            {GRUP.map((g) => {
              const isi = hasil.filter((t) => t.grup === g.id);
              if (!isi.length) return null;
              return (
                <div key={g.id} style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: LP.mono, fontSize: 10.5, letterSpacing: 1, color: LP.muted, marginBottom: 6 }}>{g.nama.toUpperCase()}</div>
                  {isi.map((t) => (
                    <a key={t.id} href={`#${t.id}`} onClick={(e) => { e.preventDefault(); ke(t.id); history.replaceState(null, '', `#${t.id}`); }}
                      style={{ display: 'block', fontSize: 13.5, padding: '6px 10px', borderRadius: 8, textDecoration: 'none', color: aktif === t.id ? '#15803d' : LP.text, background: aktif === t.id ? '#dcfce7' : 'transparent', fontWeight: aktif === t.id ? 700 : 500, borderLeft: `2px solid ${aktif === t.id ? '#16a34a' : 'transparent'}` }}>
                      {t.judul}
                    </a>
                  ))}
                </div>
              );
            })}
          </nav>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, minWidth: 0 }}>
          {q && <div style={{ fontSize: 14, color: LP.muted }}>{hasil.length} panduan cocok dengan "{q}" · <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 700, cursor: 'pointer', fontSize: 14, padding: 0 }}>hapus pencarian</button></div>}
          {hasil.length === 0 && (
            <div style={{ textAlign: 'center' as const, padding: 40, border: `1px dashed ${LP.border}`, borderRadius: 14, color: LP.muted, fontSize: 14 }}>
              Belum ada panduan untuk "{q}". Tanyakan langsung ke admin lewat WhatsApp.
            </div>
          )}
          {hasil.map((t) => {
            const Ikon = IKON[t.grup];
            return (
              <article key={t.id} id={t.id} data-panduan-topik={t.id} style={{ background: LP.surface, border: `1px solid ${LP.border}`, borderRadius: 16, padding: mobile ? '20px 18px' : '26px 28px', scrollMarginTop: 80 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: LP.mono, fontSize: 11, letterSpacing: 1, color: '#16a34a' }}>
                    <Ikon size={14} />{GRUP.find((g) => g.id === t.grup)!.nama.toUpperCase()}
                  </div>
                  <button onClick={() => salinLink(t.id)} title="Salin link panduan ini" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${LP.border}`, borderRadius: 8, padding: '5px 9px', fontSize: 12, color: LP.muted, cursor: 'pointer', fontFamily: LP.sans }}>
                    <Link2 size={13} />{disalin === t.id ? 'Tersalin' : 'Salin link'}
                  </button>
                </div>
                <h2 style={{ fontSize: mobile ? 21 : 24, fontWeight: 800, margin: '8px 0 4px', letterSpacing: -0.4 }}>{t.judul}</h2>
                <p style={{ fontSize: 15, color: LP.muted, margin: '0 0 6px' }}>{t.ringkas}</p>
                {t.blok.map((b, i) => <Blok key={i} b={b} />)}
              </article>
            );
          })}

          <div style={{ display: 'flex', flexDirection: mobile ? 'column' as const : 'row' as const, alignItems: mobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 14, background: '#020617', color: '#fff', borderRadius: 16, padding: '22px 24px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Masih bingung?</div>
              <div style={{ color: '#cbd5e1', fontSize: 14, marginTop: 4 }}>Chat admin, biasanya dibalas di hari yang sama.</div>
            </div>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 18px', borderRadius: 10, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
              <MessageCircle size={17} />Chat admin di WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
