// Ubah dashboard backtest milik user (BACKTEST FIX.html) menjadi public/backtest-indikator.html.
// Pakai: node scripts/make-backtest-page.mjs "D:/backtest/BACKTEST FIX.html" public/backtest-indikator.html src/lib/supabase.ts
import { readFileSync, writeFileSync } from 'node:fs';
const [src, out, sbFile] = process.argv.slice(2);
let h = readFileSync(src, 'utf8');
const key = readFileSync(sbFile, 'utf8').match(/eyJ[A-Za-z0-9._-]+/)[0];
const url = readFileSync(sbFile, 'utf8').match(/https:\/\/[a-z0-9]+\.supabase\.co/)[0];

let n = 0;
const rep = (from, to, label) => {
  const before = h;
  h = typeof from === 'string' ? h.split(from).join(to) : h.replace(from, to);
  if (h === before) throw new Error('tidak ketemu: ' + label);
  n++;
};

// <head>: favicon + CSS tambahan
rep('<title>PTMR Backtest — Menolak Rugi</title>', `<title>PTMR Backtest — Menolak Rugi</title>
<link rel="icon" href="/logo.png">`, 'title');
rep('</style>', `  .bt-main > *, .bt-page > * { min-width: 0; } /* kartu tabel tidak ikut melebar di HP */
  .bt-page { grid-template-columns: minmax(0, 1fr); }
  .bt-side a.bt-back { display: block; text-align: center; text-decoration: none; opacity: .9; }
  .bt-empty { text-align: center; padding: 56px 24px; }
  .bt-empty a { display: inline-block; margin-top: 12px; color: #fff; background: var(--bt-teal-d); border-radius: 8px; padding: 8px 14px; text-decoration: none; font-size: var(--cds-font-size-caption); }
</style>`, 'style end');

// Sidebar: hapus menu Script, tambah tautan kembali
rep(/\n\s*<button class="bt-nav" type="button" data-page="script">Script<\/button>/, '', 'nav script');
rep('<div class="bt-side-foot">', '<a class="bt-nav bt-back" href="/pricing-indikator">← Kembali ke Indikator</a>\n    <div class="bt-side-foot">', 'side foot');

// Banner data import
rep(/\n\s*<p class="bt-status bt-banner"[^\n]*<\/p>/, '', 'banner import');

// Data & Simulasi: hanya simulasi modal + risk. Script: dihapus.
rep(/<!-- ═══ DATA & SIMULASI ═══ -->[\s\S]*?<\/main>/, `<!-- ═══ DATA & SIMULASI ═══ -->
    <section class="bt-page" id="data" data-pg="data" hidden>
      <div class="bt-card bt-import bt-sim">
        <h2>Simulasi Modal &amp; Risk</h2>
        <p class="note">Hasil tiap trade diubah ke kelipatan risk, lalu dihitung ulang dengan modal awal dan risk per trade di bawah (risk dari equity berjalan). Semua halaman langsung ikut berubah.</p>
        <div class="bt-import-row">
          <label>Modal awal ($) <input class="bt-cap" type="number" min="1" step="100" aria-label="Modal awal"></label>
          <label>Risk per trade (%) <input class="bt-risk" type="number" min="0.01" step="0.1" aria-label="Risk per trade"></label>
          <button class="bt-simapply" type="button">Terapkan</button>
          <button class="bt-simreset" type="button" hidden>Kembali ke angka asli</button>
        </div>
        <p class="bt-err bt-simerr" hidden>Isi modal awal dan risk per trade dengan angka lebih dari 0.</p>
      </div>
    </section>
  </main>`, 'data+script sections');

// Footer "file HTML mandiri"
rep(/\n<p class="bt-foot">[^\n]*<\/p>/, '', 'footer');

// Hapus script terenkripsi & data tertanam
rep(/\n<script>window\.__BT_SCRIPT_ENC__=[^\n]*/, '', 'enc');
rep(/\n<script>window\.__BT_DATA__ = [^\n]*/, '', 'data');

// Risk asli dari database, bukan setting "Risk per Trade (%)" (kalkulator lot)
rep(/  const rk = s\.data\.find\(\(r\) => \/risk per trade\/i\.test\(r\.setting\)\);\n  return \{ capital: cap \? Number\(cap\.value\) : 10000, risk: rk \? Number\(rk\.value\) : 0\.5 \};/,
  `  return { capital: cap ? Number(cap.value) : 10000, risk: Number(window.__BT_RISK_ASLI__) || 0.5 };`, 'btSimDefaults');
rep("origRisk = val('.bt-orisk');", 'origRisk = Number(window.__BT_RISK_ASLI__) || 0.5;', 'btApplySim');

// Hapus kunci sandi Data & Simulasi + Script
rep(/\/\/ ── Kunci menu Data & Simulasi[\s\S]*?(?=\/\/ ── Titik awal grafik equity)/, '', 'locks');

// Script runtime ditunda sampai data dari database siap
const d3End = h.indexOf('</script>', h.indexOf('<script>// https://d3js.org')) + '</script>'.length;
const head = h.slice(0, d3End), tail = h.slice(d3End);
const deferred = tail.split('<script>').join('<script type="text/bt-deferred">');
const loader = `
<script>
(function () {
  var URL = '${url}/rest/v1/backtest_config?id=eq.1&select=data,risk_asli,tampil,judul';
  var KEY = '${key}';
  function boot() {
    document.querySelectorAll('script[type="text/bt-deferred"]').forEach(function (s) {
      var n = document.createElement('script'); n.text = s.text; document.body.appendChild(n);
    });
  }
  function kosong() {
    var m = document.querySelector('.bt-main');
    if (m) m.innerHTML = '<div class="bt-card bt-empty"><h2>Data backtest belum tersedia.</h2><p class="note">Silakan cek lagi nanti.</p><a href="/pricing-indikator">← Kembali ke Indikator</a></div>';
    document.querySelectorAll('.bt-nav[data-page]').forEach(function (b) { b.hidden = true; });
  }
  fetch(URL, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (rows) {
      var row = rows && rows[0];
      if (!row || !row.tampil || !row.data || !row.data.trades || !row.data.trades.length) return kosong();
      var st = (row.data.settings || []).slice();
      // Gauge impas mencari setting "take profit"; export 3 setup menamainya "TP Follow Trend (R)".
      if (!st.some(function (s) { return /take profit/i.test(s.setting); })) {
        var tp = st.find(function (s) { return /^tp follow trend/i.test(s.setting); });
        st.push({ setting: 'Take profit (R)', value: tp ? String(tp.value) : '3' });
      }
      window.__BT_DATA__ = { trades: row.data.trades, settings: st };
      window.__BT_RISK_ASLI__ = Number(row.risk_asli) || 0.5;
      if (row.judul) document.title = row.judul + ' — Menolak Rugi';
      boot();
    })
    .catch(kosong);
})();
</script>`;
h = head + loader + deferred;
writeFileSync(out, h);
console.log('ok', n, 'penggantian;', Math.round(h.length / 1024), 'KB');
