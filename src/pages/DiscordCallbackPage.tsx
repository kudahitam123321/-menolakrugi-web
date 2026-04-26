import { useEffect, useState } from 'react';

const BOT_SERVER = 'https://menolakrugi-bot-production.up.railway.app';

export default function DiscordCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const raw = localStorage.getItem('mr_session');

      if (!code || !raw) {
        setStatus('error');
        setMessage('Data tidak lengkap. Coba lagi dari dashboard.');
        return;
      }

      const session = JSON.parse(raw);

      try {
        const res = await fetch(
          `${BOT_SERVER}/discord/callback?code=${code}&member_id=${session.member_id}`
        );
        const data = await res.json();

        if (data.success) {
          setStatus('success');
          setUsername(data.discord_username);
          setMessage(`Role Discord berhasil diset sesuai tier ${data.tier}!`);
          setTimeout(() => { window.location.href = '/member'; }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Gagal menghubungkan Discord. Coba lagi.');
        }
      } catch {
        setStatus('error');
        setMessage('Tidak bisa terhubung ke server bot. Coba lagi nanti.');
      }
    }

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="bg-[#111827] border border-gray-700/50 rounded-2xl p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-white font-bold text-xl mb-2">Menghubungkan Discord...</h2>
            <p className="text-gray-400 text-sm">Sedang memverifikasi dan mengatur role kamu</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-white font-bold text-xl mb-2">Discord Terhubung!</h2>
            <p className="text-green-400 font-semibold mb-2">@{username}</p>
            <p className="text-gray-400 text-sm mb-4">{message}</p>
            <p className="text-gray-500 text-xs">Kembali ke dashboard dalam 3 detik...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-white font-bold text-xl mb-2">Gagal Terhubung</h2>
            <p className="text-red-400 text-sm mb-6">{message}</p>
            <a href="/member" className="bg-yellow-500 hover:bg-yellow-400 text-[#0a0f1e] font-bold px-6 py-3 rounded-xl transition-all">
              Kembali ke Dashboard
            </a>
          </>
        )}
      </div>
    </div>
  );
}
