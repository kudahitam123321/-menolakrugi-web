import { useState } from 'react';
import { ArrowLeft, Copy, CheckCircle, MessageCircle } from 'lucide-react';

const WA_NUMBER = '081242224939';
const BANK = {
  nama: 'BRI',
  rekening: '516601021807533',
  atas_nama: 'MUHAMAD FAUZAN AMIN',
};

export default function PaymentPage() {
  const params = new URLSearchParams(window.location.search);
  const kelas = params.get('kelas') || '-';
  const harga = params.get('harga') || '-';
  const hargaAsli = params.get('hargaAsli') || '';
  const diskon = params.get('diskon') || '';

  const [copied, setCopied] = useState(false);
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');

  function copyRekening() {
    navigator.clipboard.writeText(BANK.rekening);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleKonfirmasi() {
    if (!nama.trim() || !noHp.trim()) {
      alert('Mohon isi nama lengkap dan nomor HP terlebih dahulu.');
      return;
    }
    const diskonInfo = diskon ? `Kupon Diskon: ${diskon}\nHarga Asli: ${hargaAsli}\n` : '';
    const msg = encodeURIComponent(
      `Halo Admin Menolak Rugi, saya ingin konfirmasi pembayaran:\n\n` +
      `Nama: ${nama}\n` +
      `No HP: ${noHp}\n` +
      `Kelas: ${kelas}\n` +
      `${diskonInfo}` +
      `Total Bayar: ${harga}\n` +
      `Bank: ${BANK.nama} - ${BANK.rekening} a.n ${BANK.atas_nama}\n\n` +
      `Terlampir bukti transfer saya. Mohon segera dikonfirmasi. Terima kasih!`
    );
    window.open(`https://wa.me/62${WA_NUMBER.slice(1)}?text=${msg}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-md border-b border-yellow-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/checkout" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </a>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-[#0a0f1e] font-bold text-sm">MR</span>
            </div>
            <span className="text-white font-bold text-xl tracking-wide">MENOLAK RUGI</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-32 pb-24">
        <div className="text-center mb-10">
          <span className="text-yellow-500 text-sm font-semibold uppercase tracking-widest">Pembayaran</span>
          <h1 className="text-3xl font-bold text-white mt-3 mb-2">Detail Pembayaran</h1>
          <p className="text-gray-400 text-sm">Selesaikan pembayaran dan kirim bukti transfer via WhatsApp.</p>
        </div>

        {/* Ringkasan Pesanan */}
        <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Ringkasan Pesanan</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">{kelas}</span>
            <span className={diskon ? 'line-through text-gray-500' : 'text-yellow-400 font-bold'}>
              {hargaAsli || harga}
            </span>
          </div>
          {diskon && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 text-sm">Diskon ({diskon})</span>
              <span className="text-green-400 font-semibold">{harga}</span>
            </div>
          )}
          <div className="border-t border-gray-700/50 mt-4 pt-4 flex items-center justify-between">
            <span className="text-white font-semibold">Total</span>
            <span className="text-white font-bold text-xl">{harga}</span>
          </div>
        </div>

        {/* Detail Rekening */}
        <div className="bg-[#111827] border border-yellow-500/20 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-5">Transfer ke Rekening</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Bank</span>
              <span className="text-white font-bold text-lg">{BANK.nama}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Atas Nama</span>
              <span className="text-white font-semibold">{BANK.atas_nama}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400 text-sm">No. Rekening</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold font-mono text-lg">{BANK.rekening}</span>
                <button
                  onClick={copyRekening}
                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                  title="Salin nomor rekening"
                >
                  {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>
          {copied && <p className="text-green-400 text-xs mt-3 text-right">Nomor rekening disalin!</p>}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mt-5">
            <p className="text-yellow-400 text-sm font-medium">
              ⚠️ Pastikan transfer tepat sesuai nominal. Simpan bukti transfer untuk dikirim ke WhatsApp.
            </p>
          </div>
        </div>

        {/* Form Data Pembeli */}
        <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-5">Data Kamu</h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">Nomor HP / WhatsApp</label>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Tombol Konfirmasi */}
        <button
          onClick={handleKonfirmasi}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-[#0a0f1e] font-bold py-4 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-yellow-500/30 text-lg"
        >
          <MessageCircle size={20} />
          Konfirmasi Pembayaran via WA
        </button>
        <p className="text-gray-600 text-xs text-center mt-3">
          Kamu akan diarahkan ke WhatsApp dengan detail pesanan. Jangan lupa lampirkan bukti transfer.
        </p>
      </div>
    </div>
  );
}