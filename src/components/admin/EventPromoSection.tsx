// components/admin/EventPromoSection.tsx
// Admin → Produk → Preview Landing → "// EVENT PROMO".
// Atur event promo berbatas waktu (tabel promo_event, id=1) → halaman /promo, banner, dan
// harga di /pricing-indikator, /bayar, katalog dashboard (lihat paketDariProduk di lib/indikatorV5).
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { usePromoEvent, useProdukDijual } from '../../hooks';
import { eventBerjalan, paketDariProduk, type KeyPaket, type PromoEvent } from '../../lib/indikatorV5';

const inputStyle = {
  width: '100%', boxSizing: 'border-box' as const, background: '#111', border: '1px solid #2a2a2a', color: '#e7e5e4',
  padding: '8px 10px', fontSize: 12, fontFamily: 'monospace', outline: 'none',
};
const label = { fontFamily: 'monospace', color: '#555', fontSize: 10, marginBottom: 4 };

/** ISO → nilai input datetime-local dalam WIB ("2026-11-27T00:00"). */
function keInputWib(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 7 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}
/** Nilai input datetime-local (dibaca sebagai WIB) → ISO +07:00. */
function dariInputWib(v: string, detik = '00'): string | null {
  return v ? `${v}:${detik}+07:00` : null;
}

export default function EventPromoSection({ notify }: { notify: (text: string, type?: 'ok' | 'err') => void }) {
  const { event, loading, reload } = usePromoEvent({ semua: true });
  const { produk } = useProdukDijual();
  const [aktif, setAktif] = useState(false);
  const [nama, setNama] = useState('Black Friday');
  const [judul, setJudul] = useState('');
  const [subjudul, setSubjudul] = useState('');
  const [mulai, setMulai] = useState('');
  const [selesai, setSelesai] = useState('');
  const [bonus, setBonus] = useState('');
  const [diskon, setDiskon] = useState<PromoEvent['diskon']>({});
  const [unggulan, setUnggulan] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!event) return;
    setAktif(event.aktif); setNama(event.nama || ''); setJudul(event.judul || ''); setSubjudul(event.subjudul || '');
    setMulai(keInputWib(event.mulai)); setSelesai(keInputWib(event.selesai)); setBonus(event.bonus || '');
    setDiskon(event.diskon || {}); setUnggulan(event.unggulan ? `${event.unggulan.product_id}|${event.unggulan.plan}` : '');
  }, [event]);

  function ubahDiskon(pid: string, key: KeyPaket, v: string) {
    const n = Math.max(0, Math.min(99, Number(v) || 0));
    setDiskon((d) => ({ ...d, [pid]: { ...(d[pid] || {}), [key]: n } }));
  }

  async function simpan() {
    if (!nama.trim()) { notify('Nama event wajib diisi.', 'err'); return; }
    if (!mulai || !selesai) { notify('Isi tanggal mulai dan selesai.', 'err'); return; }
    if (new Date(dariInputWib(selesai, '59')!) <= new Date(dariInputWib(mulai)!)) { notify('Tanggal selesai harus setelah tanggal mulai.', 'err'); return; }
    const [pid, plan] = unggulan.split('|');
    setSaving(true);
    const { error } = await supabase.from('promo_event').upsert({
      id: 1, aktif, nama: nama.trim(), judul: judul.trim() || null, subjudul: subjudul.trim() || null,
      mulai: dariInputWib(mulai), selesai: dariInputWib(selesai, '59'), diskon, bonus: bonus.trim() || null,
      unggulan: pid ? { product_id: pid, plan } : null, updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { notify('Error: ' + error.message, 'err'); return; }
    notify('Event promo disimpan!');
    reload();
  }

  const status = !event ? 'BELUM DIBUAT' : !event.aktif ? 'NONAKTIF' : eventBerjalan(event) ? 'BERJALAN'
    : new Date() < new Date(event.mulai) ? 'TERJADWAL' : 'SELESAI';
  const warnaStatus: Record<string, string> = { BERJALAN: '#16a34a', TERJADWAL: '#3b82f6', SELESAI: '#888', NONAKTIF: '#eab308', 'BELUM DIBUAT': '#888' };

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', padding: '20px 24px', marginTop: 16 }}>
      <div style={{ fontFamily: 'monospace', color: '#16a34a', fontSize: 11, letterSpacing: 1, marginBottom: 14 }}>// EVENT PROMO</div>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', marginBottom: 16, lineHeight: 1.7 }}>
        {loading ? 'Memuat…' : <>
          Status: <span style={{ color: warnaStatus[status], fontWeight: 700 }}>{status}</span>
          {' · '}<a href="/promo" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Lihat halaman →</a><br />
          Selama BERJALAN, diskon di bawah menggantikan diskon produk di halaman promo, pricing, form bayar, dan dashboard. Waktu dalam WIB.
          {!event && <><br />Kalau simpan gagal, jalankan dulu supabase-promo-event-migration.sql di Supabase.</>}
        </>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div><div style={label}>Nama event (mis. Black Friday)</div><input value={nama} onChange={(e) => setNama(e.target.value)} style={inputStyle} /></div>
        <div><div style={label}>Judul halaman (opsional)</div><input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder={nama} style={inputStyle} /></div>
        <div><div style={label}>Subjudul (kosong = "Diskon hingga X%")</div><input value={subjudul} onChange={(e) => setSubjudul(e.target.value)} style={inputStyle} /></div>
        <div><div style={label}>Mulai (WIB)</div><input type="datetime-local" value={mulai} onChange={(e) => setMulai(e.target.value)} style={inputStyle} /></div>
        <div><div style={label}>Selesai (WIB)</div><input type="datetime-local" value={selesai} onChange={(e) => setSelesai(e.target.value)} style={inputStyle} /></div>
        <div><div style={label}>Bonus (opsional)</div><input value={bonus} onChange={(e) => setBonus(e.target.value)} style={inputStyle} /></div>
      </div>

      <div style={label}>Diskon event per paket (%) — 0 = pakai diskon produk biasa</div>
      <div style={{ border: '1px solid #1f1f1f', marginBottom: 14 }}>
        {produk.map((p) => (
          <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #1a1a1a', flexWrap: 'wrap' as const }}>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#e7e5e4', minWidth: 200, flex: 1 }}>{p.nama}</div>
            {paketDariProduk(p, new Date(0)).map((k) => (
              <label key={k.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: 11, color: '#888' }}>
                {k.nama}
                <input type="number" min="0" max="99" value={diskon[p.id]?.[k.key] ?? 0} onChange={(e) => ubahDiskon(p.id, k.key, e.target.value)}
                  style={{ ...inputStyle, width: 64 }} />
              </label>
            ))}
          </div>
        ))}
      </div>

      <div style={{ ...label, marginTop: 4 }}>Diskon khusus member kelas berbayar yang belum punya indikator (%) — hanya paket Lifetime, hanya di dashboard. 0 = mati</div>
      <input type="number" min="0" max="99" value={diskon._kelas?.lifetime ?? 0}
        onChange={(e) => ubahDiskon('_kelas', 'lifetime', e.target.value)} style={{ ...inputStyle, width: 120, marginBottom: 14 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={label}>Kartu "PENAWARAN TERBAIK"</div>
          <select value={unggulan} onChange={(e) => setUnggulan(e.target.value)} style={inputStyle}>
            <option value="">— tidak ada —</option>
            {produk.flatMap((p) => paketDariProduk(p, new Date(0)).map((k) => (
              <option key={p.id + k.key} value={`${p.id}|${k.key}`}>{p.nama} · {k.nama}</option>
            )))}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace', fontSize: 12, color: '#e7e5e4', marginTop: 16 }}>
          <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} /> Aktifkan event
        </label>
      </div>

      <button onClick={simpan} disabled={saving}
        style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>
        {saving ? 'Menyimpan...' : 'Simpan Event'}
      </button>
    </div>
  );
}
