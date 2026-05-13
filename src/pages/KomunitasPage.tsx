// src/pages/KomunitasPage.tsx
import React from 'react';

const C = {
  bg: '#080808', border: '#1a1a1a', border2: '#222',
  gold: '#eab308', text: '#e7e5e4', dim: '#666', muted: '#888',
  up: '#22ab94', mono: '"Geist Mono",monospace', sans: '"Geist",system-ui,sans-serif',
};

const SOCIALS = [
  {
    id: 'discord',
    name: 'Discord',
    handle: 'Menolak Rugi Community',
    desc: 'Server utama komunitas. Diskusi market, tanya jawab dengan mentor, share setup, dan notifikasi jadwal live trading.',
    href: 'https://discord.gg/d2Tpf6sGMr',
    label: 'GABUNG SERVER',
    color: '#5865F2',
    bg: '#0a0d1a',
    border: '#1a2050',
    members: '200+ Member',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#5865F2">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.004.028.017.057.04.074a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.995a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
      </svg>
    ),
  },
  {
    id: 'telegram',
    name: 'Telegram',
    handle: '@menolakrugi',
    desc: 'Channel Telegram untuk update cepat, pengumuman, dan info jadwal live. Wajib join untuk tidak ketinggalan info.',
    href: 'https://t.me/+_azyX2h9oFhmNjNl',
    label: 'JOIN CHANNEL',
    color: '#229ED9',
    bg: '#040e18',
    border: '#0a2a3a',
    members: 'Channel Update',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#229ED9">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@menolakrugi',
    desc: 'Konten edukasi trading SMC, analisa market harian, tips psikologi trading, dan behind the scenes mentor.',
    href: 'https://www.tiktok.com/@menolakrugi',
    label: 'FOLLOW TIKTOK',
    color: '#ff0050',
    bg: '#1a0008',
    border: '#3a0015',
    members: 'Edukasi Trading',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#ff0050">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z"/>
      </svg>
    ),
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@menolakrugi',
    desc: 'Live trading session, replay analisa, video tutorial lengkap SMC, dan dokumentasi perjalanan funded trader.',
    href: 'https://youtube.com/@menolakrugi',
    label: 'SUBSCRIBE',
    color: '#FF0000',
    bg: '#1a0000',
    border: '#3a0000',
    members: 'Live & Tutorial',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Admin',
    handle: '+62 812-4222-4939',
    desc: 'Hubungi admin langsung untuk pertanyaan membership, kendala akses, atau informasi kelas. Respon cepat.',
    href: 'https://wa.me/6281242224939',
    label: 'CHAT ADMIN',
    color: '#25D366',
    bg: '#041208',
    border: '#0a2a14',
    members: 'Respon 08.00–22.00 WIB',
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
  },
];

const NAV = [
  { l: 'KELAS',       href: '/#kelas' },
  { l: 'KURIKULUM',   href: '/#kurikulum' },
  { l: 'KOMUNITAS',   href: '/komunitas', active: true },
  { l: 'PARTNERSHIP', href: '/partnership' },
  { l: 'KALENDER',    href: '/calendar' },
];

export default function KomunitasPage() {
  return (
    <div style={{ fontFamily: C.sans, background: C.bg, minHeight: '100vh', color: C.text }}>

      {/* Navbar */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, background: '#060606', position: 'sticky' as const, top: 0, zIndex: 50 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: C.gold, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#000' }}>MR</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>MENOLAK RUGI</div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.dim, letterSpacing: 1 }}>SMC EDUCATION</div>
          </div>
        </a>
        <div style={{ display: 'flex', gap: 4 }}>
          {NAV.map((item: any) => (
            <a key={item.l} href={item.href}
              style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, padding: '6px 14px', textDecoration: 'none',
                color: item.active ? C.gold : C.muted,
                background: item.active ? '#1a1500' : 'transparent',
                border: item.active ? `1px solid #3a2e00` : '1px solid transparent',
                borderRadius: 6, transition: 'all 0.15s' }}>
              {item.l}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.location.href = '/login'}
            style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, padding: '8px 16px', border: `1px solid ${C.border2}`, background: 'transparent', cursor: 'pointer', borderRadius: 6 }}>
            LOG IN
          </button>
          <button onClick={() => window.location.href = '/signup'}
            style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#000', background: C.gold, padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
            BUKA AKUN ›
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '64px 40px 48px', textAlign: 'center' as const, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.06) 0%, transparent 60%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: C.mono, color: C.gold, fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>// KOMUNITAS MENOLAK RUGI</div>
          <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1.5, margin: '0 0 16px', lineHeight: 1.1 }}>
            Bergabung dengan<br/><span style={{ color: C.gold }}>komunitas trader SMC</span>
          </h1>
          <p style={{ color: C.dim, fontSize: 16, maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
            Ikuti semua platform kami untuk update market, edukasi trading, jadwal live, dan diskusi bersama ribuan trader.
          </p>
        </div>
      </div>

      {/* Social Media Cards */}
      <div style={{ padding: '0 40px 80px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {SOCIALS.map(s => (
            <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', gap: 20, padding: '24px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color + '66'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = s.border; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <div style={{ flexShrink: 0, width: 56, height: 56, background: `${s.color}18`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{s.name}</span>
                  <span style={{ fontFamily: C.mono, fontSize: 10, color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}44`, padding: '2px 8px', borderRadius: 4 }}>{s.members}</span>
                </div>
                <div style={{ fontFamily: C.mono, fontSize: 11, color: s.color, marginBottom: 8 }}>{s.handle}</div>
                <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.55, marginBottom: 14 }}>{s.desc}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: s.color, border: `1px solid ${s.color}55`, padding: '6px 14px', borderRadius: 6 }}>
                  {s.label} ▸
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 48, textAlign: 'center' as const, padding: '36px', background: '#0d0c00', border: `1px solid #2a2200`, borderRadius: 14 }}>
          <div style={{ fontFamily: C.mono, color: C.gold, fontSize: 10, letterSpacing: 1.5, marginBottom: 12 }}>// BELUM PUNYA AKUN?</div>
          <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 12px', letterSpacing: -0.5 }}>Mulai perjalanan trading kamu</h2>
          <p style={{ color: C.dim, fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>Bergabung dengan 200+ member aktif yang sedang belajar SMC dan konsisten menuju funded account.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => window.location.href = '/signup?tier=trial'}
              style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: '#000', background: C.gold, padding: '12px 24px', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
              COBA TRIAL · Rp 99K ▸
            </button>
            <button onClick={() => window.location.href = '/#kelas'}
              style={{ fontFamily: C.mono, fontSize: 12, color: C.text, background: 'transparent', padding: '12px 24px', border: `1px solid ${C.border2}`, cursor: 'pointer', borderRadius: 8 }}>
              LIHAT SEMUA KELAS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
