import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Users, Video, ArrowLeft, Eye, EyeOff, Upload, RefreshCw, ChevronUp, ChevronDown, CheckCircle, XCircle, KeyRound, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TIERS = ['SMC Trial', 'SMC Bronze', 'SMC Gold Mentorship', 'SMC Platinum 1 on 1'];

interface Admin { id: string; username: string; password: string; role: string; }
interface Member { id: string; nama: string; tier: string; password: string; is_active: boolean; is_advance: boolean; }
interface VideoItem { id: string; judul: string; deskripsi: string; youtube_url: string; tier_akses: string[]; level: string; urutan: number; }
interface AdvanceRequest { id: string; member_id: string; member_nama: string; member_tier: string; status: string; alasan_tolak: string | null; created_at: string; }

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AdminPage() {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [tab, setTab] = useState<'member' | 'video' | 'advance' | 'admins' | 'settings'>('member');
  const [members, setMembers] = useState<Member[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [requests, setRequests] = useState<AdvanceRequest[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');
  const fileRef = useRef<HTMLInputElement>(null);

  // Member form
  const [mNama, setMNama] = useState('');
  const [mTier, setMTier] = useState('');
  const [mPassword, setMPassword] = useState('');
  const [showMPass, setShowMPass] = useState(false);

  // Video form
  const [vJudul, setVJudul] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vUrl, setVUrl] = useState('');
  const [vLevel, setVLevel] = useState<'basic' | 'advance'>('basic');
  const [vUrutan, setVUrutan] = useState('');
  const [vKategori, setVKategori] = useState('intro');

  // File upload state
  const [fJudul, setFJudul] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fKategori, setFKategori] = useState('file-basic');
  const [fUrutan, setFUrutan] = useState('');
  const [fFile, setFFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const [fileItems, setFileItems] = useState<{id: string; judul: string; file_name: string; file_url: string; kategori: string}[]>([]);

  // Admin form
  const [aUsername, setAUsername] = useState('');
  const [aPassword, setAPassword] = useState('');
  const [showAPass, setShowAPass] = useState(false);

  // Settings - ganti password sendiri
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  const [revealPass, setRevealPass] = useState<Record<string, boolean>>({});
  const [tolakId, setTolakId] = useState<string | null>(null);
  const [alasanTolak, setAlasanTolak] = useState('');

  // Edit member states
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editMNama, setEditMNama] = useState('');
  const [editMTier, setEditMTier] = useState('');
  const [editMPassword, setEditMPassword] = useState('');
  const [editMAdvance, setEditMAdvance] = useState(false);

  // Filter member states
  const [filterTier, setFilterTier] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [editVideoId, setEditVideoId] = useState<string | null>(null);
  const [editVJudul, setEditVJudul] = useState('');
  const [editVDesc, setEditVDesc] = useState('');
  const [editVUrl, setEditVUrl] = useState('');
  const [editVKategori, setEditVKategori] = useState('');
  const [editVUrutan, setEditVUrutan] = useState('');
  const [editFileId, setEditFileId] = useState<string | null>(null);
  const [editFJudul, setEditFJudul] = useState('');
  const [editFDesc, setEditFDesc] = useState('');
  const [editFKategori, setEditFKategori] = useState('');
  const [editFUrutan, setEditFUrutan] = useState('');

  // Coming Soon image
  const [csFile, setCsFile] = useState<File | null>(null);
  const csUploadRef = useRef<HTMLInputElement>(null);
  const [editCsFile, setEditCsFile] = useState<File | null>(null);
  const editCsUploadRef = useRef<HTMLInputElement>(null);
  const [editCsExisting, setEditCsExisting] = useState<string>('');

  function notify(text: string, type: 'ok' | 'err' = 'ok') {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  }

  useEffect(() => {
    const raw = localStorage.getItem('mr_admin');
    if (!raw) { window.location.href = '/login'; return; }
    const admin = JSON.parse(raw);
    setCurrentAdmin(admin);
    loadData();
  }, []);

  async function loadData() {
    const { data: m } = await supabase.from('members').select('*').order('created_at', { ascending: false });
    const { data: v } = await supabase.from('videos').select('*').order('urutan', { ascending: true });
    const { data: r } = await supabase.from('advance_requests').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('admins').select('*').order('created_at', { ascending: true });
    const { data: fi } = await supabase.from('files').select('*').order('urutan', { ascending: true });
    if (m) setMembers(m);
    if (v) setVideos(v);
    if (r) setRequests(r);
    if (a) setAdmins(a);
    if (fi) setFileItems(fi);
  }

  function handleLogout() {
    localStorage.removeItem('mr_admin');
    window.location.href = '/login';
  }

  // Member functions
  async function addMember() {
    if (!mNama || !mTier || !mPassword) { notify('Semua field wajib diisi.', 'err'); return; }
    setLoading(true);
    const { error } = await supabase.from('members').insert({ nama: mNama, tier: mTier, password: mPassword, is_active: true, is_advance: false });
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Member berhasil ditambahkan!'); setMNama(''); setMTier(''); setMPassword(''); loadData(); }
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('members').update({ is_active: !current, session_token: null }).eq('id', id);
    loadData();
  }

  async function deleteMember(id: string) {
    if (!confirm('Hapus member ini?')) return;
    await supabase.from('members').delete().eq('id', id);
    loadData();
  }

  function startEditMember(m: any) {
    setEditMemberId(m.id);
    setEditMNama(m.nama);
    setEditMTier(m.tier);
    setEditMPassword(m.password);
    setEditMAdvance(m.is_advance);
  }

  async function saveEditMember() {
    if (!editMemberId || !editMNama || !editMTier || !editMPassword) { notify('Semua field wajib diisi.', 'err'); return; }
    setLoading(true);
    const { error } = await supabase.from('members').update({
      nama: editMNama, tier: editMTier, password: editMPassword, is_advance: editMAdvance, session_token: null,
    }).eq('id', editMemberId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Member berhasil diupdate!'); setEditMemberId(null); loadData(); }
    setLoading(false);
  }

  function normalizeTier(raw: string) {
    const r = raw.toLowerCase();
    if (r.includes('platinum')) return 'SMC Platinum 1 on 1';
    if (r.includes('gold')) return 'SMC Gold Mentorship';
    if (r.includes('bronze') || r.includes('silver')) return 'SMC Bronze';
    if (r.includes('trial')) return 'SMC Trial';
    return 'SMC Gold Mentorship';
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const sep = lines[0].includes('\t') ? '\t' : ',';
    const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const namaIdx = headers.findIndex(h => h.includes('nama'));
    const tierIdx = headers.findIndex(h => h.includes('tier') || h.includes('class') || h.includes('kelas'));
    if (namaIdx === -1) { notify('Kolom Nama tidak ditemukan.', 'err'); setLoading(false); return; }
    const rows = lines.slice(1).map(l => {
      const cols = l.split(sep).map(c => c.trim().replace(/"/g, ''));
      return { nama: cols[namaIdx] || '', tier: tierIdx >= 0 ? normalizeTier(cols[tierIdx] || '') : 'SMC Gold Mentorship', password: generatePassword(), is_active: true, is_advance: false };
    }).filter(r => r.nama.length > 2);
    if (!rows.length) { notify('Tidak ada data valid.', 'err'); setLoading(false); return; }
    const { error } = await supabase.from('members').insert(rows);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify(`Berhasil import ${rows.length} member!`); loadData(); }
    setLoading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function exportCSV() {
    const rows = [['Nama', 'Tier', 'Password', 'Advance', 'Status']];
    members.forEach(m => rows.push([m.nama, m.tier, m.password, m.is_advance ? 'Ya' : 'Tidak', m.is_active ? 'Aktif' : 'Nonaktif']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'member-menolakrugi.csv'; a.click();
  }

  // Video functions
  async function addVideo() {
    if (!vJudul) { notify('Judul wajib diisi.', 'err'); return; }
    if (!vUrl && !csFile) { notify('Isi URL YouTube atau upload gambar Coming Soon.', 'err'); return; }
    setLoading(true);
    let csImgUrl = '';
    if (csFile) {
      const csFileName = Date.now() + '_cs_' + csFile.name.replace(/\s/g, '_');
      const { error: csErr } = await supabase.storage.from('materi').upload(csFileName, csFile, { upsert: false });
      if (csErr) { notify('Gagal upload gambar coming soon: ' + csErr.message, 'err'); setLoading(false); return; }
      const { data: csPublic } = supabase.storage.from('materi').getPublicUrl(csFileName);
      csImgUrl = csPublic.publicUrl;
    }
    const { error } = await supabase.from('videos').insert({
      judul: vJudul, deskripsi: vDesc, youtube_url: vUrl,
      tier_akses: vLevel === 'advance' ? ['SMC Silver'] : ['SMC Trial'],
      level: vLevel, kategori: vKategori, urutan: parseInt(vUrutan) || 0,
      coming_soon_img: csImgUrl || null,
    });
    if (error) notify('Error: ' + error.message, 'err');
    else {
      notify('Video berhasil ditambahkan!');
      setVJudul(''); setVDesc(''); setVUrl(''); setVLevel('basic'); setVKategori('intro'); setVUrutan('');
      setCsFile(null);
      if (csUploadRef.current) csUploadRef.current.value = '';
      loadData();
    }
    setLoading(false);
  }

  async function deleteVideo(id: string) {
    if (!confirm('Hapus video ini?')) return;
    await supabase.from('videos').delete().eq('id', id);
    loadData();
  }

  async function moveVideo(kategori: string, index: number, direction: 'up' | 'down') {
    const group = videos
      .filter(v => (v as any).kategori === kategori)
      .sort((a, b) => a.urutan - b.urutan);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= group.length) return;
    const a = group[index];
    const b = group[targetIndex];
    if (a.urutan === b.urutan) {
      await supabase.from('videos').update({ urutan: direction === 'up' ? b.urutan - 1 : b.urutan + 1 }).eq('id', a.id);
    } else {
      await supabase.from('videos').update({ urutan: b.urutan }).eq('id', a.id);
      await supabase.from('videos').update({ urutan: a.urutan }).eq('id', b.id);
    }
    loadData();
  }

  // Advance request functions
  async function approveRequest(req: AdvanceRequest) {
    await supabase.from('advance_requests').update({ status: 'disetujui', updated_at: new Date().toISOString() }).eq('id', req.id);
    await supabase.from('members').update({ is_advance: true }).eq('id', req.member_id);
    notify(`${req.member_nama} berhasil di-approve ke kelas Advance!`);
    loadData();
  }

  async function tolakRequest(req: AdvanceRequest) {
    if (!alasanTolak.trim()) { notify('Isi alasan penolakan dulu.', 'err'); return; }
    await supabase.from('advance_requests').update({ status: 'ditolak', alasan_tolak: alasanTolak, updated_at: new Date().toISOString() }).eq('id', req.id);
    notify(`Request ${req.member_nama} ditolak.`);
    setTolakId(null); setAlasanTolak(''); loadData();
  }

  // Admin management functions (superadmin only)
  async function addAdmin() {
    if (!aUsername || !aPassword) { notify('Username dan password wajib diisi.', 'err'); return; }
    setLoading(true);
    const { error } = await supabase.from('admins').insert({ username: aUsername.toLowerCase(), password: aPassword, role: 'admin' });
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('Admin berhasil ditambahkan!'); setAUsername(''); setAPassword(''); loadData(); }
    setLoading(false);
  }

  async function deleteAdmin(id: string) {
    if (currentAdmin?.id === id) { notify('Tidak bisa hapus akun sendiri.', 'err'); return; }
    if (!confirm('Hapus admin ini?')) return;
    await supabase.from('admins').delete().eq('id', id);
    loadData();
  }

  // Ganti password sendiri (permanen ke database)
  async function handleGantiPassword() {
    setPassMsg(''); setPassErr('');
    if (!oldPass || !newPass || !confirmPass) { setPassErr('Semua field wajib diisi.'); return; }
    if (newPass.length < 6) { setPassErr('Password minimal 6 karakter.'); return; }
    if (newPass !== confirmPass) { setPassErr('Password baru tidak cocok.'); return; }
    const { data: admin } = await supabase.from('admins').select('password').eq('id', currentAdmin!.id).single();
    if (!admin || admin.password !== oldPass) { setPassErr('Password lama salah.'); return; }
    const { error } = await supabase.from('admins').update({ password: newPass }).eq('id', currentAdmin!.id);
    if (error) { setPassErr('Gagal menyimpan. Coba lagi.'); return; }
    setPassMsg('Password berhasil diubah secara permanen!');
    setOldPass(''); setNewPass(''); setConfirmPass('');
  }

  function startEditVideo(v: any) {
    setEditVideoId(v.id); setEditVJudul(v.judul);
    setEditVDesc(v.deskripsi || ''); setEditVUrl(v.youtube_url || '');
    setEditVKategori(v.kategori || 'basic'); setEditVUrutan(String(v.urutan || 0));
    setEditCsExisting(v.coming_soon_img || '');
    setEditCsFile(null);
  }

  async function saveEditVideo() {
    if (!editVideoId || !editVJudul) { notify('Judul wajib diisi.', 'err'); return; }
    if (!editVUrl && !editCsExisting && !editCsFile) { notify('Isi URL YouTube atau pertahankan / upload gambar Coming Soon.', 'err'); return; }
    setLoading(true);
    let csImgUrl = editCsExisting;
    if (editCsFile) {
      const csFileName = Date.now() + '_cs_' + editCsFile.name.replace(/\s/g, '_');
      const { error: csErr } = await supabase.storage.from('materi').upload(csFileName, editCsFile, { upsert: false });
      if (csErr) { notify('Gagal upload gambar: ' + csErr.message, 'err'); setLoading(false); return; }
      const { data: csPublic } = supabase.storage.from('materi').getPublicUrl(csFileName);
      csImgUrl = csPublic.publicUrl;
    }
    const isAdv = editVKategori.includes('advanced');
    const { error } = await supabase.from('videos').update({
      judul: editVJudul, deskripsi: editVDesc, youtube_url: editVUrl,
      kategori: editVKategori, level: isAdv ? 'advance' : 'basic',
      urutan: parseInt(editVUrutan) || 0,
      coming_soon_img: csImgUrl || null,
    }).eq('id', editVideoId);
    if (error) notify('Error: ' + error.message, 'err');
    else {
      notify('Video berhasil diupdate!');
      setEditVideoId(null); setEditCsFile(null); setEditCsExisting('');
      loadData();
    }
    setLoading(false);
  }

  function startEditFile(f: any) {
    setEditFileId(f.id); setEditFJudul(f.judul);
    setEditFDesc(f.deskripsi || ''); setEditFKategori(f.kategori || 'file-basic');
    setEditFUrutan(String(f.urutan || 0));
  }

  async function saveEditFile() {
    if (!editFileId || !editFJudul) { notify('Judul wajib diisi.', 'err'); return; }
    setLoading(true);
    const { error } = await supabase.from('files').update({
      judul: editFJudul, deskripsi: editFDesc, kategori: editFKategori,
      level: editFKategori === 'file-advanced' ? 'advance' : 'basic',
      urutan: parseInt(editFUrutan) || 0,
    }).eq('id', editFileId);
    if (error) notify('Error: ' + error.message, 'err');
    else { notify('File berhasil diupdate!'); setEditFileId(null); loadData(); }
    setLoading(false);
  }

  async function uploadFile() {
    if (!fJudul || !fFile) { notify('Judul dan file wajib diisi.', 'err'); return; }
    setLoading(true);
    setUploadProgress('Mengupload file...');
    const fileName = Date.now() + '_' + fFile.name.replace(/\s/g, '_');
    const { error: storageError } = await supabase.storage
      .from('materi').upload(fileName, fFile, { cacheControl: '3600', upsert: false });
    if (storageError) { notify('Gagal upload: ' + storageError.message, 'err'); setLoading(false); setUploadProgress(''); return; }
    const { data: urlData } = supabase.storage.from('materi').getPublicUrl(fileName);
    const isAdvanceFile = fKategori === 'file-advanced';
    const { error } = await supabase.from('files').insert({
      judul: fJudul, deskripsi: fDesc, file_url: urlData.publicUrl,
      file_name: fFile.name, file_type: fFile.type,
      kategori: fKategori, tier_akses: isAdvanceFile ? ['SMC Silver'] : ['SMC Trial'],
      level: isAdvanceFile ? 'advance' : 'basic', urutan: parseInt(fUrutan) || 0,
    });
    if (error) notify('Error simpan: ' + error.message, 'err');
    else { notify('File berhasil diupload!'); setFJudul(''); setFDesc(''); setFKategori('file-basic'); setFUrutan(''); setFFile(null); if (fileUploadRef.current) fileUploadRef.current.value = ''; loadData(); }
    setUploadProgress(''); setLoading(false);
  }

  async function deleteFile(id: string, fileUrl: string) {
    if (!confirm('Hapus file ini?')) return;
    const fileName = fileUrl.split('/').pop();
    if (fileName) await supabase.storage.from('materi').remove([fileName]);
    await supabase.from('files').delete().eq('id', id);
    loadData();
  }

  

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const isSuperAdmin = currentAdmin?.role === 'superadmin';

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Navbar */}
      <div className="bg-[#0a0f1e]/90 backdrop-blur-md border-b border-yellow-500/20 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-[#0a0f1e] font-bold text-sm">MR</span>
            </div>
            <div>
              <span className="text-white font-bold">Admin Panel</span>
              <span className="text-gray-500 text-xs ml-2">@{currentAdmin?.username}</span>
              {isSuperAdmin && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">Superadmin</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="text-gray-400 hover:text-white transition-colors"><RefreshCw size={18} /></button>
            <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"><ArrowLeft size={16} /> Website</a>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 text-sm transition-colors">Keluar</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-xl border text-sm ${msgType === 'err' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {[
            { id: 'member', label: `Member (${members.length})`, icon: <Users size={16} /> },
            { id: 'video', label: `Video (${videos.length})`, icon: <Video size={16} /> },
            { id: 'advance', label: 'Request Advance', icon: <ChevronUp size={16} />, badge: pendingRequests.length },
            { id: 'settings', label: 'Password Saya', icon: <KeyRound size={16} /> },
            ...(isSuperAdmin ? [{ id: 'admins', label: `Admin (${admins.length})`, icon: <Shield size={16} /> }] : []),
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                tab === t.id
                  ? t.id === 'advance' ? 'bg-purple-600 text-white'
                  : t.id === 'admins' ? 'bg-yellow-500 text-[#0a0f1e]'
                  : t.id === 'settings' ? 'bg-gray-600 text-white'
                  : 'bg-yellow-500 text-[#0a0f1e]'
                  : 'bg-[#111827] text-gray-400 border border-gray-700 hover:text-white'
              }`}>
              {t.icon} {t.label}
              {!!t.badge && <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Tab Member */}
        {tab === 'member' && (
          <div className="space-y-8">
            <div className="bg-[#111827] border border-yellow-500/20 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-2 flex items-center gap-2"><Upload size={18} className="text-yellow-400" /> Import Member dari File</h2>
              <p className="text-gray-500 text-sm mb-4">Upload CSV atau Excel. Kolom: <span className="text-yellow-400">Nama</span> dan <span className="text-yellow-400">Tier</span>. Password digenerate otomatis.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImport}
                  className="block text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-yellow-500/20 file:text-yellow-400 file:font-semibold hover:file:bg-yellow-500/30 cursor-pointer" />
                <button onClick={exportCSV} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-xl transition-all">
                  Export CSV
                </button>
              </div>
            </div>

            <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2"><Plus size={18} /> Tambah Member Manual</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input type="text" value={mNama} onChange={e => setMNama(e.target.value)} placeholder="Nama Lengkap"
                  className="bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                <select value={mTier} onChange={e => setMTier(e.target.value)}
                  className="bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50">
                  <option value="">Pilih Tier</option>
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="relative">
                  <input type={showMPass ? 'text' : 'password'} value={mPassword} onChange={e => setMPassword(e.target.value)} placeholder="Password"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 pr-20 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button onClick={() => setShowMPass(!showMPass)} className="text-gray-500 p-1">{showMPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    <button onClick={() => setMPassword(generatePassword())} className="text-yellow-500 text-xs font-bold p-1">Auto</button>
                  </div>
                </div>
              </div>
              <button onClick={addMember} disabled={loading} className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Tambah Member'}
              </button>
            </div>

            <div className="bg-[#111827] border border-gray-700/50 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50 space-y-3">
                <h2 className="text-white font-bold text-lg">Daftar Member ({members.length})</h2>
                {/* Filter */}
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text" value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                    placeholder="🔍 Cari nama..."
                    className="bg-[#0d1325] border border-gray-700 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 w-44"
                  />
                  <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
                    className="bg-[#0d1325] border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50">
                    <option value="">Semua Tier</option>
                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)}
                    className="bg-[#0d1325] border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50">
                    <option value="">Basic & Advanced</option>
                    <option value="basic">Basic (belum advance)</option>
                    <option value="advance">Advanced</option>
                  </select>
                  {(filterSearch || filterTier || filterKelas) && (
                    <button onClick={() => { setFilterSearch(''); setFilterTier(''); setFilterKelas(''); }}
                      className="text-xs text-gray-500 hover:text-red-400 border border-gray-700 px-3 py-2 rounded-xl transition-colors">
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      {['Nama', 'Tier', 'Password', 'Advance', 'Status', 'Aksi'].map(h => (
                        <th key={h} className="text-left text-gray-400 px-6 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members
                      .filter(m => {
                        if (filterSearch && !m.nama.toLowerCase().includes(filterSearch.toLowerCase())) return false;
                        if (filterTier && m.tier !== filterTier) return false;
                        if (filterKelas === 'advance' && !m.is_advance) return false;
                        if (filterKelas === 'basic' && m.is_advance) return false;
                        return true;
                      })
                      .map(m => (
                        <>
                          <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                            <td className="text-white px-6 py-4 font-medium">{m.nama}</td>
                            <td className="px-6 py-4"><span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg">{m.tier}</span></td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-300 font-mono text-xs">{revealPass[m.id] ? m.password : '••••••••'}</span>
                                <button onClick={() => setRevealPass(p => ({ ...p, [m.id]: !p[m.id] }))} className="text-gray-600 hover:text-gray-400">
                                  {revealPass[m.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${m.is_advance ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-600'}`}>
                                {m.is_advance ? 'Ya' : 'Tidak'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button onClick={() => toggleActive(m.id, m.is_active)}
                                className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${m.is_active ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400'}`}>
                                {m.is_active ? 'Aktif' : 'Nonaktif'}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => editMemberId === m.id ? setEditMemberId(null) : startEditMember(m)}
                                  className="text-gray-500 hover:text-yellow-400 text-xs border border-gray-700 hover:border-yellow-500/40 px-2 py-1 rounded-lg transition-all">
                                  Edit
                                </button>
                                <button onClick={() => deleteMember(m.id)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                          {editMemberId === m.id && (
                            <tr key={m.id + '_edit'} className="border-b border-gray-800/50">
                              <td colSpan={6} className="px-6 py-4 bg-[#0d1325]">
                                <p className="text-yellow-400 text-xs font-semibold mb-3">✏️ Edit Member</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                                  <input type="text" value={editMNama} onChange={e => setEditMNama(e.target.value)} placeholder="Nama Lengkap"
                                    className="bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                                  <select value={editMTier} onChange={e => setEditMTier(e.target.value)}
                                    className="bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500/50">
                                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                  <div className="relative">
                                    <input type="text" value={editMPassword} onChange={e => setEditMPassword(e.target.value)} placeholder="Password"
                                      className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 pr-16 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 font-mono" />
                                    <button onClick={() => setEditMPassword(generatePassword())}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-500 text-xs font-bold px-1">Auto</button>
                                  </div>
                                  <select value={editMAdvance ? 'ya' : 'tidak'} onChange={e => setEditMAdvance(e.target.value === 'ya')}
                                    className="bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500/50">
                                    <option value="tidak">Basic (belum advance)</option>
                                    <option value="ya">Advanced</option>
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={saveEditMember} disabled={loading}
                                    className="bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-bold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50">
                                    Simpan
                                  </button>
                                  <button onClick={() => setEditMemberId(null)} className="text-gray-500 hover:text-gray-300 px-4 py-2 rounded-xl text-sm">Batal</button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                  </tbody>
                </table>
                {!members.filter(m => {
                  if (filterSearch && !m.nama.toLowerCase().includes(filterSearch.toLowerCase())) return false;
                  if (filterTier && m.tier !== filterTier) return false;
                  if (filterKelas === 'advance' && !m.is_advance) return false;
                  if (filterKelas === 'basic' && m.is_advance) return false;
                  return true;
                }).length && <p className="text-gray-600 text-center py-8">Tidak ada member yang sesuai filter.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tab Video */}
        {tab === 'video' && (
          <div className="space-y-8">
            {/* Tambah Video */}
            <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2"><Plus size={18} /> Tambah Video</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-3">Kategori Video:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'intro', label: '🎬 Intro', desc: 'Semua tier' },
                      { id: 'basic', label: '📚 Basic', desc: 'Semua tier' },
                      { id: 'tips-basic', label: '💡 Tips Basic', desc: 'Semua tier' },
                      { id: 'advanced', label: '🚀 Advanced', desc: 'Approved + min Bronze' },
                      { id: 'tips-advanced', label: '💡 Tips Advanced', desc: 'Approved + min Bronze' },
                    ].map(k => (
                      <button key={k.id} onClick={() => { setVKategori(k.id); setVLevel(k.id.includes('advanced') ? 'advance' : 'basic'); }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all text-left ${vKategori === k.id ? k.id.includes('advanced') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-[#0d1325] text-gray-500 border border-gray-700'}`}>
                        <div>{k.label}</div>
                        <div className="text-gray-600 text-xs font-normal mt-0.5">{k.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <input type="text" value={vJudul} onChange={e => setVJudul(e.target.value)} placeholder="Judul Video"
                  className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                <textarea value={vDesc} onChange={e => setVDesc(e.target.value)} placeholder="Deskripsi (opsional)" rows={2}
                  className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 resize-none" />
                <input type="text" value={vUrl} onChange={e => setVUrl(e.target.value)} placeholder="URL YouTube (youtu.be/... atau youtube.com/watch?v=...)"
                  className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                <input type="number" value={vUrutan} onChange={e => setVUrutan(e.target.value)} placeholder="Urutan tampil (angka)"
                  className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                {/* Coming Soon Image */}
                <div className="bg-[#0d1325] border border-dashed border-orange-500/40 rounded-xl p-4">
                  <p className="text-orange-400 text-xs font-semibold mb-1">🕐 Gambar Coming Soon (opsional)</p>
                  <p className="text-gray-600 text-xs mb-3">Kosongkan URL YouTube di atas + upload gambar ini → video tampil sebagai "Coming Soon" di member area.</p>
                  <input ref={csUploadRef} type="file" accept="image/*" onChange={e => setCsFile(e.target.files?.[0] || null)}
                    className="block text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-orange-500/20 file:text-orange-400 file:font-semibold hover:file:bg-orange-500/30 cursor-pointer" />
                  {csFile && <p className="text-orange-400 text-xs mt-2">📎 {csFile.name}</p>}
                </div>
              </div>
              <button onClick={addVideo} disabled={loading} className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Tambah Video'}
              </button>
            </div>

            {/* Tambah File */}
            <div className="bg-[#111827] border border-blue-500/20 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-2 flex items-center gap-2"><Upload size={18} className="text-blue-400" /> Upload File Materi</h2>
              <p className="text-gray-500 text-sm mb-5">PDF, Word, Excel, PPT, atau file aplikasi (.exe, .zip, .apk, dll)</p>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-3">Kategori File:</p>
                  <div className="flex gap-3">
                    <button onClick={() => setFKategori('file-basic')}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${fKategori === 'file-basic' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-[#0d1325] text-gray-500 border border-gray-700'}`}>
                      📁 File Basic
                    </button>
                    <button onClick={() => setFKategori('file-advanced')}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${fKategori === 'file-advanced' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'bg-[#0d1325] text-gray-500 border border-gray-700'}`}>
                      📁 File Advanced
                    </button>
                  </div>
                </div>
                <input type="text" value={fJudul} onChange={e => setFJudul(e.target.value)} placeholder="Judul File"
                  className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Deskripsi (opsional)" rows={2}
                  className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none" />
                <input type="number" value={fUrutan} onChange={e => setFUrutan(e.target.value)} placeholder="Urutan tampil (angka)"
                  className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                <div>
                  <p className="text-gray-400 text-sm mb-2">Pilih File:</p>
                  <input ref={fileUploadRef} type="file" onChange={e => setFFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.exe,.apk,.dmg,.rar"
                    className="block text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-500/20 file:text-blue-400 file:font-semibold hover:file:bg-blue-500/30 cursor-pointer" />
                  {fFile && <p className="text-gray-500 text-xs mt-2">📎 {fFile.name} ({(fFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
                </div>
                {uploadProgress && <p className="text-blue-400 text-sm">{uploadProgress}</p>}
              </div>
              <button onClick={uploadFile} disabled={loading}
                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
                {loading ? 'Mengupload...' : 'Upload File'}
              </button>
            </div>

            {/* Daftar Video — dikelompokkan per kategori */}
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg">Daftar Video ({videos.length})</h2>
              {[
                { id: 'intro', label: '🎬 Intro', color: 'border-teal-500/30', badgeClass: 'bg-teal-500/20 text-teal-400' },
                { id: 'basic', label: '📚 Basic', color: 'border-yellow-500/30', badgeClass: 'bg-yellow-500/20 text-yellow-400' },
                { id: 'tips-basic', label: '💡 Tips Basic', color: 'border-blue-500/30', badgeClass: 'bg-blue-500/20 text-blue-400' },
                { id: 'advanced', label: '🚀 Advanced', color: 'border-purple-500/30', badgeClass: 'bg-purple-500/20 text-purple-400' },
                { id: 'tips-advanced', label: '💡 Tips Advanced', color: 'border-pink-500/30', badgeClass: 'bg-pink-500/20 text-pink-400' },
              ].map(kat => {
                const group = videos.filter(v => (v as any).kategori === kat.id).sort((a, b) => a.urutan - b.urutan);
                return (
                  <div key={kat.id} className={`bg-[#111827] border ${kat.color} rounded-2xl overflow-hidden`}>
                    <div className="px-6 py-3 border-b border-gray-700/50 flex items-center justify-between">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <span>{kat.label}</span>
                        <span className="text-gray-500 text-xs font-normal">({group.length} video)</span>
                      </h3>
                      <span className="text-gray-600 text-xs">Gunakan ↑↓ untuk ubah urutan</span>
                    </div>
                    {!group.length && (
                      <p className="text-gray-700 text-center py-6 text-sm">Belum ada video di kategori ini.</p>
                    )}
                    <div className="divide-y divide-gray-800/50">
                      {group.map((v, idx) => (
                        <div key={v.id}>
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/20">
                            {/* Tombol urutan */}
                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                              <button
                                onClick={() => moveVideo(kat.id, idx, 'up')}
                                disabled={idx === 0}
                                className="text-gray-600 hover:text-yellow-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              ><ChevronUp size={16} /></button>
                              <button
                                onClick={() => moveVideo(kat.id, idx, 'down')}
                                disabled={idx === group.length - 1}
                                className="text-gray-600 hover:text-yellow-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              ><ChevronDown size={16} /></button>
                            </div>
                            {/* Nomor urut */}
                            <span className="text-gray-700 text-xs w-5 text-center flex-shrink-0 font-mono">{idx + 1}</span>
                            {/* Info video */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{v.judul}</p>
                              <p className="text-gray-600 text-xs truncate">{v.youtube_url}</p>
                            </div>
                            {/* Aksi */}
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => editVideoId === v.id ? setEditVideoId(null) : startEditVideo(v)}
                                className="text-gray-500 hover:text-yellow-400 text-xs border border-gray-700 hover:border-yellow-500/40 px-2 py-1 rounded-lg transition-all">
                                Edit
                              </button>
                              <button onClick={() => deleteVideo(v.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                          {/* Form Edit */}
                          {editVideoId === v.id && (
                            <div className="px-6 pb-5 bg-[#0d1325] border-t border-gray-700/50">
                              <p className="text-yellow-400 text-xs font-semibold py-3">✏️ Edit Video</p>
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                  {[{id:'intro',label:'🎬 Intro'},{id:'basic',label:'📚 Basic'},{id:'tips-basic',label:'💡 Tips Basic'},{id:'advanced',label:'🚀 Advanced'},{id:'tips-advanced',label:'💡 Tips Advanced'}].map(k => (
                                    <button key={k.id} onClick={() => setEditVKategori(k.id)}
                                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${editVKategori === k.id ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-[#111827] text-gray-500 border border-gray-700'}`}>
                                      {k.label}
                                    </button>
                                  ))}
                                </div>
                                <input type="text" value={editVJudul} onChange={e => setEditVJudul(e.target.value)} placeholder="Judul"
                                  className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                                <textarea value={editVDesc} onChange={e => setEditVDesc(e.target.value)} placeholder="Deskripsi (opsional)" rows={2}
                                  className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 resize-none" />
                                <input type="text" value={editVUrl} onChange={e => setEditVUrl(e.target.value)} placeholder="URL YouTube"
                                  className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                                <input type="number" value={editVUrutan} onChange={e => setEditVUrutan(e.target.value)} placeholder="Urutan (angka)"
                                  className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                                {/* Coming Soon Image di Edit */}
                                <div className="bg-[#0a0f1e] border border-dashed border-orange-500/30 rounded-xl p-3">
                                  <p className="text-orange-400 text-xs font-semibold mb-2">🕐 Gambar Coming Soon</p>
                                  {editCsExisting && (
                                    <div className="flex items-center gap-3 mb-2">
                                      <img src={editCsExisting} alt="cs" className="w-20 h-12 object-cover rounded-lg" />
                                      <div>
                                        <p className="text-gray-400 text-xs">Gambar aktif</p>
                                        <button onClick={() => setEditCsExisting('')} className="text-red-400 text-xs hover:text-red-300">Hapus gambar ini</button>
                                      </div>
                                    </div>
                                  )}
                                  <input ref={editCsUploadRef} type="file" accept="image/*" onChange={e => setEditCsFile(e.target.files?.[0] || null)}
                                    className="block text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-orange-500/20 file:text-orange-400 file:font-semibold hover:file:bg-orange-500/30 cursor-pointer" />
                                  {editCsFile && <p className="text-orange-400 text-xs mt-1">📎 {editCsFile.name}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={saveEditVideo} disabled={loading} className="bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-bold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50">Simpan</button>
                                  <button onClick={() => setEditVideoId(null)} className="text-gray-500 hover:text-gray-300 px-4 py-2 rounded-xl text-sm">Batal</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Daftar File */}
            <div className="bg-[#111827] border border-gray-700/50 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50"><h2 className="text-white font-bold text-lg">Daftar File ({fileItems.length})</h2></div>
              <div className="divide-y divide-gray-800/50">
                {fileItems.map(f => (
                  <div key={f.id}>
                    <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-800/20">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{f.judul}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${f.kategori === 'file-advanced' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {f.kategori === 'file-advanced' ? 'File Advanced' : 'File Basic'}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs">{f.file_name}</p>
                      </div>
                      <div className="flex gap-2 ml-4 flex-shrink-0">
                        <button onClick={() => editFileId === f.id ? setEditFileId(null) : startEditFile(f)}
                          className="text-gray-500 hover:text-blue-400 text-xs border border-gray-700 hover:border-blue-500/40 px-2 py-1 rounded-lg transition-all">
                          Edit
                        </button>
                        <button onClick={() => deleteFile(f.id, f.file_url)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {editFileId === f.id && (
                      <div className="px-6 pb-5 bg-[#0d1325] border-t border-gray-700/50">
                        <p className="text-blue-400 text-xs font-semibold py-3">✏️ Edit File</p>
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <button onClick={() => setEditFKategori('file-basic')} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${editFKategori === 'file-basic' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : 'bg-[#111827] text-gray-500 border border-gray-700'}`}>📁 File Basic</button>
                            <button onClick={() => setEditFKategori('file-advanced')} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${editFKategori === 'file-advanced' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'bg-[#111827] text-gray-500 border border-gray-700'}`}>📁 File Advanced</button>
                          </div>
                          <input type="text" value={editFJudul} onChange={e => setEditFJudul(e.target.value)} placeholder="Judul"
                            className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                          <textarea value={editFDesc} onChange={e => setEditFDesc(e.target.value)} placeholder="Deskripsi (opsional)" rows={2}
                            className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none" />
                          <input type="number" value={editFUrutan} onChange={e => setEditFUrutan(e.target.value)} placeholder="Urutan"
                            className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                          <div className="flex gap-2">
                            <button onClick={saveEditFile} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50">Simpan</button>
                            <button onClick={() => setEditFileId(null)} className="text-gray-500 hover:text-gray-300 px-4 py-2 rounded-xl text-sm">Batal</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {!fileItems.length && <p className="text-gray-600 text-center py-8">Belum ada file.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tab Request Advance */}
        {tab === 'advance' && (
          <div className="space-y-6">
            <div className="bg-[#111827] border border-purple-500/20 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50">
                <h2 className="text-white font-bold text-lg flex items-center gap-2"><ChevronUp size={18} className="text-purple-400" /> Request Menunggu ({pendingRequests.length})</h2>
              </div>
              <div className="divide-y divide-gray-800/50">
                {pendingRequests.map(req => (
                  <div key={req.id} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-white font-semibold text-lg">{req.member_nama}</p>
                        <p className="text-yellow-400 text-sm">{req.member_tier}</p>
                        <p className="text-gray-500 text-xs mt-1">{new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approveRequest(req)} className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-semibold px-4 py-2 rounded-xl text-sm">
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button onClick={() => setTolakId(req.id)} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-semibold px-4 py-2 rounded-xl text-sm">
                          <XCircle size={16} /> Tolak
                        </button>
                      </div>
                    </div>
                    {tolakId === req.id && (
                      <div className="mt-4 bg-[#0d1325] border border-red-500/20 rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-2">Alasan penolakan:</p>
                        <textarea value={alasanTolak} onChange={e => setAlasanTolak(e.target.value)} rows={3} placeholder="Contoh: Jurnal belum lengkap 3 bulan..."
                          className="w-full bg-[#111827] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 resize-none text-sm mb-3" />
                        <div className="flex gap-2">
                          <button onClick={() => tolakRequest(req)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-semibold px-4 py-2 rounded-xl text-sm">Konfirmasi Tolak</button>
                          <button onClick={() => { setTolakId(null); setAlasanTolak(''); }} className="text-gray-500 hover:text-gray-300 px-4 py-2 rounded-xl text-sm">Batal</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {!pendingRequests.length && <p className="text-gray-600 text-center py-8">Tidak ada request yang menunggu.</p>}
              </div>
            </div>

            <div className="bg-[#111827] border border-gray-700/50 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50"><h2 className="text-white font-bold text-lg">Riwayat Request</h2></div>
              <div className="divide-y divide-gray-800/50">
                {requests.filter(r => r.status !== 'pending').map(req => (
                  <div key={req.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-white font-medium">{req.member_nama}</p>
                      <p className="text-gray-500 text-xs">{req.member_tier} · {new Date(req.created_at).toLocaleDateString('id-ID')}</p>
                      {req.alasan_tolak && <p className="text-red-400 text-xs mt-1">Alasan: {req.alasan_tolak}</p>}
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 ${req.status === 'disetujui' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {req.status === 'disetujui' ? '✅ Disetujui' : '❌ Ditolak'}
                    </span>
                  </div>
                ))}
                {!requests.filter(r => r.status !== 'pending').length && <p className="text-gray-600 text-center py-8">Belum ada riwayat.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tab Kelola Admin (Superadmin only) */}
        {tab === 'admins' && isSuperAdmin && (
          <div className="space-y-8">
            <div className="bg-[#111827] border border-yellow-500/20 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2"><Plus size={18} /> Tambah Admin</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" value={aUsername} onChange={e => setAUsername(e.target.value)} placeholder="Username"
                  className="bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                <div className="relative">
                  <input type={showAPass ? 'text' : 'password'} value={aPassword} onChange={e => setAPassword(e.target.value)} placeholder="Password"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 pr-20 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button onClick={() => setShowAPass(!showAPass)} className="text-gray-500 p-1">{showAPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    <button onClick={() => setAPassword(generatePassword())} className="text-yellow-500 text-xs font-bold p-1">Auto</button>
                  </div>
                </div>
              </div>
              <button onClick={addAdmin} disabled={loading} className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Tambah Admin'}
              </button>
            </div>

            <div className="bg-[#111827] border border-gray-700/50 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50"><h2 className="text-white font-bold text-lg">Daftar Admin</h2></div>
              <div className="divide-y divide-gray-800/50">
                {admins.map(a => (
                  <div key={a.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <span className="text-[#0a0f1e] font-bold text-sm">{a.username[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">@{a.username}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.role === 'superadmin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
                          {a.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                        </span>
                      </div>
                    </div>
                    {a.role !== 'superadmin' && (
                      <button onClick={() => deleteAdmin(a.id)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Settings - Ganti Password */}
        {tab === 'settings' && (
          <div className="max-w-md">
            <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-8">
              <h2 className="text-white font-bold text-xl mb-2 flex items-center gap-2"><KeyRound size={20} className="text-yellow-400" /> Ganti Password Admin</h2>
              <p className="text-gray-500 text-sm mb-6">Password baru tersimpan permanen di database.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Password Lama</label>
                  <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Masukkan password lama"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Password Baru</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Minimal 6 karakter"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Konfirmasi Password Baru</label>
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Ulangi password baru"
                    className="w-full bg-[#0d1325] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50" />
                </div>
                {passErr && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{passErr}</p></div>}
                {passMsg && <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3"><p className="text-green-400 text-sm">{passMsg}</p></div>}
                <button onClick={handleGantiPassword}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-[#0a0f1e] font-bold py-3.5 rounded-xl transition-all">
                  Simpan Password Baru
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}