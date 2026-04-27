import { useState, useEffect } from 'react';
import { LogOut, Play, Lock, ChevronUp, Clock, CheckCircle, XCircle, KeyRound, FileText, Download, Film, Lightbulb, BookOpen, Rocket } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Video {
  id: string; judul: string; deskripsi: string;
  youtube_url: string; tier_akses: string[]; level: string; kategori: string; urutan: number;
  coming_soon_img?: string;
}
interface FileItem {
  id: string; judul: string; deskripsi: string; file_url: string;
  file_name: string; file_type: string; kategori: string; tier_akses: string[]; level: string; urutan: number;
}
interface Broker {
  id: string; nama: string; link: string; diskon: string | null; deskripsi: string | null; urutan: number;
}
interface Session { token: string; member_id: string; nama: string; tier: string; }
interface AdvanceRequest { id: string; status: string; alasan_tolak: string | null; created_at: string; }

const TIER_ORDER = ['SMC Trial', 'SMC Silver', 'SMC Bronze', 'SMC Gold Mentorship', 'SMC Platinum 1 on 1'];
function tierLevel(tier: string) { return TIER_ORDER.indexOf(tier); }
function getYoutubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/);
  return match ? match[1] : null;
}

const TABS = [
  { id: 'intro', label: 'Intro', icon: <Film size={15} />, desc: 'Video pengantar kelas' },
  { id: 'basic', label: 'Basic', icon: <BookOpen size={15} />, desc: 'Materi dasar SMC' },
  { id: 'tips-basic', label: 'Tips Basic', icon: <Lightbulb size={15} />, desc: 'Tips & trik materi basic' },
  { id: 'advanced', label: 'Advanced', icon: <Rocket size={15} />, desc: 'Materi lanjutan', locked: true },
  { id: 'tips-advanced', label: 'Tips Advanced', icon: <Lightbulb size={15} />, desc: 'Tips & trik materi advanced', locked: true },
  { id: 'file-basic', label: 'File Basic', icon: <FileText size={15} />, desc: 'Dokumen materi basic' },
  { id: 'file-advanced', label: 'File Advanced', icon: <FileText size={15} />, desc: 'Dokumen materi advanced', locked: true },
  { id: 'komunitas', label: 'Komunitas', icon: <span className="text-base">🌐</span> },
  { id: 'broker', label: 'Funded Broker', icon: <span className="text-base">🏦</span> },
  { id: 'ulasan', label: 'Tulis Ulasan', icon: <span className="text-base">⭐</span> },
  { id: 'settings', label: 'Password', icon: <KeyRound size={15} /> },
];

function fileIcon(type: string) {
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('doc')) return '📝';
  if (type.includes('excel') || type.includes('sheet') || type.includes('xls')) return '📊';
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return '📊';
  if (type.includes('zip') || type.includes('exe') || type.includes('dmg') || type.includes('apk')) return '📦';
  return '📁';
}

export default function MemberPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState('intro');
  const [loading, setLoading] = useState(true);
  const [isAdvance, setIsAdvance] = useState(false);
  const [advanceRequest, setAdvanceRequest] = useState<AdvanceRequest | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');
  const [discordConnected, setDiscordConnected] = useState(false);
  const [discordUsername, setDiscordUsername] = useState('');
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [ulasanTeks, setUlasanTeks] = useState('');
  const [ulasanBintang, setUlasanBintang] = useState(5);
  const [ulasanSent, setUlasanSent] = useState(false);
  const [ulasanLoading, setUlasanLoading] = useState(false);
  const [ulasanErr, setUlasanErr] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    async function init() {
      const raw = localStorage.getItem('mr_session');
      if (!raw) { window.location.href = '/login'; return; }
      const sess: Session = JSON.parse(raw);
      const { data: member } = await supabase.from('members').select('session_token, is_active, is_advance, discord_id, discord_username').eq('id', sess.member_id).single();
      if (!member || !member.is_active || member.session_token !== sess.token) {
        localStorage.removeItem('mr_session'); window.location.href = '/login'; return;
      }
      setSession(sess);
      setIsAdvance(member.is_advance || false);
      const { data: req } = await supabase.from('advance_requests').select('*').eq('member_id', sess.member_id).order('created_at', { ascending: false }).limit(1).single();
      if (req) setAdvanceRequest(req);
      const { data: vids } = await supabase.from('videos').select('*').order('urutan', { ascending: true });
      if (vids) setVideos(vids);
      const { data: fileData } = await supabase.from('files').select('*').order('urutan', { ascending: true });
      if (member.discord_id) { setDiscordConnected(true); setDiscordUsername(member.discord_username || ''); }
      if (fileData) setFiles(fileData);
      const { data: brokerData } = await supabase.from('brokers').select('*').order('urutan', { ascending: true });
      if (brokerData) setBrokers(brokerData);

      // Update last_seen
      await supabase.from('members').update({ last_seen: new Date().toISOString() }).eq('id', sess.member_id);
      setLoading(false);
    }
    init();

    // Ping last_seen setiap 2 menit
    const pingInterval = setInterval(async () => {
      const raw = localStorage.getItem('mr_session');
      if (!raw) return;
      const sess = JSON.parse(raw);
      await supabase.from('members').update({ last_seen: new Date().toISOString() }).eq('id', sess.member_id);
    }, 2 * 60 * 1000);

    return () => clearInterval(pingInterval);
  }, []);

  function canAccessAdvance() {
    if (!session) return false;
    const silverOrAbove = tierLevel(session.tier) >= tierLevel('SMC Silver');
    return isAdvance && silverOrAbove;
  }

  function isTabLocked(tabId: string) {
    if (tabId === 'advanced' || tabId === 'tips-advanced' || tabId === 'file-advanced') {
      return !canAccessAdvance();
    }
    return false;
  }

  function getTabVideos(tabId: string) {
    return videos.filter(v => v.kategori === tabId);
  }

  function getTabFiles(tabId: string) {
    return files.filter(f => f.kategori === tabId);
  }

  const [showJurnalForm, setShowJurnalForm] = useState(false);
  const [jurnal1, setJurnal1] = useState('');
  const [jurnal2, setJurnal2] = useState('');
  const [jurnal3, setJurnal3] = useState('');
  const [jFile1, setJFile1] = useState<File | null>(null);
  const [jFile2, setJFile2] = useState<File | null>(null);
  const [jFile3, setJFile3] = useState<File | null>(null);

  async function uploadJurnalFile(file: File): Promise<string> {
    const fileName = `jurnal/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { error } = await supabase.storage.from('materi').upload(fileName, file, { upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('materi').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleRequestAdvance() {
    if (!session) return;
    // Cek minimal salah satu dari link atau file per jurnal
    const j1Valid = jurnal1.trim() || jFile1;
    const j2Valid = jurnal2.trim() || jFile2;
    const j3Valid = jurnal3.trim() || jFile3;
    if (!j1Valid || !j2Valid || !j3Valid) {
      setRequestMsg('Ketiga jurnal wajib diisi (link atau upload file).');
      return;
    }
    setRequesting(true); setRequestMsg('');
    try {
      const links: string[] = [];
      // Jurnal 1
      if (jFile1) links.push(await uploadJurnalFile(jFile1));
      else links.push(jurnal1.trim());
      // Jurnal 2
      if (jFile2) links.push(await uploadJurnalFile(jFile2));
      else links.push(jurnal2.trim());
      // Jurnal 3
      if (jFile3) links.push(await uploadJurnalFile(jFile3));
      else links.push(jurnal3.trim());

      const catatan = `Jurnal 1: ${links[0]}\nJurnal 2: ${links[1]}\nJurnal 3: ${links[2]}`;
      const { error } = await supabase.from('advance_requests').insert({
        member_id: session.member_id, member_nama: session.nama,
        member_tier: session.tier, status: 'pending', alasan_tolak: catatan,
      });
      if (error) setRequestMsg('Gagal mengirim request. Coba lagi.');
      else {
        setRequestMsg('Request berhasil dikirim! Tunggu review dari mentor.');
        setShowJurnalForm(false);
        setJurnal1(''); setJurnal2(''); setJurnal3('');
        setJFile1(null); setJFile2(null); setJFile3(null);
        const { data: req } = await supabase.from('advance_requests').select('*').eq('member_id', session.member_id).order('created_at', { ascending: false }).limit(1).single();
        if (req) setAdvanceRequest(req);
      }
    } catch (e: any) {
      setRequestMsg('Gagal upload file: ' + e.message);
    }
    setRequesting(false);
  }

  async function handleKirimUlasan() {
    if (!session) return;
    if (!ulasanTeks.trim()) { setUlasanErr('Ulasan tidak boleh kosong.'); return; }
    setUlasanLoading(true); setUlasanErr('');
    const { error } = await supabase.from('testimonials').insert({
      member_id: session.member_id,
      nama: session.nama,
      kelas: session.tier,
      ulasan: ulasanTeks.trim(),
      bintang: ulasanBintang,
      status: 'pending',
    });
    if (error) setUlasanErr('Gagal mengirim. Coba lagi.');
    else setUlasanSent(true);
    setUlasanLoading(false);
  }

  async function handleGantiPassword() {
    setPassMsg(''); setPassErr('');
    if (!oldPass || !newPass || !confirmPass) { setPassErr('Semua field wajib diisi.'); return; }
    if (newPass.length < 6) { setPassErr('Password minimal 6 karakter.'); return; }
    if (newPass !== confirmPass) { setPassErr('Password baru tidak cocok.'); return; }
    setChangingPass(true);
    const { data: member } = await supabase.from('members').select('password').eq('id', session!.member_id).single();
    if (!member || member.password !== oldPass) { setPassErr('Password lama salah.'); setChangingPass(false); return; }
    const { error } = await supabase.from('members').update({ password: newPass }).eq('id', session!.member_id);
    if (error) { setPassErr('Gagal menyimpan. Coba lagi.'); }
    else { setPassMsg('Password berhasil diubah!'); setOldPass(''); setNewPass(''); setConfirmPass(''); }
    setChangingPass(false);
  }

  function handleConnectDiscord() {
    const CLIENT_ID = '1497825707173347409';
    const REDIRECT_URI = encodeURIComponent('https://menolakrugi.pages.dev/discord-callback');
    const SCOPE = encodeURIComponent('identify guilds.join');
    const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}`;
    window.location.href = url;
  }

  async function handleLogout() {
    if (!session) return;
    await supabase.from('members').update({ session_token: null }).eq('id', session.member_id);
    localStorage.removeItem('mr_session');
    window.location.href = '/';
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Memuat member area...</p>
      </div>
    </div>
  );

  const locked = isTabLocked(activeTab);
  const isFileTab = activeTab.startsWith('file-');
  const currentVideos = !isFileTab ? getTabVideos(activeTab) : [];
  const currentFiles = isFileTab ? getTabFiles(activeTab) : [];

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-md border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-[#0a0f1e] font-bold text-sm">MR</span>
            </div>
            <span className="text-white font-bold text-xl tracking-wide">MENOLAK RUGI</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-semibold">{session?.nama}</p>
              <div className="flex items-center gap-2 justify-end">
                <p className="text-yellow-400 text-xs">{session?.tier}</p>
                {isAdvance && <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">Advance</span>}
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm">
              <LogOut size={18} /><span className="hidden sm:block">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-28 pb-16">
        {/* Mobile Tabs — di atas konten, full width */}
        <div className="lg:hidden mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map(t => {
              const tabLocked = isTabLocked(t.id);
              return (
                <button key={t.id} onClick={() => { setActiveTab(t.id); setActiveVideo(null); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === t.id
                      ? t.id.includes('advanced') ? 'bg-purple-600 text-white'
                      : t.id === 'settings' ? 'bg-gray-600 text-white'
                      : 'bg-yellow-500 text-[#0a0f1e]'
                      : 'bg-[#111827] text-gray-400 border border-gray-700'
                  }`}>
                  {t.icon} {t.label} {tabLocked && <Lock size={11} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-6">
        {/* Sidebar Tabs — desktop only */}
        <div className="w-52 flex-shrink-0 hidden lg:block">
          <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-3 sticky top-28">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest px-2 mb-3">Menu</p>
            <div className="space-y-1">
              {TABS.map(t => {
                const tabLocked = isTabLocked(t.id);
                return (
                  <button key={t.id} onClick={() => { setActiveTab(t.id); setActiveVideo(null); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      activeTab === t.id
                        ? t.id.includes('advanced') ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : t.id === 'settings' ? 'bg-gray-700/50 text-white'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}>
                    {t.icon}
                    <span className="flex-1">{t.label}</span>
                    {tabLocked && <Lock size={12} className="text-gray-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header section */}
          {activeTab !== 'settings' && (
            <div className="mb-6">
              {TABS.filter(t => t.id === activeTab).map(t => (
                <div key={t.id}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{t.id === 'intro' ? '🎬' : t.id === 'basic' ? '📚' : t.id === 'tips-basic' ? '💡' : t.id === 'advanced' ? '🚀' : t.id === 'tips-advanced' ? '💡' : t.id === 'file-basic' ? '📁' : '📁'}</span>
                    <h1 className="text-2xl font-bold text-white">{t.label}</h1>
                  </div>
                  {'desc' in t && <p className="text-gray-400 text-sm">{t.desc as string}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Locked Banner untuk Advanced */}
          {locked && (
            <div className="bg-[#111827] border border-purple-500/30 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ChevronUp size={24} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">Akses Kelas Advanced</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    Syarat untuk naik ke kelas Advanced:<br />
                    ✅ Minimal tier <strong className="text-white">SMC Silver</strong><br />
                    ✅ Penjurnalan selama <strong className="text-white">1 bulan</strong><br />
                    ✅ Direview dan disetujui mentor
                  </p>
                  {advanceRequest?.status === 'pending' && (
                    <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-4">
                      <Clock size={18} className="text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-400 font-semibold text-sm">Request sedang direview mentor</p>
                        <p className="text-gray-500 text-xs">Dikirim: {new Date(advanceRequest.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  )}
                  {advanceRequest?.status === 'ditolak' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
                      <div className="flex items-center gap-2 mb-1"><XCircle size={18} className="text-red-400" /><p className="text-red-400 font-semibold text-sm">Request ditolak</p></div>
                      {advanceRequest.alasan_tolak && <p className="text-gray-400 text-sm ml-6">Alasan: {advanceRequest.alasan_tolak}</p>}
                    </div>
                  )}
                  {requestMsg && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 mb-4">
                      <div className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400" /><p className="text-green-400 text-sm">{requestMsg}</p></div>
                    </div>
                  )}
                  {(!advanceRequest || advanceRequest.status === 'ditolak' || advanceRequest.status === 'disetujui') && !requestMsg && (
                    <div>
                      {!showJurnalForm ? (
                        <button onClick={() => setShowJurnalForm(true)}
                          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition-all">
                          <ChevronUp size={18} /> Request Naik Advanced
                        </button>
                      ) : (
                        <div className="bg-[#0d1325] border border-purple-500/20 rounded-xl p-4 space-y-4">
                          <p className="text-purple-300 text-sm font-semibold">📓 Lampirkan 3 Jurnal Trading kamu</p>
                          <p className="text-gray-500 text-xs">Tiap jurnal bisa berupa link (Google Sheets, Notion, dll) <strong className="text-gray-400">atau</strong> upload file (Excel, PDF, dll).</p>
                          {[
                            { label: 'Jurnal 1', val: jurnal1, setVal: setJurnal1, file: jFile1, setFile: setJFile1 },
                            { label: 'Jurnal 2', val: jurnal2, setVal: setJurnal2, file: jFile2, setFile: setJFile2 },
                            { label: 'Jurnal 3', val: jurnal3, setVal: setJurnal3, file: jFile3, setFile: setJFile3 },
                          ].map((j, i) => (
                            <div key={i} className="bg-[#111827] border border-gray-700/50 rounded-xl p-3 space-y-2">
                              <p className="text-gray-400 text-xs font-semibold">{j.label}</p>
                              {!j.file ? (
                                <input type="text" value={j.val} onChange={e => j.setVal(e.target.value)}
                                  placeholder="Paste link jurnal (Google Sheets, Notion, dll)"
                                  className="w-full bg-[#0d1325] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/50" />
                              ) : (
                                <div className="flex items-center gap-2 bg-[#0d1325] rounded-lg px-3 py-2">
                                  <span className="text-purple-400 text-xs flex-1 truncate">📎 {j.file.name}</span>
                                  <button onClick={() => j.setFile(null)} className="text-gray-500 hover:text-red-400 text-xs">Hapus</button>
                                </div>
                              )}
                              {!j.val.trim() && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600 text-xs">atau</span>
                                  <label className="cursor-pointer text-purple-400 hover:text-purple-300 text-xs font-semibold border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-500/10 transition-all">
                                    📂 Upload File
                                    <input type="file" accept=".xlsx,.xls,.pdf,.csv,.doc,.docx,.png,.jpg" className="hidden"
                                      onChange={e => { j.setFile(e.target.files?.[0] || null); j.setVal(''); }} />
                                  </label>
                                  <span className="text-gray-700 text-xs">(.xlsx, .pdf, .csv, dll)</span>
                                </div>
                              )}
                            </div>
                          ))}
                          {requestMsg && <p className="text-red-400 text-xs">{requestMsg}</p>}
                          <div className="flex gap-2">
                            <button onClick={handleRequestAdvance} disabled={requesting}
                              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm">
                              <ChevronUp size={16} />{requesting ? 'Mengirim...' : 'Kirim Request'}
                            </button>
                            <button onClick={() => { setShowJurnalForm(false); setRequestMsg(''); }}
                              className="text-gray-500 hover:text-gray-300 px-4 py-2.5 rounded-xl text-sm">Batal</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Video Player */}
          {activeVideo && !locked && (
            <div className="mb-8 bg-[#111827] border border-yellow-500/20 rounded-2xl overflow-hidden">
              <div className="aspect-video w-full">
                <iframe src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo.youtube_url)}?rel=0&modestbranding=1`}
                  className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              </div>
              <div className="p-6">
                <h2 className="text-white font-bold text-xl mb-2">{activeVideo.judul}</h2>
                {activeVideo.deskripsi && <p className="text-gray-400 text-sm leading-relaxed">{activeVideo.deskripsi}</p>}
              </div>
            </div>
          )}

          {/* Video Grid */}
          {!isFileTab && activeTab !== 'settings' && !locked && (
            currentVideos.length === 0 ? (
              <div className="text-center py-20 bg-[#111827] border border-gray-800/50 rounded-2xl">
                <p className="text-4xl mb-4">🎬</p>
                <p className="text-gray-500">Belum ada video di kategori ini. Pantau terus ya!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {currentVideos.map(video => {
                  const isComingSoon = !video.youtube_url;
                  const ytId = !isComingSoon ? getYoutubeId(video.youtube_url) : null;
                  const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
                  const isActive = activeVideo?.id === video.id;

                  if (isComingSoon) {
                    return (
                      <div key={video.id}
                        className="bg-[#111827] border border-gray-700/50 rounded-2xl overflow-hidden relative select-none">
                        <div className="relative aspect-video bg-[#0d1325]">
                          {video.coming_soon_img
                            ? <img src={video.coming_soon_img} alt={video.judul} className="w-full h-full object-cover opacity-70" />
                            : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d1325] to-[#1a1f35]">
                                <span className="text-5xl">🕐</span>
                              </div>
                          }
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute top-3 left-3">
                            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-widest shadow-lg">
                              🕐 COMING SOON
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-gray-300 font-semibold text-sm leading-snug">{video.judul}</h3>
                          {video.deskripsi && <p className="text-gray-600 text-xs mt-1 line-clamp-2">{video.deskripsi}</p>}
                          <p className="text-orange-400/70 text-xs mt-2 font-medium">Segera hadir — pantau terus!</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={video.id} onClick={() => setActiveVideo(video)}
                      className={`bg-[#111827] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 ${isActive ? 'border-yellow-500/60 shadow-lg shadow-yellow-500/10' : 'border-gray-700/50 hover:border-yellow-500/30'}`}>
                      <div className="relative aspect-video bg-[#0d1325]">
                        {thumb && <img src={thumb} alt={video.judul} className="w-full h-full object-cover" />}
                        <div className={`absolute inset-0 flex items-center justify-center ${isActive ? 'bg-yellow-500/20' : 'bg-black/30 hover:bg-black/10'} transition-colors`}>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-yellow-500' : 'bg-yellow-500/90'}`}>
                            <Play size={20} className="text-[#0a0f1e] ml-1" />
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold text-sm leading-snug">{video.judul}</h3>
                        {video.deskripsi && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{video.deskripsi}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* File Grid */}
          {isFileTab && activeTab !== 'settings' && !locked && (
            currentFiles.length === 0 ? (
              <div className="text-center py-20 bg-[#111827] border border-gray-800/50 rounded-2xl">
                <p className="text-4xl mb-4">📁</p>
                <p className="text-gray-500">Belum ada file di kategori ini. Pantau terus ya!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentFiles.map(file => (
                  <div key={file.id} className="bg-[#111827] border border-gray-700/50 hover:border-yellow-500/30 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#0d1325] rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                        {fileIcon(file.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm leading-snug mb-1">{file.judul}</h3>
                        {file.deskripsi && <p className="text-gray-500 text-xs mb-3 line-clamp-2">{file.deskripsi}</p>}
                        <p className="text-gray-600 text-xs mb-3">{file.file_name}</p>
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" download
                          className="inline-flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 font-semibold px-4 py-2 rounded-xl transition-all text-xs">
                          <Download size={14} /> Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Komunitas */}
          {activeTab === 'komunitas' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-6">🌐 Komunitas</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Discord Card */}
                <div className="bg-[#111827] border border-indigo-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl">🎮</div>
                    <div>
                      <h3 className="text-white font-bold">Discord</h3>
                      <p className="text-gray-400 text-xs">Komunitas utama PTMR</p>
                    </div>
                  </div>
                  {discordConnected ? (
                    <div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 mb-3">
                        <p className="text-green-400 text-sm font-semibold">✅ Terhubung</p>
                        <p className="text-gray-400 text-xs">@{discordUsername}</p>
                      </div>
                      <button onClick={handleConnectDiscord}
                        className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 font-semibold py-2.5 rounded-xl transition-all text-sm">
                        Sinkronisasi Role
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                        Hubungkan akun Discord kamu untuk otomatis dapat role sesuai tier dan level kelas.
                      </p>
                      <button onClick={handleConnectDiscord}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all">
                        🎮 Hubungkan Discord
                      </button>
                    </div>
                  )}
                </div>

                {/* Platform lain */}
                {[
                  { name: 'Telegram', icon: '✈️', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400', btn: 'bg-blue-500 hover:bg-blue-400', url: 'https://t.me/+_azyX2h9oFhmNjNl', desc: 'Channel update & info terbaru' },
                  { name: 'TikTok', icon: '🎵', color: 'bg-gray-800/50 border-gray-700 text-gray-300', btn: 'bg-gray-700 hover:bg-gray-600', url: 'https://tiktok.com/@menolakrugi', desc: 'Konten edukasi trading' },
                  { name: 'YouTube', icon: '▶️', color: 'bg-red-500/10 border-red-500/30 text-red-400', btn: 'bg-red-600 hover:bg-red-500', url: 'https://youtube.com/@MENOLAKRUGI', desc: 'Live session & materi publik' },
                ].map(p => (
                  <div key={p.name} className={`bg-[#111827] border rounded-2xl p-6 ${p.color.split(' ')[1]}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${p.color.split(' ')[0]}`}>{p.icon}</div>
                      <div>
                        <h3 className="text-white font-bold">{p.name}</h3>
                        <p className="text-gray-400 text-xs">{p.desc}</p>
                      </div>
                    </div>
                    <a href={p.url} target="_blank" rel="noopener noreferrer"
                      className={`block w-full text-white font-bold py-3 rounded-xl transition-all text-center text-sm ${p.btn}`}>
                      Bergabung →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funded Broker */}
          {activeTab === 'broker' && (
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">🏦 Funded Broker</h1>
              <p className="text-gray-400 text-sm mb-6">Prop firm & broker rekomendasian mentor. Klik untuk daftar.</p>
              {!brokers.length ? (
                <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-10 text-center">
                  <p className="text-4xl mb-3">🏦</p>
                  <p className="text-gray-500">Belum ada broker yang ditambahkan. Pantau terus ya!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {brokers.map(b => (
                    <div key={b.id} className="bg-[#111827] border border-yellow-500/20 rounded-2xl p-6 flex flex-col gap-3 hover:border-yellow-500/40 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-white font-bold text-lg">{b.nama}</h3>
                          {b.deskripsi && <p className="text-gray-400 text-xs mt-1 leading-relaxed">{b.deskripsi}</p>}
                        </div>
                        {b.diskon && (
                          <span className="flex-shrink-0 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                            🎁 {b.diskon}
                          </span>
                        )}
                      </div>
                      <a href={b.link} target="_blank" rel="noopener noreferrer"
                        className="mt-auto w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-bold py-3 rounded-xl transition-all text-sm">
                        Daftar Sekarang →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tulis Ulasan */}
          {activeTab === 'ulasan' && (
            <div className="max-w-xl">
              <h1 className="text-2xl font-bold text-white mb-2">⭐ Tulis Ulasan</h1>
              <p className="text-gray-400 text-sm mb-6">Bagikan pengalaman kamu belajar di Menolak Rugi. Ulasan akan ditampilkan setelah disetujui mentor.</p>
              {ulasanSent ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-white font-bold text-lg mb-2">Ulasan Terkirim!</h3>
                  <p className="text-gray-400 text-sm">Terima kasih! Ulasan kamu sedang direview oleh mentor dan akan segera ditampilkan di website.</p>
                </div>
              ) : (
                <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-6 space-y-5">
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Nama</label>
                    <div className="bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-gray-400 text-sm">{session?.nama}</div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Kelas</label>
                    <div className="bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-gray-400 text-sm">{session?.tier}</div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-3">Rating</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setUlasanBintang(s)}
                          className={`text-3xl transition-all ${s <= ulasanBintang ? 'opacity-100 scale-110' : 'opacity-30'}`}>
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Ulasan Kamu</label>
                    <textarea value={ulasanTeks} onChange={e => setUlasanTeks(e.target.value)} rows={5}
                      placeholder="Ceritakan pengalaman belajar kamu di Menolak Rugi..."
                      className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 resize-none" />
                    <p className="text-gray-600 text-xs mt-1">{ulasanTeks.length} karakter</p>
                  </div>
                  {ulasanErr && <p className="text-red-400 text-sm">{ulasanErr}</p>}
                  <button onClick={handleKirimUlasan} disabled={ulasanLoading}
                    className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-bold py-3.5 rounded-xl transition-all disabled:opacity-50">
                    {ulasanLoading ? 'Mengirim...' : '⭐ Kirim Ulasan'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Settings - Ganti Password */}
          {activeTab === 'settings' && (
            <div className="max-w-md">
              <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><KeyRound size={22} className="text-yellow-400" /> Ganti Password</h1>
              <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-8 space-y-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Password Lama</label>
                  <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Masukkan password lama"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Password Baru</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Minimal 6 karakter"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Konfirmasi Password Baru</label>
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Ulangi password baru"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 transition-colors" />
                </div>
                {passErr && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{passErr}</p></div>}
                {passMsg && <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3"><p className="text-green-400 text-sm">{passMsg}</p></div>}
                <button onClick={handleGantiPassword} disabled={changingPass}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-[#0a0f1e] font-bold py-3.5 rounded-xl transition-all disabled:opacity-50">
                  {changingPass ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </div>
            </div>
          )}
        </div>
        </div> {/* end flex gap-6 */}
      </div>
    </div>
  );
}
