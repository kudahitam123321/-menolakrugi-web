import { ExternalLink } from 'lucide-react';

const links = [
  {
    name: 'Discord',
    desc: 'Diskusi & sharing harian',
    href: 'https://discord.gg/PHeDKQhEGe',
    color: 'hover:border-[#5865F2]/50 hover:bg-[#5865F2]/5',
    labelColor: 'text-[#5865F2]',
  },
  {
    name: 'TikTok',
    desc: 'Konten trading gratis',
    href: 'https://www.tiktok.com/@menolakrugi',
    color: 'hover:border-gray-400/50 hover:bg-gray-400/5',
    labelColor: 'text-gray-300',
  },
  {
    name: 'Telegram Komunitas',
    desc: 'Update market & sinyal',
    href: 'https://t.me/+_azyX2h9oFhmNjNl',
    color: 'hover:border-sky-500/50 hover:bg-sky-500/5',
    labelColor: 'text-sky-400',
  },
];

export default function Social() {
  return (
    <section id="komunitas" className="bg-[#0a0f1e] py-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-yellow-500 text-sm font-semibold uppercase tracking-widest">Komunitas</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">Gabung Komunitas Kami</h2>
          <p className="text-gray-400">Terhubung dengan ratusan trader aktif, dapatkan update market, dan berkembang bersama.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {links.map((l) => (
            <a
              key={l.name}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group bg-[#111827] border border-gray-700/50 rounded-xl p-6 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 ${l.color}`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold text-lg ${l.labelColor}`}>{l.name}</span>
                <ExternalLink size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
              <p className="text-gray-500 text-sm">{l.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
