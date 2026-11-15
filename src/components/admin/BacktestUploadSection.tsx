// components/admin/BacktestUploadSection.tsx
// Admin → Produk → Preview Landing → "// DATA BACKTEST".
// Unggah export Strategy Tester TradingView → tabel backtest_config (id=1)
// → ditampilkan di /backtest-indikator.
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { useBacktestConfig } from '../../hooks';
import { bacaWorkbook, bacaCsv, riskAsliDefault, ringkasCek, type BtData } from '../../lib/backtest';

const inputStyle = {
  width: '100%', boxSizing: 'border-box' as const, background: '#111', border: '1px solid #2a2a2a', color: '#e7e5e4',
  padding: '8px 10px', fontSize: 12, fontFamily: 'monospace', outline: 'none',
};
const label = { fontFamily: 'monospace', color: '#555', fontSize: 10, marginBottom: 4 };
const fmtUsd = (v: number) => (v >= 0 ? '+' : '-') + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rentang = (d: BtData) => {
  const s = d.settings.find((r) => r.setting === 'Trading range');
  if (s) return s.value;
  return d.trades.length ? `${d.trades[0].entry_time} — ${d.trades[d.trades.length - 1].exit_time}` : '';
};

export default function BacktestUploadSection({ notify }: { notify: (text: string, type?: 'ok' | 'err') => void }) {
  const { config, loading, reload } = useBacktestConfig({ semua: true });
  const [judul, setJudul] = useState('PTMR Backtest');
  const [risk, setRisk] = useState('0.5');
  const [file, setFile] = useState<{ nama: string; data: BtData } | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) { setJudul(config.judul); setRisk(String(config.risk_asli)); }
  }, [config]);

  async function pilihFile(f: File | undefined) {
    setErr(''); setFile(null);
    if (!f) return;
    try {
      const data = /\.csv$/i.test(f.name) ? bacaCsv(await f.text()) : bacaWorkbook(XLSX.read(await f.arrayBuffer()));
      setFile({ nama: f.name, data });
      setRisk(String(riskAsliDefault(data.settings)));
    } catch {
      setErr('File tidak bisa dibaca. Pastikan ini export Strategy Tester (.xlsx) atau CSV List of Trades yang berisi kolom Trade #, Type, Date/Time dan Net P&L.');
    }
  }

  async function simpan() {
    if (!file) return;
    const r = Number(risk);
    if (!(r > 0)) { notify('Risk asli harus lebih dari 0.', 'err'); return; }
    setSaving(true);
    const { error } = await supabase.from('backtest_config').upsert({
      id: 1, judul: judul.trim() || 'PTMR Backtest', data: file.data, risk_asli: r,
      tampil: true, sumber_file: file.nama, updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { notify('Error: ' + error.message, 'err'); return; }
    notify('Data backtest disimpan!');
    setFile(null);
    reload();
  }

  async function ubahTampil(tampil: boolean) {
    const { error } = await supabase.from('backtest_config')
      .update({ tampil, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) { notify('Error: ' + error.message, 'err'); return; }
    notify(tampil ? 'Halaman backtest ditampilkan.' : 'Halaman backtest disembunyikan.');
    reload();
  }

  async function simpanPengaturan() {
    const r = Number(risk);
    if (!(r > 0)) { notify('Risk asli harus lebih dari 0.', 'err'); return; }
    const { error } = await supabase.from('backtest_config')
      .update({ judul: judul.trim() || 'PTMR Backtest', risk_asli: r, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) { notify('Error: ' + error.message, 'err'); return; }
    notify('Pengaturan backtest disimpan!');
    reload();
  }

  const cek = config ? ringkasCek(config.data) : null;
  const pratinjau = file ? ringkasCek(file.data) : null;

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1f1f1f', padding: '20px 24px', marginTop: 16 }}>
      <div style={{ fontFamily: 'monospace', color: '#16a34a', fontSize: 11, letterSpacing: 1, marginBottom: 14 }}>// DATA BACKTEST</div>

      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', marginBottom: 16, lineHeight: 1.7 }}>
        {loading ? 'Memuat…' : config && cek ? (
          <>
            <span style={{ color: '#e7e5e4' }}>{cek.total} trade</span> · net {fmtUsd(cek.net)} · {rentang(config.data)}<br />
            File: {config.sumber_file || '—'} · diperbarui {new Date(config.updated_at).toLocaleString('id-ID')} ·{' '}
            <span style={{ color: config.tampil ? '#16a34a' : '#eab308', fontWeight: 700 }}>{config.tampil ? 'TAMPIL' : 'TERSEMBUNYI'}</span>
            {' · '}<a href="/backtest-indikator" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Lihat halaman →</a>
          </>
        ) : 'Belum ada data backtest (atau tabel backtest_config belum dibuat).'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div>
          <div style={label}>Judul</div>
          <input value={judul} onChange={(e) => setJudul(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={label}>Risk asli di data (% per trade)</div>
          <input type="number" min="0.01" step="0.1" value={risk} onChange={(e) => setRisk(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={label}>File export TradingView (.xlsx / .csv)</div>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => pilihFile(e.target.files?.[0])} style={{ ...inputStyle, padding: '6px 10px' }} />
        </div>
      </div>

      {err && <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#ef4444', marginBottom: 12 }}>{err}</div>}
      {file && pratinjau && (
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#22c55e', marginBottom: 12 }}>
          Pratinjau {file.nama}: {pratinjau.total} trade · net {fmtUsd(pratinjau.net)} · {pratinjau.menang} menang · {rentang(file.data)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
        <button onClick={simpan} disabled={!file || saving}
          style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', cursor: file && !saving ? 'pointer' : 'not-allowed', opacity: file && !saving ? 1 : 0.4 }}>
          {saving ? 'Menyimpan...' : 'Simpan & Tampilkan'}
        </button>
        {config && (
          <>
            <button onClick={simpanPengaturan}
              style={{ fontFamily: 'monospace', fontSize: 12, padding: '10px 16px', background: 'transparent', color: '#e7e5e4', border: '1px solid #2a2a2a', cursor: 'pointer' }}>
              Simpan Judul & Risk
            </button>
            <button onClick={() => ubahTampil(!config.tampil)}
              style={{ fontFamily: 'monospace', fontSize: 12, padding: '10px 16px', background: 'transparent', color: config.tampil ? '#eab308' : '#16a34a', border: `1px solid ${config.tampil ? '#eab30866' : '#16a34a66'}`, cursor: 'pointer' }}>
              {config.tampil ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
