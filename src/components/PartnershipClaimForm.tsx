import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Upload, Loader2 } from 'lucide-react';

type Broker = 'HFM' | 'EXNESS';

interface FormData {
  nama_lengkap: string;
  email: string;
  whatsapp: string;
  broker: Broker | '';
  nomor_akun: string;
  screenshot: File | null;
}

export default function PartnershipClaimForm() {
  const [form, setForm] = useState<FormData>({
    nama_lengkap: '',
    email: '',
    whatsapp: '',
    broker: '',
    nomor_akun: '',
    screenshot: null,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm(prev => ({ ...prev, screenshot: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let screenshot_url: string | null = null;

      if (form.screenshot) {
        const fileExt = form.screenshot.name.split('.').pop();
        const fileName = `${Date.now()}_${form.whatsapp}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('partnership-screenshots')
          .upload(fileName, form.screenshot);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('partnership-screenshots')
          .getPublicUrl(fileName);
        screenshot_url = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('partnership_claims')
        .insert({
          nama_lengkap: form.nama_lengkap,
          email: form.email,
          whatsapp: form.whatsapp,
          broker: form.broker,
          nomor_akun: form.nomor_akun,
          screenshot_url,
        });

      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h3 className="text-white font-bold text-xl mb-2">Klaim Berhasil Dikirim!</h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto mb-4">
          Tim kami akan memverifikasi pendaftaran broker kamu dalam <span className="text-white font-semibold">1×24 jam</span>.
          Notifikasi aktivasi akan dikirim ke WhatsApp kamu.
        </p>
        <div className="inline-flex items-center gap-2 bg-[#111827] border border-gray-700/50 rounded-xl px-4 py-2">
          <span className="text-gray-500 text-sm">📱</span>
          <span className="text-white text-sm font-mono">{form.whatsapp}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-700/50 bg-[#111827] p-8 sm:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          📋 Langkah 2 dari 3
        </div>
        <h3 className="text-white font-bold text-xl mb-2">Sudah Daftar Broker? Klaim Akses Kamu</h3>
        <p className="text-gray-400 text-sm">
          Isi form di bawah sebagai bukti pendaftaran. Akses akan diaktifkan setelah verifikasi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Nama & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm block mb-2">
              Nama Lengkap <span className="text-yellow-400">*</span>
            </label>
            <input
              name="nama_lengkap"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={form.nama_lengkap}
              onChange={handleChange}
              required
              className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-2">
              Email <span className="text-yellow-400">*</span>
            </label>
            <input
              name="email"
              type="email"
              placeholder="email@contoh.com"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Row 2: WhatsApp & Broker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm block mb-2">
              Nomor WhatsApp <span className="text-yellow-400">*</span>
            </label>
            <input
              name="whatsapp"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={form.whatsapp}
              onChange={handleChange}
              required
              className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-2">
              Broker yang Didaftar <span className="text-yellow-400">*</span>
            </label>
            <select
              name="broker"
              value={form.broker}
              onChange={handleChange}
              required
              className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors text-sm"
            >
              <option value="">-- Pilih Broker --</option>
              <option value="HFM">HFM (Kode: 30520271)</option>
              <option value="EXNESS">EXNESS (Kode: a7tps7wodw)</option>
            </select>
          </div>
        </div>

        {/* Nomor Akun */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">
            Nomor Akun Broker <span className="text-yellow-400">*</span>
          </label>
          <input
            name="nomor_akun"
            type="text"
            placeholder="Nomor akun dari dashboard broker kamu"
            value={form.nomor_akun}
            onChange={handleChange}
            required
            className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors text-sm font-mono"
          />
          <p className="text-gray-600 text-xs mt-1.5">Cek di dashboard broker setelah berhasil daftar</p>
        </div>

        {/* Screenshot */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">
            Screenshot Bukti Pendaftaran
            <span className="ml-2 text-xs text-gray-600">(Opsional, tapi mempercepat verifikasi)</span>
          </label>
          <label className="flex items-center gap-3 w-full bg-[#0d1325] border border-dashed border-gray-600 hover:border-yellow-500/40 rounded-xl px-4 py-4 cursor-pointer transition-colors group">
            <Upload size={18} className="text-gray-500 group-hover:text-yellow-400 transition-colors flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {form.screenshot ? (
                <span className="text-yellow-400 text-sm font-medium truncate block">{form.screenshot.name}</span>
              ) : (
                <span className="text-gray-600 text-sm">Klik untuk upload gambar (JPG, PNG, dll)</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">⚠️ {error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#0a0f1e] font-bold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/20 text-sm"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Mengirim...
            </>
          ) : (
            '🚀 Kirim & Klaim Akses Gratis'
          )}
        </button>

        <p className="text-gray-600 text-xs text-center">
          Akses akan diaktifkan dalam 1×24 jam setelah verifikasi tim kami.
        </p>
      </form>
    </div>
  );
}
