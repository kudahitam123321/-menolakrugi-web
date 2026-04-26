import { useState } from 'react';
import { ArrowLeft, LogIn, Eye, EyeOff, Lock, Shield, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TIERS = ['SMC Trial', 'SMC Bronze', 'SMC Gold Mentorship', 'SMC Platinum 1 on 1'];

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default function LoginPage() {
  const [mode, setMode] = useState<'member' | 'admin' | 'forgot'>('member');

  // Member login
  const [nama, setNama] = useState('');
  const [tier, setTier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Admin login
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Lupa password
  const [forgotNama, setForgotNama] = useState('');
  const [forgotTier, setForgotTier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotDone, setForgotDone] = useState(false);
  const [forgotNotFound, setForgotNotFound] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleMemberLogin() {
    if (!nama.trim() || !tier || !password.trim()) { setError('Semua field wajib diisi.'); return; }
    setLoading(true); setError('');
    try {
      const { data: member } = await supabase
        .from('members').select('*').ilike('nama', nama.trim()).eq('tier', tier).single();
      if (!member) { setError('Nama atau tier tidak ditemukan.'); setLoading(false); return; }
      if (member.password !== password) { setError('Password salah.'); setLoading(false); return; }
      if (!member.is_active) { setError('Akun kamu tidak aktif. Hubungi admin.'); setLoading(false); return; }
      const token = generateToken();
      await supabase.from('members').update({ session_token: token }).eq('id', member.id);
      localStorage.setItem('mr_session', JSON.stringify({ token, member_id: member.id, nama: member.nama, tier: member.tier }));
      window.location.href = '/member';
    } catch { setError('Terjadi kesalahan. Coba lagi.'); }
    setLoading(false);
  }

  async function handleAdminLogin() {
    if (!adminUsername.trim() || !adminPass.trim()) { setError('Username dan password wajib diisi.'); return; }
    setLoading(true); setError('');
    const { data: admin } = await supabase
      .from('admins').select('*').eq('username', adminUsername.trim().toLowerCase()).single();
    if (!admin || admin.password !== adminPass) {
      setError('Username atau password salah.'); setLoading(false); return;
    }
    localStorage.setItem('mr_admin', JSON.stringify({ id: admin.id, username: admin.username, role: admin.role }));
    window.location.href = '/admin';
    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!forgotNama.trim() || !forgotTier) { setError('Nama lengkap dan tier wajib diisi.'); return; }
    setLoading(true); setError(''); setForgotNotFound(false);
    const { data: members } = await supabase
      .from('members').select('*').ilike('nama', forgotNama.trim()).eq('tier', forgotTier);
    if (!members || members.length === 0) {
      setForgotNotFound(true); setLoading(false); return;
    }
    const member = members[0];
    if (!member.is_active) { setError('Akun tidak aktif. Hubungi admin.'); setLoading(false); return; }
    // Tampilkan password yang sudah ada di database — tidak generate baru
    setNewPassword(member.password);
    setForgotDone(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-md border-b border-yellow-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/" className="text-gray-400 hover:text-white transition-colors"><ArrowLeft size={20} /></a>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-[#0a0f1e] font-bold text-sm">MR</span>
            </div>
            <span className="text-white font-bold text-xl tracking-wide">MENOLAK RUGI</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              mode === 'member' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
              mode === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
              'bg-gradient-to-br from-blue-500 to-blue-700'
            }`}>
              {mode === 'member' ? <Lock size={28} className="text-[#0a0f1e]" /> :
               mode === 'admin' ? <Shield size={28} className="text-white" /> :
               <KeyRound size={28} className="text-white" />}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === 'member' ? 'Member Area' : mode === 'admin' ? 'Admin Panel' : 'Lupa Password'}
            </h1>
            <p className="text-gray-400 text-sm">
              {mode === 'member' ? 'Login dengan data keanggotaan kamu' :
               mode === 'admin' ? 'Login sebagai administrator' :
               'Reset password dengan data pendaftaran'}
            </p>
          </div>

          {/* Toggle Member/Admin */}
          {mode !== 'forgot' && (
            <div className="flex bg-[#111827] border border-gray-700/50 rounded-xl p-1 mb-6">
              <button onClick={() => { setMode('member'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'member' ? 'bg-yellow-500 text-[#0a0f1e]' : 'text-gray-400 hover:text-white'}`}>
                <LogIn size={16} /> Member
              </button>
              <button onClick={() => { setMode('admin'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'admin' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Shield size={16} /> Admin
              </button>
            </div>
          )}

          <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-8 space-y-5">

            {/* Form Member Login */}
            {mode === 'member' && (
              <>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Nama Lengkap</label>
                  <input type="text" value={nama} onChange={e => setNama(e.target.value)} placeholder="Sesuai data pendaftaran"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Tier Kelas</label>
                  <select value={tier} onChange={e => setTier(e.target.value)}
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-colors">
                    <option value="">Pilih tier kelas kamu</option>
                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleMemberLogin()} placeholder="Password dari admin"
                      className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Form Admin Login */}
            {mode === 'admin' && (
              <>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Username</label>
                  <input type="text" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} placeholder="Username admin"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Password</label>
                  <div className="relative">
                    <input type={showAdminPass ? 'text' : 'password'} value={adminPass} onChange={e => setAdminPass(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} placeholder="Password admin"
                      className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors" />
                    <button type="button" onClick={() => setShowAdminPass(!showAdminPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showAdminPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Form Lupa Password */}
            {mode === 'forgot' && !forgotDone && (
              <>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Nama Lengkap</label>
                  <input type="text" value={forgotNama} onChange={e => { setForgotNama(e.target.value); setForgotNotFound(false); }} placeholder="Sesuai data pendaftaran"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Tier Kelas</label>
                  <select value={forgotTier} onChange={e => { setForgotTier(e.target.value); setForgotNotFound(false); }}
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors">
                    <option value="">Pilih tier kelas kamu</option>
                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Nama tidak ditemukan */}
                {forgotNotFound && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-4 space-y-3">
                    <p className="text-red-400 text-sm font-semibold">❌ Data tidak ditemukan di database.</p>
                    <p className="text-gray-400 text-xs">Pastikan nama dan tier sesuai data pendaftaran, atau hubungi admin langsung.</p>
                    <a
                      href={`https://wa.me/6281242224939?text=${encodeURIComponent(`Halo Admin Menolak Rugi, saya ingin minta password untuk akun saya.\n\nNama Lengkap: ${forgotNama.trim()}\nTier Kelas: ${forgotTier || '(tidak diisi)'}\n\nMohon bantuannya. Terima kasih!`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all text-sm w-full">
                      💬 Chat Admin via WhatsApp
                    </a>
                  </div>
                )}
              </>
            )}

            {/* Hasil Reset Password */}
            {mode === 'forgot' && forgotDone && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={32} className="text-green-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Password Kamu</h3>
                <div className="bg-[#0d1325] border border-green-500/30 rounded-xl px-6 py-4 mb-4">
                  <p className="text-green-400 font-mono text-2xl font-bold tracking-widest">{newPassword}</p>
                </div>
                <p className="text-gray-400 text-sm mb-4">Gunakan password ini untuk login. Jika ingin ganti, bisa dari menu Password di dashboard.</p>
                <button onClick={() => { setMode('member'); setForgotDone(false); setForgotNama(''); setForgotTier(''); setNewPassword(''); setForgotNotFound(false); }}
                  className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold transition-colors">
                  Kembali ke Login →
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            {!(mode === 'forgot' && forgotDone) && !(mode === 'forgot' && forgotNotFound) && (
              <button
                onClick={mode === 'member' ? handleMemberLogin : mode === 'admin' ? handleAdminLogin : handleForgotPassword}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === 'member' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-[#0a0f1e]' :
                  mode === 'admin' ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white' :
                  'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white'
                }`}>
                {mode === 'member' ? <LogIn size={20} /> : mode === 'admin' ? <Shield size={20} /> : <KeyRound size={20} />}
                {loading ? 'Memproses...' : mode === 'member' ? 'Masuk ke Member Area' : mode === 'admin' ? 'Masuk ke Admin Panel' : 'Reset Password'}
              </button>
            )}

            {/* Footer links */}
            {mode === 'member' && (
              <div className="flex items-center justify-between text-xs">
                <button onClick={() => { setMode('forgot'); setError(''); }}
                  className="text-blue-400 hover:text-blue-300 transition-colors">
                  Lupa Password?
                </button>
                <a href="https://wa.me/6281242224939" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400">
                  Hubungi Admin
                </a>
              </div>
            )}

            {mode === 'forgot' && !forgotDone && (
              <button onClick={() => { setMode('member'); setError(''); setForgotNotFound(false); setForgotNama(''); }}
                className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> Kembali ke Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}